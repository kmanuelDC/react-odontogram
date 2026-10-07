import {
	type OdontogramFinding,
	addSurfaceFinding,
	removeSurfaceFinding,
} from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: tests/surface-menu.test.ts. The `surface-menu`
// slot maps to `renderSurfaceMenu`, `update:surfaces` to `onSurfacesChange`
// and `surface-click` to `onSurfaceClick` (with idFormat="fdi").
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import type { OdontogramProps, SurfaceMenuRenderProps } from "../src/type";

const surfaceOf = (container: HTMLElement, toothId: string, name: string) => {
	const surface = container.querySelector<SVGPathElement>(
		`[data-surface-tooth="${toothId}"][data-surface="${name}"]`,
	);
	if (!surface) {
		throw new Error(`Surface ${toothId}/${name} is not drawn`);
	}
	return surface;
};
const menuPanel = (container: HTMLElement) =>
	container.querySelector(".odontogram-surface-menu");
const element = (container: HTMLElement, selector: string) => {
	const found = container.querySelector<HTMLElement>(selector);
	if (!found) {
		throw new Error(`${selector} is not rendered`);
	}
	return found;
};

/**
 * A chart whose surface menu lists the findings of the surface and records a
 * caries, like an app would.
 */
function renderWithMenu(
	initial: OdontogramFinding[] = [],
	props: OdontogramProps = {},
) {
	const latest: { findings: OdontogramFinding[] } = { findings: initial };

	function Menu({
		toothId,
		surface,
		surfaceName,
		record,
		close,
		onChange,
		findings,
	}: SurfaceMenuRenderProps & {
		findings: OdontogramFinding[];
		onChange: (next: OdontogramFinding[]) => void;
	}) {
		return (
			<div className="menu">
				<p className="title">{`${toothId} ${surfaceName}`}</p>
				{record.surfaces[surface].map((entry) => (
					<button
						key={entry.index}
						type="button"
						className="remove"
						onClick={() =>
							onChange(
								removeSurfaceFinding(findings, {
									index: entry.index,
									toothId,
									surface,
								}),
							)
						}
					>
						{entry.definition?.name ?? entry.finding.code}
					</button>
				))}
				<button
					type="button"
					className="add"
					onClick={() =>
						onChange(
							addSurfaceFinding(findings, {
								code: "caries",
								toothId,
								surfaces: [surface],
							}),
						)
					}
				>
					Add caries
				</button>
				<button type="button" className="close" onClick={close}>
					Close
				</button>
			</div>
		);
	}

	function Host() {
		const [findings, setFindings] = useState(initial);
		latest.findings = findings;
		return (
			<Odontogram
				idFormat="fdi"
				showSurfaces={true}
				findings={findings}
				renderSurfaceMenu={(menu) => (
					<Menu {...menu} findings={findings} onChange={setFindings} />
				)}
				{...props}
			/>
		);
	}

	return { ...render(<Host />), latest };
}

describe("renderSurfaceMenu", () => {
	it("opens next to the clicked surface instead of toggling its selection", () => {
		const onSurfacesChange = vi.fn();
		const onSurfaceClick = vi.fn();
		const { container } = renderWithMenu(
			[{ code: "restoration", teeth: ["36"], surfaces: ["occlusal"] }],
			{ onSurfacesChange, onSurfaceClick },
		);

		fireEvent.click(surfaceOf(container, "36", "occlusal"));

		const menu = menuPanel(container);
		expect(menu).toHaveAttribute("role", "dialog");
		expect(menu).toHaveAttribute(
			"aria-label",
			"Surface findings: Tooth 36, Occlusal",
		);
		expect(element(container, ".menu .title").textContent).toBe("36 Occlusal");
		expect(
			[...container.querySelectorAll(".menu .remove")].map(
				(button) => button.textContent,
			),
		).toEqual(["Restauración definitiva"]);

		expect(onSurfacesChange).not.toHaveBeenCalled();
		expect(onSurfaceClick.mock.calls[0].slice(1)).toEqual(["occlusal", {}]);
	});

	it("marks surfaces as menu buttons", () => {
		const { container } = renderWithMenu();
		const occlusal = surfaceOf(container, "16", "occlusal");

		expect(occlusal).toHaveAttribute("role", "button");
		expect(occlusal).toHaveAttribute("aria-haspopup", "dialog");
		expect(occlusal).not.toHaveAttribute("aria-checked");
		expect(occlusal).toHaveAttribute("aria-expanded", "false");

		fireEvent.click(occlusal);
		expect(surfaceOf(container, "16", "occlusal")).toHaveAttribute(
			"aria-expanded",
			"true",
		);
	});

	it("shows the updated record while the app edits the findings", () => {
		const { container, latest } = renderWithMenu();

		fireEvent.click(surfaceOf(container, "16", "distal"));
		fireEvent.click(element(container, ".menu .add"));

		expect(latest.findings).toEqual([
			{ code: "caries", teeth: ["16"], surfaces: ["distal"] },
		]);
		expect(
			[...container.querySelectorAll(".menu .remove")].map(
				(button) => button.textContent,
			),
		).toEqual(["Lesión de caries dental"]);
		expect(
			container.querySelectorAll(
				".odontogram__findings .odontogram-finding__area",
			),
		).toHaveLength(1);

		fireEvent.click(element(container, ".menu .remove"));
		expect(latest.findings).toEqual([]);
		expect(container.querySelector(".menu .remove")).toBeNull();
	});

	it("closes with close(), Escape or a click outside, and returns the focus", () => {
		const { container } = renderWithMenu();

		fireEvent.click(surfaceOf(container, "26", "mesial"));
		fireEvent.click(element(container, ".menu .close"));
		expect(menuPanel(container)).toBeNull();
		expect(document.activeElement?.getAttribute("data-surface")).toBe("mesial");

		fireEvent.click(surfaceOf(container, "26", "mesial"));
		fireEvent.keyDown(document, { key: "Escape" });
		expect(menuPanel(container)).toBeNull();

		fireEvent.click(surfaceOf(container, "26", "mesial"));
		fireEvent.pointerDown(document.body);
		expect(menuPanel(container)).toBeNull();
	});

	it("stays open when clicking inside it", () => {
		const { container } = renderWithMenu();

		fireEvent.click(surfaceOf(container, "26", "mesial"));
		fireEvent.pointerDown(element(container, ".menu"));
		expect(menuPanel(container)).not.toBeNull();
	});

	it("opens with Enter and Space from the keyboard", () => {
		const { container } = renderWithMenu();

		fireEvent.keyDown(surfaceOf(container, "11", "lingual"), { key: "Enter" });
		expect(element(container, ".menu .title").textContent).toBe("11 Palatal");

		fireEvent.click(element(container, ".menu .close"));
		fireEvent.keyDown(surfaceOf(container, "11", "vestibular"), { key: " " });
		expect(element(container, ".menu .title").textContent).toBe(
			"11 Vestibular",
		);
	});

	it("does not open on disabled charts or missing teeth, and hides the tooltip while open", () => {
		const { container, unmount } = renderWithMenu([], {
			toothStates: { 18: "extracted" },
		});

		fireEvent.click(surfaceOf(container, "18", "occlusal"));
		expect(menuPanel(container)).toBeNull();

		fireEvent.mouseEnter(surfaceOf(container, "17", "occlusal"));
		expect(screen.queryByRole("tooltip")).not.toBeNull();
		fireEvent.click(surfaceOf(container, "17", "occlusal"));
		expect(screen.queryByRole("tooltip")).toBeNull();
		unmount();

		const disabled = renderWithMenu([], { disabled: true });
		fireEvent.click(surfaceOf(disabled.container, "17", "occlusal"));
		expect(menuPanel(disabled.container)).toBeNull();
	});

	it("keeps toggling the selection without renderSurfaceMenu", () => {
		const onSurfacesChange = vi.fn();
		const { container } = render(
			<Odontogram
				idFormat="fdi"
				showSurfaces={true}
				onSurfacesChange={onSurfacesChange}
			/>,
		);

		fireEvent.click(surfaceOf(container, "16", "occlusal"));
		expect(onSurfacesChange.mock.calls).toEqual([[{ 16: ["occlusal"] }]]);
		expect(menuPanel(container)).toBeNull();
		expect(surfaceOf(container, "16", "occlusal")).toHaveAttribute(
			"role",
			"checkbox",
		);
	});
});

describe("renderSurfaceMenu (React)", () => {
	it("focuses the first control of the menu", () => {
		const { container } = renderWithMenu();

		fireEvent.click(surfaceOf(container, "16", "occlusal"));
		expect(document.activeElement).toBe(element(container, ".menu .add"));
	});

	it("closes when its tooth is no longer drawn", () => {
		function Host() {
			const [half, setHalf] = useState<"full" | "lower">("full");
			return (
				<>
					<button
						type="button"
						className="hide"
						onClick={() => setHalf("lower")}
					>
						Lower
					</button>
					<Odontogram
						idFormat="fdi"
						showSurfaces={true}
						showHalf={half}
						renderSurfaceMenu={() => <p className="menu">Menu</p>}
					/>
				</>
			);
		}
		const { container } = render(<Host />);

		fireEvent.click(surfaceOf(container, "16", "occlusal"));
		expect(menuPanel(container)).not.toBeNull();
		act(() => element(container, ".hide").click());
		expect(menuPanel(container)).toBeNull();
	});

	it("passes the tooth definition and its record", () => {
		const renderSurfaceMenu = vi.fn(() => null);
		const { container } = render(
			<Odontogram
				showSurfaces={true}
				findings={[{ code: "crown", teeth: ["teeth-21"] }]}
				renderSurfaceMenu={renderSurfaceMenu}
			/>,
		);

		fireEvent.click(surfaceOf(container, "21", "mesial"));
		const [props] = renderSurfaceMenu.mock.calls.at(-1) as unknown as [
			SurfaceMenuRenderProps,
		];
		expect(props.toothId).toBe("21");
		expect(props.tooth.id).toBe("21");
		expect(props.surfaceName).toBe("Mesial");
		expect(props.record.tooth.map(({ finding }) => finding.code)).toEqual([
			"crown",
		]);
	});
});

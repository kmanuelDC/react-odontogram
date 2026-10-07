import {
	type OdontogramFinding,
	addFinding,
	addSurfaceFinding,
	getPathBox,
	getToothRecord,
	removeSurfaceFinding,
} from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: the "SurfaceGuide" block of
// tests/surface-guide.test.ts, the guide case of
// tests/surface-tooltip-shape.test.ts and the "public API" block of
// tests/finding-records.test.ts (getSurfaceAxes and the record helpers are
// in packages/odontogram-core/tests/). `update:active` maps to `onActiveChange` and
// `surface-click` to `onSurfaceClick`. The "showSurfaceLetters" block is in
// tests/Odontogram-surfaces.test.tsx.
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { SurfaceGuide, type SurfaceGuideProps } from "../src/SurfaceGuide";
import {
	SurfaceGuide as PublicSurfaceGuide,
	addFinding as publicAddFinding,
	addSurfaceFinding as publicAddSurfaceFinding,
	getToothRecord as publicGetToothRecord,
	removeSurfaceFinding as publicRemoveSurfaceFinding,
} from "../src/index";

const guide = (props: Partial<SurfaceGuideProps> = {}) =>
	render(<SurfaceGuide toothId="16" {...props} />);

const element = (container: HTMLElement, selector: string) => {
	const found = container.querySelector<SVGElement | HTMLElement>(selector);
	if (!found) {
		throw new Error(`${selector} is not rendered`);
	}
	return found;
};
const guideSurface = (container: HTMLElement, surface: string) =>
	element(container, `[data-guide-surface="${surface}"]`);
const guideItem = (container: HTMLElement, surface: string) =>
	element(container, `[data-guide-item="${surface}"]`);
const highlight = (container: HTMLElement) =>
	container
		.querySelector(".odontogram-surface-guide__highlight")
		?.getAttribute("data-highlight");
const letters = (container: HTMLElement) =>
	[...container.querySelectorAll(".odontogram-surface-guide__letter")].map(
		(letter) => letter.textContent,
	);

/** Center of a surface polygon of the guide, in its 0 0 100 100 viewBox. */
function surfaceCenterOf(container: HTMLElement, surface: string) {
	const { x, y, width, height } = getPathBox(
		guideSurface(container, surface).getAttribute("d") ?? "",
	);
	return { x: x + width / 2, y: y + height / 2 };
}

describe("SurfaceGuide", () => {
	it("is exported from the library entry point", () => {
		expect(PublicSurfaceGuide).toBe(SurfaceGuide);
	});

	it("draws the five surfaces with the vestibular side out and mesial toward the midline", () => {
		for (const [toothId, vestibularUp, mesialRight] of [
			["16", true, true],
			["26", true, false],
			["36", false, false],
			["46", false, true],
		] as const) {
			const { container, unmount } = guide({ toothId });
			const center = surfaceCenterOf(container, "occlusal");

			expect(container.querySelectorAll("[data-guide-surface]")).toHaveLength(
				5,
			);
			expect(
				surfaceCenterOf(container, "vestibular").y < center.y,
				toothId,
			).toBe(vestibularUp);
			expect(surfaceCenterOf(container, "mesial").x > center.x, toothId).toBe(
				mesialRight,
			);
			unmount();
		}
	});

	it("adapts letters, names and descriptions to the tooth", () => {
		const incisor = guide({ toothId: "11" });

		expect(letters(incisor.container)).toEqual(["V", "M", "I", "D", "P"]);
		expect(guideItem(incisor.container, "occlusal")).toHaveTextContent(
			"Incisal",
		);
		expect(guideItem(incisor.container, "occlusal")).toHaveTextContent(
			"Cutting edge of incisors and canines.",
		);
		expect(guideItem(incisor.container, "lingual")).toHaveTextContent(
			"Palatal",
		);
		incisor.unmount();

		const molar = guide({ toothId: "36" });
		expect(letters(molar.container)).toEqual(["V", "M", "O", "D", "L"]);
		expect(guideItem(molar.container, "lingual")).toHaveTextContent(
			"Faces the tongue",
		);
	});

	it("translates through labels and shows the number in the chosen notation", () => {
		const { container } = guide({
			toothId: "11",
			notation: "Palmer",
			labels: {
				tooth: "Pieza",
				surfaceGuide: "Guía de superficies",
				surfaceNames: { palatal: "Palatina" },
				surfaceDescriptions: { palatal: "Cara que mira hacia el paladar." },
			},
		});

		expect(
			element(container, ".odontogram-surface-guide__title").textContent,
		).toBe("Pieza 1┘");
		expect(element(container, "section")).toHaveAttribute(
			"aria-label",
			"Guía de superficies, Pieza UR1",
		);
		expect(guideItem(container, "lingual").textContent).toContain(
			"PalatinaCara que mira hacia el paladar.",
		);
	});

	it("draws and lists the surface findings of its tooth only", () => {
		const findings: OdontogramFinding[] = [
			{ code: "caries", teeth: ["36", "46"], surfaces: ["occlusal"] },
			{
				code: "restoration",
				teeth: ["36"],
				surfaces: ["occlusal", "mesial"],
				status: "planned",
			},
			{ code: "temporary-restoration", teeth: ["37"] },
			{ code: "crown", teeth: ["36"] },
		];
		const { container } = guide({ toothId: "36", findings });

		// Caries and restoration split the occlusal surface; the mesial is whole.
		expect(
			container.querySelectorAll(".odontogram-finding__area"),
		).toHaveLength(3);
		expect(element(container, '[data-finding="restoration"]')).toHaveClass(
			"odontogram-finding--planned",
		);
		expect(container.querySelector('[data-finding="crown"]')).toBeNull();
		expect(guideItem(container, "occlusal")).toHaveTextContent(
			"Findings: Lesión de caries dental, Restauración definitiva (Planned)",
		);
		expect(guideItem(container, "distal")).not.toHaveTextContent("Findings");
	});

	it("highlights a surface from the list or the diagram and reports it", () => {
		const onActiveChange = vi.fn();
		const { container } = guide({ onActiveChange });

		expect(highlight(container)).toBeUndefined();

		fireEvent.focus(guideItem(container, "distal"));
		expect(highlight(container)).toBe("distal");
		expect(guideItem(container, "distal")).toHaveClass(
			"odontogram-surface-guide__item--active",
		);

		fireEvent.mouseEnter(guideSurface(container, "vestibular"));
		expect(highlight(container)).toBe("vestibular");

		fireEvent.mouseLeave(element(container, "svg"));
		expect(highlight(container)).toBeUndefined();
		expect(onActiveChange.mock.calls).toEqual([
			["distal"],
			["vestibular"],
			[undefined],
		]);
	});

	it("follows an active surface set from outside", () => {
		const { container } = guide({ active: "mesial" });

		expect(highlight(container)).toBe("mesial");
	});

	it("reports surface clicks and shows the selected surfaces", () => {
		const onSurfaceClick = vi.fn();
		const { container, rerender } = guide({
			selected: ["occlusal"],
			onSurfaceClick,
		});

		expect(guideItem(container, "occlusal")).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(guideSurface(container, "occlusal")).toHaveClass(
			"odontogram-surface--selected",
		);

		fireEvent.click(guideItem(container, "mesial"));
		fireEvent.click(guideSurface(container, "distal"));
		expect(onSurfaceClick.mock.calls).toEqual([["mesial"], ["distal"]]);

		rerender(
			<SurfaceGuide
				toothId="16"
				selected={["occlusal"]}
				onSurfaceClick={onSurfaceClick}
				disabled={true}
			/>,
		);
		fireEvent.click(guideSurface(container, "lingual"));
		expect(onSurfaceClick).toHaveBeenCalledTimes(2);
	});

	it("draws the guide with the same shape as the chart", () => {
		const { container } = guide({ shape: "circle" });
		const occlusal =
			guideSurface(container, "occlusal").getAttribute("d") ?? "";
		const box = getPathBox(occlusal);

		expect(box.width).toBeCloseTo(box.height, 1);
		expect(occlusal.split("L")).toHaveLength(48);
	});
});

describe("SurfaceGuide (React)", () => {
	it("accepts IDs in the legacy format", () => {
		const { container } = guide({
			toothId: "teeth-36",
			findings: [{ code: "caries", teeth: ["teeth-36"], surfaces: ["distal"] }],
		});

		expect(element(container, "section")).toHaveAttribute(
			"data-tooth-id",
			"36",
		);
		expect(guideItem(container, "distal")).toHaveTextContent(
			"Findings: Lesión de caries dental",
		);
	});

	it("hides the list with showList={false}", () => {
		const { container } = guide({ showList: false });

		expect(container.querySelector("ul")).toBeNull();
		expect(container.querySelectorAll("[data-guide-surface]")).toHaveLength(5);
	});

	it("disables the list buttons", () => {
		const { container } = guide({ disabled: true });

		expect(guideItem(container, "mesial")).toBeDisabled();
	});

	it("works next to a chart sharing its surfaces", () => {
		const { container } = render(
			<>
				<Odontogram
					idFormat="fdi"
					showSurfaces={true}
					surfaces={{ 16: ["mesial"] }}
				/>
				<SurfaceGuide toothId="16" selected={["mesial"]} />
			</>,
		);

		expect(
			container.querySelector(
				'[data-surface-tooth="16"][data-surface="mesial"]',
			),
		).toHaveAttribute("aria-checked", "true");
		expect(guideItem(container, "mesial")).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});
});

describe("public API", () => {
	it("exports the record helpers", () => {
		expect(publicGetToothRecord).toBe(getToothRecord);
		expect(publicAddFinding).toBe(addFinding);
		expect(publicAddSurfaceFinding).toBe(addSurfaceFinding);
		expect(publicRemoveSurfaceFinding).toBe(removeSurfaceFinding);
	});

	it("renders split fills in the component", () => {
		const { container } = render(
			<Odontogram
				showSurfaces={true}
				findings={[
					{ code: "caries", teeth: ["16"], surfaces: ["occlusal"] },
					{ code: "restoration", teeth: ["16"], surfaces: ["occlusal"] },
				]}
			/>,
		);
		const areas = [
			...container.querySelectorAll(
				".odontogram__findings .odontogram-finding__area",
			),
		];

		expect(areas).toHaveLength(2);
		expect(areas[0].getAttribute("d")).not.toBe(areas[1].getAttribute("d"));
	});

	it("adds a surface finding the chart then draws", () => {
		const findings = addSurfaceFinding([], {
			code: "caries",
			toothId: "26",
			surfaces: ["occlusal"],
		});
		const { container } = render(
			<Odontogram showSurfaces={true} findings={findings} />,
		);

		expect(
			container.querySelector('.odontogram-finding[data-teeth="26"]'),
		).not.toBeNull();
	});
});

import {
	type OdontogramLayout,
	getLayoutViewBox,
	getSurfaceDiagrams,
	getToothAnchors,
	getToothFrames,
} from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: the component cases of tests/surfaces.test.ts
// ("Odontogram surfaces", and the arch/horizontal case of "curve fairing")
// and tests/surface-tooltip-shape.test.ts ("surface tooltip" and the circle
// shape). The geometry is in packages/odontogram-core/tests/. `v-model:surfaces` maps to
// `surfaces` + `onSurfacesChange` with idFormat="fdi", `surface-click` to
// `onSurfaceClick`, and the `tooltip` slot to `renderTooltip`. The model
// cases use `buildOdontogramModel` (the overlay version is in
// tests/Odontogram-overlay.test.tsx); findings in the tooltip and the
// per-surface summary are in tests/Odontogram-findings.test.tsx.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { buildOdontogramModel } from "../src/hooks/useOdontogram";
import type { OdontogramProps, ToothDefinition } from "../src/type";

const chart = (props: OdontogramProps = {}) =>
	render(<Odontogram idFormat="fdi" {...props} />);

const surfaceOf = (container: HTMLElement, toothId: string, name: string) => {
	const surface = container.querySelector<SVGPathElement>(
		`[data-surface-tooth="${toothId}"][data-surface="${name}"]`,
	);
	if (!surface) {
		throw new Error(`Surface ${toothId}/${name} is not drawn`);
	}
	return surface;
};
const toothById = (container: HTMLElement, id: string) => {
	const tooth = container.querySelector<SVGGElement>(`[data-tooth-id="${id}"]`);
	if (!tooth) {
		throw new Error(`Tooth ${id} is not drawn`);
	}
	return tooth;
};
const surfaceTabStops = (container: HTMLElement) => [
	...container.querySelectorAll('.odontogram-surface[tabindex="0"]'),
];

describe("Odontogram surfaces", () => {
	it("does not render diagrams by default", () => {
		const { container } = chart();

		expect(container.querySelector(".odontogram__surfaces")).toBeNull();
		expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
			"0 0 409 694",
		);
	});

	it("renders one diagram per visible tooth and grows the viewBox", () => {
		const { container } = chart({ showSurfaces: true, showHalf: "upper" });

		expect(container.querySelectorAll("[data-surfaces-for]")).toHaveLength(16);
		expect(screen.getAllByRole("checkbox")).toHaveLength(80);
		expect(container.querySelector("svg")?.getAttribute("viewBox")).not.toBe(
			"0 0 409 694",
		);
	});

	it("names surfaces clinically and reflects the model", () => {
		chart({
			showSurfaces: true,
			surfaces: { 11: ["occlusal"] },
			labels: { tooth: "Pieza" },
		});
		const incisal = screen.getByRole("checkbox", { name: "Pieza 11, Incisal" });

		expect(incisal).toHaveAttribute("aria-checked", "true");
		expect(incisal).toHaveClass("odontogram-surface--selected");
		expect(
			screen.getByRole("checkbox", { name: "Pieza 11, Palatal" }),
		).toHaveAttribute("aria-checked", "false");
		expect(
			screen.getByRole("checkbox", { name: "Pieza 36, Lingual" }),
		).toBeInTheDocument();
	});

	it("reports surface changes and clicks without touching tooth selection", () => {
		const onSurfacesChange = vi.fn();
		const onSurfaceClick = vi.fn();
		const onChange = vi.fn();
		const { container } = chart({
			showSurfaces: true,
			surfaces: { 11: ["occlusal"] },
			value: ["21"],
			onSurfacesChange,
			onSurfaceClick,
			onChange,
		});

		fireEvent.click(surfaceOf(container, "11", "mesial"));

		expect(onSurfacesChange.mock.calls).toEqual([
			[{ 11: ["mesial", "occlusal"] }],
		]);
		const [tooth, surface, surfaces] = onSurfaceClick.mock.calls[0] as [
			ToothDefinition,
			string,
			unknown,
		];
		expect(tooth.id).toBe("11");
		expect(surface).toBe("mesial");
		expect(surfaces).toEqual({ 11: ["mesial", "occlusal"] });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("ignores clicks when disabled or on missing and extracted teeth", () => {
		const onSurfacesChange = vi.fn();
		const props: OdontogramProps = {
			showSurfaces: true,
			toothStates: { 16: "extracted", 26: "implant" },
			onSurfacesChange,
		};
		const { container, rerender } = chart(props);

		fireEvent.click(surfaceOf(container, "16", "occlusal"));
		expect(onSurfacesChange).not.toHaveBeenCalled();
		expect(container.querySelector('[data-surfaces-for="16"]')).toHaveClass(
			"odontogram-surfaces--inactive",
		);
		expect(surfaceOf(container, "16", "occlusal")).toHaveAttribute(
			"aria-disabled",
			"true",
		);

		fireEvent.click(surfaceOf(container, "26", "occlusal"));
		expect(onSurfacesChange).toHaveBeenCalledTimes(1);

		rerender(<Odontogram idFormat="fdi" {...props} disabled={true} />);
		fireEvent.click(surfaceOf(container, "26", "mesial"));
		expect(onSurfacesChange).toHaveBeenCalledTimes(1);
	});

	it("keeps a single tab stop and navigates with the keyboard", () => {
		const onSurfacesChange = vi.fn();
		const { container } = chart({
			showSurfaces: true,
			surfaces: { 21: ["distal"] },
			onSurfacesChange,
		});

		expect(surfaceTabStops(container)).toHaveLength(1);
		const [first] = surfaceTabStops(container);
		expect(first).toHaveAttribute("data-surface-tooth", "21");
		expect(first).toHaveAttribute("data-surface", "distal");

		fireEvent.keyDown(first, { key: "ArrowDown" });
		expect(document.activeElement?.getAttribute("data-surface")).toBe(
			"lingual",
		);

		fireEvent.keyDown(surfaceOf(container, "21", "lingual"), {
			key: "ArrowLeft",
		});
		expect(document.activeElement?.getAttribute("data-surface-tooth")).toBe(
			"11",
		);
		expect(document.activeElement?.getAttribute("data-surface")).toBe(
			"lingual",
		);

		fireEvent.keyDown(surfaceOf(container, "11", "lingual"), { key: " " });
		expect(onSurfacesChange.mock.calls).toEqual([
			[{ 11: ["lingual"], 21: ["distal"] }],
		]);
		expect(surfaceTabStops(container)).toHaveLength(1);
	});
});

describe("surface diagrams in the model", () => {
	const centerOf16 = (layout: OdontogramLayout) =>
		buildOdontogramModel({ layout, showSurfaces: true }).surfaceDiagrams.find(
			({ toothId }) => toothId === "16",
		)?.center;
	const framesOf = (layout: OdontogramLayout) =>
		getToothFrames(
			getToothAnchors("permanent", layout),
			getLayoutViewBox("permanent", layout),
			layout,
		);

	it("fairs the curve in the arch layout only and aligns horizontal rows", () => {
		expect(centerOf16("arch")).toEqual(
			getSurfaceDiagrams(framesOf("arch"), { fairCurve: true }).diagrams.find(
				({ toothId }) => toothId === "16",
			)?.center,
		);
		expect(centerOf16("horizontal")).toEqual(
			getSurfaceDiagrams(framesOf("horizontal"), {
				alignRows: true,
			}).diagrams.find(({ toothId }) => toothId === "16")?.center,
		);
	});

	it("keeps the chart positions with circular diagrams", () => {
		const centers = (surfaceShape: "square" | "circle") =>
			buildOdontogramModel({
				layout: "arch",
				showSurfaces: true,
				surfaceShape,
			}).surfaceDiagrams.map(({ center }) => center);

		expect(centers("circle")).toEqual(centers("square"));
	});
});

describe("surface tooltip", () => {
	it("describes the hovered surface: name, definition and selection", () => {
		const { container } = chart({
			showSurfaces: true,
			surfaces: { 16: ["occlusal"] },
		});

		fireEvent.mouseEnter(surfaceOf(container, "16", "occlusal"));
		const tooltip = screen.getByRole("tooltip");

		expect(tooltip).toHaveTextContent("Tooth: 16");
		expect(tooltip).toHaveTextContent("Surface: Occlusal");
		expect(tooltip).toHaveTextContent(
			"Chewing surface of molars and premolars.",
		);
		expect(tooltip).toHaveTextContent("Selected: Yes");
		// Tooth-level details are left out.
		expect(tooltip).not.toHaveTextContent("Type:");

		fireEvent.mouseLeave(surfaceOf(container, "16", "occlusal"));
		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	it("uses clinical names and the chart notation", () => {
		const { container } = chart({
			showSurfaces: true,
			notation: "Universal",
			labels: { surface: "Superficie" },
		});

		fireEvent.mouseEnter(surfaceOf(container, "11", "lingual"));
		const tooltip = screen.getByRole("tooltip");

		expect(tooltip).toHaveTextContent("Tooth: 8");
		expect(tooltip).toHaveTextContent("Superficie: Palatal");
		expect(tooltip).toHaveTextContent("Selected: No");
	});

	it("opens on keyboard focus and returns to the tooth tooltip on a tooth", () => {
		const { container } = chart({ showSurfaces: true });

		fireEvent.focus(surfaceOf(container, "26", "mesial"));
		expect(screen.getByRole("tooltip")).toHaveTextContent("Surface: Mesial");

		fireEvent.blur(surfaceOf(container, "26", "mesial"));
		fireEvent.mouseEnter(toothById(container, "26"));
		const tooltip = screen.getByRole("tooltip");
		expect(tooltip).toHaveTextContent("Type:");
		expect(tooltip).not.toHaveTextContent("Surface:");
	});

	it("shows the tooth state on a surface", () => {
		const { container } = chart({
			showSurfaces: true,
			toothStates: { 26: "implant" },
		});

		fireEvent.mouseEnter(surfaceOf(container, "26", "mesial"));
		expect(screen.getByRole("tooltip")).toHaveTextContent("State: Implant");
	});

	it("follows the same showTooltip switch as the teeth", () => {
		const { container } = chart({ showSurfaces: true, showTooltip: false });

		fireEvent.mouseEnter(surfaceOf(container, "16", "occlusal"));
		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	it("passes the surface to renderTooltip", () => {
		const { container } = chart({
			showSurfaces: true,
			surfaces: { 36: ["lingual"] },
			renderTooltip: ({ tooth, surface, surfaceName, selected }) =>
				`${tooth.id}|${surface ?? "-"}|${surfaceName ?? "-"}|${selected}`,
		});

		fireEvent.mouseEnter(surfaceOf(container, "36", "lingual"));
		expect(screen.getByRole("tooltip").textContent).toBe(
			"36|lingual|Lingual|true",
		);

		fireEvent.mouseLeave(surfaceOf(container, "36", "lingual"));
		fireEvent.mouseEnter(toothById(container, "36"));
		expect(screen.getByRole("tooltip").textContent).toBe("36|-|-|false");
	});
});

describe("surfaces (React)", () => {
	it("keeps the surfaces inside when uncontrolled", () => {
		const { container } = chart({
			showSurfaces: true,
			defaultSurfaces: { 11: ["occlusal"] },
		});

		fireEvent.click(surfaceOf(container, "11", "mesial"));
		fireEvent.click(surfaceOf(container, "11", "occlusal"));

		expect(surfaceOf(container, "11", "mesial")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		expect(surfaceOf(container, "11", "occlusal")).toHaveAttribute(
			"aria-checked",
			"false",
		);
	});

	it("follows the controlled value only", () => {
		const { container, rerender } = chart({
			showSurfaces: true,
			surfaces: {},
		});

		fireEvent.click(surfaceOf(container, "11", "mesial"));
		expect(surfaceOf(container, "11", "mesial")).toHaveAttribute(
			"aria-checked",
			"false",
		);

		rerender(
			<Odontogram
				idFormat="fdi"
				showSurfaces={true}
				surfaces={{ 11: ["mesial"] }}
			/>,
		);
		expect(surfaceOf(container, "11", "mesial")).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("reads keys in either format and reports them in idFormat", () => {
		const onSurfacesChange = vi.fn();
		const { container } = render(
			<Odontogram
				showSurfaces={true}
				surfaces={{ "teeth-11": ["occlusal"] }}
				onSurfacesChange={onSurfacesChange}
			/>,
		);

		expect(surfaceOf(container, "11", "occlusal")).toHaveAttribute(
			"aria-checked",
			"true",
		);
		fireEvent.click(surfaceOf(container, "21", "distal"));
		expect(onSurfacesChange).toHaveBeenCalledWith({
			"teeth-11": ["occlusal"],
			"teeth-21": ["distal"],
		});
	});

	it("draws the letters of every surface with showSurfaceLetters", () => {
		const { container } = chart({
			showSurfaces: true,
			showSurfaceLetters: true,
			showHalf: "upper",
		});
		const letter = (key: string) =>
			container.querySelector(`[data-letter-for="${key}"]`)?.textContent;

		expect(
			container
				.querySelector(".odontogram__surface-letters")
				?.getAttribute("aria-hidden"),
		).toBe("true");
		expect(
			container.querySelectorAll(".odontogram__surface-letter"),
		).toHaveLength(80);
		expect(letter("11:occlusal")).toBe("I");
		expect(letter("11:lingual")).toBe("P");
		expect(letter("16:occlusal")).toBe("O");
	});

	it("draws no letters without showSurfaces", () => {
		const { container } = chart({ showSurfaceLetters: true });

		expect(container.querySelector(".odontogram__surface-letters")).toBeNull();
	});

	it("draws circular diagrams with surfaceShape", () => {
		const square = chart({ showSurfaces: true });
		const squarePath = surfaceOf(
			square.container,
			"16",
			"occlusal",
		).getAttribute("d");
		square.unmount();

		const { container } = chart({ showSurfaces: true, surfaceShape: "circle" });
		const circlePath = surfaceOf(container, "16", "occlusal").getAttribute("d");

		expect(circlePath).not.toBe(squarePath);
		expect(circlePath?.split("L").length).toBeGreaterThan(
			squarePath?.split("L").length ?? 0,
		);
	});

	it("keeps the teeth tab stop apart from the surfaces one", () => {
		const { container } = chart({ showSurfaces: true });

		expect(
			container.querySelectorAll('[data-tooth-id][tabindex="0"]'),
		).toHaveLength(1);
		expect(surfaceTabStops(container)).toHaveLength(1);
	});

	it("leaves no tab stop on the surfaces when disabled", () => {
		const { container } = chart({ showSurfaces: true, disabled: true });

		expect(surfaceTabStops(container)).toHaveLength(0);
	});

	it("skips inactive teeth when navigating between teeth", () => {
		const { container } = chart({
			showSurfaces: true,
			toothStates: { 21: "missing" },
		});

		act(() => surfaceOf(container, "11", "mesial").focus());
		fireEvent.keyDown(surfaceOf(container, "11", "mesial"), {
			key: "ArrowRight",
		});
		expect(document.activeElement?.getAttribute("data-surface-tooth")).toBe(
			"22",
		);
	});
});

// Ported from vue-odontogram: the "showSurfaceLetters" block of
// tests/surface-guide.test.ts ("needs the surface diagrams" is the case
// "draws no letters without showSurfaces" above).
describe("showSurfaceLetters", () => {
	it("draws no letters by default", () => {
		const { container } = chart({ showSurfaces: true });

		expect(container.querySelector(".odontogram__surface-letters")).toBeNull();
	});

	it("draws the adapted letter of every surface above the findings", () => {
		const { container } = chart({
			showSurfaces: true,
			showSurfaceLetters: true,
			findings: [{ code: "caries", teeth: ["11"], surfaces: ["occlusal"] }],
		});
		const letter = (key: string) =>
			container.querySelector(`[data-letter-for="${key}"]`)?.textContent;
		const layers = [...(container.querySelector("svg")?.children ?? [])].map(
			(child) => child.getAttribute("class"),
		);

		expect(
			container.querySelectorAll(".odontogram__surface-letter"),
		).toHaveLength(32 * 5);
		expect(letter("11:occlusal")).toBe("I");
		expect(letter("11:lingual")).toBe("P");
		expect(letter("36:occlusal")).toBe("O");
		expect(letter("36:lingual")).toBe("L");
		expect(layers.indexOf("odontogram__surface-letters")).toBeGreaterThan(
			layers.indexOf("odontogram__findings"),
		);
	});
});

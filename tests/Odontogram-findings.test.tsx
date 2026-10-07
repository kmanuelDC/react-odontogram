import { type OdontogramFinding, getPathBox } from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: the "findings prop" block of
// tests/findings.test.ts, and the finding cases of
// tests/surface-tooltip-shape.test.ts ("surface tooltip", "per-surface
// summary in the tooth tooltip" and the circle strips). The layout itself is
// in packages/odontogram-core/tests/findings.test.ts. `v-model` maps to `value` + `onChange` with
// idFormat="fdi" and the `tooltip` slot to `renderTooltip`.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { resetDeprecationWarnings } from "../src/compat";
import type { OdontogramProps, ToothDetail } from "../src/type";

const chart = (props: OdontogramProps = {}) =>
	render(<Odontogram idFormat="fdi" {...props} />);

const toothById = (container: HTMLElement, id: string) => {
	const tooth = container.querySelector<SVGGElement>(`[data-tooth-id="${id}"]`);
	if (!tooth) {
		throw new Error(`Tooth ${id} is not drawn`);
	}
	return tooth;
};
const surfaceOf = (container: HTMLElement, toothId: string, name: string) => {
	const surface = container.querySelector<SVGPathElement>(
		`[data-surface-tooth="${toothId}"][data-surface="${name}"]`,
	);
	if (!surface) {
		throw new Error(`Surface ${toothId}/${name} is not drawn`);
	}
	return surface;
};
const drawnFindings = (container: HTMLElement) => [
	...container.querySelectorAll(".odontogram__findings .odontogram-finding"),
];
const legendFindings = (container: HTMLElement) => [
	...container.querySelectorAll("li[data-finding]"),
];
const viewBoxHeight = (container: HTMLElement) =>
	Number(
		container.querySelector("svg")?.getAttribute("viewBox")?.split(" ")[3],
	);

beforeEach(() => {
	resetDeprecationWarnings();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("findings prop", () => {
	const findings: OdontogramFinding[] = [
		{ code: "fracture", teeth: ["11"] },
		{ code: "crown", teeth: ["21"] },
		{ code: "fixed-prosthesis", teeth: ["14", "16"] },
	];

	it("renders nothing without findings", () => {
		const { container } = chart();

		expect(container.querySelector(".odontogram__findings")).toBeNull();
	});

	it("draws each finding with its status color class", () => {
		const { container } = chart({ findings });
		const drawn = drawnFindings(container);

		expect(
			container
				.querySelector(".odontogram__findings")
				?.getAttribute("aria-hidden"),
		).toBe("true");
		expect(
			drawn.map((finding) => finding.getAttribute("data-finding")),
		).toEqual(["fracture", "crown", "fixed-prosthesis"]);
		expect(drawn[0]).toHaveClass("odontogram-finding--bad");
		expect(drawn[1]).toHaveClass("odontogram-finding--good");
		expect(drawn[2]).toHaveAttribute("data-teeth", "16 15 14");
	});

	it("adds the findings to the accessible name and tooltip", () => {
		const { container } = chart({ findings });

		expect(toothById(container, "15")).toHaveAttribute(
			"aria-label",
			"Tooth 15, Prótesis fija",
		);

		fireEvent.mouseEnter(toothById(container, "11"));
		expect(screen.getByRole("tooltip")).toHaveTextContent("Findings: Fractura");
	});

	it("passes the finding names to renderTooltip", () => {
		const { container } = chart({
			findings,
			renderTooltip: ({ findings: names }) => names.join("|"),
		});

		fireEvent.mouseEnter(toothById(container, "21"));
		expect(screen.getByRole("tooltip").textContent).toBe("Corona definitiva");
	});

	it("lists each finding once in the legend with its icon", () => {
		const { container } = chart({
			showLabels: true,
			findings: [...findings, { code: "fracture", teeth: ["12"] }],
		});
		const items = legendFindings(container);

		expect(items.map((item) => item.textContent)).toEqual([
			"Fractura",
			"Corona definitiva",
			"Prótesis fija",
		]);
		expect(items[0].querySelector("svg path")).not.toBeNull();
	});

	it("does not change selection", () => {
		const onChange = vi.fn();
		const { container } = chart({ findings, onChange });

		fireEvent.click(toothById(container, "11"));
		expect(
			(onChange.mock.calls[0][0] as ToothDetail[]).map(({ id }) => id),
		).toEqual(["11"]);
	});

	it("skips findings of the hidden arch and warns about invalid ones", () => {
		const warning = vi.spyOn(console, "warn").mockImplementation(() => {
			// Silenced: the warning is asserted below.
		});
		const { container } = chart({
			showHalf: "lower",
			findings: [
				...findings,
				{ code: "fracture", teeth: ["41"] },
				{ code: "nope", teeth: ["41"] },
			],
		});

		expect(
			drawnFindings(container).map((finding) =>
				finding.getAttribute("data-teeth"),
			),
		).toEqual(["41"]);
		expect(warning).toHaveBeenCalledWith(
			'[react-odontogram] Unknown finding code "nope".',
		);
	});

	it("draws status and custom colors on the chart", () => {
		const { container } = chart({
			findings: [
				{ code: "extraction", teeth: ["18"], status: "planned" },
				{ code: "crown", teeth: ["21"], color: "rgb(124, 58, 237)" },
			],
		});
		const [extraction, crown] = drawnFindings(container);

		expect(extraction).toHaveClass(
			"odontogram-finding--planned",
			"odontogram-finding--bad",
		);
		expect(extraction).toHaveAttribute("data-status", "planned");
		expect(crown.getAttribute("style")).toContain("color: rgb(124, 58, 237)");
	});

	it("draws surface findings on the diagram and names their surfaces", () => {
		const { container } = chart({
			showSurfaces: true,
			showLabels: true,
			findings: [
				{ code: "caries", teeth: ["11"], surfaces: ["occlusal", "vestibular"] },
				{
					code: "restoration",
					teeth: ["11"],
					surfaces: ["mesial"],
					status: "planned",
				},
			],
		});

		expect(
			container.querySelectorAll(
				".odontogram__findings .odontogram-finding__area",
			),
		).toHaveLength(3);
		expect(toothById(container, "11")).toHaveAttribute(
			"aria-label",
			"Tooth 11, Lesión de caries dental (Vestibular, Incisal), Restauración definitiva (Mesial, Planned)",
		);
		expect(legendFindings(container).map((item) => item.textContent)).toEqual([
			"Lesión de caries dental",
			"Restauración definitiva (Planned)",
		]);
	});

	it("grows the viewBox to fit findings outside the chart", () => {
		const plain = chart({ layout: "horizontal" });
		const plainHeight = viewBoxHeight(plain.container);
		plain.unmount();

		const { container } = chart({
			layout: "horizontal",
			findings: [{ code: "implant", teeth: ["16"] }],
		});

		expect(viewBoxHeight(container)).toBeGreaterThan(plainHeight);
	});
});

describe("findings in the surface tooltip", () => {
	const findings: OdontogramFinding[] = [
		{ code: "caries", teeth: ["16"], surfaces: ["occlusal"] },
		{
			code: "restoration",
			teeth: ["16"],
			surfaces: ["occlusal"],
			status: "planned",
		},
		{ code: "caries", teeth: ["16"], surfaces: ["distal"] },
		{ code: "pulp-treatment", teeth: ["16"] },
	];

	it("describes the hovered surface with its findings only", () => {
		const { container } = chart({
			showSurfaces: true,
			findings,
			surfaces: { 16: ["occlusal"] },
		});

		fireEvent.mouseEnter(surfaceOf(container, "16", "occlusal"));
		const tooltip = screen.getByRole("tooltip");

		expect(tooltip).toHaveTextContent("Surface: Occlusal");
		expect(tooltip).toHaveTextContent(
			"Findings: Lesión de caries dental, Restauración definitiva (Planned)",
		);
		expect(tooltip).toHaveTextContent("Selected: Yes");
		// Tooth-level findings are left out.
		expect(tooltip).not.toHaveTextContent("Tratamiento pulpar");
	});

	it("passes the surface findings to renderTooltip", () => {
		const { container } = chart({
			showSurfaces: true,
			findings,
			renderTooltip: ({ findings: names, surfaceSummary }) =>
				`${names.join(",")}|${surfaceSummary.length}`,
		});

		fireEvent.mouseEnter(surfaceOf(container, "16", "distal"));
		expect(screen.getByRole("tooltip").textContent).toBe(
			"Lesión de caries dental|0",
		);
	});
});

describe("per-surface summary in the tooth tooltip", () => {
	const findings: OdontogramFinding[] = [
		{ code: "caries", teeth: ["16"], surfaces: ["mesial", "occlusal"] },
		{
			code: "restoration",
			teeth: ["16"],
			surfaces: ["occlusal"],
			status: "planned",
		},
		{ code: "pulp-treatment", teeth: ["16"] },
	];

	it("lists whole-tooth findings apart from a line per surface", () => {
		const { container } = chart({ showSurfaces: true, findings });

		fireEvent.mouseEnter(toothById(container, "16"));
		const tooltip = screen.getByRole("tooltip");
		const lines = [...tooltip.querySelectorAll("[data-summary-surface]")].map(
			(line) => line.textContent,
		);

		expect(tooltip).toHaveTextContent("Findings: Tratamiento pulpar");
		expect(tooltip).not.toHaveTextContent(
			"Findings: Tratamiento pulpar, Lesión",
		);
		expect(tooltip).toHaveTextContent("Surfaces:");
		expect(lines).toEqual([
			"M Mesial: Lesión de caries dental",
			"O Occlusal: Lesión de caries dental, Restauración definitiva (Planned)",
		]);
	});

	it("translates the heading and passes the summary to renderTooltip", () => {
		const translated = chart({
			showSurfaces: true,
			findings,
			labels: { surfaceSummary: "Superficies" },
		});
		fireEvent.mouseEnter(toothById(translated.container, "16"));
		expect(screen.getByRole("tooltip")).toHaveTextContent("Superficies:");
		translated.unmount();

		const { container } = chart({
			showSurfaces: true,
			findings,
			renderTooltip: ({ surfaceSummary, findings: names }) =>
				`${surfaceSummary.map((line) => line.letter).join("")}|${names.join(",")}`,
		});
		fireEvent.mouseEnter(toothById(container, "16"));
		expect(screen.getByRole("tooltip").textContent).toBe(
			"MO|Tratamiento pulpar",
		);
	});

	it("shows no summary for teeth without surface findings", () => {
		const { container } = chart({ showSurfaces: true, findings });

		fireEvent.mouseEnter(toothById(container, "26"));
		expect(screen.getByRole("tooltip")).not.toHaveTextContent("Surfaces:");
	});
});

describe("circular diagrams", () => {
	it("splits shared surfaces into strips inside the surface", () => {
		const { container } = chart({
			showSurfaces: true,
			surfaceShape: "circle",
			findings: [
				{ code: "caries", teeth: ["16"], surfaces: ["vestibular"] },
				{ code: "restoration", teeth: ["16"], surfaces: ["vestibular"] },
			],
		});
		const [first, second] = [
			...container.querySelectorAll(
				".odontogram__findings .odontogram-finding__area",
			),
		].map((area) => getPathBox(area.getAttribute("d") ?? ""));
		const whole = getPathBox(
			surfaceOf(container, "16", "vestibular").getAttribute("d") ?? "",
		);

		for (const strip of [first, second]) {
			expect(strip.x).toBeGreaterThanOrEqual(whole.x - 0.02);
			expect(strip.y).toBeGreaterThanOrEqual(whole.y - 0.02);
			expect(strip.x + strip.width).toBeLessThanOrEqual(
				whole.x + whole.width + 0.02,
			);
			expect(strip.y + strip.height).toBeLessThanOrEqual(
				whole.y + whole.height + 0.02,
			);
		}
		expect(first).not.toEqual(second);
	});
});

describe("findings (React)", () => {
	it("accepts tooth IDs in the legacy format", () => {
		const { container } = chart({
			findings: [{ code: "crown", teeth: ["teeth-21"] }],
		});

		expect(drawnFindings(container)[0]).toHaveAttribute("data-teeth", "21");
	});

	it("draws findings on primary and mixed teeth", () => {
		const { container } = chart({
			dentition: "mixed",
			findings: [{ code: "crown", teeth: ["55"] }],
		});

		expect(drawnFindings(container)[0]).toHaveAttribute("data-teeth", "55");
	});

	it("supports custom catalogs", () => {
		const { container } = chart({
			findingCatalog: {
				sealant: {
					name: "Sellante",
					tone: "good",
					symbol: { kind: "text", text: "S" },
				},
			},
			findings: [{ code: "sealant", teeth: ["36"] }],
		});

		expect(drawnFindings(container)[0]).toHaveClass("odontogram-finding--good");
		expect(toothById(container, "36")).toHaveAttribute(
			"aria-label",
			"Tooth 36, Sellante",
		);
	});

	it("keeps the 0.5.x viewBox without findings", () => {
		const { container } = chart({ findings: [] });

		expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
			"0 0 409 694",
		);
	});

	it("keeps the state and the findings in the accessible name", () => {
		const { container } = chart({
			toothStates: { 36: "implant" },
			findings: [{ code: "crown", teeth: ["36"] }],
		});

		expect(toothById(container, "36")).toHaveAttribute(
			"aria-label",
			"Tooth 36, Implant, Corona definitiva",
		);
	});
});

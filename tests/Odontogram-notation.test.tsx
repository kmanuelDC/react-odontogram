// Ported from vue-odontogram: tests/Odontogram-notation.test.ts, plus the
// React-only `renderTooltip` and `labels` cases. Differences kept for 0.5.x:
// the tooltip's default content shows FDI, Universal and Palmer at once, and
// the `<title>` and tooltip write Palmer as `6UR` (Vue: `6┘`). Surface
// accessible names wait for R08.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	defaultOdontogramLabels,
	formatToothNumber,
	getPalmerQuadrant,
} from "../src";
import Odontogram from "../src/Odontogram";
import type {
	OdontogramProps,
	OdontogramTooltipRenderProps,
} from "../src/type";

const chart = (props: OdontogramProps = {}) =>
	render(<Odontogram idFormat="fdi" {...props} />);

const toothById = (container: HTMLElement, id: string) => {
	const tooth = container.querySelector<SVGGElement>(`[data-tooth-id="${id}"]`);
	if (!tooth) {
		throw new Error(`Tooth ${id} is not drawn`);
	}
	return tooth;
};
const numberOf = (container: HTMLElement, id: string) =>
	container.querySelector(`[data-number-for="${id}"]`)?.textContent;

describe("notation prop", () => {
	it("exports the notation helpers and default labels", () => {
		expect(formatToothNumber("11", "Universal")).toBe("8");
		expect(getPalmerQuadrant("61")).toBe("upper-left");
		expect(defaultOdontogramLabels.tooth).toBe("Tooth");
	});

	it("shows Universal numbers and keeps FDI IDs and events", () => {
		const onChange = vi.fn();
		const { container } = chart({
			notation: "Universal",
			showNumbers: true,
			onChange,
		});
		const tooth = toothById(container, "11");

		expect(tooth).toHaveAttribute("aria-label", "Tooth 8");
		expect(tooth.querySelector("title")).toHaveTextContent("8");
		expect(numberOf(container, "11")).toBe("8");
		expect(numberOf(container, "48")).toBe("32");

		fireEvent.click(tooth);
		expect(onChange.mock.calls[0][0][0].id).toBe("11");
	});

	it("shows primary teeth with Universal letters", () => {
		const { container } = chart({
			dentition: "primary",
			notation: "Universal",
			showNumbers: true,
		});

		expect(toothById(container, "55")).toHaveAttribute("aria-label", "Tooth A");
		expect(numberOf(container, "85")).toBe("T");

		fireEvent.mouseEnter(toothById(container, "61"));
		expect(screen.getByRole("tooltip")).toHaveTextContent("Universal: F");
	});

	it("draws Palmer corners and reads the quadrant aloud", () => {
		const { container } = chart({ notation: "Palmer", showNumbers: true });
		const tooth = toothById(container, "16");

		// Numbers draw the corner as lines: horizontal toward the other arch,
		// vertical toward the midline.
		const corner = (id: string) =>
			container.querySelector(`[data-corner-for="${id}"]`)?.getAttribute("d") ??
			"";
		const points = (d: string) => (d.match(/-?[\d.]+/g) ?? []).map(Number);
		expect(numberOf(container, "16")).toBe("6");
		expect(numberOf(container, "21")).toBe("1");
		const [x1, y1, x2, y2, x3, y3] = points(corner("16"));
		expect(y1).toBe(y2);
		expect(x2).toBeGreaterThan(x1);
		expect(x3).toBe(x2);
		expect(y3).toBeLessThan(y2);
		expect(
			container.querySelectorAll(".odontogram__number-corner"),
		).toHaveLength(32);
		expect(tooth.querySelector("title")).toHaveTextContent("6UR");
		expect(tooth).toHaveAttribute("aria-label", "Tooth UR6");

		fireEvent.mouseEnter(tooth);
		expect(screen.getByRole("tooltip")).toHaveTextContent("Palmer: 6UR");
	});

	it("passes the displayed number to renderTooltip", () => {
		chart({
			notation: "Universal",
			renderTooltip: ({ tooth, number }) => `${tooth.id}=${number}`,
		});

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Tooth 14" }));
		expect(screen.getByRole("tooltip").textContent).toBe("26=14");
	});
});

describe("renderTooltip", () => {
	it("receives the Vue slot payload and wins over tooltip.content", () => {
		const renderTooltip = vi.fn(
			(_props: OdontogramTooltipRenderProps) => "custom",
		);
		const condition = {
			label: "Caries",
			teeth: ["16"],
			fillColor: "#f00",
			outlineColor: "#900",
		};
		chart({
			value: ["16"],
			conditions: [condition],
			renderTooltip,
			tooltip: { content: "ignored" },
		});

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Tooth 16" }));

		expect(screen.getByRole("tooltip")).toHaveTextContent("custom");
		const props = renderTooltip.mock.lastCall?.[0] as
			| OdontogramTooltipRenderProps
			| undefined;
		expect(props).toMatchObject({
			tooth: { id: "16", type: "First Molar", dentition: "permanent" },
			detail: { id: "16", notations: { universal: "3", palmer: "6UR" } },
			selected: true,
			condition,
			state: "present",
			findings: [],
			number: "16",
			surfaceSummary: [],
		});
		expect(props?.surface).toBeUndefined();
	});

	it("follows the selection while the tooltip is open", () => {
		const renderTooltip = ({ selected }: OdontogramTooltipRenderProps) =>
			selected ? "selected" : "not selected";
		chart({ renderTooltip });
		const tooth = screen.getByRole("option", { name: "Tooth 21" });

		fireEvent.mouseEnter(tooth);
		expect(screen.getByRole("tooltip").textContent).toBe("not selected");
		fireEvent.click(tooth);
		expect(screen.getByRole("tooltip").textContent).toBe("selected");
	});

	it("keeps tooltip.content working", () => {
		chart({ tooltip: { content: (detail) => `content ${detail?.id}` } });

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Tooth 21" }));
		expect(screen.getByRole("tooltip")).toHaveTextContent("content 21");
	});

	it("shows the condition in the default content", () => {
		chart({
			conditions: [
				{
					label: "Caries",
					teeth: ["21"],
					fillColor: "#f00",
					outlineColor: "#900",
				},
			],
		});

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Tooth 21" }));
		expect(screen.getByRole("tooltip")).toHaveTextContent("Condition: Caries");
	});
});

describe("labels", () => {
	it("translates the chart, teeth, tooltip and legend", () => {
		const { container } = chart({
			showLabels: true,
			labels: {
				odontogram: "Odontograma",
				tooth: "Diente",
				type: "Tipo",
				condition: "Condición",
				legend: "Leyenda",
				chartTitles: { permanent: "odontograma permanente" },
				toothTypes: { "First Molar": "Primer molar" },
			},
			conditions: [
				{
					label: "Caries",
					teeth: ["16"],
					fillColor: "#f00",
					outlineColor: "#900",
				},
			],
		});

		expect(screen.getByRole("listbox")).toHaveAccessibleName("Odontograma");
		expect(container.querySelector("svg > title")).toHaveTextContent(
			"odontograma permanente",
		);
		expect(screen.getByRole("list")).toHaveAccessibleName("Leyenda");

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Diente 16" }));
		const tooltip = screen.getByRole("tooltip");
		expect(tooltip).toHaveTextContent("Diente: 16");
		expect(tooltip).toHaveTextContent("Tipo: Primer molar");
		expect(tooltip).toHaveTextContent("Condición: Caries");
	});

	it("keeps the English defaults", () => {
		const { container } = chart({ dentition: "mixed" });

		expect(screen.getByRole("listbox")).toHaveAccessibleName("Odontogram");
		expect(container.querySelector("svg > title")).toHaveTextContent(
			"mixed odontogram",
		);
	});
});

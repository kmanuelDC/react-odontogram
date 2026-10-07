import { primaryHorizontalTeethPaths } from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: tests/Odontogram-api-improvements.test.ts. The
// two overlay cases are in tests/Odontogram-overlay.test.tsx. The `tooltip`
// slot maps to `renderTooltip` and `setProps` to `rerender`. React's default
// tooltip has no "Selected" line (it keeps the 0.5.x content) and the SVG is
// named by its <title> instead of `aria-label`.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import {
	buildToothId,
	defaultOdontogramLabels,
	getQuadrant,
} from "../src/index";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("odontogram API improvements", () => {
	it("exports FDI helpers and default labels from the entry point", () => {
		expect(buildToothId("primary", 8, 5, "FDI")).toBe("85");
		expect(getQuadrant("permanent", "lower", "left")).toBe(3);
		expect(defaultOdontogramLabels.tooth).toBe("Tooth");
	});

	it("shows the tooltip when a tooth receives keyboard focus", () => {
		render(<Odontogram />);
		const tooth = screen.getByRole("option", { name: "Tooth 21" });

		fireEvent.focus(tooth);
		expect(screen.getByRole("tooltip")).toHaveTextContent("Tooth: 21");

		fireEvent.blur(tooth);
		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	it("forwards renderTooltip the tooth, selection and condition", () => {
		render(
			<Odontogram
				idFormat="fdi"
				value={["11"]}
				conditions={[
					{
						label: "caries",
						teeth: ["11"],
						fillColor: "#f00",
						outlineColor: "#900",
					},
				]}
				renderTooltip={({ tooth, selected, condition }) =>
					`Pieza ${tooth.id} / ${selected} / ${condition?.label}`
				}
			/>,
		);

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Tooth 11" }));

		const tooltip = screen.getByRole("tooltip");
		expect(tooltip).toHaveTextContent("Pieza 11 / true / caries");
		expect(tooltip).not.toHaveTextContent("Type:");
	});

	it("translates visible and accessible text through labels", () => {
		const { container } = render(
			<Odontogram
				dentition="primary"
				showLabels={true}
				conditions={[
					{
						label: "caries",
						teeth: ["65"],
						fillColor: "#f00",
						outlineColor: "#900",
					},
				]}
				labels={{
					odontogram: "Odontograma",
					chartTitles: { primary: "odontograma temporal" },
					tooth: "Pieza",
					type: "Tipo",
					condition: "Condición",
					legend: "Leyenda de condiciones",
					toothTypes: { "Primary Second Molar": "Segundo molar temporal" },
				}}
			/>,
		);

		expect(screen.getByRole("listbox")).toHaveAccessibleName("Odontograma");
		expect(container.querySelector("svg > title")?.textContent).toBe(
			"odontograma temporal",
		);
		expect(
			screen.getByRole("list", { name: "Leyenda de condiciones" }),
		).toBeInTheDocument();

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Pieza 65" }));
		const tooltip = screen.getByRole("tooltip");
		expect(tooltip).toHaveTextContent("Pieza: 65");
		expect(tooltip).toHaveTextContent("Tipo: Segundo molar temporal");
		expect(tooltip).toHaveTextContent("Condición: caries");
	});

	it("does not warn for any notation", () => {
		const warning = vi.spyOn(console, "warn").mockImplementation(() => {
			// Asserted below.
		});
		for (const notation of ["FDI", "Universal", "Palmer"] as const) {
			render(<Odontogram notation={notation} />);
		}

		expect(warning).not.toHaveBeenCalled();
	});

	it("renders legend entries that share a label and applies the last condition", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {
			// Asserted below: no duplicate key warning.
		});
		const { container } = render(
			<Odontogram
				showLabels={true}
				conditions={[
					{
						label: "observation",
						teeth: ["11"],
						fillColor: "#111111",
						outlineColor: "#111111",
					},
					{
						label: "observation",
						teeth: ["11"],
						fillColor: "#222222",
						outlineColor: "#222222",
					},
				]}
			/>,
		);

		expect(
			container.querySelectorAll(".odontogram-condition-labels__item"),
		).toHaveLength(2);
		expect(
			screen
				.getByRole("option", { name: "Tooth 11" })
				.querySelector('path[data-colored="true"]'),
		).toHaveAttribute("fill", "#222222");
		expect(error).not.toHaveBeenCalled();
	});

	it("applies primary arch offsets only in the arch layout", () => {
		const { rerender } = render(<Odontogram dentition="primary" />);

		expect(screen.getByRole("option", { name: "Tooth 55" })).toHaveAttribute(
			"transform",
			"translate(0 6)",
		);

		rerender(<Odontogram dentition="primary" layout="horizontal" />);
		const secondMolar = primaryHorizontalTeethPaths.find(
			({ position }) => position === 5,
		);
		expect(
			screen
				.getByRole("option", { name: "Tooth 55" })
				.getAttribute("transform"),
		).toBe(secondMolar?.transform ?? null);
	});
});

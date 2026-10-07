// Ported from vue-odontogram: tests/Odontogram-mixed.test.ts ("mixed
// dentition in the component"). `v-model` maps to `onChange` with
// idFormat="fdi". States, findings, surfaces and drawn numbers arrive in
// R06–R09, so the last Vue case is checked here with conditions, notation
// and half charts only.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { resetDeprecationWarnings } from "../src/compat";
import { buildOdontogramModel } from "../src/hooks/useOdontogram";
import type { OdontogramProps, ToothDetail } from "../src/type";

const tooth = (id: string) =>
	screen.getByRole("option", { name: `Tooth ${id}` });
const drawnIds = () =>
	screen
		.getAllByRole("option")
		.map((option) => option.getAttribute("aria-label")?.slice("Tooth ".length));
const viewBox = (container: HTMLElement) =>
	container.querySelector("svg")?.getAttribute("viewBox");
const changedIds = (onChange: ReturnType<typeof vi.fn>, call: number) =>
	(onChange.mock.calls[call][0] as ToothDetail[]).map(({ id }) => id);

const mixed = (props: OdontogramProps = {}) =>
	render(<Odontogram dentition="mixed" idFormat="fdi" {...props} />);

afterEach(() => {
	resetDeprecationWarnings();
	vi.restoreAllMocks();
});

describe("mixed dentition in the component", () => {
	it.each([
		["arch", "0 0 409 694"],
		["horizontal", "0 0 900 418"],
	] as const)("renders both sets by default in %s", (layout, box) => {
		const { container } = mixed({ layout });

		expect(viewBox(container)).toBe(box);
		expect(screen.getAllByRole("option")).toHaveLength(52);
		expect(new Set(drawnIds()).size).toBe(52);
	});

	it("keeps FDI selection across both sets", () => {
		const onChange = vi.fn();
		mixed({ onChange });

		fireEvent.click(tooth("54"));
		fireEvent.click(tooth("14"));

		expect(changedIds(onChange, 0)).toEqual(["54"]);
		expect(changedIds(onChange, 1)).toEqual(["54", "14"]);
		expect(onChange.mock.calls[1][0][0]).toEqual({
			id: "54",
			notations: { fdi: "54", universal: "B", palmer: "DUR" },
			type: "Primary First Molar",
		});
	});

	it("follows a controlled value with teeth of both sets", () => {
		const onChange = vi.fn();
		const { rerender } = mixed({ value: ["54"], onChange });

		fireEvent.click(tooth("14"));
		expect(changedIds(onChange, 0)).toEqual(["54", "14"]);
		expect(tooth("14")).toHaveAttribute("aria-selected", "false");

		rerender(
			<Odontogram
				dentition="mixed"
				idFormat="fdi"
				value={["54", "14"]}
				onChange={onChange}
			/>,
		);
		expect(tooth("54")).toHaveAttribute("aria-selected", "true");
		expect(tooth("14")).toHaveAttribute("aria-selected", "true");
	});

	it("draws only the teeth listed in `teeth`", () => {
		const teeth = ["16", "11", "21", "26", "55", "54", "53", "63", "64", "65"];
		mixed({ layout: "horizontal", teeth });

		expect(drawnIds().sort()).toEqual([...teeth].sort());
	});

	it("accepts legacy IDs in `teeth` and keeps the viewBox", () => {
		const { container } = mixed({ teeth: ["teeth-11", "teeth-51"] });

		expect(drawnIds()).toEqual(["11", "51"]);
		expect(viewBox(container)).toBe("0 0 409 694");
	});

	it("does not draw quadrants without listed teeth", () => {
		const { container } = mixed({ teeth: ["11", "51"] });

		expect(container.querySelectorAll("svg > g")).toHaveLength(2);
	});

	it("also filters permanent and primary charts, and warns about unknown teeth", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		render(<Odontogram dentition="permanent" teeth={["11", "21", "51"]} />);

		expect(screen.getAllByRole("option")).toHaveLength(2);
		expect(warn).toHaveBeenCalledWith(
			"[react-odontogram] Teeth 51 are not part of the permanent dentition.",
		);
	});

	it("does not warn when every listed tooth exists", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		mixed({ teeth: ["11", "51", "85", "48"] });
		render(<Odontogram dentition="primary" teeth={["51"]} />);

		expect(warn).not.toHaveBeenCalled();
	});

	it("works with conditions, notation and half charts", () => {
		const { container } = mixed({
			layout: "horizontal",
			showHalf: "upper",
			notation: "Universal",
			showLabels: true,
			conditions: [
				{
					label: "Caries",
					teeth: ["54", "16"],
					fillColor: "#ef4444",
					outlineColor: "#b91c1c",
				},
			],
		});

		expect(screen.getAllByRole("option")).toHaveLength(26);
		// Since R06 the accessible name follows the notation, as in Vue.
		expect(tooth("A").querySelector("title")).toHaveTextContent("A");
		expect(tooth("3").querySelector("title")).toHaveTextContent("3");
		expect(tooth("A")).toHaveAttribute("data-tooth-id", "55");
		expect(container.querySelectorAll('[data-colored="true"]')).toHaveLength(2);
		expect(screen.getByText("Caries")).toBeInTheDocument();
		expect(container.querySelector('[data-tooth-id="85"]')).toBeNull();
	});

	it.each(["upper", "lower"] as const)(
		"fits the %s half of both layouts to its teeth",
		(showHalf) => {
			for (const layout of ["arch", "horizontal"] as const) {
				const full = buildOdontogramModel({ dentition: "mixed", layout })
					.viewBox.split(" ")
					.map(Number);
				const half = buildOdontogramModel({
					dentition: "mixed",
					layout,
					showHalf,
				})
					.viewBox.split(" ")
					.map(Number);

				expect(half[0]).toBe(full[0]);
				expect(half[2]).toBe(full[2]);
				expect(half[3]).toBeLessThan(full[3]);
			}
		},
	);
});

// Ported from vue-odontogram: Odontogram-primary*.test.ts and
// primary-{arch-spacing,canine-orientation,central-incisor-orientation,
// lateral-incisor-spacing,lower-arch-symmetry}.test.ts.
// Vue events map to `onChange` (with idFormat="fdi" for plain IDs); Vue's
// `tooth-click` has no React equivalent yet, so its payload is checked
// through the ToothDetail of `onChange`.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { resetDeprecationWarnings } from "../src/compat";
import type { OdontogramProps, ToothDetail } from "../src/type";

const primaryIds = [
	"51",
	"52",
	"53",
	"54",
	"55",
	"61",
	"62",
	"63",
	"64",
	"65",
	"81",
	"82",
	"83",
	"84",
	"85",
	"71",
	"72",
	"73",
	"74",
	"75",
];

const tooth = (id: string) =>
	screen.getByRole("option", { name: `Tooth ${id}` });
const quadrantTransform = (id: string) =>
	tooth(id).parentElement?.getAttribute("transform");
const viewBox = (container: HTMLElement) =>
	container.querySelector("svg")?.getAttribute("viewBox");
const changedIds = (onChange: ReturnType<typeof vi.fn>, call: number) =>
	(onChange.mock.calls[call][0] as ToothDetail[]).map(({ id }) => id);

const primary = (props: OdontogramProps = {}) =>
	render(<Odontogram dentition="primary" idFormat="fdi" {...props} />);

afterEach(() => {
	resetDeprecationWarnings();
	vi.restoreAllMocks();
});

describe("primary odontogram", () => {
	it("renders 20 primary teeth with FDI identifiers and primary transforms", () => {
		const { container } = primary();

		expect(viewBox(container)).toBe("0 0 409 461");
		expect(screen.getAllByRole("option")).toHaveLength(20);
		expect(tooth("51")).toBeInTheDocument();
		expect(tooth("85")).toBeInTheDocument();
		expect(screen.queryByRole("option", { name: "Tooth 11" })).toBeNull();
		expect(quadrantTransform("71")).toBe("scale(-1, -1) translate(-409, -461)");
	});

	it("reports primary selection and tooth details", () => {
		const onChange = vi.fn();
		primary({ onChange });

		fireEvent.click(tooth("51"));

		expect(onChange).toHaveBeenCalledWith([
			{
				id: "51",
				notations: { fdi: "51", universal: "E", palmer: "AUR" },
				type: "Primary Central Incisor",
			},
		]);
	});

	it("renders the independent horizontal primary dataset without warnings", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const { container } = primary({ layout: "horizontal" });

		expect(viewBox(container)).toBe("0 0 520 180");
		expect(screen.getAllByRole("option")).toHaveLength(20);
		expect(quadrantTransform("61")).toBe("translate(520, 105) scale(-1, 1)");
		expect(warn).not.toHaveBeenCalled();
	});

	it.each(["arch", "horizontal"] as const)(
		"keeps the FDI render order in %s",
		(layout) => {
			primary({ layout });

			expect(
				screen
					.getAllByRole("option")
					.map((option) => option.getAttribute("aria-label")),
			).toEqual(primaryIds.map((id) => `Tooth ${id}`));
		},
	);

	it.each([
		["arch", "upper", "0 -5.45 409 230.88", ["51", "65"], ["71", "85"]],
		["arch", "lower", "0 235.58 409 230.88", ["71", "85"], ["51", "65"]],
		["horizontal", "upper", "0 114.24 520 65.29", ["51", "65"], ["71", "85"]],
		["horizontal", "lower", "0 0.47 520 65.29", ["71", "85"], ["51", "65"]],
	] as const)(
		"fits the %s %s half to its teeth",
		(layout, showHalf, box, shown, hidden) => {
			const { container } = primary({ layout, showHalf });

			expect(viewBox(container)).toBe(box);
			expect(screen.getAllByRole("option")).toHaveLength(10);
			for (const id of shown) {
				expect(tooth(id)).toBeInTheDocument();
			}
			for (const id of hidden) {
				expect(
					screen.queryByRole("option", { name: `Tooth ${id}` }),
				).toBeNull();
			}
		},
	);

	it("numbers primary teeth in every notation", () => {
		const { container, rerender } = primary();
		const title = () =>
			container.querySelector("g.teeth-55 > title")?.textContent;

		expect(title()).toBe("55");
		rerender(<Odontogram dentition="primary" notation="Universal" />);
		expect(title()).toBe("A");
		rerender(<Odontogram dentition="primary" notation="Palmer" />);
		expect(title()).toBe("EUR");
	});
});

describe("primary odontogram interactions", () => {
	it.each(["arch", "horizontal"] as const)(
		"keeps controlled multiple selection in %s",
		(layout) => {
			const onChange = vi.fn();
			const { rerender } = primary({ layout, value: ["51"], onChange });

			fireEvent.click(tooth("52"));
			expect(changedIds(onChange, 0)).toEqual(["51", "52"]);

			rerender(
				<Odontogram
					dentition="primary"
					idFormat="fdi"
					layout={layout}
					value={["51", "52"]}
					onChange={onChange}
				/>,
			);
			fireEvent.click(tooth("51"));
			expect(changedIds(onChange, 1)).toEqual(["52"]);
		},
	);

	it("uses primary identifiers for single selection", () => {
		const onChange = vi.fn();
		primary({ value: ["51"], singleSelect: true, onChange });

		fireEvent.click(tooth("65"));

		expect(onChange).toHaveBeenCalledWith([
			expect.objectContaining({ id: "65", type: "Primary Second Molar" }),
		]);
	});

	it("keeps the selection when switching from arch to horizontal", () => {
		const onChange = vi.fn();
		const { container, rerender } = primary({ value: ["51"], onChange });

		rerender(
			<Odontogram
				dentition="primary"
				idFormat="fdi"
				layout="horizontal"
				value={["51"]}
				onChange={onChange}
			/>,
		);
		fireEvent.click(tooth("52"));

		expect(viewBox(container)).toBe("0 0 520 180");
		expect(tooth("51")).toHaveAttribute("aria-selected", "true");
		expect(onChange).toHaveBeenCalledWith([
			expect.objectContaining({ id: "51" }),
			expect.objectContaining({ id: "52", type: "Primary Lateral Incisor" }),
		]);
	});

	it("blocks interaction when disabled", () => {
		const onChange = vi.fn();
		const { container } = primary({
			layout: "horizontal",
			disabled: true,
			onChange,
		});
		const tooth51 = container.querySelector("g.teeth-51") as Element;

		fireEvent.click(tooth51);

		expect(onChange).not.toHaveBeenCalled();
		expect(tooth51).toHaveAttribute("aria-disabled", "true");
	});

	it.each(["arch", "horizontal"] as const)(
		"shows primary conditions, legend and tooltip in %s",
		(layout) => {
			const { container } = primary({
				layout,
				showLabels: true,
				conditions: [
					{
						label: "observation",
						teeth: ["65"],
						fillColor: "#fbbf24",
						outlineColor: "#b45309",
					},
				],
			});
			const tooth65 = tooth("65");
			const tooltip = () => container.querySelector(".odontogram-tooltip");

			fireEvent.mouseEnter(tooth65);

			expect(tooltip()).toHaveTextContent("Tooth: 65");
			expect(tooltip()).toHaveTextContent("Type: Primary Second Molar");
			expect(
				screen.getByRole("list", { name: "Tooth condition legend" }),
			).toHaveTextContent("observation");
			expect(tooth65.querySelector('path[data-colored="true"]')).not.toBeNull();

			fireEvent.mouseLeave(tooth65);
			expect(tooltip()).toBeNull();
		},
	);
});

describe("primary arch geometry", () => {
	const transformOf = (id: string) => tooth(id).getAttribute("transform");

	it("separates the central incisors from the midline", () => {
		primary();

		for (const id of ["51", "61", "81", "71"]) {
			expect(transformOf(id)).toBe("translate(366 0) scale(-1 1)");
		}
		expect(quadrantTransform("61")).toBe("scale(-1, 1) translate(-409, 0)");
		expect(quadrantTransform("71")).toBe("scale(-1, -1) translate(-409, -461)");
	});

	it("uses the intended placement adjustments in all four quadrants", () => {
		primary();

		const expected = {
			"translate(-6 0)": ["52", "62", "72", "82"],
			"translate(209 20) scale(-1 1)": ["53", "63", "73", "83"],
			"translate(-20 -4)": ["54", "64", "74", "84"],
			"translate(0 6)": ["55", "65", "75", "85"],
		};
		for (const [transform, ids] of Object.entries(expected)) {
			for (const id of ids) {
				expect(transformOf(id)).toBe(transform);
			}
		}
	});

	it("keeps every lower path and adjustment identical to the upper arch", () => {
		primary();

		for (const [upper, lower] of [
			["51", "81"],
			["52", "82"],
			["53", "83"],
			["54", "84"],
			["55", "85"],
			["61", "71"],
			["62", "72"],
			["63", "73"],
			["64", "74"],
			["65", "75"],
		]) {
			expect(tooth(lower).querySelector("path")?.getAttribute("d")).toBe(
				tooth(upper).querySelector("path")?.getAttribute("d"),
			);
			expect(transformOf(lower)).toBe(transformOf(upper));
		}
		expect(quadrantTransform("81")).toBe("scale(1, -1) translate(0, -461)");
	});

	it("applies only each horizontal shape transform", () => {
		primary({ layout: "horizontal" });

		expect(transformOf("51")).toBe("translate(360.75 13.3) scale(-0.75 0.75)");
		expect(transformOf("52")).toBe("translate(36.75 10.5) scale(0.75)");
		expect(transformOf("53")).toBe("translate(24.75 10.25) scale(0.75)");
	});
});

describe("maxTeeth deprecation", () => {
	it("warns once and keeps cutting quadrants", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const { rerender } = render(<Odontogram maxTeeth={5} />);
		rerender(<Odontogram maxTeeth={4} />);

		expect(screen.getAllByRole("option")).toHaveLength(16);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0][0]).toContain('dentition="primary"');
	});

	it("does not warn without maxTeeth", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		render(<Odontogram dentition="primary" />);

		expect(warn).not.toHaveBeenCalled();
	});
});

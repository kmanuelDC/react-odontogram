import { parseViewBox } from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: tests/Odontogram-quick-wins.test.ts.
// `v-model` maps to `value` + `onChange` with idFormat="fdi". The overlay
// slot case is in tests/Odontogram-overlay.test.tsx. Unlike Vue, the permanent half charts keep their
// 0.5.x viewBoxes (exactly half the chart) unless numbers are shown.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { buildOdontogramModel } from "../src/hooks/useOdontogram";
import type { OdontogramProps, ToothDetail } from "../src/type";

const chart = (props: OdontogramProps = {}) =>
	render(<Odontogram idFormat="fdi" {...props} />);

const toothIds = (container: HTMLElement) =>
	[...container.querySelectorAll("[data-tooth-id]")].map(
		(tooth) => tooth.getAttribute("data-tooth-id") ?? "",
	);
const toothById = (container: HTMLElement, id: string) => {
	const tooth = container.querySelector<SVGGElement>(`[data-tooth-id="${id}"]`);
	if (!tooth) {
		throw new Error(`Tooth ${id} is not drawn`);
	}
	return tooth;
};
const tabStops = (container: HTMLElement) => [
	...container.querySelectorAll('[tabindex="0"]'),
];
const changedIds = (onChange: ReturnType<typeof vi.fn>, call: number) =>
	(onChange.mock.calls[call][0] as ToothDetail[]).map(({ id }) => id);

describe("showNumbers", () => {
	it("does not render numbers by default", () => {
		const { container } = chart();

		expect(container.querySelector(".odontogram__numbers")).toBeNull();
		expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
			"0 0 409 694",
		);
	});

	it("renders one hidden-from-assistive-tech number per tooth", () => {
		const { container } = chart({
			showNumbers: true,
			dentition: "primary",
			value: ["51"],
		});
		const numbers = [...container.querySelectorAll(".odontogram__number")];
		const numberFor = (id: string) =>
			numbers.find((number) => number.textContent === id);

		expect(
			container
				.querySelector(".odontogram__numbers")
				?.getAttribute("aria-hidden"),
		).toBe("true");
		expect(numbers.map((number) => number.textContent).sort()).toEqual(
			toothIds(container).sort(),
		);
		expect(numberFor("51")).toHaveClass("odontogram__number--selected");
		expect(numberFor("52")).not.toHaveClass("odontogram__number--selected");
	});

	it("does not change selection or tooth count", () => {
		const onChange = vi.fn();
		chart({ showNumbers: true, onChange });

		expect(screen.getAllByRole("option")).toHaveLength(32);
		fireEvent.click(screen.getByRole("option", { name: "Tooth 11" }));
		expect(changedIds(onChange, 0)).toEqual(["11"]);
	});

	it.each([
		["permanent", "arch"],
		["permanent", "horizontal"],
		["primary", "arch"],
		["primary", "horizontal"],
		["mixed", "arch"],
		["mixed", "horizontal"],
	] as const)(
		"fits every %s %s number in the viewBox, full and half",
		(dentition, layout) => {
			for (const showHalf of ["full", "upper", "lower"] as const) {
				const model = buildOdontogramModel({
					dentition,
					layout,
					showHalf,
					showNumbers: true,
				});
				const box = parseViewBox(model.viewBox);

				expect(model.numberLabels).toHaveLength(model.anchors.length);
				for (const { toothId, box: label } of model.numberLabels) {
					const where = `${showHalf} ${toothId}`;
					expect(label.x, where).toBeGreaterThanOrEqual(box.x);
					expect(label.y, where).toBeGreaterThanOrEqual(box.y);
					expect(label.x + label.width, where).toBeLessThanOrEqual(
						box.x + box.width,
					);
					expect(label.y + label.height, where).toBeLessThanOrEqual(
						box.y + box.height,
					);
				}
			}
		},
	);

	it("hands each number to renderNumber", () => {
		const renderNumber = vi.fn(({ toothId, x, y, selected }) => (
			<circle
				data-custom-number={toothId}
				data-selected={selected}
				cx={x}
				cy={y}
				r={2}
			/>
		));
		const { container } = chart({
			showNumbers: true,
			notation: "Palmer",
			value: ["16"],
			renderNumber,
		});

		expect(container.querySelectorAll("[data-custom-number]")).toHaveLength(32);
		expect(container.querySelector(".odontogram__number")).toBeNull();
		expect(
			container.querySelector('[data-custom-number="16"]'),
		).toHaveAttribute("data-selected", "true");
		expect(renderNumber).toHaveBeenCalledWith(
			expect.objectContaining({
				toothId: "16",
				text: "6",
				notation: "Palmer",
				corner: expect.any(String),
			}),
		);
	});
});

describe("showHalf", () => {
	it.each([
		["upper", "12", 16],
		["lower", "34", 16],
	] as const)(
		"shows only the %s permanent arch",
		(showHalf, quadrants, count) => {
			const { container } = chart({ showHalf });
			const ids = toothIds(container);

			expect(ids).toHaveLength(count);
			expect(ids.every((id) => quadrants.includes(id[0]))).toBe(true);
		},
	);

	it.each([
		["permanent", "upper", "12"],
		["permanent", "lower", "34"],
		["primary", "upper", "56"],
		["primary", "lower", "78"],
		["mixed", "upper", "1256"],
		["mixed", "lower", "3478"],
	] as const)(
		"shows only the %s %s arch in both layouts",
		(dentition, showHalf, quadrants) => {
			for (const layout of ["arch", "horizontal"] as const) {
				const { container, unmount } = chart({ dentition, layout, showHalf });
				const ids = toothIds(container);

				expect(ids.length, layout).toBeGreaterThan(0);
				expect(
					ids.every((id) => quadrants.includes(id[0])),
					layout,
				).toBe(true);
				unmount();
			}
		},
	);

	it("shows only the upper primary arch in the horizontal layout", () => {
		const { container } = chart({
			dentition: "primary",
			layout: "horizontal",
			showHalf: "upper",
		});
		const ids = toothIds(container);

		expect(ids).toHaveLength(10);
		expect(ids.every((id) => "56".includes(id[0]))).toBe(true);
	});

	it("crops the viewBox height to the visible arch and keeps its width", () => {
		const { container } = chart({ showHalf: "upper" });
		const [, , width, height] =
			container
				.querySelector("svg")
				?.getAttribute("viewBox")
				?.split(" ")
				.map(Number) ?? [];

		expect(width).toBe(409);
		// The 0.5.x viewBox: exactly half; Vue crops it a little further.
		expect(height).toBeLessThanOrEqual(694 / 2);
	});

	it("keeps hidden teeth in the selection", () => {
		const onChange = vi.fn();
		chart({ showHalf: "upper", value: ["11", "41"], onChange });

		fireEvent.click(screen.getByRole("option", { name: "Tooth 12" }));
		expect(changedIds(onChange, 0)).toEqual(["11", "41", "12"]);
	});
});

describe("keyboard navigation", () => {
	it("keeps a single tab stop on the first tooth by default", () => {
		const { container } = chart();
		const stops = tabStops(container);

		expect(stops).toHaveLength(1);
		expect(stops[0]).toHaveAttribute("data-tooth-id", "11");
	});

	it("puts the tab stop on the first selected visible tooth", () => {
		const { container } = chart({ value: ["41", "26"], showHalf: "upper" });

		expect(tabStops(container)[0]).toHaveAttribute("data-tooth-id", "26");
	});

	it("moves focus with arrow keys and keeps the tab stop on the focused tooth", () => {
		const { container } = chart();

		fireEvent.keyDown(toothById(container, "11"), { key: "ArrowRight" });
		expect(document.activeElement).toHaveAttribute("data-tooth-id", "21");
		expect(tabStops(container)).toEqual([toothById(container, "21")]);

		fireEvent.keyDown(toothById(container, "21"), { key: "ArrowDown" });
		expect(document.activeElement).toHaveAttribute("data-tooth-id", "31");

		fireEvent.keyDown(toothById(container, "31"), { key: "End" });
		expect(document.activeElement).toHaveAttribute("data-tooth-id", "38");
	});

	it("moves through the four rows of a mixed chart", () => {
		const { container } = chart({ dentition: "mixed" });

		fireEvent.keyDown(toothById(container, "11"), { key: "ArrowDown" });
		expect(document.activeElement).toHaveAttribute("data-tooth-id", "51");
		fireEvent.keyDown(toothById(container, "51"), { key: "ArrowDown" });
		expect(document.activeElement).toHaveAttribute("data-tooth-id", "81");
	});

	it("shows the tooltip of the tooth reached with the keyboard", () => {
		const { container } = chart();

		fireEvent.keyDown(toothById(container, "11"), { key: "ArrowLeft" });
		expect(screen.getByRole("tooltip")).toHaveTextContent("Tooth: 12");
	});

	it("opens the tooltip when a tooth gets the focus", () => {
		const { container } = chart();

		fireEvent.focus(toothById(container, "36"));
		expect(screen.getByRole("tooltip")).toHaveTextContent("Tooth: 36");
		fireEvent.blur(toothById(container, "36"));
		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	it("does not select teeth while navigating", () => {
		const onChange = vi.fn();
		const { container } = chart({ onChange });

		fireEvent.keyDown(toothById(container, "11"), { key: "ArrowRight" });
		expect(onChange).not.toHaveBeenCalled();
	});

	it("still selects with Enter and Space", () => {
		const onChange = vi.fn();
		const { container } = chart({ onChange });

		fireEvent.keyDown(toothById(container, "11"), { key: "Enter" });
		fireEvent.keyDown(toothById(container, "12"), { key: " " });
		expect(changedIds(onChange, 1)).toEqual(["11", "12"]);
	});

	it("stays inside the visible arch", () => {
		const { container } = chart({ showHalf: "upper" });

		fireEvent.keyDown(toothById(container, "11"), { key: "ArrowDown" });
		expect(tabStops(container)[0]).toHaveAttribute("data-tooth-id", "11");
	});

	it("removes every tab stop when disabled", () => {
		const { container } = chart({ disabled: true });

		expect(tabStops(container)).toHaveLength(0);
	});
});

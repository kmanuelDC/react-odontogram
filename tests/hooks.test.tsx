import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	buildOdontogramModel,
	useOdontogram,
} from "../src/hooks/useOdontogram";
import { useToothSelection } from "../src/hooks/useToothSelection";

const ids = (model: ReturnType<typeof buildOdontogramModel>) =>
	model.quadrants.flatMap(({ teeth }) => teeth.map(({ tooth }) => tooth.id));

describe("buildOdontogramModel", () => {
	it("draws 32 teeth in the 0.5.x quadrant order", () => {
		const model = buildOdontogramModel({ layout: "arch" });

		expect(model.quadrants.map(({ quadrant }) => quadrant)).toEqual([
			1, 2, 4, 3,
		]);
		expect(ids(model)).toHaveLength(32);
		expect(ids(model).slice(0, 8)).toEqual([
			"11",
			"12",
			"13",
			"14",
			"15",
			"16",
			"17",
			"18",
		]);
	});

	it.each([
		["arch", "full", "0 0 409 694"],
		["arch", "upper", "0 0 409 347"],
		["arch", "lower", "0 347 409 347"],
		["horizontal", "full", "0 0 900 150"],
		["horizontal", "upper", "0 0 900 75"],
	] as const)("keeps the 0.5.x viewBox of %s %s", (layout, showHalf, box) => {
		expect(buildOdontogramModel({ layout, showHalf }).viewBox.trim()).toBe(box);
	});

	it("shows only the quadrants of the visible arch", () => {
		const quadrantsOf = (showHalf: "upper" | "lower") =>
			buildOdontogramModel({ layout: "arch", showHalf }).quadrants.map(
				({ quadrant }) => quadrant,
			);

		expect(quadrantsOf("upper")).toEqual([1, 2]);
		expect(quadrantsOf("lower")).toEqual([4, 3]);
	});

	it.each([
		[undefined, 32],
		[5, 20],
		[3.7, 12],
		[0, 0],
		[20, 32],
		[Number.NaN, 32],
	])("clamps maxTeeth=%s like 0.5.x", (maxTeeth, count) => {
		expect(
			ids(buildOdontogramModel({ layout: "arch", maxTeeth })),
		).toHaveLength(count);
	});

	it("lets later condition groups win for the same tooth", () => {
		const first = {
			label: "A",
			teeth: ["16", "26"],
			fillColor: "",
			outlineColor: "",
		};
		const second = {
			label: "B",
			teeth: ["16"],
			fillColor: "",
			outlineColor: "",
		};
		const { conditionByTooth } = buildOdontogramModel({
			layout: "arch",
			conditions: [first, second],
		});

		expect(conditionByTooth.get("16")).toBe(second);
		expect(conditionByTooth.get("26")).toBe(first);
	});

	it("is memoized by useOdontogram", () => {
		const { result, rerender } = renderHook(() =>
			useOdontogram({ layout: "arch" }),
		);
		const first = result.current;
		rerender();

		expect(result.current).toBe(first);
	});
});

describe("useToothSelection", () => {
	it("keeps an uncontrolled selection in order", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useToothSelection({ defaultValue: ["11", "11", "21"], onChange }),
		);

		expect(result.current.selected).toEqual(["11", "21"]);

		act(() => result.current.toggle("12"));
		act(() => result.current.toggle("11"));

		expect(result.current.selected).toEqual(["21", "12"]);
		expect(onChange).toHaveBeenNthCalledWith(1, ["11", "21", "12"]);
		expect(onChange).toHaveBeenNthCalledWith(2, ["21", "12"]);
		expect(result.current.isSelected("12")).toBe(true);
		expect(result.current.isSelected("11")).toBe(false);
	});

	it("keeps a single tooth with singleSelect", () => {
		const { result } = renderHook(() =>
			useToothSelection({ defaultValue: ["11", "12"], singleSelect: true }),
		);

		expect(result.current.selected).toEqual(["11"]);
		act(() => result.current.toggle("21"));
		expect(result.current.selected).toEqual(["21"]);
		act(() => result.current.toggle("21"));
		expect(result.current.selected).toEqual([]);
	});

	it("ignores toggles while disabled", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useToothSelection({ defaultValue: ["11"], disabled: true, onChange }),
		);

		act(() => result.current.toggle("12"));

		expect(result.current.selected).toEqual(["11"]);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("only reports changes when controlled", () => {
		const onChange = vi.fn();
		const { result, rerender } = renderHook(
			({ value }) => useToothSelection({ value, onChange }),
			{ initialProps: { value: ["11"] } },
		);

		act(() => result.current.toggle("12"));

		expect(onChange).toHaveBeenLastCalledWith(["11", "12"]);
		expect(result.current.selected).toEqual(["11"]);

		rerender({ value: ["12"] });
		expect(result.current.selected).toEqual(["12"]);
	});

	it("chains toggles made before a re-render", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useToothSelection({ onChange }));

		act(() => {
			result.current.toggle("11");
			result.current.toggle("12");
		});

		expect(onChange).toHaveBeenLastCalledWith(["11", "12"]);
		expect(result.current.selected).toEqual(["11", "12"]);
	});
});

import { describe, expect, it } from "vitest";
import {
	applyMatrix,
	getPathBox,
	parseTransform,
	transformBox,
} from "../../src/core/utils/svg-geometry";

function expectBox(
	path: string,
	expected: { x: number; y: number; width: number; height: number },
) {
	const box = getPathBox(path);
	expect(box.x).toBeCloseTo(expected.x, 6);
	expect(box.y).toBeCloseTo(expected.y, 6);
	expect(box.width).toBeCloseTo(expected.width, 6);
	expect(box.height).toBeCloseTo(expected.height, 6);
}

describe("SVG path bounding boxes", () => {
	it("handles relative lines, horizontal/vertical commands and close path", () => {
		expectBox("m10 10h5v5l-5 0z", { x: 10, y: 10, width: 5, height: 5 });
	});

	it("treats extra move coordinates as implicit lines", () => {
		expectBox("M0 0 10 10 20 0", { x: 0, y: 0, width: 20, height: 10 });
	});

	it("uses cubic curve extrema, not control points", () => {
		expectBox("M0 0C0 10 10 10 10 0", { x: 0, y: 0, width: 10, height: 7.5 });
	});

	it("reflects the previous control point for smooth cubic curves", () => {
		expectBox("M0 0C0 10 10 10 10 0S20 -10 20 0", {
			x: 0,
			y: -7.5,
			width: 20,
			height: 15,
		});
	});

	it("uses quadratic curve extrema", () => {
		expectBox("M0 0Q5 10 10 0", { x: 0, y: 0, width: 10, height: 5 });
	});

	it("includes the extreme point of an elliptical arc", () => {
		expectBox("M0 0A10 10 0 0 1 20 0", { x: 0, y: -10, width: 20, height: 10 });
		expectBox("M0 0A10 10 0 0 0 20 0", { x: 0, y: 0, width: 20, height: 10 });
	});

	it("reads compact arc flags that touch the next number", () => {
		expectBox("M0 0a10 10 0 0120 0", { x: 0, y: -10, width: 20, height: 10 });
	});

	it("reads numbers separated only by a sign or a second decimal point", () => {
		expectBox("M1.5.5l-1-.5", { x: 0.5, y: 0, width: 1, height: 0.5 });
	});

	it("rejects unsupported content", () => {
		expect(() => getPathBox("M0 0 X1 1")).toThrow(SyntaxError);
	});
});

describe("SVG transforms", () => {
	it("composes transform functions from left to right like SVG", () => {
		expect(
			applyMatrix(parseTransform("translate(10 20) scale(2)"), { x: 1, y: 1 }),
		).toEqual({
			x: 12,
			y: 22,
		});
		expect(
			applyMatrix(parseTransform("scale(-1, 1) translate(-409, 0)"), {
				x: 0,
				y: 0,
			}),
		).toEqual({ x: 409, y: 0 });
	});

	it("supports rotation and treats a missing transform as identity", () => {
		const rotated = applyMatrix(parseTransform("rotate(90)"), { x: 1, y: 0 });
		expect(rotated.x).toBeCloseTo(0, 10);
		expect(rotated.y).toBeCloseTo(1, 10);
		expect(applyMatrix(parseTransform(undefined), { x: 3, y: 4 })).toEqual({
			x: 3,
			y: 4,
		});
	});

	it("transforms a box through a reflection", () => {
		expect(
			transformBox(parseTransform("translate(100 0) scale(-1 1)"), {
				x: 10,
				y: 5,
				width: 20,
				height: 10,
			}),
		).toEqual({ x: 70, y: 5, width: 20, height: 10 });
	});
});

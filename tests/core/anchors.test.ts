import { describe, expect, it } from "vitest";
import {
	type ToothAnchor,
	getLayoutViewBox,
	getToothAnchors,
} from "../../src/core/utils/anchors";

const combinations = [
	["permanent", "arch", 32],
	["permanent", "horizontal", 32],
	["primary", "arch", 20],
	["primary", "horizontal", 20],
] as const;

function anchorMap(anchors: readonly ToothAnchor[]): Map<string, ToothAnchor> {
	return new Map(anchors.map((anchor) => [anchor.toothId, anchor]));
}

describe("tooth anchors", () => {
	it.each(combinations)(
		"returns one anchor per %s %s tooth inside the viewBox",
		(dentition, layout, count) => {
			const anchors = getToothAnchors(dentition, layout);
			const viewBox = getLayoutViewBox(dentition, layout);

			expect(anchors).toHaveLength(count);
			expect(new Set(anchors.map(({ toothId }) => toothId)).size).toBe(count);

			for (const { box, center } of anchors) {
				expect(box.width).toBeGreaterThan(0);
				expect(box.height).toBeGreaterThan(0);
				expect(box.x).toBeGreaterThanOrEqual(viewBox.x);
				expect(box.y).toBeGreaterThanOrEqual(viewBox.y);
				expect(box.x + box.width).toBeLessThanOrEqual(
					viewBox.x + viewBox.width,
				);
				expect(box.y + box.height).toBeLessThanOrEqual(
					viewBox.y + viewBox.height,
				);
				expect(center).toEqual({
					x: box.x + box.width / 2,
					y: box.y + box.height / 2,
				});
			}
		},
	);

	it("matches the bounding boxes measured by a browser", () => {
		// Reference values from Chrome's getBBox() and getCTM() for the rendered SVG.
		const permanentArch = anchorMap(getToothAnchors("permanent", "arch"));
		const tooth17 = permanentArch.get("17")?.box;

		expect(tooth17?.x).toBeCloseTo(0.5431, 3);
		expect(tooth17?.y).toBeCloseTo(203.9899, 3);
		expect(tooth17?.width).toBeCloseTo(69.2445, 3);
		expect(tooth17?.height).toBeCloseTo(59.0711, 3);
	});

	it("mirrors the permanent arch left and right, and upper and lower", () => {
		const anchors = anchorMap(getToothAnchors("permanent", "arch"));
		const { width, height } = getLayoutViewBox("permanent", "arch");

		for (let position = 1; position <= 8; position += 1) {
			const upperRight = anchors.get(`1${position}`)!.center;
			const upperLeft = anchors.get(`2${position}`)!.center;
			const lowerRight = anchors.get(`4${position}`)!.center;

			expect(upperLeft.x).toBeCloseTo(width - upperRight.x, 6);
			expect(upperLeft.y).toBeCloseTo(upperRight.y, 6);
			expect(lowerRight.x).toBeCloseTo(upperRight.x, 6);
			expect(lowerRight.y).toBeCloseTo(height - upperRight.y, 6);
		}
	});

	it("applies the primary arch tooth offsets", () => {
		const anchors = anchorMap(getToothAnchors("primary", "arch"));
		const centralIncisors = [anchors.get("51")!.box, anchors.get("61")!.box];

		// 51 and 61 face each other across the midline without touching.
		expect(centralIncisors[0].x + centralIncisors[0].width).toBeLessThan(
			centralIncisors[1].x,
		);
	});

	it("classifies the arch of every quadrant", () => {
		for (const [dentition, layout] of combinations) {
			for (const { quadrant, arch } of getToothAnchors(dentition, layout)) {
				expect(arch).toBe([1, 2, 5, 6].includes(quadrant) ? "upper" : "lower");
			}
		}
	});

	it.each([
		["permanent", "horizontal"],
		["primary", "arch"],
		["primary", "horizontal"],
	] as const)("keeps %s %s teeth from overlapping", (dentition, layout) => {
		const anchors = getToothAnchors(dentition, layout);

		for (const [index, { box: a, toothId }] of anchors.entries()) {
			for (const { box: b, toothId: otherId } of anchors.slice(index + 1)) {
				const overlapX =
					Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
				const overlapY =
					Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

				expect(
					overlapX > 0.5 && overlapY > 0.5,
					`${toothId} overlaps ${otherId}`,
				).toBe(false);
			}
		}
	});

	it("returns the same cached anchors for repeated requests", () => {
		expect(getToothAnchors("primary", "arch")).toBe(
			getToothAnchors("primary", "arch"),
		);
	});
});

import { describe, expect, it } from "vitest";
import {
	primaryHorizontalGeometryStatus,
	primaryHorizontalTeethPaths,
} from "../../src/core/data/primary-horizontal";

describe("primary horizontal tooth dataset", () => {
	it("contains the five distinct provisional primary tooth shapes", () => {
		expect(primaryHorizontalTeethPaths).toHaveLength(5);
		expect(primaryHorizontalTeethPaths.map(({ position }) => position)).toEqual(
			[1, 2, 3, 4, 5],
		);
		expect(primaryHorizontalTeethPaths.map(({ type }) => type)).toEqual([
			"Primary Central Incisor",
			"Primary Lateral Incisor",
			"Primary Canine",
			"Primary First Molar",
			"Primary Second Molar",
		]);
	});

	it("keeps the horizontal paths independently renderable and provisional", () => {
		expect(
			primaryHorizontalTeethPaths.every(
				({ outlinePath, shadowPath }) =>
					outlinePath.startsWith("M") && shadowPath?.startsWith("M"),
			),
		).toBe(true);
		expect(
			primaryHorizontalTeethPaths.some(({ type }) => type.includes("Premolar")),
		).toBe(false);
		expect(primaryHorizontalTeethPaths[0].outlinePath).toBe(
			"M176 5C170 6 165 10 164 17c-1 8 1 18 4 25 3 7 7 12 12 15 4 2 10 2 14-1 6-5 10-13 12-22 1-7 1-14-2-19-4-7-12-11-18-10Z",
		);
		expect(
			primaryHorizontalTeethPaths.map(({ transform }) => transform),
		).toEqual([
			"translate(360.75 13.3) scale(-0.75 0.75)",
			"translate(36.75 10.5) scale(0.75)",
			"translate(24.75 10.25) scale(0.75)",
			"translate(19.5 11) scale(0.75)",
			"translate(4.5 11.25) scale(0.75)",
		]);
		expect(primaryHorizontalGeometryStatus).toEqual({
			status: "provisional",
			clinicallyValidated: false,
			intendedUse: "development-and-visual-review",
			source: "original-horizontal-prototype",
			scale: 0.75,
			targetGap: 12,
		});
	});
});

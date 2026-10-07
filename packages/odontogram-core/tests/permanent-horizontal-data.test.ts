import { describe, expect, it } from "vitest";
import { permanentHorizontalTeethPaths } from "../src/data/permanent-horizontal";

describe("permanent horizontal dataset", () => {
	it("contains one complete shape for every permanent position", () => {
		expect(permanentHorizontalTeethPaths).toHaveLength(8);
		expect(
			permanentHorizontalTeethPaths.map(({ position }) => position),
		).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	it("retains the eight permanent tooth types", () => {
		expect(permanentHorizontalTeethPaths.map(({ type }) => type)).toEqual([
			"Central Incisor",
			"Lateral Incisor",
			"Canine",
			"First Premolar",
			"Second Premolar",
			"First Molar",
			"Second Molar",
			"Third Molar",
		]);
	});
});

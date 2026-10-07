import { describe, expect, it } from "vitest";
import { primaryGeometryStatus, primaryTeethPaths } from "../src/data/primary";

describe("primary tooth dataset", () => {
	it("contains five provisional pediatric shapes in positions one through five", () => {
		expect(primaryTeethPaths).toHaveLength(5);
		expect(primaryTeethPaths.map(({ position }) => position)).toEqual([
			1, 2, 3, 4, 5,
		]);
	});

	it("models temporal molars explicitly instead of permanent premolars", () => {
		expect(primaryTeethPaths.map(({ type }) => type)).toEqual([
			"Primary Central Incisor",
			"Primary Lateral Incisor",
			"Primary Canine",
			"Primary First Molar",
			"Primary Second Molar",
		]);
		expect(
			primaryTeethPaths.some(({ type }) => type.includes("Premolar")),
		).toBe(false);
	});

	it("keeps every provisional shape renderable while retaining its warning", () => {
		expect(
			primaryTeethPaths.every(
				({ outlinePath, shadowPath }) =>
					outlinePath.startsWith("M") && shadowPath?.startsWith("M"),
			),
		).toBe(true);
		expect(primaryGeometryStatus).toEqual({
			status: "provisional",
			clinicallyValidated: false,
			intendedUse: "development-and-visual-review",
		});
	});
});

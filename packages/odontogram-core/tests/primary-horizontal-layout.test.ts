import { describe, expect, it } from "vitest";
import { primaryHorizontalLayoutDefinition } from "../src/utils/primary-horizontal-layout";

describe("primary horizontal layout", () => {
	it("defines an independent horizontal viewBox and primary quadrant order", () => {
		expect(primaryHorizontalLayoutDefinition.layout).toBe("horizontal");
		expect(primaryHorizontalLayoutDefinition.viewBox).toBe("0 0 520 180");
		expect(primaryHorizontalLayoutDefinition.provisional).toBe(true);
		expect(
			primaryHorizontalLayoutDefinition.quadrants.map(
				({ quadrant }) => quadrant,
			),
		).toEqual([5, 6, 8, 7]);
	});

	it("uses its own horizontal and vertical reflection transforms", () => {
		expect(primaryHorizontalLayoutDefinition.quadrants).toEqual([
			{ quadrant: 5, transform: "translate(0, 105)" },
			{ quadrant: 6, transform: "translate(520, 105) scale(-1, 1)" },
			{ quadrant: 8, transform: "translate(0, 75) scale(1, -1)" },
			{ quadrant: 7, transform: "translate(520, 75) scale(-1, -1)" },
		]);
	});
});

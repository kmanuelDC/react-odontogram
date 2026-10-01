import { describe, expect, it } from "vitest";
import type {
	PrimaryToothType,
	ToothShape,
	ToothType,
} from "../../src/core/types/geometry";

const expectedPrimaryTypes: PrimaryToothType[] = [
	"Primary Central Incisor",
	"Primary Lateral Incisor",
	"Primary Canine",
	"Primary First Molar",
	"Primary Second Molar",
];

const primaryMolarContract = {
	position: 4,
	type: "Primary First Molar",
	outlinePath: "M0 0",
} satisfies ToothShape;

describe("primary geometry contract", () => {
	it("defines the five distinct primary tooth types", () => {
		expect(expectedPrimaryTypes).toHaveLength(5);
		expect(expectedPrimaryTypes).toContain("Primary First Molar");
		expect(expectedPrimaryTypes).toContain("Primary Second Molar");
	});

	it("allows a primary molar shape without reusing a permanent premolar type", () => {
		const type: ToothType = primaryMolarContract.type;

		expect(type).toBe("Primary First Molar");
	});
});

import { describe, expect, it } from "vitest";
import { buildToothId } from "../../src/core/utils/notation";

function buildIds(dentition: "permanent" | "primary"): string[] {
	const quadrants = dentition === "permanent" ? [1, 2, 3, 4] : [5, 6, 7, 8];
	const positions = dentition === "permanent" ? 8 : 5;

	return quadrants.flatMap((quadrant) =>
		Array.from({ length: positions }, (_, index) =>
			buildToothId(dentition, quadrant, index + 1, "FDI"),
		),
	);
}

describe("dentition FDI counts", () => {
	it("defines 32 permanent teeth", () => {
		expect(buildIds("permanent")).toHaveLength(32);
	});

	it("defines 20 primary teeth", () => {
		expect(buildIds("primary")).toHaveLength(20);
	});
});

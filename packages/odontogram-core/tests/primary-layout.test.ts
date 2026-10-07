import { describe, expect, it } from "vitest";
import {
	mirrorPrimaryQuadrant,
	primaryArchLayoutDefinition,
} from "../src/utils/primary-layout";

describe("primary arch layout", () => {
	it("uses an independent compact viewBox and FDI quadrant order", () => {
		expect(primaryArchLayoutDefinition.layout).toBe("arch");
		expect(primaryArchLayoutDefinition.viewBox).toBe("0 0 409 461");
		expect(
			primaryArchLayoutDefinition.quadrants.map(({ quadrant }) => quadrant),
		).toEqual([5, 6, 8, 7]);
	});

	it("mirrors the upper quadrants vertically to preserve the lower arch size and curvature", () => {
		expect(mirrorPrimaryQuadrant(409, 461)).toBe(
			"scale(1, -1) translate(0, -461)",
		);
		expect(mirrorPrimaryQuadrant(409, 461, true)).toBe(
			"scale(-1, -1) translate(-409, -461)",
		);
		expect(primaryArchLayoutDefinition.quadrants).toEqual([
			{ quadrant: 5, transform: "" },
			{ quadrant: 6, transform: "scale(-1, 1) translate(-409, 0)" },
			{ quadrant: 8, transform: mirrorPrimaryQuadrant(409, 461) },
			{ quadrant: 7, transform: mirrorPrimaryQuadrant(409, 461, true) },
		]);
	});
});

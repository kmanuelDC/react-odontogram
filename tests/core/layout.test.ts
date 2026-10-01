import { describe, expect, it } from "vitest";
import {
	getLayoutDefinition,
	layoutDefinitions,
} from "../../src/core/utils/layout";

describe("layout definitions", () => {
	it.each([
		["arch", "0 0 409 694"],
		["horizontal", "0 0 900 150"],
	] as const)(
		"%s defines its own viewBox and four quadrants",
		(layout, viewBox) => {
			const definition = getLayoutDefinition(layout);

			expect(definition.viewBox).toBe(viewBox);
			expect(definition.quadrants.map(({ quadrant }) => quadrant)).toEqual([
				1, 2, 4, 3,
			]);
		},
	);

	it("keeps original horizontal transforms intact", () => {
		expect(layoutDefinitions.horizontal.quadrants).toEqual([
			{ quadrant: 1, transform: "" },
			{
				quadrant: 2,
				transform: "translate(840, 0) scale(-1, 1) translate(-55,0)",
			},
			{ quadrant: 4, transform: "scale(1, -1) translate(0, -150)" },
			{
				quadrant: 3,
				transform: "translate(840, 0) scale(-1, -1) translate(-55,-150)",
			},
		]);
	});
});

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { getSurfaceAxes } from "../../src/core/utils/surfaces";

describe("getSurfaceAxes", () => {
	it.each([
		["16", -1, 1],
		["21", -1, -1],
		["36", 1, -1],
		["44", 1, 1],
		["55", -1, 1],
		["74", 1, -1],
	])(
		"orients %s like the horizontal chart",
		(toothId, vestibularY, mesialX) => {
			expect(getSurfaceAxes(toothId)).toEqual({
				vestibular: { x: 0, y: vestibularY },
				mesial: { x: mesialX, y: 0 },
			});
		},
	);
});

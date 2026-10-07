import {
	layoutDefinitions,
	permanentHorizontalTeethPaths,
	permanentTeethPaths,
} from "@kmanueldc/odontogram-core";
import { describe, expect, it } from "vitest";
import {
	NewTeethPaths,
	oldquadrants,
	quadrants,
	teethPaths,
} from "./fixtures/legacy-data";

describe.each([
	["arch", permanentTeethPaths, teethPaths, oldquadrants],
	["horizontal", permanentHorizontalTeethPaths, NewTeethPaths, quadrants],
] as const)("core %s layout", (layout, core, legacy, legacyQuadrants) => {
	it("keeps the legacy permanent paths verbatim", () => {
		expect(core).toHaveLength(legacy.length);

		for (const [index, tooth] of legacy.entries()) {
			expect(core[index]).toMatchObject({
				position: Number(tooth.name),
				type: tooth.type,
				outlinePath: tooth.outlinePath,
				shadowPath: tooth.shadowPath,
				lineHighlightPath: tooth.lineHighlightPath,
			});
		}
	});

	it("keeps the legacy quadrant transforms and render order", () => {
		expect(
			layoutDefinitions[layout].quadrants.map(({ quadrant, transform }) => ({
				prefix: String(quadrant),
				transform,
			})),
		).toEqual(
			legacyQuadrants.map(({ prefix, transform }) => ({ prefix, transform })),
		);
	});
});

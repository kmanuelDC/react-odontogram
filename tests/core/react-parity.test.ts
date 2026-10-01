import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { permanentTeethPaths } from "../../src/core/data/permanent";
import { permanentHorizontalTeethPaths } from "../../src/core/data/permanent-horizontal";
import {
	NewTeethPaths as legacyNewTeethPaths,
	oldquadrants as legacyOldquadrants,
	quadrants as legacyQuadrants,
	teethPaths as legacyTeethPaths,
} from "../../src/legacy";
import {
	NewTeethPaths,
	oldquadrants,
	quadrants,
	teethPaths,
} from "../fixtures/legacy-data";

const coreDir = resolve(__dirname, "../../src/core");

function filesIn(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? filesIn(path) : [path];
	});
}

describe.each([
	["arch", permanentTeethPaths, teethPaths],
	["horizontal", permanentHorizontalTeethPaths, NewTeethPaths],
] as const)("core %s dataset", (_layout, core, legacy) => {
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
});

describe("src/legacy (React Native until R19)", () => {
	it("rebuilds the 0.5.8 data and quadrants from the core", () => {
		expect(legacyTeethPaths).toEqual(teethPaths);
		expect(legacyNewTeethPaths).toEqual(NewTeethPaths);
		expect(legacyQuadrants).toEqual(quadrants);
		expect(legacyOldquadrants).toEqual(oldquadrants);
	});
});

describe("src/core", () => {
	it("does not depend on React or any other package", () => {
		const imports = filesIn(coreDir).flatMap((file) =>
			[...readFileSync(file, "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map(
				([, source]) => source,
			),
		);

		expect(imports.length).toBeGreaterThan(0);
		expect(imports.filter((source) => !source.startsWith("."))).toEqual([]);
	});
});

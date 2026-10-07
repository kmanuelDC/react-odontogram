import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const srcDir = resolve(__dirname, "../src");

function filesIn(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? filesIn(path) : [path];
	});
}

describe("@kmanueldc/odontogram-core", () => {
	it("does not depend on React, Vue or any other package", () => {
		const imports = filesIn(srcDir).flatMap((file) =>
			[...readFileSync(file, "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map(
				([, source]) => source,
			),
		);

		expect(imports.length).toBeGreaterThan(0);
		expect(imports.filter((source) => !source.startsWith("."))).toEqual([]);
	});

	it("re-exports every module from its entry point", () => {
		const entry = readFileSync(join(srcDir, "index.ts"), "utf8");
		const modules = filesIn(srcDir)
			.filter((file) => file.endsWith(".ts"))
			.map((file) => `./${relative(srcDir, file).split(sep).join("/")}`)
			.map((path) => path.replace(/\.ts$/, ""))
			.filter((path) => path !== "./index" && path !== "./data/index");

		for (const path of modules) {
			expect(entry).toContain(`export * from "${path}";`);
		}
	});
});

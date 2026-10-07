import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	target: "es2020",
	sourcemap: true,
	clean: true,
	dts: true,
	splitting: false,
	format: ["cjs", "esm"],
});

import { type Options, defineConfig } from "tsup";

const common: Options = {
	entry: ["src/index.ts"],
	// Explicit: otherwise tsup would take tsconfig's ES2020 target.
	target: "node16",
	treeshake: false,
	sourcemap: "inline",
	minify: true,
	clean: true,
	// The core is bundled (code and types): react-odontogram has no runtime
	// dependency on @kmanueldc/odontogram-core.
	dts: { resolve: true },
	noExternal: ["@kmanueldc/odontogram-core"],
	splitting: false,
	format: ["cjs", "esm"],
	external: ["react"],
	injectStyle: false,
};

export default defineConfig(common);

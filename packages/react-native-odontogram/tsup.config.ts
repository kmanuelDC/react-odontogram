import { type Options, defineConfig } from "tsup";

const common: Options = {
	entry: ["src/index.tsx"],
	treeshake: false,
	sourcemap: "inline",
	minify: true,
	clean: true,
	dts: { resolve: true },
	splitting: false,
	format: ["cjs", "esm"],
	external: ["react", "react-native", "react-native-svg"],
	// The core and the shared React code of ../../src are bundled.
	noExternal: ["@kmanueldc/odontogram-core"],
	injectStyle: false,
};

export default defineConfig(common);

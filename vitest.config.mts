import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			// The core is consumed from source, as in tsconfig.json `paths`.
			"@kmanueldc/odontogram-core": fileURLToPath(
				new URL("./packages/odontogram-core/src/index.ts", import.meta.url),
			),
			"react-native-svg": fileURLToPath(
				new URL("./tests/mocks/react-native-svg.tsx", import.meta.url),
			),
		},
	},
	test: {
		environment: "jsdom",
		setupFiles: fileURLToPath(new URL("./tests/setup.ts", import.meta.url)),
		passWithNoTests: true,
		coverage: {
			include: ["{src,tests,packages/*/src,packages/*/tests}/**/*"],
		},
	},
});

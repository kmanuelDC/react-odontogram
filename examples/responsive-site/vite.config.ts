import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The app imports the library from ../../src, which would resolve its own
// copy of React from the repository root: keep a single React.
export default defineConfig({
	plugins: [react()],
	resolve: {
		dedupe: ["react", "react-dom"],
		// The library consumes the core from source.
		alias: {
			"@kmanueldc/odontogram-core": fileURLToPath(
				new URL("../../packages/odontogram-core/src/index.ts", import.meta.url),
			),
		},
	},
});

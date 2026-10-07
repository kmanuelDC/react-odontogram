import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-webpack5";

// The core is consumed from source, as in tsconfig.json `paths`.
const coreEntry = fileURLToPath(
	new URL("../packages/odontogram-core/src/index.ts", import.meta.url),
);

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],

	addons: [
		"@storybook/addon-a11y",
		"@storybook/addon-links",
		"@storybook/addon-webpack5-compiler-swc",
		"@storybook/addon-themes",
		"@storybook/addon-docs",
	],

	framework: {
		name: "@storybook/react-webpack5",
		options: {
			builder: {
				useSWC: true,
			},
		},
	},

	webpackFinal: (webpackConfig) => {
		webpackConfig.resolve ??= {};
		webpackConfig.resolve.alias = {
			...webpackConfig.resolve.alias,
			"@kmanueldc/odontogram-core": coreEntry,
		};
		return webpackConfig;
	},

	swc: () => ({
		jsc: {
			transform: {
				react: {
					runtime: "automatic",
				},
			},
		},
	}),
};
export default config;

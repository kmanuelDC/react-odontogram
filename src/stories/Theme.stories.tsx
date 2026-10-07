import type { Meta, StoryObj } from "@storybook/react-webpack5";
import type { CSSProperties } from "react";
import Odontogram from "../Odontogram";
import type { OdontogramFinding } from "../type";

const findings: OdontogramFinding[] = [
	{ code: "caries", teeth: ["16"], surfaces: ["occlusal"] },
	{ code: "crown", teeth: ["21"] },
	{ code: "extraction", teeth: ["38"], status: "planned" },
];

const meta = {
	component: Odontogram,
	title: "Components/Theme",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Theme variables. The vue-odontogram names (`--odontogram-stroke-color`, `--odontogram-selected-color`, `--odontogram-hover-color`, `--odontogram-selected-stroke-color`, `--odontogram-focus-outline-color`, `--odontogram-accent-color`, and the per-part ones) are the main API; `theme`, `colors`, `selectedColor` and `hoverColor` are shortcuts, and the 0.5.x `--dark-blue`/`--base-blue`/`--light-blue` stay as fallbacks.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div
				style={{ width: "min(720px, calc(100vw - 32px))", margin: "0 auto" }}
			>
				<Story />
			</div>
		),
	],
	args: {
		idFormat: "fdi",
		layout: "horizontal",
		showSurfaces: true,
		showLabels: true,
		findings,
		defaultValue: ["11", "26"],
		defaultSurfaces: { 36: ["mesial", "occlusal"] },
	},
	argTypes: {
		theme: { control: "radio", options: ["light", "dark"] },
		selectedColor: { control: "color" },
		hoverColor: { control: "color" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The shortcut props, as in 0.5.x. */
export const ShortcutProps: Story = {
	args: {
		selectedColor: "#fde68a",
		hoverColor: "#bbf7d0",
		colors: { darkBlue: "#b45309", baseBlue: "#78716c" },
	},
};

/** The vue-odontogram variables, set from the app's CSS (here inline). */
export const CssVariables: Story = {
	args: {
		styles: {
			"--odontogram-stroke-color": "#0f766e",
			"--odontogram-selected-color": "#ccfbf1",
			"--odontogram-accent-color": "#0d9488",
			"--odontogram-surface-fill": "#f0fdfa",
			"--odontogram-finding-good-color": "#4f46e5",
		} as CSSProperties,
	},
};

export const Dark: Story = {
	args: { theme: "dark" },
	decorators: [
		(Story) => (
			<div style={{ padding: 16, background: "#0b0d1a", borderRadius: 8 }}>
				<Story />
			</div>
		),
	],
};

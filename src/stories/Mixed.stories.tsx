import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";

const provisionalNotice =
	"Primary tooth shapes are provisional: approximations for visual development, not clinically validated anatomy.";

/** A child of about eight: permanent first molars and incisors, primary canines and molars. */
const earlyMixedTeeth = [
	"16",
	"12",
	"11",
	"21",
	"22",
	"26",
	"55",
	"54",
	"53",
	"63",
	"64",
	"65",
	"46",
	"42",
	"41",
	"31",
	"32",
	"36",
	"85",
	"84",
	"83",
	"73",
	"74",
	"75",
];

const meta = {
	component: Odontogram,
	title: "Components/Mixed Dentition",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `Mixed dentition: the 32 permanent and 20 primary teeth in four rows, each with its own shape and FDI ID. \`teeth\` lists the teeth present. ${provisionalNotice}`,
			},
		},
	},
	decorators: [
		(Story, { args }) => (
			// Same frame as the primary stories: wider for the horizontal rows,
			// narrower for the tall mixed arch (409 × 694).
			<div
				style={{
					display: "grid",
					gap: 12,
					width: `min(${args.layout === "arch" ? 400 : 640}px, calc(100vw - 32px))`,
					margin: "0 auto",
				}}
			>
				<p
					role="note"
					style={{
						margin: 0,
						padding: "8px 12px",
						borderRadius: 6,
						background: "#fff7e6",
						color: "#7a4b00",
						fontFamily: "sans-serif",
						fontSize: 13,
					}}
				>
					{provisionalNotice}
				</p>
				<Story />
			</div>
		),
	],
	args: {
		dentition: "mixed",
		layout: "horizontal",
		idFormat: "fdi",
	},
	argTypes: {
		dentition: {
			control: "radio",
			options: ["permanent", "primary", "mixed"],
		},
		layout: { control: "radio", options: ["arch", "horizontal"] },
		notation: { control: "radio", options: ["FDI", "Universal", "Palmer"] },
		showHalf: { control: "radio", options: ["full", "upper", "lower"] },
		singleSelect: { control: "boolean" },
		onChange: { action: "changed" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
	args: { defaultValue: ["16", "55", "54"] },
};

export const Arch: Story = {
	args: { layout: "arch", defaultValue: ["16", "55", "54"] },
};

export const PresentTeeth: Story = {
	args: { teeth: earlyMixedTeeth },
};

export const WithConditions: Story = {
	args: {
		teeth: earlyMixedTeeth,
		showLabels: true,
		disabled: true,
		conditions: [
			{
				label: "Caries",
				teeth: ["55", "84", "16"],
				fillColor: "#ef4444",
				outlineColor: "#b91c1c",
			},
			{
				label: "Observation",
				teeth: ["63"],
				fillColor: "#fbbf24",
				outlineColor: "#b45309",
			},
		],
	},
};

export const UpperHalf: Story = {
	args: { showHalf: "upper" },
};

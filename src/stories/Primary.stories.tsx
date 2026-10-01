import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";

const provisionalNotice =
	"Primary tooth shapes are provisional: approximations for visual development, not clinically validated anatomy.";

const meta = {
	component: Odontogram,
	title: "Components/Primary Dentition",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: `Primary dentition: 20 teeth, FDI 51–55, 61–65, 71–75 and 81–85. ${provisionalNotice}`,
			},
		},
	},
	decorators: [
		(Story) => (
			// The chart needs a width; `margin: auto` centers it, since the
			// Storybook root spans the full width even in the centered layout.
			<div
				style={{
					display: "grid",
					gap: 12,
					width: "min(520px, calc(100vw - 32px))",
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
		dentition: "primary",
		layout: "arch",
		idFormat: "fdi",
	},
	argTypes: {
		dentition: { control: "radio", options: ["permanent", "primary"] },
		layout: { control: "radio", options: ["arch", "horizontal"] },
		notation: { control: "radio", options: ["FDI", "Universal", "Palmer"] },
		showHalf: { control: "radio", options: ["full", "upper", "lower"] },
		singleSelect: { control: "boolean" },
		onChange: { action: "changed" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Arch: Story = {
	args: { defaultValue: ["51", "52", "65"] },
};

export const Horizontal: Story = {
	args: { layout: "horizontal", defaultValue: ["51", "52", "65"] },
};

export const WithConditions: Story = {
	args: {
		showLabels: true,
		disabled: true,
		conditions: [
			{
				label: "Caries",
				teeth: ["54", "64", "75"],
				fillColor: "#ef4444",
				outlineColor: "#b91c1c",
			},
			{
				label: "Observation",
				teeth: ["65"],
				fillColor: "#fbbf24",
				outlineColor: "#b45309",
			},
		],
	},
};

export const UpperHalf: Story = {
	args: { showHalf: "upper" },
};

export const LowerHalf: Story = {
	args: { showHalf: "lower" },
};

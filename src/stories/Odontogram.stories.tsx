import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";

const meta = {
	component: Odontogram,
	title: "Read Only Odontogram",

	args: {
		showTooltip: false,
		layout: "arch",
		disabled: true,
		showLabels: true,
		styles: {
			maxWidth: "300px",
		},
	},

	argTypes: {
		conditions: { control: "object" },
		showTooltip: { control: "boolean" },
		disabled: { control: "boolean" },
		showLabels: { control: "boolean" },
		layout: { control: "select", options: ["arch", "horizontal"] },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

const Wrapper = (args: any) => (
	<div
		style={{
			display: "flex",
			flexDirection: "column",
			gap: 24,
			alignItems: "center",
			justifyContent: "center",
			flexWrap: "wrap",
		}}
	>
		<Odontogram {...args} />
	</div>
);

/* ------------------ STORIES ------------------ */

export const Default: Story = {
	render: Wrapper,
	args: {
		conditions: [
			{
				label: "yellowing",
				teeth: ["11", "12", "13"],
				fillColor: "#fde047",
				outlineColor: "#ca8a04",
			},
			{
				label: "caries",
				teeth: ["16", "26"],
				fillColor: "#ef4444",
				outlineColor: "#ef4444",
			},
		],
	},
};

export const DefaultSquare: Story = {
	render: Wrapper,
	args: {
		layout: "horizontal",
		styles: {
			maxWidth: "800px",
		},
		conditions: [
			{
				label: "yellowing",
				teeth: ["11", "12", "13"],
				fillColor: "#fde047",
				outlineColor: "#ca8a04",
			},
			{
				label: "caries",
				teeth: ["16", "26"],
				fillColor: "#ef4444",
				outlineColor: "#ef4444",
			},
		],
	},
};

export const NoConditions: Story = {
	render: Wrapper,
	args: {
		conditions: [],
		showLabels: false,
	},
};

export const FullMouthCaries: Story = {
	render: Wrapper,
	args: {
		conditions: [
			{
				label: "caries",
				teeth: Array.from({ length: 32 }, (_, i) => String(i + 1)),
				fillColor: "#ef4444",
				outlineColor: "#b91c1c",
			},
		],
	},
};

export const MixedConditions: Story = {
	render: Wrapper,
	args: {
		conditions: [
			{
				label: "caries",
				teeth: ["16", "17", "36", "37"],
				fillColor: "#ef4444",
				outlineColor: "#b91c1c",
			},
			{
				label: "filling",
				teeth: ["14", "24"],
				fillColor: "#60a5fa",
				outlineColor: "#2563eb",
			},
			{
				label: "missing",
				teeth: ["18", "28"],
				fillColor: "#e5e7eb",
				outlineColor: "#6b7280",
			},
		],
	},
};

export const SquareLayout: Story = {
	render: Wrapper,
	args: {
		layout: "horizontal",
		styles: {
			maxWidth: "800px",
		},
		conditions: [
			{
				label: "yellowing",
				teeth: ["31", "32", "33"],
				fillColor: "#fde047",
				outlineColor: "#ca8a04",
			},
		],
	},
};

export const ReadWriteMode: Story = {
	render: Wrapper,
	args: {
		disabled: false,
		showTooltip: true,
		conditions: [
			{
				label: "selected",
				teeth: ["21"],
				fillColor: "#34d399",
				outlineColor: "#059669",
			},
		],
	},
};

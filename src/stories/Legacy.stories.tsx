import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";

const meta = {
	component: Odontogram,
	title: "Components/Legacy API (0.5.x)",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					'The 0.5.x props still work and warn once in development: `layout="circle" | "square"` (use `arch` / `horizontal`), `teethConditions` (use `conditions`), `maxTeeth` (use `dentition="primary"` for primary teeth), `defaultSelected` and `readOnly` (aliases of `defaultValue` and `disabled`). IDs may be `teeth-11` or `11`; `onChange` and the form input keep `teeth-11` unless `idFormat="fdi"`. They are removed in 1.0.',
			},
		},
	},
	decorators: [
		(Story) => (
			<div
				style={{ width: "min(420px, calc(100vw - 32px))", margin: "0 auto" }}
			>
				<Story />
			</div>
		),
	],
	argTypes: {
		onChange: { action: "changed" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Circle: Story = {
	args: {
		layout: "circle",
		defaultSelected: ["teeth-11", "teeth-21"],
		showLabels: true,
		teethConditions: [
			{
				label: "caries",
				teeth: ["teeth-16", "teeth-26"],
				fillColor: "#ef4444",
				outlineColor: "#b91c1c",
			},
		],
	},
};

export const SquareReadOnly: Story = {
	args: {
		layout: "square",
		readOnly: true,
		defaultSelected: ["teeth-36"],
	},
	decorators: [
		(Story) => (
			<div style={{ width: "min(640px, calc(100vw - 32px))" }}>
				<Story />
			</div>
		),
	],
};

/** `maxTeeth` cuts each quadrant; it does not draw primary teeth. */
export const MaxTeeth: Story = {
	args: { maxTeeth: 5 },
};

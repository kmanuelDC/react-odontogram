import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";
import type { OdontogramDentition, OdontogramProps } from "../type";

const dentitions: OdontogramDentition[] = ["permanent", "primary", "mixed"];
const layouts = ["arch", "horizontal"] as const;

/** Every dentition in every layout, with the same props. */
function Matrix(props: OdontogramProps) {
	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
				gap: 16,
				width: "min(1100px, calc(100vw - 32px))",
				fontFamily: "sans-serif",
				fontSize: 13,
			}}
		>
			{dentitions.flatMap((dentition) =>
				layouts.map((layout) => (
					<figure
						key={`${dentition}-${layout}`}
						style={{
							display: "grid",
							gap: 8,
							alignContent: "start",
							margin: 0,
							padding: 12,
							border: "1px solid #e2e8f0",
							borderRadius: 8,
						}}
					>
						<figcaption style={{ color: "#475569" }}>
							{dentition} · {layout}
						</figcaption>
						<Odontogram {...props} dentition={dentition} layout={layout} />
					</figure>
				)),
			)}
		</div>
	);
}

const meta = {
	component: Odontogram,
	title: "Overview",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"The three dentitions (`permanent`, `primary`, `mixed`) in both layouts (`arch`, `horizontal`). Primary tooth shapes are provisional, not clinically validated.",
			},
		},
	},
	render: (args) => <Matrix {...args} />,
	args: {
		idFormat: "fdi",
		showTooltip: false,
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DentitionsAndLayouts: Story = {};

export const WithNumbersAndSurfaces: Story = {
	args: { showNumbers: true, showSurfaces: true },
};

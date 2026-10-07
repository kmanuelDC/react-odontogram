import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { useState } from "react";
import Odontogram from "../Odontogram";
import type { OdontogramSurfaces } from "../type";

const meta = {
	component: Odontogram,
	title: "Components/Surfaces",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Five-surface diagrams (`showSurfaces`): one checkbox per surface, with clinical names (incisal on incisors and canines, palatal on upper teeth). Surfaces have their own selection (`surfaces`/`defaultSurfaces`/`onSurfacesChange`), a single tab stop (left/right between teeth, up/down between surfaces) and their own tooltip. Missing and extracted teeth have no surfaces to select.",
			},
		},
	},
	decorators: [
		(Story, { args }) => (
			<div
				style={{
					width: `min(${args.layout === "horizontal" ? 720 : 460}px, calc(100vw - 32px))`,
					margin: "0 auto",
				}}
			>
				<Story />
			</div>
		),
	],
	args: {
		idFormat: "fdi",
		showSurfaces: true,
		defaultSurfaces: {
			16: ["occlusal", "mesial"],
			11: ["vestibular"],
			36: ["distal"],
		},
	},
	argTypes: {
		dentition: {
			control: "radio",
			options: ["permanent", "primary", "mixed"],
		},
		layout: { control: "radio", options: ["arch", "horizontal"] },
		surfaceShape: { control: "radio", options: ["square", "circle"] },
		showHalf: { control: "radio", options: ["full", "upper", "lower"] },
		onSurfacesChange: { action: "surfaces changed" },
		onSurfaceClick: { action: "surface clicked" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Arch: Story = {};

export const Horizontal: Story = {
	args: { layout: "horizontal" },
};

export const Circle: Story = {
	args: { layout: "horizontal", surfaceShape: "circle" },
};

export const Letters: Story = {
	args: { layout: "horizontal", showSurfaceLetters: true, showNumbers: true },
};

export const WithToothStates: Story = {
	args: {
		layout: "horizontal",
		toothStates: { 18: "extracted", 28: "missing", 46: "implant" },
		showLabels: true,
	},
};

export const Primary: Story = {
	args: { dentition: "primary", defaultSurfaces: { 54: ["occlusal"] } },
};

export const MixedHorizontal: Story = {
	args: {
		dentition: "mixed",
		layout: "horizontal",
		defaultSurfaces: { 16: ["occlusal"], 55: ["distal"] },
	},
};

/** The app keeps the surfaces in its state and shows them below the chart. */
export const Controlled: Story = {
	args: { layout: "horizontal" },
	render: function ControlledSurfaces(args) {
		const [surfaces, setSurfaces] = useState<OdontogramSurfaces>({
			26: ["occlusal"],
		});
		return (
			<div style={{ display: "grid", gap: 12 }}>
				<Odontogram
					{...args}
					surfaces={surfaces}
					onSurfacesChange={setSurfaces}
				/>
				<pre style={{ margin: 0, fontSize: 12 }}>
					{JSON.stringify(surfaces)}
				</pre>
			</div>
		);
	},
};

import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { useState } from "react";
import Odontogram from "../Odontogram";
import { SurfaceGuide } from "../SurfaceGuide";
import type {
	OdontogramFinding,
	OdontogramSurfaces,
	ToothSurface,
} from "../type";

const findings: OdontogramFinding[] = [
	{ code: "caries", teeth: ["16", "36"], surfaces: ["occlusal"] },
	{
		code: "restoration",
		teeth: ["16"],
		surfaces: ["occlusal", "mesial"],
		status: "planned",
	},
	{ code: "crown", teeth: ["21"] },
];

const meta = {
	component: SurfaceGuide,
	title: "Components/Surface Guide",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"`SurfaceGuide`: a large five-surface diagram of one tooth with the name, definition and findings of each surface, oriented like the horizontal chart (vestibular out, mesial toward the midline). Pass the chart's `findings` and the tooth's `surfaces` as `selected`.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div
				style={{ width: "min(640px, calc(100vw - 32px))", margin: "0 auto" }}
			>
				<Story />
			</div>
		),
	],
	args: {
		toothId: "16",
		findings,
		selected: ["occlusal"],
	},
	argTypes: {
		shape: { control: "radio", options: ["square", "circle"] },
		notation: { control: "radio", options: ["FDI", "Universal", "Palmer"] },
		active: {
			control: "select",
			options: [
				undefined,
				"vestibular",
				"mesial",
				"occlusal",
				"distal",
				"lingual",
			],
		},
		onSurfaceClick: { action: "surface clicked" },
		onActiveChange: { action: "active changed" },
	},
} satisfies Meta<typeof SurfaceGuide>;

export default meta;

type Story = StoryObj<typeof meta>;

export const UpperMolar: Story = {};

export const Incisor: Story = {
	args: { toothId: "11", selected: [], active: "occlusal" },
};

export const Circle: Story = {
	args: { shape: "circle" },
};

export const DiagramOnly: Story = {
	args: { showList: false },
	decorators: [
		(Story) => (
			<div style={{ width: 160 }}>
				<Story />
			</div>
		),
	],
};

/**
 * The guide follows the chart: the last clicked tooth or surface is
 * explained, and both share the selected surfaces.
 */
export const WithChart: Story = {
	render: function GuideWithChart(args) {
		const [surfaces, setSurfaces] = useState<OdontogramSurfaces>({
			16: ["occlusal"],
		});
		const [toothId, setToothId] = useState("16");
		const toggle = (surface: ToothSurface) => {
			const current = new Set(surfaces[toothId] ?? []);
			if (current.has(surface)) {
				current.delete(surface);
			} else {
				current.add(surface);
			}
			setSurfaces({ ...surfaces, [toothId]: [...current] });
		};

		return (
			<div style={{ display: "grid", gap: 16 }}>
				<Odontogram
					idFormat="fdi"
					layout="horizontal"
					showSurfaces={true}
					findings={findings}
					surfaces={surfaces}
					onSurfacesChange={setSurfaces}
					onSurfaceClick={(tooth) => setToothId(tooth.id)}
					singleSelect={true}
					onChange={([tooth]) => tooth && setToothId(tooth.id)}
				/>
				<SurfaceGuide
					{...args}
					toothId={toothId}
					findings={findings}
					selected={surfaces[toothId] ?? []}
					onSurfaceClick={toggle}
				/>
			</div>
		);
	},
};

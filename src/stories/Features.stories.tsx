import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";
import type { OdontogramLabelsInput } from "../type";

const spanishLabels: OdontogramLabelsInput = {
	odontogram: "Odontograma",
	chartTitles: {
		permanent: "odontograma permanente",
		primary: "odontograma temporal",
		mixed: "odontograma mixto",
	},
	tooth: "Diente",
	type: "Tipo",
	condition: "Condición",
	legend: "Leyenda de condiciones",
	state: "Estado",
	states: {
		present: "Presente",
		missing: "Ausente",
		extracted: "Extraída",
		implant: "Implante",
		unerupted: "No erupcionada",
	},
	toothTypes: {
		"Central Incisor": "Incisivo central",
		"Lateral Incisor": "Incisivo lateral",
		// biome-ignore lint/style/useNamingConvention: the keys are ToothType values.
		Canine: "Canino",
		"First Premolar": "Primer premolar",
		"Second Premolar": "Segundo premolar",
		"First Molar": "Primer molar",
		"Second Molar": "Segundo molar",
		"Third Molar": "Tercer molar",
	},
};

const meta = {
	component: Odontogram,
	title: "Components/Features",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Numbers (`showNumbers`, `renderNumber`), keyboard navigation (one tab stop; arrows, Home and End move between teeth), `renderTooltip`, `labels` and tooth states (`toothStates`).",
			},
		},
	},
	decorators: [
		(Story, { args }) => (
			<div
				style={{
					width: `min(${args.layout === "horizontal" ? 640 : 420}px, calc(100vw - 32px))`,
					margin: "0 auto",
				}}
			>
				<Story />
			</div>
		),
	],
	args: {
		idFormat: "fdi",
		showNumbers: true,
	},
	argTypes: {
		dentition: {
			control: "radio",
			options: ["permanent", "primary", "mixed"],
		},
		layout: { control: "radio", options: ["arch", "horizontal"] },
		notation: { control: "radio", options: ["FDI", "Universal", "Palmer"] },
		showHalf: { control: "radio", options: ["full", "upper", "lower"] },
		onChange: { action: "changed" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Numbers: Story = {
	args: { defaultValue: ["11", "26"] },
};

export const PalmerNumbers: Story = {
	args: { layout: "horizontal", notation: "Palmer", defaultValue: ["16"] },
};

export const UniversalPrimary: Story = {
	args: { dentition: "primary", notation: "Universal" },
};

export const MixedNumbers: Story = {
	args: { dentition: "mixed", layout: "horizontal" },
};

export const UpperHalfNumbers: Story = {
	args: { showHalf: "upper" },
};

export const CustomTooltip: Story = {
	args: {
		showNumbers: false,
		conditions: [
			{
				label: "Caries",
				teeth: ["16", "26"],
				fillColor: "#ef4444",
				outlineColor: "#b91c1c",
			},
		],
		renderTooltip: ({ tooth, number, selected, condition }) => (
			<div>
				<strong>
					{tooth.type} {number}
				</strong>
				<div>{selected ? "Selected" : "Not selected"}</div>
				{condition && <div>{condition.label}</div>}
			</div>
		),
	},
};

export const SpanishLabels: Story = {
	args: {
		labels: spanishLabels,
		showLabels: true,
		conditions: [
			{
				label: "Caries",
				teeth: ["16", "36"],
				fillColor: "#ef4444",
				outlineColor: "#b91c1c",
			},
		],
	},
};

const toothStates = {
	18: "extracted",
	28: "missing",
	36: "implant",
	48: "unerupted",
	46: "extracted",
} as const;

export const ToothStates: Story = {
	args: { toothStates, showLabels: true, defaultValue: ["36"] },
};

export const ToothStatesHorizontal: Story = {
	args: {
		toothStates,
		showLabels: true,
		layout: "horizontal",
		labels: spanishLabels,
	},
};

export const MixedToothStates: Story = {
	args: {
		dentition: "mixed",
		layout: "horizontal",
		showLabels: true,
		toothStates: {
			55: "extracted",
			16: "unerupted",
			26: "unerupted",
			36: "implant",
		},
	},
};

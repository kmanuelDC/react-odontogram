import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";
import type { OdontogramFinding } from "../type";

/** Single-tooth and surface codes of the NTS Peru catalog, one per tooth. */
const toothCodes = [
	"caries",
	"restoration",
	"temporary-restoration",
	"extraction",
	"fracture",
	"crown",
	"temporary-crown",
	"extruded",
	"intruded",
	"rotated",
	"migrated",
	"erupting",
	"supernumerary",
	"fusion",
	"peg",
	"implant",
	"root-remnant",
	"mobility",
	"discolored",
	"ectopic",
	"impacted",
	"semi-impacted",
	"macrodontia",
	"microdontia",
	"worn",
	"pulp-treatment",
	"enamel-defect",
];

const permanentTeeth = [
	"18",
	"17",
	"16",
	"15",
	"14",
	"13",
	"12",
	"11",
	"21",
	"22",
	"23",
	"24",
	"25",
	"26",
	"27",
	"28",
	"48",
	"47",
	"46",
	"45",
	"44",
	"43",
	"42",
	"41",
	"31",
	"32",
	"33",
	"34",
	"35",
	"36",
	"37",
	"38",
];

const everyToothFinding: OdontogramFinding[] = toothCodes.map(
	(code, index) => ({
		code,
		teeth: [permanentTeeth[index]],
		...(code === "caries" || code === "restoration"
			? { surfaces: ["occlusal", "mesial"] as const }
			: {}),
	}),
) as OdontogramFinding[];

const groupFindings: OdontogramFinding[] = [
	{ code: "diastema", teeth: ["11", "21"] },
	{ code: "transposition", teeth: ["13", "14"] },
	{ code: "fixed-prosthesis", teeth: ["24", "26"] },
	{ code: "removable-prosthesis", teeth: ["34", "37"] },
	{ code: "fixed-orthodontic-appliance", teeth: ["43", "33"] },
	{ code: "removable-orthodontic-appliance", teeth: ["16", "18"] },
	{ code: "edentulous", teeth: ["45", "47"] },
];

const meta = {
	component: Odontogram,
	title: "Components/Findings",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Clinical findings and treatments (`findings`) from the NTS Peru catalog (`ntsPeruFindingCatalog`, the default `findingCatalog`). Blue is a good state or a completed treatment, red a bad state or a pending one; `status`, `tone` and `color` override it. The catalog is pending verification against the official norm.",
			},
		},
	},
	decorators: [
		(Story, { args }) => (
			<div
				style={{
					width: `min(${args.layout === "horizontal" ? 760 : 480}px, calc(100vw - 32px))`,
					margin: "0 auto",
				}}
			>
				<Story />
			</div>
		),
	],
	args: {
		idFormat: "fdi",
		layout: "horizontal",
		showLabels: true,
	},
	argTypes: {
		dentition: {
			control: "radio",
			options: ["permanent", "primary", "mixed"],
		},
		layout: { control: "radio", options: ["arch", "horizontal"] },
		surfaceShape: { control: "radio", options: ["square", "circle"] },
		onChange: { action: "changed" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EveryToothSymbol: Story = {
	args: { showSurfaces: true, findings: everyToothFinding },
};

export const BetweenAndSpan: Story = {
	args: { findings: groupFindings },
};

export const Arch: Story = {
	args: {
		layout: "arch",
		showSurfaces: true,
		findings: [
			{ code: "caries", teeth: ["16", "36"], surfaces: ["occlusal"] },
			{ code: "crown", teeth: ["21"] },
			{ code: "fixed-prosthesis", teeth: ["44", "46"] },
			{ code: "implant", teeth: ["26"] },
			{ code: "pulp-treatment", teeth: ["11"] },
		],
	},
};

export const StatusAndColor: Story = {
	args: {
		showSurfaces: true,
		findings: [
			{ code: "extraction", teeth: ["18"], status: "planned" },
			{ code: "crown", teeth: ["16"], status: "planned" },
			{ code: "crown", teeth: ["26"], status: "done" },
			{
				code: "restoration",
				teeth: ["36"],
				surfaces: ["occlusal"],
				status: "planned",
			},
			{ code: "restoration", teeth: ["46"], surfaces: ["occlusal"] },
			{ code: "fracture", teeth: ["11"], color: "#7c3aed" },
			{ code: "mobility", teeth: ["31"], label: "M2" },
			{ code: "migrated", teeth: ["24"], direction: "distal" },
		],
	},
};

export const CircleStrips: Story = {
	args: {
		showSurfaces: true,
		surfaceShape: "circle",
		findings: [
			{
				code: "caries",
				teeth: ["16", "26"],
				surfaces: ["vestibular", "occlusal"],
			},
			{ code: "restoration", teeth: ["16"], surfaces: ["vestibular"] },
			{ code: "temporary-restoration", teeth: ["26"], surfaces: ["occlusal"] },
		],
	},
};

export const Primary: Story = {
	args: {
		dentition: "primary",
		showSurfaces: true,
		findings: [
			{ code: "caries", teeth: ["54", "84"], surfaces: ["occlusal"] },
			{ code: "extraction", teeth: ["61"] },
			{ code: "crown", teeth: ["75"] },
		],
	},
};

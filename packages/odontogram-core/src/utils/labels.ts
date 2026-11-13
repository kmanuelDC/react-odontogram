import type {
	OdontogramLabels,
	OdontogramLabelsInput,
} from "../types/odontogram";

export const defaultOdontogramLabels: Readonly<OdontogramLabels> = {
	odontogram: "Odontogram",
	chartTitles: {
		permanent: "permanent odontogram",
		primary: "primary odontogram",
		mixed: "mixed odontogram",
	},
	tooth: "Tooth",
	type: "Type",
	selected: "Selected",
	yes: "Yes",
	no: "No",
	condition: "Condition",
	legend: "Tooth condition legend",
	toothTypes: {},
	state: "State",
	states: {
		present: "Present",
		missing: "Missing",
		extracted: "Extracted",
		implant: "Implant",
		unerupted: "Unerupted",
	},
	findings: "Findings",
	findingStatuses: {
		existing: "Existing",
		planned: "Planned",
		done: "Done",
	},
	findingLocations: { crown: "Crown", root: "Root" },
	surfaces: "Tooth surfaces",
	surface: "Surface",
	surfaceSummary: "Surfaces",
	surfaceNames: {
		vestibular: "Vestibular",
		mesial: "Mesial",
		occlusal: "Occlusal",
		incisal: "Incisal",
		distal: "Distal",
		lingual: "Lingual",
		palatal: "Palatal",
	},
	surfaceLetters: {
		vestibular: "V",
		mesial: "M",
		occlusal: "O",
		incisal: "I",
		distal: "D",
		lingual: "L",
		palatal: "P",
	},
	surfaceDescriptions: {
		vestibular: "Faces the lips or cheeks (outward).",
		mesial: "Closest to the midline of the mouth.",
		occlusal: "Chewing surface of molars and premolars.",
		incisal: "Cutting edge of incisors and canines.",
		distal: "Farthest from the midline of the mouth.",
		lingual: "Faces the tongue (lower teeth).",
		palatal: "Faces the palate (upper teeth).",
	},
	surfaceGuide: "Surface guide",
	surfaceMenu: "Surface findings",
	inspector: {
		title: "Tooth details",
		surfaceFindings: "Findings by surface",
		toothFindings: "Whole tooth",
		noFindings: "No findings",
		addFinding: "Add a finding",
		finding: "Finding",
		status: "Status",
		add: "Add",
		remove: "Remove",
		chooseSurfaces: "Choose the surfaces on the diagram.",
		onSurfaces: "On surfaces",
		onTooth: "On the whole tooth",
	},
};

/** Merges partial overrides, including nested maps, over the defaults. */
export function resolveOdontogramLabels(
	labels?: OdontogramLabelsInput,
): OdontogramLabels {
	return {
		...defaultOdontogramLabels,
		...labels,
		chartTitles: {
			...defaultOdontogramLabels.chartTitles,
			...labels?.chartTitles,
		},
		toothTypes: {
			...defaultOdontogramLabels.toothTypes,
			...labels?.toothTypes,
		},
		states: { ...defaultOdontogramLabels.states, ...labels?.states },
		surfaceNames: {
			...defaultOdontogramLabels.surfaceNames,
			...labels?.surfaceNames,
		},
		surfaceLetters: {
			...defaultOdontogramLabels.surfaceLetters,
			...labels?.surfaceLetters,
		},
		surfaceDescriptions: {
			...defaultOdontogramLabels.surfaceDescriptions,
			...labels?.surfaceDescriptions,
		},
		findingStatuses: {
			...defaultOdontogramLabels.findingStatuses,
			...labels?.findingStatuses,
		},
		findingLocations: {
			...defaultOdontogramLabels.findingLocations,
			...labels?.findingLocations,
		},
		inspector: { ...defaultOdontogramLabels.inspector, ...labels?.inspector },
	};
}

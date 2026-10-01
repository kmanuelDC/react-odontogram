import type { FindingCatalog } from "../types/findings";

/**
 * Findings based on Peru's technical health standard for the odontogram
 * (NTS N.° 150-MINSA/2019/DGIESP): blue (`good`) for good state or completed
 * treatment, red (`bad`) for bad state or pending treatment.
 *
 * Surface findings are drawn on the surface diagram, so they need
 * `showSurfaces`. Sealants and restoration materials, which the standard
 * writes as abbreviations inside the surface, are not included. Symbols are adapted to
 * the occlusal view of this chart, which has no roots: root findings use
 * their abbreviation. Review codes, colors and abbreviations against the
 * official standard before clinical use, and extend or override entries as
 * needed: `{ ...ntsPeruFindingCatalog, fracture: { ... } }`.
 */
export const ntsPeruFindingCatalog = {
	// Surfaces.
	caries: {
		name: "Lesión de caries dental",
		symbol: { kind: "fill" },
		tone: "bad",
	},
	restoration: {
		name: "Restauración definitiva",
		symbol: { kind: "fill" },
		tone: "good",
	},
	"temporary-restoration": {
		name: "Restauración temporal",
		symbol: { kind: "outline" },
		tone: "bad",
	},

	// Whole-tooth symbols.
	extraction: { name: "Extracción", symbol: { kind: "cross" }, tone: "bad" },
	fracture: { name: "Fractura", symbol: { kind: "line" }, tone: "bad" },
	crown: {
		name: "Corona definitiva",
		symbol: { kind: "circle" },
		tone: "good",
	},
	"temporary-crown": {
		name: "Corona temporal",
		symbol: { kind: "circle" },
		tone: "bad",
	},
	extruded: {
		name: "Diente extruido",
		symbol: { kind: "arrow", direction: "occlusal" },
		tone: "good",
	},
	intruded: {
		name: "Diente intruido",
		symbol: { kind: "arrow", direction: "apical" },
		tone: "good",
	},
	rotated: {
		name: "Giroversión",
		symbol: { kind: "curved-arrow" },
		tone: "good",
	},
	migrated: {
		name: "Migración",
		symbol: { kind: "arrow", direction: "auto" },
		tone: "good",
	},
	erupting: {
		name: "Pieza dentaria en erupción",
		symbol: { kind: "zigzag" },
		tone: "good",
	},
	supernumerary: {
		name: "Supernumerario",
		symbol: { kind: "encircled-text", text: "S" },
		tone: "good",
	},
	fusion: { name: "Fusión", symbol: { kind: "double-circle" }, tone: "good" },
	peg: {
		name: "Diente en clavija",
		symbol: { kind: "triangle" },
		tone: "good",
	},

	// Abbreviations.
	implant: {
		name: "Implante dental",
		symbol: { kind: "text", text: "IMP" },
		tone: "good",
	},
	"root-remnant": {
		name: "Remanente radicular",
		symbol: { kind: "text", text: "RR" },
		tone: "bad",
	},
	mobility: {
		name: "Movilidad",
		symbol: { kind: "text", text: "M1" },
		tone: "bad",
	},
	discolored: {
		name: "Diente discrómico",
		symbol: { kind: "text", text: "DIS" },
		tone: "bad",
	},
	ectopic: {
		name: "Diente ectópico",
		symbol: { kind: "text", text: "E" },
		tone: "bad",
	},
	impacted: {
		name: "Impactación",
		symbol: { kind: "text", text: "I" },
		tone: "bad",
	},
	"semi-impacted": {
		name: "Semi-impactación",
		symbol: { kind: "text", text: "SI" },
		tone: "bad",
	},
	macrodontia: {
		name: "Macrodoncia",
		symbol: { kind: "text", text: "MAC" },
		tone: "good",
	},
	microdontia: {
		name: "Microdoncia",
		symbol: { kind: "text", text: "MIC" },
		tone: "good",
	},
	worn: {
		name: "Superficie desgastada",
		symbol: { kind: "text", text: "DES" },
		tone: "bad",
	},
	"pulp-treatment": {
		name: "Tratamiento pulpar",
		symbol: { kind: "text", text: "TC" },
		tone: "good",
	},
	"enamel-defect": {
		name: "Defecto de desarrollo del esmalte",
		symbol: { kind: "text", text: "HP" },
		tone: "bad",
	},

	// Between two teeth.
	diastema: { name: "Diastema", symbol: { kind: "diastema" }, tone: "good" },
	transposition: {
		name: "Transposición",
		symbol: { kind: "transposition" },
		tone: "good",
	},

	// Across several teeth.
	"fixed-prosthesis": {
		name: "Prótesis fija",
		symbol: { kind: "bridge" },
		tone: "good",
	},
	"removable-prosthesis": {
		name: "Prótesis removible",
		symbol: { kind: "double-line" },
		tone: "good",
	},
	"complete-prosthesis": {
		name: "Prótesis total",
		symbol: { kind: "double-line" },
		tone: "good",
	},
	"fixed-orthodontic-appliance": {
		name: "Aparato ortodóntico fijo",
		symbol: { kind: "brackets" },
		tone: "good",
	},
	"removable-orthodontic-appliance": {
		name: "Aparato ortodóntico removible",
		symbol: { kind: "zigzag-line" },
		tone: "good",
	},
	edentulous: {
		name: "Edéntulo total",
		symbol: { kind: "center-line" },
		tone: "good",
	},
} as const satisfies FindingCatalog;

export type NtsPeruFindingCode = keyof typeof ntsPeruFindingCatalog;

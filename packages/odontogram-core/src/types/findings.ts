import type { ToothSurface } from "./surfaces";

/**
 * Default color of a finding. Following the common charting convention
 * (e.g. Peru's NTS odontogram standard): `good` is drawn in blue (good state
 * or completed treatment) and `bad` in red (bad state or pending).
 */
export type FindingTone = "good" | "bad";

/**
 * Where a finding stands in the treatment workflow. The library only draws it;
 * clinical rules (what can be planned, when it is done) belong to the app.
 * - `existing`: found in the mouth, e.g. a caries or a previous restoration.
 * - `planned`: a treatment to do; drawn with dashed strokes and a lighter fill.
 * - `done`: a treatment performed.
 */
export type FindingStatus = "existing" | "planned" | "done";

export const findingStatuses: readonly FindingStatus[] = [
	"existing",
	"planned",
	"done",
];

/**
 * Part of the tooth a single-tooth finding is placed on: `crown` draws it
 * over the tooth; `root` in the root zone, on the vestibular side past the
 * tooth, its surface diagram and any prosthesis line (this occlusal chart
 * has no roots).
 */
export type FindingLocation = "crown" | "root";

/** Direction of a finding along the arch. */
export type FindingDirection = "mesial" | "distal";

/**
 * How a finding is drawn. The kind also fixes how many teeth it uses:
 * - surfaces of the surface diagram, per listed tooth: `fill`, `outline`;
 * - single tooth, one symbol per listed tooth: `line`, `cross`, `circle`,
 *   `square`, `double-circle`, `triangle`, `arrow`, `curved-arrow`, `zigzag`,
 *   `pulp`, `root-line`, `post-core`, `number-circle`, `text`,
 *   `encircled-text`;
 * - between two teeth: `diastema`, `transposition`, `fused-circles`,
 *   `apical-text`;
 * - a range of teeth of one arch, from the first to the last listed tooth:
 *   `bridge`, `double-line`, `brackets`, `zigzag-line`, `center-line`.
 */
export type FindingSymbol =
	/** Fills the finding's surfaces in the surface diagram, e.g. a caries or a restoration. */
	| { kind: "fill" }
	/** Outlines the finding's surfaces in the surface diagram, e.g. a temporary restoration. */
	| { kind: "outline" }
	/** A straight line across the tooth, e.g. a fracture. */
	| { kind: "line" }
	/** An "X" across the tooth, e.g. an extraction. */
	| { kind: "cross" }
	/** A circle around the tooth. */
	| { kind: "circle" }
	/** A square bordering the crown, e.g. a crown (NTS 188). */
	| { kind: "square" }
	/** The coronal pulp filled in, e.g. a pulpotomy. */
	| { kind: "pulp" }
	/** A line along the root zone, e.g. a root canal treatment. */
	| { kind: "root-line" }
	/** A square in the crown joined to a line along the root zone: a post and core. */
	| { kind: "post-core" }
	/**
	 * A circle around the tooth number, e.g. gemination; around the tooth when
	 * numbers are not shown.
	 */
	| { kind: "number-circle" }
	/** Two overlapping circles over one tooth. */
	| { kind: "double-circle" }
	/** A triangle over the tooth, e.g. a peg-shaped tooth. */
	| { kind: "triangle" }
	/**
	 * A straight arrow across the tooth. `occlusal` points to the other arch,
	 * `apical` away from it; `mesial`/`distal` follow the arch, and `auto`
	 * uses the finding's `direction` (mesial by default).
	 */
	| {
			kind: "arrow";
			direction: "occlusal" | "apical" | "mesial" | "distal" | "auto";
	  }
	/** A curved arrow over the tooth, e.g. rotation. */
	| { kind: "curved-arrow" }
	/** A zigzag arrow toward the other arch, e.g. an erupting tooth. */
	| { kind: "zigzag" }
	/** An abbreviation on the vestibular side of the tooth, e.g. `IMP`. */
	| { kind: "text"; text: string }
	/** An abbreviation inside a circle, e.g. `S` for a supernumerary tooth. */
	| { kind: "encircled-text"; text: string }
	/** Facing arcs `)(` between two teeth. */
	| { kind: "diastema" }
	/** Crossed arrows between two teeth. */
	| { kind: "transposition" }
	/**
	 * Two intersecting circles around the numbers of two teeth (around the
	 * teeth when numbers are not shown), e.g. fusion.
	 */
	| { kind: "fused-circles" }
	/** An encircled abbreviation between the apices of two teeth, e.g. `S`. */
	| { kind: "apical-text"; text: string }
	/** A line with end caps along a range of teeth, e.g. a fixed prosthesis. */
	| { kind: "bridge" }
	/** Two parallel lines along a range of teeth, e.g. a removable prosthesis. */
	| { kind: "double-line" }
	/** A line with a bracket on each tooth, e.g. a fixed orthodontic appliance. */
	| { kind: "brackets" }
	/** A zigzag line along a range of teeth, e.g. a removable orthodontic appliance. */
	| { kind: "zigzag-line" }
	/** A line through the teeth centers, e.g. an edentulous arch. */
	| { kind: "center-line" };

export type FindingSymbolKind = FindingSymbol["kind"];

export type FindingScope = "surface" | "tooth" | "between" | "span";

/** A catalog entry: how a finding code is named and drawn. */
export interface FindingDefinition {
	/** Display name for tooltip, legend and accessible names. */
	name: string;
	symbol: FindingSymbol;
	/** Color used when a finding sets neither `tone` nor `color`. */
	tone: FindingTone;
	/**
	 * Abbreviation written in the tooth's box (`showFindingBoxes`) next to a
	 * drawn single-tooth symbol, e.g. `CT`; a finding's `label` overrides it.
	 */
	boxText?: string;
}

/** Finding definitions keyed by code. */
export type FindingCatalog = Readonly<Record<string, FindingDefinition>>;

/** A finding recorded on the chart. */
export interface OdontogramFinding {
	/** Catalog code, e.g. `fracture`. */
	code: string;
	/**
	 * FDI IDs. Surface and single-tooth findings draw one symbol per tooth;
	 * `between` findings use two teeth; `span` findings cover the arch range
	 * from the first to the last listed tooth.
	 */
	teeth: string[];
	/**
	 * Surfaces of surface findings (`fill`, `outline`); every surface when
	 * omitted. Other findings ignore it.
	 */
	surfaces?: ToothSurface[];
	/** Workflow status; `existing` by default. */
	status?: FindingStatus;
	/**
	 * Overrides the default color. Without it, `planned` findings are `bad`
	 * (red), `done` findings are `good` (blue) and `existing` ones use the
	 * catalog tone.
	 */
	tone?: FindingTone;
	/** Any CSS color; overrides `tone`. */
	color?: string;
	/**
	 * Overrides the abbreviation of text symbols, e.g. `M2` for mobility. With
	 * finding boxes, it is also the abbreviation written in the box for drawn
	 * symbols, e.g. `CM` for a crown.
	 */
	label?: string;
	/**
	 * Crown or root placement of a single-tooth finding, e.g. a root fracture.
	 * Without it, abbreviations go on the vestibular side (in the finding
	 * boxes, when shown) and other symbols over the tooth. Other scopes ignore it.
	 */
	location?: FindingLocation;
	/** Direction for arrows whose catalog direction is `auto`, e.g. migration. */
	direction?: FindingDirection;
}

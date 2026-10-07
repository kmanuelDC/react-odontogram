import type {
	Box,
	FindingCatalog,
	FindingDefinition,
	FindingDirection,
	FindingStatus,
	FindingSymbol,
	FindingTone,
	OdontogramFinding,
	OdontogramLabels,
	OdontogramLabelsInput,
	OdontogramLayout,
	OdontogramSurfaces,
	OdontogramToothStates,
	Point,
	SurfaceDiagram,
	SurfaceShape,
	SurfaceShapeKind,
	ToothAnchor,
	ToothDefinition,
	ToothNumberLabel,
	ToothRecord,
	ToothState,
	ToothSurface,
	ToothSurfaceName,
} from "@kmanueldc/odontogram-core";
import type {
	CSSProperties,
	FocusEvent,
	KeyboardEvent,
	MouseEvent,
	ReactNode,
} from "react";

export type {
	Box,
	OdontogramLayout,
	Point,
	SurfaceDiagram,
	SurfaceShape,
	ToothAnchor,
	FindingCatalog,
	FindingDefinition,
	FindingDirection,
	FindingStatus,
	FindingSymbol,
	FindingTone,
	OdontogramFinding,
	OdontogramLabels,
	OdontogramLabelsInput,
	OdontogramSurfaces,
	OdontogramToothStates,
	SurfaceShapeKind,
	ToothDefinition,
	ToothNumberLabel,
	ToothState,
	ToothSurface,
	ToothSurfaceName,
};

export type Notation = "FDI" | "Universal" | "Palmer";

export type Theme = "light" | "dark";

/**
 * Teeth the chart draws: `permanent` (32, FDI 11–48), `primary`
 * (20, FDI 51–85) or `mixed` (both sets, 52 teeth in four rows). Primary
 * shapes are provisional, not clinically validated.
 */
export type OdontogramDentition = "permanent" | "primary" | "mixed";

/** 0.5.x layout names: `circle` is `arch` and `square` is `horizontal`. */
export type LegacyLayout = "circle" | "square";

/** Layout of the chart; `circle` and `square` are deprecated aliases. */
export type OdontogramLayoutInput = "arch" | "horizontal" | LegacyLayout;

/**
 * Format of the tooth IDs the component returns: `legacy` (`"teeth-11"`,
 * the 0.5.x format and current default) or `fdi` (`"11"`).
 */
export type IdFormat = "legacy" | "fdi";

export type ToothInteractionEvent =
	| MouseEvent<SVGGElement>
	| FocusEvent<SVGGElement>;

/** Alias of `Placement`, the vue-odontogram name. */
export type TooltipPlacement = Placement;

export type Placement =
	| "top"
	| "top-start"
	| "top-end"
	| "right"
	| "right-start"
	| "right-end"
	| "bottom"
	| "bottom-start"
	| "bottom-end"
	| "left"
	| "left-start"
	| "left-end";

export interface ToothDetail {
	id: string;
	notations: {
		fdi: string;
		universal: string;
		palmer: string;
	};
	type: string;
}

/**
 * Theme colors, written as CSS variables on the chart. The 0.5.x keys set
 * `--dark-blue`, `--base-blue` and `--light-blue`; the others set the
 * vue-odontogram variables, which win over them.
 */
export interface OdontogramColors {
	/** Selected tooth stroke and accents (`--dark-blue`). */
	darkBlue?: string;
	/** Tooth outlines (`--base-blue`). */
	baseBlue?: string;
	/** Selected and hovered tooth fill (`--light-blue`). */
	lightBlue?: string;
	/** Tooth outlines (`--odontogram-stroke-color`). */
	stroke?: string;
	/** Selected tooth fill (`--odontogram-selected-color`). */
	selected?: string;
	/** Hovered tooth fill (`--odontogram-hover-color`). */
	hover?: string;
	/** Selected tooth stroke (`--odontogram-selected-stroke-color`). */
	selectedStroke?: string;
	/** Selected surfaces, numbers and highlights (`--odontogram-accent-color`). */
	accent?: string;
}

export type TooltipContentRenderer = (payload?: ToothDetail) => ReactNode;

/** One line of the per-surface summary of a tooth: the findings of a surface. */
export interface TooltipSurfaceSummary {
	surface: ToothSurface;
	/** Letter of the surface on the tooth, e.g. `P`. */
	letter: string;
	/** Clinical name, e.g. "Palatal". */
	name: string;
	/** Findings recorded on the surface. */
	findings: readonly string[];
}

/** What `renderTooltip` receives: the payload of the Vue `tooltip` slot. */
export interface OdontogramTooltipRenderProps {
	tooth: ToothDefinition;
	/** The 0.5.x payload, as `tooltip.content` and `onChange` receive it. */
	detail: ToothDetail;
	selected: boolean;
	condition?: ToothConditionGroup;
	/** Presence status from `toothStates`; `"present"` when unlisted. */
	state: ToothState;
	/**
	 * Names of the findings, with their status when not `existing`: of the
	 * surface in the tooltip of a surface, else the whole-tooth findings
	 * (surface findings are in `surfaceSummary`).
	 */
	findings: readonly string[];
	/** Tooth number in the chart's notation; `tooth.id` stays FDI. */
	number: string;
	/**
	 * Hovered or focused surface, if the tooltip is for a surface; then
	 * `selected` refers to that surface.
	 */
	surface?: ToothSurface;
	/** Clinical name of `surface` on the tooth, e.g. "Palatal". */
	surfaceName?: string;
	/** In the tooltip of a tooth, the findings of each surface with any. */
	surfaceSummary: readonly TooltipSurfaceSummary[];
}

/** What `renderSurfaceMenu` receives: the payload of the Vue `surface-menu` slot. */
export interface SurfaceMenuRenderProps {
	/** FDI ID of the tooth. */
	toothId: string;
	tooth: ToothDefinition;
	surface: ToothSurface;
	/** Clinical name of `surface` on the tooth, e.g. "Palatal". */
	surfaceName: string;
	/** Everything recorded on the tooth; `record.surfaces[surface]` for this surface. */
	record: ToothRecord;
	/** Closes the menu and returns the focus to the surface. */
	close: () => void;
}

/** What `renderOverlay` receives: the payload of the Vue `overlay` slot. */
export interface OdontogramOverlayRenderProps {
	/** Anchors of the drawn teeth by FDI ID, in viewBox coordinates. */
	anchors: Readonly<Record<string, ToothAnchor>>;
	/** The same anchors, in drawing order. */
	anchorList: readonly ToothAnchor[];
	/** The chart's viewBox, as rendered. */
	viewBox: Box;
	dentition: OdontogramDentition;
	layout: OdontogramLayout;
	/** Surface diagrams drawn with `showSurfaces`, with their centers and boxes. */
	surfaceDiagrams: readonly SurfaceDiagram[];
}

/** What `renderNumber` receives: a placed number and its tooth's selection. */
export interface OdontogramNumberRenderProps extends ToothNumberLabel {
	selected: boolean;
	notation: Notation;
}

/** @deprecated Props of the 0.5.x internal `Teeth` component, removed in 0.6. */
export interface TeethProps {
	name: string;
	outlinePath: string;
	shadowPath: string;
	lineHighlightPath: string | string[];
	selected?: boolean;
	onClick?: (name: string) => void;
	onKeyDown?: (e: KeyboardEvent<SVGGElement>, name: string) => void;
	children?: ReactNode;
	onHover?: (name: string, event: MouseEvent<SVGGElement>) => void;
	onFocus?: (name: string, event: FocusEvent<SVGGElement>) => void;
	onLeave?: () => void;
	onBlur?: () => void;
	condition?: {
		fillColor?: string;
		outlineColor?: string;
	};
	readOnly?: boolean;
	showLabel?: boolean;
	label?: string;
}

export interface OdontogramProps {
	name?: string;
	/**
	 * Selected teeth, for a controlled chart: `onChange` reports each change
	 * and the parent passes the new value. IDs in either format.
	 */
	value?: string[];
	/** Initially selected teeth of an uncontrolled chart; IDs in either format. */
	defaultValue?: string[];
	/** Alias of `defaultValue`. */
	defaultSelected?: string[];
	singleSelect?: boolean;
	onChange?: (selected: ToothDetail[]) => void;
	className?: string;
	/** Fill of selected teeth; shortcut of `colors.selected`. */
	selectedColor?: string;
	/** Fill of hovered teeth; shortcut of `colors.hover`. */
	hoverColor?: string;
	theme?: Theme;
	colors?: OdontogramColors;
	notation?: Notation;
	tooltip?: {
		placement?: Placement;
		margin?: number;
		content?: ReactNode | TooltipContentRenderer;
	};
	showTooltip?: boolean;
	/**
	 * Tooltip content from the hovered or focused tooth; wins over
	 * `tooltip.content`. `tooltip.placement` and `tooltip.margin` still apply.
	 */
	renderTooltip?: (props: OdontogramTooltipRenderProps) => ReactNode;
	/**
	 * SVG content drawn above the chart, in viewBox coordinates: marks,
	 * labels or highlights placed with the anchors of the drawn teeth. Clicks
	 * go through it to the teeth unless a child sets `pointer-events`.
	 */
	renderOverlay?: (props: OdontogramOverlayRenderProps) => ReactNode;
	/** Draws the number of each tooth, in `notation`, next to it. */
	showNumbers?: boolean;
	/**
	 * Custom SVG for each number of `showNumbers`, in viewBox coordinates;
	 * replaces the default `<text>` (and Palmer corner).
	 */
	renderNumber?: (props: OdontogramNumberRenderProps) => ReactNode;
	/** Texts of the chart, tooltip and legend; partial overrides. */
	labels?: OdontogramLabelsInput;
	showHalf?: "upper" | "lower" | "full";
	/** `permanent` (default), `primary` or `mixed`. */
	dentition?: OdontogramDentition;
	/**
	 * Teeth present in the mouth, as IDs in either format; every tooth of the
	 * dentition when omitted. Mainly for `dentition="mixed"`.
	 */
	teeth?: string[];
	/**
	 * @deprecated Cuts each quadrant to its first teeth. `maxTeeth={5}` is not
	 * a primary dentition (it shows permanent premolars): use
	 * `dentition="primary"`.
	 */
	maxTeeth?: number;
	/** @deprecated Use `conditions`. */
	teethConditions?: ToothConditionGroup[];
	/** Colors and legend per group of teeth; IDs in either format. */
	conditions?: ToothConditionGroup[];
	/**
	 * Presence status per tooth, keyed by ID in either format: `missing`,
	 * `extracted`, `implant` or `unerupted`; unlisted teeth are `present`.
	 * Visual only: selection, events and keyboard access do not change.
	 */
	toothStates?: OdontogramToothStates;
	/**
	 * Clinical findings and treatments drawn on the chart, with tooth IDs in
	 * either format. Unknown codes and teeth that are not drawn are skipped
	 * with a development warning.
	 */
	findings?: OdontogramFinding[];
	/** Names and symbols of the finding codes; `ntsPeruFindingCatalog` by default. */
	findingCatalog?: FindingCatalog;
	/** Draws a five-surface diagram next to each tooth; the chart grows to fit. */
	showSurfaces?: boolean;
	/**
	 * Menu opened by clicking a surface (or Enter/Space on it). When given, a
	 * surface no longer toggles its selection: the app shows its findings and
	 * records new ones, and calls `close` when done. Escape and a click
	 * outside close it too. `onSurfaceClick` still reports each click.
	 */
	renderSurfaceMenu?: (props: SurfaceMenuRenderProps) => ReactNode;
	/** Draws each surface's letter (V, M, O/I, D, L/P) on the diagrams. */
	showSurfaceLetters?: boolean;
	/** Shape of the surface diagrams: `square` (default) or `circle`. */
	surfaceShape?: SurfaceShapeKind;
	/**
	 * Selected surfaces per tooth, for controlled diagrams; keys in either ID
	 * format. Independent of the tooth selection.
	 */
	surfaces?: OdontogramSurfaces;
	/** Initially selected surfaces of uncontrolled diagrams. */
	defaultSurfaces?: OdontogramSurfaces;
	/** The next surfaces after a click, keyed by ID in `idFormat`. */
	onSurfacesChange?: (surfaces: OdontogramSurfaces) => void;
	/**
	 * A surface was clicked (or toggled with Enter/Space). `tooth.id` is FDI;
	 * `surfaces` is the next model, keyed by ID in `idFormat`.
	 */
	onSurfaceClick?: (
		tooth: ToothDefinition,
		surface: ToothSurface,
		surfaces: OdontogramSurfaces,
	) => void;
	/** Alias of `disabled`. */
	readOnly?: boolean;
	/** Shows the chart without selection or keyboard interaction. */
	disabled?: boolean;
	showLabels?: boolean;
	/** `arch` (default) or `horizontal`; `circle` and `square` are deprecated. */
	layout?: OdontogramLayoutInput;
	/** Format of the IDs in `onChange` and the form input; `legacy` by default. */
	idFormat?: IdFormat;
	styles?: CSSProperties;
}

export type ToothConditionGroup = {
	label: string;
	teeth: string[];
	outlineColor: string;
	fillColor: string;
};

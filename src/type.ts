import type {
	CSSProperties,
	FocusEvent,
	KeyboardEvent,
	MouseEvent,
	ReactNode,
} from "react";

export type Notation = "FDI" | "Universal" | "Palmer";

export type Theme = "light" | "dark";

/**
 * Teeth the chart draws: `permanent` (32, FDI 11–48) or `primary`
 * (20, FDI 51–85). Primary shapes are provisional, not clinically validated.
 */
export type OdontogramDentition = "permanent" | "primary";

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

export interface OdontogramColors {
	darkBlue?: string;
	baseBlue?: string;
	lightBlue?: string;
}

export type TooltipContentRenderer = (payload?: ToothDetail) => ReactNode;

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
	selectedColor?: string;
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
	showHalf?: "upper" | "lower" | "full";
	/** `permanent` (default) or `primary`. */
	dentition?: OdontogramDentition;
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

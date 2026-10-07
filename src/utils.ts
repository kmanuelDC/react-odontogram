import { normalizeLayout } from "./compat";
import type {
	OdontogramColors,
	OdontogramLayoutInput,
	Placement,
	Theme,
} from "./type";

type ShowHalf = "full" | "upper" | "lower";

export function getViewBox(
	layout: OdontogramLayoutInput,
	showHalf: ShowHalf,
): string {
	if (normalizeLayout(layout) === "horizontal") {
		// linear does not support half slicing (single row)

		if (showHalf === "upper") {
			return "0 0 900 75";
		}
		if (showHalf === "lower") {
			return "0 75 900 75 ";
		}

		return "0 0 900 150";
	}

	// arch layout
	const full = "0 0 409 694";
	const upper = "0 0 409 347";
	const lower = "0 347 409 347";

	if (showHalf === "upper") {
		return upper;
	}
	if (showHalf === "lower") {
		return lower;
	}
	return full;
}

export function mapToCssVars(colors: OdontogramColors) {
	const cssVars: Record<string, string> = {};

	if (colors.darkBlue) {
		cssVars["--dark-blue"] = colors.darkBlue;
	}
	if (colors.baseBlue) {
		cssVars["--base-blue"] = colors.baseBlue;
	}
	if (colors.lightBlue) {
		cssVars["--light-blue"] = colors.lightBlue;
	}

	// vue-odontogram names; they win over the 0.5.x ones above.
	const themeVars: [keyof OdontogramColors, string][] = [
		["stroke", "--odontogram-stroke-color"],
		["selected", "--odontogram-selected-color"],
		["hover", "--odontogram-hover-color"],
		["selectedStroke", "--odontogram-selected-stroke-color"],
		["accent", "--odontogram-accent-color"],
	];
	for (const [key, name] of themeVars) {
		const value = colors[key];
		if (value) {
			cssVars[name] = value;
		}
	}

	return cssVars;
}

export const placements: Record<
	Placement,
	(toothBox: DOMRect, margin: number) => { x: number; y: number }
> = {
	top: (t, m) => ({ x: t.left + t.width / 2, y: t.top - m }),
	"top-start": (t, m) => ({ x: t.left, y: t.top - m }),
	"top-end": (t, m) => ({ x: t.right, y: t.top - m }),
	bottom: (t, m) => ({ x: t.left + t.width / 2, y: t.bottom + m }),
	"bottom-start": (t, m) => ({ x: t.left, y: t.bottom + m }),
	"bottom-end": (t, m) => ({ x: t.right, y: t.bottom + m }),
	left: (t, m) => ({ x: t.left - m, y: t.top + t.height / 2 }),
	"left-start": (t, m) => ({ x: t.left - m, y: t.top }),
	"left-end": (t, m) => ({ x: t.left - m, y: t.bottom }),
	right: (t, m) => ({ x: t.right + m, y: t.top + t.height / 2 }),
	"right-start": (t, m) => ({ x: t.right + m, y: t.top }),
	"right-end": (t, m) => ({ x: t.right + m, y: t.bottom }),
};

//425, 55

const lightThemeColors = {
	"--dark-blue": "#3e5edc",
	"--base-blue": "#8a98be",
	"--light-blue": "#c6ccf8",
};

const darkThemeColors = {
	"--dark-blue": "#aab6ff",
	"--base-blue": "#d0d5f6",
	"--light-blue": "#5361e6",
};

export interface ThemeVarsOptions {
	theme: Theme;
	colors: OdontogramColors;
	/** Shortcut of `colors.selected`. */
	selectedColor?: string;
	/** Shortcut of `colors.hover`. */
	hoverColor?: string;
}

/**
 * CSS variables the chart writes on its container: the 0.5.x colors of the
 * theme, then `colors` and the shortcut props (`colors` wins when it sets
 * the same color).
 */
export function getThemeVars({
	theme,
	colors,
	selectedColor,
	hoverColor,
}: ThemeVarsOptions): Record<string, string> {
	return {
		...(theme === "dark" ? darkThemeColors : lightThemeColors),
		...mapToCssVars({
			...colors,
			selected: colors.selected ?? selectedColor,
			hover: colors.hover ?? hoverColor,
		}),
	};
}

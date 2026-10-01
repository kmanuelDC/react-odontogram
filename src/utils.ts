import { normalizeLayout } from "./compat";
import type {
	OdontogramColors,
	OdontogramLayoutInput,
	Placement,
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

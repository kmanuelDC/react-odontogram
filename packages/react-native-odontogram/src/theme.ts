import type { Theme } from "../../../src/type";

/**
 * Colors of the native chart. React Native has no CSS, so the values of the
 * web stylesheet (`react-odontogram/style.css`) are written here.
 */
export interface NativePalette {
	/** Selected tooth stroke and selected numbers. */
	darkBlue: string;
	/** Tooth outlines and legend text. */
	baseBlue: string;
	/** Selected tooth fill. */
	lightBlue: string;
	/** Tooth numbers (`showNumbers`). */
	number: string;
	/** Cross of extracted teeth. */
	extracted: string;
	/** Implant fixture stroke and fill. */
	implant: string;
	implantFill: string;
	/** Findings in good state or completed treatments. */
	findingGood: string;
	/** Findings in bad state or pending treatments. */
	findingBad: string;
}

export type NativeOdontogramColors = Partial<NativePalette>;

export const nativeThemeColors: Record<Theme, NativePalette> = {
	light: {
		darkBlue: "#3e5edc",
		baseBlue: "#8a98be",
		lightBlue: "#c6ccf8",
		number: "#64748b",
		extracted: "#dc2626",
		implant: "#0f766e",
		implantFill: "#ccfbf1",
		findingGood: "#1d4ed8",
		findingBad: "#dc2626",
	},
	dark: {
		darkBlue: "#aab6ff",
		baseBlue: "#d0d5f6",
		lightBlue: "#5361e6",
		number: "#aab3cf",
		extracted: "#dc2626",
		implant: "#0f766e",
		implantFill: "#ccfbf1",
		findingGood: "#7aa2ff",
		findingBad: "#ff7a7a",
	},
};

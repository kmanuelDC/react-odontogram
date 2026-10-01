/**
 * Compatibility layer between the 0.5.x public API and the framework-free core.
 *
 * Inside the library every tooth ID is a plain FDI ID (`"11"`). The legacy
 * format (`"teeth-11"`) only exists at the public boundary: `defaultSelected`,
 * `onChange`, the hidden form input and condition groups.
 */
import type { OdontogramLayout } from "./core/utils/layout";
import {
	type PalmerQuadrant,
	formatToothNumber,
	getPalmerQuadrant,
	getToothType,
} from "./core/utils/notation";
import type {
	IdFormat,
	LegacyLayout,
	Notation,
	OdontogramLayoutInput,
	ToothConditionGroup,
	ToothDetail,
} from "./type";

const legacyIdPrefix = "teeth-";

/** Plain FDI ID from either format: `"teeth-11"` and `"11"` give `"11"`. */
export function toFdiId(id: string): string {
	return id.startsWith(legacyIdPrefix) ? id.slice(legacyIdPrefix.length) : id;
}

/** Legacy 0.5.x ID of an FDI tooth: `"11"` gives `"teeth-11"`. */
export function toLegacyId(id: string): string {
	return `${legacyIdPrefix}${toFdiId(id)}`;
}

/** Public ID of an FDI tooth in the chosen format. */
export function formatPublicId(id: string, idFormat: IdFormat): string {
	return idFormat === "fdi" ? toFdiId(id) : toLegacyId(id);
}

const legacyLayouts: Record<LegacyLayout, OdontogramLayout> = {
	circle: "arch",
	square: "horizontal",
};

export function isLegacyLayout(
	layout: OdontogramLayoutInput | undefined,
): layout is LegacyLayout {
	return layout === "circle" || layout === "square";
}

/** Core layout of a public layout: `circle` is `arch`, `square` is `horizontal`. */
export function normalizeLayout(
	layout: OdontogramLayoutInput | undefined,
): OdontogramLayout {
	if (isLegacyLayout(layout)) {
		return legacyLayouts[layout];
	}
	return layout ?? "arch";
}

/**
 * Condition groups with FDI tooth IDs. `conditions` wins over the deprecated
 * `teethConditions`; either may list IDs in any format.
 */
export function normalizeConditions(
	conditions: ToothConditionGroup[] | undefined,
	teethConditions: ToothConditionGroup[] | undefined,
): ToothConditionGroup[] | undefined {
	const groups = conditions ?? teethConditions;
	return groups?.map((group) => ({
		...group,
		teeth: group.teeth.map(toFdiId),
	}));
}

/** `disabled` wins; `readOnly` stays supported as its React-style alias. */
export function resolveDisabled(
	disabled: boolean | undefined,
	readOnly: boolean | undefined,
): boolean {
	return disabled ?? readOnly ?? false;
}

const palmerQuadrantCodes: Record<PalmerQuadrant, string> = {
	"upper-right": "UR",
	"upper-left": "UL",
	"lower-left": "LL",
	"lower-right": "LR",
};

/**
 * Palmer number in the 0.5.x format: position, then quadrant (`1UR`, `8LL`).
 * The core writes `UR1` or `1┘`; `ToothDetail` keeps this format until 1.0.
 */
export function formatLegacyPalmer(id: string): string {
	const fdi = toFdiId(id);
	const code = palmerQuadrantCodes[getPalmerQuadrant(fdi)];
	// The core's text style is the quadrant code followed by the position.
	const position = formatToothNumber(fdi, "Palmer", "text").slice(code.length);
	return `${position}${code}`;
}

/** Tooth number as 0.5.x displays it in the chart, for a notation. */
export function formatLegacyNumber(id: string, notation: Notation): string {
	const fdi = toFdiId(id);
	if (notation === "Palmer") {
		return formatLegacyPalmer(fdi);
	}
	return formatToothNumber(fdi, notation);
}

/** Payload of `onChange` and the tooltip, in the 0.5.x shape. */
export function buildToothDetail(id: string, idFormat: IdFormat): ToothDetail {
	const fdi = toFdiId(id);
	return {
		id: formatPublicId(fdi, idFormat),
		notations: {
			fdi,
			universal: formatToothNumber(fdi, "Universal"),
			palmer: formatLegacyPalmer(fdi),
		},
		type: getToothType(fdi),
	};
}

const warned = new Set<string>();

function isProduction(): boolean {
	// `process` may not exist when the bundle runs unbundled in a browser.
	return (
		typeof process !== "undefined" && process.env?.NODE_ENV === "production"
	);
}

/** Logs a deprecation once per key, and never in production builds. */
export function warnDeprecated(key: string, message: string): void {
	if (isProduction() || warned.has(key)) {
		return;
	}
	warned.add(key);
	// biome-ignore lint/suspicious/noConsole: deprecation notices are meant for the developer console.
	console.warn(`[react-odontogram] ${message}`);
}

/** Forgets the warnings already logged; for tests. */
export function resetDeprecationWarnings(): void {
	warned.clear();
}

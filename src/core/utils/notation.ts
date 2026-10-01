import type { ToothNotation, ToothType } from "../types/odontogram";
import { type NumberedDentition, isQuadrantForDentition } from "./quadrants";

const positionLimit: Record<NumberedDentition, number> = {
	permanent: 8,
	primary: 5,
};

/**
 * Builds a tooth identifier from its dental position.
 *
 * Tooth IDs are always FDI, whatever notation a chart displays; use
 * `formatToothNumber` to show them in another notation.
 */
export function buildToothId(
	dentition: NumberedDentition,
	quadrant: number,
	position: number,
	notation: ToothNotation = "FDI",
): string {
	if (!isQuadrantForDentition(dentition, quadrant)) {
		throw new RangeError(
			`Quadrant ${quadrant} is not valid for ${dentition} dentition.`,
		);
	}

	const maximumPosition = positionLimit[dentition];
	if (
		!Number.isInteger(position) ||
		position < 1 ||
		position > maximumPosition
	) {
		throw new RangeError(
			`Position ${position} is not valid for ${dentition} dentition; expected 1–${maximumPosition}.`,
		);
	}

	if (notation !== "FDI") {
		throw new Error(
			`Tooth IDs are always FDI; format ${notation} numbers with formatToothNumber.`,
		);
	}

	return `${quadrant}${position}`;
}

/** Quadrant of the patient's mouth, as used by the Palmer notation. */
export type PalmerQuadrant =
	| "upper-right"
	| "upper-left"
	| "lower-left"
	| "lower-right";

const palmerQuadrants: readonly PalmerQuadrant[] = [
	"upper-right",
	"upper-left",
	"lower-left",
	"lower-right",
];

/** Palmer corner drawn around the number, by quadrant: `1┘`, `└1`, `┌1`, `1┐`. */
const palmerSymbols: Record<PalmerQuadrant, (text: string) => string> = {
	"upper-right": (text) => `${text}┘`,
	"upper-left": (text) => `└${text}`,
	"lower-left": (text) => `┌${text}`,
	"lower-right": (text) => `${text}┐`,
};

const palmerPrefixes: Record<PalmerQuadrant, string> = {
	"upper-right": "UR",
	"upper-left": "UL",
	"lower-left": "LL",
	"lower-right": "LR",
};

/**
 * Splits an FDI ID into its quadrant (1–8) and position, or throws for an ID
 * that is not a valid FDI tooth.
 */
function parseFdi(toothId: string): {
	quadrant: number;
	position: number;
	primary: boolean;
} {
	const match = /^([1-8])([1-8])$/.exec(toothId);
	const quadrant = Number(match?.[1]);
	const position = Number(match?.[2]);
	const primary = quadrant > 4;

	if (!match || position > positionLimit[primary ? "primary" : "permanent"]) {
		throw new RangeError(`"${toothId}" is not a valid FDI tooth ID.`);
	}

	return { quadrant, position, primary };
}

const permanentTypes: readonly ToothType[] = [
	"Central Incisor",
	"Lateral Incisor",
	"Canine",
	"First Premolar",
	"Second Premolar",
	"First Molar",
	"Second Molar",
	"Third Molar",
];

const primaryTypes: readonly ToothType[] = [
	"Primary Central Incisor",
	"Primary Lateral Incisor",
	"Primary Canine",
	"Primary First Molar",
	"Primary Second Molar",
];

/** Type of an FDI tooth, e.g. `First Molar` for 16 or `Primary Canine` for 53. */
export function getToothType(toothId: string): ToothType {
	const { position, primary } = parseFdi(toothId);
	return (primary ? primaryTypes : permanentTypes)[position - 1];
}

/** Palmer quadrant of an FDI tooth. */
export function getPalmerQuadrant(toothId: string): PalmerQuadrant {
	const { quadrant } = parseFdi(toothId);
	return palmerQuadrants[(quadrant - 1) % 4];
}

/**
 * How a notation writes an FDI tooth:
 * - `FDI`: the ID itself (`11`, `85`).
 * - `Universal`: `1`–`32` from the upper right third molar clockwise to the
 *   lower right third molar; primary teeth `A`–`T` in the same order.
 * - `Palmer`: the position in its quadrant (`1`–`8`, primary `A`–`E`) with the
 *   quadrant corner. `style: 'symbol'` uses box-drawing corners (`1┘`,
 *   `└A`); `style: 'text'` writes the quadrant (`UR1`, `ULA`), which reads
 *   well aloud.
 */
export function formatToothNumber(
	toothId: string,
	notation: ToothNotation,
	style: "symbol" | "text" = "symbol",
): string {
	if (notation === "FDI") {
		return toothId;
	}

	const { quadrant, position, primary } = parseFdi(toothId);

	if (notation === "Universal") {
		// Order along the mouth, starting at 0: upper right back, clockwise.
		const perQuadrant = primary ? 5 : 8;
		const side = (quadrant - 1) % 4;
		const backFirst = side === 0 || side === 2;
		const index =
			side * perQuadrant + (backFirst ? perQuadrant - position : position - 1);

		return primary ? String.fromCharCode(65 + index) : String(index + 1);
	}

	const text = primary ? String.fromCharCode(64 + position) : String(position);
	const palmer = getPalmerQuadrant(toothId);
	return style === "symbol"
		? palmerSymbols[palmer](text)
		: `${palmerPrefixes[palmer]}${text}`;
}

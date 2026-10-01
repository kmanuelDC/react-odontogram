import { layoutDefinitions } from "./layout";
import { primaryArchLayoutDefinition } from "./primary-layout";

/**
 * Mixed dentition compositions, as in the NTS odontogram form: the permanent
 * teeth keep their own composition, and the primary teeth are drawn as an
 * inner set of rows or arches between them. No geometry is new; each primary
 * quadrant reuses its dataset and quadrant transform, wrapped in a scale and
 * translation that places it.
 */

export interface MixedQuadrantTransform {
	quadrant: number;
	transform: string;
}

export interface MixedLayoutDefinition {
	viewBox: string;
	permanent: readonly MixedQuadrantTransform[];
	primary: readonly MixedQuadrantTransform[];
}

const round = (value: number) => Math.round(value * 1000) / 1000;

/*
 * Horizontal: four rows, top to bottom 18–28, 55–65, 85–75 and 48–38. The
 * primary rows are scaled so the primary second molar sits under the second
 * premolar that replaces it (55 under 15, 75 over 35), keeping the midline.
 */

/** Midline of the permanent horizontal composition (between 11 and 21). */
const permanentMidline = 447.5;
/** Midline of the primary horizontal dataset's 520-unit workspace. */
const primaryMidline = 260;
/** Scale that aligns the primary second molars with the second premolars. */
const primaryRowScale = 1.1;
/** Local y range of an unmirrored primary horizontal row. */
const primaryRowTop = 16.9;
const primaryRowBottom = 66.9;
/** Bottom of the permanent upper row and top of its lower row, in its 150-unit box. */
const permanentUpperBottom = 53.7;
const permanentLowerTop = 95.8;
const permanentHeight = 150;
/**
 * Space between a permanent row and the primary row next to it: the
 * permanent numbers on one side and the primary surface diagrams on the other.
 */
const outerBand = 80;
/** Space between both primary rows: the numbers of each. */
const innerBand = 40;

function mixedHorizontal(): MixedLayoutDefinition {
	const s = primaryRowScale;
	const tx = round(permanentMidline - primaryMidline * s);
	const upperTop = permanentUpperBottom + outerBand;
	const upperY = round(upperTop - primaryRowTop * s);
	const upperBottom = upperY + primaryRowBottom * s;
	// The lower rows are mirrored: local y grows upward.
	const lowerY = round(upperBottom + innerBand + primaryRowBottom * s);
	const lowerBottom = lowerY - primaryRowTop * s;
	const permanentOffset = round(lowerBottom + outerBand - permanentLowerTop);
	const height = Math.ceil(permanentHeight + permanentOffset);
	const place = (y: number) => `translate(${tx}, ${y}) scale(${s})`;

	const permanent = layoutDefinitions.horizontal.quadrants.map(
		({ quadrant, transform }) => ({
			quadrant,
			transform:
				quadrant === 3 || quadrant === 4
					? `translate(0, ${permanentOffset}) ${transform}`.trim()
					: transform,
		}),
	);

	return {
		viewBox: `0 0 900 ${height}`,
		permanent,
		primary: [
			{ quadrant: 5, transform: place(upperY) },
			{
				quadrant: 6,
				transform: `${place(upperY)} translate(520, 0) scale(-1, 1)`,
			},
			{ quadrant: 8, transform: `${place(lowerY)} scale(1, -1)` },
			{
				quadrant: 7,
				transform: `${place(lowerY)} translate(520, 0) scale(-1, -1)`,
			},
		],
	};
}

/*
 * Arch: the primary arches, scaled down, inside the permanent ones and
 * centered on the same midline. The primary upper arch starts below the
 * permanent incisors' numbers; the lower one mirrors it.
 */

const archWidth = 409;
const archHeight = 694;
const primaryArchHeight = 461;
/** Scale of the primary arches inside the permanent ones. */
const primaryArchScale = 0.58;
/** Top of the primary upper arch. */
const primaryArchTop = 140;
/** Top of the primary incisors in their own composition. */
const primaryArchIncisorTop = 4.8;

function mixedArch(): MixedLayoutDefinition {
	const s = primaryArchScale;
	const tx = round((archWidth / 2) * (1 - s));
	const upperY = round(primaryArchTop - primaryArchIncisorTop * s);
	// Symmetric about the permanent chart's horizontal axis.
	const lowerY = round(archHeight - upperY - primaryArchHeight * s);
	const place = (y: number) => `translate(${tx}, ${y}) scale(${s})`;

	return {
		viewBox: layoutDefinitions.arch.viewBox,
		permanent: layoutDefinitions.arch.quadrants,
		primary: primaryArchLayoutDefinition.quadrants.map(
			({ quadrant, transform }) => ({
				quadrant,
				transform:
					`${place(quadrant === 5 || quadrant === 6 ? upperY : lowerY)} ${transform}`.trim(),
			}),
		),
	};
}

export const mixedLayoutDefinitions = {
	arch: mixedArch(),
	horizontal: mixedHorizontal(),
} as const;

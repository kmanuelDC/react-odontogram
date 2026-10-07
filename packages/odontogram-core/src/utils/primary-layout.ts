import type { PrimaryToothType } from "../types/geometry";

/** FDI quadrants used by primary (deciduous) dentition. */
export type PrimaryQuadrant = 5 | 6 | 7 | 8;

export interface PrimaryQuadrantTransform {
	quadrant: PrimaryQuadrant;
	transform: string;
}

/**
 * Provisional arch composition for the five pediatric SVG approximations.
 *
 * The 461-unit height is intentionally independent from the permanent arch's
 * 694-unit viewBox. It keeps every lower-arch spacing intact while leaving
 * more than 30 units between the upper and lower second molars.
 */
/**
 * Mirrors an upper primary quadrant across the horizontal axis of its SVG
 * workspace. It preserves every path's size and curvature, yielding the
 * corresponding mandibular quadrant.
 */
export function mirrorPrimaryQuadrant(
	width: number,
	height: number,
	mirrorHorizontally = false,
): string {
	const scaleX = mirrorHorizontally ? -1 : 1;
	const translateX = mirrorHorizontally ? -width : 0;

	return `scale(${scaleX}, -1) translate(${translateX}, -${height})`;
}

/**
 * Presentation offsets applied to each provisional primary shape inside its
 * quadrant. They never modify the SVG paths and, because quadrant groups are
 * mirrored, the same local offset is valid for Q5, Q6, Q8 and Q7.
 */
export const primaryArchToothTransforms: Readonly<
	Partial<Record<PrimaryToothType, string>>
> = {
	/**
	 * Mirrors each central incisor while moving it four units away from the
	 * midline. The pair gains eight units of clearance, about 20% of its
	 * provisional width.
	 */
	"Primary Central Incisor": "translate(366 0) scale(-1 1)",
	/**
	 * Moves each lateral incisor away from the midline only on the x-axis. Its
	 * SVG geometry is already correctly aligned, so no rotation is applied.
	 */
	"Primary Lateral Incisor": "translate(-6 0)",
	/**
	 * Moves the canine only on the x-axis to keep a compact two-unit clearance
	 * from the lateral incisor, so the lower arch stays an exact vertical
	 * reflection of the upper curve.
	 */
	"Primary Canine": "translate(209 20) scale(-1 1)",
	/**
	 * Keeps 54/84 20 units left and 64/74 20 units right in screen space;
	 * horizontal quadrant reflection reverses the local x-axis for 64 and 74.
	 */
	"Primary First Molar": "translate(-20 -4)",
	"Primary Second Molar": "translate(0 6)",
};

export interface PrimaryArchLayoutDefinition {
	layout: "arch";
	viewBox: string;
	quadrants: readonly PrimaryQuadrantTransform[];
	toothTransforms: Readonly<Partial<Record<PrimaryToothType, string>>>;
	provisional: true;
}

export const primaryArchLayoutDefinition: PrimaryArchLayoutDefinition = {
	layout: "arch",
	viewBox: "0 0 409 461",
	quadrants: [
		{ quadrant: 5, transform: "" },
		{ quadrant: 6, transform: "scale(-1, 1) translate(-409, 0)" },
		{ quadrant: 8, transform: mirrorPrimaryQuadrant(409, 461) },
		{ quadrant: 7, transform: mirrorPrimaryQuadrant(409, 461, true) },
	],
	toothTransforms: primaryArchToothTransforms,
	provisional: true,
};

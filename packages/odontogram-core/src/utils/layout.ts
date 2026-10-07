/** Presentation-only layouts for an odontogram. */
export type OdontogramLayout = "arch" | "horizontal";

export type PermanentQuadrant = 1 | 2 | 3 | 4;

export interface QuadrantTransform {
	quadrant: PermanentQuadrant;
	transform: string;
}

/**
 * SVG geometry used to place a complete permanent odontogram.
 *
 * This model does not assign FDI identifiers, infer dentition, or define tooth
 * geometry. It only describes the presentation space and group transforms.
 */
export interface LayoutDefinition {
	viewBox: string;
	quadrants: readonly QuadrantTransform[];
}

export const layoutDefinitions: Readonly<
	Record<OdontogramLayout, LayoutDefinition>
> = {
	arch: {
		viewBox: "0 0 409 694",
		quadrants: [
			{ quadrant: 1, transform: "" },
			{ quadrant: 2, transform: "scale(-1, 1) translate(-409, 0)" },
			{ quadrant: 4, transform: "scale(1, -1) translate(0, -694)" },
			{ quadrant: 3, transform: "scale(-1, -1) translate(-409, -694)" },
		],
	},
	horizontal: {
		viewBox: "0 0 900 150",
		quadrants: [
			{ quadrant: 1, transform: "" },
			{
				quadrant: 2,
				transform: "translate(840, 0) scale(-1, 1) translate(-55,0)",
			},
			{ quadrant: 4, transform: "scale(1, -1) translate(0, -150)" },
			{
				quadrant: 3,
				transform: "translate(840, 0) scale(-1, -1) translate(-55,-150)",
			},
		],
	},
};

export function getLayoutDefinition(
	layout: OdontogramLayout,
): LayoutDefinition {
	return layoutDefinitions[layout];
}

import type {
	PrimaryQuadrant,
	PrimaryQuadrantTransform,
} from "./primary-layout";

/**
 * Presentation-only composition for the provisional horizontal primary
 * dataset. Its transforms are independent from permanent and primary-arch
 * layouts.
 */
export interface PrimaryHorizontalLayoutDefinition {
	layout: "horizontal";
	viewBox: string;
	quadrants: readonly PrimaryQuadrantTransform[];
	provisional: true;
}

export const primaryHorizontalLayoutDefinition: PrimaryHorizontalLayoutDefinition =
	{
		layout: "horizontal",
		viewBox: "0 0 520 180",
		quadrants: [
			{ quadrant: 5, transform: "translate(0, 105)" },
			{ quadrant: 6, transform: "translate(520, 105) scale(-1, 1)" },
			{ quadrant: 8, transform: "translate(0, 75) scale(1, -1)" },
			{ quadrant: 7, transform: "translate(520, 75) scale(-1, -1)" },
		] satisfies readonly PrimaryQuadrantTransform[],
		provisional: true,
	};

/** Compile-time check that the composition contains only primary quadrants. */
const primaryHorizontalQuadrants: readonly PrimaryQuadrant[] =
	primaryHorizontalLayoutDefinition.quadrants.map(({ quadrant }) => quadrant);

void primaryHorizontalQuadrants;

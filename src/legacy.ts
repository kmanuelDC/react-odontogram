/**
 * The 0.5.x data and helpers in their original shape, derived from the core.
 *
 * Only `packages/react-native-odontogram` uses them, until it moves to the
 * core in R19. The web component does not; do not add new uses.
 */
import { buildToothDetail, formatLegacyNumber } from "./compat";
import { permanentTeethPaths } from "./core/data/permanent";
import { permanentHorizontalTeethPaths } from "./core/data/permanent-horizontal";
import type { ToothShape } from "./core/types/geometry";
import { layoutDefinitions } from "./core/utils/layout";
import type { Notation } from "./type";

export interface LegacyToothPath {
	name: string;
	type: string;
	outlinePath: string;
	shadowPath: string;
	lineHighlightPath: string | string[];
}

function toLegacyPaths(shapes: readonly ToothShape[]): LegacyToothPath[] {
	return shapes.map(
		({ position, type, outlinePath, shadowPath, lineHighlightPath }) => ({
			name: String(position),
			type,
			outlinePath,
			shadowPath: shadowPath ?? "",
			lineHighlightPath: lineHighlightPath ?? "",
		}),
	);
}

/** Permanent arch (`circle`) paths, as `src/data.ts` exported them. */
export const teethPaths = toLegacyPaths(permanentTeethPaths);

/** Permanent horizontal (`square`) paths, as `src/data.ts` exported them. */
export const NewTeethPaths = toLegacyPaths(permanentHorizontalTeethPaths);

export interface LegacyQuadrant {
	name: "first" | "second" | "third" | "fourth";
	transform: string;
	label: string;
	prefix: string;
}

const quadrantInfo: Record<number, Omit<LegacyQuadrant, "transform">> = {
	1: { name: "first", label: "Upper Right", prefix: "1" },
	2: { name: "second", label: "Upper Left", prefix: "2" },
	3: { name: "third", label: "Lower Left", prefix: "3" },
	4: { name: "fourth", label: "Lower Right", prefix: "4" },
};

function toLegacyQuadrants(
	quadrants: readonly { quadrant: number; transform: string }[],
): LegacyQuadrant[] {
	return quadrants.map(({ quadrant, transform }) => ({
		...quadrantInfo[quadrant],
		transform,
	}));
}

/** Horizontal (`square`) quadrant transforms, in render order. */
export const quadrants = toLegacyQuadrants(
	layoutDefinitions.horizontal.quadrants,
);

/** Arch (`circle`) quadrant transforms, in render order. */
export const oldquadrants = toLegacyQuadrants(layoutDefinitions.arch.quadrants);

/** Number of a tooth (`"teeth-11"` or `"11"`) in a notation, 0.5.x style. */
export function convertFDIToNotation(fdi: string, notation: Notation): string {
	return formatLegacyNumber(fdi, notation);
}

/** FDI, Universal and Palmer numbers of a tooth, 0.5.x style. */
export function getToothNotations(fdi: string) {
	return buildToothDetail(fdi, "legacy").notations;
}

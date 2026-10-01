import type { DentalArch } from "../types/odontogram";
import { composeQuadrants, getComposition } from "./compositions";
import type { RenderableDentition } from "./dentition-layout";
import type { OdontogramLayout } from "./layout";
import type { NumberedDentition } from "./quadrants";
import {
	type Box,
	type Point,
	getPathBox,
	multiplyMatrices,
	parseTransform,
	transformBox,
} from "./svg-geometry";

export type { Box, Point };

/**
 * A row of teeth drawn along one arch, e.g. `upper-primary`. Permanent and
 * primary charts have one row per arch; mixed charts have two.
 */
export type ToothRow = `${DentalArch}-${NumberedDentition}`;

/**
 * Where a tooth is drawn, in the SVG coordinates of its layout's viewBox.
 * Overlays such as numbers, symbols or surface diagrams can be positioned
 * from it without reading the DOM.
 */
export interface ToothAnchor {
	toothId: string;
	quadrant: number;
	arch: DentalArch;
	dentition: NumberedDentition;
	row: ToothRow;
	/** Axis-aligned bounding box of the tooth outline. */
	box: Box;
	/** Center of `box`. */
	center: Point;
}

const upperQuadrants = new Set([1, 2, 5, 6]);
const pathBoxCache = new Map<string, Box>();
const anchorCache = new Map<string, readonly ToothAnchor[]>();

function cachedPathBox(path: string): Box {
	let box = pathBoxCache.get(path);
	if (!box) {
		box = getPathBox(path);
		pathBoxCache.set(path, box);
	}

	return box;
}

/** Parses a `viewBox` attribute. */
export function parseViewBox(viewBox: string): Box {
	const [x = 0, y = 0, width = 0, height = 0] = viewBox
		.trim()
		.split(/[\s,]+/)
		.map(Number);
	return { x, y, width, height };
}

/**
 * Computes the anchor of every tooth for a dentition and layout, in render
 * order. It composes the quadrant, shape and layout transforms exactly as the
 * SVG does, so the result matches the rendered position.
 */
export function getToothAnchors(
	dentition: RenderableDentition,
	layout: OdontogramLayout,
): readonly ToothAnchor[] {
	const key = `${dentition}:${layout}`;
	const cached = anchorCache.get(key);
	if (cached) {
		return cached;
	}

	const anchors = composeQuadrants(dentition, layout).flatMap(
		({ quadrant, transform, teeth }) => {
			const quadrantMatrix = parseTransform(transform);

			return teeth.map(({ tooth, transform: layoutTransform }): ToothAnchor => {
				const matrix = multiplyMatrices(
					multiplyMatrices(
						quadrantMatrix,
						parseTransform(tooth.shape.transform),
					),
					parseTransform(layoutTransform),
				);
				const box = transformBox(
					matrix,
					cachedPathBox(tooth.shape.outlinePath),
				);
				const arch: DentalArch = upperQuadrants.has(quadrant)
					? "upper"
					: "lower";
				const dentition = tooth.dentition as NumberedDentition;

				return {
					toothId: tooth.id,
					quadrant,
					arch,
					dentition,
					row: `${arch}-${dentition}`,
					box,
					center: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
				};
			});
		},
	);

	anchorCache.set(key, anchors);
	return anchors;
}

/** Returns the parsed viewBox of a dentition and layout. */
export function getLayoutViewBox(
	dentition: RenderableDentition,
	layout: OdontogramLayout,
): Box {
	return parseViewBox(getComposition(dentition, layout).viewBox);
}

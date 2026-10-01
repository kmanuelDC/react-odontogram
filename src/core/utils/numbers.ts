import type { ToothNotation } from "../types/odontogram";
import type { ToothAnchor } from "./anchors";
import type { OdontogramLayout } from "./layout";
import {
	type PalmerQuadrant,
	formatToothNumber,
	getPalmerQuadrant,
} from "./notation";
import type { Box, Point } from "./svg-geometry";
import { getToothFrames, halfExtent } from "./tooth-frames";

/** Approximate advance of a digit relative to the font size. */
const digitWidthRatio = 0.62;

/** A tooth number placed next to its tooth, in viewBox coordinates. */
export interface ToothNumberLabel {
	toothId: string;
	/** The number in the chart's notation, without the Palmer corner. */
	text: string;
	/** Center of the text; render with `text-anchor="middle"`. */
	x: number;
	y: number;
	fontSize: number;
	/** Palmer quadrant corner drawn around the text, as a stroked path. */
	corner?: string;
	/** Approximate area covered by the text and corner. */
	box: Box;
}

/** Space between a Palmer number and its corner, relative to the font size. */
const cornerGap = 0.2;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Builds a label centered at `x`, `y`. Palmer numbers get their quadrant
 * corner as lines, which align better than box-drawing characters.
 */
function makeLabel(
	toothId: string,
	x: number,
	y: number,
	fontSize: number,
	notation: ToothNotation,
): ToothNumberLabel {
	const palmer = notation === "Palmer";
	// The Palmer text form is the quadrant prefix plus the position: `UR6`.
	const text = palmer
		? formatToothNumber(toothId, notation, "text").slice(2)
		: formatToothNumber(toothId, notation);
	const pad = palmer ? fontSize * cornerGap : 0;
	const width = fontSize * digitWidthRatio * text.length + 2 * pad;
	const height = fontSize + 2 * pad;
	const box = { x: x - width / 2, y: y - height / 2, width, height };

	return {
		toothId,
		text,
		x,
		y,
		fontSize,
		...(palmer
			? { corner: palmerCorner(getPalmerQuadrant(toothId), box) }
			: {}),
		box,
	};
}

/**
 * Lines of a Palmer corner around a box: `┘` for upper right, `└` upper
 * left, `┌` lower left and `┐` lower right, as the quadrants are drawn.
 */
function palmerCorner(
	quadrant: PalmerQuadrant,
	{ x, y, width, height }: Box,
): string {
	const upper = quadrant.startsWith("upper");
	const right = quadrant.endsWith("right");
	// The horizontal line faces the other arch; the vertical one, the midline.
	const lineY = round(upper ? y + height : y);
	const otherY = round(upper ? y : y + height);
	const lineX = round(right ? x + width : x);
	const otherX = round(right ? x : x + width);

	return `M${otherX} ${lineY} L${lineX} ${lineY} L${lineX} ${otherY}`;
}

/**
 * Places each tooth number on the occlusal side of its tooth: perpendicular
 * to the arch on its inner side in `arch`, and between both rows in
 * `horizontal`. The
 * font size follows the teeth, so every layout keeps the same proportion.
 *
 * `chart` is the full composition viewBox, so positions stay stable when a
 * half of the chart is hidden.
 */
export function getToothNumberLabels(
	anchors: readonly ToothAnchor[],
	chart: Box,
	layout: OdontogramLayout,
	notation: ToothNotation = "FDI",
): ToothNumberLabel[] {
	if (!anchors.length) {
		return [];
	}

	const { frames, fontSize, gap } = getToothFrames(anchors, chart, layout);
	const chartCenter = {
		x: chart.x + chart.width / 2,
		y: chart.y + chart.height / 2,
	};

	if (layout === "horizontal") {
		return alignedRowLabels(anchors, chartCenter, fontSize, gap, notation);
	}

	const placed: ToothNumberLabel[] = [];

	for (const { toothId, box, center } of anchors) {
		const direction = frames.get(toothId)!.inner;
		const labelAt = (distance: number): ToothNumberLabel =>
			makeLabel(
				toothId,
				center.x + direction.x * distance,
				center.y + direction.y * distance,
				fontSize,
				notation,
			);
		const { width, height } = labelAt(0).box;

		// Start just outside the tooth and move further along the direction while
		// the text still touches any tooth or an earlier number (small primary
		// teeth of a mixed chart sit close together). Boxes are conservative, so
		// the curved outlines stay clear of the text.
		const start =
			halfExtent(box.width, box.height, direction) +
			gap +
			halfExtent(width, height, direction);
		const maximum = start + fontSize * 4;
		let label = labelAt(start);
		for (let distance = start; distance <= maximum; distance += gap) {
			label = labelAt(distance);
			const blocked =
				anchors.some((anchor) => boxesIntersect(anchor.box, label.box)) ||
				placed.some((other) => boxesIntersect(other.box, label.box));
			if (!blocked) {
				break;
			}
		}

		placed.push(label);
	}

	return placed;
}

/**
 * Horizontal rows: every number of an arch shares one baseline, just past
 * the row edge that faces the other arch.
 */
function alignedRowLabels(
	anchors: readonly ToothAnchor[],
	chartCenter: Point,
	fontSize: number,
	gap: number,
	notation: ToothNotation,
): ToothNumberLabel[] {
	const rowY = new Map<string, number>();

	for (const rowKey of new Set(anchors.map(({ row }) => row))) {
		const row = anchors.filter((anchor) => anchor.row === rowKey);
		const rowCenter =
			row.reduce((sum, { center }) => sum + center.y, 0) / row.length;
		const down = chartCenter.y >= rowCenter;
		const edge = down
			? Math.max(...row.map(({ box }) => box.y + box.height))
			: Math.min(...row.map(({ box }) => box.y));

		// Palmer corners add their gap around the text.
		const halfHeight =
			fontSize / 2 + (notation === "Palmer" ? fontSize * cornerGap : 0);
		rowY.set(rowKey, edge + (down ? 1 : -1) * (gap + halfHeight));
	}

	return anchors.map(({ toothId, row, center }) =>
		makeLabel(toothId, center.x, rowY.get(row)!, fontSize, notation),
	);
}

function boxesIntersect(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height
	);
}

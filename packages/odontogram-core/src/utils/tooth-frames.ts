import type { DentalArch } from "../types/odontogram";
import type { ToothAnchor, ToothRow } from "./anchors";
import type { OdontogramLayout } from "./layout";
import type { Box, Point } from "./svg-geometry";

/**
 * Local orientation of a tooth on screen, derived from the anchors. Numbers,
 * symbols and multi-tooth marks are placed with it, so they follow the arch
 * in every layout.
 */
export interface ToothFrame {
	toothId: string;
	arch: DentalArch;
	row: ToothRow;
	box: Box;
	center: Point;
	/** Smallest side of the box; symbols scale with it. */
	size: number;
	/** Unit direction to the inner side: the arch's lingual side, or the other row. */
	inner: Point;
	/** Opposite of `inner`: the arch's vestibular side, or away from the other row. */
	outer: Point;
	/** Unit direction toward the other arch, on the vertical axis. */
	occlusal: Point;
	/** Unit direction along the arch toward the midline. */
	mesial: Point;
}

export interface ToothFrames {
	frames: Map<string, ToothFrame>;
	/** Teeth of each row in arch order: right back to midline to left back. */
	order: Map<ToothRow, string[]>;
	/** Text size that keeps the same proportion to the teeth in every layout. */
	fontSize: number;
	/** Standard spacing between a tooth and what is drawn around it. */
	gap: number;
}

/** Font size relative to the median tooth width of a composition. */
const fontSizeRatio = 0.24;

/** Quadrants drawn on the patient's right side (the viewer's left). */
const rightQuadrants = new Set([1, 4, 5, 8]);

export function normalize({ x, y }: Point): Point {
	const length = Math.hypot(x, y) || 1;
	return { x: x / length, y: y / length };
}

/** Distance from a box center to its edge along a unit direction. */
export function halfExtent(
	width: number,
	height: number,
	direction: Point,
): number {
	const alongX = direction.x ? width / 2 / Math.abs(direction.x) : Infinity;
	const alongY = direction.y ? height / 2 / Math.abs(direction.y) : Infinity;

	return Math.min(alongX, alongY);
}

/**
 * Radius of the circle drawn around a whole tooth (e.g. a crown). It is the
 * widest symbol drawn over a tooth, so marks placed next to the tooth keep
 * clear of it.
 */
export function toothCircleRadius(box: Box): number {
	return (Math.hypot(box.width, box.height) / 2) * 0.82;
}

/** Stroke width of the symbols drawn over a tooth of a given size. */
export function toothSymbolStrokeWidth(size: number): number {
	return Math.max(1, size * 0.06);
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Computes the frame of every tooth. `chart` is the full composition viewBox,
 * so frames stay stable when a half of the chart is hidden.
 */
export function getToothFrames(
	anchors: readonly ToothAnchor[],
	chart: Box,
	layout: OdontogramLayout,
): ToothFrames {
	const frames = new Map<string, ToothFrame>();
	const order = new Map<ToothRow, string[]>();
	const fontSize = anchors.length
		? Math.round(
				fontSizeRatio * median(anchors.map(({ box }) => box.width)) * 10,
			) / 10
		: 0;
	const chartCenter = {
		x: chart.x + chart.width / 2,
		y: chart.y + chart.height / 2,
	};

	for (const row of new Set(anchors.map(({ row }) => row))) {
		// Along the arch: right side from the back to the midline, then left side
		// from the midline to the back (e.g. 18…11, 21…28).
		const along = (anchor: ToothAnchor) => {
			const position = Number(anchor.toothId.slice(1));
			return rightQuadrants.has(anchor.quadrant) ? -position : position;
		};
		const ordered = anchors
			.filter((anchor) => anchor.row === row)
			.sort((a, b) => along(a) - along(b));
		order.set(
			row,
			ordered.map(({ toothId }) => toothId),
		);

		ordered.forEach((anchor, index) => {
			const { center, box } = anchor;
			const toCenter = {
				x: chartCenter.x - center.x,
				y: chartCenter.y - center.y,
			};
			const occlusal = { x: 0, y: Math.sign(toCenter.y) || 1 };
			const previous = ordered[index - 1] ?? anchor;
			const next = ordered[index + 1] ?? anchor;
			const tangent =
				ordered.length > 1
					? normalize({
							x: next.center.x - previous.center.x,
							y: next.center.y - previous.center.y,
						})
					: { x: 1, y: 0 };

			let inner: Point;
			if (layout === "horizontal") {
				inner = occlusal;
			} else if (ordered.length > 1) {
				// Of the two perpendiculars to the arch, keep the one facing its inside.
				inner = { x: -tangent.y, y: tangent.x };
				if (inner.x * toCenter.x + inner.y * toCenter.y < 0) {
					inner = { x: -inner.x, y: -inner.y };
				}
			} else {
				inner = normalize(toCenter);
			}

			// Arch order runs toward the midline on the right side and away from it
			// on the left side.
			const mesial = rightQuadrants.has(anchor.quadrant)
				? tangent
				: { x: -tangent.x, y: -tangent.y };

			frames.set(anchor.toothId, {
				toothId: anchor.toothId,
				arch: anchor.arch,
				row,
				box,
				center,
				size: Math.min(box.width, box.height),
				inner,
				outer: { x: -inner.x, y: -inner.y },
				occlusal,
				mesial,
			});
		});
	}

	return { frames, order, fontSize, gap: fontSize * 0.3 };
}

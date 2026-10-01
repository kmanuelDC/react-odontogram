import type {
	OdontogramSurfaces,
	SurfaceShapeKind,
	ToothSurface,
	ToothSurfaceName,
} from "../types/surfaces";
import { toothSurfaces } from "../types/surfaces";
import { type Box, type Point, boxFromPoints } from "./svg-geometry";
import {
	type ToothFrame,
	type ToothFrames,
	halfExtent,
	toothCircleRadius,
	toothSymbolStrokeWidth,
} from "./tooth-frames";

/** One clickable surface of a diagram. */
export interface SurfaceShape {
	surface: ToothSurface;
	/** Clinical name on this tooth, e.g. `incisal` or `palatal`. */
	name: ToothSurfaceName;
	/** Closed polygon, in viewBox coordinates. */
	d: string;
	/** Corners of the polygon, in viewBox coordinates. */
	points: Point[];
}

/**
 * A five-surface diagram drawn next to a tooth: a square split into a central
 * occlusal square and four trapezoids. It is rotated with the tooth frame, so
 * the vestibular side faces out of the arch and the mesial side faces the
 * midline in every layout.
 */
export interface SurfaceDiagram {
	toothId: string;
	center: Point;
	/** Side of the square. */
	size: number;
	/** Unit directions of the diagram: out of the arch, and toward the midline. */
	axes: { vestibular: Point; mesial: Point };
	strokeWidth: number;
	/** In `toothSurfaces` order. */
	surfaces: SurfaceShape[];
	/** Area covered by the diagram, stroke included. */
	box: Box;
}

export interface SurfaceDiagramLayout {
	diagrams: SurfaceDiagram[];
	/**
	 * Distance the diagrams use beyond the vestibular edge of each tooth, so
	 * vestibular marks such as abbreviations can be placed past them.
	 */
	reserved: number;
}

/** Diagram side relative to the composition's font size. */
const sizeRatio = 2.4;
/** Side of the occlusal square relative to the diagram side. */
const innerRatio = 0.4;
/** Radius of the occlusal circle relative to the outer one, in circular diagrams. */
const circleInnerRatio = 0.45;
/** Segments used to draw a quarter of a circle; enough to look round. */
const quarterSegments = 12;
/**
 * Extra space, in viewBox units, between the symbols drawn over a tooth and
 * its diagram, and between the diagram and the marks placed past it.
 */
export const surfaceMargin = 3;

const upperQuadrants = new Set([1, 2, 5, 6]);

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Distance from a tooth center to its outline along a unit direction, using
 * the ellipse inscribed in its box: crowns are rounded, so the box corners
 * would leave diagonal diagrams too far from their tooth.
 */
function ellipseExtent(box: Box, { x, y }: Point): number {
	return Math.hypot((box.width / 2) * x, (box.height / 2) * y);
}

/**
 * Clinical name of a surface on an FDI tooth: incisal instead of occlusal on
 * incisors and canines, palatal instead of lingual on upper teeth.
 */
export function getSurfaceName(
	surface: ToothSurface,
	toothId: string,
): ToothSurfaceName {
	if (surface === "occlusal" && Number(toothId.slice(1)) <= 3) {
		return "incisal";
	}
	if (surface === "lingual" && upperQuadrants.has(Number(toothId[0]))) {
		return "palatal";
	}

	return surface;
}

/** Closed SVG path through some points. */
export function polygonPath(points: readonly Point[]): string {
	return `${points.map(({ x, y }, index) => `${index ? "L" : "M"}${round(x)} ${round(y)}`).join(" ")} Z`;
}

/**
 * Part of a convex polygon between two lines perpendicular to `axis`: the
 * points whose projection on `axis` lies in `[from, to]`.
 */
export function clipPolygon(
	points: readonly Point[],
	axis: Point,
	from: number,
	to: number,
): Point[] {
	const along = ({ x, y }: Point) => x * axis.x + y * axis.y;

	// Sutherland–Hodgman against one half-plane: keep points with `side(p) >= 0`.
	const clip = (
		polygon: readonly Point[],
		side: (p: Point) => number,
	): Point[] =>
		polygon.flatMap((current, index) => {
			const next = polygon[(index + 1) % polygon.length];
			const a = side(current);
			const b = side(next);
			const kept = a >= 0 ? [current] : [];
			if (a >= 0 !== b >= 0) {
				const t = a / (a - b);
				kept.push({
					x: current.x + (next.x - current.x) * t,
					y: current.y + (next.y - current.y) * t,
				});
			}
			return kept;
		});

	return clip(
		clip(points, (p) => along(p) - from),
		(p) => to - along(p),
	);
}

/**
 * Splits a surface into `count` equal strips and returns strip `index`. The
 * strips run across the surface: mesial–distal on the vestibular, lingual and
 * occlusal surfaces, vestibular–lingual on the mesial and distal ones.
 */
export function surfaceStrip(
	diagram: SurfaceDiagram,
	shape: SurfaceShape,
	index: number,
	count: number,
): Point[] {
	if (count <= 1) {
		return shape.points;
	}

	const axis =
		shape.surface === "mesial" || shape.surface === "distal"
			? diagram.axes.vestibular
			: diagram.axes.mesial;
	const projections = shape.points.map(({ x, y }) => x * axis.x + y * axis.y);
	const start = Math.min(...projections);
	const width = (Math.max(...projections) - start) / count;

	return clipPolygon(
		shape.points,
		axis,
		start + width * index,
		start + width * (index + 1),
	);
}

/**
 * Local points of each surface as `[vestibular, mesial]` offsets from the
 * diagram center, for an outer half side `h` and inner half side `k`.
 */
function localPolygons(
	h: number,
	k: number,
	shape: SurfaceShapeKind = "square",
): Record<ToothSurface, [number, number][]> {
	return shape === "circle"
		? circlePolygons(h, h * circleInnerRatio)
		: roundedSquarePolygons(h, k);
}

/** Corner radius of square diagrams, relative to the half side of each square. */
const cornerRadiusRatio = 0.22;
/** Segments used to draw half of a rounded corner. */
const cornerSegments = 4;

/**
 * Local points of a square diagram with rounded corners: an outer square of
 * half side `outer` and a central occlusal square of half side `inner`. The
 * diagonals that separate the side surfaces end at the middle of each
 * rounded corner.
 */
function roundedSquarePolygons(
	outer: number,
	inner: number,
): Record<ToothSurface, [number, number][]> {
	// Arc of the corner that points to `corner` degrees (45, 135…), between two angles.
	const arc = (
		half: number,
		corner: number,
		from: number,
		to: number,
	): [number, number][] => {
		const radius = half * cornerRadiusRatio;
		const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
		const cx =
			(half - radius) *
			Math.sign(Math.round(Math.cos(toRadians(corner)) * 1e9));
		const cy =
			(half - radius) *
			Math.sign(Math.round(Math.sin(toRadians(corner)) * 1e9));
		return Array.from({ length: cornerSegments + 1 }, (_, index) => {
			const angle = toRadians(from + ((to - from) * index) / cornerSegments);
			return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
		});
	};
	// Side of a square centered on `middle` degrees, from one corner middle to
	// the next: the end of one rounded corner, the straight edge (implied
	// between both arcs) and the start of the next corner. Both halves keep
	// all their points, so the side stays symmetric about `middle`.
	const side = (half: number, middle: number) => [
		...arc(half, middle - 45, middle - 45, middle),
		...arc(half, middle + 45, middle, middle + 45),
	];
	const sector = (middle: number) => [
		...side(outer, middle),
		...side(inner, middle).reverse(),
	];

	return {
		vestibular: sector(0),
		mesial: sector(90),
		lingual: sector(180),
		distal: sector(270),
		occlusal: [0, 90, 180, 270].flatMap((middle) =>
			side(inner, middle).slice(1),
		),
	};
}

/**
 * Local points of a circular diagram of radius `outer`: ring sectors of 90°
 * centered on each side axis (vestibular at 0°, mesial at 90°…) and a
 * central occlusal circle of radius `inner`. Arcs are sampled finely, so the
 * shapes stay plain polygons for clipping, letters and boxes.
 */
function circlePolygons(
	outer: number,
	inner: number,
): Record<ToothSurface, [number, number][]> {
	const at = (radius: number, degrees: number): [number, number] => {
		const radians = (degrees * Math.PI) / 180;
		return [radius * Math.cos(radians), radius * Math.sin(radians)];
	};
	const arc = (radius: number, from: number, to: number) =>
		Array.from({ length: quarterSegments + 1 }, (_, index) =>
			at(radius, from + ((to - from) * index) / quarterSegments),
		);
	const sector = (middle: number) => [
		...arc(outer, middle - 45, middle + 45),
		...arc(inner, middle + 45, middle - 45),
	];

	return {
		vestibular: sector(0),
		mesial: sector(90),
		lingual: sector(180),
		distal: sector(270),
		occlusal: Array.from({ length: quarterSegments * 4 }, (_, index) =>
			at(inner, (360 * index) / (quarterSegments * 4)),
		),
	};
}

/**
 * Builds the diagram of a tooth: a square (or circle) of side (diameter)
 * `size` centered at `center`, with its vestibular side along `vestibular` and its mesial side
 * along `mesial` (both unit vectors).
 */
export function buildSurfaceDiagram(
	toothId: string,
	center: Point,
	axes: { vestibular: Point; mesial: Point },
	size: number,
	strokeWidth = Math.max(0.5, round(size * 0.05)),
	shape: SurfaceShapeKind = "square",
): SurfaceDiagram {
	const { vestibular, mesial } = axes;
	const polygons = localPolygons(size / 2, (size / 2) * innerRatio, shape);
	const toWorld = ([v, m]: [number, number]): Point => ({
		x: center.x + vestibular.x * v + mesial.x * m,
		y: center.y + vestibular.y * v + mesial.y * m,
	});

	const surfaces = toothSurfaces.map((surface) => {
		const points = polygons[surface].map(toWorld);
		return {
			surface,
			name: getSurfaceName(surface, toothId),
			d: polygonPath(points),
			points,
		};
	});
	const corners = boxFromPoints(surfaces.flatMap(({ points }) => points));
	const half = strokeWidth / 2;

	return {
		toothId,
		center,
		size,
		axes,
		strokeWidth,
		surfaces,
		box: {
			x: corners.x - half,
			y: corners.y - half,
			width: corners.width + strokeWidth,
			height: corners.height + strokeWidth,
		},
	};
}

/** Quadrants drawn on the patient's right side (the viewer's left). */
const rightQuadrants = new Set([1, 4, 5, 8]);

/**
 * Screen orientation of a tooth's diagram in the horizontal layout, which
 * surface guides also use: vestibular up on upper teeth and down on lower
 * ones, mesial toward the midline (right on the patient's right side).
 */
export function getSurfaceAxes(toothId: string): {
	vestibular: Point;
	mesial: Point;
} {
	const quadrant = Number(toothId[0]);
	return {
		vestibular: { x: 0, y: upperQuadrants.has(quadrant) ? -1 : 1 },
		mesial: { x: rightQuadrants.has(quadrant) ? 1 : -1, y: 0 },
	};
}

/** Middle of a surface polygon, where its letter goes. */
export function surfaceCenter({ points }: Pick<SurfaceShape, "points">): Point {
	return {
		x: points.reduce((sum, { x }) => sum + x, 0) / points.length,
		y: points.reduce((sum, { y }) => sum + y, 0) / points.length,
	};
}

/**
 * Largest change of the diagram distance between neighbouring teeth,
 * relative to the diagram side. It keeps the diagrams of a row on a smooth
 * curve when tooth sizes jump (e.g. from a premolar to a first molar).
 */
const distanceSlopeRatio = 0.12;

/**
 * Smooths the distances of a row: every tooth keeps at least its own
 * distance, and neighbours differ by at most `slope`. The result is the
 * smallest such profile (the upper envelope of slopes around each tooth).
 */
function smoothDistances(required: readonly number[], slope: number): number[] {
	return required.map((_, index) =>
		Math.max(
			...required.map(
				(distance, other) => distance - slope * Math.abs(index - other),
			),
		),
	);
}

/**
 * Brings a diagram that sticks out of the curve of its row back onto it. It
 * applies to diagrams farther from their tooth than their two neighbours on
 * each side: in permanent arches, the first molars, whose larger size would
 * otherwise make the curve turn sharply there. The Catmull-Rom spline through
 * those neighbours gives where a smooth curve passes; the diagram moves
 * toward its tooth, down to `minimum`, which only keeps it off the tooth
 * outline.
 */
function fairDistances(
	row: readonly ToothFrame[],
	distances: readonly number[],
	minimum: readonly number[],
): number[] {
	const at = (index: number): Point => {
		const { center, outer } = row[index];
		return {
			x: center.x + outer.x * distances[index],
			y: center.y + outer.y * distances[index],
		};
	};

	return distances.map((distance, index) => {
		if (index < 2 || index > row.length - 3) {
			return distance;
		}
		// Only the diagram farther out than its two neighbours on each side
		// creates the kink; the others keep their full margin.
		const window = distances.slice(index - 2, index + 3);
		if (window.some((other, offset) => offset !== 2 && other >= distance)) {
			return distance;
		}

		const [a, b, c, d] = [
			at(index - 2),
			at(index - 1),
			at(index + 1),
			at(index + 2),
		];
		const curve = {
			x: (-a.x + 9 * b.x + 9 * c.x - d.x) / 16,
			y: (-a.y + 9 * b.y + 9 * c.y - d.y) / 16,
		};
		const { center, outer } = row[index];
		const onCurve =
			(curve.x - center.x) * outer.x + (curve.y - center.y) * outer.y;

		return onCurve < distance ? Math.max(onCurve, minimum[index]) : distance;
	});
}

/** Turn of a path at each of its inner points, in degrees. */
function pathTurns(points: readonly Point[]): number[] {
	return points.slice(1, -1).map((point, index) => {
		const [before, after] = [points[index], points[index + 2]];
		const turn =
			Math.atan2(after.y - point.y, after.x - point.x) -
			Math.atan2(point.y - before.y, point.x - before.x);
		return (Math.atan2(Math.sin(turn), Math.cos(turn)) * 180) / Math.PI;
	});
}

/** Candidate distances tried when placing a primary canine's diagram. */
const canineSteps = 120;

/**
 * Places the diagram of each primary canine (53, 63, 73, 83) so the curve
 * keeps the rhythm set by the incisors next to it. The provisional primary
 * arch turns sharply at the canine, and its diagram made a visible elbow
 * there. The diagram moves along the line out of its tooth, never onto the
 * outline (`minimum`), to where the turn of the curve changes most evenly
 * from the central incisor to the first molar.
 */
function fairPrimaryCanines(
	row: readonly ToothFrame[],
	distances: readonly number[],
	minimum: readonly number[],
	size: number,
): number[] {
	const result = [...distances];
	const pointAt = (index: number, distance = result[index]): Point => {
		const { center, outer } = row[index];
		return {
			x: center.x + outer.x * distance,
			y: center.y + outer.y * distance,
		};
	};

	row.forEach((frame, index) => {
		const isPrimaryCanine =
			frame.row.endsWith("primary") && frame.toothId[1] === "3";
		if (!isPrimaryCanine || index < 1 || index > row.length - 2) {
			return;
		}

		// The curve from two teeth before to two teeth after the canine.
		const from = Math.max(0, index - 3);
		const to = Math.min(row.length - 1, index + 3);
		const unevenness = (distance: number) => {
			const points = row
				.slice(from, to + 1)
				.map((_, offset) =>
					from + offset === index
						? pointAt(index, distance)
						: pointAt(from + offset),
				);
			const turns = pathTurns(points);
			return turns
				.slice(1)
				.reduce(
					(sum, turn, position) => sum + (turn - turns[position]) ** 2,
					0,
				);
		};

		const lowest = minimum[index];
		const highest = distances[index] + size;
		let best = distances[index];
		let bestScore = unevenness(best);
		for (let step = 0; step <= canineSteps; step++) {
			const distance = lowest + ((highest - lowest) * step) / canineSteps;
			const score = unevenness(distance);
			if (score < bestScore) {
				best = distance;
				bestScore = score;
			}
		}
		result[index] = best;
	});

	return result;
}

/**
 * Places one surface diagram on the vestibular side of every tooth. All
 * diagrams share one size, which follows the teeth like the tooth numbers.
 *
 * Each diagram keeps clear of its tooth and of the widest symbol drawn over
 * it (the circle of a crown). Along each row, diagrams that stick out of the
 * curve are brought back onto it (they may then give up that extra margin,
 * never the tooth outline), and the distances are smoothed so the diagrams
 * follow the arch instead of jumping out next to larger teeth.
 */
export function getSurfaceDiagrams(
	{ frames, order, fontSize, gap }: ToothFrames,
	options: {
		/**
		 * Brings diagrams that stick out of a curved row back onto it (see
		 * `fairDistances`). Meant for the `arch` layout; rows of `horizontal` are
		 * straight and keep every margin.
		 */
		fairCurve?: boolean;
		/** Square (default) or circular diagrams. */
		shape?: SurfaceShapeKind;
		/**
		 * Places every diagram of a row on one line, at the level of the tooth
		 * that needs the most room; the others end up farther from their tooth.
		 * Meant for the `horizontal` layout, whose rows share one vestibular
		 * direction.
		 */
		alignRows?: boolean;
	} = {},
): SurfaceDiagramLayout {
	const size = round(fontSize * sizeRatio);
	const h = size / 2;

	// Distance from each tooth center to its diagram center, before smoothing,
	// and the least one, which only keeps the diagram off the tooth outline.
	const required = new Map<string, number>();
	const minimum = new Map<string, number>();
	for (const frame of frames.values()) {
		const outline = ellipseExtent(frame.box, frame.outer);
		const clearance = Math.max(
			outline,
			toothCircleRadius(frame.box) + toothSymbolStrokeWidth(frame.size) / 2,
		);
		required.set(frame.toothId, clearance + gap + surfaceMargin + h);
		minimum.set(frame.toothId, outline + gap + h);
	}

	const distances = new Map<string, number>();
	for (const ids of order.values()) {
		const row = ids.map((toothId) => frames.get(toothId)!);
		const distancesOfRow = ids.map((toothId) => required.get(toothId)!);
		const faired = options.fairCurve
			? fairDistances(
					row,
					distancesOfRow,
					ids.map((toothId) => minimum.get(toothId)!),
				)
			: distancesOfRow;
		if (options.alignRows) {
			// The line sits where the farthest diagram of the row would go.
			const along = (frame: ToothFrame, distance: number) =>
				(frame.center.x + frame.outer.x * distance) * frame.outer.x +
				(frame.center.y + frame.outer.y * distance) * frame.outer.y;
			const line = Math.max(
				...row.map((frame, index) => along(frame, distancesOfRow[index])),
			);
			row.forEach((frame) =>
				distances.set(frame.toothId, line - along(frame, 0)),
			);
			continue;
		}

		const smoothed = smoothDistances(faired, size * distanceSlopeRatio);
		const final = options.fairCurve
			? fairPrimaryCanines(
					row,
					smoothed,
					ids.map((toothId) => minimum.get(toothId)!),
					size,
				)
			: smoothed;
		ids.forEach((toothId, index) => distances.set(toothId, final[index]));
	}

	const diagrams: SurfaceDiagram[] = [];
	let reserved = 0;

	for (const frame of frames.values()) {
		const vestibular = frame.outer;
		// The side axis is perpendicular to the vestibular one and points to the midline.
		let mesial = { x: -vestibular.y, y: vestibular.x };
		if (mesial.x * frame.mesial.x + mesial.y * frame.mesial.y < 0) {
			mesial = { x: -mesial.x, y: -mesial.y };
		}

		const distance =
			distances.get(frame.toothId) ?? required.get(frame.toothId)!;
		const center = {
			x: frame.center.x + vestibular.x * distance,
			y: frame.center.y + vestibular.y * distance,
		};

		diagrams.push(
			buildSurfaceDiagram(
				frame.toothId,
				center,
				{ vestibular, mesial },
				size,
				undefined,
				options.shape,
			),
		);
		// Vestibular marks are measured from the tooth box edge along the same direction.
		const farEdge =
			distance + h - halfExtent(frame.box.width, frame.box.height, vestibular);
		reserved = Math.max(reserved, farEdge + surfaceMargin);
	}

	return { diagrams, reserved };
}

/**
 * Returns a new surfaces model with one surface of a tooth toggled. Surfaces
 * keep the `toothSurfaces` order and teeth without surfaces are removed.
 */
export function toggleSurface(
	surfaces: OdontogramSurfaces | undefined,
	toothId: string,
	surface: ToothSurface,
): OdontogramSurfaces {
	const current = new Set(surfaces?.[toothId] ?? []);
	if (current.has(surface)) {
		current.delete(surface);
	} else {
		current.add(surface);
	}

	const next = { ...surfaces };
	if (current.size) {
		next[toothId] = toothSurfaces.filter((item) => current.has(item));
	} else {
		delete next[toothId];
	}

	return next;
}

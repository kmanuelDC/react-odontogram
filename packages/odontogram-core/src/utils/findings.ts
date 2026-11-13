import type {
	FindingCatalog,
	FindingDefinition,
	FindingLocation,
	FindingScope,
	FindingStatus,
	FindingSymbol,
	FindingSymbolKind,
	FindingTone,
	OdontogramFinding,
} from "../types/findings";
import { type ToothSurface, toothSurfaces } from "../types/surfaces";
import {
	type SurfaceDiagram,
	type SurfaceDiagramLayout,
	polygonPath,
	surfaceStrip,
} from "./surfaces";
import {
	type Box,
	type Point,
	boxFromPoints,
	getPathBox,
} from "./svg-geometry";
import {
	type ToothFrame,
	type ToothFrames,
	halfExtent,
	normalize,
	toothCircleRadius,
	toothSymbolStrokeWidth,
} from "./tooth-frames";

/**
 * A drawing instruction, in viewBox coordinates, in the finding color:
 * paths and circles are stroked, areas and text are filled.
 */
export type FindingPrimitive =
	| { type: "path"; d: string }
	| { type: "area"; d: string }
	| { type: "circle"; cx: number; cy: number; r: number }
	| { type: "text"; x: number; y: number; text: string; fontSize: number };

/** A finding ready to draw. */
export interface RenderedFinding {
	/** Stable key: finding index and, for single-tooth findings, the tooth. */
	key: string;
	code: string;
	name: string;
	status: FindingStatus;
	/** Resolved default color; `color`, when set, overrides it. */
	tone: FindingTone;
	color?: string;
	/** Every tooth the finding covers (a span includes its whole range). */
	teeth: string[];
	/** Surfaces drawn by a surface finding, in `toothSurfaces` order. */
	surfaces?: ToothSurface[];
	/** Crown or root placement of a single-tooth finding, when set. */
	location?: FindingLocation;
	strokeWidth: number;
	primitives: FindingPrimitive[];
	/** Area covered by the drawing. */
	box: Box;
}

export interface FindingLayout {
	findings: RenderedFinding[];
	/** Findings that could not be drawn, and why. */
	issues: string[];
}

const surfaceKinds = new Set<FindingSymbolKind>(["fill", "outline"]);
const betweenKinds = new Set<FindingSymbolKind>([
	"diastema",
	"transposition",
	"fused-circles",
	"apical-text",
]);
/** Single-tooth symbols drawn in the root zone, at least in part. */
const rootKinds = new Set<FindingSymbolKind>(["root-line", "post-core"]);
const spanKinds = new Set<FindingSymbolKind>([
	"bridge",
	"double-line",
	"brackets",
	"zigzag-line",
	"center-line",
]);
const textKinds = new Set<FindingSymbolKind>(["text", "encircled-text"]);

/** Approximate advance of a character relative to the font size. */
const characterWidthRatio = 0.62;

export function getFindingScope(symbol: FindingSymbol): FindingScope {
	if (surfaceKinds.has(symbol.kind)) {
		return "surface";
	}
	if (betweenKinds.has(symbol.kind)) {
		return "between";
	}

	return spanKinds.has(symbol.kind) ? "span" : "tooth";
}

// Vector helpers.
const add = (p: Point, v: Point, k = 1): Point => ({
	x: p.x + v.x * k,
	y: p.y + v.y * k,
});
const perpendicular = ({ x, y }: Point): Point => ({ x: -y, y: x });
const rotate = ({ x, y }: Point, degrees: number): Point => {
	const radians = (degrees * Math.PI) / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	return { x: x * cos - y * sin, y: x * sin + y * cos };
};
const round = (value: number) => Math.round(value * 100) / 100;
const point = ({ x, y }: Point) => `${round(x)} ${round(y)}`;
const polyline = (points: readonly Point[]) =>
	points.map((p, index) => `${index ? "L" : "M"}${point(p)}`).join(" ");
/** Closed rectangle centered at `c`. */
const rectangle = (c: Point, width: number, height: number) =>
	`M${point({ x: c.x - width / 2, y: c.y - height / 2 })} h${round(width)} v${round(height)} h${round(-width)} Z`;

function arrowHead(tip: Point, direction: Point, length: number): string {
	const back = { x: -direction.x, y: -direction.y };
	return polyline([
		add(tip, rotate(back, 28), length),
		tip,
		add(tip, rotate(back, -28), length),
	]);
}

function arrow(from: Point, to: Point, headLength: number): FindingPrimitive[] {
	const direction = normalize({ x: to.x - from.x, y: to.y - from.y });
	return [
		{ type: "path", d: polyline([from, to]) },
		{ type: "path", d: arrowHead(to, direction, headLength) },
	];
}

/** Zigzag between two points, `segments` long, `amplitude` wide. */
function zigzagPoints(
	from: Point,
	to: Point,
	segments: number,
	amplitude: number,
): Point[] {
	const along = {
		x: (to.x - from.x) / segments,
		y: (to.y - from.y) / segments,
	};
	const side = perpendicular(normalize(along));

	return Array.from({ length: segments + 1 }, (_, index) => {
		const base = add(from, along, index);
		return index === 0 || index === segments
			? base
			: add(base, side, index % 2 ? amplitude : -amplitude);
	});
}

function arrowDirection(
	frame: ToothFrame,
	direction: Extract<FindingSymbol, { kind: "arrow" }>["direction"],
	findingDirection: OdontogramFinding["direction"],
): Point {
	const resolved =
		direction === "auto" ? (findingDirection ?? "mesial") : direction;
	const vectors: Record<typeof resolved, Point> = {
		occlusal: frame.occlusal,
		apical: { x: -frame.occlusal.x, y: -frame.occlusal.y },
		mesial: frame.mesial,
		distal: { x: -frame.mesial.x, y: -frame.mesial.y },
	};

	return vectors[resolved];
}

/** Symbols drawn over a single tooth, except abbreviations. */
function toothSymbol(
	symbol: FindingSymbol,
	frame: ToothFrame,
	finding: Pick<OdontogramFinding, "direction">,
	root?: ToothFrame,
): FindingPrimitive[] {
	const { box, center, size, occlusal, mesial, outer } = frame;
	// Far end of the root: the end of the root zone, else the tooth edge.
	const apex = root
		? add(root.center, outer, root.size / 2)
		: add(center, outer, halfExtent(box.width, box.height, outer));
	const length = size * 0.7;
	const head = size * 0.18;

	switch (symbol.kind) {
		case "line":
			return [
				{
					type: "path",
					d: polyline([
						{ x: box.x + box.width * 0.2, y: box.y + box.height * 0.8 },
						{ x: box.x + box.width * 0.8, y: box.y + box.height * 0.2 },
					]),
				},
			];
		case "cross": {
			const inset = size * 0.12;
			const [left, right] = [box.x + inset, box.x + box.width - inset];
			const [top, bottom] = [box.y + inset, box.y + box.height - inset];
			return [
				{
					type: "path",
					d: polyline([
						{ x: left, y: top },
						{ x: right, y: bottom },
					]),
				},
				{
					type: "path",
					d: polyline([
						{ x: right, y: top },
						{ x: left, y: bottom },
					]),
				},
			];
		}
		case "square": {
			const pad = size * 0.08;
			return [
				{
					type: "path",
					d: rectangle(center, box.width + pad * 2, box.height + pad * 2),
				},
			];
		}
		case "pulp":
			return [{ type: "area", d: rectangle(center, size * 0.32, size * 0.32) }];
		case "root-line":
			return [
				{
					type: "path",
					d: polyline([
						root ? add(root.center, outer, -root.size / 2) : center,
						apex,
					]),
				},
			];
		case "post-core": {
			const side = size * 0.3;
			return [
				{ type: "path", d: rectangle(center, side, side) },
				{
					type: "path",
					d: polyline([add(center, outer, side / 2), apex]),
				},
			];
		}
		case "circle":
		case "number-circle":
			return [
				{
					type: "circle",
					cx: center.x,
					cy: center.y,
					r: toothCircleRadius(box),
				},
			];
		case "double-circle": {
			const r = size * 0.36;
			return [-1, 1].map((sign) => {
				const c = add(center, mesial, sign * size * 0.2);
				return { type: "circle" as const, cx: c.x, cy: c.y, r };
			});
		}
		case "triangle": {
			const r = size * 0.38;
			const side = perpendicular(occlusal);
			const apex = add(center, occlusal, r);
			const base = add(center, occlusal, -r * 0.5);
			return [
				{
					type: "path",
					d: `${polyline([apex, add(base, side, r * 0.87), add(base, side, -r * 0.87)])} Z`,
				},
			];
		}
		case "arrow": {
			const direction = arrowDirection(
				frame,
				symbol.direction,
				finding.direction,
			);
			return arrow(
				add(center, direction, -length / 2),
				add(center, direction, length / 2),
				head,
			);
		}
		case "curved-arrow": {
			// An arc over the top of the tooth, turning clockwise on screen.
			const r = size * 0.3;
			const start = (160 * Math.PI) / 180;
			const end = (380 * Math.PI) / 180;
			const from = {
				x: center.x + r * Math.cos(start),
				y: center.y + r * Math.sin(start),
			};
			const to = {
				x: center.x + r * Math.cos(end),
				y: center.y + r * Math.sin(end),
			};
			const tangent = { x: -Math.sin(end), y: Math.cos(end) };
			return [
				{
					type: "path",
					d: `M${point(from)} A${round(r)} ${round(r)} 0 1 1 ${point(to)}`,
				},
				{ type: "path", d: arrowHead(to, tangent, head) },
			];
		}
		case "zigzag": {
			const from = add(center, occlusal, -length / 2);
			const to = add(center, occlusal, length / 2);
			return [
				{ type: "path", d: polyline(zigzagPoints(from, to, 5, size * 0.1)) },
				{ type: "path", d: arrowHead(to, occlusal, head) },
			];
		}
		default:
			return [];
	}
}

function textSize(
	text: string,
	fontSize: number,
): { width: number; height: number } {
	return {
		width: Math.max(1, text.length) * fontSize * characterWidthRatio,
		height: fontSize,
	};
}

/** Abbreviation centered at `at`; encircled when requested. */
function textSymbol(
	text: string,
	at: Point,
	fontSize: number,
	encircled: boolean,
): FindingPrimitive[] {
	const primitives: FindingPrimitive[] = [
		{ type: "text", x: at.x, y: at.y, text, fontSize },
	];
	if (encircled) {
		primitives.unshift({
			type: "circle",
			cx: at.x,
			cy: at.y,
			r: fontSize * 0.72,
		});
	}

	return primitives;
}

function betweenSymbol(
	symbol: FindingSymbol,
	a: ToothFrame,
	b: ToothFrame,
): FindingPrimitive[] {
	const size = Math.min(a.size, b.size);
	const middle = {
		x: (a.center.x + b.center.x) / 2,
		y: (a.center.y + b.center.y) / 2,
	};
	const along = normalize({
		x: b.center.x - a.center.x,
		y: b.center.y - a.center.y,
	});
	const side = perpendicular(along);
	const gap = size * 0.12;
	const height = size * 0.35;

	if (symbol.kind === "apical-text") {
		return textSymbol(symbol.text, middle, size * 0.45, true);
	}

	if (symbol.kind === "fused-circles") {
		// Each circle reaches past the midpoint, so the two always intersect.
		const half =
			Math.hypot(b.center.x - a.center.x, b.center.y - a.center.y) / 2;
		return [a, b].map(({ center, box }) => ({
			type: "circle" as const,
			cx: center.x,
			cy: center.y,
			r: Math.max(toothCircleRadius(box), half * 1.2),
		}));
	}

	if (symbol.kind === "diastema") {
		// ")(": each arc bulges toward the space between the teeth.
		return [-1, 1].map((sign) => {
			const base = add(middle, along, sign * gap * 1.6);
			const control = add(middle, along, sign * gap * 0.2);
			return {
				type: "path" as const,
				d: `M${point(add(base, side, height))} Q${point(control)} ${point(add(base, side, -height))}`,
			};
		});
	}

	// Transposition: two crossed curved arrows between the tooth centers.
	const head = size * 0.16;
	return [1, -1].flatMap((sign) => {
		const [from, to] = sign > 0 ? [a.center, b.center] : [b.center, a.center];
		const control = add(middle, side, sign * height * 1.4);
		const end = normalize({ x: to.x - control.x, y: to.y - control.y });
		return [
			{
				type: "path" as const,
				d: `M${point(from)} Q${point(control)} ${point(to)}`,
			},
			{ type: "path" as const, d: arrowHead(to, end, head) },
		];
	});
}

/** Point on the vestibular side of a tooth, `extra` beyond its edge. */
function outerPoint(frame: ToothFrame, extra: number): Point {
	return add(
		frame.center,
		frame.outer,
		halfExtent(frame.box.width, frame.box.height, frame.outer) + extra,
	);
}

function spanSymbol(
	symbol: FindingSymbol,
	frames: readonly ToothFrame[],
	gap: number,
	reserved = 0,
): FindingPrimitive[] {
	const size = Math.min(...frames.map(({ size }) => size));

	if (symbol.kind === "center-line") {
		return [{ type: "path", d: polyline(frames.map(({ center }) => center)) }];
	}

	const line = frames.map((frame) => outerPoint(frame, reserved + gap));

	switch (symbol.kind) {
		case "bridge": {
			// End caps point back toward the first and last tooth.
			const caps = [frames[0], frames[frames.length - 1]].map(
				(frame, index) => {
					const end = line[index ? line.length - 1 : 0];
					return {
						type: "path" as const,
						d: polyline([end, add(end, frame.outer, -gap * 1.5)]),
					};
				},
			);
			return [{ type: "path", d: polyline(line) }, ...caps];
		}
		case "double-line":
			return [0.4, -0.4].map((offset) => ({
				type: "path" as const,
				d: polyline(
					frames.map((frame, index) =>
						add(line[index], frame.outer, gap * offset),
					),
				),
			}));
		case "brackets": {
			const half = size * 0.09;
			return [
				{ type: "path", d: polyline(line) },
				...line.map((p) => ({
					type: "path" as const,
					d: `M${point({ x: p.x - half, y: p.y - half })} h${round(half * 2)} v${round(half * 2)} h${round(-half * 2)} Z`,
				})),
			];
		}
		case "zigzag-line": {
			const points = line.flatMap((p, index) =>
				index ? zigzagPoints(line[index - 1], p, 4, gap * 0.6).slice(1) : [p],
			);
			return [{ type: "path", d: polyline(points) }];
		}
		default:
			return [];
	}
}

/**
 * Areas or outlines of some surfaces of a diagram. `strip` gives, per
 * surface, which strip of how many a fill uses when several fills share it.
 */
function surfaceSymbol(
	symbol: FindingSymbol,
	diagram: SurfaceDiagram,
	surfaces: readonly ToothSurface[],
	strip: (surface: ToothSurface) => { index: number; count: number },
): FindingPrimitive[] {
	if (symbol.kind !== "fill") {
		return diagram.surfaces
			.filter(({ surface }) => surfaces.includes(surface))
			.map(({ d }) => ({ type: "path", d }));
	}

	return diagram.surfaces
		.filter(({ surface }) => surfaces.includes(surface))
		.map((shape) => {
			const { index, count } = strip(shape.surface);
			return {
				type: "area",
				d:
					count > 1
						? polygonPath(surfaceStrip(diagram, shape, index, count))
						: shape.d,
			};
		});
}

/** Surfaces a surface finding covers: the listed ones, or every surface. */
function findingSurfaces(finding: OdontogramFinding): ToothSurface[] {
	return finding.surfaces?.length
		? toothSurfaces.filter((surface) => finding.surfaces!.includes(surface))
		: [...toothSurfaces];
}

/**
 * Default color of a finding: its own tone, else red while planned and blue
 * once done, else the catalog tone.
 */
export function resolveFindingTone(
	finding: Pick<OdontogramFinding, "status" | "tone">,
	definition: Pick<FindingDefinition, "tone">,
): FindingTone {
	if (finding.tone) {
		return finding.tone;
	}
	if (finding.status === "planned") {
		return "bad";
	}

	return finding.status === "done" ? "good" : definition.tone;
}

function primitivesBox(
	primitives: readonly FindingPrimitive[],
	strokeWidth: number,
): Box {
	const points = primitives.flatMap((primitive): Point[] => {
		if (primitive.type === "circle") {
			const { cx, cy, r } = primitive;
			return [
				{ x: cx - r, y: cy - r },
				{ x: cx + r, y: cy + r },
			];
		}
		if (primitive.type === "text") {
			const { width, height } = textSize(primitive.text, primitive.fontSize);
			return [
				{ x: primitive.x - width / 2, y: primitive.y - height / 2 },
				{ x: primitive.x + width / 2, y: primitive.y + height / 2 },
			];
		}
		const { x, y, width, height } = getPathBox(primitive.d);
		return [
			{ x, y },
			{ x: x + width, y: y + height },
		];
	});
	const box = boxFromPoints(points);
	const half = strokeWidth / 2;

	return {
		x: box.x - half,
		y: box.y - half,
		width: box.width + strokeWidth,
		height: box.height + strokeWidth,
	};
}

const boxCenter = ({ x, y, width, height }: Box): Point => ({
	x: x + width / 2,
	y: y + height / 2,
});

/**
 * Two ellipses, each enclosing the number of one tooth and stretched toward
 * the other number so that they cross midway, however far apart the numbers.
 */
function fusedNumbers(a: Box, b: Box): FindingPrimitive[] {
	const [ca, cb] = [boxCenter(a), boxCenter(b)];
	const r =
		Math.max(...[a, b].map(({ width, height }) => Math.hypot(width, height))) *
		0.55;
	const half = Math.hypot(cb.x - ca.x, cb.y - ca.y) / 2;
	const u = normalize({ x: cb.x - ca.x, y: cb.y - ca.y });
	// Semi-axis along the numbers: from just behind a number to past the midpoint.
	const rx = Math.max(r, (half + r * 1.3) / 2);
	const ry = r * 1.2;
	const angle = round((Math.atan2(u.y, u.x) * 180) / Math.PI);

	return (
		[
			[ca, 1],
			[cb, -1],
		] as const
	).map(([c, sign]) => {
		const center = add(c, u, sign * (rx - r));
		const [from, to] = [add(center, u, -rx), add(center, u, rx)];
		const arc = `A${round(rx)} ${round(ry)} ${angle} 1 0`;
		return {
			type: "path" as const,
			d: `M${point(from)} ${arc} ${point(to)} ${arc} ${point(from)}`,
		};
	});
}

/** Length of the root zone, along the vestibular direction. */
const rootLength = (fontSize: number) => fontSize * 1.8;

/** Distance where the root zone starts: past `reserved` and any span line. */
const rootStart = (reserved: number, gap: number) => reserved + gap * 1.6;

/** The box where a tooth's abbreviations are written, past its root zone. */
export interface FindingBox {
	toothId: string;
	box: Box;
}

/**
 * One box per tooth on its vestibular side, past the surface diagrams
 * (`reserved`), span lines and root zone, like the boxes of a printed chart.
 */
export function getFindingBoxes(
	{ frames, fontSize, gap }: ToothFrames,
	reserved = 0,
): FindingBox[] {
	const height = fontSize * 1.5;
	const distance = rootStart(reserved, gap) + gap * 2 + rootLength(fontSize);

	return [...frames.values()].map((frame) => {
		const width = frame.size;
		const center = outerPoint(
			frame,
			distance + halfExtent(width, height, frame.outer),
		);
		return {
			toothId: frame.toothId,
			box: {
				x: center.x - width / 2,
				y: center.y - height / 2,
				width,
				height,
			},
		};
	});
}

/** A square frame over the root zone of a tooth, to draw symbols in it. */
function rootFrame(
	frame: ToothFrame,
	reserved: number,
	gap: number,
	fontSize: number,
): ToothFrame {
	const size = rootLength(fontSize);
	const center = outerPoint(frame, rootStart(reserved, gap) + gap + size / 2);
	return {
		...frame,
		center,
		size,
		box: {
			x: center.x - size / 2,
			y: center.y - size / 2,
			width: size,
			height: size,
		},
	};
}

/**
 * Lays out findings on the visible teeth. Unknown codes, hidden teeth,
 * invalid tooth groups and surface findings without surface diagrams are
 * skipped and reported in `issues`.
 *
 * With `surfaceLayout`, surface findings are drawn on its diagrams and
 * vestibular marks are placed past them. With `boxes`, abbreviations without
 * `location` are written side by side in the boxes of {@link getFindingBoxes}.
 * Findings with `location: "root"` are drawn in the root zone, before them.
 */
export function layoutFindings(
	findings: readonly OdontogramFinding[],
	catalog: FindingCatalog,
	toothFrames: ToothFrames,
	surfaceLayout?: SurfaceDiagramLayout,
	{
		boxes = false,
		numbers,
	}: {
		boxes?: boolean;
		/** Boxes of the tooth numbers shown, keyed by FDI ID, for number circles. */
		numbers?: ReadonlyMap<string, Box>;
	} = {},
): FindingLayout {
	const { frames, order, fontSize, gap } = toothFrames;
	const reserved = surfaceLayout?.reserved ?? 0;
	const diagrams = new Map(
		surfaceLayout?.diagrams.map((diagram) => [diagram.toothId, diagram]),
	);
	const rendered: RenderedFinding[] = [];
	const issues: string[] = [];
	const textSize_ = fontSize * 0.9;
	// Distance already used on the vestibular side of each tooth.
	const outerCursor = new Map<string, number>();
	const findingBoxes = new Map(
		boxes
			? getFindingBoxes(toothFrames, reserved).map(({ toothId, box }) => [
					toothId,
					box,
				])
			: [],
	);
	/** Abbreviation a single-tooth finding writes in the box, if any. */
	const boxTextOf = (finding: OdontogramFinding) => {
		const definition = catalog[finding.code];
		if (
			!boxes ||
			!definition ||
			getFindingScope(definition.symbol) !== "tooth"
		) {
			return undefined;
		}
		if (textKinds.has(definition.symbol.kind)) {
			return finding.location
				? undefined
				: (finding.label ?? (definition.symbol as { text: string }).text);
		}
		return finding.label ?? definition.boxText;
	};
	// Abbreviations sharing a box split it into slots, in the order given.
	const boxTexts = new Map<string, number[]>();
	findings.forEach((finding, index) => {
		if (!boxTextOf(finding)) {
			return;
		}
		for (const toothId of finding.teeth) {
			boxTexts.set(toothId, [...(boxTexts.get(toothId) ?? []), index]);
		}
	});

	const makeFinding = (
		key: string,
		finding: OdontogramFinding,
		definition: FindingDefinition,
		teeth: string[],
		primitives: FindingPrimitive[],
		size: number,
		strokeWidth = toothSymbolStrokeWidth(size),
	): RenderedFinding => ({
		key,
		code: finding.code,
		name: definition.name,
		status: finding.status ?? "existing",
		tone: resolveFindingTone(finding, definition),
		...(finding.color ? { color: finding.color } : {}),
		teeth,
		strokeWidth,
		primitives,
		box: primitivesBox(primitives, strokeWidth),
	});

	// Fills sharing a surface split it into strips, in the order they were given.
	const fillsBySurface = new Map<string, number[]>();
	findings.forEach((finding, index) => {
		if (catalog[finding.code]?.symbol.kind !== "fill") {
			return;
		}
		for (const toothId of finding.teeth) {
			for (const surface of findingSurfaces(finding)) {
				const key = `${toothId}:${surface}`;
				fillsBySurface.set(key, [...(fillsBySurface.get(key) ?? []), index]);
			}
		}
	});
	const stripOf =
		(index: number, toothId: string) => (surface: ToothSurface) => {
			const fills = fillsBySurface.get(`${toothId}:${surface}`) ?? [index];
			return { index: fills.indexOf(index), count: fills.length };
		};

	// Spans, then root findings, so abbreviations on the same teeth are placed
	// beyond them.
	const indexed = findings.map((finding, index) => ({ finding, index }));
	const rank = ({ finding }: (typeof indexed)[number]) => {
		const definition = catalog[finding.code];
		if (definition && getFindingScope(definition.symbol) === "span") {
			return 0;
		}
		return finding.location === "root" ||
			rootKinds.has(definition?.symbol.kind ?? "fill")
			? 1
			: 2;
	};
	const rootEnd = rootStart(reserved, gap) + gap + rootLength(fontSize);
	const reserveRoot = (toothId: string) =>
		outerCursor.set(
			toothId,
			Math.max(outerCursor.get(toothId) ?? reserved, rootEnd),
		);
	const ordered = [...indexed].sort((a, b) => rank(a) - rank(b));

	for (const { finding, index } of ordered) {
		const definition = catalog[finding.code];
		if (!definition) {
			issues.push(`Unknown finding code "${finding.code}".`);
			continue;
		}

		const { symbol } = definition;
		const visible = finding.teeth.filter((toothId) => frames.has(toothId));
		const scope = getFindingScope(symbol);

		if (scope === "surface") {
			if (!visible.length) {
				continue;
			}
			if (!diagrams.size) {
				issues.push(
					`Finding "${finding.code}" is drawn on tooth surfaces and needs showSurfaces.`,
				);
				continue;
			}

			const surfaces = findingSurfaces(finding);
			for (const toothId of visible) {
				const diagram = diagrams.get(toothId)!;
				const strokeWidth =
					diagram.strokeWidth * (symbol.kind === "outline" ? 2.5 : 1);
				rendered.push({
					...makeFinding(
						`${index}:${toothId}`,
						finding,
						definition,
						[toothId],
						surfaceSymbol(symbol, diagram, surfaces, stripOf(index, toothId)),
						diagram.size,
						strokeWidth,
					),
					surfaces,
				});
			}
			continue;
		}

		if (scope === "tooth") {
			for (const toothId of visible) {
				const frame = frames.get(toothId)!;
				const root = rootFrame(frame, reserved, gap, fontSize);
				const isText = textKinds.has(symbol.kind);
				const encircled = symbol.kind === "encircled-text";
				const text = finding.label ?? (symbol as { text?: string }).text ?? "";
				const boxText = boxTextOf(finding);
				const box = boxText ? findingBoxes.get(toothId) : undefined;
				const numberBox = numbers?.get(toothId);
				let primitives: FindingPrimitive[] = [];

				if (isText && finding.location) {
					const at = finding.location === "root" ? root : frame;
					primitives = textSymbol(text, at.center, textSize_, encircled);
				} else if (isText && !box) {
					const { width, height } = encircled
						? { width: textSize_ * 1.44, height: textSize_ * 1.44 }
						: textSize(text, textSize_);
					const used = outerCursor.get(toothId) ?? reserved;
					const extent = halfExtent(width, height, frame.outer);
					const distance = used + gap + extent;
					primitives = textSymbol(
						text,
						outerPoint(frame, distance),
						textSize_,
						encircled,
					);
					outerCursor.set(toothId, distance + extent);
				} else if (symbol.kind === "number-circle" && numberBox) {
					const { x, y } = boxCenter(numberBox);
					primitives = [
						{
							type: "circle",
							cx: x,
							cy: y,
							r: (Math.hypot(numberBox.width, numberBox.height) / 2) * 1.1,
						},
					];
				} else if (!isText) {
					primitives = toothSymbol(
						symbol,
						finding.location === "root" ? root : frame,
						finding,
						root,
					);
				}

				if (box && boxText) {
					const slots = boxTexts.get(toothId)!;
					const width = box.width / slots.length;
					const boxEncircled = encircled && !finding.label;
					// Shrinks long or many abbreviations to fit their slot.
					const fitted = boxEncircled
						? Math.min(width, box.height) / 1.6
						: (width * 0.9) /
							(Math.max(1, boxText.length) * characterWidthRatio);
					primitives = [
						...primitives,
						...textSymbol(
							boxText,
							{
								x: box.x + width * (slots.indexOf(index) + 0.5),
								y: box.y + box.height / 2,
							},
							Math.min(textSize_, fitted, box.height * 0.75),
							boxEncircled,
						),
					];
				}
				if (finding.location === "root" || rootKinds.has(symbol.kind)) {
					reserveRoot(toothId);
				}

				rendered.push({
					...makeFinding(
						`${index}:${toothId}`,
						finding,
						definition,
						[toothId],
						primitives,
						frame.size,
					),
					...(finding.location ? { location: finding.location } : {}),
				});
			}
			continue;
		}

		if (visible.length !== finding.teeth.length) {
			continue;
		}

		const rows = new Set(visible.map((toothId) => frames.get(toothId)!.row));
		const validCount =
			scope === "between" ? visible.length === 2 : visible.length >= 2;
		if (!validCount || rows.size !== 1) {
			issues.push(
				`Finding "${finding.code}" needs ${scope === "between" ? "two teeth" : "at least two teeth"} of the same arch and dentition.`,
			);
			continue;
		}

		if (scope === "between") {
			const [a, b] = visible.map((toothId) => frames.get(toothId)!);
			const numberBoxes = visible.map((toothId) => numbers?.get(toothId));
			let primitives: FindingPrimitive[];
			if (symbol.kind === "apical-text") {
				// Between the apices: midway between both root zones.
				const [ra, rb] = [a, b].map(
					(frame) => rootFrame(frame, reserved, gap, fontSize).center,
				);
				primitives = textSymbol(
					finding.label ?? symbol.text,
					{ x: (ra.x + rb.x) / 2, y: (ra.y + rb.y) / 2 },
					textSize_,
					true,
				);
				visible.forEach(reserveRoot);
			} else if (
				symbol.kind === "fused-circles" &&
				numberBoxes[0] &&
				numberBoxes[1]
			) {
				primitives = fusedNumbers(numberBoxes[0], numberBoxes[1]);
			} else {
				primitives = betweenSymbol(symbol, a, b);
			}
			rendered.push(
				makeFinding(
					`${index}`,
					finding,
					definition,
					visible,
					primitives,
					Math.min(a.size, b.size),
				),
			);
			continue;
		}

		const archOrder = order.get([...rows][0])!;
		const positions = visible.map((toothId) => archOrder.indexOf(toothId));
		const range = archOrder.slice(
			Math.min(...positions),
			Math.max(...positions) + 1,
		);
		const rangeFrames = range.map((toothId) => frames.get(toothId)!);

		rendered.push(
			makeFinding(
				`${index}`,
				finding,
				definition,
				range,
				spanSymbol(symbol, rangeFrames, gap, reserved),
				Math.min(...rangeFrames.map(({ size }) => size)),
			),
		);
		for (const toothId of range) {
			outerCursor.set(
				toothId,
				Math.max(
					outerCursor.get(toothId) ?? reserved,
					rootStart(reserved, gap),
				),
			);
		}
	}

	// Draw in the order the findings were given, except that surface outlines
	// go above every fill so they stay visible on filled surfaces.
	const layer = ({ code }: RenderedFinding) =>
		catalog[code]?.symbol.kind === "outline" ? 1 : 0;
	const position = (key: string) => Number(key.split(":")[0]);
	rendered.sort(
		(a, b) => layer(a) - layer(b) || position(a.key) - position(b.key),
	);

	return { findings: rendered, issues };
}

/**
 * Draws the surface findings of one tooth on a given diagram, e.g. the
 * enlarged one of a surface guide. Strips and drawing order match the chart.
 * Findings of other teeth and non-surface findings are ignored.
 */
export function layoutToothSurfaceFindings(
	findings: readonly OdontogramFinding[],
	catalog: FindingCatalog,
	diagram: SurfaceDiagram,
): RenderedFinding[] {
	const { toothId, box, center, size } = diagram;
	const ownSurfaceFindings = findings
		.filter(({ code, teeth }) => {
			const definition = catalog[code];
			return (
				teeth.includes(toothId) &&
				definition &&
				getFindingScope(definition.symbol) === "surface"
			);
		})
		.map((finding) => ({ ...finding, teeth: [toothId] }));
	const frame = { ...iconFrame(toothId, box), center, size };
	const frames = {
		frames: new Map([[toothId, frame]]),
		order: new Map(),
		fontSize: 0,
		gap: 0,
	};

	return layoutFindings(ownSurfaceFindings, catalog, frames, {
		diagrams: [diagram],
		reserved: 0,
	}).findings;
}

/** Frame of a synthetic tooth for legend icons, in a 16 × 16 box. */
function iconFrame(toothId: string, box: Box): ToothFrame {
	return {
		toothId,
		arch: "upper",
		row: "upper-permanent",
		box,
		center: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
		size: Math.min(box.width, box.height),
		inner: { x: 0, y: 1 },
		outer: { x: 0, y: -1 },
		occlusal: { x: 0, y: 1 },
		mesial: { x: 1, y: 0 },
	};
}

/** Miniature of a finding symbol for legends, in a `0 0 16 16` viewBox. */
export function getFindingIcon(symbol: FindingSymbol): FindingPrimitive[] {
	const scope = getFindingScope(symbol);

	if (scope === "surface") {
		// A diagram with its occlusal surface marked.
		const square = (at: number, side: number) =>
			`M${at} ${at} h${side} v${side} h${-side} Z`;
		const inner = square(5.5, 5);
		return [
			{ type: "path", d: square(1.5, 13) },
			symbol.kind === "fill"
				? { type: "area", d: inner }
				: { type: "path", d: inner },
		];
	}

	if (scope === "between") {
		return betweenSymbol(
			symbol,
			iconFrame("a", { x: -2, y: 2, width: 10, height: 12 }),
			iconFrame("b", { x: 8, y: 2, width: 10, height: 12 }),
		);
	}

	if (scope === "span") {
		const frames = [1, 6.5, 12].map((x, index) =>
			iconFrame(`${index}`, { x, y: 9, width: 3, height: 5 }),
		);
		return spanSymbol(symbol, frames, 1.5);
	}

	if (textKinds.has(symbol.kind)) {
		const { text } = symbol as { text: string };
		const fontSize = text.length > 2 ? 5.5 : 8;
		return textSymbol(
			text,
			{ x: 8, y: 8 },
			symbol.kind === "encircled-text" ? 7 : fontSize,
			symbol.kind === "encircled-text",
		);
	}

	return toothSymbol(
		symbol,
		iconFrame("t", { x: 2, y: 2, width: 12, height: 12 }),
		{},
	);
}

/**
 * Framework-independent SVG geometry: path bounding boxes and transform
 * matrices. It needs no DOM, so it also works in SSR and tests.
 */

export interface Point {
	x: number;
	y: number;
}

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Affine matrix `[a, b, c, d, e, f]`, as in SVG `matrix(a b c d e f)`. */
export type Matrix = readonly [number, number, number, number, number, number];

export const identityMatrix: Matrix = [1, 0, 0, 1, 0, 0];

/** Returns `left · right`: `right` is applied to points first. */
export function multiplyMatrices(left: Matrix, right: Matrix): Matrix {
	const [a1, b1, c1, d1, e1, f1] = left;
	const [a2, b2, c2, d2, e2, f2] = right;

	return [
		a1 * a2 + c1 * b2,
		b1 * a2 + d1 * b2,
		a1 * c2 + c1 * d2,
		b1 * c2 + d1 * d2,
		a1 * e2 + c1 * f2 + e1,
		b1 * e2 + d1 * f2 + f1,
	];
}

export function applyMatrix(
	[a, b, c, d, e, f]: Matrix,
	{ x, y }: Point,
): Point {
	return { x: a * x + c * y + e, y: b * x + d * y + f };
}

const transformFunctionPattern =
	/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;

/** Parses an SVG `transform` attribute into a single matrix. */
export function parseTransform(transform: string | undefined): Matrix {
	let matrix = identityMatrix;

	for (const [, name, rawArguments] of (transform ?? "").matchAll(
		transformFunctionPattern,
	)) {
		const args = rawArguments
			.trim()
			.split(/[\s,]+/)
			.filter(Boolean)
			.map(Number);
		matrix = multiplyMatrices(matrix, transformFunctionMatrix(name, args));
	}

	return matrix;
}

function transformFunctionMatrix(name: string, args: number[]): Matrix {
	switch (name) {
		case "matrix":
			return [args[0], args[1], args[2], args[3], args[4], args[5]];
		case "translate":
			return [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0];
		case "scale":
			return [args[0], 0, 0, args[1] ?? args[0], 0, 0];
		case "rotate": {
			const radians = ((args[0] ?? 0) * Math.PI) / 180;
			const cos = Math.cos(radians);
			const sin = Math.sin(radians);
			const cx = args[1] ?? 0;
			const cy = args[2] ?? 0;
			const rotation: Matrix = [cos, sin, -sin, cos, 0, 0];

			return multiplyMatrices(
				multiplyMatrices([1, 0, 0, 1, cx, cy], rotation),
				[1, 0, 0, 1, -cx, -cy],
			);
		}
		case "skewX":
			return [1, 0, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
		default:
			return [1, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
	}
}

/** Axis-aligned box that contains every point. */
export function boxFromPoints(points: readonly Point[]): Box {
	if (!points.length) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for (const { x, y } of points) {
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}

	return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Transforms a box and returns the box that contains the result. It is exact
 * for translations, scales and reflections, the transforms used by layouts.
 */
export function transformBox(matrix: Matrix, box: Box): Box {
	return boxFromPoints(
		[
			{ x: box.x, y: box.y },
			{ x: box.x + box.width, y: box.y },
			{ x: box.x, y: box.y + box.height },
			{ x: box.x + box.width, y: box.y + box.height },
		].map((point) => applyMatrix(matrix, point)),
	);
}

/** Exact bounding box of an SVG path `d` attribute. */
export function getPathBox(path: string): Box {
	return boxFromPoints(getPathExtremePoints(path));
}

/**
 * Endpoints plus curve and arc extrema of a path. The box of these points is
 * the path's exact bounding box.
 */
export function getPathExtremePoints(path: string): Point[] {
	const scanner = new PathScanner(path);
	const points: Point[] = [];
	let current: Point = { x: 0, y: 0 };
	let subpathStart: Point = current;
	let lastControl: Point | undefined;
	let lastCommand = "";
	let command = "";

	while (scanner.hasMore()) {
		const next = scanner.readCommand();
		if (next) {
			command = next;
		} else if (!command) {
			throw new SyntaxError(`Invalid SVG path: ${path}`);
		}

		const relative = command === command.toLowerCase();
		const origin = relative ? current : { x: 0, y: 0 };
		const readPoint = (): Point => ({
			x: origin.x + scanner.readNumber(),
			y: origin.y + scanner.readNumber(),
		});
		let control: Point | undefined;

		switch (command.toUpperCase()) {
			case "M":
				current = readPoint();
				subpathStart = current;
				points.push(current);
				// Extra coordinate pairs after a move are implicit line commands.
				command = relative ? "l" : "L";
				break;
			case "L":
				current = readPoint();
				points.push(current);
				break;
			case "H":
				current = {
					x: (relative ? current.x : 0) + scanner.readNumber(),
					y: current.y,
				};
				points.push(current);
				break;
			case "V":
				current = {
					x: current.x,
					y: (relative ? current.y : 0) + scanner.readNumber(),
				};
				points.push(current);
				break;
			case "C": {
				const control1 = readPoint();
				control = readPoint();
				const end = readPoint();
				points.push(...cubicExtremes(current, control1, control, end));
				current = end;
				break;
			}
			case "S": {
				const control1 = reflectControl(
					current,
					lastControl,
					lastCommand,
					"CS",
				);
				control = readPoint();
				const end = readPoint();
				points.push(...cubicExtremes(current, control1, control, end));
				current = end;
				break;
			}
			case "Q": {
				control = readPoint();
				const end = readPoint();
				points.push(...quadraticExtremes(current, control, end));
				current = end;
				break;
			}
			case "T": {
				control = reflectControl(current, lastControl, lastCommand, "QT");
				const end = readPoint();
				points.push(...quadraticExtremes(current, control, end));
				current = end;
				break;
			}
			case "A": {
				const rx = Math.abs(scanner.readNumber());
				const ry = Math.abs(scanner.readNumber());
				const rotation = scanner.readNumber();
				const largeArc = scanner.readFlag();
				const sweep = scanner.readFlag();
				const end = readPoint();
				points.push(
					...arcExtremes(current, rx, ry, rotation, largeArc, sweep, end),
				);
				current = end;
				break;
			}
			case "Z":
				current = subpathStart;
				break;
			default:
				throw new SyntaxError(`Unsupported SVG path command "${command}".`);
		}

		lastControl = control;
		lastCommand = command.toUpperCase();
		if (lastCommand === "Z") {
			command = "";
		}
	}

	return points;
}

function reflectControl(
	current: Point,
	lastControl: Point | undefined,
	lastCommand: string,
	smoothFamily: string,
): Point {
	if (!lastControl || !smoothFamily.includes(lastCommand)) {
		return current;
	}

	return { x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y };
}

function cubicAt(
	p0: number,
	p1: number,
	p2: number,
	p3: number,
	t: number,
): number {
	const u = 1 - t;
	return (
		u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
	);
}

/** Parameters in (0, 1) where a cubic Bézier coordinate has a derivative of 0. */
function cubicRoots(p0: number, p1: number, p2: number, p3: number): number[] {
	const a = -p0 + 3 * p1 - 3 * p2 + p3;
	const b = 2 * (p0 - 2 * p1 + p2);
	const c = p1 - p0;
	const epsilon = 1e-12;

	if (Math.abs(a) < epsilon) {
		return Math.abs(b) < epsilon ? [] : [-c / b];
	}

	const discriminant = b * b - 4 * a * c;
	if (discriminant < 0) {
		return [];
	}

	const root = Math.sqrt(discriminant);
	return [(-b + root) / (2 * a), (-b - root) / (2 * a)];
}

function cubicExtremes(p0: Point, p1: Point, p2: Point, p3: Point): Point[] {
	const parameters = [
		...cubicRoots(p0.x, p1.x, p2.x, p3.x),
		...cubicRoots(p0.y, p1.y, p2.y, p3.y),
	].filter((t) => t > 0 && t < 1);

	return [
		...parameters.map((t) => ({
			x: cubicAt(p0.x, p1.x, p2.x, p3.x, t),
			y: cubicAt(p0.y, p1.y, p2.y, p3.y, t),
		})),
		p3,
	];
}

function quadraticExtremes(p0: Point, p1: Point, p2: Point): Point[] {
	const points: Point[] = [];

	for (const axis of ["x", "y"] as const) {
		const denominator = p0[axis] - 2 * p1[axis] + p2[axis];
		if (denominator === 0) {
			continue;
		}

		const t = (p0[axis] - p1[axis]) / denominator;
		if (t > 0 && t < 1) {
			const u = 1 - t;
			points.push({
				x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
				y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
			});
		}
	}

	return [...points, p2];
}

/**
 * Endpoint and axis extrema of an elliptical arc, using the endpoint to
 * center conversion of the SVG specification (appendix B.2.4).
 */
function arcExtremes(
	start: Point,
	rx: number,
	ry: number,
	rotationDegrees: number,
	largeArc: boolean,
	sweep: boolean,
	end: Point,
): Point[] {
	if (rx === 0 || ry === 0 || (start.x === end.x && start.y === end.y)) {
		return [end];
	}

	const phi = (rotationDegrees * Math.PI) / 180;
	const cosPhi = Math.cos(phi);
	const sinPhi = Math.sin(phi);
	const dx = (start.x - end.x) / 2;
	const dy = (start.y - end.y) / 2;
	const x1 = cosPhi * dx + sinPhi * dy;
	const y1 = -sinPhi * dx + cosPhi * dy;

	// Scale radii up when they are too small to reach the endpoint.
	const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
	if (lambda > 1) {
		const scale = Math.sqrt(lambda);
		rx *= scale;
		ry *= scale;
	}

	const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
	const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
	const sign = largeArc === sweep ? -1 : 1;
	const coefficient = sign * Math.sqrt(Math.max(0, numerator / denominator));
	const cxPrime = (coefficient * rx * y1) / ry;
	const cyPrime = (-coefficient * ry * x1) / rx;
	const cx = cosPhi * cxPrime - sinPhi * cyPrime + (start.x + end.x) / 2;
	const cy = sinPhi * cxPrime + cosPhi * cyPrime + (start.y + end.y) / 2;

	const angle = (ux: number, uy: number) => Math.atan2(uy, ux);
	const theta1 = angle((x1 - cxPrime) / rx, (y1 - cyPrime) / ry);
	let delta = angle((-x1 - cxPrime) / rx, (-y1 - cyPrime) / ry) - theta1;
	if (sweep && delta < 0) {
		delta += 2 * Math.PI;
	} else if (!sweep && delta > 0) {
		delta -= 2 * Math.PI;
	}

	const pointAt = (theta: number): Point => ({
		x: cx + rx * cosPhi * Math.cos(theta) - ry * sinPhi * Math.sin(theta),
		y: cy + rx * sinPhi * Math.cos(theta) + ry * cosPhi * Math.sin(theta),
	});
	const thetaX = Math.atan2(-ry * sinPhi, rx * cosPhi);
	const thetaY = Math.atan2(ry * cosPhi, rx * sinPhi);
	const points: Point[] = [];

	for (const candidate of [
		thetaX,
		thetaX + Math.PI,
		thetaY,
		thetaY + Math.PI,
	]) {
		// Offset of the candidate from the start angle, in the sweep direction.
		const turn = 2 * Math.PI;
		const offset = sweep
			? (((candidate - theta1) % turn) + turn) % turn
			: (((theta1 - candidate) % turn) + turn) % turn;

		if (offset < Math.abs(delta)) {
			points.push(pointAt(candidate));
		}
	}

	return [...points, end];
}

/** Reads commands, numbers and compact arc flags from a path string. */
class PathScanner {
	private index = 0;

	constructor(private readonly source: string) {}

	hasMore(): boolean {
		this.skipSeparators();
		return this.index < this.source.length;
	}

	readCommand(): string | undefined {
		this.skipSeparators();
		const character = this.source[this.index];

		if (character && /[MmLlHhVvCcSsQqTtAaZz]/.test(character)) {
			this.index += 1;
			return character;
		}

		return undefined;
	}

	readNumber(): number {
		this.skipSeparators();
		const match = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(
			this.source.slice(this.index),
		);

		if (!match) {
			throw new SyntaxError(`Expected a number at ${this.index} in SVG path.`);
		}

		this.index += match[0].length;
		return Number(match[0]);
	}

	/** Arc flags are a single 0/1 character and may touch the next number. */
	readFlag(): boolean {
		this.skipSeparators();
		const character = this.source[this.index];

		if (character !== "0" && character !== "1") {
			throw new SyntaxError(
				`Expected an arc flag at ${this.index} in SVG path.`,
			);
		}

		this.index += 1;
		return character === "1";
	}

	private skipSeparators(): void {
		while (
			this.index < this.source.length &&
			/[\s,]/.test(this.source[this.index])
		) {
			this.index += 1;
		}
	}
}

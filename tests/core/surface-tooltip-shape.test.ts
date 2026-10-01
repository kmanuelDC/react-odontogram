// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
	buildSurfaceDiagram,
	getSurfaceAxes,
	surfaceCenter,
} from "../../src/core/utils/surfaces";

describe.each(["square", "circle"] as const)(
	"surface letters of %s diagrams",
	(shape) => {
		it.each(["16", "21", "36", "44", "55", "73"])(
			"line up on %s: V, O and L in one column, M, O and D in one row",
			(toothId) => {
				const diagram = buildSurfaceDiagram(
					toothId,
					{ x: 50, y: 50 },
					getSurfaceAxes(toothId),
					84,
					1.2,
					shape,
				);
				const at = (name: string) =>
					surfaceCenter(
						diagram.surfaces.find(({ surface }) => surface === name)!,
					);
				const [vestibular, lingual, mesial, distal, occlusal] = [
					"vestibular",
					"lingual",
					"mesial",
					"distal",
					"occlusal",
				].map(at);

				expect(occlusal.x).toBeCloseTo(50, 9);
				expect(occlusal.y).toBeCloseTo(50, 9);
				expect(vestibular.x).toBeCloseTo(50, 9);
				expect(lingual.x).toBeCloseTo(50, 9);
				expect(mesial.y).toBeCloseTo(50, 9);
				expect(distal.y).toBeCloseTo(50, 9);
				// Opposite letters sit at the same distance from the center.
				expect(Math.abs(vestibular.y - 50)).toBeCloseTo(
					Math.abs(lingual.y - 50),
					9,
				);
				expect(Math.abs(mesial.x - 50)).toBeCloseTo(Math.abs(distal.x - 50), 9);
			},
		);
	},
);

describe("square surface diagrams", () => {
	const square = buildSurfaceDiagram(
		"16",
		{ x: 50, y: 50 },
		getSurfaceAxes("16"),
		40,
		1,
		"square",
	);
	const points = square.surfaces.flatMap((shape) => shape.points);

	it("keeps the full square size", () => {
		expect(square.box).toEqual({ x: 29.5, y: 29.5, width: 41, height: 41 });
	});

	it("rounds the outer corners", () => {
		// No point reaches a sharp corner of the 40 × 40 square.
		for (const { x, y } of points) {
			expect(Math.abs(x - 50) + Math.abs(y - 50)).toBeLessThan(40 - 1);
		}
	});

	it("rounds the occlusal square and keeps it inside the diagram", () => {
		const occlusal = square.surfaces.find(
			({ surface }) => surface === "occlusal",
		)!.points;
		const half = Math.max(...occlusal.map(({ x }) => Math.abs(x - 50)));

		expect(half).toBeCloseTo(20 * 0.4, 5);
		expect(
			occlusal.some(
				({ x, y }) => Math.abs(x - 50) === half && Math.abs(y - 50) === half,
			),
		).toBe(false);
	});
});

describe("circular surface diagrams", () => {
	const axes = getSurfaceAxes("16");
	const circle = buildSurfaceDiagram(
		"16",
		{ x: 50, y: 50 },
		axes,
		40,
		1,
		"circle",
	);
	const square = buildSurfaceDiagram(
		"16",
		{ x: 50, y: 50 },
		axes,
		40,
		1,
		"square",
	);
	const shape = (name: string) =>
		circle.surfaces.find(({ surface }) => surface === name)!;

	it("keeps every point inside a circle of the diagram size", () => {
		for (const { points } of circle.surfaces) {
			for (const { x, y } of points) {
				expect(Math.hypot(x - 50, y - 50)).toBeLessThanOrEqual(20 + 1e-9);
			}
		}
		expect(circle.box.width).toBeCloseTo(square.box.width, 5);
	});

	it("draws a central occlusal circle and four ring sectors on the same axes", () => {
		const radii = shape("occlusal").points.map(({ x, y }) =>
			Math.hypot(x - 50, y - 50),
		);
		expect(Math.max(...radii) - Math.min(...radii)).toBeLessThan(1e-9);
		expect(radii[0]).toBeCloseTo(20 * 0.45, 5);

		// Upper-right tooth: vestibular up, mesial to the right, like the square diagram.
		expect(surfaceCenter(shape("vestibular")).y).toBeLessThan(40);
		expect(surfaceCenter(shape("lingual")).y).toBeGreaterThan(60);
		expect(surfaceCenter(shape("mesial")).x).toBeGreaterThan(60);
		expect(surfaceCenter(shape("distal")).x).toBeLessThan(40);
	});
});

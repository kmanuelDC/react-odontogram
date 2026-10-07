// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ntsPeruFindingCatalog } from "../src/catalogs/nts-peru";
import { toothSurfaces } from "../src/types/surfaces";
import { getLayoutViewBox, getToothAnchors } from "../src/utils/anchors";
import type { RenderableDentition } from "../src/utils/dentition-layout";
import { layoutFindings } from "../src/utils/findings";
import type { OdontogramLayout } from "../src/utils/layout";
import {
	getSurfaceDiagrams,
	getSurfaceName,
	surfaceMargin,
	toggleSurface,
} from "../src/utils/surfaces";
import type { Box } from "../src/utils/svg-geometry";
import {
	getToothFrames,
	toothCircleRadius,
	toothSymbolStrokeWidth,
} from "../src/utils/tooth-frames";

const combinations: [RenderableDentition, OdontogramLayout][] = [
	["permanent", "arch"],
	["permanent", "horizontal"],
	["primary", "arch"],
	["primary", "horizontal"],
];

function framesOf(dentition: RenderableDentition, layout: OdontogramLayout) {
	return getToothFrames(
		getToothAnchors(dentition, layout),
		getLayoutViewBox(dentition, layout),
		layout,
	);
}

function overlaps(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height
	);
}

/** Centroid of a closed polygon path made of M/L commands. */
function centroid(d: string) {
	const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
	const xs = numbers.filter((_, index) => index % 2 === 0);
	const ys = numbers.filter((_, index) => index % 2 === 1);
	return {
		x: xs.reduce((a, b) => a + b) / xs.length,
		y: ys.reduce((a, b) => a + b) / ys.length,
	};
}

describe("getSurfaceName", () => {
	it("uses incisal on incisors and canines and palatal on upper teeth", () => {
		expect(getSurfaceName("occlusal", "11")).toBe("incisal");
		expect(getSurfaceName("occlusal", "53")).toBe("incisal");
		expect(getSurfaceName("occlusal", "14")).toBe("occlusal");
		expect(getSurfaceName("lingual", "26")).toBe("palatal");
		expect(getSurfaceName("lingual", "64")).toBe("palatal");
		expect(getSurfaceName("lingual", "36")).toBe("lingual");
		expect(getSurfaceName("mesial", "11")).toBe("mesial");
	});
});

describe("toggleSurface", () => {
	it("adds surfaces in canonical order without mutating the model", () => {
		const model = { 11: ["occlusal" as const] };
		const next = toggleSurface(model, "11", "vestibular");

		expect(next).toEqual({ 11: ["vestibular", "occlusal"] });
		expect(model).toEqual({ 11: ["occlusal"] });
	});

	it("removes a tooth when its last surface is cleared", () => {
		expect(
			toggleSurface({ 11: ["mesial"], 21: ["distal"] }, "11", "mesial"),
		).toEqual({ 21: ["distal"] });
		expect(toggleSurface(undefined, "46", "lingual")).toEqual({
			46: ["lingual"],
		});
	});
});

describe.each(combinations)(
	"getSurfaceDiagrams (%s, %s)",
	(dentition, layout) => {
		const frames = framesOf(dentition, layout);
		const { diagrams, reserved } = getSurfaceDiagrams(frames);

		it("draws five surfaces per tooth, all the same size", () => {
			expect(diagrams).toHaveLength(frames.frames.size);
			expect(new Set(diagrams.map(({ size }) => size)).size).toBe(1);
			expect(reserved).toBeGreaterThan(diagrams[0].size);
			for (const diagram of diagrams) {
				expect(diagram.surfaces.map(({ surface }) => surface)).toEqual(
					toothSurfaces,
				);
			}
		});

		it("places each diagram outside its tooth and every other diagram", () => {
			const anchors = getToothAnchors(dentition, layout);

			for (const diagram of diagrams) {
				const own = anchors.find(({ toothId }) => toothId === diagram.toothId)!;
				const inside =
					diagram.center.x > own.box.x &&
					diagram.center.x < own.box.x + own.box.width &&
					diagram.center.y > own.box.y &&
					diagram.center.y < own.box.y + own.box.height;
				expect(inside, diagram.toothId).toBe(false);
			}

			// Diagram boxes are axis-aligned bounds of rotated squares, so compare
			// centers against the side of the square instead of the boxes.
			for (const [index, a] of diagrams.entries()) {
				for (const b of diagrams.slice(index + 1)) {
					const distance = Math.hypot(
						a.center.x - b.center.x,
						a.center.y - b.center.y,
					);
					expect(distance, `${a.toothId}/${b.toothId}`).toBeGreaterThan(a.size);
				}
			}
		});

		it("keeps clear of the crown circle of its tooth, plus the margin", () => {
			for (const diagram of diagrams) {
				const frame = frames.frames.get(diagram.toothId)!;
				const { outer, center, box, size } = frame;
				const nearEdge =
					(diagram.center.x - center.x) * outer.x +
					(diagram.center.y - center.y) * outer.y -
					diagram.size / 2;
				const circle =
					toothCircleRadius(box) + toothSymbolStrokeWidth(size) / 2;

				expect(nearEdge, diagram.toothId).toBeGreaterThanOrEqual(
					circle + frames.gap + surfaceMargin - 0.01,
				);
			}
		});

		it("follows the curve of each row without jumps between neighbours", () => {
			const byId = new Map(
				diagrams.map((diagram) => [diagram.toothId, diagram]),
			);
			const distance = (toothId: string) => {
				const { center } = frames.frames.get(toothId)!;
				const diagram = byId.get(toothId)!;
				return Math.hypot(
					diagram.center.x - center.x,
					diagram.center.y - center.y,
				);
			};

			for (const row of frames.order.values()) {
				for (const [index, toothId] of row.slice(1).entries()) {
					const step = Math.abs(distance(toothId) - distance(row[index]));
					expect(step, `${row[index]}/${toothId}`).toBeLessThanOrEqual(
						diagrams[0].size * 0.12 + 0.01,
					);
				}
			}
		});

		it("points the vestibular side out and the mesial side to the midline", () => {
			for (const diagram of diagrams) {
				const frame = frames.frames.get(diagram.toothId)!;
				const surface = (name: string) =>
					centroid(diagram.surfaces.find((s) => s.surface === name)!.d);
				const along = (
					p: { x: number; y: number },
					direction: { x: number; y: number },
				) =>
					(p.x - diagram.center.x) * direction.x +
					(p.y - diagram.center.y) * direction.y;

				expect(along(surface("vestibular"), frame.outer)).toBeGreaterThan(0);
				expect(along(surface("lingual"), frame.outer)).toBeLessThan(0);
				expect(along(surface("mesial"), frame.mesial)).toBeGreaterThan(0);
				expect(along(surface("distal"), frame.mesial)).toBeLessThan(0);
			}
		});
	},
);

describe("curve fairing in the arch layout", () => {
	const frames = framesOf("permanent", "arch");
	const plain = getSurfaceDiagrams(frames).diagrams;
	const faired = getSurfaceDiagrams(frames, { fairCurve: true }).diagrams;
	const byId = (diagrams: typeof plain) =>
		new Map(diagrams.map((diagram) => [diagram.toothId, diagram.center]));

	/** Turn of the path through some points at each inner point, in degrees. */
	function turns(points: { x: number; y: number }[]): number[] {
		return points.slice(1, -1).map((p, i) => {
			const [a, c] = [points[i], points[i + 2]];
			let turn =
				Math.atan2(c.y - p.y, c.x - p.x) - Math.atan2(p.y - a.y, p.x - a.x);
			turn = Math.atan2(Math.sin(turn), Math.cos(turn));
			return Math.abs((turn * 180) / Math.PI);
		});
	}

	it("only lets the first molars give up the crown margin, never the tooth outline", () => {
		const withoutCrownMargin: string[] = [];

		for (const diagram of faired) {
			const { outer, center, box, size } = frames.frames.get(diagram.toothId)!;
			const nearEdge =
				(diagram.center.x - center.x) * outer.x +
				(diagram.center.y - center.y) * outer.y -
				diagram.size / 2;
			const outline = Math.hypot(
				(box.width / 2) * outer.x,
				(box.height / 2) * outer.y,
			);
			const crown = toothCircleRadius(box) + toothSymbolStrokeWidth(size) / 2;

			expect(nearEdge, diagram.toothId).toBeGreaterThanOrEqual(
				outline + frames.gap - 0.01,
			);
			if (nearEdge < crown + frames.gap + surfaceMargin - 0.01) {
				withoutCrownMargin.push(diagram.toothId);
			}
		}

		expect(withoutCrownMargin.sort()).toEqual(["16", "26", "36", "46"]);
	});

	it("makes the curve turn at 16 like the arch of the teeth does", () => {
		const row = frames.order.get("upper-permanent")!.slice(0, 5); // 18, 17, 16, 15, 14
		const [, atSixteen] = turns(
			row.map((toothId) => byId(faired).get(toothId)!),
		);
		const [, beforeFairing] = turns(
			row.map((toothId) => byId(plain).get(toothId)!),
		);
		const [, teeth] = turns(
			row.map((toothId) => frames.frames.get(toothId)!.center),
		);

		expect(beforeFairing).toBeGreaterThan(teeth + 4);
		expect(Math.abs(atSixteen - teeth)).toBeLessThan(1);
	});

	it("keeps the primary canine in the rhythm of the incisors", () => {
		const primary = framesOf("primary", "arch");
		const diagrams = getSurfaceDiagrams(primary, { fairCurve: true }).diagrams;
		const centers = byId(diagrams);

		for (const [rowKey, canine] of [
			["upper-primary", "53"],
			["lower-primary", "83"],
		] as const) {
			const row = primary.order.get(rowKey)!.slice(0, 6); // 55 … 51 and 61 (or 85 … 81 and 71)
			// Turns at the first molar, the canine and the lateral incisor.
			const [atFirstMolar, atCanine, atLateral] = turns(
				row.map((toothId) => centers.get(toothId)!),
			);
			const teeth = turns(
				row.map((toothId) => primary.frames.get(toothId)!.center),
			);

			// The teeth turn 32° at the canine; its diagram no longer makes that elbow.
			expect(teeth[1], rowKey).toBeGreaterThan(30);
			expect(atCanine, rowKey).toBeLessThan(26);
			expect(Math.abs(atCanine - atLateral), rowKey).toBeLessThan(3);
			expect(Math.abs(atCanine - atFirstMolar), rowKey).toBeLessThan(6);

			const { outer, center, box } = primary.frames.get(canine)!;
			const diagram = diagrams.find(({ toothId }) => toothId === canine)!;
			const nearEdge =
				(diagram.center.x - center.x) * outer.x +
				(diagram.center.y - center.y) * outer.y -
				diagram.size / 2;
			expect(nearEdge).toBeGreaterThanOrEqual(
				Math.hypot((box.width / 2) * outer.x, (box.height / 2) * outer.y) +
					primary.gap -
					0.01,
			);
		}
	});
});

describe.each([
	["permanent", "horizontal"],
	["primary", "horizontal"],
	["mixed", "horizontal"],
] as const)("row alignment (%s, %s)", (dentition, layout) => {
	const anchors = getToothAnchors(dentition, layout);
	const frames = getToothFrames(
		anchors,
		getLayoutViewBox(dentition, layout),
		layout,
	);
	const aligned = getSurfaceDiagrams(frames, { alignRows: true });
	const free = getSurfaceDiagrams(frames);

	it("puts every diagram of a row on one line", () => {
		for (const row of frames.order.values()) {
			const heights = row.map(
				(toothId) =>
					aligned.diagrams.find((diagram) => diagram.toothId === toothId)!
						.center.y,
			);
			expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1e-9);
		}
	});

	it("never brings a diagram closer to its tooth than it needs", () => {
		for (const diagram of aligned.diagrams) {
			const { center, outer } = frames.frames.get(diagram.toothId)!;
			const own = free.diagrams.find(
				({ toothId }) => toothId === diagram.toothId,
			)!;
			const along = (point: { x: number; y: number }) =>
				(point.x - center.x) * outer.x + (point.y - center.y) * outer.y;

			expect(along(diagram.center), diagram.toothId).toBeGreaterThanOrEqual(
				along(own.center) - 1e-9,
			);
		}
	});

	it("does not move the teeth", () => {
		expect(getToothAnchors(dentition, layout)).toEqual(anchors);
	});
});

describe("findings with surface diagrams", () => {
	it("moves vestibular abbreviations past the diagram", () => {
		const frames = framesOf("permanent", "horizontal");
		const surfaceLayout = getSurfaceDiagrams(frames);
		const findings = [{ code: "pulp-treatment", teeth: ["16"] }];
		const [finding] = layoutFindings(
			findings,
			ntsPeruFindingCatalog,
			frames,
			surfaceLayout,
		).findings;
		const diagrams = surfaceLayout.diagrams;
		const diagram = diagrams.find(({ toothId }) => toothId === "16")!;

		expect(overlaps(finding.box, diagram.box)).toBe(false);
	});
});

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { getToothAnchors } from "../src/utils/anchors";
import { getToothStateMarks } from "../src/utils/state-marks";

const states = {
	18: "extracted",
	28: "missing",
	36: "implant",
	48: "unerupted",
} as const;

describe("tooth state marks", () => {
	const anchors = getToothAnchors("permanent", "arch");

	it("draws a cross for extracted teeth and an implant for implants only", () => {
		const marks = getToothStateMarks(anchors, states);

		expect(
			marks.map(({ kind, toothId }) => `${kind}:${toothId}`).sort(),
		).toEqual(["cross:18", "implant:36"]);
	});

	it("keeps every mark inside its tooth", () => {
		for (const mark of getToothStateMarks(anchors, states)) {
			const { box } = anchors.find(({ toothId }) => toothId === mark.toothId)!;
			const lines = mark.kind === "cross" ? mark.lines : mark.threads;
			const points = lines.flatMap(({ x1, y1, x2, y2 }) => [
				{ x: x1, y: y1 },
				{ x: x2, y: y2 },
			]);

			for (const { x, y } of points) {
				expect(x).toBeGreaterThanOrEqual(box.x);
				expect(x).toBeLessThanOrEqual(box.x + box.width);
				expect(y).toBeGreaterThanOrEqual(box.y);
				expect(y).toBeLessThanOrEqual(box.y + box.height);
			}
		}
	});

	it("draws nothing without states", () => {
		expect(getToothStateMarks(anchors, undefined)).toEqual([]);
	});
});

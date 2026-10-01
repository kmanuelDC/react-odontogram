import { describe, expect, it } from "vitest";
import {
	getLayoutViewBox,
	getToothAnchors,
} from "../../src/core/utils/anchors";
import { findNavigationTarget } from "../../src/core/utils/navigation";
import { getToothNumberLabels } from "../../src/core/utils/numbers";
import type { Box } from "../../src/core/utils/svg-geometry";

const combinations = [
	["permanent", "arch"],
	["permanent", "horizontal"],
	["primary", "arch"],
	["primary", "horizontal"],
] as const;

function intersects(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height
	);
}

describe("tooth number labels", () => {
	it.each(combinations)(
		"places %s %s numbers inside the chart without touching any tooth",
		(dentition, layout) => {
			const anchors = getToothAnchors(dentition, layout);
			const chart = getLayoutViewBox(dentition, layout);
			const labels = getToothNumberLabels(anchors, chart, layout);

			expect(labels.map(({ toothId }) => toothId)).toEqual(
				anchors.map(({ toothId }) => toothId),
			);

			for (const label of labels) {
				expect(label.fontSize).toBeGreaterThan(0);
				expect(label.box.x).toBeGreaterThanOrEqual(chart.x);
				expect(label.box.y).toBeGreaterThanOrEqual(chart.y);
				expect(label.box.x + label.box.width).toBeLessThanOrEqual(
					chart.x + chart.width,
				);
				expect(label.box.y + label.box.height).toBeLessThanOrEqual(
					chart.y + chart.height,
				);

				for (const anchor of anchors) {
					expect(
						intersects(label.box, anchor.box),
						`${label.toothId} touches ${anchor.toothId}`,
					).toBe(false);
				}
			}
		},
	);

	it.each(combinations)(
		"keeps each %s %s number closest to its own tooth",
		(dentition, layout) => {
			const anchors = getToothAnchors(dentition, layout);
			const labels = getToothNumberLabels(
				anchors,
				getLayoutViewBox(dentition, layout),
				layout,
			);
			const distanceToBox = ({ x, y }: { x: number; y: number }, box: Box) =>
				Math.hypot(
					Math.max(box.x - x, 0, x - box.x - box.width),
					Math.max(box.y - y, 0, y - box.y - box.height),
				);

			for (const label of labels) {
				const own = distanceToBox(
					label,
					anchors.find(({ toothId }) => toothId === label.toothId)!.box,
				);
				const closestOther = Math.min(
					...anchors
						.filter(({ toothId }) => toothId !== label.toothId)
						.map(({ box }) => distanceToBox(label, box)),
				);

				expect(own, `${label.toothId} is closer to another tooth`).toBeLessThan(
					closestOther,
				);
			}
		},
	);

	it("aligns every horizontal row on one baseline between both arches", () => {
		const anchors = getToothAnchors("permanent", "horizontal");
		const labels = getToothNumberLabels(
			anchors,
			getLayoutViewBox("permanent", "horizontal"),
			"horizontal",
		);
		const rowY = (prefix: string[]) =>
			new Set(
				labels
					.filter(({ toothId }) => prefix.includes(toothId[0]))
					.map(({ y }) => y),
			);

		const upper = rowY(["1", "2"]);
		const lower = rowY(["3", "4"]);
		expect(upper.size).toBe(1);
		expect(lower.size).toBe(1);

		const upperTeethBottom = Math.max(
			...anchors
				.filter(({ arch }) => arch === "upper")
				.map(({ box }) => box.y + box.height),
		);
		const lowerTeethTop = Math.min(
			...anchors.filter(({ arch }) => arch === "lower").map(({ box }) => box.y),
		);
		expect([...upper][0]).toBeGreaterThan(upperTeethBottom);
		expect([...lower][0]).toBeLessThan(lowerTeethTop);
	});

	it("places arch numbers on the inner side of the arch", () => {
		const anchors = getToothAnchors("permanent", "arch");
		const labels = getToothNumberLabels(
			anchors,
			getLayoutViewBox("permanent", "arch"),
			"arch",
		);
		const tooth11 = anchors.find(({ toothId }) => toothId === "11")!;
		const label11 = labels.find(({ toothId }) => toothId === "11")!;

		expect(label11.y).toBeGreaterThan(tooth11.box.y + tooth11.box.height);
	});

	it("returns no labels without anchors", () => {
		expect(
			getToothNumberLabels([], { x: 0, y: 0, width: 10, height: 10 }, "arch"),
		).toEqual([]);
	});
});

describe("keyboard navigation targets", () => {
	const arch = getToothAnchors("permanent", "arch");

	it("moves left and right in screen order across the midline", () => {
		expect(findNavigationTarget(arch, "11", "ArrowRight")).toBe("21");
		expect(findNavigationTarget(arch, "11", "ArrowLeft")).toBe("12");
		expect(findNavigationTarget(arch, "21", "ArrowRight")).toBe("22");
		expect(findNavigationTarget(arch, "28", "ArrowRight")).toBeUndefined();
	});

	it("jumps to the first and last tooth of the arch", () => {
		expect(findNavigationTarget(arch, "11", "Home")).toBe("18");
		expect(findNavigationTarget(arch, "11", "End")).toBe("28");
		expect(findNavigationTarget(arch, "41", "Home")).toBe("48");
	});

	it("moves up and down to the closest tooth of the other arch", () => {
		expect(findNavigationTarget(arch, "11", "ArrowDown")).toBe("41");
		expect(findNavigationTarget(arch, "36", "ArrowUp")).toBe("26");
		expect(findNavigationTarget(arch, "11", "ArrowUp")).toBeUndefined();
	});

	it("follows the rows as drawn in the primary horizontal layout", () => {
		const horizontal = getToothAnchors("primary", "horizontal");

		// Q8/Q7 are drawn above Q5/Q6 in this composition.
		expect(findNavigationTarget(horizontal, "81", "ArrowDown")).toBe("51");
		expect(findNavigationTarget(horizontal, "51", "ArrowUp")).toBe("81");
		expect(findNavigationTarget(horizontal, "51", "ArrowDown")).toBeUndefined();
	});

	it("ignores teeth that are not in the list", () => {
		const upperOnly = arch.filter(
			({ arch: anchorArch }) => anchorArch === "upper",
		);

		expect(findNavigationTarget(upperOnly, "11", "ArrowDown")).toBeUndefined();
		expect(findNavigationTarget(upperOnly, "41", "ArrowUp")).toBeUndefined();
	});
});

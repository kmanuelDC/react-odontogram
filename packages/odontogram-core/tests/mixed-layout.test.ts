// Ported from vue-odontogram: tests/Odontogram-mixed.test.ts (the framework-
// free part: composition, rows, numbers, navigation and findings).
import { describe, expect, it } from "vitest";
import { ntsPeruFindingCatalog } from "../src/catalogs/nts-peru";
import {
	type ToothAnchor,
	getLayoutViewBox,
	getToothAnchors,
} from "../src/utils/anchors";
import { layoutFindings } from "../src/utils/findings";
import type { OdontogramLayout } from "../src/utils/layout";
import { findNavigationTarget } from "../src/utils/navigation";
import { getToothNumberLabels } from "../src/utils/numbers";
import { getSurfaceDiagrams } from "../src/utils/surfaces";
import type { Box } from "../src/utils/svg-geometry";
import { getToothFrames } from "../src/utils/tooth-frames";

const layouts: OdontogramLayout[] = ["arch", "horizontal"];

function overlaps(a: Box, b: Box): boolean {
	return (
		a.x < b.x + b.width &&
		b.x < a.x + a.width &&
		a.y < b.y + b.height &&
		b.y < a.y + a.height
	);
}

function anchorMap(layout: OdontogramLayout): Map<string, ToothAnchor> {
	return new Map(
		getToothAnchors("mixed", layout).map((anchor) => [anchor.toothId, anchor]),
	);
}

function anchorOf(byId: Map<string, ToothAnchor>, id: string): ToothAnchor {
	const anchor = byId.get(id);
	if (!anchor) {
		throw new Error(`No anchor for tooth ${id}`);
	}
	return anchor;
}

describe.each(layouts)("mixed composition (%s)", (layout) => {
	const anchors = getToothAnchors("mixed", layout);
	const chart = getLayoutViewBox("mixed", layout);

	it("draws the 32 permanent and 20 primary teeth with their FDI IDs", () => {
		const ids = anchors.map(({ toothId }) => toothId);

		expect(ids).toHaveLength(52);
		expect(new Set(ids).size).toBe(52);
		expect(
			anchors
				.filter(({ dentition }) => dentition === "primary")
				.map(({ toothId }) => toothId),
		).toEqual(expect.arrayContaining(["51", "55", "65", "75", "85"]));
		expect(new Set(anchors.map(({ row }) => row))).toEqual(
			new Set([
				"upper-permanent",
				"lower-permanent",
				"upper-primary",
				"lower-primary",
			]),
		);
	});

	it("keeps every tooth inside the viewBox and apart from the others", () => {
		for (const { toothId, box } of anchors) {
			expect(box.x, toothId).toBeGreaterThanOrEqual(chart.x);
			expect(box.y, toothId).toBeGreaterThanOrEqual(chart.y);
			expect(box.x + box.width, toothId).toBeLessThanOrEqual(
				chart.x + chart.width,
			);
			expect(box.y + box.height, toothId).toBeLessThanOrEqual(
				chart.y + chart.height,
			);
		}

		const permanent = anchors.filter(
			({ dentition }) => dentition === "permanent",
		);
		for (const primary of anchors.filter(
			({ dentition }) => dentition === "primary",
		)) {
			for (const other of permanent) {
				expect(
					overlaps(primary.box, other.box),
					`${primary.toothId}/${other.toothId}`,
				).toBe(false);
			}
		}
	});

	it("draws the primary teeth between the permanent arches", () => {
		const byId = anchorMap(layout);
		const y = (id: string) => anchorOf(byId, id).center.y;

		expect(y("11")).toBeLessThan(y("51"));
		expect(y("51")).toBeLessThan(y("81"));
		expect(y("81")).toBeLessThan(y("41"));
	});

	it("places numbers without overlapping each other or any tooth", () => {
		const labels = getToothNumberLabels(anchors, chart, layout);

		for (const [index, label] of labels.entries()) {
			for (const other of labels.slice(index + 1)) {
				expect(
					overlaps(label.box, other.box),
					`${label.toothId}/${other.toothId}`,
				).toBe(false);
			}
			for (const anchor of anchors) {
				expect(
					overlaps(label.box, anchor.box),
					`${label.toothId}/${anchor.toothId}`,
				).toBe(false);
			}
		}
	});

	it("moves up and down through the four rows", () => {
		const byId = anchorMap(layout);
		const down = (id: string) => findNavigationTarget(anchors, id, "ArrowDown");
		const row = (id: string | undefined) => anchorOf(byId, id ?? "missing").row;

		expect(row(down("11"))).toBe("upper-primary");
		expect(row(down("51"))).toBe("lower-primary");
		expect(row(down("81"))).toBe("lower-permanent");
		expect(down("41")).toBeUndefined();
		expect(row(findNavigationTarget(anchors, "51", "ArrowUp"))).toBe(
			"upper-permanent",
		);
		expect(findNavigationTarget(anchors, "51", "ArrowRight")).toBe("61");
	});
});

describe("mixed horizontal alignment", () => {
	it("puts each primary molar under the premolar that replaces it", () => {
		const byId = anchorMap("horizontal");
		const x = (id: string) => anchorOf(byId, id).center.x;

		for (const [primary, permanent] of [
			["55", "15"],
			["65", "25"],
			["85", "45"],
			["75", "35"],
			["51", "11"],
		]) {
			expect(Math.abs(x(primary) - x(permanent)), primary).toBeLessThan(6);
		}
	});
});

describe("mixed horizontal with surfaces", () => {
	it("keeps abbreviations of the primary rows clear of the permanent numbers", () => {
		const anchors = getToothAnchors("mixed", "horizontal");
		const chart = getLayoutViewBox("mixed", "horizontal");
		const frames = getToothFrames(anchors, chart, "horizontal");
		const numbers = getToothNumberLabels(anchors, chart, "horizontal");
		const { findings } = layoutFindings(
			["51", "55", "61", "65", "71", "75", "81", "85"].map((toothId) => ({
				code: "root-remnant",
				teeth: [toothId],
			})),
			ntsPeruFindingCatalog,
			frames,
			getSurfaceDiagrams(frames),
		);

		for (const finding of findings) {
			for (const label of numbers) {
				expect(
					overlaps(finding.box, label.box),
					`${finding.teeth[0]}/${label.toothId}`,
				).toBe(false);
			}
		}
	});
});

describe("mixed findings", () => {
	it("keeps spans within one row", () => {
		const anchors = getToothAnchors("mixed", "horizontal");
		const frames = getToothFrames(
			anchors,
			getLayoutViewBox("mixed", "horizontal"),
			"horizontal",
		);
		const { findings, issues } = layoutFindings(
			[
				{ code: "fixed-prosthesis", teeth: ["55", "16"] },
				{ code: "fixed-orthodontic-appliance", teeth: ["53", "63"] },
			],
			ntsPeruFindingCatalog,
			frames,
		);

		expect(issues).toEqual([
			'Finding "fixed-prosthesis" needs at least two teeth of the same arch and dentition.',
		]);
		expect(findings[0].teeth).toEqual(["53", "52", "51", "61", "62", "63"]);
	});
});

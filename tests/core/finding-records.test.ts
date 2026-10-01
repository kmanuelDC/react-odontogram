// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ntsPeruFindingCatalog } from "../../src/core/catalogs/nts-peru";
import type { OdontogramFinding } from "../../src/core/types/findings";
import {
	getLayoutViewBox,
	getToothAnchors,
} from "../../src/core/utils/anchors";
import {
	addSurfaceFinding,
	getToothRecord,
	removeSurfaceFinding,
} from "../../src/core/utils/finding-records";
import { layoutFindings } from "../../src/core/utils/findings";
import { clipPolygon, getSurfaceDiagrams } from "../../src/core/utils/surfaces";
import { getPathBox } from "../../src/core/utils/svg-geometry";
import { getToothFrames } from "../../src/core/utils/tooth-frames";

const findings: OdontogramFinding[] = [
	{ code: "caries", teeth: ["36"], surfaces: ["occlusal", "distal"] },
	{
		code: "restoration",
		teeth: ["36", "46"],
		surfaces: ["mesial"],
		status: "planned",
	},
	{ code: "temporary-restoration", teeth: ["36"] },
	{ code: "crown", teeth: ["36"] },
	{ code: "fixed-prosthesis", teeth: ["35", "37"] },
	{ code: "diastema", teeth: ["11", "21"] },
	{ code: "unknown-code", teeth: ["36"] },
];

const entries = (list: { index: number }[]) => list.map(({ index }) => index);

describe("getToothRecord", () => {
	const record = getToothRecord("36", findings);

	it("groups surface findings by surface, all five when none are listed", () => {
		expect(entries(record.surfaces.occlusal)).toEqual([0, 2]);
		expect(entries(record.surfaces.distal)).toEqual([0, 2]);
		expect(entries(record.surfaces.mesial)).toEqual([1, 2]);
		expect(entries(record.surfaces.vestibular)).toEqual([2]);
		expect(entries(record.surfaces.lingual)).toEqual([2]);
		expect(record.surfaces.mesial[0]).toMatchObject({
			scope: "surface",
			definition: { name: "Restauración definitiva" },
		});
	});

	it("lists whole-tooth findings, spans that cover the tooth and unknown codes", () => {
		expect(record.tooth.map(({ index, scope }) => [index, scope])).toEqual([
			[3, "tooth"],
			[4, "span"],
			[6, "unknown"],
		]);
	});

	it("covers spans across the midline and ignores teeth outside them", () => {
		const appliance: OdontogramFinding[] = [
			{ code: "fixed-orthodontic-appliance", teeth: ["42", "32"] },
		];

		expect(getToothRecord("31", appliance).tooth).toHaveLength(1);
		expect(getToothRecord("41", appliance).tooth).toHaveLength(1);
		expect(getToothRecord("33", appliance).tooth).toHaveLength(0);
		expect(getToothRecord("21", appliance).tooth).toHaveLength(0);
	});

	it("works for primary teeth and between-teeth findings", () => {
		expect(
			getToothRecord("21", findings).tooth.map(({ scope }) => scope),
		).toEqual(["between"]);
		expect(
			getToothRecord("54", [
				{ code: "caries", teeth: ["54"], surfaces: ["occlusal"] },
			]).surfaces.occlusal,
		).toHaveLength(1);
		expect(getToothRecord("16", findings).tooth).toEqual([]);
	});
});

describe("addSurfaceFinding", () => {
	it("appends a new finding with surfaces in canonical order", () => {
		const next = addSurfaceFinding(findings, {
			code: "caries",
			toothId: "26",
			surfaces: ["occlusal", "mesial"],
		});

		expect(next).toHaveLength(findings.length + 1);
		expect(next.at(-1)).toEqual({
			code: "caries",
			teeth: ["26"],
			surfaces: ["mesial", "occlusal"],
		});
		expect(findings).toHaveLength(7);
	});

	it("merges into the same kind of finding on the same tooth", () => {
		const next = addSurfaceFinding(findings, {
			code: "caries",
			toothId: "36",
			surfaces: ["vestibular"],
		});

		expect(next).toHaveLength(findings.length);
		expect(next[0].surfaces).toEqual(["vestibular", "occlusal", "distal"]);
		expect(findings[0].surfaces).toEqual(["occlusal", "distal"]);
	});

	it("keeps a different status or color apart", () => {
		const planned = addSurfaceFinding(findings, {
			code: "caries",
			toothId: "36",
			surfaces: ["lingual"],
			status: "planned",
			color: "#7c3aed",
		});

		expect(planned.at(-1)).toEqual({
			code: "caries",
			teeth: ["36"],
			surfaces: ["lingual"],
			status: "planned",
			color: "#7c3aed",
		});
	});

	it("does not merge into a finding shared with other teeth", () => {
		const next = addSurfaceFinding(findings, {
			code: "restoration",
			toothId: "36",
			surfaces: ["occlusal"],
			status: "planned",
		});

		expect(next).toHaveLength(findings.length + 1);
		expect(next[1]).toBe(findings[1]);
	});
});

describe("removeSurfaceFinding", () => {
	it("removes one surface and keeps the rest", () => {
		const next = removeSurfaceFinding(findings, {
			index: 0,
			toothId: "36",
			surface: "distal",
		});

		expect(next[0]).toEqual({
			code: "caries",
			teeth: ["36"],
			surfaces: ["occlusal"],
		});
		expect(next).toHaveLength(findings.length);
	});

	it("removes the finding once its last surface is cleared", () => {
		const once = removeSurfaceFinding(findings, {
			index: 0,
			toothId: "36",
			surface: "distal",
		});
		const twice = removeSurfaceFinding(once, {
			index: 0,
			toothId: "36",
			surface: "occlusal",
		});

		expect(twice).toHaveLength(findings.length - 1);
		expect(twice[0]).toBe(findings[1]);
	});

	it("splits a finding shared with other teeth", () => {
		const next = removeSurfaceFinding(findings, {
			index: 1,
			toothId: "36",
			surface: "mesial",
		});

		expect(next[1]).toEqual({
			code: "restoration",
			teeth: ["46"],
			surfaces: ["mesial"],
			status: "planned",
		});
		expect(
			getToothRecord("36", next).surfaces.mesial.map(
				({ finding }) => finding.code,
			),
		).toEqual(["temporary-restoration"]);
	});

	it("expands a finding without surfaces before clearing one", () => {
		const next = removeSurfaceFinding(findings, {
			index: 2,
			toothId: "36",
			surface: "occlusal",
		});

		expect(next[2].surfaces).toEqual([
			"vestibular",
			"mesial",
			"distal",
			"lingual",
		]);
	});

	it("removes any finding from the whole tooth without a surface", () => {
		expect(
			removeSurfaceFinding(findings, { index: 3, toothId: "36" }),
		).not.toContain(findings[3]);
		expect(
			removeSurfaceFinding(findings, { index: 1, toothId: "36" })[1].teeth,
		).toEqual(["46"]);
	});

	it("leaves the list unchanged for a tooth the finding does not include", () => {
		expect(
			removeSurfaceFinding(findings, {
				index: 0,
				toothId: "11",
				surface: "occlusal",
			}),
		).toEqual(findings);
		expect(
			removeSurfaceFinding(findings, { index: 99, toothId: "36" }),
		).toEqual(findings);
	});
});

describe("drawing several findings on one surface", () => {
	const frames = getToothFrames(
		getToothAnchors("permanent", "horizontal"),
		getLayoutViewBox("permanent", "horizontal"),
		"horizontal",
	);
	const surfaceLayout = getSurfaceDiagrams(frames);
	const diagram = surfaceLayout.diagrams.find(
		({ toothId }) => toothId === "36",
	)!;
	const occlusal = diagram.surfaces.find(
		({ surface }) => surface === "occlusal",
	)!;
	const layout = (list: OdontogramFinding[]) =>
		layoutFindings(list, ntsPeruFindingCatalog, frames, surfaceLayout).findings;

	it("splits a surface into equal strips, one per fill, in list order", () => {
		const drawn = layout([
			{ code: "caries", teeth: ["36"], surfaces: ["occlusal"] },
			{ code: "restoration", teeth: ["36"], surfaces: ["occlusal", "mesial"] },
		]);
		// Every primitive of a fill is a path. Cast instead of Vue's annotated
		// destructuring, which does not type-check (Vue never type-checks tests).
		const [caries, restoration] = drawn.map(({ primitives }) =>
			primitives.map((primitive) => (primitive as { d: string }).d),
		);
		const whole = getPathBox(occlusal.d);
		const first = getPathBox(caries[0]);
		// Primitives follow the surface order: mesial, then the occlusal strip.
		const second = getPathBox(restoration[1]);

		// Horizontal lower row: the occlusal strips run along the arch.
		expect(first.width).toBeCloseTo(whole.width / 2, 1);
		expect(second.width).toBeCloseTo(whole.width / 2, 1);
		expect(first.x === second.x).toBe(false);
		// The mesial surface has a single fill and stays whole.
		expect(restoration).toContain(
			diagram.surfaces.find(({ surface }) => surface === "mesial")!.d,
		);
	});

	it("keeps a single fill whole", () => {
		const [caries] = layout([
			{ code: "caries", teeth: ["36"], surfaces: ["occlusal"] },
		]);
		expect(caries.primitives).toEqual([{ type: "area", d: occlusal.d }]);
	});

	it("draws outlines above every fill", () => {
		const drawn = layout([
			{ code: "temporary-restoration", teeth: ["36"], surfaces: ["occlusal"] },
			{ code: "caries", teeth: ["36"], surfaces: ["occlusal"] },
			{ code: "fracture", teeth: ["36"] },
		]);

		expect(drawn.map(({ code }) => code)).toEqual([
			"caries",
			"fracture",
			"temporary-restoration",
		]);
	});

	it("clips convex polygons between two lines", () => {
		const square = [
			{ x: 0, y: 0 },
			{ x: 4, y: 0 },
			{ x: 4, y: 4 },
			{ x: 0, y: 4 },
		];
		const strip = clipPolygon(square, { x: 1, y: 0 }, 1, 3);

		expect(
			getPathBox(`M${strip.map(({ x, y }) => `${x} ${y}`).join(" L")} Z`),
		).toEqual({ x: 1, y: 0, width: 2, height: 4 });
	});
});

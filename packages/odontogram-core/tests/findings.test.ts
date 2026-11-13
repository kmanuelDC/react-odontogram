// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ntsPeruFindingCatalog } from "../src/catalogs/nts-peru";
import type { FindingCatalog, OdontogramFinding } from "../src/types/findings";
import { getLayoutViewBox, getToothAnchors } from "../src/utils/anchors";
import {
	getFindingBoxes,
	getFindingIcon,
	getFindingScope,
	layoutFindings,
	resolveFindingTone,
} from "../src/utils/findings";
import { getToothNumberLabels } from "../src/utils/numbers";
import { getSurfaceDiagrams } from "../src/utils/surfaces";
import { getPathBox } from "../src/utils/svg-geometry";
import { getToothFrames } from "../src/utils/tooth-frames";

afterEach(() => {
	vi.restoreAllMocks();
});

function frames(
	dentition: "permanent" | "primary" = "permanent",
	layout: "arch" | "horizontal" = "arch",
) {
	return getToothFrames(
		getToothAnchors(dentition, layout),
		getLayoutViewBox(dentition, layout),
		layout,
	);
}

function layout(
	findings: OdontogramFinding[],
	catalog: FindingCatalog = ntsPeruFindingCatalog,
	{ surfaces = false } = {},
) {
	const toothFrames = frames();
	return layoutFindings(
		findings,
		catalog,
		toothFrames,
		surfaces ? getSurfaceDiagrams(toothFrames) : undefined,
	);
}

describe("tooth frames", () => {
	const { frames: permanent } = frames();

	it("points mesial toward the midline on both sides of the arch", () => {
		// 13 is on the viewer's left: mesial goes right; 23 mirrors it.
		expect(permanent.get("13")!.mesial.x).toBeGreaterThan(0);
		expect(permanent.get("23")!.mesial.x).toBeLessThan(0);
	});

	it("points occlusal toward the other arch", () => {
		expect(permanent.get("16")!.occlusal).toEqual({ x: 0, y: 1 });
		expect(permanent.get("46")!.occlusal).toEqual({ x: 0, y: -1 });
	});

	it("keeps inner and outer opposite", () => {
		const { inner, outer } = permanent.get("16")!;
		expect(outer).toEqual({ x: -inner.x, y: -inner.y });
	});
});

describe("NTS Peru catalog", () => {
	it("uses only valid symbols and tones", () => {
		for (const [code, definition] of Object.entries(ntsPeruFindingCatalog)) {
			expect(definition.name, code).toBeTruthy();
			expect(["good", "bad"]).toContain(definition.tone);
			expect(getFindingIcon(definition.symbol).length, code).toBeGreaterThan(0);
		}
	});

	it("draws every catalog finding on the permanent arch without issues", () => {
		const findings = Object.keys(ntsPeruFindingCatalog).map(
			(code): OdontogramFinding => {
				const scope = getFindingScope(
					ntsPeruFindingCatalog[code as keyof typeof ntsPeruFindingCatalog]
						.symbol,
				);
				return {
					code,
					teeth:
						scope === "tooth" || scope === "surface" ? ["16"] : ["14", "15"],
				};
			},
		);
		const result = layout(findings, ntsPeruFindingCatalog, { surfaces: true });

		expect(result.issues).toEqual([]);
		expect(result.findings).toHaveLength(findings.length);
		for (const finding of result.findings) {
			expect(finding.primitives.length, finding.code).toBeGreaterThan(0);
			expect(finding.box.width, finding.code).toBeGreaterThan(0);
		}
	});
});

describe("finding layout", () => {
	it("draws one symbol per tooth for single-tooth findings", () => {
		const { findings } = layout([{ code: "fracture", teeth: ["11", "21"] }]);

		expect(findings.map(({ teeth }) => teeth)).toEqual([["11"], ["21"]]);
		expect(
			findings.every(
				({ tone, status }) => tone === "bad" && status === "existing",
			),
		).toBe(true);
	});

	it("keeps single-tooth symbols over their tooth", () => {
		const anchor = getToothAnchors("permanent", "arch").find(
			({ toothId }) => toothId === "16",
		)!;
		const { findings } = layout([{ code: "fracture", teeth: ["16"] }]);
		const box = getPathBox((findings[0].primitives[0] as { d: string }).d);

		expect(box.x).toBeGreaterThanOrEqual(anchor.box.x);
		expect(box.x + box.width).toBeLessThanOrEqual(
			anchor.box.x + anchor.box.width,
		);
	});

	it("lets a finding override tone and abbreviation", () => {
		const { findings } = layout([
			{ code: "mobility", teeth: ["31"], label: "M3", tone: "good" },
		]);
		const text = findings[0].primitives.find(
			(primitive) => primitive.type === "text",
		);

		expect(findings[0].tone).toBe("good");
		expect(text).toMatchObject({ text: "M3" });
	});

	it("places abbreviations on the vestibular side and stacks them", () => {
		const frame = frames().frames.get("16")!;
		const { findings } = layout([
			{ code: "implant", teeth: ["16"] },
			{ code: "mobility", teeth: ["16"] },
		]);
		const [first, second] = findings.map(
			({ primitives }) =>
				primitives.find((primitive) => primitive.type === "text") as {
					x: number;
					y: number;
				},
		);
		const along = (p: { x: number; y: number }) =>
			(p.x - frame.center.x) * frame.outer.x +
			(p.y - frame.center.y) * frame.outer.y;

		expect(along(first)).toBeGreaterThan(0);
		expect(along(second)).toBeGreaterThan(along(first));
	});

	it("points migration arrows mesial by default and distal on request", () => {
		const tip = (direction?: "mesial" | "distal") => {
			const { findings } = layout([
				{ code: "migrated", teeth: ["13"], direction },
			]);
			return getPathBox((findings[0].primitives[1] as { d: string }).d);
		};

		// 13 is on the viewer's left, so mesial is to the right.
		expect(tip().x).toBeGreaterThan(tip("distal").x);
	});

	it("covers the whole arch range of a span, across the midline", () => {
		const { findings } = layout([
			{ code: "fixed-orthodontic-appliance", teeth: ["32", "42"] },
		]);

		expect(findings[0].teeth).toEqual(["42", "41", "31", "32"]);
	});

	it("reports invalid findings instead of drawing them", () => {
		const result = layout([
			{ code: "unknown", teeth: ["11"] },
			{ code: "diastema", teeth: ["11", "41"] },
			{ code: "diastema", teeth: ["11"] },
			{ code: "fixed-prosthesis", teeth: ["14"] },
		]);

		expect(result.findings).toEqual([]);
		expect(result.issues).toHaveLength(4);
	});

	it("supports custom catalogs", () => {
		const catalog: FindingCatalog = {
			...ntsPeruFindingCatalog,
			sensitivity: {
				name: "Sensibilidad",
				symbol: { kind: "text", text: "SEN" },
				tone: "bad",
			},
		};
		const { findings, issues } = layout(
			[{ code: "sensitivity", teeth: ["24"] }],
			catalog,
		);

		expect(issues).toEqual([]);
		expect(findings[0].primitives).toContainEqual(
			expect.objectContaining({ text: "SEN" }),
		);
	});

	it("works in every layout", () => {
		for (const dentition of ["permanent", "primary"] as const) {
			for (const layoutName of ["arch", "horizontal"] as const) {
				const teeth = dentition === "permanent" ? ["11", "12"] : ["51", "52"];
				const result = layoutFindings(
					[
						{ code: "fracture", teeth: [teeth[0]] },
						{ code: "diastema", teeth },
						{ code: "fixed-prosthesis", teeth },
					],
					ntsPeruFindingCatalog,
					frames(dentition, layoutName),
				);

				expect(result.issues).toEqual([]);
				expect(result.findings).toHaveLength(3);
			}
		}
	});
});

describe("finding status and color", () => {
	it("resolves the tone from the finding, then the status, then the catalog", () => {
		const good = { tone: "good" as const };
		const bad = { tone: "bad" as const };

		expect(resolveFindingTone({}, good)).toBe("good");
		expect(resolveFindingTone({ status: "existing" }, bad)).toBe("bad");
		expect(resolveFindingTone({ status: "planned" }, good)).toBe("bad");
		expect(resolveFindingTone({ status: "done" }, bad)).toBe("good");
		expect(resolveFindingTone({ status: "planned", tone: "good" }, bad)).toBe(
			"good",
		);
	});

	it("keeps the status and custom color of each finding", () => {
		const { findings } = layout([
			{ code: "extraction", teeth: ["18"], status: "planned" },
			{ code: "crown", teeth: ["21"], status: "done", color: "#7c3aed" },
		]);

		expect(
			findings.map(({ status, tone, color }) => ({ status, tone, color })),
		).toEqual([
			{ status: "planned", tone: "bad", color: undefined },
			{ status: "done", tone: "good", color: "#7c3aed" },
		]);
	});

	it("draws a cross over the tooth", () => {
		const anchor = getToothAnchors("permanent", "arch").find(
			({ toothId }) => toothId === "18",
		)!;
		const { findings } = layout([{ code: "extraction", teeth: ["18"] }]);

		expect(findings[0].primitives).toHaveLength(2);
		for (const primitive of findings[0].primitives) {
			const box = getPathBox((primitive as { d: string }).d);
			expect(box.x).toBeGreaterThan(anchor.box.x);
			expect(box.x + box.width).toBeLessThan(anchor.box.x + anchor.box.width);
		}
	});
});

describe("surface findings", () => {
	it("fills only the listed surfaces of the diagram", () => {
		const toothFrames = frames();
		const surfaceLayout = getSurfaceDiagrams(toothFrames);
		const diagram = surfaceLayout.diagrams.find(
			({ toothId }) => toothId === "16",
		)!;
		const { findings, issues } = layoutFindings(
			[{ code: "caries", teeth: ["16"], surfaces: ["occlusal", "mesial"] }],
			ntsPeruFindingCatalog,
			toothFrames,
			surfaceLayout,
		);
		const shape = (surface: string) =>
			diagram.surfaces.find((item) => item.surface === surface)!.d;

		expect(issues).toEqual([]);
		expect(findings[0].surfaces).toEqual(["mesial", "occlusal"]);
		expect(findings[0].primitives).toEqual([
			{ type: "area", d: shape("mesial") },
			{ type: "area", d: shape("occlusal") },
		]);
	});

	it("covers every surface when none are listed and outlines with strokes", () => {
		const { findings } = layout(
			[{ code: "temporary-restoration", teeth: ["36"] }],
			undefined,
			{
				surfaces: true,
			},
		);

		expect(findings[0].surfaces).toHaveLength(5);
		expect(findings[0].primitives.every(({ type }) => type === "path")).toBe(
			true,
		);
	});

	it("reports surface findings when the diagrams are hidden", () => {
		const { findings, issues } = layout([
			{ code: "caries", teeth: ["16"], surfaces: ["occlusal"] },
		]);

		expect(findings).toEqual([]);
		expect(issues).toEqual([
			'Finding "caries" is drawn on tooth surfaces and needs showSurfaces.',
		]);
	});
});

describe("gemination/fusion, root location and finding boxes", () => {
	const toothFrames = frames();
	const anchorBox = (toothId: string) =>
		getToothAnchors("permanent", "arch").find(
			(anchor) => anchor.toothId === toothId,
		)!.box;
	const inside = (
		{ x, y }: { x: number; y: number },
		box: { x: number; y: number; width: number; height: number },
	) =>
		x >= box.x &&
		x <= box.x + box.width &&
		y >= box.y &&
		y <= box.y + box.height;
	const centerOf = (box: {
		x: number;
		y: number;
		width: number;
		height: number;
	}) => ({
		x: box.x + box.width / 2,
		y: box.y + box.height / 2,
	});

	it("draws gemination/fusion as two intersecting circles around two teeth", () => {
		const { findings, issues } = layout([
			{ code: "fusion", teeth: ["11", "12"] },
		]);
		const [a, b] = findings[0].primitives as {
			cx: number;
			cy: number;
			r: number;
		}[];

		expect(issues).toEqual([]);
		expect(findings[0].teeth).toEqual(["11", "12"]);
		expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeLessThan(a.r + b.r);
		expect(layout([{ code: "fusion", teeth: ["11"] }]).issues).toHaveLength(1);
	});

	it("draws a root finding past the tooth and a crown one over it", () => {
		const tooth = anchorBox("16");
		const [root, crown] = layout([
			{ code: "fracture", teeth: ["16"], location: "root" },
			{ code: "root-remnant", teeth: ["16"], location: "crown" },
		]).findings;

		expect(root.location).toBe("root");
		expect(inside(centerOf(root.box), tooth)).toBe(false);
		expect(inside(centerOf(crown.box), tooth)).toBe(true);
	});

	it("writes abbreviations side by side in the tooth box, past the root zone", () => {
		const boxes = getFindingBoxes(toothFrames);
		const box = boxes.find(({ toothId }) => toothId === "21")!.box;
		const { findings } = layoutFindings(
			[
				{ code: "implant", teeth: ["21"] },
				{ code: "mobility", teeth: ["21"] },
				{ code: "fracture", teeth: ["21"], location: "root" },
			],
			ntsPeruFindingCatalog,
			toothFrames,
			undefined,
			{ boxes: true },
		);
		const texts = findings
			.filter(({ code }) => code !== "fracture")
			.map(({ primitives }) => primitives[0] as { x: number; y: number });
		const fracture = findings.find(({ code }) => code === "fracture")!;
		const tooth = centerOf(anchorBox("21"));
		const distance = (p: { x: number; y: number }) =>
			Math.hypot(p.x - tooth.x, p.y - tooth.y);

		expect(boxes).toHaveLength(toothFrames.frames.size);
		expect(texts.every((text) => inside(text, box))).toBe(true);
		expect(texts[0].x).toBeLessThan(texts[1].x);
		expect(distance(centerOf(fracture.box))).toBeLessThan(
			distance(centerOf(box)),
		);
		expect(inside(centerOf(fracture.box), box)).toBe(false);
	});
});

describe("NTS 188 symbols", () => {
	const toothFrames = frames();
	const anchor = (toothId: string) =>
		getToothAnchors("permanent", "arch").find(
			(item) => item.toothId === toothId,
		)!;
	const numbers = new Map(
		getToothNumberLabels(
			getToothAnchors("permanent", "arch"),
			getLayoutViewBox("permanent", "arch"),
			"arch",
			"FDI",
		).map(({ toothId, box }) => [toothId, box]),
	);
	const run = (findings: OdontogramFinding[], boxes = false) =>
		layoutFindings(findings, ntsPeruFindingCatalog, toothFrames, undefined, {
			boxes,
			numbers,
		});
	const center = (box: {
		x: number;
		y: number;
		width: number;
		height: number;
	}) => ({
		x: box.x + box.width / 2,
		y: box.y + box.height / 2,
	});

	it("borders the crown with a square", () => {
		const { findings } = run([{ code: "crown", teeth: ["16"] }]);
		const drawn = getPathBox((findings[0].primitives[0] as { d: string }).d);
		const tooth = anchor("16").box;

		expect(drawn.width).toBeGreaterThan(tooth.width);
		expect(drawn.height).toBeGreaterThan(tooth.height);
	});

	it("circles the tooth numbers for gemination and fusion", () => {
		const { findings, issues } = run([
			{ code: "gemination", teeth: ["21"] },
			{ code: "fusion", teeth: ["11", "12"] },
		]);
		const [gemination, fusion] = findings;
		const circle = gemination.primitives[0] as { cx: number; cy: number };
		const [first, second] = (fusion.primitives as { d: string }[]).map(
			({ d }) => getPathBox(d),
		);
		const overlap = (
			p: { x: number; y: number; width: number; height: number },
			q: typeof p,
		) =>
			p.x < q.x + q.width &&
			q.x < p.x + p.width &&
			p.y < q.y + q.height &&
			q.y < p.y + p.height;

		expect(issues).toEqual([]);
		expect({ x: circle.cx, y: circle.cy }).toEqual(center(numbers.get("21")!));
		expect(inside(center(numbers.get("11")!), first)).toBe(true);
		expect(inside(center(numbers.get("12")!), second)).toBe(true);
		expect(overlap(first, second)).toBe(true);
	});

	it("puts the supernumerary between the apices of two teeth", () => {
		const { findings, issues } = run([
			{ code: "supernumerary", teeth: ["11", "21"] },
		]);
		const text = findings[0].primitives.find(
			(primitive) => primitive.type === "text",
		) as { x: number; y: number; text: string };
		const [a, b] = [anchor("11").center, anchor("21").center];

		expect(issues).toEqual([]);
		expect(text.text).toBe("S");
		expect(text.x).toBeGreaterThan(Math.min(a.x, b.x));
		expect(text.x).toBeLessThan(Math.max(a.x, b.x));
		// Past the crowns, on the vestibular (upper) side.
		expect(text.y).toBeLessThan(
			Math.min(anchor("11").box.y, anchor("21").box.y),
		);
	});

	it("draws the root canal line past the tooth and its sigla in the box", () => {
		const box = getFindingBoxes(toothFrames).find(
			({ toothId }) => toothId === "41",
		)!.box;
		const { findings } = run(
			[{ code: "pulp-treatment", teeth: ["41"], label: "PC" }],
			true,
		);
		const [line, text] = findings[0].primitives as unknown as [
			{ d: string },
			{ x: number; y: number; text: string },
		];
		const tooth = anchor("41").box;

		expect(getPathBox(line.d).y).toBeGreaterThanOrEqual(
			tooth.y + tooth.height - 0.01,
		);
		expect(text.text).toBe("PC");
		expect(text.y).toBeCloseTo(box.y + box.height / 2);
	});

	it("fills the coronal pulp for a pulpotomy and writes PP in the box", () => {
		const { findings } = run([{ code: "pulpotomy", teeth: ["36"] }], true);
		const [pulp, text] = findings[0].primitives;

		expect(pulp.type).toBe("area");
		expect(text).toMatchObject({ type: "text", text: "PP" });
	});

	it("joins the post-core square to a line through the root zone", () => {
		const { findings } = run([{ code: "post-core", teeth: ["21"] }]);
		const [square, post] = findings[0].primitives as { d: string }[];
		const tooth = anchor("21").box;

		expect(inside(center(getPathBox(square.d)), tooth)).toBe(true);
		// The post reaches past the top (vestibular) edge of an upper tooth.
		expect(getPathBox(post.d).y).toBeLessThan(tooth.y);
	});
});

function inside(
	{ x, y }: { x: number; y: number },
	box: { x: number; y: number; width: number; height: number },
) {
	return (
		x >= box.x &&
		x <= box.x + box.width &&
		y >= box.y &&
		y <= box.y + box.height
	);
}

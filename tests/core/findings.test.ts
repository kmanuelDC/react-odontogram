// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ntsPeruFindingCatalog } from "../../src/core/catalogs/nts-peru";
import type {
	FindingCatalog,
	OdontogramFinding,
} from "../../src/core/types/findings";
import {
	getLayoutViewBox,
	getToothAnchors,
} from "../../src/core/utils/anchors";
import {
	getFindingIcon,
	getFindingScope,
	layoutFindings,
	resolveFindingTone,
} from "../../src/core/utils/findings";
import { getSurfaceDiagrams } from "../../src/core/utils/surfaces";
import { getPathBox } from "../../src/core/utils/svg-geometry";
import { getToothFrames } from "../../src/core/utils/tooth-frames";

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
			{ code: "pulp-treatment", teeth: ["16"] },
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

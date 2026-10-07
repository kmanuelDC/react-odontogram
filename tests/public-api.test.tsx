// Ported from vue-odontogram: tests/public-api.test.ts, extended to the whole
// entry point. The runtime list is exact, so adding or removing an export
// is a visible change; the types are checked by `tsc` (which covers tests/).
import { render } from "@testing-library/react";
import { describe, expect, expectTypeOf, it } from "vitest";
// biome-ignore lint/style/noNamespaceImport: the test lists every export of the entry point.
import * as publicApi from "../src";
import type {
	Box,
	DentalArch,
	DentalSide,
	Dentition,
	FindingCatalog,
	FindingDefinition,
	FindingDirection,
	FindingScope,
	FindingStatus,
	FindingSymbol,
	FindingSymbolKind,
	FindingTone,
	NtsPeruFindingCode,
	OdontogramColors,
	OdontogramCondition,
	OdontogramFinding,
	OdontogramHalf,
	OdontogramLabels,
	OdontogramLabelsInput,
	OdontogramLayout,
	OdontogramModel,
	OdontogramOverlayRenderProps,
	OdontogramProps,
	OdontogramSurfaces,
	OdontogramTooltipRenderProps,
	OdontogramToothStates,
	PalmerQuadrant,
	Point,
	SurfaceDiagram,
	SurfaceFindingInput,
	SurfaceFindingRemoval,
	SurfaceGuideProps,
	SurfaceMenuRenderProps,
	SurfaceShape,
	SurfaceShapeKind,
	TeethProps,
	TooltipPlacement,
	ToothAnchor,
	ToothCondition,
	ToothConditionGroup,
	ToothDefinition,
	ToothDetail,
	ToothFindingEntry,
	ToothFindingInput,
	ToothInspectorProps,
	ToothNotation,
	ToothProps,
	ToothRecord,
	ToothShape,
	ToothState,
	ToothSurface,
	ToothSurfaceName,
	ToothType,
	ToothVisualCondition,
} from "../src";
import { Odontogram, Tooth, getToothAnchors } from "../src";

/** Runtime exports of vue-odontogram 0.1.1 (`src/index.ts`). */
const vueRuntimeExports = [
	"Odontogram",
	"Tooth",
	"SurfaceGuide",
	"ToothInspector",
	"buildToothId",
	"formatToothNumber",
	"getPalmerQuadrant",
	"getToothType",
	"getQuadrant",
	"defaultOdontogramLabels",
	"toothStates",
	"ntsPeruFindingCatalog",
	"findingStatuses",
	"getFindingScope",
	"resolveFindingTone",
	"surfaceShapeKinds",
	"toothSurfaces",
	"getSurfaceName",
	"toggleSurface",
	"addFinding",
	"addSurfaceFinding",
	"getToothRecord",
	"removeSurfaceFinding",
	"getToothAnchors",
	"getLayoutViewBox",
];

/** React-only exports: 0.5.x API, hooks and helpers. */
const reactRuntimeExports = [
	"default",
	"getViewBox",
	"parseViewBox",
	"useOdontogram",
	"buildOdontogramModel",
	"useToothSelection",
	"useSurfaceSelection",
];

describe("public API", () => {
	it("exports only the public components from the library entry point", () => {
		expect(Odontogram).toBeTruthy();
		expect(Tooth).toBeTruthy();
	});

	it("exports exactly the vue-odontogram names plus the React ones", () => {
		expect(Object.keys(publicApi).sort()).toEqual(
			[...vueRuntimeExports, ...reactRuntimeExports].sort(),
		);
	});

	it("keeps the 0.5.x default export and getViewBox", () => {
		expect(publicApi.default).toBe(publicApi.Odontogram);
		expect(publicApi.getViewBox("arch", "full")).toBe("0 0 409 694");
		expect(publicApi.getViewBox("square", "upper")).toBe("0 0 900 75");
	});

	it("exports components that render", () => {
		const [anchor] = getToothAnchors("permanent", "arch");
		const { container } = render(
			<>
				<publicApi.SurfaceGuide toothId="16" />
				<publicApi.ToothInspector toothId="16" />
			</>,
		);

		expect(anchor.toothId).toBeTruthy();
		expect(container.querySelector(".odontogram-surface-guide")).not.toBeNull();
		expect(container.querySelector(".odontogram-inspector")).not.toBeNull();
	});

	it("exports the shape kinds", () => {
		expect(publicApi.surfaceShapeKinds).toEqual(["square", "circle"]);
	});

	it("exports the tooth helpers of vue-odontogram", () => {
		expect(publicApi.buildToothId("permanent", 1, 1)).toBe("11");
		expect(publicApi.buildToothId("primary", 6, 3)).toBe("63");
		expect(publicApi.formatToothNumber("63", "Universal")).toBe("H");
		expect(publicApi.getQuadrant("primary", "upper", "left")).toBe(6);
		expect(publicApi.getToothType("53")).toBe("Primary Canine");
	});

	it("exports the public types", () => {
		expectTypeOf<ToothCondition>().toEqualTypeOf<{
			fillColor?: string;
			outlineColor?: string;
		}>();
		expectTypeOf<TooltipPlacement>().toEqualTypeOf<
			NonNullable<NonNullable<OdontogramProps["tooltip"]>["placement"]>
		>();
		expectTypeOf<ToothNotation>().toEqualTypeOf<
			"FDI" | "Universal" | "Palmer"
		>();
		expectTypeOf<NtsPeruFindingCode>().toMatchTypeOf<string>();
		expectTypeOf<FindingSymbolKind>().toEqualTypeOf<FindingSymbol["kind"]>();
		expectTypeOf<ToothProps["condition"]>().toEqualTypeOf<
			ToothCondition | undefined
		>();

		// Every other type is importable and not `never`.
		expectTypeOf<
			[
				Box,
				DentalArch,
				DentalSide,
				Dentition,
				FindingCatalog,
				FindingDefinition,
				FindingDirection,
				FindingScope,
				FindingStatus,
				FindingTone,
				OdontogramColors,
				OdontogramCondition,
				OdontogramFinding,
				OdontogramHalf,
				OdontogramLabels,
				OdontogramLabelsInput,
				OdontogramLayout,
				OdontogramModel,
				OdontogramOverlayRenderProps,
				OdontogramSurfaces,
				OdontogramToothStates,
				OdontogramTooltipRenderProps,
				PalmerQuadrant,
				Point,
				SurfaceDiagram,
				SurfaceFindingInput,
				SurfaceFindingRemoval,
				SurfaceGuideProps,
				SurfaceMenuRenderProps,
				SurfaceShape,
				SurfaceShapeKind,
				TeethProps,
				ToothAnchor,
				ToothConditionGroup,
				ToothDefinition,
				ToothDetail,
				ToothFindingEntry,
				ToothFindingInput,
				ToothInspectorProps,
				ToothRecord,
				ToothShape,
				ToothState,
				ToothSurface,
				ToothSurfaceName,
				ToothType,
				ToothVisualCondition,
			]
		>().not.toBeNever();
	});
});

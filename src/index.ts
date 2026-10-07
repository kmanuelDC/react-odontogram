/**
 * Public API of react-odontogram, aligned with vue-odontogram's entry point.
 * The 0.5.x exports (default export, `Odontogram`, `getViewBox` and the
 * types of `./type`) are kept.
 */

// Components
export { default } from "./Odontogram";
export * from "./Odontogram";
export { Tooth } from "./Tooth";
export type { ToothCondition, ToothProps } from "./Tooth";
export { SurfaceGuide } from "./SurfaceGuide";
export type { SurfaceGuideProps } from "./SurfaceGuide";
export { ToothInspector } from "./ToothInspector";
export type { ToothInspectorProps } from "./ToothInspector";

// Hooks (the vue-odontogram composables)
export { buildOdontogramModel, useOdontogram } from "./hooks/useOdontogram";
export type {
	NonPresentToothState,
	OdontogramModel,
	OdontogramModelOptions,
} from "./hooks/useOdontogram";
export { useToothSelection } from "./hooks/useToothSelection";
export type { ToothSelectionOptions } from "./hooks/useToothSelection";
export { useSurfaceSelection } from "./hooks/useSurfaceSelection";
export type { SurfaceSelectionOptions } from "./hooks/useSurfaceSelection";

// Props, payloads and 0.5.x types
export type * from "./type";

// Notation and teeth
export {
	buildToothId,
	formatToothNumber,
	getPalmerQuadrant,
	getToothType,
} from "@kmanueldc/odontogram-core";
export type { PalmerQuadrant } from "@kmanueldc/odontogram-core";
export { getQuadrant } from "@kmanueldc/odontogram-core";
export { defaultOdontogramLabels } from "@kmanueldc/odontogram-core";
export { toothStates } from "@kmanueldc/odontogram-core";
export type {
	DentalArch,
	DentalSide,
	Dentition,
	OdontogramCondition,
	OdontogramHalf,
	ToothNotation,
	ToothShape,
	ToothType,
	ToothVisualCondition,
} from "@kmanueldc/odontogram-core";

// Findings
export { ntsPeruFindingCatalog } from "@kmanueldc/odontogram-core";
export type { NtsPeruFindingCode } from "@kmanueldc/odontogram-core";
export { findingStatuses } from "@kmanueldc/odontogram-core";
export type {
	FindingScope,
	FindingSymbolKind,
} from "@kmanueldc/odontogram-core";
export {
	getFindingScope,
	resolveFindingTone,
} from "@kmanueldc/odontogram-core";
export {
	addFinding,
	addSurfaceFinding,
	getToothRecord,
	removeSurfaceFinding,
} from "@kmanueldc/odontogram-core";
export type {
	SurfaceFindingInput,
	SurfaceFindingRemoval,
	ToothFindingEntry,
	ToothFindingInput,
	ToothRecord,
} from "@kmanueldc/odontogram-core";

// Surfaces
export { surfaceShapeKinds, toothSurfaces } from "@kmanueldc/odontogram-core";
export { getSurfaceName, toggleSurface } from "@kmanueldc/odontogram-core";

// Geometry
export {
	getLayoutViewBox,
	getToothAnchors,
	parseViewBox,
} from "@kmanueldc/odontogram-core";

/**
 * The five crown surfaces of a tooth. The keys are the same for every tooth;
 * the clinical name adapts to it (see `getSurfaceName`):
 * - `occlusal` is incisal on incisors and canines;
 * - `lingual` is palatal on upper teeth;
 * - `vestibular` faces the lips or cheeks (buccal/labial).
 */
export type ToothSurface =
	| "mesial"
	| "distal"
	| "occlusal"
	| "vestibular"
	| "lingual";

/** Every surface, in the order they are listed in the model and read aloud. */
export const toothSurfaces: readonly ToothSurface[] = [
	"vestibular",
	"mesial",
	"occlusal",
	"distal",
	"lingual",
];

/** Clinical name of a surface on a given tooth. */
export type ToothSurfaceName = ToothSurface | "incisal" | "palatal";

/**
 * How the five-surface diagram is drawn:
 * - `square`: a square with a central occlusal square and four trapezoids.
 * - `circle`: a circle with a central occlusal circle and four ring sectors.
 */
export type SurfaceShapeKind = "square" | "circle";

export const surfaceShapeKinds: readonly SurfaceShapeKind[] = [
	"square",
	"circle",
];

/** Selected surfaces keyed by FDI ID; unlisted teeth have none. */
export type OdontogramSurfaces = Partial<Record<string, ToothSurface[]>>;

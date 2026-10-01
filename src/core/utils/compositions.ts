import { permanentTeethPaths } from "../data/permanent";
import { permanentHorizontalTeethPaths } from "../data/permanent-horizontal";
import { primaryTeethPaths } from "../data/primary";
import { primaryHorizontalTeethPaths } from "../data/primary-horizontal";
import type {
	ToothDefinition,
	ToothShape,
	ToothType,
} from "../types/odontogram";
import type { RenderableDentition } from "./dentition-layout";
import { type OdontogramLayout, layoutDefinitions } from "./layout";
import { mixedLayoutDefinitions } from "./mixed-layout";
import { buildToothId } from "./notation";
import { primaryHorizontalLayoutDefinition } from "./primary-horizontal-layout";
import { primaryArchLayoutDefinition } from "./primary-layout";
import type { NumberedDentition } from "./quadrants";

/** The teeth of one dataset in a composition. */
export interface CompositionPart {
	dentition: NumberedDentition;
	quadrants: readonly { quadrant: number; transform: string }[];
	shapes: readonly ToothShape[];
	/** Presentation offsets per tooth type, applied after the shape transform. */
	toothTransforms?: Readonly<Partial<Record<ToothType, string>>>;
}

/**
 * Everything needed to draw one dentition in one layout. Permanent and
 * primary compositions have one part; mixed ones combine both datasets.
 */
export interface DentitionComposition {
	viewBox: string;
	parts: readonly CompositionPart[];
}

const permanentParts: Readonly<Record<OdontogramLayout, CompositionPart>> = {
	arch: {
		dentition: "permanent",
		quadrants: layoutDefinitions.arch.quadrants,
		shapes: permanentTeethPaths,
	},
	horizontal: {
		dentition: "permanent",
		quadrants: layoutDefinitions.horizontal.quadrants,
		shapes: permanentHorizontalTeethPaths,
	},
};

const primaryParts: Readonly<Record<OdontogramLayout, CompositionPart>> = {
	arch: {
		dentition: "primary",
		quadrants: primaryArchLayoutDefinition.quadrants,
		shapes: primaryTeethPaths,
		toothTransforms: primaryArchLayoutDefinition.toothTransforms,
	},
	horizontal: {
		dentition: "primary",
		quadrants: primaryHorizontalLayoutDefinition.quadrants,
		shapes: primaryHorizontalTeethPaths,
	},
};

function mixedComposition(layout: OdontogramLayout): DentitionComposition {
	const { viewBox, permanent, primary } = mixedLayoutDefinitions[layout];

	return {
		viewBox,
		parts: [
			{ ...permanentParts[layout], quadrants: permanent },
			{ ...primaryParts[layout], quadrants: primary },
		],
	};
}

/**
 * Every supported dentition + layout combination with its own dataset and
 * composition. TypeScript rejects a missing combination.
 */
const compositions: Readonly<
	Record<
		RenderableDentition,
		Readonly<Record<OdontogramLayout, DentitionComposition>>
	>
> = {
	permanent: {
		arch: {
			viewBox: layoutDefinitions.arch.viewBox,
			parts: [permanentParts.arch],
		},
		horizontal: {
			viewBox: layoutDefinitions.horizontal.viewBox,
			parts: [permanentParts.horizontal],
		},
	},
	primary: {
		arch: {
			viewBox: primaryArchLayoutDefinition.viewBox,
			parts: [primaryParts.arch],
		},
		horizontal: {
			viewBox: primaryHorizontalLayoutDefinition.viewBox,
			parts: [primaryParts.horizontal],
		},
	},
	mixed: {
		arch: mixedComposition("arch"),
		horizontal: mixedComposition("horizontal"),
	},
};

export function getComposition(
	dentition: RenderableDentition,
	layout: OdontogramLayout,
): DentitionComposition {
	return compositions[dentition][layout];
}

export interface ComposedTooth {
	tooth: ToothDefinition;
	/** Layout-specific transform for this tooth, if any. */
	transform?: string;
}

export interface ComposedQuadrant {
	quadrant: number;
	transform: string;
	teeth: ComposedTooth[];
}

/**
 * Builds the FDI teeth of a composition, grouped in render order. Tooth IDs
 * are always FDI, independent of the presentation.
 */
export function composeQuadrants(
	dentition: RenderableDentition,
	layout: OdontogramLayout,
): ComposedQuadrant[] {
	return getComposition(dentition, layout).parts.flatMap((part) =>
		part.quadrants.map(({ quadrant, transform }) => ({
			quadrant,
			transform,
			teeth: part.shapes.map((shape) => ({
				tooth: {
					id: buildToothId(part.dentition, quadrant, shape.position),
					position: shape.position,
					quadrant,
					dentition: part.dentition,
					type: shape.type,
					shape,
				},
				transform: part.toothTransforms?.[shape.type],
			})),
		})),
	);
}

/** FDI IDs of every tooth a dentition can draw, in render order. */
export function getDentitionToothIds(
	dentition: RenderableDentition,
	layout: OdontogramLayout,
): string[] {
	return composeQuadrants(dentition, layout).flatMap(({ teeth }) =>
		teeth.map(({ tooth }) => tooth.id),
	);
}

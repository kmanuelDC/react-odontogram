/** Tooth categories represented by the permanent dataset. */
export type PermanentToothType =
	| "Central Incisor"
	| "Lateral Incisor"
	| "Canine"
	| "First Premolar"
	| "Second Premolar"
	| "First Molar"
	| "Second Molar"
	| "Third Molar";

/** Tooth categories required by a clinically correct primary dataset. */
export type PrimaryToothType =
	| "Primary Central Incisor"
	| "Primary Lateral Incisor"
	| "Primary Canine"
	| "Primary First Molar"
	| "Primary Second Molar";

export type ToothType = PermanentToothType | PrimaryToothType;

/**
 * Reusable SVG geometry. It intentionally contains no dentition, quadrant,
 * notation, selection or framework concerns.
 */
export interface ToothShape {
	position: number;
	type: ToothType;
	outlinePath: string;
	shadowPath?: string;
	lineHighlightPath?: string | string[];
	/** Optional local SVG transform intrinsic to this geometry. */
	transform?: string;
}

import type { ToothShape } from "../types/geometry";

/**
 * Provisional pediatric geometry designed specifically for the horizontal
 * composition. These original simplified paths are not clinically validated
 * and must not be used for diagnostic or treatment purposes.
 *
 * Coordinates occupy the base half (x=18–246, y=14–64) of the tentative
 * 520×180 workspace. The opposite side will be composed independently in
 * the following layout phase.
 */
export const primaryHorizontalTeethPaths: ToothShape[] = [
	{
		position: 1,
		type: "Primary Central Incisor",
		transform: "translate(360.75 13.3) scale(-0.75 0.75)",
		outlinePath:
			"M176 5C170 6 165 10 164 17c-1 8 1 18 4 25 3 7 7 12 12 15 4 2 10 2 14-1 6-5 10-13 12-22 1-7 1-14-2-19-4-7-12-11-18-10Z",
		shadowPath:
			"M178 10c-5 1-8 5-9 10-1 7 1 15 4 21 2 5 5 9 9 11 3 1 7 1 10-2 5-4 8-10 9-18 1-6 1-11-2-15-3-5-9-8-15-7Z",
		lineHighlightPath: "M170 19c4-5 15-7 24-3",
	},
	{
		position: 2,
		type: "Primary Lateral Incisor",
		transform: "translate(36.75 10.5) scale(0.75)",
		outlinePath:
			"M177 21c5-5 15-6 22-3 7 3 11 10 11 18 0 10-5 20-12 25-6 4-14 3-20-2-6-5-9-13-8-22 0-7 2-12 7-16Z",
		shadowPath:
			"M180 25c4-4 12-4 17-2 6 3 8 8 8 15 0 8-4 16-10 20-5 3-11 2-15-2-4-4-6-10-5-17 0-6 2-11 5-14Z",
		lineHighlightPath: "M178 36c5-4 14-5 20-1",
	},
	{
		position: 3,
		type: "Primary Canine",
		transform: "translate(24.75 10.25) scale(0.75)",
		outlinePath:
			"M135 49c1-12 7-24 16-32 4-4 10-4 14-1 7 6 8 17 5 27-3 11-10 20-19 23-6 2-13-2-15-8-2-3-2-6-1-9Z",
		shadowPath:
			"M140 49c1-10 6-19 13-26 3-3 7-3 10 0 5 5 5 14 3 22-3 9-8 16-15 19-4 1-9-2-10-6-1-3-1-6-1-9Z",
		lineHighlightPath: ["M142 52c2-10 7-18 14-24", "M156 28c4 8 3 17-1 25"],
	},
	{
		position: 4,
		type: "Primary First Molar",
		transform: "translate(19.5 11) scale(0.75)",
		outlinePath:
			"M82 19c10-7 26-7 36 0 9 7 12 19 8 30-4 12-15 19-28 20-13 1-25-4-31-14-6-11-3-26 15-36Z",
		shadowPath:
			"M85 24c8-5 21-5 29 1 7 5 9 15 6 24-4 9-12 15-23 16-11 1-20-3-25-11-5-9-2-20 13-26Z",
		lineHighlightPath: [
			"M78 42c6-5 13-7 19-4 5 2 7 7 8 11",
			"M105 49c5-6 11-7 16-3",
			"M97 27c1 7 1 15 0 22",
		],
	},
	{
		position: 5,
		type: "Primary Second Molar",
		transform: "translate(4.5 11.25) scale(0.75)",
		outlinePath:
			"M23 16c11-6 28-5 39 3 10 8 13 21 9 33-5 13-17 21-32 22-16 1-29-5-35-17-6-12-1-31 19-41Z",
		shadowPath:
			"M27 21c9-5 23-4 32 3 8 6 10 17 7 27-4 10-14 17-27 18-13 1-23-4-28-14-5-10-1-25 16-34Z",
		lineHighlightPath: [
			"M18 43c7-6 15-8 23-5 5 3 8 8 10 13",
			"M51 51c6-7 14-8 20-3",
			"M40 28c2 8 2 17 0 26",
		],
	},
];

export const primaryHorizontalGeometryStatus = {
	status: "provisional",
	clinicallyValidated: false,
	intendedUse: "development-and-visual-review",
	source: "original-horizontal-prototype",
	scale: 0.75,
	targetGap: 12,
} as const;

import type { ToothShape } from "../types/geometry";

/**
 * Provisional pediatric geometry for development and visual iteration only.
 *
 * These SVG paths are simplified original approximations. They use the
 * permanent arch as a coordinate reference but are not clinically validated
 * and must not be used for diagnostic or treatment purposes.
 */
export const primaryTeethPaths: ToothShape[] = [
	{
		position: 1,
		type: "Primary Central Incisor",
		outlinePath:
			"M176 5C170 6 165 10 164 17c-1 8 1 18 4 25 3 7 7 12 12 15 4 2 10 2 14-1 6-5 10-13 12-22 1-7 1-14-2-19-4-7-12-11-18-10Z",
		shadowPath:
			"M178 10c-5 1-8 5-9 10-1 7 1 15 4 21 2 5 5 9 9 11 3 1 7 1 10-2 5-4 8-10 9-18 1-6 1-11-2-15-3-5-9-8-15-7Z",
		lineHighlightPath: "M170 19c4-5 15-7 24-3",
	},
	{
		position: 2,
		type: "Primary Lateral Incisor",
		outlinePath:
			"M137 15c-6 1-11 5-13 10-3 7-2 16 1 23 3 7 8 12 14 15 5 2 11 1 15-3 5-5 7-12 7-20 0-7-2-14-6-18-5-6-12-8-18-7Z",
		shadowPath:
			"M139 20c-5 1-8 4-10 8-2 6-1 13 2 19 2 5 6 9 10 11 4 1 8 1 11-3 4-4 5-10 5-16 0-6-2-11-5-14-4-4-8-6-13-5Z",
		lineHighlightPath: "M130 29c5-5 15-7 23-3",
	},
	{
		position: 3,
		type: "Primary Canine",
		outlinePath:
			"M95 38c1-9 6-16 13-21 5-4 13-3 18 1 6 5 9 13 8 21-1 8-6 16-12 21-5 5-12 8-18 5-7-3-11-11-9-27Z",
		shadowPath:
			"M100 40c1-7 5-12 10-16 4-3 10-2 14 1 5 4 6 10 6 16-1 7-4 13-10 18-4 3-9 5-13 3-5-3-8-9-7-22Z",
		lineHighlightPath: ["M102 47c2-8 7-14 14-18", "M116 29c4 7 4 15 1 23"],
	},
	{
		position: 4,
		type: "Primary First Molar",
		outlinePath:
			"M57 108c3-9 12-15 23-16 12-1 24 4 30 13 5 8 5 19 0 27-5 9-16 14-28 15-12 1-24-3-29-12-5-8-3-19 4-27Z",
		shadowPath:
			"M62 111c3-7 10-11 19-12 10-1 20 3 25 10 4 6 4 14 0 21-5 7-13 10-24 11-10 1-19-2-24-9-4-6-2-14 4-21Z",
		lineHighlightPath: [
			"M67 120c5-5 10-7 15-5 4 2 6 5 8 8",
			"M90 123c5-5 11-6 16-2",
			"M82 107c1 6 1 12 0 18",
		],
	},
	{
		position: 5,
		type: "Primary Second Molar",
		outlinePath:
			"M13 162c4-11 15-19 29-20 15-2 29 3 37 14 7 10 7 23 1 34-7 12-20 18-35 19-15 1-29-4-36-15-6-10-3-22 4-32Z",
		shadowPath:
			"M19 165c4-8 12-14 24-16 12-1 24 3 30 12 5 8 5 18 1 27-6 9-16 14-30 15-12 1-24-3-30-12-5-8-2-18 5-26Z",
		lineHighlightPath: [
			"M24 178c5-7 13-10 20-7 5 2 7 7 9 12",
			"M53 183c6-7 14-8 21-3",
			"M43 157c2 8 2 17 0 26",
		],
	},
];

export const primaryGeometryStatus = {
	status: "provisional",
	clinicallyValidated: false,
	intendedUse: "development-and-visual-review",
} as const;

import type { DentalArch, DentalSide, Dentition } from "../types/odontogram";

/** Dentitions whose FDI quadrant is unambiguous for a single tooth. */
export type NumberedDentition = Exclude<Dentition, "mixed">;

const quadrantByPosition: Record<
	NumberedDentition,
	Record<DentalArch, Record<DentalSide, number>>
> = {
	permanent: {
		upper: { right: 1, left: 2 },
		lower: { right: 4, left: 3 },
	},
	primary: {
		upper: { right: 5, left: 6 },
		lower: { right: 8, left: 7 },
	},
};

/** Returns the FDI quadrant for a dentition, arch and patient side. */
export function getQuadrant(
	dentition: NumberedDentition,
	arch: DentalArch,
	side: DentalSide,
): number {
	return quadrantByPosition[dentition][arch][side];
}

export function isQuadrantForDentition(
	dentition: NumberedDentition,
	quadrant: number,
): boolean {
	const firstQuadrant = dentition === "permanent" ? 1 : 5;

	return (
		Number.isInteger(quadrant) &&
		quadrant >= firstQuadrant &&
		quadrant <= firstQuadrant + 3
	);
}

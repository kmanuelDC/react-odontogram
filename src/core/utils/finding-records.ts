import { ntsPeruFindingCatalog } from "../catalogs/nts-peru";
import type {
	FindingCatalog,
	FindingDefinition,
	FindingScope,
	FindingStatus,
	FindingTone,
	OdontogramFinding,
} from "../types/findings";
import { type ToothSurface, toothSurfaces } from "../types/surfaces";
import { getFindingScope } from "./findings";

/**
 * Helpers to read and edit the `findings` list tooth by tooth, e.g. from a
 * panel that shows what is recorded on each surface. They never mutate their
 * input and hold no clinical rules: the app decides what may be recorded.
 */

/** A finding of the list, as it applies to one tooth. */
export interface ToothFindingEntry {
	/** Position in the `findings` list; `removeSurfaceFinding` takes it back. */
	index: number;
	finding: OdontogramFinding;
	/** Catalog entry; undefined for unknown codes. */
	definition?: FindingDefinition;
	scope: FindingScope | "unknown";
}

/** Everything recorded on one tooth. */
export interface ToothRecord {
	toothId: string;
	/** Surface findings on each surface, in list order. */
	surfaces: Record<ToothSurface, ToothFindingEntry[]>;
	/**
	 * Every other finding that includes the tooth: whole-tooth symbols, findings
	 * between two teeth, spans whose range covers it and unknown codes.
	 */
	tooth: ToothFindingEntry[];
}

/** Quadrants drawn on the patient's right, then left, for each row. */
const rowQuadrants: readonly (readonly [number, number])[] = [
	[1, 2],
	[4, 3],
	[5, 6],
	[8, 7],
];

/**
 * Teeth of the row of an FDI tooth in arch order: right back to the midline,
 * then the midline to the left back (e.g. 18…11, 21…28).
 */
function rowOrder(toothId: string): string[] {
	const quadrant = Number(toothId[0]);
	const [right, left] = rowQuadrants.find((pair) =>
		pair.includes(quadrant),
	) ?? [quadrant, quadrant];
	const positions = right > 4 ? 5 : 8;
	const ids = (q: number) =>
		Array.from({ length: positions }, (_, index) => `${q}${index + 1}`);

	return [...ids(right).reverse(), ...ids(left)];
}

/** Whether a span covers a tooth: it lies between its first and last listed tooth. */
function spanCovers(finding: OdontogramFinding, toothId: string): boolean {
	const order = rowOrder(toothId);
	const positions = finding.teeth.map((id) => order.indexOf(id));
	if (positions.some((position) => position < 0) || !positions.length) {
		return false;
	}

	const position = order.indexOf(toothId);
	return (
		position >= Math.min(...positions) && position <= Math.max(...positions)
	);
}

function surfacesOf(finding: OdontogramFinding): ToothSurface[] {
	return finding.surfaces?.length
		? toothSurfaces.filter((surface) => finding.surfaces!.includes(surface))
		: [...toothSurfaces];
}

/**
 * Groups the findings of one tooth by surface. Surface findings (`fill`,
 * `outline`) go to each surface they cover, or to all five when they list no
 * surfaces; every other finding that includes the tooth goes to `tooth`.
 */
export function getToothRecord(
	toothId: string,
	findings: readonly OdontogramFinding[],
	catalog: FindingCatalog = ntsPeruFindingCatalog,
): ToothRecord {
	const record: ToothRecord = {
		toothId,
		surfaces: Object.fromEntries(
			toothSurfaces.map((surface) => [surface, []]),
		) as unknown as ToothRecord["surfaces"],
		tooth: [],
	};

	findings.forEach((finding, index) => {
		const definition = catalog[finding.code];
		const scope = definition ? getFindingScope(definition.symbol) : "unknown";
		const includes =
			scope === "span"
				? spanCovers(finding, toothId)
				: finding.teeth.includes(toothId);
		if (!includes) {
			return;
		}

		const entry: ToothFindingEntry = { index, finding, definition, scope };
		if (scope === "surface") {
			surfacesOf(finding).forEach((surface) =>
				record.surfaces[surface].push(entry),
			);
		} else {
			record.tooth.push(entry);
		}
	});

	return record;
}

/** A surface finding to record on one tooth. */
export interface SurfaceFindingInput {
	code: string;
	toothId: string;
	surfaces: ToothSurface[];
	status?: FindingStatus;
	tone?: FindingTone;
	color?: string;
}

/** Whether two findings would be drawn the same way, surfaces apart. */
function sameKind(
	finding: OdontogramFinding,
	input: SurfaceFindingInput,
): boolean {
	return (
		finding.code === input.code &&
		(finding.status ?? "existing") === (input.status ?? "existing") &&
		finding.tone === input.tone &&
		finding.color === input.color &&
		finding.label === undefined &&
		finding.direction === undefined
	);
}

/**
 * Records a surface finding. When the tooth already has a finding with the
 * same code, status, tone and color on it alone, its surfaces are merged into
 * that one; otherwise a new finding is appended.
 */
export function addSurfaceFinding(
	findings: readonly OdontogramFinding[],
	input: SurfaceFindingInput,
): OdontogramFinding[] {
	const surfaces = toothSurfaces.filter((surface) =>
		input.surfaces.includes(surface),
	);
	const existing = findings.findIndex(
		(finding) =>
			finding.teeth.length === 1 &&
			finding.teeth[0] === input.toothId &&
			sameKind(finding, input),
	);

	if (existing >= 0) {
		const finding = findings[existing];
		const merged = finding.surfaces?.length
			? toothSurfaces.filter(
					(surface) =>
						finding.surfaces!.includes(surface) || surfaces.includes(surface),
				)
			: undefined;
		return findings.map((item, index) =>
			index === existing
				? { ...finding, ...(merged ? { surfaces: merged } : {}) }
				: item,
		);
	}

	return [
		...findings,
		{
			code: input.code,
			teeth: [input.toothId],
			surfaces,
			...(input.status ? { status: input.status } : {}),
			...(input.tone ? { tone: input.tone } : {}),
			...(input.color ? { color: input.color } : {}),
		},
	];
}

/** A finding to record on one tooth: on some surfaces, or on the whole tooth. */
export interface ToothFindingInput {
	code: string;
	toothId: string;
	/** Surfaces, for surface findings (`fill`, `outline`). */
	surfaces?: ToothSurface[];
	status?: FindingStatus;
	tone?: FindingTone;
	color?: string;
}

/**
 * Records a finding on one tooth. Surface findings go through
 * `addSurfaceFinding` (merging surfaces into the same kind of finding); any
 * other finding is appended for the whole tooth.
 */
export function addFinding(
	findings: readonly OdontogramFinding[],
	input: ToothFindingInput,
	catalog: FindingCatalog = ntsPeruFindingCatalog,
): OdontogramFinding[] {
	const definition = catalog[input.code];
	if (definition && getFindingScope(definition.symbol) === "surface") {
		return addSurfaceFinding(findings, {
			...input,
			surfaces: input.surfaces ?? [],
		});
	}

	return [
		...findings,
		{
			code: input.code,
			teeth: [input.toothId],
			...(input.status ? { status: input.status } : {}),
			...(input.tone ? { tone: input.tone } : {}),
			...(input.color ? { color: input.color } : {}),
		},
	];
}

/** Which finding to remove, from a `ToothRecord` entry. */
export interface SurfaceFindingRemoval {
	/** `ToothFindingEntry.index` of the finding in the same list. */
	index: number;
	toothId: string;
	/**
	 * Surface to clear, for surface findings only; without it the finding is
	 * removed from the whole tooth (the way to remove any other finding).
	 */
	surface?: ToothSurface;
}

/**
 * Removes a finding from one surface of a tooth, or from the whole tooth.
 * Other teeth of the same finding keep it unchanged: a finding on several
 * teeth is split so only this tooth loses the surface. A finding without
 * surfaces counts as covering all five.
 */
export function removeSurfaceFinding(
	findings: readonly OdontogramFinding[],
	{ index, toothId, surface }: SurfaceFindingRemoval,
): OdontogramFinding[] {
	const finding = findings[index];
	if (!finding?.teeth.includes(toothId)) {
		return [...findings];
	}

	const otherTeeth = finding.teeth.filter((id) => id !== toothId);
	const remaining = surface
		? surfacesOf(finding).filter((item) => item !== surface)
		: [];
	const replacement: OdontogramFinding[] = [
		...(otherTeeth.length ? [{ ...finding, teeth: otherTeeth }] : []),
		...(remaining.length
			? [{ ...finding, teeth: [toothId], surfaces: remaining }]
			: []),
	];

	return [
		...findings.slice(0, index),
		...replacement,
		...findings.slice(index + 1),
	];
}

/**
 * Texts of the findings for accessible names, tooltips and the legend, as
 * vue-odontogram writes them. Framework-free.
 */
import {
	type FindingCatalog,
	type FindingLocation,
	type FindingPrimitive,
	type FindingStatus,
	type FindingTone,
	type OdontogramFinding,
	type OdontogramLabels,
	type RenderedFinding,
	type ToothFindingEntry,
	type ToothSurface,
	getFindingIcon,
	getSurfaceName,
	getToothRecord,
	toothSurfaces,
} from "@kmanueldc/odontogram-core";
import type { TooltipSurfaceSummary } from "./type";

/**
 * A name followed by its location, if any, and its status when not
 * `existing`: "Fracture (Root, Planned)".
 */
function withStatus(
	name: string,
	status: FindingStatus,
	labels: OdontogramLabels,
	location?: FindingLocation,
): string {
	const details = [
		...(location ? [labels.findingLocations[location]] : []),
		...(status === "existing" ? [] : [labels.findingStatuses[status]]),
	];
	return details.length > 0 ? `${name} (${details.join(", ")})` : name;
}

/** Name of a recorded finding, with its status. */
function describeEntry(
	{ finding, definition }: ToothFindingEntry,
	labels: OdontogramLabels,
): string {
	return withStatus(
		definition?.name ?? finding.code,
		finding.status ?? "existing",
		labels,
		finding.location,
	);
}

/**
 * Descriptions of the findings on a tooth, without repetitions, e.g.
 * "Caries (Occlusal, Mesial)" or "Extraction (Planned)"; for its
 * accessible name.
 */
export function getFindingNames(
	toothId: string,
	findingsByTooth: ReadonlyMap<string, readonly RenderedFinding[]>,
	labels: OdontogramLabels,
): string[] {
	const describe = ({ name, surfaces, status, location }: RenderedFinding) => {
		const details = [
			...(surfaces ?? []).map(
				(surface) => labels.surfaceNames[getSurfaceName(surface, toothId)],
			),
			...(location ? [labels.findingLocations[location]] : []),
			...(status === "existing" ? [] : [labels.findingStatuses[status]]),
		];
		return details.length > 0 ? `${name} (${details.join(", ")})` : name;
	};

	return [...new Set((findingsByTooth.get(toothId) ?? []).map(describe))];
}

export interface ToothTooltipFindings {
	/** Whole-tooth findings; surface findings are in `summary`. */
	findings: string[];
	summary: TooltipSurfaceSummary[];
}

/**
 * What the tooltip of a tooth shows: its whole-tooth findings, and the
 * findings of each surface.
 */
export function getToothTooltipFindings(
	toothId: string,
	findings: readonly OdontogramFinding[],
	catalog: FindingCatalog,
	findingsByTooth: ReadonlyMap<string, readonly RenderedFinding[]>,
	labels: OdontogramLabels,
): ToothTooltipFindings {
	if (findings.length === 0) {
		return { findings: [], summary: [] };
	}

	const record = getToothRecord(toothId, findings, catalog);
	const summary = toothSurfaces
		.filter((surface) => record.surfaces[surface].length > 0)
		.map((surface) => {
			const name = getSurfaceName(surface, toothId);
			return {
				surface,
				letter: labels.surfaceLetters[name],
				name: labels.surfaceNames[name],
				findings: [
					...new Set(
						record.surfaces[surface].map((entry) =>
							describeEntry(entry, labels),
						),
					),
				],
			};
		});
	const toothFindings = [
		...new Set(
			(findingsByTooth.get(toothId) ?? [])
				.filter(({ surfaces }) => !surfaces)
				.map(({ name, status }) => withStatus(name, status, labels)),
		),
	];

	return { findings: toothFindings, summary };
}

/** Names of the findings recorded on one surface of a tooth. */
export function getSurfaceFindingNames(
	toothId: string,
	surface: ToothSurface,
	findings: readonly OdontogramFinding[],
	catalog: FindingCatalog,
	labels: OdontogramLabels,
): string[] {
	if (findings.length === 0) {
		return [];
	}
	const record = getToothRecord(toothId, findings, catalog);
	return [
		...new Set(
			record.surfaces[surface].map((entry) => describeEntry(entry, labels)),
		),
	];
}

/** A legend entry of a finding: code, status and color, with its icon. */
export interface LegendFinding {
	key: string;
	code: string;
	name: string;
	status: FindingStatus;
	tone: FindingTone;
	color?: string;
	icon: FindingPrimitive[];
}

/** One legend entry per finding code, status and color on the visible teeth. */
export function getLegendFindings(
	findings: readonly RenderedFinding[],
	catalog: FindingCatalog,
	labels: OdontogramLabels,
): LegendFinding[] {
	const entries = new Map<string, RenderedFinding>();
	for (const finding of findings) {
		const key = [
			finding.code,
			finding.status,
			finding.tone,
			finding.color ?? "",
		].join(":");
		entries.set(key, entries.get(key) ?? finding);
	}

	return [...entries.entries()].map(
		([key, { code, name, status, tone, color }]) => ({
			key,
			code,
			name: withStatus(name, status, labels),
			status,
			tone,
			color,
			icon: getFindingIcon(catalog[code].symbol),
		}),
	);
}

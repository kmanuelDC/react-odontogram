import type {
	FindingCatalog,
	OdontogramFinding,
	OdontogramLabels,
	RenderedFinding,
	ToothSurface,
} from "@kmanueldc/odontogram-core";
import { useCallback, useEffect, useMemo } from "react";
import { warnOnce } from "../compat";
import {
	getFindingNames,
	getLegendFindings,
	getSurfaceFindingNames,
	getToothTooltipFindings,
} from "../findingText";
import type { TooltipSurfaceSummary } from "../type";

export interface ChartFindingsOptions {
	/** Findings with FDI IDs. */
	findings: readonly OdontogramFinding[];
	catalog: FindingCatalog;
	renderedFindings: readonly RenderedFinding[];
	findingsByTooth: ReadonlyMap<string, readonly RenderedFinding[]>;
	findingIssues: readonly string[];
	labels: OdontogramLabels;
}

export interface TooltipFindings {
	/** Of the surface in the tooltip of a surface, else whole-tooth findings. */
	findings: string[];
	/** Findings of each surface, in the tooltip of a tooth. */
	surfaceSummary: TooltipSurfaceSummary[];
}

/**
 * Texts of the drawn findings: accessible descriptions, legend entries and
 * tooltip lines. Warns once about each finding that cannot be drawn.
 */
export function useChartFindings({
	findings,
	catalog,
	renderedFindings,
	findingsByTooth,
	findingIssues,
	labels,
}: ChartFindingsOptions) {
	useEffect(() => {
		for (const issue of findingIssues) {
			warnOnce(`finding:${issue}`, issue);
		}
	}, [findingIssues]);

	const descriptionOf = useCallback(
		(toothId: string) =>
			getFindingNames(toothId, findingsByTooth, labels).join(", ") || undefined,
		[findingsByTooth, labels],
	);

	const legendFindings = useMemo(
		() => getLegendFindings(renderedFindings, catalog, labels),
		[renderedFindings, catalog, labels],
	);

	const tooltipFindingsOf = useCallback(
		(toothId: string, surface?: ToothSurface): TooltipFindings => {
			if (surface) {
				return {
					findings: getSurfaceFindingNames(
						toothId,
						surface,
						findings,
						catalog,
						labels,
					),
					surfaceSummary: [],
				};
			}
			const tooth = getToothTooltipFindings(
				toothId,
				findings,
				catalog,
				findingsByTooth,
				labels,
			);
			return { findings: tooth.findings, surfaceSummary: tooth.summary };
		},
		[findings, catalog, findingsByTooth, labels],
	);

	return { descriptionOf, legendFindings, tooltipFindingsOf };
}

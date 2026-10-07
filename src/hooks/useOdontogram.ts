import {
	type Box,
	type ComposedQuadrant,
	type FindingCatalog,
	type OdontogramFinding,
	type OdontogramLayout,
	type OdontogramToothStates,
	type RenderedFinding,
	type SurfaceDiagram,
	type SurfaceDiagramLayout,
	type SurfaceShapeKind,
	type ToothAnchor,
	type ToothFrames,
	type ToothNotation,
	type ToothNumberLabel,
	type ToothState,
	type ToothStateMark,
	toothStates as allToothStates,
	boxFromPoints,
	composeQuadrants,
	getLayoutViewBox,
	getSurfaceDiagrams,
	getToothAnchors,
	getToothFrames,
	getToothNumberLabels,
	getToothStateMarks,
	layoutFindings,
	ntsPeruFindingCatalog,
	resolveToothState,
} from "@kmanueldc/odontogram-core";
import { useMemo } from "react";
import type { OdontogramDentition, ToothConditionGroup } from "../type";
import { getViewBox } from "../utils";

export type OdontogramHalf = "full" | "upper" | "lower";

export interface OdontogramModelOptions {
	dentition?: OdontogramDentition;
	layout: OdontogramLayout;
	showHalf?: OdontogramHalf;
	/** Teeth per quadrant, counted from the midline; deprecated in R04. */
	maxTeeth?: number;
	/** FDI IDs of the teeth to draw; every tooth of the dentition when omitted. */
	teeth?: readonly string[];
	/** Places a number next to each drawn tooth and fits the viewBox to them. */
	showNumbers?: boolean;
	/** Notation of the numbers. */
	notation?: ToothNotation;
	/** Condition groups with FDI IDs; later groups win for the same tooth. */
	conditions?: readonly ToothConditionGroup[];
	/** Tooth states keyed by FDI ID; unlisted teeth are `present`. */
	toothStates?: OdontogramToothStates;
	/** Places a five-surface diagram next to each drawn tooth. */
	showSurfaces?: boolean;
	/** Square (default) or circular surface diagrams. */
	surfaceShape?: SurfaceShapeKind;
	/** Findings with FDI IDs, drawn on the visible teeth. */
	findings?: readonly OdontogramFinding[];
	/** `ntsPeruFindingCatalog` by default. */
	findingCatalog?: FindingCatalog;
}

/** A tooth state other than `present`. */
export type NonPresentToothState = Exclude<ToothState, "present">;

export interface OdontogramModel {
	viewBox: string;
	/** Visible quadrants, in render order, with their visible teeth. */
	quadrants: ComposedQuadrant[];
	/** Anchors of the drawn teeth, in viewBox coordinates. */
	anchors: ToothAnchor[];
	/** Numbers of the drawn teeth; empty without `showNumbers`. */
	numberLabels: ToothNumberLabel[];
	conditionByTooth: ReadonlyMap<string, ToothConditionGroup>;
	/** Surface diagrams of the drawn teeth; empty without `showSurfaces`. */
	surfaceDiagrams: SurfaceDiagram[];
	/** Findings ready to draw, in list order. */
	renderedFindings: RenderedFinding[];
	/** Why some findings could not be drawn. */
	findingIssues: string[];
	/** Rendered findings covering each tooth. */
	findingsByTooth: ReadonlyMap<string, RenderedFinding[]>;
	/** Cross and implant marks of the drawn teeth. */
	stateMarks: ToothStateMark[];
	/** Non-present states of the drawn teeth, in a stable order, for the legend. */
	legendStates: NonPresentToothState[];
}

const upperQuadrants = new Set([1, 2, 5, 6]);

const isVisibleQuadrant = (quadrant: number, showHalf: OdontogramHalf) =>
	showHalf === "full" ||
	(showHalf === "upper") === upperQuadrants.has(quadrant);

function formatViewBox({ x, y, width, height }: Box): string {
	const round = (value: number) => Math.round(value * 100) / 100;
	return [x, y, width, height].map(round).join(" ");
}

/**
 * ViewBox of a dentition without 0.5.x viewBoxes (as vue-odontogram): the
 * whole composition, or for a half chart its full width and the height of
 * the visible teeth plus a margin.
 */
function getCompositionViewBox(
	dentition: OdontogramDentition,
	layout: OdontogramLayout,
	showHalf: OdontogramHalf,
): string {
	const chart = getLayoutViewBox(dentition, layout);
	if (showHalf === "full") {
		return formatViewBox(chart);
	}

	const anchors = getToothAnchors(dentition, layout).filter(({ quadrant }) =>
		isVisibleQuadrant(quadrant, showHalf),
	);
	const padding = getToothFrames(anchors, chart, layout).fontSize || 4;
	const teeth = boxFromPoints(
		anchors.flatMap(({ box: { x, y, width, height } }) => [
			{ x, y },
			{ x: x + width, y: y + height },
		]),
	);

	return formatViewBox({
		x: chart.x,
		y: teeth.y - padding,
		width: chart.width,
		height: teeth.height + 2 * padding,
	});
}

/** Smallest box containing every box, grown by `padding` on each side. */
function unionBox(boxes: readonly Box[], padding: number): Box {
	const box = boxFromPoints(
		boxes.flatMap(({ x, y, width, height }) => [
			{ x, y },
			{ x: x + width, y: y + height },
		]),
	);
	return {
		x: box.x - padding,
		y: box.y - padding,
		width: box.width + 2 * padding,
		height: box.height + 2 * padding,
	};
}

/**
 * ViewBox with numbers or surface diagrams, as vue-odontogram: the
 * composition grown where they extend beyond it, or for a half chart its
 * full width and the height of the visible teeth, numbers and diagrams.
 */
function getContentViewBox(
	chart: Box,
	anchors: readonly ToothAnchor[],
	labelBoxes: readonly Box[],
	padding: number,
	showHalf: OdontogramHalf,
): string {
	if (showHalf === "full") {
		if (labelBoxes.length === 0) {
			return formatViewBox(chart);
		}
		const content = unionBox(labelBoxes, padding / 2);
		const x = Math.min(chart.x, content.x);
		const y = Math.min(chart.y, content.y);
		return formatViewBox({
			x,
			y,
			width: Math.max(chart.x + chart.width, content.x + content.width) - x,
			height: Math.max(chart.y + chart.height, content.y + content.height) - y,
		});
	}

	const boxes = [...anchors.map(({ box }) => box), ...labelBoxes];
	if (boxes.length === 0) {
		return formatViewBox(chart);
	}
	const content = unionBox(boxes, padding);
	return formatViewBox({
		x: chart.x,
		y: content.y,
		width: chart.width,
		height: content.height,
	});
}

/**
 * Findings laid out on the drawn teeth (on the surface diagrams, when shown),
 * and the findings covering each tooth.
 */
function layoutChartFindings(
	findings: readonly OdontogramFinding[] | undefined,
	catalog: FindingCatalog,
	frames: ToothFrames,
	surfaceLayout: SurfaceDiagramLayout | undefined,
) {
	const findingsByTooth = new Map<string, RenderedFinding[]>();
	if (!findings || findings.length === 0) {
		return { renderedFindings: [], findingIssues: [], findingsByTooth };
	}

	const layout = layoutFindings(findings, catalog, frames, surfaceLayout);
	for (const finding of layout.findings) {
		for (const toothId of finding.teeth) {
			findingsByTooth.set(toothId, [
				...(findingsByTooth.get(toothId) ?? []),
				finding,
			]);
		}
	}
	return {
		renderedFindings: layout.findings,
		findingIssues: layout.issues,
		findingsByTooth,
	};
}

/** Teeth per quadrant for `maxTeeth`, as 0.5.x clamped it. */
function clampMaxTeeth(maxTeeth: number | undefined, available: number) {
	if (typeof maxTeeth !== "number" || Number.isNaN(maxTeeth)) {
		return available;
	}
	return Math.max(0, Math.min(available, Math.floor(maxTeeth)));
}

/**
 * Everything the chart draws for a layout: visible quadrants and teeth,
 * viewBox and the condition of each tooth. Framework-free apart from the hook.
 */
export function buildOdontogramModel({
	dentition = "permanent",
	layout,
	showHalf = "full",
	maxTeeth,
	teeth,
	showNumbers = false,
	notation = "FDI",
	conditions,
	toothStates,
	showSurfaces = false,
	surfaceShape,
	findings,
	findingCatalog = ntsPeruFindingCatalog,
}: OdontogramModelOptions): OdontogramModel {
	const listed = teeth ? new Set(teeth) : undefined;
	const quadrants = composeQuadrants(dentition, layout)
		.filter(({ quadrant }) => isVisibleQuadrant(quadrant, showHalf))
		.map((quadrant) => {
			const limit = clampMaxTeeth(maxTeeth, quadrant.teeth.length);
			return {
				...quadrant,
				teeth: quadrant.teeth.filter(
					({ tooth }) =>
						tooth.position <= limit && (!listed || listed.has(tooth.id)),
				),
			};
		})
		// As in Vue, a quadrant without listed teeth is not drawn. Without
		// `teeth`, empty quadrants (`maxTeeth={0}`) stay, as in 0.5.x.
		.filter((quadrant) => !listed || quadrant.teeth.length > 0);

	const conditionByTooth = new Map<string, ToothConditionGroup>();
	for (const condition of conditions ?? []) {
		for (const toothId of condition.teeth) {
			conditionByTooth.set(toothId, condition);
		}
	}

	const drawn = new Set(
		quadrants.flatMap((quadrant) =>
			quadrant.teeth.map(({ tooth }) => tooth.id),
		),
	);
	const anchors = getToothAnchors(dentition, layout).filter(({ toothId }) =>
		drawn.has(toothId),
	);
	const chart = getLayoutViewBox(dentition, layout);
	const numberLabels = showNumbers
		? getToothNumberLabels(anchors, chart, layout, notation)
		: [];
	const frames = getToothFrames(anchors, chart, layout);
	const surfaceLayout = showSurfaces
		? getSurfaceDiagrams(frames, {
				fairCurve: layout === "arch",
				alignRows: layout === "horizontal",
				shape: surfaceShape,
			})
		: undefined;
	const surfaceDiagrams = surfaceLayout?.diagrams ?? [];
	const { renderedFindings, findingIssues, findingsByTooth } =
		layoutChartFindings(findings, findingCatalog, frames, surfaceLayout);

	let viewBox: string;
	if (showNumbers || showSurfaces || renderedFindings.length > 0) {
		viewBox = getContentViewBox(
			chart,
			anchors,
			[
				...numberLabels.map(({ box }) => box),
				...surfaceDiagrams.map(({ box }) => box),
				...renderedFindings.map(({ box }) => box),
			],
			frames.fontSize || 4,
			showHalf,
		);
	} else if (dentition === "permanent") {
		// The permanent chart keeps the 0.5.x viewBoxes, half charts included.
		viewBox = getViewBox(layout, showHalf);
	} else {
		// The viewBox ignores `teeth`, so the chart keeps its size as teeth
		// erupt or are removed.
		viewBox = getCompositionViewBox(dentition, layout, showHalf);
	}

	const stateMarks = getToothStateMarks(anchors, toothStates);
	const used = new Set(
		anchors.map(({ toothId }) => resolveToothState(toothStates, toothId)),
	);
	const legendStates = allToothStates.filter(
		(state): state is NonPresentToothState =>
			state !== "present" && used.has(state),
	);

	return {
		viewBox,
		quadrants,
		anchors,
		numberLabels,
		surfaceDiagrams,
		renderedFindings,
		findingIssues,
		findingsByTooth,
		conditionByTooth,
		stateMarks,
		legendStates,
	};
}

/** Memoized {@link buildOdontogramModel}. */
export function useOdontogram({
	dentition,
	layout,
	showHalf,
	maxTeeth,
	teeth,
	showNumbers,
	notation,
	conditions,
	toothStates,
	showSurfaces,
	surfaceShape,
	findings,
	findingCatalog,
}: OdontogramModelOptions): OdontogramModel {
	return useMemo(
		() =>
			buildOdontogramModel({
				dentition,
				layout,
				showHalf,
				maxTeeth,
				teeth,
				showNumbers,
				notation,
				conditions,
				toothStates,
				showSurfaces,
				surfaceShape,
				findings,
				findingCatalog,
			}),
		[
			dentition,
			layout,
			showHalf,
			maxTeeth,
			teeth,
			showNumbers,
			notation,
			conditions,
			toothStates,
			showSurfaces,
			surfaceShape,
			findings,
			findingCatalog,
		],
	);
}

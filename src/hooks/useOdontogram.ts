import { useMemo } from "react";
import { getLayoutViewBox, getToothAnchors } from "../core/utils/anchors";
import {
	type ComposedQuadrant,
	composeQuadrants,
} from "../core/utils/compositions";
import type { OdontogramLayout } from "../core/utils/layout";
import { type Box, boxFromPoints } from "../core/utils/svg-geometry";
import { getToothFrames } from "../core/utils/tooth-frames";
import type { OdontogramDentition, ToothConditionGroup } from "../type";
import { getViewBox } from "../utils";

export type OdontogramHalf = "full" | "upper" | "lower";

export interface OdontogramModelOptions {
	dentition?: OdontogramDentition;
	layout: OdontogramLayout;
	showHalf?: OdontogramHalf;
	/** Teeth per quadrant, counted from the midline; deprecated in R04. */
	maxTeeth?: number;
	/** Condition groups with FDI IDs; later groups win for the same tooth. */
	conditions?: readonly ToothConditionGroup[];
}

export interface OdontogramModel {
	viewBox: string;
	/** Visible quadrants, in render order, with their visible teeth. */
	quadrants: ComposedQuadrant[];
	conditionByTooth: ReadonlyMap<string, ToothConditionGroup>;
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
	conditions,
}: OdontogramModelOptions): OdontogramModel {
	const quadrants = composeQuadrants(dentition, layout)
		.filter(({ quadrant }) => isVisibleQuadrant(quadrant, showHalf))
		.map((quadrant) => {
			const limit = clampMaxTeeth(maxTeeth, quadrant.teeth.length);
			return {
				...quadrant,
				teeth: quadrant.teeth.filter(({ tooth }) => tooth.position <= limit),
			};
		});

	const conditionByTooth = new Map<string, ToothConditionGroup>();
	for (const condition of conditions ?? []) {
		for (const toothId of condition.teeth) {
			conditionByTooth.set(toothId, condition);
		}
	}

	return {
		// The permanent chart keeps the 0.5.x viewBoxes, half charts included.
		viewBox:
			dentition === "permanent"
				? getViewBox(layout, showHalf)
				: getCompositionViewBox(dentition, layout, showHalf),
		quadrants,
		conditionByTooth,
	};
}

/** Memoized {@link buildOdontogramModel}. */
export function useOdontogram({
	dentition,
	layout,
	showHalf,
	maxTeeth,
	conditions,
}: OdontogramModelOptions): OdontogramModel {
	return useMemo(
		() =>
			buildOdontogramModel({
				dentition,
				layout,
				showHalf,
				maxTeeth,
				conditions,
			}),
		[dentition, layout, showHalf, maxTeeth, conditions],
	);
}

import type { OdontogramToothStates, ToothState } from "../types/odontogram";
import type { ToothAnchor } from "./anchors";
import type { Box } from "./svg-geometry";

export interface Line {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/** An "X" across an extracted tooth. */
export interface CrossMark {
	kind: "cross";
	toothId: string;
	lines: [Line, Line];
	strokeWidth: number;
}

/** A threaded implant fixture over an implant tooth. */
export interface ImplantMark {
	kind: "implant";
	toothId: string;
	/** Fixture body. */
	body: Box;
	/** Threads across the body. */
	threads: Line[];
	strokeWidth: number;
}

export type ToothStateMark = CrossMark | ImplantMark;

/** States drawn without the crown: only a dashed outline remains. */
export const absentToothStates: ReadonlySet<ToothState> = new Set([
	"missing",
	"extracted",
]);

export function resolveToothState(
	states: OdontogramToothStates | undefined,
	toothId: string,
): ToothState {
	return states?.[toothId] ?? "present";
}

/** Returns `box` shrunk by `ratio` of its size on every side. */
function inset(box: Box, ratio: number): Box {
	return {
		x: box.x + box.width * ratio,
		y: box.y + box.height * ratio,
		width: box.width * (1 - 2 * ratio),
		height: box.height * (1 - 2 * ratio),
	};
}

/**
 * Marks drawn over teeth whose state needs a symbol, in the layout's viewBox
 * coordinates. Their size follows each tooth, so they fit every layout.
 */
export function getToothStateMarks(
	anchors: readonly ToothAnchor[],
	states: OdontogramToothStates | undefined,
): ToothStateMark[] {
	const marks: ToothStateMark[] = [];

	for (const { toothId, box } of anchors) {
		const state = resolveToothState(states, toothId);
		const strokeWidth = Math.max(1, Math.min(box.width, box.height) * 0.06);

		if (state === "extracted") {
			const area = inset(box, 0.12);
			marks.push({
				kind: "cross",
				toothId,
				strokeWidth,
				lines: [
					{
						x1: area.x,
						y1: area.y,
						x2: area.x + area.width,
						y2: area.y + area.height,
					},
					{
						x1: area.x + area.width,
						y1: area.y,
						x2: area.x,
						y2: area.y + area.height,
					},
				],
			});
		} else if (state === "implant") {
			const width = Math.min(box.width, box.height) * 0.22;
			const height = box.height * 0.62;
			const body = {
				x: box.x + (box.width - width) / 2,
				y: box.y + (box.height - height) / 2,
				width,
				height,
			};
			const threadCount = 4;
			const overhang = width * 0.35;
			const threads = Array.from({ length: threadCount }, (_, index) => {
				const y = body.y + (body.height * (index + 1)) / (threadCount + 1);
				return {
					x1: body.x - overhang,
					y1: y,
					x2: body.x + width + overhang,
					y2: y,
				};
			});

			marks.push({
				kind: "implant",
				toothId,
				body,
				threads,
				strokeWidth: strokeWidth * 0.8,
			});
		}
	}

	return marks;
}

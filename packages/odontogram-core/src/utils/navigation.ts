import type { ToothAnchor } from "./anchors";

export type ToothNavigationKey =
	| "ArrowLeft"
	| "ArrowRight"
	| "ArrowUp"
	| "ArrowDown"
	| "Home"
	| "End";

export const toothNavigationKeys: ReadonlySet<string> =
	new Set<ToothNavigationKey>([
		"ArrowLeft",
		"ArrowRight",
		"ArrowUp",
		"ArrowDown",
		"Home",
		"End",
	]);

function byScreenX(a: ToothAnchor, b: ToothAnchor): number {
	return a.center.x - b.center.x;
}

/** Average height of each row on screen. */
function rowHeights(anchors: readonly ToothAnchor[]): Map<string, number> {
	const sums = new Map<string, { total: number; count: number }>();
	for (const { row, center } of anchors) {
		const sum = sums.get(row) ?? { total: 0, count: 0 };
		sums.set(row, { total: sum.total + center.y, count: sum.count + 1 });
	}

	return new Map(
		[...sums].map(([row, { total, count }]) => [row, total / count]),
	);
}

/**
 * Finds the tooth to focus after a navigation key, following what is on
 * screen: left/right move along the same row, up/down jump to the closest
 * tooth of the nearest row drawn above or below, and Home/End go to the first
 * and last tooth of the row. A row is an arch of one dentition, so mixed
 * charts have two per arch. Returns `undefined` when there is nowhere to go.
 */
export function findNavigationTarget(
	anchors: readonly ToothAnchor[],
	fromId: string,
	key: ToothNavigationKey,
): string | undefined {
	const from = anchors.find(({ toothId }) => toothId === fromId);
	if (!from) {
		return undefined;
	}

	const sameArch = anchors
		.filter(({ row }) => row === from.row)
		.sort(byScreenX);
	const index = sameArch.indexOf(from);

	switch (key) {
		case "ArrowLeft":
			return sameArch[index - 1]?.toothId;
		case "ArrowRight":
			return sameArch[index + 1]?.toothId;
		case "Home":
			return sameArch[0]?.toothId;
		case "End":
			return sameArch[sameArch.length - 1]?.toothId;
		default: {
			const goingDown = key === "ArrowDown";
			const heights = rowHeights(anchors);
			const fromHeight = heights.get(from.row)!;
			const candidates = [...heights].filter(
				([row, y]) =>
					row !== from.row && (goingDown ? y > fromHeight : y < fromHeight),
			);
			const nearestRow = candidates.sort(
				([, a], [, b]) => Math.abs(a - fromHeight) - Math.abs(b - fromHeight),
			)[0]?.[0];
			const otherArch = anchors.filter(({ row }) => row === nearestRow);

			return otherArch.reduce<ToothAnchor | undefined>(
				(closest, anchor) =>
					!closest ||
					Math.abs(anchor.center.x - from.center.x) <
						Math.abs(closest.center.x - from.center.x)
						? anchor
						: closest,
				undefined,
			)?.toothId;
		}
	}
}

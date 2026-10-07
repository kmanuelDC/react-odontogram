import {
	type OdontogramLayout,
	type SurfaceDiagram,
	type ToothAnchor,
	parseViewBox,
} from "@kmanueldc/odontogram-core";
import { type ReactNode, useMemo } from "react";
import type { OdontogramDentition, OdontogramOverlayRenderProps } from "./type";

export interface OverlayLayerProps {
	renderOverlay?: (props: OdontogramOverlayRenderProps) => ReactNode;
	/** Anchors of the drawn teeth. */
	anchors: readonly ToothAnchor[];
	/** The rendered `viewBox` attribute. */
	viewBox: string;
	dentition: OdontogramDentition;
	layout: OdontogramLayout;
	surfaceDiagrams: readonly SurfaceDiagram[];
}

/**
 * The app's SVG content drawn above the chart, in viewBox coordinates. The
 * group lets clicks through to the teeth unless a child opts in with
 * `pointer-events`.
 */
export function OverlayLayer({
	renderOverlay,
	anchors,
	viewBox,
	dentition,
	layout,
	surfaceDiagrams,
}: OverlayLayerProps) {
	const anchorsById = useMemo(
		() => Object.fromEntries(anchors.map((anchor) => [anchor.toothId, anchor])),
		[anchors],
	);
	const viewBoxRect = useMemo(() => parseViewBox(viewBox), [viewBox]);

	if (!renderOverlay) {
		return null;
	}

	return (
		<g className="odontogram__overlay">
			{renderOverlay({
				anchors: anchorsById,
				anchorList: anchors,
				viewBox: viewBoxRect,
				dentition,
				layout,
				surfaceDiagrams,
			})}
		</g>
	);
}

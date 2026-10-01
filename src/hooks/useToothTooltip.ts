import { useCallback, useRef, useState } from "react";
import type { OdontogramTooltipProps } from "../Tooltip";
import type { Placement, ToothDetail, ToothInteractionEvent } from "../type";
import { placements } from "../utils";

export interface ToothTooltipOptions {
	placement?: Placement;
	margin?: number;
	/** Payload shown for a tooth ID. */
	getPayload: (toothId: string) => ToothDetail;
}

type TooltipState = Pick<
	OdontogramTooltipProps,
	"active" | "position" | "payload"
>;

/**
 * Tooltip state for the teeth of a chart: `show` anchors it to the tooth that
 * received the event, `hide` closes it. Render `svgRef` on the chart's SVG.
 */
export function useToothTooltip({
	placement = "right",
	margin = 10,
	getPayload,
}: ToothTooltipOptions) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [tooltip, setTooltip] = useState<TooltipState>({ active: false });

	const show = useCallback(
		(toothId: string, event: ToothInteractionEvent) => {
			const path = event.currentTarget.querySelector("path");
			if (!(path && svgRef.current)) {
				return;
			}

			const toothBox = path.getBoundingClientRect();
			const { x } =
				placements[placement]?.(toothBox, margin) ??
				placements.right(toothBox, margin);

			setTooltip({
				active: true,
				position: {
					x,
					placement,
					margin,
					anchorRect: {
						top: toothBox.top,
						right: toothBox.right,
						bottom: toothBox.bottom,
						left: toothBox.left,
					},
				},
				payload: getPayload(toothId),
			});
		},
		[getPayload, margin, placement],
	);

	const hide = useCallback(() => {
		setTooltip((previous) => ({ ...previous, active: false }));
	}, []);

	return { svgRef, tooltip, show, hide };
}

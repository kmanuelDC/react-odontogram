import type { KeyboardEvent } from "react";
import { Tooth } from "./Tooth";
import { formatLegacyNumber } from "./compat";
import type { ComposedQuadrant } from "./core/utils/compositions";
import type {
	Notation,
	ToothConditionGroup,
	ToothInteractionEvent,
} from "./type";

export interface ToothLayerProps {
	quadrants: readonly ComposedQuadrant[];
	notation: Notation;
	disabled: boolean;
	isSelected: (toothId: string) => boolean;
	conditionByTooth: ReadonlyMap<string, ToothConditionGroup>;
	onSelect: (toothId: string) => void;
	onKeyDown: (event: KeyboardEvent<SVGGElement>, toothId: string) => void;
	/** Tooltip handlers; omitted when the tooltip is off. */
	onShowTooltip?: (toothId: string, event: ToothInteractionEvent) => void;
	onHideTooltip?: () => void;
}

/** The teeth of the chart, one group per quadrant with its transform. */
export function ToothLayer({
	quadrants,
	notation,
	disabled,
	isSelected,
	conditionByTooth,
	onSelect,
	onKeyDown,
	onShowTooltip,
	onHideTooltip,
}: ToothLayerProps) {
	return quadrants.map(({ quadrant, transform, teeth }) => (
		<g key={quadrant} transform={transform}>
			{teeth.map(({ tooth, transform: layoutTransform }) => (
				<Tooth
					key={tooth.id}
					tooth={tooth}
					layoutTransform={layoutTransform}
					selected={isSelected(tooth.id)}
					disabled={disabled}
					condition={conditionByTooth.get(tooth.id)}
					onSelect={onSelect}
					onKeyDown={onKeyDown}
					onHover={onShowTooltip}
					onFocus={onShowTooltip}
					onLeave={onHideTooltip}
					onBlur={onHideTooltip}
				>
					<title>{formatLegacyNumber(tooth.id, notation)}</title>
				</Tooth>
			))}
		</g>
	));
}

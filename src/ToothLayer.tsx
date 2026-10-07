import {
	type ComposedQuadrant,
	type ToothState,
	formatToothNumber,
} from "@kmanueldc/odontogram-core";
import type { KeyboardEvent } from "react";
import { Tooth } from "./Tooth";
import { formatLegacyNumber } from "./compat";
import type {
	Notation,
	ToothConditionGroup,
	ToothInteractionEvent,
} from "./type";

export interface ToothLayerProps {
	quadrants: readonly ComposedQuadrant[];
	notation: Notation;
	/** Prefix of each tooth's accessible name, e.g. "Tooth". */
	toothLabel: string;
	/** Presence status of a tooth. */
	stateOf: (toothId: string) => ToothState;
	/** Display names per tooth state, for the accessible names. */
	stateLabels: Readonly<Record<ToothState, string>>;
	/** Extra accessible text of a tooth, e.g. its findings. */
	descriptionOf?: (toothId: string) => string | undefined;
	/** The only tooth Tab reaches; every tooth when omitted. */
	focusableToothId?: string;
	disabled: boolean;
	isSelected: (toothId: string) => boolean;
	conditionByTooth: ReadonlyMap<string, ToothConditionGroup>;
	onSelect: (toothId: string) => void;
	onKeyDown: (event: KeyboardEvent<SVGGElement>, toothId: string) => void;
	/** Tooltip handlers; omitted when the tooltip is off. */
	onShowTooltip?: (toothId: string, event: ToothInteractionEvent) => void;
	/** Focus on a tooth, by Tab, click or arrow keys. */
	onFocusTooth?: (toothId: string, event: ToothInteractionEvent) => void;
	onHideTooltip?: () => void;
}

/** The teeth of the chart, one group per quadrant with its transform. */
export function ToothLayer({
	quadrants,
	notation,
	toothLabel,
	stateOf,
	stateLabels,
	descriptionOf,
	focusableToothId,
	disabled,
	isSelected,
	conditionByTooth,
	onSelect,
	onKeyDown,
	onShowTooltip,
	onFocusTooth,
	onHideTooltip,
}: ToothLayerProps) {
	return quadrants.map(({ quadrant, transform, teeth }) => (
		<g key={quadrant} transform={transform}>
			{teeth.map(({ tooth, transform: layoutTransform }) => {
				const state = stateOf(tooth.id);
				return (
					<Tooth
						key={tooth.id}
						tooth={tooth}
						layoutTransform={layoutTransform}
						focusable={
							focusableToothId === undefined || focusableToothId === tooth.id
						}
						// Read aloud in the chart's notation; Palmer as text (`UR1`).
						label={`${toothLabel} ${formatToothNumber(tooth.id, notation, "text")}`}
						state={state}
						stateLabel={stateLabels[state]}
						description={descriptionOf?.(tooth.id)}
						selected={isSelected(tooth.id)}
						disabled={disabled}
						condition={conditionByTooth.get(tooth.id)}
						onSelect={onSelect}
						onKeyDown={onKeyDown}
						onHover={onShowTooltip}
						onFocus={onFocusTooth ?? onShowTooltip}
						onLeave={onHideTooltip}
						onBlur={onHideTooltip}
					>
						<title>{formatLegacyNumber(tooth.id, notation)}</title>
					</Tooth>
				);
			})}
		</g>
	));
}

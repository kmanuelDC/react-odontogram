import "./styles.css";
import {
	type CSSProperties,
	type FC,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import ConditionLabels from "./Labels";
import { OdontogramTooltip } from "./Tooltip";
import { ToothLayer } from "./ToothLayer";
import {
	buildToothDetail,
	formatPublicId,
	isLegacyLayout,
	normalizeConditions,
	normalizeLayout,
	resolveDisabled,
	toFdiId,
	warnDeprecated,
} from "./compat";
import { useOdontogram } from "./hooks/useOdontogram";
import { useToothSelection } from "./hooks/useToothSelection";
import { useToothTooltip } from "./hooks/useToothTooltip";
import type { OdontogramProps } from "./type";
import { mapToCssVars } from "./utils";

export { getViewBox } from "./utils";

const lightThemeColors = {
	"--dark-blue": "#3e5edc",
	"--base-blue": "#8a98be",
	"--light-blue": "#c6ccf8",
};

const darkThemeColors = {
	"--dark-blue": "#aab6ff",
	"--base-blue": "#d0d5f6",
	"--light-blue": "#5361e6",
};

export const Odontogram: FC<OdontogramProps> = ({
	value,
	defaultValue,
	defaultSelected = [],
	singleSelect = false,
	onChange,
	className = "",
	theme = "light",
	colors = {},
	notation = "FDI",
	tooltip = {
		margin: 10,
		placement: "top",
	},
	showTooltip = true,
	showHalf = "full",
	name,
	dentition = "permanent",
	maxTeeth,
	teethConditions,
	conditions,
	readOnly,
	disabled,
	showLabels = false,
	layout,
	idFormat = "legacy",
	styles,
}) => {
	/**
	 * Compatibility: internal IDs are plain FDI ("11"); `idFormat` only
	 * applies where IDs leave the component.
	 */
	const resolvedLayout = normalizeLayout(layout);
	const isDisabled = resolveDisabled(disabled, readOnly);
	const conditionGroups = useMemo(
		() => normalizeConditions(conditions, teethConditions),
		[conditions, teethConditions],
	);

	useEffect(() => {
		if (isLegacyLayout(layout)) {
			warnDeprecated(
				"layout",
				`layout="${layout}" is deprecated; use layout="${normalizeLayout(layout)}".`,
			);
		}
	}, [layout]);

	useEffect(() => {
		if (maxTeeth !== undefined) {
			warnDeprecated(
				"maxTeeth",
				`maxTeeth is deprecated; maxTeeth={5} shows permanent premolars, not primary teeth. Use dentition="primary".`,
			);
		}
	}, [maxTeeth]);

	useEffect(() => {
		if (teethConditions) {
			warnDeprecated(
				"teethConditions",
				"teethConditions is deprecated; use conditions.",
			);
		}
	}, [teethConditions]);

	/**
	 * Model and state
	 */
	const { viewBox, quadrants, conditionByTooth } = useOdontogram({
		dentition,
		layout: resolvedLayout,
		showHalf,
		maxTeeth,
		conditions: conditionGroups,
	});

	const toToothDetail = useCallback(
		(id: string) => buildToothDetail(id, idFormat),
		[idFormat],
	);

	const controlledValue = useMemo(() => value?.map(toFdiId), [value]);
	const { selected, isSelected, toggle } = useToothSelection({
		value: controlledValue,
		// Only read on mount, like any React default value.
		defaultValue: (defaultValue ?? defaultSelected).map(toFdiId),
		singleSelect,
		disabled: isDisabled,
		onChange: onChange ? (ids) => onChange(ids.map(toToothDetail)) : undefined,
	});

	const {
		svgRef,
		tooltip: tooltipState,
		show: showToothTooltip,
		hide: hideToothTooltip,
	} = useToothTooltip({
		placement: tooltip.placement,
		margin: tooltip.margin,
		getPayload: toToothDetail,
	});

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<SVGGElement>, id: string) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				toggle(id);
			}
		},
		[toggle],
	);

	/**
	 * Colors
	 */
	const finalColors = {
		...(theme === "dark" ? darkThemeColors : lightThemeColors),
		...mapToCssVars(colors),
	};

	const containerClasses = [
		"Odontogram",
		theme === "dark" ? "dark-theme" : "",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={containerClasses}
			style={{
				...(finalColors as CSSProperties),
				width: "100%",
				margin: "0 auto",
				display: "flex",
				flexDirection: "column",
				gap: "20px",
				justifyContent: "center",
				alignItems: "center",
				...(styles as CSSProperties),
			}}
			role={isDisabled ? "group" : "listbox"}
			aria-multiselectable={isDisabled ? undefined : !singleSelect}
			aria-label="Odontogram"
			data-read-only={isDisabled ? "true" : "false"}
			tabIndex={isDisabled ? -1 : 0}
		>
			<input
				type="hidden"
				name={name ?? "teeth"}
				value={JSON.stringify(
					selected.map((id) => formatPublicId(id, idFormat)),
				)}
			/>

			<svg
				ref={svgRef}
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox={viewBox}
				className="Odontogram"
				style={{
					width: "100%",
					height: "auto",
					userSelect: "none",
					touchAction: "manipulation",
				}}
			>
				<title>Odontogram</title>

				<ToothLayer
					quadrants={quadrants}
					notation={notation}
					disabled={isDisabled}
					isSelected={isSelected}
					conditionByTooth={conditionByTooth}
					onSelect={toggle}
					onKeyDown={handleKeyDown}
					onShowTooltip={showTooltip ? showToothTooltip : undefined}
					onHideTooltip={showTooltip ? hideToothTooltip : undefined}
				/>
			</svg>

			{showTooltip && (
				<OdontogramTooltip
					active={tooltipState.active}
					position={tooltipState.position}
					payload={tooltipState.payload}
					content={tooltip.content}
				/>
			)}

			{showLabels && <ConditionLabels conditions={conditionGroups} />}
		</div>
	);
};

export default Odontogram;

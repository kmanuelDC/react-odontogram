import {
	type FindingCatalog,
	type OdontogramFinding,
	type OdontogramLabelsInput,
	type OdontogramToothStates,
	type ToothDefinition,
	type ToothState,
	absentToothStates,
	getDentitionToothIds,
	ntsPeruFindingCatalog,
	resolveOdontogramLabels,
	resolveToothState,
} from "@kmanueldc/odontogram-core";
import {
	type FC,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import Svg, { G, Path, Rect, Text } from "react-native-svg";
import {
	buildToothDetail,
	formatLegacyNumber,
	isLegacyLayout,
	normalizeConditions,
	normalizeFindings,
	normalizeLayout,
	normalizeToothStates,
	resolveDisabled,
	toFdiId,
	warnDeprecated,
	warnOnce,
} from "../../../src/compat";
import { useChartFindings } from "../../../src/hooks/useChartFindings";
import { useOdontogram } from "../../../src/hooks/useOdontogram";
import { useToothSelection } from "../../../src/hooks/useToothSelection";
import type {
	IdFormat,
	Notation,
	OdontogramDentition,
	OdontogramLayoutInput,
	Theme,
	ToothConditionGroup,
	ToothDetail,
} from "../../../src/type";
import {
	NativeFindingLayer,
	NativeFindingPrimitives,
	NativeNumberLayer,
	NativeStateIcon,
	NativeStateMarkLayer,
	findingColor,
} from "./layers";
import {
	type NativeOdontogramColors,
	type NativePalette,
	nativeThemeColors,
} from "./theme";

export interface NativeOdontogramProps {
	/** `permanent` (default), `primary` (51–85) or `mixed`. */
	dentition?: OdontogramDentition;
	/** `arch` (default) or `horizontal`; `circle`/`square` are deprecated aliases. */
	layout?: OdontogramLayoutInput;
	/** FDI IDs of the teeth to draw; every tooth of the dentition when omitted. */
	teeth?: readonly string[];
	/** Selected teeth when controlled, in either ID format. */
	value?: readonly string[];
	/** Initial selection when uncontrolled, in either ID format. */
	defaultValue?: readonly string[];
	/** 0.5.x name of `defaultValue`. */
	defaultSelected?: string[];
	singleSelect?: boolean;
	onChange?: (selected: ToothDetail[]) => void;
	/** Called with the pressed tooth before the selection changes. */
	onToothPress?: (tooth: ToothDetail) => void;
	/** Format of the IDs in `onChange`: `teeth-11` (default) or `11`. */
	idFormat?: IdFormat;
	theme?: Theme;
	colors?: NativeOdontogramColors;
	notation?: Notation;
	/** Draws the tooth numbers next to the teeth. */
	showNumbers?: boolean;
	showHalf?: "upper" | "lower" | "full";
	/** Deprecated: `maxTeeth={5}` shows permanent premolars, not primary teeth. */
	maxTeeth?: number;
	conditions?: ToothConditionGroup[];
	/** Deprecated alias of `conditions`. */
	teethConditions?: ToothConditionGroup[];
	/** `missing`, `extracted`, `implant` or `unerupted` per tooth. */
	toothStates?: OdontogramToothStates;
	/** Clinical findings; whole-tooth, between and span findings are drawn. */
	findings?: readonly OdontogramFinding[];
	/** `ntsPeruFindingCatalog` by default. */
	findingCatalog?: FindingCatalog;
	/** Texts (accessible names, state and status names). */
	labels?: OdontogramLabelsInput;
	disabled?: boolean;
	/** 0.5.x name of `disabled`. */
	readOnly?: boolean;
	/** Legend of conditions, tooth states and findings below the chart. */
	showLabels?: boolean;
	width?: number | string;
	height?: number | string;
	style?: unknown;
	children?: ReactNode;
}

const legendRowHeight = 28;
const legendColumnWidth = 120;
const viewBoxPartPattern = /\s+/;

type LegendEntry =
	| { kind: "condition"; key: string; text: string; group: ToothConditionGroup }
	| {
			kind: "state";
			key: string;
			text: string;
			state: Exclude<ToothState, "present">;
	  }
	| {
			kind: "finding";
			key: string;
			text: string;
			icon: Parameters<typeof NativeFindingPrimitives>[0]["primitives"];
			color: string;
			planned: boolean;
	  };

type NativeToothProps = {
	tooth: ToothDefinition;
	layoutTransform?: string;
	label: string;
	selected: boolean;
	disabled: boolean;
	state: ToothState;
	strokeColor: string;
	fillColor: string;
	onPress: (id: string) => void;
};

const NativeTooth = ({
	tooth: { id, shape },
	layoutTransform,
	label,
	selected,
	disabled,
	state,
	strokeColor,
	fillColor,
	onPress,
}: NativeToothProps) => {
	const { outlinePath, shadowPath, lineHighlightPath } = shape;
	/** Missing and extracted teeth keep only a dashed outline, without crown. */
	const absent = absentToothStates.has(state);
	const transform =
		[shape.transform, layoutTransform].filter(Boolean).join(" ") || undefined;
	const highlights = Array.isArray(lineHighlightPath)
		? lineHighlightPath
		: [lineHighlightPath];

	return (
		<G
			accessibilityLabel={label}
			accessibilityRole={disabled ? "image" : "button"}
			accessibilityState={{ selected, disabled }}
			onPress={disabled ? undefined : () => onPress(id)}
			opacity={absent ? 0.55 : state === "unerupted" ? 0.45 : undefined}
			transform={transform}
		>
			<Path
				d={outlinePath}
				stroke={strokeColor}
				strokeDasharray={absent ? "4 3" : undefined}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={selected ? 1.5 : 2}
			/>
			<Path d={shadowPath} fill={fillColor} />
			{absent
				? null
				: highlights.map((d) => (
						<Path
							key={d}
							d={d}
							stroke={strokeColor}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					))}
		</G>
	);
};

/**
 * React Native odontogram, built on the same core and model as
 * `react-odontogram`: dentitions, layouts, notations, numbers, tooth states,
 * conditions and findings. Surfaces are not available yet.
 */
export const NativeOdontogram: FC<NativeOdontogramProps> = ({
	dentition = "permanent",
	layout,
	teeth,
	value,
	defaultValue,
	defaultSelected = [],
	singleSelect = false,
	onChange,
	onToothPress,
	idFormat = "legacy",
	theme = "light",
	colors,
	notation = "FDI",
	showNumbers = false,
	showHalf = "full",
	maxTeeth,
	conditions,
	teethConditions,
	toothStates,
	findings,
	findingCatalog = ntsPeruFindingCatalog,
	labels,
	disabled,
	readOnly,
	showLabels = false,
	width = "100%",
	height,
	style,
	children,
}) => {
	const resolvedLayout = normalizeLayout(layout);
	const isDisabled = resolveDisabled(disabled, readOnly);
	const palette: NativePalette = { ...nativeThemeColors[theme], ...colors };

	useEffect(() => {
		if (isLegacyLayout(layout)) {
			warnDeprecated(
				"layout",
				`layout="${layout}" is deprecated; use layout="${resolvedLayout}".`,
			);
		}
	}, [layout, resolvedLayout]);

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

	const listedTeeth = useMemo(() => teeth?.map(toFdiId), [teeth]);

	useEffect(() => {
		if (!listedTeeth) {
			return;
		}
		const known = new Set(getDentitionToothIds(dentition, "arch"));
		const unknown = listedTeeth.filter((id) => !known.has(id));
		if (unknown.length > 0) {
			const list = unknown.join(", ");
			warnOnce(
				`teeth:${dentition}:${list}`,
				`Teeth ${list} are not part of the ${dentition} dentition.`,
			);
		}
	}, [listedTeeth, dentition]);

	const conditionGroups = useMemo(
		() => normalizeConditions(conditions, teethConditions),
		[conditions, teethConditions],
	);
	const fdiToothStates = useMemo(
		() => normalizeToothStates(toothStates),
		[toothStates],
	);
	const fdiFindings = useMemo(() => normalizeFindings(findings), [findings]);
	const resolvedLabels = useMemo(
		() => resolveOdontogramLabels(labels),
		[labels],
	);

	const {
		viewBox: chartViewBox,
		quadrants,
		numberLabels,
		conditionByTooth,
		stateMarks,
		legendStates,
		renderedFindings,
		findingIssues,
		findingsByTooth,
	} = useOdontogram({
		dentition,
		layout: resolvedLayout,
		showHalf,
		maxTeeth,
		teeth: listedTeeth,
		showNumbers,
		notation,
		conditions: conditionGroups,
		toothStates: fdiToothStates,
		findings: fdiFindings,
		findingCatalog,
	});
	const { descriptionOf, legendFindings } = useChartFindings({
		findings: fdiFindings,
		catalog: findingCatalog,
		renderedFindings,
		findingsByTooth,
		findingIssues,
		labels: resolvedLabels,
	});

	const toToothDetail = useCallback(
		(id: string) => buildToothDetail(id, idFormat),
		[idFormat],
	);
	const controlledValue = useMemo(() => value?.map(toFdiId), [value]);
	const { isSelected, toggle } = useToothSelection({
		value: controlledValue,
		// Only read on mount, like any React default value.
		defaultValue: (defaultValue ?? defaultSelected).map(toFdiId),
		singleSelect,
		disabled: isDisabled,
		onChange: onChange ? (ids) => onChange(ids.map(toToothDetail)) : undefined,
	});

	const handlePress = useCallback(
		(id: string) => {
			onToothPress?.(toToothDetail(id));
			toggle(id);
		},
		[onToothPress, toToothDetail, toggle],
	);

	const legend: LegendEntry[] = showLabels
		? [
				...(conditionGroups ?? []).map(
					(group, index): LegendEntry => ({
						kind: "condition",
						key: `condition-${index}-${group.label}`,
						text: group.label,
						group,
					}),
				),
				...legendStates.map(
					(state): LegendEntry => ({
						kind: "state",
						key: `state-${state}`,
						text: resolvedLabels.states[state],
						state,
					}),
				),
				...legendFindings.map(
					(finding): LegendEntry => ({
						kind: "finding",
						key: `finding-${finding.key}`,
						text: finding.name,
						icon: finding.icon,
						color: findingColor(finding, palette),
						planned: finding.status === "planned",
					}),
				),
			]
		: [];

	const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = chartViewBox
		.trim()
		.split(viewBoxPartPattern)
		.map(Number);
	const legendColumns = Math.max(
		1,
		Math.floor((viewBoxWidth - 8) / legendColumnWidth),
	);
	const legendRows = Math.ceil(legend.length / legendColumns);
	const svgViewBox =
		legendRows === 0
			? chartViewBox
			: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight + legendRows * legendRowHeight}`;

	return (
		<Svg
			fill="none"
			height={height}
			style={style}
			viewBox={svgViewBox}
			width={width}
		>
			{quadrants.map(({ quadrant, transform, teeth: quadrantTeeth }) => (
				<G key={quadrant} transform={transform}>
					{quadrantTeeth.map(({ tooth, transform: layoutTransform }) => {
						const selected = isSelected(tooth.id);
						const state = resolveToothState(fdiToothStates, tooth.id);
						const condition = conditionByTooth.get(tooth.id);
						// Absent teeth keep the condition outline, not its fill.
						const colored =
							condition !== undefined && !absentToothStates.has(state);
						const label = [
							`${resolvedLabels.tooth} ${formatLegacyNumber(tooth.id, notation)}`,
							state === "present" ? undefined : resolvedLabels.states[state],
							descriptionOf(tooth.id),
						]
							.filter(Boolean)
							.join(", ");

						return (
							<NativeTooth
								key={tooth.id}
								disabled={isDisabled}
								fillColor={
									colored
										? condition.fillColor
										: selected
											? palette.lightBlue
											: "none"
								}
								label={label}
								layoutTransform={layoutTransform}
								onPress={handlePress}
								selected={selected}
								state={state}
								strokeColor={
									condition?.outlineColor ??
									(selected ? palette.darkBlue : palette.baseBlue)
								}
								tooth={tooth}
							/>
						);
					})}
				</G>
			))}

			<NativeStateMarkLayer marks={stateMarks} palette={palette} />
			<NativeFindingLayer findings={renderedFindings} palette={palette} />
			<NativeNumberLayer
				isSelected={isSelected}
				labels={numberLabels}
				palette={palette}
			/>

			{legend.map((entry, index) => {
				const labelX =
					viewBoxX + 8 + (index % legendColumns) * legendColumnWidth;
				const labelY =
					viewBoxY +
					viewBoxHeight +
					17 +
					Math.floor(index / legendColumns) * legendRowHeight;

				return (
					<G key={entry.key}>
						{entry.kind === "condition" && (
							<Rect
								fill={entry.group.fillColor}
								height={12}
								rx={3}
								stroke={entry.group.outlineColor}
								strokeWidth={1.5}
								width={12}
								x={labelX}
								y={labelY - 10}
							/>
						)}
						{entry.kind === "state" && (
							<G transform={`translate(${labelX} ${labelY - 10})`}>
								<NativeStateIcon palette={palette} state={entry.state} />
							</G>
						)}
						{entry.kind === "finding" && (
							// Finding icons are drawn in a 16×16 box.
							<G transform={`translate(${labelX} ${labelY - 10}) scale(0.75)`}>
								<NativeFindingPrimitives
									areaStroke={palette.baseBlue}
									color={entry.color}
									planned={entry.planned}
									primitives={entry.icon}
									strokeWidth={1.4}
								/>
							</G>
						)}
						<Text
							fill={palette.baseBlue}
							fontSize={12}
							x={labelX + 18}
							y={labelY}
						>
							{entry.text}
						</Text>
					</G>
				);
			})}

			{children}
		</Svg>
	);
};

export default NativeOdontogram;
export {
	defaultOdontogramLabels,
	ntsPeruFindingCatalog,
} from "@kmanueldc/odontogram-core";
export type {
	FindingCatalog,
	OdontogramFinding,
	OdontogramLabelsInput,
	OdontogramToothStates,
	ToothState,
} from "@kmanueldc/odontogram-core";
export type {
	IdFormat,
	Notation,
	OdontogramDentition,
	ToothConditionGroup,
	ToothDetail,
};
export type { NativeOdontogramColors, NativePalette };

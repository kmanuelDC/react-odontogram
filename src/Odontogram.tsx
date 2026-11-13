import "./styles.css";
import {
	type ToothAnchor,
	type ToothNavigationKey,
	absentToothStates,
	findNavigationTarget,
	formatToothNumber,
	getDentitionToothIds,
	getSurfaceName,
	ntsPeruFindingCatalog,
	resolveOdontogramLabels,
	resolveToothState,
	toothNavigationKeys,
} from "@kmanueldc/odontogram-core";
import {
	type CSSProperties,
	type FC,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { FindingLayer } from "./FindingLayer";
import ConditionLabels from "./Labels";
import { NumberLayer } from "./NumberLayer";
import { OverlayLayer } from "./OverlayLayer";
import { StateMarkLayer } from "./StateMarkLayer";
import { SurfaceDiagrams, SurfaceLetters } from "./SurfaceDiagrams";
import {
	type ChartSurfaceMenuOptions,
	useChartSurfaceMenu,
} from "./SurfaceMenu";
import { OdontogramTooltip, type TooltipSurfaceDetails } from "./Tooltip";
import { ToothLayer } from "./ToothLayer";
import {
	buildToothDetail,
	formatPublicId,
	formatPublicSurfaces,
	isLegacyLayout,
	normalizeConditions,
	normalizeFindings,
	normalizeLayout,
	normalizeSurfaces,
	normalizeToothStates,
	resolveDisabled,
	toFdiId,
	warnDeprecated,
	warnOnce,
} from "./compat";
import {
	type TooltipFindings,
	useChartFindings,
} from "./hooks/useChartFindings";
import { useOdontogram } from "./hooks/useOdontogram";
import { useSurfaceSelection } from "./hooks/useSurfaceSelection";
import { useToothSelection } from "./hooks/useToothSelection";
import {
	type TooltipTargetEvent,
	useToothTooltip,
} from "./hooks/useToothTooltip";
import type {
	IdFormat,
	Notation,
	OdontogramLabels,
	OdontogramProps,
	OdontogramTooltipRenderProps,
	ToothConditionGroup,
	ToothDefinition,
	ToothDetail,
	ToothInteractionEvent,
	ToothState,
	ToothSurface,
} from "./type";
import { getThemeVars } from "./utils";

export { getViewBox } from "./utils";

/** What the default tooltip shows for a hovered or focused surface. */
function getSurfaceTooltipDetails(
	toothId: string,
	surface: ToothSurface | undefined,
	notation: Notation,
	labels: OdontogramLabels,
	isSurfaceSelected: (toothId: string, surface: ToothSurface) => boolean,
	findings: readonly string[],
): TooltipSurfaceDetails | undefined {
	if (!surface) {
		return undefined;
	}
	const name = getSurfaceName(surface, toothId);
	return {
		surface,
		number: formatToothNumber(toothId, notation),
		name: labels.surfaceNames[name],
		description: labels.surfaceDescriptions[name],
		selected: isSurfaceSelected(toothId, surface),
		findings,
	};
}

interface ChartSurfacesOptions
	extends Pick<
			OdontogramProps,
			| "surfaces"
			| "defaultSurfaces"
			| "onSurfacesChange"
			| "onSurfaceClick"
			| "renderSurfaceMenu"
		>,
		Pick<
			ChartSurfaceMenuOptions,
			"diagramTeeth" | "findings" | "catalog" | "labels" | "spokenNumber"
		> {
	/** A surface menu opened; e.g. hides the tooltip. */
	onMenuOpen: () => void;
	idFormat: IdFormat;
	disabled: boolean;
	anchors: readonly ToothAnchor[];
	stateOf: (toothId: string) => ToothState;
	toothById: ReadonlyMap<string, ToothDefinition>;
}

/**
 * Surfaces of the chart: their own selection, independent of the teeth, in
 * either ID format at the boundary, or a menu per surface with
 * `renderSurfaceMenu`. Missing and extracted teeth have no surfaces to select.
 */
function useChartSurfaces({
	surfaces,
	defaultSurfaces,
	idFormat,
	disabled,
	anchors,
	stateOf,
	toothById,
	onSurfacesChange,
	onSurfaceClick,
	renderSurfaceMenu,
	onMenuOpen,
	...menuOptions
}: ChartSurfacesOptions) {
	const controlled = useMemo(() => normalizeSurfaces(surfaces), [surfaces]);
	const {
		surfaces: current,
		isSurfaceSelected,
		toggle,
	} = useSurfaceSelection({
		value: controlled,
		// Only read on mount, like any React default value.
		defaultValue: normalizeSurfaces(defaultSurfaces),
	});
	const inactiveTeeth = useMemo(
		() =>
			new Set(
				anchors
					.map(({ toothId }) => toothId)
					.filter((id) => absentToothStates.has(stateOf(id))),
			),
		[anchors, stateOf],
	);

	const activate = useCallback(
		(toothId: string, surface: ToothSurface) => {
			const tooth = toothById.get(toothId);
			if (disabled || inactiveTeeth.has(toothId) || !tooth) {
				return;
			}
			const next = formatPublicSurfaces(toggle(toothId, surface), idFormat);
			onSurfacesChange?.(next);
			onSurfaceClick?.(tooth, surface, next);
		},
		[
			disabled,
			idFormat,
			inactiveTeeth,
			onSurfaceClick,
			onSurfacesChange,
			toggle,
			toothById,
		],
	);

	// With a menu, a click reports the current surfaces instead of toggling.
	const openMenu = useCallback(
		(toothId: string, surface: ToothSurface) => {
			const tooth = toothById.get(toothId);
			if (tooth) {
				onSurfaceClick?.(
					tooth,
					surface,
					formatPublicSurfaces(current, idFormat),
				);
			}
			onMenuOpen();
		},
		[current, idFormat, onMenuOpen, onSurfaceClick, toothById],
	);
	const menu = useChartSurfaceMenu({
		...menuOptions,
		renderSurfaceMenu,
		toothById,
		onOpen: openMenu,
	});

	return {
		isSurfaceSelected,
		inactiveTeeth,
		menu: Boolean(renderSurfaceMenu),
		activate: renderSurfaceMenu ? menu.open : activate,
		openMenu: menu.openMenu,
		isMenuOpen: menu.isOpen,
		menuNode: menu.node,
	};
}

interface TooltipContentOptions {
	tooth?: ToothDefinition;
	renderTooltip: OdontogramProps["renderTooltip"];
	content: NonNullable<OdontogramProps["tooltip"]>["content"];
	selected: boolean;
	condition?: ToothConditionGroup;
	state: ToothState;
	/** The hovered surface; `selected` then refers to it. */
	surface?: TooltipSurfaceDetails;
	findings: TooltipFindings;
	notation: Notation;
	detail: (toothId: string) => ToothDetail;
}

/**
 * Tooltip content: `renderTooltip` with the Vue slot payload, built on each
 * render so `selected` follows the selection; else `tooltip.content`.
 */
function getTooltipContent({
	tooth,
	renderTooltip,
	content,
	selected,
	condition,
	state,
	surface,
	findings,
	notation,
	detail,
}: TooltipContentOptions): TooltipContentOptions["content"] {
	if (!(renderTooltip && tooth)) {
		return content;
	}
	const props: OdontogramTooltipRenderProps = {
		tooth,
		detail: detail(tooth.id),
		selected: surface?.selected ?? selected,
		condition,
		state,
		findings: findings.findings,
		number: formatToothNumber(tooth.id, notation),
		surface: surface?.surface,
		surfaceName: surface?.name,
		surfaceSummary: findings.surfaceSummary,
	};
	return () => renderTooltip(props);
}

export const Odontogram: FC<OdontogramProps> = ({
	value,
	defaultValue,
	defaultSelected = [],
	singleSelect = false,
	onChange,
	className = "",
	theme = "light",
	colors = {},
	selectedColor,
	hoverColor,
	notation = "FDI",
	tooltip = {
		margin: 10,
		placement: "top",
	},
	showTooltip = true,
	renderTooltip,
	showNumbers = false,
	renderNumber,
	renderOverlay,
	labels,
	showHalf = "full",
	name,
	dentition = "permanent",
	teeth,
	maxTeeth,
	teethConditions,
	conditions,
	toothStates,
	findings,
	findingCatalog = ntsPeruFindingCatalog,
	showFindingBoxes = false,
	showSurfaces = false,
	showSurfaceLetters = false,
	surfaceShape = "square",
	surfaces,
	defaultSurfaces,
	onSurfacesChange,
	onSurfaceClick,
	renderSurfaceMenu,
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
	const fdiToothStates = useMemo(
		() => normalizeToothStates(toothStates),
		[toothStates],
	);
	const stateOf = useCallback(
		(id: string) => resolveToothState(fdiToothStates, id),
		[fdiToothStates],
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

	/**
	 * Model and state
	 */
	const resolvedLabels = useMemo(
		() => resolveOdontogramLabels(labels),
		[labels],
	);
	const fdiFindings = useMemo(() => normalizeFindings(findings), [findings]);
	const {
		viewBox,
		quadrants,
		anchors,
		numberLabels,
		conditionByTooth,
		stateMarks,
		legendStates,
		surfaceDiagrams,
		renderedFindings,
		findingBoxes,
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
		showSurfaces,
		surfaceShape,
		findings: fdiFindings,
		findingCatalog,
		showFindingBoxes,
	});
	const { descriptionOf, legendFindings, tooltipFindingsOf } = useChartFindings(
		{
			findings: fdiFindings,
			catalog: findingCatalog,
			renderedFindings,
			findingsByTooth,
			findingIssues,
			labels: resolvedLabels,
		},
	);

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

	const spokenNumber = useCallback(
		(id: string) => formatToothNumber(id, notation, "text"),
		[notation],
	);

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

	/**
	 * Keyboard: a single tab stop (roving tabindex) on the last focused
	 * tooth, else the first selected visible tooth, else the first tooth.
	 */
	const [activeToothId, setActiveToothId] = useState<string>();
	const focusableToothId = useMemo(() => {
		const visible = new Set(anchors.map(({ toothId }) => toothId));
		if (activeToothId && visible.has(activeToothId)) {
			return activeToothId;
		}
		return selected.find((id) => visible.has(id)) ?? anchors[0]?.toothId;
	}, [activeToothId, anchors, selected]);

	const handleFocus = useCallback(
		(id: string, event: ToothInteractionEvent) => {
			setActiveToothId(id);
			if (showTooltip) {
				showToothTooltip(id, event);
			}
		},
		[showTooltip, showToothTooltip],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<SVGGElement>, id: string) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				toggle(id);
				return;
			}
			if (!toothNavigationKeys.has(event.key)) {
				return;
			}

			event.preventDefault();
			const target = findNavigationTarget(
				anchors,
				id,
				event.key as ToothNavigationKey,
			);
			if (target) {
				setActiveToothId(target);
				svgRef.current
					?.querySelector<SVGGElement>(`[data-tooth-id="${target}"]`)
					?.focus();
			}
		},
		[anchors, svgRef, toggle],
	);

	/**
	 * Tooltip content: `renderTooltip` gets the Vue slot payload, built when
	 * shown so `selected` follows the selection.
	 */
	const toothById = useMemo(
		() =>
			new Map(
				quadrants.flatMap(({ teeth: drawn }) =>
					drawn.map(({ tooth }) => [tooth.id, tooth] as const),
				),
			),
		[quadrants],
	);
	const diagramTeeth = useMemo(
		() => new Set(surfaceDiagrams.map(({ toothId }) => toothId)),
		[surfaceDiagrams],
	);
	const {
		isSurfaceSelected,
		inactiveTeeth: inactiveSurfaceTeeth,
		activate: handleSurfaceActivate,
		menu: hasSurfaceMenu,
		openMenu,
		isMenuOpen,
		menuNode,
	} = useChartSurfaces({
		surfaces,
		defaultSurfaces,
		idFormat,
		disabled: isDisabled,
		anchors,
		stateOf,
		toothById,
		onSurfacesChange,
		onSurfaceClick,
		renderSurfaceMenu,
		onMenuOpen: hideToothTooltip,
		diagramTeeth,
		findings: fdiFindings,
		catalog: findingCatalog,
		labels: resolvedLabels,
		spokenNumber,
	});
	const tooltipToothId = tooltipState.toothId ?? "";
	const tooltipCondition = conditionByTooth.get(tooltipToothId);
	const tooltipToothState = stateOf(tooltipToothId);
	const tooltipFindings = tooltipFindingsOf(
		tooltipToothId,
		tooltipState.surface,
	);
	const tooltipSurfaceDetails = getSurfaceTooltipDetails(
		tooltipToothId,
		tooltipState.surface,
		notation,
		resolvedLabels,
		isSurfaceSelected,
		tooltipFindings.findings,
	);
	const tooltipContent = getTooltipContent({
		tooth: toothById.get(tooltipToothId),
		renderTooltip,
		content: tooltip.content,
		selected: isSelected(tooltipToothId),
		condition: tooltipCondition,
		state: tooltipToothState,
		surface: tooltipSurfaceDetails,
		findings: tooltipFindings,
		notation,
		detail: toToothDetail,
	});

	const showSurfaceTooltip = useCallback(
		(toothId: string, surface: ToothSurface, event: TooltipTargetEvent) =>
			showToothTooltip(toothId, event, surface),
		[showToothTooltip],
	);
	// Teeth and surfaces follow the same `showTooltip` switch.
	const tooltipHandlers = showTooltip
		? {
				tooth: {
					onShowTooltip: showToothTooltip,
					onHideTooltip: hideToothTooltip,
				},
				surface: { onEnter: showSurfaceTooltip, onLeave: hideToothTooltip },
			}
		: { tooth: {}, surface: {} };

	/**
	 * Colors
	 */
	const finalColors = getThemeVars({
		theme,
		colors,
		selectedColor,
		hoverColor,
	});

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
			// `group`, not `listbox`: the root also holds surface checkboxes, the legend and the menu.
			// biome-ignore lint/a11y/useSemanticElements: a <fieldset> root would change the markup consumers style.
			role="group"
			aria-label={resolvedLabels.odontogram}
			data-read-only={isDisabled ? "true" : "false"}
			// The teeth hold the single tab stop, not the container.
			tabIndex={isDisabled ? -1 : undefined}
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
				<title>{resolvedLabels.chartTitles[dentition]}</title>

				{/* The listbox holds only the tooth options (ARIA allows nothing else in it). */}
				<g
					role={isDisabled ? undefined : "listbox"}
					aria-multiselectable={isDisabled ? undefined : !singleSelect}
					aria-label={isDisabled ? undefined : resolvedLabels.odontogram}
				>
					<ToothLayer
						quadrants={quadrants}
						notation={notation}
						toothLabel={resolvedLabels.tooth}
						stateOf={stateOf}
						stateLabels={resolvedLabels.states}
						descriptionOf={descriptionOf}
						focusableToothId={isDisabled ? undefined : focusableToothId}
						disabled={isDisabled}
						isSelected={isSelected}
						conditionByTooth={conditionByTooth}
						onSelect={toggle}
						onKeyDown={handleKeyDown}
						{...tooltipHandlers.tooth}
						onFocusTooth={handleFocus}
					/>
				</g>

				<StateMarkLayer marks={stateMarks} />

				<SurfaceDiagrams
					diagrams={surfaceDiagrams}
					anchors={anchors}
					isSelected={isSurfaceSelected}
					disabled={isDisabled}
					inactiveTeeth={inactiveSurfaceTeeth}
					labels={resolvedLabels}
					spokenNumber={spokenNumber}
					onActivate={handleSurfaceActivate}
					menu={hasSurfaceMenu}
					openMenu={openMenu}
					{...tooltipHandlers.surface}
				/>

				<FindingLayer findings={renderedFindings} boxes={findingBoxes} />

				<SurfaceLetters
					show={showSurfaceLetters}
					diagrams={surfaceDiagrams}
					letters={resolvedLabels.surfaceLetters}
				/>

				<NumberLayer
					labels={numberLabels}
					notation={notation}
					isSelected={isSelected}
					renderNumber={renderNumber}
				/>

				<OverlayLayer
					renderOverlay={renderOverlay}
					anchors={anchors}
					viewBox={viewBox}
					dentition={dentition}
					layout={resolvedLayout}
					surfaceDiagrams={surfaceDiagrams}
				/>
			</svg>

			{showTooltip && (
				<OdontogramTooltip
					// The tooltip gives way to an open surface menu.
					active={tooltipState.active && !isMenuOpen}
					position={tooltipState.position}
					payload={tooltipState.payload}
					content={tooltipContent}
					condition={tooltipCondition}
					state={tooltipToothState}
					surface={tooltipSurfaceDetails}
					findings={tooltipFindings.findings}
					surfaceSummary={tooltipFindings.surfaceSummary}
					labels={resolvedLabels}
				/>
			)}

			{menuNode}

			{showLabels && (
				<ConditionLabels
					conditions={conditionGroups}
					states={legendStates.map((state) => ({
						state,
						label: resolvedLabels.states[state],
					}))}
					findings={legendFindings}
					ariaLabel={resolvedLabels.legend}
				/>
			)}
		</div>
	);
};

export default Odontogram;

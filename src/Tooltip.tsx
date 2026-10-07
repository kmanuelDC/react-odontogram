import {
	type OdontogramLabels,
	type ToothState,
	type ToothSurface,
	type ToothType,
	defaultOdontogramLabels,
} from "@kmanueldc/odontogram-core";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type {
	Placement,
	TooltipContentRenderer,
	TooltipSurfaceSummary,
	ToothConditionGroup,
	ToothDetail,
} from "./type";

/** What the default content shows for a surface. */
export interface TooltipSurfaceDetails {
	surface: ToothSurface;
	/** Tooth number in the chart's notation. */
	number: string;
	/** Clinical name, e.g. "Palatal". */
	name: string;
	/** What the surface is, from `labels.surfaceDescriptions`. */
	description?: string;
	selected: boolean;
	/** Findings recorded on the surface. */
	findings: readonly string[];
}

/** Default content of the tooltip of a surface. */
function SurfaceLines({
	surface,
	state,
	labels,
}: {
	surface: TooltipSurfaceDetails;
	state: ToothState;
	labels: OdontogramLabels;
}) {
	return (
		<>
			<div>
				{labels.tooth}: {surface.number}
			</div>
			<div>
				{labels.surface}: {surface.name}
			</div>
			{surface.description && (
				<div className="odontogram-tooltip__description">
					{surface.description}
				</div>
			)}
			{state !== "present" && (
				<div>
					{labels.state}: {labels.states[state]}
				</div>
			)}
			{surface.findings.length > 0 && (
				<div>
					{labels.findings}: {surface.findings.join(", ")}
				</div>
			)}
			<div>
				{labels.selected}: {surface.selected ? labels.yes : labels.no}
			</div>
		</>
	);
}

/** Findings lines of the tooth tooltip: whole-tooth findings, then per surface. */
function ToothFindingLines({
	findings,
	summary,
	labels,
}: {
	findings: readonly string[];
	summary: readonly TooltipSurfaceSummary[];
	labels: OdontogramLabels;
}) {
	return (
		<>
			{findings.length > 0 && (
				<div>
					{labels.findings}: {findings.join(", ")}
				</div>
			)}
			{summary.length > 0 && <div>{labels.surfaceSummary}:</div>}
			{summary.map((line) => (
				<div
					key={line.surface}
					className="odontogram-tooltip__summary"
					data-summary-surface={line.surface}
				>
					<span className="odontogram-tooltip__letter">{line.letter}</span>{" "}
					{line.name}: {line.findings.join(", ")}
				</div>
			))}
		</>
	);
}

const ARROW_OFFSET = 12;
const VIEWPORT_PADDING = 8;

export interface OdontogramTooltipProps {
	active: boolean;
	payload?: ToothDetail;
	position?: {
		x: number;
		placement: Placement;
		margin: number;
		anchorRect: {
			top: number;
			right: number;
			bottom: number;
			left: number;
		};
	};
	content?: ReactNode | TooltipContentRenderer;
	/** Condition of the tooth, shown by the default content. */
	condition?: ToothConditionGroup;
	/** Presence status of the tooth; shown by the default content unless `present`. */
	state?: ToothState;
	/** The hovered or focused surface; the default content then describes it. */
	surface?: TooltipSurfaceDetails;
	/** Whole-tooth findings, in the tooltip of a tooth. */
	findings?: readonly string[];
	/** Findings of each surface, in the tooltip of a tooth. */
	surfaceSummary?: readonly TooltipSurfaceSummary[];
	/** Texts of the default content. */
	labels?: OdontogramLabels;
}

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

const prefersBottom = (placement: Placement) => placement.startsWith("bottom");

const getContent = (
	content: ReactNode | TooltipContentRenderer | undefined,
	payload?: ToothDetail,
) => {
	if (!content) {
		return undefined;
	}

	return typeof content === "function" ? content(payload) : content;
};

export function OdontogramTooltip({
	active,
	payload,
	position,
	content,
	condition,
	state = "present",
	surface,
	findings = [],
	surfaceSummary = [],
	labels = defaultOdontogramLabels,
}: OdontogramTooltipProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [coords, setCoords] = useState<{
		left: number;
		top: number;
		isBottomPlacement: boolean;
	} | null>(null);

	useEffect(() => {
		if (!(active && ref.current && position)) {
			return;
		}

		const tooltipBox = ref.current.getBoundingClientRect();
		const { x, placement, margin, anchorRect } = position;

		const maxLeft = Math.max(
			VIEWPORT_PADDING,
			window.innerWidth - tooltipBox.width - VIEWPORT_PADDING,
		);
		const left = clamp(x - tooltipBox.width / 2, VIEWPORT_PADDING, maxLeft);

		const topWhenAbove =
			anchorRect.top - tooltipBox.height - margin - ARROW_OFFSET;
		const topWhenBelow = anchorRect.bottom + margin + ARROW_OFFSET;

		const shouldStartBelow = prefersBottom(placement);
		let isBottomPlacement = shouldStartBelow;
		let top = shouldStartBelow ? topWhenBelow : topWhenAbove;

		if (!isBottomPlacement && top < VIEWPORT_PADDING) {
			isBottomPlacement = true;
			top = topWhenBelow;
		}

		const maxTop = Math.max(
			VIEWPORT_PADDING,
			window.innerHeight - tooltipBox.height - VIEWPORT_PADDING,
		);

		if (isBottomPlacement && top > maxTop) {
			isBottomPlacement = false;
			top = topWhenAbove;
		}

		top = clamp(top, VIEWPORT_PADDING, maxTop);

		setCoords({ left, top, isBottomPlacement });
	}, [active, position]);

	if (!(active && payload)) {
		return null;
	}

	return (
		<div
			ref={ref}
			className="odontogram-tooltip"
			role="tooltip"
			style={{
				position: "fixed",
				pointerEvents: "none",
				background: "var(--odontogram-tooltip-bg, rgba(0,0,0,0.85))",
				color: "var(--odontogram-tooltip-fg, #fff)",
				padding: "6px 10px",
				borderRadius: "6px",
				fontSize: "12px",
				lineHeight: 1.3,
				whiteSpace: "nowrap",
				zIndex: 1000,
				left: coords?.left ?? -9999,
				top: coords?.top ?? -9999,
				opacity: coords ? 1 : 0,
				transition: "opacity 0.15s ease",
			}}
		>
			{getContent(content, payload) ??
				(surface ? (
					<SurfaceLines surface={surface} state={state} labels={labels} />
				) : (
					<>
						<div>
							{labels.tooth}: {payload.notations.fdi}
						</div>
						<div>
							{labels.type}:{" "}
							{labels.toothTypes[payload.type as ToothType] ?? payload.type}
						</div>
						<div>
							Universal: {payload.notations.universal}, Palmer:{" "}
							{payload.notations.palmer}
						</div>
						{condition?.label && (
							<div>
								{labels.condition}: {condition.label}
							</div>
						)}
						{state !== "present" && (
							<div>
								{labels.state}: {labels.states[state]}
							</div>
						)}
						<ToothFindingLines
							findings={findings}
							summary={surfaceSummary}
							labels={labels}
						/>
					</>
				))}
			<div
				className="odontogram-tooltip-arrow"
				style={{
					position: "absolute",
					left: "50%",
					transform: "translateX(-50%)",
					width: 0,
					height: 0,
					borderLeft: "6px solid transparent",
					borderRight: "6px solid transparent",
					...(coords?.isBottomPlacement
						? {
								top: "-6px",
								borderBottom:
									"6px solid var(--odontogram-tooltip-bg, rgba(0, 0, 0, 0.85))",
							}
						: {
								bottom: "-6px",
								borderTop:
									"6px solid var(--odontogram-tooltip-bg, rgba(0, 0, 0, 0.85))",
							}),
				}}
			/>
		</div>
	);
}

import "./styles.css";
import {
	type FindingCatalog,
	type OdontogramFinding,
	type OdontogramLabelsInput,
	type SurfaceShapeKind,
	type ToothNotation,
	type ToothSurface,
	buildSurfaceDiagram,
	formatToothNumber,
	getSurfaceAxes,
	getToothRecord,
	layoutToothSurfaceFindings,
	ntsPeruFindingCatalog,
	resolveOdontogramLabels,
	surfaceCenter,
	toothSurfaces,
} from "@kmanueldc/odontogram-core";
import { useMemo, useState } from "react";
import { FindingPrimitives, findingClassName } from "./FindingLayer";
import { normalizeFindings, toFdiId } from "./compat";

export interface SurfaceGuideProps {
	/** Tooth to explain, as an ID in either format. */
	toothId: string;
	/** Findings of the chart; the guide draws and lists this tooth's surface findings. */
	findings?: OdontogramFinding[];
	/** `ntsPeruFindingCatalog` by default. */
	findingCatalog?: FindingCatalog;
	/** Surfaces shown as selected, e.g. `surfaces[toothId]` of the chart. */
	selected?: readonly ToothSurface[];
	/** Highlighted surface; hover and focus win while they last. */
	active?: ToothSurface;
	/** The highlighted surface changed by hover or focus; `undefined` when it ends. */
	onActiveChange?: (surface: ToothSurface | undefined) => void;
	/** A surface of the diagram or the list was clicked. */
	onSurfaceClick?: (surface: ToothSurface) => void;
	labels?: OdontogramLabelsInput;
	notation?: ToothNotation;
	disabled?: boolean;
	/** Shape of the diagram, like the chart's `surfaceShape`. */
	shape?: SurfaceShapeKind;
	/** Shows the list of surfaces next to the diagram; false keeps only the diagram. */
	showList?: boolean;
	className?: string;
}

/** Diagram side and center in the guide's `0 0 100 100` viewBox. */
const size = 84;
const center = { x: 50, y: 50 };
const noSurfaces: readonly ToothSurface[] = [];

/**
 * A large five-surface diagram of one tooth with the name, definition and
 * findings of each surface: a visual guide next to the chart.
 */
export function SurfaceGuide({
	toothId: toothIdInput,
	findings,
	findingCatalog = ntsPeruFindingCatalog,
	selected = noSurfaces,
	active,
	onActiveChange,
	onSurfaceClick,
	labels,
	notation = "FDI",
	disabled = false,
	shape = "square",
	showList = true,
	className,
}: SurfaceGuideProps) {
	const toothId = toFdiId(toothIdInput);
	const resolvedLabels = useMemo(
		() => resolveOdontogramLabels(labels),
		[labels],
	);
	const fdiFindings = useMemo(() => normalizeFindings(findings), [findings]);

	/** Same orientation as the horizontal chart: vestibular out, mesial toward the midline. */
	const diagram = useMemo(
		() =>
			buildSurfaceDiagram(
				toothId,
				center,
				getSurfaceAxes(toothId),
				size,
				1.2,
				shape,
			),
		[toothId, shape],
	);
	const drawnFindings = useMemo(
		() => layoutToothSurfaceFindings(fdiFindings, findingCatalog, diagram),
		[fdiFindings, findingCatalog, diagram],
	);
	const record = useMemo(
		() => getToothRecord(toothId, fdiFindings, findingCatalog),
		[toothId, fdiFindings, findingCatalog],
	);

	const [localActive, setLocalActive] = useState<ToothSurface>();
	const activeSurface = localActive ?? active;
	const setActive = (surface: ToothSurface | undefined) => {
		setLocalActive(surface);
		onActiveChange?.(surface);
	};
	const select = (surface: ToothSurface) => {
		if (!disabled) {
			onSurfaceClick?.(surface);
		}
	};

	const shapes = diagram.surfaces.map((item) => ({
		...item,
		center: surfaceCenter(item),
		letter: resolvedLabels.surfaceLetters[item.name],
	}));
	const activeShape = shapes.find(({ surface }) => surface === activeSurface);

	/** Recorded findings of a surface, e.g. "Caries (Planned)". */
	const findingsOf = (surface: ToothSurface) =>
		record.surfaces[surface].map(({ finding, definition }) => {
			const name = definition?.name ?? finding.code;
			const status = finding.status ?? "existing";
			return status === "existing"
				? name
				: `${name} (${resolvedLabels.findingStatuses[status]})`;
		});

	const number = formatToothNumber(toothId, notation);
	const spokenNumber = formatToothNumber(toothId, notation, "text");

	return (
		<section
			className={["odontogram-surface-guide", className]
				.filter(Boolean)
				.join(" ")}
			aria-label={`${resolvedLabels.surfaceGuide}, ${resolvedLabels.tooth} ${spokenNumber}`}
			data-tooth-id={toothId}
		>
			<p className="odontogram-surface-guide__title">
				{resolvedLabels.tooth} {number}
			</p>

			<svg
				className="odontogram-surface-guide__diagram"
				viewBox="0 0 100 100"
				fill="none"
				aria-hidden="true"
				onMouseLeave={() => setActive(undefined)}
			>
				{shapes.map((item) => (
					// biome-ignore lint/a11y/useKeyWithClickEvents: the list buttons give keyboard access to every surface.
					<path
						key={item.surface}
						className={`odontogram-surface${selected.includes(item.surface) ? " odontogram-surface--selected" : ""}`}
						d={item.d}
						strokeWidth={diagram.strokeWidth}
						data-guide-surface={item.surface}
						onMouseEnter={() => setActive(item.surface)}
						onClick={() => select(item.surface)}
					/>
				))}

				<g className="odontogram-surface-guide__findings">
					{drawnFindings.map((finding) => (
						<g
							key={finding.key}
							className={findingClassName(finding)}
							style={finding.color ? { color: finding.color } : undefined}
							strokeWidth={finding.strokeWidth}
							data-finding={finding.code}
						>
							<FindingPrimitives primitives={finding.primitives} />
						</g>
					))}
				</g>

				{activeShape && (
					<path
						className="odontogram-surface-guide__highlight"
						d={activeShape.d}
						data-highlight={activeShape.surface}
					/>
				)}

				{shapes.map((item) => (
					<text
						key={`letter-${item.surface}`}
						className={`odontogram-surface-guide__letter${item.surface === activeSurface ? " odontogram-surface-guide__letter--active" : ""}`}
						x={item.center.x}
						y={item.center.y}
						textAnchor="middle"
						dominantBaseline="central"
					>
						{item.letter}
					</text>
				))}
			</svg>

			{showList && (
				<ul className="odontogram-surface-guide__list">
					{toothSurfaces.map((surface) => {
						const item = shapes.find((shape) => shape.surface === surface);
						if (!item) {
							return null;
						}
						const surfaceFindings = findingsOf(surface);
						return (
							<li key={surface}>
								<button
									type="button"
									className={`odontogram-surface-guide__item${surface === activeSurface ? " odontogram-surface-guide__item--active" : ""}`}
									aria-pressed={selected.includes(surface)}
									disabled={disabled}
									data-guide-item={surface}
									onMouseEnter={() => setActive(surface)}
									onMouseLeave={() => setActive(undefined)}
									onFocus={() => setActive(surface)}
									onBlur={() => setActive(undefined)}
									onClick={() => select(surface)}
								>
									<span
										className="odontogram-surface-guide__badge"
										aria-hidden="true"
									>
										{item.letter}
									</span>
									<span className="odontogram-surface-guide__text">
										<strong>{resolvedLabels.surfaceNames[item.name]}</strong>
										<span>{resolvedLabels.surfaceDescriptions[item.name]}</span>
										{surfaceFindings.length > 0 && (
											<span className="odontogram-surface-guide__findings-text">
												{resolvedLabels.findings}: {surfaceFindings.join(", ")}
											</span>
										)}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

export default SurfaceGuide;

import "./styles.css";
import {
	type FindingCatalog,
	type FindingStatus,
	type OdontogramFinding,
	type OdontogramLabels,
	type OdontogramLabelsInput,
	type OdontogramToothStates,
	type SurfaceFindingRemoval,
	type SurfaceShapeKind,
	type ToothFindingEntry,
	type ToothFindingInput,
	type ToothNotation,
	type ToothSurface,
	absentToothStates,
	findingStatuses,
	formatToothNumber,
	getFindingScope,
	getSurfaceName,
	getToothRecord,
	getToothType,
	ntsPeruFindingCatalog,
	resolveOdontogramLabels,
	resolveToothState,
	toothSurfaces,
} from "@kmanueldc/odontogram-core";
import { type FormEvent, useMemo, useState } from "react";
import { SurfaceGuide } from "./SurfaceGuide";
import { normalizeFindings, normalizeToothStates, toFdiId } from "./compat";

export interface ToothInspectorProps {
	/** The tooth, as an ID in either format. */
	toothId: string;
	findings?: OdontogramFinding[];
	/** `ntsPeruFindingCatalog` by default. */
	findingCatalog?: FindingCatalog;
	toothStates?: OdontogramToothStates;
	labels?: OdontogramLabelsInput;
	notation?: ToothNotation;
	/** Shape of the surface diagram, like the chart's `surfaceShape`. */
	shape?: SurfaceShapeKind;
	/** Read-only panel: no adding or removing. */
	disabled?: boolean;
	/**
	 * Surfaces chosen for the next surface finding, to choose them from the
	 * chart too (e.g. `surfaces[toothId]` of the chart). Without it the panel
	 * keeps its own choice, cleared when the tooth changes.
	 */
	selectedSurfaces?: ToothSurface[];
	/** The surfaces chosen for the next surface finding changed. */
	onSelectedSurfacesChange?: (surfaces: ToothSurface[]) => void;
	/** A finding to record; pass it to `addFinding` to update the list. */
	onAddFinding?: (input: ToothFindingInput) => void;
	/** A finding to remove; pass it to `removeSurfaceFinding` to update the list. */
	onRemoveFinding?: (removal: SurfaceFindingRemoval) => void;
	className?: string;
}

/** Name of a recorded finding, with its status when not `existing`. */
function describe(
	{ finding, definition }: ToothFindingEntry,
	text: OdontogramLabels,
): string {
	const status = finding.status ?? "existing";
	const name = definition?.name ?? finding.code;
	return status === "existing"
		? name
		: `${name} (${text.findingStatuses[status]})`;
}

/** Catalog codes the form offers: on surfaces, or on the whole tooth. */
function getFormCodes(catalog: FindingCatalog) {
	const all = Object.entries(catalog).map(([code, definition]) => ({
		code,
		name: definition.name,
		scope: getFindingScope(definition.symbol),
	}));
	return {
		surface: all.filter(({ scope }) => scope === "surface"),
		tooth: all.filter(({ scope }) => scope === "tooth"),
	};
}

interface RemoveButtonProps {
	label: string;
	onClick: () => void;
}

function RemoveButton({ label, onClick }: RemoveButtonProps) {
	return (
		<button
			type="button"
			className="odontogram-inspector__remove"
			aria-label={label}
			onClick={onClick}
		>
			×
		</button>
	);
}

/**
 * Panel with everything recorded on one tooth: its surfaces (drawn with the
 * surface guide), its findings by surface and on the whole tooth, and a form
 * to add new ones. It holds no clinical rules and saves nothing: it reports
 * `onAddFinding` and `onRemoveFinding`, and the app decides what to record.
 */
export function ToothInspector({
	toothId: toothIdInput,
	findings,
	findingCatalog = ntsPeruFindingCatalog,
	toothStates,
	labels,
	notation = "FDI",
	shape = "square",
	disabled = false,
	selectedSurfaces,
	onSelectedSurfacesChange,
	onAddFinding,
	onRemoveFinding,
	className,
}: ToothInspectorProps) {
	const toothId = toFdiId(toothIdInput);
	const text = useMemo(() => resolveOdontogramLabels(labels), [labels]);
	const fdiFindings = useMemo(() => normalizeFindings(findings), [findings]);
	const state = resolveToothState(normalizeToothStates(toothStates), toothId);
	/** Missing and extracted teeth have no surfaces to record on. */
	const absent = absentToothStates.has(state);
	const toothType = getToothType(toothId);
	const record = useMemo(
		() => getToothRecord(toothId, fdiFindings, findingCatalog),
		[toothId, fdiFindings, findingCatalog],
	);
	const codes = useMemo(() => getFormCodes(findingCatalog), [findingCatalog]);

	const [code, setCode] = useState(
		() => codes.surface[0]?.code ?? codes.tooth[0]?.code ?? "",
	);
	const [status, setStatus] = useState<FindingStatus>("existing");
	// The panel's own choice belongs to one tooth: a new tooth starts empty.
	const [ownChoice, setOwnChoice] = useState<{
		toothId: string;
		surfaces: ToothSurface[];
	}>({ toothId, surfaces: [] });
	const chosen =
		selectedSurfaces ??
		(ownChoice.toothId === toothId ? ownChoice.surfaces : []);
	const setChosen = (surfaces: ToothSurface[]) => {
		setOwnChoice({ toothId, surfaces });
		onSelectedSurfacesChange?.(surfaces);
	};

	const isSurfaceCode = codes.surface.some((option) => option.code === code);
	const canAdd =
		!disabled &&
		Boolean(code) &&
		(!isSurfaceCode || (chosen.length > 0 && !absent));

	const toggleChosen = (surface: ToothSurface) => {
		setChosen(
			chosen.includes(surface)
				? chosen.filter((item) => item !== surface)
				: toothSurfaces.filter(
						(item) => item === surface || chosen.includes(item),
					),
		);
	};

	const add = (event: FormEvent) => {
		event.preventDefault();
		if (!canAdd) {
			return;
		}
		onAddFinding?.({
			code,
			toothId,
			...(isSurfaceCode ? { surfaces: [...chosen] } : {}),
			...(status === "existing" ? {} : { status }),
		});
		setChosen([]);
	};

	const remove = (entry: ToothFindingEntry, surface?: ToothSurface) => {
		if (!disabled) {
			onRemoveFinding?.({
				index: entry.index,
				toothId,
				...(surface ? { surface } : {}),
			});
		}
	};

	/** Whole-tooth findings can be removed; spans and pairs only through their own teeth. */
	const removable = ({ scope, finding }: ToothFindingEntry) =>
		(scope === "tooth" || scope === "unknown") &&
		finding.teeth.includes(toothId);

	const surfaceGroups = toothSurfaces
		.filter((surface) => record.surfaces[surface].length > 0)
		.map((surface) => {
			const name = getSurfaceName(surface, toothId);
			return {
				surface,
				name: text.surfaceNames[name],
				letter: text.surfaceLetters[name],
				entries: record.surfaces[surface],
			};
		});

	return (
		<section
			className={["odontogram-inspector", className].filter(Boolean).join(" ")}
			aria-label={`${text.inspector.title}, ${text.tooth} ${formatToothNumber(toothId, notation, "text")}`}
			data-tooth-id={toothId}
		>
			<div className="odontogram-inspector__header">
				<strong className="odontogram-inspector__title">
					{text.tooth} {formatToothNumber(toothId, notation)}
				</strong>
				<span className="odontogram-inspector__type">
					{text.toothTypes[toothType] ?? toothType}
				</span>
				{state !== "present" && (
					<span className="odontogram-inspector__state" data-state={state}>
						{text.states[state]}
					</span>
				)}
			</div>

			<div className="odontogram-inspector__body">
				<SurfaceGuide
					className="odontogram-inspector__guide"
					toothId={toothId}
					findings={fdiFindings}
					findingCatalog={findingCatalog}
					selected={chosen}
					labels={labels}
					notation={notation}
					shape={shape}
					disabled={disabled || absent}
					showList={false}
					onSurfaceClick={toggleChosen}
				/>

				<div className="odontogram-inspector__details">
					<div className="odontogram-inspector__section">
						<p className="odontogram-inspector__heading">
							{text.inspector.surfaceFindings}
						</p>
						{surfaceGroups.length > 0 ? (
							<ul className="odontogram-inspector__list">
								{surfaceGroups.map((group) => (
									<li
										key={group.surface}
										data-inspector-surface={group.surface}
									>
										<span
											className="odontogram-inspector__badge"
											aria-hidden="true"
										>
											{group.letter}
										</span>
										<span className="odontogram-inspector__surface-name">
											{group.name}
										</span>
										<span className="odontogram-inspector__entries">
											{group.entries.map((entry) => (
												<span
													key={entry.index}
													className="odontogram-inspector__entry"
												>
													{describe(entry, text)}
													{!disabled && (
														<RemoveButton
															label={`${text.inspector.remove}: ${describe(entry, text)}, ${group.name}`}
															onClick={() => remove(entry, group.surface)}
														/>
													)}
												</span>
											))}
										</span>
									</li>
								))}
							</ul>
						) : (
							<p className="odontogram-inspector__empty">
								{text.inspector.noFindings}
							</p>
						)}
					</div>

					<div className="odontogram-inspector__section">
						<p className="odontogram-inspector__heading">
							{text.inspector.toothFindings}
						</p>
						{record.tooth.length > 0 ? (
							<ul className="odontogram-inspector__list">
								{record.tooth.map((entry) => (
									<li key={entry.index} data-inspector-tooth-finding="">
										<span className="odontogram-inspector__entry">
											{describe(entry, text)}
											{!disabled && removable(entry) && (
												<RemoveButton
													label={`${text.inspector.remove}: ${describe(entry, text)}`}
													onClick={() => remove(entry)}
												/>
											)}
										</span>
									</li>
								))}
							</ul>
						) : (
							<p className="odontogram-inspector__empty">
								{text.inspector.noFindings}
							</p>
						)}
					</div>

					{!disabled && (
						<form
							className="odontogram-inspector__section odontogram-inspector__form"
							onSubmit={add}
						>
							<p className="odontogram-inspector__heading">
								{text.inspector.addFinding}
							</p>
							<label className="odontogram-inspector__field">
								{text.inspector.finding}
								<select
									name="finding"
									value={code}
									onChange={(event) => setCode(event.target.value)}
								>
									{codes.surface.length > 0 && (
										<optgroup label={text.inspector.onSurfaces}>
											{codes.surface.map((option) => (
												<option key={option.code} value={option.code}>
													{option.name}
												</option>
											))}
										</optgroup>
									)}
									{codes.tooth.length > 0 && (
										<optgroup label={text.inspector.onTooth}>
											{codes.tooth.map((option) => (
												<option key={option.code} value={option.code}>
													{option.name}
												</option>
											))}
										</optgroup>
									)}
								</select>
							</label>
							{isSurfaceCode && (
								<p
									className="odontogram-inspector__hint"
									data-inspector-chosen=""
								>
									{chosen.length > 0
										? chosen
												.map(
													(surface) =>
														text.surfaceNames[getSurfaceName(surface, toothId)],
												)
												.join(", ")
										: text.inspector.chooseSurfaces}
								</p>
							)}
							<fieldset className="odontogram-inspector__status">
								<legend>{text.inspector.status}</legend>
								{findingStatuses.map((option) => (
									<label key={option}>
										<input
											type="radio"
											name="status"
											value={option}
											checked={status === option}
											onChange={() => setStatus(option)}
										/>{" "}
										{text.findingStatuses[option]}
									</label>
								))}
							</fieldset>
							<button
								type="submit"
								className="odontogram-inspector__add"
								disabled={!canAdd}
							>
								{text.inspector.add}
							</button>
						</form>
					)}
				</div>
			</div>
		</section>
	);
}

export default ToothInspector;

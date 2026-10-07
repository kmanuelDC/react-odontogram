import {
	type OdontogramLabels,
	type SurfaceDiagram,
	type ToothAnchor,
	type ToothNavigationKey,
	type ToothSurface,
	findNavigationTarget,
	surfaceCenter,
	toothNavigationKeys,
	toothSurfaces,
} from "@kmanueldc/odontogram-core";
import {
	type FocusEvent,
	type KeyboardEvent,
	type MouseEvent,
	useRef,
	useState,
} from "react";

type SurfaceEvent = MouseEvent<SVGPathElement> | FocusEvent<SVGPathElement>;

export interface SurfaceKey {
	toothId: string;
	surface: ToothSurface;
}

export interface SurfaceDiagramsProps {
	diagrams: readonly SurfaceDiagram[];
	/** Anchors of the visible teeth, for left/right navigation on screen. */
	anchors: readonly ToothAnchor[];
	isSelected: (toothId: string, surface: ToothSurface) => boolean;
	disabled: boolean;
	/** Teeth whose surfaces cannot be selected, e.g. missing or extracted. */
	inactiveTeeth: ReadonlySet<string>;
	labels: OdontogramLabels;
	/** Number read in accessible names, in the chart's notation. */
	spokenNumber: (toothId: string) => string;
	/** Click, Enter or Space on an active surface; `element` is its polygon. */
	onActivate: (
		toothId: string,
		surface: ToothSurface,
		element: SVGPathElement,
	) => void;
	/** Activating a surface opens a menu instead of toggling its selection. */
	menu?: boolean;
	/** Surface whose menu is open, if any. */
	openMenu?: SurfaceKey;
	/** A surface is hovered or focused; the event target is its polygon. */
	onEnter?: (
		toothId: string,
		surface: ToothSurface,
		event: SurfaceEvent,
	) => void;
	onLeave?: () => void;
}

interface SurfacePathProps extends SurfaceKey {
	d: string;
	/** Accessible name, e.g. "Tooth 11, Incisal". */
	label: string;
	selected: boolean;
	/** Whether Tab reaches this surface; the diagrams keep a single tab stop. */
	focusable: boolean;
	disabled: boolean;
	/** A menu button instead of a checkbox. */
	menu: boolean;
	menuOpen: boolean;
	onActivate: SurfaceDiagramsProps["onActivate"];
	onKeyDown: (
		event: KeyboardEvent<SVGPathElement>,
		toothId: string,
		surface: ToothSurface,
	) => void;
	onFocus: (event: FocusEvent<SVGPathElement>) => void;
	onEnter?: SurfaceDiagramsProps["onEnter"];
	onLeave?: () => void;
}

/** One surface of a diagram: a checkbox, or a menu button. */
function SurfacePath({
	toothId,
	surface,
	d,
	label,
	selected,
	focusable,
	disabled,
	menu,
	menuOpen,
	onActivate,
	onKeyDown,
	onFocus,
	onEnter,
	onLeave,
}: SurfacePathProps) {
	return (
		<path
			className={`odontogram-surface${selected ? " odontogram-surface--selected" : ""}`}
			d={d}
			role={menu ? "button" : "checkbox"}
			aria-label={label}
			aria-checked={menu ? undefined : selected}
			aria-haspopup={menu ? "dialog" : undefined}
			aria-expanded={menu ? menuOpen : undefined}
			aria-disabled={disabled || undefined}
			tabIndex={focusable ? 0 : -1}
			data-surface-tooth={toothId}
			data-surface={surface}
			onClick={(event) => onActivate(toothId, surface, event.currentTarget)}
			onKeyDown={(event) => onKeyDown(event, toothId, surface)}
			onFocus={onFocus}
			onBlur={onLeave}
			onMouseEnter={
				onEnter ? (event) => onEnter(toothId, surface, event) : undefined
			}
			onMouseLeave={onLeave}
		/>
	);
}

/**
 * The five-surface diagrams of `showSurfaces`, one checkbox per surface
 * (a menu button with `renderSurfaceMenu`).
 * Keeps a single tab stop: the last focused surface, else the first selected
 * one, else the first surface of the first active tooth.
 */
export function SurfaceDiagrams({
	diagrams,
	anchors,
	isSelected,
	disabled,
	inactiveTeeth,
	labels,
	spokenNumber,
	onActivate,
	menu = false,
	openMenu,
	onEnter,
	onLeave,
}: SurfaceDiagramsProps) {
	const root = useRef<SVGGElement>(null);
	const [active, setActive] = useState<SurfaceKey>();

	const activeDiagrams = diagrams.filter(
		({ toothId }) => !inactiveTeeth.has(toothId),
	);
	const focusable = (() => {
		if (
			active &&
			activeDiagrams.some(({ toothId }) => toothId === active.toothId)
		) {
			return active;
		}
		for (const { toothId } of activeDiagrams) {
			const surface = toothSurfaces.find((item) => isSelected(toothId, item));
			if (surface) {
				return { toothId, surface };
			}
		}
		const first = activeDiagrams[0];
		return first
			? { toothId: first.toothId, surface: toothSurfaces[0] }
			: undefined;
	})();

	const activate = (
		toothId: string,
		surface: ToothSurface,
		element: SVGPathElement,
	) => {
		if (!(disabled || inactiveTeeth.has(toothId))) {
			setActive({ toothId, surface });
			onActivate(toothId, surface, element);
		}
	};

	/** Left/right and Home/End move between teeth; up/down between surfaces. */
	const target = (
		toothId: string,
		surface: ToothSurface,
		key: ToothNavigationKey,
	): SurfaceKey | undefined => {
		if (key === "ArrowUp" || key === "ArrowDown") {
			const index =
				toothSurfaces.indexOf(surface) + (key === "ArrowDown" ? 1 : -1);
			const next = toothSurfaces[index];
			return next ? { toothId, surface: next } : undefined;
		}

		const reachable = anchors.filter(
			(anchor) =>
				!inactiveTeeth.has(anchor.toothId) || anchor.toothId === toothId,
		);
		const next = findNavigationTarget(reachable, toothId, key);
		return next && next !== toothId ? { toothId: next, surface } : undefined;
	};

	const handleKeyDown = (
		event: KeyboardEvent<SVGPathElement>,
		toothId: string,
		surface: ToothSurface,
	) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			activate(toothId, surface, event.currentTarget);
			return;
		}
		if (!toothNavigationKeys.has(event.key)) {
			return;
		}

		event.preventDefault();
		const next = target(toothId, surface, event.key as ToothNavigationKey);
		if (next) {
			setActive(next);
			root.current
				?.querySelector<SVGPathElement>(
					`[data-surface-tooth="${next.toothId}"][data-surface="${next.surface}"]`,
				)
				?.focus();
		}
	};

	if (diagrams.length === 0) {
		return null;
	}

	return (
		// biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: an SVG <g> is not interactive; `group` names the set of surface checkboxes.
		<g
			ref={root}
			className="odontogram__surfaces"
			// biome-ignore lint/a11y/useSemanticElements: <fieldset> does not exist inside SVG.
			role="group"
			aria-label={labels.surfaces}
		>
			{diagrams.map((diagram) => {
				const { toothId } = diagram;
				const inactive = inactiveTeeth.has(toothId);
				return (
					<g
						key={toothId}
						className={`odontogram-surfaces${inactive ? " odontogram-surfaces--inactive" : ""}`}
						data-surfaces-for={toothId}
						strokeWidth={diagram.strokeWidth}
					>
						{diagram.surfaces.map(({ surface, name, d }) => (
							<SurfacePath
								key={surface}
								toothId={toothId}
								surface={surface}
								d={d}
								label={`${labels.tooth} ${spokenNumber(toothId)}, ${labels.surfaceNames[name]}`}
								selected={isSelected(toothId, surface)}
								focusable={
									!disabled &&
									focusable?.toothId === toothId &&
									focusable.surface === surface
								}
								disabled={disabled || inactive}
								menu={menu}
								menuOpen={
									openMenu?.toothId === toothId && openMenu.surface === surface
								}
								onActivate={activate}
								onKeyDown={handleKeyDown}
								onFocus={(event) => {
									setActive({ toothId, surface });
									onEnter?.(toothId, surface, event);
								}}
								onEnter={onEnter}
								onLeave={onLeave}
							/>
						))}
					</g>
				);
			})}
		</g>
	);
}

export interface SurfaceLettersProps {
	/** `showSurfaceLetters`; nothing is drawn when false. */
	show: boolean;
	diagrams: readonly SurfaceDiagram[];
	/** Letter per clinical surface name, e.g. `P` for palatal. */
	letters: OdontogramLabels["surfaceLetters"];
}

/**
 * The letter of every surface (V, M, O/I, D, L/P) of `showSurfaceLetters`.
 * Decorative: each surface already has an accessible name.
 */
export function SurfaceLetters({
	show,
	diagrams,
	letters,
}: SurfaceLettersProps) {
	if (!show || diagrams.length === 0) {
		return null;
	}

	return (
		// biome-ignore lint/a11y/noAriaHiddenOnFocusable: the group has no tabIndex, so it is not focusable; the letters repeat the surfaces' accessible names.
		<g className="odontogram__surface-letters" aria-hidden="true">
			{diagrams.flatMap((diagram) =>
				diagram.surfaces.map((shape) => {
					const { x, y } = surfaceCenter(shape);
					const key = `${diagram.toothId}:${shape.surface}`;
					return (
						<text
							key={key}
							className="odontogram__surface-letter"
							data-letter-for={key}
							x={x}
							y={y}
							fontSize={diagram.size * 0.24}
							textAnchor="middle"
							dominantBaseline="central"
						>
							{letters[shape.name]}
						</text>
					);
				}),
			)}
		</g>
	);
}

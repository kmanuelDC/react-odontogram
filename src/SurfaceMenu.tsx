import {
	type FindingCatalog,
	type OdontogramFinding,
	type OdontogramLabels,
	type ToothDefinition,
	type ToothSurface,
	getSurfaceName,
	getToothRecord,
} from "@kmanueldc/odontogram-core";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { SurfaceKey } from "./SurfaceDiagrams";
import type { SurfaceMenuRenderProps } from "./type";

interface OpenMenu extends SurfaceKey {
	/** The polygon the menu is anchored to, and gets the focus back. */
	element: SVGElement;
}

const focusableSelector =
	'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const padding = 8;

interface SurfaceMenuPanelProps {
	menu: OpenMenu;
	label: string;
	panelRef: React.RefObject<HTMLDivElement>;
	children: ReactNode;
}

/**
 * The floating menu panel: below its surface (above when there is no room),
 * kept inside the viewport, with the focus on its first control.
 */
function SurfaceMenuPanel({
	menu,
	label,
	panelRef,
	children,
}: SurfaceMenuPanelProps) {
	const [position, setPosition] = useState<{ left: number; top: number }>();

	// Placed once per opened surface, before paint.
	useLayoutEffect(() => {
		const panel = panelRef.current;
		if (!panel) {
			return;
		}
		const rect = menu.element.getBoundingClientRect();
		const { width, height } = panel.getBoundingClientRect();
		const clamp = (value: number, maximum: number) =>
			Math.min(Math.max(value, padding), Math.max(padding, maximum));
		const below = rect.bottom + padding;
		const top =
			below + height > window.innerHeight - padding
				? rect.top - height - padding
				: below;

		setPosition({
			left: clamp(
				rect.left + rect.width / 2 - width / 2,
				window.innerWidth - width - padding,
			),
			top: clamp(top, window.innerHeight - height - padding),
		});
		panel.querySelector<HTMLElement>(focusableSelector)?.focus();
	}, [menu.element, panelRef]);

	return (
		<div
			ref={panelRef}
			className="odontogram-surface-menu"
			// biome-ignore lint/a11y/useSemanticElements: a non-modal panel placed by hand; <dialog> brings UA styles and top-layer behavior.
			role="dialog"
			aria-label={label}
			data-menu-for={`${menu.toothId}:${menu.surface}`}
			style={{
				position: "fixed",
				left: position?.left ?? -9999,
				top: position?.top ?? -9999,
				opacity: position ? 1 : 0,
			}}
		>
			{children}
		</div>
	);
}

export interface ChartSurfaceMenuOptions {
	renderSurfaceMenu?: (props: SurfaceMenuRenderProps) => ReactNode;
	/** Teeth with a drawn surface diagram; the menu closes when its tooth leaves. */
	diagramTeeth: ReadonlySet<string>;
	toothById: ReadonlyMap<string, ToothDefinition>;
	/** Findings with FDI IDs, for the record. */
	findings: readonly OdontogramFinding[];
	catalog: FindingCatalog;
	labels: OdontogramLabels;
	/** Number read in the menu's accessible name, in the chart's notation. */
	spokenNumber: (toothId: string) => string;
	/** A menu opened on a surface, e.g. to report the click and hide the tooltip. */
	onOpen?: (toothId: string, surface: ToothSurface) => void;
}

/**
 * The surface menu of a chart: `open` from a surface, closed with `close()`,
 * Escape (focus back to the surface) or a click outside. `node` is the
 * rendered panel, or nothing while it is closed.
 */
export function useChartSurfaceMenu({
	renderSurfaceMenu,
	diagramTeeth,
	toothById,
	findings,
	catalog,
	labels,
	spokenNumber,
	onOpen,
}: ChartSurfaceMenuOptions) {
	const [menu, setMenu] = useState<OpenMenu>();
	const menuRef = useRef(menu);
	menuRef.current = menu;
	const panelRef = useRef<HTMLDivElement>(null);

	const open = useCallback(
		(toothId: string, surface: ToothSurface, element: SVGElement) => {
			onOpen?.(toothId, surface);
			setMenu({ toothId, surface, element });
		},
		[onOpen],
	);

	/** Closes the menu; by default the focus returns to its surface. */
	const close = useCallback((restoreFocus = true) => {
		const element = menuRef.current?.element;
		setMenu(undefined);
		if (restoreFocus) {
			element?.focus();
		}
	}, []);

	useEffect(() => {
		if (!menu) {
			return;
		}
		const handlePointerDown = (event: Event) => {
			const target = event.target as Node | null;
			if (
				target &&
				!panelRef.current?.contains(target) &&
				target !== menuRef.current?.element
			) {
				close(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				close();
			}
		};
		document.addEventListener("pointerdown", handlePointerDown, true);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown, true);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [menu, close]);

	// The menu closes when its tooth or the diagrams are no longer drawn.
	const gone = Boolean(menu && !diagramTeeth.has(menu.toothId));
	useEffect(() => {
		if (gone) {
			close(false);
		}
	}, [gone, close]);

	const tooth = menu ? toothById.get(menu.toothId) : undefined;
	const record = useMemo(
		() => (menu ? getToothRecord(menu.toothId, findings, catalog) : undefined),
		[menu, findings, catalog],
	);

	let node: ReactNode = null;
	if (renderSurfaceMenu && menu && tooth && record && !gone) {
		const surfaceName =
			labels.surfaceNames[getSurfaceName(menu.surface, menu.toothId)];
		node = (
			<SurfaceMenuPanel
				// A new panel per surface, placed and focused again.
				key={`${menu.toothId}:${menu.surface}`}
				menu={menu}
				panelRef={panelRef}
				label={`${labels.surfaceMenu}: ${labels.tooth} ${spokenNumber(menu.toothId)}, ${surfaceName}`}
			>
				{renderSurfaceMenu({
					toothId: menu.toothId,
					tooth,
					surface: menu.surface,
					surfaceName,
					record,
					close: () => close(),
				})}
			</SurfaceMenuPanel>
		);
	}

	const openMenu: SurfaceKey | undefined = menu
		? { toothId: menu.toothId, surface: menu.surface }
		: undefined;

	return { isOpen: Boolean(menu), openMenu, open, close, node };
}

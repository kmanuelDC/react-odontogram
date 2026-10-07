import {
	type OdontogramSurfaces,
	type ToothSurface,
	toggleSurface,
} from "@kmanueldc/odontogram-core";
import { useCallback, useRef, useState } from "react";

export interface SurfaceSelectionOptions {
	/** Selected surfaces keyed by FDI ID when controlled. */
	value?: OdontogramSurfaces;
	/** Initial surfaces keyed by FDI ID when uncontrolled. */
	defaultValue?: OdontogramSurfaces;
	/** Called with the next surfaces, keyed by FDI ID. */
	onChange?: (surfaces: OdontogramSurfaces) => void;
}

const empty: OdontogramSurfaces = {};

/**
 * Selected surfaces, controlled through `value` or kept inside from
 * `defaultValue`. Works with plain FDI IDs only.
 */
export function useSurfaceSelection({
	value,
	defaultValue,
	onChange,
}: SurfaceSelectionOptions) {
	const [internal, setInternal] = useState(() => defaultValue ?? empty);
	const controlled = value !== undefined;
	const surfaces = controlled ? value : internal;

	// Latest model, so two toggles before a re-render still chain.
	const latest = useRef(surfaces);
	latest.current = surfaces;

	const toggle = useCallback(
		(toothId: string, surface: ToothSurface) => {
			const next = toggleSurface(latest.current, toothId, surface);
			latest.current = next;
			if (!controlled) {
				setInternal(next);
			}
			onChange?.(next);
			return next;
		},
		[controlled, onChange],
	);

	const isSurfaceSelected = useCallback(
		(toothId: string, surface: ToothSurface) =>
			surfaces[toothId]?.includes(surface) ?? false,
		[surfaces],
	);

	return { surfaces, isSurfaceSelected, toggle };
}

import { useCallback, useRef, useState } from "react";

export interface ToothSelectionOptions {
	/** Selected FDI IDs when controlled; `undefined` keeps the state inside. */
	value?: readonly string[];
	/** Initial FDI IDs when uncontrolled. */
	defaultValue?: readonly string[];
	singleSelect?: boolean;
	disabled?: boolean;
	/** Called with the next selection, in selection order. */
	onChange?: (selected: string[]) => void;
}

function initialSelection(
	ids: readonly string[] | undefined,
	singleSelect: boolean,
): string[] {
	const unique = [...new Set(ids ?? [])];
	return singleSelect ? unique.slice(0, 1) : unique;
}

/**
 * Tooth selection, controlled through `value` or kept inside from
 * `defaultValue`. Works with plain FDI IDs only.
 */
export function useToothSelection({
	value,
	defaultValue,
	singleSelect = false,
	disabled = false,
	onChange,
}: ToothSelectionOptions) {
	const [internal, setInternal] = useState(() =>
		initialSelection(defaultValue, singleSelect),
	);
	const controlled = value !== undefined;
	const selected = controlled ? [...new Set(value)] : internal;

	// Latest selection, so two toggles before a re-render still chain.
	const latest = useRef(selected);
	latest.current = selected;

	const toggle = useCallback(
		(id: string) => {
			if (disabled) {
				return;
			}

			const current = latest.current;
			let next: string[];
			if (singleSelect) {
				next = current.includes(id) ? [] : [id];
			} else {
				next = current.includes(id)
					? current.filter((selectedId) => selectedId !== id)
					: [...current, id];
			}

			latest.current = next;
			if (!controlled) {
				setInternal(next);
			}
			onChange?.(next);
		},
		[controlled, disabled, onChange, singleSelect],
	);

	const isSelected = useCallback(
		(id: string) => selected.includes(id),
		[selected],
	);

	return { selected, isSelected, toggle };
}

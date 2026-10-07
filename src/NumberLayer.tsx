import type { ToothNumberLabel } from "@kmanueldc/odontogram-core";
import { Fragment, type ReactNode } from "react";
import type { Notation, OdontogramNumberRenderProps } from "./type";

export interface NumberLayerProps {
	labels: readonly ToothNumberLabel[];
	notation: Notation;
	isSelected: (toothId: string) => boolean;
	renderNumber?: (props: OdontogramNumberRenderProps) => ReactNode;
}

/**
 * The tooth numbers of `showNumbers`, in viewBox coordinates. Decorative:
 * each tooth already has an accessible name.
 */
export function NumberLayer({
	labels,
	notation,
	isSelected,
	renderNumber,
}: NumberLayerProps) {
	if (labels.length === 0) {
		return null;
	}

	return (
		// biome-ignore lint/a11y/noAriaHiddenOnFocusable: the group has no tabIndex, so it is not focusable; the numbers repeat the teeth's accessible names.
		<g className="odontogram__numbers" aria-hidden="true">
			{labels.map((label) => {
				const selected = isSelected(label.toothId);
				return (
					<Fragment key={label.toothId}>
						{renderNumber ? (
							renderNumber({ ...label, selected, notation })
						) : (
							<>
								<text
									className={`odontogram__number${selected ? " odontogram__number--selected" : ""}`}
									data-number-for={label.toothId}
									x={label.x}
									y={label.y}
									fontSize={label.fontSize}
									textAnchor="middle"
									dominantBaseline="central"
								>
									{label.text}
								</text>
								{label.corner && (
									<path
										className={`odontogram__number-corner${selected ? " odontogram__number-corner--selected" : ""}`}
										data-corner-for={label.toothId}
										d={label.corner}
										strokeWidth={label.fontSize * 0.08}
									/>
								)}
							</>
						)}
					</Fragment>
				);
			})}
		</g>
	);
}

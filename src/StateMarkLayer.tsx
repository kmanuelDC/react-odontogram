import type { ToothStateMark } from "@kmanueldc/odontogram-core";

export interface StateMarkLayerProps {
	marks: readonly ToothStateMark[];
}

/**
 * Cross of extracted teeth and fixture of implants, drawn over the teeth in
 * viewBox coordinates. Decorative: the state is in each tooth's accessible name.
 */
export function StateMarkLayer({ marks }: StateMarkLayerProps) {
	if (marks.length === 0) {
		return null;
	}

	return (
		// biome-ignore lint/a11y/noAriaHiddenOnFocusable: the group has no tabIndex, so it is not focusable; the states are in the teeth's accessible names.
		<g className="odontogram__state-marks" aria-hidden="true">
			{marks.map((mark) =>
				mark.kind === "cross" ? (
					<g
						key={mark.toothId}
						className="odontogram-state-mark--cross"
						data-mark-for={mark.toothId}
						strokeWidth={mark.strokeWidth}
					>
						{mark.lines.map((line, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: the two lines of a cross are fixed.
							<line key={index} {...line} />
						))}
					</g>
				) : (
					<g
						key={mark.toothId}
						className="odontogram-state-mark--implant"
						data-mark-for={mark.toothId}
						strokeWidth={mark.strokeWidth}
					>
						<rect
							x={mark.body.x}
							y={mark.body.y}
							width={mark.body.width}
							height={mark.body.height}
							rx={mark.body.width / 4}
						/>
						{mark.threads.map((line, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: the threads are fixed per implant.
							<line key={index} {...line} />
						))}
					</g>
				),
			)}
		</g>
	);
}

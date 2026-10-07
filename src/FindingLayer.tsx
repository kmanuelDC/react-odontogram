import type {
	FindingPrimitive,
	RenderedFinding,
} from "@kmanueldc/odontogram-core";

/** Draws finding primitives in `currentColor`: strokes, areas and text. */
export function FindingPrimitives({
	primitives,
}: {
	primitives: readonly FindingPrimitive[];
}) {
	return primitives.map((primitive, index) => {
		// The primitives of a finding are fixed, so their index is a stable key.
		const key = `${primitive.type}-${index}`;
		switch (primitive.type) {
			case "path":
				return (
					<path
						key={key}
						className="odontogram-finding__stroke"
						d={primitive.d}
					/>
				);
			case "area":
				return (
					<path
						key={key}
						className="odontogram-finding__area"
						d={primitive.d}
					/>
				);
			case "circle":
				return (
					<circle
						key={key}
						className="odontogram-finding__stroke"
						cx={primitive.cx}
						cy={primitive.cy}
						r={primitive.r}
					/>
				);
			default:
				return (
					<text
						key={key}
						className="odontogram-finding__text"
						x={primitive.x}
						y={primitive.y}
						fontSize={primitive.fontSize}
						textAnchor="middle"
						dominantBaseline="central"
					>
						{primitive.text}
					</text>
				);
		}
	});
}

/** Classes of a finding: its tone (`good`/`bad`) and status. */
export function findingClassName({
	tone,
	status,
}: Pick<RenderedFinding, "tone" | "status">): string {
	return [
		"odontogram-finding",
		`odontogram-finding--${tone}`,
		`odontogram-finding--${status}`,
	].join(" ");
}

export interface FindingLayerProps {
	findings: readonly RenderedFinding[];
}

/**
 * The findings of the chart, in viewBox coordinates. Decorative: they are
 * in each tooth's accessible name. Blue for good state or completed
 * treatment, red for bad state or pending; `color` overrides both.
 */
export function FindingLayer({ findings }: FindingLayerProps) {
	if (findings.length === 0) {
		return null;
	}

	return (
		// biome-ignore lint/a11y/noAriaHiddenOnFocusable: the group has no tabIndex, so it is not focusable; the findings are in the teeth's accessible names.
		<g className="odontogram__findings" aria-hidden="true">
			{findings.map((finding) => (
				<g
					key={finding.key}
					className={findingClassName(finding)}
					style={finding.color ? { color: finding.color } : undefined}
					data-finding={finding.code}
					data-status={finding.status}
					data-teeth={finding.teeth.join(" ")}
					strokeWidth={finding.strokeWidth}
					strokeDasharray={
						finding.status === "planned"
							? `${finding.strokeWidth * 2} ${finding.strokeWidth * 1.6}`
							: undefined
					}
				>
					<FindingPrimitives primitives={finding.primitives} />
				</g>
			))}
		</g>
	);
}

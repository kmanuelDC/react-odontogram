import type { FC } from "react";
import { FindingPrimitives, findingClassName } from "./FindingLayer";
import type { LegendFinding } from "./findingText";
import type { NonPresentToothState } from "./hooks/useOdontogram";
import type { ToothConditionGroup } from "./type";

type ConditionLabelsProps = {
	conditions?: ToothConditionGroup[];
	/** Non-present tooth states to explain, each with its display name. */
	states?: { state: NonPresentToothState; label: string }[];
	/** Findings to explain, each with its icon. */
	findings?: LegendFinding[];
	className?: string;
	/** Accessible name of the legend. */
	ariaLabel?: string;
};

/** Miniature of the mark the chart draws for a tooth state. */
function StateIcon({ state }: { state: NonPresentToothState }) {
	const absent = state === "missing" || state === "extracted";

	return (
		<svg
			aria-hidden="true"
			className="odontogram-condition-labels__icon"
			viewBox="0 0 16 16"
			fill="none"
		>
			<rect
				className={`odontogram-condition-labels__icon-tooth odontogram-condition-labels__icon-tooth--${state}`}
				x="2"
				y="2"
				width="12"
				height="12"
				rx="4"
				strokeDasharray={absent ? "2.5 2" : undefined}
			/>
			{state === "extracted" && (
				<g className="odontogram-state-mark--cross">
					<line x1="3" y1="3" x2="13" y2="13" />
					<line x1="13" y1="3" x2="3" y2="13" />
				</g>
			)}
			{state === "implant" && (
				<g className="odontogram-state-mark--implant">
					<rect x="6.5" y="4" width="3" height="8" />
					<line x1="5.5" y1="6" x2="10.5" y2="6" />
					<line x1="5.5" y1="8" x2="10.5" y2="8" />
					<line x1="5.5" y1="10" x2="10.5" y2="10" />
				</g>
			)}
		</svg>
	);
}

export const ConditionLabels: FC<ConditionLabelsProps> = ({
	conditions,
	states = [],
	findings = [],
	className = "",
	ariaLabel = "Tooth condition legend",
}) => {
	if (
		(conditions ?? []).length === 0 &&
		states.length === 0 &&
		findings.length === 0
	) {
		return null;
	}

	return (
		<ul
			className={["odontogram-condition-labels", className]
				.filter(Boolean)
				.join(" ")}
			style={{
				display: "flex",
				gap: 8,
				fontFamily: "sans-serif",
				fontSize: 14,
				flexWrap: "wrap",
			}}
			aria-label={ariaLabel}
		>
			{conditions?.map((condition, index) => (
				<li
					// Labels may repeat: each group is its own entry.
					key={`${index}-${condition.label}`}
					className="odontogram-condition-labels__item"
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					<span
						aria-hidden="true"
						style={{
							width: 14,
							height: 14,
							borderRadius: 4,
							background: condition.fillColor,
							border: `2px solid ${
								condition.outlineColor ?? condition.fillColor
							}`,
							display: "inline-block",
						}}
					/>
					<span style={{ textTransform: "capitalize" }}>{condition.label}</span>
				</li>
			))}
			{/* State and finding names are shown as written, not capitalized. */}
			{states.map(({ state, label }) => (
				<li
					key={`state-${state}`}
					className="odontogram-condition-labels__item"
					data-state={state}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					<StateIcon state={state} />
					<span>{label}</span>
				</li>
			))}
			{findings.map((finding) => (
				<li
					key={finding.key}
					className="odontogram-condition-labels__item"
					data-finding={finding.code}
					data-status={finding.status}
					data-tone={finding.tone}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					<svg
						aria-hidden="true"
						className={`odontogram-condition-labels__icon ${findingClassName(finding)}`}
						style={finding.color ? { color: finding.color } : undefined}
						viewBox="0 0 16 16"
						fill="none"
						strokeWidth={1.4}
					>
						<FindingPrimitives primitives={finding.icon} />
					</svg>
					<span>{finding.name}</span>
				</li>
			))}
		</ul>
	);
};

export default ConditionLabels;

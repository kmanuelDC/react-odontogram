import {
	type ToothDefinition,
	type ToothState,
	absentToothStates,
} from "@kmanueldc/odontogram-core";
import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { toLegacyId } from "./compat";

/** Colors of a tooth with a condition. */
export interface ToothCondition {
	fillColor?: string;
	outlineColor?: string;
}

export interface ToothProps {
	tooth: ToothDefinition;
	selected?: boolean;
	disabled?: boolean;
	condition?: ToothCondition;
	/** Presentation transform from the layout, after the shape's own. */
	layoutTransform?: string;
	/** Whether Tab reaches this tooth; a chart keeps a single tab stop. */
	focusable?: boolean;
	/** Accessible name; `Tooth <FDI ID>` by default. */
	label?: string;
	/** Presence status; it never changes selection or interaction. */
	state?: ToothState;
	/** Name of a non-present state, appended to the accessible name. */
	stateLabel?: string;
	/** Extra text appended to the accessible name, e.g. the tooth findings. */
	description?: string;
	/** Rendered first inside the tooth group, e.g. its `<title>`. */
	children?: ReactNode;
	onSelect?: (toothId: string) => void;
	onKeyDown?: (event: KeyboardEvent<SVGGElement>, toothId: string) => void;
	onHover?: (toothId: string, event: MouseEvent<SVGGElement>) => void;
	onFocus?: (toothId: string, event: FocusEvent<SVGGElement>) => void;
	onLeave?: () => void;
	onBlur?: () => void;
}

/** One tooth of the chart. Callbacks receive its FDI ID. */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one ternary per attribute, to keep the 0.5.x markup attribute for attribute.
export function Tooth({
	tooth,
	selected = false,
	disabled = false,
	condition,
	layoutTransform,
	focusable = true,
	label,
	state = "present",
	stateLabel,
	description,
	children,
	onSelect,
	onKeyDown,
	onHover,
	onFocus,
	onLeave,
	onBlur,
}: ToothProps) {
	const { id, shape } = tooth;
	const { outlinePath, shadowPath, lineHighlightPath } = shape;
	/** Missing and extracted teeth keep only a dashed outline, without crown. */
	const absent = absentToothStates.has(state);
	const colored = Boolean(condition) && !absent;
	const strokeColor = condition?.outlineColor ?? "currentColor";
	const fillColor = condition?.fillColor ?? "currentColor";
	const accessibleName = [
		label ?? `Tooth ${id}`,
		state === "present" ? undefined : stateLabel,
		description,
	]
		.filter(Boolean)
		.join(", ");
	const stateClasses =
		state === "present"
			? ""
			: ` ${absent ? "odontogram-tooth--absent " : ""}odontogram-tooth--${state}`;
	const transform =
		[shape.transform, layoutTransform].filter(Boolean).join(" ") || undefined;

	return (
		<g
			// The 0.5.x class name, e.g. `teeth-11`, kept for user styles.
			className={`${toLegacyId(id)} ${selected ? "selected" : ""}${stateClasses}`}
			data-tooth-id={id}
			data-tooth-state={state}
			transform={transform}
			onClick={disabled ? undefined : () => onSelect?.(id)}
			onKeyDown={disabled ? undefined : (event) => onKeyDown?.(event, id)}
			onMouseEnter={onHover ? (event) => onHover(id, event) : undefined}
			onFocus={onFocus ? (event) => onFocus(id, event) : undefined}
			onMouseLeave={onLeave}
			onBlur={onBlur}
			role={disabled ? undefined : "option"}
			aria-selected={disabled ? undefined : selected}
			tabIndex={disabled || !focusable ? -1 : 0}
			aria-label={disabled ? undefined : accessibleName}
			aria-disabled={disabled}
			style={{
				cursor: disabled ? "default" : "pointer",
				color: strokeColor,
			}}
		>
			{children}

			{/* outline */}
			<path
				stroke={strokeColor}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={absent ? "4 3" : undefined}
				d={outlinePath}
			/>

			{/* fill; absent teeth keep it only to show hover and selection */}
			<path
				fill={fillColor}
				d={shadowPath}
				data-colored={colored ? "true" : undefined}
				style={{ opacity: colored ? 1 : undefined }}
			/>

			{/* highlight lines */}
			{absent ? null : Array.isArray(lineHighlightPath) ? (
				lineHighlightPath.map((d) => (
					<path
						key={d}
						stroke={strokeColor}
						strokeLinecap="round"
						strokeLinejoin="round"
						d={d}
					/>
				))
			) : (
				<path
					stroke={strokeColor}
					strokeLinecap="round"
					strokeLinejoin="round"
					d={lineHighlightPath}
				/>
			)}
		</g>
	);
}

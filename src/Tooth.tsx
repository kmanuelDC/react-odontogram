import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { toLegacyId } from "./compat";
import type { ToothDefinition } from "./core/types/odontogram";

export interface ToothProps {
	tooth: ToothDefinition;
	selected?: boolean;
	disabled?: boolean;
	condition?: {
		fillColor?: string;
		outlineColor?: string;
	};
	/** Presentation transform from the layout, after the shape's own. */
	layoutTransform?: string;
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
	const strokeColor = condition?.outlineColor ?? "currentColor";
	const fillColor = condition?.fillColor ?? "currentColor";
	const transform =
		[shape.transform, layoutTransform].filter(Boolean).join(" ") || undefined;

	return (
		<g
			// The 0.5.x class name, e.g. `teeth-11`, kept for user styles.
			className={`${toLegacyId(id)} ${selected ? "selected" : ""}`}
			transform={transform}
			onClick={disabled ? undefined : () => onSelect?.(id)}
			onKeyDown={disabled ? undefined : (event) => onKeyDown?.(event, id)}
			onMouseEnter={onHover ? (event) => onHover(id, event) : undefined}
			onFocus={onFocus ? (event) => onFocus(id, event) : undefined}
			onMouseLeave={onLeave}
			onBlur={onBlur}
			role={disabled ? undefined : "option"}
			aria-selected={disabled ? undefined : selected}
			tabIndex={disabled ? -1 : 0}
			aria-label={disabled ? undefined : `Tooth ${id}`}
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
				d={outlinePath}
			/>

			{/* fill */}
			<path
				fill={fillColor}
				d={shadowPath}
				data-colored={condition ? "true" : undefined}
				style={{ opacity: condition ? 1 : undefined }}
			/>

			{/* highlight lines */}
			{Array.isArray(lineHighlightPath) ? (
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

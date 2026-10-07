import type {
	FindingPrimitive,
	RenderedFinding,
	ToothNumberLabel,
	ToothState,
	ToothStateMark,
} from "@kmanueldc/odontogram-core";
import { Circle, G, Line, Path, Rect, Text } from "react-native-svg";
import type { NativePalette } from "./theme";

/** Finding primitives in one color: strokes, areas and text. */
export function NativeFindingPrimitives({
	primitives,
	color,
	areaStroke,
	planned,
	strokeWidth,
}: {
	primitives: readonly FindingPrimitive[];
	color: string;
	/** Outline of filled areas (surface fills). */
	areaStroke: string;
	planned: boolean;
	strokeWidth: number;
}) {
	const dash = planned ? `${strokeWidth * 2} ${strokeWidth * 1.6}` : undefined;

	return primitives.map((primitive, index) => {
		// The primitives of a finding are fixed, so their index is a stable key.
		const key = `${primitive.type}-${index}`;
		switch (primitive.type) {
			case "path":
				return (
					<Path
						key={key}
						d={primitive.d}
						fill="none"
						stroke={color}
						strokeDasharray={dash}
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={strokeWidth}
					/>
				);
			case "area":
				return (
					<Path
						key={key}
						d={primitive.d}
						fill={color}
						fillOpacity={planned ? 0.45 : 1}
						stroke={areaStroke}
						strokeLinejoin="round"
						strokeWidth={strokeWidth}
					/>
				);
			case "circle":
				return (
					<Circle
						key={key}
						cx={primitive.cx}
						cy={primitive.cy}
						fill="none"
						r={primitive.r}
						stroke={color}
						strokeDasharray={dash}
						strokeWidth={strokeWidth}
					/>
				);
			default:
				return (
					<Text
						key={key}
						alignmentBaseline="central"
						fill={color}
						fontSize={primitive.fontSize}
						fontWeight="700"
						textAnchor="middle"
						x={primitive.x}
						y={primitive.y}
					>
						{primitive.text}
					</Text>
				);
		}
	});
}

/** Color of a finding: its own `color`, else blue (good) or red (bad). */
export function findingColor(
	{ color, tone }: Pick<RenderedFinding, "color" | "tone">,
	palette: NativePalette,
): string {
	return color ?? (tone === "good" ? palette.findingGood : palette.findingBad);
}

/** The findings of the chart, in viewBox coordinates. */
export function NativeFindingLayer({
	findings,
	palette,
}: {
	findings: readonly RenderedFinding[];
	palette: NativePalette;
}) {
	if (findings.length === 0) {
		return null;
	}

	return (
		<G>
			{findings.map((finding) => (
				<G key={finding.key} accessibilityElementsHidden={true}>
					<NativeFindingPrimitives
						areaStroke={palette.baseBlue}
						color={findingColor(finding, palette)}
						planned={finding.status === "planned"}
						primitives={finding.primitives}
						strokeWidth={finding.strokeWidth}
					/>
				</G>
			))}
		</G>
	);
}

/** Cross of extracted teeth and fixture of implants. */
export function NativeStateMarkLayer({
	marks,
	palette,
}: {
	marks: readonly ToothStateMark[];
	palette: NativePalette;
}) {
	if (marks.length === 0) {
		return null;
	}

	return (
		<G>
			{marks.map((mark) =>
				mark.kind === "cross" ? (
					<G key={mark.toothId}>
						{mark.lines.map((line, index) => (
							<Line
								// biome-ignore lint/suspicious/noArrayIndexKey: the two lines of a cross are fixed.
								key={index}
								{...line}
								stroke={palette.extracted}
								strokeLinecap="round"
								strokeWidth={mark.strokeWidth}
							/>
						))}
					</G>
				) : (
					<G key={mark.toothId}>
						<Rect
							fill={palette.implantFill}
							height={mark.body.height}
							rx={mark.body.width / 4}
							stroke={palette.implant}
							strokeWidth={mark.strokeWidth}
							width={mark.body.width}
							x={mark.body.x}
							y={mark.body.y}
						/>
						{mark.threads.map((line, index) => (
							<Line
								// biome-ignore lint/suspicious/noArrayIndexKey: the threads are fixed per implant.
								key={index}
								{...line}
								stroke={palette.implant}
								strokeLinecap="round"
								strokeWidth={mark.strokeWidth}
							/>
						))}
					</G>
				),
			)}
		</G>
	);
}

/** The tooth numbers of `showNumbers`; Palmer with its corner. */
export function NativeNumberLayer({
	labels,
	isSelected,
	palette,
}: {
	labels: readonly ToothNumberLabel[];
	isSelected: (toothId: string) => boolean;
	palette: NativePalette;
}) {
	if (labels.length === 0) {
		return null;
	}

	return (
		<G>
			{labels.map((label) => {
				const color = isSelected(label.toothId)
					? palette.darkBlue
					: palette.number;
				return (
					<G key={label.toothId}>
						<Text
							alignmentBaseline="central"
							fill={color}
							fontSize={label.fontSize}
							fontWeight={isSelected(label.toothId) ? "700" : undefined}
							textAnchor="middle"
							x={label.x}
							y={label.y}
						>
							{label.text}
						</Text>
						{label.corner && (
							<Path
								d={label.corner}
								fill="none"
								stroke={color}
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={label.fontSize * 0.08}
							/>
						)}
					</G>
				);
			})}
		</G>
	);
}

/** 12×12 legend icon of a tooth state, drawn at the origin. */
export function NativeStateIcon({
	state,
	palette,
}: {
	state: Exclude<ToothState, "present">;
	palette: NativePalette;
}) {
	const absent = state === "missing" || state === "extracted";
	return (
		<G>
			<Rect
				fill="none"
				height={12}
				opacity={state === "unerupted" ? 0.45 : 1}
				rx={3}
				stroke={palette.baseBlue}
				strokeDasharray={absent ? "2 1.5" : undefined}
				strokeWidth={1.5}
				width={12}
			/>
			{state === "extracted" && (
				<>
					<Line
						stroke={palette.extracted}
						strokeLinecap="round"
						strokeWidth={1.5}
						x1={2}
						x2={10}
						y1={2}
						y2={10}
					/>
					<Line
						stroke={palette.extracted}
						strokeLinecap="round"
						strokeWidth={1.5}
						x1={10}
						x2={2}
						y1={2}
						y2={10}
					/>
				</>
			)}
			{state === "implant" && (
				<Rect
					fill={palette.implantFill}
					height={8}
					rx={1}
					stroke={palette.implant}
					strokeWidth={1.5}
					width={4}
					x={4}
					y={2}
				/>
			)}
		</G>
	);
}

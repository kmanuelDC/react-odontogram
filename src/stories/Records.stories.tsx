import {
	addFinding,
	addSurfaceFinding,
	removeSurfaceFinding,
} from "@kmanueldc/odontogram-core";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { type CSSProperties, useState } from "react";
import Odontogram from "../Odontogram";
import { ToothInspector } from "../ToothInspector";
import type {
	OdontogramFinding,
	OdontogramProps,
	OdontogramSurfaces,
} from "../type";

const initialFindings: OdontogramFinding[] = [
	{ code: "caries", teeth: ["16"], surfaces: ["occlusal"] },
	{
		code: "restoration",
		teeth: ["36"],
		surfaces: ["mesial"],
		status: "planned",
	},
	{ code: "crown", teeth: ["21"] },
];

const buttonStyle: CSSProperties = {
	padding: "2px 8px",
	border: "1px solid #cbd5e1",
	borderRadius: 4,
	background: "#fff",
	font: "inherit",
	cursor: "pointer",
};

const meta = {
	component: Odontogram,
	title: "Components/Finding Records",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Recording findings from the chart. `renderSurfaceMenu` opens a menu on each surface (the app lists and edits its findings with `addSurfaceFinding` and `removeSurfaceFinding`); `ToothInspector` shows everything recorded on a tooth and reports `onAddFinding`/`onRemoveFinding`. Neither holds clinical rules: the app decides what to record.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div
				style={{ width: "min(760px, calc(100vw - 32px))", margin: "0 auto" }}
			>
				<Story />
			</div>
		),
	],
	args: {
		idFormat: "fdi",
		layout: "horizontal",
		showSurfaces: true,
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Click a surface (or press Enter/Space on it) to open its menu. */
export const SurfaceMenu: Story = {
	render: function SurfaceMenuStory(args: OdontogramProps) {
		const [findings, setFindings] = useState(initialFindings);
		return (
			<Odontogram
				{...args}
				findings={findings}
				renderSurfaceMenu={({
					toothId,
					surface,
					surfaceName,
					record,
					close,
				}) => (
					<div style={{ display: "grid", gap: 8, fontSize: 14 }}>
						<strong>
							{toothId} · {surfaceName}
						</strong>
						{record.surfaces[surface].length === 0 && (
							<span style={{ color: "#64748b" }}>No findings</span>
						)}
						{record.surfaces[surface].map((entry) => (
							<span
								key={entry.index}
								style={{ display: "flex", gap: 8, alignItems: "center" }}
							>
								{entry.definition?.name ?? entry.finding.code}
								<button
									type="button"
									style={buttonStyle}
									onClick={() =>
										setFindings(
											removeSurfaceFinding(findings, {
												index: entry.index,
												toothId,
												surface,
											}),
										)
									}
								>
									Remove
								</button>
							</span>
						))}
						<span style={{ display: "flex", gap: 8 }}>
							<button
								type="button"
								style={buttonStyle}
								onClick={() =>
									setFindings(
										addSurfaceFinding(findings, {
											code: "caries",
											toothId,
											surfaces: [surface],
										}),
									)
								}
							>
								Add caries
							</button>
							<button
								type="button"
								style={buttonStyle}
								onClick={() =>
									setFindings(
										addSurfaceFinding(findings, {
											code: "restoration",
											toothId,
											surfaces: [surface],
										}),
									)
								}
							>
								Add restoration
							</button>
							<button type="button" style={buttonStyle} onClick={close}>
								Close
							</button>
						</span>
					</div>
				)}
			/>
		);
	},
};

/**
 * Click a tooth to inspect it; surfaces chosen on the chart or on the panel's
 * diagram are the ones the next surface finding goes to.
 */
export const WithInspector: Story = {
	render: function InspectorStory(args: OdontogramProps) {
		const [findings, setFindings] = useState(initialFindings);
		const [surfaces, setSurfaces] = useState<OdontogramSurfaces>({});
		const [toothId, setToothId] = useState("36");

		return (
			<div style={{ display: "grid", gap: 16 }}>
				<Odontogram
					{...args}
					findings={findings}
					toothStates={{ 18: "extracted" }}
					surfaces={surfaces}
					onSurfacesChange={setSurfaces}
					onSurfaceClick={(tooth) => setToothId(tooth.id)}
					singleSelect={true}
					value={[toothId]}
					onChange={([tooth]) => tooth && setToothId(tooth.id)}
				/>
				<ToothInspector
					toothId={toothId}
					findings={findings}
					toothStates={{ 18: "extracted" }}
					selectedSurfaces={surfaces[toothId] ?? []}
					onSelectedSurfacesChange={(next) =>
						setSurfaces({ ...surfaces, [toothId]: next })
					}
					onAddFinding={(input) => setFindings(addFinding(findings, input))}
					onRemoveFinding={(removal) =>
						setFindings(removeSurfaceFinding(findings, removal))
					}
				/>
			</div>
		);
	},
};

export const InspectorReadOnly: Story = {
	render: () => (
		<ToothInspector toothId="16" findings={initialFindings} disabled={true} />
	),
};

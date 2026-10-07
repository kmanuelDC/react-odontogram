import {
	addFinding,
	getFindingScope,
	ntsPeruFindingCatalog,
	removeSurfaceFinding,
} from "@kmanueldc/odontogram-core";
import { useMemo, useRef, useState } from "react";
import { Odontogram } from "../../../src/Odontogram";
import { ToothInspector } from "../../../src/ToothInspector";
import { buildToothDetail } from "../../../src/compat";
import type {
	Notation,
	OdontogramDentition,
	OdontogramFinding,
	OdontogramProps,
	OdontogramSurfaces,
	OdontogramToothStates,
	SurfaceShapeKind,
	ToothConditionGroup,
	ToothDetail,
} from "../../../src/type";

type Layout = "arch" | "horizontal";
type ShowHalf = NonNullable<OdontogramProps["showHalf"]>;

const conditionSets: Record<string, ToothConditionGroup[]> = {
	checkup: [
		{
			label: "caries",
			teeth: ["16", "26", "36", "54", "64"],
			fillColor: "#ef4444",
			outlineColor: "#991b1b",
		},
		{
			label: "filling",
			teeth: ["14", "24", "44", "74"],
			fillColor: "#38bdf8",
			outlineColor: "#0369a1",
		},
		{
			label: "watch",
			teeth: ["11", "12", "31", "51", "81"],
			fillColor: "#fde047",
			outlineColor: "#a16207",
		},
	],
	periodontal: [
		{
			label: "mobility",
			teeth: ["17", "27", "37", "47"],
			fillColor: "#f9a8d4",
			outlineColor: "#be185d",
		},
		{
			label: "monitor",
			teeth: ["13", "23", "33", "43", "53", "63"],
			fillColor: "#a78bfa",
			outlineColor: "#6d28d9",
		},
	],
	surgery: [
		{
			label: "planned",
			teeth: ["18", "28", "38", "48"],
			fillColor: "#fb923c",
			outlineColor: "#c2410c",
		},
		{
			label: "reviewed",
			teeth: ["17", "27"],
			fillColor: "#86efac",
			outlineColor: "#15803d",
		},
	],
	none: [],
};

/** Clinical findings of the NTS Peru catalog, on permanent and primary teeth. */
const sampleFindings: OdontogramFinding[] = [
	{ code: "caries", teeth: ["16"], surfaces: ["occlusal", "mesial"] },
	{ code: "restoration", teeth: ["26"], surfaces: ["occlusal"] },
	{ code: "crown", teeth: ["21"] },
	{ code: "fixed-prosthesis", teeth: ["44", "46"] },
	{ code: "extraction", teeth: ["38"], status: "planned" },
	{ code: "caries", teeth: ["54", "84"], surfaces: ["occlusal"] },
	{ code: "crown", teeth: ["61"], status: "done" },
];

const sampleStates: OdontogramToothStates = {
	18: "missing",
	36: "implant",
	75: "extracted",
};

const notations: Notation[] = ["FDI", "Universal", "Palmer"];
const layoutModes: Layout[] = ["arch", "horizontal"];
const dentitions: OdontogramDentition[] = ["permanent", "primary", "mixed"];
const halves: ShowHalf[] = ["full", "upper", "lower"];
const surfaceShapes: SurfaceShapeKind[] = ["square", "circle"];

const previewWidths = [
	{ label: "Phone", width: 220 },
	{ label: "Tablet", width: 360 },
	{ label: "Desktop", width: 620 },
];

const faqs = [
	{
		question: "Is this dental chart generator free?",
		answer:
			"Yes. This example is a free browser-based dental chart generator built with react-odontogram. You can create a chart and export SVG, PNG, or JSON files locally.",
	},
	{
		question: "Can I export the odontogram for records or reports?",
		answer:
			"Yes. Use Export SVG for editable vector output, Export PNG for presentations and documents, or Export JSON for the selected teeth and chart settings.",
	},
	{
		question: "Which tooth numbering systems are supported?",
		answer:
			"The generator supports FDI, Universal, and Palmer notation. The exported JSON includes notation details for selected teeth.",
	},
	{
		question: "Does the chart work on mobile screens?",
		answer:
			"Yes. The chart scales inside responsive containers and the page includes phone, tablet, and desktop previews to show how the odontogram adapts.",
	},
];

/** Whether a tooth belongs to a dentition: permanent 11–48, primary 51–85. */
const inDentition = (toothId: string, dentition: OdontogramDentition) =>
	dentition === "mixed" || (dentition === "primary") === Number(toothId) > 50;

/** Surface findings need the surface diagrams; the others draw on the tooth. */
const isSurfaceFinding = ({ code }: OdontogramFinding) => {
	const definition =
		ntsPeruFindingCatalog[code as keyof typeof ntsPeruFindingCatalog];
	return (
		Boolean(definition) && getFindingScope(definition.symbol) === "surface"
	);
};

const getSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "") || "dental-chart";

const downloadBlob = (blob: Blob, filename: string) => {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
};

/** Rules of the library: its classes, and the `:root` theme colors. */
const chartRulePattern = /odontogram|:root/i;

/** The library's CSS rules loaded in the page, to embed them in exports. */
const getChartCss = () =>
	[...document.styleSheets]
		.flatMap((sheet) => {
			try {
				return [...sheet.cssRules];
			} catch {
				// Cross-origin sheets cannot be read; the library is same-origin.
				return [];
			}
		})
		.map((rule) => rule.cssText)
		.filter((text) => chartRulePattern.test(text))
		.join("\n");

/**
 * A standalone SVG of the chart: the chart's <svg> nested in an outer
 * `.Odontogram` <svg> with the library CSS and the chart's theme variables,
 * so surfaces, findings and marks keep their look.
 */
const serializeSvg = (chart: HTMLElement) => {
	const svg = chart.querySelector("svg");
	if (!svg) {
		return undefined;
	}
	const size = "1200";
	const namespace = "http://www.w3.org/2000/svg";

	const inner = svg.cloneNode(true) as SVGSVGElement;
	inner.removeAttribute("style");
	inner.setAttribute("width", size);
	inner.setAttribute("height", size);

	const outer = document.createElementNS(namespace, "svg");
	outer.setAttribute("xmlns", namespace);
	outer.setAttribute("width", size);
	outer.setAttribute("height", size);
	outer.setAttribute("viewBox", `0 0 ${size} ${size}`);
	outer.setAttribute("class", chart.className);
	outer.setAttribute("style", chart.getAttribute("style") ?? "");

	const style = document.createElementNS(namespace, "style");
	style.textContent = getChartCss();
	outer.append(style, inner);

	return new XMLSerializer().serializeToString(outer);
};

export default function App() {
	const chartRef = useRef<HTMLDivElement>(null);
	const [layout, setLayout] = useState<Layout>("arch");
	const [dentition, setDentition] = useState<OdontogramDentition>("permanent");
	const [notation, setNotation] = useState<Notation>("FDI");
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [showHalf, setShowHalf] = useState<ShowHalf>("full");
	const [singleSelect, setSingleSelect] = useState(false);
	const [readOnly, setReadOnly] = useState(false);
	const [showLabels, setShowLabels] = useState(true);
	const [showNumbers, setShowNumbers] = useState(false);
	const [showSurfaces, setShowSurfaces] = useState(true);
	const [surfaceShape, setSurfaceShape] = useState<SurfaceShapeKind>("square");
	const [showFindings, setShowFindings] = useState(true);
	const [showStates, setShowStates] = useState(true);
	const [conditionKey, setConditionKey] = useState("checkup");
	const [chartTitle, setChartTitle] = useState("Free dental chart");
	const [chartNote, setChartNote] = useState("Initial exam");
	// Controlled, so the list matches the chart from the first render.
	const [selectedTeeth, setSelectedTeeth] = useState<ToothDetail[]>(() =>
		["11", "21"].map((id) => buildToothDetail(id, "fdi")),
	);
	const [findings, setFindings] = useState(sampleFindings);
	const [surfaces, setSurfaces] = useState<OdontogramSurfaces>({});

	// Only what the dentition draws, so no tooth of another set is listed.
	const activeConditions = useMemo(
		() =>
			conditionSets[conditionKey].map((group) => ({
				...group,
				teeth: group.teeth.filter((id) => inDentition(id, dentition)),
			})),
		[conditionKey, dentition],
	);
	const chartFindings = useMemo(
		() =>
			showFindings
				? findings.filter(
						(finding) =>
							finding.teeth.every((id) => inDentition(id, dentition)) &&
							(showSurfaces || !isSurfaceFinding(finding)),
					)
				: [],
		[findings, showFindings, showSurfaces, dentition],
	);
	const toothStates = useMemo(
		() =>
			showStates
				? Object.fromEntries(
						Object.entries(sampleStates).filter(([id]) =>
							inDentition(id, dentition),
						),
					)
				: undefined,
		[showStates, dentition],
	);
	const inspectedTooth = selectedTeeth.at(-1)?.id;

	const chartStyles = useMemo(
		() => ({
			maxWidth: layout === "horizontal" ? "960px" : "520px",
		}),
		[layout],
	);

	const exportSvg = () => {
		const chart = chartRef.current?.querySelector<HTMLElement>(".Odontogram");
		const svgText = chart && serializeSvg(chart);
		if (!svgText) {
			return;
		}

		downloadBlob(
			new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }),
			`${getSlug(chartTitle)}.svg`,
		);
	};

	const exportPng = () => {
		const chart = chartRef.current?.querySelector<HTMLElement>(".Odontogram");
		const svgText = chart && serializeSvg(chart);
		if (!svgText) {
			return;
		}

		const image = new Image();
		const svgUrl = URL.createObjectURL(
			new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }),
		);

		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = 1600;
			canvas.height = 1600;
			const context = canvas.getContext("2d");
			if (!context) {
				URL.revokeObjectURL(svgUrl);
				return;
			}

			context.fillStyle = theme === "dark" ? "#10141b" : "#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(image, 120, 80, 1360, 1360);
			canvas.toBlob((blob) => {
				if (blob) {
					downloadBlob(blob, `${getSlug(chartTitle)}.png`);
				}
				URL.revokeObjectURL(svgUrl);
			}, "image/png");
		};

		image.src = svgUrl;
	};

	const exportJson = () => {
		const payload = {
			title: chartTitle,
			note: chartNote,
			generatedAt: new Date().toISOString(),
			settings: {
				conditionSet: conditionKey,
				dentition,
				layout,
				notation,
				showHalf,
				showLabels,
				showNumbers,
				showSurfaces,
				surfaceShape,
				singleSelect,
				theme,
			},
			conditions: activeConditions,
			toothStates: toothStates ?? {},
			findings: chartFindings,
			surfaces,
			selectedTeeth,
		};

		downloadBlob(
			new Blob([JSON.stringify(payload, null, 2)], {
				type: "application/json;charset=utf-8",
			}),
			`${getSlug(chartTitle)}.json`,
		);
	};

	const switches: [string, boolean, (value: boolean) => void][] = [
		["Dark theme", theme === "dark", (on) => setTheme(on ? "dark" : "light")],
		["Single select", singleSelect, setSingleSelect],
		["Read only", readOnly, setReadOnly],
		["Condition labels", showLabels, setShowLabels],
		["Tooth numbers", showNumbers, setShowNumbers],
		["Surface diagrams", showSurfaces, setShowSurfaces],
		["Findings", showFindings, setShowFindings],
		["Tooth states", showStates, setShowStates],
	];

	return (
		<main className={`app app-${theme}`}>
			<section className="workbench" aria-label="Free dental chart generator">
				<header className="topbar">
					<div>
						<p className="eyebrow">Free odontogram tool</p>
						<h1>Dental chart generator</h1>
						<p className="lede">
							Create a responsive odontogram, mark conditions, select teeth, and
							export the chart for notes, reports, or patient education.
						</p>
					</div>
					<div className="selection-meter" aria-live="polite">
						<span>{selectedTeeth.length}</span>
						Selected
					</div>
				</header>

				<div className="workspace-grid">
					<aside className="control-panel" aria-label="Dental chart controls">
						<div className="control-group">
							<label htmlFor="chart-title">Chart title</label>
							<input
								id="chart-title"
								onChange={(event) => setChartTitle(event.target.value)}
								type="text"
								value={chartTitle}
							/>
						</div>

						<div className="control-group">
							<label htmlFor="chart-note">Reference note</label>
							<input
								id="chart-note"
								onChange={(event) => setChartNote(event.target.value)}
								type="text"
								value={chartNote}
							/>
						</div>

						<div className="control-group">
							<label htmlFor="layout">Layout</label>
							<div className="segmented" id="layout">
								{layoutModes.map((mode) => (
									<button
										aria-pressed={layout === mode}
										key={mode}
										onClick={() => setLayout(mode)}
										type="button"
									>
										{mode}
									</button>
								))}
							</div>
						</div>

						<div className="control-group">
							<label htmlFor="dentition">Dentition</label>
							<select
								id="dentition"
								onChange={(event) => {
									setDentition(event.target.value as OdontogramDentition);
									setSelectedTeeth([]);
								}}
								value={dentition}
							>
								{dentitions.map((item) => (
									<option key={item} value={item}>
										{item}
									</option>
								))}
							</select>
						</div>

						<div className="control-group">
							<label htmlFor="notation">Notation</label>
							<select
								id="notation"
								onChange={(event) =>
									setNotation(event.target.value as Notation)
								}
								value={notation}
							>
								{notations.map((item) => (
									<option key={item} value={item}>
										{item}
									</option>
								))}
							</select>
						</div>

						<div className="control-group">
							<label htmlFor="condition-set">Condition template</label>
							<select
								id="condition-set"
								onChange={(event) => setConditionKey(event.target.value)}
								value={conditionKey}
							>
								{Object.keys(conditionSets).map((item) => (
									<option key={item} value={item}>
										{item}
									</option>
								))}
							</select>
						</div>

						<div className="control-group">
							<label htmlFor="show-half">Arch</label>
							<select
								id="show-half"
								onChange={(event) =>
									setShowHalf(event.target.value as ShowHalf)
								}
								value={showHalf}
							>
								{halves.map((item) => (
									<option key={item} value={item}>
										{item}
									</option>
								))}
							</select>
						</div>

						<div className="control-group">
							<label htmlFor="surface-shape">Surface diagram</label>
							<div className="segmented" id="surface-shape">
								{surfaceShapes.map((shape) => (
									<button
										aria-pressed={surfaceShape === shape}
										key={shape}
										onClick={() => setSurfaceShape(shape)}
										type="button"
									>
										{shape}
									</button>
								))}
							</div>
						</div>

						<div className="switch-list">
							{switches.map(([label, checked, onChange]) => (
								<label key={label}>
									<input
										checked={checked}
										onChange={(event) => onChange(event.target.checked)}
										type="checkbox"
									/>
									{label}
								</label>
							))}
						</div>
					</aside>

					<section className="chart-stage" aria-label="Generated dental chart">
						<div className="chart-document" ref={chartRef}>
							<div className="chart-document-header">
								<div>
									<strong>{chartTitle}</strong>
									<span>{chartNote}</span>
								</div>
								<small>{notation} notation</small>
							</div>
							<Odontogram
								colors={
									theme === "dark"
										? {
												baseBlue: "#dbeafe",
												darkBlue: "#93c5fd",
												lightBlue: "#1d4ed8",
											}
										: {
												baseBlue: "#64748b",
												darkBlue: "#0f766e",
												lightBlue: "#99f6e4",
											}
								}
								conditions={activeConditions}
								value={selectedTeeth.map(({ id }) => id)}
								dentition={dentition}
								disabled={readOnly}
								findings={chartFindings}
								idFormat="fdi"
								layout={layout}
								notation={notation}
								onChange={setSelectedTeeth}
								onSurfacesChange={setSurfaces}
								showHalf={showHalf}
								showLabels={showLabels}
								showNumbers={showNumbers}
								showSurfaces={showSurfaces}
								showTooltip={true}
								singleSelect={singleSelect}
								styles={chartStyles}
								surfaceShape={surfaceShape}
								surfaces={surfaces}
								theme={theme}
								toothStates={toothStates}
								tooltip={{ placement: "right" }}
							/>
						</div>
					</section>

					<aside className="details-panel" aria-label="Export dental chart">
						<h2>Export chart</h2>
						<div className="export-actions">
							<button onClick={exportSvg} type="button">
								Export SVG
							</button>
							<button onClick={exportPng} type="button">
								Export PNG
							</button>
							<button onClick={exportJson} type="button">
								Export JSON
							</button>
						</div>

						<h2>Selected teeth</h2>
						<div className="selected-list">
							{selectedTeeth.length === 0 ? (
								<p>No teeth selected</p>
							) : (
								selectedTeeth.map((tooth) => (
									<div className="selected-item" key={tooth.id}>
										<strong>{tooth.notations.fdi}</strong>
										<span>{tooth.type}</span>
										<small>
											U {tooth.notations.universal} | P {tooth.notations.palmer}
										</small>
									</div>
								))
							)}
						</div>

						{inspectedTooth && (
							<>
								<h2>Tooth findings</h2>
								<ToothInspector
									className="inspector-panel"
									disabled={readOnly || !showFindings}
									findings={findings}
									notation={notation}
									onAddFinding={(input) =>
										setFindings(addFinding(findings, input))
									}
									onRemoveFinding={(removal) =>
										setFindings(removeSurfaceFinding(findings, removal))
									}
									onSelectedSurfacesChange={(next) =>
										setSurfaces({ ...surfaces, [inspectedTooth]: next })
									}
									selectedSurfaces={surfaces[inspectedTooth] ?? []}
									shape={surfaceShape}
									toothId={inspectedTooth}
									toothStates={toothStates}
								/>
							</>
						)}
					</aside>
				</div>
			</section>

			<section
				className="seo-panel"
				aria-label="About the free dental chart generator"
			>
				<div>
					<p className="eyebrow">Free dental chart generator</p>
					<h2>Create an odontogram online</h2>
				</div>
				<p>
					Use this free dental chart generator to build a visual odontogram in
					the browser. Choose FDI, Universal, or Palmer notation, switch between
					full mouth and arch-only views, add condition templates, and export
					the generated chart as SVG, PNG, or structured JSON.
				</p>
			</section>

			<section
				className="preview-band"
				aria-label="Responsive dental chart previews"
			>
				<div className="section-heading">
					<p className="eyebrow">Responsive odontogram</p>
					<h2>One dental chart, multiple screen sizes</h2>
				</div>
				<div className="preview-grid">
					{previewWidths.map((preview) => (
						<div className="preview-cell" key={preview.label}>
							<div className="preview-header">
								<strong>{preview.label}</strong>
								<span>{preview.width}px</span>
							</div>
							<div style={{ maxWidth: preview.width }}>
								<Odontogram
									conditions={activeConditions}
									defaultValue={["14", "24"]}
									dentition={dentition}
									disabled={true}
									layout={preview.width < 300 ? "arch" : layout}
									showLabels={preview.width > 300}
									showTooltip={false}
									styles={{ maxWidth: "100%" }}
									theme={theme}
								/>
							</div>
						</div>
					))}
				</div>
			</section>

			<section
				className="feature-grid"
				aria-label="Dental chart feature examples"
			>
				<div className="feature-panel">
					<h2>Upper arch dental chart</h2>
					<Odontogram
						conditions={activeConditions}
						defaultValue={["11", "21"]}
						disabled={true}
						showHalf="upper"
						showLabels={false}
						showTooltip={false}
						styles={{ maxWidth: "420px" }}
						theme={theme}
					/>
				</div>
				<div className="feature-panel">
					<h2>Printable square odontogram</h2>
					<Odontogram
						conditions={activeConditions}
						disabled={true}
						layout="horizontal"
						showLabels={true}
						showTooltip={false}
						styles={{ maxWidth: "100%" }}
						theme={theme}
					/>
				</div>
				<div className="feature-panel">
					<h2>Mixed dentition chart</h2>
					<Odontogram
						dentition="mixed"
						disabled={true}
						findings={sampleFindings.filter(
							(finding) => !isSurfaceFinding(finding),
						)}
						layout="horizontal"
						showNumbers={true}
						showTooltip={false}
						styles={{ maxWidth: "100%" }}
						teeth={[
							"16",
							"12",
							"11",
							"21",
							"22",
							"26",
							"55",
							"54",
							"53",
							"63",
							"64",
							"65",
							"46",
							"42",
							"41",
							"31",
							"32",
							"36",
							"85",
							"84",
							"83",
							"73",
							"74",
							"75",
						]}
						theme={theme}
					/>
				</div>
				<div className="feature-panel">
					<h2>Surface findings chart</h2>
					<Odontogram
						disabled={true}
						findings={sampleFindings.filter(({ teeth }) =>
							teeth.every((id) => inDentition(id, "permanent")),
						)}
						layout="horizontal"
						showLabels={true}
						showSurfaces={true}
						showTooltip={false}
						styles={{ maxWidth: "100%" }}
						theme={theme}
						toothStates={{ 18: "missing", 36: "implant" }}
					/>
				</div>
			</section>

			<section className="faq-section" aria-label="Dental chart generator FAQ">
				<div className="section-heading">
					<p className="eyebrow">FAQ</p>
					<h2>Dental chart generator questions</h2>
				</div>
				<div className="faq-list">
					{faqs.map((faq) => (
						<details key={faq.question}>
							<summary>{faq.question}</summary>
							<p>{faq.answer}</p>
						</details>
					))}
				</div>
			</section>

			<footer className="site-footer" aria-label="Project and social links">
				<a href="https://coolhead.in">Coolhead</a>
				<a href="https://github.com/biomathcode/react-odontogram">
					React Odontogram on GitHub
				</a>
				<a href="https://github.com/biomathcode">Biomathcode GitHub</a>
				<a href="https://linkedin.com/in/biomathcode">Biomathcode LinkedIn</a>
			</footer>
		</main>
	);
}

// R19: NativeOdontogram on @kmanueldc/odontogram-core — dentitions, layouts,
// numbers, tooth states, findings and the legend, as react-odontogram.
import {
	getComposition,
	getDentitionToothIds,
} from "@kmanueldc/odontogram-core";
import { act, create } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetDeprecationWarnings } from "../../../src/compat";
import { buildOdontogramModel } from "../../../src/hooks/useOdontogram";
import { NativeOdontogram } from "../src/index";

type Root = ReturnType<typeof create>["root"];

const teethOf = (root: Root) =>
	root.findAll(
		(node) =>
			node.props.testID === "G" &&
			typeof node.props.accessibilityLabel === "string",
	);

const toothNamed = (root: Root, name: string) =>
	root.find(
		(node) =>
			node.props.testID === "G" && node.props.accessibilityLabel === name,
	);

const nodesOf = (root: Root, type: string) =>
	root.findAll((node) => node.props.testID === type);

const viewBoxOf = (root: Root) =>
	root.findByProps({ testID: "Svg" }).props.viewBox as string;

const heightOf = (viewBox: string) => Number(viewBox.split(" ")[3]);

/** Mounts inside `act`, so effects (the developer warnings) run. */
const mount = (element: Parameters<typeof create>[0]) => {
	let chart: ReturnType<typeof create> | undefined;
	act(() => {
		chart = create(element);
	});
	return chart as ReturnType<typeof create>;
};

afterEach(() => {
	vi.restoreAllMocks();
	resetDeprecationWarnings();
});

describe("NativeOdontogram dentitions", () => {
	it("draws the 20 primary teeth (51–85) in arch and horizontal", () => {
		for (const layout of ["arch", "horizontal"] as const) {
			const chart = create(
				<NativeOdontogram dentition="primary" layout={layout} />,
			);
			const labels = teethOf(chart.root).map(
				(node) => node.props.accessibilityLabel,
			);

			expect(labels).toHaveLength(20);
			expect(labels).toContain("Tooth 55");
			expect(labels).toContain("Tooth 85");
			expect(labels).not.toContain("Tooth 11");
			expect(viewBoxOf(chart.root)).toBe(
				buildOdontogramModel({ dentition: "primary", layout }).viewBox,
			);
		}
	});

	it("uses the primary notations and emits primary tooth details", () => {
		const onChange = vi.fn();
		const chart = create(
			<NativeOdontogram
				dentition="primary"
				notation="Universal"
				onChange={onChange}
			/>,
		);

		act(() => {
			toothNamed(chart.root, "Tooth A").props.onPress();
		});

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({
				id: "teeth-55",
				notations: expect.objectContaining({ fdi: "55", universal: "A" }),
			}),
		]);
	});

	it("draws the mixed dentition, or only the listed teeth", () => {
		const all = create(<NativeOdontogram dentition="mixed" />);
		expect(teethOf(all.root)).toHaveLength(
			getDentitionToothIds("mixed", "arch").length,
		);

		const listed = create(
			<NativeOdontogram dentition="mixed" teeth={["16", "teeth-55", "11"]} />,
		);
		expect(
			teethOf(listed.root).map((node) => node.props.accessibilityLabel),
		).toEqual(expect.arrayContaining(["Tooth 16", "Tooth 55", "Tooth 11"]));
		expect(teethOf(listed.root)).toHaveLength(3);
	});

	it("warns once about teeth outside the dentition", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		mount(<NativeOdontogram dentition="primary" teeth={["55", "11"]} />);

		expect(warn).toHaveBeenCalledWith(
			"[react-odontogram] Teeth 11 are not part of the primary dentition.",
		);
	});

	it("applies each quadrant transform and the tooth layout transform", () => {
		const chart = create(<NativeOdontogram dentition="primary" />);
		const quadrantTransforms = chart.root
			.findByProps({ testID: "Svg" })
			.children.filter(
				(node): node is Exclude<typeof node, string> =>
					typeof node !== "string" && node.props.transform !== undefined,
			)
			.map((node) => node.props.transform);

		expect(quadrantTransforms).toEqual(
			getComposition("primary", "arch").parts[0].quadrants.map(
				({ transform }) => transform,
			),
		);
	});
});

describe("NativeOdontogram layouts", () => {
	it("accepts arch and horizontal without deprecation warnings", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const chart = mount(<NativeOdontogram layout="horizontal" />);

		expect(viewBoxOf(chart.root)).toBe("0 0 900 150");
		expect(warn).not.toHaveBeenCalled();
	});

	it("warns about circle, maxTeeth and teethConditions", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		mount(
			<NativeOdontogram
				layout="circle"
				maxTeeth={5}
				teethConditions={[
					{
						label: "x",
						teeth: ["11"],
						fillColor: "#000",
						outlineColor: "#000",
					},
				]}
			/>,
		);

		expect(warn).toHaveBeenCalledTimes(3);
	});
});

describe("NativeOdontogram selection", () => {
	it("is controlled through value, with FDI IDs when idFormat is fdi", () => {
		const onChange = vi.fn();
		const chart = create(
			<NativeOdontogram idFormat="fdi" onChange={onChange} value={["11"]} />,
		);

		act(() => {
			toothNamed(chart.root, "Tooth 12").props.onPress();
		});

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ id: "11" }),
			expect.objectContaining({ id: "12" }),
		]);
		// The parent did not update `value`: tooth 12 stays unselected.
		expect(
			toothNamed(chart.root, "Tooth 12").props.accessibilityState.selected,
		).toBe(false);
		expect(
			toothNamed(chart.root, "Tooth 11").props.accessibilityState.selected,
		).toBe(true);
	});

	it("reads defaultValue in either ID format", () => {
		const chart = create(
			<NativeOdontogram defaultValue={["teeth-21", "22"]} />,
		);

		for (const name of ["Tooth 21", "Tooth 22"]) {
			expect(
				toothNamed(chart.root, name).props.accessibilityState.selected,
			).toBe(true);
		}
	});

	it("reports the pressed tooth through onToothPress", () => {
		const onToothPress = vi.fn();
		const chart = create(<NativeOdontogram onToothPress={onToothPress} />);

		act(() => {
			toothNamed(chart.root, "Tooth 36").props.onPress();
		});

		expect(onToothPress).toHaveBeenCalledWith(
			expect.objectContaining({ id: "teeth-36", type: "First Molar" }),
		);
	});

	it("has no press handlers when disabled", () => {
		const onToothPress = vi.fn();
		const chart = create(
			<NativeOdontogram disabled={true} onToothPress={onToothPress} />,
		);

		expect(toothNamed(chart.root, "Tooth 11").props.onPress).toBeUndefined();
		expect(toothNamed(chart.root, "Tooth 11").props.accessibilityRole).toBe(
			"image",
		);
	});
});

describe("NativeOdontogram numbers", () => {
	it("draws one number per tooth and fits the viewBox", () => {
		const chart = create(<NativeOdontogram showNumbers={true} />);
		const numbers = nodesOf(chart.root, "Text").map((node) => node.children[0]);

		expect(numbers).toHaveLength(32);
		expect(numbers).toContain("18");
		expect(viewBoxOf(chart.root)).toBe(
			buildOdontogramModel({ layout: "arch", showNumbers: true }).viewBox,
		);
	});

	it("draws the Palmer corner and highlights selected numbers", () => {
		const chart = create(
			<NativeOdontogram
				defaultValue={["11"]}
				notation="Palmer"
				showNumbers={true}
			/>,
		);
		const corners = nodesOf(chart.root, "Path").filter(
			(node) => node.props.fill === "none" && node.props.strokeWidth < 2,
		);
		const selectedNumbers = nodesOf(chart.root, "Text").filter(
			(node) => node.props.fontWeight === "700",
		);

		expect(corners.length).toBeGreaterThanOrEqual(32);
		expect(selectedNumbers).toHaveLength(1);
		expect(selectedNumbers[0].props.fill).toBe("#3e5edc");
	});
});

describe("NativeOdontogram tooth states", () => {
	const toothStates = {
		"teeth-16": "extracted",
		"26": "implant",
		"36": "missing",
		"46": "unerupted",
	} as const;

	it("names the state and draws absent teeth as a dashed outline", () => {
		const chart = create(<NativeOdontogram toothStates={toothStates} />);
		const extracted = toothNamed(chart.root, "Tooth 16, Extracted");
		const paths = extracted.findAll((node) => node.props.testID === "Path");

		expect(paths).toHaveLength(2);
		expect(paths[0].props.strokeDasharray).toBe("4 3");
		expect(extracted.props.opacity).toBe(0.55);
		expect(toothNamed(chart.root, "Tooth 36, Missing")).toBeDefined();
		expect(toothNamed(chart.root, "Tooth 46, Unerupted").props.opacity).toBe(
			0.45,
		);
		expect(toothNamed(chart.root, "Tooth 26, Implant")).toBeDefined();
	});

	it("draws the extraction cross and the implant fixture", () => {
		const chart = create(<NativeOdontogram toothStates={toothStates} />);
		const marks = buildOdontogramModel({
			layout: "arch",
			toothStates: { "16": "extracted", "26": "implant" },
		}).stateMarks;
		const implant = marks.find((mark) => mark.kind === "implant");
		const crossLines = nodesOf(chart.root, "Line").filter(
			(node) => node.props.stroke === "#dc2626",
		);
		const fixture = nodesOf(chart.root, "Rect").filter(
			(node) => node.props.fill === "#ccfbf1",
		);

		expect(crossLines).toHaveLength(2);
		expect(fixture).toHaveLength(1);
		expect(implant?.kind === "implant" && fixture[0].props.x).toBe(
			implant?.kind === "implant" && implant.body.x,
		);
	});

	it("keeps the condition outline of an absent tooth, not its fill", () => {
		const chart = create(
			<NativeOdontogram
				conditions={[
					{
						label: "caries",
						teeth: ["16", "17"],
						fillColor: "#ef4444",
						outlineColor: "#b91c1c",
					},
				]}
				toothStates={{ "16": "missing" }}
			/>,
		);
		const missing = toothNamed(chart.root, "Tooth 16, Missing").findAll(
			(node) => node.props.testID === "Path",
		);
		const present = toothNamed(chart.root, "Tooth 17").findAll(
			(node) => node.props.testID === "Path",
		);

		expect(missing[0].props.stroke).toBe("#b91c1c");
		expect(missing[1].props.fill).toBe("none");
		expect(present[1].props.fill).toBe("#ef4444");
	});
});

describe("NativeOdontogram findings", () => {
	it("adds the findings to the tooth names and draws them in their tone", () => {
		const chart = create(
			<NativeOdontogram
				findings={[
					{ code: "crown", teeth: ["teeth-21"] },
					{ code: "fracture", teeth: ["11"] },
				]}
			/>,
		);
		const strokes = [
			...nodesOf(chart.root, "Path"),
			...nodesOf(chart.root, "Circle"),
		].map((node) => node.props.stroke);

		expect(toothNamed(chart.root, "Tooth 21, Corona definitiva")).toBeDefined();
		expect(toothNamed(chart.root, "Tooth 11, Fractura")).toBeDefined();
		expect(strokes).toContain("#1d4ed8");
		expect(strokes).toContain("#dc2626");
	});

	it("dashes planned findings and honours a finding color", () => {
		const chart = create(
			<NativeOdontogram
				findings={[
					{ code: "extraction", teeth: ["18"], status: "planned" },
					{ code: "crown", teeth: ["21"], color: "#7c3aed" },
				]}
			/>,
		);
		const planned = [
			...nodesOf(chart.root, "Path"),
			...nodesOf(chart.root, "Line"),
		].filter(
			(node) =>
				node.props.stroke === "#dc2626" &&
				typeof node.props.strokeDasharray === "string",
		);
		const custom = [
			...nodesOf(chart.root, "Path"),
			...nodesOf(chart.root, "Circle"),
		].filter((node) => node.props.stroke === "#7c3aed");

		expect(planned.length).toBeGreaterThan(0);
		expect(custom.length).toBeGreaterThan(0);
		expect(
			toothNamed(chart.root, "Tooth 18, Extracción (Planned)"),
		).toBeDefined();
	});

	it("warns once about findings that cannot be drawn", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		mount(<NativeOdontogram findings={[{ code: "nope", teeth: ["41"] }]} />);

		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0][0])).toContain("nope");
	});

	it("skips surface findings until surfaces exist in React Native", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const chart = mount(
			<NativeOdontogram
				findings={[{ code: "caries", teeth: ["16"], surfaces: ["occlusal"] }]}
			/>,
		);

		expect(toothNamed(chart.root, "Tooth 16")).toBeDefined();
		expect(viewBoxOf(chart.root)).toBe("0 0 409 694");
		expect(warn).toHaveBeenCalledTimes(1);
	});
});

describe("NativeOdontogram legend, labels and theme", () => {
	it("lists conditions, states and findings in rows below the chart", () => {
		const chart = create(
			<NativeOdontogram
				conditions={[
					{
						label: "caries",
						teeth: ["11"],
						fillColor: "#ef4444",
						outlineColor: "#b91c1c",
					},
				]}
				findings={[{ code: "crown", teeth: ["21"] }]}
				showLabels={true}
				toothStates={{ "16": "extracted", "26": "implant" }}
			/>,
		);
		const texts = nodesOf(chart.root, "Text").map((node) => node.children[0]);

		expect(texts).toEqual([
			"caries",
			"Extracted",
			"Implant",
			"Corona definitiva",
		]);
		// 409 wide: three entries per row, so two rows.
		expect(heightOf(viewBoxOf(chart.root))).toBe(
			heightOf(
				buildOdontogramModel({
					layout: "arch",
					findings: [{ code: "crown", teeth: ["21"] }],
				}).viewBox,
			) +
				2 * 28,
		);
	});

	it("translates names through labels", () => {
		const chart = create(
			<NativeOdontogram
				labels={{ tooth: "Diente", states: { extracted: "Extraída" } }}
				showLabels={true}
				toothStates={{ "16": "extracted" }}
			/>,
		);

		expect(toothNamed(chart.root, "Diente 16, Extraída")).toBeDefined();
		expect(nodesOf(chart.root, "Text").map((node) => node.children[0])).toEqual(
			["Extraída"],
		);
	});

	it("uses the dark palette and lets colors override it", () => {
		const dark = create(<NativeOdontogram theme="dark" />);
		const custom = create(
			<NativeOdontogram colors={{ baseBlue: "#123456" }} theme="dark" />,
		);
		const outline = (root: Root) =>
			toothNamed(root, "Tooth 11").findAll(
				(node) => node.props.testID === "Path",
			)[0].props.stroke;

		expect(outline(dark.root)).toBe("#d0d5f6");
		expect(outline(custom.root)).toBe("#123456");
	});
});

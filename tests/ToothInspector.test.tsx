import {
	type OdontogramFinding,
	type ToothSurface,
	addFinding,
	getToothType,
	removeSurfaceFinding,
} from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: tests/tooth-inspector.test.ts (getToothType and
// addFinding are also covered in packages/odontogram-core/tests/). `add-finding` maps to
// `onAddFinding`, `remove-finding` to `onRemoveFinding` and
// `v-model:selected-surfaces` to `selectedSurfaces` +
// `onSelectedSurfacesChange`.
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import {
	ToothInspector,
	type ToothInspectorProps,
} from "../src/ToothInspector";
import {
	ToothInspector as PublicToothInspector,
	addFinding as publicAddFinding,
	getToothType as publicGetToothType,
} from "../src/index";

const findings: OdontogramFinding[] = [
	{ code: "caries", teeth: ["36"], surfaces: ["mesial"] },
	{
		code: "restoration",
		teeth: ["36"],
		surfaces: ["occlusal"],
		status: "planned",
	},
	{ code: "pulp-treatment", teeth: ["36"] },
	{ code: "fixed-prosthesis", teeth: ["35", "37"] },
];

const inspector = (props: Partial<ToothInspectorProps> = {}) =>
	render(<ToothInspector toothId="36" findings={findings} {...props} />);

const element = (container: HTMLElement, selector: string) => {
	const found = container.querySelector<HTMLElement>(selector);
	if (!found) {
		throw new Error(`${selector} is not rendered`);
	}
	return found;
};
const chosenText = (container: HTMLElement) =>
	element(container, "[data-inspector-chosen]").textContent;
const addButton = (container: HTMLElement) =>
	element(container, ".odontogram-inspector__add");
const guideSurface = (container: HTMLElement, surface: string) =>
	element(container, `[data-guide-surface="${surface}"]`);

describe("getToothType", () => {
	it.each([
		["11", "Central Incisor"],
		["23", "Canine"],
		["36", "First Molar"],
		["48", "Third Molar"],
		["53", "Primary Canine"],
		["85", "Primary Second Molar"],
	])("%s is a %s", (toothId, type) => {
		expect(getToothType(toothId)).toBe(type);
	});
});

describe("addFinding", () => {
	it("merges surface findings and appends whole-tooth ones", () => {
		const withCaries = addFinding(findings, {
			code: "caries",
			toothId: "36",
			surfaces: ["distal"],
		});
		expect(withCaries[0]).toEqual({
			code: "caries",
			teeth: ["36"],
			surfaces: ["mesial", "distal"],
		});

		const withCrown = addFinding(findings, {
			code: "crown",
			toothId: "36",
			status: "planned",
			surfaces: ["mesial"],
		});
		expect(withCrown.at(-1)).toEqual({
			code: "crown",
			teeth: ["36"],
			status: "planned",
		});
	});
});

describe("ToothInspector", () => {
	it("is exported with its helpers", () => {
		expect(PublicToothInspector).toBe(ToothInspector);
		expect(publicAddFinding).toBe(addFinding);
		expect(publicGetToothType).toBe(getToothType);
	});

	it("shows the tooth, its type, its state and the diagram without the text list", () => {
		const { container } = inspector({
			toothStates: { 36: "implant" },
			notation: "Universal",
		});

		expect(element(container, ".odontogram-inspector__title").textContent).toBe(
			"Tooth 19",
		);
		expect(element(container, ".odontogram-inspector__type").textContent).toBe(
			"First Molar",
		);
		expect(element(container, ".odontogram-inspector__state").textContent).toBe(
			"Implant",
		);
		expect(element(container, "section")).toHaveAttribute(
			"aria-label",
			"Tooth details, Tooth 19",
		);
		expect(container.querySelectorAll("[data-guide-surface]")).toHaveLength(5);
		expect(
			container.querySelector(".odontogram-surface-guide__list"),
		).toBeNull();
		expect(
			container.querySelectorAll(
				".odontogram-surface-guide .odontogram-finding__area",
			),
		).toHaveLength(2);
	});

	it("lists findings by surface and on the whole tooth", () => {
		const { container } = inspector();
		const surfaces = [
			...container.querySelectorAll("[data-inspector-surface]"),
		];

		expect(
			surfaces.map((row) => row.getAttribute("data-inspector-surface")),
		).toEqual(["mesial", "occlusal"]);
		expect(surfaces[0]).toHaveTextContent("Lesión de caries dental");
		expect(surfaces[1]).toHaveTextContent("Restauración definitiva (Planned)");

		const tooth = [
			...container.querySelectorAll("[data-inspector-tooth-finding]"),
		].map((row) => row.textContent);
		expect(tooth).toEqual([
			expect.stringContaining("Tratamiento de conductos"),
			expect.stringContaining("Prótesis fija"),
		]);
	});

	it("reports removals ready for removeSurfaceFinding, and only for its own findings", () => {
		const onRemoveFinding = vi.fn();
		const { container } = inspector({ onRemoveFinding });

		fireEvent.click(
			element(
				container,
				'[data-inspector-surface="mesial"] .odontogram-inspector__remove',
			),
		);
		fireEvent.click(
			element(
				container,
				"[data-inspector-tooth-finding] .odontogram-inspector__remove",
			),
		);

		const removals = onRemoveFinding.mock.calls.map(([removal]) => removal);
		expect(removals).toEqual([
			{ index: 0, toothId: "36", surface: "mesial" },
			{ index: 2, toothId: "36" },
		]);
		expect(removeSurfaceFinding(findings, removals[0])).toHaveLength(3);

		// The prosthesis spans 35–37: it is shown but removed from its own teeth.
		const prosthesis = container.querySelectorAll(
			"[data-inspector-tooth-finding]",
		)[1];
		expect(
			prosthesis.querySelector(".odontogram-inspector__remove"),
		).toBeNull();
	});

	it("adds a surface finding on the surfaces chosen on the diagram", () => {
		const onAddFinding = vi.fn();
		const { container } = inspector({
			labels: { surfaceNames: { distal: "Distal" } },
			onAddFinding,
		});

		expect(chosenText(container)).toBe("Choose the surfaces on the diagram.");
		expect(addButton(container)).toBeDisabled();

		fireEvent.click(guideSurface(container, "distal"));
		fireEvent.click(guideSurface(container, "vestibular"));
		expect(chosenText(container)).toBe("Vestibular, Distal");
		expect(guideSurface(container, "distal")).toHaveClass(
			"odontogram-surface--selected",
		);

		fireEvent.click(element(container, 'input[value="planned"]'));
		fireEvent.submit(element(container, "form"));

		expect(onAddFinding.mock.calls).toEqual([
			[
				{
					code: "caries",
					toothId: "36",
					surfaces: ["vestibular", "distal"],
					status: "planned",
				},
			],
		]);
		// The choice is cleared after adding.
		expect(addButton(container)).toBeDisabled();
	});

	it("adds a whole-tooth finding without surfaces", () => {
		const onAddFinding = vi.fn();
		const { container } = inspector({ onAddFinding });

		fireEvent.change(element(container, "select"), {
			target: { value: "crown" },
		});
		expect(container.querySelector("[data-inspector-chosen]")).toBeNull();
		fireEvent.submit(element(container, "form"));

		expect(onAddFinding.mock.calls).toEqual([
			[{ code: "crown", toothId: "36" }],
		]);
	});

	it("offers surface and whole-tooth codes, not spans", () => {
		const { container } = inspector();
		const groups = [...container.querySelectorAll("optgroup")];

		expect(groups.map((group) => group.getAttribute("label"))).toEqual([
			"On surfaces",
			"On the whole tooth",
		]);
		expect(
			[...groups[0].querySelectorAll("option")].map((option) => option.value),
		).toEqual(["caries", "restoration", "temporary-restoration"]);
		expect(
			container.querySelector('option[value="fixed-prosthesis"]'),
		).toBeNull();
	});

	it("does not record surfaces on missing or extracted teeth", () => {
		const { container } = inspector({ toothStates: { 36: "extracted" } });

		fireEvent.click(guideSurface(container, "distal"));
		expect(chosenText(container)).toBe("Choose the surfaces on the diagram.");
		expect(addButton(container)).toBeDisabled();
	});

	it("lets the app control the chosen surfaces", () => {
		const onSelectedSurfacesChange = vi.fn();
		const onAddFinding = vi.fn();
		const { container, rerender } = inspector({
			selectedSurfaces: ["occlusal"],
			onSelectedSurfacesChange,
			onAddFinding,
		});

		expect(chosenText(container)).toBe("Occlusal");
		expect(guideSurface(container, "occlusal")).toHaveClass(
			"odontogram-surface--selected",
		);

		fireEvent.click(guideSurface(container, "mesial"));
		expect(onSelectedSurfacesChange.mock.calls).toEqual([
			[["mesial", "occlusal"]],
		]);
		// Controlled: it shows what the app passes, not its own choice.
		expect(chosenText(container)).toBe("Occlusal");

		// A new tooth keeps the app's choice (e.g. a surface just clicked on the chart).
		rerender(
			<ToothInspector
				toothId="26"
				findings={findings}
				selectedSurfaces={["distal"]}
				onSelectedSurfacesChange={onSelectedSurfacesChange}
				onAddFinding={onAddFinding}
			/>,
		);
		expect(onSelectedSurfacesChange).toHaveBeenCalledTimes(1);
		expect(chosenText(container)).toBe("Distal");

		fireEvent.submit(element(container, "form"));
		expect(onAddFinding.mock.calls).toEqual([
			[{ code: "caries", toothId: "26", surfaces: ["distal"] }],
		]);
		expect(onSelectedSurfacesChange.mock.calls.at(-1)).toEqual([[]]);
	});

	it("is read-only when disabled and resets the choice when the tooth changes", () => {
		const disabled = inspector({ disabled: true });
		expect(disabled.container.querySelector("form")).toBeNull();
		expect(
			disabled.container.querySelector(".odontogram-inspector__remove"),
		).toBeNull();
		disabled.unmount();

		const { container, rerender } = inspector();
		fireEvent.click(guideSurface(container, "distal"));
		rerender(<ToothInspector toothId="26" findings={findings} />);
		expect(chosenText(container)).toBe("Choose the surfaces on the diagram.");
	});
});

describe("ToothInspector (React)", () => {
	it("accepts IDs in the legacy format", () => {
		const { container } = render(
			<ToothInspector
				toothId="teeth-36"
				findings={[{ code: "crown", teeth: ["teeth-36"] }]}
				toothStates={{ "teeth-36": "implant" }}
			/>,
		);

		expect(element(container, "section")).toHaveAttribute(
			"data-tooth-id",
			"36",
		);
		expect(
			element(container, "[data-inspector-tooth-finding]"),
		).toHaveTextContent("Corona definitiva");
		expect(element(container, ".odontogram-inspector__state").textContent).toBe(
			"Implant",
		);
	});

	it("records findings with the chart, sharing the chosen surfaces", () => {
		function Host() {
			const [list, setList] = useState<OdontogramFinding[]>([]);
			const [surfaces, setSurfaces] = useState<
				Partial<Record<string, ToothSurface[]>>
			>({});
			return (
				<>
					<Odontogram
						idFormat="fdi"
						showSurfaces={true}
						findings={list}
						surfaces={surfaces}
						onSurfacesChange={setSurfaces}
					/>
					<ToothInspector
						toothId="16"
						findings={list}
						selectedSurfaces={surfaces["16"] ?? []}
						onSelectedSurfacesChange={(next) =>
							setSurfaces({ ...surfaces, 16: next })
						}
						onAddFinding={(input) => setList(addFinding(list, input))}
					/>
				</>
			);
		}
		const { container } = render(<Host />);

		// A surface chosen on the chart is chosen in the panel.
		fireEvent.click(
			element(container, '[data-surface-tooth="16"][data-surface="occlusal"]'),
		);
		expect(chosenText(container)).toBe("Occlusal");

		fireEvent.submit(element(container, "form"));
		expect(
			container.querySelector('.odontogram__findings [data-teeth="16"]'),
		).not.toBeNull();
		expect(
			element(container, '[data-inspector-surface="occlusal"]'),
		).toHaveTextContent("Lesión de caries dental");
		// The choice is cleared on the chart too.
		expect(
			element(container, '[data-surface-tooth="16"][data-surface="occlusal"]'),
		).toHaveAttribute("aria-checked", "false");
	});

	it("names the remove buttons", () => {
		inspector();

		expect(
			screen.getByRole("button", {
				name: "Remove: Lesión de caries dental, Mesial",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Remove: Tratamiento de conductos" }),
		).toBeInTheDocument();
	});
});

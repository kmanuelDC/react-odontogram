// Ported from vue-odontogram: tests/tooth-states.test.ts (the `toothStates
// prop` block; the mark geometry is in packages/odontogram-core/tests/tooth-states.test.ts).
// `v-model` maps to `value` + `onChange` with idFormat="fdi", the `tooltip`
// slot to `renderTooltip`, and `tooth-click` to `onChange` (React has no
// separate click event yet).
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import type { OdontogramProps, ToothDetail } from "../src/type";

const states = {
	18: "extracted",
	28: "missing",
	36: "implant",
	48: "unerupted",
} as const;

const chart = (props: OdontogramProps = {}) =>
	render(<Odontogram idFormat="fdi" {...props} />);

const toothById = (container: HTMLElement, id: string) => {
	const tooth = container.querySelector<SVGGElement>(`[data-tooth-id="${id}"]`);
	if (!tooth) {
		throw new Error(`Tooth ${id} is not drawn`);
	}
	return tooth;
};
const paths = (tooth: Element) => [...tooth.querySelectorAll("path")];

describe("toothStates prop", () => {
	it("renders every tooth as present by default", () => {
		const { container } = chart();
		const teeth = [...container.querySelectorAll("[data-tooth-state]")];

		expect(teeth).toHaveLength(32);
		expect(
			teeth.every(
				(tooth) => tooth.getAttribute("data-tooth-state") === "present",
			),
		).toBe(true);
		expect(container.querySelector(".odontogram__state-marks")).toBeNull();
	});

	it("draws absent teeth as a dashed outline without crown details", () => {
		const { container } = chart({ toothStates: states });
		const extracted = toothById(container, "18");
		const present = toothById(container, "17");

		expect(extracted).toHaveClass(
			"odontogram-tooth--absent",
			"odontogram-tooth--extracted",
		);
		expect(extracted).toHaveAttribute("data-tooth-state", "extracted");
		expect(paths(extracted)[0]).toHaveAttribute("stroke-dasharray", "4 3");
		expect(paths(extracted)).toHaveLength(2);
		expect(paths(present).length).toBeGreaterThan(2);
		expect(toothById(container, "28")).toHaveClass("odontogram-tooth--missing");
		expect(toothById(container, "48")).toHaveClass(
			"odontogram-tooth--unerupted",
		);
		expect(toothById(container, "48")).not.toHaveClass(
			"odontogram-tooth--absent",
		);
	});

	it("keeps the 0.5.x class names of every tooth", () => {
		const { container } = chart({ toothStates: states, value: ["18"] });

		expect(toothById(container, "18")).toHaveClass("teeth-18", "selected");
		expect(toothById(container, "17").getAttribute("class")).toBe("teeth-17 ");
	});

	it("draws the cross and implant marks over their teeth", () => {
		const { container } = chart({ toothStates: states });
		const marks = container.querySelector(".odontogram__state-marks");
		const markFor = (id: string) =>
			marks?.querySelector(`[data-mark-for="${id}"]`);

		expect(marks).toHaveAttribute("aria-hidden", "true");
		expect(markFor("18")).toHaveClass("odontogram-state-mark--cross");
		expect(markFor("18")?.querySelectorAll("line")).toHaveLength(2);
		expect(markFor("36")).toHaveClass("odontogram-state-mark--implant");
		expect(markFor("28")).toBeNull();
	});

	it("draws the marks after the teeth, so they stay on top", () => {
		const { container } = chart({ toothStates: states });
		const svg = container.querySelector("svg");

		expect(svg?.lastElementChild).toHaveClass("odontogram__state-marks");
	});

	it("adds the state to the accessible name", () => {
		chart({
			toothStates: states,
			labels: { tooth: "Pieza", states: { extracted: "Extraída" } },
		});

		expect(
			screen.getByRole("option", { name: "Pieza 18, Extraída" }),
		).toHaveAttribute("data-tooth-id", "18");
		expect(
			screen.getByRole("option", { name: "Pieza 28, Missing" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Pieza 17" }),
		).toBeInTheDocument();
	});

	it("does not change selection, events or keyboard access", () => {
		const onChange = vi.fn();
		const { container } = chart({
			toothStates: states,
			value: ["18"],
			onChange,
		});
		const extracted = toothById(container, "18");

		expect(extracted).toHaveAttribute("role", "option");
		expect(extracted).toHaveAttribute("aria-selected", "true");
		expect(extracted).toHaveClass("selected");
		expect(extracted).toHaveAttribute("tabindex", "0");

		fireEvent.click(toothById(container, "28"));
		expect(
			(onChange.mock.calls[0][0] as ToothDetail[]).map(({ id }) => id),
		).toEqual(["18", "28"]);
	});

	it("does not fill absent teeth with their condition color", () => {
		const { container } = chart({
			toothStates: { 18: "missing" },
			conditions: [
				{
					label: "x",
					teeth: ["18", "17"],
					fillColor: "#f00",
					outlineColor: "#900",
				},
			],
		});

		expect(
			toothById(container, "18").querySelector('path[data-colored="true"]'),
		).toBeNull();
		expect(
			toothById(container, "17").querySelector('path[data-colored="true"]'),
		).not.toBeNull();
	});

	it("shows the state in the tooltip only when the tooth is not present", () => {
		const { container } = chart({ toothStates: states });

		fireEvent.mouseEnter(toothById(container, "36"));
		expect(screen.getByRole("tooltip")).toHaveTextContent("State: Implant");

		fireEvent.mouseLeave(toothById(container, "36"));
		fireEvent.mouseEnter(toothById(container, "35"));
		expect(screen.getByRole("tooltip")).not.toHaveTextContent("State:");
	});

	it("passes the state to renderTooltip", () => {
		const { container } = chart({
			toothStates: states,
			renderTooltip: ({ tooth, state }) => `${tooth.id}=${state}`,
		});

		fireEvent.mouseEnter(toothById(container, "28"));
		expect(screen.getByRole("tooltip").textContent).toBe("28=missing");
	});

	it("lists the visible states in the legend, in a stable order", () => {
		const { container } = chart({
			showLabels: true,
			toothStates: { 48: "unerupted", 18: "extracted", 11: "present" },
			labels: { states: { unerupted: "No erupcionada" } },
		});
		const items = [
			...container.querySelectorAll(
				".odontogram-condition-labels__item[data-state]",
			),
		];

		expect(items.map((item) => item.getAttribute("data-state"))).toEqual([
			"extracted",
			"unerupted",
		]);
		expect(items[1].textContent).toBe("No erupcionada");
	});

	it("shows the legend for states even without conditions", () => {
		const { container } = chart({
			showLabels: true,
			toothStates: { 18: "missing" },
		});

		expect(
			container.querySelector(".odontogram-condition-labels"),
		).not.toBeNull();
	});

	it("leaves the marks and legend of the hidden arch out", () => {
		const { container } = chart({
			showHalf: "upper",
			showLabels: true,
			toothStates: states,
		});

		expect(container.querySelector('[data-mark-for="36"]')).toBeNull();
		expect(container.querySelector('[data-mark-for="18"]')).not.toBeNull();
		expect(
			[...container.querySelectorAll("[data-state]")].map((item) =>
				item.getAttribute("data-state"),
			),
		).toEqual(["missing", "extracted"]);
	});
});

describe("toothStates (React)", () => {
	it("accepts tooth IDs in the legacy format", () => {
		const { container } = chart({
			toothStates: { "teeth-18": "extracted", "teeth-36": "implant" },
		});

		expect(toothById(container, "18")).toHaveAttribute(
			"data-tooth-state",
			"extracted",
		);
		expect(container.querySelector('[data-mark-for="36"]')).not.toBeNull();
	});

	it("marks primary and mixed teeth", () => {
		const { container } = chart({
			dentition: "mixed",
			toothStates: { 55: "extracted", 16: "unerupted" },
		});

		expect(container.querySelector('[data-mark-for="55"]')).toHaveClass(
			"odontogram-state-mark--cross",
		);
		expect(toothById(container, "16")).toHaveClass(
			"odontogram-tooth--unerupted",
		);
	});

	it("leaves out the marks of teeth not listed in `teeth`", () => {
		const { container } = chart({
			dentition: "mixed",
			teeth: ["11", "21"],
			toothStates: { 18: "extracted", 11: "implant" },
		});

		expect(container.querySelector('[data-mark-for="18"]')).toBeNull();
		expect(container.querySelector('[data-mark-for="11"]')).not.toBeNull();
	});

	it("keeps disabled teeth without an accessible name", () => {
		const { container } = chart({ toothStates: states, disabled: true });

		expect(toothById(container, "18")).not.toHaveAttribute("aria-label");
		expect(toothById(container, "18")).toHaveClass(
			"odontogram-tooth--extracted",
		);
	});
});

// React-only cases of the legend and the tooltip placement, found by the
// coverage report of R17.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Odontogram from "../src/Odontogram";
import type { Placement } from "../src/type";

describe("legend", () => {
	it("renders nothing with showLabels and nothing to explain", () => {
		render(<Odontogram showLabels={true} />);

		expect(screen.queryByRole("list")).toBeNull();
	});

	it("draws an icon per state: dashed for absent teeth, cross, implant", () => {
		const { container } = render(
			<Odontogram
				showLabels={true}
				toothStates={{
					18: "missing",
					28: "extracted",
					36: "implant",
					48: "unerupted",
				}}
			/>,
		);
		const icon = (state: string) =>
			container.querySelector(`li[data-state="${state}"] svg`);
		const tooth = (state: string) =>
			icon(state)?.querySelector(".odontogram-condition-labels__icon-tooth");

		expect(icon("missing")?.getAttribute("aria-hidden")).toBe("true");
		expect(tooth("missing")).toHaveAttribute("stroke-dasharray", "2.5 2");
		expect(tooth("extracted")).toHaveAttribute("stroke-dasharray", "2.5 2");
		expect(tooth("unerupted")).not.toHaveAttribute("stroke-dasharray");
		expect(
			icon("extracted")?.querySelectorAll(".odontogram-state-mark--cross line"),
		).toHaveLength(2);
		expect(
			icon("implant")?.querySelector(".odontogram-state-mark--implant rect"),
		).not.toBeNull();
		expect(icon("unerupted")?.querySelector("g")).toBeNull();
	});
});

describe("tooltip placement", () => {
	it("falls back to the right for an unknown placement", () => {
		render(<Odontogram tooltip={{ placement: "middle" as Placement }} />);

		fireEvent.mouseEnter(screen.getByRole("option", { name: "Tooth 11" }));
		expect(screen.getByRole("tooltip")).toHaveTextContent("Tooth: 11");
	});
});

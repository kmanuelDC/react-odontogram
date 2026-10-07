// Ported from vue-odontogram: tests/Odontogram-layout.test.ts. `modelValue`
// maps to `value` with idFormat="fdi" and `setProps` to `rerender`.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Odontogram from "../src/Odontogram";

const quadrantTransform = (name: string) =>
	screen
		.getByRole("option", { name })
		.closest("g:not([data-tooth-id])")
		?.getAttribute("transform");

describe("Odontogram layouts", () => {
	it("uses the arch layout by default", () => {
		const { container } = render(<Odontogram />);

		expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
			"0 0 409 694",
		);
	});

	it("renders 32 FDI teeth with the original horizontal transforms", () => {
		const { container } = render(<Odontogram layout="horizontal" />);

		expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
			"0 0 900 150",
		);
		expect(screen.getAllByRole("option")).toHaveLength(32);
		expect(quadrantTransform("Tooth 11")).toBe("");
		expect(quadrantTransform("Tooth 21")).toBe(
			"translate(840, 0) scale(-1, 1) translate(-55,0)",
		);
		expect(quadrantTransform("Tooth 41")).toBe(
			"scale(1, -1) translate(0, -150)",
		);
		expect(quadrantTransform("Tooth 31")).toBe(
			"translate(840, 0) scale(-1, -1) translate(-55,-150)",
		);
	});

	it("preserves the controlled selection when switching layouts", () => {
		const { rerender } = render(<Odontogram idFormat="fdi" value={["11"]} />);

		expect(screen.getByRole("option", { name: "Tooth 11" })).toHaveAttribute(
			"aria-selected",
			"true",
		);

		rerender(<Odontogram idFormat="fdi" value={["11"]} layout="horizontal" />);

		expect(screen.getByRole("option", { name: "Tooth 11" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});
});

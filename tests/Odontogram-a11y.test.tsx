import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import Odontogram from "../src/Odontogram";
import type { OdontogramProps } from "../src/type";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function violations(container: HTMLElement) {
	const result = await axe.run(container, {
		runOnly: { type: "tag", values: WCAG },
		// jsdom has no layout or canvas, so contrast cannot be measured here.
		rules: { "color-contrast": { enabled: false } },
	});
	return result.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`);
}

const cases: [string, OdontogramProps][] = [
	["interactive, surfaces as checkboxes", { showSurfaces: true }],
	[
		"interactive, surfaces with a menu",
		{ showSurfaces: true, renderSurfaceMenu: () => <p>menu</p> },
	],
	["interactive, single select", { showSurfaces: true, singleSelect: true }],
	["read-only", { showSurfaces: true, readOnly: true }],
];

describe("Odontogram accessibility (axe)", () => {
	it.each(cases)("%s has no WCAG 2.1 A/AA violations", async (_, props) => {
		const { container } = render(<Odontogram {...props} />);
		expect(await violations(container)).toEqual([]);
	});

	it("has no violations with the surface menu open", async () => {
		const { container } = render(
			<Odontogram showSurfaces={true} renderSurfaceMenu={() => <p>menu</p>} />,
		);
		const surface = container.querySelector("[data-surface]");
		if (!surface) {
			throw new Error("no surface drawn");
		}
		fireEvent.click(surface);
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(await violations(container)).toEqual([]);
	});

	it("keeps the tooth listbox inside a labelled group", () => {
		render(<Odontogram showSurfaces={true} />);
		const root = screen.getByRole("group", { name: "Odontogram" });
		expect(root).not.toHaveAttribute("aria-multiselectable");
		const listbox = screen.getByRole("listbox", { name: "Odontogram" });
		expect(listbox).toHaveAttribute("aria-multiselectable", "true");
		expect(root).toContainElement(listbox);
		expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
	});
});

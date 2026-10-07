// R14: theme variables. The vue-odontogram variables are the main API; the
// 0.5.x ones (`--base-blue`, `--light-blue`, `--dark-blue`) and the props
// `theme`, `colors`, `selectedColor` and `hoverColor` are shortcuts.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Odontogram from "../src/Odontogram";
import { getThemeVars } from "../src/utils";

const styles = readFileSync(resolve(__dirname, "../src/styles.css"), "utf8");
/** A 0.5.x variable used in a rule. */
const legacyVar = /var\(--(dark|base|light)-blue\)/g;
/** The first variable of a fallback chain. */
const chainStart = /^var\(--odontogram-/;
/** The stylesheet with the formatter's line breaks inside `var()` removed. */
const compactStyles = styles
	.replace(/\s+/g, " ")
	.replace(/\( /g, "(")
	.replace(/ \)/g, ")");

const container = (element: HTMLElement) => {
	const chart = element.querySelector<HTMLElement>("div.Odontogram");
	if (!chart) {
		throw new Error("The chart is not rendered");
	}
	return chart;
};
const cssVar = (element: HTMLElement, name: string) =>
	container(element).style.getPropertyValue(name);

describe("theme props", () => {
	it("writes the light 0.5.x colors by default", () => {
		const { container: root } = render(<Odontogram />);

		expect(cssVar(root, "--dark-blue")).toBe("#3e5edc");
		expect(cssVar(root, "--base-blue")).toBe("#8a98be");
		expect(cssVar(root, "--light-blue")).toBe("#c6ccf8");
		expect(cssVar(root, "--odontogram-selected-color")).toBe("");
	});

	it("writes the dark colors and class with theme='dark'", () => {
		const { container: root } = render(<Odontogram theme="dark" />);

		expect(container(root)).toHaveClass("dark-theme");
		expect(cssVar(root, "--dark-blue")).toBe("#aab6ff");
	});

	it("maps the 0.5.x and vue-odontogram keys of colors", () => {
		const { container: root } = render(
			<Odontogram
				colors={{
					baseBlue: "#111111",
					stroke: "#222222",
					selected: "#333333",
					hover: "#444444",
					selectedStroke: "#555555",
					accent: "#666666",
				}}
			/>,
		);

		expect(cssVar(root, "--base-blue")).toBe("#111111");
		expect(cssVar(root, "--odontogram-stroke-color")).toBe("#222222");
		expect(cssVar(root, "--odontogram-selected-color")).toBe("#333333");
		expect(cssVar(root, "--odontogram-hover-color")).toBe("#444444");
		expect(cssVar(root, "--odontogram-selected-stroke-color")).toBe("#555555");
		expect(cssVar(root, "--odontogram-accent-color")).toBe("#666666");
	});

	it("turns selectedColor and hoverColor into the vue-odontogram variables", () => {
		const { container: root } = render(
			<Odontogram selectedColor="#ff0000" hoverColor="#00ff00" />,
		);

		expect(cssVar(root, "--odontogram-selected-color")).toBe("#ff0000");
		expect(cssVar(root, "--odontogram-hover-color")).toBe("#00ff00");
	});

	it("lets colors win over the shortcut props", () => {
		expect(
			getThemeVars({
				theme: "light",
				colors: { selected: "#123456", hover: undefined },
				selectedColor: "#ff0000",
				hoverColor: "#00ff00",
			}),
		).toMatchObject({
			"--odontogram-selected-color": "#123456",
			"--odontogram-hover-color": "#00ff00",
		});
	});

	it("keeps the user styles after the theme variables", () => {
		const { container: root } = render(
			<Odontogram
				selectedColor="#ff0000"
				styles={{ "--odontogram-selected-color": "#0000ff" } as never}
			/>,
		);

		expect(cssVar(root, "--odontogram-selected-color")).toBe("#0000ff");
	});
});

describe("styles.css", () => {
	it("only uses the 0.5.x variables as fallbacks of the vue-odontogram ones", () => {
		const uses = [...compactStyles.matchAll(legacyVar)];

		expect(uses.length).toBeGreaterThan(0);
		for (const use of uses) {
			const before = compactStyles.slice(0, use.index);
			// Each one closes a chain that starts with an --odontogram-* variable.
			expect(before.endsWith(", "), use[0]).toBe(true);
			expect(before.slice(before.lastIndexOf("var(--")), use[0]).toMatch(
				chainStart,
			);
		}
	});

	it("colors the teeth through the vue-odontogram variables", () => {
		expect(compactStyles).toContain(
			"color: var(--odontogram-stroke-color, var(--base-blue))",
		);
		expect(compactStyles).toContain(
			"fill: var(--odontogram-selected-color, var(--light-blue))",
		);
		expect(compactStyles).toContain(
			"fill: var(--odontogram-hover-color, var(--odontogram-selected-color, var(--light-blue)))",
		);
		expect(compactStyles).toContain("var(--odontogram-selected-stroke-color,");
		expect(compactStyles).toContain("var(--odontogram-focus-outline-color,");
	});

	it("never sets the surface and finding variables itself", () => {
		// The inner <svg> is `.Odontogram` too: a variable set on `.Odontogram`
		// would hide the value the app sets on the container or an ancestor.
		for (const name of [
			"--odontogram-surface-fill",
			"--odontogram-surface-letter-color",
			"--odontogram-finding-good-color",
			"--odontogram-finding-bad-color",
		]) {
			expect(compactStyles, name).not.toContain(`${name}:`);
		}
	});

	it("draws the app's surface fill inside the chart", () => {
		const { container: root } = render(
			<Odontogram
				showSurfaces={true}
				styles={{ "--odontogram-surface-fill": "#f0fdfa" } as never}
			/>,
		);

		expect(cssVar(root, "--odontogram-surface-fill")).toBe("#f0fdfa");
		expect(
			root
				.querySelector("svg")
				?.style.getPropertyValue("--odontogram-surface-fill"),
		).toBe("");
	});

	it("styles every component of the library", () => {
		for (const selector of [
			".odontogram__state-marks",
			".odontogram-surface",
			".odontogram-finding__area",
			".odontogram-surface-menu",
			".odontogram-surface-guide",
			".odontogram-inspector",
			".odontogram__overlay",
			".odontogram-tooltip__summary",
		]) {
			expect(styles, selector).toContain(selector);
		}
	});
});

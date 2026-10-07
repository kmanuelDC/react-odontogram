import { describe, expect, it } from "vitest";
import {
	isLayoutSupported,
	resolveDentitionLayout,
	supportedLayoutsByDentition,
} from "../src/utils/dentition-layout";

describe("dentition and layout capabilities", () => {
	it("declares only datasets that currently exist", () => {
		expect(supportedLayoutsByDentition).toEqual({
			permanent: ["arch", "horizontal"],
			primary: ["arch", "horizontal"],
			mixed: ["arch", "horizontal"],
		});
		expect(isLayoutSupported("permanent", "horizontal")).toBe(true);
		expect(isLayoutSupported("primary", "horizontal")).toBe(true);
		expect(isLayoutSupported("mixed", "arch")).toBe(true);
	});

	it("keeps every supported selection without fallback", () => {
		expect(resolveDentitionLayout("permanent", "horizontal")).toEqual({
			requested: { dentition: "permanent", layout: "horizontal" },
			resolved: { dentition: "permanent", layout: "horizontal" },
			fellBack: false,
		});
		expect(resolveDentitionLayout("primary", "horizontal")).toEqual({
			requested: { dentition: "primary", layout: "horizontal" },
			resolved: { dentition: "primary", layout: "horizontal" },
			fellBack: false,
		});
	});
});

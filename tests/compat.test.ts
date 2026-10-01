import { afterEach, describe, expect, it, vi } from "vitest";
import {
	buildToothDetail,
	formatLegacyNumber,
	formatLegacyPalmer,
	formatPublicId,
	normalizeConditions,
	normalizeLayout,
	resetDeprecationWarnings,
	resolveDisabled,
	toFdiId,
	toLegacyId,
	warnDeprecated,
} from "../src/compat";
import { teethPaths } from "./fixtures/legacy-data";
import { legacyNotations } from "./fixtures/legacy-notations";

const permanentIds = [1, 2, 3, 4].flatMap((quadrant) =>
	teethPaths.map(({ name }) => `${quadrant}${name}`),
);

describe("tooth IDs", () => {
	it("reads both formats as FDI", () => {
		expect(toFdiId("teeth-11")).toBe("11");
		expect(toFdiId("11")).toBe("11");
	});

	it("writes the legacy format once", () => {
		expect(toLegacyId("48")).toBe("teeth-48");
		expect(toLegacyId("teeth-48")).toBe("teeth-48");
	});

	it("formats public IDs by idFormat", () => {
		expect(formatPublicId("26", "legacy")).toBe("teeth-26");
		expect(formatPublicId("teeth-26", "fdi")).toBe("26");
	});
});

describe("normalizeLayout", () => {
	it.each([
		["circle", "arch"],
		["square", "horizontal"],
		["arch", "arch"],
		["horizontal", "horizontal"],
		[undefined, "arch"],
	] as const)("maps %s to %s", (layout, expected) => {
		expect(normalizeLayout(layout)).toBe(expected);
	});
});

describe("normalizeConditions", () => {
	const group = {
		label: "Caries",
		teeth: ["teeth-16", "26"],
		fillColor: "#f00",
		outlineColor: "#900",
	};

	it("prefers conditions and stores FDI IDs", () => {
		expect(normalizeConditions([group], [])).toEqual([
			{ ...group, teeth: ["16", "26"] },
		]);
	});

	it("falls back to teethConditions", () => {
		expect(normalizeConditions(undefined, [group])?.[0].teeth).toEqual([
			"16",
			"26",
		]);
		expect(normalizeConditions(undefined, undefined)).toBeUndefined();
	});
});

describe("resolveDisabled", () => {
	it("prefers disabled and accepts readOnly as alias", () => {
		expect(resolveDisabled(undefined, undefined)).toBe(false);
		expect(resolveDisabled(undefined, true)).toBe(true);
		expect(resolveDisabled(false, true)).toBe(false);
		expect(resolveDisabled(true, false)).toBe(true);
	});
});

describe("0.5.x notation parity", () => {
	it("covers every permanent tooth", () => {
		expect(legacyNotations.map(([fdi]) => fdi)).toEqual(permanentIds);
	});

	it.each(legacyNotations)(
		"numbers %s exactly like 0.5.8",
		(fdi, universal, palmer) => {
			expect(formatLegacyNumber(fdi, "FDI")).toBe(fdi);
			expect(formatLegacyNumber(fdi, "Universal")).toBe(universal);
			expect(formatLegacyNumber(fdi, "Palmer")).toBe(palmer);
		},
	);

	it("keeps the 0.5.x Palmer format", () => {
		expect(formatLegacyPalmer("11")).toBe("1UR");
		expect(formatLegacyPalmer("28")).toBe("8UL");
		expect(formatLegacyPalmer("33")).toBe("3LL");
		expect(formatLegacyPalmer("45")).toBe("5LR");
	});
});

describe("buildToothDetail", () => {
	it("builds the 0.5.x payload", () => {
		expect(buildToothDetail("teeth-48", "legacy")).toEqual({
			id: "teeth-48",
			notations: { fdi: "48", universal: "32", palmer: "8LR" },
			type: "Third Molar",
		});
	});

	it("uses the tooth type of every permanent position", () => {
		for (const { name, type } of teethPaths) {
			expect(buildToothDetail(`2${name}`, "fdi")).toMatchObject({
				id: `2${name}`,
				type,
			});
		}
	});
});

describe("warnDeprecated", () => {
	afterEach(() => {
		resetDeprecationWarnings();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it("warns once per key", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		warnDeprecated("a", "first");
		warnDeprecated("a", "again");
		warnDeprecated("b", "other");

		expect(warn).toHaveBeenCalledTimes(2);
		expect(warn).toHaveBeenCalledWith("[react-odontogram] first");
	});

	it("stays silent in production", () => {
		vi.stubEnv("NODE_ENV", "production");
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		warnDeprecated("a", "first");

		expect(warn).not.toHaveBeenCalled();
	});
});

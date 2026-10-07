import { describe, expect, it } from "vitest";
import {
	buildToothId,
	formatToothNumber,
	getPalmerQuadrant,
} from "../src/utils/notation";
import { getQuadrant } from "../src/utils/quadrants";

describe("getQuadrant", () => {
	it.each([
		["permanent", "upper", "right", 1],
		["permanent", "upper", "left", 2],
		["permanent", "lower", "left", 3],
		["permanent", "lower", "right", 4],
		["primary", "upper", "right", 5],
		["primary", "upper", "left", 6],
		["primary", "lower", "left", 7],
		["primary", "lower", "right", 8],
	] as const)(
		"%s %s %s belongs to quadrant %i",
		(dentition, arch, side, expected) => {
			expect(getQuadrant(dentition, arch, side)).toBe(expected);
		},
	);
});

describe("buildToothId", () => {
	it("builds every permanent FDI identifier", () => {
		const identifiers = [1, 2, 3, 4].flatMap((quadrant) =>
			Array.from({ length: 8 }, (_, index) =>
				buildToothId("permanent", quadrant, index + 1, "FDI"),
			),
		);

		expect(identifiers).toEqual([
			"11",
			"12",
			"13",
			"14",
			"15",
			"16",
			"17",
			"18",
			"21",
			"22",
			"23",
			"24",
			"25",
			"26",
			"27",
			"28",
			"31",
			"32",
			"33",
			"34",
			"35",
			"36",
			"37",
			"38",
			"41",
			"42",
			"43",
			"44",
			"45",
			"46",
			"47",
			"48",
		]);
	});

	it("builds every primary FDI identifier", () => {
		const identifiers = [5, 6, 7, 8].flatMap((quadrant) =>
			Array.from({ length: 5 }, (_, index) =>
				buildToothId("primary", quadrant, index + 1, "FDI"),
			),
		);

		expect(identifiers).toEqual([
			"51",
			"52",
			"53",
			"54",
			"55",
			"61",
			"62",
			"63",
			"64",
			"65",
			"71",
			"72",
			"73",
			"74",
			"75",
			"81",
			"82",
			"83",
			"84",
			"85",
		]);
	});

	it("rejects invalid quadrant and position combinations", () => {
		expect(() => buildToothId("permanent", 5, 1, "FDI")).toThrow(RangeError);
		expect(() => buildToothId("primary", 5, 6, "FDI")).toThrow(RangeError);
	});

	it("always builds FDI IDs", () => {
		expect(buildToothId("permanent", 1, 1)).toBe("11");
		expect(() => buildToothId("permanent", 1, 1, "Universal")).toThrow(
			"Tooth IDs are always FDI; format Universal numbers with formatToothNumber.",
		);
	});
});

const permanentIds = [1, 2, 3, 4].flatMap((quadrant) =>
	Array.from({ length: 8 }, (_, index) =>
		buildToothId("permanent", quadrant, index + 1),
	),
);
const primaryIds = [5, 6, 7, 8].flatMap((quadrant) =>
	Array.from({ length: 5 }, (_, index) =>
		buildToothId("primary", quadrant, index + 1),
	),
);

describe("formatToothNumber", () => {
	it("keeps FDI IDs as they are", () => {
		expect(formatToothNumber("11", "FDI")).toBe("11");
		expect(formatToothNumber("85", "FDI", "text")).toBe("85");
	});

	it.each([
		["18", "1"],
		["11", "8"],
		["21", "9"],
		["28", "16"],
		["38", "17"],
		["31", "24"],
		["41", "25"],
		["48", "32"],
	])("writes permanent %s as Universal %s", (id, expected) => {
		expect(formatToothNumber(id, "Universal")).toBe(expected);
	});

	it.each([
		["55", "A"],
		["51", "E"],
		["61", "F"],
		["65", "J"],
		["75", "K"],
		["71", "O"],
		["81", "P"],
		["85", "T"],
	])("writes primary %s as Universal %s", (id, expected) => {
		expect(formatToothNumber(id, "Universal")).toBe(expected);
	});

	it("gives every tooth a distinct Universal number", () => {
		const permanent = permanentIds.map((id) =>
			formatToothNumber(id, "Universal"),
		);
		const primary = primaryIds.map((id) => formatToothNumber(id, "Universal"));

		expect(new Set(permanent)).toEqual(
			new Set(Array.from({ length: 32 }, (_, index) => String(index + 1))),
		);
		expect(new Set(primary)).toEqual(new Set("ABCDEFGHIJKLMNOPQRST".split("")));
	});

	it.each([
		["16", "6┘", "UR6"],
		["21", "└1", "UL1"],
		["34", "┌4", "LL4"],
		["48", "8┐", "LR8"],
		["55", "E┘", "URE"],
		["61", "└A", "ULA"],
		["73", "┌C", "LLC"],
		["84", "D┐", "LRD"],
	])("writes %s in Palmer as %s (%s)", (id, symbol, text) => {
		expect(formatToothNumber(id, "Palmer")).toBe(symbol);
		expect(formatToothNumber(id, "Palmer", "text")).toBe(text);
	});

	it("maps quadrants for Palmer", () => {
		expect(
			["11", "21", "31", "41", "51", "61", "71", "81"].map(getPalmerQuadrant),
		).toEqual([
			"upper-right",
			"upper-left",
			"lower-left",
			"lower-right",
			"upper-right",
			"upper-left",
			"lower-left",
			"lower-right",
		]);
	});

	it("rejects IDs that are not FDI teeth", () => {
		for (const id of ["19", "56", "91", "1", "A"]) {
			expect(() => formatToothNumber(id, "Universal"), id).toThrow(RangeError);
		}
	});
});

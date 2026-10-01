/**
 * Universal and Palmer numbers of every permanent tooth as react-odontogram
 * 0.5.8 wrote them (`convertFDIToNotation`, removed in R03). Frozen output:
 * the compatibility layer must keep producing exactly these values.
 */
export const legacyNotations: readonly [
	fdi: string,
	universal: string,
	palmer: string,
][] = [
	["11", "8", "1UR"],
	["12", "7", "2UR"],
	["13", "6", "3UR"],
	["14", "5", "4UR"],
	["15", "4", "5UR"],
	["16", "3", "6UR"],
	["17", "2", "7UR"],
	["18", "1", "8UR"],
	["21", "9", "1UL"],
	["22", "10", "2UL"],
	["23", "11", "3UL"],
	["24", "12", "4UL"],
	["25", "13", "5UL"],
	["26", "14", "6UL"],
	["27", "15", "7UL"],
	["28", "16", "8UL"],
	["31", "24", "1LL"],
	["32", "23", "2LL"],
	["33", "22", "3LL"],
	["34", "21", "4LL"],
	["35", "20", "5LL"],
	["36", "19", "6LL"],
	["37", "18", "7LL"],
	["38", "17", "8LL"],
	["41", "25", "1LR"],
	["42", "26", "2LR"],
	["43", "27", "3LR"],
	["44", "28", "4LR"],
	["45", "29", "5LR"],
	["46", "30", "6LR"],
	["47", "31", "7LR"],
	["48", "32", "8LR"],
];

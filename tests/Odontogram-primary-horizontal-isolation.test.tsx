// Ported from vue-odontogram Odontogram-primary-horizontal-isolation.test.ts.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/core/data/permanent", () => ({ permanentTeethPaths: [] }));
vi.mock("../src/core/data/permanent-horizontal", () => ({
	permanentHorizontalTeethPaths: [],
}));
vi.mock("../src/core/data/primary", () => ({ primaryTeethPaths: [] }));

import Odontogram from "../src/Odontogram";

describe("primary horizontal dataset isolation", () => {
	it("renders 20 teeth when permanent and primary-arch datasets are unavailable", () => {
		const { container } = render(
			<Odontogram dentition="primary" layout="horizontal" />,
		);

		expect(container.querySelector("svg")).toHaveAttribute(
			"viewBox",
			"0 0 520 180",
		);
		expect(screen.getAllByRole("option")).toHaveLength(20);
		expect(
			screen.getByRole("option", { name: "Tooth 51" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Tooth 85" }),
		).toBeInTheDocument();
	});
});

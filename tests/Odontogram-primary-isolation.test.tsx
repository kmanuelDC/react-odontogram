// Ported from vue-odontogram Odontogram-primary-isolation.test.ts.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/core/data/permanent", () => ({ permanentTeethPaths: [] }));
vi.mock("../src/core/data/permanent-horizontal", () => ({
	permanentHorizontalTeethPaths: [],
}));

import Odontogram from "../src/Odontogram";

describe("primary arch dataset isolation", () => {
	it("really removes the permanent teeth", () => {
		render(<Odontogram />);

		expect(screen.queryAllByRole("option")).toHaveLength(0);
	});

	it("renders its 20 teeth when both permanent datasets are unavailable", () => {
		render(<Odontogram dentition="primary" />);

		expect(screen.getAllByRole("option")).toHaveLength(20);
		expect(
			screen.getByRole("option", { name: "Tooth 51" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Tooth 85" }),
		).toBeInTheDocument();
	});
});

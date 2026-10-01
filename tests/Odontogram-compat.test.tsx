import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Odontogram, { getViewBox } from "../src/Odontogram";
import { resetDeprecationWarnings } from "../src/compat";

const hiddenValue = (container: HTMLElement) =>
	container.querySelector<HTMLInputElement>("input[type='hidden']")?.value;

describe("Odontogram compatibility", () => {
	let warn: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
	});

	afterEach(() => {
		resetDeprecationWarnings();
		vi.restoreAllMocks();
	});

	describe("layout", () => {
		it.each([
			["arch", "circle"],
			["horizontal", "square"],
		] as const)("renders %s like the legacy %s", (layout, legacy) => {
			const current = render(<Odontogram layout={layout} />);
			const currentSvg = current.container.querySelector("svg")?.outerHTML;
			current.unmount();

			const old = render(<Odontogram layout={legacy} />);

			expect(currentSvg).toBe(old.container.querySelector("svg")?.outerHTML);
		});

		it("defaults to arch without warnings", () => {
			const { container } = render(<Odontogram />);

			expect(container.querySelector("svg")).toHaveAttribute(
				"viewBox",
				"0 0 409 694",
			);
			expect(warn).not.toHaveBeenCalled();
		});

		it("warns once about legacy names", () => {
			const { rerender } = render(<Odontogram layout="circle" />);
			rerender(<Odontogram layout="square" />);

			expect(warn).toHaveBeenCalledTimes(1);
			expect(warn).toHaveBeenCalledWith(
				'[react-odontogram] layout="circle" is deprecated; use layout="arch".',
			);
		});

		it("keeps getViewBox working with both names", () => {
			expect(getViewBox("horizontal", "upper")).toBe(
				getViewBox("square", "upper"),
			);
			expect(getViewBox("arch", "lower")).toBe(getViewBox("circle", "lower"));
		});
	});

	describe("conditions", () => {
		const group = {
			label: "Caries",
			fillColor: "#ff0000",
			outlineColor: "#990000",
		};

		it("colors teeth listed in either ID format", () => {
			render(
				<Odontogram conditions={[{ ...group, teeth: ["16", "teeth-26"] }]} />,
			);

			for (const name of ["Tooth 16", "Tooth 26"]) {
				expect(screen.getByRole("option", { name })).toHaveStyle({
					color: "#990000",
				});
			}
			expect(warn).not.toHaveBeenCalled();
		});

		it("still accepts teethConditions, with a warning", () => {
			render(
				<Odontogram
					showLabels={true}
					teethConditions={[{ ...group, teeth: ["teeth-16"] }]}
				/>,
			);

			expect(screen.getByRole("option", { name: "Tooth 16" })).toHaveStyle({
				color: "#990000",
			});
			expect(screen.getByText("Caries")).toBeInTheDocument();
			expect(warn).toHaveBeenCalledWith(
				"[react-odontogram] teethConditions is deprecated; use conditions.",
			);
		});

		it("prefers conditions over teethConditions", () => {
			render(
				<Odontogram
					conditions={[{ ...group, teeth: ["16"] }]}
					teethConditions={[{ ...group, teeth: ["teeth-26"] }]}
				/>,
			);

			expect(screen.getByRole("option", { name: "Tooth 26" })).not.toHaveStyle({
				color: "#990000",
			});
		});
	});

	describe("disabled", () => {
		it("behaves like readOnly", () => {
			const onChange = vi.fn();
			render(<Odontogram disabled={true} onChange={onChange} />);

			expect(screen.getByRole("group", { name: "Odontogram" })).toBeVisible();
			expect(screen.queryAllByRole("option")).toHaveLength(0);
		});

		it("wins over readOnly", () => {
			render(<Odontogram disabled={false} readOnly={true} />);

			expect(screen.getAllByRole("option")).toHaveLength(32);
		});
	});

	describe("idFormat", () => {
		it("returns legacy IDs by default", () => {
			const onChange = vi.fn();
			const { container } = render(
				<Odontogram defaultSelected={["11"]} onChange={onChange} />,
			);

			fireEvent.click(screen.getByRole("option", { name: "Tooth 12" }));

			expect(onChange).toHaveBeenLastCalledWith([
				expect.objectContaining({ id: "teeth-11" }),
				expect.objectContaining({ id: "teeth-12" }),
			]);
			expect(hiddenValue(container)).toBe('["teeth-11","teeth-12"]');
		});

		it("returns plain FDI IDs with idFormat fdi", () => {
			const onChange = vi.fn();
			const { container } = render(
				<Odontogram
					idFormat="fdi"
					defaultSelected={["teeth-11"]}
					onChange={onChange}
				/>,
			);

			fireEvent.click(screen.getByRole("option", { name: "Tooth 12" }));

			expect(onChange).toHaveBeenLastCalledWith([
				{
					id: "11",
					notations: { fdi: "11", universal: "8", palmer: "1UR" },
					type: "Central Incisor",
				},
				expect.objectContaining({ id: "12" }),
			]);
			expect(hiddenValue(container)).toBe('["11","12"]');
		});

		it("keeps the legacy DOM class names in both formats", () => {
			const { container } = render(<Odontogram idFormat="fdi" />);

			expect(container.querySelector("g.teeth-11")).not.toBeNull();
		});
	});
});

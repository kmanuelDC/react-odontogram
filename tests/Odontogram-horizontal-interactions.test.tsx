// Ported from vue-odontogram: tests/Odontogram-horizontal-interactions.test.ts.
// `modelValue` + `update:modelValue` map to `value` + `onChange` with
// idFormat="fdi", and `setProps` to `rerender`.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import type { ToothDetail } from "../src/type";

const tooth = (name: string) => screen.getByRole("option", { name });
const changes = (onChange: ReturnType<typeof vi.fn>) =>
	onChange.mock.calls.map(([details]) =>
		(details as ToothDetail[]).map(({ id }) => id),
	);

describe("horizontal odontogram interactions", () => {
	it("keeps multiple selection when the layout changes", () => {
		const onChange = vi.fn();
		const { rerender } = render(
			<Odontogram idFormat="fdi" onChange={onChange} />,
		);

		fireEvent.click(tooth("Tooth 11"));
		rerender(
			<Odontogram
				idFormat="fdi"
				onChange={onChange}
				value={["11"]}
				layout="horizontal"
			/>,
		);
		fireEvent.click(tooth("Tooth 12"));

		expect(changes(onChange)).toEqual([["11"], ["11", "12"]]);
	});

	it("keeps single-select semantics after switching to horizontal", () => {
		const onChange = vi.fn();
		const props = {
			idFormat: "fdi",
			value: ["11"],
			singleSelect: true,
			onChange,
		} as const;
		const { rerender } = render(<Odontogram {...props} value={["11"]} />);

		rerender(<Odontogram {...props} value={["11"]} layout="horizontal" />);
		fireEvent.click(tooth("Tooth 12"));

		expect(changes(onChange)[0]).toEqual(["12"]);
	});

	it("shows conditions, labels and tooltip data in horizontal layout", () => {
		render(
			<Odontogram
				layout="horizontal"
				showLabels={true}
				conditions={[
					{
						label: "observation",
						teeth: ["16"],
						fillColor: "#fbbf24",
						outlineColor: "#b45309",
					},
				]}
			/>,
		);

		const tooth16 = tooth("Tooth 16");
		fireEvent.mouseEnter(tooth16);

		expect(screen.getByRole("tooltip")).toHaveTextContent("Tooth: 16");
		expect(screen.getByRole("tooltip")).toHaveTextContent(
			"Condition: observation",
		);
		expect(
			screen.getByRole("list", { name: "Tooth condition legend" }),
		).toHaveTextContent("observation");
		expect(tooth16.querySelector('path[data-colored="true"]')).not.toBeNull();

		fireEvent.mouseLeave(tooth16);
		expect(screen.queryByRole("tooltip")).toBeNull();
	});
});

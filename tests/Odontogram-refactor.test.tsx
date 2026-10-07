import {
	type ToothDefinition,
	composeQuadrants,
} from "@kmanueldc/odontogram-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { Tooth } from "../src/Tooth";
import type { ToothDetail } from "../src/type";

const hiddenValue = (container: HTMLElement) =>
	container.querySelector<HTMLInputElement>("input[type='hidden']")?.value;

describe("controlled value", () => {
	it("shows the value and reports changes without applying them", () => {
		const onChange = vi.fn();
		const { container } = render(
			<Odontogram value={["11"]} onChange={onChange} />,
		);

		fireEvent.click(screen.getByRole("option", { name: "Tooth 12" }));

		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ id: "teeth-11" }),
			expect.objectContaining({ id: "teeth-12" }),
		]);
		expect(hiddenValue(container)).toBe('["teeth-11"]');
		expect(screen.getByRole("option", { name: "Tooth 12" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	it("follows a parent that stores the change", () => {
		function Parent() {
			const [value, setValue] = useState<string[]>(["teeth-11"]);
			return (
				<Odontogram
					value={value}
					onChange={(teeth: ToothDetail[]) =>
						setValue(teeth.map(({ id }) => id))
					}
				/>
			);
		}
		const { container } = render(<Parent />);

		fireEvent.click(screen.getByRole("option", { name: "Tooth 12" }));
		fireEvent.click(screen.getByRole("option", { name: "Tooth 11" }));

		expect(hiddenValue(container)).toBe('["teeth-12"]');
	});

	it("accepts values in either ID format", () => {
		const { container } = render(
			<Odontogram value={["teeth-11", "21"]} idFormat="fdi" />,
		);

		expect(hiddenValue(container)).toBe('["11","21"]');
	});

	it("uses defaultValue over defaultSelected", () => {
		const { container } = render(
			<Odontogram defaultValue={["21"]} defaultSelected={["teeth-11"]} />,
		);

		expect(hiddenValue(container)).toBe('["teeth-21"]');
	});
});

describe("StrictMode", () => {
	it("reports each click once", () => {
		const onChange = vi.fn();
		render(
			<StrictMode>
				<Odontogram onChange={onChange} />
			</StrictMode>,
		);

		fireEvent.click(screen.getByRole("option", { name: "Tooth 11" }));
		fireEvent.click(screen.getByRole("option", { name: "Tooth 12" }));

		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onChange).toHaveBeenLastCalledWith([
			expect.objectContaining({ id: "teeth-11" }),
			expect.objectContaining({ id: "teeth-12" }),
		]);
	});
});

describe("Tooth", () => {
	const tooth = composeQuadrants("permanent", "arch")[0].teeth[0]
		.tooth as ToothDefinition;
	const renderTooth = (props: Partial<Parameters<typeof Tooth>[0]>) =>
		render(
			<svg>
				<title>Tooth</title>
				<Tooth tooth={tooth} {...props} />
			</svg>,
		).container.querySelector("g");

	it("keeps the 0.5.x class name and reports the FDI ID", () => {
		const onSelect = vi.fn();
		const group = renderTooth({ onSelect, selected: true });

		expect(group).toHaveClass("teeth-11", "selected");
		expect(group).not.toHaveAttribute("transform");

		fireEvent.click(group as Element);
		expect(onSelect).toHaveBeenCalledWith("11");
	});

	it("applies the shape transform, then the layout transform", () => {
		const group = renderTooth({
			tooth: { ...tooth, shape: { ...tooth.shape, transform: "rotate(5)" } },
			layoutTransform: "translate(2, 0)",
		});

		expect(group).toHaveAttribute("transform", "rotate(5) translate(2, 0)");
	});

	it("is inert when disabled", () => {
		const onSelect = vi.fn();
		const group = renderTooth({ onSelect, disabled: true });

		fireEvent.click(group as Element);
		expect(onSelect).not.toHaveBeenCalled();
		expect(group).not.toHaveAttribute("role");
		expect(group).toHaveAttribute("tabindex", "-1");
	});
});

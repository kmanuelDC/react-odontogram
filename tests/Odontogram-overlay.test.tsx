import {
	type OdontogramLayout,
	getSurfaceDiagrams,
	getToothFrames,
} from "@kmanueldc/odontogram-core";
// Ported from vue-odontogram: the overlay cases of
// tests/Odontogram-api-improvements.test.ts and tests/Odontogram-quick-wins.test.ts,
// and the component case of "curve fairing" in tests/surfaces.test.ts. The
// anchors themselves are in packages/odontogram-core/tests/anchors.test.ts. The `overlay` slot
// maps to `renderOverlay`.
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Odontogram from "../src/Odontogram";
import { getLayoutViewBox, getToothAnchors, parseViewBox } from "../src/index";
import type {
	OdontogramOverlayRenderProps,
	OdontogramProps,
	ToothDetail,
} from "../src/type";

/** FDI IDs of the lower permanent quadrants. */
const lowerQuadrant = /^[34]/;

const numbersOverlay = ({
	anchors,
	viewBox,
	dentition,
	layout,
}: OdontogramOverlayRenderProps) =>
	Object.values(anchors).map((anchor) => (
		<text
			key={anchor.toothId}
			className="tooth-number"
			x={anchor.center.x}
			y={anchor.center.y}
			data-view-box={`${viewBox.width}x${viewBox.height}`}
			data-mode={`${dentition}:${layout}`}
		>
			{anchor.toothId}
		</text>
	));

describe("renderOverlay", () => {
	it("renders inside the SVG with anchors in viewBox coordinates", () => {
		const props: OdontogramProps = {
			dentition: "primary",
			layout: "horizontal",
			renderOverlay: numbersOverlay,
		};
		const { container, rerender } = render(<Odontogram {...props} />);

		const overlay = container.querySelector("svg > g.odontogram__overlay");
		const numbers = [...(overlay?.querySelectorAll("text.tooth-number") ?? [])];
		expect(numbers).toHaveLength(20);

		const number51 = numbers.find((text) => text.textContent === "51");
		const anchor51 = getToothAnchors("primary", "horizontal").find(
			({ toothId }) => toothId === "51",
		);
		expect(Number(number51?.getAttribute("x"))).toBeCloseTo(
			anchor51?.center.x ?? Number.NaN,
			6,
		);
		expect(number51?.getAttribute("data-view-box")).toBe("520x180");
		expect(number51?.getAttribute("data-mode")).toBe("primary:horizontal");

		rerender(<Odontogram {...props} dentition="permanent" />);
		expect(container.querySelectorAll("text.tooth-number")).toHaveLength(32);
	});

	it("does not render an overlay group without renderOverlay", () => {
		const { container } = render(<Odontogram />);

		expect(container.querySelector(".odontogram__overlay")).toBeNull();
	});

	it("gives only the visible anchors", () => {
		const { container } = render(
			<Odontogram
				showHalf="lower"
				renderOverlay={({ anchors }) =>
					Object.values(anchors).map((anchor) => (
						<text key={anchor.toothId} className="anchor-id">
							{anchor.toothId}
						</text>
					))
				}
			/>,
		);
		const ids = [...container.querySelectorAll(".anchor-id")].map(
			(text) => text.textContent ?? "",
		);

		expect(ids).toHaveLength(16);
		expect(ids.every((id) => lowerQuadrant.test(id))).toBe(true);
	});

	it("gives the surface diagrams, faired in the arch layout only", () => {
		const centerOf16 = (layout: OdontogramLayout) => {
			let center: { x: number; y: number } | undefined;
			render(
				<Odontogram
					layout={layout}
					showSurfaces={true}
					renderOverlay={({ surfaceDiagrams }) => {
						center = surfaceDiagrams.find(
							({ toothId }) => toothId === "16",
						)?.center;
						return null;
					}}
				/>,
			);
			return center;
		};
		const framesOf = (layout: OdontogramLayout) =>
			getToothFrames(
				getToothAnchors("permanent", layout),
				getLayoutViewBox("permanent", layout),
				layout,
			);

		expect(centerOf16("arch")).toEqual(
			getSurfaceDiagrams(framesOf("arch"), { fairCurve: true }).diagrams.find(
				({ toothId }) => toothId === "16",
			)?.center,
		);
		expect(centerOf16("horizontal")).toEqual(
			getSurfaceDiagrams(framesOf("horizontal"), {
				alignRows: true,
			}).diagrams.find(({ toothId }) => toothId === "16")?.center,
		);
	});
});

describe("renderOverlay (React)", () => {
	it("gives the rendered viewBox, also the 0.5.x one of half charts", () => {
		const renderOverlay = vi.fn(() => null);
		const { container } = render(
			<Odontogram showHalf="upper" renderOverlay={renderOverlay} />,
		);
		const [props] = renderOverlay.mock.calls.at(-1) as unknown as [
			OdontogramOverlayRenderProps,
		];

		expect(props.viewBox).toEqual(
			parseViewBox(
				container.querySelector("svg")?.getAttribute("viewBox") ?? "",
			),
		);
		expect(props.anchorList.map(({ toothId }) => toothId)).toEqual(
			Object.keys(props.anchors),
		);
		expect(props.layout).toBe("arch");
	});

	it("maps the deprecated layouts", () => {
		const renderOverlay = vi.fn(() => null);
		render(<Odontogram layout="square" renderOverlay={renderOverlay} />);
		const [props] = renderOverlay.mock.calls.at(-1) as unknown as [
			OdontogramOverlayRenderProps,
		];

		expect(props.layout).toBe("horizontal");
	});

	it("draws above the teeth and lets clicks through", () => {
		const onChange = vi.fn();
		const { container } = render(
			<Odontogram
				idFormat="fdi"
				onChange={onChange}
				renderOverlay={({ anchors }) => (
					<circle
						className="mark"
						cx={anchors["11"].center.x}
						cy={anchors["11"].center.y}
						r={4}
					/>
				)}
			/>,
		);
		const svg = container.querySelector("svg");

		expect(svg?.lastElementChild).toHaveClass("odontogram__overlay");
		fireEvent.click(
			container.querySelector('[data-tooth-id="11"]') as SVGGElement,
		);
		expect(
			(onChange.mock.calls[0][0] as ToothDetail[]).map(({ id }) => id),
		).toEqual(["11"]);
	});

	it("places marks on every dentition and layout inside the viewBox", () => {
		for (const dentition of ["permanent", "primary", "mixed"] as const) {
			for (const layout of ["arch", "horizontal"] as const) {
				const renderOverlay = vi.fn(() => null);
				const { unmount } = render(
					<Odontogram
						dentition={dentition}
						layout={layout}
						renderOverlay={renderOverlay}
					/>,
				);
				const [{ anchorList, viewBox }] = renderOverlay.mock.calls.at(
					-1,
				) as unknown as [OdontogramOverlayRenderProps];

				for (const { center, toothId } of anchorList) {
					const label = `${dentition}/${layout}/${toothId}`;
					expect(center.x, label).toBeGreaterThanOrEqual(viewBox.x);
					expect(center.x, label).toBeLessThanOrEqual(
						viewBox.x + viewBox.width,
					);
					expect(center.y, label).toBeGreaterThanOrEqual(viewBox.y);
					expect(center.y, label).toBeLessThanOrEqual(
						viewBox.y + viewBox.height,
					);
				}
				unmount();
			}
		}
	});
});

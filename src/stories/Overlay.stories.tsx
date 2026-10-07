import type { Meta, StoryObj } from "@storybook/react-webpack5";
import Odontogram from "../Odontogram";
import type { OdontogramOverlayRenderProps } from "../type";

/** Teeth the app wants to flag, e.g. pending a review. */
const flagged = new Set(["16", "21", "36", "45", "55", "73"]);

/** A dot in the corner of each flagged tooth, sized from the tooth. */
const badges = ({ anchorList }: OdontogramOverlayRenderProps) =>
	anchorList
		.filter(({ toothId }) => flagged.has(toothId))
		.map(({ toothId, box }) => {
			const r = Math.min(box.width, box.height) * 0.14;
			return (
				<circle
					key={toothId}
					cx={box.x + box.width - r}
					cy={box.y + r}
					r={r}
					fill="#f59e0b"
					stroke="#fff"
					strokeWidth={r * 0.35}
				/>
			);
		});

/** The bounding box of every tooth, for debugging layouts. */
const boxes = ({ anchorList }: OdontogramOverlayRenderProps) =>
	anchorList.map(({ toothId, box }) => (
		<rect
			key={toothId}
			{...box}
			fill="none"
			stroke="#ef4444"
			strokeWidth={0.6}
			strokeDasharray="2 2"
		/>
	));

const meta = {
	component: Odontogram,
	title: "Components/Overlay",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"`renderOverlay` draws the app's SVG above the chart, in viewBox coordinates, with the anchors of the drawn teeth (`anchors` by FDI ID, `anchorList`), the `viewBox`, `dentition`, `layout` and `surfaceDiagrams`. Clicks go through it to the teeth. `getToothAnchors` and `getLayoutViewBox` give the same anchors without rendering.",
			},
		},
	},
	decorators: [
		(Story, { args }) => (
			<div
				style={{
					width: `min(${args.layout === "horizontal" ? 720 : 420}px, calc(100vw - 32px))`,
					margin: "0 auto",
				}}
			>
				<Story />
			</div>
		),
	],
	args: {
		idFormat: "fdi",
		renderOverlay: badges,
	},
	argTypes: {
		dentition: {
			control: "radio",
			options: ["permanent", "primary", "mixed"],
		},
		layout: { control: "radio", options: ["arch", "horizontal"] },
		onChange: { action: "changed" },
	},
} satisfies Meta<typeof Odontogram>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Badges: Story = {};

export const MixedHorizontalBadges: Story = {
	args: { dentition: "mixed", layout: "horizontal" },
};

export const ToothBoxes: Story = {
	args: { layout: "horizontal", renderOverlay: boxes },
};

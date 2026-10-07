# react-native-odontogram

React Native dental chart for selecting teeth, built on the same core and
model as [`react-odontogram`](https://www.npmjs.com/package/react-odontogram).

## Installation

```bash
npm install react-native-odontogram react-native-svg
```

Peers: `react`, `react-native` (>= 0.72) and `react-native-svg` (>= 13). The
odontogram core is bundled.

## Usage

```tsx
import { NativeOdontogram } from "react-native-odontogram";

export default function App() {
	return (
		<NativeOdontogram
			height={420}
			onChange={(selectedTeeth) => {
				console.log(selectedTeeth);
			}}
			width="100%"
		/>
	);
}
```

### Dentitions, states and findings

```tsx
<NativeOdontogram
	dentition="mixed"
	teeth={["16", "55", "54", "53", "12", "11", "21", "22", "63", "64", "65", "26"]}
	layout="horizontal"
	notation="Universal"
	showNumbers
	toothStates={{ "16": "implant", "54": "extracted" }}
	findings={[
		{ code: "crown", teeth: ["11"] },
		{ code: "extraction", teeth: ["65"], status: "planned" },
	]}
	showLabels
/>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `dentition` | `"permanent" \| "primary" \| "mixed"` | `"permanent"` |
| `layout` | `"arch" \| "horizontal"` (`"circle"`/`"square"` deprecated) | `"arch"` |
| `teeth` | FDI IDs of the teeth to draw | every tooth |
| `value` / `defaultValue` | Selected teeth, `"11"` or `"teeth-11"` (`defaultSelected` is the 0.1 alias) | — |
| `singleSelect` | `boolean` | `false` |
| `onChange` | `(selected: ToothDetail[]) => void` | — |
| `onToothPress` | `(tooth: ToothDetail) => void`, before the selection changes | — |
| `idFormat` | `"legacy"` (`teeth-11`) or `"fdi"` (`11`) in `onChange` | `"legacy"` |
| `notation` | `"FDI" \| "Universal" \| "Palmer"` | `"FDI"` |
| `showNumbers` | Draws the tooth numbers | `false` |
| `showHalf` | `"full" \| "upper" \| "lower"` | `"full"` |
| `conditions` | `{ label, teeth, fillColor, outlineColor }[]` (`teethConditions` deprecated) | — |
| `toothStates` | `missing`, `extracted`, `implant` or `unerupted` per tooth | — |
| `findings` / `findingCatalog` | Clinical findings; NTS Peru catalog by default | — |
| `labels` | Texts of the accessible names and the legend | English |
| `showLabels` | Legend of conditions, states and findings | `false` |
| `disabled` | No press handlers (`readOnly` is the 0.1 alias) | `false` |
| `theme` / `colors` | `"light" \| "dark"`; any color of the palette | `"light"` |
| `width` / `height` / `style` | Size of the `Svg` | `"100%"` |

`maxTeeth` still works but is deprecated: `maxTeeth={5}` shows permanent
premolars, not primary teeth. Use `dentition="primary"`.

Every tooth is a pressable group with `accessibilityRole="button"` (or
`"image"` when disabled), `accessibilityState.selected` and a name such as
`Tooth 16, Extracted, Corona definitiva`.

## Not available yet

Surfaces (diagrams, surface findings drawn on them, surface selection), the
tooltip, the surface menu, the overlay, `SurfaceGuide` and `ToothInspector`
are web only. Findings drawn on surfaces (for example `caries` with
`surfaces`) are skipped: they are neither drawn nor in the accessible names,
and the chart warns once about each one in development (the warning comes
from the shared core and mentions `showSurfaces`, a web prop). Whole-tooth,
between and span findings are drawn.

The primary tooth shapes are provisional approximations without dental
validation; see `THIRD_PARTY_NOTICES.md` in `react-odontogram`.

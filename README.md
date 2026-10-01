
<p align="center">
  <a href="https://github.com/biomathcode/react-odontogram">
    <img src="https://raw.githubusercontent.com/biomathcode/react-odontogram/main/assets/banner.svg" alt="react-odontogram - interactive dental charts for React and React Native" width="100%" />
  </a>
</p>

# 🦷 `react-odontogram`

[![npm version](https://img.shields.io/npm/v/react-odontogram?color=blue\&label=npm)](https://www.npmjs.com/package/react-odontogram)
[![npm downloads](https://img.shields.io/npm/dm/react-odontogram?color=green\&label=downloads)](https://www.npmjs.com/package/react-odontogram)
[![react-native-odontogram](https://img.shields.io/npm/v/react-native-odontogram?color=teal\&label=react-native-odontogram)](https://www.npmjs.com/package/react-native-odontogram)
[![Storybook](https://img.shields.io/badge/Storybook-Demo-orange)](https://biomathcode.github.io/react-odontogram)
[![codecov](https://codecov.io/gh/biomathcode/react-odontogram/branch/main/graph/badge.svg?token=)](https://codecov.io/gh/biomathcode/react-odontogram)

A modern, interactive **React Odontogram** component for dental chart visualization and data collection.
Built with SVG and React hooks — fully customizable, accessible, and designed for clinical or academic applications.

**Links:** [Website](https://coolhead.in) · [GitHub](https://github.com/biomathcode) · [LinkedIn](https://linkedin.com/in/biomathcode)

---

## Packages

| Package | Platform | Install |
| --- | --- | --- |
| [`react-odontogram`](https://www.npmjs.com/package/react-odontogram) | React web | `npm install react-odontogram` |
| [`react-native-odontogram`](https://www.npmjs.com/package/react-native-odontogram) | React Native | `npm install react-native-odontogram react-native-svg` |

Both packages share the same tooth data model, notation helpers, selection payloads, condition coloring, layout modes, and half-chart options.

---

## 🖼️ Preview

| Light Mode                                                                                                   | Dark Mode                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| ![Light preview](https://github.com/biomathcode/react-odontogram/blob/main/assets/previewlight.png) | ![Dark preview](https://github.com/biomathcode/react-odontogram/blob/main/assets/previewdark.png) |

---

## 🧩 Demo

👉 **Live Preview:** [https://biomathcode.github.io/react-odontogram](https://biomathcode.github.io/react-odontogram)

---

## Responsive Example

Run the local example site:

```bash
pnpm example:responsive
```

The example is in `examples/responsive-site` and includes responsive containers, layout switching, notation switching, half-chart views, condition labels, single-select mode, read-only mode, and live selection output.

---

## 📦 Installation

### React Web

```bash
# Using npm
npm install react-odontogram

# Using pnpm
pnpm add react-odontogram

# Using yarn
yarn add react-odontogram
```

> Make sure you have `react` and `react-dom` installed as peer dependencies.

### React Native

```bash
# Using npm
npm install react-native-odontogram react-native-svg

# Using pnpm
pnpm add react-native-odontogram react-native-svg

# Using yarn
yarn add react-native-odontogram react-native-svg
```

> Make sure your React Native app has `react`, `react-native`, and `react-native-svg` installed.

---

## 🚀 Quick Start

```tsx
import { Odontogram } from "react-odontogram";
import "react-odontogram/style.css";

export default function App() {
  const handleChange = (selectedTeeth) => {
    console.log(selectedTeeth);
    /*
      Example output:
      [
        {
          "id": "teeth-21",
          "notations": {
            "fdi": "21",
            "universal": "9",
            "palmer": "1UL"
          },
          "type": "Central Incisor"
        },
        {
          "id": "teeth-12",
          "notations": {
            "fdi": "12",
            "universal": "7",
            "palmer": "2UR"
          },
          "type": "Lateral Incisor"
        }
      ]
    */
  };

  return <Odontogram onChange={handleChange} />;
}
```

### React Native Quick Start

Use the separate [`react-native-odontogram`](https://www.npmjs.com/package/react-native-odontogram) package:

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

---

## 🧠 onChange Return Type

The `onChange` callback returns an **array of selected teeth objects**:

```ts
type ToothDetail = {
  id: string;
  notations: {
    fdi: string;
    universal: string;
    palmer: string;
  };
  type: string;
};
```

Example JSON output:

```json
[
  {
    "id": "teeth-21",
    "notations": {
      "fdi": "21",
      "universal": "9",
      "palmer": "1UL"
    },
    "type": "Central Incisor"
  },
  {
    "id": "teeth-12",
    "notations": {
      "fdi": "12",
      "universal": "7",
      "palmer": "2UR"
    },
    "type": "Lateral Incisor"
  }
]
```

---

## ⚙️ Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `dentition` | `"permanent" \| "primary"` | `"permanent"` | Teeth to draw: 32 permanent (FDI 11–48) or 20 primary (FDI 51–85). See [Primary dentition](#-primary-dentition). |
| `value` | `string[]` | — | Selected tooth IDs of a controlled chart; update it from `onChange`. |
| `defaultValue` | `string[]` | `[]` | Tooth IDs selected on first render of an uncontrolled chart. |
| `defaultSelected` | `string[]` | `[]` | Alias of `defaultValue`. |
| `idFormat` | `"legacy" \| "fdi"` | `"legacy"` | IDs returned by `onChange` and the form input: `"teeth-11"` or `"11"`. Inputs accept both. |
| `singleSelect` | `boolean` | `false` | Allow selecting only one tooth at a time (clicking the selected tooth clears it). |
| `onChange` | `(selectedTeeth: ToothDetail[]) => void` | — | Called whenever selection changes. |
| `name` | `string` | `"teeth"` | Name used for hidden form input. |
| `className` | `string` | `""` | Additional class for wrapper customization. |
| `theme` | `"light" \| "dark"` | `"light"` | Applies built-in light/dark palette. |
| `colors` | `{ darkBlue?: string; baseBlue?: string; lightBlue?: string }` | `{}` | Override palette colors. |
| `notation` | `"FDI" \| "Universal" \| "Palmer"` | `"FDI"` | Display notation in native tooth titles/tooltips. |
| `tooltip` | `{ placement?: Placement; margin?: number; content?: ReactNode \| ((payload?: ToothDetail) => ReactNode) }` | `{ placement: "top", margin: 10 }` | Tooltip behavior and custom content renderer. |
| `showTooltip` | `boolean` | `true` | Enables/disables tooltip rendering. |
| `showHalf` | `"full" \| "upper" \| "lower"` | `"full"` | Render full chart or only upper/lower arches. |
| `maxTeeth` | `number` | — | **Deprecated.** Cuts each quadrant to its first teeth. `maxTeeth={5}` shows permanent premolars, not primary teeth: use `dentition="primary"`. |
| `conditions` | `ToothConditionGroup[]` | `undefined` | Colorize specific teeth by condition. |
| `teethConditions` | `ToothConditionGroup[]` | `undefined` | **Deprecated** alias of `conditions`. |
| `disabled` | `boolean` | `false` | Disable interactions and selection changes. |
| `readOnly` | `boolean` | `false` | Alias of `disabled`. |
| `showLabels` | `boolean` | `false` | Show the condition legend under the chart. |
| `layout` | `"arch" \| "horizontal"` | `"arch"` | Arch or row layout. `"circle"` and `"square"` still work but are deprecated. |
| `styles` | `React.CSSProperties` | `undefined` | Inline styles applied to the root container. |

The separate `react-native-odontogram` package supports the shared selection, notation, color, condition, read-only, half-chart, and layout props. Native-specific sizing is controlled with `width`, `height`, and `style`.

`Placement` values:

```ts
type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end";
```

`teethConditions` shape:

```ts
type ToothConditionGroup = {
  label: string;
  teeth: string[]; // either ID format, e.g. ["teeth-11", "12"]
  outlineColor: string;
  fillColor: string;
};
```

---

## 🧒 Primary dentition

```tsx
<Odontogram dentition="primary" idFormat="fdi" defaultValue={["51", "52", "65"]} />
<Odontogram dentition="primary" layout="horizontal" />
```

Draws the 20 primary teeth (FDI 51–55, 61–65, 71–75, 81–85) in the `arch`
or `horizontal` layout, with the same selection, conditions, tooltip, legend
and half charts as the permanent chart. Universal numbers are `A`–`T`.

> **Provisional shapes.** The primary tooth outlines are approximations for
> visual development. They are not clinically validated anatomy and must not
> be used for diagnosis.

`maxTeeth={5}` is not a primary dentition: it shows permanent incisors,
canine and premolars. It is deprecated in favor of `dentition="primary"`.

---

## 🧩 Common Recipes

### 1) Render a custom tooltip

```tsx
import { Odontogram } from "react-odontogram";
import "react-odontogram/style.css";

export default function CustomTooltipExample() {
  return (
    <Odontogram
      tooltip={{
        placement: "top",
        content: (payload) => (
          <div style={{ minWidth: 140 }}>
            <strong>Tooth {payload?.notations.fdi}</strong>
            <div>{payload?.type}</div>
            <small>Universal: {payload?.notations.universal}</small>
          </div>
        ),
      }}
    />
  );
}
```

### 2) Change theme and colors

```tsx
import { Odontogram } from "react-odontogram";
import "react-odontogram/style.css";

export default function ThemeExample() {
  return (
    <Odontogram
      className="my-odontogram"
      theme="dark"
      colors={{
        darkBlue: "#7c9cff",
        baseBlue: "#c7d2fe",
        lightBlue: "#4f46e5",
      }}
    />
  );
}
```

```css
.my-odontogram {
  --odontogram-tooltip-bg: #0f172a;
  --odontogram-tooltip-fg: #f8fafc;
}
```

### 3) Show `teethConditions` (with legend)

```tsx
import { Odontogram } from "react-odontogram";
import "react-odontogram/style.css";

const conditions = [
  {
    label: "caries",
    teeth: ["teeth-16", "teeth-26", "teeth-36"],
    fillColor: "#ef4444",
    outlineColor: "#b91c1c",
  },
  {
    label: "filling",
    teeth: ["teeth-14", "teeth-24"],
    fillColor: "#60a5fa",
    outlineColor: "#1d4ed8",
  },
];

export default function ConditionsExample() {
  return <Odontogram teethConditions={conditions} showLabels readOnly />;
}
```

### 4) Adjust tooltip position

```tsx
import { Odontogram } from "react-odontogram";
import "react-odontogram/style.css";

export default function TooltipPositionExample() {
  return (
    <Odontogram
      tooltip={{
        placement: "right-start", // try: top, right, bottom-end, left-start...
        margin: 18, // larger = farther from tooth, smaller = closer
      }}
    />
  );
}
```

---

## 🦷 Tooth Data Model

Each tooth is internally defined in a structured format:

```ts
{
  name: "1",
  type: "Central Incisor",
  outlinePath: "...",
  shadowPath: "...",
  lineHighlightPath: "..."
}
```

This makes it easy to extend or customize if you fork the library.

---

## 🧪 Development

Requires Node.js >= 18.

Run locally:

```bash
git clone https://github.com/biomathcode/react-odontogram.git
cd react-odontogram
pnpm install
pnpm dev
```

To preview Storybook:

```bash
pnpm storybook
```

---

## 🪶 License

MIT © [biomathcode](https://github.com/biomathcode)

---

## 💬 Feedback

If this library helps your dental project, please ⭐ the repo or open issues/PRs for enhancements!

# Migrating from 0.5.x to 0.6

> Version numbers in this guide are those of the upstream
> [`react-odontogram`](https://github.com/biomathcode/react-odontogram).
> The "0.6" described here is published by this fork as
> `@kmanueldc/react-odontogram` 0.1.0. Coming from `react-odontogram` 0.5.x,
> follow this guide and change the package name in your imports:
>
> ```diff
> - import { Odontogram } from "react-odontogram";
> - import "react-odontogram/style.css";
> + import { Odontogram } from "@kmanueldc/react-odontogram";
> + import "@kmanueldc/react-odontogram/style.css";
> ```

0.6 keeps the 0.5.x API working: every old prop still renders the same chart,
`onChange` returns the same `ToothDetail` objects with the same `teeth-11`
IDs, and the hidden form input keeps its format. Deprecated props log one
warning in development (never in production builds). They will be removed
in 1.0.

## 0.1.0 → 0.1.1: chart roles

Only queries by role change. The root `div.Odontogram` is now always
`role="group"`; in 0.1.0 an interactive chart had `role="listbox"` there.
The tooth `listbox` (same accessible name, `aria-multiselectable`) is now a
`<g>` inside the SVG, around the teeth, and is absent when the chart is
read-only, as before.

```diff
- const chart = screen.getByRole("listbox");          // root div
+ const chart = screen.getByRole("group", { name: "Odontogram" });
  const teeth = screen.getByRole("listbox");          // still works: the teeth
```

The quadrant `<g>`s are one level deeper (inside that wrapper, which is drawn
in read-only charts too, without a role): styles using `.Odontogram > svg > g`
need `svg > g > g`, or better the tooth classes (`g[class^="teeth-"]`).

## Deprecated props

| 0.5.x | 0.6 | Notes |
| --- | --- | --- |
| `layout="circle"` | `layout="arch"` | Same drawing. |
| `layout="square"` | `layout="horizontal"` | Same drawing. |
| `teethConditions` | `conditions` | Same shape; `conditions` wins when both are set. |
| `defaultSelected` | `defaultValue` | Alias, no warning. For a controlled chart use `value` + `onChange`. |
| `readOnly` | `disabled` | Alias, no warning; `disabled` wins when both are set. |
| `maxTeeth` | `dentition="primary"` | See below. |

```tsx
// 0.5.x
<Odontogram layout="square" teethConditions={groups} defaultSelected={["teeth-11"]} readOnly />

// 0.6
<Odontogram layout="horizontal" conditions={groups} defaultValue={["11"]} disabled />
```

## Tooth IDs

Inside the library every ID is a plain FDI ID (`"11"`). Every input accepts
both formats: `value`, `defaultValue`, `conditions`, `teeth`, `toothStates`,
`findings`, `surfaces`, and the `toothId` of `SurfaceGuide` and
`ToothInspector`.

What leaves the chart (`onChange`, the hidden form input, `onSurfacesChange`,
`onSurfaceClick`) follows `idFormat`:

* `idFormat="legacy"` (default in 0.6): `"teeth-11"`, as in 0.5.x.
* `idFormat="fdi"`: `"11"`, as in `vue-odontogram`. It will be the default in
  1.0; set it now to be ready.

`ToothDetail.notations` is unchanged, including the 0.5.x Palmer format
(`6UR`). Payloads that are new in 0.6 (`renderTooltip`, `renderSurfaceMenu`,
`renderOverlay`, `ToothDefinition`) always use FDI IDs.

## `maxTeeth` is not a primary dentition

`maxTeeth={5}` cuts each quadrant to its first five **permanent** teeth:
incisors, canine and premolars. Children have primary molars, not
premolars, so that chart was anatomically wrong. Use the real primary
dentition (20 teeth, FDI 51–85):

```tsx
// 0.5.x
<Odontogram maxTeeth={5} />

// 0.6
<Odontogram dentition="primary" />
```

`maxTeeth` keeps working for other cuts (for example `maxTeeth={7}` without
third molars). To draw specific teeth, use `teeth={[...]}`, which works with
every dentition and with `dentition="mixed"`.

## Visible changes

These are not API changes, but tests or styles that depend on the exact
markup may notice them:

* **Accessible names follow `notation`.** `Tooth 11` in FDI (unchanged),
  `Tooth 8` in Universal and `Tooth UR6` in Palmer. Tooth `<title>`s keep the
  0.5.x text.
* **SVG title.** The chart's `<title>` is `permanent odontogram` (was
  `Odontogram`), from `labels.chartTitles`.
* **One tab stop.** Only one tooth is reachable with Tab (before, every tooth
  and the container); arrow keys, `Home` and `End` move between teeth.
* **Tooltip.** It has `role="tooltip"`, and the default content adds lines
  for the condition, the tooth state and the findings when there are any.
* **New attributes.** Each tooth has `data-tooth-id` (FDI) and
  `data-tooth-state`; its class keeps `teeth-NN [selected]` first, so
  `g[class^="teeth-"]` selectors still match.
* **`selectedColor` and `hoverColor` now work.** They were declared in 0.5.x
  but had no effect; they set `--odontogram-selected-color` and
  `--odontogram-hover-color`.
* **CSS variables.** The `vue-odontogram` variables
  (`--odontogram-stroke-color`, `--odontogram-selected-color`, …) are the
  main API; `--dark-blue`, `--base-blue` and `--light-blue` (written by
  `theme` and `colors`) stay as their fallbacks, so 0.5.x themes look the
  same. See the Theme section of the README.
* **Legend.** It has the class `odontogram-condition-labels`, and two
  conditions with the same label no longer produce a React key warning.
* **viewBox.** Unchanged for the permanent chart, half charts included,
  unless numbers, surface diagrams or findings outside the chart need more
  room.
* **Internal `Teeth` component.** It was never exported and is replaced by
  `Tooth` (now public). The `TeethProps` type is kept, deprecated.

## Nothing else to do

The default export, `Odontogram`, `getViewBox`, the types of 0.5.x and
`style.css` are unchanged; only the package name changes (see the note at
the top). React 17 or later is still supported.

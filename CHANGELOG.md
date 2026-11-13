# Changelog

All notable changes to `@kmanueldc/react-odontogram`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

`@kmanueldc/react-odontogram` is a fork of
[`react-odontogram`](https://github.com/biomathcode/react-odontogram) by
Pratik Sharma (biomathcode). Its version numbers start again at 0.1.0;
entries from 0.6.0 down use the upstream numbering.

## [0.2.0] - 2026-11-13

### Added

- **Finding boxes.** `showFindingBoxes` draws a box per tooth on its
  vestibular side, as on the printed NTS chart, and writes the tooth's
  abbreviations (`IMP`, `TC`, `M1`…) in it. Core: `getFindingBoxes()` and the
  `{ boxes }` option of `layoutFindings`.
- **Crown or root.** Findings take `location: "crown" | "root"`, e.g. a root
  fracture, root remnant or pulp treatment. Root findings are drawn in a root
  zone on the vestibular side; names and tooltips add the location
  (`labels.findingLocations`).
- **NTS N.° 188 drawings.** New symbols `square` (crown), `pulp` (coronal
  pulp), `root-line` (root canal), `post-core`, `number-circle`,
  `fused-circles` and `apical-text`; catalog codes `post-core`
  (espigo-muñón), `gemination` and `pulpotomy` (PP). Catalog entries take
  `boxText`, and a finding's `label` is written in the box next to drawn
  symbols (e.g. `CM` for a crown). `layoutFindings` takes `numbers` to circle
  the tooth numbers.
- **Printing.** `@media print` draws the chart in black on white (also from
  the dark theme), keeps findings in blue and red and hides the selection.

### Changed

- **NTS N.° 188 catalog drawings**, see [MIGRATION.md](MIGRATION.md):
  `crown` and `temporary-crown` are a square (`temporary-crown` writes `CT`
  in the box); `fusion` circles the numbers of two teeth; `supernumerary` is
  an encircled `S` between the apices of two teeth; `pulp-treatment`
  ("Tratamiento de conductos") draws a line in the root zone and writes `TC`
  in the box. Single-tooth `fusion` and `supernumerary` findings are reported
  as issues.

## [0.1.1] - 2026-11-11

### Fixed

- **Accessibility: `aria-required-children` (axe, WCAG 2.1 A).** An
  interactive chart put `role="listbox"` on its root, which also held the
  surface checkboxes or buttons, the legend and the surface menu. Now the root
  is always `role="group"` (with its `aria-label`, no `aria-multiselectable`).
  The `listbox` (with `aria-multiselectable` and the same label) moves to a new
  `<g>` in the SVG that holds only the tooth options. Keyboard, focus and
  selection are unchanged. See [MIGRATION.md](MIGRATION.md).

## [0.1.0] - Unreleased

First release as `@kmanueldc/react-odontogram`. It contains upstream
`react-odontogram` 0.5.x plus every change listed under 0.6.0 below.

### Changed

- **Package name.** Install and import `@kmanueldc/react-odontogram` instead
  of `react-odontogram`; see [MIGRATION.md](MIGRATION.md).

## [0.6.0] - Unreleased (fork work, released as 0.1.0)

The features of [`vue-odontogram`](https://www.npmjs.com/package/@kmanueldc/vue-odontogram)
0.1.1, on a framework-free core shared in design with it. The 0.5.x API keeps
working; see [MIGRATION.md](MIGRATION.md).

### Added

- **Dentitions.** `dentition="primary"` (20 teeth, FDI 51–85) and
  `dentition="mixed"` (52 teeth in four rows), in both layouts and half
  charts. `teeth` lists the teeth present in the mouth. Primary shapes are
  provisional.
- **Layouts.** `layout="arch"` and `layout="horizontal"`.
- **Selection.** Controlled `value` + `onChange`, `defaultValue`, and
  `idFormat` (`"legacy"` or `"fdi"`) for the IDs that leave the chart. Inputs
  accept `"11"` and `"teeth-11"`.
- **Notations.** `showNumbers` and `renderNumber` draw each tooth's number in
  FDI, Universal (`A`–`T` for primary teeth) or Palmer (with its quadrant
  corner); accessible names follow `notation`.
- **Keyboard.** A single tab stop with arrow keys, `Home` and `End`, also
  across the rows of a mixed chart.
- **Tooth states.** `toothStates` with `missing`, `extracted`, `implant` and
  `unerupted`: marks, accessible names, tooltip and legend.
- **Surfaces.** `showSurfaces` draws a five-surface diagram per tooth
  (`surfaceShape` `square` or `circle`, `showSurfaceLetters`), with its own
  selection (`surfaces`, `defaultSurfaces`, `onSurfacesChange`,
  `onSurfaceClick`), keyboard, tooltip and clinical names.
- **Findings.** `findings` and `findingCatalog` (default
  `ntsPeruFindingCatalog`, 35 codes) with 19 symbol kinds, surface, tooth,
  between and span scopes, statuses, tones and custom colors, in the
  accessible names, tooltip and legend.
- **Surface menu.** `renderSurfaceMenu` opens a menu on a surface to list and
  record its findings.
- **Components.** `SurfaceGuide` (one tooth's surfaces explained),
  `ToothInspector` (everything recorded on a tooth, with a form) and `Tooth`.
- **Overlay.** `renderOverlay` with the anchors of the drawn teeth.
- **Text.** `labels` translates every text; `defaultOdontogramLabels`.
- **Tooltip.** `renderTooltip` with the tooth, selection, condition, state,
  findings, number and surface.
- **Theme.** The `vue-odontogram` CSS variables, new `colors` keys
  (`stroke`, `selected`, `hover`, `selectedStroke`, `accent`).
- **API.** Hooks (`useOdontogram`, `buildOdontogramModel`,
  `useToothSelection`, `useSurfaceSelection`), record helpers
  (`getToothRecord`, `addFinding`, `addSurfaceFinding`,
  `removeSurfaceFinding`), geometry (`getToothAnchors`, `getLayoutViewBox`,
  `parseViewBox`), notation helpers and every public type.

- **Core package.** The framework-free core lives in
  `packages/odontogram-core` (`@kmanueldc/odontogram-core`) and is bundled
  into `react-odontogram`, which keeps no runtime dependency on it.

### Changed

- Accessible names follow `notation`; the SVG `<title>` comes from
  `labels.chartTitles`; only one tooth is a tab stop; the default tooltip
  adds condition, state and findings lines. See
  [MIGRATION.md](MIGRATION.md#visible-changes).

### Deprecated

- `layout="circle"` / `"square"` (use `arch` / `horizontal`),
  `teethConditions` (use `conditions`) and `maxTeeth` (use
  `dentition="primary"`; `maxTeeth={5}` shows permanent premolars, not primary
  teeth). They warn once in development and will be removed in 1.0.

### Fixed

- `selectedColor` and `hoverColor` had no effect.
- Two conditions with the same label produced a React key warning in the
  legend.

## [0.5.8]

Last release before the `vue-odontogram` features; see the
[GitHub releases](https://github.com/biomathcode/react-odontogram/releases).

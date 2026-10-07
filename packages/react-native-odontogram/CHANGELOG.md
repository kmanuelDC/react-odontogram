# Changelog

All notable changes to `react-native-odontogram`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - Unreleased

Built on `@kmanueldc/odontogram-core` and the model of `react-odontogram`
0.6.0 (both bundled; the only peers are `react`, `react-native` and
`react-native-svg`). The 0.1.0 props keep working.

### Added

- `dentition` (`permanent`, `primary`, `mixed`) and `teeth`.
- `layout="arch"` / `"horizontal"`.
- Controlled `value`, `defaultValue`, `idFormat` and `onToothPress`.
- `showNumbers`, with the Palmer corner.
- `toothStates`: dashed absent teeth, extraction cross and implant fixture.
- `findings` and `findingCatalog` (`ntsPeruFindingCatalog` by default).
- `labels` for the accessible names and the legend.
- The legend (`showLabels`) also lists tooth states and findings, and wraps
  into rows.
- `colors` keys `number`, `extracted`, `implant`, `implantFill`,
  `findingGood` and `findingBad`.

### Changed

- Accessible names add the tooth state and its findings
  (`Tooth 16, Extracted`).
- With findings or numbers the viewBox grows to fit them, as on the web.

### Deprecated

- `layout="circle"` / `"square"`, `maxTeeth` and `teethConditions`, as in
  `react-odontogram` 0.6.0. They warn once in development.

## [0.1.0]

First release: selection, notations, conditions, read-only, half charts and
both layouts.

# @kmanueldc/odontogram-core

Framework-free core of the odontogram libraries: tooth geometry, FDI /
Universal / Palmer notation, permanent, primary and mixed dentitions, `arch`
and `horizontal` layouts, keyboard navigation, tooth states, surfaces,
clinical findings (with the NTS Peru catalog), per-tooth records and anchors.

It has no dependencies and imports neither React nor Vue. It is shared by:

| Package | How it uses the core |
| --- | --- |
| [`@kmanueldc/react-odontogram`](https://www.npmjs.com/package/@kmanueldc/react-odontogram) | Bundled at build time (no runtime dependency) |
| `react-native-odontogram` | Bundled at build time |
| [`@kmanueldc/vue-odontogram`](https://www.npmjs.com/package/@kmanueldc/vue-odontogram) | Origin of the code; will depend on this package once it is published |

Most apps should install one of those component packages. Use the core
directly to compute the same chart data on a server, in another framework, or
to build custom renderers.

```bash
npm install @kmanueldc/odontogram-core
```

```ts
import {
	formatToothNumber,
	getComposition,
	getToothRecord,
	ntsPeruFindingCatalog,
} from "@kmanueldc/odontogram-core";

formatToothNumber("55", "Universal"); // "A"

// viewBox and parts (dataset + quadrant transforms) of a chart.
const { viewBox, parts } = getComposition("primary", "arch");

// Findings of one tooth, grouped by surface.
const record = getToothRecord("16", findings, ntsPeruFindingCatalog);
```

## Contents

| Folder | |
| --- | --- |
| `src/types` | `ToothShape`, `ToothDefinition`, `Dentition`, findings and surfaces |
| `src/data` | SVG paths: permanent and primary, arch and horizontal |
| `src/utils` | Notation, quadrants, compositions, layouts, numbers, navigation, state marks, surfaces, findings, tooth frames, finding records, anchors, SVG geometry, labels |
| `src/catalogs` | `ntsPeruFindingCatalog` |

Everything is re-exported from the package entry point.

## Provenance and caveats

* Ported from `vue-odontogram` commit `66bd190` (0.1.1). The only changes
  are Biome formatting and import order.
* The permanent SVG paths come from [`react-odontogram`](https://github.com/biomathcode/react-odontogram)
  0.5.x (MIT © biomathcode), unchanged.
* The primary datasets (`primary`, `primary-horizontal`) are **provisional**
  simplified paths for prototyping. They have no dental validation and must
  not be used for diagnosis, treatment or as a definitive clinical
  representation.
* `ntsPeruFindingCatalog` is pending verification against the official text
  of the norm.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Development

The package lives in the [`kmanuelDC/react-odontogram`](https://github.com/kmanuelDC/react-odontogram) pnpm workspace.

```bash
pnpm --filter @kmanueldc/odontogram-core build
pnpm --filter @kmanueldc/odontogram-core test
pnpm --filter @kmanueldc/odontogram-core exec tsc -p tsconfig.json
```

Rules:

* Only relative imports in `src/`; `tests/no-dependencies.test.ts` checks it,
  and that every module is re-exported from `src/index.ts`.
* Logic changes are made here (not inside a component package) so React and
  Vue do not diverge.

MIT License.

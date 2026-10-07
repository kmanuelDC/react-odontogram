# Third-party notices

## vue-odontogram core and primary SVG data

This package (types, tooth datasets, layouts, notation, surfaces, findings,
finding records, anchors and the NTS Peru catalog) is ported from
[`@kmanueldc/vue-odontogram`](https://www.npmjs.com/package/@kmanueldc/vue-odontogram)
0.1.1. It is used under the MIT License:

MIT License

Copyright (c) 2026 Manuel Díaz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Permanent SVG data

The permanent tooth datasets in `src/data/permanent.ts` and
`src/data/permanent-horizontal.ts` are `react-odontogram` 0.5.x's own paths
(MIT © biomathcode), restructured by `vue-odontogram` and brought back
unchanged.

## Primary SVG data (provisional)

The datasets in `src/data/primary.ts` (arch) and
`src/data/primary-horizontal.ts` (horizontal) are simplified
provisional paths created by the `vue-odontogram` project for prototyping.
They have no dental validation and must not be used for diagnosis,
treatment or as a definitive clinical representation, nor presented as
clinically valid anatomy. Their sources and approximations are documented in
the `vue-odontogram` repository (`docs/primary-svg-approximation.md`,
`docs/primary-horizontal-svg-approximation.md`,
`docs/primary-horizontal-layout.md` and `docs/primary-svg-sources.md`).

## NTS Peru finding catalog

`ntsPeruFindingCatalog` (`src/catalogs/nts-peru.ts`) follows the
Peruvian technical norm for the odontogram as interpreted by
`vue-odontogram`. It is pending verification against the official text of
the norm (sealants, material abbreviations) and must be reviewed before
clinical use.

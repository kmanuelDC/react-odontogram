# `src/core` — núcleo sin framework

Copia del núcleo de `vue-odontogram` (`src/types`, `src/data`, `src/utils`,
`src/catalogs`) para que React use exactamente la misma geometría, numeración,
composiciones, superficies y hallazgos. Ver [ToDo.md](../../ToDo.md), D1 y R01.

| | |
| --- | --- |
| Origen | `vue-odontogram` commit `66bd190` (2026-09-29), `@kmanueldc/vue-odontogram` 0.1.1 |
| Copiado | 2026-10-01 |
| Cambios respecto al origen | Solo formato de Biome (tabs, comillas dobles) y orden de imports. Ninguno de lógica. |

## Reglas

* Nada aquí importa React ni ningún paquete; solo imports relativos.
  Lo comprueba `tests/core/react-parity.test.ts`.
* No editar la lógica solo en este lado. Un cambio del núcleo se hace en
  `vue-odontogram` (o en ambos a la vez) para no divergir hasta extraer
  `@kmanueldc/odontogram-core` (R20).
* Las reglas de estilo de Biome que chocan con el código de Vue están
  desactivadas solo para `src/core/**` y `tests/core/**` (`biome.json`,
  `overrides`), para no reescribir el código copiado.
* Los SVG primarios y primarios horizontales son **provisionales**: no tienen
  revisión odontológica ni deben presentarse como geometría clínica.

## Tests

`tests/core/` contiene los tests de Vue que no montan componentes, con las
rutas cambiadas a `src/core/`. De los archivos de Vue que mezclan ambas cosas
(`findings`, `finding-records`, `surfaces`, `surface-guide`,
`surface-tooltip-shape`, `tooth-states`) se conservaron solo los `it` puros.
Los que montan componentes se portarán en la fase que crea cada componente
(R04–R17). `public-api.test.ts` se porta en R15.

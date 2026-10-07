# Estado de implementación

Las fases se definen en [ToDo.md](../ToDo.md).

| Fase | Estado | Fecha | Evidencia |
| --- | --- | --- | --- |
| R00 — Línea base | Completada | 2026-10-01 | `docs/baseline/` (27 capturas), `scripts/capture-baseline.mjs`, `.gitattributes` |
| R01 — Núcleo sin framework | Completada | 2026-10-01 | `src/core/` (28 módulos), `tests/core/` (20 archivos, 203 pruebas), `src/core/README.md` |
| R02 — Capa de compatibilidad | Completada | 2026-10-01 | `src/compat.ts`, `tests/compat.test.ts`, `tests/Odontogram-compat.test.tsx` |
| R03 — Refactor de `Odontogram` | Completada | 2026-10-01 | `src/Tooth.tsx`, `src/ToothLayer.tsx`, `src/hooks/`, `src/legacy.ts`, `tests/hooks.test.tsx`, `tests/Odontogram-refactor.test.tsx` |
| R04 — Dentición primaria | Completada (SVG provisionales) | 2026-10-01 | `tests/Odontogram-primary*.test.tsx`, `src/stories/Primary.stories.tsx`, README |
| R05 — Dentición mixta | Completada (SVG primarios provisionales) | 2026-10-02 | `tests/Odontogram-mixed.test.tsx`, `tests/core/mixed-layout.test.ts`, `src/stories/Mixed.stories.tsx`, `docs/mixed-dentition.md` |
| R06 — Mejoras rápidas | Completada | 2026-10-02 | `tests/Odontogram-quick-wins.test.tsx`, `tests/Odontogram-notation.test.tsx`, `src/NumberLayer.tsx`, `src/stories/Features.stories.tsx` |
| R07 — Estados de pieza | Completada | 2026-10-02 | `tests/Odontogram-tooth-states.test.tsx`, `src/StateMarkLayer.tsx`, `src/Tooth.tsx`, `src/Labels.tsx` |
| R08 — Superficies | Completada | 2026-10-02 | `tests/Odontogram-surfaces.test.tsx`, `src/SurfaceDiagrams.tsx`, `src/hooks/useSurfaceSelection.ts`, `src/stories/Surfaces.stories.tsx` |
| R09 — Hallazgos y tratamientos | Completada | 2026-10-02 | `tests/Odontogram-findings.test.tsx`, `src/FindingLayer.tsx`, `src/findingText.ts`, `src/hooks/useChartFindings.ts`, `src/stories/Findings.stories.tsx` |
| R10 — Registro por pieza y `SurfaceGuide` | Completada | 2026-10-02 | `tests/SurfaceGuide.test.tsx`, `src/SurfaceGuide.tsx`, `src/stories/SurfaceGuide.stories.tsx` |
| R11 — Menú de superficie | Completada | 2026-10-02 | `tests/Odontogram-surface-menu.test.tsx`, `src/SurfaceMenu.tsx`, `src/SurfaceDiagrams.tsx` |
| R12 — `ToothInspector` | Completada | 2026-10-02 | `tests/ToothInspector.test.tsx`, `src/ToothInspector.tsx`, `src/stories/Records.stories.tsx` |
| R13 — Overlay y anchors | Completada | 2026-10-02 | `tests/Odontogram-overlay.test.tsx`, `src/OverlayLayer.tsx`, `src/stories/Overlay.stories.tsx` |
| R14 — Tema y estilos | Completada | 2026-10-02 | `tests/theme.test.tsx`, `src/styles.css`, `src/utils.ts`, `src/stories/Theme.stories.tsx` |
| R15 — API pública | Completada | 2026-10-02 | `src/index.ts`, `tests/public-api.test.tsx` |
| R16 — Storybook y ejemplo | Completada | 2026-10-02 | `src/stories/Overview.stories.tsx`, `src/stories/Legacy.stories.tsx`, `examples/responsive-site/src/App.tsx`, `examples/responsive-site/vite.config.ts` |
| R17 — Tests de componente | Completada | 2026-10-02 | `tests/Odontogram-layout.test.tsx`, `tests/Odontogram-horizontal-interactions.test.tsx`, `tests/Odontogram-api-improvements.test.tsx`, `tests/Odontogram-legend.test.tsx` |
| R18 — Documentación y publicación | Completada (sin publicar) | 2026-10-02 | `README.md`, `MIGRATION.md`, `THIRD_PARTY_NOTICES.md`, `CHANGELOG.md`, `package.json` |
| R19 — React Native (opcional) | Completada (sin superficies) | 2026-10-05 | `packages/react-native-odontogram/src/`, `packages/react-native-odontogram/tests/NativeOdontogram-core.test.tsx`, `tests/core-parity.test.ts` |
| R20 — Paquete core compartido (opcional) | Completada (Vue sin migrar) | 2026-10-05 | `packages/odontogram-core/`, `pnpm-workspace.yaml`, `docs/core-package.md` |

## R00 — Línea base (2026-10-01)

Entorno: Node 22.22.3, pnpm 9.15.9 (vía `corepack`, igual que el lockfile v9
del CI), Windows 11, commit `e21fd2b`.

| Paso (mismo orden que el CI) | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | OK |
| `pnpm tsc` | OK, sin errores |
| `pnpm test:coverage` | OK: 2 archivos, 24 pruebas (15 web + 9 React Native) |
| `pnpm lint:ci` | OK tras normalizar finales de línea (ver abajo) |
| `pnpm build` | OK: `index.mjs` 106.8 KB, `index.js` 107.5 KB, `index.css` 6.8 KB, `index.d.ts` 2.6 KB |
| `pnpm storybook:build` | OK; solo avisos de tamaño de bundle de webpack |

Cobertura de la librería web (`src/`, sin historias): 80.2 % sentencias,
60.3 % ramas, 32.3 % funciones. Lo menos cubierto: `Labels.tsx` (4.4 %) y
`Tooltip.tsx` (41.6 %).

### Cambios hechos en R00

Ninguno cambia el comportamiento ni el contenido de la librería:

* `.gitattributes` con `eol=lf`. En Windows, `core.autocrlf=true` dejaba los
  archivos con CRLF y `biome check` fallaba con 36 errores de formato, todos
  de fin de línea (con `--line-ending=crlf` no había ninguno). El repositorio
  ya guardaba LF, así que tras renormalizar no hay diferencias de contenido.
* `scripts/capture-baseline.mjs` y script `pnpm baseline:capture`.
* `biome.json`: override que permite `console` solo en `scripts/`.
* `debug-storybook.log` deja de versionarse y se ignora en `.gitignore`.
* `todo.md` pasa a llamarse `ToDo.md`.

### Ajustes de CI tras R00 (2026-10-01)

* `pnpm lint:ci` reactivado en `.github/workflows/main.yml`.
* `package-lock.json` eliminado; pnpm (`pnpm-lock.yaml`) es el único gestor.
  `package-lock.json` y `yarn.lock` quedan en `.gitignore`.
* `.github/workflows/publish.yml` usaba `npm ci`, que dependía de
  `package-lock.json`: ahora instala, compila y prueba con pnpm
  (`pnpm vitest run`). La publicación sigue con `npm publish` porque el
  trusted publishing por OIDC requiere npm ≥ 11.5 (Node 24).
* Verificado en local: install, `tsc`, `lint:ci`, 24 pruebas, build y
  `npm publish --dry-run` (mismo tarball: solo `dist/`, 7 archivos).

## R01 — Núcleo sin framework (2026-10-01)

Origen: `vue-odontogram` commit `66bd190` (árbol limpio).

| Verificación | Resultado |
| --- | --- |
| `pnpm tsc` | OK |
| `pnpm lint:ci` | OK |
| `pnpm test:coverage` | 22 archivos, 227 pruebas (24 previas + 203 de `tests/core/`) |
| `pnpm build` | `dist/` idéntico byte a byte al de R00 (`sha256`) |

Cobertura de `src/core/utils`: 91.5 % sentencias, 93.6 % ramas.

### Qué se copió

* `src/core/{types,data,utils,catalogs}`: 28 módulos de Vue. Solo cambian el
  formato de Biome y el orden de imports; ninguna lógica.
* `tests/core/`: 13 archivos de Vue puros completos, y los `it` puros de 6
  archivos mixtos (`findings` 20/30, `finding-records` 18/20, `surfaces`
  15/22, `surface-guide` 1/12, `surface-tooltip-shape` 6/17,
  `tooth-states` 3/14). Por archivo se comprobó que conservados +
  descartados = total original.
* `tests/core/react-parity.test.ts` (nuevo): los paths permanentes de
  `src/core` son idénticos a `teethPaths` / `NewTeethPaths` en ambos layouts,
  y `src/core` no importa ningún paquete (ni React).

### Cambios de configuración

* `tsconfig.json`: `target: ES2020` y `lib` con `DOM.Iterable`, como Vue. Sin
  `target`, TypeScript asumía ES5 y no permitía iterar `Map`/`Set`.
* `tsup.config.ts`: `target: "node16"` explícito. tsup usaría si no el
  `target` del tsconfig; así el bundle publicado no cambia.
* `biome.json`: override para `src/core/**` y `tests/core/**` que desactiva
  reglas de estilo que chocan con el código de Vue (`noNonNullAssertion`,
  `useNumberNamespace`, etc.). No se "arreglaron" en la copia para no
  divergir de Vue; además `useNumberNamespace` cambiaría `isNaN` por
  `Number.isNaN`, que no es equivalente.

### Pendiente para fases siguientes

* 52 `it` de componente descartados de los archivos mixtos, más los 18
  archivos de Vue que solo montan componentes (`Odontogram*.test.ts`,
  `primary-*-orientation/spacing/symmetry`) y `public-api.test.ts`: se
  portan en R04–R17, cuando exista el componente React correspondiente.
* `src/core` todavía no se usa desde `src/index.ts` (empieza en R02/R03).

### Hallazgos en `vue-odontogram` (no corregidos allí)

* Su `tsconfig.json` solo incluye `src/`: los tests nunca pasan por
  `vue-tsc`. Por eso `tests/finding-records.test.ts` tiene un error de tipos
  latente (desestructura `{ d }` de `FindingPrimitive`, que puede ser un
  círculo o texto sin `d`). En React se corrigió con un cast equivalente.
* `docs/task-status.md` de Vue dice que los ajustes del arco primario viven
  en `Tooth.vue`; en realidad están en los datos (`shape.transform`) y en las
  utilidades de layout. `Tooth.vue` solo los concatena.

## R02 — Capa de compatibilidad (2026-10-01)

| Verificación | Resultado |
| --- | --- |
| `pnpm tsc` / `pnpm lint:ci` | OK |
| Tests | 24 archivos, 288 pruebas. `tests/Odontogram.test.tsx` sin modificar |
| Regresión visual | 27/27 capturas idénticas a `docs/baseline/` |
| Cobertura `src/compat.ts` | 100 % |
| Bundle | Código minificado 29.1 → 31.0 KB (+1.9 KB). El `.mjs` pasa de 106.8 a 127.0 KB por el sourcemap inline |

### API nueva (sin romper 0.5.x)

| Prop | Comportamiento |
| --- | --- |
| `layout` | Acepta `arch` (por defecto) y `horizontal`. `circle`/`square` siguen funcionando con aviso de deprecación (una vez, solo fuera de producción) |
| `conditions` | Reemplaza a `teethConditions` (deprecado, con aviso). IDs en cualquier formato; si llegan ambas, gana `conditions` |
| `disabled` | Equivale a `readOnly`, que se mantiene sin aviso. Si llegan ambas, gana `disabled` |
| `idFormat` | `legacy` (por defecto, `"teeth-11"`) o `fdi` (`"11"`). Afecta a `onChange` y al input oculto. `defaultSelected` acepta ambos formatos |

`getViewBox` (pública) acepta los nombres nuevos y los antiguos.

### Decisiones

* Internamente todos los IDs son FDI puros. El formato público se aplica
  solo en los bordes (`onChange`, input oculto). La clase del DOM sigue
  siendo `teeth-11` en ambos formatos, para no romper CSS de usuarios.
* Notación: Universal del núcleo coincide con 0.5.x en las 32 piezas
  (probado). Palmer del núcleo es `UR1` / `1┘`. `ToothDetail` y el `<title>`
  conservan `1UR` mediante `formatLegacyPalmer` hasta 1.0.
* `ToothDetail.type` sale de `getToothType` del núcleo. El caso `"Unknown"`
  de 0.5.x ya no es alcanzable con IDs válidos.
* Los avisos de deprecación comprueban `typeof process` para no fallar si el
  bundle corre sin empaquetador en el navegador.
* `maxTeeth` aún no avisa: su reemplazo (`dentition="primary"`) llega en R04.
* Las historias de Storybook siguen usando `circle` y `teethConditions`
  (muestran avisos en consola) hasta R16.

### Pendiente para R03

* `onChange` se llama dentro del actualizador de `setSelected`, que según
  las reglas de React debe ser puro. Ya pasaba en 0.5.x. (Corrección en
  R03: se había anotado que en `StrictMode` provocaba dos llamadas; al
  probarlo en 0.5.x, un clic en `StrictMode` llama una sola vez, por la
  optimización "eager state" de React. Era un patrón inseguro, no un bug
  observado.)
* `convertFDIToNotation` y `getToothNotations` de `src/utils.ts` (no
  públicas) quedan duplicadas por `compat.ts`. Se eliminan al refactorizar,
  junto con sus tests directos.
* El README todavía no documenta las props nuevas (R18).
* Publicar el sourcemap como archivo aparte (hoy `sourcemap: "inline"`)
  reduciría ~96 KB del paquete (R18).

## R03 — Refactor de `Odontogram` sobre el núcleo (2026-10-01)

| Verificación | Resultado |
| --- | --- |
| `pnpm tsc` / `pnpm lint:ci` | OK |
| Tests | 26 archivos, 318 pruebas (incluye las 9 de React Native) |
| DOM | Idéntico al de R02 en 89 casos: 72 combinaciones de layout, media arcada, notación, `readOnly` y `maxTeeth`, más casos especiales (tema, colores, `maxTeeth` 0/3.7/NaN/20), secuencias de clic y teclado con los argumentos exactos de `onChange`, y tooltip con hover, salida y foco. Test temporal no versionado |
| Regresión visual | 27/27 capturas idénticas a `docs/baseline/` |
| Cobertura | `Odontogram.tsx`, `ToothLayer.tsx`, `compat.ts`, `useOdontogram.ts`: 100 % de líneas |
| Bundle | Código minificado 31.0 → 39.3 KB. `compositions.ts` incluye ya los datasets primarios y mixtos, que usarán R04–R05 |

### Estructura nueva

| Archivo | Responsabilidad |
| --- | --- |
| `src/Odontogram.tsx` | Normaliza props (compat), une hooks y dibuja contenedor, input, SVG, tooltip y leyenda |
| `src/ToothLayer.tsx` | Un `<g>` por cuadrante con su transform y sus piezas |
| `src/Tooth.tsx` | Una pieza a partir de un `ToothDefinition` del núcleo. Reemplaza a `Teeth.tsx` (no era pública) con el mismo marcado |
| `src/hooks/useOdontogram.ts` | `buildOdontogramModel` (puro) + memo: cuadrantes visibles (`composeQuadrants`), media arcada, `maxTeeth`, condiciones por pieza, `viewBox` |
| `src/hooks/useToothSelection.ts` | Selección controlada (`value`) o no controlada (`defaultValue`) en FDI |
| `src/hooks/useToothTooltip.ts` | Estado y posición del tooltip |
| `src/legacy.ts` | API 0.5.x (`teethPaths`, `quadrants`, `convertFDIToNotation`…) derivada del núcleo, solo para React Native |

### API nueva

* `value`: selección controlada. `onChange` informa del cambio y el
  componente muestra lo que el padre devuelva en `value`.
* `defaultValue`: selección inicial no controlada. `defaultSelected` queda
  como alias; si llegan ambas, gana `defaultValue`.

### Decisiones

* `onChange` ya no se llama dentro del actualizador de estado, sino después
  de calcular la nueva selección. No cambia el comportamiento observable
  (ver la corrección en la nota de R02), pero respeta la regla de pureza de
  React y permite el modo controlado.
* La media arcada permanente conserva los `viewBox` fijos de 0.5.x
  (`getViewBox`). Vue los calcula con la caja de las piezas visibles; ese
  cálculo se usará para las denticiones nuevas en R04–R05.
* `src/data.ts` pasa a `tests/fixtures/legacy-data.ts` y la salida de
  `convertFDIToNotation` se congela en `tests/fixtures/legacy-notations.ts`.
  Ambos son oráculos de paridad: el componente ya dibuja desde `src/core`.
* El paquete React Native importaba `src/data.ts` y las funciones eliminadas
  de `src/utils.ts`. En lugar de mantener esa lógica duplicada, `src/legacy.ts`
  las reconstruye desde el núcleo; un test comprueba que son iguales a las de
  0.5.8. RN solo cambió una ruta de import y sus 9 tests pasan sin cambios.
* `TeethProps` sigue exportado como tipo (`@deprecated`), porque
  `export type * from "./type"` lo hacía público.

### Pendiente

* Archivos nuevos en `src/` raíz (`Tooth`, `ToothLayer`) junto a los
  existentes; los hooks en `src/hooks/`. Reorganizar en carpetas se puede
  hacer en R15 junto con la API pública.
* `useToothTooltip` no tiene pruebas propias del posicionamiento (jsdom no
  calcula cajas); lo cubren los tests de componente existentes.
* Migrar React Native al núcleo y eliminar `src/legacy.ts` (R19).

## R04 — Dentición primaria (2026-10-01)

| Verificación | Resultado |
| --- | --- |
| `pnpm tsc` / `pnpm lint:ci` | OK |
| Tests | 29 archivos, 344 pruebas (26 nuevas) |
| Regresión visual | Las 25 capturas permanentes de R00 siguen idénticas; las 2 de "Baby Teeth" se retiraron y se añadieron 5 de dentición primaria |

### API

* `dentition`: `"permanent"` (por defecto) o `"primary"`. Con `primary` se
  dibujan 20 piezas (FDI 51–55, 61–65, 71–75, 81–85) en `arch` o
  `horizontal`, con selección, `value`, condiciones, leyenda, tooltip,
  `disabled`, notaciones y medias arcadas.
* `ToothDetail` de una pieza primaria: tipo `Primary …`, Universal `A`–`T`,
  Palmer en el formato 0.5.x (`AUR`, `EUL`).
* `maxTeeth` queda deprecado: avisa una vez (solo fuera de producción) si se
  pasa explícitamente, y sigue recortando cuadrantes como en 0.5.x.

### Tests portados de Vue

`Odontogram-primary`, `-interactions`, `-isolation`, `-horizontal`,
`-horizontal-interactions`, `-horizontal-isolation`, `primary-arch-spacing`,
`primary-canine-orientation`, `primary-central-incisor-orientation`,
`primary-lateral-incisor-spacing` y `primary-lower-arch-symmetry`, agrupados
en tres archivos (los de aislamiento necesitan su propio `vi.mock`).

Traducción:

* `update:modelValue` / `change` → `onChange` con `idFormat="fdi"`.
* `tooth-click` no existe en React: el tipo de pieza se comprueba en el
  `ToothDetail` de `onChange`.
* El tooltip de React no muestra la condición (el de Vue sí): se comprueba por
  la leyenda y el relleno de la pieza. Mostrar la condición en el tooltip
  queda para R06.
* Una pieza `disabled` no tiene `aria-label` en React (como en 0.5.x): se
  localiza por su clase `teeth-NN`.
* El test de aislamiento comprueba además que el mock vacía de verdad el
  dataset permanente.

### Decisiones

* El `viewBox` primario sale de la composición (`0 0 409 461`,
  `0 0 520 180`). En media arcada se ajusta a la caja de las piezas
  visibles más un margen, como `useOdontogram` de Vue. La permanente mantiene
  sus `viewBox` fijos de 0.5.x.
* Como en Vue, el componente no filtra los IDs seleccionados que no
  pertenecen a la dentición actual. Al cambiar de dentición, la app debe
  normalizar la selección.
* `README.md`: tabla de props al día con R02–R04 y sección de dentición
  primaria con la advertencia de geometría provisional. La reescritura
  completa sigue en R18.

### Hallazgo: filas invertidas en Primary horizontal

En `primary + horizontal` la arcada **superior** (Q5/Q6) se dibuja en la
fila de **abajo** y la inferior arriba. En `permanent + horizontal` es al
revés. Viene del núcleo de Vue (`primary-horizontal-layout.ts`) y está
documentado allí como intencional (`docs/primary-horizontal-layout.md`), pero
contradice al layout permanente y la convención clínica. No se cambió para no
divergir de Vue; se debe decidir y corregir en ambos proyectos.

### Pendiente

* Procedencia y licencia de los SVG primarios en `THIRD_PARTY_NOTICES.md`
  (R18; Vue ya lo tiene).
* Historias: "Baby Teeth" (`zBaby.stories.tsx`, basada en `maxTeeth={5}`)
  se eliminó y la reemplaza "Primary Dentition". Sus dos historias eran
  copias de `Form` con `maxTeeth`, así que la demo de formulario sigue en
  `Form`. Las historias primarias están centradas e incluyen media arcada
  superior e inferior solo en arco; no hay media arcada horizontal.

## R05 — Dentición mixta (2026-10-02)

| Verificación | Resultado |
| --- | --- |
| `pnpm tsc` / `pnpm lint:ci` / `pnpm build` | OK |
| Tests | 31 archivos, 369 pruebas (25 nuevas) |
| Regresión visual | Las 30 capturas previas siguen idénticas; se añadieron 5 de dentición mixta |

### API

* `dentition="mixed"`: las 32 piezas permanentes y las 20 temporales, cada una
  con su forma y su ID FDI, en `horizontal` (`0 0 900 418`, cuatro filas) o
  `arch` (`0 0 409 694`, arcadas temporales dentro de las permanentes).
  Selección, `value`, condiciones, leyenda, tooltip, notaciones y medias
  arcadas funcionan sobre ambos conjuntos.
* `teeth?: string[]`: piezas presentes, en cualquier formato de ID. Filtra
  también `permanent` y `primary`. Los IDs ajenos a la dentición se ignoran
  y se avisa una vez fuera de producción (`warnOnce` en `compat.ts`;
  `warnDeprecated` pasa a ser su alias).
* El `viewBox` no depende de `teeth`, y un cuadrante sin piezas listadas no
  se dibuja (como en Vue). Sin `teeth`, los cuadrantes vacíos de
  `maxTeeth={0}` se mantienen como en 0.5.x.

### Tests portados de Vue

`Odontogram-mixed.test.ts`, en dos archivos:

* `tests/core/mixed-layout.test.ts`: composición, filas `ToothRow`, cajas
  dentro del `viewBox` y sin solaparse, números, navegación `↑`/`↓` entre
  las cuatro filas, alineación de molares temporales con premolares, siglas
  de superficie y tramos dentro de una fila. Se portan casi literalmente.
* `tests/Odontogram-mixed.test.tsx`: render por defecto, selección FDI
  (también controlada), `teeth` (con IDs legacy), aviso de piezas
  desconocidas, condiciones + notación + media arcada, y `viewBox` de media
  arcada.

Traducción: el caso de Vue con `toothStates`, `findings`, `showSurfaces` y
`showNumbers` se reduce a condiciones, notación (en el `<title>` de cada
pieza) y media arcada, porque esas props llegan en R06–R09. El
`aria-label="mixed odontogram"` del SVG de Vue no existe en React (se usa
`<title>Odontogram</title>`); se revisa en R06 con las etiquetas i18n.

### Decisiones

* Números dibujados y navegación con flechas siguen siendo de R06: la
  composición por filas ya está en el núcleo y probada, así que R06 solo
  tiene que dibujarla.
* Como en `primary`, la selección no se filtra por `teeth`: la app debe
  normalizar los IDs que deja de dibujar.

### Pendiente

* Validación odontológica de la composición mixta (heredado de Vue).
* Historias: el arco mixto se muestra a 400 px de ancho para que quepa en la
  captura de 1000×900.

## R06 — Mejoras rápidas (2026-10-02)

| Verificación | Resultado |
| --- | --- |
| `pnpm tsc` / `pnpm lint:ci` / `pnpm build` | OK, sin advertencias |
| Tests | 33 archivos, 411 pruebas (42 nuevas) |
| Regresión visual | Las 35 capturas previas siguen idénticas; se añadieron 7 de "Features" |

### API

* `showNumbers` dibuja el número de cada pieza en `notation`
  (`src/NumberLayer.tsx`, con `getToothNumberLabels` del núcleo); Palmer con
  su esquina como trazo SVG. Con números el `viewBox` se calcula como en Vue
  (la composición crece donde hace falta; media arcada ajustada a piezas y
  números). Sin números no cambia nada: la permanente conserva sus `viewBox`
  0.5.x.
* `renderNumber(props)` sustituye el `<text>` y la esquina de cada número.
  Vue no tiene slot `number` (lo proponía D4); se definió aquí.
* Teclado: un único tab stop (roving tabindex) en la última pieza enfocada,
  la primera seleccionada visible o la primera pieza. Flechas, `Home` y
  `End` mueven el foco con `findNavigationTarget` (filas NTS, también en
  mixta) sin seleccionar. El contenedor deja de ser tabulable (antes
  `tabIndex=0`; sigue en `-1` si está deshabilitado).
* Tooltip: ya se abría con foco; ahora tiene `role="tooltip"`, muestra la
  condición en el contenido por defecto (pendiente de R04) y acepta
  `renderTooltip(props)` con el payload del slot Vue (`tooth`, `selected`,
  `condition`, `state`, `findings`, `number`, `surface`, `surfaceName`,
  `surfaceSummary`) más `detail` (`ToothDetail`). `state`, `findings` y las
  superficies tienen valores vacíos hasta R07–R09. `renderTooltip` gana a
  `tooltip.content`; `placement` y `margin` se mantienen.
* `labels` (`OdontogramLabelsInput`) traduce el nombre del contenedor, el
  `<title>` del SVG (`chartTitles`), el prefijo de cada pieza, el tooltip
  por defecto (incluido `toothTypes`) y la leyenda. Se exportan
  `defaultOdontogramLabels`, `formatToothNumber` y `getPalmerQuadrant`.
* Cada pieza tiene `data-tooth-id` (FDI), como en Vue.

### Cambios visibles respecto a 0.5.x

* Nombre accesible en la notación del gráfico: `Tooth 8` (Universal),
  `Tooth UR6` (Palmer); en FDI sigue `Tooth 11`. Quien busque piezas por
  nombre con otra notación debe actualizar sus selectores.
* `<title>` del SVG: `permanent odontogram` (antes `Odontogram`), según
  `labels.chartTitles`.
* Solo una pieza es alcanzable con Tab (antes todas y el contenedor).
* El tooltip por defecto añade la línea `Condition: …` si la pieza tiene
  condición.

Se mantienen: el `<title>` de cada pieza y `ToothDetail` con Palmer `6UR`
(Vue `6┘`), y el contenido por defecto del tooltip con FDI, tipo, Universal y
Palmer.

### Tests portados de Vue

`Odontogram-quick-wins.test.ts` y `Odontogram-notation.test.ts`, más casos
React de `renderTooltip`, `renderNumber`, `labels`, números dentro del
`viewBox` en las 6 combinaciones y 3 medias, y `showHalf` en todas las
denticiones. Traducción:

* El caso del slot `overlay` espera a R13; los nombres accesibles de
  superficies, a R08.
* `crops the viewBox height`: la permanente sin números conserva el `viewBox`
  0.5.x (justo la mitad), así que se compara con `≤ 694 / 2`.
* Tooltip: el contenido por defecto de React muestra FDI y las otras
  notaciones en líneas aparte, así que se comprueba `Universal: F` y
  `Palmer: 6UR` en vez de `Tooth: F` / `Tooth: 6┘`.

### Decisiones

* `showHalf` ya funcionaba en todas las denticiones y layouts desde R04–R05;
  R06 solo lo cubre con tests.
* Biome marca `aria-hidden` en el `<g>` de números
  (`noAriaHiddenOnFocusable`) aunque no es enfocable: se silencia con
  justificación.
* La lógica del contenido del tooltip sale a `getTooltipContent` para no
  superar la complejidad máxima del componente.

## R07 — Estados de pieza (2026-10-02)

Prop `toothStates` con `missing`, `extracted`, `implant` y `unerupted`, como
la Fase C de Vue. El núcleo (`state-marks.ts` y su test) ya venía de R01;
R07 añade la capa React.

### API

* `toothStates?: OdontogramToothStates` (`Partial<Record<string,
  ToothState>>`), con IDs en cualquier formato (`"18"` o `"teeth-18"`); las
  piezas no listadas son `present`. Se exportan los tipos `ToothState` y
  `OdontogramToothStates` y la constante `toothStates`.
* Cada pieza tiene `data-tooth-state` (también `present`) y, si no está
  presente, las clases `odontogram-tooth--<estado>`, más
  `odontogram-tooth--absent` para `missing` y `extracted`.
* Ausentes: contorno discontinuo (`4 3`), sin líneas de la corona y sin el
  color de su condición; la sombra se queda para hover y selección.
* `StateMarkLayer` dibuja la cruz (`extracted`) y el implante (`implant`)
  sobre las piezas, en `<g class="odontogram__state-marks" aria-hidden>`,
  después de las piezas y antes de los números.
* Nombre accesible: `Tooth 18, Extracted` (`labels.states`).
* Tooltip por defecto: línea `State: …` si la pieza no está presente;
  `renderTooltip` recibe el `state` real.
* Leyenda (`showLabels`): los estados de las piezas dibujadas, en orden fijo,
  con un icono en miniatura; aparece aunque no haya condiciones. Solo cuenta
  las piezas visibles (`showHalf`, `teeth`).
* CSS: `--odontogram-extracted-color`, `--odontogram-implant-color`,
  `--odontogram-implant-fill`, `--odontogram-absent-opacity`,
  `--odontogram-unerupted-opacity`.

### Tests portados de Vue

El bloque `toothStates prop` de `tooth-states.test.ts` (10 casos) en
`tests/Odontogram-tooth-states.test.tsx`, más 7 casos React: clases 0.5.x
intactas, marcas encima de las piezas, IDs legacy, mixta, `teeth` y piezas
deshabilitadas. Traducción:

* `v-model` → `value` + `onChange` con `idFormat="fdi"`; el slot `tooltip` →
  `renderTooltip`. React aún no tiene `onToothClick`, así que solo se
  comprueba `onChange`.
* `odontogram-tooth--selected` → clase 0.5.x `selected`.

### Decisiones

* El modelo (`buildOdontogramModel`) calcula `stateMarks` y `legendStates`
  sobre los anchors dibujados, para que la media arcada y `teeth` queden
  fuera sin lógica extra.
* Las clases de estado se añaden después de `teeth-NN [selected]`, así el
  selector 0.5.x `g[class^="teeth-"]` sigue funcionando y las piezas
  presentes conservan su `class` exacta.
* Los estilos van en `styles.css` bajo `.Odontogram` (Vue los tenía en el
  SFC). El icono de la leyenda usa `--base-blue` como trazo por defecto.
* Las 42 capturas previas no cambian (comparación byte a byte); se añaden 3
  historias en "Features" (`ToothStates`, `ToothStatesHorizontal`,
  `MixedToothStates`) con su captura.

### Pendiente

* ~~Las superficies de piezas ausentes no serán seleccionables
  (`inactiveSurfaceTeeth` de Vue): llega con R08.~~ Hecho en R08.

## R08 — Superficies (2026-10-02)

Diagramas de cinco superficies, como la Fase D de Vue. La geometría
(`surfaces.ts`, `tooth-frames.ts`) y sus tests ya venían de R01; R08 añade la
capa React.

### API

* `showSurfaces`: un diagrama por pieza dibujada, en el lado vestibular. En
  `arch` se suaviza la curva (`fairCurve`) y en `horizontal` se alinean las
  filas (`alignRows`), como Vue. El `viewBox` crece para contenerlos (también
  en la permanente, que sin superficies ni números mantiene el de 0.5.x).
* `surfaceShape`: `square` (por defecto) o `circle`.
* `showSurfaceLetters`: letra de cada superficie (V, M, O/I, D, L/P) según
  `labels.surfaceLetters`; solo con `showSurfaces`.
* `surfaces` (controlado) / `defaultSurfaces` (no controlado) /
  `onSurfacesChange(surfaces)`: selección propia, independiente de la de
  piezas. Claves en cualquier formato de ID; los callbacks usan `idFormat`
  (`"teeth-16"` por defecto, `"16"` con `fdi`).
* `onSurfaceClick(tooth, surface, surfaces)`: misma firma que el evento
  `surface-click` de Vue; `tooth` es el `ToothDefinition` (ID FDI).
* Cada superficie: `<path role="checkbox">` con `aria-checked`, nombre
  `Tooth 11, Incisal` (en la notación del gráfico), `data-surface-tooth`,
  `data-surface` y clase `odontogram-surface--selected`. El grupo
  `.odontogram__surfaces` tiene `role="group"` y `labels.surfaces`.
* Teclado: un tab stop propio (última superficie enfocada, primera
  seleccionada o primera superficie de la primera pieza activa).
  Izquierda/derecha, `Home` y `End` entre piezas (saltando las inactivas);
  arriba/abajo entre superficies; Enter/Espacio alterna.
* Piezas `missing`/`extracted`: diagrama atenuado
  (`odontogram-surfaces--inactive`), `aria-disabled` y sin clics. `disabled`
  bloquea todas y quita el tab stop.
* Tooltip de superficie (hover o foco): `Tooth`, `Surface`, definición
  (`labels.surfaceDescriptions`), estado y `Selected`. `renderTooltip` recibe
  `surface` y `surfaceName`, y `selected` pasa a ser el de la superficie.
  Sigue el mismo `showTooltip` que las piezas.
* Exporta `toothSurfaces`, `surfaceShapeKinds`, `getSurfaceName` y los tipos
  `OdontogramSurfaces`, `SurfaceShapeKind`, `ToothSurfaceName`.
* Hook nuevo `useSurfaceSelection` (controlado/no controlado, IDs FDI).

### Tests portados de Vue

`tests/Odontogram-surfaces.test.tsx` (23 casos): el bloque "Odontogram
surfaces" de `surfaces.test.ts` (6), el caso arch/horizontal de "curve
fairing", el bloque "surface tooltip" de `surface-tooltip-shape.test.ts` (sin
hallazgos) y la equivalencia de posiciones cuadrado/círculo, más casos React
(no controlado, controlado, IDs legacy, letras, forma circular, tab stops,
deshabilitado, estado en el tooltip, navegación que salta piezas inactivas).
Traducción:

* `v-model:surfaces` → `surfaces` + `onSurfacesChange` con `idFormat="fdi"`;
  `surface-click` → `onSurfaceClick`; slot `tooltip` → `renderTooltip`.
* El slot `overlay` (R13) se sustituye por
  `buildOdontogramModel(...).surfaceDiagrams`.
* Los hallazgos en el tooltip de superficie, el resumen por superficie y las
  franjas de hallazgos en diagramas circulares esperan a R09; `SurfaceGuide`,
  a R10.

### Decisiones

* Los diagramas van en el modelo (`buildOdontogramModel`), sobre los anchors
  dibujados, así `showHalf` y `teeth` los filtran sin lógica extra.
* `useToothTooltip.show(toothId, event, surface?)` se ancla al propio
  `<path>` de la superficie; el estado del tooltip guarda `surface`.
* CSS: la regla 0.5.x `.Odontogram svg path:nth-of-type(2) { opacity: 0 }`
  ocultaba la segunda superficie de cada diagrama; se anula con
  `path.odontogram-surface`. Colores sobre las variables del tema
  (`--base-blue`, `--light-blue`, `--dark-blue`); en `theme="dark"` el relleno
  es oscuro.
* Para no superar la complejidad máxima de `Odontogram`, la lógica de
  superficies sale a `useChartSurfaces` y el detalle del tooltip a
  `getSurfaceTooltipDetails`; los manejadores de tooltip de piezas y
  superficies comparten un único `showTooltip`.
* Las 45 capturas previas no cambian; se añaden 8 historias
  "Components/Surfaces" con su captura.

### Pendiente

* R09: hallazgos sobre superficies, desplazamiento de abreviaturas fuera del
  diagrama (ya en `layoutFindings`), resumen por superficie en el tooltip.
* R11: menú de superficie (`renderSurfaceMenu`), que cambia los checkboxes
  por botones.

## R09 — Hallazgos y tratamientos (2026-10-02)

Hallazgos clínicos y tratamientos, como la Fase E de Vue. El layout
(`findings.ts`, `tooth-frames.ts`), el catálogo NTS y `finding-records.ts`
ya venían de R01 con sus tests; R09 añade la capa React.

### API

* `findings?: OdontogramFinding[]` con IDs en cualquier formato y
  `findingCatalog` (por defecto `ntsPeruFindingCatalog`). Se exportan
  `ntsPeruFindingCatalog`, `findingStatuses` y los tipos `OdontogramFinding`,
  `FindingCatalog`, `FindingDefinition`, `FindingSymbol`, `FindingStatus`,
  `FindingTone`, `FindingDirection`.
* `FindingLayer` dibuja cada hallazgo en
  `<g class="odontogram__findings" aria-hidden>`: un grupo por hallazgo con
  `odontogram-finding--<tone>`, `odontogram-finding--<status>`,
  `data-finding`, `data-status`, `data-teeth`, `style="color"` si hay
  `color` y trazo discontinuo si está `planned`. `FindingPrimitives` dibuja
  los cuatro primitivos del núcleo (`path`, `area`, `circle`, `text`), que
  cubren los 20 tipos de símbolo.
* Orden de capas como Vue: piezas, marcas de estado, superficies, hallazgos,
  letras de superficie, números.
* Nombre accesible: `Tooth 11, Lesión de caries dental (Vestibular, Incisal),
  Restauración definitiva (Mesial, Planned)`, después del estado.
* Tooltip de pieza: línea `Findings:` con los hallazgos de pieza y, si hay
  hallazgos de superficie, `Surfaces:` con una línea por superficie
  (`data-summary-surface`). Tooltip de superficie: sus hallazgos.
  `renderTooltip` recibe `findings` y `surfaceSummary`.
* Leyenda: una entrada por código, estado y color, con su icono.
* Hallazgos inválidos (código desconocido, pieza no dibujada, superficie sin
  diagramas…): no se dibujan y se avisa una vez en desarrollo
  (`[react-odontogram] …`).
* El `viewBox` crece para contener los hallazgos fuera del gráfico; sin
  hallazgos dibujados la permanente mantiene el de 0.5.x.

### Tests portados de Vue

`tests/Odontogram-findings.test.tsx` (21 casos): el bloque "findings prop"
de `findings.test.ts` (10), los casos con hallazgos de
`surface-tooltip-shape.test.ts` (tooltip de superficie, resumen por
superficie y franjas en diagramas circulares) y casos React (IDs legacy,
mixta, catálogo propio, `viewBox` 0.5.x, estado + hallazgos en el nombre).
Traducción: `v-model` → `value` + `onChange` con `idFormat="fdi"`; slot
`tooltip` → `renderTooltip`; el aviso usa el prefijo `[react-odontogram]`.

### Decisiones

* Los textos (nombres accesibles, tooltip, leyenda) están en
  `src/findingText.ts`, sin React; `useChartFindings` los memoiza y emite los
  avisos. El layout va en `buildOdontogramModel`
  (`renderedFindings`, `findingIssues`, `findingsByTooth`).
* CSS: la regla 0.5.x `.Odontogram svg path:nth-of-type(2)` ocultaba el
  segundo trazo de los hallazgos y de los iconos de la leyenda (la cruz de
  extracción salía como una sola línea); se anula para `.odontogram-finding`.
  En `theme="dark"` los tonos son más claros.
* La regla `useSortedClasses` de Biome quitaba el espacio entre dos
  interpolaciones de un `className`; las clases de hallazgo se construyen con
  `findingClassName`.
* **Paleta del anexo:** no se crea un catálogo "genérico". La paleta clínica
  describe condiciones (placa, sangrado, decoloración…), que ya cubre
  `conditions` con `fillColor`/`outlineColor`; los hallazgos siguen la
  convención NTS (azul bueno / rojo malo) y aceptan cualquier `color`. Un
  catálogo genérico (p. ej. FDI o ADA) se puede añadir más adelante como otro
  `FindingCatalog` sin cambiar la API.
* Las 53 capturas previas no cambian; se añaden 6 historias
  "Components/Findings" con su captura (todos los símbolos de pieza, entre
  piezas y tramos, arco, estado y color, franjas circulares, primaria).

### Pendiente

* R10: exportar `getToothRecord`, `addFinding`, `addSurfaceFinding`,
  `removeSurfaceFinding` y `SurfaceGuide`.
* Catálogo NTS Perú pendiente de verificar contra la norma oficial (heredado
  de Vue).

## R10 — Registro por pieza y `SurfaceGuide` (2026-10-02)

`finding-records.ts` y `getSurfaceAxes` ya venían de R01 con sus tests; R10
los hace públicos y añade el componente `SurfaceGuide`.

### API

* Se exportan `getToothRecord`, `addFinding`, `addSurfaceFinding`,
  `removeSurfaceFinding`, `toggleSurface`, `getFindingScope`,
  `resolveFindingTone` y los tipos `ToothRecord`, `ToothFindingEntry`,
  `SurfaceFindingInput`, `ToothFindingInput`, `SurfaceFindingRemoval`.
* `SurfaceGuide` (y `SurfaceGuideProps`): `toothId` e IDs de `findings` en
  cualquier formato, `findingCatalog`, `selected`, `active`,
  `onActiveChange` (equivale a `update:active`), `onSurfaceClick`
  (`surface-click`), `labels`, `notation`, `disabled`, `shape`, `showList` y
  `className`. Marcado igual que Vue: `section` con `aria-label`
  `Surface guide, Tooth UR1`, `data-guide-surface`, `data-guide-item`,
  `data-highlight`, botones con `aria-pressed`.

### Tests portados de Vue

`tests/SurfaceGuide.test.tsx` (16 casos): el bloque "SurfaceGuide" de
`surface-guide.test.ts` (8), el caso de la guía circular de
`surface-tooltip-shape.test.ts`, el bloque "public API" de
`finding-records.test.ts` y casos React (IDs legacy, `showList={false}`,
botones deshabilitados, guía junto al gráfico, `addSurfaceFinding` dibujado
por el gráfico). El bloque "showSurfaceLetters" ya estaba cubierto en R08.
Traducción: `update:active` → `onActiveChange`, `surface-click` →
`onSurfaceClick`, `setProps` → `rerender`; la comprobación de exportación
usa imports con nombre (Biome no admite `import * as`).

### Decisiones

* La guía vive fuera de `.Odontogram`: sus estilos van bajo
  `.odontogram-surface-guide` y los de hallazgos se comparten con
  `:is(.Odontogram, .odontogram-surface-guide)`. Colores sobre las mismas
  variables (`--base-blue`, `--light-blue`, `--dark-blue`, `--odontogram-surface-*`).
* El estado activo local (hover/foco) gana a `active` mientras dura, como en
  Vue.
* Las 59 capturas previas no cambian; se añaden 5 historias
  "Components/Surface Guide" con su captura (incluida una guía sincronizada
  con el gráfico).

### Pendiente

* R11: menú de superficie (`renderSurfaceMenu`).

## R11 — Menú de superficie (2026-10-02)

### API

* `renderSurfaceMenu(props)` (tipo `SurfaceMenuRenderProps`): `toothId`
  (FDI), `tooth`, `surface`, `surfaceName`, `record` (`getToothRecord` de la
  pieza con los `findings` actuales) y `close`. Es el slot `surface-menu` de
  Vue.
* Con la prop, un clic o Enter/Espacio en una superficie abre el menú en
  lugar de alternarla: no llama a `onSurfacesChange` y `onSurfaceClick`
  recibe el modelo actual. Las superficies pasan a `role="button"` con
  `aria-haspopup="dialog"` y `aria-expanded`.
* Panel `div.odontogram-surface-menu` con `role="dialog"`, `aria-label`
  `Surface findings: Tooth 36, Occlusal` y `data-menu-for`, `position: fixed`
  debajo de la superficie (encima si no cabe), dentro del viewport y con el
  foco en su primer control.
* Se cierra con `close()` o Escape (devuelven el foco a la superficie), con
  un clic fuera (`pointerdown` en captura) y cuando su pieza deja de
  dibujarse. El tooltip se oculta mientras está abierto. No se abre en
  piezas ausentes ni con el gráfico deshabilitado.

### Tests portados de Vue

`tests/Odontogram-surface-menu.test.tsx`: los 8 casos de
`surface-menu.test.ts` (la app de prueba usa `useState` en lugar de `ref`) y
3 casos React (foco en el primer control, cierre al ocultar la pieza,
payload con IDs legacy).

### Decisiones

* La lógica vive en `useChartSurfaceMenu` (`src/SurfaceMenu.tsx`);
  `useChartSurfaces` decide si activar abre el menú o alterna la superficie.
* Cada `<path>` de superficie es ahora un componente `SurfacePath`, para no
  superar la complejidad máxima.
* El panel es un `div` con `role="dialog"` (como Vue): un `<dialog>` nativo
  añadiría estilos del navegador y capa superior a un panel no modal.

## R12 — `ToothInspector` (2026-10-02)

### API

* `ToothInspector` (y `ToothInspectorProps`): `toothId`, `findings`,
  `toothStates` (IDs en cualquier formato), `findingCatalog`, `labels`,
  `notation`, `shape`, `disabled`, `selectedSurfaces` +
  `onSelectedSurfacesChange` (equivale a `v-model:selected-surfaces`),
  `onAddFinding` (`add-finding`), `onRemoveFinding` (`remove-finding`) y
  `className`.
* Cabecera (número, tipo, estado), `SurfaceGuide` sin lista, hallazgos por
  superficie y de pieza con botones de quitar (solo los propios: los tramos y
  pares se quitan desde sus piezas), y formulario con códigos de superficie y
  de pieza (no tramos), estado y botón `Add`.
* Sin `selectedSurfaces` el panel guarda su propia elección, que se vacía al
  cambiar de pieza (se guarda junto al `toothId`, sin efecto).
* Se exporta `getToothType`.

### Tests portados de Vue

`tests/ToothInspector.test.tsx`: los 12 casos de `tooth-inspector.test.ts`
(incluidos `getToothType` y `addFinding`) y 3 casos React (IDs legacy, panel
sincronizado con el gráfico añadiendo un hallazgo, nombres de los botones de
quitar). Traducción: `setValue` → `fireEvent.change`/`click`, `setProps` →
`rerender`.

### Decisiones

* Colores del botón y estados sobre las variables del tema
  (`--odontogram-surface-selected-color`, `--dark-blue`).
* Las 64 capturas previas no cambian; se añaden 3 historias
  "Components/Finding Records" (menú de superficie, inspector junto al
  gráfico, inspector de solo lectura).

### Pendiente

* R13: `renderOverlay` y exportar `getToothAnchors`/`getLayoutViewBox`.

## R13 — Overlay y anchors (2026-10-02)

`anchors.ts` y su test puro ya venían de R01; R13 añade el overlay y la
exportación.

### API

* `renderOverlay(props)` (tipo `OdontogramOverlayRenderProps`): `anchors`
  (por ID FDI, como el slot Vue), `anchorList` (los mismos en orden de
  dibujo; extra de React), `viewBox` (el `viewBox` renderizado como caja),
  `dentition`, `layout` (ya sin alias: `square` llega como `horizontal`) y
  `surfaceDiagrams`. Se dibuja en `<g class="odontogram__overlay">`, último
  hijo del SVG, con `pointer-events: none`.
* Se exportan `getToothAnchors`, `getLayoutViewBox`, `parseViewBox` y los
  tipos `ToothAnchor`, `Box`, `Point`, `OdontogramLayout`, `SurfaceDiagram`,
  `SurfaceShape`.

### Tests portados de Vue

`tests/Odontogram-overlay.test.tsx`: los casos de overlay de
`Odontogram-api-improvements.test.ts` (2) y `Odontogram-quick-wins.test.ts`
(1), el caso de componente de "curve fairing" de `surfaces.test.ts` (que en
R08 se cubrió con el modelo) y 4 casos React (`viewBox` 0.5.x en media
arcada, layout con alias, clics a través del overlay, anchors dentro del
`viewBox` en las 6 combinaciones). `anchors.test.ts` de Vue no tiene casos de
componente.

### Decisiones

* `viewBox` es el que se dibuja de verdad, también los fijos de 0.5.x de la
  permanente, no la composición de Vue: así las marcas encajan en lo que se
  ve.
* La historia `ToothBoxes` dibuja la caja de cada anchor sobre su pieza y
  confirma que coinciden con el render React.
* Las 67 capturas previas no cambian; se añaden 3 historias
  "Components/Overlay".

### Pendiente

* R14: tema y estilos.

## R14 — Tema y estilos (2026-10-02)

### API

* Variables de Vue como API principal: `--odontogram-stroke-color`,
  `--odontogram-selected-color`, `--odontogram-hover-color`,
  `--odontogram-selected-stroke-color`, `--odontogram-focus-outline-color`,
  más `--odontogram-accent-color` (nueva: acento de superficies
  seleccionadas, números seleccionados y resaltados de la guía). Cada una cae
  en las 0.5.x: trazo → `--base-blue`, seleccionada → `--light-blue`, hover →
  seleccionada, acento → `--dark-blue`, trazo seleccionado y foco → acento.
  Las variables por parte (superficies, números, hallazgos…) caen en estas.
* Atajos: `theme` y las claves 0.5.x de `colors` siguen escribiendo
  `--dark-blue`/`--base-blue`/`--light-blue` en el contenedor; las claves
  nuevas `stroke`, `selected`, `hover`, `selectedStroke` y `accent` escriben
  las variables de Vue. `selectedColor` y `hoverColor` escriben
  `--odontogram-selected-color`/`--odontogram-hover-color`; `colors` gana si
  fija el mismo color y `styles` gana a todo. El cálculo vive en
  `getThemeVars` (`src/utils.ts`).
* `react-odontogram/style.css` (`dist/index.css`) mantiene la ruta e incluye
  los estilos de estados, superficies, hallazgos, menú, guía, inspector y
  overlay.

### Correcciones

* `selectedColor` y `hoverColor` estaban declarados desde 0.5.x pero ningún
  código los usaba; ahora funcionan.
* El `<svg>` interno también tiene la clase `Odontogram`: las reglas que
  definían `--odontogram-surface-fill` y `--odontogram-surface-letter-color`
  en `.Odontogram` las volvían a fijar en el SVG, así que el tema oscuro y las
  variables de la app (en el contenedor o un ancestro) no llegaban a las
  superficies. Los valores por defecto pasan a ser fallbacks en el punto de
  uso, con variantes para `.dark-theme`; igual con los colores de hallazgo.
* Tema oscuro: la leyenda tomaba el color de texto de la página (negro sobre
  fondo oscuro) y los iconos de hallazgos perdían su tono por
  `.Odontogram.dark-theme svg { color }`.

### Tests

`tests/theme.test.tsx` (11): variables escritas por `theme`, `colors`,
`selectedColor`/`hoverColor` y su prioridad; `styles` del usuario; guardas
sobre `styles.css` (las variables 0.5.x solo como fallback al final de una
cadena `--odontogram-*`, ninguna variable de superficie o hallazgo fijada en
`.Odontogram`, todos los componentes con estilos).

### Decisiones

* Las 70 capturas previas no cambian byte a byte: los valores por defecto
  son los mismos. Se añaden 4 historias "Components/Theme" (por defecto,
  atajos, variables CSS, oscuro con superficies, hallazgos y leyenda).

### Pendiente

* R15: revisión de la API pública.

## R15 — API pública (2026-10-02)

### API

`src/index.ts` agrupado por componentes, hooks, notación, hallazgos,
superficies y geometría. Expone en ejecución los 25 nombres de
`vue-odontogram` 0.1.1 más 7 de React: `default`, `getViewBox` (0.5.x),
`parseViewBox`, `useOdontogram`, `buildOdontogramModel`,
`useToothSelection` y `useSurfaceSelection` (los composables de la decisión
D4). Nuevos en R15:

* Componente `Tooth` (y `ToothProps`, `ToothCondition`).
* `buildToothId`, `getQuadrant` y los tipos `PalmerQuadrant`,
  `NtsPeruFindingCode`, `FindingScope`, `FindingSymbolKind`, `DentalArch`,
  `DentalSide`, `Dentition`, `OdontogramCondition`, `OdontogramHalf`,
  `ToothNotation`, `ToothShape`, `ToothType`, `ToothVisualCondition`,
  `TooltipPlacement` (alias de `Placement`).
* Hooks y sus tipos (`OdontogramModel`, `OdontogramModelOptions`,
  `ToothSelectionOptions`, `SurfaceSelectionOptions`, `NonPresentToothState`).

Se mantienen todos los exports de 0.5.8 (comprobado contra `da4e630`: el
default, `Odontogram`, `getViewBox` y los tipos de `src/type.ts`).

### Tests

`tests/public-api.test.tsx` (6): el caso de Vue, la lista exacta de exports
en ejecución (los de Vue más los de React, para que cualquier alta o baja sea
un cambio visible), el default y `getViewBox`, los componentes renderizan,
los helpers de notación y `expectTypeOf` sobre los tipos públicos (`tsc`
cubre `tests/`). Además se comprobó el paquete construido: CJS y ESM exponen
los mismos 32 nombres y los tipos llegan a `dist/index.d.ts`.

### Decisiones

* `buildToothId` siempre devuelve FDI (como en Vue); el número en otra
  notación sale de `formatToothNumber`.
* El test usa `import * as` para listar el módulo, con supresión justificada
  de `noNamespaceImport`.

### Pendiente

* R16: Storybook y ejemplo.

## R16 — Storybook y ejemplo (2026-10-02)

### Storybook

* La lista de R16 ya estaba cubierta por las historias de R04–R15:
  primaria, mixta, "Features" (notaciones, números, i18n, estados),
  "Surfaces", "Findings" (todos los símbolos NTS), "Finding Records" (menú e
  inspector), "Surface Guide", "Overlay" y "Theme" (oscuro). `zBaby` se
  eliminó en R04.
* Nuevas: "Overview" (las 6 combinaciones dentición × layout, con y sin
  números y superficies) y "Components/Legacy API (0.5.x)" (`circle`,
  `square` + `readOnly`, `maxTeeth`, `teethConditions`, `defaultSelected`).
* `Example`, `Layout` y `Odontogram` ("Read Only Odontogram") pasan a la API
  nueva (`arch`/`horizontal`, `conditions`, `disabled`, `defaultValue`, IDs
  FDI). Sus capturas de R00 no cambian byte a byte: los alias renderizan
  igual. `Form` sigue con IDs `teeth-NN` porque muestra el input 0.5.x.

### Ejemplo `examples/responsive-site`

* API nueva: `layout` `arch`/`horizontal`, selector de dentición en lugar del
  deslizador `maxTeeth`, `conditions` con IDs FDI (filtradas por dentición),
  `disabled`, selección controlada (el contador ya coincide con el gráfico
  desde el primer render; antes mostraba 0 con 11 y 21 seleccionadas).
* Funciones nuevas: forma de diagrama, números, superficies, hallazgos NTS de
  ejemplo, estados de pieza y un `ToothInspector` de la última pieza
  seleccionada que añade y quita hallazgos. Nuevos paneles "Mixed dentition
  chart" y "Surface findings chart". Estilos oscuros para el inspector.
* Exportación SVG/PNG: antes inyectaba tres reglas fijas; ahora anida el SVG
  en un `<svg class="Odontogram">` con las reglas de la librería leídas de
  `document.styleSheets` y las variables del tema, así salen superficies,
  hallazgos y marcas. El JSON incluye dentición, estados, hallazgos y
  superficies.
* `vite.config.ts` (nuevo) con `resolve.dedupe: ["react", "react-dom"]`: la
  app importa la librería desde `../../src`, que resolvía su propia copia de
  React en la raíz y la página quedaba en blanco (`Cannot read properties of
  null (reading 'useMemo')`). Ya pasaba con el `App.tsx` anterior.
* Sin cambios en marca, textos SEO, `index.html` ni enlaces del autor
  original (`dental.coolhead.in`, Coolhead, Biomathcode).
* Verificado: `npx vite build` (Vite 8.3.2) y capturas con Chrome headless a
  1440 y 500 px, sin errores en consola. La captura a 390 px se recorta
  porque Chrome headless no baja de ~500 px de ventana; el diseño encaja a
  500 px. Las dependencias del ejemplo se instalaron con
  `npm install --no-package-lock` (no se añade lockfile; `node_modules` y
  `dist` están ignorados).

### Pendiente

* Heredado de Vue: en mixta `arch` con números y superficies, los números
  temporales se solapan con los diagramas (visible en "Overview").
* R17: tests de componente.

## R17 — Tests de componente (2026-10-02)

### Portados en R17

Los tests de componente de Vue que quedaban:

* `Odontogram-layout.test.ts` → `tests/Odontogram-layout.test.tsx` (3).
* `Odontogram-horizontal-interactions.test.ts` →
  `tests/Odontogram-horizontal-interactions.test.tsx` (3).
* `Odontogram-api-improvements.test.ts` →
  `tests/Odontogram-api-improvements.test.tsx` (7; los 2 de overlay estaban
  en `Odontogram-overlay.test.tsx` desde R13).
* `Odontogram.test.ts` → bloque "Odontogram (vue-odontogram)" de
  `tests/Odontogram.test.tsx` (4).
* Bloque "showSurfaceLetters" de `surface-guide.test.ts` y "exports the shape
  kinds" de `surface-tooltip-shape.test.ts` (3).
* `tests/Odontogram-legend.test.tsx` (3, React): leyenda vacía, iconos de
  cada estado y `tooltip.placement` desconocido; salieron del informe de
  cobertura.

### Paridad con Vue

Vue: 265 casos (`it`, `it.each` cuenta una vez) en 40 archivos; React: 567
pruebas en 46 archivos. Una auditoría por títulos (exactos o aproximados)
deja 12 casos de Vue con otro nombre en React, todos cubiertos:

| Vue | React |
| --- | --- |
| primary-horizontal-interactions: controlled multiple/single selection, disabled | `Odontogram-primary.test.tsx` "uses primary identifiers for single selection", "blocks interaction when disabled" (también horizontal) |
| primary-horizontal-interactions: tooltip, conditions and labels | `Odontogram-primary.test.tsx` (tooltip/condiciones en `arch` y `horizontal`) |
| primary-horizontal: horizontal shape local scale | "applies only each horizontal shape transform" |
| primary: v-model selection and events | "reports primary selection and tooth details" |
| primary-canine / central-incisor / lateral-incisor | "uses the intended placement adjustments in all four quadrants", "separates the central incisors from the midline" |
| Odontogram: v-model and events in multiple mode | "reports the selection in multiple mode, controlled" |
| Odontogram: soft gray border for a selected tooth | "marks a selected tooth for the selected stroke color" (el trazo viene de la hoja de estilos; `theme.test.tsx` comprueba la variable) |
| surface-guide: needs the surface diagrams | `Odontogram-surfaces.test.tsx` "draws no letters without showSurfaces" |
| surface-tooltip-shape: chart positions and strips | "keeps the chart positions with circular diagrams" + `Odontogram-findings.test.tsx` "splits shared surfaces into strips" |
| surfaces: used by the component in the arch layout only | `Odontogram-overlay.test.tsx` "gives the surface diagrams, faired in the arch layout only" |

La suite de componentes de Vue no carga en este entorno (cuenta 0 casos al
ejecutarla), así que la comparación es estática sobre las fuentes.

### Cobertura

`src/` (sin historias): 98,98 % sentencias y líneas, 95,06 % ramas, 94,83 %
funciones. Los archivos con 0 % solo declaran tipos.

### Corrección

* La leyenda usaba `condition.label` como `key`: dos condiciones con la misma
  etiqueta (permitido, como en Vue) disparaban el aviso de React de claves
  duplicadas. Ahora la clave es índice + etiqueta. Venía de 0.5.x.

### Traducción

`v-model`/`change`/`tooth-click` → `value` + `onChange` con `idFormat="fdi"`;
`setProps` → `rerender`; slot `tooltip` → `renderTooltip`. El tooltip por
defecto de React no tiene la línea "Selected" (mantiene el contenido 0.5.x)
y el SVG se nombra con su `<title>`, no con `aria-label`.

### Pendiente

* R18: documentación y publicación.

## R18 — Documentación y publicación (2026-10-02)

### Documentos

* `README.md` reorganizado con las secciones de `README-vue-odontogram.md`
  (instalación, uso, denticiones, layouts, selección y condiciones, props,
  callbacks con la tabla de eventos Vue → React, estados, notaciones,
  superficies con guía/registro/menú/inspector, hallazgos con catálogo NTS y
  catálogos propios, teclado, tooltip, overlay, textos, tema, API pública,
  licencia y procedencia de los SVG, desarrollo), conservando lo propio de
  React (paquetes, React Native, demo, `onChange`). Se retiran las recetas con
  la API deprecada y el "Tooth Data Model" de 0.5.x.
* `MIGRATION.md` 0.5 → 0.6: props deprecados y sus equivalentes, IDs e
  `idFormat`, por qué `maxTeeth={5}` no es dentición temporal, y los cambios
  visibles (nombres accesibles, `<title>`, tab stop único, tooltip,
  atributos, `selectedColor`/`hoverColor`, variables CSS, leyenda, `viewBox`,
  componente `Teeth`).
* `THIRD_PARTY_NOTICES.md`: núcleo y SVG temporales de `vue-odontogram`
  (MIT © 2026 Manuel Díaz, texto completo), procedencia de los SVG
  permanentes (propios de 0.5.x, verificados literales por
  `react-parity.test.ts`), aviso de SVG temporales provisionales y de catálogo
  NTS pendiente de verificar.
* `CHANGELOG.md` (Keep a Changelog) con 0.6.0 como "Unreleased".
* `package.json`: versión 0.6.0 y `files` con `CHANGELOG.md`, `MIGRATION.md`
  y `THIRD_PARTY_NOTICES.md` (antes solo `dist`; la licencia MIT de
  `vue-odontogram` exige que su aviso acompañe las copias). `npm pack
  --dry-run` lista 10 archivos.

### Verificado contra el código

35 códigos del catálogo NTS, 19 tipos de símbolo, campos de
`ToothDefinition`, Palmer temporal `A`–`E` y Universal `A`–`T`, avisos de
deprecación (solo `layout` antiguo, `maxTeeth` y `teethConditions`; los
alias `defaultSelected` y `readOnly` no avisan) y que el tooltip ya se abría
con el foco en 0.5.x (lo nuevo es `role="tooltip"`).

### Sin publicar

No se ejecutó `npm publish`, `release-it`, tags ni releases. Decisiones
pendientes:

* **Nombre del paquete.** `react-odontogram` en npm pertenece al autor
  original (Pratik Sharma / biomathcode). Publicar 0.6.0 con ese nombre
  requiere sus permisos o un PR aceptado upstream; si no, hace falta un
  nombre propio (por ejemplo con scope, como `@kmanueldc/vue-odontogram`).
  `repository`, `author` y los enlaces del README siguen apuntando a
  upstream.
* **`LICENSE`.** El repositorio no tiene archivo `LICENSE` (solo `"license":
  "MIT"` en `package.json`), así que el paquete no incluye el texto de la
  licencia propia. No se creó uno para no fijar el titular del copyright sin
  confirmarlo.
* `release-it` está configurado con `npm.publish: false` y
  `github.release: true`: crea commit, tag y release de GitHub, no publica en
  npm.
* `react-native-odontogram` (0.1.0) no cambia; su migración al núcleo es R19.

### Pendiente

* R19 (opcional): React Native. Hecho el 2026-10-05.
* R20 (opcional): paquete core compartido. Hecho el 2026-10-05.

## R20 — Paquete core compartido (2026-10-05)

Detalle de uso y de la migración pendiente de Vue en
[docs/core-package.md](core-package.md).

| Verificación | Resultado |
| --- | --- |
| `src/core` frente a Vue `66bd190` | Idénticos salvo el orden de imports (Biome), comprobado archivo a archivo antes de moverlo |
| `pnpm install --frozen-lockfile` | OK (lockfile con el importer `packages/odontogram-core`) |
| `pnpm tsc` | OK; el core también compila solo con `lib: ES2020`, sin DOM |
| `pnpm lint:ci` | OK |
| `pnpm test:coverage` | 48 archivos, 592 pruebas |
| `pnpm build` | OK; `dist/index.d.ts` mide igual que antes (53 817 bytes) y `dist/` no menciona el core |
| Build del core | OK; `npm pack --dry-run`: 9 archivos |
| `pnpm storybook:build` | OK |
| `examples/responsive-site` (`vite build`) | OK |

### Cambios

* `git mv src/core → packages/odontogram-core/src` y `tests/core →
  packages/odontogram-core/tests` (se conserva el historial).
* `packages/odontogram-core`: `package.json` (`@kmanueldc/odontogram-core`
  0.1.0, `sideEffects: false`, sin dependencias), `src/index.ts` (reexporta
  los 28 módulos), `tsup.config.ts`, `tsconfig.json`, `README.md` (inglés,
  para npm) y `THIRD_PARTY_NOTICES.md`.
* `pnpm-workspace.yaml` con solo el core. El paquete RN se queda fuera:
  con él, pnpm autoinstalaba `react-native` 0.87 como peer.
* Los imports de React (`./core/...` en 56 archivos) pasan a
  `@kmanueldc/odontogram-core` y se agrupan en un solo import por archivo.
  Los `vi.mock` de los tests de aislamiento siguen apuntando a archivos
  concretos del core.
* Resolución al código fuente: `tsconfig.json` (`paths`),
  `vitest.config.mts`, `.storybook/main.ts` (`webpackFinal`) y
  `examples/responsive-site/vite.config.ts`. En el build, tsup empaqueta el
  core con `noExternal` y `dts.resolve`.
* `tests/core/react-parity.test.ts` se divide en dos.
  `packages/odontogram-core/tests/no-dependencies.test.ts` comprueba que no
  hay imports externos y que todo se reexporta. `tests/core-parity.test.ts`
  compara los paths y los transforms de cuadrante 0.5.8 con el core.
* `biome.json`: el override de `src/core/**` y `tests/core/**` pasa a
  `packages/odontogram-core/**`.

### Decisiones

* **Monorepo y empaquetado** (elegido por el usuario): `react-odontogram`
  no depende del core en runtime, así que puede publicarse sin publicar
  antes el core. Cambiar a dependencia real es quitar dos opciones de tsup.
* **Vue sin migrar** (elegido por el usuario): su repositorio tenía cambios
  sin commitear y el core no está publicado. Los pasos están en
  `docs/core-package.md`.

### Pendiente

* Publicar `@kmanueldc/odontogram-core` y migrar `vue-odontogram`.
* `pnpm example:responsive:build` falla desde la raíz porque `vite` solo
  está instalado en el ejemplo (ya pasaba antes de R20). Con
  `examples/responsive-site/node_modules/.bin/vite build` funciona.

## R19 — React Native (2026-10-05)

| Verificación | Resultado |
| --- | --- |
| Tests 0.1 de RN (`NativeOdontogram.test.tsx`) | 9/9 sin cambios |
| Tests nuevos (`NativeOdontogram-core.test.tsx`) | 23 |
| `tsc -p packages/react-native-odontogram` | OK |
| Build RN (`tsup`) | OK. El JS solo importa `react`, `react/jsx-runtime` y `react-native-svg`; el `.d.ts` (21,7 KB) no tiene imports externos |

### Diseño

`NativeOdontogram` usa lo mismo que la versión web, sin duplicarlo:
`buildOdontogramModel`/`useOdontogram`, `useToothSelection`,
`useChartFindings` y `src/compat.ts`. Todo es TypeScript o React sin DOM.
Solo el dibujo es nativo:

| Archivo | Contenido |
| --- | --- |
| `src/index.tsx` | Props, compatibilidad 0.1, piezas pulsables, leyenda |
| `src/layers.tsx` | Primitivas de hallazgo, marcas de estado, números, iconos de la leyenda |
| `src/theme.ts` | Paleta clara/oscura con los valores del CSS web (RN no tiene CSS) |

### API

* Nuevo: `dentition`, `teeth`, `layout="arch"|"horizontal"`, `value`,
  `defaultValue`, `idFormat`, `onToothPress`, `showNumbers`, `conditions`,
  `toothStates`, `findings`, `findingCatalog`, `labels`, `disabled` y nuevas
  claves de `colors`.
* Se conservan `defaultSelected`, `readOnly`, `teethConditions`, `maxTeeth`,
  `layout="circle"|"square"`, y el nombre accesible y los `viewBox` de 0.1.
  Los mismos avisos de deprecación que en la web.
* La leyenda (`showLabels`) añade estados y hallazgos y se reparte en filas
  de 120 unidades. Con una sola fila, la altura es la de 0.1 (+28).
* Versión 0.2.0 y `CHANGELOG.md` propio. `files` incluye el CHANGELOG.

### Decisiones

* Alcance según la prioridad del ToDo (elegido por el usuario). Las
  superficies quedan fuera. Los hallazgos de superficie no se dibujan ni
  entran en el nombre accesible, y el core avisa con un texto que menciona
  `showSurfaces`. Está documentado y lo fija una prueba.
* En una pieza ausente con condición se mantiene el contorno de la condición
  pero no su relleno, igual que en la web. En 0.1 no existían los estados.
* `src/legacy.ts` se elimina: solo lo usaba RN. Su prueba de paridad pasa a
  comparar directamente `layoutDefinitions` con los cuadrantes 0.5.8.
* Los avisos llevan el prefijo `[react-odontogram]` porque vienen de
  `src/compat.ts`.

### Sin verificar

* No se ha ejecutado en un dispositivo ni en un simulador. Las pruebas usan
  el mock de `react-native-svg` (`tests/mocks/`), que no dibuja. Pendiente
  revisar en un dispositivo que `transform` en texto,
  `alignmentBaseline="central"` y `strokeDasharray` en texto se vean igual
  que en la web.
* `react-native-odontogram` en npm también pertenece al autor original (ver
  R18, "Nombre del paquete").

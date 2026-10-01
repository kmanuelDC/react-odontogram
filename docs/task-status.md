# Estado de implementación

Las fases se definen en [ToDo.md](../ToDo.md).

| Fase | Estado | Fecha | Evidencia |
| --- | --- | --- | --- |
| R00 — Línea base | Completada | 2026-10-01 | `docs/baseline/` (27 capturas), `scripts/capture-baseline.mjs`, `.gitattributes` |
| R01 — Núcleo sin framework | Completada | 2026-10-01 | `src/core/` (28 módulos), `tests/core/` (20 archivos, 203 pruebas), `src/core/README.md` |
| R02 — Capa de compatibilidad | Completada | 2026-10-01 | `src/compat.ts`, `tests/compat.test.ts`, `tests/Odontogram-compat.test.tsx` |
| R03 — Refactor de `Odontogram` | Completada | 2026-10-01 | `src/Tooth.tsx`, `src/ToothLayer.tsx`, `src/hooks/`, `src/legacy.ts`, `tests/hooks.test.tsx`, `tests/Odontogram-refactor.test.tsx` |
| R04 — Dentición primaria | Completada (SVG provisionales) | 2026-10-01 | `tests/Odontogram-primary*.test.tsx`, `src/stories/Primary.stories.tsx`, README |
| R05 — Dentición mixta | Pendiente | | |
| R06 — Mejoras rápidas | Pendiente | | |
| R07 — Estados de pieza | Pendiente | | |
| R08 — Superficies | Pendiente | | |
| R09 — Hallazgos y tratamientos | Pendiente | | |
| R10 — Registro por pieza y `SurfaceGuide` | Pendiente | | |
| R11 — Menú de superficie | Pendiente | | |
| R12 — `ToothInspector` | Pendiente | | |
| R13 — Overlay y anchors | Pendiente | | |
| R14 — Tema y estilos | Pendiente | | |
| R15 — API pública | Pendiente | | |
| R16 — Storybook y ejemplo | Pendiente | | |
| R17 — Tests de componente | Pendiente | | |
| R18 — Documentación y publicación | Pendiente | | |
| R19 — React Native (opcional) | Pendiente | | |
| R20 — Paquete core compartido (opcional) | Pendiente | | |

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

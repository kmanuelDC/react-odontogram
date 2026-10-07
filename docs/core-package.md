# Paquete `@kmanueldc/odontogram-core` (R20)

El núcleo sin framework vive en [`packages/odontogram-core`](../packages/odontogram-core/README.md).
Hasta R19 estaba copiado en `src/core/` (R01). El repositorio es un workspace
de pnpm que solo incluye el core: `react-native-odontogram` queda fuera porque
instalarlo traería `react-native` como peer autoinstalado, y sus tests se
ejecutan desde la raíz.

## Cómo lo consume cada paquete

| Paquete | Desarrollo | Build publicado |
| --- | --- | --- |
| `react-odontogram` | Alias a `packages/odontogram-core/src/index.ts` (`tsconfig.json` `paths`, `vitest.config.mts`, `.storybook/main.ts`, `examples/responsive-site/vite.config.ts`) | tsup lo empaqueta (`noExternal` + `dts.resolve`): `dist/` no importa el core y no hay dependencia en runtime |
| `react-native-odontogram` | Igual (tsconfig de la raíz) | tsup lo empaqueta |
| `@kmanueldc/vue-odontogram` | Sin cambios todavía: conserva su copia en `src/{types,data,utils,catalogs}` | — |

Por eso `react-odontogram` puede publicarse sin publicar antes el core. Si
algún día se prefiere una dependencia real (sin duplicar el código entre
paquetes), basta con quitar `noExternal`/`dts.resolve` de `tsup.config.ts` y
mover `@kmanueldc/odontogram-core` de `devDependencies` a `dependencies`. En
ese caso, el core tiene que publicarse primero.

## Tests

Un único juego: `packages/odontogram-core/tests/` (los 20 archivos que antes
estaban en `tests/core/`, más `no-dependencies.test.ts`, que comprueba que no
hay imports externos y que `src/index.ts` reexporta todos los módulos).
`pnpm test` en la raíz los ejecuta junto con los de React. La paridad con los
datos 0.5.x (`tests/core-parity.test.ts`) se queda en React porque usa
`src/legacy`.

## Publicar el core

```bash
pnpm --filter @kmanueldc/odontogram-core test
pnpm --filter @kmanueldc/odontogram-core build
cd packages/odontogram-core && npm publish   # 0.1.0, acceso público
```

`npm pack --dry-run` incluye `README.md`, `THIRD_PARTY_NOTICES.md`,
`package.json` y `dist/` (9 archivos).

## Pendiente: migrar `vue-odontogram`

No se hizo en R20: el repositorio de Vue tenía cambios sin commitear y el core
no está publicado. Al 2026-10-05 su copia es idéntica a la de aquí (solo
cambia el orden de los imports), así que la migración es mecánica:

1. `npm install @kmanueldc/odontogram-core` (o `file:../react-odontogram/packages/odontogram-core`
   para probar antes de publicar; requiere `pnpm --filter @kmanueldc/odontogram-core build`).
2. Cambiar los imports relativos a `types/`, `data/`, `utils/` y `catalogs/`
   por `@kmanueldc/odontogram-core` en 10 archivos de `src/components`,
   `src/composables` y `src/index.ts`, y en 23 archivos de `tests/`.
3. Borrar `src/{types,data,utils,catalogs}`.
4. Elegir entre empaquetarlo o declararlo como dependencia. Con dependencia,
   se añade `'@kmanueldc/odontogram-core'` a `rollupOptions.external` en
   `vite.config.ts` y el paquete pasa a `dependencies`.
5. Borrar de `tests/` los tests puros que ya están en el core (ver la lista
   en `packages/odontogram-core/tests/`) y conservar los que montan
   componentes.
6. `npm run typecheck && npm test && npm run build`.

A partir de entonces, cualquier cambio de lógica del núcleo se hace en
`packages/odontogram-core` y no en los componentes de cada framework.

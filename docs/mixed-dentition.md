# Dentición mixta

## Estado

Implementada en R05 (2026-10-02), portada de `vue-odontogram`
(`docs/mixed-dentition.md`, commit `66bd190`) con la misma composición
**filas NTS**: `dentition="mixed"` combina los datasets permanente y
primario, y la prop `teeth` declara qué piezas están en boca.

La dentición mixta no es una selección parcial de un dataset ni una variante
de geometría permanente: cada pieza usa la forma de su propio dataset y
conserva su identidad FDI.

## API

```tsx
<Odontogram
  dentition="mixed"
  layout="horizontal"
  idFormat="fdi"
  teeth={["16", "11", "55", "54", "53"]}
/>
```

`teeth` recibe IDs (`string[]`), en cualquiera de los dos formatos
(`"11"` o `"teeth-11"`), no definiciones de pieza. La librería resuelve la
forma de cada ID desde el dataset y el layout que le corresponden, de modo
que la aplicación no manipula geometría SVG y no puede mezclar formas de otra
dentición. Sin `teeth` se dibujan las 52 piezas, como en la ficha NTS.

`teeth` también filtra `permanent` y `primary`. Los IDs que no pertenecen a la
dentición se ignoran y, fuera de producción, se avisa una vez por consola:
`[react-odontogram] Teeth 51 are not part of the permanent dentition.`

Como un ID FDI es globalmente único, `value`, `defaultValue`, `onChange`,
`conditions` y el input oculto siguen usando listas de IDs, sin prefijos de
dentición ni claves compuestas.

## Composición

Definida en el núcleo, `packages/odontogram-core/src/utils/mixed-layout.ts` (copiado de Vue en
R01). No añade geometría: cada cuadrante reutiliza el dataset y el transform
de su composición original, envuelto en una escala y una traslación.

- `horizontal` (viewBox `0 0 900 418`): cuatro filas, de arriba abajo
  `18–28`, `55–65`, `85–75` y `48–38`. Las filas temporales se escalan ×1,1
  sobre la línea media para que 55/65/75/85 queden alineados con los segundos
  premolares que los reemplazan. Entre una fila permanente y la temporal
  vecina hay 80 unidades (reservadas para números y diagramas de superficie);
  entre las filas temporales, 40.
- `arch` (viewBox `0 0 409 694`): las arcadas temporales, a escala 0,58,
  dentro de las permanentes, centradas en la misma línea media y simétricas
  respecto al eje horizontal.

Con `showHalf` el `viewBox` se ajusta a las piezas de la media arcada, como
en `primary`. El `viewBox` no depende de `teeth`: el gráfico mantiene su
tamaño cuando se añaden o quitan piezas. Un cuadrante sin piezas listadas no
se dibuja.

## Reglas de coexistencia

1. La presencia de una pieza se declara explícitamente con `teeth`; un hueco
   no se rellena con una geometría de otra dentición.
2. La forma se obtiene del dataset de su dentición, nunca por `slice` ni
   reutilizando premolares como molares temporales (lo que hacía
   `maxTeeth={5}`).
3. Cada pieza pertenece a una **fila** (`ToothRow` en
   `packages/odontogram-core/src/utils/anchors.ts`): una arcada de una dentición
   (`upper-permanent`, `upper-primary`…). Las filas ordenan las piezas,
   orientan números, símbolos y diagramas, y guían la navegación con
   `↑`/`↓`. Los hallazgos de tramo y entre dos piezas deben estar en una
   misma fila.
4. La selección y las condiciones se indexan por ID FDI y pueden abarcar
   ambos conjuntos sin cambiar la API de eventos.
5. Los SVG pediátricos siguen siendo provisionales: la composición es de
   desarrollo y necesita validación odontológica antes del uso clínico.

## Qué usa ya el componente React

| Parte de la composición | Estado en R05 |
| --- | --- |
| Piezas, `viewBox`, medias arcadas, `teeth` | En el componente |
| Selección, condiciones, leyenda, tooltip, notaciones | En el componente |
| Números dibujados por fila | Núcleo probado; en pantalla con `showNumbers` (R06) |
| Navegación `↑`/`↓` entre filas | Núcleo probado; en el componente con R06 |
| Frames, diagramas de superficie y tramos por fila | Núcleo probado; en el componente con R08–R09 |

## Limitaciones conocidas

- En `arch`, los diagramas de superficie y las siglas de las piezas
  temporales se dibujan hacia fuera de su arcada, en el espacio de los
  números permanentes, y pueden solaparse con ellos. Para registrar
  superficies en dentición mixta se recomienda `horizontal` (aplica desde R08).
- No hay reglas de reemplazo ni etapas de erupción: la aplicación decide qué
  piezas incluir en `teeth`.
- Como en `primary`, el componente no filtra los IDs seleccionados que no se
  dibujan (por `teeth` o por cambio de dentición); la aplicación debe
  normalizar la selección.

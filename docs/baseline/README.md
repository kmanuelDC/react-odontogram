# Línea base visual — react-odontogram 0.5.8

Capturas de referencia tomadas el 2026-10-01 sobre el commit `e21fd2b`, antes
de traer las novedades de `vue-odontogram` (ver [ToDo.md](../../ToDo.md), R00).
Sirven para comprobar que los refactors, en especial R03, no cambian el
render permanente.

Hay una captura por historia de Storybook: 25 de R00 y 5 de R04 (las 2
historias "Baby Teeth" de R00 se eliminaron en R04), a 1000×900, con Chrome headless.
El render es determinista: dos ejecuciones seguidas producen archivos
idénticos byte a byte.

## Regenerar y comparar

```bash
pnpm storybook:build
pnpm baseline:capture /tmp/after      # sin argumento sobrescribe docs/baseline
```

Para comparar, cualquier diferencia binaria indica un cambio de render:

```bash
for f in docs/baseline/*.png; do
  cmp -s "$f" "/tmp/after/$(basename "$f")" || echo "cambia: $(basename "$f")"
done
```

`CHROME_PATH` permite elegir otro navegador. Las capturas dependen de la
versión de Chrome y del sistema (fuentes, antialiasing): compara siempre
capturas generadas en la misma máquina, o regenera esta línea base antes
de empezar una fase.

## Cobertura

| Grupo | Historias | Qué fija |
| --- | --- | --- |
| `components-odontogram--*` | 8 | Layout `circle`: claro, oscuro, por defecto, selección simple, tooltip propio, sin tooltip, media arcada superior/inferior |
| `components-layouts--*` | 8 | Las mismas variantes en layout `square` |
| `read-only-odontogram--*` | 7 | `readOnly` y `teethConditions` con leyenda, en `circle` y `square` |
| `components-form--*` | 2 | Input oculto de formulario y salida `ToothDetail` |
| `components-primary-dentition--*` | 5 | Añadidas en R04: `dentition="primary"` en arco y horizontal, condiciones, media arcada superior e inferior (en arco) |

## Observaciones registradas en la línea base

* `maxTeeth=5` (historias "baby") muestra incisivos, canino y **premolares
  permanentes** y conserva el `viewBox` completo, dejando un hueco grande
  entre arcadas. En R04 sus historias ("Baby Teeth") se reemplazaron por
  "Primary Dentition" y sus capturas se retiraron de la línea base.
* `ToothDetail.notations.palmer` usa el formato `1UR`; Vue usa `UR1` (texto)
  o `1┘` (símbolo). Se decide en R02 sin romper el formato actual.

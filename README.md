# Material de OS — CAREL

Reporte de material por orden de servicio para los técnicos de fibra (FTTH).
Reemplaza la hoja de papel: el técnico abre un enlace en el teléfono, marca
cuánto material usó en cada folio y queda guardado. Quien arma el Excel
semanal copia los bloques ya listos y los pega en **REPORTE DE MATERIAL
FIBRA**, pestaña `MAT UTILIZADO`.

**Los técnicos no necesitan cuenta de nada.** Ni Google, ni GitHub, ni Claude.

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `index.html` | La página que ven los técnicos. Se publica en GitHub Pages. |
| `apps-script/Code.gs` | El guardado. Vive dentro de una Hoja de cálculo de Google y se publica como Web App. |
| `INSTRUCCIONES.md` | Cómo desplegarlo, paso a paso. |

## Cómo llega al Excel

La página agrupa por técnico y da cinco botones de copiado, uno por bloque de
columnas, porque en la hoja no están seguidas:

| Botón | Columnas | Material |
|---|---|---|
| M | `M` | ARGOLLAS |
| O | `O` | TAQUETES |
| Q–S | `Q:S` | ROSETAS, SELLOS PAS., SINCHO M. |
| V | `V` | TENSOR |
| X | `X` | SUJ. MARFIL |

Las columnas `B:G` (folio, teléfono, fecha, tipo, técnico, módem) y `AD`
(bobina de cable) siguen llegando por la otra herramienta, la que convierte
los mensajes de WhatsApp.

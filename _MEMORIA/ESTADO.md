# ESTADO — material_de_os
Actualizado: 2026-10-24

## Hecho
- Botón «Archivar TODO el corte» probado por Yeudiel con clic real: funciona (commit `36e6c11`).
- `_MEMORIA/` subida al repo público salvo `DEUDA.md` y `CONTEXTO-acceso.md` (commit `7227ac8`; esos dos en `.gitignore` hasta cerrar la Fase 3, que sigue en pausa).
- Ubicaciones de terminal y domicilio con METRAJE de 400 m o más (obligatorias, en el mensaje): `Code.gs` desplegado como **Versión 16** del Web App (2026-10-24 14:41, misma implementación, URL `/exec` sin cambio; el código pegado coincidió byte por byte con el local). Columnas `CoordTerminal` y `CoordDomicilio` se crean solas al primer guardado.
- Tomás de Jesús Hernández Espinoza (expediente 01085991) sustituye a Julio en COMITAN: cambiado en `Tecnicos` fila 4 y `Autorizados` fila 3 de la Hoja; el cero del expediente se conservó y el endpoint ya lo devuelve. Julio tenía 3 órdenes del 23/10 sin archivar: salen en el corte de Comitán al final, con su nombre.

## En curso
- Que Tomás reciba su enlace: `https://carel.xcellence.com.mx/?tec=TOMAS%20DE%20JESUS%20HERNANDEZ%20ESPINOZA` (lo manda Yeudiel). La página con las ubicaciones se ve en cuanto Pages construya el push de este commit.

## Siguiente
- Probar la función de ubicaciones en la primera orden real de 400 m o más (el GPS del teléfono, sobre todo en el navegador de WhatsApp) y que `CoordTerminal` y `CoordDomicilio` aparezcan en la Hoja con los datos.
- Comprobar que `updateOrden` escribe `Editada` en la primera corrección real (arrastrado, sigue sin probarse).
- Decidir cuándo quitar el origen viejo del cliente OAuth (ver DEUDA.md, 2026-09-24).

## Bloqueos
- Fase 3 del acceso en pausa por decisión de Yeudiel (2026-10-24). Con ella pausada, las coordenadas del domicilio viajan en `mias`, que sigue abierto sin pase (ACCESO-01).

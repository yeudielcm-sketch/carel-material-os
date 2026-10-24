# ESTADO — material_de_os
Actualizado: 2026-10-15

## Hecho
- Botón «Archivar TODO el corte» al lado de «Copiar TODO el corte»: archiva por IDs las órdenes de la plaza en pantalla, con confirmación en dos toques. Solo `index.html`, commit `36e6c11` en `main`; Pages construyó y `carel.xcellence.com.mx` ya sirve el botón. Sin cambios en `Code.gs` ni versión nueva del Web App. **No probado con un clic real** (ver Siguiente).
- Decidido que no se construye el disparador programado del cierre de semana; el archivado con confirmación al copiar más el botón nuevo bastan (DECISIONES.md y DEUDA.md, 2026-10-15).
- Antes (2026-09-24): contradicciones con la consola de acceso revisadas, enlace público migrado a `carel.xcellence.com.mx`, `INSTRUCCIONES.md` actualizado (commit `8879efb`).

## En curso
- Nada a medias.

## Siguiente
- ~~Probar el botón «Archivar TODO el corte»~~ — HECHO: Yeudiel lo probó con clic real y funciona (2026-10-24).
- Comprobar que `updateOrden` escribe `Editada` en la primera corrección real (arrastrado de sesiones anteriores, sigue sin probarse).
- Decidir cuándo quitar el origen viejo del cliente OAuth (ver DEUDA.md, 2026-09-24).

## Bloqueos
- PENDIENTE DE YEU: si `_MEMORIA/` debe subir al repo público (la pregunta vive en PENDIENTES.md de ARQUITECTURA).
- PENDIENTE DE YEU: que la consola de acceso corra el PROMPT B para cerrar la Fase 3.
- PENDIENTE DE YEU: texto del chip de sugerencia sobre Julio César (de ESTADO-acceso.md), para saber si se cancela.

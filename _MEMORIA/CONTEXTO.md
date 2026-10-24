# CONTEXTO — CAREL, reporte de OS

Escrito el 2026-09-16 por la consola de `material_de_os` (la que construyó el
reporte, las dos semanas, la app instalable y la marca de corregida). Hay una
**segunda consola** (`PROYECTOS\CAREL`, sesión `d2fb22b3`) que hizo el acceso
con Google del 6 y 7 de septiembre; lo suyo lo escribe ella.

## Qué construye

Una página para que los tres técnicos de fibra (FTTH, Telmex/Carso, Comitán)
generen el mensaje de WhatsApp de cada orden y, de paso, llenen la hoja de
material. Un Módulo de Administrador arma el corte que se pega en el Excel
semanal.

## Rutas que son de esta consola

- `index.html` — la app entera (captura, Mis órdenes, Módulo de Administrador).
- `apps-script/Code.gs` — copia local del guardado; el que corre vive en la
  Hoja «Materiales de Fibra CAREL» («MATERIALES CAREL» es el nombre del
  proyecto de Apps Script, no el de la hoja) y se despliega desde el editor
  de Apps Script en Chrome, no desde esta carpeta.
- `manifest.webmanifest`, `sw.js`, `icono-192.png`, `icono-512.png`,
  `icono-maskable-512.png`, `logo-carel.png` — instalar como aplicación.
- `lector/zxing.js` — lector de códigos de respaldo.
- `manual/` — manuales y el PDF de arquitectura (`manual/arquitectura.py`).
- `INSTRUCCIONES.md`, `README.md`.
- Fuente del logotipo: `..\logo carel.png` (fuera del repo).

## Qué NO le toca

- **El acceso con Google** (pestaña `Autorizados`, `UltimoAcceso`, renovación
  silenciosa, `CAMPOS_PUBLICOS`, fase 3): es de la otra consola, aunque viva en
  los mismos dos archivos.
- **La respuesta de Administración** (`listEntries` sin `tec`): Yeudiel pidió
  que siga mostrando solo lo que falta procesar. No se modifica.
- `carel_wa_excel.html` (herramienta ajena que parte mensajes de WhatsApp):
  tiene un fallo conocido y no hay permiso para tocarlo.
- El repo `SuperBot Memo - Clientes`: el directorio principal de la sesión
  salta a esa carpeta; todo lo de CAREL se hace con rutas absolutas.

## Convenciones

- **Una sola página autocontenida** servida por GitHub Pages, repo **público**
  (`yeudielcm-sketch/carel-material-os`). Se publica con `git push` a `main`;
  tarda ~40–60 s en verse. Desde el 2026-09-24 el dominio público es
  `carel.xcellence.com.mx` (CNAME en Cloudflare, «Solo DNS», hacia
  `yeudielcm-sketch.github.io`, con `Enforce HTTPS` activo en GitHub Pages);
  el archivo `CNAME` en la raíz del repo lo escribió GitHub solo al guardar el
  dominio personalizado, no se edita a mano. La URL vieja
  (`yeudielcm-sketch.github.io/carel-material-os/`) sigue viva, por eso el
  origen de OAuth en Google Cloud tiene los dos.
- **Backend Apps Script** con acceso «Cualquier usuario». Cada cambio a
  `Code.gs` es una versión nueva de la implementación (esta consola llegó a la
  v9); se hace a mano en Chrome.
- **Columnas nuevas SIEMPRE al final de `COLS`**: `idx()` mapea por posición.
  `getSheet()` agrega a la hoja las que falten.
- Columnas no numéricas con `setNumberFormats("@")` para no perder ceros.
- Sellos de fecha `"yyyy-MM-dd HH:mm"` (`Copiada`, `Editada`): se comparan como
  texto. Clave de semana `"L2026-08-31"` (lunes).
- Commits en español, en presente, contando el porqué; sin acentos en el asunto.
- Comentarios en español, explican el porqué; nombres en español (`tarjetaOrden`,
  `corregidaTrasCopia`).
- Textos de la app en español llano, de tú, sin jerga: «ya pasó al Excel»,
  «corregida después de copiar».
- **Probar sin tocar la hoja real**: copia de `index.html` en el scratchpad con
  `WEBAPP_URL` apuntando a `http://127.0.0.1:8766/exec`, y un archivo estático
  llamado `exec` con el JSON (el `http.server` de Python ignora la consulta).
- Para verificar lo publicado: sondear la URL de Pages buscando una cadena
  concreta del cambio, en segundo plano, con reintentos.
- Service worker: se verifica en el Chrome real; el panel interno no puede
  registrarlos.
- Imágenes con PIL. Emblema recortado `(512, 4, 1273, 760)` del logotipo;
  iconos sobre `#f5f6ee`, margen 7 % (21 % el maskable).

## Errores ya cometidos, no repetir

1. **Heredoc con apóstrofos y barra invertida**: `/\\bwv\\b/` llegó al
   `index.html` como dos caracteres de retroceso y la regex quedó en `/wv/`, sin
   error visible. Construir la barra con `chr(92)` y buscar caracteres de
   control después de parchear.
2. **Guardia `location.protocol === "https:"`** para el service worker: dejaba
   fuera `127.0.0.1`. Basta `"serviceWorker" in navigator`.
3. **Cerré «Corregir» en lo ya copiado** por mi cuenta. Yeudiel lo corrigió:
   **toda la semana en curso se corrige**, copiada o no; lo que cierra es la
   semana, no la marca.
4. **Marqué cualquier orden editada.** Solo importa la corregida DESPUÉS de
   copiarse (`Editada > Copiada`); la corregida antes se copia ya corregida.
5. **Llamé «Consolidado» a la pestaña de administración.** Se llama **Módulo de
   Administrador**, también en documentos.
6. **Puse marca de corregida en la tabla de Administración** después de que
   Yeudiel dijo que esa parte no se tocaba. Se quitó.
7. **Insistí dos veces** en que una orden corregida tras copiarse no regresa a
   la lista del Módulo de Administrador. Yeudiel dijo que ese caso tiene otro
   tratamiento fuera de aquí: no volver a plantearlo.
8. **Logo a la izquierda**: va a la DERECHA, para repartir la carga visual.
9. **Dos avisos seguidos** (`toast`) se pisan: el segundo borró el aviso de «ya
   se pasó al Excel». Un solo aviso condicional.
10. **El botón Instalar dentro del encabezado** chocó con la pestaña «Mis
    órdenes» al entrar el logo. Va en su propia fila, fuera del `<header>`.
11. **Primer ícono dibujado a mano** (hilo de fibra que parecía puntos sueltos).
    Se usa el emblema de CAREL.
12. **Dije «aún se está publicando» cuando ya estaba publicado**: mi `grep -A1`
    no alcanzaba la línea. La comprobación tiene que poder ver lo que busca
    antes de concluir que no está.
13. **Afirmé «Nada se borra»** en `INSTRUCCIONES.md` cuando existe la poda de
    ocho semanas (`SEMANAS_HISTORIAL`). Corregido.
14. **Ordené el corte solo por fecha** (antes de esta etapa): va por técnico y
    dentro por fecha, en el orden de la pestaña `Tecnicos`.
15. **Editor de Apps Script**: el lápiz de la implementación se mueve con el
    zoom y abre en solo lectura; `ctrl+a` sobre un campo selecciona la página
    entera. Captura justo antes de cada clic y usa triple clic en el campo.
16. **Leer el portapapeles** con computer-use falla sin apps concedidas: se
    escribe con PowerShell `Set-Clipboard` y no se lee de vuelta.

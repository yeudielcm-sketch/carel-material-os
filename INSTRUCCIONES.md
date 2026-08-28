# Material de OS — cómo publicarlo

Este reporte ya no depende de Claude ni de ninguna cuenta: los técnicos abren
un enlace normal y guardan sus datos en una Hoja de cálculo de Google. Son
dos piezas:

- **`apps-script/Code.gs`** → el "guardado". Vive dentro de una Hoja de
  cálculo de Google y recibe los reportes.
- **`index.html`** → la página que ven los técnicos. Se aloja en
  GitHub Pages con una URL propia.

Sigue los pasos en orden. Tardas unos 10 minutos la primera vez; después,
nunca más tienes que tocar el Apps Script salvo que cambies su lógica.

## 1. Crear la Hoja de cálculo y pegar el script

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja de
   cálculo nueva en blanco. Ponle un nombre, por ejemplo **"Material de OS —
   datos"**.
2. En el menú, ve a **Extensiones → Apps Script**. Se abre un editor de
   código en una pestaña nueva.
3. Borra todo el contenido de `Code.gs` que aparece por defecto y pega
   completo el contenido del archivo `apps-script/Code.gs` de este paquete.
4. Guarda (icono de disquete o `Ctrl+S`). Ponle un nombre al proyecto si te
   lo pide, por ejemplo "Material de OS backend".

## 2. Publicarlo como Web App (esto es lo importante)

1. Arriba a la derecha, clic en **Implementar → Nueva implementación**.
2. En "Selecciona el tipo", el icono de engranaje → **Aplicación web**.
3. Configura exactamente así:
   - **Ejecutar como:** *Yo (tu correo)*
   - **Quién tiene acceso:** **Cualquier usuario** (en inglés: *Anyone*) —
     **no** elijas "Cualquier usuario con una Cuenta de Google", porque esa
     opción sí pediría iniciar sesión.
4. Clic en **Implementar**. Google puede pedirte que autorices el script la
   primera vez (aparece una pantalla de advertencia porque es un script
   propio sin verificar por Google — es normal, clic en *Configuración
   avanzada* → *Ir a [nombre del proyecto] (no seguro)* → *Permitir*).
5. Copia la **URL de la aplicación web** que te muestra al final — termina
   en `/exec`. Esa es la URL que necesitas en el paso siguiente.

Si más adelante modificas `Code.gs`, los cambios NO se aplican solos: hay
que ir a **Implementar → Administrar implementaciones**, editar (icono de
lápiz) la implementación existente y subir **Nueva versión**. Así la URL no
cambia y no tienes que volver a repartirla.

## 3. Conectar la página con esa URL

1. Abre `index.html` con cualquier editor de texto.
2. Busca esta línea, cerca del inicio del `<script>`:
   ```js
   var WEBAPP_URL = "PEGA_AQUI_LA_URL_DE_TU_WEB_APP";
   ```
3. Reemplaza el texto entre comillas por la URL que copiaste (la que
   termina en `/exec`). Guarda el archivo.

## 4. Publicar la página en GitHub Pages

Si no tienes cuenta de GitHub, crea una gratis en [github.com](https://github.com)
(esto es solo para ti — los técnicos jamás necesitan una cuenta de nada).

1. Crea un repositorio nuevo, por ejemplo `material-os` (puede ser público
   o privado; si es privado, activa Pages igual, la página publicada es
   pública aunque el código no se vea).
2. Sube el archivo `index.html` a la raíz del repositorio (botón
   "Add file → Upload files" en la web de GitHub es lo más rápido).
3. Ve a **Settings → Pages** del repositorio. En "Build and deployment",
   fuente: **Deploy from a branch**, rama `main`, carpeta `/ (root)` →
   **Save**.
4. Espera 1–2 minutos y recarga esa misma pantalla: arriba te muestra la
   URL pública, algo como `https://tu-usuario.github.io/material-os/`.

Esa es la URL que compartes con los técnicos. Ábrela tú primero para
confirmar que carga y que guarda un reporte de prueba.

## 5. Repartir el enlace a cada técnico (opcional pero útil)

Si le agregas `?tec=NOMBRE` al final del enlace, esa persona ya ve su
nombre fijo cada vez que entra y no tiene que escribirlo:

```
https://tu-usuario.github.io/material-os/?tec=JUAN PEREZ
```

Sin ese parámetro, el primer reporte que guarden les pide el nombre y
después queda recordado en su navegador (mientras no cierren pestaña).

## Notas

- Todos los técnicos ven el consolidado casi en tiempo real: la pestaña
  "Consolidado" se refresca sola cada 20 segundos, y también al cambiar de
  pestaña.
- Los datos quedan en la Hoja de cálculo, pestaña **"Reportes"** — puedes
  abrirla y verla en cualquier momento, con historial completo aunque
  alguien "vacíe" un bloque desde la app (vaciar solo borra de la vista de
  la app... revisa la nota de abajo).
- ⚠️ Importante: en esta versión, "eliminar" y "vaciar bloque" **si borran
  la fila de la Hoja de cálculo** (igual que en el original). Si quieres
  conservar historial completo aunque alguien vacíe su bloque, dime y te
  cambio esas dos acciones para que solo marquen la fila como "ya copiada"
  en vez de borrarla.

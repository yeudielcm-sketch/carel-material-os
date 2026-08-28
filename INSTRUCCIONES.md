# Material de OS — cómo desplegarlo

Este reporte no depende de Claude ni de ninguna cuenta: los técnicos abren un
enlace normal y guardan sus datos en una Hoja de cálculo de Google. Son dos
piezas:

- **`apps-script/Code.gs`** → el guardado. Vive dentro de una Hoja de cálculo
  de Google y recibe los reportes.
- **`index.html`** → la página que ven los técnicos.

## Estado actual

- **La página ya está publicada** en
  <https://yeudielcm-sketch.github.io/carel-material-os/> (repo
  `yeudielcm-sketch/carel-material-os`, GitHub Pages desde `main`, raíz).
- **Falta la parte de Google.** Hasta que se haga, la página abre con un aviso
  rojo: *«Falta configurar la URL del Web App»*. Es lo esperado.

Los pasos 1 y 2 los tiene que hacer una persona con la cuenta de Google del
negocio: publicar un Apps Script pasa por su autorización y no se puede
automatizar desde fuera.

## 1. Crear la Hoja de cálculo y pegar el script

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja de
   cálculo nueva en blanco. Ponle un nombre, por ejemplo **«Material de OS —
   datos»**.
2. En el menú, **Extensiones → Apps Script**. Se abre un editor de código en
   una pestaña nueva.
3. Borra todo el contenido de `Code.gs` que aparece por defecto y pega completo
   el de `apps-script/Code.gs` de este repo.
4. Guarda (`Ctrl+S`). Ponle nombre al proyecto si te lo pide, por ejemplo
   «Material de OS backend».

No hace falta crear la pestaña «Reportes» a mano: el script la crea sola con sus
encabezados la primera vez que se guarda algo.

## 2. Publicarlo como Web App (esto es lo importante)

1. Arriba a la derecha, **Implementar → Nueva implementación**.
2. En «Selecciona el tipo», el icono de engranaje → **Aplicación web**.
3. Configura exactamente así:
   - **Ejecutar como:** *Yo (tu correo)*
   - **Quién tiene acceso:** **Cualquier usuario** (en inglés, *Anyone*).
     **No** elijas «Cualquier usuario con una Cuenta de Google» — esa sí pide
     iniciar sesión, y es justo lo que estamos evitando.
4. **Implementar**. La primera vez Google pide autorizar el script y muestra una
   pantalla de advertencia (es un script propio, sin verificar por Google, y es
   normal): *Configuración avanzada* → *Ir a [nombre del proyecto] (no seguro)*
   → *Permitir*.
5. Copia la **URL de la aplicación web**. Termina en `/exec`. Esa es la que hace
   falta en el paso 3.

Si más adelante se modifica `Code.gs`, los cambios **no se aplican solos**: hay
que ir a **Implementar → Administrar implementaciones**, editar (icono de lápiz)
la implementación existente y subir **Nueva versión**. Así la URL no cambia y no
hay que volver a repartirla.

## 3. Conectar la página con esa URL

En `index.html`, línea 215:

```js
var WEBAPP_URL = "PEGA_AQUI_LA_URL_DE_TU_WEB_APP";
```

Reemplaza el texto entre comillas por la URL que termina en `/exec`. Se puede
editar directo en GitHub (abrir el archivo → icono del lápiz → *Commit
changes*). GitHub Pages reconstruye sola en 1–2 minutos.

## 4. Repartir el enlace a cada técnico

Con `?tec=NOMBRE` al final, esa persona ve su nombre fijo cada vez que entra y no
lo escribe nunca:

```
https://yeudielcm-sketch.github.io/carel-material-os/?tec=JULIO CESAR LOPEZ SANCHEZ
https://yeudielcm-sketch.github.io/carel-material-os/?tec=CARLOS DANIEL BERMUDEZ
https://yeudielcm-sketch.github.io/carel-material-os/?tec=MARVIN ALEXIS MARTINEZ
```

Sin ese parámetro, el primer reporte les pide el nombre y queda recordado en el
navegador mientras no cierren la pestaña.

**El enlace de quien arma el Excel es otro**, con `?admin=1`:

```
https://yeudielcm-sketch.github.io/carel-material-os/?admin=1
```

Solo ese enlace muestra la pestaña **Consolidado**, con los botones de copiado y
el de archivar. Los técnicos no exportan nada, así que no la ven ni por error. **Conviene repartir el enlace con
`?tec=`**: en el Excel de 2026 la misma persona aparece escrita de tres formas
distintas (`MARVIN ALEXIS MARTINEZ`, `ALEXIS MARTINEZ`, `MARVIN ALEXIS MARTINEZ
CALVO`), y eso parte el consolidado en tres bloques.

## Cuando cambia `Code.gs`

Los cambios **no se aplican solos**. En el editor de Apps Script:
**Implementar → Administrar implementaciones → lápiz → Versión: Nueva versión →
Implementar**. La URL no cambia, así que no hay que volver a repartir enlaces.

## Cosas que conviene saber

- Los datos quedan en la Hoja, pestaña **«Reportes»**, y se pueden abrir en
  cualquier momento.
- **Nada se borra.** «Archivar este bloque» escribe la fecha en la columna
  `Copiada` y la orden desaparece de la app, pero la fila se queda. Es a
  propósito: al Excel semanal solo llegan 7 de los 22 campos del mensaje, así
  que esta hoja es el único lugar donde vive el resto.
- El consolidado se refresca cada 20 segundos **solo cuando está a la vista**.
  Con el formulario abierto en la calle no gasta señal ni cuota.
- Cada técnico solo ve y corrige **sus** órdenes en la pestaña «Mis órdenes».
- Quien tenga la URL `/exec` puede escribir en la Hoja sin identificarse — es la
  contraparte de que los técnicos no necesiten cuenta. La URL va dentro de la
  página publicada, así que no es un secreto.

Los tres últimos puntos están abiertos a arreglo; se decidieron dejar así para
esta primera versión.

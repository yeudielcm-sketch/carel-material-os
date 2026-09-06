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
- **La parte de Google ya está hecha.** El Web App está publicado y la página
  lo tiene conectado.
- **El acceso con Google está a medio camino, a propósito.** El botón funciona
  y el guardado ya sabe quién eres, pero **todavía no se exige**: quien no
  entre sigue capturando igual. Es la fase 2 de tres — ver «Cerrar los accesos»
  más abajo.

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

> **Que lo abran en Chrome, no dentro de WhatsApp.** Cuando se toca el enlace
> desde el chat, WhatsApp lo abre en su propio navegador, y ahí Google **se
> niega** a mostrar la pantalla de acceso. No es un fallo de la app ni tiene
> arreglo desde el código: es una política de Google contra los navegadores
> metidos dentro de otras aplicaciones.
>
> Hay que abrirlo una vez en Chrome —menú de los tres puntos → *Abrir en el
> navegador*— y de ahí agregarlo a la pantalla de inicio. Después entran
> siempre por el icono y no vuelven a pasar por el chat. La página lo detecta
> y se lo dice, en vez de dejarlos mirando un error de Google que no explica
> nada.

**El enlace de quien arma el Excel es otro**, con `?admin=Supervisor`:

```
https://yeudielcm-sketch.github.io/carel-material-os/?admin=Supervisor
```

Solo ese enlace muestra la pestaña **Módulo de Administrador**, con los botones de copiado y
el de archivar. Los técnicos no exportan nada, así que no la ven ni por error. **Conviene repartir el enlace con
`?tec=`**: en el Excel de 2026 la misma persona aparece escrita de tres formas
distintas (`MARVIN ALEXIS MARTINEZ`, `ALEXIS MARTINEZ`, `MARVIN ALEXIS MARTINEZ
CALVO`), y eso parte el corte en tres bloques.

## Cerrar los accesos: quién puede entrar

La URL `/exec` va dentro de la página publicada, así que no es un secreto y
cualquiera puede llamarla. Cerrar eso se está haciendo en tres fases, para no
dejar a los técnicos sin poder capturar ni un día.

**Fase 1 — hecha.** La respuesta que recibe quien no se identifica ya no lleva
nombre, dirección, barrio ni celular de referencia del cliente: solo lo que el
corte necesita para armar la fila del Excel (`CAMPOS_PUBLICOS` en `Code.gs`).

**Fase 2 — hecha, sin exigir todavía.** La página tiene botón de *Entrar con
Google*. Quien entra, el guardado lo reconoce y se lo dice en pantalla
(«Entraste como…»). Quien no entra, captura igual que siempre. Sirve para que
cada quien confirme que su cuenta quedó bien **antes** de que empiece a hacer
falta.

**Fase 3 — pendiente.** El `/exec` empieza a rechazar lo que no traiga pase, la
lista completa se le entrega solo al supervisor, y se archiva la implementación
vieja. Archivarla es lo único que corta de verdad a quien ya tenga la URL de
hoy.

### La pestaña `Autorizados`

Quién puede entrar se decide **en la hoja**, nunca en el código: son correos de
personas y este repositorio es público.

La pestaña `Autorizados` se crea sola. Si no aparece, en el editor de Apps
Script se elige la función `prepararAutorizados` y se pulsa *Ejecutar*.

| Correo | Nombre | Rol |
|---|---|---|
| el correo de Google de la persona | como sale en el Excel | `TECNICO` o `SUPERVISOR` |

- **Dar de alta** a alguien: escribir su fila. **Dar de baja**: borrarla. No hay
  que volver a implementar nada, y el cambio surte efecto en cinco minutos como
  mucho (hay una caché para no llamar a Google en cada refresco).
- El correo tiene que ser **el mismo con el que la persona inicia sesión en su
  teléfono**. Es el fallo número uno: se apunta uno y entran con otro. Conviene
  confirmarlo con la persona delante, mirando su teléfono.
- Da igual cómo se escriba: mayúsculas, puntos de Gmail y alias con `+` se
  comparan como si no estuvieran (`yeu.diel.cm+os@gmail.com` es la misma cuenta
  que `yeudielcm@gmail.com`).
- Mientras la pestaña esté vacía solo entra el dueño del script, para que pueda
  llenarla sin dejarse fuera a sí mismo.

### La credencial de Google

Está en el proyecto de Google Cloud **`carel-material-de-os`**, app
«CAREL - Material de OS», con `https://yeudielcm-sketch.github.io` como origen
autorizado.

El **ID de cliente** va escrito en `index.html` y en `Code.gs`. **No es un
secreto**: Google lo publica en toda página que use su botón de acceso, y solo
funciona desde ese origen. La credencial de verdad es el pase de cada persona,
que emite Google al entrar, dura una hora y no está guardado en ninguna parte
de este repositorio. **El secreto del cliente no se usa y no se copió.**

La app está en **modo de prueba**, lo que añade una segunda reja: además de
estar en `Autorizados`, el correo tiene que estar en la lista de *usuarios de
prueba* de la consola (Google Auth Platform → Público). El límite son 100
personas. Para pasar de ahí habría que publicar la app, y Google pide antes una
página principal, una política de privacidad y unas condiciones del servicio.

## Cuando cambia `Code.gs`

Los cambios **no se aplican solos**. En el editor de Apps Script:
**Implementar → Administrar implementaciones → lápiz → Versión: Nueva versión →
Implementar**. La URL no cambia, así que no hay que volver a repartir enlaces.

## Cosas que conviene saber

- Los datos quedan en la Hoja, pestaña **«Reportes»**, y se pueden abrir en
  cualquier momento.
- **Archivar no borra en el acto.** «Archivar este bloque» escribe la fecha en
  la columna `Copiada` y la orden desaparece de la app, pero la fila se queda.
  Es a propósito: al Excel semanal solo llegan 7 de los 22 campos del mensaje,
  así que esta hoja es el único lugar donde vive el resto. Eso sí, **pasadas
  ocho semanas la fila archivada se borra sola** (`SEMANAS_HISTORIAL` en
  `Code.gs`): para entonces el reporte ya vive en su Excel y en el chat de
  WhatsApp.
- El módulo de administrador se refresca cada 20 segundos **solo cuando está a
  la vista**.
  Con el formulario abierto en la calle no gasta señal ni cuota.
- Cada técnico solo ve y corrige **sus** órdenes en la pestaña «Mis órdenes».
- Quien tenga la URL `/exec` **todavía puede escribir** en la Hoja sin
  identificarse, y pidiendo `?tec=NOMBRE` recibe las órdenes completas de esa
  persona. Las dos cosas se cierran en la fase 3. Lo que ya **no** puede es
  bajarse de un tirón el nombre, la dirección y el barrio de todos los clientes:
  eso se cortó en la fase 1.
- **No hay registro de quién llama al `/exec`.** El panel «Mis ejecuciones» de
  Apps Script marca cero aunque el endpoint se esté usando: las ejecuciones
  anónimas de un Web App no se anotan en ninguna parte. Conviene saberlo antes
  de preguntarse si alguien entró: no se puede saber.

Los dos puntos de antes —el refresco cada 20 segundos y que cada técnico solo
vea lo suyo— se decidieron así a propósito y siguen igual.

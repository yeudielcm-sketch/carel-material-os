# Lector de respaldo

`zxing.js` es la librería [@zxing/library](https://github.com/zxing-js/library)
v0.21.3, guardada aquí a propósito en vez de cargarla de un servidor ajeno: la
usa un técnico en la calle, y una descarga desde fuera es una cosa más que se
puede caer con mala señal.

La app **solo la descarga en los teléfonos que no traen lector propio**, y solo
la primera vez que alguien toca el botón de cámara. Los que sí lo traen —la
mayoría de los Android con Chrome— no bajan estos 328 KB nunca.

Apareció porque un Honor decía tener `BarcodeDetector` pero no soportaba ningún
formato: el botón salía y no leía jamás.

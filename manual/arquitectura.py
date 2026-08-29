# -*- coding: utf-8 -*-
"""
Genera «Arquitectura del Reporte de OS» en PDF.

Los diagramas se dibujan como vectores (no imágenes) para que se vean nítidos
al imprimir y al hacer zoom. La paleta es la misma de la app a propósito.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak,
                                Table, TableStyle, KeepTogether)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

# ----------------------------------------------------------------- paleta ---
TINTA   = colors.HexColor("#242a12")
SUAVE   = colors.HexColor("#767d5c")
TENUE   = colors.HexColor("#94997a")
LINEA   = colors.HexColor("#d7dbc3")
FONDO   = colors.HexColor("#eceee0")
ACENTO  = colors.HexColor("#5c6b1f")
ACSUAVE = colors.HexColor("#e6ecc9")
AVISO   = colors.HexColor("#a66a0a")
AVSUAVE = colors.HexColor("#f7ecd6")
AGUA    = colors.HexColor("#2f7a8f")
AGSUAVE = colors.HexColor("#dfeef3")
BLANCO  = colors.white

ANCHO = letter[0] - 44 * mm   # ancho útil con los márgenes de abajo

# ------------------------------------------------------------- tipografía ---
def estilo(nombre, **kw):
    base = dict(fontName="Helvetica", fontSize=10, leading=15, textColor=TINTA,
                alignment=TA_LEFT, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(nombre, **base)

H1     = estilo("H1", fontName="Helvetica-Bold", fontSize=25, leading=28, spaceAfter=6)
H2     = estilo("H2", fontName="Helvetica-Bold", fontSize=15, leading=19,
                textColor=ACENTO, spaceBefore=18, spaceAfter=7)
H3     = estilo("H3", fontName="Helvetica-Bold", fontSize=11, leading=15, spaceBefore=11, spaceAfter=4)
CUERPO = estilo("Cuerpo", spaceAfter=9)
PIE    = estilo("Pie", fontSize=8.5, leading=12, textColor=TENUE, spaceAfter=2)
MONO   = estilo("Mono", fontName="Courier", fontSize=9, leading=13)
CELDA  = estilo("Celda", fontSize=9, leading=12.5)
CELDAB = estilo("CeldaB", fontName="Helvetica-Bold", fontSize=9, leading=12.5)
EPIG   = estilo("Epig", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
                textColor=SUAVE, spaceBefore=3, spaceAfter=10)

def p(txt, st=CUERPO):
    return Paragraph(txt, st)

def aviso(titulo, txt, tono="acento"):
    borde, relleno = (ACENTO, ACSUAVE) if tono == "acento" else (AVISO, AVSUAVE)
    t = Table([[Paragraph("<b>%s</b><br/>%s" % (titulo, txt), CELDA)]],
              colWidths=[ANCHO])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), relleno),
        ("LINEBEFORE", (0, 0), (0, -1), 2.2, borde),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t

def tabla(filas, anchos, cabecera=True):
    datos = []
    for i, fila in enumerate(filas):
        est = CELDAB if (cabecera and i == 0) else CELDA
        datos.append([Paragraph(c, est) for c in fila])
    t = Table(datos, colWidths=anchos, repeatRows=1 if cabecera else 0)
    est = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINEA),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]
    if cabecera:
        est += [("BACKGROUND", (0, 0), (-1, 0), FONDO),
                ("LINEBELOW", (0, 0), (-1, 0), 0.9, LINEA)]
    t.setStyle(TableStyle(est))
    return t

# --------------------------------------------------------------- dibujos ---
def caja(d, x, y, w, h, titulo, sub=None, relleno=BLANCO, borde=LINEA, negrita=True):
    d.add(Rect(x, y, w, h, fillColor=relleno, strokeColor=borde,
               strokeWidth=1, rx=5, ry=5))
    ty = y + h - 15 if sub else y + h / 2 - 3.5
    d.add(String(x + w / 2, ty, titulo, textAnchor="middle", fontSize=8.6,
                 fontName="Helvetica-Bold" if negrita else "Helvetica", fillColor=TINTA))
    if sub:
        for i, linea in enumerate(sub):
            d.add(String(x + w / 2, ty - 11 - i * 9.4, linea, textAnchor="middle",
                         fontSize=7.4, fontName="Helvetica", fillColor=SUAVE))

def flecha(d, x1, y1, x2, y2, etiqueta=None, color=ACENTO):
    d.add(Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=1.2))
    dx, dy = x2 - x1, y2 - y1
    largo = (dx * dx + dy * dy) ** 0.5 or 1
    ux, uy = dx / largo, dy / largo
    px, py = -uy, ux
    d.add(Polygon([x2, y2,
                   x2 - 7 * ux + 3.4 * px, y2 - 7 * uy + 3.4 * py,
                   x2 - 7 * ux - 3.4 * px, y2 - 7 * uy - 3.4 * py],
                  fillColor=color, strokeColor=color))
    if etiqueta:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        d.add(String(mx + px * 9, my + py * 9 + (2 if abs(uy) < .5 else 0), etiqueta,
                     textAnchor="middle", fontSize=7, fontName="Helvetica", fillColor=SUAVE))

def diagrama_captura():
    """De la calle a la hoja. Quien habla con el Apps Script es el teléfono."""
    d = Drawing(ANCHO, 200)
    hueco = 46
    cw = (ANCHO - 2 * hueco) / 3.0
    x0, x1, x2 = 0, cw + hueco, 2 * (cw + hueco)

    caja(d, x0, 120, cw, 56, "GitHub Pages", ["guarda la página", "y la sirve gratis"], BLANCO)
    caja(d, x1, 120, cw, 56, "El teléfono del técnico", ["la página corre aquí,", "no en un servidor"], ACSUAVE, ACENTO)
    caja(d, x2, 120, cw, 56, "Apps Script", ["Web App /exec", "acceso: cualquiera"], BLANCO)
    flecha(d, x0 + cw + 3, 148, x1 - 4, 148, "manda la página")
    flecha(d, x1 + cw + 3, 155, x2 - 4, 155, "guarda")
    flecha(d, x2 - 4, 133, x1 + cw + 3, 133, "lee")

    caja(d, x1, 28, cw, 56, "Grupo de WhatsApp", ["el técnico pega", "el mensaje"], FONDO)
    caja(d, x2, 28, cw, 56, "Hoja «Reportes»", ["una fila por orden,", "38 columnas"], AGSUAVE, AGUA)
    flecha(d, x1 + cw / 2, 118, x1 + cw / 2, 87, "copia y pega")
    flecha(d, x2 + cw / 2, 118, x2 + cw / 2, 87, "escribe la fila")

    d.add(String(x0, 66, "La página se descarga", fontSize=7.2, fillColor=SUAVE))
    d.add(String(x0, 56, "una vez y ya no vuelve", fontSize=7.2, fillColor=SUAVE))
    d.add(String(x0, 46, "a GitHub. Lo que viaja", fontSize=7.2, fillColor=SUAVE))
    d.add(String(x0, 36, "después son los datos.", fontSize=7.2, fillColor=SUAVE))
    return d

def diagrama_corte():
    """Cada jueves y cada domingo."""
    d = Drawing(ANCHO, 150)
    cw = (ANCHO - 3 * 16) / 4.0
    cajas = [
        ("Hoja «Reportes»", ["lo que aún no", "se ha pegado"], AGSUAVE, AGUA),
        ("Administración", ["?admin=Supervisor", "un solo botón"], ACSUAVE, ACENTO),
        ("Excel del corte", ["se pega en A2 de", "MAT UTILIZADO"], BLANCO, LINEA),
        ("Archivo guardado", ["en MATERIALES", "DE FIBRA"], BLANCO, LINEA),
    ]
    for i, (tit, sub, relleno, borde) in enumerate(cajas):
        x = i * (cw + 16)
        caja(d, x, 74, cw, 56, tit, sub, relleno, borde)
        if i < 3:
            flecha(d, x + cw + 1, 102, x + cw + 14, 102)

    # la vuelta: al archivar, la fila se marca
    x_admin = cw + 16
    d.add(Line(x_admin + cw / 2, 72, x_admin + cw / 2, 52, strokeColor=AGUA, strokeWidth=1.2))
    d.add(Line(x_admin + cw / 2, 52, cw / 2, 52, strokeColor=AGUA, strokeWidth=1.2))
    flecha(d, cw / 2, 53, cw / 2, 72, None, AGUA)
    d.add(String(x_admin + cw / 2 + 6, 42, "y al archivar, esas filas se marcan como copiadas",
                 fontSize=7.4, textAnchor="middle", fillColor=AGUA))
    d.add(String(0, 16, "El archivo de cada corte se parte del anterior: trae sus pestañas y sus fórmulas.",
                 fontSize=7.4, fillColor=SUAVE))
    return d

def diagrama_vida():
    """Los cuatro estados por los que pasa una fila."""
    d = Drawing(ANCHO, 150)
    W = ANCHO
    ancho = (W - 3 * 16) / 4.0
    etapas = [
        ("1 · Creada", ["pantalla 1", "MaterialOk vacío"], ACSUAVE, ACENTO),
        ("2 · Completa", ["pantalla 2", "MaterialOk = SI"], ACSUAVE, ACENTO),
        ("3 · Archivada", ["el admin la pegó", "Copiada = fecha"], AGSUAVE, AGUA),
        ("4 · Borrada", ["8 semanas después", "se poda sola"], FONDO, LINEA),
    ]
    for i, (tit, sub, relleno, borde) in enumerate(etapas):
        x = i * (ancho + 16)
        caja(d, x, 62, ancho, 56, tit, sub, relleno, borde)
        if i < 3:
            flecha(d, x + ancho + 1, 90, x + ancho + 14, 90)

    d.add(String(0, 40, "A la vista de la app", fontSize=7.6, fontName="Helvetica-Bold", fillColor=SUAVE))
    d.add(Line(0, 34, 2 * ancho + 16, 34, strokeColor=ACENTO, strokeWidth=2))
    d.add(String(2 * ancho + 32, 40, "Fuera de la vista, pero recuperable",
                 fontSize=7.6, fontName="Helvetica-Bold", fillColor=SUAVE))
    d.add(Line(2 * ancho + 32, 34, 3 * ancho + 32, 34, strokeColor=AGUA, strokeWidth=2))
    d.add(String(0, 16, "Solo se borra lo ya archivado. Lo pendiente de pegar nunca se toca.",
                 fontSize=7.6, fillColor=SUAVE))
    return d

def diagrama_columnas():
    """Qué columnas del Excel lleva el pegado. En dos renglones: con 30 celdas
    seguidas las etiquetas no caben y se encabalgan."""
    letras = []
    for i in range(1, 31):
        n, s2 = i, ""
        while n:
            n, r = divmod(n - 1, 26)
            s2 = chr(65 + r) + s2
        letras.append(s2)
    contenido = {1: "No.", 2: "FOLIO", 3: "TELEF.", 4: "FECHA", 5: "TIPO", 6: "TECNICO",
                 7: "MODEM", 13: "ARGOLL.", 15: "TAQUET.", 17: "ROSETA", 18: "SELLOS",
                 19: "SINCHO", 22: "TENSOR", 24: "SUJ MRF", 26: "ONT", 30: "BOBINA"}
    d = Drawing(ANCHO, 150)
    porFila = 15
    cw = ANCHO / float(porFila)
    for i, letra in enumerate(letras):
        fila, col = divmod(i, porFila)
        x = col * cw
        y = 96 - fila * 46
        lleva = (i + 1) in contenido
        d.add(Rect(x, y, cw - 2.6, 38, fillColor=ACSUAVE if lleva else BLANCO,
                   strokeColor=ACENTO if lleva else LINEA, strokeWidth=0.8))
        d.add(String(x + (cw - 2.6) / 2, y + 23, letra, textAnchor="middle", fontSize=8.4,
                     fontName="Helvetica-Bold", fillColor=TINTA if lleva else TENUE))
        if lleva:
            d.add(String(x + (cw - 2.6) / 2, y + 9, contenido[i + 1], textAnchor="middle",
                         fontSize=5.4, fontName="Helvetica", fillColor=ACENTO))
    d.add(Line(0, 42, ANCHO, 42, strokeColor=ACENTO, strokeWidth=1.6))
    d.add(String(0, 29, "Un solo pegado en A2 cubre las 30 columnas.", fontSize=8.4,
                 fontName="Helvetica-Bold", fillColor=TINTA))
    d.add(String(0, 16, "Las 14 en blanco van vacías a propósito: son materiales que no se usan desde",
                 fontSize=7.4, fillColor=SUAVE))
    d.add(String(0, 6, "hace años, y pegarlas vacías limpia lo que hubiera quedado del corte anterior.",
                 fontSize=7.4, fillColor=SUAVE))
    return d

# ------------------------------------------------------ marco de página ---
def marco(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setStrokeColor(LINEA)
        canvas.setLineWidth(0.5)
        canvas.line(22 * mm, letter[1] - 17 * mm, letter[0] - 22 * mm, letter[1] - 17 * mm)
        canvas.setFont("Helvetica", 7.6)
        canvas.setFillColor(TENUE)
        canvas.drawString(22 * mm, letter[1] - 14.5 * mm, "ARQUITECTURA DEL REPORTE DE OS  ·  CAREL")
        canvas.drawRightString(letter[0] - 22 * mm, 13 * mm, str(doc.page))
    canvas.restoreState()

# ------------------------------------------------------------- contenido ---
def construir(ruta):
    doc = SimpleDocTemplate(ruta, pagesize=letter,
                            leftMargin=22 * mm, rightMargin=22 * mm,
                            topMargin=24 * mm, bottomMargin=20 * mm,
                            title="Arquitectura del Reporte de OS",
                            author="CAREL", subject="Cómo está armado el sistema")
    s = []

    # -------- portada
    s.append(Spacer(1, 34))
    s.append(p("CAREL &nbsp;·&nbsp; FIBRA ÓPTICA", estilo("marca", fontName="Helvetica-Bold",
              fontSize=8.4, textColor=ACENTO, spaceAfter=12)))
    s.append(p("Arquitectura del<br/>Reporte de OS", H1))
    s.append(Spacer(1, 8))
    s.append(p("Cómo está armado el sistema por dentro: qué pieza hace qué, por dónde "
               "viaja una orden desde el teléfono del técnico hasta el archivo de Excel, "
               "y por qué se tomaron las decisiones que se tomaron.", estilo(
                   "bajada", fontSize=11.5, leading=17, textColor=SUAVE, spaceAfter=20)))
    s.append(aviso("Para leer esto",
                   "Basta con saber qué es una página web, un formulario y una hoja de "
                   "cálculo. Donde aparece algo de programación se explica en la misma línea."))

    s.append(p("Las tres piezas", H2))
    s.append(p("El sistema son tres cosas y nada más. Ninguna guarda contraseñas, y ninguna "
               "necesita que el técnico tenga cuenta de nada."))
    s.append(tabla([
        ["Pieza", "Qué es", "Quién la toca"],
        ["<b>La página</b><br/><font face='Courier' size='8'>index.html</font>",
         "Un solo archivo con todo dentro: el formulario, los textos, los colores y la lógica. "
         "Se descarga entera al abrir el enlace y a partir de ahí funciona en el teléfono.",
         "El técnico y quien arma el corte"],
        ["<b>El guardado</b><br/><font face='Courier' size='8'>Code.gs</font>",
         "Un programa que vive dentro de la hoja de cálculo de Google. Recibe lo que manda la "
         "página, lo escribe en una fila y devuelve lo que la página necesita leer.",
         "Nadie: trabaja solo"],
        ["<b>Los datos</b><br/>Hoja «Reportes»",
         "Una hoja de cálculo normal de Google. Una fila por orden, con 38 columnas.",
         "Se puede abrir para mirar, pero no hace falta"],
    ], [ANCHO * 0.24, ANCHO * 0.50, ANCHO * 0.26]))

    s.append(p("El recorrido de una orden", H2))
    s.append(p("GitHub Pages solo hace una cosa: entregar el archivo de la página. Una vez "
               "descargada, la página vive en el teléfono, y es el teléfono —no GitHub— el que "
               "le habla al Apps Script cada vez que se guarda algo."))
    s.append(diagrama_captura())
    s.append(p("1 · La captura, en la calle", EPIG))

    s.append(diagrama_corte())
    s.append(p("2 · El corte, cada jueves y cada domingo", EPIG))

    s.append(aviso("Por qué GitHub Pages y Apps Script",
                   "Los dos son gratis y ninguno pide que el técnico se identifique. La página "
                   "es un archivo estático —no hay servidor que mantener— y el Apps Script vive "
                   "dentro de la hoja, así que no hay base de datos aparte ni contraseñas que "
                   "guardar."))

    s.append(PageBreak())

    # -------- el guardado en dos tiempos
    s.append(p("Por qué se guarda en dos tiempos", H2))
    s.append(p("La orden se guarda al terminar la pantalla 1, antes de capturar el material. "
               "Podría guardarse todo junto al final, pero entonces un técnico que pierde la "
               "señal a mitad de la captura perdería también el mensaje que ya mandó por "
               "WhatsApp. Guardando primero, lo que queda a medias es solo el material — y el "
               "consolidado lo marca como <b>sin material</b> para que nadie lo dé por cerrado."))
    s.append(diagrama_vida())

    s.append(p("Qué guarda cada fila", H2))
    s.append(p("Una fila tiene 38 columnas y se llena en tres momentos:"))
    s.append(tabla([
        ["Cuándo", "Cuántas", "Qué llevan"],
        ["Al crear la orden", "22", "Todo lo que va al mensaje de WhatsApp: folio, tipo de OS, "
         "distrito, terminal, puerto, cliente, teléfono, expediente, serie, modelo, CV, "
         "dirección, barrio, metraje, acometida, fecha, observaciones y el módem retirado."],
        ["Al capturar el material", "8", "Argollas, taquetes, roseta, sellos, sincho, tensores, "
         "suj. marfil y ONT."],
        ["Las que pone el sistema", "8", "Fecha y hora, un identificador único, la clave que "
         "evita duplicados, el técnico, su número de la semana, la semana, si el material ya "
         "está, y la marca de archivado."],
    ], [ANCHO * 0.24, ANCHO * 0.16, ANCHO * 0.60]))

    s.append(KeepTogether([
        p("El puente al Excel", H2),
        p("El Excel semanal tiene otro orden de columnas y 16 que no nos interesan. "
          "Por eso el corte no se copia tal cual: la app arma la fila con los datos ya "
          "puestos en la columna que les toca."),
        diagrama_columnas(),
    ]))

    # -------- decisiones
    s.append(p("Las decisiones, y por qué", H2))
    s.append(p("Casi todo lo que parece raro en el sistema responde a algo que pasó de verdad "
               "en los reportes de 2026."))
    s.append(tabla([
        ["Decisión", "El motivo"],
        ["<b>Sin cuentas de ningún tipo</b>",
         "Un técnico en la calle no debe pelearse con una contraseña. El Apps Script se publica "
         "con acceso «cualquier usuario» y el enlace de cada quien lleva su nombre. "
         "A cambio, cualquiera con el enlace puede guardar: es el precio."],
        ["<b>La misma orden guardada dos veces no se duplica</b>",
         "Cada guardado lleva una clave hecha con técnico, folio, teléfono y fecha. Si la señal "
         "se cae justo después de guardar, el técnico reintenta y el sistema reconoce que es "
         "la misma. Sin esto quedan dos filas del mismo folio y nadie se entera."],
        ["<b>Los duplicados avisan, no bloquean</b>",
         "En 2026 hubo 12 teléfonos repetidos y 10 eran órdenes legítimas distintas del mismo "
         "domicilio. Bloquear habría dejado al técnico parado en la calle."],
        ["<b>Un solo nombre por persona</b>",
         "En el Excel de 2026 la misma persona aparece escrita de tres formas. La app tiene una "
         "lista con el nombre bueno y los alias, y escribe siempre el bueno."],
        ["<b>El consecutivo lo asigna el servidor</b>",
         "El teléfono propone el siguiente número, pero si no lo tocaron, lo decide el Apps "
         "Script al guardar. El teléfono puede llevar una lista vieja; el servidor no."],
        ["<b>Todo se escribe como texto</b>",
         "Google Sheets convertía «058876673» en 58876673 y se comía el cero del folio, que el "
         "mensaje de WhatsApp sí lleva. Cada fila se escribe fijando antes el formato."],
        ["<b>Ocho semanas de historial</b>",
         "Una vez que el corte está pegado y guardado, el reporte ya vive en el archivo de Excel "
         "y en el chat de WhatsApp. Lo que se conserva aquí es solo lo que la app necesita."],
    ], [ANCHO * 0.30, ANCHO * 0.70]))

    s.append(PageBreak())

    # -------- limites
    s.append(p("Los límites, medidos", H2))
    s.append(p("Las cifras de abajo salen de medir las llamadas reales al sistema y de contar "
               "las 1,180 órdenes de 2026, no de estimaciones."))
    s.append(tabla([
        ["", "Hoy: 3 técnicos", "Con 13 técnicos"],
        ["Órdenes al año", "1,180", "~5,100"],
        ["Llamadas al sistema por día", "~25", "~110"],
        ["Tiempo de proceso al día", "menos de 1 minuto", "~3 minutos"],
        ["Límite diario de Google", "90 minutos", "90 minutos"],
        ["Filas en la hoja (con la poda)", "~200 fijas", "~800 fijas"],
    ], [ANCHO * 0.40, ANCHO * 0.30, ANCHO * 0.30]))
    s.append(Spacer(1, 6))
    s.append(aviso("Lo que sí se rompería sin la poda",
                   "La lista de folios y teléfonos ya usados se descarga entera cada vez que "
                   "alguien abre la app. Sin borrar historial, con 13 técnicos serían 554 KB al "
                   "año y 1.1 MB a los dos años, en la calle y con mala señal. Con la poda a "
                   "ocho semanas se queda en unos 87 KB, para siempre.", "aviso"))

    s.append(p("Qué pasa al crecer", H2))
    s.append(tabla([
        ["Si ocurre esto", "Qué hay que hacer"],
        ["Entra un técnico nuevo",
         "Agregarlo a la lista del sistema con su nombre, su plaza y su expediente de COPE, y "
         "mandarle su enlace. Nada más."],
        ["Se abre otra ciudad",
         "Nada especial: la plaza es el COPE, que ya existía. Cuando hay más de una, el corte "
         "muestra un selector y el nombre del archivo lleva la plaza al final."],
        ["Cambia el formato del mensaje de WhatsApp",
         "Se toca en un solo sitio de la página: la función que arma el texto está escrita "
         "línea por línea, en el mismo orden en que sale."],
        ["Cambia el Excel de destino",
         "Se toca la lista de columnas del pegado. Es una sola línea con las 30 posiciones."],
    ], [ANCHO * 0.34, ANCHO * 0.66]))

    s.append(KeepTogether([
        p("Lo que hay que vigilar", H2),
        tabla([
        ["Riesgo", "Qué pasaría", "Qué lo contiene"],
        ["El enlace de administración no es una contraseña",
         "Alguien podría archivar un corte antes de que se pegue.",
         "No repartirlo. Las órdenes no se pierden: quedan marcadas en la hoja."],
        ["El Apps Script hay que republicarlo a mano",
         "Un cambio en el guardado no se aplica solo.",
         "Implementar, y luego nueva versión. La dirección no cambia."],
        ["Todo cuelga de una cuenta de Google",
         "Si esa cuenta se pierde, se pierde el guardado.",
         "La hoja se puede descargar; los reportes ya están en el Excel y en WhatsApp."],
        ], [ANCHO * 0.28, ANCHO * 0.36, ANCHO * 0.36]),
    ]))

    doc.build(s, onFirstPage=marco, onLaterPages=marco)
    return ruta

if __name__ == "__main__":
    import sys
    print("escrito:", construir(sys.argv[1]))

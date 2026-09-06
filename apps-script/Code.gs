/**
 * Material de OS — backend en Google Apps Script (v2).
 *
 * Una fila por orden en la hoja "Reportes" de este mismo archivo de Google
 * Sheets. La pantalla 1 de la app crea la fila con los datos de la orden (los
 * mismos que van al mensaje de WhatsApp); la pantalla 2 le agrega el material.
 *
 * Se publica como Web App con acceso "Cualquier usuario" para que los técnicos
 * guarden SIN iniciar sesión en nada. Ver INSTRUCCIONES.md.
 *
 * Archivar un corte NO borra: marca la columna Copiada y la fila desaparece de
 * la app, pero se queda aquí unas semanas por si hay que corregir algo o avisar
 * de un folio repetido. Pasado ese plazo se borra sola — ver SEMANAS_HISTORIAL.
 */

var SHEET_NAME = "Reportes";

/**
 * Semanas que se conservan las órdenes YA ARCHIVADAS. Después se borran solas.
 *
 * No es descuido: una vez que el corte se pegó en su Excel y el archivo se
 * guardó, el reporte ya vive en dos sitios —ese archivo y el chat de WhatsApp,
 * que tiene el mensaje completo—. Lo que se conserva aquí es solo lo que la app
 * necesita: avisar de folios repetidos (los dos casos reales de 2026 estaban a
 * una semana), poder corregir un corte reciente, y el consecutivo de la semana.
 *
 * Sin esto la hoja crecería sin freno: con 13 técnicos son ~5,100 filas al año,
 * y cada teléfono se baja el índice entero cada vez que abre la app.
 */
var SEMANAS_HISTORIAL = 8;

var COLS = [
  "Timestamp", "ID", "ClaveCliente", "Tecnico", "NFibra", "Semana",
  "Cope", "Folio", "TipoOS", "Distrito", "Terminal", "Puerto",
  "Cliente", "Telefono", "ExpedienteCope", "Serie", "ModeloModem", "CV",
  "Direccion", "Barrio", "Metraje", "Acometida", "Fecha", "Observaciones",
  "Autoriza", "Nip", "Vigencia", "RetiraModem",
  "Argollas", "Taquetes", "Roseta", "Sellos", "Sincho", "Tensores", "SujMarfil", "Ont",
  "MaterialOk", "Copiada",
  // Va al final y no junto a Barrio, que es donde le tocaría por contenido:
  // idx() mapea por posición, así que meterla en medio dejaría las órdenes ya
  // guardadas leyéndose con todo corrido una columna.
  "CelReferencia",
  // Sello de la ultima correccion. Comparado con Copiada dice lo unico que
  // importa: si se toco DESPUES de haberse pegado en el Excel.
  "Editada"
];

// Campos de la orden: clave que usa la app -> columna de la hoja.
var CAMPOS_ORDEN = {
  cope: "Cope", folio: "Folio", tipoOs: "TipoOS", distrito: "Distrito",
  terminal: "Terminal", puerto: "Puerto", cliente: "Cliente", telefono: "Telefono",
  expediente: "ExpedienteCope", serie: "Serie", modelo: "ModeloModem", cv: "CV",
  direccion: "Direccion", barrio: "Barrio", metraje: "Metraje", acometida: "Acometida",
  fecha: "Fecha", observaciones: "Observaciones", autoriza: "Autoriza",
  nip: "Nip", vigencia: "Vigencia", retiraModem: "RetiraModem",
  celReferencia: "CelReferencia"
};

/**
 * Campos que viajan en la lista COMPARTIDA (`entries`) — la que hoy puede pedir
 * cualquiera, porque la URL /exec va dentro de la página publicada en GitHub
 * Pages y ahí no es un secreto.
 *
 * Es una lista blanca a propósito: lo que no esté aquí NO sale. Son justo los
 * que el corte necesita para armar la fila del Excel (BLOQUE_AD en index.html)
 * y para avisar de folios repetidos.
 *
 * Fuera quedan dos grupos. Los que identifican al cliente —nombre, dirección,
 * barrio, celular de referencia— y los que sencillamente no los usa nadie del
 * otro lado: NIP, vigencia, autoriza, observaciones, expediente. El NIP no es
 * dato sensible (es la referencia del cambio de servicio, no una clave), pero
 * el corte no lo necesita y aquí solo entra lo que se usa.
 *
 * Todo eso sigue saliendo completo en `mias`, que ya viene filtrado por técnico
 * y es de donde el teléfono arma el mensaje de WhatsApp y las correcciones.
 */
var CAMPOS_PUBLICOS = ["cope", "folio", "tipoOs", "distrito", "terminal", "puerto",
                       "telefono", "serie", "modelo", "cv", "metraje", "acometida",
                       "fecha"];

var CAMPOS_MATERIAL = {
  argollas: "Argollas", taquetes: "Taquetes", roseta: "Roseta", sellos: "Sellos",
  sincho: "Sincho", tensores: "Tensores", sujMarfil: "SujMarfil", ont: "Ont"
};

/**
 * Columnas que van como número. TODAS las demás se escriben con formato de
 * texto ("@") a propósito: si no, Sheets convierte "058876673" en 58876673 y
 * el cero inicial del folio —que el mensaje de WhatsApp sí lleva— se pierde
 * sin que nadie se entere. Lo mismo con el expediente ("00831901").
 */
var NUMERICAS = ["Timestamp", "NFibra", "Metraje",
                 "Argollas", "Taquetes", "Roseta", "Sellos",
                 "Sincho", "Tensores", "SujMarfil", "Ont"];

// Campos que la app ofrece como lista de "más usados". La lista se calcula de
// lo que ya hay en la hoja; estas semillas son solo el arranque, salidas de los
// reportes reales de 2026 (TipoOS y Metraje) y del formato de WhatsApp.
var SEMILLAS = {
  cope: ["COMITAN"],
  tipoOs: ["TS1L7SG", "A0MLPBG", "TS2L7SG", "TSML7SG", "A01LPBG",
           "D21LPBG", "D22LPBG", "D2MLPBG", "TS1L7SGPI", "A01LPBGPE"],
  modelo: ["ZTE", "HUAWEI", "TP LINK"],
  cv: ["COMERCIAL"],
  metraje: ["25", "50", "75", "100", "125", "150", "200", "250", "300", "350", "400", "450", "500"],
  observaciones: ["VOZ DATOS"]
};

// Campos con lista. Los que no tienen semilla se llenan solos con el uso.
// El NIP sigue aquí: no es un dato bancario ni de acceso, es la referencia de
// que hubo un cambio de servicio, y ver los más usados le ahorra tecleo al
// técnico. Por eso tampoco se trata como los datos de identidad del cliente.
var CON_LISTA = ["cope", "tipoOs", "distrito", "terminal", "puerto", "modelo",
                 "cv", "barrio", "metraje", "observaciones", "autoriza", "nip", "vigencia"];

// -------------------------------------------------------------- identidad ---

/**
 * ID de cliente de OAuth de la página.
 *
 * NO es un secreto y no pasa nada porque se lea: Google lo publica en toda
 * página que use su botón de acceso, y solo funciona desde el origen que se
 * registró en la consola (https://yeudielcm-sketch.github.io). La credencial de
 * verdad es el pase de cada persona: lo emite Google al iniciar sesión, dura
 * una hora, y no vive en el repositorio ni en esta hoja.
 */
var CLIENT_ID = "967277323982-57iv1odm3eh8vlf9hp0ujs6q9e5t394o.apps.googleusercontent.com";

/**
 * Quién puede entrar. Se llena A MANO en la hoja, nunca desde el código: son
 * correos de personas y el repositorio es público.
 *
 * Rol: SUPERVISOR o TECNICO (cualquier otra cosa se toma como TECNICO). Dar de
 * alta a alguien es escribir una fila; darlo de baja, borrarla. No hay que
 * volver a implementar nada.
 */
var SHEET_AUTORIZADOS = "Autorizados";
var COLS_AUT = ["Correo", "Nombre", "Rol"];

function getHojaAutorizados() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_AUTORIZADOS);
  if (sh) return sh;
  sh = ss.insertSheet(SHEET_AUTORIZADOS);
  sh.appendRow(COLS_AUT);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, COLS_AUT.length).setFontWeight("bold");
  return sh;
}

/** Se puede ejecutar a mano desde el editor para que la pestaña aparezca ya. */
function prepararAutorizados() {
  getHojaAutorizados();
}

/**
 * Deja el correo en una sola forma para poder compararlo. Gmail ignora los
 * puntos y lo que va tras un "+", así que yeudiel.cm+os@gmail.com y
 * yeudielcm@gmail.com son la MISMA cuenta: sin esto, uno de los dos se queda
 * fuera sin que se entienda por qué.
 */
function correoCanonico(v) {
  var c = clean(v).toLowerCase();
  var p = c.split("@");
  if (p.length !== 2 || !p[0] || !p[1]) return "";
  var usuario = p[0].split("+")[0];
  if (p[1] === "gmail.com" || p[1] === "googlemail.com") {
    return usuario.replace(/\./g, "") + "@gmail.com";
  }
  return usuario + "@" + p[1];
}

function leerAutorizados() {
  var sh = getHojaAutorizados();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var v = sh.getRange(2, 1, last - 1, COLS_AUT.length).getValues();
  var out = [];
  for (var i = 0; i < v.length; i++) {
    var correo = correoCanonico(v[i][0]);
    if (!correo) continue;
    out.push({ correo: correo,
               nombre: clean(v[i][1]),
               rol: clean(v[i][2]).toUpperCase() === "SUPERVISOR" ? "SUPERVISOR" : "TECNICO" });
  }
  return out;
}

/**
 * Comprueba con Google que el pase es de verdad y dice de quién es.
 *
 * Devuelve null si no vino pase, {error:...} si vino pero no sirve, o la ficha
 * de la persona si todo cuadra. FASE 2: nadie usa esto todavía para rechazar
 * nada — se devuelve para que cada quien vea en su teléfono que su acceso
 * quedó bien antes de que empecemos a exigirlo.
 */
function verificarPase(pase) {
  var token = clean(pase);
  if (!token) return null;

  var cache = CacheService.getScriptCache();
  var llave = "pase_" + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  var guardado = cache.get(llave);
  if (guardado) {
    try { return JSON.parse(guardado); } catch (eCache) { /* caché ilegible: se rehace */ }
  }

  var datos;
  try {
    var r = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token),
      { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return { error: "pase_rechazado" };
    datos = JSON.parse(r.getContentText());
  } catch (eRed) {
    // Si Google no contesta NO se inventa una identidad: se dice que no se pudo.
    return { error: "no_se_pudo_verificar" };
  }

  // Que el pase sea válido no basta: tiene que ser un pase para ESTA app. Sin
  // esta comprobación, un pase de cualquier otra web serviría aquí.
  if (datos.aud !== CLIENT_ID) return { error: "pase_de_otra_app" };
  if (String(datos.email_verified) !== "true") return { error: "correo_sin_verificar" };
  var ahora = Math.floor(new Date().getTime() / 1000);
  if (!(Number(datos.exp) > ahora)) return { error: "pase_vencido" };

  var correo = correoCanonico(datos.email);
  var lista = leerAutorizados();
  var quien = null;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].correo === correo) { quien = lista[i]; break; }
  }
  // Arranque: con la pestaña vacía solo entra el dueño del script, para que
  // pueda llenarla sin dejarse fuera a sí mismo.
  if (!quien && !lista.length) {
    var duenio = "";
    try { duenio = correoCanonico(Session.getEffectiveUser().getEmail()); }
    catch (eDuenio) { duenio = ""; }
    if (duenio && duenio === correo) {
      quien = { correo: correo, nombre: "Supervisor", rol: "SUPERVISOR" };
    }
  }
  if (!quien) return { error: "no_autorizado" };

  var id = { correo: quien.correo, nombre: quien.nombre, rol: quien.rol };
  // Cinco minutos como mucho: el permiso se quita borrando una fila de la hoja
  // y eso tiene que surtir efecto pronto, no dentro de una hora.
  var vida = Math.min(300, Number(datos.exp) - ahora);
  if (vida > 0) cache.put(llave, JSON.stringify(id), vida);
  return id;
}

/**
 * Cuelga de la respuesta quién resultó ser quien llamó.
 *
 * FASE 2 y solo fase 2: es informativo. No se rechaza nada por no traer pase,
 * ni se recorta la respuesta según el rol. Eso llega en la fase 3, cuando los
 * tres técnicos ya hayan entrado bien.
 */
function conIdentidad(obj, identidad, aviso) {
  var o = obj || {};
  if (identidad) {
    o.identidad = { correo: identidad.correo, nombre: identidad.nombre, rol: identidad.rol };
  } else if (aviso) {
    o.paseInvalido = aviso;
  }
  return o;
}

function esUno(v) { return v === "1" || v === 1 || v === true; }

// --------------------------------------------------------------- técnicos ---

var SHEET_TECNICOS = "Tecnicos";
var COLS_TEC = ["Nombre", "Cope", "Expediente", "Alias"];

/**
 * El ORDEN DE LAS FILAS es el orden en que los técnicos salen en el Excel
 * —CARLOS, MARVIN, JULIO—, que no es alfabético. Para reordenar, se arrastran
 * las filas en la hoja. Los alias existen porque en el Excel de 2026 la misma
 * persona aparecía escrita de tres formas.
 */
var TECNICOS_INICIALES = [
  ["CARLOS DANIEL BERMUDEZ",    "COMITAN", "00917921", ""],
  ["MARVIN ALEXIS MARTINEZ",    "COMITAN", "00831901", "ALEXIS MARTINEZ, MARVIN ALEXIS MARTINEZ CALVO"],
  ["JULIO CESAR LOPEZ SANCHEZ", "COMITAN", "00746601", ""]
];

function getHojaTecnicos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_TECNICOS);
  if (sh) return sh;
  sh = ss.insertSheet(SHEET_TECNICOS);
  sh.appendRow(COLS_TEC);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, COLS_TEC.length).setFontWeight("bold");
  var r = sh.getRange(2, 1, TECNICOS_INICIALES.length, COLS_TEC.length);
  r.setNumberFormat("@");        // el expediente lleva ceros a la izquierda
  r.setValues(TECNICOS_INICIALES);
  return sh;
}

function leerTecnicos() {
  var sh = getHojaTecnicos();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var v = sh.getRange(2, 1, last - 1, COLS_TEC.length).getValues();
  var out = [];
  for (var i = 0; i < v.length; i++) {
    var nombre = clean(v[i][0]);
    if (!nombre) continue;
    var alias = clean(v[i][3]);
    out.push({
      nombre: nombre,
      cope: clean(v[i][1]),
      expediente: clean(v[i][2]),
      alias: alias ? alias.split(",").map(function (a) { return a.trim(); })
                          .filter(function (a) { return a; }) : []
    });
  }
  return out;
}

function addTecnico(body) {
  var nombre = clean(body.nombre).toUpperCase();
  if (!nombre) return { error: "sin_nombre" };
  var cope = clean(body.cope).toUpperCase();
  if (!cope) return { error: "sin_cope" };

  var ya = leerTecnicos();
  for (var i = 0; i < ya.length; i++) {
    if (ya[i].nombre.toUpperCase() === nombre) return { error: "ya_existe" };
  }
  var sh = getHojaTecnicos();
  var fila = sh.getLastRow() + 1;
  var r = sh.getRange(fila, 1, 1, COLS_TEC.length);
  r.setNumberFormat("@");
  r.setValues([[nombre, cope, clean(body.expediente), clean(body.alias)]]);
  return { ok: true, tecnicos: leerTecnicos() };
}

// ---------------------------------------------------------------- entrada ---

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || "list";
  if (action === "list") return respond(listEntries(p.full === "1", p.tec));
  return respond({ error: "unknown_action" });
}

/**
 * La lectura también entra por aquí cuando el teléfono trae pase: un pase son
 * unos mil caracteres y en la barra de direcciones acabaría copiado en los
 * registros de medio camino. Por POST no queda escrito en ninguna parte.
 *
 * Ojo al tocar el cliente: a la petición NO se le pone Content-Type. En cuanto
 * se le pone, el navegador manda antes una petición OPTIONS que Apps Script no
 * sabe contestar, y deja de funcionar el guardado entero.
 */
function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
  catch (parseErr) { return respond({ error: "bad_json" }); }

  // Fuera del candado a propósito: verificar el pase habla con Google por red y
  // no tiene por qué tener parados a los demás mientras tanto.
  var visto = verificarPase(body.pase);
  var identidad = (visto && !visto.error) ? visto : null;
  var aviso = (visto && visto.error) ? visto.error : "";

  // Listar no escribe en la hoja: no necesita candado.
  if (body.action === "list") {
    try {
      return respond(conIdentidad(listEntries(esUno(body.full), body.tec), identidad, aviso));
    } catch (errList) {
      return respond({ error: String(errList && errList.message ? errList.message : errList) });
    }
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return respond({ error: "busy" });
  try {
    var r;
    switch (body.action) {
      case "addOrden":      r = addOrden(body); break;
      case "saveMaterial":  r = saveMaterial(body); break;
      case "updateOrden":   r = updateOrden(body); break;
      case "marcarCopiada": r = marcarCopiada(body); break;
      case "addTecnico":    r = addTecnico(body); break;
      default:              r = { error: "unknown_action" };
    }
    return respond(conIdentidad(r, identidad, aviso));
  } catch (err) {
    return respond({ error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------------ hoja ---

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("El script no está dentro de una Hoja de cálculo.");
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLS.length).setFontWeight("bold");
    return sh;
  }
  // El encabezado se rehace si NO coincide entero. Se compara columna por
  // columna a propósito: basta que alguien teclee encima de una celda de la
  // fila 1 para dejarlo mal, y mirar solo una no lo detecta.
  if (sh.getMaxColumns() < COLS.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), COLS.length - sh.getMaxColumns());
  }
  var cab = sh.getRange(1, 1, 1, COLS.length).getValues()[0];
  var iguales = true;
  for (var i = 0; i < COLS.length; i++) {
    if (String(cab[i]) !== COLS[i]) { iguales = false; break; }
  }
  if (!iguales) {
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function idx(nombre) {
  var i = COLS.indexOf(nombre);
  if (i < 0) throw new Error("Columna desconocida: " + nombre);
  return i;
}

/** Escribe una fila entera fijando antes el formato de cada celda. */
function escribirFila(sh, numFila, valores) {
  var rango = sh.getRange(numFila, 1, 1, COLS.length);
  rango.setNumberFormats([COLS.map(function (n) {
    return NUMERICAS.indexOf(n) >= 0 ? "General" : "@";
  })]);
  rango.setValues([valores]);
}

function leerTodo(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, COLS.length).getValues();
}

// ----------------------------------------------------------------- listar ---

/**
 * Pasa una fila a objeto. Con `completo` en true van los 23 campos de la orden
 * —es lo que ve el técnico de SUS propias órdenes, que las corrige y vuelve a
 * copiar el mensaje de WhatsApp—. Sin él solo van los de CAMPOS_PUBLICOS.
 */
function filaAObjeto(r, completo) {
  var o = { id: String(r[idx("ID")]), tecnico: String(r[idx("Tecnico")]),
            nFibra: num(r[idx("NFibra")]), semana: String(r[idx("Semana")]),
            materialOk: String(r[idx("MaterialOk")]) === "SI",
            copiada: String(r[idx("Copiada")]),
            editada: String(r[idx("Editada")]) };
  if (completo) {
    for (var k in CAMPOS_ORDEN) o[k] = String(r[idx(CAMPOS_ORDEN[k])]);
  } else {
    for (var i = 0; i < CAMPOS_PUBLICOS.length; i++) {
      var c = CAMPOS_PUBLICOS[i];
      o[c] = String(r[idx(CAMPOS_ORDEN[c])]);
    }
  }
  for (var m in CAMPOS_MATERIAL) o[m] = num(r[idx(CAMPOS_MATERIAL[m])]);
  return o;
}

function listEntries(full, tec) {
  var sh = getSheet();
  podarSiTocaHoy(sh);
  var values = leerTodo(sh);
  var entries = [], indice = [], tecs = {}, cuenta = {};

  // Lo del técnico que abre la app: sus órdenes de la semana en curso y la
  // anterior, ESTÉN O NO archivadas, y el número que le toca. Se filtra aquí y
  // no en el teléfono para no mandarle las de los demás.
  var quien   = clean(tec).toUpperCase();
  var semAct  = semanaActual();
  var semAnt  = semanaAnterior();
  var mias    = [];
  var siguiente = 1;

  CON_LISTA.forEach(function (k) { cuenta[k] = {}; });

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[idx("ID")]) continue;
    var tec = String(r[idx("Tecnico")]);
    if (tec) tecs[tec] = true;

    CON_LISTA.forEach(function (k) {
      var v = String(r[idx(CAMPOS_ORDEN[k])]).trim();
      if (v) cuenta[k][v] = (cuenta[k][v] || 0) + 1;
    });

    // El índice de duplicados mira TODAS las filas, también las ya copiadas:
    // un folio repetido hace tres semanas sigue siendo un folio repetido.
    if (full) {
      indice.push([String(r[idx("Folio")]), String(r[idx("Telefono")]),
                   String(r[idx("Fecha")]), tec, num(r[idx("NFibra")]),
                   String(r[idx("ID")])]);
    }

    if (quien && String(r[idx("Tecnico")]).toUpperCase() === quien) {
      var sem = String(r[idx("Semana")]);
      // El siguiente número sale de TODA la semana, archivada o no. Antes lo
      // calculaba el teléfono con lo que hubiera descargado, y si esa descarga
      // fallaba proponía 1.
      if (sem === semAct) {
        var n = num(r[idx("NFibra")]);
        if (n >= siguiente) siguiente = n + 1;
      }
      if (sem === semAct || sem === semAnt) {
        var mia = filaAObjeto(r, true);
        mia.semanaEs = (sem === semAct) ? "actual" : "anterior";
        mias.push(mia);
      }
    }

    if (String(r[idx("Copiada")])) continue; // archivada: fuera del consolidado
    entries.push(filaAObjeto(r, false));
  }

  // Que la pestaña de autorizados exista desde el primer día, sin esperar a que
  // alguien inicie sesión: si no, no hay dónde escribir los correos.
  try { getHojaAutorizados(); } catch (eAut) { /* nunca por encima de la captura */ }

  // Si algo falla leyendo los técnicos, la captura NO se cae: la app tiene su
  // propia copia de respaldo.
  var fichas = [];
  try { fichas = leerTecnicos(); } catch (e) { fichas = []; }

  var out = { entries: entries, tecnicos: fichas,
              tecnicosConDatos: Object.keys(tecs),
              catalogos: catalogos(cuenta) };
  if (quien) {
    out.mias = mias;
    out.siguiente = siguiente;
    out.semanaActual = semAct;
    out.semanaAnterior = semAnt;
  }
  if (full) out.indice = indice;
  return out;
}

function catalogos(cuenta) {
  var out = {};
  CON_LISTA.forEach(function (k) {
    var vistos = cuenta[k] || {};
    var lista = Object.keys(vistos).sort(function (a, b) { return vistos[b] - vistos[a]; });
    (SEMILLAS[k] || []).forEach(function (s) {
      if (lista.indexOf(s) === -1) lista.push(s);
    });
    out[k] = lista.slice(0, 15);
  });
  return out;
}

// -------------------------------------------------------------- escrituras ---

function buscarFila(values, id) {
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][idx("ID")]) === String(id)) return i;
  }
  return -1;
}

/**
 * Crea la orden. Idempotente: si la misma claveCliente ya está guardada,
 * devuelve la que hay en vez de escribir otra. Así un reintento del teléfono
 * -—señal que se cae justo después de guardar— no deja dos filas del mismo folio.
 */
function addOrden(body) {
  var sh = getSheet();
  var values = leerTodo(sh);
  var clave = clean(body.claveCliente);

  if (clave) {
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][idx("ClaveCliente")]) === clave) {
        var ya = filaAObjeto(values[i], true);
        return { ok: true, id: ya.id, nFibra: ya.nFibra, repetida: true };
      }
    }
  }

  var tecnico = clean(body.tecnico);
  if (!tecnico) return { error: "sin_tecnico" };

  var semana = semanaDe(clean(body.fecha));
  var nFibra = num(body.nFibra);
  if (!nFibra) nFibra = siguienteNFibra(values, tecnico, semana);

  var id = Utilities.getUuid();
  var fila = new Array(COLS.length);
  for (var c = 0; c < fila.length; c++) fila[c] = "";
  fila[idx("Timestamp")] = new Date();
  fila[idx("ID")] = id;
  fila[idx("ClaveCliente")] = clave;
  fila[idx("Tecnico")] = tecnico;
  fila[idx("NFibra")] = nFibra;
  fila[idx("Semana")] = semana;
  for (var k in CAMPOS_ORDEN) fila[idx(CAMPOS_ORDEN[k])] = clean(body[k]);
  fila[idx("MaterialOk")] = "";
  fila[idx("Copiada")] = "";

  escribirFila(sh, sh.getLastRow() + 1, fila);
  return { ok: true, id: id, nFibra: nFibra, semana: semana };
}

function saveMaterial(body) {
  var sh = getSheet();
  var values = leerTodo(sh);
  var i = buscarFila(values, body.id);
  if (i < 0) return { error: "no_existe" };
  if (!mismoTecnico(values[i], body.tecnico)) return { error: "no_es_tuya" };

  var fila = values[i];
  for (var m in CAMPOS_MATERIAL) fila[idx(CAMPOS_MATERIAL[m])] = num(body[m]);
  fila[idx("MaterialOk")] = "SI";
  escribirFila(sh, i + 2, fila);
  return { ok: true, id: String(body.id) };
}

/** Editar una orden ya guardada. Solo el técnico que la capturó. */
function updateOrden(body) {
  var sh = getSheet();
  var values = leerTodo(sh);
  var i = buscarFila(values, body.id);
  if (i < 0) return { error: "no_existe" };
  if (!mismoTecnico(values[i], body.tecnico)) return { error: "no_es_tuya" };

  var fila = values[i];
  for (var k in CAMPOS_ORDEN) {
    if (body.hasOwnProperty(k)) fila[idx(CAMPOS_ORDEN[k])] = clean(body[k]);
  }
  for (var m in CAMPOS_MATERIAL) {
    if (body.hasOwnProperty(m)) fila[idx(CAMPOS_MATERIAL[m])] = num(body[m]);
  }
  if (body.hasOwnProperty("nFibra") && num(body.nFibra)) {
    fila[idx("NFibra")] = num(body.nFibra);
  }
  if (body.hasOwnProperty("fecha")) fila[idx("Semana")] = semanaDe(clean(body.fecha));
  // Queda constancia de que se toco. Con el mismo formato que Copiada, para
  // poder compararlas tal cual y saber cual fue primero.
  fila[idx("Editada")] = Utilities.formatDate(new Date(),
    Session.getScriptTimeZone() || "America/Mexico_City", "yyyy-MM-dd HH:mm");
  escribirFila(sh, i + 2, fila);
  return { ok: true };
}

/**
 * Archiva. Con id, una sola orden; con tecnico, todas las suyas que estén a la
 * vista. No borra: escribe la fecha en la columna Copiada.
 */
function marcarCopiada(body) {
  var sh = getSheet();
  var values = leerTodo(sh);
  var sello = Utilities.formatDate(new Date(),
    Session.getScriptTimeZone() || "America/Mexico_City", "yyyy-MM-dd HH:mm");
  var col = idx("Copiada") + 1;
  var n = 0;

  for (var i = 0; i < values.length; i++) {
    if (!values[i][idx("ID")]) continue;
    if (String(values[i][idx("Copiada")])) continue;
    var coincide = body.id
      ? String(values[i][idx("ID")]) === String(body.id)
      : String(values[i][idx("Tecnico")]) === clean(body.tecnico);
    if (!coincide) continue;
    sh.getRange(i + 2, col).setValue(sello);
    n++;
    if (body.id) break;
  }
  var podadas = podar(sh);
  return { ok: true, marcadas: n, podadas: podadas };
}

// ----------------------------------------------------------------- apoyos ---

/**
 * Borra lo archivado hace más de SEMANAS_HISTORIAL. Las filas viejas quedan
 * juntas al principio (se añaden en orden), así que se borran por tramos
 * seguidos en vez de una por una.
 */
function podar(sh) {
  var values = leerTodo(sh);
  if (!values.length) return 0;

  var limite = new Date();
  limite.setDate(limite.getDate() - SEMANAS_HISTORIAL * 7);

  var aBorrar = [];
  for (var i = 0; i < values.length; i++) {
    var marca = String(values[i][idx("Copiada")]);
    if (!marca) continue;                       // sigue pendiente de pegar
    var m = marca.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) continue;
    if (new Date(+m[1], +m[2] - 1, +m[3]) < limite) aBorrar.push(i + 2);
  }
  if (!aBorrar.length) return 0;

  var borradas = 0;
  var fin = aBorrar.length - 1;
  while (fin >= 0) {
    var ini = fin;
    while (ini > 0 && aBorrar[ini - 1] === aBorrar[ini] - 1) ini--;
    sh.deleteRows(aBorrar[ini], fin - ini + 1);
    borradas += fin - ini + 1;
    fin = ini - 1;
  }
  return borradas;
}

/** La poda se intenta una vez al día, no en cada petición. */
function podarSiTocaHoy(sh) {
  var props = PropertiesService.getScriptProperties();
  var hoy = Utilities.formatDate(new Date(),
    Session.getScriptTimeZone() || "America/Mexico_City", "yyyy-MM-dd");
  if (props.getProperty("ultimaPoda") === hoy) return;
  props.setProperty("ultimaPoda", hoy);
  try { podar(sh); } catch (e) { /* que una poda fallida no tire la lectura */ }
}

function mismoTecnico(fila, tecnico) {
  var t = clean(tecnico);
  if (!t) return false;
  return String(fila[idx("Tecnico")]) === t;
}

/**
 * El consecutivo "N FIBRA" es por técnico y se reinicia el lunes, así que la
 * semana se identifica por la fecha del lunes que la abre.
 */
function semanaDeFecha(d) {
  var dow = d.getDay();                 // 0 domingo ... 6 sábado
  var atras = (dow === 0) ? 6 : dow - 1;
  var lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() - atras);
  return "L" + lunes.getFullYear() + "-" +
         dosDigitos(lunes.getMonth() + 1) + "-" + dosDigitos(lunes.getDate());
}

function semanaDe(fechaStr) {
  var d = parseFecha(fechaStr);
  if (!d) d = new Date();
  return semanaDeFecha(d);
}

function semanaActual() { return semanaDeFecha(new Date()); }

function semanaAnterior() {
  var d = new Date();
  d.setDate(d.getDate() - 7);
  return semanaDeFecha(d);
}

function siguienteNFibra(values, tecnico, semana) {
  var max = 0;
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][idx("Tecnico")]) !== tecnico) continue;
    if (String(values[i][idx("Semana")]) !== semana) continue;
    var n = num(values[i][idx("NFibra")]);
    if (n > max) max = n;
  }
  return max + 1;
}

function parseFecha(s) {
  var m = String(s || "").match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return null;
  var y = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
  var d = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  return isNaN(d.getTime()) ? null : d;
}

function dosDigitos(n) { return (n < 10 ? "0" : "") + n; }
function clean(v) { return String(v == null ? "" : v).trim(); }
function num(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : Math.max(0, n); }

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

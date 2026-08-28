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
 * Nada se borra: "eliminar" y "vaciar bloque" marcan la columna Copiada y la
 * fila desaparece de la app, pero se queda aquí. Es a propósito — al Excel
 * semanal solo llegan 7 de los 22 campos, así que esta hoja es el único lugar
 * donde vive el resto (cliente, dirección, barrio, serie, observaciones...).
 */

var SHEET_NAME = "Reportes";

var COLS = [
  "Timestamp", "ID", "ClaveCliente", "Tecnico", "NFibra", "Semana",
  "Cope", "Folio", "TipoOS", "Distrito", "Terminal", "Puerto",
  "Cliente", "Telefono", "ExpedienteCope", "Serie", "ModeloModem", "CV",
  "Direccion", "Barrio", "Metraje", "Acometida", "Fecha", "Observaciones",
  "Autoriza", "Nip", "Vigencia", "RetiraModem",
  "Argollas", "Taquetes", "Roseta", "Sellos", "Sincho", "Tensores", "SujMarfil", "Ont",
  "MaterialOk", "Copiada"
];

// Campos de la orden: clave que usa la app -> columna de la hoja.
var CAMPOS_ORDEN = {
  cope: "Cope", folio: "Folio", tipoOs: "TipoOS", distrito: "Distrito",
  terminal: "Terminal", puerto: "Puerto", cliente: "Cliente", telefono: "Telefono",
  expediente: "ExpedienteCope", serie: "Serie", modelo: "ModeloModem", cv: "CV",
  direccion: "Direccion", barrio: "Barrio", metraje: "Metraje", acometida: "Acometida",
  fecha: "Fecha", observaciones: "Observaciones", autoriza: "Autoriza",
  nip: "Nip", vigencia: "Vigencia", retiraModem: "RetiraModem"
};

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
var CON_LISTA = ["cope", "tipoOs", "distrito", "terminal", "puerto", "modelo",
                 "cv", "barrio", "metraje", "observaciones", "autoriza", "nip", "vigencia"];

// ---------------------------------------------------------------- entrada ---

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || "list";
  if (action === "list") return respond(listEntries(p.full === "1"));
  return respond({ error: "unknown_action" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var gotLock = lock.tryLock(20000);
  if (!gotLock) return respond({ error: "busy" });
  try {
    var body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
    catch (parseErr) { return respond({ error: "bad_json" }); }

    switch (body.action) {
      case "addOrden":      return respond(addOrden(body));
      case "saveMaterial":  return respond(saveMaterial(body));
      case "updateOrden":   return respond(updateOrden(body));
      case "marcarCopiada": return respond(marcarCopiada(body));
      default:              return respond({ error: "unknown_action" });
    }
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
  // Hoja de la v1: le faltan columnas. Se añaden sin tocar lo que ya hay.
  var ancho = Math.max(sh.getLastColumn(), 1);
  var cab = sh.getRange(1, 1, 1, ancho).getValues()[0];
  if (cab.length < COLS.length || String(cab[2]) !== COLS[2]) {
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

function filaAObjeto(r) {
  var o = { id: String(r[idx("ID")]), tecnico: String(r[idx("Tecnico")]),
            nFibra: num(r[idx("NFibra")]), semana: String(r[idx("Semana")]),
            materialOk: String(r[idx("MaterialOk")]) === "SI" };
  for (var k in CAMPOS_ORDEN) o[k] = String(r[idx(CAMPOS_ORDEN[k])]);
  for (var m in CAMPOS_MATERIAL) o[m] = num(r[idx(CAMPOS_MATERIAL[m])]);
  return o;
}

function listEntries(full) {
  var sh = getSheet();
  var values = leerTodo(sh);
  var entries = [], indice = [], tecs = {}, cuenta = {};

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

    if (String(r[idx("Copiada")])) continue; // archivada: fuera de la vista
    entries.push(filaAObjeto(r));
  }

  var out = { entries: entries, tecnicos: Object.keys(tecs),
              catalogos: catalogos(cuenta) };
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
        var ya = filaAObjeto(values[i]);
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
  return { ok: true, marcadas: n };
}

// ----------------------------------------------------------------- apoyos ---

function mismoTecnico(fila, tecnico) {
  var t = clean(tecnico);
  if (!t) return false;
  return String(fila[idx("Tecnico")]) === t;
}

/**
 * El consecutivo "N FIBRA" es por técnico y se reinicia el lunes, así que la
 * semana se identifica por la fecha del lunes que la abre.
 */
function semanaDe(fechaStr) {
  var d = parseFecha(fechaStr);
  if (!d) d = new Date();
  var dow = d.getDay();                 // 0 domingo ... 6 sábado
  var atras = (dow === 0) ? 6 : dow - 1;
  var lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() - atras);
  return "L" + lunes.getFullYear() + "-" +
         dosDigitos(lunes.getMonth() + 1) + "-" + dosDigitos(lunes.getDate());
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

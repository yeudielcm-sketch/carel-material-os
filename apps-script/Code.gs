/**
 * Material de OS — backend en Google Apps Script.
 *
 * Guarda cada reporte de material como una fila en la hoja "Reportes" de
 * este mismo archivo de Google Sheets. Se publica como Web App con acceso
 * "Cualquier persona" para que los técnicos puedan guardar SIN iniciar
 * sesión en nada (ni Google, ni Claude).
 *
 * Instrucciones completas de despliegue: ver INSTRUCCIONES.md
 */

var SHEET_NAME = "Reportes";
var COLS = ["Timestamp", "ID", "Tecnico", "Folio",
            "Argollas", "Taquetes", "Roseta", "Sellos", "Sincho", "Tensores", "SujMarfil"];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "list";
  if (action === "list") return respond(listEntries());
  return respond({ error: "unknown_action" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var gotLock = lock.tryLock(10000);
  if (!gotLock) return respond({ error: "busy" });
  try {
    var body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
    catch (parseErr) { return respond({ error: "bad_json" }); }

    switch (body.action) {
      case "add":      return respond(addEntry(body));
      case "delete":   return respond(deleteEntry(body.id));
      case "clearTec": return respond(clearTecnico(body.tecnico));
      default:         return respond({ error: "unknown_action" });
    }
  } catch (err) {
    return respond({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function listEntries() {
  var sh = getSheet();
  var values = sh.getDataRange().getValues();
  var entries = [];
  var tecnicosSet = {};
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[1]) continue; // sin ID -> fila vacía, se ignora
    var entry = {
      id: String(r[1]),
      tecnico: String(r[2]),
      folio: String(r[3]),
      argollas: num(r[4]), taquetes: num(r[5]), roseta: num(r[6]),
      sellos: num(r[7]), sincho: num(r[8]), tensores: num(r[9]), sujMarfil: num(r[10])
    };
    entries.push(entry);
    tecnicosSet[entry.tecnico] = true;
  }
  return { entries: entries, tecnicos: Object.keys(tecnicosSet) };
}

function addEntry(body) {
  var sh = getSheet();
  var id = Utilities.getUuid();
  sh.appendRow([
    new Date(), id, clean(body.tecnico), clean(body.folio),
    num(body.argollas), num(body.taquetes), num(body.roseta),
    num(body.sellos), num(body.sincho), num(body.tensores), num(body.sujMarfil)
  ]);
  return { ok: true, id: id };
}

function deleteEntry(id) {
  var sh = getSheet();
  var values = sh.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][1]) === String(id)) { sh.deleteRow(i + 1); break; }
  }
  return { ok: true };
}

function clearTecnico(tecnico) {
  var sh = getSheet();
  var values = sh.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][2]) === String(tecnico)) sh.deleteRow(i + 1);
  }
  return { ok: true };
}

function clean(v) { return String(v == null ? "" : v).trim(); }
function num(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : Math.max(0, n); }

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

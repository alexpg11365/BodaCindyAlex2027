/**
 * Confirmaciones de la boda de Cindy & Alex (25.09.2027)
 *
 * Recibe las respuestas del formulario de la web y las guarda en esta hoja de
 * Google Sheets. Cada vez que alguien confirma (o cambia su respuesta) manda un
 * email de aviso.
 *
 * Instrucciones paso a paso: CONFIGURAR-FORMULARIO.md en el repositorio.
 */

// ===================== CONFIGURACIÓN =====================
// El aviso por email llega siempre a la cuenta de Google que publica el script.
// Añade aquí otros correos que también quieran recibirlo, por ejemplo:
//   const AVISAR_TAMBIEN_A = ['cindy@ejemplo.com'];
const AVISAR_TAMBIEN_A = [];
const ENVIAR_EMAIL = true;
// ==========================================================

const HOJA = 'Confirmaciones';
const CABECERAS = [
  'Recibido', 'Modificado', 'Nombre', '¿Viene?', 'Personas',
  'Alergias', 'Menú',
  'Acompañante', 'Alergias acompañante', 'Menú acompañante',
  'Autobús', 'Canción', 'Mensaje', 'ID'
];
const COL_ID = CABECERAS.length; // la última columna

/** Ejecútala una vez a mano: crea las pestañas "Confirmaciones" y "Resumen". */
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = obtenerHoja_(ss);
  crearResumen_(ss);
  ss.setActiveSheet(hoja);
}

/** Abrir la dirección de la app en el navegador sirve para comprobar que está publicada. */
function doGet() {
  return ContentService.createTextOutput('La web de la boda está conectada correctamente.');
}

/** Recibe cada respuesta del formulario de la web. */
function doPost(e) {
  const p = (e && e.parameter) || {};

  // Campo trampa para bots: una persona nunca lo rellena.
  if (p.web) return json_({ ok: true });

  const nombre = limpiar_(p.nombre, 120);
  const viene = p.asistencia === 'si' ? 'Sí' : p.asistencia === 'no' ? 'No' : '';
  if (!nombre || !viene) return json_({ ok: false, error: 'faltan_datos' });

  const si = viene === 'Sí';
  const acomp = si && p.acompanado === 'si';
  const id = String(p.id || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);

  const fila = [
    new Date(), '', nombre, viene, si ? (acomp ? 2 : 1) : 0,
    si ? limpiar_(p.alergias, 300) : '',
    si ? limpiar_(p.menu, 20) : '',
    acomp ? limpiar_(p.acompanante_nombre, 120) : '',
    acomp ? limpiar_(p.acompanante_alergias, 300) : '',
    acomp ? limpiar_(p.acompanante_menu, 20) : '',
    si ? limpiar_(p.transporte, 40) : '',
    si ? limpiar_(p.cancion, 150) : '',
    limpiar_(p.mensaje, 1000),
    id
  ];

  let cambio = false;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const hoja = obtenerHoja_(SpreadsheetApp.getActiveSpreadsheet());
    const filaExistente = buscarPorId_(hoja, id);
    if (filaExistente) {
      // El mismo invitado cambia su respuesta: se actualiza su fila.
      fila[0] = hoja.getRange(filaExistente, 1).getValue();
      fila[1] = new Date();
      hoja.getRange(filaExistente, 1, 1, fila.length).setValues([fila]);
      cambio = true;
    } else {
      hoja.appendRow(fila);
    }
  } finally {
    lock.releaseLock();
  }

  if (ENVIAR_EMAIL) {
    try { avisar_(fila, cambio); } catch (err) { console.error(err); }
  }
  return json_({ ok: true });
}

// ---------------------------------------------------------------------------

function obtenerHoja_(ss) {
  let hoja = ss.getSheetByName(HOJA);
  if (!hoja) hoja = ss.insertSheet(HOJA, 0);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(CABECERAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, CABECERAS.length)
      .setFontWeight('bold').setBackground('#24325f').setFontColor('#f3e9d6');
    hoja.getRange('A:B').setNumberFormat('dd/mm/yyyy hh:mm');
    hoja.setColumnWidth(3, 200);
    hoja.setColumnWidth(13, 320);
  }
  return hoja;
}

function crearResumen_(ss) {
  const r = ss.getSheetByName('Resumen') || ss.insertSheet('Resumen');
  r.clear();
  const c = HOJA + '!';
  const datos = [
    ['Resumen de confirmaciones', ''],
    ['Personas que vienen', '=SUM(' + c + 'E2:E)'],
    ['Respuestas "Sí"', '=COUNTIF(' + c + 'D2:D,"Sí")'],
    ['Respuestas "No"', '=COUNTIF(' + c + 'D2:D,"No")'],
    ['Menús normales', '=COUNTIF(' + c + 'G2:G,"Normal")+COUNTIF(' + c + 'J2:J,"Normal")'],
    ['Menús vegetarianos', '=COUNTIF(' + c + 'G2:G,"Vegetariano")+COUNTIF(' + c + 'J2:J,"Vegetariano")'],
    ['Menús veganos', '=COUNTIF(' + c + 'G2:G,"Vegano")+COUNTIF(' + c + 'J2:J,"Vegano")'],
    ['Personas con alergias indicadas', '=COUNTA(' + c + 'F2:F)+COUNTA(' + c + 'I2:I)'],
    ['Personas que quieren autobús', '=SUMIF(' + c + 'K2:K,"Sí*",' + c + 'E2:E)'],
    ['  · desde Barcelona', '=SUMIF(' + c + 'K2:K,"Sí, desde Barcelona",' + c + 'E2:E)'],
    ['  · desde Vic', '=SUMIF(' + c + 'K2:K,"Sí, desde Vic",' + c + 'E2:E)'],
    ['  · desde otro sitio', '=SUMIF(' + c + 'K2:K,"Sí, desde otro sitio",' + c + 'E2:E)']
  ];
  r.getRange(1, 1, datos.length, 2).setValues(datos);
  r.getRange('A1').setFontWeight('bold').setFontSize(14);
  r.getRange(2, 2, datos.length - 1, 1).setFontWeight('bold');
  r.setColumnWidth(1, 260);
}

function buscarPorId_(hoja, id) {
  if (!id) return 0;
  const n = hoja.getLastRow() - 1;
  if (n < 1) return 0;
  const ids = hoja.getRange(2, COL_ID, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}

/** Recorta el texto y evita que Sheets lo interprete como fórmula. */
function limpiar_(v, max) {
  let s = String(v || '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function avisar_(fila, cambio) {
  const destinatarios = [Session.getEffectiveUser().getEmail()].concat(AVISAR_TAMBIEN_A)
    .filter(Boolean).join(',');
  if (!destinatarios) return;
  const [, , nombre, viene, personas, alergias, menu, acomp, acompAlergias, acompMenu, bus, cancion, mensaje] = fila;
  const asunto = (cambio ? 'Respuesta cambiada: ' : 'Nueva confirmación: ') + nombre + ' (' +
    (viene === 'Sí' ? 'viene, ' + personas + (personas === 1 ? ' persona' : ' personas') : 'no viene') + ')';
  const lineas = [
    'Nombre: ' + nombre,
    '¿Viene?: ' + viene
  ];
  if (viene === 'Sí') {
    lineas.push('Menú: ' + menu, 'Alergias: ' + (alergias || 'ninguna'));
    if (acomp) lineas.push('', 'Acompañante: ' + acomp, 'Menú acompañante: ' + acompMenu,
      'Alergias acompañante: ' + (acompAlergias || 'ninguna'));
    lineas.push('', 'Autobús: ' + bus, 'Canción: ' + (cancion || '-'));
  }
  if (mensaje) lineas.push('', 'Mensaje: ' + mensaje);
  lineas.push('', 'Todas las respuestas: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  MailApp.sendEmail({ to: destinatarios, subject: asunto, body: lineas.join('\n') });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

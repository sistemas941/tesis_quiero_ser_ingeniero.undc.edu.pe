/**
 * Migracion.gs - Paso de la version 1 (Google Apps Script) a la version 2 (servidor propio).
 *
 * Dos caminos, que se complementan:
 *  1. Migracion completa (administrador): exportarTodo() se ejecuta en la version 1 desde el editor de
 *     Apps Script y deja en Drive un .zip con todas las pestanas y las figuras. En el servidor, la
 *     herramienta «importar-v1» lo carga entero (ver servidor/herramientas.js).
 *  2. Expediente individual (estudiante): en la version 1 el estudiante descarga su expediente firmado
 *     (.json) y en la version 2 lo importa desde «Mi configuración».
 *     - Con firma valida (el secreto MIGRACION_SECRETO es el mismo en ambas versiones) se importa todo,
 *       incluidos la aprobacion del plan, el avance por etapas, los comentarios y la bitacora de IA.
 *     - Sin firma (o con el archivo modificado) solo se importa el contenido: campos del plan, biblioteca
 *       y textos del borrador. Ninguna aprobacion viaja sin firma.
 */

var FORMATO_EXP_ = 'qsi-expediente';
var FORMATO_MIG_ = 'qsi-migracion';
var EXP_FIG_MAX_ = 20000000;      // base64 total de figuras dentro de un expediente (unos 15 MB)
// Claves del expediente que dependen de archivos de Google: en la version 2 se vuelven a generar
var CLAVES_DOC_ = ['_plan_id', '_plan_url', '_plan_fecha', '_inf_doc', '_inf_url', '_inf_docx', '_inf_docx_id', '_inf_fecha'];

/** true cuando el codigo corre en el servidor propio (version 2). */
function servidorPropio_() { return typeof SERVIDOR_ !== 'undefined' && !!SERVIDOR_; }

/** Enlaces a un documento generado: de Google Docs en la version 1, del propio servidor en la 2. */
function urlDoc_(id, tipo) {
  if (servidorPropio_()) return '/doc/' + id + (tipo === 'docx' ? '.docx' : (tipo === 'pdf' ? '.pdf' : ''));
  return 'https://docs.google.com/document/d/' + id + (tipo === 'docx' ? '/export?format=docx' : (tipo === 'pdf' ? '/export?format=pdf' : '/edit'));
}
function urlArchivo_(id) { return servidorPropio_() ? '/archivo/' + id : 'https://drive.google.com/uc?export=download&id=' + id; }

/** Secreto compartido entre versiones. En la 1 se crea la primera vez; en la 2 viene del archivo .env o de la migracion. */
function secretoMigracion_() {
  var p = props_();
  var s = p.getProperty('MIGRACION_SECRETO');
  if (!s && !servidorPropio_()) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('MIGRACION_SECRETO', s); }
  return s || '';
}
function firmaExp_(cab, datos) {
  var s = secretoMigracion_();
  if (!s) return '';
  var b = Utilities.computeHmacSha256Signature(cab.formato + '\n' + cab.correo + '\n' + cab.generado + '\n' + datos, s);
  return b.map(function (x) { var v = (x < 0 ? x + 256 : x).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
}

/** Filas de una pestana que pertenecen a un estudiante (sin el numero de fila). */
function filasEstudiante_(n, correo) {
  if (!libro_().getSheetByName(n)) return [];
  return leer_(n, true).filter(function (r) { return normCorreo_(r.correo) === correo; }).map(sinFila_);
}

// ---------------------------------------------------------------- exportar un expediente
function exportarExpediente_(correo) {
  correo = normCorreo_(correo);
  var u = usuario_(correo);
  if (!u) throw new Error('Usuario no encontrado.');
  var exp = expediente_(correo);
  var figuras = [], total = 0, omitidas = 0;
  jsonExp_(exp, '_inf_figs', []).forEach(function (id) {
    try {
      var b = DriveApp.getFileById(id).getBlob();
      var b64 = Utilities.base64Encode(b.getBytes());
      if (total + b64.length > EXP_FIG_MAX_) { omitidas++; return; }
      total += b64.length;
      figuras.push({ id: id, nombre: b.getName() || 'figura', tipo: b.getContentType() || 'image/png', datos: b64 });
    } catch (e) { omitidas++; }
  });
  var datos = {
    usuario: { correo: correo, nombre: u.nombre, codigo: u.codigo || '', alias: u.alias || '' },
    expediente: exp,
    avance: filasEstudiante_('Avance', correo),
    biblioteca: filasEstudiante_('Biblioteca', correo),
    informe: filasEstudiante_('Informe', correo),
    comentarios: filasEstudiante_('Comentarios', correo),
    bitacora: filasEstudiante_('Bitacora', correo),
    figuras: figuras,
    figurasOmitidas: omitidas
  };
  var cab = { formato: FORMATO_EXP_, version: 1, app: VERSION_, origen: servidorPropio_() ? 'v2' : 'v1', correo: correo, generado: ahora_() };
  var txt = JSON.stringify(datos);
  cab.datos = txt;
  cab.firma = firmaExp_(cab, txt);
  return cab;
}

/** Ruta del estudiante: devuelve el archivo para descargarlo y, en la version 1, tambien un enlace de Drive. */
function descargarExpediente_(ses) {
  var arch = exportarExpediente_(ses.correo);
  var nombre = 'expediente_' + ses.correo.replace(/[^a-z0-9]+/gi, '_') + '_' + hoy_() + '.json';
  var contenido = JSON.stringify(arch);
  var r = { nombre: nombre, contenido: contenido, firmado: !!arch.firma, url: '' };
  if (!servidorPropio_()) {
    // En Google Sites la descarga directa puede estar bloqueada: queda tambien una copia en Drive con enlace
    try {
      var u = usuario_(ses.correo);
      var f = carpetaEstudiante_(u, expediente_(ses.correo)).createFile(Utilities.newBlob(contenido, 'application/json', nombre));
      f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      r.url = urlArchivo_(f.getId());
    } catch (e) { r.url = ''; }
  }
  return r;
}

// ---------------------------------------------------------------- importar un expediente (version 2)
function leerArchivoExp_(contenido) {
  var a;
  try { a = typeof contenido === 'string' ? JSON.parse(contenido) : contenido; } catch (e) { throw new Error('El archivo no es un expediente válido (no es JSON).'); }
  if (!a || a.formato !== FORMATO_EXP_ || typeof a.datos !== 'string') throw new Error('El archivo no es un expediente de «Quiero ser Ingeniero».');
  var datos;
  try { datos = JSON.parse(a.datos); } catch (e2) { throw new Error('El expediente está dañado.'); }
  var esperada = firmaExp_(a, a.datos);
  var firmado = !!(esperada && a.firma && igualSeguro_(String(a.firma), esperada));
  return { cab: a, datos: datos, firmado: firmado };
}

function resumenExpImport_(x) {
  var d = x.datos, exp = d.expediente || {};
  var campos = Object.keys(exp).filter(function (k) { return k.charAt(0) !== '_' && String(exp[k]).trim() !== ''; }).length;
  return {
    correo: x.cab.correo, generado: x.cab.generado, origen: x.cab.origen || 'v1', firmado: x.firmado,
    campos: campos, estudios: (d.biblioteca || []).length,
    secciones: (d.informe || []).filter(function (r) { return String(r.texto || '').trim(); }).length,
    figuras: (d.figuras || []).length, figurasOmitidas: d.figurasOmitidas || 0,
    planAprobado: !!(x.firmado && exp._plan_ok),
    etapas: x.firmado ? (d.avance || []).length : 0
  };
}

function importarExpediente_(ses, a) {
  if (!servidorPropio_()) throw new Error('La importación de expedientes está en la versión 2 de la aplicación.');
  var x = leerArchivoExp_(a.contenido);
  var correo = normCorreo_(x.cab.correo);
  if (ses.rol === 'estudiante' && correo !== normCorreo_(ses.correo)) throw new Error('Este expediente es de otra cuenta (' + correo + '). Ingresa con esa cuenta para importarlo.');
  var u = usuario_(correo);
  if (!u || u.rol !== 'estudiante') throw new Error('No existe un estudiante con el correo ' + correo + ' en esta versión. Pide al administrador que lo cree o regístrate primero.');
  var actual = expediente_(correo);
  var resumen = resumenExpImport_(x);
  if (!x.firmado && planCongelado_(actual)) throw new Error('Tu plan ya está aprobado en esta versión: un expediente sin firma no puede reemplazarlo.');
  if (!a.confirmar) return { revisar: true, resumen: resumen };

  // Respaldo de lo que habia antes, por si hay que volver atras
  try {
    var previo = exportarExpediente_(correo);
    carpetaEstudiante_(u, actual).createFile(Utilities.newBlob(JSON.stringify(previo), 'application/json', 'Respaldo antes de importar ' + ahora_().replace(/:/g, '-') + '.json'));
  } catch (e0) { /* sin respaldo no se detiene: el administrador tiene los respaldos diarios */ }

  var d = x.datos, firmado = x.firmado;
  // Figuras: se guardan con identificadores nuevos y se actualizan las referencias
  var mapa = {};
  var carpeta = carpetaEstudiante_(u, actual);
  (d.figuras || []).forEach(function (f) {
    try {
      var tipo = f.tipo === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      var nf = carpeta.createFile(Utilities.newBlob(Utilities.base64Decode(f.datos), tipo, String(f.nombre || 'figura').substring(0, 80)));
      mapa[f.id] = nf.getId();
    } catch (e1) { /* figura dañada: queda como pendiente en el borrador */ }
  });
  function remapear(t) { t = String(t || ''); Object.keys(mapa).forEach(function (k) { t = t.split('fig:' + k + ')').join('fig:' + mapa[k] + ')'); }); return t; }

  conBloqueo_(function () {
    olvidar_('Expedientes');
    var exp0 = expediente_(correo), valores = {};
    var src = d.expediente || {};
    var importable = function (k) { return firmado ? CLAVES_DOC_.indexOf(k) < 0 : (k.charAt(0) !== '_' || k === '_estilo_cita'); };
    Object.keys(exp0).forEach(function (k) { if (importable(k) && k !== '_inf_idx' && !src.hasOwnProperty(k)) valores[k] = ''; });
    Object.keys(src).forEach(function (k) { if (importable(k)) valores[k] = src[k]; });
    CLAVES_DOC_.forEach(function (k) { if (exp0[k]) valores[k] = ''; });
    // Solo quedan permitidas las figuras que llegaron dentro del archivo
    valores._inf_figs = JSON.stringify(Object.keys(mapa).map(function (k) { return mapa[k]; }));
    delete valores._inf_idx;
    guardarCampos_(correo, valores);

    reemplazarFilasEst_('Biblioteca', correo, (d.biblioteca || []).map(function (r) { r.correo = correo; return r; }));
    if (firmado) {
      reemplazarFilasEst_('Avance', correo, (d.avance || []).map(function (r) { r.correo = correo; return r; }));
      reemplazarFilasEst_('Comentarios', correo, (d.comentarios || []).map(function (r) { r.correo = correo; return r; }));
      reemplazarFilasEst_('Bitacora', correo, (d.bitacora || []).map(function (r) { r.correo = correo; return r; }));
    }
    // Borrador: se escribe en su sitio (la pestana Informe se referencia por numero de fila)
    var idxViejo = firmado ? jsonExp_(src, '_inf_idx', {}) : {};
    var sh = hojaInforme_();
    var filas = leer_('Informe', true);
    var mias = {};
    filas.forEach(function (r) { if (normCorreo_(r.correo) === correo) mias[r.seccion] = r._fila; });
    var nuevoIdx = {};
    var textos = {};
    (d.informe || []).forEach(function (r) { textos[String(r.seccion)] = { t: remapear(r.texto), f: String(r.actualizado || ahora_()) }; });
    Object.keys(mias).forEach(function (s) { if (!textos[s]) sh.getRange(mias[s], 3, 1, 2).setValues([[celda_(''), celda_(ahora_())]]); });
    Object.keys(textos).forEach(function (s) {
      var fila = mias[s];
      if (fila) sh.getRange(fila, 3, 1, 2).setValues([[celda_(textos[s].t), celda_(textos[s].f)]]);
      else {
        asegurarFilas_(sh, COLS_INFORME_.length, 1);
        sh.appendRow([celda_(correo, true), celda_(s, true), celda_(textos[s].t, true), celda_(textos[s].f, true)]);
        fila = sh.getLastRow();
      }
      var it = {};
      var v = idxViejo[s] || {};
      Object.keys(v).forEach(function (k) { it[k] = v[k]; });
      it.r = fila; it.f = textos[s].f; it.n = palabrasMd_(textos[s].t);
      if (!firmado) { it.e = ''; }
      nuevoIdx[s] = it;
    });
    olvidar_('Informe');
    olvidar_('Expedientes');
    guardarCampos_(correo, { _inf_idx: JSON.stringify(nuevoIdx) });
  });

  // El Word del plan aprobado se vuelve a generar aqui (el de Google Docs se queda en la version 1)
  var aviso = '';
  if (firmado) {
    olvidar_('Expedientes');
    var e3 = expediente_(correo), ok = jsonExp_(e3, '_plan_ok', null);
    if (ok) {
      try {
        var g = generarPlanDe_(correo, {});
        var cp = DriveApp.getFileById(g.id).makeCopy('Plan aprobado v' + ok.v + ' - ' + (e3.autor1 || u.nombre));
        ok.doc = cp.getId();
        conBloqueo_(function () { olvidar_('Expedientes'); guardarCampos_(correo, { _plan_ok: JSON.stringify(ok) }); });
      } catch (e4) { aviso = 'No se pudo regenerar el Word del plan aprobado (' + e4.message + ').'; }
    }
  }
  tocar_(correo);
  try { CacheService.getScriptCache().remove('tablero_v5'); } catch (e5) { /* sin cache */ }
  return { importado: true, resumen: resumen, aviso: aviso };
}

/** Borra las filas de un estudiante en una pestana y escribe las nuevas en un solo bloque. */
function reemplazarFilasEst_(n, correo, nuevas) {
  if (!libro_().getSheetByName(n)) return;
  var sh = hoja_(n);
  var filas = leer_(n, true).filter(function (r) { return normCorreo_(r.correo) === correo; }).map(function (r) { return r._fila; });
  filas.sort(function (x, y) { return y - x; }).forEach(function (f) { sh.deleteRow(f); });
  olvidar_(n);
  if (nuevas.length) {
    var cab = cabecera_(n);
    asegurarFilas_(sh, cab.length, nuevas.length);
    sh.getRange(sh.getLastRow() + 1, 1, nuevas.length, cab.length).setValues(nuevas.map(function (o) { return cab.map(function (k) { return celda_(o[k]); }); }));
  }
  olvidar_(n);
}

// ---------------------------------------------------------------- migracion completa (version 1, propietario)
/**
 * Se ejecuta UNA vez desde el editor de Apps Script, cuando la fase del plan ya esta aprobada.
 * Deja en la carpeta de la aplicacion un .zip con todas las pestanas, las figuras y el secreto de firma.
 * El nombre no termina en guion bajo, asi que el navegador podria llamarla: por eso verifica al propietario
 * y no devuelve nada (el enlace se escribe en el registro de ejecucion).
 */
function exportarTodo() {
  var p = PropertiesService.getScriptProperties();
  var activo = '', efectivo = '';
  try { activo = String(Session.getActiveUser().getEmail() || ''); } catch (e0) { activo = ''; }
  try { efectivo = String(Session.getEffectiveUser().getEmail() || ''); } catch (e1) { efectivo = ''; }
  if (p.getProperty('PERMITIR_INSTALAR') !== 'SI' && (!activo || activo.toLowerCase() !== efectivo.toLowerCase())) {
    throw new Error('exportarTodo() solo puede ejecutarla el propietario, desde el editor de Apps Script.');
  }
  CACHE_ = {};
  var ss = libro_();
  var hojas = {};
  ss.getSheets().forEach(function (sh) {
    hojas[sh.getName()] = sh.getDataRange().getValues().map(function (f) { return f.map(texto_); });
  });
  // Figuras de todos los borradores y el escudo configurado
  var ids = [];
  leer_('Expedientes', true).forEach(function (r) { if (r.clave === '_inf_figs') { try { JSON.parse(r.valor).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); } catch (e) { /* valor dañado */ } } });
  var logo = cfg_('LOGO_ARCHIVO_ID', '');
  if (logo && ids.indexOf(logo) < 0) ids.push(logo);
  var partes = [], meta = [], faltan = [];
  ids.forEach(function (id) {
    try { var b = DriveApp.getFileById(id).getBlob(); b.setName('archivos/' + id); partes.push(b); meta.push({ id: id, mime: b.getContentType() }); }
    catch (e2) { faltan.push(id); }
  });
  var datos = { formato: FORMATO_MIG_, version: 1, app: VERSION_, generado: ahora_(), hojas: hojas, archivos: meta, faltan: faltan,
    props: { MIGRACION_SECRETO: secretoMigracion_(), USUARIOS_FIJOS: p.getProperty('USUARIOS_FIJOS') || '' } };
  partes.unshift(Utilities.newBlob(JSON.stringify(datos), 'application/json', 'datos.json'));
  var nombre = 'QSI_migracion_' + hoy_() + '.zip';
  var zip = Utilities.zip(partes, nombre);
  var raizId = p.getProperty('CARPETA_ID');
  var f = (raizId ? DriveApp.getFolderById(raizId) : DriveApp.getRootFolder()).createFile(zip);
  Logger.log('Exportación lista (' + Object.keys(hojas).length + ' pestañas, ' + meta.length + ' archivos' + (faltan.length ? ', ' + faltan.length + ' no encontrados' : '') + ').\n' +
    'Descárgala de Drive: https://drive.google.com/file/d/' + f.getId() + '/view\n' +
    'Contiene datos personales y las huellas de las contraseñas: entrégala solo al responsable del servidor y bórrala de Drive después de importarla.');
}

/**
 * Version 2, despues de cargar la migracion completa (lo llama la herramienta «importar-v1»):
 * quita los enlaces a Google Docs y vuelve a generar el Word de cada plan aprobado.
 */
function posMigracion_() {
  CACHE_ = {};
  renovarCacheCompartida_();
  var res = { estudiantes: 0, planesAprobados: 0, regenerados: 0, errores: [] };
  var correos = leer_('Usuarios', true).filter(function (u) { return u.rol === 'estudiante'; }).map(function (u) { return normCorreo_(u.correo); });
  correos.forEach(function (correo) {
    res.estudiantes++;
    var exp = expediente_(correo), limpiar = {};
    CLAVES_DOC_.forEach(function (k) { if (exp[k]) limpiar[k] = ''; });
    if (Object.keys(limpiar).length) conBloqueo_(function () { olvidar_('Expedientes'); guardarCampos_(correo, limpiar); });
    var ok = jsonExp_(exp, '_plan_ok', null);
    if (!ok) return;
    res.planesAprobados++;
    try {
      var g = generarPlanDe_(correo, {});
      var u = usuario_(correo);
      var cp = DriveApp.getFileById(g.id).makeCopy('Plan aprobado v' + ok.v + ' - ' + (exp.autor1 || (u && u.nombre) || correo));
      ok.doc = cp.getId();
      conBloqueo_(function () { olvidar_('Expedientes'); guardarCampos_(correo, { _plan_ok: JSON.stringify(ok) }); });
      res.regenerados++;
    } catch (e) { res.errores.push(correo + ': ' + e.message); }
  });
  renovarCacheCompartida_();
  return res;
}

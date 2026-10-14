/**
 * Datos.gs - Lectura y escritura de la hoja de calculo.
 */

var CACHE_ = {};
var TZ_ = 'America/Lima';

function ahora_() { return Utilities.formatDate(new Date(), TZ_, 'yyyy-MM-dd HH:mm:ss'); }
function hoy_() { return Utilities.formatDate(new Date(), TZ_, 'yyyy-MM-dd'); }
function props_() { return PropertiesService.getScriptProperties(); }

function libro_() {
  if (CACHE_.libro) return CACHE_.libro;
  var id = props_().getProperty('HOJA_ID');
  var ss = null;
  if (id) { ss = SpreadsheetApp.openById(id); }
  if (!ss) { try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; } }
  if (!ss) throw new Error('La aplicación aún no está instalada. Ejecute la función instalar() desde el editor de Apps Script.');
  CACHE_.libro = ss;
  return ss;
}

function hoja_(n) {
  var sh = libro_().getSheetByName(n);
  if (!sh) throw new Error('Falta la pestaña «' + n + '». Ejecute la función instalar().');
  return sh;
}

function texto_(v) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, TZ_, 'yyyy-MM-dd HH:mm:ss');
  return String(v);
}

// ---------------------------------------------------------------- cache compartida
// Las pestanas se guardan en CacheService (compartida entre ejecuciones) con una version por pestana.
// Quien escribe cambia la version despues de escribir; quien lee etiqueta lo que guarda con la version
// que vio antes de leer. Asi nunca se acepta una copia anterior a una escritura.
var COMPARTIDAS_ = { Config: 1, Etapas: 1, Campos: 1, Prompts: 1, Rubrica: 1, Plantilla: 1, Sencillo: 1, Usuarios: 1, Avance: 1, Comentarios: 1, Bitacora: 1, Expedientes: 1, Biblioteca: 1, Accesos: 1 };
var DEFINICIONES_ = { Config: 1, Etapas: 1, Campos: 1, Prompts: 1, Rubrica: 1, Plantilla: 1, Sencillo: 1 };
var TROZO_ = 40000;          // caracteres por trozo (CacheService admite 100 KB por valor)
var TTL_HOJA_ = 900;         // 15 minutos: tambien cubre ediciones manuales en la hoja
var TTL_VER_ = 21600;

function cacheS_() { if (!CACHE_.cs) CACHE_.cs = CacheService.getScriptCache(); return CACHE_.cs; }

/** Version vigente de una clave de version; si no existe, se crea (nunca se acepta una version vacia). */
function version_(k) {
  if (CACHE_['v_' + k]) return CACHE_['v_' + k];
  var c = cacheS_(), v = null;
  try { v = c.get('ver_' + k); } catch (e) { v = null; }
  if (!v) { v = Utilities.getUuid().substring(0, 8); try { c.put('ver_' + k, v, TTL_VER_); } catch (e2) { /* sin cache */ } }
  CACHE_['v_' + k] = v;
  return v;
}
function cambiarVersion_(k) {
  var v = Utilities.getUuid().substring(0, 8);
  try { cacheS_().put('ver_' + k, v, TTL_VER_); } catch (e) { /* sin cache */ }
  CACHE_['v_' + k] = v;
}

/** Guarda un objeto en la cache compartida, en trozos si es grande. */
function cachePoner_(k, obj, ttl) {
  try {
    var s = JSON.stringify(obj), n = Math.ceil(s.length / TROZO_) || 1, m = {};
    if (n > 60) return;
    for (var i = 0; i < n; i++) m[k + '#' + i] = s.substring(i * TROZO_, (i + 1) * TROZO_);
    m[k] = String(n);
    cacheS_().putAll(m, ttl);
  } catch (e) { /* demasiado grande o sin cache: se seguira leyendo de la hoja */ }
}
function cacheTraer_(k) {
  try {
    var c = cacheS_(), n = parseInt(c.get(k), 10);
    if (!n) return null;
    var ks = [];
    for (var i = 0; i < n; i++) ks.push(k + '#' + i);
    var t = c.getAll(ks), s = '';
    for (var j = 0; j < n; j++) { if (t[ks[j]] === undefined || t[ks[j]] === null) return null; s += t[ks[j]]; }
    return JSON.parse(s);
  } catch (e) { return null; }
}

/** Version conjunta de las definiciones (campos, plantilla, rubrica...): cambia si cambia cualquiera. */
function versionDefiniciones_() { return Object.keys(DEFINICIONES_).map(function (n) { return version_('h_' + n); }).join('.'); }

function leer_(n, fresco) {
  if (!fresco && CACHE_['h_' + n]) return CACHE_['h_' + n];
  var compartida = !!COMPARTIDAS_[n];
  var ver = compartida ? version_('h_' + n) : '';
  if (compartida && !fresco) {
    var c = cacheTraer_('hoja_' + n + '_' + ver);
    if (c) { CACHE_['h_' + n] = c.f; CACHE_['c_' + n] = c.c; return c.f; }
  }
  var vals = hoja_(n).getDataRange().getValues();
  var cab = vals.length ? vals[0].map(texto_) : [];
  var filas = [];
  for (var i = 1; i < vals.length; i++) {
    var o = { _fila: i + 1 };
    var vacia = true;
    for (var j = 0; j < cab.length; j++) {
      var t = texto_(vals[i][j]);
      o[cab[j]] = t;
      if (t !== '') vacia = false;
    }
    if (!vacia) filas.push(o);
  }
  CACHE_['h_' + n] = filas;
  CACHE_['c_' + n] = cab;
  if (compartida) cachePoner_('hoja_' + n + '_' + ver, { f: filas, c: cab }, TTL_HOJA_);
  return filas;
}

function cabecera_(n) { if (!CACHE_['c_' + n]) leer_(n); return CACHE_['c_' + n]; }
/** Tras escribir en una pestana: se descarta la copia local y la compartida pasa a una version nueva. */
function olvidar_(n) {
  delete CACHE_['h_' + n];
  if (COMPARTIDAS_[n]) cambiarVersion_('h_' + n);
  if (DEFINICIONES_[n]) { delete CACHE_.campos; delete CACHE_.config; delete CACHE_.prompts; }
}

/** Descarta toda la cache compartida de pestanas (tras instalar o cargar el padron). */
function renovarCacheCompartida_() { Object.keys(COMPARTIDAS_).forEach(function (n) { cambiarVersion_('h_' + n); }); }

/** Marca que cambio algo de un estudiante: invalida sus resultados calculados (vista, resumen del panel). */
function tocar_(correo) { if (correo) cambiarVersion_('est_' + normCorreo_(correo)); }
/** Clave de cache para un resultado calculado de un estudiante. */
function claveEst_(tipo, correo) { correo = normCorreo_(correo); return tipo + '_' + correo + '_' + version_('est_' + correo) + '_' + versionDefiniciones_(); }

/**
 * Modo de escritura segura detectado al instalar: { formato, apostrofo }.
 * Se mide por separado para setValues y para appendRow (anexar), porque no tienen por que comportarse igual.
 * La propiedad se guarda como "F1A1|F1A1" (setValues|appendRow); el formato antiguo, sin barra, vale para ambos.
 */
function modoTexto_(anexar) {
  if (!CACHE_.modoTexto) {
    var partes = String(props_().getProperty('MODO_TEXTO') || 'F1A0').split('|');
    var leer = function (m) { return { formato: m.indexOf('F1') >= 0, apostrofo: m.indexOf('A1') >= 0 }; };
    // Sin medicion propia de appendRow se asume lo mas prudente: que el formato de texto no protege
    CACHE_.modoTexto = { fijar: leer(partes[0]), anexar: partes.length > 1 ? leer(partes[1]) : { formato: false, apostrofo: leer(partes[0]).apostrofo } };
  }
  return anexar ? CACHE_.modoTexto.anexar : CACHE_.modoTexto.fijar;
}

/** Convierte un valor en el texto que se escribe en una celda, sin que la hoja lo tome por formula. */
function celda_(v, anexar) {
  if (v === null || v === undefined) return '';
  var s = (typeof v === 'string') ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v));
  if (s.length > 49000) s = s.substring(0, 49000);
  var c0 = s.charAt(0);
  var m = modoTexto_(anexar);
  if (c0 === "'") { if (m.apostrofo) s = "'" + s; }
  else if ((c0 === '=' || c0 === '+' || c0 === '-' || c0 === '@') && !m.formato) { s = (m.apostrofo ? "'" : ' ') + s; }
  return s;
}

/** Mantiene filas con formato de texto por delante de los datos: nada se convierte en numero, fecha o formula. */
function asegurarFilas_(sh, columnas, nuevas) {
  var max = sh.getMaxRows();
  if (sh.getLastRow() + nuevas + 5 < max) return;
  var extra = Math.max(500, nuevas + 50);
  sh.insertRowsAfter(max, extra);
  sh.getRange(max + 1, 1, extra, columnas).setNumberFormat('@');
}

function agregar_(n, o) {
  var cab = cabecera_(n);
  var sh = hoja_(n);
  asegurarFilas_(sh, cab.length, 1);
  sh.appendRow(cab.map(function (k) { return celda_(o[k], true); }));
  olvidar_(n);
  if (o.correo) tocar_(o.correo);
}

function actualizar_(n, fila, o) {
  var cab = cabecera_(n);
  var sh = hoja_(n);
  var act = sh.getRange(fila, 1, 1, cab.length).getValues()[0];
  var nueva = cab.map(function (k, j) { return celda_(o.hasOwnProperty(k) ? o[k] : texto_(act[j])); });
  sh.getRange(fila, 1, 1, cab.length).setValues([nueva]);
  olvidar_(n);
  var ic = cab.indexOf('correo');
  if (ic >= 0) { tocar_(texto_(act[ic])); if (o.correo) tocar_(o.correo); }
}

function borrarFila_(n, fila) {
  var sh = hoja_(n), cab = cabecera_(n), ic = cab.indexOf('correo');
  var correo = ic >= 0 ? texto_(sh.getRange(fila, ic + 1, 1, 1).getValues()[0][0]) : '';
  sh.deleteRow(fila);
  olvidar_(n);
  tocar_(correo);
}

function conBloqueo_(f) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return f(); } finally { lock.releaseLock(); }
}

function sinFila_(o) {
  var r = {};
  for (var k in o) { if (o.hasOwnProperty(k) && k !== '_fila') r[k] = o[k]; }
  return r;
}

// ---------------------------------------------------------------- configuracion
function configMapa_() {
  if (CACHE_.config) return CACHE_.config;
  var m = {};
  leer_('Config').forEach(function (r) { m[r.clave] = r.valor; });
  CACHE_.config = m;
  return m;
}
function cfg_(k, def) {
  var m;
  try { m = configMapa_(); } catch (e) { return def; }
  return (m.hasOwnProperty(k) && m[k] !== '') ? m[k] : def;
}
function cfgNum_(k, def) { var n = parseFloat(cfg_(k, def)); return isNaN(n) ? def : n; }
function ponerConfig_(k, v) {
  var filas = leer_('Config');
  for (var i = 0; i < filas.length; i++) {
    if (filas[i].clave === k) { actualizar_('Config', filas[i]._fila, { valor: v }); delete CACHE_.config; return; }
  }
  agregar_('Config', { clave: k, valor: v, descripcion: '' });
  delete CACHE_.config;
}
function configPublica_() {
  var claves = ['APP_NOMBRE', 'UNIVERSIDAD', 'FACULTAD', 'ESCUELA', 'NIVEL', 'LINEAS', 'ESTILO_CITAS', 'CUOTA_DIARIA', 'MIN_ARTICULOS', 'MIN_TESIS', 'ANTIGUEDAD_MAX', 'AVANZAR_EN_REVISION', 'MODO_INICIAL', 'ETAPAS_EN_ORDEN', 'AVISO_INGRESO', 'MODO_IA_POR_DEFECTO', 'REVISION_SIN_IA', 'BRUJULA_URL', 'TALLER_URL', 'NANO_URL', 'REVISION_VERDE'];
  var o = {};
  claves.forEach(function (k) { o[k] = cfg_(k, ''); });
  ['MODO_IA_POR_DEFECTO', 'REVISION_SIN_IA', 'REVISION_VERDE'].forEach(function (k) { o[k] = String(o[k]).trim().toLowerCase(); });
  o.MODO_INICIAL = String(o.MODO_INICIAL).trim().toLowerCase() === 'completo' ? 'completo' : 'sencillo';
  o.ETAPAS_EN_ORDEN = String(o.ETAPAS_EN_ORDEN).trim().toUpperCase() === 'SI' ? 'SI' : 'NO';
  // IA_ACTIVA: hay clave del curso. MODOS_IA: vias habilitadas para el estudiante (curso, propia, copiar)
  o.IA_ACTIVA = props_().getProperty('GEMINI_API_KEY') ? 'SI' : 'NO';
  o.MODOS_IA = modosIA_().join(',');
  o.CONSENSUS_CURSO = props_().getProperty('CONSENSUS_API_KEY') ? 'SI' : 'NO';
  o.CITAS_DEFECTO = claveEstilo_(cfg_('CITAS_DEFECTO', 'IEEE')) || 'ieee';
  o.INICIO_ESTUDIANTE = String(cfg_('INICIO_ESTUDIANTE', 'clase')).trim().toLowerCase() === 'modo' ? 'modo' : 'clase';
  return o;
}

// ---------------------------------------------------------------- definiciones
function etapas_() {
  return leer_('Etapas').map(function (r) {
    return { id: r.id, nombre: r.nombre, producto: r.producto, instruccion: r.instruccion, requiere_asesor: r.requiere_asesor === 'SI', contexto: r.contexto ? r.contexto.split(',').map(function (s) { return s.trim(); }) : [] };
  });
}

function columnas_(spec) {
  // "clave=Etiqueta:Op1;Op2#|clave2=Etiqueta 2"
  if (!spec) return [];
  return spec.split('|').map(function (c) {
    var numero = false;
    c = c.trim();
    if (c.charAt(c.length - 1) === '#') { numero = true; c = c.substring(0, c.length - 1); }
    var i = c.indexOf('=');
    var clave = c.substring(0, i).trim();
    var resto = c.substring(i + 1);
    var j = resto.indexOf(':');
    var etiqueta = j >= 0 ? resto.substring(0, j) : resto;
    var ops = j >= 0 ? resto.substring(j + 1).split(';').map(function (s) { return s.trim(); }) : null;
    return { clave: clave, etiqueta: etiqueta.trim(), opciones: ops, numero: numero };
  });
}

function campos_() {
  if (CACHE_.campos) return CACHE_.campos;
  var lineas = cfg_('LINEAS', '').split(';').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
  var r = leer_('Campos').map(function (c) {
    var ops = [];
    if (c.opciones === '@LINEAS') {
      ops = lineas.map(function (l) { return { valor: l, texto: l }; });
    } else if (c.opciones) {
      ops = c.opciones.split(';').map(function (s) {
        var i = s.indexOf('=');
        return i >= 0 ? { valor: s.substring(0, i).trim(), texto: s.substring(i + 1).trim() } : { valor: s.trim(), texto: s.trim() };
      });
    }
    return {
      etapa: c.etapa, clave: c.clave, etiqueta: c.etiqueta, tipo: c.tipo, columnas: columnas_(c.columnas), opciones: ops, ayuda: c.ayuda,
      obligatorio: c.obligatorio === 'SI', aplica: c.aplica || 'todos',
      rubrica: c.rubrica ? c.rubrica.split(',').map(function (s) { return parseInt(s, 10); }).filter(function (n) { return !isNaN(n); }) : [],
      ia: c.ia === 'SI', min_filas: parseInt(c.min_filas, 10) || 0
    };
  });
  CACHE_.campos = r;
  return r;
}

function rubrica_() {
  return leer_('Rubrica').map(function (r) {
    return { item: parseInt(r.item, 10), grupo: r.grupo, criterio: r.criterio, descripcion: r.descripcion, n1: r.n1, n2: r.n2, n3: r.n3, n4: r.n4, marca: r.marca, campos: r.campos ? r.campos.split(',').map(function (s) { return s.trim(); }) : [] };
  });
}

function plantilla_() { return leer_('Plantilla').map(sinFila_); }

/** Preguntas del modo sencillo, en orden. Solo las que apuntan a un campo que existe (o a la biblioteca). */
function sencillo_() {
  var hay = Object.create(null);
  campos_().forEach(function (c) { hay[c.clave] = true; });
  var filas = [];
  try { filas = leer_('Sencillo').map(sinFila_); } catch (e) { filas = []; }
  return filas.filter(function (f) { return f.campo && (hay[f.campo] || f.campo === '#biblioteca'); })
    .sort(function (a, b) { return (parseFloat(a.orden) || 0) - (parseFloat(b.orden) || 0); })
    .map(function (f) { return { grupo: f.grupo || '', campo: f.campo, pregunta: f.pregunta || '', ayuda: f.ayuda || '', aplica: f.aplica || 'todos' }; });
}

/** Cuantas preguntas esenciales tiene respondidas un expediente: { llenas, total }. */
function esenciales_(exp, bib) {
  var total = 0, llenas = 0;
  sencillo_().forEach(function (f) {
    if (!aplica_(f.aplica, exp)) return;
    total++;
    if (f.campo === '#biblioteca') { if (bib.some(function (b) { return b.uso === 'antecedente'; })) llenas++; }
    else if (String(exp[f.campo] || '').trim()) llenas++;
  });
  return { llenas: llenas, total: total };
}

/** Fecha de la ultima edicion de un expediente (cadena vacia si no tiene). */
function ultimaEdicion_(correo) {
  correo = normCorreo_(correo);
  var u = '';
  leer_('Expedientes').forEach(function (r) { if (normCorreo_(r.correo) === correo && String(r.actualizado) > u) u = String(r.actualizado); });
  return u;
}

function prompts_() {
  if (CACHE_.prompts) return CACHE_.prompts;
  var m = {};
  leer_('Prompts').forEach(function (r) { m[r.clave] = r.texto; });
  CACHE_.prompts = m;
  return m;
}

/** Decide si un campo, item o seccion aplica al proyecto del estudiante. */
function aplica_(regla, exp) {
  regla = regla || 'todos';
  if (regla === 'todos') return true;
  if (regla === 'artefacto') return exp.tipo_proyecto === 'artefacto';
  if (regla === 'explicativa') return exp.tipo_proyecto !== 'artefacto';
  if (regla === 'hipotesis') return exp.con_hipotesis !== 'NO';
  return true;
}

// ---------------------------------------------------------------- usuarios
function normCorreo_(c) { return String(c || '').trim().toLowerCase(); }

function usuario_(correo) {
  correo = normCorreo_(correo);
  var us = leer_('Usuarios');
  for (var i = 0; i < us.length; i++) { if (normCorreo_(us[i].correo) === correo) return us[i]; }
  return null;
}

// ---------------------------------------------------------------- expediente
function expediente_(correo) {
  correo = normCorreo_(correo);
  var o = {};
  leer_('Expedientes').forEach(function (r) { if (normCorreo_(r.correo) === correo) o[r.clave] = r.valor; });
  return o;
}

/** Texto de un campo del expediente. Los campos largos no se recortan: se rechazan. */
function textoCampo_(valor) {
  var s = (valor === null || valor === undefined) ? '' : (typeof valor === 'string' ? valor : JSON.stringify(valor));
  if (s.length > 45000) throw new Error('Un campo supera el máximo de 45 000 caracteres. Resúmelo o divídelo.');
  return s;
}

/**
 * Guarda varios campos de un estudiante con una sola lectura de la hoja.
 * Devuelve las claves que cambiaron. Debe llamarse dentro de conBloqueo_().
 */
function guardarCampos_(correo, valores) {
  correo = normCorreo_(correo);
  var filas = leer_('Expedientes', true);
  var cab = cabecera_('Expedientes');
  var sh = hoja_('Expedientes');
  var colValor = cab.indexOf('valor') + 1;
  var colFecha = cab.indexOf('actualizado') + 1;
  var mias = Object.create(null);
  filas.forEach(function (r) { if (normCorreo_(r.correo) === correo) mias[r.clave] = r; });
  var cambiadas = [];
  var nuevas = [];
  var ahora = ahora_();
  Object.keys(valores).forEach(function (k) {
    var s = textoCampo_(valores[k]);
    if (mias[k]) {
      if (mias[k].valor === s) return;
      sh.getRange(mias[k]._fila, colValor).setValue(celda_(s));
      sh.getRange(mias[k]._fila, colFecha).setValue(celda_(ahora));
      cambiadas.push(k);
    } else if (s !== '') {
      var o = { correo: correo, clave: k, valor: s, actualizado: ahora };
      nuevas.push(cab.map(function (c) { return celda_(o[c]); }));
      cambiadas.push(k);
    }
  });
  if (nuevas.length) {
    asegurarFilas_(sh, cab.length, nuevas.length);
    sh.getRange(sh.getLastRow() + 1, 1, nuevas.length, cab.length).setValues(nuevas);
  }
  if (cambiadas.length) { olvidar_('Expedientes'); tocar_(correo); }
  return cambiadas;
}

function guardarCampo_(correo, clave, valor) {
  var o = {};
  o[clave] = valor;
  return guardarCampos_(correo, o).length > 0;
}

function tabla_(exp, clave) {
  var v = exp[clave];
  if (!v) return [];
  try { var a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}

// ---------------------------------------------------------------- avance
function avance_(correo) {
  correo = normCorreo_(correo);
  var o = {};
  leer_('Avance').forEach(function (r) {
    if (normCorreo_(r.correo) !== correo) return;
    var det = {};
    try { det = r.detalle ? JSON.parse(r.detalle) : {}; } catch (e) { det = {}; }
    o[r.etapa] = { estado: r.estado, semaforo: r.semaforo, detalle: det, actualizado: r.actualizado };
  });
  return o;
}

function ponerAvance_(correo, etapa, datos) {
  correo = normCorreo_(correo);
  etapa = String(etapa);
  var filas = leer_('Avance', true);
  var o = { actualizado: ahora_() };
  if (datos.hasOwnProperty('estado')) o.estado = datos.estado;
  if (datos.hasOwnProperty('semaforo')) o.semaforo = datos.semaforo;
  if (datos.hasOwnProperty('detalle')) o.detalle = JSON.stringify(datos.detalle);
  for (var i = 0; i < filas.length; i++) {
    if (normCorreo_(filas[i].correo) === correo && String(filas[i].etapa) === etapa) { actualizar_('Avance', filas[i]._fila, o); return; }
  }
  o.correo = correo; o.etapa = etapa;
  if (!o.estado) o.estado = 'en_curso';
  agregar_('Avance', o);
}

// ---------------------------------------------------------------- biblioteca
function biblioteca_(correo) {
  correo = normCorreo_(correo);
  return leer_('Biblioteca').filter(function (r) { return normCorreo_(r.correo) === correo; }).map(function (r) {
    var o = sinFila_(r);
    try { o.autores = r.autores ? JSON.parse(r.autores) : []; } catch (e) { o.autores = []; }
    return o;
  });
}

function filaBiblioteca_(correo, id) {
  correo = normCorreo_(correo);
  var filas = leer_('Biblioteca', true);
  for (var i = 0; i < filas.length; i++) { if (filas[i].id === id && normCorreo_(filas[i].correo) === correo) return filas[i]; }
  return null;
}

// ---------------------------------------------------------------- comentarios y bitacora
function comentarios_(correo) {
  correo = normCorreo_(correo);
  return leer_('Comentarios').filter(function (r) { return normCorreo_(r.correo) === correo; }).map(sinFila_);
}

function registrarIA_(o) {
  var id = Utilities.getUuid();
  agregar_('Bitacora', { id: id, fecha: ahora_(), correo: normCorreo_(o.correo), etapa: o.etapa, modo: o.modo, campo: o.campo || '', modelo: o.modelo || '', tokens_entrada: String(o.tokensIn || 0), tokens_salida: String(o.tokensOut || 0), aceptado: '', extracto: String(o.extracto || '').substring(0, 400) });
  return id;
}

/** Consultas de hoy hechas con la clave del curso: son las unicas que cuentan para la cuota diaria. */
function usoHoy_(correo) {
  correo = normCorreo_(correo);
  var h = hoy_();
  var n = 0;
  leer_('Bitacora').forEach(function (r) {
    if (normCorreo_(r.correo) !== correo || String(r.fecha).substring(0, 10) !== h) return;
    if (viaDeModelo_(r.modelo) === 'curso') n++;
  });
  return n;
}

/** Via por la que se hizo una consulta, segun lo anotado en la columna "modelo" de la bitacora. */
function viaDeModelo_(modelo) {
  modelo = String(modelo || '');
  if (modelo === 'copiar y pegar') return 'copiar';
  if (modelo === 'gemini nano (local)') return 'nano';
  if (modelo.indexOf('(clave propia)') >= 0) return 'propia';
  return 'curso';
}

function resumenIA_(correo) {
  correo = normCorreo_(correo);
  var r = { total: 0, aceptadas: 0, editadas: 0, descartadas: 0, tokens: 0, porEtapa: {}, porModo: {}, porVia: { curso: 0, propia: 0, copiar: 0, nano: 0 } };
  leer_('Bitacora').forEach(function (b) {
    if (normCorreo_(b.correo) !== correo) return;
    r.total++;
    r.tokens += (parseInt(b.tokens_entrada, 10) || 0) + (parseInt(b.tokens_salida, 10) || 0);
    if (b.aceptado === 'aceptado') r.aceptadas++;
    if (b.aceptado === 'editado') r.editadas++;
    if (b.aceptado === 'descartado') r.descartadas++;
    r.porEtapa[b.etapa] = (r.porEtapa[b.etapa] || 0) + 1;
    r.porModo[b.modo] = (r.porModo[b.modo] || 0) + 1;
    r.porVia[viaDeModelo_(b.modelo)]++;
    var m = String(b.modelo || '').replace(/\s*\(clave propia\)\s*/, '').trim();
    if (m) { r.modelos = r.modelos || {}; r.modelos[m] = (r.modelos[m] || 0) + 1; }
  });
  return r;
}

// ---------------------------------------------------------------- reelaboracion del texto propuesto por la IA
var IA_PROP_MAX_ = 3;        // propuestas que se guardan por campo
var IA_PROP_CHARS_ = 5000;   // caracteres que se guardan de cada propuesta
var REELAB_VERDE_ = 25;      // % de coincidencia hasta el que el texto se considera reelaborado
var REELAB_ROJO_ = 60;       // % desde el que el texto se considera casi igual a la propuesta

/** Texto plano de un valor de campo (las tablas se guardan como JSON de filas). */
function textoPlanoCampo_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'string') v = JSON.stringify(v);
  var t = String(v).trim();
  if (t.charAt(0) === '[') {
    try {
      var filas = JSON.parse(t);
      if (Array.isArray(filas)) return filas.map(function (f) { return f && typeof f === 'object' ? Object.keys(f).map(function (k) { return String(f[k] || ''); }).join(' ') : String(f); }).join(' ');
    } catch (e) { /* no era JSON */ }
  }
  return t;
}

/** Guarda la propuesta de redaccion de la IA para un campo (las ultimas tres), para compararla luego con lo que escribe el estudiante. */
function guardarPropuestaIA_(correo, campo, valor) {
  if (!campo) return;
  try {
    var texto = textoPlanoCampo_(valor).substring(0, IA_PROP_CHARS_);
    if (palabrasDe_(texto).length < 8) return;
    conBloqueo_(function () {
      olvidar_('Expedientes');
      var exp = expediente_(correo);
      var l = [];
      try { l = exp['_ia_' + campo] ? JSON.parse(exp['_ia_' + campo]) : []; } catch (e) { l = []; }
      l.push({ t: texto, f: ahora_() });
      guardarCampo_(correo, '_ia_' + campo, JSON.stringify(l.slice(-IA_PROP_MAX_)));
    });
  } catch (e2) { /* la comparacion es informativa: nunca impide usar la propuesta */ }
}

function palabrasDe_(t) {
  return sinTildes_(String(t || '').toLowerCase()).replace(/\[@[^\]]*\]/g, ' ').replace(/[^a-z0-9ñ]+/g, ' ').trim().split(/\s+/).filter(function (w) { return w; });
}

/** Secuencias de cuatro palabras seguidas de un texto. */
function tejas_(t) {
  var w = palabrasDe_(t), o = {};
  for (var i = 0; i + 4 <= w.length; i++) o[w.slice(i, i + 4).join(' ')] = 1;
  return o;
}

/** Porcentaje de las secuencias de cuatro palabras del texto actual que ya estaban en la propuesta. */
function coincidencia_(actual, propuesta) {
  var a = tejas_(actual), p = tejas_(propuesta), n = 0, c = 0;
  for (var k in a) { if (a.hasOwnProperty(k)) { n++; if (p[k]) c++; } }
  return n ? Math.round(100 * c / n) : 0;
}

/**
 * Para cada campo en que la IA propuso texto: cuanto del texto actual coincide con la propuesta.
 * estado: 'reelaborado' (verde), 'parcial' (ambar), 'igual' (rojo) o 'sin_texto'. foco resume el expediente.
 */
function reelaboracion_(exp) {
  var etiquetas = {};
  try { campos_().forEach(function (c) { etiquetas[c.clave] = c.etiqueta; }); } catch (e) { etiquetas = {}; }
  var campos = [];
  Object.keys(exp).forEach(function (k) {
    if (k.indexOf('_ia_') !== 0) return;
    var campo = k.substring(4), props = [];
    try { props = JSON.parse(exp[k]) || []; } catch (e1) { props = []; }
    if (!props.length) return;
    var actual = textoPlanoCampo_(exp[campo]);
    var palabras = palabrasDe_(actual).length;
    var max = 0;
    props.forEach(function (p) { max = Math.max(max, coincidencia_(actual, p.t)); });
    var estado = palabras < 8 ? 'sin_texto' : (max >= REELAB_ROJO_ ? 'igual' : (max > REELAB_VERDE_ ? 'parcial' : 'reelaborado'));
    campos.push({ campo: campo, etiqueta: etiquetas[campo] || campo, coincidencia: max, estado: estado, propuestas: props.length, palabras: palabras, fecha: props[props.length - 1].f });
  });
  var cuenta = { reelaborado: 0, parcial: 0, igual: 0, sin_texto: 0 };
  campos.forEach(function (c) { cuenta[c.estado]++; });
  var conTexto = campos.length - cuenta.sin_texto;
  var foco = !conTexto ? '' : (cuenta.igual ? 'rojo' : (cuenta.parcial ? 'ambar' : 'verde'));
  return { campos: campos, reelaborados: cuenta.reelaborado, parciales: cuenta.parcial, iguales: cuenta.igual, total: conTexto, foco: foco, umbralVerde: REELAB_VERDE_, umbralRojo: REELAB_ROJO_ };
}

// ---------------------------------------------------------------- humanizacion
var HUM_MIN_PALABRAS_ = 15;   // un campo cuenta como texto generado desde estas palabras
var HUM_MAX_COINC_ = 25;      // % maximo de secuencias de cuatro palabras repetidas del texto de origen
var HUM_MIN_LARGO_ = 0.6;     // el texto humano debe tener al menos 60 % de las palabras del origen
var HUM_MIN_TECLEO_ = 0.3;    // pulsaciones registradas / caracteres escritos

/** Campos de redaccion libre que se pueden humanizar. */
function camposHumanizables_() {
  return campos_().filter(function (c) { return c.tipo === 'parrafo' || c.tipo === 'texto'; });
}

/** Citas [@clave] de un texto. */
function citasDe_(t) {
  var o = {}, m, re = /\[@([^\]\s;,]+)/g;
  t = String(t || '');
  while ((m = re.exec(t)) !== null) o[m[1]] = 1;
  return Object.keys(o);
}

/**
 * Textos de origen de un campo: el borrador precargado (congelado en _orig_ al primer ingreso,
 * o el valor actual si el estudiante aun no entra) y las propuestas de redaccion de la IA.
 */
function origenesCampo_(exp, campo) {
  var l = [];
  if (exp['_orig_' + campo]) l.push({ t: exp['_orig_' + campo], de: 'borrador' });
  else if (exp._borrador && !exp._orig_hecho && exp[campo] && !exp['_hum_' + campo]) l.push({ t: exp[campo], de: 'borrador' });
  var props = [];
  try { props = exp['_ia_' + campo] ? JSON.parse(exp['_ia_' + campo]) : []; } catch (e) { props = []; }
  props.forEach(function (p) { if (p && p.t) l.push({ t: p.t, de: 'ia' }); });
  return l;
}

/** Al primer ingreso de un estudiante con borrador precargado se congela el texto de origen de cada campo. */
function congelarBorrador_(correo) {
  try {
    var exp = expediente_(correo);
    if (!exp._borrador || exp._orig_hecho) return;
    var v = { _orig_hecho: ahora_() };
    camposHumanizables_().forEach(function (c) {
      if (palabrasDe_(exp[c.clave]).length >= HUM_MIN_PALABRAS_ && !exp['_orig_' + c.clave]) v['_orig_' + c.clave] = String(exp[c.clave]).substring(0, 45000);
    });
    guardarCampos_(correo, v);
  } catch (e) { /* informativo: no impide entrar */ }
}

/**
 * Estado de humanizacion de un expediente: por campo generado (borrador o IA), si el estudiante
 * lo reescribio con la herramienta Humanizar y el texto actual sigue siendo suyo.
 */
function humanizacion_(exp) {
  var campos = [], palabrasIA = 0, palabrasHum = 0;
  camposHumanizables_().forEach(function (c) {
    var or = origenesCampo_(exp, c.clave);
    var principal = or.filter(function (o) { return palabrasDe_(o.t).length >= HUM_MIN_PALABRAS_; });
    if (!principal.length) return;
    var actual = String(exp[c.clave] || '');
    var max = 0;
    principal.forEach(function (o) { max = Math.max(max, coincidencia_(actual, o.t)); });
    var largo = palabrasDe_(principal[0].t).length;
    var hum = null;
    try { hum = exp['_hum_' + c.clave] ? JSON.parse(exp['_hum_' + c.clave]) : null; } catch (e) { hum = null; }
    var pal = palabrasDe_(actual).length;
    var estado = 'pendiente';
    if (hum && hum.parcial) estado = max <= HUM_MAX_COINC_ ? 'parcial' : 'cambiado';
    else if (hum && max <= HUM_MAX_COINC_ && pal >= Math.max(8, Math.floor(HUM_MIN_LARGO_ * largo))) estado = 'listo';
    else if (hum) estado = 'cambiado';
    palabrasIA += largo;
    if (estado === 'listo') palabrasHum += pal;
    campos.push({ campo: c.clave, etiqueta: c.etiqueta, etapa: c.etapa, de: principal[0].de, palabrasOrigen: largo, palabras: pal, coincidencia: max, estado: estado, fecha: hum ? hum.f : '', borrador: !!exp['_humb_' + c.clave], propio: !!(hum && hum.propio) });
  });
  var listos = campos.filter(function (c) { return c.estado === 'listo'; }).length;
  var pct = campos.length ? Math.round(100 * listos / campos.length) : 0;
  return { campos: campos, generados: campos.length, listos: listos, pct: pct, palabrasIA: palabrasIA, palabrasHumanas: palabrasHum, xp: palabrasHum, nivel: nivelHum_(pct, campos.length), umbral: HUM_MAX_COINC_ };
}

/** Humanizacion con la marca «puede no aplicar» en los campos que no van al cuerpo de la tesis (Reglamento de Similitud, Art. 12). */
function humanizacionDoc_(exp) {
  var h = humanizacion_(exp);
  try {
    var donde = camposEnDocumento_(exp);
    h.campos.forEach(function (c) { if (donde[c.campo] !== 'cuerpo') c.noAplica = donde[c.campo] === 'excluida' ? 'anexo' : 'fuera'; });
  } catch (e) { /* informativo */ }
  return h;
}

/** Nivel ludico segun el porcentaje humanizado. */
function nivelHum_(pct, total) {
  if (!total) return 'sin';
  if (pct >= 100) return 'listo';
  if (pct >= 80) return 'casi';
  if (pct >= 40) return 'camino';
  if (pct > 0) return 'brote';
  return 'semilla';
}

/** Resumen corto para paneles. */
function resumenHum_(exp) {
  var h = humanizacion_(exp);
  return { generados: h.generados, listos: h.listos, pct: h.pct, palabrasIA: h.palabrasIA, palabrasHumanas: h.palabrasHumanas, nivel: h.nivel };
}

/**
 * El estudiante guarda su version humana de un campo. Se verifica en el servidor: largo suficiente,
 * coincidencia baja con todos los textos de origen y con lo que tenia escrito, citas conservadas y
 * escritura a mano (pulsaciones registradas por el navegador, sin pegar).
 */
function humanizar_(ses, a) {
  var campo = String(a.campo || '');
  var c = camposHumanizables_().filter(function (x) { return x.clave === campo; })[0];
  if (!c) throw new Error('Ese campo no se puede humanizar.');
  var texto = String(a.texto || '').replace(/\s+$/, '');
  var st = a.stats || {};
  var modo = a.modo === 'avance' || a.modo === 'forzar' ? a.modo : 'final';
  var exp = expediente_(ses.correo);
  if (modo !== 'avance' && camposBloqueados_(exp, [campo]).length) throw new Error(MSJ_CONGELADO_);
  if (modo === 'avance') {
    // Borrador de la humanizacion: no reemplaza el texto de la tesis; se retoma al volver a abrir la ventana
    if (parseInt(st.pegados, 10) > 0 && !st.propio) throw new Error('El texto debe escribirse aquí, sin pegar.');
    conBloqueo_(function () { var v = {}; v['_humb_' + campo] = texto ? JSON.stringify({ t: texto, f: ahora_(), k: parseInt(st.teclas, 10) || 0 }) : ''; guardarCampos_(ses.correo, v); });
    olvidar_('Expedientes');
    var e1 = expediente_(ses.correo);
    return { ok: true, modo: 'avance', expediente: e1, humanizacion: humanizacionDoc_(e1) };
  }
  var origenes = origenesCampo_(exp, campo).map(function (o) { return o.t; });
  if (exp[campo]) origenes.push(exp[campo]);
  if (!origenes.length) throw new Error('Este campo aún no tiene un texto que humanizar.');
  var largo = Math.max.apply(null, origenes.map(function (t) { return palabrasDe_(t).length; }));
  var pal = palabrasDe_(texto).length;
  var min = Math.max(8, Math.floor(HUM_MIN_LARGO_ * largo));
  var problemas = [];
  if (pal < min) problemas.push('Escribe al menos ' + min + ' palabras (llevas ' + pal + ').');
  var max = 0;
  origenes.forEach(function (t) { max = Math.max(max, coincidencia_(texto, t)); });
  if (max > HUM_MAX_COINC_) problemas.push('Aún se parece mucho al texto de origen (' + max + ' % de frases repetidas; el máximo es ' + HUM_MAX_COINC_ + ' %).');
  var faltan = citasDe_(exp[campo]).filter(function (k) { return citasDe_(texto).indexOf(k) < 0; });
  if (faltan.length) problemas.push('Conserva las citas: ' + faltan.map(function (k) { return '[@' + k + ']'; }).join(', ') + '.');
  var teclas = parseInt(st.teclas, 10) || 0, pegados = parseInt(st.pegados, 10) || 0;
  // Texto propio declarado: el estudiante afirma que lo escribio el mismo en su documento y lo pega
  var propio = !!st.propio;
  if (!propio && pegados > 0) problemas.push('El texto debe escribirse aquí, sin pegar.');
  if (!propio && teclas < Math.floor(HUM_MIN_TECLEO_ * texto.length)) problemas.push('No se registró suficiente escritura en esta ventana.');
  var puntaje = Math.round(Math.max(0, 100 - max) * Math.min(1, pal / Math.max(1, min)));
  var parcial = false;
  if (problemas.length) {
    // Guardar igual: basta con un 25 % de voz propia, escrito a mano y sin pegar; queda como humanizado en parte
    var duros = (!propio && (pegados > 0 || teclas < Math.floor(HUM_MIN_TECLEO_ * texto.length))) || pal < 8;
    if (modo !== 'forzar' || duros || puntaje < 25) throw new Error(problemas.join(' ') + (modo === 'forzar' && puntaje < 25 ? ' (Tu voz: ' + puntaje + ' %; se necesita al menos 25 %.)' : ''));
    parcial = true;
  }
  var info = { f: ahora_(), c: max, p: pal, k: teclas, s: parseInt(st.segundos, 10) || 0, o: largo, v: puntaje };
  if (parcial) { info.parcial = true; info.faltan = problemas; }
  if (propio) { info.propio = true; info.pg = pegados; }
  var valores = {};
  valores[campo] = texto;
  var salida = guardar_(ses, { valores: valores });
  conBloqueo_(function () {
    var v = {};
    v['_hum_' + campo] = JSON.stringify(info);
    if (exp['_humb_' + campo]) v['_humb_' + campo] = '';
    // Si aun no se congelo el borrador, se congela antes de reemplazarlo
    if (exp._borrador && !exp._orig_hecho && !exp['_orig_' + campo] && palabrasDe_(exp[campo]).length >= HUM_MIN_PALABRAS_) v['_orig_' + campo] = exp[campo];
    guardarCampos_(ses.correo, v);
  });
  olvidar_('Expedientes');
  var e2 = expediente_(ses.correo);
  salida.humanizacion = humanizacionDoc_(e2);
  salida.expediente = e2;
  salida.coincidencia = max;
  salida.xp = parcial ? 0 : pal;
  salida.parcial = parcial;
  salida.puntaje = puntaje;
  return salida;
}

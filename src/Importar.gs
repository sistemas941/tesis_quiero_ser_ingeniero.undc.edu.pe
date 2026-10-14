/**
 * Importar.gs - Extraer referencias de un texto o documento e importar un plan de tesis ya escrito.
 *
 * El navegador lee el archivo (Word, PDF o texto) y propone a que campo va cada seccion. Aqui se valida
 * todo de nuevo: solo se aceptan campos que existen, las tablas se limpian columna por columna y las
 * referencias se interpretan y se verifican con Crossref antes de entrar a la biblioteca.
 * El texto importado es un dato: nunca se ejecuta ni se trata como instruccion.
 */

var IMP_MAX_REFS_ = 120;
var IMP_MAX_TEXTO_ = 45000;

// ---------------------------------------------------------------- referencias: partir el texto en entradas
/** Toma solo la lista de referencias si el texto trae un titulo «Referencias» o «Bibliografia». */
function zonaReferencias_(texto) {
  var lineas = String(texto || '').replace(/\r/g, '').split('\n');
  var ini = -1, fin = lineas.length;
  for (var i = 0; i < lineas.length; i++) {
    var l = sinTildes_(lineas[i]).trim().toLowerCase().replace(/^[ivxlc\d.\s)-]+/, '');
    if (ini < 0 && /^(referencias( bibliograficas)?|bibliografia|fuentes consultadas|references|bibliography)\s*:?\s*$/.test(l)) ini = i + 1;
    else if (ini >= 0 && i > ini && /^(anexos?|apendices?|appendix)\b/.test(l) && lineas[i].trim().length < 40) { fin = i; break; }
  }
  return ini >= 0 ? lineas.slice(ini, fin).join('\n') : String(texto || '');
}

/** ¿La linea empieza como una referencia nueva? [1] | 1. | Apellido, A. | Apellido Apellido, Nombre */
function iniciaReferencia_(l) {
  return /^\s*(\[\d{1,3}\]|\d{1,3}[.)]\s)/.test(l) ||
    /^\s*[A-ZÁÉÍÓÚÑÜ][A-Za-zÁÉÍÓÚÑÜáéíóúñüç'’\-]+(?:\s+(?:de|del|la|van|von|da|dos)?\s*[A-ZÁÉÍÓÚÑÜ][A-Za-zÁÉÍÓÚÑÜáéíóúñüç'’\-]+)?,\s+(?:[A-ZÁÉÍÓÚÑÜ]\.|[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)/.test(l) ||
    /^\s*[A-ZÁÉÍÓÚÑÜ][A-Za-zÁÉÍÓÚÑÜáéíóúñü'’\-]+\s+[A-Z]{1,3},\s/.test(l) ||
    /^\s*(?:[A-Z]\.\s?){1,3}\s*[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+/.test(l) ||
    /^\s*[A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ\s.&]{3,60}\.\s*\(?(19|20)\d{2}/.test(l);
}

/** Parte una lista de referencias en entradas. Funciona con una referencia por linea o con lineas cortadas (PDF). */
function partirReferencias_(texto) {
  var lineas = zonaReferencias_(texto).split('\n').map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).filter(function (s) { return s.length > 2; });
  if (!lineas.length) return [];
  var conAnio = lineas.filter(function (l) { return /(19|20)\d{2}/.test(l) && l.length > 40; }).length;
  // Una referencia por linea: casi todas las lineas tienen anio y son largas
  if (conAnio >= Math.max(1, Math.round(lineas.length * 0.8))) return lineas.slice(0, IMP_MAX_REFS_);
  var out = [], actual = '';
  lineas.forEach(function (l) {
    var nueva = iniciaReferencia_(l) && (!actual || /[.)\]]\s*$/.test(actual) || /^\s*(\[\d+\]|\d+[.)]\s)/.test(l) || /(https?:\/\/\S+|10\.\d{4,9}\/\S+)\s*$/.test(actual));
    if (nueva && actual) { out.push(actual); actual = l; }
    else actual = actual ? (/-$/.test(actual) ? actual.replace(/-$/, '') + l : actual + ' ' + l) : l;
  });
  if (actual) out.push(actual);
  return out.filter(function (r) { return r.length > 25 && /(19|20)\d{2}|s\.\s?f\./i.test(r); }).slice(0, IMP_MAX_REFS_);
}

// ---------------------------------------------------------------- referencias: interpretar una entrada
function limpiarTrozo_(s) { return String(s || '').replace(/\s+/g, ' ').replace(/^[\s,.;:"“”«»']+|[\s,;:"“”«»']+$/g, '').trim(); }

/** Autores en cualquiera de los formatos comunes a [{apellido, nombre}] */
function autoresDeTexto_(txt) {
  txt = String(txt || '').replace(/\bet al\.?/gi, '').replace(/\s+(?:&|y|and|e)\s+/g, ', ').replace(/,\s*(?:&|y|and)\s+/g, ', ').replace(/\.\s*$/, '.').trim();
  if (!txt) return [];
  var t = txt.split(/\s*,\s*/).filter(function (x) { return x; });
  var ini = /^(?:[A-ZÁÉÍÓÚÑÜ]\.\s?-?\s?){1,4}$/;
  var out = [];
  // APA: Apellido, A. B., Apellido, C.
  if (t.length >= 2 && ini.test(t[1])) {
    for (var i = 0; i < t.length; i++) {
      if (i + 1 < t.length && ini.test(t[i + 1])) { out.push({ apellido: t[i], nombre: t[i + 1].replace(/\s+/g, ' ').trim() }); i++; }
      else if (!ini.test(t[i])) out.push({ apellido: t[i], nombre: '' });
    }
    return out.slice(0, 30);
  }
  t.forEach(function (p) {
    p = p.trim();
    var m = /^((?:[A-ZÁÉÍÓÚÑÜ]\.\s?-?\s?){1,4})\s*(.+)$/.exec(p);         // IEEE: A. B. Apellido
    var v = /^(.+?)\s+([A-Z]{1,4})$/.exec(p);                             // Vancouver: Apellido AB
    if (m) out.push({ apellido: m[2].trim(), nombre: m[1].trim() });
    else if (v) out.push({ apellido: v[1].trim(), nombre: v[2].split('').join('. ') + '.' });
    else if (/\s/.test(p) && p.split(/\s+/).length <= 4) { var pn = partirNombre_(p); out.push(pn); }
    else if (p) out.push({ apellido: p, nombre: '' });
  });
  return out.filter(function (a) { return a.apellido && a.apellido.length < 60; }).slice(0, 30);
}

function tipoPorTexto_(r) {
  var s = sinTildes_(r).toLowerCase();
  if (/\btesis\b|\bthesis\b|dissertation|repositorio|trabajo de (suficiencia|titulacion|investigacion)/.test(s)) return 'tesis';
  if (/\bvol\.|\bvolumen\b|\bpp\.|\(\d+\)\s*[,:]\s*\d|;\s*\d+\s*\(|revista|journal|transactions|proceedings|conference|congreso/.test(s)) return 'articulo';
  if (/editorial|\bed\.|edicion|press|publishers?|mcgraw|pearson|springer nature|wiley\b/.test(s)) return 'libro';
  return 'otro';
}
function gradoPorTexto_(r) {
  var s = sinTildes_(r).toLowerCase();
  if (/doctor/.test(s)) return 'Tesis doctoral';
  if (/maestr|magister|master/.test(s)) return 'Tesis de maestría';
  if (/suficiencia|titulacion/.test(s)) return 'Trabajo de titulación';
  return 'Tesis de pregrado';
}

/** Interpreta una referencia escrita en APA, IEEE, Vancouver o Chicago. Devuelve los campos de la biblioteca. */
function analizarReferencia_(raw) {
  var r = String(raw || '').replace(/\s+/g, ' ').trim();
  var o = { texto: r, autores: [], anio: '', titulo: '', fuente: '', volumen: '', numero: '', paginas: '', doi: '', url: '', tipo: '', editorial: '', grado: '' };
  var mDoi = /\b(10\.\d{4,9}\/[^\s"<>]+)/i.exec(r);
  if (mDoi) o.doi = limpiarDoi_(mDoi[1].replace(/[.,;)\]]+$/, ''));
  var mUrl = /(https?:\/\/[^\s"<>]+)/i.exec(r);
  if (mUrl && !/doi\.org/i.test(mUrl[1])) o.url = urlSegura_(mUrl[1].replace(/[.,;)\]]+$/, ''));
  var s = r.replace(/^\s*(\[\d{1,3}\]|\d{1,3}[.)])\s*/, '').replace(/(https?:\/\/\S+|doi:\s*\S+|\b10\.\d{4,9}\/\S+)/gi, ' ').replace(/\[(en l[ií]nea|online)\]\.?|disponible en:?|available( at| from)?:?|recuperado (de|el)[^.]*\.?|retrieved from:?/gi, ' ').replace(/\s+/g, ' ').trim();
  var mApa = /^(.+?)\s*\(((?:19|20)\d{2})[a-z]?(?:,[^)]*)?\)\.?\s*(.+)$/.exec(s) || /^(.+?)\s*\((s\.\s?f\.)\)\.?\s*(.+)$/i.exec(s);
  var mQ = /^(.+?),?\s*[“"«]([^”"»]{8,400})[”"»],?\s*(.*)$/.exec(s);
  if (mApa && mApa[1].length < 400) {
    // APA y Chicago: Autores (2020). Titulo. Fuente, 12(3), 1-10.
    o.autores = autoresDeTexto_(mApa[1]);
    o.anio = /s\.\s?f/i.test(mApa[2]) ? '' : mApa[2];
    var resto = mApa[3];
    var mTit = /^(.+?[^A-Z])\.\s+(.+)$/.exec(resto);
    o.titulo = limpiarTrozo_(mTit ? mTit[1] : resto);
    var fuente = mTit ? mTit[2] : '';
    var mVol = /^(.+?),\s*(\d+)\s*(?:\(([^)]+)\))?\s*(?:,\s*([A-Za-z]?\d+\s*[-–]\s*[A-Za-z]?\d+|[A-Za-z]?\d+))?/.exec(fuente);
    if (mVol) { o.fuente = limpiarTrozo_(mVol[1]); o.volumen = mVol[2]; o.numero = mVol[3] || ''; o.paginas = (mVol[4] || '').replace(/\s+/g, ''); }
    else o.fuente = limpiarTrozo_(fuente.replace(/\[[^\]]*\]/g, ''));
    var mGr = /\[([^\]]*(?:tesis|thesis|trabajo)[^\]]*)\]/i.exec(resto);
    if (mGr) { o.tipo = 'tesis'; o.grado = gradoPorTexto_(mGr[1]); var pu = mGr[1].split(',').slice(1).join(',').trim(); if (pu) o.fuente = pu; }
  } else if (mQ) {
    // IEEE y Chicago con comillas: Autores, "Titulo," Fuente, vol. 1, no. 2, pp. 3-4, 2020.
    o.autores = autoresDeTexto_(mQ[1]);
    o.titulo = limpiarTrozo_(mQ[2]);
    var cola = mQ[3];
    var mA = /\b((?:19|20)\d{2})\b/.exec(cola) || /\b((?:19|20)\d{2})\b/.exec(s);
    if (mA) o.anio = mA[1];
    var vol = /\bvol(?:umen)?\.?\s*(\d+)/i.exec(cola), num = /\b(?:no|n\.º|n°|núm|num|nro)\.?\s*(\d+)/i.exec(cola), pp = /\bpp?\.\s*([A-Za-z]?\d+\s*[-–]\s*[A-Za-z]?\d+|[A-Za-z]?\d+)/i.exec(cola);
    if (vol) o.volumen = vol[1];
    if (num) o.numero = num[1];
    if (pp) o.paginas = pp[1].replace(/\s+/g, '');
    o.fuente = limpiarTrozo_(cola.split(/,\s*(?:vol|no\.|n\.º|pp?\.|(?:19|20)\d{2})/i)[0].replace(/^en:?\s*/i, '').replace(/^in:?\s*/i, ''));
  } else {
    // Vancouver: Apellido AB, Apellido C. Titulo. Revista. 2020;12(3):1-10.
    var partes = s.split(/\.\s+(?=[A-ZÁÉÍÓÚÑ0-9¿])/);
    o.autores = autoresDeTexto_(partes[0]);
    o.titulo = limpiarTrozo_(partes[1] || '');
    var restoV = partes.slice(2).join('. ');
    var mV = /^(.*?)\.?\s*((?:19|20)\d{2})[^;]*;?\s*(\d+)?\s*(?:\(([^)]+)\))?\s*:?\s*([A-Za-z]?\d+\s*[-–]\s*[A-Za-z]?\d+|[A-Za-z]?\d+)?/.exec(restoV);
    if (mV) { o.fuente = limpiarTrozo_(mV[1]); o.anio = mV[2]; o.volumen = mV[3] || ''; o.numero = mV[4] || ''; o.paginas = (mV[5] || '').replace(/\s+/g, ''); }
    else { var a2 = /\b((?:19|20)\d{2})\b/.exec(s); if (a2) o.anio = a2[1]; o.fuente = limpiarTrozo_(restoV); }
  }
  o.titulo = o.titulo.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
  o.fuente = o.fuente.replace(/\.+$/, '').trim();
  if (!o.tipo) o.tipo = o.volumen && o.fuente ? 'articulo' : tipoPorTexto_(r);
  if (o.tipo === 'tesis' && !o.grado) o.grado = gradoPorTexto_(r);
  if (o.tipo === 'libro') { o.editorial = o.fuente; }
  o.titulo = o.titulo.substring(0, 400);
  o.fuente = o.fuente.substring(0, 200);
  return o;
}

/** Busca en Crossref la referencia completa para hallar su DOI. Solo acepta si el titulo coincide. */
function buscarPorTexto_(lista) {
  var correo = cfg_('CORREO_CONTACTO', '');
  var pedidos = lista.map(function (o) {
    return { url: 'https://api.crossref.org/works?rows=1&query.bibliographic=' + encodeURIComponent(o.texto.substring(0, 300)) + (correo ? '&mailto=' + encodeURIComponent(correo) : ''), muteHttpExceptions: true };
  });
  if (!pedidos.length) return [];
  var resp = [];
  try { resp = UrlFetchApp.fetchAll(pedidos); } catch (e) { return lista.map(function () { return null; }); }
  return resp.map(function (rr, i) {
    try {
      if (rr.getResponseCode() !== 200) return null;
      var it = JSON.parse(rr.getContentText()).message.items[0];
      if (!it) return null;
      var m = deCrossref_(it);
      return titulosParecidos_(m.titulo, lista[i].titulo) ? m : null;
    } catch (e2) { return null; }
  });
}

/**
 * Interpreta todas las referencias de un texto y las verifica: primero por su DOI y, si no tienen,
 * buscandolas en Crossref por su texto. Devuelve candidatas para que el estudiante elija cuales agregar.
 */
function analizarReferenciasTexto_(texto, correo) {
  texto = String(texto || '').substring(0, IMP_MAX_TEXTO_);
  if (/@\w+\s*\{[^,]*,/.test(texto)) { var bib = desdeBibtex_(texto); if (bib.length) return verificarLista_(bib, correo); }
  if (/^TY\s{2}-/m.test(texto)) { var ris = desdeRis_(texto); if (ris.length) return verificarLista_(ris, correo); }
  var entradas = partirReferencias_(texto);
  return verificarLista_(entradas.map(analizarReferencia_), correo);
}

/** Verifica una lista de referencias ya interpretadas (por las reglas o por el asistente) y marca las repetidas. */
function verificarLista_(lista, correo) {
  lista = (lista || []).slice(0, IMP_MAX_REFS_).map(function (o) {
    o = o || {};
    var au = Array.isArray(o.autores) ? o.autores.filter(function (x) { return x && x.apellido; }).map(function (x) { return { apellido: String(x.apellido).substring(0, 80), nombre: String(x.nombre || '').substring(0, 80) }; }) : parsearAutores_(o.autores);
    return { texto: String(o.texto || '').substring(0, 1200), autores: au.slice(0, 30), anio: String(o.anio || '').replace(/[^0-9]/g, '').substring(0, 4), titulo: String(o.titulo || '').substring(0, 400), fuente: String(o.fuente || '').substring(0, 200),
      volumen: String(o.volumen || '').substring(0, 20), numero: String(o.numero || '').substring(0, 20), paginas: String(o.paginas || '').substring(0, 30), doi: limpiarDoi_(o.doi), url: urlSegura_(o.url),
      tipo: ['articulo', 'tesis', 'libro', 'otro'].indexOf(o.tipo) >= 0 ? o.tipo : 'otro', editorial: String(o.editorial || '').substring(0, 200), grado: String(o.grado || '').substring(0, 60) };
  });
  lista.forEach(function (o) { if (!o.texto) o.texto = [o.autores.map(function (x) { return x.apellido; }).join(', '), o.anio, o.titulo, o.fuente].filter(function (x) { return x; }).join('. '); });
  var conDoi = lista.map(function (o) { return o.doi || ''; });
  var metas = verificarDoisLote_(conDoi);
  var sinDoi = [], posSin = [];
  lista.forEach(function (o, i) {
    if (metas[i]) { o.verificado = 'crossref'; aplicarMeta_(o, metas[i]); }
    else if (o.titulo && o.titulo.split(/\s+/).length >= 4 && o.tipo !== 'tesis' && sinDoi.length < 40) { sinDoi.push(o); posSin.push(i); }
  });
  buscarPorTexto_(sinDoi).forEach(function (m, k) {
    if (!m) return;
    var o = lista[posSin[k]];
    o.verificado = 'encontrado';
    aplicarMeta_(o, m);
  });
  var ya = {};
  if (correo) biblioteca_(correo).forEach(function (b) { if (b.doi) ya['d:' + b.doi] = b.clave_cita; ya['t:' + sinTildes_(b.titulo).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60)] = b.clave_cita; });
  lista.forEach(function (o, i) {
    o.i = i;
    if (!o.verificado) o.verificado = o.url ? 'manual' : 'no';
    o.confianza = o.verificado === 'crossref' || o.verificado === 'encontrado' ? 'alta' : (o.titulo && o.autores.length && o.anio ? 'media' : 'baja');
    var kt = 't:' + sinTildes_(o.titulo).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
    o.repetida = (o.doi && ya['d:' + o.doi]) || ya[kt] || '';
  });
  return { referencias: lista, total: lista.length };
}
function aplicarMeta_(o, m) {
  o.doi = m.doi || o.doi; o.titulo = m.titulo || o.titulo; o.anio = m.anio || o.anio;
  if (m.autores && m.autores.length) o.autores = m.autores;
  o.fuente = m.fuente || o.fuente; o.volumen = m.volumen || o.volumen; o.numero = m.numero || o.numero; o.paginas = m.paginas || o.paginas;
  o.editorial = m.editorial || o.editorial; o.tipo = m.tipo && m.tipo !== 'otro' ? m.tipo : o.tipo; o.resumen = m.resumen || ''; o.url = o.url || m.url || '';
}

/** Agrega a la biblioteca las referencias elegidas. Las repetidas (mismo DOI o mismo titulo) se omiten. */
function agregarReferencias_(correo, items, uso) {
  correo = normCorreo_(correo);
  var agregadas = [], omitidas = 0, errores = [];
  var usoOk = ['antecedente', 'teoria', 'contexto', 'metodologia'].indexOf(uso) >= 0 ? uso : 'teoria';
  (Array.isArray(items) ? items : []).slice(0, IMP_MAX_REFS_).forEach(function (o) {
    if (!o || typeof o !== 'object') return;
    var autores = Array.isArray(o.autores) ? o.autores.filter(function (a) { return a && a.apellido; }).map(function (a) { return { apellido: String(a.apellido).substring(0, 80), nombre: String(a.nombre || '').substring(0, 80) }; }) : parsearAutores_(o.autores);
    var titulo = String(o.titulo || '').trim().substring(0, 400);
    if (!titulo || !autores.length) { omitidas++; return; }
    var doi = limpiarDoi_(o.doi);
    var kt = sinTildes_(titulo).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
    var repetida = biblioteca_(correo).some(function (b) { return (doi && b.doi === doi) || sinTildes_(b.titulo).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60) === kt; });
    if (repetida) { omitidas++; return; }
    var tipo = ['articulo', 'tesis', 'libro', 'otro'].indexOf(o.tipo) >= 0 ? o.tipo : 'otro';
    var verificado = o.verificado === 'crossref' || o.verificado === 'encontrado' ? 'crossref' : (o.verificado === 'consensus' && doi ? 'openalex' : (urlSegura_(o.url) ? 'manual' : 'no'));
    var fila = {
      id: Utilities.getUuid(), correo: correo, clave_cita: claveCita_(correo, autores, String(o.anio || '').substring(0, 4)), tipo: tipo, uso: tipo === 'tesis' || tipo === 'articulo' ? (uso === 'auto' ? 'antecedente' : usoOk) : usoOk,
      doi: doi, url: urlSegura_(o.url) || (doi ? 'https://doi.org/' + doi : ''), autores: JSON.stringify(autores), anio: String(o.anio || '').replace(/[^0-9]/g, '').substring(0, 4), titulo: titulo,
      fuente: String(o.fuente || '').substring(0, 200), volumen: String(o.volumen || '').substring(0, 20), numero: String(o.numero || '').substring(0, 20), paginas: String(o.paginas || '').substring(0, 30),
      editorial: String(o.editorial || '').substring(0, 200), grado: tipo === 'tesis' ? String(o.grado || 'Tesis de pregrado').substring(0, 60) : '', indizacion: '', verificado: verificado,
      resumen: String(o.resumen || '').substring(0, 3000), objetivo: '', metodologia: '', resultados: '', conclusion: '', relacion: '', creado: ahora_(), sin_resolver: '', ambito: ''
    };
    try { conBloqueo_(function () { agregar_('Biblioteca', fila); }); agregadas.push(fila.id); } catch (e) { errores.push(titulo.substring(0, 60)); }
  });
  olvidar_('Biblioteca');
  tocar_(correo);
  return { agregadas: agregadas, omitidas: omitidas, errores: errores };
}

// ---------------------------------------------------------------- importar un plan de tesis
/** Valor limpio para un campo segun su tipo. Devuelve null si no se puede usar. */
function valorImportado_(campo, v) {
  if (campo.tipo === 'tabla') {
    var filas = Array.isArray(v) ? v : [];
    var claves = campo.columnas.map(function (c) { return c.clave; });
    var limpias = filas.slice(0, 40).map(function (f) {
      var o = {};
      claves.forEach(function (k) { o[k] = String(f && f[k] !== undefined && f[k] !== null ? f[k] : '').replace(/\s+/g, ' ').trim().substring(0, 1500); });
      return o;
    }).filter(function (o) { return claves.some(function (k) { return o[k]; }); });
    return limpias.length ? limpias : null;
  }
  var t = String(v === null || v === undefined ? '' : v).replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!t) return null;
  if (campo.tipo === 'opcion') {
    var ops = campo.opciones || [];
    var st = sinTildes_(t).toLowerCase();
    for (var i = 0; i < ops.length; i++) {
      var val = String(ops[i].valor !== undefined ? ops[i].valor : ops[i]);
      if (st.indexOf(sinTildes_(val).toLowerCase()) >= 0) return val;
    }
    return null;
  }
  if (campo.tipo === 'corto') t = t.split('\n')[0].substring(0, 700);
  return t.substring(0, 20000);
}

/**
 * Guarda lo que el estudiante eligio importar. a = { archivo, campos: {clave: texto}, tablas: {clave: filas},
 * referencias: texto, usoRefs, reemplazar, ia, resumen }. Los campos con texto solo se reemplazan si se pide;
 * lo anterior queda respaldado para poder deshacer la importacion.
 */
function importarPlan_(ses, a) {
  var correo = ses.correo;
  var exp = expediente_(correo);
  if (planCongelado_(exp)) throw new Error(MSJ_CONGELADO_);
  var porClave = Object.create(null);
  campos_().forEach(function (c) { porClave[c.clave] = c; });
  var valores = {}, respaldo = {}, saltados = [], nombres = [];
  var entrada = {};
  Object.keys(a.campos || {}).forEach(function (k) { entrada[k] = a.campos[k]; });
  Object.keys(a.tablas || {}).forEach(function (k) { entrada[k] = a.tablas[k]; });
  Object.keys(entrada).forEach(function (k) {
    var c = porClave[k];
    if (!c || /^_/.test(k)) return;
    var v = valorImportado_(c, entrada[k]);
    if (v === null) return;
    var previo = String(exp[k] || '').trim();
    if (previo && previo !== '[]' && !a.reemplazar) { saltados.push(c.etiqueta || k); return; }
    if (previo) respaldo[k] = exp[k];
    valores[k] = v;
    nombres.push(k);
  });
  var refs = { agregadas: [], omitidas: 0, errores: [] }, analizadas = 0;
  if (a.referencias && String(a.referencias).trim()) {
    var an = analizarReferenciasTexto_(a.referencias, correo);
    analizadas = an.total;
    refs = agregarReferencias_(correo, an.referencias.filter(function (o) { return !o.repetida && o.confianza !== 'baja'; }), a.usoRefs || 'auto');
    refs.omitidas += an.referencias.filter(function (o) { return o.repetida || o.confianza === 'baja'; }).length;
  }
  var res = a.resumen || {};
  var registro = {
    f: ahora_(), archivo: String(a.archivo || 'texto pegado').substring(0, 120), campos: nombres.filter(function (k) { return porClave[k].tipo !== 'tabla'; }).length,
    tablas: nombres.filter(function (k) { return porClave[k].tipo === 'tabla'; }).length, refs: refs.agregadas.length, refsLeidas: analizadas, ia: !!a.ia,
    secciones: parseInt(res.secciones, 10) || 0, palabras: parseInt(res.palabras, 10) || 0, claves: nombres, refIds: refs.agregadas
  };
  var historial = [];
  try { historial = exp._importaciones ? JSON.parse(exp._importaciones) : []; } catch (e) { historial = []; }
  historial.push({ f: registro.f, archivo: registro.archivo, campos: registro.campos, tablas: registro.tablas, refs: registro.refs, ia: registro.ia });
  valores._importacion = JSON.stringify(registro);
  valores._importaciones = JSON.stringify(historial.slice(-10));
  valores._imp_respaldo = JSON.stringify(respaldo);
  conBloqueo_(function () { guardarCampos_(correo, valores); });
  olvidar_('Expedientes');
  try { CacheService.getScriptCache().remove('tablero_v5'); } catch (e2) { /* sin cache */ }
  var est = estadoEstudiante_(correo);
  return { importacion: registro, saltados: saltados, omitidas: refs.omitidas, estado: est };
}

/** Deshace la ultima importacion: devuelve los campos a su valor anterior y quita las fuentes que agrego. */
function deshacerImportacion_(ses) {
  var correo = ses.correo;
  var exp = expediente_(correo);
  var reg = null, resp = {};
  try { reg = exp._importacion ? JSON.parse(exp._importacion) : null; resp = exp._imp_respaldo ? JSON.parse(exp._imp_respaldo) : {}; } catch (e) { reg = null; }
  if (!reg || reg.deshecha) throw new Error('No hay una importación que deshacer.');
  var valores = {};
  (reg.claves || []).forEach(function (k) { valores[k] = resp.hasOwnProperty(k) ? resp[k] : ''; });
  reg.deshecha = ahora_();
  valores._importacion = JSON.stringify(reg);
  valores._imp_respaldo = '';
  conBloqueo_(function () {
    guardarCampos_(correo, valores);
    var ids = reg.refIds || [];
    if (ids.length) {
      olvidar_('Biblioteca');
      var filas = leer_('Biblioteca', true).filter(function (b) { return normCorreo_(b.correo) === correo && ids.indexOf(b.id) >= 0; });
      filas.sort(function (x, y) { return y._fila - x._fila; }).forEach(function (b) { borrarFila_('Biblioteca', b._fila); });
    }
  });
  olvidar_('Expedientes');
  olvidar_('Biblioteca');
  return estadoEstudiante_(correo);
}

/** Resumen de la ultima importacion para los paneles ('' si nunca importo). */
function resumenImportacion_(exp) {
  try {
    var r = exp._importacion ? JSON.parse(exp._importacion) : null;
    if (!r) return null;
    return { f: r.f, archivo: r.archivo, campos: r.campos, tablas: r.tablas, refs: r.refs, ia: !!r.ia, deshecha: !!r.deshecha };
  } catch (e) { return null; }
}

// ---------------------------------------------------------------- BibTeX y RIS (exportaciones de Consensus, Zotero, Mendeley, Scopus)
function desdeBibtex_(t) {
  var out = [], re = /@(\w+)\s*\{\s*[^,]*,([\s\S]*?)\n\s*\}/g, m;
  while ((m = re.exec(t)) !== null) {
    var tipo = m[1].toLowerCase(), cuerpo = m[2], o = {};
    var rc = /(\w+)\s*=\s*(\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)"|(\d+))/g, c;
    while ((c = rc.exec(cuerpo)) !== null) o[c[1].toLowerCase()] = String(c[3] || c[4] || c[5] || '').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
    var au = String(o.author || '').split(/\s+and\s+/i).map(function (x) { x = x.trim(); if (!x) return null; var i = x.indexOf(','); return i >= 0 ? { apellido: x.substring(0, i).trim(), nombre: x.substring(i + 1).trim() } : partirNombre_(x); }).filter(function (x) { return x; });
    out.push({ autores: au, anio: o.year || '', titulo: o.title || '', fuente: o.journal || o.booktitle || o.school || o.publisher || '', volumen: o.volume || '', numero: o.number || '', paginas: (o.pages || '').replace(/-+/, '-'), doi: o.doi || '', url: o.url || '',
      tipo: /thesis/.test(tipo) ? 'tesis' : (tipo === 'book' ? 'libro' : (/article|inproceedings|proceedings/.test(tipo) ? 'articulo' : 'otro')), editorial: o.publisher || '', grado: /phd/.test(tipo) ? 'Tesis doctoral' : (/master/.test(tipo) ? 'Tesis de maestría' : ''), texto: (o.author || '') + ' (' + (o.year || '') + '). ' + (o.title || '') });
  }
  return out;
}
function desdeRis_(t) {
  var out = [], o = null;
  String(t).replace(/\r/g, '').split('\n').forEach(function (l) {
    var m = /^([A-Z][A-Z0-9])\s{2}-\s?(.*)$/.exec(l);
    if (!m) return;
    var k = m[1], v = m[2].trim();
    if (k === 'TY') { o = { autores: [], tipo: /THES/.test(v) ? 'tesis' : (/BOOK/.test(v) ? 'libro' : (/JOUR|CONF|CPAPER/.test(v) ? 'articulo' : 'otro')), anio: '', titulo: '', fuente: '', volumen: '', numero: '', paginas: '', doi: '', url: '' }; return; }
    if (!o) return;
    if (k === 'AU' || k === 'A1') { var i = v.indexOf(','); o.autores.push(i >= 0 ? { apellido: v.substring(0, i).trim(), nombre: v.substring(i + 1).trim() } : partirNombre_(v)); }
    else if (k === 'PY' || k === 'Y1' || k === 'DA') { if (!o.anio) o.anio = (v.match(/\d{4}/) || [''])[0]; }
    else if (k === 'TI' || k === 'T1') o.titulo = v;
    else if (k === 'JO' || k === 'T2' || k === 'JF' || k === 'PB') { if (!o.fuente) o.fuente = v; }
    else if (k === 'VL') o.volumen = v; else if (k === 'IS') o.numero = v;
    else if (k === 'SP') o.paginas = v; else if (k === 'EP') o.paginas = (o.paginas ? o.paginas + '-' : '') + v;
    else if (k === 'DO') o.doi = v; else if (k === 'UR') o.url = v;
    else if (k === 'ER') { o.texto = o.autores.map(function (a) { return a.apellido; }).join(', ') + ' (' + o.anio + '). ' + o.titulo; out.push(o); o = null; }
  });
  return out;
}

// ---------------------------------------------------------------- Consensus: busqueda academica con la clave del estudiante o del curso
var CONSENSUS_URL_ = 'https://api.consensus.app/v1/search';
function claveConsensus_(a) {
  var c = String((a && a.claveConsensus) || '').trim().replace(/^["'\s]+|["'\s]+$/g, '');
  if (c) { if (!/^[A-Za-z0-9_.\-]{16,300}$/.test(c)) throw new Error('Eso no parece una clave de la API de Consensus. Cópiala completa desde consensus.app/api-mcp, pestaña «Keys and clients».'); return c; }
  var p = props_().getProperty('CONSENSUS_API_KEY');
  if (p) return p;
  throw new Error('Falta tu clave de la API de Consensus. Pégala en Biblioteca, pestaña «Consensus».');
}
/** Busca en Consensus una o varias consultas (busqueda profunda) y devuelve los resultados unidos y sin repetir. */
function buscarConsensus_(ses, a) {
  var clave = claveConsensus_(a);
  var consultas = (Array.isArray(a.consultas) ? a.consultas : [a.q]).map(function (q) { return String(q || '').replace(/\s+/g, ' ').trim().substring(0, 300); }).filter(function (q) { return q.length >= 3; }).slice(0, 3);
  if (!consultas.length) throw new Error('Escribe qué quieres buscar (mejor en inglés).');
  var param = function (q) {
    var u = CONSENSUS_URL_ + '?query=' + encodeURIComponent(q) + '&page_size=' + Math.min(20, Math.max(5, parseInt(a.cuantos, 10) || 15));
    var y = parseInt(a.desde, 10);
    if (y >= 1950 && y <= 2100) u += '&year_min=' + y;
    if (/^(med|cs|psych|econ|eng|bio|edu|env|soc)$/.test(String(a.dominio || ''))) u += '&domain=' + a.dominio;
    if (a.tipo === 'revisiones') u += '&study_types=systematic%20review&study_types=meta-analysis';
    if (a.sinPreprints) u += '&exclude_preprints=true';
    return u;
  };
  var pedidos = consultas.map(function (q) { return { url: param(q), method: 'get', headers: { 'x-api-key': clave, Accept: 'application/json' }, muteHttpExceptions: true }; });
  var resp;
  try { resp = UrlFetchApp.fetchAll(pedidos); } catch (e) { throw new Error('Consensus no respondió. Intenta de nuevo en un minuto.'); }
  var vistos = {}, salida = [], errores = [];
  var ya = {};
  biblioteca_(ses.correo).forEach(function (b) { if (b.doi) ya[b.doi] = b.clave_cita; ya['t:' + sinTildes_(b.titulo).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60)] = b.clave_cita; });
  resp.forEach(function (r, i) {
    var cod = r.getResponseCode();
    if (cod === 401 || cod === 403) { errores.push('Consensus no aceptó la clave (código ' + cod + ').'); return; }
    if (cod === 429) { errores.push('Llegaste al límite de consultas de tu plan de Consensus (el gratuito trae 30 al mes).'); return; }
    if (cod !== 200) { errores.push('Consensus respondió con el código ' + cod + '.'); return; }
    var d;
    try { d = JSON.parse(r.getContentText()); } catch (e2) { errores.push('Consensus devolvió una respuesta ilegible.'); return; }
    (d.results || []).forEach(function (x) {
      var doi = limpiarDoi_(x.doi);
      var kt = 't:' + sinTildes_(x.title).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 60);
      if (vistos[doi || kt]) return;
      vistos[doi || kt] = 1;
      salida.push({ titulo: sinEtiquetas_(x.title).substring(0, 400), autores: (x.authors || []).slice(0, 20).map(function (n) { return partirNombre_(String(n)); }), anio: String(x.publish_year || ''), doi: doi,
        fuente: String(x.journal_name || '').substring(0, 200), volumen: String(x.volume || ''), paginas: String(x.pages || ''), editorial: String(x.publisher_name || ''), resumen: sinEtiquetas_(x.abstract).substring(0, 2500),
        hallazgo: sinEtiquetas_(x.takeaway).substring(0, 500), tipoEstudio: String(x.study_type || ''), citas: parseInt(x.citation_count, 10) || 0, cuartil: x.sjr_best_quartile || '', muestra: x.sample_size || '', url: urlSegura_(x.url),
        preprint: !!x.is_preprint, consulta: i, ya: (doi && ya[doi]) || ya[kt] || '' });
    });
  });
  if (!salida.length && errores.length) throw new Error(errores[0]);
  return { resultados: salida, consultas: consultas, avisos: errores, origen: 'Consensus' };
}

/** Guarda en la tesis lo elegido del estado del arte: brechas, declaracion de brecha, sintesis y preguntas abiertas. */
function guardarEstadoArte_(ses, a) {
  var correo = ses.correo, exp = expediente_(correo), mapa = mapaBiblioteca_(biblioteca_(correo));
  var limpio = function (t, n) { return depurarCitas_(String(t || '').replace(/\s+/g, ' ').trim().substring(0, n || 3000), mapa).texto; };
  var e = a.estado || {};
  var valores = {};
  var brechas = (Array.isArray(a.brechas) ? a.brechas : []).slice(0, 12).map(function (b) { return { brecha: limpio(b.brecha, 600), estudios: limpio(b.estudios, 400), respuesta: limpio(b.respuesta, 600) }; }).filter(function (b) { return b.brecha; });
  if (brechas.length) valores.brechas = tabla_(exp, 'brechas').concat(brechas);
  if (e.declaracion_brecha && (!String(exp.declaracion_brecha || '').trim() || a.reemplazar)) valores.declaracion_brecha = limpio(e.declaracion_brecha, 600);
  if (a.sintesis && e.sintesis) {
    var prev = String(exp.contexto_internacional || '').trim();
    valores.contexto_internacional = (prev ? prev + '\n' : '') + limpio(e.sintesis, 4000);
  }
  var guardado = { f: ahora_(), sintesis: limpio(e.sintesis, 4000), tendencias: (e.tendencias || []).slice(0, 8).map(function (x) { return limpio(x, 400); }), preguntas: (e.preguntas_abiertas || []).slice(0, 10).map(function (x) { return limpio(x, 400); }),
    metodos: (e.metodos || []).slice(0, 8).map(function (x) { return limpio(x, 300); }), consultas: (a.consultas || []).slice(0, 3).map(function (x) { return String(x).substring(0, 200); }) };
  // Con el plan aprobado, el estado del arte se guarda, pero no toca los campos congelados
  camposBloqueados_(exp, Object.keys(valores)).forEach(function (k) { delete valores[k]; });
  valores._estado_arte = JSON.stringify(guardado);
  conBloqueo_(function () { guardarCampos_(correo, valores); });
  olvidar_('Expedientes');
  return estadoEstudiante_(correo);
}

/**
 * Documento.gs - Genera el plan (proyecto) de tesis en Google Docs siguiendo la pestana Plantilla.
 */

var CM_ = 28.3465; // puntos por centimetro

/**
 * Un solo generador con dos salidas. Con D.body escribe el documento de Google Docs; con D.vista = true
 * no toca Google Docs y deja en D.bloques una lista de piezas (titulos, parrafos, tablas) con la que el
 * navegador pinta la pagina en vivo. Asi la vista previa y el documento nunca se contradicen.
 */
function nuevoD_(correo, a) {
  var exp = expediente_(correo);
  var bib = biblioteca_(correo);
  var D = {
    exp: exp, bib: bib, mapa: mapaBiblioteca_(bib), usadas: {}, faltan: [], pendientes: 0,
    fuente: cfg_('FUENTE', 'Arial'), tam: cfgNum_('TAMANO_FUENTE', 12), inter: cfgNum_('INTERLINEADO', 1.5),
    nTabla: 0, nFigura: 0, correo: correo, imagenArbol: a && a.imagenArbol ? a.imagenArbol : '',
    vista: false, bloques: [], seccion: '', sid: '', hashes: {}, titulos: null, nivel4: 0, estilo: estiloDe_(exp)
  };
  iniciarCitas_(D.estilo);
  // Las fuentes citadas son las del texto mas todos los antecedentes (que se citan en el capitulo II)
  clavesEn_(textoCompleto_(exp)).forEach(function (k) { if (D.mapa[k]) D.usadas[k] = true; });
  bib.forEach(function (b) { if (b.uso === 'antecedente') D.usadas[b.clave_cita] = true; });
  return D;
}

/** Campo del formulario al que lleva cada seccion de la plantilla (para ir de la pagina al campo). */
function campoDeSeccion_(s) {
  if (s.tipo === 'campo' || s.tipo === 'lista' || s.tipo === 'tabla') return s.fuente;
  if (s.tipo !== 'especial') return '';
  var m = { antecedentes_nacionales: '#biblioteca', antecedentes_internacionales: '#biblioteca', referencias: '#biblioteca', terminos: 'terminos', definiciones: 'defconc_v1',
    justificacion: 'just_teorica', enfoque: 'enfoque', diseno: 'diseno', metodo: 'metodo', poblacion: 'poblacion', tecnicas: 'tecnicas_instrumentos', analisis: 'analisis',
    cronograma: 'cronograma', presupuesto: 'presupuesto', matriz_consistencia: 'problema_general', esquema_artefacto: 'esquema_artefacto', arbol_problemas: 'problema_central' };
  return m[s.fuente] || '';
}

var ROMANOS_ = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
var LETRAS_ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Identificador estable de una seccion para su revision ('' = no se revisa). */
function idSeccion_(s) {
  if (s.tipo === 'caratula') return 'caratula';
  if (s.tipo === 'campo' || s.tipo === 'lista' || s.tipo === 'tabla' || s.tipo === 'especial') return s.fuente;
  return '';
}

/**
 * Recorre la plantilla y escribe cada seccion en la salida que tenga D.
 * Numeracion como en el modelo de la escuela: I., 1.1, 1.2.1 y A. Los anexos: «Anexo 01».
 * Con soloTitulos = true no escribe nada: devuelve la lista de titulos para el indice.
 */
function recorrer_(D, soloTitulos) {
  var exp = D.exp;
  var cap = 0, n2 = 0, n3 = 0, n4 = 0, anexo = 0;
  var titulos = [];
  plantilla_().forEach(function (s) {
    if (!aplica_(s.aplica, exp)) return;
    D.seccion = campoDeSeccion_(s);
    var titulo = sust_(sust_(s.titulo, '{var1}', mayuscula_(exp.var1 || 'variable independiente')), '{var2}', mayuscula_(exp.var2 || 'variable dependiente'));
    var rotulo = '', nivel = 0;
    if (s.tipo === 'caratula' || s.tipo === 'indice') {
      if (soloTitulos) return;
    } else if (s.nivel === '1') {
      cap++; n2 = 0; n3 = 0; n4 = 0;
      rotulo = (ROMANOS_[cap - 1] || String(cap)) + '. ' + titulo; nivel = 1;
    } else if (s.nivel === '2') {
      n2++; n3 = 0; n4 = 0;
      rotulo = cap + '.' + n2 + ' ' + titulo; nivel = 2;
    } else if (s.nivel === '3') {
      n3++; n4 = 0;
      rotulo = cap + '.' + n2 + '.' + n3 + ' ' + titulo; nivel = 3;
    } else if (s.nivel === '4') {
      n4++;
      rotulo = LETRAS_.charAt(n4 - 1) + '. ' + titulo; nivel = 4;
    } else if (s.nivel === 'A') {
      anexo++;
      rotulo = 'Anexo ' + (anexo < 10 ? '0' + anexo : anexo) + ': ' + titulo; nivel = 2;
    }
    if (soloTitulos) { titulos.push({ n: s.nivel === 'A' ? 3 : nivel, x: rotulo }); return; }
    if (s.nivel === '1') D.cap = titulo;
    else if (s.nivel === 'A') D.cap = 'ANEXOS';
    if (s.tipo === 'caratula') { D.cap = 'CARÁTULA'; seccionRevisable_(D, 'caratula', 'Carátula', function () { caratula_(D); }); return; }
    if (s.tipo === 'indice') { saltoPagina_(D); indiceDoc_(D, titulo); return; }
    if (nivel === 1 || (s.nivel === 'A' && anexo > 1)) saltoPagina_(D);
    tituloDoc_(D, rotulo, nivel);
    var id = idSeccion_(s);
    if (id) seccionRevisable_(D, id, rotulo, function () { contenido_(D, s); });
    else contenido_(D, s);
  });
  return titulos;
}

/** En la vista, marca el comienzo de una seccion revisable y calcula la huella de su contenido. */
function seccionRevisable_(D, id, titulo, escribir) {
  if (!D.vista) { escribir(); return; }
  var pos = D.bloques.length;
  D.bloques.push({ t: 'rev', id: id, x: titulo });
  D.sid = id;
  escribir();
  D.sid = '';
  var partes = D.bloques.slice(pos + 1).map(function (b) {
    if (b.t === 'ley') return 'ley:' + b.x;
    if (b.t === 'salto' || b.t === 'logo') return '';
    return JSON.stringify(b);
  });
  D.hashes[id] = (D.hashes[id] ? D.hashes[id] + ':' : '') + huella_(partes.join('|'));
  D.titulosSec = D.titulosSec || {};
  D.titulosSec[id] = titulo;
  D.bloqueSec = D.bloqueSec || {};
  D.bloqueSec[id] = D.cap || '';
}

/** Huella corta de un texto (FNV-1a de 32 bits): basta para saber si una seccion cambio. */
function huella_(s) {
  var h = 0x811c9dc5;
  s = String(s);
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
  return ('0000000' + h.toString(16)).slice(-8);
}

/** Indice como en el modelo de la escuela: la lista de titulos con su numeracion. */
function indiceDoc_(D, titulo) {
  tituloDoc_(D, titulo, 1);
  var lista = recorrer_(nuevoDSinDatos_(D), true);
  lista.forEach(function (x) {
    var sangria = [0, 0, 0.8, 1.6, 2.4][x.n] || 0;
    if (D.vista) { D.bloques.push({ t: 'idx', n: x.n, x: x.x }); return; }
    var p = nuevoParrafo_(D, x.x);
    p.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(1.15).setSpacingBefore(0).setSpacingAfter(2).setIndentFirstLine(sangria * CM_).setIndentStart(sangria * CM_);
    estilo_(p, D, { negrita: x.n === 1 });
  });
}
function nuevoDSinDatos_(D) { return { cap: D.cap, exp: D.exp, bib: D.bib, mapa: D.mapa, usadas: {}, faltan: [], pendientes: 0, vista: true, bloques: [], hashes: {} }; }

/** Estado de revision de cada seccion: revisado (la huella coincide), devuelto o por revisar. */
/** Bloques que el Reglamento de Similitud excluye del analisis (Art. 8 y 12): caratula, indice, referencias y anexos. */
function bloqueExcluido_(b) { return /^(CAR[AÁ]TULA|REFERENCIAS|ANEXOS|[IÍ]NDICE)/i.test(String(b || '')); }

function estadoRevision_(exp, hashes, titulos, bloques) {
  bloques = bloques || {};
  var rev = {};
  try { rev = exp._revision ? JSON.parse(exp._revision) : {}; } catch (e) { rev = {}; }
  var secciones = Object.keys(hashes).map(function (id) {
    var r = rev[id];
    var estado = 'por_revisar';
    if (r && r.e === 'devuelto') estado = 'devuelto';
    else if (r && r.e === 'ok' && r.h === hashes[id]) estado = 'revisado';
    return { id: id, titulo: titulos[id] || id, estado: estado, comentario: r && r.e === 'devuelto' ? (r.c || '') : '', por: r ? (r.por || '') : '', fecha: r ? (r.f || '') : '', cambio: !!(r && r.e === 'ok' && r.h !== hashes[id]), bloque: bloques[id] || '', excluida: bloqueExcluido_(bloques[id]) };
  });
  var n = secciones.filter(function (x) { return x.estado === 'revisado'; }).length;
  return { secciones: secciones, revisadas: n, total: secciones.length, completa: secciones.length > 0 && n === secciones.length };
}

/** La pagina en vivo: las mismas piezas que tendra el documento, sin crear nada en Google Docs. */
function vistaPrevia_(correo) {
  var k = claveEst_('vp2', correo);
  var c = CACHE_[k] || cacheTraer_(k);
  if (c) return c;
  var v = vistaPreviaCalc_(correo);
  CACHE_[k] = v;
  cachePoner_(k, v, 21600);
  return v;
}

function vistaPreviaCalc_(correo) {
  var D = nuevoD_(correo, null);
  D.vista = true;
  recorrer_(D);
  var r = estadoRevision_(D.exp, D.hashes, D.titulosSec || {}, D.bloqueSec || {});
  return { bloques: D.bloques, pendientes: D.pendientes, citasRotas: D.faltan, revision: r, hashes: D.hashes, estilo: D.estilo, numCitas: CACHE_.citas ? CACHE_.citas.num : {} };
}

/** Cuenta las marcas pendientes de un texto (solo para la vista: en el documento las cuenta resaltar_). */
function contarPendientes_(D, texto) {
  var m = String(texto).match(/\[(por completar|cita no encontrada)[^\]]*\]/gi);
  if (m) D.pendientes += m.length;
}

/** Escudo de la caratula: el archivo de Drive configurado o, si no hay, el incluido en la aplicacion. */
function escudo_() {
  var id = cfg_('LOGO_ARCHIVO_ID', '');
  if (id) { try { return DriveApp.getFileById(id).getBlob(); } catch (e) { /* se intenta con el incluido */ } }
  if (cfg_('ESCUDO_INCLUIDO', 'SI') !== 'SI') return null;
  return Utilities.newBlob(Utilities.base64Decode(ESCUDO_UNDC_), 'image/jpeg', 'escudo.jpg');
}

/** El escudo como imagen para la vista previa del navegador. */
function escudoParaVista_() {
  var id = cfg_('LOGO_ARCHIVO_ID', '');
  if (id) {
    try {
      var b = DriveApp.getFileById(id).getBlob();
      var bytes = b.getBytes();
      if (bytes.length <= 400000) return { imagen: 'data:' + (b.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(bytes) };
    } catch (e) { /* se usa el incluido */ }
  }
  if (cfg_('ESCUDO_INCLUIDO', 'SI') !== 'SI') return { imagen: '' };
  return { imagen: 'data:image/jpeg;base64,' + ESCUDO_UNDC_ };
}

function generarPlan_(ses, a) { return generarPlanDe_(ses.correo, a); }

/** Genera (o rehace) el plan de un estudiante. Tambien lo usa la aprobacion del plan para guardar su copia fija. */
function generarPlanDe_(correo, a) {
  var u = usuario_(correo);
  var D = nuevoD_(correo, a);
  var exp = D.exp;

  var nombreDoc = 'Plan de tesis - ' + (exp.autor1 || u.nombre);
  var doc = null;
  if (exp._plan_id) { try { doc = DocumentApp.openById(exp._plan_id); } catch (e) { doc = null; } }
  var nuevo = false;
  var body = null;
  if (doc) {
    // Se agrega un parrafo antes de vaciar: un cuerpo que termina en tabla o lista no siempre se deja limpiar
    try { body = doc.getBody(); body.appendParagraph(''); body.clear(); }
    catch (e0) { doc = null; body = null; }
  }
  if (!doc) { doc = DocumentApp.create(nombreDoc); nuevo = true; body = doc.getBody(); body.clear(); }
  var izq = cfgNum_('MARGEN_IZQ_CM', 2.54) * CM_;
  var otros = cfgNum_('MARGEN_OTROS_CM', 2.54) * CM_;
  var carta = String(cfg_('PAPEL', 'carta')).toLowerCase() !== 'a4';
  var anchoPag = carta ? 612 : 595.28, altoPag = carta ? 792 : 841.89;
  body.setPageWidth(anchoPag).setPageHeight(altoPag);
  body.setMarginLeft(izq).setMarginRight(otros).setMarginTop(otros).setMarginBottom(otros);
  D.body = body;
  D.ancho = anchoPag - izq - otros;
  D.primero = true;

  recorrer_(D);

  doc.saveAndClose();
  var id = doc.getId();
  var archivo = DriveApp.getFileById(id);
  if (nuevo) {
    try { archivo.moveTo(carpetaEstudiante_(u, exp)); } catch (e2) { /* queda en Mi unidad */ }
  }
  var compartido = true;
  try {
    if (cfg_('COMPARTIR_PLAN', 'enlace') === 'correo') {
      archivo.addViewer(correo);
      if (u.asesor) { try { archivo.addViewer(u.asesor); } catch (e4) { /* el asesor lo abre desde la cuenta propietaria */ } }
    } else {
      archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  } catch (e3) { compartido = false; }
  var url = urlDoc_(id, 'ver');
  conBloqueo_(function () {
    olvidar_('Expedientes');
    guardarCampo_(correo, '_plan_id', id);
    guardarCampo_(correo, '_plan_url', url);
    guardarCampo_(correo, '_plan_fecha', ahora_());
  });
  return { id: id, url: url, docx: urlDoc_(id, 'docx'), pdf: urlDoc_(id, 'pdf'), fecha: ahora_(), pendientes: D.pendientes, citasRotas: D.faltan, compartido: compartido };
}

function carpetaEstudiante_(u, exp) {
  var raizId = props_().getProperty('CARPETA_ID');
  var raiz = raizId ? DriveApp.getFolderById(raizId) : DriveApp.getRootFolder();
  var nombre = (exp.autor1 || u.nombre) + ' (' + u.correo + ')';
  var it = raiz.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : raiz.createFolder(nombre);
}

function mayuscula_(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.substring(1); }

// ---------------------------------------------------------------- piezas de formato
function estilo_(el, D, o) {
  o = o || {};
  var t = el.editAsText();
  t.setFontFamily(D.fuente).setFontSize(o.tam || D.tam).setBold(!!o.negrita).setItalic(!!o.cursiva).setForegroundColor('#000000');
  return el;
}

function nuevoParrafo_(D, texto) {
  var p;
  if (D.primero) { p = D.body.getChild(0).asParagraph(); p.setText(texto); D.primero = false; }
  else { p = D.body.appendParagraph(texto); }
  p.setHeading(DocumentApp.ParagraphHeading.NORMAL);
  return p;
}

function saltoPagina_(D) {
  if (D.vista) { if (D.bloques.length) D.bloques.push({ t: 'salto' }); return; }
  if (D.primero) return;
  D.body.appendPageBreak();
}

function tituloDoc_(D, texto, nivel) {
  if (D.vista) { D.bloques.push({ t: 'h', n: nivel, x: texto, f: D.seccion || '' }); return null; }
  var p = nuevoParrafo_(D, texto);
  var H = DocumentApp.ParagraphHeading;
  p.setHeading([H.HEADING1, H.HEADING1, H.HEADING2, H.HEADING3, H.HEADING4][nivel] || H.HEADING4);
  p.setAlignment(nivel === 1 ? DocumentApp.HorizontalAlignment.CENTER : DocumentApp.HorizontalAlignment.LEFT);
  p.setLineSpacing(D.inter).setSpacingBefore(nivel === 1 ? 0 : 10).setSpacingAfter(8).setIndentFirstLine(0).setIndentStart(nivel === 4 ? 0.6 * CM_ : 0);
  estilo_(p, D, { negrita: nivel < 4, cursiva: nivel >= 3, tam: nivel === 1 ? D.tam + 2 : D.tam });
  return p;
}

function resaltar_(p, D) {
  var s = p.getText();
  var re = /\[(por completar|cita no encontrada)[^\]]*\]/gi;
  var m;
  var t = p.editAsText();
  while ((m = re.exec(s)) !== null) {
    t.setBackgroundColor(m.index, m.index + m[0].length - 1, '#FFF2CC');
    D.pendientes++;
  }
}

/** Escribe un texto (puede tener varios parrafos) con las citas resueltas. */
function texto_doc_(D, texto, o) {
  o = o || {};
  var partes = String(texto || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return s; });
  var ultimo = null;
  partes.forEach(function (s) {
    var r = resolverCitas_(s, D.mapa, D.usadas, D.faltan);
    if (D.vista) {
      contarPendientes_(D, r);
      D.bloques.push({ t: 'p', x: r, a: o.centro ? 'c' : 'j', s: (o.sinSangria || o.centro) ? 0 : 1, b: o.negrita ? 1 : 0, d: o.tam ? o.tam - D.tam : 0, k: o.campo || '', pend: o.pend ? 1 : 0 });
      return;
    }
    var p = nuevoParrafo_(D, r);
    p.setAlignment(o.centro ? DocumentApp.HorizontalAlignment.CENTER : DocumentApp.HorizontalAlignment.JUSTIFY);
    p.setLineSpacing(D.inter).setSpacingBefore(0).setSpacingAfter(6).setIndentStart(0).setIndentFirstLine(o.sinSangria || o.centro ? 0 : 1.25 * CM_);
    estilo_(p, D, o);
    resaltar_(p, D);
    ultimo = p;
  });
  return ultimo;
}

/** Marca de algo que falta. campo: el campo del formulario que la llenaria (solo le sirve a la vista). */
function nota_(D, texto, campo) { return texto_doc_(D, '[por completar: ' + texto + ']', { sinSangria: true, pend: true, campo: campo || D.seccion || '' }); }

function campoDoc_(D, clave, etiqueta) {
  var v = String(D.exp[clave] || '').trim();
  if (!v) { nota_(D, etiqueta || clave, clave); return; }
  texto_doc_(D, v, { campo: clave });
}

/** Parrafo con un rotulo en negrita o cursiva seguido de texto normal. */
function rotulado_(D, rotulo, texto, o) {
  o = o || {};
  var r = resolverCitas_(String(texto || ''), D.mapa, D.usadas, D.faltan);
  if (D.vista) { contarPendientes_(D, r); D.bloques.push({ t: 'rot', r: rotulo, x: r, cur: o.cursiva ? 1 : 0, s: o.sangria ? 1 : 0, k: o.campo || '' }); return null; }
  var p = nuevoParrafo_(D, rotulo + ' ' + r);
  p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY).setLineSpacing(D.inter).setSpacingBefore(0).setSpacingAfter(6).setIndentStart(0).setIndentFirstLine(o.sangria ? 1.25 * CM_ : 0);
  estilo_(p, D, {});
  if (rotulo.length) {
    var t = p.editAsText();
    if (o.cursiva) t.setItalic(0, rotulo.length - 1, true); else t.setBold(0, rotulo.length - 1, true);
  }
  resaltar_(p, D);
  return p;
}

/** Rotulo APA 7: «Tabla 1» en negrita y, debajo, el titulo en cursiva. */
function leyenda_(D, tipo, titulo) {
  var n = tipo === 'Tabla' ? ++D.nTabla : ++D.nFigura;
  var rot = tipo + ' ' + n;
  if (D.vista) { D.bloques.push({ t: 'ley', r: rot, x: titulo }); return; }
  var p = nuevoParrafo_(D, rot);
  p.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(D.inter).setSpacingBefore(10).setSpacingAfter(0).setIndentFirstLine(0).setIndentStart(0);
  estilo_(p, D, { negrita: true });
  var q = nuevoParrafo_(D, titulo);
  q.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(D.inter).setSpacingBefore(0).setSpacingAfter(4).setIndentFirstLine(0).setIndentStart(0);
  estilo_(q, D, {});
  q.editAsText().setItalic(true);
}

/** Nota al pie de una tabla, en formato APA 7. */
function notaTabla_(D, texto) {
  if (D.vista) { D.bloques.push({ t: 'tnota', x: texto }); return; }
  var p = nuevoParrafo_(D, 'Nota. ' + texto);
  p.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(1.15).setSpacingBefore(2).setSpacingAfter(8).setIndentFirstLine(0).setIndentStart(0);
  estilo_(p, D, { tam: D.tam - 2 });
  p.editAsText().setItalic(0, 4, true);
}

/** Tabla con encabezado sombreado. anchos: proporciones; o.tam: tamano de letra; o.sombras: [[fila, col]] */
function tablaDoc_(D, encabezados, filas, anchos, o) {
  o = o || {};
  var celdas = [encabezados].concat(filas).map(function (f) { return f.map(function (c) { return resolverCitas_(String(c === null || c === undefined ? '' : c), D.mapa, D.usadas, D.faltan); }); });
  var tam = o.tam || (D.tam - 2);
  if (D.vista) { D.bloques.push({ t: 'tabla', c: celdas, an: anchos || null, so: o.sombras || null, ne: o.negritaFilas || null, d: tam - D.tam, f: D.seccion || '' }); if (o.nota !== false) notaTabla_(D, o.nota || 'Elaboración propia.'); return null; }
  if (D.primero) { nuevoParrafo_(D, ''); }
  var t = D.body.appendTable(celdas);
  t.setBorderWidth(0.5).setBorderColor('#000000');
  var suma = 0;
  if (anchos) anchos.forEach(function (x) { suma += x; });
  for (var i = 0; i < t.getNumRows(); i++) {
    var fila = t.getRow(i);
    for (var j = 0; j < fila.getNumCells(); j++) {
      var c = fila.getCell(j);
      c.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(4).setPaddingRight(4);
      var tx = c.editAsText();
      tx.setFontFamily(D.fuente).setFontSize(tam).setBold(i === 0 || !!(o.negritaFilas && o.negritaFilas.indexOf(i) >= 0)).setItalic(false).setForegroundColor('#000000');
      if (i === 0) c.setBackgroundColor('#FFFFFF');
      for (var k = 0; k < c.getNumChildren(); k++) {
        var hijo = c.getChild(k);
        if (hijo.getType() === DocumentApp.ElementType.PARAGRAPH) {
          hijo.asParagraph().setLineSpacing(1.0).setSpacingAfter(0).setSpacingBefore(0).setAlignment(i === 0 ? DocumentApp.HorizontalAlignment.CENTER : DocumentApp.HorizontalAlignment.LEFT);
        }
      }
    }
  }
  if (anchos && suma > 0) {
    for (var q = 0; q < anchos.length; q++) { t.setColumnWidth(q, D.ancho * anchos[q] / suma); }
  }
  if (o.sombras) {
    o.sombras.forEach(function (s) { t.getRow(s[0]).getCell(s[1]).setBackgroundColor(s[2] || '#5B4FE8'); });
  }
  if (o.nota !== false) notaTabla_(D, o.nota || 'Elaboración propia.');
  else { var fin = D.body.appendParagraph(''); fin.setHeading(DocumentApp.ParagraphHeading.NORMAL).setSpacingAfter(4).setSpacingBefore(0).setLineSpacing(1.0); }
  return t;
}

// ---------------------------------------------------------------- contenido por seccion
function contenido_(D, s) {
  var exp = D.exp;
  if (s.tipo === 'titulo') return;
  if (s.tipo === 'nota') { nota_(D, s.fuente); return; }
  if (s.tipo === 'campo') { campoDoc_(D, s.fuente, s.titulo); return; }
  var campo = campoPorClave_(s.fuente);
  if (s.tipo === 'lista') {
    var filas = tabla_(exp, s.fuente).filter(function (f) { return String(f.texto || '').trim(); });
    if (!filas.length) { nota_(D, s.titulo); return; }
    var primero = null;
    filas.forEach(function (f) {
      if (D.vista) { D.bloques.push({ t: 'li', x: resolverCitas_(f.texto, D.mapa, D.usadas, D.faltan), f: s.fuente }); return; }
      var li = D.body.appendListItem(resolverCitas_(f.texto, D.mapa, D.usadas, D.faltan));
      if (primero) li.setListId(primero); else primero = li;
      li.setGlyphType(DocumentApp.GlyphType.BULLET).setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY).setLineSpacing(D.inter).setSpacingAfter(4);
      estilo_(li, D, {});
    });
    return;
  }
  if (s.tipo === 'tabla') {
    var datos = tabla_(exp, s.fuente);
    if (!datos.length || !campo) { nota_(D, s.titulo); return; }
    leyenda_(D, 'Tabla', mayuscula_(String(s.titulo).replace(/\{var\d\}/g, '')));
    tablaDoc_(D, campo.columnas.map(function (c) { return c.etiqueta; }), datos.map(function (f) { return campo.columnas.map(function (c) { return f[c.clave] || ''; }); }), null, { tam: campo.columnas.length > 4 ? D.tam - 3 : D.tam - 2 });
    return;
  }
  if (s.tipo !== 'especial') return;

  var f = s.fuente;
  if (f === 'antecedentes_nacionales' || f === 'antecedentes_internacionales') {
    var amb = f === 'antecedentes_nacionales' ? 'nacional' : 'internacional';
    var lista = D.bib.filter(function (b) { return b.uso === 'antecedente' && (amb === 'nacional' ? b.ambito === 'nacional' : b.ambito !== 'nacional'); });
    lista.sort(function (x, y) { return (parseInt(y.anio, 10) || 0) - (parseInt(x.anio, 10) || 0); });
    if (!lista.length) nota_(D, 'agregue antecedentes ' + (amb === 'nacional' ? 'nacionales' : 'internacionales') + ' a la biblioteca e indique su ámbito');
    lista.forEach(function (b) { texto_doc_(D, parrafoAntecedente_(b)); });
    if (amb === 'internacional') {
      var br = tabla_(exp, 'brechas');
      if (br.length) {
        leyenda_(D, 'Tabla', 'Síntesis de los antecedentes: lo que dejan sin resolver');
        tablaDoc_(D, ['Brecha', 'Estudios que la muestran', 'Cómo la atiende esta investigación'], br.map(function (x) { return [x.brecha || '', x.estudios || '', x.respuesta || '']; }), [36, 26, 38]);
      }
      if (exp.declaracion_brecha) texto_doc_(D, exp.declaracion_brecha, { campo: 'declaracion_brecha' });
    }
    return;
  }
  if (f === 'justificacion') {
    [['just_teorica', 'Justificación teórica.'], ['just_practica', 'Justificación práctica.'], ['just_metodologica', 'Justificación metodológica.'], ['just_social', 'Justificación social.']].forEach(function (x) {
      if (exp[x[0]]) rotulado_(D, x[1], exp[x[0]], { sangria: true, campo: x[0] }); else nota_(D, x[1].replace('.', '').toLowerCase(), x[0]);
    });
    return;
  }
  if (f === 'metodo') {
    campoDoc_(D, 'metodo', 'método de investigación');
    if (exp.tipo_proyecto === 'artefacto') {
      if (exp.problema_diseno) rotulado_(D, 'Problema de diseño.', exp.problema_diseno, { sangria: true, campo: 'problema_diseno' });
      if (exp.artefacto_descripcion) rotulado_(D, 'Descripción del artefacto.', exp.artefacto_descripcion, { sangria: true, campo: 'artefacto_descripcion' });
      else nota_(D, 'descripción del artefacto', 'artefacto_descripcion');
      var comp = tabla_(exp, 'artefacto_componentes');
      if (comp.length) {
        leyenda_(D, 'Tabla', 'Componentes y tecnologías del artefacto');
        tablaDoc_(D, ['Componente', 'Función', 'Tecnología'], comp.map(function (x) { return [x.componente || '', x.funcion || '', x.tecnologia || '']; }), [25, 45, 30]);
      }
    }
    return;
  }
  if (f === 'poblacion') {
    [['poblacion', 'Población.'], ['muestra', 'Muestra.'], ['muestreo', 'Muestreo.']].forEach(function (x) {
      if (exp[x[0]]) rotulado_(D, x[1], exp[x[0]], { sangria: true, campo: x[0] }); else nota_(D, x[1].replace('.', '').toLowerCase(), x[0]);
    });
    return;
  }
  if (f === 'tecnicas') {
    var ti = tabla_(exp, 'tecnicas_instrumentos');
    if (ti.length) {
      leyenda_(D, 'Tabla', 'Técnicas e instrumentos de recolección de datos');
      tablaDoc_(D, ['Técnica', 'Instrumento', 'Qué mide'], ti.map(function (x) { return [x.tecnica || '', x.instrumento || '', x.mide || '']; }), [28, 30, 42]);
    } else nota_(D, 'técnicas e instrumentos', 'tecnicas_instrumentos');
    if (exp.procedimiento) rotulado_(D, 'Procedimiento, validez y confiabilidad.', exp.procedimiento, { sangria: true, campo: 'procedimiento' });
    else nota_(D, 'procedimiento de recolección, validez y confiabilidad', 'procedimiento');
    return;
  }
  if (f === 'analisis') {
    campoDoc_(D, 'analisis', 'técnicas de análisis de datos');
    if (exp.etica) rotulado_(D, 'Consideraciones éticas.', exp.etica, { sangria: true, campo: 'etica' });
    else nota_(D, 'consideraciones éticas', 'etica');
    return;
  }
  if (f === 'terminos') {
    var ts = tabla_(exp, 'terminos').filter(function (x) { return x.termino; });
    if (!ts.length) { nota_(D, s.titulo); return; }
    ts.sort(function (x, y) { return sinTildes_(x.termino).toLowerCase() < sinTildes_(y.termino).toLowerCase() ? -1 : 1; });
    ts.forEach(function (x) { rotulado_(D, puntoFinal_(mayuscula_(x.termino)), x.definicion, { sangria: true }); });
    return;
  }
  if (f === 'definiciones') {
    [['var1', 'defconc_v1'], ['var2', 'defconc_v2']].forEach(function (par) {
      if (exp[par[1]]) rotulado_(D, puntoFinal_(mayuscula_(exp[par[0]] || 'Variable')), exp[par[1]], { sangria: true, campo: par[1] });
      else nota_(D, 'definición conceptual de ' + (exp[par[0]] || 'la variable'), par[1]);
    });
    return;
  }
  if (f === 'enfoque') {
    if (exp.enfoque || exp.tipo_inv || exp.nivel_inv) {
      texto_doc_(D, 'La investigación tiene enfoque ' + String(exp.enfoque || '[por completar: enfoque]').toLowerCase() + ', es de tipo ' + String(exp.tipo_inv || '[por completar: tipo]').toLowerCase() + ' y de nivel ' + String(exp.nivel_inv || '[por completar: nivel]').toLowerCase() + '.');
    }
    campoDoc_(D, 'enfoque_fund', 'fundamentación del enfoque, el tipo y el nivel');
    return;
  }
  if (f === 'diseno') {
    campoDoc_(D, 'diseno', 'diseño de investigación');
    if (exp.diseno_esquema) { texto_doc_(D, 'Esquema del diseño:', { sinSangria: true }); texto_doc_(D, exp.diseno_esquema, { centro: true, negrita: true }); }
    else nota_(D, 'esquema del diseño', 'diseno_esquema');
    if (exp.tipo_proyecto === 'artefacto') evaluacionArtefacto_(D);
    return;
  }
  if (f === 'artefacto') {
    if (exp.problema_diseno) rotulado_(D, 'Problema de diseño.', exp.problema_diseno, { sangria: true, campo: 'problema_diseno' });
    campoDoc_(D, 'artefacto_descripcion', 'descripción del artefacto');
    var comp = tabla_(exp, 'artefacto_componentes');
    if (comp.length) {
      leyenda_(D, 'Tabla', 'Componentes y tecnologías del artefacto');
      tablaDoc_(D, ['Componente', 'Función', 'Tecnología'], comp.map(function (x) { return [x.componente || '', x.funcion || '', x.tecnologia || '']; }), [25, 45, 30]);
    }
    return;
  }
  if (f === 'evaluacion_artefacto') { evaluacionArtefacto_(D); return; }
  if (f === 'cronograma') { cronogramaDoc_(D); return; }
  if (f === 'presupuesto') { presupuestoDoc_(D); if (exp.financiamiento) rotulado_(D, 'Financiamiento.', exp.financiamiento, { sangria: true, campo: 'financiamiento' }); else nota_(D, 'financiamiento', 'financiamiento'); return; }
  if (f === 'referencias') { referenciasDoc_(D); return; }
  if (f === 'matriz_consistencia') { matrizDoc_(D); return; }
  if (f === 'esquema_artefacto') {
    campoDoc_(D, 'esquema_artefacto', 'esquema o prototipo preliminar del artefacto');
    nota_(D, 'inserte aquí la imagen del esquema o prototipo');
    return;
  }
  if (f === 'arbol_problemas') { arbolDoc_(D); return; }
  if (f === 'declaracion_ia') { declaracionDoc_(D); return; }
}

function evaluacionArtefacto_(D) {
  var exp = D.exp;
  if (exp.afirmacion) rotulado_(D, 'Afirmación.', exp.afirmacion, { sangria: true, campo: 'afirmacion' });
  if (exp.metodo_validacion) rotulado_(D, 'Método de validación.', puntoFinal_(exp.metodo_validacion), { sangria: true });
  if (exp.linea_base) rotulado_(D, 'Línea base.', exp.linea_base, { sangria: true, campo: 'linea_base' });
  else nota_(D, 'línea base contra la que se compara el artefacto', 'linea_base');
  if (exp.artefacto_evaluacion) rotulado_(D, 'Plan de validación.', exp.artefacto_evaluacion, { sangria: true, campo: 'artefacto_evaluacion' });
  if (exp.refutacion) rotulado_(D, 'Resultado que refutaría la afirmación.', exp.refutacion, { sangria: true, campo: 'refutacion' });
  if (exp.limites) rotulado_(D, 'Límites y supuestos.', exp.limites, { sangria: true, campo: 'limites' });
  var req = tabla_(exp, 'requisitos_artefacto');
  if (req.length) {
    leyenda_(D, 'Tabla', 'Requisitos del artefacto, criterios de evaluación y métricas');
    tablaDoc_(D, ['Requisito', 'Criterio de evaluación', 'Métrica'], req.map(function (x) { return [x.requisito || '', x.criterio || '', x.metrica || '']; }), [40, 28, 32]);
  }
}

/** Parrafo de un antecedente, armado con las frases de su ficha. */
function parrafoAntecedente_(b) {
  var tesis = b.tipo === 'tesis';
  var donde = tesis ? (b.grado ? b.grado.toLowerCase() : 'tesis') + (b.fuente ? ' de la ' + b.fuente : '') : (b.tipo === 'articulo' ? 'artículo' + (b.fuente ? ' publicado en ' + b.fuente : '') : 'trabajo' + (b.fuente ? ' publicado en ' + b.fuente : ''));
  var fem = tesis && !/^trabajo/i.test(b.grado || '');
  return citaNarrativa_(b) + ', en ' + (fem ? 'la ' : 'el ') + donde + ' titulad' + (fem ? 'a' : 'o') + ' «' + b.titulo + '»' +
    (b.objetivo ? ', tuvo como objetivo ' + minusculaInicial_(sinPunto_(b.objetivo)) + '. ' : '. ') +
    (b.metodologia ? 'En cuanto a la metodología, ' + minusculaInicial_(sinPunto_(b.metodologia)) + '. ' : '[por completar: metodología del estudio] ') +
    (b.resultados ? 'Los resultados mostraron que ' + minusculaInicial_(sinPunto_(b.resultados)) + '. ' : '[por completar: resultados del estudio] ') +
    (b.conclusion ? 'Se concluyó que ' + minusculaInicial_(sinPunto_(b.conclusion)) + '. ' : '[por completar: conclusión del estudio] ') +
    (b.relacion ? 'Este antecedente se relaciona con la presente investigación porque ' + minusculaInicial_(sinPunto_(b.relacion)) + '.' : '[por completar: relación con la presente investigación]');
}

function sinPunto_(s) { return String(s || '').trim().replace(/[.\s]+$/, ''); }
function minusculaInicial_(s) {
  s = String(s || '');
  // No tocar siglas ni nombres propios compuestos (COVID-Net, InceptionV3, MobileNetV2)
  var primera = s.split(/\s+/)[0];
  if (/[A-ZÁÉÍÓÚÑ0-9]/.test(primera.substring(1))) return s;
  return s.charAt(0).toLowerCase() + s.substring(1);
}

function caratula_(D) {
  var exp = D.exp;
  var C = DocumentApp.HorizontalAlignment.CENTER;
  function linea(t, o) {
    o = o || {};
    if (D.vista) {
      contarPendientes_(D, t);
      D.bloques.push({ t: 'car', x: t, b: o.negrita !== false ? 1 : 0, d: (o.tam || D.tam) - D.tam, an: o.antes || 0, de: o.despues === undefined ? 6 : o.despues, k: o.campo || '' });
      return null;
    }
    var p = nuevoParrafo_(D, t);
    p.setAlignment(C).setLineSpacing(1.15).setSpacingBefore(o.antes || 0).setSpacingAfter(o.despues === undefined ? 6 : o.despues).setIndentFirstLine(0).setIndentStart(0);
    estilo_(p, D, { negrita: o.negrita !== false, tam: o.tam || D.tam });
    resaltar_(p, D);   // lo que falte en la caratula tambien se resalta y se cuenta
    return p;
  }
  linea(String(cfg_('UNIVERSIDAD', '')).toUpperCase(), { tam: 16, despues: 4 });
  linea(String(cfg_('FACULTAD', '')).toUpperCase(), { tam: 16, despues: 4 });
  linea(String(cfg_('ESCUELA', '')).toUpperCase(), { tam: 14, despues: 16 });
  if (D.vista) {
    if (cfg_('LOGO_ARCHIVO_ID', '') || cfg_('ESCUDO_INCLUIDO', 'SI') === 'SI') D.bloques.push({ t: 'logo' });
  } else {
    try {
      var blob = escudo_();
      if (blob) {
        var img = D.body.appendImage(blob);
        var w = img.getWidth(), h = img.getHeight();
        var alto = 4.2 * CM_;
        img.setHeight(alto).setWidth(w * alto / h);
        img.getParent().asParagraph().setAlignment(C).setSpacingAfter(16);
      }
    } catch (e) { /* sin escudo */ }
  }
  linea(D.tipoDoc || cfg_('CARATULA_TIPO_DOCUMENTO', 'PROYECTO DE TESIS'), { antes: 12, despues: 26, tam: 14 });
  linea(String(exp.titulo || '[por completar: título del proyecto]'), { despues: 8, tam: 14, campo: 'titulo' });
  linea(exp.autor1 ? nombreCaratula_(exp.autor1) : '[por completar: nombres y apellidos del autor]', { despues: exp.autor2 ? 2 : 24, tam: 14, campo: 'autor1' });
  if (exp.autor2) linea(nombreCaratula_(exp.autor2), { despues: 24, tam: 14 });
  linea('ASESOR: ' + (exp.asesor_nombre || '[por completar: asesor]'), { antes: 6, despues: 8, tam: 13, campo: 'asesor_nombre' });
  linea('ORCID: ' + (exp.asesor_orcid ? 'https://orcid.org/' + exp.asesor_orcid : '[por completar: ORCID del asesor]'), { despues: 26, tam: 13, campo: 'asesor_orcid' });
  if (exp.coasesor_nombre) linea('COASESOR: ' + exp.coasesor_nombre, { despues: 8, tam: 13 });
  linea(sust_(sust_(cfg_('CARATULA_PIE', '{ciudad}, {anio}, Perú'), '{ciudad}', cfg_('CIUDAD', 'San Vicente de Cañete')), '{anio}', new Date().getFullYear()), { antes: 10, tam: 12 });
}

/** «Apellidos, Nombres» pasa a «Nombres Apellidos», como en la caratula del modelo. */
function nombreCaratula_(s) {
  s = String(s || '').trim();
  var i = s.indexOf(',');
  return i > 0 ? (s.substring(i + 1).trim() + ' ' + s.substring(0, i).trim()).trim() : s;
}

function cronogramaDoc_(D) {
  var cr = tabla_(D.exp, 'cronograma').filter(function (f) { return f.actividad; });
  if (!cr.length) { nota_(D, 'cronograma'); return; }
  var meses = 1;
  cr.forEach(function (f) { var b = parseInt(f.fin, 10); if (b > meses) meses = b; });
  if (meses > 18) meses = 18;
  var enc = ['Actividad'];
  for (var m = 1; m <= meses; m++) enc.push('M' + m);
  var sombras = [];
  var filas = cr.map(function (f, i) {
    var a = parseInt(f.inicio, 10) || 1, b = parseInt(f.fin, 10) || a;
    var fila = [f.actividad];
    for (var m2 = 1; m2 <= meses; m2++) { fila.push(''); if (m2 >= a && m2 <= b) sombras.push([i + 1, m2, '#7F7F7F']); }
    return fila;
  });
  var anchos = [Math.max(30, 100 - meses * 5)];
  for (var q = 0; q < meses; q++) anchos.push(5);
  leyenda_(D, 'Tabla', 'Cronograma de actividades por mes');
  tablaDoc_(D, enc, filas, anchos, { tam: D.tam - 3, sombras: sombras });
}

function soles_(n) { return 'S/ ' + (Math.round(n * 100) / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

function presupuestoDoc_(D) {
  var pr = tabla_(D.exp, 'presupuesto').filter(function (f) { return f.descripcion; });
  if (!pr.length) { nota_(D, 'presupuesto'); return; }
  var total = 0;
  var filas = [];
  var negritas = [];
  ['Personal', 'Bienes', 'Servicios'].forEach(function (rub) {
    var sub = 0;
    pr.filter(function (f) { return f.rubro === rub; }).forEach(function (f) {
      var c = parseFloat(f.cantidad) || 0, u = parseFloat(f.costo) || 0;
      sub += c * u;
      filas.push([rub, f.descripcion, String(f.cantidad), soles_(u), soles_(c * u)]);
    });
    if (sub > 0 || pr.some(function (f) { return f.rubro === rub; })) { filas.push(['', 'Subtotal de ' + rub.toLowerCase(), '', '', soles_(sub)]); negritas.push(filas.length); }
    total += sub;
  });
  filas.push(['', 'Total', '', '', soles_(total)]);
  negritas.push(filas.length);
  leyenda_(D, 'Tabla', 'Presupuesto de la investigación');
  tablaDoc_(D, ['Rubro', 'Descripción', 'Cantidad', 'Costo unitario', 'Costo total'], filas, [14, 42, 12, 16, 16], { negritaFilas: negritas });
}

function referenciasDoc_(D) {
  var lista = D.bib.filter(function (b) { return D.usadas[b.clave_cita]; });
  if (!lista.length) { nota_(D, 'aún no hay fuentes citadas'); return; }
  var alfa = function (x, y) {
    var a = sinTildes_(referenciaTexto_(x)).toLowerCase(), b = sinTildes_(referenciaTexto_(y)).toLowerCase();
    return a < b ? -1 : (a > b ? 1 : 0);
  };
  var numerico = esNumerico_(D.estilo);
  if (numerico) {
    // Por orden de primera cita; las fuentes que aun no se citan en el texto van al final
    var citadas = lista.filter(function (b) { return CACHE_.citas.num[b.clave_cita]; });
    var resto = lista.filter(function (b) { return !CACHE_.citas.num[b.clave_cita]; }).sort(alfa);
    resto.forEach(function (b) { numeroCita_(b.clave_cita); });
    lista = citadas.concat(resto).sort(function (x, y) { return CACHE_.citas.num[x.clave_cita] - CACHE_.citas.num[y.clave_cita]; });
  } else lista.sort(alfa);
  lista.forEach(function (b) {
    var tramos = referenciaEstilo_(b, D.estilo, numerico ? CACHE_.citas.num[b.clave_cita] : 0);
    if (D.vista) { D.bloques.push({ t: 'ref', tr: tramos, num: numerico ? 1 : 0 }); return; }
    var p = nuevoParrafo_(D, tramos.map(function (x) { return x.t; }).join(''));
    p.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(D.inter).setSpacingBefore(0).setSpacingAfter(6).setIndentStart(numerico ? 0.9 * CM_ : 1.27 * CM_).setIndentFirstLine(0);
    estilo_(p, D, {});
    var pos = 0;
    var t = p.editAsText();
    tramos.forEach(function (x) {
      if (x.i && x.t.length) t.setItalic(pos, pos + x.t.length - 1, true);
      pos += x.t.length;
    });
  });
}

function matrizDoc_(D) {
  var m = matrizConsistencia_(D.exp);
  var enc = ['Problemas', 'Objetivos'];
  if (m.conHipotesis) enc.push('Hipótesis');
  enc.push('Variables, dimensiones e indicadores', 'Metodología');
  var filas = m.filas.map(function (f, i) {
    var fila = [(i === 0 ? 'General: ' : f.nivel + ': ') + f.problema, (i === 0 ? 'General: ' : f.nivel + ': ') + f.objetivo];
    if (m.conHipotesis) fila.push((i === 0 ? 'General: ' : f.nivel + ': ') + f.hipotesis);
    fila.push(i === 0 ? m.variables : '', i === 0 ? m.metodologia : '');
    return fila;
  });
  texto_doc_(D, 'Título: ' + (D.exp.titulo || '[por completar: título]'), { sinSangria: true, tam: D.tam - 1 });
  leyenda_(D, 'Tabla', 'Matriz de consistencia');
  tablaDoc_(D, enc, filas, m.conHipotesis ? [21, 21, 21, 19, 18] : [28, 28, 24, 20], { tam: D.tam - 4 });
}

function arbolDoc_(D) {
  var exp = D.exp;
  // En la vista el navegador dibuja el arbol con los mismos datos
  if (D.vista) { D.bloques.push({ t: 'arbol' }); return; }
  if (D.imagenArbol && D.imagenArbol.indexOf('base64,') > 0) {
    try {
      var bytes = Utilities.base64Decode(D.imagenArbol.split('base64,')[1]);
      leyenda_(D, 'Figura', 'Árbol de problemas de la investigación');
      var img = D.body.appendImage(Utilities.newBlob(bytes, 'image/png', 'arbol.png'));
      var w = img.getWidth(), h = img.getHeight();
      var ancho = Math.min(D.ancho, w);
      img.setWidth(ancho).setHeight(h * ancho / w);
      img.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      notaTabla_(D, 'Elaboración propia.');
      return;
    } catch (e) { /* cae a la tabla */ }
  }
  var filas = [];
  if (exp.efecto_final) filas.push(['Efecto final', exp.efecto_final, '']);
  tabla_(exp, 'efectos').forEach(function (f, i) { filas.push(['Efecto ' + (i + 1), f.efecto || '', f.evidencia || '']); });
  filas.push(['Problema central', exp.problema_central || '[por completar: problema central]', '']);
  tabla_(exp, 'causas').forEach(function (f, i) { filas.push(['Causa ' + (i + 1), f.causa || '', f.evidencia || '']); });
  leyenda_(D, 'Tabla', 'Árbol de problemas: efectos, problema central y causas');
  tablaDoc_(D, ['Elemento', 'Descripción', 'Evidencia'], filas, [18, 47, 35]);
}

function declaracionDoc_(D) {
  var r = resumenIA_(D.correo);
  var app = cfg_('APP_NOMBRE', 'la aplicación');
  var fuentesIA = [];
  if (r.porVia.curso + r.porVia.propia > 0 || !(r.porVia.copiar || r.porVia.nano)) fuentesIA.push('Gemini, de Google');
  if (r.porVia.copiar) fuentesIA.push('el asistente que el estudiante eligió para las consultas que copió y pegó');
  if (r.porVia.nano) fuentesIA.push('Gemini Nano, el modelo local del navegador Chrome');
  var quien = D.exp.autor2 ? 'Los autores declaran' : 'El autor declara';
  var asume = D.exp.autor2 ? 'Los autores revisaron, corrigieron y aceptaron cada texto, y asumen' : 'El autor revisó, corrigió y aceptó cada texto, y asume';
  texto_doc_(D, quien + ' que en la elaboración de este proyecto se utilizó la aplicación «' + app + '», que emplea inteligencia artificial generativa como asistente de orientación (' + fuentesIA.join(' y ') + '). La aplicación formula preguntas guía, revisa la coherencia de cada etapa, propone redacciones a partir de la información ingresada por el estudiante y simula preguntas de jurado. No genera datos ni referencias: las fuentes citadas provienen de la biblioteca del estudiante y fueron verificadas por su identificador DOI o por su enlace al repositorio.');
  texto_doc_(D, 'En total se registraron ' + r.total + ' consultas al asistente. De las propuestas de redacción, ' + r.aceptadas + ' se aceptaron sin cambios, ' + r.editadas + ' se aceptaron con modificaciones y ' + r.descartadas + ' se descartaron. ' + asume + ' la responsabilidad íntegra del contenido.');
  var mods = Object.keys(r.modelos || {}).filter(function (m) { return m !== VIA_COPIAR_ && m !== VIA_NANO_; });
  var hum = humanizacion_(D.exp);
  texto_doc_(D, 'Conforme al Reglamento de Similitud y Originalidad de la Universidad Nacional de Cañete (RCO N.° 503-2025-UNDC/CO, Art. 13), se declaran ' + (mods.length ? 'los modelos utilizados (' + mods.join(', ') + ')' : 'los asistentes utilizados') + ', las consultas realizadas por tipo (tabla siguiente) y su aporte: el asistente propuso y revisó redacciones; ' + (hum.generados ? 'de los ' + hum.generados + ' textos generados, ' + hum.listos + ' fueron reescritos íntegramente por ' + (D.exp.autor2 ? 'los autores' : 'el autor') + ' con sus propias palabras' : 'el texto final fue redactado por ' + (D.exp.autor2 ? 'los autores' : 'el autor')) + '. Las consultas completas se conservan en el registro de la aplicación y pueden presentarse a solicitud.');
  var nombres = { ayuda: 'Explicación de un campo', preguntar: 'Preguntas guía', proponer: 'Propuesta de redacción', revisar: 'Revisión de etapa', jurado: 'Preguntas de jurado', jurado_eval: 'Evaluación de respuestas al jurado', resumir: 'Ficha de antecedente', rubrica: 'Evaluación con la rúbrica' };
  var filas = [];
  for (var k in r.porModo) { if (r.porModo.hasOwnProperty(k)) filas.push([nombres[k] || k, String(r.porModo[k])]); }
  if (filas.length) {
    leyenda_(D, 'Tabla', 'Uso del asistente de inteligencia artificial por tipo de consulta');
    tablaDoc_(D, ['Tipo de consulta', 'Número de consultas'], filas, [70, 30]);
  }
}

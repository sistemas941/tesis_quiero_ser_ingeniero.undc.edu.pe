// ------------------------------------------------------------------ leer documentos en el navegador (Word, PDF, texto)
// El archivo no sale del navegador: aqui se convierte en bloques (titulos, parrafos y tablas) y solo se envia
// al servidor lo que el estudiante decide importar.
var NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
var PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

/** Lee un archivo y devuelve { nombre, tipo, bloques: [{t:'h',n,x} | {t:'p',x,li,b} | {t:'tabla',filas}] } */
function leerDocumento(file) {
  var nombre = file.name || 'documento', ext = (nombre.split('.').pop() || '').toLowerCase();
  if (file.size > 25 * 1024 * 1024) return Promise.reject(new Error('El archivo pesa más de 25 MB. Guarda una versión sin imágenes o pega el texto.'));
  if (ext === 'doc') return Promise.reject(new Error('Es un Word antiguo (.doc). Ábrelo en Word y guárdalo como .docx, o copia y pega el texto.'));
  if (ext === 'docx') return file.arrayBuffer().then(leerDocx).then(function (b) { return { nombre: nombre, tipo: 'docx', bloques: b }; });
  if (ext === 'pdf') return file.arrayBuffer().then(leerPdf).then(function (b) { return { nombre: nombre, tipo: 'pdf', bloques: b }; });
  if (['txt', 'md', 'csv', 'bib', 'ris'].indexOf(ext) >= 0 || /^text\//.test(file.type || '')) return file.text().then(function (t) { return { nombre: nombre, tipo: 'texto', bloques: bloquesDeTexto(t) }; });
  return Promise.reject(new Error('Ese tipo de archivo no se puede leer. Usa Word (.docx), PDF o texto (.txt).'));
}

function bloquesDeTexto(t) {
  return String(t || '').replace(/\r/g, '').split('\n').map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).filter(function (s) { return s; }).map(function (s) { return { t: 'p', x: s }; });
}

// ---------------------------------------------------------------- .docx: un zip con XML
function leerZip(buf) {
  var dv = new DataView(buf), u8 = new Uint8Array(buf), i = u8.length - 22;
  while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
  if (i < 0) throw new Error('El archivo no es un Word válido (.docx).');
  var n = dv.getUint16(i + 10, true), cd = dv.getUint32(i + 16, true), out = {}, dec = new TextDecoder();
  for (var k = 0; k < n; k++) {
    if (dv.getUint32(cd, true) !== 0x02014b50) break;
    var lnom = dv.getUint16(cd + 28, true), lext = dv.getUint16(cd + 30, true), lcom = dv.getUint16(cd + 32, true);
    out[dec.decode(u8.subarray(cd + 46, cd + 46 + lnom))] = { metodo: dv.getUint16(cd + 10, true), comp: dv.getUint32(cd + 20, true), loc: dv.getUint32(cd + 42, true) };
    cd += 46 + lnom + lext + lcom;
  }
  return out;
}
function extraerZip(buf, ent) {
  var dv = new DataView(buf), l = ent.loc, lnom = dv.getUint16(l + 26, true), lext = dv.getUint16(l + 28, true);
  var datos = new Uint8Array(buf, l + 30 + lnom + lext, ent.comp);
  if (ent.metodo === 0) return Promise.resolve(new TextDecoder().decode(datos));
  if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Tu navegador no puede abrir archivos Word. Actualízalo (Chrome o Edge) o copia y pega el texto.'));
  return new Response(new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
}
function hijoW(n, nombre) { for (var c = n.firstChild; c; c = c.nextSibling) { if (c.localName === nombre) return c; } return null; }
function valW(n) { return n ? (n.getAttributeNS(NS_W, 'val') || n.getAttribute('w:val') || '') : ''; }

function leerDocx(buf) {
  var z = leerZip(buf);
  if (!z['word/document.xml']) throw new Error('El archivo no parece un documento de Word.');
  return Promise.all([extraerZip(buf, z['word/document.xml']), z['word/styles.xml'] ? extraerZip(buf, z['word/styles.xml']) : Promise.resolve('')]).then(function (r) {
    var estilos = {};
    if (r[1]) {
      var st = new DOMParser().parseFromString(r[1], 'application/xml');
      Array.prototype.forEach.call(st.getElementsByTagNameNS(NS_W, 'style'), function (s) {
        var ppr = hijoW(s, 'pPr'), ol = ppr ? hijoW(ppr, 'outlineLvl') : null;
        estilos[s.getAttributeNS(NS_W, 'styleId') || s.getAttribute('w:styleId')] = { nombre: valW(hijoW(s, 'name')), nivel: ol ? parseInt(valW(ol), 10) + 1 : 0 };
      });
    }
    var doc = new DOMParser().parseFromString(r[0], 'application/xml');
    var body = doc.getElementsByTagNameNS(NS_W, 'body')[0];
    var bloques = [];
    if (body) cuerpoDocx(body, bloques, estilos);
    return bloques;
  });
}
function cuerpoDocx(nodo, bloques, estilos) {
  for (var c = nodo.firstChild; c; c = c.nextSibling) {
    if (c.localName === 'p') { var p = parrafoDocx(c, estilos); if (p) bloques.push(p); }
    else if (c.localName === 'tbl') { var t = tablaDocx(c); if (t) bloques.push(t); }
    else if (c.localName === 'sdt') {
      var pr = hijoW(c, 'sdtPr'), gal = pr ? pr.getElementsByTagNameNS(NS_W, 'docPartGallery')[0] : null;
      if (gal && /contents|contenido/i.test(valW(gal))) continue;   // el indice del Word no se importa
      var cont = hijoW(c, 'sdtContent');
      if (cont) cuerpoDocx(cont, bloques, estilos);
    }
  }
}
function textoDocx(n) {
  var s = '';
  (function rec(x) {
    for (var c = x.firstChild; c; c = c.nextSibling) {
      var ln = c.localName;
      if (ln === 't') s += c.textContent;
      else if (ln === 'tab') s += ' ';
      else if (ln === 'br' || ln === 'cr') s += '\n';
      else if (ln === 'delText' || ln === 'instrText') continue;
      else if (c.nodeType === 1) rec(c);
    }
  })(n);
  return s;
}
function parrafoDocx(p, estilos) {
  var x = textoDocx(p).replace(/[ \t ]+/g, ' ').trim();
  if (!x) return null;
  var ppr = hijoW(p, 'pPr'), id = ppr ? valW(hijoW(ppr, 'pStyle')) : '', est = estilos[id] || { nombre: id, nivel: 0 };
  if (/^(toc|tdc|tabla de ilustraciones|table of figures)\s*\d*/i.test(est.nombre) || /^(toc|tdc)\d/i.test(id)) return null;
  var ol = ppr ? hijoW(ppr, 'outlineLvl') : null;
  var m = /(?:heading|t[ií]tulo|encabezado)\s*(\d)/i.exec(est.nombre) || /(?:heading|ttulo|titulo)(\d)/i.exec(id);
  var nivel = m ? parseInt(m[1], 10) : (ol ? parseInt(valW(ol), 10) + 1 : est.nivel);
  if (/^(title|t[ií]tulo)$/i.test(est.nombre)) nivel = 0;
  if (nivel > 0 && nivel < 7 && x.length < 160) return { t: 'h', n: nivel, x: x };
  var runs = p.getElementsByTagNameNS(NS_W, 'r'), negrita = runs.length > 0;
  for (var i = 0; i < runs.length && negrita; i++) {
    var tx = textoDocx(runs[i]).trim();
    if (!tx) continue;
    var rpr = hijoW(runs[i], 'rPr'), b = rpr ? hijoW(rpr, 'b') : null;
    if (!b || valW(b) === '0' || valW(b) === 'false') negrita = false;
  }
  return { t: 'p', x: x, li: !!(ppr && hijoW(ppr, 'numPr')), b: negrita };
}
function tablaDocx(tbl) {
  var filas = [];
  for (var tr = tbl.firstChild; tr; tr = tr.nextSibling) {
    if (tr.localName !== 'tr') continue;
    var fila = [];
    for (var tc = tr.firstChild; tc; tc = tc.nextSibling) {
      if (tc.localName !== 'tc') continue;
      var partes = [];
      for (var p = tc.firstChild; p; p = p.nextSibling) { if (p.localName === 'p') { var t = textoDocx(p).replace(/\s+/g, ' ').trim(); if (t) partes.push(t); } }
      var pr = hijoW(tc, 'tcPr'), span = pr ? parseInt(valW(hijoW(pr, 'gridSpan')), 10) || 1 : 1;
      fila.push(partes.join(' '));
      for (var k = 1; k < span; k++) fila.push('');
    }
    if (fila.some(function (c) { return c; })) filas.push(fila);
  }
  return filas.length ? { t: 'tabla', filas: filas } : null;
}

// ---------------------------------------------------------------- .pdf con pdf.js (se carga solo cuando hace falta)
function cargarPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise(function (res, rej) {
    var s = document.createElement('script');
    s.src = PDFJS_URL + 'pdf.min.js';
    s.onload = function () {
      var L = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (!L) { rej(new Error('No se pudo cargar el lector de PDF.')); return; }
      // El trabajador se crea desde un blob para que funcione dentro de Apps Script
      fetch(PDFJS_URL + 'pdf.worker.min.js').then(function (r) { return r.text(); }).then(function (code) {
        L.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        res(L);
      }).catch(function () { L.GlobalWorkerOptions.workerSrc = PDFJS_URL + 'pdf.worker.min.js'; res(L); });
    };
    s.onerror = function () { rej(new Error('No se pudo cargar el lector de PDF. Copia el texto del PDF y pégalo en el recuadro.')); };
    document.head.appendChild(s);
  });
}
function leerPdf(buf) {
  return cargarPdfJs().then(function (L) { return L.getDocument({ data: new Uint8Array(buf) }).promise; }).then(function (pdf) {
    var paginas = [], n = Math.min(pdf.numPages, 120);
    var cadena = Promise.resolve();
    for (var i = 1; i <= n; i++) {
      (function (k) {
        cadena = cadena.then(function () { return pdf.getPage(k); }).then(function (pg) { return pg.getTextContent(); }).then(function (tc) { paginas.push(lineasPdf(tc.items)); });
      })(i);
    }
    return cadena.then(function () {
      var todas = [].concat.apply([], paginas);
      if (!todas.length) throw new Error('El PDF no tiene texto seleccionable (parece escaneado). Usa el Word original o pega el texto.');
      var tams = todas.map(function (l) { return l.fs; }).sort(function (a, b) { return a - b; }), med = tams[Math.floor(tams.length / 2)] || 12;
      // Se quitan encabezados y pies que se repiten en muchas paginas (numero de pagina, nombre de la universidad)
      var cuenta = {};
      todas.forEach(function (l) { var k = l.x.replace(/\d+/g, '#'); cuenta[k] = (cuenta[k] || 0) + 1; });
      var lim = Math.max(3, Math.floor(paginas.length * 0.5));
      return todas.filter(function (l) { return !(cuenta[l.x.replace(/\d+/g, '#')] >= lim && l.x.length < 90) && !/^\d{1,3}$/.test(l.x); })
        .map(function (l) { return { t: 'p', x: l.x, b: l.b || l.fs > med * 1.18, pdf: 1 }; });
    });
  });
}
function lineasPdf(items) {
  var lineas = [], actual = null;
  items.forEach(function (it) {
    if (!it.str && !it.hasEOL) return;
    var y = Math.round(it.transform[5]), fs = Math.abs(it.transform[3]) || Math.hypot(it.transform[0], it.transform[1]) || 10;
    if (!actual || Math.abs(actual.y - y) > fs * 0.5) { actual = { y: y, x: '', fs: fs, b: /bold|black|heavy/i.test(it.fontName || '') }; lineas.push(actual); }
    actual.x += it.str;
    if (fs > actual.fs) actual.fs = fs;
  });
  return lineas.map(function (l) { l.x = l.x.replace(/\s+/g, ' ').trim(); return l; }).filter(function (l) { return l.x; });
}

// ---------------------------------------------------------------- de bloques a secciones del plan
var MAPA_IMPORT = [
  [/realidad problematica|planteamiento del problema|descripcion del problema|situacion problematica|problematica$/, 'planteamiento'],
  [/^problema general|formulacion del problema general/, 'problema_general'],
  [/problemas? especificos?/, 'problemas_especificos'],
  [/^objetivo general/, 'objetivo_general'],
  [/objetivos? especificos?/, 'objetivos_especificos'],
  [/^hipotesis general/, 'hipotesis_general'],
  [/hipotesis especificas?/, 'hipotesis_especificas'],
  [/justificacion (teorica|cientifica)/, 'just_teorica'],
  [/justificacion practica/, 'just_practica'],
  [/justificacion metodologica/, 'just_metodologica'],
  [/justificacion social/, 'just_social'],
  [/^justificacion( e importancia| de la investigacion)?$/, 'just_practica'],
  [/delimitacion espacial/, 'delim_espacial'],
  [/delimitacion temporal/, 'delim_temporal'],
  [/delimitacion (teorica|conceptual)/, 'delim_conceptual'],
  [/definicion de terminos|terminos basicos|glosario|definiciones operativas de terminos/, 'terminos'],
  [/operacionalizacion/, 'operacionalizacion'],
  [/enfoque de (la )?investigacion/, 'enfoque_fund'],
  [/tipo de investigacion|tipo y nivel|tipo de estudio/, 'enfoque_fund'],
  [/nivel de investigacion|alcance de la investigacion/, 'enfoque_fund'],
  [/diseno de (la )?investigacion|diseno del estudio/, 'diseno'],
  [/metodo de (la )?investigacion|metodologia de desarrollo/, 'metodo'],
  [/^poblacion y muestra$|^poblacion$/, 'poblacion'],
  [/^muestra$|tamano de (la )?muestra/, 'muestra'],
  [/muestreo/, 'muestreo'],
  [/lugar de estudio|ambito de estudio|area de estudio/, 'lugar_estudio'],
  [/tecnicas e instrumentos/, 'tecnicas_instrumentos'],
  [/validez|confiabilidad|procedimiento de recoleccion|procedimientos?$/, 'procedimiento'],
  [/analisis (y procesamiento )?de (los )?datos|procesamiento de (los )?datos|tecnicas de analisis/, 'analisis'],
  [/etic(a|os)/, 'etica'],
  [/cronograma/, 'cronograma'],
  [/presupuesto/, 'presupuesto'],
  [/financiamiento/, 'financiamiento'],
  [/^referencias|bibliografia|fuentes consultadas/, '#referencias'],
  [/matriz de consistencia/, '#matriz'],
  [/^antecedentes|antecedentes (nacionales|internacionales|locales)/, '#antecedentes'],
  [/^indice|tabla de contenido|indice de (tablas|figuras)/, '#indice'],
  [/instrumento de recoleccion|ficha de (registro|observacion)|cuestionario$/, 'instrumento_anexo'],
  [/^anexos?$/, '#anexos'],
  [/^marco teorico|^bases teoricas|^marco conceptual/, '#marco']
];
function normTitulo(t) {
  return sinTildes(String(t || '')).toLowerCase().replace(/^\s*(cap[ií]tulo\s+[ivxlc\d]+[.:\-\s]*)/i, '').replace(/^\s*([ivxlc]+|\d+(\.\d+)*|[a-z])[.)\-:]?\s+/, '').replace(/[.:\s]+$/, '').replace(/\s+/g, ' ').trim();
}
function campoDeTitulo(t) {
  var n = normTitulo(t);
  for (var i = 0; i < MAPA_IMPORT.length; i++) { if (MAPA_IMPORT[i][0].test(n)) return MAPA_IMPORT[i][1]; }
  if (S.exp && S.exp.var1 && n.indexOf(normTitulo(S.exp.var1)) >= 0) return /dimension/.test(n) ? 'var1_dimensiones' : (/indicador/.test(n) ? 'var1_indicadores' : (/teori/.test(n) ? 'var1_teorias' : 'var1_definicion'));
  if (S.exp && S.exp.var2 && n.indexOf(normTitulo(S.exp.var2)) >= 0) return /dimension/.test(n) ? 'var2_dimensiones' : (/indicador/.test(n) ? 'var2_indicadores' : (/teori/.test(n) ? 'var2_teorias' : 'var2_definicion'));
  return '';
}
/** ¿Esta linea es un titulo? Por su estilo de Word o por su forma (numeracion, mayusculas, palabras clave). */
function nivelTitulo(b) {
  if (b.t === 'h') return b.n || 1;
  if (b.t !== 'p' || b.x.length > 130 || /[,;]$/.test(b.x)) return 0;
  var x = b.x;
  if (/^cap[ií]tulo\s+[ivxlc\d]+/i.test(x)) return 1;
  var conocido = !!campoDeTitulo(x);
  var m = /^(\d+(?:\.\d+){0,4})\.?\s+\S/.exec(x);
  if (m && !/[.:]$/.test(x.replace(/\.\s*$/, '')) && x.length < 110) {
    var prof = m[1].split('.').length;
    if (prof >= 2 || conocido || x === x.toUpperCase() || b.b) return prof;
  }
  if (/^[IVXLC]+[.)\-]\s+\S/.test(x) && x.length < 100 && (x === x.toUpperCase() || conocido || b.b)) return 1;
  var mayus = x === x.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{4}/.test(x) && x.length < 90;
  if (mayus && (conocido || b.b || b.pdf)) return 1;
  if (conocido && x.length < 70 && !/\.\s+\S/.test(x) && (b.b || x.split(/\s+/).length <= 6)) return 2;
  return 0;
}
/** Une las lineas sueltas de un PDF en parrafos. */
function unirLineas(bloques) {
  var out = [];
  bloques.forEach(function (b) {
    var ult = out[out.length - 1];
    if (b.t === 'p' && b.pdf && ult && ult.t === 'p' && ult.pdf && !nivelTitulo(b) && !nivelTitulo(ult) && !/[.:;?!]$/.test(ult.x) && !/^([•\-–*]|\d+[.)]|[a-z][.)])\s/.test(b.x)) {
      ult.x = /-$/.test(ult.x) ? ult.x.replace(/-$/, '') + b.x : ult.x + ' ' + b.x;
    } else out.push({ t: b.t, x: b.x, n: b.n, li: b.li, b: b.b, pdf: b.pdf, filas: b.filas });
  });
  return out;
}
function palabrasN(s) { s = String(s || '').trim(); return s ? s.split(/\s+/).length : 0; }

/** Convierte los bloques en { secciones, tablas, referencias, titulo, preambulo, palabras } con un campo propuesto para cada parte. */
function analizarDoc(doc) {
  var bloques = unirLineas(doc.bloques);
  var secs = [], tablas = [], pre = { titulo: '(Carátula y páginas iniciales)', nivel: 0, partes: [], campo: '#preambulo' }, actual = pre, palabras = 0;
  bloques.forEach(function (b, i) {
    if (b.t === 'tabla') {
      var cap = '';
      for (var k = Math.max(0, i - 3); k < i; k++) { var bb = bloques[k]; if (bb.t === 'p' && /^(tabla|cuadro)\s*n?[°º.]?\s*\d+/i.test(bb.x)) { cap = bb.x + (bloques[k + 1] && bloques[k + 1].t === 'p' && k + 1 < i && bloques[k + 1].x.length < 160 ? ' ' + bloques[k + 1].x : ''); } }
      tablas.push({ titulo: cap || 'Tabla ' + (tablas.length + 1), seccion: actual.titulo, filas: b.filas, campo: campoDeTabla(b.filas, cap + ' ' + actual.titulo) });
      return;
    }
    var nv = nivelTitulo(b);
    if (nv) { actual = { titulo: b.x, nivel: nv, partes: [], campo: campoDeTitulo(b.x) }; secs.push(actual); return; }
    if (/^(tabla|cuadro|figura|gr[aá]fico)\s*n?[°º.]?\s*\d+/i.test(b.x) || /^(nota|fuente)\s*[.:]/i.test(b.x)) return;   // rotulos de tablas y figuras
    actual.partes.push(b.li ? '• ' + b.x : b.x);
    palabras += palabrasN(b.x);
  });
  secs.forEach(function (s) {
    s.texto = s.partes.join('\n');
    s.palabras = palabrasN(s.texto);
    // Un titulo padre sin texto propio (Justificacion con sus cuatro tipos) no se importa
    if (!s.texto && s.campo && s.campo.charAt(0) !== '#') s.vacio = true;
  });
  // Los campos de tipo opcion se deducen del texto de metodologia
  var refs = secs.filter(function (s) { return s.campo === '#referencias'; }).map(function (s) { return s.texto; }).join('\n');
  pre.texto = pre.partes.join('\n');
  return { archivo: doc.nombre, tipo: doc.tipo, secciones: secs, tablas: tablas, referencias: refs, nRefs: refs ? refs.split('\n').filter(function (l) { return /(19|20)\d{2}/.test(l); }).length : 0, titulo: tituloDe(pre.partes), preambulo: pre.texto, palabras: palabras };
}
/** El titulo de la tesis en la caratula: la linea larga entre el rotulo del documento y el autor. */
function tituloDe(partes) {
  var lin = partes.slice(0, 40), ini = 0, fin = lin.length;
  for (var i = 0; i < lin.length; i++) {
    var n = sinTildes(lin[i]).toLowerCase();
    if (/proyecto de tesis|plan de tesis|proyecto de investigacion|^tesis$|para optar/.test(n) && !ini) ini = i + 1;
    if (/autor|presentado por|bachiller|tesista|asesor|^por:?$/.test(n) && i > ini) { fin = i; break; }
  }
  var cand = lin.slice(ini, fin).filter(function (l) { return palabrasN(l) >= 6 && !/universidad|facultad|escuela|^para optar|titulo profesional|ingenier[oa] de sistemas$/i.test(sinTildes(l)); });
  if (!cand.length) cand = lin.filter(function (l) { return palabrasN(l) >= 8 && l === l.toUpperCase(); });
  return cand.length ? cand.sort(function (a, b) { return b.length - a.length; })[0].replace(/^["“«]|["”»]$/g, '').trim() : '';
}

// ---------------------------------------------------------------- tablas del documento a tablas de la plantilla
function celdaN(s) { return sinTildes(String(s || '')).toLowerCase().replace(/\s+/g, ' ').trim(); }
function campoDeTabla(filas, contexto) {
  var cab = (filas[0] || []).map(celdaN).join(' | '), ctx = sinTildes(contexto || '').toLowerCase();
  if (/problema/.test(cab) && /objetivo/.test(cab)) return '#matriz';
  if (/actividad/.test(cab) && (/mes|semana|ene|feb|mar|abr|inicio|m1|\b1\b/.test(cab) || /cronograma/.test(ctx))) return 'cronograma';
  if (/variable/.test(cab) && /(dimension|indicador)/.test(cab)) return 'operacionalizacion';
  if (/tecnica/.test(cab) && /instrumento/.test(cab)) return 'tecnicas_instrumentos';
  if (/(costo|precio|monto|total|cantidad)/.test(cab) && /(rubro|descripcion|detalle|concepto|item|partida|bien)/.test(cab) || /presupuesto/.test(ctx) && /(costo|precio|total)/.test(cab)) return 'presupuesto';
  if (/termino/.test(cab) && /definicion/.test(cab)) return 'terminos';
  if (/causa/.test(cab)) return 'causas';
  if (/efecto/.test(cab)) return 'efectos';
  if (/requisito/.test(cab)) return 'requisitos_artefacto';
  if (/componente/.test(cab) && /(tecnologia|funcion)/.test(cab)) return 'artefacto_componentes';
  if (/brecha/.test(cab)) return 'brechas';
  return '';
}
var CLAVES_COL = { variable: /variable/, dimension: /dimension/, indicador: /indicador/, escala: /escala|medicion/, instrumento: /instrumento/, tecnica: /tecnica/, mide: /mide|indicador|variable/, termino: /termino|concepto/, definicion: /definicion|significado/,
  causa: /causa/, efecto: /efecto/, evidencia: /evidencia|fuente|dato/, requisito: /requisito/, criterio: /criterio/, metrica: /metrica|indicador|medida/, componente: /componente|modulo|capa/, funcion: /funcion|descripcion/, tecnologia: /tecnologia|herramienta/,
  brecha: /brecha/, estudios: /estudio|autor/, respuesta: /atiende|respuesta|aporte/, actividad: /actividad|tarea/, descripcion: /descripcion|detalle|concepto|item|bien|servicio/, cantidad: /cant/, costo: /unitario|precio|costo(?! total)/, rubro: /rubro|partida|tipo/ };
/** Filas de una tabla del documento como filas del campo de la plantilla. */
function filasDeTabla(campo, filas) {
  var c = campoDe(campo);
  if (!c || !filas || filas.length < 2) return [];
  var cab = filas[0].map(celdaN), cuerpo = filas.slice(1).filter(function (f) { return !/^total/i.test(celdaN(f[0])) && !/^total/i.test(celdaN(f[1] || '')); });
  if (campo === 'cronograma') {
    var iAct = cab.findIndex(function (h) { return /actividad|tarea/.test(h); }), iIni = cab.findIndex(function (h) { return /inicio/.test(h); }), iFin = cab.findIndex(function (h) { return /^fin|termino|final/.test(h); });
    if (iAct < 0) iAct = 0;
    return cuerpo.map(function (f) {
      var a = f[iAct] || '';
      if (!a) return null;
      if (iIni >= 0 && iFin >= 0) return { actividad: a, inicio: String(parseInt(f[iIni], 10) || ''), fin: String(parseInt(f[iFin], 10) || '') };
      var marcadas = [];
      f.forEach(function (v, j) { if (j !== iAct && j > iAct && String(v).trim()) marcadas.push(j - iAct); });
      return { actividad: a, inicio: marcadas.length ? String(marcadas[0]) : '', fin: marcadas.length ? String(marcadas[marcadas.length - 1]) : '' };
    }).filter(function (x) { return x; });
  }
  var idx = {};
  c.columnas.forEach(function (col) {
    var re = CLAVES_COL[col.clave] || new RegExp(celdaN(col.etiqueta).split(' ')[0]);
    var j = cab.findIndex(function (h, k) { return re.test(h) && !Object.keys(idx).some(function (q) { return idx[q] === k; }); });
    idx[col.clave] = j;
  });
  if (c.columnas.every(function (col) { return idx[col.clave] < 0; })) c.columnas.forEach(function (col, k) { idx[col.clave] = k < cab.length ? k : -1; });
  var previo = {};
  return cuerpo.map(function (f) {
    var o = {};
    c.columnas.forEach(function (col) {
      var v = idx[col.clave] >= 0 ? String(f[idx[col.clave]] || '').trim() : '';
      // Celdas combinadas: la variable o la dimension se repite hacia abajo
      if (!v && (col.clave === 'variable' || col.clave === 'dimension') && previo[col.clave]) v = previo[col.clave];
      if (col.numero) v = String(v).replace(/[^0-9.,]/g, '').replace(',', '.');
      o[col.clave] = v;
    });
    if (campo === 'presupuesto') {
      var t = sinTildes(o.descripcion + ' ' + (o.rubro || '')).toLowerCase();
      o.rubro = /personal|honorario|asesor|digitador|encuestador/.test(t) ? 'Personal' : (/servicio|internet|transporte|impresion|movilidad|pasaje|fotocopia|anillado|empastado|luz|telefon/.test(t) ? 'Servicios' : 'Bienes');
    }
    c.columnas.forEach(function (col) { if (o[col.clave]) previo[col.clave] = o[col.clave]; });
    return o;
  }).filter(function (o) { return c.columnas.some(function (col) { return o[col.clave]; }); });
}
/** Texto de una seccion como filas de una lista (problemas, objetivos e hipotesis especificos) o de terminos. */
function filasDeTexto(campo, texto) {
  var c = campoDe(campo);
  if (!c || c.tipo !== 'tabla') return [];
  var lineas = String(texto || '').split('\n').map(function (s) { return s.replace(/^\s*(?:[•\-–*]|\(?[a-z0-9]{1,3}[.)]|(?:PE|OE|HE|P|O|H)\s*\d+\s*[:.\-])\s*/i, '').trim(); }).filter(function (s) { return s.length > 3; });
  if (campo === 'terminos') return lineas.map(function (l) { var m = /^([^:.]{2,60})[:.]\s+(.{8,})$/.exec(l); return m ? { termino: m[1].trim(), definicion: m[2].trim() } : null; }).filter(function (x) { return x; });
  if (c.columnas.length === 1) return lineas.map(function (l) { var o = {}; o[c.columnas[0].clave] = l; return o; });
  return [];
}

/**
 * Referencias.gs - Busqueda de estudios (OpenAlex, Crossref), verificacion por DOI y formato APA 7.
 */

function limpiarDoi_(d) {
  d = String(d || '').trim();
  d = d.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
  return d.toLowerCase();
}

function traer_(url) {
  try {
    var r = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true, headers: { 'Accept': 'application/json' } });
    if (r.getResponseCode() !== 200) return null;
    return JSON.parse(r.getContentText());
  } catch (e) { return null; }
}

function sinEtiquetas_(s) { return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

function resumenInvertido_(inv) {
  if (!inv) return '';
  var pos = [];
  for (var palabra in inv) {
    if (!inv.hasOwnProperty(palabra)) continue;
    var lista = inv[palabra];
    for (var i = 0; i < lista.length; i++) { pos[lista[i]] = palabra; }
  }
  return pos.join(' ').replace(/\s+/g, ' ').trim();
}

function partirNombre_(completo) {
  var p = String(completo || '').trim().split(/\s+/);
  if (p.length === 1) return { apellido: p[0], nombre: '' };
  return { apellido: p[p.length - 1], nombre: p.slice(0, p.length - 1).join(' ') };
}

function tipoEstudio_(t) {
  t = String(t || '').toLowerCase();
  if (t.indexOf('dissertation') >= 0 || t.indexOf('thesis') >= 0) return 'tesis';
  if (t.indexOf('book') >= 0 || t.indexOf('monograph') >= 0) return 'libro';
  if (t.indexOf('article') >= 0 || t.indexOf('review') >= 0 || t.indexOf('proceedings') >= 0) return 'articulo';
  return 'otro';
}

/** Busca estudios. Primero OpenAlex; si no responde, Crossref. */
function buscarEstudios_(q, desde) {
  q = String(q || '').trim();
  if (q.length < 3) throw new Error('Escribe al menos tres letras para buscar.');
  var anio = new Date().getFullYear();
  desde = parseInt(desde, 10) || (anio - cfgNum_('ANTIGUEDAD_MAX', 5));
  var correo = cfg_('CORREO_CONTACTO', '');
  var clave = props_().getProperty('OPENALEX_API_KEY') || '';
  var url = 'https://api.openalex.org/works?search=' + encodeURIComponent(q) +
    '&filter=publication_year:' + desde + '-' + anio +
    '&per_page=12&select=id,doi,display_name,publication_year,type,authorships,primary_location,cited_by_count,abstract_inverted_index' +
    (clave ? '&api_key=' + encodeURIComponent(clave) : '') + (correo ? '&mailto=' + encodeURIComponent(correo) : '');
  var d = traer_(url);
  if (d && d.results) {
    return { origen: 'OpenAlex', resultados: d.results.map(function (w) {
      var src = (w.primary_location && w.primary_location.source) ? w.primary_location.source : null;
      return {
        doi: limpiarDoi_(w.doi), titulo: w.display_name || '', anio: String(w.publication_year || ''),
        autores: (w.authorships || []).slice(0, 20).map(function (a) { return partirNombre_(a.author ? a.author.display_name : ''); }),
        fuente: src ? (src.display_name || '') : '', tipo: tipoEstudio_(w.type), citas: w.cited_by_count || 0,
        resumen: resumenInvertido_(w.abstract_inverted_index).substring(0, 3000),
        url: (w.primary_location && w.primary_location.landing_page_url) ? w.primary_location.landing_page_url : ''
      };
    }) };
  }
  url = 'https://api.crossref.org/works?query.bibliographic=' + encodeURIComponent(q) +
    '&filter=from-pub-date:' + desde + '&rows=12&select=DOI,title,author,container-title,issued,type,volume,issue,page,abstract' +
    (correo ? '&mailto=' + encodeURIComponent(correo) : '');
  d = traer_(url);
  if (d && d.message && d.message.items) {
    return { origen: 'Crossref', resultados: d.message.items.map(deCrossref_) };
  }
  throw new Error('Los catálogos no respondieron. Intenta de nuevo en un momento o agrega el estudio por su DOI.');
}

function deCrossref_(m) {
  var anio = '';
  if (m.issued && m.issued['date-parts'] && m.issued['date-parts'][0] && m.issued['date-parts'][0][0]) anio = String(m.issued['date-parts'][0][0]);
  return {
    doi: limpiarDoi_(m.DOI), titulo: sinEtiquetas_(m.title && m.title[0]), anio: anio,
    autores: (m.author || []).slice(0, 20).map(function (a) { return a.family ? { apellido: a.family, nombre: a.given || '' } : { apellido: a.name || '', nombre: '' }; }),
    fuente: (m['container-title'] && m['container-title'][0]) ? sinEtiquetas_(m['container-title'][0]) : '',
    volumen: m.volume || '', numero: m.issue || '', paginas: m.page || m['article-number'] || '',
    editorial: m.publisher || '', tipo: tipoEstudio_(m.type), citas: 0,
    resumen: sinEtiquetas_(m.abstract).substring(0, 3000), url: m.URL || ''
  };
}

/** Devuelve los metadatos oficiales de un DOI segun Crossref, o null si no existe. */
function verificarDoi_(doi) {
  doi = limpiarDoi_(doi);
  if (!doi || doi.indexOf('/') < 0) return null;
  var correo = cfg_('CORREO_CONTACTO', '');
  var url = 'https://api.crossref.org/works/' + encodeURIComponent(doi).replace(/%2F/g, '/') + (correo ? '?mailto=' + encodeURIComponent(correo) : '');
  var cod = 0;
  var d = null;
  // Solo un 404 significa que el DOI no existe; cualquier otro fallo es pasajero y no debe guardarse como "no verificado"
  for (var intento = 0; intento < 2 && cod !== 200 && cod !== 404; intento++) {
    try {
      var r = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true, headers: { 'Accept': 'application/json' } });
      cod = r.getResponseCode();
      if (cod === 200) d = JSON.parse(r.getContentText());
    } catch (e) { cod = 0; }
    if (cod !== 200 && cod !== 404) Utilities.sleep(1200);
  }
  if (cod === 404) return null;
  if (cod !== 200 || !d || !d.message) throw new Error('Crossref no respondió y el DOI no se pudo verificar. Intenta de nuevo en un minuto.');
  return deCrossref_(d.message);
}

/** Solo se aceptan enlaces http o https; cualquier otra cosa se descarta. */
function urlSegura_(u) { u = String(u || '').trim(); return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }

function sinTildes_(s) {
  var de = 'áéíóúüñÁÉÍÓÚÜÑàèìòùäëïöçãõâêîôû';
  var a = 'aeiouunAEIOUUNaeiouaeiocaoaeiou';
  var r = '';
  s = String(s || '');
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i);
    var k = de.indexOf(c);
    r += k >= 0 ? a.charAt(k) : c;
  }
  return r;
}

function claveCita_(correo, autores, anio) {
  var base = 'fuente';
  if (autores && autores.length && autores[0].apellido) {
    base = sinTildes_(autores[0].apellido).toLowerCase().replace(/[^a-z]/g, '') || 'fuente';
  }
  base = base.substring(0, 18) + (anio || 'sf');
  var usadas = {};
  biblioteca_(correo).forEach(function (b) { usadas[b.clave_cita] = true; });
  if (!usadas[base]) return base;
  var letras = 'bcdefghijklmnopqrstuvwxyz';
  for (var i = 0; i < letras.length; i++) { if (!usadas[base + letras.charAt(i)]) return base + letras.charAt(i); }
  return base + Utilities.getUuid().substring(0, 4);
}

/** "Apellido, Nombres; Apellido, Nombres" -> [{apellido, nombre}] */
function parsearAutores_(txt) {
  return String(txt || '').split(';').map(function (s) {
    s = s.trim();
    if (!s) return null;
    var i = s.indexOf(',');
    return i >= 0 ? { apellido: s.substring(0, i).trim(), nombre: s.substring(i + 1).trim() } : { apellido: s, nombre: '' };
  }).filter(function (a) { return a; });
}

function agregarEstudio_(correo, d) {
  correo = normCorreo_(correo);
  var doi = limpiarDoi_(d.doi);
  var verificado = 'no';
  var meta = null;
  if (doi) {
    var ya = biblioteca_(correo).filter(function (b) { return b.doi && b.doi === doi; });
    if (ya.length) throw new Error('Ese estudio ya está en tu biblioteca con la clave ' + ya[0].clave_cita + '.');
    meta = verificarDoi_(doi);
    if (!meta && !String(d.titulo || '').trim()) throw new Error('Crossref no reconoce ese DOI. Revísalo; si es una tesis o un libro sin DOI, agrégalo en la pestaña «Tesis o libro».');
    if (meta) verificado = 'crossref';
    else if (d.origen === 'OpenAlex') verificado = 'openalex';
  }
  var autores = (meta && meta.autores.length) ? meta.autores : (Array.isArray(d.autores) ? d.autores : parsearAutores_(d.autores));
  var anio = String((meta && meta.anio) || d.anio || '').trim();
  var titulo = String((meta && meta.titulo) || d.titulo || '').trim();
  if (!titulo) throw new Error('Falta el título del estudio.');
  if (!autores.length) throw new Error('Falta al menos un autor (Apellido, Nombres).');
  var tipo = d.tipo || (meta ? meta.tipo : 'articulo');
  var enlace = urlSegura_(d.url);
  if (!doi && enlace) verificado = 'manual';
  var fila = {
    id: Utilities.getUuid(), correo: correo, clave_cita: claveCita_(correo, autores, anio), tipo: tipo, uso: d.uso || 'antecedente',
    doi: doi, url: enlace || urlSegura_(meta ? meta.url : '') || (doi ? 'https://doi.org/' + doi : ''), autores: JSON.stringify(autores), anio: anio, titulo: titulo,
    fuente: (meta && meta.fuente) || d.fuente || '', volumen: (meta && meta.volumen) || d.volumen || '', numero: (meta && meta.numero) || d.numero || '',
    paginas: (meta && meta.paginas) || d.paginas || '', editorial: (meta && meta.editorial) || d.editorial || '', grado: d.grado || '',
    indizacion: d.indizacion || '', verificado: verificado, resumen: String(d.resumen || (meta ? meta.resumen : '') || '').substring(0, 3000),
    objetivo: d.objetivo || '', metodologia: d.metodologia || '', resultados: d.resultados || '', conclusion: d.conclusion || '', relacion: d.relacion || '', creado: ahora_(), sin_resolver: d.sin_resolver || '', ambito: d.ambito === 'nacional' || d.ambito === 'internacional' ? d.ambito : ''
  };
  conBloqueo_(function () { agregar_('Biblioteca', fila); });
  return fila.id;
}

// ---------------------------------------------------------------- formato APA 7
function iniciales_(nombre) {
  return String(nombre || '').trim().split(/\s+/).filter(function (p) { return p; }).map(function (p) {
    return p.split('-').map(function (q) { return q.charAt(0).toUpperCase() + '.'; }).join('-');
  }).join(' ');
}

function autorAPA_(a) {
  var ini = iniciales_(a.nombre);
  return ini ? a.apellido + ', ' + ini : a.apellido;
}

function autoresAPA_(autores) {
  var l = (autores || []).map(autorAPA_);
  if (!l.length) return 'Autor desconocido';
  if (l.length === 1) return l[0];
  if (l.length > 20) l = l.slice(0, 19).concat(['...', l[l.length - 1]]);
  return l.slice(0, l.length - 1).join(', ') + ' y ' + l[l.length - 1];
}

/** Cita en el texto (APA): Apellido, 2020 | A y B, 2020 | A et al., 2020 (sin parentesis). */
function citaCorta_(b) {
  var a = b.autores || [];
  var anio = b.anio || 's. f.';
  if (!a.length) return 'Autor desconocido, ' + anio;
  if (a.length === 1) return a[0].apellido + ', ' + anio;
  if (a.length === 2) return a[0].apellido + ' y ' + a[1].apellido + ', ' + anio;
  return a[0].apellido + ' et al., ' + anio;
}

function puntoFinal_(s) { s = String(s || '').trim(); return /[.?!]$/.test(s) ? s : s + '.'; }

// ---------------------------------------------------------------- estilos de cita
// IEEE es el estilo por defecto (CITAS_DEFECTO); cada estudiante puede elegir otro desde su configuracion.
var ESTILOS_CITA_ = { ieee: 'IEEE', apa: 'APA 7', vancouver: 'Vancouver', chicago: 'Chicago (autor-fecha)' };
function claveEstilo_(v) {
  v = sinTildes_(String(v || '')).toLowerCase();
  if (v.indexOf('apa') >= 0) return 'apa';
  if (v.indexOf('vanc') >= 0) return 'vancouver';
  if (v.indexOf('chic') >= 0) return 'chicago';
  if (v.indexOf('ieee') >= 0) return 'ieee';
  return '';
}
function estiloDe_(exp) { return claveEstilo_(exp && exp._estilo_cita) || claveEstilo_(cfg_('CITAS_DEFECTO', 'IEEE')) || 'ieee'; }
function esNumerico_(e) { return e === 'ieee' || e === 'vancouver'; }
/** Prepara la numeracion de citas de un documento (IEEE y Vancouver numeran por orden de aparicion). */
function iniciarCitas_(estilo) { CACHE_.citas = { estilo: estilo || 'apa', num: {}, orden: [] }; return CACHE_.citas; }
function numeroCita_(k) {
  var c = CACHE_.citas;
  if (!c.num[k]) { c.orden.push(k); c.num[k] = c.orden.length; }
  return c.num[k];
}
function estiloActual_() { return CACHE_.citas ? CACHE_.citas.estilo : 'apa'; }

/** Lista de numeros como [1], [3]–[5] (IEEE) o 1,3-5 (Vancouver). */
function rangos_(nums, sepIni, sepFin, guion, coma) {
  nums = nums.slice().sort(function (a, b) { return a - b; });
  var out = [], i = 0;
  while (i < nums.length) {
    var j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    if (j - i >= 2) out.push(sepIni + nums[i] + sepFin + guion + sepIni + nums[j] + sepFin);
    else for (var q = i; q <= j; q++) out.push(sepIni + nums[q] + sepFin);
    i = j + 1;
  }
  return out.join(coma);
}

/** Autor y año como en Chicago autor-fecha: Apellido 2020 | A y B 2020 | A et al. 2020 */
function citaChicago_(b) {
  var a = b.autores || [], anio = b.anio || 's. f.';
  if (!a.length) return 'Autor desconocido ' + anio;
  if (a.length === 1) return a[0].apellido + ' ' + anio;
  if (a.length <= 3) return a.slice(0, a.length - 1).map(function (x) { return x.apellido; }).join(', ') + ' y ' + a[a.length - 1].apellido + ' ' + anio;
  return a[0].apellido + ' et al. ' + anio;
}

/** Quien firma, para citar en forma narrativa: Apellido | A y B | A et al. */
function quienCita_(b) {
  var a = b.autores || [];
  return !a.length ? 'Autor desconocido' : (a.length === 1 ? a[0].apellido : (a.length === 2 ? a[0].apellido + ' y ' + a[1].apellido : a[0].apellido + ' et al.'));
}
/** Cita narrativa segun el estilo: Apellido (2020) en APA y Chicago; Apellido [3] en IEEE; Apellido (3) en Vancouver. */
function citaNarrativa_(b) {
  var e = estiloActual_();
  if (e === 'ieee') return quienCita_(b) + ' [' + numeroCita_(b.clave_cita) + ']';
  if (e === 'vancouver') return quienCita_(b) + ' (' + numeroCita_(b.clave_cita) + ')';
  return quienCita_(b) + ' (' + (b.anio || 's. f.') + ')';
}

// ---------------------------------------------------------------- referencias por estilo
function autorIEEE_(a) { var ini = iniciales_(a.nombre); return (ini ? ini + ' ' : '') + a.apellido; }
function autoresIEEE_(l) {
  l = (l || []).map(autorIEEE_);
  if (!l.length) return 'Autor desconocido';
  if (l.length > 6) return l[0] + ' et al.';
  if (l.length === 1) return l[0];
  return l.slice(0, l.length - 1).join(', ') + ' y ' + l[l.length - 1];
}
function autorVancouver_(a) { return a.apellido + (a.nombre ? ' ' + iniciales_(a.nombre).replace(/[.\s-]/g, '') : ''); }
function autoresVancouver_(l) {
  l = (l || []).map(autorVancouver_);
  if (!l.length) return 'Autor desconocido';
  if (l.length > 6) return l.slice(0, 6).join(', ') + ', et al';
  return l.join(', ');
}
function autoresChicago_(l) {
  l = l || [];
  if (!l.length) return 'Autor desconocido';
  var primero = l[0].apellido + (l[0].nombre ? ', ' + l[0].nombre : '');
  if (l.length === 1) return primero;
  if (l.length > 10) return primero + ' et al';
  var resto = l.slice(1).map(function (a) { return (a.nombre ? a.nombre + ' ' : '') + a.apellido; });
  return primero + (resto.length > 1 ? ', ' + resto.slice(0, resto.length - 1).join(', ') : '') + ' y ' + resto[resto.length - 1];
}
function paginas_(p) { return String(p || '').replace(/^([A-Za-z]?\d+)\s*-+\s*([A-Za-z]?\d+)$/, '$1–$2'); }
function enlaceRef_(b) { return b.doi ? 'https://doi.org/' + b.doi : (b.url || ''); }

function referenciaIEEE_(b, n) {
  var tr = [{ t: (n ? '[' + n + '] ' : '') + autoresIEEE_(b.autores) + ', ', i: false }];
  var anio = b.anio || 's. f.';
  if (b.tipo === 'articulo') {
    tr.push({ t: '«' + String(b.titulo || '').replace(/[.\s]+$/, '') + '», ', i: false });
    if (b.fuente) tr.push({ t: b.fuente, i: true });
    var resto = (b.volumen ? ', vol. ' + b.volumen : '') + (b.numero ? ', n.º ' + b.numero : '') + (b.paginas ? ', pp. ' + paginas_(b.paginas) : '') + ', ' + anio;
    tr.push({ t: resto + (b.doi ? ', doi: ' + b.doi + '.' : '.'), i: false });
    if (!b.doi && b.url) tr.push({ t: ' [En línea]. Disponible en: ' + b.url, i: false });
  } else if (b.tipo === 'libro') {
    tr.push({ t: String(b.titulo || '').replace(/[.\s]+$/, ''), i: true });
    tr.push({ t: '. ' + (b.editorial || b.fuente ? (b.editorial || b.fuente) + ', ' : '') + anio + '.' + (enlaceRef_(b) ? ' [En línea]. Disponible en: ' + enlaceRef_(b) : ''), i: false });
  } else {
    tr.push({ t: '«' + String(b.titulo || '').replace(/[.\s]+$/, '') + '», ', i: false });
    var donde = b.tipo === 'tesis' ? (b.grado || 'Tesis') + (b.fuente ? ', ' + b.fuente : '') : (b.fuente || b.editorial || '');
    tr.push({ t: (donde ? donde + ', ' : '') + anio + '.' + (enlaceRef_(b) ? ' [En línea]. Disponible en: ' + enlaceRef_(b) : ''), i: false });
  }
  return tr;
}
function referenciaVancouver_(b, n) {
  var tr = [{ t: (n ? n + '. ' : '') + autoresVancouver_(b.autores) + '. ', i: false }];
  var anio = b.anio || 's. f.';
  var tit = puntoFinal_(b.titulo);
  if (b.tipo === 'articulo') {
    tr.push({ t: tit + ' ' + (b.fuente ? b.fuente + '. ' : '') + anio + (b.volumen ? ';' + b.volumen : '') + (b.numero ? '(' + b.numero + ')' : '') + (b.paginas ? ':' + String(b.paginas).replace(/\s+/g, '') : '') + '.' + (b.doi ? ' doi:' + b.doi : (b.url ? ' Disponible en: ' + b.url : '')), i: false });
  } else if (b.tipo === 'tesis') {
    tr.push({ t: String(b.titulo || '').replace(/[.\s]+$/, '') + ' [' + String(b.grado || 'tesis').toLowerCase() + ']. ' + (b.fuente ? b.fuente + '; ' : '') + anio + '.' + (enlaceRef_(b) ? ' Disponible en: ' + enlaceRef_(b) : ''), i: false });
  } else {
    tr.push({ t: tit + ' ' + (b.editorial || b.fuente ? (b.editorial || b.fuente) + '; ' : '') + anio + '.' + (enlaceRef_(b) ? ' Disponible en: ' + enlaceRef_(b) : ''), i: false });
  }
  return tr;
}
function referenciaChicago_(b) {
  var tr = [{ t: puntoFinal_(autoresChicago_(b.autores)) + ' ' + (b.anio || 's. f.') + '. ', i: false }];
  if (b.tipo === 'articulo') {
    tr.push({ t: '«' + puntoFinal_(b.titulo) + '» ', i: false });
    if (b.fuente) tr.push({ t: b.fuente, i: true });
    tr.push({ t: (b.volumen ? ' ' + b.volumen : '') + (b.numero ? ' (' + b.numero + ')' : '') + (b.paginas ? ': ' + paginas_(b.paginas) : '') + '. ', i: false });
  } else if (b.tipo === 'libro') {
    tr.push({ t: puntoFinal_(b.titulo), i: true });
    tr.push({ t: ' ' + (b.editorial || b.fuente ? puntoFinal_(b.editorial || b.fuente) + ' ' : ''), i: false });
  } else {
    tr.push({ t: '«' + puntoFinal_(b.titulo) + '» ', i: false });
    tr.push({ t: (b.tipo === 'tesis' ? (b.grado || 'Tesis') + (b.fuente ? ', ' + b.fuente : '') : (b.fuente || b.editorial || '')) + '. ', i: false });
  }
  if (enlaceRef_(b)) tr.push({ t: enlaceRef_(b), i: false });
  return tr;
}
/** Referencia en el estilo pedido (n: numero, solo para IEEE y Vancouver). */
function referenciaEstilo_(b, estilo, n) {
  if (estilo === 'ieee') return referenciaIEEE_(b, n);
  if (estilo === 'vancouver') return referenciaVancouver_(b, n);
  if (estilo === 'chicago') return referenciaChicago_(b);
  return referenciaAPA_(b);
}

/** Referencia APA como lista de tramos [{t: texto, i: cursiva}]. */
function referenciaAPA_(b) {
  var tr = [];
  var anio = b.anio || 's. f.';
  var cab = autoresAPA_(b.autores);
  cab = (/\.$/.test(cab) ? cab : cab + '.') + ' (' + anio + '). ';
  tr.push({ t: cab, i: false });
  var enlace = b.doi ? 'https://doi.org/' + b.doi : (b.url || '');
  if (b.tipo === 'articulo') {
    tr.push({ t: puntoFinal_(b.titulo) + ' ', i: false });
    if (b.fuente) {
      tr.push({ t: b.fuente + (b.volumen ? ', ' + b.volumen : ''), i: true });
      var pags = paginas_(b.paginas);
      var resto = (b.numero ? '(' + b.numero + ')' : '') + (pags ? ', ' + pags : '') + '. ';
      tr.push({ t: resto, i: false });
    }
  } else if (b.tipo === 'tesis') {
    tr.push({ t: b.titulo, i: true });
    tr.push({ t: ' [' + (b.grado || 'Tesis') + (b.fuente ? ', ' + b.fuente : '') + ']. ' + (b.editorial ? puntoFinal_(b.editorial) + ' ' : ''), i: false });
  } else {
    tr.push({ t: puntoFinal_(b.titulo), i: true });
    tr.push({ t: ' ' + (b.editorial || b.fuente ? puntoFinal_(b.editorial || b.fuente) + ' ' : ''), i: false });
  }
  if (enlace) tr.push({ t: enlace, i: false });
  return tr;
}

function referenciaTexto_(b, estilo) { return referenciaEstilo_(b, estilo || 'apa').map(function (x) { return x.t; }).join('').replace(/\s+/g, ' ').trim(); }

/** Claves citadas en un texto, en orden de aparicion. */
function clavesEn_(texto) {
  var r = [];
  var re = /\[@([A-Za-z0-9_\-]+)\]/g;
  var m;
  while ((m = re.exec(String(texto || ''))) !== null) { if (r.indexOf(m[1]) < 0) r.push(m[1]); }
  return r;
}

/**
 * Reemplaza [@clave] por la cita en el estilo del documento (APA si no se inicio uno). Varias claves seguidas van juntas.
 * usadas: objeto donde se anotan las claves citadas. faltan: lista de claves sin estudio.
 */
function resolverCitas_(texto, mapa, usadas, faltan) {
  // Al traer el plan al borrador, las citas se dejan como [@clave] para que sigan vivas
  if (CACHE_.crudo) return String(texto || '');
  var estilo = estiloActual_();
  return String(texto || '').replace(/\[@[A-Za-z0-9_\-]+\](?:\s*[,;]?\s*\[@[A-Za-z0-9_\-]+\])*/g, function (grupo) {
    var claves = clavesEn_(grupo);
    var malas = [], nums = [], partes = [];
    claves.forEach(function (k) {
      if (!mapa[k]) { if (faltan && faltan.indexOf(k) < 0) faltan.push(k); malas.push('[cita no encontrada: ' + k + ']'); return; }
      if (usadas) usadas[k] = true;
      if (esNumerico_(estilo)) nums.push(numeroCita_(k));
      else partes.push(estilo === 'chicago' ? citaChicago_(mapa[k]) : citaCorta_(mapa[k]));
    });
    var buenas = '';
    if (nums.length) buenas = estilo === 'ieee' ? rangos_(nums, '[', ']', '–', ', ') : '(' + rangos_(nums, '', '', '-', ',') + ')';
    else if (partes.length) buenas = '(' + partes.join('; ') + ')';
    // Un grupo sin ninguna fuente valida no lleva parentesis: queda solo la marca
    return [buenas].concat(malas).filter(function (x) { return x; }).join(' ');
  });
}

function mapaBiblioteca_(bib) {
  var m = Object.create(null);
  bib.forEach(function (b) { m[b.clave_cita] = b; });
  return m;
}

/** Todo el texto del expediente donde puede haber citas. */
function textoCompleto_(exp) {
  var s = '';
  for (var k in exp) { if (exp.hasOwnProperty(k) && k.charAt(0) !== '_') s += '\n' + exp[k]; }
  return s;
}

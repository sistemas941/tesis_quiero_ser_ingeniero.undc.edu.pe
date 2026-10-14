/**
 * Padron.gs - Carga del padron de tesistas y asesores con sus borradores, y revision por secciones.
 *
 * Para cargar el padron: importe el libro Padron_y_borradores.xlsx en la hoja de datos
 * (Archivo > Importar > Insertar hojas nuevas). Quedan tres pestanas: Padron, PadronBorradores
 * y PadronBiblioteca. Luego ejecute cargarPadron() desde el editor. Se puede ejecutar varias veces:
 * no duplica usuarios ni fuentes y no pisa lo que el estudiante ya escribio.
 */

function cargarPadron() {
  var p = PropertiesService.getScriptProperties();
  var activo = '', efectivo = '';
  try { activo = String(Session.getActiveUser().getEmail() || ''); } catch (e0) { activo = ''; }
  try { efectivo = String(Session.getEffectiveUser().getEmail() || ''); } catch (e1) { efectivo = ''; }
  if (p.getProperty('PERMITIR_INSTALAR') !== 'SI' && (!activo || activo.toLowerCase() !== efectivo.toLowerCase())) {
    throw new Error('cargarPadron() solo puede ejecutarla el propietario, desde el editor de Apps Script.');
  }
  CACHE_ = {};
  renovarCacheCompartida_();
  var ss = libro_();
  ['Padron', 'PadronBorradores', 'PadronBiblioteca'].forEach(function (n) {
    if (!ss.getSheetByName(n)) throw new Error('Falta la pestaña «' + n + '». Importe primero el libro Padron_y_borradores.xlsx en la hoja de datos.');
  });
  var inicio = new Date().getTime();
  var r = conBloqueo_(function () { return cargarUsuariosYBorradores_(ss); });
  var b = cargarBibliotecaPadron_(ss, inicio);
  CACHE_ = {};
  renovarCacheCompartida_();
  var msj = 'Padrón cargado.\nUsuarios nuevos: ' + r.nuevos + ' (actualizados: ' + r.actualizados + ').\nBorradores cargados: ' + r.borradores + ' (campos: ' + r.campos + ').\n' +
    'Fuentes agregadas: ' + b.agregadas + ' (verificadas en Crossref: ' + b.verificadas + '; por revisar: ' + b.porRevisar + ').' +
    (b.faltan ? '\nQuedaron ' + b.faltan + ' fuentes sin cargar por tiempo: ejecute cargarPadron() otra vez para terminar.' : '') +
    '\nLas claves iniciales se ven en Administración mientras cada persona no la cambie.';
  Logger.log(msj);
  return 'Padrón cargado. El detalle está en el registro de ejecución.';
}

function filasDe_(ss, n) {
  var v = ss.getSheetByName(n).getDataRange().getValues();
  if (!v.length) return [];
  var cab = v[0].map(function (x) { return String(x).trim(); });
  var out = [];
  for (var i = 1; i < v.length; i++) {
    var o = {}, vacia = true;
    for (var j = 0; j < cab.length; j++) { o[cab[j]] = texto_(v[i][j]); if (o[cab[j]] !== '') vacia = false; }
    if (!vacia) { o._fila = i + 1; out.push(o); }
  }
  return out;
}

function cargarUsuariosYBorradores_(ss) {
  var padron = filasDe_(ss, 'Padron');
  var r = { nuevos: 0, actualizados: 0, borradores: 0, campos: 0 };
  // 1. usuarios
  padron.forEach(function (f) {
    var correo = normCorreo_(f.correo);
    if (!correo) return;
    olvidar_('Usuarios');
    var u = usuario_(correo);
    var rol = f.rol === 'asesor' ? 'asesor' : (f.rol === 'admin' ? 'admin' : 'estudiante');
    if (u) {
      var o = { alias: normCorreo_(f.alias), nombre: f.nombre || u.nombre };
      if (rol === 'estudiante') o.asesor = normCorreo_(f.asesor);
      if (u.rol !== 'admin') o.rol = rol;
      actualizar_('Usuarios', u._fila, o);
      r.actualizados++;
    } else {
      agregar_('Usuarios', { correo: correo, nombre: f.nombre, rol: rol, codigo: String(f.clave_inicial || '').trim() || claveInicial_(f.nombre), asesor: rol === 'estudiante' ? normCorreo_(f.asesor) : '',
        activo: 'SI', creado: ahora_(), alias: normCorreo_(f.alias), clave_hash: '', sal: '', cambiar_clave: 'SI', intentos: '0', bloqueo: '', ultimo_ingreso: '' });
      r.nuevos++;
    }
  });
  // Las claves iniciales ya estan en Usuarios: no se dejan en la pestana importada
  var shP = ss.getSheetByName('Padron');
  var cabP = shP.getRange(1, 1, 1, shP.getLastColumn()).getValues()[0].map(String);
  var colClave = cabP.indexOf('clave_inicial') + 1;
  if (colClave > 0 && shP.getLastRow() > 1) shP.getRange(2, colClave, shP.getLastRow() - 1, 1).clearContent();

  // 2. borradores: solo se escriben los campos que el estudiante aun no tiene
  var porCorreo = {};
  filasDe_(ss, 'PadronBorradores').forEach(function (f) {
    var c = normCorreo_(f.correo);
    if (!c || !f.clave) return;
    (porCorreo[c] = porCorreo[c] || {})[f.clave] = f.valor;
  });
  var datosPadron = {};
  padron.forEach(function (f) { datosPadron[normCorreo_(f.correo)] = f; });
  Object.keys(porCorreo).forEach(function (correo) {
    var exp = expediente_(correo);
    if (exp._borrador) return;                  // ya se cargo una vez: no se vuelve a escribir
    var f = datosPadron[correo] || {};
    var asesor = f.asesor ? usuario_(f.asesor) : null;
    var valores = porCorreo[correo];
    if (f.nombre && !valores.autor1) valores.autor1 = f.nombre;
    if (f.asesor_caratula && !valores.asesor_nombre) valores.asesor_nombre = f.asesor_caratula;
    if (f.titulo_original) valores._titulo_original = f.titulo_original;
    if (f.titulo_motivo) valores._titulo_motivo = f.titulo_motivo;
    if (f.titulo_propuesto) valores._titulo_propuesto = f.titulo_propuesto;
    valores._borrador = ahora_();
    var nuevos = {};
    Object.keys(valores).forEach(function (k) { if (!String(exp[k] || '').trim()) nuevos[k] = valores[k]; });
    var n = guardarCampos_(correo, nuevos).length;
    if (n) { r.borradores++; r.campos += n; }
  });
  return r;
}

/** Normaliza los autores «Apellido, I.; Apellido, I.» al formato de la biblioteca. */
function autoresPadron_(txt) { return parsearAutores_(String(txt || '')); }

function cargarBibliotecaPadron_(ss, inicio) {
  var filas = filasDe_(ss, 'PadronBiblioteca');
  var r = { agregadas: 0, verificadas: 0, porRevisar: 0, faltan: 0 };
  olvidar_('Biblioteca');
  var hay = {};
  leer_('Biblioteca').forEach(function (b) { hay[normCorreo_(b.correo) + '|' + b.clave_cita] = true; });
  var pendientes = filas.filter(function (f) { return f.correo && f.clave_cita && !hay[normCorreo_(f.correo) + '|' + f.clave_cita]; });
  // Se verifican los DOI por lotes, en paralelo, y se escribe al final de cada lote
  var lote = 15;
  for (var i = 0; i < pendientes.length; i += lote) {
    if (new Date().getTime() - inicio > 270000) { r.faltan = pendientes.length - i; break; }
    var grupo = pendientes.slice(i, i + lote);
    var metas = verificarDoisLote_(grupo.map(function (f) { return limpiarDoi_(f.doi); }));
    var nuevas = [];
    grupo.forEach(function (f, k) {
      var doi = limpiarDoi_(f.doi);
      var meta = metas[k];
      var verificado = 'no';
      if (doi && meta && titulosParecidos_(meta.titulo, f.titulo)) { verificado = 'crossref'; r.verificadas++; }
      else if (doi) { meta = null; verificado = 'revisar'; r.porRevisar++; }
      else if (urlSegura_(f.url)) { verificado = 'manual'; }
      var autores = (meta && meta.autores.length) ? meta.autores : autoresPadron_(f.autores);
      nuevas.push({
        id: Utilities.getUuid(), correo: normCorreo_(f.correo), clave_cita: f.clave_cita, tipo: f.tipo || 'articulo', uso: f.uso || 'antecedente',
        doi: doi, url: urlSegura_(f.url) || (doi ? 'https://doi.org/' + doi : ''), autores: JSON.stringify(autores), anio: String((meta && meta.anio) || f.anio || ''),
        titulo: (meta && meta.titulo) || f.titulo, fuente: (meta && meta.fuente) || f.fuente || '', volumen: (meta && meta.volumen) || f.volumen || '',
        numero: (meta && meta.numero) || f.numero || '', paginas: (meta && meta.paginas) || f.paginas || '', editorial: (meta && meta.editorial) || f.editorial || '',
        grado: f.grado || '', indizacion: f.indizacion || '', verificado: verificado, resumen: '', objetivo: f.objetivo || '', metodologia: f.metodologia || '',
        resultados: f.resultados || '', conclusion: f.conclusion || '', relacion: f.relacion || '', creado: ahora_(), sin_resolver: f.sin_resolver || '', ambito: f.ambito || ''
      });
    });
    conBloqueo_(function () {
      var cab = cabecera_('Biblioteca');
      var sh = hoja_('Biblioteca');
      asegurarFilas_(sh, cab.length, nuevas.length);
      sh.getRange(sh.getLastRow() + 1, 1, nuevas.length, cab.length).setValues(nuevas.map(function (o) { return cab.map(function (c) { return celda_(o[c]); }); }));
      olvidar_('Biblioteca');
      nuevas.forEach(function (o) { tocar_(o.correo); });
    });
    r.agregadas += nuevas.length;
  }
  return r;
}

/** Consulta varios DOI a la vez en Crossref. Devuelve los metadatos (o null) en el mismo orden. */
function verificarDoisLote_(dois) {
  var pedidos = [], pos = [];
  var correo = cfg_('CORREO_CONTACTO', '');
  dois.forEach(function (d, i) {
    if (!d) return;
    pedidos.push({ url: 'https://api.crossref.org/works/' + encodeURIComponent(d) + (correo ? '?mailto=' + encodeURIComponent(correo) : ''), muteHttpExceptions: true });
    pos.push(i);
  });
  var out = dois.map(function () { return null; });
  if (!pedidos.length) return out;
  var resp = [];
  try { resp = UrlFetchApp.fetchAll(pedidos); } catch (e) { return out; }
  resp.forEach(function (rr, k) {
    try { if (rr.getResponseCode() === 200) out[pos[k]] = deCrossref_(JSON.parse(rr.getContentText()).message); } catch (e2) { /* queda sin verificar */ }
  });
  return out;
}

/** Dos titulos se consideran el mismo si comparten casi todas sus palabras significativas. */
function titulosParecidos_(a, b) {
  function pal(s) { return sinTildes_(String(s || '')).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 3; }); }
  var x = pal(a), y = pal(b);
  if (!x.length || !y.length) return false;
  var conj = {};
  y.forEach(function (w) { conj[w] = true; });
  var comunes = x.filter(function (w) { return conj[w]; }).length;
  return comunes / Math.min(x.length, y.length) >= 0.7;
}

// ---------------------------------------------------------------- revision por secciones
function leerRevision_(exp) { try { return exp._revision ? JSON.parse(exp._revision) : {}; } catch (e) { return {}; } }

/** El estudiante marca una seccion como revisada (o deshace la marca). Devuelve la pagina al dia. */
function revisarSeccion_(ses, a) {
  var id = String(a.seccion || '');
  var v = vistaPrevia_(ses.correo);
  if (!v.hashes.hasOwnProperty(id)) throw new Error('Esa sección no existe en tu documento.');
  if (String(cfg_('REVISION_VERDE', 'estudiante')).toLowerCase() === 'asesor' && a.estado !== 'quitar') throw new Error('En este curso, las secciones las pone en verde tu asesor.');
  conBloqueo_(function () {
    olvidar_('Expedientes');
    var rev = leerRevision_(expediente_(ses.correo));
    if (a.estado === 'quitar') delete rev[id];
    else rev[id] = { e: 'ok', h: v.hashes[id], f: ahora_(), por: 'estudiante' };
    guardarCampos_(ses.correo, { _revision: JSON.stringify(rev) });
  });
  olvidar_('Expedientes');
  return vistaPrevia_(ses.correo);
}

/** El asesor aprueba o devuelve una seccion con un comentario. */
function revisarSeccionAsesor_(ses, a) {
  var correo = normCorreo_(a.correo);
  if (!puedeVer_(ses, correo)) throw new Error('Ese estudiante no está a tu cargo.');
  var id = String(a.seccion || '');
  var v = vistaPrevia_(correo);
  if (!v.hashes.hasOwnProperty(id)) throw new Error('Esa sección no existe en el documento.');
  var decision = String(a.decision || '');
  if (['aprobar', 'devolver'].indexOf(decision) < 0) throw new Error('Decisión no válida.');
  var texto = String(a.comentario || '').trim();
  if (decision === 'devolver' && texto.length < 10) throw new Error('Al devolver una sección, escribe qué debe corregir el estudiante.');
  conBloqueo_(function () {
    olvidar_('Expedientes');
    var rev = leerRevision_(expediente_(correo));
    rev[id] = decision === 'aprobar' ? { e: 'ok', h: v.hashes[id], f: ahora_(), por: 'asesor' } : { e: 'devuelto', c: texto, f: ahora_(), por: 'asesor' };
    guardarCampos_(correo, { _revision: JSON.stringify(rev) });
    var tit = (v.revision.secciones.filter(function (x) { return x.id === id; })[0] || {}).titulo || id;
    agregar_('Comentarios', { fecha: ahora_(), correo: correo, etapa: 'doc', autor: ses.nombre, rol: ses.rol, texto: (decision === 'aprobar' ? 'Sección aprobada: ' : 'Sección devuelta (' + tit + '): ') + texto, decision: decision === 'aprobar' ? 'seccion_ok' : 'seccion_devuelta' });
  });
  olvidar_('Expedientes');
  return vistaPrevia_(correo);
}

/** Resumen de revision para el panel: { revisadas, total }. */
function resumenRevision_(correo) {
  try { var v = vistaPrevia_(correo); return { revisadas: v.revision.revisadas, total: v.revision.total }; } catch (e) { return { revisadas: 0, total: 0 }; }
}

/** Secciones del documento revisadas por el estudiante y aprobadas por el asesor (marcas guardadas). */
function seccionesRev_(exp) {
  var rv = leerRevision_(exp), r = { revisadas: 0, aprobadas: 0, devueltas: 0 };
  Object.keys(rv).forEach(function (k) {
    var x = rv[k] || {};
    if (x.e === 'ok') { r.revisadas++; if (x.por === 'asesor') r.aprobadas++; }
    if (x.e === 'devuelto') r.devueltas++;
  });
  return r;
}

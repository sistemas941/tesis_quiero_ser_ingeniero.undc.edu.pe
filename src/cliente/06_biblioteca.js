// ------------------------------------------------------------------ Biblioteca
var USOS = [['antecedente', 'Antecedente'], ['teoria', 'Bases teóricas'], ['contexto', 'Contexto del problema'], ['metodologia', 'Metodología']];
var AMBITOS = [['nacional', 'Nacional (Perú)'], ['internacional', 'Internacional']];
var TIPOS = [['articulo', 'Artículo'], ['tesis', 'Tesis'], ['libro', 'Libro'], ['otro', 'Otro']];
var INDIZ = ['Scopus', 'Web of Science', 'SciELO', 'Otra', 'No sé'];
var GRADOS = ['Tesis de pregrado', 'Tesis de maestría', 'Tesis doctoral', 'Trabajo de titulación'];
function nombreDe(lista, v) { for (var i = 0; i < lista.length; i++) { if (lista[i][0] === v) return lista[i][1]; } return v; }
function opcionesSel(lista, v) { return lista.map(function (o) { var val = typeof o === 'string' ? o : o[0], txt = typeof o === 'string' ? o : o[1]; return '<option value="' + esc(val) + '"' + (v === val ? ' selected' : '') + '>' + esc(txt) + '</option>'; }).join(''); }
function fichaCompleta(b) { return !!(b.objetivo && b.metodologia && b.resultados && b.conclusion && b.relacion); }

function vistaBiblioteca() {
  return '<div class="cabecera"><h1>Biblioteca</h1><p>Aquí están tus fuentes. Solo lo que agregues aquí se puede citar, y los antecedentes del capítulo II se redactan a partir de estas fichas. Así ninguna referencia es inventada.</p></div>' +
    '<div class="pila">' + estiloCitasHtml() + '<div id="conteo-bib">' + conteoHtml() + '</div><div class="tarjeta" id="agregar">' + agregarHtml() + '</div><div id="lista-fuentes">' + listaFuentesHtml() + '</div></div>';
}

/** Selector del estilo de citas (IEEE por defecto). Cambia las citas del texto y la lista de referencias. */
function estiloCitasHtml() {
  var e = estiloCita();
  return '<div class="tarjeta plana estilo-citas" id="estilo-citas"><div><b>Estilo de citas de tu tesis</b><p class="pequeno tenue" style="margin:2px 0 0">Las citas y la lista de referencias se arman solas en este estilo. Las tablas y figuras siguen el formato APA 7.</p></div><div class="segmentos" role="group" aria-label="Estilo de citas">' +
    ESTILOS_CITA.map(function (x) { return '<button class="' + (x[0] === e ? 'activo' : '') + '" data-a="estiloCitas" data-e="' + x[0] + '" title="' + esc(x[2]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>';
}
function cambiarEstilo(e, btn) {
  if (e === estiloCita()) return;
  var fin = ocupar(btn, '');
  llamar('estiloCitas', { estilo: e }).then(function (r) {
    fin();
    S.exp._estilo_cita = r.estilo;
    S.vistaDoc = r.vista;
    var c = $('#estilo-citas');
    if (c) c.outerHTML = estiloCitasHtml();
    if (S.vista === 'biblioteca') repintarBiblioteca();
    if ($('#hojas')) ponerVista(r.vista);
    toast('Tu tesis ahora cita en ' + nombreEstilo(r.estilo) + '.', 'bien');
  }).catch(function (e2) { fin(); fallo(e2); });
}

function conteoHtml() {
  var d = S.d, cb = conteoBiblioteca(d.biblioteca), minA = parseInt(d.config.MIN_ARTICULOS, 10) || 5, minT = parseInt(d.config.MIN_TESIS, 10) || 5;
  function caja(t, n, min) { var ok = n >= min; return '<div class="tarjeta plana"><div class="fila entre"><span class="tenue">' + t + '</span><span class="chip ' + (ok ? 'verde' : 'ambar') + '">' + (ok ? IC.check + 'Cumple' : 'Faltan ' + (min - n)) + '</span></div><div style="font-size:26px;font-weight:700;font-family:var(--mono)">' + n + ' <span class="tenue" style="font-size:15px;font-weight:400">de ' + min + '</span></div></div>'; }
  return '<div class="rejilla tres">' + caja('Artículos como antecedentes', cb.articulos, minA) + caja('Tesis como antecedentes', cb.tesis, minT) +
    '<div class="tarjeta plana"><span class="tenue">Fuentes en total</span><div style="font-size:26px;font-weight:700;font-family:var(--mono)">' + cb.total + '</div></div></div>';
}

function agregarHtml() {
  var p = S.pestana, anio = new Date().getFullYear(), ant = parseInt(S.d.config.ANTIGUEDAD_MAX, 10) || 5;
  var h = '<h3>Agregar fuentes</h3><div class="pestanas" style="max-width:820px"><button data-a="pestanaBib" data-p="consensus" class="' + (p === 'consensus' ? 'activo' : '') + '">Consensus</button><button data-a="pestanaBib" data-p="buscar" class="' + (p === 'buscar' ? 'activo' : '') + '">Buscar artículos</button><button data-a="pestanaBib" data-p="doi" class="' + (p === 'doi' ? 'activo' : '') + '">Tengo el DOI</button><button data-a="pestanaBib" data-p="mano" class="' + (p === 'mano' ? 'activo' : '') + '">Tesis o libro</button><button data-a="pestanaBib" data-p="extraer" class="' + (p === 'extraer' ? 'activo' : '') + '">' + IC.subir + 'Desde un documento</button></div>';
  if (p === 'buscar') {
    var b = S.busqueda || {};
    h += '<form data-f="buscar" class="fila" style="align-items:flex-end"><div class="campo-simple crece" style="margin:0;min-width:220px"><label for="b-q">Palabras clave (mejor en inglés)</label><input id="b-q" type="search" required minlength="3" value="' + esc(b.q || '') + '" placeholder="chest x-ray convolutional neural network"></div>' +
      '<div class="campo-simple" style="margin:0;width:120px"><label for="b-desde">Desde el año</label><input id="b-desde" type="number" min="1950" max="' + anio + '" value="' + esc(b.desde || (anio - ant)) + '"></div><button class="btn primario" type="submit">Buscar</button></form>' +
      '<p class="pequeno tenue" style="margin-top:8px">Se consulta OpenAlex y, si no responde, Crossref. Al agregar un artículo, sus datos se verifican con su DOI.</p><div id="resultados" style="margin-top:12px">' + resultadosHtml() + '</div>';
  } else if (p === 'doi') {
    h += '<form data-f="porDoi" class="fila" style="align-items:flex-end"><div class="campo-simple crece" style="margin:0;min-width:220px"><label for="d-doi">DOI del artículo</label><input id="d-doi" type="text" required placeholder="10.1016/j.compbiomed.2020.103792" class="mono"></div>' +
      '<div class="campo-simple" style="margin:0;width:210px"><label for="d-uso">Lo usaré como</label><select id="d-uso">' + opcionesSel(USOS, 'antecedente') + '</select></div><button class="btn primario" type="submit">Verificar y agregar</button></form>' +
      '<p class="pequeno tenue" style="margin-top:8px">Si encontraste el artículo en Consensus, Scopus o Google Académico, copia aquí su DOI. Los datos (autores, revista, año, páginas) se toman del registro oficial de Crossref.</p>';
  } else if (p === 'consensus') {
    h += consensusHtml();
  } else if (p === 'extraer') {
    h += extraerHtml();
  } else {
    h += '<form data-f="aMano"><div class="ficha" style="border:0;margin:0;padding:0"><div class="par"><div class="campo-simple" style="margin:0"><label for="m-tipo">Tipo</label><select id="m-tipo" data-cambio="tipoMano">' + opcionesSel(TIPOS, 'tesis') + '</select></div>' +
      '<div class="campo-simple" style="margin:0"><label for="m-uso">Lo usaré como</label><select id="m-uso">' + opcionesSel(USOS, 'antecedente') + '</select></div></div>' +
      '<div class="campo-simple" style="margin:0"><label for="m-autores">Autores</label><input id="m-autores" type="text" required placeholder="Apellidos, Nombres; Apellidos, Nombres"></div>' +
      '<div class="par"><div class="campo-simple" style="margin:0"><label for="m-anio">Año</label><input id="m-anio" type="number" min="1900" max="' + anio + '" required></div><div class="campo-simple" style="margin:0" data-solo="tesis"><label for="m-grado">Grado</label><select id="m-grado">' + opcionesSel(GRADOS, GRADOS[0]) + '</select></div></div>' +
      '<div class="campo-simple" style="margin:0"><label for="m-titulo">Título</label><input id="m-titulo" type="text" required></div>' +
      '<div class="par"><div class="campo-simple" style="margin:0" data-solo="tesis articulo otro"><label for="m-fuente" id="m-fuente-l">Universidad</label><input id="m-fuente" type="text"></div><div class="campo-simple" style="margin:0" data-solo="libro otro" hidden><label for="m-editorial">Editorial o institución</label><input id="m-editorial" type="text"></div></div>' +
      '<div class="par" data-solo="articulo" hidden><div class="campo-simple" style="margin:0"><label for="m-volumen">Volumen y número</label><div class="fila" style="flex-wrap:nowrap"><input id="m-volumen" type="text" placeholder="Vol."><input id="m-numero" type="text" placeholder="Núm."></div></div><div class="campo-simple" style="margin:0"><label for="m-paginas">Páginas</label><input id="m-paginas" type="text" placeholder="177-185"></div></div>' +
      '<div class="campo-simple" style="margin:0"><label for="m-url">Enlace al repositorio o a la fuente</label><input id="m-url" type="text" placeholder="https://hdl.handle.net/…"></div></div>' +
      '<div class="fila entre" style="margin-top:12px"><span class="pequeno tenue">Busca tesis en <a href="https://renati.sunedu.gob.pe" target="_blank" rel="noopener">RENATI</a> o <a href="https://alicia.concytec.gob.pe" target="_blank" rel="noopener">ALICIA</a> y copia aquí sus datos y su enlace.</span><button class="btn primario" type="submit">Agregar a mi biblioteca</button></div></form>';
  }
  return h;
}

function resultadosHtml() {
  var b = S.busqueda;
  if (!b) return '';
  if (b.cargando) return '<div class="pensando"><i></i><span>Buscando en los catálogos…</span></div>';
  if (b.error) return '<div class="aviso rojo">' + esc(b.error) + '</div>';
  if (!b.resultados.length) return '<div class="vacio">Sin resultados. Prueba con otras palabras, en inglés, o amplía el año.</div>';
  var tengo = {};
  S.d.biblioteca.forEach(function (x) { if (x.doi) tengo[x.doi] = true; });
  return '<div class="pequeno tenue" style="margin-bottom:8px">' + b.resultados.length + ' resultados de ' + esc(b.origen) + '</div><div class="pila" style="gap:10px">' + b.resultados.map(function (r, i) {
    var aut = r.autores.slice(0, 3).map(function (a) { return esc((a.nombre ? a.nombre + ' ' : '') + a.apellido); }).join(', ') + (r.autores.length > 3 ? ' et al.' : '');
    return '<div class="resultado"><h4>' + esc(r.titulo) + '</h4><div class="pequeno tenue">' + aut + ' · ' + esc(r.anio) + (r.fuente ? ' · <i>' + esc(r.fuente) + '</i>' : '') + (r.citas ? ' · ' + r.citas + ' citas' : '') + '</div>' +
      (r.resumen ? '<div class="resumen" id="res-' + i + '">' + esc(r.resumen) + '</div><button class="btn chico fantasma" data-a="verResumen" data-i="' + i + '" style="padding-left:0">Ver resumen completo</button>' : '<div class="pequeno tenue" style="margin-top:6px">Sin resumen disponible.</div>') +
      '<div class="fila" style="margin-top:8px">' + (r.doi && tengo[r.doi] ? '<span class="chip verde">' + IC.check + 'Ya está en tu biblioteca</span>' : '<select id="uso-' + i + '" style="width:210px" aria-label="Uso">' + opcionesSel(USOS, 'antecedente') + '</select><button class="btn chico primario" data-a="agregarResultado" data-i="' + i + '">' + IC.mas + 'Agregar</button>') +
      (r.doi ? '<span class="mono pequeno tenue">' + esc(r.doi) + '</span>' : '<span class="chip ambar">Sin DOI</span>') + '</div></div>';
  }).join('') + '</div>';
}

function verificacion(b) {
  if (b.verificado === 'crossref') return '<span class="chip verde" title="Datos tomados del registro oficial del DOI">' + IC.check + 'Verificado por DOI</span>';
  if (b.verificado === 'openalex') return '<span class="chip indigo" title="Está en OpenAlex, pero su DOI no se encontró en Crossref">En catálogo</span>';
  if (b.verificado === 'manual') return '<span class="chip borde" title="Ingresado a mano, con enlace">Con enlace</span>';
  if (b.verificado === 'revisar') return '<span class="chip ambar" title="Su DOI no coincide con el registro de Crossref: revisa el DOI o el título">' + IC.alerta + 'DOI por revisar</span>';
  return '<span class="chip rojo" title="Sin DOI ni enlace">' + IC.alerta + 'Sin verificar</span>';
}

function estudioHtml(b) {
  var abierto = !!S.abiertos[b.id], ant = b.uso === 'antecedente';
  var h = '<div class="estudio" id="e-' + esc(b.id) + '"><div class="ref">' + refHtml(b) + '</div><div class="meta"><span class="cita">[@' + esc(b.clave_cita) + ']</span><span class="chip borde">' + esc(nombreDe(TIPOS, b.tipo)) + '</span><span class="chip borde">' + esc(nombreDe(USOS, b.uso)) + '</span>' + (b.uso === 'antecedente' ? '<span class="chip ' + (b.ambito ? 'borde' : 'ambar') + '">' + (b.ambito ? esc(nombreDe(AMBITOS, b.ambito)) : 'Ámbito sin indicar') + '</span>' : '') + verificacion(b) +
    (ant ? (fichaCompleta(b) ? '<span class="chip verde">' + IC.check + 'Ficha completa</span>' : '<span class="chip ambar">Ficha incompleta</span>') : '') +
    (ant && fichaCompleta(b) && !String(b.sin_resolver || '').trim() ? '<span class="chip ambar" title="Es la columna que revela la brecha">Falta: qué deja sin resolver</span>' : '') +
    '<span style="margin-left:auto" class="fila"><button class="btn chico" data-a="alternarFicha" data-id="' + esc(b.id) + '">' + (abierto ? 'Cerrar ficha' : 'Abrir ficha') + '</button></span></div>';
  if (abierto) h += fichaHtml(b);
  return h + '</div>';
}

function fichaHtml(b) {
  var ia = iaDisponible(), manual = b.verificado !== 'crossref';
  function area(k, rot, ph) { return '<div class="campo-simple" style="margin:0"><label for="fi-' + k + '-' + esc(b.id) + '">' + rot + '</label><textarea id="fi-' + k + '-' + esc(b.id) + '" data-k="' + k + '" rows="2" placeholder="' + esc(ph) + '">' + esc(b[k] || '') + '</textarea></div>'; }
  var h = '<form class="ficha" data-f="ficha" data-id="' + esc(b.id) + '"><div class="par"><div class="campo-simple" style="margin:0"><label>Lo uso como</label><select data-k="uso">' + opcionesSel(USOS, b.uso) + '</select></div>' +
    (b.tipo === 'articulo' ? '<div class="campo-simple" style="margin:0"><label>La revista está indizada en</label><select data-k="indizacion"><option value=""></option>' + opcionesSel(INDIZ, b.indizacion) + '</select></div>' : '<div></div>') + '</div>' +
    '<div class="par"><div class="campo-simple" style="margin:0"><label>Ámbito del antecedente</label><select data-k="ambito"><option value="">Sin indicar</option>' + opcionesSel(AMBITOS, b.ambito) + '</select></div><div class="pequeno tenue" style="align-self:end">El documento separa los antecedentes nacionales (Perú) de los internacionales.</div></div>';
  if (manual) {
    h += '<div class="par"><div class="campo-simple" style="margin:0"><label>Autores</label><input type="text" data-k="autores" value="' + esc((b.autores || []).map(function (a) { return a.apellido + (a.nombre ? ', ' + a.nombre : ''); }).join('; ')) + '"></div><div class="campo-simple" style="margin:0"><label>Año</label><input type="text" data-k="anio" value="' + esc(b.anio) + '"></div></div>' +
      '<div class="campo-simple" style="margin:0"><label>Título</label><input type="text" data-k="titulo" value="' + esc(b.titulo) + '"></div>' +
      '<div class="par"><div class="campo-simple" style="margin:0"><label>' + (b.tipo === 'tesis' ? 'Universidad' : 'Revista o fuente') + '</label><input type="text" data-k="fuente" value="' + esc(b.fuente) + '"></div><div class="campo-simple" style="margin:0"><label>Enlace</label><input type="text" data-k="url" value="' + esc(b.url) + '"></div></div>';
  }
  h += '<div id="ant-' + esc(b.id) + '"' + (b.uso === 'antecedente' ? '' : ' hidden') + ' class="pila" style="gap:10px"><div class="aviso gris pequeno">Completa cada frase. Con ellas el plan redacta el párrafo del antecedente. La pregunta «¿Qué deja sin resolver?» no va al párrafo: es la que revela la brecha y alimenta tu tabla de brechas.</div>' +
    area('objetivo', 'Tuvo como objetivo…', 'determinar el efecto de… (empieza con un verbo en infinitivo)') +
    area('metodologia', 'En cuanto a la metodología…', 'se trabajó con una muestra de…, diseño…, instrumento…') +
    area('resultados', 'Los resultados mostraron que…', 'el sistema redujo el tiempo en 35 %… (con cifras)') +
    area('conclusion', 'Se concluyó que…', 'la solución mejora significativamente…') +
    area('sin_resolver', '¿Qué deja sin resolver?', 'no compara con…, solo prueba con…, no mide… (búscalo en las limitaciones y el trabajo futuro)') +
    area('relacion', 'Se relaciona con mi investigación porque…', 'estudia la misma variable… / aporta el instrumento…') + '</div>';
  if (b.resumen) h += '<details><summary class="pequeno tenue" style="cursor:pointer">Resumen del artículo (original)</summary><p class="pequeno tenue" style="margin-top:6px">' + esc(b.resumen) + '</p></details>';
  h += '<div class="fila entre"><div class="fila"><button class="btn chico primario" type="submit">Guardar ficha</button>' +
    (b.resumen && b.resumen.length >= 120 ? '<button class="btn chico" type="button" data-a="resumirEstudio" data-id="' + esc(b.id) + '"' + (ia ? '' : ' disabled') + '>' + IC.chispa + 'Llenar con el resumen</button>' : '') +
    (enlace(b.url) ? '<a class="btn chico fantasma" href="' + esc(enlace(b.url)) + '" target="_blank" rel="noopener">Abrir la fuente</a>' : '') + '</div><button class="btn chico peligro" type="button" data-a="pedirBorrar" data-id="' + esc(b.id) + '">Quitar</button></div></form>';
  return h;
}

function listaFuentesHtml() {
  var bib = S.d.biblioteca;
  if (!bib.length) return '<div class="vacio">Tu biblioteca está vacía. Empieza buscando artículos sobre tus variables.</div>';
  var grupos = [['Antecedentes: artículos', function (b) { return b.uso === 'antecedente' && b.tipo !== 'tesis'; }], ['Antecedentes: tesis', function (b) { return b.uso === 'antecedente' && b.tipo === 'tesis'; }], ['Otras fuentes: teoría, contexto y metodología', function (b) { return b.uso !== 'antecedente'; }]];
  return grupos.map(function (g) {
    var l = bib.filter(g[1]);
    if (!l.length) return '';
    return '<h2 style="margin:18px 0 10px">' + g[0] + ' <span class="tenue" style="font-weight:400">(' + l.length + ')</span></h2><div class="pila" style="gap:10px">' + l.map(estudioHtml).join('') + '</div>';
  }).join('');
}

function repintarBiblioteca(nueva) {
  if (nueva) S.d.biblioteca = nueva;
  var a = $('#conteo-bib'), b = $('#lista-fuentes'), c = $('#resultados');
  if (a) a.innerHTML = conteoHtml();
  if (b) { b.innerHTML = listaFuentesHtml(); crecerTodos(b); }
  if (c) c.innerHTML = resultadosHtml();
}

function buscarEstudios(form) {
  var q = $('#b-q').value, desde = $('#b-desde').value;
  S.busqueda = { q: q, desde: desde, cargando: true };
  $('#resultados').innerHTML = resultadosHtml();
  llamar('buscar', { q: q, desde: desde }).then(function (r) {
    S.busqueda = { q: q, desde: desde, origen: r.origen, resultados: r.resultados };
    if ($('#resultados')) $('#resultados').innerHTML = resultadosHtml();
  }).catch(function (e) { S.busqueda = { q: q, desde: desde, error: e.message }; if ($('#resultados')) $('#resultados').innerHTML = resultadosHtml(); });
}
function trasAgregar(antes, bib, uso) {
  var ids = {};
  antes.forEach(function (x) { ids[x.id] = true; });
  bib.forEach(function (x) { if (!ids[x.id] && uso === 'antecedente') S.abiertos[x.id] = true; });
  repintarBiblioteca(bib);
  var nuevo = bib.filter(function (x) { return !ids[x.id]; })[0];
  toast(nuevo ? 'Agregado. Su clave para citarlo es [@' + nuevo.clave_cita + '].' : 'Agregado.', 'bien');
  if (nuevo && $('#e-' + nuevo.id)) $('#e-' + nuevo.id).scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function agregarResultado(i, btn) {
  var r = S.busqueda.resultados[i], uso = $('#uso-' + i).value, antes = S.d.biblioteca, fin = ocupar(btn, 'Verificando');
  llamar('agregarEstudio', { doi: r.doi, titulo: r.titulo, autores: r.autores, anio: r.anio, fuente: r.fuente, volumen: r.volumen || '', numero: r.numero || '', paginas: r.paginas || '', editorial: r.editorial || '', tipo: r.tipo === 'otro' ? 'articulo' : r.tipo, resumen: r.resumen, url: r.url, origen: S.busqueda.origen, uso: uso })
    .then(function (bib) { trasAgregar(antes, bib, uso); }).catch(function (e) { fin(); fallo(e); });
}
function agregarPorDoi(form) {
  var antes = S.d.biblioteca, uso = $('#d-uso').value, fin = ocupar($('button[type=submit]', form), 'Verificando');
  llamar('agregarEstudio', { doi: $('#d-doi').value, uso: uso }).then(function (bib) { fin(); $('#d-doi').value = ''; trasAgregar(antes, bib, uso); }).catch(function (e) { fin(); fallo(e); });
}
function agregarAMano(form) {
  var antes = S.d.biblioteca, uso = $('#m-uso').value, tipo = $('#m-tipo').value, fin = ocupar($('button[type=submit]', form), 'Agregando');
  var d = { tipo: tipo, uso: uso, autores: $('#m-autores').value, anio: $('#m-anio').value, titulo: $('#m-titulo').value, fuente: $('#m-fuente').value, editorial: $('#m-editorial').value, url: $('#m-url').value.trim(), grado: tipo === 'tesis' ? $('#m-grado').value : '', volumen: $('#m-volumen').value, numero: $('#m-numero').value, paginas: $('#m-paginas').value };
  llamar('agregarEstudio', d).then(function (bib) { fin(); form.reset(); cambiarTipoMano(); trasAgregar(antes, bib, uso); }).catch(function (e) { fin(); fallo(e); });
}
function cambiarTipoMano() {
  var t = $('#m-tipo').value;
  $$('#agregar [data-solo]').forEach(function (el) { el.hidden = el.getAttribute('data-solo').split(' ').indexOf(t) < 0; });
  $('#m-fuente-l').textContent = t === 'tesis' ? 'Universidad' : (t === 'articulo' ? 'Revista' : 'Fuente o sitio');
}
function guardarFicha(form) {
  var id = form.getAttribute('data-id'), datos = {}, fin = ocupar($('button[type=submit]', form), 'Guardando');
  $$('[data-k]', form).forEach(function (el) { datos[el.getAttribute('data-k')] = el.value.trim(); });
  llamar('editarEstudio', { id: id, datos: datos }).then(function (bib) { if (datos.uso !== 'antecedente' || fichaCompleta(datos)) delete S.abiertos[id]; repintarBiblioteca(bib); toast('Ficha guardada.', 'bien'); }).catch(function (e) { fin(); fallo(e); });
}
function resumirEstudio(id, btn) {
  var via = viaIA();
  if (!via) { abrirModoIA(); return; }
  var b0 = S.d.biblioteca.filter(function (x) { return x.id === id; })[0];
  var fin = ocupar(btn, 'Leyendo el resumen');
  var args = conVia({ id: id }, via);
  var pedido;
  if (viaLocal(via)) { args.modo = 'resumir'; pedido = porCopia('iaRespuesta', args, 'Llenar la ficha' + (b0 ? ': ' + citaCorta(b0) : '')); }
  else pedido = llamar('resumirEstudio', args);
  pedido.then(function (r) {
    fin();
    if (via === 'curso') S.d.uso++;
    ['objetivo', 'metodologia', 'resultados', 'conclusion', 'sin_resolver'].forEach(function (k) { var el = $('#fi-' + k + '-' + id); if (el && r[k]) { el.value = r[k]; crecer(el); } });
    toast('Listo. Contrasta la ficha con el artículo completo, escribe qué deja sin resolver y la relación con tu estudio, y guarda.');
  }).catch(function (e) { fin(); if (e && e.cancelado) return; fallo(e); });
}
function pedirBorrar(id) {
  var b = S.d.biblioteca.filter(function (x) { return x.id === id; })[0];
  if (!b) return;
  modal('<h2>Quitar de la biblioteca</h2><p class="tenue">' + refHtml(b) + '</p><p style="margin-top:10px">Las citas <span class="cita">[@' + esc(b.clave_cita) + ']</span> que ya estén en tus textos quedarán sin fuente y bloquearán el cierre de la etapa.</p><div class="fila" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn peligro" data-a="borrarEstudio" data-id="' + esc(id) + '">Quitar</button></div>');
}
function borrarEstudio(id, btn) {
  var fin = ocupar(btn, 'Quitando');
  llamar('borrarEstudio', { id: id }).then(function (bib) { cerrarModal(); delete S.abiertos[id]; repintarBiblioteca(bib); }).catch(function (e) { fin(); fallo(e); });
}

// ------------------------------------------------------------------ Consensus: buscar papers y armar el estado del arte
var CONSENSUS_KEYS = 'https://consensus.app/api-mcp/';
var CONSENSUS_DOCS = 'https://docs.consensus.app/api-get-started';
function claveConsensus() { return S.claveCons || leerLocalUsuario('qsi_consensus'); }
function consensusListo() { return !!claveConsensus() || (S.d && S.d.config.CONSENSUS_CURSO === 'SI'); }

function guiaConsensusHtml(abierta) {
  return '<details class="mini-guia"' + (abierta ? ' open' : '') + '><summary>' + IC.guia + ' Cómo conseguir tu clave de Consensus (gratis: 30 consultas al mes)</summary><ol class="pequeno">' +
    '<li>Entra a <a href="https://consensus.app" target="_blank" rel="noopener">consensus.app</a> con tu cuenta (puede ser la de Google).</li>' +
    '<li>En el menú de la izquierda abre <b>API &amp; MCP</b> o ve directo a <a href="' + CONSENSUS_KEYS + '" target="_blank" rel="noopener">consensus.app/api-mcp</a>.</li>' +
    '<li>Pestaña <b>Keys and clients</b>: crea una clave de API (<i>Create key</i>) y cópiala. Solo se muestra una vez.</li>' +
    '<li>Pégala aquí. Se guarda solo en tu navegador y viaja con cada búsqueda.</li></ol>' +
    '<p class="pequeno tenue">El plan gratuito trae 30 consultas al mes (cada búsqueda rápida usa 1; la profunda, 3). Pro trae 500. Tu consumo aparece en el «API Dashboard» de Consensus. Documentación: <a href="' + CONSENSUS_DOCS + '" target="_blank" rel="noopener">docs.consensus.app</a>.</p></details>';
}

function consensusHtml() {
  var c = S.cons || {}, exp = S.exp || {};
  var h = '<p class="pequeno tenue" style="margin:0 0 10px">Busca en más de 200 millones de artículos revisados por pares con <b>Consensus</b>: cada resultado trae su hallazgo clave, el tipo de estudio y la calidad de la revista. Elige los mejores, agrégalos a tu biblioteca y arma tu <b>estado del arte</b>: síntesis, tendencias, brechas y preguntas abiertas.</p>';
  if (!consensusListo()) {
    return h + '<form data-f="claveConsensus" class="fila" style="align-items:flex-end"><div class="campo-simple crece" style="margin:0;min-width:220px"><label for="cons-clave">Tu clave de la API de Consensus</label><input id="cons-clave" type="password" class="mono" autocomplete="off" required placeholder="Pega tu clave"></div><button class="btn primario" type="submit">Guardar</button></form>' +
      '<label class="fila pequeno" style="margin-top:8px;gap:6px"><input type="checkbox" id="cons-recordar" checked style="width:auto"> Recordarla en este navegador</label>' + guiaConsensusHtml(true);
  }
  var sug = c.q || [exp.var1, exp.var2].filter(function (x) { return x; }).join(' ');
  var anio = new Date().getFullYear(), ant = parseInt(S.d.config.ANTIGUEDAD_MAX, 10) || 5;
  h += '<form data-f="consensus"><div class="fila" style="align-items:flex-end"><div class="campo-simple crece" style="margin:0;min-width:240px"><label for="cons-q">¿Qué quieres saber? (mejor en inglés)</label><input id="cons-q" type="search" required minlength="3" value="' + esc(sug) + '" placeholder="convolutional neural networks pneumonia chest x-ray children"></div>' +
    '<div class="campo-simple" style="margin:0;width:110px"><label for="cons-desde">Desde</label><input id="cons-desde" type="number" min="1950" max="' + anio + '" value="' + esc(c.desde || (anio - ant)) + '"></div></div>' +
    '<div class="fila" style="margin-top:8px"><div class="campo-simple" style="margin:0;width:200px"><label for="cons-tipo">Tipo de estudio</label><select id="cons-tipo"><option value="">Todos</option><option value="revisiones"' + (c.tipo === 'revisiones' ? ' selected' : '') + '>Revisiones y metaanálisis</option></select></div>' +
    '<div class="campo-simple" style="margin:0;width:200px"><label for="cons-dominio">Área</label><select id="cons-dominio"><option value="">Todas</option><option value="cs">Computación</option><option value="eng">Ingeniería</option><option value="med">Medicina</option><option value="econ">Economía</option><option value="edu">Educación</option></select></div>' +
    '<label class="fila pequeno" style="gap:6px;align-self:flex-end;margin-bottom:8px"><input type="checkbox" id="cons-profunda" style="width:auto"' + (c.profunda ? ' checked' : '') + '> <span><b>Búsqueda profunda</b> (3 consultas: tema, límites y revisiones)</span></label>' +
    '<button class="btn primario" type="submit" style="margin-left:auto">' + IC.brujulaN + 'Buscar en Consensus</button></div></form>';
  h += '<div class="fila pequeno tenue" style="margin-top:6px;justify-content:space-between"><span>' + (claveConsensus() ? 'Usas tu clave ····' + esc(claveConsensus().slice(-4)) : 'Usas la clave del curso') + '</span>' + (claveConsensus() ? '<button class="enlace" data-a="olvidarConsensus">Cambiar la clave</button>' : '') + '</div>';
  h += '<div id="cons-res" style="margin-top:12px">' + consResultadosHtml() + '</div>' + estadoGuardadoHtml();
  return h;
}

function consResultadosHtml() {
  var c = S.cons || {};
  if (c.cargando) return '<div class="pensando"><i></i><span>' + esc(c.cargando) + '</span></div>';
  if (c.error) return '<div class="aviso rojo">' + esc(c.error) + '</div>';
  if (!c.resultados) return '';
  if (!c.resultados.length) return '<div class="vacio">Consensus no encontró resultados. Prueba con otras palabras en inglés o amplía los años.</div>';
  var sel = c.resultados.filter(function (r) { return r.sel; }).length;
  var h = (c.avisos && c.avisos.length ? '<div class="aviso ambar pequeno">' + esc(c.avisos.join(' ')) + '</div>' : '') +
    '<div class="fila entre pequeno"><span><b>' + c.resultados.length + '</b> artículos · ' + c.consultas.length + ' consulta(s) a Consensus</span><button class="enlace" data-a="consTodos">' + (sel === c.resultados.filter(function (r) { return !r.ya; }).length ? 'Quitar todos' : 'Marcar todos') + '</button></div><div class="pila" style="gap:8px;margin-top:8px">';
  c.resultados.forEach(function (r, i) {
    var au = r.autores.slice(0, 3).map(function (a) { return a.apellido; }).join(', ') + (r.autores.length > 3 ? ' et al.' : '');
    h += '<label class="ref-cand cons' + (r.sel ? ' sel' : '') + '"><input type="checkbox" data-cons="' + i + '"' + (r.sel ? ' checked' : '') + (r.ya ? ' disabled' : '') + '><div class="crece"><b>' + esc(r.titulo) + '</b><div class="pequeno tenue">' + esc(au) + ' · ' + esc(r.anio) + (r.fuente ? ' · <i>' + esc(r.fuente) + '</i>' : '') + '</div>' +
      (r.hallazgo ? '<div class="cons-hallazgo">' + IC.chispa + esc(r.hallazgo) + '</div>' : '') +
      '<div class="fila" style="gap:6px;margin-top:6px">' + (r.tipoEstudio ? '<span class="chip indigo">' + esc(r.tipoEstudio) + '</span>' : '') + (r.cuartil ? '<span class="chip ' + (String(r.cuartil) === '1' ? 'verde' : 'borde') + '">Q' + esc(r.cuartil) + '</span>' : '') +
      '<span class="chip borde">' + r.citas + ' citas</span>' + (r.muestra ? '<span class="chip borde">n = ' + esc(r.muestra) + '</span>' : '') + (r.preprint ? '<span class="chip ambar">Preprint</span>' : '') + (r.doi ? '' : '<span class="chip ambar">Sin DOI</span>') +
      (r.ya ? '<span class="chip verde">' + IC.check + 'Ya está: [@' + esc(r.ya) + ']</span>' : '') + (r.url ? '<a class="pequeno" href="' + esc(r.url) + '" target="_blank" rel="noopener" data-a="nada">Ver en Consensus' + IC.afuera + '</a>' : '') + '</div></div></label>';
  });
  h += '</div><div class="fila entre" style="margin-top:12px"><span class="pequeno tenue">Los artículos y tesis entran como antecedentes; luego completa sus fichas.</span><div class="fila"><button class="btn" data-a="consAgregar"' + (sel ? '' : ' disabled') + '>' + IC.mas + 'Solo agregar (' + sel + ')</button>' +
    '<button class="btn primario" data-a="consEstado"' + (sel + c.resultados.filter(function (r) { return r.ya; }).length >= 2 ? '' : ' disabled') + attrIA() + '>' + IC.chispa + 'Agregar y armar mi estado del arte</button></div></div>';
  return h;
}
function pintarCons() { var n = $('#cons-res'); if (n) n.innerHTML = consResultadosHtml(); }

function guardarClaveConsensus(form) {
  var k = $('#cons-clave').value.trim();
  if (k.length < 16) { toast('Esa clave parece incompleta.'); return; }
  S.claveCons = k;
  ponerLocal(llaveLocal('qsi_consensus'), $('#cons-recordar').checked ? k : '');
  $('#agregar').innerHTML = agregarHtml();
  toast('Listo: ya puedes buscar en Consensus.', 'bien');
}
function olvidarConsensus() { S.claveCons = ''; ponerLocal(llaveLocal('qsi_consensus'), ''); $('#agregar').innerHTML = agregarHtml(); }

function buscarConsensus(form) {
  var q = $('#cons-q').value.trim(), prof = $('#cons-profunda').checked;
  var consultas = prof ? [q, q + ' limitations challenges future research', q + ' systematic review'] : [q];
  S.cons = { q: q, desde: $('#cons-desde').value, tipo: $('#cons-tipo').value, profunda: prof, cargando: prof ? 'Búsqueda profunda en Consensus (3 consultas)…' : 'Buscando en Consensus…' };
  pintarCons();
  llamar('consensus', { consultas: consultas, desde: S.cons.desde, tipo: S.cons.tipo, dominio: $('#cons-dominio').value, claveConsensus: claveConsensus(), cuantos: prof ? 12 : 20 }).then(function (r) {
    r.resultados.forEach(function (x, i) { x.sel = !x.ya && i < 10 && !!x.doi; });
    S.cons.cargando = '';
    S.cons.resultados = r.resultados; S.cons.consultas = r.consultas; S.cons.avisos = r.avisos;
    pintarCons();
  }).catch(function (e) { S.cons.cargando = ''; S.cons.error = e.message; pintarCons(); });
}
/** Agrega los elegidos (con su hallazgo clave como parte del resumen) y devuelve las claves de todos los elegidos y ya presentes. */
function consAgregarElegidos() {
  var c = S.cons, items = c.resultados.filter(function (r) { return r.sel && !r.ya; }).map(function (r) {
    return { autores: r.autores, anio: r.anio, titulo: r.titulo, fuente: r.fuente, volumen: r.volumen, paginas: r.paginas, editorial: r.editorial, doi: r.doi, url: r.url, tipo: /thesis|dissertation/i.test(r.tipoEstudio) ? 'tesis' : 'articulo', verificado: 'consensus',
      resumen: (r.hallazgo ? 'Hallazgo clave (Consensus): ' + r.hallazgo + '\n' : '') + (r.resumen || '') };
  });
  var antes = {};
  S.d.biblioteca.forEach(function (b) { antes[b.id] = true; });
  var p = items.length ? llamar('agregarReferencias', { items: items, uso: 'auto' }) : Promise.resolve({ biblioteca: S.d.biblioteca, agregadas: 0 });
  return p.then(function (r) {
    repintarBiblioteca(r.biblioteca);
    var nuevas = r.biblioteca.filter(function (b) { return !antes[b.id]; }).map(function (b) { return b.clave_cita; });
    var ya = c.resultados.filter(function (x) { return x.ya && x.sel !== false; }).map(function (x) { return x.ya; });
    c.resultados.forEach(function (x) { if (x.sel && !x.ya) { var b = r.biblioteca.filter(function (z) { return (x.doi && z.doi === x.doi) || z.titulo === x.titulo; })[0]; if (b) x.ya = b.clave_cita; x.sel = false; } });
    pintarCons();
    return { claves: nuevas.concat(ya), agregadas: r.agregadas };
  });
}
function consAgregar(btn) {
  var fin = ocupar(btn, 'Agregando');
  consAgregarElegidos().then(function (r) { fin(); toast(r.agregadas + ' artículo(s) agregados a tu biblioteca.', 'bien'); }).catch(function (e) { fin(); fallo(e); });
}
function consEstado(btn) {
  var via = viaIA();
  if (!via) { toast('Primero elige cómo usar el asistente.'); abrirModoIA(); return; }
  var fin = ocupar(btn, 'Agregando fuentes');
  consAgregarElegidos().then(function (r) {
    if (r.claves.length < 2) throw new Error('Elige al menos dos artículos para armar el estado del arte.');
    var args = conVia({ modo: 'estado_arte', claves: r.claves.slice(0, 25) }, via);
    return viaLocal(via) ? porCopia('iaRespuesta', args, 'Armar mi estado del arte') : llamar('ia', args);
  }).then(function (r) {
    fin();
    if (via === 'curso') S.d.uso++;
    S.estadoArte = r.estado;
    S.estadoArte.brechas.forEach(function (b) { b.sel = true; });
    mostrarEstadoArte();
  }).catch(function (e) { fin(); if (e && e.cancelado) return; fallo(e); });
}
function listaEA(l) { return l && l.length ? '<ul class="ea-lista">' + l.map(function (x) { return '<li>' + textoDoc(citasAutor(x)) + '</li>'; }).join('') + '</ul>' : '<p class="tenue pequeno">—</p>'; }
function mostrarEstadoArte() {
  var e = S.estadoArte;
  var h = '<h2>' + IC.chispa + ' Tu estado del arte</h2><p class="tenue pequeno">Armado solo con las fuentes que elegiste. Léelo con calma, corrige lo que no te convenza y guarda lo que te sirva; después humanízalo con tus palabras.</p>' +
    '<h3 class="ea-h">Síntesis</h3><div class="ea-sintesis">' + String(e.sintesis || '').split(/\n+/).map(function (p) { return '<p>' + textoDoc(citasAutor(p)) + '</p>'; }).join('') + '</div>' +
    '<div class="rejilla dos" style="gap:14px"><div><h3 class="ea-h">Tendencias</h3>' + listaEA(e.tendencias) + '</div><div><h3 class="ea-h">Métodos y datos útiles</h3>' + listaEA(e.metodos) + '</div></div>' +
    '<h3 class="ea-h">Brechas: lo que falta investigar</h3><div class="pila" style="gap:6px">' + e.brechas.map(function (b, i) {
      return '<label class="ref-cand' + (b.sel ? ' sel' : '') + '"><input type="checkbox" data-ea="' + i + '"' + (b.sel ? ' checked' : '') + '><div><b>' + textoDoc(citasAutor(b.brecha)) + '</b><div class="pequeno tenue">Lo muestran: ' + textoDoc(citasAutor(b.estudios)) + '</div><div class="pequeno">Tu tesis puede: ' + textoDoc(citasAutor(b.respuesta)) + '</div></div></label>';
    }).join('') + '</div>' +
    '<h3 class="ea-h">Preguntas abiertas</h3>' + listaEA(e.preguntas_abiertas) +
    (e.declaracion_brecha ? '<h3 class="ea-h">Declaración de brecha</h3><p class="ea-decl">' + textoDoc(citasAutor(e.declaracion_brecha)) + '</p>' : '') +
    '<div class="aviso gris pequeno" style="margin-top:12px">Al guardar: las brechas marcadas se suman a tu tabla de brechas, la declaración va a su campo (si está vacío), la síntesis se agrega a tus apuntes de «El problema en el mundo» y las preguntas abiertas quedan en tu Biblioteca, pestaña Consensus.</div>' +
    '<label class="fila pequeno" style="gap:6px;margin-top:8px"><input type="checkbox" id="ea-sintesis" checked style="width:auto"> Agregar la síntesis a mis apuntes</label>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cerrar sin guardar</button><button class="btn primario" data-a="guardarEstadoArte">' + IC.check + 'Guardar en mi tesis</button></div>';
  modal(h, true);
}
function guardarEstadoArte(btn) {
  var e = S.estadoArte, fin = ocupar(btn, 'Guardando');
  llamar('guardarEstadoArte', { estado: e, brechas: e.brechas.filter(function (b) { return b.sel; }), sintesis: $('#ea-sintesis').checked, consultas: (S.cons && S.cons.consultas) || [] }).then(function (d) {
    ponerDatos(d); S.vistaSucia = true;
    cerrarModal();
    toast('Estado del arte guardado: revisa tus brechas en la etapa «Estado del arte».', 'bien');
    if (S.vista === 'biblioteca') ir('biblioteca');
  }).catch(function (e2) { fin(); fallo(e2); });
}
/** Lo ultimo guardado del estado del arte (preguntas abiertas y tendencias), para tenerlo a mano. */
function estadoGuardadoHtml() {
  var g = null;
  try { g = S.exp._estado_arte ? JSON.parse(S.exp._estado_arte) : null; } catch (e) { g = null; }
  if (!g) return '';
  return '<details class="tarjeta plana" style="margin-top:14px"><summary style="cursor:pointer"><b>Tu estado del arte guardado</b> <span class="pequeno tenue">' + esc(String(g.f || '').substring(0, 10)) + '</span></summary>' +
    '<h3 class="ea-h">Preguntas abiertas</h3>' + listaEA(g.preguntas) + '<h3 class="ea-h">Tendencias</h3>' + listaEA(g.tendencias) + '<h3 class="ea-h">Métodos útiles</h3>' + listaEA(g.metodos) + '</details>';
}

/** En la ventana del estado del arte las citas se muestran como (Autor, año), sea cual sea el estilo de la tesis. */
function citasAutor(t) {
  return String(t || '').replace(/\[@([A-Za-z0-9_\-]+)\]/g, function (m, k) {
    var b = S.d.biblioteca.filter(function (x) { return x.clave_cita === k; })[0];
    return b ? '(' + citaCorta(b) + ')' : m;
  });
}

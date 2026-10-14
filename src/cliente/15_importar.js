// ------------------------------------------------------------------ importar un plan de tesis y extraer referencias
var ESPECIALES_IMP = { '#referencias': 'Referencias: van a tu biblioteca', '#antecedentes': 'Antecedentes: se arman con tu biblioteca', '#matriz': 'Matriz: la aplicación la arma sola', '#indice': 'Índice: se arma solo', '#anexos': 'Anexos (título)', '#marco': 'Marco teórico (título)' };

function opcionesDestino(sel, soloTablas) {
  var h = '<option value="">No importar</option>';
  if (!soloTablas) Object.keys(ESPECIALES_IMP).forEach(function (k) { if (k === sel || k === '#referencias') h += '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(ESPECIALES_IMP[k]) + '</option>'; });
  var grupo = '';
  (S.d.etapas || []).forEach(function (e) {
    var cs = S.d.campos.filter(function (c) { return c.etapa === e.id && !/^(autor|orcid|asesor_|coasesor_|brujula)/.test(c.clave) && aplica(c.aplica) && (!soloTablas || c.tipo === 'tabla'); });
    if (!cs.length) return;
    h += '<optgroup label="' + esc(e.nombre) + '">' + cs.map(function (c) { return '<option value="' + esc(c.clave) + '"' + (c.clave === sel ? ' selected' : '') + '>' + esc(etiquetaDe(c)) + '</option>'; }).join('') + '</optgroup>';
    grupo = e.id;
  });
  return h;
}
function tieneTexto(clave) { var v = S.exp[clave]; return Array.isArray(v) ? v.length > 0 : !!String(v || '').trim() && String(v).trim() !== '[]'; }

function abrirImportar() { S.imp = null; pintarImportar(); }
function pintarImportar() {
  if (!S.imp) {
    modal('<h2>' + IC.subir + ' Importar mi plan de tesis</h2><p class="tenue">¿Ya tienes tu plan escrito? Súbelo y lo ordenamos en la plantilla de la escuela: el planteamiento, los objetivos, la metodología, las tablas (operacionalización, cronograma, presupuesto) y las referencias, que se verifican y entran a tu biblioteca. El archivo se lee en tu navegador y tú decides qué entra.</p>' +
      zonaArchivoHtml('imp-archivo', 'Elige o arrastra tu plan', 'Word (.docx) es lo mejor: conserva títulos y tablas · también PDF o texto') +
      '<details class="imp-pegar"><summary>O pega el texto de tu plan</summary><textarea id="imp-texto" rows="7" placeholder="Pega aquí todo tu plan, con sus títulos"></textarea><div class="fila" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-a="impTexto">Analizar el texto</button></div></details>' +
      '<div id="imp-estado" style="margin-top:12px"></div><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="cerrarModal">Cancelar</button></div>', true);
    return;
  }
  modal(importarHtml(), true);
}
function zonaArchivoHtml(id, titulo, sub) {
  return '<label class="zona-archivo" for="' + id + '" data-zona="' + id + '">' + IC.doc + '<span><b>' + esc(titulo) + '</b><small>' + esc(sub) + '</small></span><input type="file" id="' + id + '" accept=".docx,.pdf,.txt,.md"></label>';
}
function impLeer(file) {
  var est = $('#imp-estado');
  if (est) est.innerHTML = '<div class="pensando"><i></i><span>Leyendo «' + esc(file.name) + '»…</span></div>';
  leerDocumento(file).then(function (doc) { impAnalizado(analizarDoc(doc)); }).catch(function (e) { if (est) est.innerHTML = '<div class="aviso rojo">' + esc(e.message) + '</div>'; });
}
function impTexto() {
  var t = $('#imp-texto') ? $('#imp-texto').value : '';
  if (t.trim().length < 200) { toast('Pega el plan completo, con sus títulos.'); return; }
  impAnalizado(analizarDoc({ nombre: 'texto pegado', tipo: 'texto', bloques: bloquesDeTexto(t) }));
}
function impAnalizado(a) {
  if (!a.secciones.length && !a.tablas.length) { var est = $('#imp-estado'); if (est) est.innerHTML = '<div class="aviso ambar">No encontramos títulos de secciones. Revisa que el documento tenga sus títulos (Planteamiento del problema, Objetivos, Metodología…) o usa «Ordenar con IA».</div>'; }
  a.usarTitulo = !!a.titulo && !tieneTexto('titulo');
  a.reemplazar = false;
  S.imp = a;
  pintarImportar();
}
function resumenImp() {
  var a = S.imp, asign = a.secciones.filter(function (s) { return s.campo && s.campo.charAt(0) !== '#' && !s.vacio; }).length, tabs = a.tablas.filter(function (t) { return t.campo && t.campo.charAt(0) !== '#'; }).length;
  return { asignadas: asign, tablas: tabs, refs: a.secciones.some(function (s) { return s.campo === '#referencias'; }) ? a.nRefs : 0 };
}
function importarHtml() {
  var a = S.imp, r = resumenImp();
  var h = '<h2>' + IC.subir + ' Esto encontramos en tu plan</h2><p class="pequeno tenue">' + esc(a.archivo) + ' · ' + a.palabras.toLocaleString('es-PE') + ' palabras</p>' +
    '<div class="imp-cifras"><div><b>' + a.secciones.length + '</b><span>secciones</span></div><div class="ok"><b>' + r.asignadas + '</b><span>irán a tu tesis</span></div><div><b>' + r.tablas + '</b><span>tablas</span></div><div><b>' + r.refs + '</b><span>referencias</span></div></div>';
  if (a.titulo) h += '<label class="imp-titulo"><input type="checkbox" data-imp="titulo"' + (a.usarTitulo ? ' checked' : '') + '><span><b>Título:</b> ' + esc(a.titulo) + (tieneTexto('titulo') ? ' <span class="chip ambar">ya tienes título</span>' : '') + '</span></label>';
  h += '<h3 style="margin:14px 0 6px">Secciones</h3><div class="imp-lista">';
  if (!a.secciones.length) h += '<div class="vacio">Sin secciones detectadas.</div>';
  a.secciones.forEach(function (s, i) {
    var lleno = s.campo && s.campo.charAt(0) !== '#' && tieneTexto(s.campo);
    h += '<div class="imp-fila' + (s.campo ? ' asignada' : '') + '" style="padding-left:' + (8 + Math.min(4, s.nivel - 1) * 14) + 'px"><div class="crece"><b>' + esc(s.titulo) + '</b><small>' + (s.vacio ? 'solo título' : s.palabras + ' palabras') + (lleno ? ' · <span style="color:var(--ambar)">ya tienes texto en ese campo</span>' : '') + '</small></div>' +
      '<select data-imp="sec" data-i="' + i + '" aria-label="Destino de ' + esc(s.titulo) + '">' + opcionesDestino(s.campo, false) + '</select></div>';
  });
  h += '</div>';
  if (a.tablas.length) {
    h += '<h3 style="margin:14px 0 6px">Tablas</h3><div class="imp-lista">';
    a.tablas.forEach(function (t, i) {
      var esp = t.campo && t.campo.charAt(0) === '#';
      h += '<div class="imp-fila' + (t.campo && !esp ? ' asignada' : '') + '"><div class="crece"><b>' + esc(t.titulo) + '</b><small>' + t.filas.length + ' filas × ' + (t.filas[0] || []).length + ' columnas · ' + esc((t.filas[0] || []).slice(0, 4).join(' | ')) + (esp ? ' · ' + esc(ESPECIALES_IMP[t.campo]) : '') + '</small></div>' +
        '<select data-imp="tab" data-i="' + i + '">' + opcionesDestino(esp ? '' : t.campo, true) + '</select></div>';
    });
    h += '</div>';
  }
  if (r.refs) h += '<div class="aviso gris pequeno" style="margin-top:12px">' + IC.libro + ' <b>' + r.refs + ' referencias</b>: al importar se interpretan, se buscan en Crossref para verificarlas y entran a tu biblioteca con su clave para citar. Los artículos y tesis quedan como antecedentes; completa luego sus fichas.</div>';
  h += '<label class="imp-titulo" style="margin-top:12px"><input type="checkbox" data-imp="reemplazar"' + (a.reemplazar ? ' checked' : '') + '><span>Reemplazar lo que ya escribí en esos campos <small class="tenue">(se guarda una copia y puedes deshacer la importación)</small></span></label>' +
    '<div class="aviso pequeno" style="margin-top:10px">Importa solo lo que <b>tú</b> escribiste. El Reglamento de Similitud y Originalidad de la UNDC (RCO N.° 503-2025-UNDC/CO) admite hasta <b>20 %</b> de similitud en la tesis de pregrado y exige declarar el uso de IA. Después de importar, humaniza las secciones para poder defenderlas.</div>' +
    '<div class="fila entre" style="margin-top:14px"><button class="btn fantasma" data-a="impVolver">Elegir otro archivo</button><div class="fila"><button class="btn" data-a="impIA"' + attrIA() + '>' + IC.chispa + 'Ordenar con IA</button><button class="btn primario" data-a="impImportar">' + IC.check + 'Importar a mi tesis</button></div></div>';
  return h;
}
function impCambio(t) {
  var a = S.imp, k = t.getAttribute('data-imp');
  if (!a) return;
  if (k === 'titulo') a.usarTitulo = t.checked;
  else if (k === 'reemplazar') a.reemplazar = t.checked;
  else if (k === 'sec') { a.secciones[+t.getAttribute('data-i')].campo = t.value; a.secciones[+t.getAttribute('data-i')].vacio = false; }
  else if (k === 'tab') a.tablas[+t.getAttribute('data-i')].campo = t.value;
  var m = $('#modal'), c0 = $('#modal .caja'), y1 = m.scrollTop, y2 = c0 ? c0.scrollTop : 0;
  pintarImportar();
  m.scrollTop = y1;
  if ($('#modal .caja')) $('#modal .caja').scrollTop = y2;
}
function impIA(btn) {
  var via = viaIA();
  if (!via) { toast('Primero elige cómo usar el asistente: tu clave de Gemini, otra IA copiando y pegando, o la del curso.'); abrirModoIA(); return; }
  var a = S.imp;
  var secs = a.secciones.map(function (s) { return { titulo: s.titulo, extracto: String(s.texto || '').substring(0, 500) }; });
  var args = conVia({ modo: 'importar', secciones: secs }, via), fin = ocupar(btn, 'Ordenando');
  (viaLocal(via) ? porCopia('iaRespuesta', args, 'Ordenar mi plan importado') : llamar('ia', args)).then(function (r) {
    if (via === 'curso') S.d.uso++;
    (r.asignaciones || []).forEach(function (x) { if (a.secciones[x.i]) { a.secciones[x.i].campo = x.campo; a.secciones[x.i].vacio = false; } });
    a.ia = true;
    S.imp = a;
    pintarImportar();
    toast('El asistente ordenó las secciones. Revisa cada destino antes de importar.', 'bien');
  }).catch(function (e) { if (e && e.cancelado) { pintarImportar(); return; } fin(); fallo(e); if (!$('#modal .imp-cifras')) pintarImportar(); });
}
function impImportar(btn) {
  var a = S.imp, campos = {}, tablas = {};
  a.secciones.forEach(function (s) {
    if (!s.campo || s.campo.charAt(0) === '#' || s.vacio || !s.texto) return;
    var c = campoDe(s.campo);
    if (!c) return;
    if (c.tipo === 'tabla') { tablas[s.campo] = (tablas[s.campo] || []).concat(filasDeTexto(s.campo, s.texto)); return; }
    var t = c.tipo === 'parrafo' || c.tipo === 'corto' ? s.texto.replace(/^• /gm, '') : s.texto;
    campos[s.campo] = campos[s.campo] ? campos[s.campo] + '\n' + t : t;
  });
  // El enfoque, el tipo y el nivel se deducen de lo que dice la metodologia
  var met = a.secciones.filter(function (s) { return ['enfoque_fund', 'diseno', 'metodo'].indexOf(s.campo) >= 0; }).map(function (s) { return s.texto; }).join(' ');
  if (met) ['enfoque', 'tipo_inv', 'nivel_inv'].forEach(function (k) { if (!tieneTexto(k) || a.reemplazar) campos[k] = met; });
  a.tablas.forEach(function (t) { if (t.campo && t.campo.charAt(0) !== '#') { var f = filasDeTabla(t.campo, t.filas); if (f.length) tablas[t.campo] = (tablas[t.campo] || []).concat(f); } });
  if (a.usarTitulo && a.titulo) campos.titulo = a.titulo;
  var refs = a.secciones.some(function (s) { return s.campo === '#referencias'; }) ? a.referencias : '';
  if (!Object.keys(campos).length && !Object.keys(tablas).length && !refs) { toast('Elige al menos una sección o tabla para importar.'); return; }
  var fin = ocupar(btn, 'Importando');
  guardarAhora().then(function () {
    return llamar('importarPlan', { archivo: a.archivo, campos: campos, tablas: tablas, referencias: refs, usoRefs: 'auto', reemplazar: !!a.reemplazar, ia: !!a.ia, resumen: { secciones: a.secciones.length, palabras: a.palabras } });
  }).then(function (r) {
    ponerDatos(r.estado);
    S.vistaSucia = true;
    S.vistaDoc = null;
    var im = r.importacion;
    S.imp = null;
    modal('<h2>' + IC.check + ' ¡Plan importado!</h2><div class="imp-cifras"><div class="ok"><b>' + im.campos + '</b><span>secciones</span></div><div class="ok"><b>' + im.tablas + '</b><span>tablas</span></div><div class="ok"><b>' + im.refs + '</b><span>referencias nuevas</span></div></div>' +
      (r.saltados.length ? '<div class="aviso ambar pequeno">No reemplazamos ' + r.saltados.length + ' campo(s) que ya tenían texto: ' + esc(r.saltados.slice(0, 6).join(', ')) + (r.saltados.length > 6 ? '…' : '') + '. Si quieres, vuelve a importar marcando «Reemplazar».</div>' : '') +
      (r.omitidas ? '<p class="pequeno tenue">' + r.omitidas + ' referencia(s) no se agregaron: ya estaban en tu biblioteca o no se pudieron leer bien. Agrégalas desde la Biblioteca, pestaña «Desde un documento».</p>' : '') +
      '<p style="margin-top:10px"><b>Siguiente paso:</b> revisa cada sección en «Ver mi tesis», completa las fichas de tus antecedentes y <b>humaniza</b> lo que importaste para poder defenderlo ante el jurado.</p>' +
      '<div class="fila entre" style="margin-top:16px"><button class="btn fantasma peligro" data-a="impDeshacer">Deshacer la importación</button><div class="fila"><button class="btn" data-a="ir" data-v="biblioteca">Ver mi biblioteca</button><button class="btn primario" data-a="ir" data-v="documento">' + IC.doc + 'Ver mi tesis</button></div></div>', true);
    toast('Importación lista.', 'bien');
    if (['tesis', 'documento', 'biblioteca', 'clase'].indexOf(S.vista) >= 0) { var v = S.vista; ir(v).then(function () { }); }
  }).catch(function (e) { fin(); fallo(e); });
}
function impDeshacer(btn) {
  var fin = ocupar(btn, 'Deshaciendo');
  llamar('deshacerImportacion').then(function (d) { ponerDatos(d); S.vistaSucia = true; S.vistaDoc = null; cerrarModal(); toast('Se deshizo la importación: tus campos volvieron a como estaban.', 'bien'); ir(S.vista); }).catch(function (e) { fin(); fallo(e); });
}

// ------------------------------------------------------------------ biblioteca: referencias desde un texto o un documento
function extraerHtml() {
  var x = S.extraer || {};
  var h = '<p class="pequeno tenue" style="margin:0 0 10px">Pega tu lista de referencias (en cualquier estilo: APA, IEEE, Vancouver…) o sube el documento donde están. Las separamos, las buscamos en Crossref para verificarlas y las pasamos al estilo de tu tesis (<b>' + esc(nombreEstilo(estiloCita())) + '</b>).</p>' +
    zonaArchivoHtml('ref-archivo', 'Sube un documento con referencias', 'Word (.docx), PDF o texto: tomamos la sección «Referencias»') +
    '<div class="campo-simple" style="margin:10px 0 0"><label for="ref-texto">O pega tus referencias</label><textarea id="ref-texto" rows="6" placeholder="Pérez, J. (2023). Título del artículo. Revista, 12(3), 1-10. https://doi.org/…">' + esc(x.texto || '') + '</textarea></div>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-a="refIA"' + attrIA() + '>' + IC.chispa + 'Separarlas con IA</button><button class="btn primario" data-a="refDetectar">Detectar referencias</button></div><div id="ref-res" style="margin-top:12px">' + extraidasHtml() + '</div>';
  return h;
}
var VERIF_REF = { crossref: ['verde', 'Verificada por DOI'], encontrado: ['verde', 'Encontrada en Crossref'], manual: ['borde', 'Con enlace'], no: ['ambar', 'Sin verificar'] };
function extraidasHtml() {
  var x = S.extraer || {};
  if (x.cargando) return '<div class="pensando"><i></i><span>' + esc(x.cargando) + '</span></div>';
  if (!x.lista) return '';
  if (!x.lista.length) return '<div class="vacio">No encontramos referencias. Revisa que cada una tenga autor, año y título, o usa «Separarlas con IA».</div>';
  var sel = x.lista.filter(function (o) { return o.sel; }).length;
  return '<div class="fila entre pequeno"><span><b>' + x.lista.length + '</b> referencias · ' + x.lista.filter(function (o) { return o.verificado === 'crossref' || o.verificado === 'encontrado'; }).length + ' verificadas en Crossref</span><button class="enlace" data-a="refTodas">' + (sel === x.lista.length ? 'Quitar todas' : 'Marcar todas') + '</button></div>' +
    '<div class="pila" style="gap:8px;margin-top:8px">' + x.lista.map(function (o, i) {
      var v = VERIF_REF[o.verificado] || VERIF_REF.no;
      return '<label class="ref-cand' + (o.sel ? ' sel' : '') + '"><input type="checkbox" data-ref="' + i + '"' + (o.sel ? ' checked' : '') + '><div><div>' + refHtml(o) + '</div><div class="fila" style="gap:6px;margin-top:4px"><span class="chip ' + v[0] + '">' + (v[0] === 'verde' ? IC.check : '') + v[1] + '</span><span class="chip borde">' + esc(nombreDe(TIPOS, o.tipo)) + '</span>' +
        (o.repetida ? '<span class="chip indigo">Ya está: [@' + esc(o.repetida) + ']</span>' : '') + (o.confianza === 'baja' ? '<span class="chip ambar">' + IC.alerta + 'Revísala</span>' : '') + '</div>' +
        (o.texto ? '<details><summary class="pequeno tenue">Texto original</summary><p class="pequeno tenue">' + esc(o.texto) + '</p></details>' : '') + '</div></label>';
    }).join('') + '</div>' +
    '<div class="fila entre" style="margin-top:12px"><div class="campo-simple" style="margin:0;width:280px"><label for="ref-uso">Usarlas como</label><select id="ref-uso"><option value="auto">Automático: artículos y tesis como antecedentes</option>' + opcionesSel(USOS, '') + '</select></div><button class="btn primario" data-a="refAgregar"' + (sel ? '' : ' disabled') + '>' + IC.mas + 'Agregar ' + sel + ' a mi biblioteca</button></div>';
}
function pintarExtraidas() { var r = $('#ref-res'); if (r) r.innerHTML = extraidasHtml(); }
function refLeer(file) {
  S.extraer = { cargando: 'Leyendo «' + file.name + '»…' };
  pintarExtraidas();
  leerDocumento(file).then(function (doc) {
    var a = analizarDoc(doc);
    var t = a.referencias || doc.bloques.filter(function (b) { return b.t === 'p'; }).map(function (b) { return b.x; }).join('\n');
    S.extraer = { texto: t };
    var ta = $('#ref-texto');
    if (ta) { ta.value = t; crecer(ta); }
    refDetectar();
  }).catch(function (e) { S.extraer = {}; pintarExtraidas(); fallo(e); });
}
function marcarSel(lista) { lista.forEach(function (o) { o.sel = !o.repetida && o.confianza !== 'baja'; }); return lista; }
function refDetectar() {
  var t = $('#ref-texto') ? $('#ref-texto').value : '';
  if (t.trim().length < 30) { toast('Pega primero tus referencias o sube el documento.'); return; }
  S.extraer = { texto: t, cargando: 'Separando y verificando en Crossref…' };
  pintarExtraidas();
  llamar('analizarReferencias', { texto: t }).then(function (r) { S.extraer = { texto: t, lista: marcarSel(r.referencias) }; pintarExtraidas(); })
    .catch(function (e) { S.extraer = { texto: t }; pintarExtraidas(); fallo(e); });
}
function refIA(btn) {
  var t = $('#ref-texto') ? $('#ref-texto').value : '';
  if (t.trim().length < 30) { toast('Pega primero tus referencias o sube el documento.'); return; }
  var via = viaIA();
  if (!via) { toast('Primero elige cómo usar el asistente.'); abrirModoIA(); return; }
  var args = conVia({ modo: 'referencias', texto: t.substring(0, 15000) }, via), fin = ocupar(btn, 'Separando');
  (viaLocal(via) ? porCopia('iaRespuesta', args, 'Separar mis referencias') : llamar('ia', args)).then(function (r) {
    fin();
    if (via === 'curso') S.d.uso++;
    S.extraer = { texto: t, cargando: 'Verificando en Crossref…' };
    pintarExtraidas();
    return llamar('verificarReferencias', { items: r.referencias });
  }).then(function (v) { if (!v) return; S.extraer = { texto: t, lista: marcarSel(v.referencias) }; pintarExtraidas(); })
    .catch(function (e) { fin(); if (e && e.cancelado) return; S.extraer = { texto: t }; pintarExtraidas(); fallo(e); });
}
function refAgregar(btn) {
  var x = S.extraer || {}, items = (x.lista || []).filter(function (o) { return o.sel; });
  if (!items.length) return;
  var fin = ocupar(btn, 'Agregando');
  llamar('agregarReferencias', { items: items, uso: $('#ref-uso') ? $('#ref-uso').value : 'auto' }).then(function (r) {
    fin();
    S.extraer = {};
    repintarBiblioteca(r.biblioteca);
    var ag = $('#agregar');
    if (ag) ag.innerHTML = agregarHtml();
    toast(r.agregadas + ' referencia(s) agregadas' + (r.omitidas ? '; ' + r.omitidas + ' ya estaban o estaban incompletas' : '') + '. Ya puedes citarlas.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}

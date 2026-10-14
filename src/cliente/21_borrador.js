// ------------------------------------------------------------------ Nivel 2: Borrador de tesis (estudiante)
// Se abre cuando la coordinacion aprueba el plan. Cada seccion se carga al abrirla y se guarda con el boton
// «Guardar» (o Ctrl+S): asi la pagina pesa poco y no se envia nada mientras el estudiante escribe.
// Mientras tanto, lo escrito queda en este navegador por si se corta la conexion.

IC.libroAbierto = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4.2C6.6 3 4.6 2.6 2 2.8v9.4c2.6-.2 4.6.2 6 1.4 1.4-1.2 3.4-1.6 6-1.4V2.8c-2.6-.2-4.6.2-6 1.4z"/><path d="M8 4.2v9.4"/></svg>';
IC.guardar = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2.5h8.2L13.5 4.8v8.7H2.5v-11z"/><path d="M5 2.5v3.5h5V2.5M5 13.5V9.5h6v4"/></svg>';
IC.ojo = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>';
IC.tabla = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.2"/><path d="M2 6.5h12M2 10h12M7 6.5V13"/></svg>';
IC.imagen = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.4"/><circle cx="5.7" cy="6.4" r="1.2"/><path d="M2.5 12l3.8-3.6 2.6 2.4 1.9-1.7 2.7 2.6"/></svg>';
IC.sigma = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H4l4.5 5L4 13h8"/></svg>';
IC.vinetas = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6.5 4h7M6.5 8h7M6.5 12h7"/><circle cx="3" cy="4" r=".9" fill="currentColor"/><circle cx="3" cy="8" r=".9" fill="currentColor"/><circle cx="3" cy="12" r=".9" fill="currentColor"/></svg>';
IC.numerada = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4h7M6.5 8h7M6.5 12h7M2.4 2.8l1-.5v3.4M2.2 9.5c.3-.6 1.7-.7 1.7.2 0 .7-1.7 1.4-1.7 2.1h1.8"/></svg>';
IC.comillas = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5C3 7 4.2 5 6.6 4.2l.4.9C5.6 5.8 5 6.8 5 8h1.6v4H3zM9 9.5C9 7 10.2 5 12.6 4.2l.4.9c-1.4.7-2 1.7-2 2.9h1.6v4H9z"/></svg>';

function planCongelado(exp) { exp = exp || S.exp || {}; return !!exp._plan_ok; }
function jsonDe(v, def) { try { return v ? JSON.parse(v) : def; } catch (e) { return def; } }
function planOk(exp) { return jsonDe((exp || S.exp || {})._plan_ok, null); }
function planSol(exp) { return jsonDe((exp || S.exp || {})._plan_sol, null); }
function planAbiertos(exp) { return jsonDe((exp || S.exp || {})._plan_abiertos, []); }
function nInf() { if (!S.inf) S.inf = { textos: {} }; return S.inf; }
function secInf(id) { var d = nInf().datos; return d ? d.secciones.filter(function (s) { return s.id === id; })[0] : null; }
function itInf(id) { var d = nInf().datos; return (d && d.idx[id]) || {}; }

var ESTADOS_INF = { ok: ['verde', 'Aprobada'], dev: ['rojo', 'Devuelta'], lista: ['indigo', 'Para el asesor'] };
function chipInf(it) {
  if (ESTADOS_INF[it.e]) return '<span class="chip ' + ESTADOS_INF[it.e][0] + '">' + (it.e === 'ok' ? IC.check : '') + ESTADOS_INF[it.e][1] + '</span>';
  return it.n ? '<span class="chip borde">' + it.n + ' pal.</span>' : '<span class="chip borde tenue">Vacía</span>';
}

// ------------------------------------------------------------------ pantalla
function vistaBorrador() {
  var I = nInf();
  var cab = '<div class="cabecera"><h1>' + IC.libroAbierto + ' Borrador de tesis</h1>';
  if (!planCongelado()) return cab + '</div>' + borradorBloqueadoHtml();
  var ok = planOk(), sol = planSol(), ab = planAbiertos();
  cab += '<p>Tu informe final con la estructura oficial de la UNDC (Reglamento de Grados y Títulos, Anexo 6). Escribe una sección a la vez y pulsa <b>Guardar</b>; las secciones de los capítulos I a IV puedes traerlas de tu plan aprobado.</p>' +
    '<div class="fila" style="margin-top:10px"><span class="chip verde">' + IC.candado + 'Plan aprobado · versión ' + esc(ok.v) + ' · ' + esc(fechaCorta(ok.f)) + '</span>' +
    (ok.doc ? '<a class="btn chico" href="' + esc(urlDoc(ok.doc, SERVIDOR ? 'docx' : 'ver')) + '" target="_blank" rel="noopener">' + IC.doc + 'Plan aprobado (Word)</a>' : '') +
    (sol && sol.estado === 'pendiente' ? '<span class="chip ambar">' + IC.reloj + 'Tu pedido de cambio espera respuesta</span>' : '<button class="btn chico" data-a="infSolicitar">Solicitar un cambio al plan</button>') +
    '<button class="btn chico" data-a="infSimilitud">Revisar similitud</button><button class="btn chico ambar" data-a="infWord">' + IC.doc + 'Descargar borrador en Word</button></div></div>';
  if (ab.length) cab += '<div class="aviso ambar" style="margin-bottom:14px"><b>Cambio autorizado.</b> Puedes editar en «Mi tesis» o «Mi ruta»: ' + esc(ab.map(etiquetaCampo).join(', ')) + '. Cuando termines, avisa a la coordinación para que vuelva a aprobar el plan.</div>';
  if (sol && sol.estado === 'rechazada' && sol.comentario) cab += '<div class="aviso gris" style="margin-bottom:14px"><b>Tu pedido de cambio no se autorizó:</b> ' + esc(sol.comentario) + '</div>';
  if (!I.datos) return cab + '<div class="pensando" style="padding:30px 10px"><i></i><span>Abriendo tu borrador…</span></div>';
  return cab + '<div class="inf-rejilla"><aside class="inf-indice" id="inf-indice">' + indiceInfHtml() + '</aside><section class="inf-panel" id="inf-panel">' + panelInfHtml() + '</section></div>';
}
function etiquetaCampo(k) { var c = campoDe(k); return c ? c.etiqueta : k; }

function borradorBloqueadoHtml() {
  var caps = [['I', 'Planteamiento del problema'], ['II', 'Marco teórico y empírico'], ['III', 'Hipótesis y variables'], ['IV', 'Diseño metodológico'], ['V', 'Resultados'], ['VI', 'Discusión de resultados'], ['VII', 'Conclusiones'], ['VIII', 'Recomendaciones']];
  return '<div class="tarjeta inf-bloqueado"><div class="inf-candado">' + IC.candado + '</div><div><h2>Se abre cuando la coordinación apruebe tu plan</h2>' +
    '<p class="tenue">Termina tu plan, revisa cada sección en «Ver mi tesis» y pide a tu asesor que la apruebe. Cuando la coordinación apruebe el plan, se congela (ya no se modifica salvo que lo pidas) y aquí se abre tu borrador de tesis completo.</p>' +
    '<div class="inf-caps">' + caps.map(function (c) { return '<div><b>' + c[0] + '</b><span>' + c[1] + '</span></div>'; }).join('') + '</div>' +
    '<p class="pequeno tenue" style="margin-top:12px">Lo aprobado en el plan pasa al borrador (en tiempo pasado) y tú lo amplías. Consensus te ayudará con el marco teórico, los antecedentes y la discusión.</p>' +
    '<div class="fila" style="margin-top:12px"><button class="btn primario" data-a="ir" data-v="documento">' + IC.doc + 'Ver mi tesis</button></div></div></div>';
}

function indiceInfHtml() {
  var d = nInf().datos, sel = nInf().sel, h = '', capAct = null, total = 0, con = 0, apr = 0;
  d.secciones.forEach(function (s) {
    var it = d.idx[s.id] || {};
    total++; if (it.n) con++; if (it.e === 'ok') apr++;
    if (s.c !== capAct) {
      if (capAct !== null) h += '</div>';
      capAct = s.c;
      h += '<div class="inf-cap"><p class="inf-cap-t">' + (s.c === 'pre' ? 'Preliminares' : (s.c === 'anexos' ? 'Anexos' : s.c + '. ' + esc(mayusculaInicial(s.ct)))) + '</p>';
    }
    h += '<button class="inf-sec' + (s.id === sel ? ' activo' : '') + (it.e === 'dev' ? ' devuelta' : '') + '" data-a="infAbrir" data-id="' + esc(s.id) + '"><span>' + esc(s.cap || s.c === 'pre' ? s.t : s.id + ' ' + s.t) + '</span>' + chipInf(it) + '</button>';
  });
  if (capAct !== null) h += '</div>';
  return '<div class="inf-progreso"><div class="fila entre"><b>Tu borrador</b><span class="pequeno tenue mono">' + con + ' / ' + total + '</span></div><div class="barra-prog" style="height:8px;margin-top:6px"><i style="width:' + Math.round(100 * con / Math.max(1, total)) + '%"></i></div><p class="pequeno tenue" style="margin-top:4px">' + apr + ' aprobadas por tu asesor</p></div>' + h;
}
function mayusculaInicial(s) { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.substring(1); }

function panelInfHtml() {
  var I = nInf(), s = secInf(I.sel);
  if (!s) return '<div class="vacio">Elige una sección a la izquierda para empezar. Te sugerimos comenzar por los capítulos I a IV: vienen de tu plan.</div>';
  if (I.cargando) return '<div class="pensando" style="padding:30px 10px"><i></i><span>Abriendo la sección…</span></div>';
  var it = itInf(s.id);
  var h = '<div class="inf-cab"><div><p class="pequeno tenue">' + (s.c === 'pre' ? 'Preliminares' : (s.c === 'anexos' ? 'Anexos' : 'Capítulo ' + s.c + ' · ' + esc(mayusculaInicial(s.ct)))) + '</p><h2>' + esc(s.cap || s.c === 'pre' ? s.t : s.id + ' ' + s.t) + '</h2></div>' + chipInf(it) + '</div>';
  if (s.ayuda) h += '<p class="tenue pequeno" style="margin:4px 0 10px">' + esc(s.ayuda) + '</p>';
  if (it.e === 'dev' && it.c) h += '<div class="aviso rojo" style="margin-bottom:10px"><b>Tu asesor devolvió esta sección:</b> ' + esc(it.c) + '</div>';
  if (I.recuperar) h += '<div class="aviso ambar" style="margin-bottom:10px"><b>Tienes un texto sin guardar de esta sección</b> (' + esc(I.recuperar.fecha) + '). <button class="btn chico" data-a="infRecuperar">Recuperarlo</button> <button class="btn chico fantasma" data-a="infDescartarLocal">Descartarlo</button></div>';
  h += '<div class="md-barra" role="toolbar" aria-label="Formato">' +
    botonMd('b', '<b>N</b>', 'Negrita (Ctrl+B)') + botonMd('i', '<i>C</i>', 'Cursiva (Ctrl+I)') + botonMd('u', '<u>S</u>', 'Subrayado') + '<span class="md-sep"></span>' +
    botonMd('h2', 'T1', 'Subtítulo (se numera solo)') + botonMd('h3', 'T2', 'Subtítulo menor') + '<span class="md-sep"></span>' +
    botonMd('ul', IC.vinetas, 'Viñetas') + botonMd('ol', IC.numerada, 'Lista numerada') + botonMd('cita', IC.comillas, 'Cita textual de 40 palabras o más (en bloque)') + '<span class="md-sep"></span>' +
    botonMd('citar', IC.libro + '<span>Citar</span>', 'Citar una fuente de tu biblioteca') + botonMd('tabla', IC.tabla + '<span>Tabla</span>', 'Insertar o editar una tabla (formato APA)') + botonMd('figura', IC.imagen + '<span>Figura</span>', 'Insertar una figura o dejar su espacio') + botonMd('ecuacion', IC.sigma + '<span>Ecuación</span>', 'Ecuación editable (LaTeX)') +
    '<span class="crece"></span><button class="md-btn' + (I.previa ? ' activo' : '') + '" data-a="infPrevia" title="Ver cómo queda">' + IC.ojo + '<span>Vista previa</span></button></div>';
  h += '<div class="inf-escribir' + (I.previa ? ' con-previa' : '') + '"><textarea id="inf-texto" class="inf-editor" spellcheck="true" lang="es" placeholder="Escribe aquí. Un párrafo por línea. Usa la barra de arriba para dar formato.">' + esc(I.texto || '') + '</textarea>' +
    (I.previa ? '<div class="inf-previa hoja" id="inf-previa">' + previaInfHtml() + '</div>' : '') + '</div>';
  h += '<div class="inf-pie"><span class="pequeno tenue mono" id="inf-cuenta">' + palabrasMdCli(I.texto) + ' palabras</span><span class="inf-estado" id="inf-estado">' + estadoGuardadoInf() + '</span><span class="crece"></span>' +
    (s.plan ? '<button class="btn" data-a="infTraer">' + IC.flecha + 'Traer de mi plan</button>' : '') +
    (it.n ? '<button class="btn" data-a="infLista">' + (it.e === 'lista' ? 'Quitar «para el asesor»' : 'Lista para mi asesor') + '</button>' : '') +
    '<button class="btn primario" data-a="infGuardar" id="inf-guardar"' + (I.sucio ? '' : ' disabled') + '>' + IC.guardar + 'Guardar</button></div>';
  h += tutorialMdHtml();
  if (s.cons) h += consInfHtml(s);
  return h;
}
function botonMd(op, cont, titulo) { return '<button class="md-btn" data-a="mdOp" data-op="' + op + '" title="' + esc(titulo) + '" aria-label="' + esc(titulo) + '">' + cont + '</button>'; }
function estadoGuardadoInf() { var I = nInf(); return I.guardando ? '<span class="giro"></span>Guardando' : (I.sucio ? '<span class="punto ambar"></span>Sin guardar (queda en este navegador)' : (I.base ? IC.check + 'Guardado ' + esc(fechaCorta(I.base)) : '')); }
function pintarEstadoInf() {
  var e = $('#inf-estado'), g = $('#inf-guardar'), c = $('#inf-cuenta'), I = nInf();
  if (e) e.innerHTML = estadoGuardadoInf();
  if (g) g.disabled = !I.sucio || !!I.guardando;
  if (c) c.textContent = palabrasMdCli(I.texto) + ' palabras';
}

function tutorialMdHtml() {
  var f = function (a, b) { return '<tr><td>' + a + '</td><td><code>' + esc(b) + '</code></td></tr>'; };
  return '<details class="mini-guia md-tutorial"><summary>' + IC.guia + ' Mini tutorial: cómo escribir tu tesis con este editor</summary>' +
    '<p class="pequeno">Escribes texto normal y la barra pone unas marcas sencillas. En el Word todo sale con el formato de la escuela: títulos numerados, tablas y figuras con rótulo APA, citas en tu estilo y ecuaciones editables.</p>' +
    '<table class="tabla md-guia"><thead><tr><th>Para…</th><th>Escribe (o usa el botón)</th></tr></thead><tbody>' +
    f('Un párrafo', 'Cada línea es un párrafo. Pulsa Enter para empezar otro.') +
    f('<b>Negrita</b>', '**texto importante**') + f('<i>Cursiva</i> (términos en otro idioma)', '*machine learning*') + f('<u>Subrayado</u>', '__texto__') +
    f('Subtítulo (en 1.1 sale como 1.1.1; en 2.1.1 como A.)', '## Dimensiones de la variable') + f('Subtítulo menor', '### Dimensión 1: calidad') +
    f('Viñetas', '- primer punto') + f('Lista numerada', '1. primer paso') + f('Cita textual larga (40 palabras o más)', '> Texto citado… [@perez2024]') +
    f('Citar una fuente (botón «Citar»)', 'según Pérez [@perez2024]') +
    f('Tabla (botón «Tabla»; con el cursor dentro de una tabla, la edita)', 'Tabla: Exactitud por modelo\n| Modelo | Exactitud |\n|---|---|\n| CNN | 95 % |\nNota: Elaboración propia.') +
    f('Figura subida (botón «Figura»)', '![Arquitectura del sistema](fig:…)\nFuente: Elaboración propia') + f('Espacio para una figura que pegarás en Word', '![Diagrama de flujo]()') +
    f('Ecuación en la línea', 'la media $\\bar{x}$ fue…') + f('Ecuación aparte, numerada', '$$\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i$$') +
    '</tbody></table><ul class="pequeno"><li><b>Guarda</b> con el botón o con <b>Ctrl+S</b>. Mientras no guardes, tu texto queda en este navegador: si se corta internet no se pierde.</li><li><b>Vista previa</b> muestra cómo queda la sección, con sus números de tabla, figura y ecuación.</li><li>Las tablas, figuras y ecuaciones se numeran solas en el orden del documento. No escribas «Tabla 1» a mano.</li><li><b>Figuras:</b> si ya tienes la imagen, súbela (queda en tu carpeta del curso y sale en el Word). Si aún no, deja el espacio: en el Word aparece resaltado para que la pegues.</li><li><b>Ecuaciones:</b> el botón «Ecuación» trae ejemplos (fracción, raíz, sumatoria, griegas). En el Word salen como ecuaciones de Office, editables.</li></ul></details>';
}

function previaInfHtml() {
  var I = nInf(), s = secInf(I.sel);
  if (!s) return '';
  var ctx = nuevoCtxMd(S.d.biblioteca);
  var capNum = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].indexOf(s.c) + 1;
  var cab = s.c === 'pre' ? '<p class="d-h d-h1">' + esc(s.h || s.t.toUpperCase()) + '</p>' : (s.cap ? '<p class="d-h d-h1">' + (s.c === 'anexos' ? 'ANEXOS' : s.c + '. ' + esc(s.ct)) + '</p>' : '<p class="d-h d-h' + s.id.split('.').length + '">' + esc(s.id + ' ' + s.t) + '</p>');
  var cuerpo = mdHtml(I.texto, ctx, { id: s.id, cap: s.cap && capNum > 0 ? capNum : 0, anexos: s.c === 'anexos', pre: s.c === 'pre' });
  return cab + (cuerpo || '<p class="d-vacio">Aún no hay texto.</p>');
}
function pintarPreviaInf() { var p = $('#inf-previa'); if (p) p.innerHTML = previaInfHtml(); }

// ------------------------------------------------------------------ carga
function despuesDeBorrador() {
  if (!planCongelado()) return;
  var I = nInf();
  if (!I.datos) {
    llamar('informe').then(function (d) {
      I.datos = d;
      if (!I.sel) { var prim = d.secciones.filter(function (s) { return s.id === '1.1'; })[0] || d.secciones[0]; I.sel = prim ? prim.id : ''; }
      if (S.vista === 'borrador') { $('#pagina').innerHTML = vistaBorrador(); abrirSeccion(I.sel, true); }
    }).catch(fallo);
  } else if (I.sel && I.texto === undefined) abrirSeccion(I.sel, true);
  else despuesDePanelInf();
  if (/\$/.test(I.texto || '')) cargarKatex().then(function () { if (I.previa) pintarPreviaInf(); });
}
function repintarInf() {
  var a = $('#inf-indice'), b = $('#inf-panel');
  if (a) a.innerHTML = indiceInfHtml();
  if (b) { b.innerHTML = panelInfHtml(); despuesDePanelInf(); }
}
function despuesDePanelInf() {
  var t = $('#inf-texto');
  if (t) { t.style.height = 'auto'; t.style.height = Math.max(420, t.scrollHeight + 4) + 'px'; }
}
function llaveBorrador(id) { return llaveLocal('qsi_inf_' + id); }

/** Abre una seccion. Si hay cambios sin guardar en la actual, pregunta antes. */
function abrirSeccion(id, sinPreguntar) {
  var I = nInf();
  if (!sinPreguntar && I.sucio && I.sel !== id) {
    I.pendienteAbrir = id;
    modal('<h2>Tienes cambios sin guardar</h2><p class="tenue">En «' + esc((secInf(I.sel) || {}).t || '') + '». Si cambias sin guardar, el texto queda en este navegador y podrás recuperarlo al volver.</p><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn" data-a="infCambiarSinGuardar">Cambiar sin guardar</button><button class="btn primario" data-a="infGuardarYCambiar">' + IC.guardar + 'Guardar y cambiar</button></div>');
    return;
  }
  I.sel = id; I.sucio = false; I.recuperar = null;
  var cache = I.textos[id];
  var listo = function (r) {
    I.cargando = false;
    I.textos[id] = { texto: r.texto, f: r.f };
    I.texto = r.texto; I.original = r.texto; I.base = r.f;
    var loc = jsonDe(leerLocal(llaveBorrador(id)), null);
    if (loc && loc.t !== r.texto) I.recuperar = { t: loc.t, base: loc.base, fecha: new Date(loc.h || Date.now()).toLocaleString('es-PE') };
    if (S.vista === 'borrador') { repintarInf(); var t = $('#inf-texto'); if (t && window.innerWidth > 900) t.focus({ preventScroll: true }); }
    if (/\$/.test(r.texto)) cargarKatex().then(function () { if (I.previa) pintarPreviaInf(); });
  };
  if (cache) { listo(cache); return; }
  I.cargando = true;
  repintarInf();
  llamar('informeSeccion', { id: id }).then(listo).catch(function (e) { I.cargando = false; repintarInf(); fallo(e); });
}

// ------------------------------------------------------------------ escribir y guardar
function infEscribio(t) {
  var I = nInf();
  I.texto = t.value;
  I.sucio = I.texto !== I.original;
  pintarEstadoInf();
  t.style.height = 'auto'; t.style.height = Math.max(420, t.scrollHeight + 4) + 'px';
  if (I.relojLocal) clearTimeout(I.relojLocal);
  I.relojLocal = setTimeout(function () {
    if (I.sucio) ponerLocal(llaveBorrador(I.sel), JSON.stringify({ t: I.texto, base: I.base, h: Date.now() }));
    else ponerLocal(llaveBorrador(I.sel), '');
  }, 700);
  if (I.previa) { if (I.relojPrevia) clearTimeout(I.relojPrevia); I.relojPrevia = setTimeout(pintarPreviaInf, 350); }
}
function guardarInf(forzar) {
  var I = nInf(), id = I.sel;
  if (!I.sucio && !forzar) return Promise.resolve();
  if (I.guardando) return I.guardando;
  var texto = I.texto;
  var args = { id: id, texto: texto, base: I.base };
  if (forzar === 'encima') args.forzar = true;
  I.guardando = llamar('guardarSeccion', args).then(function (r) {
    I.guardando = null;
    I.datos.idx[id] = Object.assign(I.datos.idx[id] || {}, { f: r.f, n: r.n, e: r.e });
    I.textos[id] = { texto: texto, f: r.f };
    I.todo = null;
    if (I.sel === id) { I.original = texto; I.base = r.f; I.sucio = I.texto !== texto; }
    ponerLocal(llaveBorrador(id), I.sucio ? JSON.stringify({ t: I.texto, base: I.base, h: Date.now() }) : '');
    var a = $('#inf-indice'); if (a) a.innerHTML = indiceInfHtml();
    pintarEstadoInf();
    toast('Sección guardada.', 'bien');
  }).catch(function (e) {
    I.guardando = null;
    pintarEstadoInf();
    if (/^CONFLICTO/.test(e.message)) {
      modal('<h2>Esta sección cambió en otra ventana</h2><p class="tenue">' + esc(e.message.replace(/^CONFLICTO:\s*/, '')) + '</p><p class="pequeno tenue">Tu texto sigue en este navegador. Puedes abrir la versión guardada y comparar, o guardar la tuya encima.</p><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="infVerGuardada">Ver la versión guardada</button><button class="btn primario" data-a="infGuardarEncima">Guardar la mía encima</button></div>');
      throw e;
    }
    fallo(e);
    throw e;
  });
  return I.guardando;
}

// ------------------------------------------------------------------ edicion del texto (barra de botones)
function areaInf() { return $('#inf-texto'); }
/** Reemplaza [a, b) por texto conservando el deshacer del navegador; luego selecciona [sa, sb) relativo al inicio. */
function mdReemplazar(ta, a, b, texto, sa, sb) {
  ta.focus();
  ta.setSelectionRange(a, b);
  var ok = false;
  try { ok = document.execCommand && document.execCommand('insertText', false, texto); } catch (e) { ok = false; }
  if (!ok || ta.value.substring(a, a + texto.length) !== texto) { ta.setRangeText(texto, a, b, 'end'); }
  if (sa !== undefined) ta.setSelectionRange(a + sa, a + (sb === undefined ? sa : sb));
  infEscribio(ta);
}
function lineasSel(ta) {
  var v = ta.value, a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1, b = v.indexOf('\n', ta.selectionEnd);
  if (b < 0) b = v.length;
  return { a: a, b: b, txt: v.substring(a, b) };
}
function mdEnvolver(ta, marca, relleno) {
  var a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.substring(a, b);
  if (sel && sel.indexOf(marca) === 0 && sel.lastIndexOf(marca) === sel.length - marca.length && sel.length >= 2 * marca.length) {
    var sin = sel.substring(marca.length, sel.length - marca.length);
    mdReemplazar(ta, a, b, sin, 0, sin.length);
    return;
  }
  var t = sel || relleno;
  mdReemplazar(ta, a, b, marca + t + marca, marca.length, marca.length + t.length);
}
function mdPrefijo(ta, tipo) {
  var l = lineasSel(ta), filas = l.txt.split('\n'), n = 0;
  var nuevas = filas.map(function (f) {
    var limpia = f.replace(/^(#{2,4}\s+|[-*•]\s+|\d+[.)]\s+|>\s?)/, '');
    if (tipo === 'h2' || tipo === 'h3') { if (!limpia.trim()) limpia = 'Subtítulo'; return (tipo === 'h2' ? '## ' : '### ') + limpia; }
    if (!limpia.trim() && filas.length > 1) return f;
    n++;
    return (tipo === 'ul' ? '- ' : (tipo === 'ol' ? n + '. ' : '> ')) + limpia;
  });
  var t = nuevas.join('\n');
  mdReemplazar(ta, l.a, l.b, t, t.length);
}
function mdInsertarBloque(ta, bloque, a, b) {
  var v = ta.value;
  if (a === undefined) { a = ta.selectionStart; b = ta.selectionEnd; }
  var antes = a > 0 && v.charAt(a - 1) !== '\n' ? '\n' : '', despues = b < v.length && v.charAt(b) !== '\n' ? '\n' : '';
  mdReemplazar(ta, a, b, antes + bloque + despues, (antes + bloque).length);
}
function mdOp(op) {
  var ta = areaInf();
  if (!ta) return;
  var I = nInf();
  I.cursor = [ta.selectionStart, ta.selectionEnd];
  if (op === 'b') mdEnvolver(ta, '**', 'texto en negrita');
  else if (op === 'i') mdEnvolver(ta, '*', 'texto en cursiva');
  else if (op === 'u') mdEnvolver(ta, '__', 'texto subrayado');
  else if (op === 'h2' || op === 'h3' || op === 'ul' || op === 'ol' || op === 'cita') mdPrefijo(ta, op);
  else if (op === 'citar') abrirCitarInf();
  else if (op === 'tabla') abrirTablaInf();
  else if (op === 'figura') abrirFiguraInf();
  else if (op === 'ecuacion') abrirEcuacionInf();
}
/** Vuelve a poner el cursor donde estaba antes de abrir una ventana. */
function areaEnCursor() {
  var ta = areaInf(), c = nInf().cursor;
  if (ta && c) { ta.focus(); ta.setSelectionRange(c[0], c[1]); }
  return ta;
}

// ---- citar
function abrirCitarInf() {
  var bib = S.d.biblioteca || [];
  if (!bib.length) { toast('Tu biblioteca está vacía. Agrega fuentes en Biblioteca o con Consensus (abajo).'); return; }
  modal('<h2>' + IC.libro + ' Citar una fuente</h2><div class="campo-simple"><label for="inf-cita-q">Buscar en tu biblioteca</label><input id="inf-cita-q" type="search" placeholder="Autor, año o palabra del título" autocomplete="off"></div><div id="inf-cita-l" class="pila" style="gap:6px;max-height:52vh;overflow:auto">' + listaCitasInf('') + '</div><div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cerrar</button></div>', true);
}
function listaCitasInf(q) {
  q = sinTildes(String(q || '').toLowerCase());
  var l = (S.d.biblioteca || []).filter(function (b) { return !q || sinTildes((b.clave_cita + ' ' + b.titulo + ' ' + b.anio + ' ' + (b.autores || []).map(function (a) { return a.apellido; }).join(' ')).toLowerCase()).indexOf(q) >= 0; });
  if (!l.length) return '<p class="tenue pequeno">Nada coincide.</p>';
  return l.slice(0, 60).map(function (b) { return '<button class="ref-cand clic" data-a="infCitarK" data-k="' + esc(b.clave_cita) + '" style="text-align:left"><span class="cita">[@' + esc(b.clave_cita) + ']</span> <span class="pequeno">' + refHtml(b) + '</span></button>'; }).join('');
}
function citarInf(k) {
  cerrarModal();
  var ta = areaEnCursor();
  if (!ta) return;
  var a = ta.selectionStart, v = ta.value;
  var esp = a > 0 && !/\s/.test(v.charAt(a - 1)) ? ' ' : '';
  mdReemplazar(ta, a, ta.selectionEnd, esp + '[@' + k + ']', (esp + '[@' + k + ']').length);
}

// ---- tablas
function tablaEnCursor(ta) {
  var v = ta.value, lineas = v.split('\n'), pos = 0, li = 0;
  for (var i = 0; i < lineas.length; i++) { if (pos + lineas[i].length >= ta.selectionStart) { li = i; break; } pos += lineas[i].length + 1; }
  var esFila = function (k) { return k >= 0 && k < lineas.length && /^\s*\|/.test(lineas[k]); };
  var dentro = esFila(li) || (/^\s*Tabla\s*:/i.test(lineas[li] || '') && esFila(li + 1)) || (/^\s*Nota\s*[:.]/i.test(lineas[li] || '') && esFila(li - 1));
  if (!dentro) return null;
  var ini = li, fin = li;
  if (/^\s*Tabla\s*:/i.test(lineas[li])) { ini = li; fin = li + 1; }
  if (/^\s*Nota\s*[:.]/i.test(lineas[li])) { ini = li - 1; fin = li - 1; }
  while (esFila(ini - 1)) ini--;
  while (esFila(fin + 1)) fin++;
  if (ini > 0 && /^\s*Tabla\s*:/i.test(lineas[ini - 1])) ini--;
  if (fin + 1 < lineas.length && /^\s*Nota\s*[:.]/i.test(lineas[fin + 1])) fin++;
  var bloque = lineas.slice(ini, fin + 1).join('\n');
  var b = leerMd(bloque).filter(function (x) { return x.t === 'tabla'; })[0];
  if (!b) return null;
  var a = 0;
  for (var k = 0; k < ini; k++) a += lineas[k].length + 1;
  return { a: a, b: a + bloque.length, t: b };
}
function abrirTablaInf() {
  var ta = areaInf(), ex = ta ? tablaEnCursor(ta) : null;
  var T = ex ? { titulo: ex.t.titulo, filas: ex.t.filas.map(function (f) { return f.slice(); }), nota: ex.t.nota, rango: [ex.a, ex.b] } : { titulo: '', filas: [['Columna 1', 'Columna 2', 'Columna 3'], ['', '', ''], ['', '', '']], nota: 'Elaboración propia.' };
  nInf().tabla = T;
  pintarTablaInf();
}
function pintarTablaInf() {
  var T = nInf().tabla, nf = T.filas.length - 1, nc = T.filas[0].length;
  modal('<h2>' + IC.tabla + (T.rango ? ' Editar la tabla' : ' Insertar una tabla') + '</h2><p class="pequeno tenue">Formato APA 7: el número («Tabla 1») se pone solo; escribe el título y llena las celdas. La primera fila es el encabezado.</p>' +
    '<div class="campo-simple"><label for="tb-titulo">Título de la tabla</label><input id="tb-titulo" value="' + esc(T.titulo) + '" placeholder="Por ejemplo: Exactitud de los modelos evaluados"></div>' +
    '<div class="fila" style="gap:10px;align-items:flex-end"><div class="campo-simple" style="margin:0;width:120px"><label for="tb-filas">Filas de datos</label><input id="tb-filas" type="number" min="1" max="40" value="' + nf + '"></div><div class="campo-simple" style="margin:0;width:120px"><label for="tb-cols">Columnas</label><input id="tb-cols" type="number" min="1" max="10" value="' + nc + '"></div><button class="btn chico" data-a="tbDims">Ajustar</button></div>' +
    '<div class="desliza" style="margin-top:10px"><table class="tb-grilla">' + T.filas.map(function (f, i) { return '<tr>' + f.map(function (c, j) { return '<td><input data-tb="' + i + ',' + j + '" value="' + esc(c) + '"' + (i === 0 ? ' class="enc"' : '') + ' aria-label="Fila ' + i + ', columna ' + (j + 1) + '"></td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
    '<div class="campo-simple" style="margin-top:10px"><label for="tb-nota">Nota (debajo de la tabla)</label><input id="tb-nota" value="' + esc(T.nota) + '"></div>' +
    '<p class="pequeno tenue">En las celdas también puedes citar con [@clave] y usar **negrita**.</p>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="tbInsertar">' + (T.rango ? 'Guardar cambios en la tabla' : 'Insertar tabla') + '</button></div>', true);
}
function leerGrillaTb() {
  var T = nInf().tabla;
  $$('[data-tb]').forEach(function (inp) { var p = inp.getAttribute('data-tb').split(','); T.filas[+p[0]][+p[1]] = inp.value; });
  var ti = $('#tb-titulo'), no = $('#tb-nota');
  if (ti) T.titulo = ti.value; if (no) T.nota = no.value;
}
function tbDims() {
  leerGrillaTb();
  var T = nInf().tabla, nf = Math.max(1, Math.min(40, parseInt($('#tb-filas').value, 10) || 1)), nc = Math.max(1, Math.min(10, parseInt($('#tb-cols').value, 10) || 1));
  T.filas = T.filas.slice(0, nf + 1);
  while (T.filas.length < nf + 1) T.filas.push([]);
  T.filas = T.filas.map(function (f, i) { f = f.slice(0, nc); while (f.length < nc) f.push(i === 0 ? 'Columna ' + (f.length + 1) : ''); return f; });
  pintarTablaInf();
}
function tbInsertar() {
  leerGrillaTb();
  var T = nInf().tabla, limpia = function (c) { return String(c || '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim(); };
  var md = ['Tabla: ' + (limpia(T.titulo) || 'Título de la tabla')];
  T.filas.forEach(function (f, i) { md.push('| ' + f.map(limpia).join(' | ') + ' |'); if (i === 0) md.push('|' + f.map(function () { return '---'; }).join('|') + '|'); });
  md.push('Nota: ' + (limpia(T.nota) || 'Elaboración propia.'));
  cerrarModal();
  var ta = areaEnCursor();
  if (!ta) return;
  if (T.rango) mdReemplazar(ta, T.rango[0], T.rango[1], md.join('\n'), md.join('\n').length);
  else mdInsertarBloque(ta, md.join('\n'));
}

// ---- figuras
function abrirFiguraInf() {
  nInf().fig = { modo: 'subir', datos: '', tipo: '' };
  modal('<h2>' + IC.imagen + ' Insertar una figura</h2><p class="pequeno tenue">Formato APA 7: «Figura 1» se pone solo, arriba va el título en cursiva y debajo la nota con la fuente.</p>' +
    '<div class="campo-simple"><label for="fg-titulo">Título de la figura</label><input id="fg-titulo" placeholder="Por ejemplo: Arquitectura del sistema propuesto"></div>' +
    '<div class="campo-simple"><label for="fg-fuente">Fuente</label><input id="fg-fuente" value="Elaboración propia"></div>' +
    '<div class="segmentos" style="margin:6px 0 10px"><button class="activo" data-a="fgModo" data-m="subir">Subir la imagen ahora</button><button data-a="fgModo" data-m="espacio">Dejar el espacio y pegarla en Word</button></div>' +
    '<div id="fg-zona"><label class="zona-archivo" data-zona="fg-archivo"><input id="fg-archivo" type="file" accept="image/png,image/jpeg" hidden>' + IC.subir + '<span>Elige o arrastra una imagen PNG o JPG. La aplicación la reduce para que pese poco.</span></label><div id="fg-vista" style="margin-top:8px"></div></div>' +
    '<p class="pequeno tenue" id="fg-consejo">Recomendado si ya tienes la imagen: queda en tu carpeta del curso y sale en el Word en su lugar. Si aún no la tienes, elige dejar el espacio: en el Word aparece resaltado para que la pegues.</p>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="fgInsertar" id="fg-boton">Insertar figura</button></div>');
}
function fgModo(m) {
  nInf().fig.modo = m;
  $$('[data-a=fgModo]').forEach(function (b) { b.classList.toggle('activo', b.getAttribute('data-m') === m); });
  var z = $('#fg-zona'); if (z) z.hidden = m !== 'subir';
}
/** Reduce la imagen en el navegador: lado mayor de 1600 px, JPEG al 85 % (o PNG si es un dibujo pequeno). */
function reducirImagen(archivo) {
  return new Promise(function (ok, mal) {
    if (!/^image\/(png|jpeg)$/.test(archivo.type)) { mal(new Error('Sube una imagen PNG o JPG.')); return; }
    var lector = new FileReader();
    lector.onerror = function () { mal(new Error('No se pudo leer la imagen.')); };
    lector.onload = function () {
      var img = new Image();
      img.onerror = function () { mal(new Error('La imagen no se pudo abrir.')); };
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        var g = c.getContext('2d');
        g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        var png = archivo.type === 'image/png' && archivo.size < 400000 && k === 1;
        var url = png ? lector.result : c.toDataURL('image/jpeg', 0.85);
        ok({ url: url, tipo: png ? 'image/png' : 'image/jpeg', nombre: archivo.name });
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
function fgLeer(archivo) {
  var F = nInf().fig;
  reducirImagen(archivo).then(function (r) {
    F.datos = r.url; F.tipo = r.tipo; F.nombre = r.nombre;
    var v = $('#fg-vista'); if (v) v.innerHTML = '<img src="' + esc(r.url) + '" alt="Vista previa" style="max-width:100%;max-height:220px;border:1px solid var(--borde);border-radius:8px"><p class="pequeno tenue">Lista para subir (' + Math.round(r.url.length * 0.75 / 1024) + ' KB).</p>';
    var t = $('#fg-titulo'); if (t && !t.value) t.value = String(r.nombre || '').replace(/\.[a-z]+$/i, '').replace(/[_-]+/g, ' ');
  }).catch(fallo);
}
function fgInsertar(btn) {
  var F = nInf().fig, titulo = ($('#fg-titulo').value || '').replace(/[\[\]]/g, '').trim(), fuente = ($('#fg-fuente').value || '').trim();
  if (!titulo) { toast('Escribe el título de la figura.'); return; }
  var poner = function (id) {
    cerrarModal();
    var ta = areaEnCursor();
    if (!ta) return;
    mdInsertarBloque(ta, '![' + titulo + '](' + (id ? 'fig:' + id : '') + ')' + (fuente ? '\nFuente: ' + fuente : ''));
    if (nInf().previa) pintarPreviaInf();
  };
  if (F.modo !== 'subir') { poner(''); return; }
  if (!F.datos) { toast('Elige la imagen o marca «Dejar el espacio».'); return; }
  var fin = ocupar(btn, 'Subiendo');
  llamar('subirFigura', { nombre: F.nombre, tipo: F.tipo, datos: F.datos.split('base64,')[1] }).then(function (r) {
    fin();
    S.figLocal = S.figLocal || {};
    S.figLocal[r.id] = F.datos;
    poner(r.id);
    toast('Figura subida a tu carpeta del curso.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}

// ---- ecuaciones
var EQ_ATAJOS = [['Fracción', '\\frac{a}{b}'], ['Raíz', '\\sqrt{x}'], ['Potencia', 'x^{2}'], ['Subíndice', 'x_{i}'], ['Sumatoria', '\\sum_{i=1}^{n} x_i'], ['Integral', '\\int_{a}^{b} f(x)\\,dx'], ['Media', '\\bar{x}'], ['Paréntesis', '\\left( x \\right)'],
  ['α', '\\alpha'], ['β', '\\beta'], ['μ', '\\mu'], ['σ', '\\sigma'], ['χ²', '\\chi^{2}'], ['≤', '\\leq'], ['≥', '\\geq'], ['≠', '\\neq'], ['±', '\\pm'], ['×', '\\times'], ['Texto', '\\text{palabra}']];
var EQ_EJEMPLOS = [['Media aritmética', '\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i'], ['Exactitud', '\\text{Exactitud} = \\frac{VP + VN}{VP + VN + FP + FN}'], ['F1', 'F_1 = 2 \\cdot \\frac{P \\cdot R}{P + R}'], ['Tamaño de muestra', 'n = \\frac{Z^{2} p q N}{e^{2}(N-1) + Z^{2} p q}'], ['Alfa de Cronbach', '\\alpha = \\frac{k}{k-1}\\left(1 - \\frac{\\sum S_i^{2}}{S_t^{2}}\\right)']];
function abrirEcuacionInf() {
  var ta = areaInf(), l = ta ? lineasSel(ta) : null, previa = '', rango = null;
  if (l && /^\s*\$\$.*\$\$\s*$/.test(l.txt)) { previa = l.txt.trim().replace(/^\$\$|\$\$$/g, '').trim(); rango = [l.a, l.b]; }
  nInf().eq = { rango: rango };
  modal('<h2>' + IC.sigma + (rango ? ' Editar la ecuación' : ' Insertar una ecuación') + '</h2><p class="pequeno tenue">Se escribe en LaTeX, el formato estándar de las ecuaciones. Usa los botones o un ejemplo y cambia las letras. En el Word sale como ecuación de Office, editable.</p>' +
    '<div class="eq-atajos">' + EQ_ATAJOS.map(function (x, i) { return '<button class="btn chico" data-a="eqAtajo" data-i="' + i + '">' + esc(x[0]) + '</button>'; }).join('') + '</div>' +
    '<div class="campo-simple"><label for="eq-tex">Ecuación (LaTeX)</label><textarea id="eq-tex" class="mono" rows="3" spellcheck="false" placeholder="\\frac{a}{b}">' + esc(previa) + '</textarea></div>' +
    '<div class="eq-previa" id="eq-previa">' + (previa ? mathHtml(previa, true) : '<span class="tenue pequeno">La vista previa aparece aquí.</span>') + '</div>' +
    '<div class="segmentos" style="margin:8px 0"><button class="activo" data-a="eqModo" data-m="aparte">Aparte y numerada</button><button data-a="eqModo" data-m="linea"' + (rango ? ' disabled' : '') + '>Dentro del párrafo</button></div>' +
    '<details class="mini-guia"><summary>Ejemplos listos para usar</summary><div class="pila" style="gap:6px;margin-top:6px">' + EQ_EJEMPLOS.map(function (x, i) { return '<button class="ref-cand clic" data-a="eqEjemplo" data-i="' + i + '" style="text-align:left"><b class="pequeno">' + esc(x[0]) + '</b><code class="pequeno" style="display:block">' + esc(x[1]) + '</code></button>'; }).join('') + '</div></details>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="eqInsertar">' + (rango ? 'Guardar cambios' : 'Insertar ecuación') + '</button></div>', true);
  nInf().eq.modo = 'aparte';
  cargarKatex().then(pintarEq);
}
function pintarEq() { var t = $('#eq-tex'), p = $('#eq-previa'); if (t && p) p.innerHTML = t.value.trim() ? mathHtml(t.value.trim(), true) : '<span class="tenue pequeno">La vista previa aparece aquí.</span>'; }
function eqAtajo(i) {
  var t = $('#eq-tex'), x = EQ_ATAJOS[i][1];
  if (!t) return;
  var a = t.selectionStart || t.value.length;
  t.setRangeText(x, a, t.selectionEnd || a, 'end');
  t.focus();
  pintarEq();
}
function eqInsertar() {
  var E = nInf().eq, tex = ($('#eq-tex').value || '').replace(/\$/g, '').trim();
  if (!tex) { toast('Escribe la ecuación.'); return; }
  cerrarModal();
  var ta = areaEnCursor();
  if (!ta) return;
  if (E.rango) mdReemplazar(ta, E.rango[0], E.rango[1], '$$' + tex + '$$', tex.length + 4);
  else if (E.modo === 'linea') { var a = ta.selectionStart; mdReemplazar(ta, a, ta.selectionEnd, '$' + tex + '$', tex.length + 2); }
  else mdInsertarBloque(ta, '$$' + tex + '$$');
  if (nInf().previa) pintarPreviaInf();
}

// ------------------------------------------------------------------ traer del plan, marcar, word y similitud
function abrirTraerInf() {
  var s = secInf(nInf().sel);
  modal('<h2>Traer de tu plan aprobado</h2><p class="tenue">Se copia lo que escribiste en el plan para «' + esc(s.t) + '», con sus citas, tablas y subtítulos. Luego amplíalo y actualízalo.</p>' +
    '<label class="fila" style="gap:8px;margin-top:10px"><input type="checkbox" id="tr-pasado" checked> Pasar a tiempo pasado (por ejemplo, «se aplicará» pasa a «se aplicó»). Revisa el resultado: es una ayuda automática.</label>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="cerrarModal">Cancelar</button>' + (nInf().texto ? '<button class="btn" data-a="infTraerHacer" data-m="final">Agregar al final</button>' : '') + '<button class="btn primario" data-a="infTraerHacer" data-m="reemplazar">' + (nInf().texto ? 'Reemplazar lo escrito' : 'Traer') + '</button></div>');
}
function traerInf(modo, btn) {
  var I = nInf(), fin = ocupar(btn, 'Trayendo');
  llamar('traerDelPlan', { id: I.sel, pasado: $('#tr-pasado').checked }).then(function (r) {
    fin(); cerrarModal();
    if (!r.encontrado || !r.md) { toast('No encontramos esa sección en tu plan. Escríbela aquí.'); return; }
    var ta = areaInf();
    if (!ta) return;
    if (modo === 'final' && ta.value.trim()) mdReemplazar(ta, ta.value.length, ta.value.length, '\n\n' + r.md, r.md.length + 2);
    else mdReemplazar(ta, 0, ta.value.length, r.md, 0);
    if (I.previa) pintarPreviaInf();
    toast('Listo. Revisa el texto y pulsa Guardar.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}
function marcarListaInf(btn) {
  var I = nInf(), it = itInf(I.sel), lista = it.e !== 'lista';
  var fin = ocupar(btn, lista ? 'Marcando' : 'Quitando');
  guardarInf().then(function () { return llamar('marcarSeccionInf', { id: I.sel, lista: lista }); }).then(function (r) {
    fin();
    I.datos.idx = r.idx;
    repintarInf();
    toast(lista ? 'Tu asesor la verá como lista para revisar.' : 'Quitaste la marca.', 'bien');
  }).catch(function (e) { fin(); if (!/^CONFLICTO/.test(e.message)) fallo(e); });
}
function wordInf(btn) {
  var fin = ocupar(btn, 'Armando tu Word');
  guardarInf().then(function () { return llamar('generarInforme'); }).then(function (r) {
    fin();
    var id = idDoc(r.url);
    modal('<h2>Tu borrador de tesis está listo</h2><p class="tenue">Con carátula de tesis, hoja del jurado, índice, listas de tablas y gráficos, los capítulos I a VIII, referencias en ' + esc(nombreEstilo(estiloCita())) + ' y anexos. ' + (r.pendientes ? 'Lo que falta (secciones vacías, figuras por pegar) quedó resaltado en amarillo.' : 'No quedaron marcas pendientes.') + '</p>' +
      (r.ecuaciones ? '<p class="pequeno" style="margin-top:8px">' + IC.sigma + ' ' + r.ecuaciones + ' ecuación(es) quedaron como ecuaciones de Office, editables en Word.</p>' : '') +
      (r.avisoEcuaciones ? '<div class="aviso ambar" style="margin-top:8px">' + esc(r.avisoEcuaciones) + '</div>' : '') +
      (r.citasRotas && r.citasRotas.length ? '<div class="aviso ambar" style="margin-top:8px">Citas sin fuente en tu biblioteca: ' + esc(r.citasRotas.join(', ')) + '</div>' : '') +
      '<div class="fila" style="margin-top:16px"><a class="btn primario" href="' + esc(enlace(r.docx)) + '" target="_blank" rel="noopener">' + IC.doc + 'Descargar en Word</a><a class="btn" href="' + esc(urlDoc(id, 'pdf')) + '" target="_blank" rel="noopener">PDF</a>' + (SERVIDOR ? '' : '<a class="btn" href="' + esc(enlace(r.url)) + '" target="_blank" rel="noopener">' + TXT_ABRIR_DOC + IC.afuera + '</a>') + '</div>' +
      '<p class="pequeno tenue" style="margin-top:12px">En Word, actualiza el índice desde Referencias, Tabla de contenido: los títulos ya tienen estilo de encabezado. Las ecuaciones se editan con doble clic.</p>' +
      '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Seguir escribiendo</button></div>');
  }).catch(function (e) { fin(); if (!/^CONFLICTO/.test(e.message)) fallo(e); });
}
function similitudInf(btn) {
  var fin = ocupar(btn, 'Revisando');
  guardarInf().then(function () { return llamar('similitudInforme'); }).then(function (r) {
    fin();
    modal(similitudHtml(r, true) + '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cerrar</button></div>');
  }).catch(function (e) { fin(); if (!/^CONFLICTO/.test(e.message)) fallo(e); });
}
function similitudHtml(r, propio) {
  var tono = r.pct > r.umbral ? 'rojo' : (r.pct > r.umbral / 2 ? 'ambar' : 'verde');
  return '<h2>Similitud del borrador</h2><div class="fila" style="margin:8px 0"><span class="chip ' + tono + '" style="font-size:15px">' + r.pct + ' %</span><span class="pequeno tenue">de ' + r.palabras + ' palabras repiten secuencias de 11 palabras o más de los resúmenes de la biblioteca (máximo ' + r.umbral + ' % en tesis de pregrado).</span></div>' +
    (r.secciones.length ? '<ul class="pequeno">' + r.secciones.map(function (x) { var s = secInf(x.id) || { t: x.id }; return '<li><b>' + esc(s.cap || s.c === 'pre' ? s.t : x.id + ' ' + s.t) + '</b>: ' + x.fragmentos + ' fragmento(s), ' + x.pct + ' %</li>'; }).join('') + '</ul>' : '<p class="pequeno" style="color:var(--verde)">No se encontraron fragmentos copiados de los resúmenes.</p>') +
    '<p class="pequeno tenue">Reglamento de Similitud y Originalidad de la UNDC (RCO N.° 503-2025-UNDC/CO, Arts. 12 y 13). Es una estimación interna frente a tu biblioteca: no reemplaza el informe del software institucional.' + (propio ? ' Si algo aparece, parafrasea con tus palabras y conserva la cita.' : '') + '</p>';
}

// ------------------------------------------------------------------ solicitar un cambio al plan
function abrirSolicitudPlan() {
  var etapas = S.d.etapas || [], porEtapa = {};
  (S.d.campos || []).filter(function (c) { return aplica(c.aplica) && c.clave.charAt(0) !== '_'; }).forEach(function (c) { (porEtapa[c.etapa] = porEtapa[c.etapa] || []).push(c); });
  modal('<h2>Solicitar un cambio al plan</h2><p class="tenue">Tu plan está aprobado y congelado. Elige solo lo que necesitas cambiar y explica por qué. La coordinación autoriza esas secciones; al terminar, vuelve a aprobar el plan (versión nueva).</p>' +
    '<div class="sol-campos">' + etapas.filter(function (e) { return porEtapa[e.id]; }).map(function (e) {
      return '<details><summary>' + esc(e.id + '. ' + e.nombre) + '</summary>' + porEtapa[e.id].map(function (c) { return '<label class="fila" style="gap:8px;margin:4px 0"><input type="checkbox" data-solk="' + esc(c.clave) + '"> ' + esc(etiquetaDe(c, S.exp)) + '</label>'; }).join('') + '</details>';
    }).join('') + '</div>' +
    '<div class="campo-simple" style="margin-top:10px"><label for="sol-motivo">Motivo</label><textarea id="sol-motivo" rows="3" placeholder="Por ejemplo: el hospital no autorizó el acceso y la muestra será de otra institución."></textarea></div>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="infEnviarSolicitud">Enviar solicitud</button></div>', true);
}
function enviarSolicitudPlan(btn) {
  var campos = $$('[data-solk]').filter(function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-solk'); });
  var fin = ocupar(btn, 'Enviando');
  llamar('solicitarCambioPlan', { campos: campos, motivo: $('#sol-motivo').value }).then(function (r) {
    fin(); cerrarModal();
    S.exp = r.expediente; S.d.expediente = r.expediente;
    toast('Solicitud enviada a la coordinación.', 'bien');
    ir(S.vista);
  }).catch(function (e) { fin(); fallo(e); });
}

// ------------------------------------------------------------------ Consensus en el borrador (prioridad)
function consultasInf(s) {
  var e = S.exp || {}, v1 = String(e.var1 || '').trim(), v2 = String(e.var2 || '').trim(), ambas = (v1 + ' ' + v2).trim();
  var m = {
    intro: [ambas, ambas + ' review'], contexto: [ambas + ' Peru Latin America', ambas],
    var1: [v1 + ' definition dimensions', v1 + ' theory model'], var2: [v2 + ' definition dimensions', v2 + ' theory model'],
    antecedentes: [ambas, ambas + ' systematic review'], metodo: [ambas + ' methodology', ambas + ' research design'],
    instrumentos: [v2 + ' measurement instrument validity reliability', v1 + ' evaluation metrics'],
    discusion: [ambas + ' effect results', ambas + ' limitations contradictory findings'], futuro: [ambas + ' future research directions', ambas + ' limitations']
  };
  return (m[s.cons] || [ambas]).map(function (q) { return q.replace(/\s+/g, ' ').trim(); }).filter(function (q) { return q.length > 2; });
}
function consMes() {
  var m = new Date().toISOString().substring(0, 7), d = jsonDe(leerLocalUsuario('qsi_cons_mes'), null);
  return d && d.m === m ? d.n : 0;
}
function sumarConsMes(n) { var m = new Date().toISOString().substring(0, 7); ponerLocal(llaveLocal('qsi_cons_mes'), JSON.stringify({ m: m, n: consMes() + n })); }
function consInfHtml(s) {
  var I = nInf(), C = I.cons && I.cons.sec === s.id ? I.cons : null, sug = consultasInf(s);
  var h = '<section class="tarjeta inf-cons"><div class="fila entre"><h3 style="margin:0">' + IC.brujulaN + ' Evidencia con Consensus</h3><span class="pequeno tenue">' + consMes() + ' de 30 consultas este mes (estimado en este navegador)</span></div>';
  if (!consensusListo()) return h + '<p class="pequeno" style="margin-top:6px">Para buscar papers aquí, guarda tu clave de Consensus en la tuerquita.</p><button class="btn chico" data-a="configurar">' + IC.engrane + 'Abrir mi configuración</button>' + guiaConsensusHtml(false) + '</section>';
  h += '<p class="pequeno tenue" style="margin-top:4px">' + (s.cons === 'discusion' ? 'Busca estudios que coincidan o difieran con tus resultados y arma la tabla de contraste.' : 'Busca fuentes recientes para esta sección. Mejor en inglés.') + '</p>' +
    '<form data-f="infConsensus" class="fila" style="align-items:flex-end;margin-top:8px"><div class="campo-simple crece" style="margin:0;min-width:220px"><label for="inf-cons-q">Buscar</label><input id="inf-cons-q" value="' + esc(C ? C.q : sug[0] || '') + '"></div>' +
    '<div class="campo-simple" style="margin:0;width:110px"><label for="inf-cons-desde">Desde</label><select id="inf-cons-desde">' + ['2015', '2018', '2020', '2022', ''].map(function (y) { return '<option value="' + y + '"' + ((C ? C.desde : '2020') === y ? ' selected' : '') + '>' + (y || 'Cualquiera') + '</option>'; }).join('') + '</select></div>' +
    '<label class="fila pequeno" style="gap:6px;margin-bottom:8px"><input type="checkbox" id="inf-cons-prof"' + (C && C.profunda ? ' checked' : '') + '> Profunda (2 consultas)</label><button class="btn primario" type="submit">Buscar</button></form>' +
    '<div class="fila" style="gap:6px;margin-top:6px">' + sug.map(function (q, i) { return '<button class="chip borde clic" data-a="infConsSug" data-i="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
    '<div id="inf-cons-res">' + consResInfHtml() + '</div></section>';
  return h;
}
function consResInfHtml() {
  var I = nInf(), C = I.cons;
  if (!C || C.sec !== I.sel) return '';
  if (C.cargando) return '<div class="pensando" style="padding:14px 4px"><i></i><span>Buscando en Consensus…</span></div>';
  if (C.error) return '<div class="aviso rojo" style="margin-top:8px">' + esc(C.error) + '</div>';
  var l = C.resultados || [];
  if (!l.length) return '<p class="tenue pequeno" style="margin-top:8px">Sin resultados. Prueba con otras palabras, en inglés.</p>';
  var s = secInf(I.sel), sel = l.filter(function (r) { return r.sel; }).length;
  return '<div class="pila" style="gap:8px;margin-top:10px">' + l.map(function (r, i) {
    return '<label class="ref-cand' + (r.sel ? ' sel' : '') + '"><input type="checkbox" data-infcons="' + i + '"' + (r.sel ? ' checked' : '') + '><span><b>' + esc(r.titulo) + '</b><span class="pequeno tenue" style="display:block">' + esc((r.autores[0] ? r.autores[0].apellido + (r.autores.length > 1 ? ' et al.' : '') : '') + ' (' + (r.anio || 's. f.') + ')' + (r.fuente ? ' · ' + r.fuente : '')) + '</span>' +
      (r.hallazgo ? '<span class="pequeno" style="display:block;margin-top:3px">' + IC.chispa + ' ' + esc(r.hallazgo) + '</span>' : '') +
      '<span class="fila" style="gap:4px;margin-top:4px">' + (r.tipoEstudio ? '<span class="chip borde">' + esc(r.tipoEstudio) + '</span>' : '') + (r.citas ? '<span class="chip borde">' + r.citas + ' citas</span>' : '') + (r.cuartil ? '<span class="chip borde">' + esc(r.cuartil) + '</span>' : '') + (r.ya ? '<span class="chip verde">En tu biblioteca [@' + esc(r.ya) + ']</span>' : '') + (enlace(r.url) ? '<a class="pequeno" href="' + esc(enlace(r.url)) + '" target="_blank" rel="noopener" data-a="nada">Abrir</a>' : '') + '</span></span></label>';
  }).join('') + '</div><div class="fila" style="margin-top:10px"><button class="btn primario" data-a="infConsCitar"' + (sel ? '' : ' disabled') + '>' + IC.libro + 'Agregar a mi biblioteca y citar aquí (' + sel + ')</button>' +
    (s && s.cons === 'discusion' ? '<button class="btn" data-a="infConsContraste"' + (sel ? '' : ' disabled') + '>' + IC.tabla + 'Insertar tabla de contraste</button>' : '') + '</div>';
}
function pintarConsInf() { var n = $('#inf-cons-res'); if (n) n.innerHTML = consResInfHtml(); }
function buscarConsInf() {
  var I = nInf(), q = $('#inf-cons-q').value.trim(), prof = $('#inf-cons-prof').checked, s = secInf(I.sel);
  if (q.length < 3) { toast('Escribe qué buscar.'); return; }
  var otras = consultasInf(s).filter(function (x) { return x !== q; });
  var consultas = prof ? [q].concat(otras.slice(0, 1)) : [q];
  I.cons = { sec: I.sel, q: q, desde: $('#inf-cons-desde').value, profunda: prof, cargando: true };
  pintarConsInf();
  llamar('consensus', { consultas: consultas, desde: I.cons.desde, claveConsensus: claveConsensus(), cuantos: prof ? 10 : 15, borrador: true }).then(function (r) {
    sumarConsMes(r.consultas.length);
    r.resultados.forEach(function (x, i) { x.sel = false; });
    I.cons.cargando = false; I.cons.resultados = r.resultados;
    pintarConsInf();
  }).catch(function (e) { I.cons.cargando = false; I.cons.error = e.message; pintarConsInf(); });
}
/** Agrega a la biblioteca lo elegido (uso: teoria) y devuelve los estudios elegidos con su clave. */
function agregarConsInf() {
  var C = nInf().cons, elegidos = C.resultados.filter(function (r) { return r.sel; });
  var nuevos = elegidos.filter(function (r) { return !r.ya; }).map(function (r) {
    return { autores: r.autores, anio: r.anio, titulo: r.titulo, fuente: r.fuente, volumen: r.volumen, paginas: r.paginas, editorial: r.editorial, doi: r.doi, url: r.url, tipo: /thesis|dissertation/i.test(r.tipoEstudio) ? 'tesis' : 'articulo', verificado: 'consensus', resumen: (r.hallazgo ? 'Hallazgo clave (Consensus): ' + r.hallazgo + '\n' : '') + (r.resumen || '') };
  });
  var p = nuevos.length ? llamar('agregarReferencias', { items: nuevos, uso: 'teoria' }) : Promise.resolve({ biblioteca: S.d.biblioteca });
  return p.then(function (r) {
    S.d.biblioteca = r.biblioteca;
    elegidos.forEach(function (x) {
      if (x.ya) return;
      var b = r.biblioteca.filter(function (z) { return (x.doi && z.doi === x.doi) || z.titulo === x.titulo; })[0];
      if (b) x.ya = b.clave_cita;
    });
    C.resultados.forEach(function (x) { x.sel = false; });
    pintarConsInf();
    return elegidos.filter(function (x) { return x.ya; });
  });
}
function consCitarInf(btn) {
  var fin = ocupar(btn, 'Agregando');
  agregarConsInf().then(function (l) {
    fin();
    if (!l.length) { toast('No se pudieron agregar (les falta autor o título).'); return; }
    var ta = areaEnCursor();
    if (!ta) return;
    var grupo = l.map(function (x) { return '[@' + x.ya + ']'; }).join(' ');
    var a = ta.selectionStart, esp = a > 0 && !/\s/.test(ta.value.charAt(a - 1)) ? ' ' : '';
    mdReemplazar(ta, a, ta.selectionEnd, esp + grupo, (esp + grupo).length);
    toast(l.length + ' fuente(s) en tu biblioteca y citadas donde estaba el cursor.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}
function consContrasteInf(btn) {
  var fin = ocupar(btn, 'Armando la tabla');
  var hall = {};
  nInf().cons.resultados.forEach(function (r) { if (r.sel) hall[r.titulo] = r.hallazgo || ''; });
  agregarConsInf().then(function (l) {
    fin();
    if (!l.length) return;
    var md = ['Tabla: Contraste de los resultados con estudios previos', '| Resultado de esta investigación | Estudio | Hallazgo del estudio | ¿Coincide? | Posible explicación |', '|---|---|---|---|---|'];
    l.forEach(function (x) {
      var autor = x.autores[0] ? x.autores[0].apellido + (x.autores.length > 1 ? ' et al.' : '') : 'Autor';
      md.push('| [completa] | ' + autor + ' (' + (x.anio || 's. f.') + ') [@' + x.ya + '] | ' + String(hall[x.titulo] || '').replace(/\|/g, '/').substring(0, 160) + ' | [sí / en parte / no] | [completa] |');
    });
    md.push('Nota: Elaboración propia a partir de estudios encontrados con Consensus.');
    mdInsertarBloque(areaEnCursor(), md.join('\n'));
    toast('Tabla insertada. Completa cada fila con tu resultado y redacta la discusión debajo.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}

// ------------------------------------------------------------------ «Ver mi tesis» en modo borrador
function borradorDocHtml(textos, secciones, bib) {
  var ctx = nuevoCtxMd(bib), h = '<div class="hoja">', capAct = '';
  var ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  secciones.forEach(function (s) {
    if (s.c !== capAct) {
      capAct = s.c;
      if (s.c === 'anexos') {
        h += '</div><div class="hoja"><p class="d-h d-h1">REFERENCIAS</p>' + referenciasPreviaHtml(ctx, bib) + '</div><div class="hoja"><p class="d-h d-h1">ANEXOS</p><p class="d-h d-h2">Anexo 01: Matriz de consistencia</p><p class="d-vacio">Se agrega sola en el Word, desde tu plan aprobado.</p>';
      } else if (s.c !== 'pre') h += '</div><div class="hoja"><p class="d-h d-h1">' + s.c + '. ' + esc(s.ct) + '</p>';
    }
    if (s.c === 'pre') h += '</div><div class="hoja"><p class="d-h d-h1">' + esc(s.h || s.t.toUpperCase()) + '</p>';
    else if (!s.cap) { if (s.antes) h += '<p class="d-h d-h2">' + esc(s.antes) + '</p>'; h += '<p class="d-h d-h' + s.id.split('.').length + '">' + esc(s.id + ' ' + s.t) + '</p>'; }
    var t = textos[s.id] || '';
    var capNum = ROM.indexOf(s.c) + 1;
    h += t ? mdHtml(t, ctx, { id: s.id, cap: s.cap && capNum > 0 ? capNum : 0, anexos: s.c === 'anexos', pre: s.c === 'pre' }) : (s.c === 'anexos' ? '' : '<p class="d-vacio" data-a="infIrSec" data-id="' + esc(s.id) + '" title="Haz clic para escribirla">Redacta esta sección</p>');
    if (s.c === 'anexos') h += '<p class="d-h d-h2">Anexo: Declaración de uso de inteligencia artificial</p><p class="d-vacio">Se agrega sola en el Word.</p>';
  });
  return h.replace(/^<div class="hoja"><\/div>/, '') + '</div><p class="pequeno tenue" style="text-align:center;margin:4px 0 10px">Vista previa del borrador. La carátula, la hoja del jurado, el índice y las listas de tablas y gráficos se arman en el Word.</p>';
}
function referenciasPreviaHtml(ctx, bib) {
  var claves = Object.keys(ctx.num);
  var l = bib.filter(function (b) { return ctx.num[b.clave_cita]; });
  if (!esNumerico(ctx.estilo)) {
    // En los estilos de autor y año, las citadas son las que aparecen en el texto (se anotan al numerar)
    l = bib.filter(function (b) { return ctx.citadas && ctx.citadas[b.clave_cita]; });
  }
  if (!l.length && !claves.length) return '<p class="d-vacio">Aquí irán las fuentes que cites en el borrador.</p>';
  if (esNumerico(ctx.estilo)) l.sort(function (a, b) { return ctx.num[a.clave_cita] - ctx.num[b.clave_cita]; });
  else l.sort(function (a, b) { return sinTildes(autoresTexto(a, ctx.estilo)).localeCompare(sinTildes(autoresTexto(b, ctx.estilo)), 'es'); });
  return l.map(function (b) { return '<p class="d-ref' + (esNumerico(ctx.estilo) ? ' num' : '') + '">' + (esNumerico(ctx.estilo) ? '[' + ctx.num[b.clave_cita] + '] ' : '') + refHtml(b, ctx.estilo) + '</p>'; }).join('');
}
function cargarBorradorDoc() {
  var I = nInf(), n = $('#hojas');
  if (!n) return;
  var pintar = function () {
    if (!$('#hojas') || S.docModo !== 'borrador') return;
    $('#hojas').innerHTML = borradorDocHtml(I.todo, I.datos.secciones, S.d.biblioteca);
    var e = $('#doc-estado'); if (e) e.textContent = 'Borrador de tesis · vista previa';
  };
  var datos = I.datos ? Promise.resolve(I.datos) : llamar('informe').then(function (d) { I.datos = d; return d; });
  datos.then(function () { return I.todo ? I.todo : llamar('informeTodo').then(function (r) { I.todo = r.secciones; return I.todo; }); }).then(function () {
    var hay = Object.keys(I.todo).some(function (k) { return /\$/.test(I.todo[k]); });
    pintar();
    if (hay) cargarKatex().then(pintar);
  }).catch(fallo);
}

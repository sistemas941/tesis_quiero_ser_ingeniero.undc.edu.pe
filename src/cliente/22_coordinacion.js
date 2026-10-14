// ------------------------------------------------------------------ Plan aprobado: congelado (estudiante) y aprobación (coordinación)

/** En «Mi tesis», «Mi ruta» y «Matriz»: con el plan aprobado, todo queda en solo lectura salvo lo autorizado. */
var ACC_EDICION = ['ia', 'citar', 'agregarFila', 'quitarFila', 'humanizar', 'importar', 'desglosar', 'profundizar', 'usarPiezas', 'cerrarEtapa', 'usarPropuesta', 'humanizarSiguiente', 'excepcion'];
function aplicarCongelado() {
  if (!S.perfil || S.perfil.rol !== 'estudiante' || !planCongelado()) return;
  if (['tesis', 'etapa', 'matriz', 'ruta', 'clase'].indexOf(S.vista) < 0) return;
  var ab = planAbiertos(), ok = planOk(), sol = planSol(), pag = $('#pagina');
  if (!pag) return;
  if (!$('#aviso-congelado')) {
    var d = document.createElement('div');
    d.id = 'aviso-congelado';
    d.className = 'aviso congelado';
    d.innerHTML = IC.candado + '<div><b>Tu plan está aprobado (versión ' + esc(ok.v) + ', ' + esc(fechaCorta(ok.f)) + ') y quedó congelado.</b> ' +
      (ab.length ? 'La coordinación autorizó cambiar: ' + esc(ab.map(etiquetaCampo).join(', ')) + '. Lo demás sigue en solo lectura.' : 'Ahora sigue con tu borrador de tesis. Para cambiar algo del plan, pide un cambio.') +
      '</div><div class="fila"><button class="btn chico primario" data-a="ir" data-v="borrador">' + IC.libroAbierto + 'Ir al borrador</button>' + (sol && sol.estado === 'pendiente' ? '<span class="chip ambar">Pedido de cambio en espera</span>' : (ab.length ? '' : '<button class="btn chico" data-a="infSolicitar">Solicitar un cambio</button>')) + '</div>';
    pag.insertBefore(d, pag.firstChild);
  }
  if (S.vista === 'ruta' || S.vista === 'clase') return;
  $$('[id^="f-"]', pag).forEach(function (el) {
    var k = el.id.substring(2);
    if (ab.indexOf(k) >= 0) return;
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') el.disabled = true; else el.readOnly = true;
    el.classList.add('congelado');
  });
  $$('input[data-campo], textarea[data-campo], select[data-campo]', pag).forEach(function (el) {
    if (ab.indexOf(el.getAttribute('data-campo')) >= 0) return;
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') el.disabled = true; else el.readOnly = true;
  });
  $$('button[data-a]', pag).forEach(function (b) {
    if (ACC_EDICION.indexOf(b.getAttribute('data-a')) < 0) return;
    var k = b.getAttribute('data-campo');
    if (k && ab.indexOf(k) >= 0) return;
    b.disabled = true;
    b.title = 'Tu plan está aprobado: pide un cambio para editarlo';
  });
}

// ------------------------------------------------------------------ vista del expediente (asesor, coordinación)
function planPanelHtml(a) {
  var exp = a.expediente, ok = planOk(exp), sol = planSol(exp), ab = planAbiertos(exp), rol = S.perfil.rol, puede = rol === 'coordinador' || rol === 'admin';
  var rv = jsonDe(exp._revision, {}), total = 0, apr = 0, rev = 0;
  Object.keys(rv).forEach(function (k) { total++; if (rv[k] && rv[k].e === 'ok') { rev++; if (rv[k].por === 'asesor') apr++; } });
  var h = '<section class="tarjeta plan-estado" style="margin-bottom:16px"><div class="fila entre"><h3 style="margin:0">' + IC.plan + ' Plan y borrador de tesis</h3>';
  if (!ok) {
    h += '<span class="chip borde">Plan en elaboración</span></div><p class="pequeno tenue" style="margin-top:6px">Secciones revisadas por el estudiante: ' + rev + ' · aprobadas por el asesor: ' + apr + '. Al aprobar, el plan se congela y se abre el borrador de tesis.</p>';
    if (puede) h += '<button class="btn primario" data-a="aprobarPlan" style="margin-top:8px">' + IC.check + 'Aprobar el plan y abrir el borrador</button>';
    else if (rol === 'asesor') h += '<p class="pequeno" style="margin-top:6px">La aprobación del plan la hace la coordinación.</p>';
    return h + '</section>';
  }
  var inf = jsonDe(exp._inf_idx, {}), con = 0, apInf = 0, listas = 0;
  Object.keys(inf).forEach(function (k) { if (inf[k].n) con++; if (inf[k].e === 'ok') apInf++; if (inf[k].e === 'lista') listas++; });
  h += '<span class="chip verde">' + IC.candado + 'Aprobado · v' + esc(ok.v) + ' · ' + esc(fechaCorta(ok.f)) + '</span></div>' +
    '<p class="pequeno tenue" style="margin-top:6px">Aprobado por ' + esc(ok.por) + (ok.nota ? ': «' + esc(ok.nota) + '»' : '') + '. Borrador: ' + con + ' secciones con texto, ' + listas + ' esperan revisión, ' + apInf + ' aprobadas.</p>' +
    '<div class="fila" style="margin-top:8px">' + (ok.doc ? '<a class="btn chico" href="' + esc(urlDoc(ok.doc, SERVIDOR ? 'docx' : 'ver')) + '" target="_blank" rel="noopener">' + IC.doc + 'Word del plan aprobado</a>' : '') + (enlace(exp._inf_url) ? '<a class="btn chico" href="' + esc(enlace(exp._inf_url)) + '" target="_blank" rel="noopener">' + IC.doc + 'Último Word del borrador</a>' : '') + '<button class="btn chico" data-a="tabAlumno" data-t="borrador">' + IC.libroAbierto + 'Leer el borrador</button></div>';
  if (sol && sol.estado === 'pendiente') {
    h += '<div class="aviso ambar" style="margin-top:10px"><b>Pide cambiar el plan</b> (' + esc(fechaCorta(sol.f)) + '): ' + esc(sol.motivo) + '<div class="pequeno" style="margin-top:4px">Secciones: ' + esc(sol.campos.map(function (k) { var c = (a.campos || []).filter(function (x) { return x.clave === k; })[0]; return c ? c.etiqueta : k; }).join(', ')) + '</div>' +
      (puede ? '<div class="fila" style="margin-top:8px"><button class="btn chico primario" data-a="resolverCambio" data-d="autorizar">Autorizar esas secciones</button><button class="btn chico" data-a="resolverCambio" data-d="rechazar">No autorizar</button></div>' : '<div class="pequeno tenue" style="margin-top:4px">La decide la coordinación.</div>') + '</div>';
  } else if (ab.length) {
    h += '<div class="aviso gris" style="margin-top:10px"><b>Cambio autorizado</b> en: ' + esc(ab.map(function (k) { var c = (a.campos || []).filter(function (x) { return x.clave === k; })[0]; return c ? c.etiqueta : k; }).join(', ')) + '.' +
      (puede ? '<div class="fila" style="margin-top:8px"><button class="btn chico primario" data-a="aprobarPlan">Aprobar de nuevo (versión ' + (ok.v + 1) + ')</button></div>' : '') + '</div>';
  }
  return h + '</section>';
}
function abrirAprobarPlan() {
  var a = S.alumno, exp = a.expediente, ok = planOk(exp);
  var rv = jsonDe(exp._revision, {}), apr = 0, devueltas = 0;
  Object.keys(rv).forEach(function (k) { if (rv[k] && rv[k].e === 'ok' && rv[k].por === 'asesor') apr++; if (rv[k] && rv[k].e === 'devuelto') devueltas++; });
  modal('<h2>' + (ok ? 'Aprobar de nuevo el plan' : 'Aprobar el plan') + ' de ' + esc(a.perfil.nombre) + '</h2><p class="tenue">' + (ok ? 'Se congelan otra vez todas las secciones y queda la versión ' + (ok.v + 1) + '.' : 'El plan queda congelado: el estudiante ya no podrá modificarlo salvo que pida un cambio y lo autorices. Se abre su borrador de tesis y se guarda una copia fija del Word del plan.') + '</p>' +
    '<ul class="pequeno" style="margin:8px 0"><li>Secciones aprobadas por el asesor: <b>' + apr + '</b></li>' + (devueltas ? '<li style="color:var(--rojo)">Secciones devueltas sin corregir: <b>' + devueltas + '</b></li>' : '') + '<li>Título: ' + esc(exp.titulo || 'sin título') + '</li></ul>' +
    '<div class="campo-simple"><label for="ap-nota">Comentario para el estudiante (opcional)</label><textarea id="ap-nota" rows="2"></textarea></div>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="confirmarAprobarPlan">' + IC.check + 'Aprobar y congelar</button></div>');
}
function confirmarAprobarPlan(btn) {
  var a = S.alumno, fin = ocupar(btn, 'Aprobando (se guarda la copia del Word)');
  llamar('aprobarPlan', { correo: a.perfil.correo, nota: $('#ap-nota').value }).then(function (r) {
    fin(); cerrarModal();
    S.alumno = Object.assign(S.alumno, r);
    S.tablero = null;
    toast('Plan aprobado. Se abrió el borrador de tesis.', 'bien');
    var y = window.scrollY; ir('alumno').then(function () { window.scrollTo(0, y); });
  }).catch(function (e) { fin(); fallo(e); });
}
function resolverCambio(decision) {
  if (decision === 'rechazar') {
    modal('<h2>No autorizar el cambio</h2><div class="campo-simple"><label for="rc-com">Explica el motivo al estudiante</label><textarea id="rc-com" rows="3"></textarea></div><div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="confirmarResolver" data-d="rechazar">Enviar</button></div>');
    return;
  }
  confirmarResolver('autorizar');
}
function confirmarResolver(decision, btn) {
  var a = S.alumno, fin = ocupar(btn, 'Enviando'), com = $('#rc-com') ? $('#rc-com').value : '';
  llamar('resolverCambioPlan', { correo: a.perfil.correo, decision: decision, comentario: com }).then(function (r) {
    fin(); cerrarModal();
    S.alumno = Object.assign(S.alumno, r);
    toast(decision === 'autorizar' ? 'Autorizado: el estudiante ya puede editar esas secciones.' : 'Respuesta enviada.', 'bien');
    var y = window.scrollY; ir('alumno').then(function () { window.scrollTo(0, y); });
  }).catch(function (e) { fin(); fallo(e); });
}

// ---- pestaña «Borrador» del expediente
function borradorAlumnoHtml() {
  return '<div id="inf-alumno"><div class="pensando" style="padding:30px 10px"><i></i><span>Abriendo el borrador…</span></div></div>';
}
function cargarBorradorAlumno() {
  var a = S.alumno;
  if (!planCongelado(a.expediente)) { var n0 = $('#inf-alumno'); if (n0) n0.innerHTML = '<div class="vacio">El borrador se abre cuando la coordinación aprueba el plan.</div>'; return; }
  llamar('informeDe', { correo: a.perfil.correo }).then(function (r) {
    S.infAlumno = r;
    pintarBorradorAlumno();
    if (Object.keys(r.textos).some(function (k) { return /\$/.test(r.textos[k]); })) cargarKatex().then(pintarBorradorAlumno);
  }).catch(fallo);
}
function pintarBorradorAlumno() {
  var r = S.infAlumno, n = $('#inf-alumno');
  if (!r || !n) return;
  var ctx = nuevoCtxMd(S.alumno.biblioteca), ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'], decide = puedeDecidir();
  var h = r.similitud ? '<div class="tarjeta plana" style="margin-bottom:14px">' + similitudHtml(r.similitud, false).replace('<h2>', '<h3 style="margin:0">').replace('</h2>', '</h3>') + '</div>' : '';
  h += '<p class="tenue" style="margin-bottom:10px">' + (decide ? 'Aprueba cada sección o devuélvela con un comentario: el estudiante lo verá en rojo en su editor.' : 'Solo lectura: la revisión del contenido la hace el asesor.') + '</p>';
  r.secciones.forEach(function (s) {
    var it = r.idx[s.id] || {}, t = r.textos[s.id] || '', capNum = ROM.indexOf(s.c) + 1;
    h += '<section class="tarjeta inf-rev' + (it.e === 'lista' ? ' espera' : '') + '"><div class="fila entre"><div><p class="pequeno tenue">' + (s.c === 'pre' ? 'Preliminares' : (s.c === 'anexos' ? 'Anexos' : s.c + '. ' + esc(mayusculaInicial(s.ct)))) + '</p><h3 style="margin:0">' + esc(s.cap || s.c === 'pre' ? s.t : s.id + ' ' + s.t) + '</h3></div>' + chipInf(it) + '</div>' +
      (it.e === 'dev' && it.c ? '<div class="aviso rojo pequeno" style="margin-top:6px">Devuelta: ' + esc(it.c) + '</div>' : '') +
      (t ? '<details' + (it.e === 'lista' ? ' open' : '') + ' style="margin-top:8px"><summary class="pequeno">Leer (' + (it.n || 0) + ' palabras' + (it.f ? ', ' + esc(fechaCorta(it.f)) : '') + ')</summary><div class="hoja inf-lectura">' + mdHtml(t, ctx, { id: s.id, cap: s.cap && capNum > 0 ? capNum : 0, anexos: s.c === 'anexos', pre: s.c === 'pre' }) + '</div></details>' : '<p class="pequeno tenue" style="margin-top:6px">Aún vacía.</p>') +
      (decide && t ? '<div class="fila" style="margin-top:8px"><button class="btn chico" data-a="revInf" data-id="' + esc(s.id) + '" data-d="aprobar"' + (it.e === 'ok' ? ' disabled' : '') + '>' + IC.check + 'Aprobar</button><button class="btn chico" data-a="revInf" data-id="' + esc(s.id) + '" data-d="devolver">Devolver</button></div>' : '') + '</section>';
  });
  n.innerHTML = h;
}
function revInf(id, decision, btn) {
  if (decision === 'devolver' && !$('#rv-com')) {
    S.revInfId = id;
    modal('<h2>Devolver la sección</h2><div class="campo-simple"><label for="rv-com">¿Qué debe corregir?</label><textarea id="rv-com" rows="3"></textarea></div><div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="revInf" data-id="' + esc(id) + '" data-d="devolver">Devolver</button></div>');
    return;
  }
  var fin = ocupar(btn, decision === 'aprobar' ? 'Aprobando' : 'Devolviendo');
  llamar('revisarSeccionInf', { correo: S.alumno.perfil.correo, id: id, decision: decision, comentario: $('#rv-com') ? $('#rv-com').value : '' }).then(function (r) {
    fin(); cerrarModal();
    S.infAlumno.idx = r.idx;
    pintarBorradorAlumno();
    toast(decision === 'aprobar' ? 'Sección aprobada.' : 'Sección devuelta.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}

/** Chip del estado del plan para las tablas del panel y del tablero. */
function chipPlan(pe) {
  if (!pe || !pe.v) return '<span class="chip borde tenue">En elaboración</span>';
  var h = '<span class="chip verde" title="Aprobado el ' + esc(fechaCorta(pe.f)) + '">' + IC.candado + 'Aprobado v' + pe.v + '</span>';
  if (pe.sol === 'pendiente') h += ' <span class="chip ambar">Pide cambio</span>';
  else if (pe.sol === 'abierto') h += ' <span class="chip indigo">Cambio abierto</span>';
  if (pe.inf && pe.inf.total) h += '<div class="pequeno tenue" style="margin-top:3px">Borrador ' + pe.inf.con + '/' + pe.inf.total + (pe.inf.lista ? ' · ' + pe.inf.lista + ' por revisar' : '') + '</div>';
  return h;
}

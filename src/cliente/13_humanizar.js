// ------------------------------------------------------------------ Humanizar: el tesista reescribe con su voz
var NIVEL_HUM = {
  sin: { n: 'Sin textos generados', c: 'gris' },
  semilla: { n: 'Semilla', c: 'gris' },
  brote: { n: 'Brote', c: 'ambar' },
  camino: { n: 'En camino', c: 'cielo' },
  casi: { n: 'Casi listo', c: 'violeta' },
  listo: { n: '¡Listo!', c: 'verde' }
};
var IC_HUM = {
  semilla: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="10" cy="12.5" rx="4.2" ry="5" fill="currentColor" fill-opacity=".18"/><path d="M10 7.5c0-2 1.2-3.6 3-4.2"/></svg>',
  brote: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18v-8"/><path d="M10 11C10 7 7.5 5 4 5c0 3.6 2.4 6 6 6z" fill="currentColor" fill-opacity=".2"/><path d="M10 9c0-3 2-5 5.5-5 0 3.2-2.2 5-5.5 5z" fill="currentColor" fill-opacity=".2"/></svg>',
  camino: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l4-5 3 3 5-8"/><path d="M12.5 6H16v3.5"/></svg>',
  casi: '<svg viewBox="0 0 20 20" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M10 2.5l2.3 4.8 5.2.7-3.8 3.6.9 5.2L10 14.3l-4.6 2.5.9-5.2L2.5 8l5.2-.7z"/></svg>',
  listo: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8v4.5a4 4 0 01-8 0z" fill="currentColor" fill-opacity=".22"/><path d="M6 4.5H3.5a2.5 2.5 0 002.7 3.3M14 4.5h2.5a2.5 2.5 0 01-2.7 3.3M10 11.5V14M7 17h6M8 14h4v3H8z"/></svg>',
  parlante: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8v4h3l4 3.5V4.5L6 8z" fill="currentColor" fill-opacity=".2"/><path d="M13 7.5a3.5 3.5 0 010 5M15.2 5.3a6.5 6.5 0 010 9.4"/></svg>',
  pluma: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5C11 4 6.5 8 5 14l-1.5 2.5"/><path d="M16.5 3.5c-.5 5.5-4.5 9.5-10 10.5"/><path d="M8.5 11.5l-2-2"/></svg>',
  ojo: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1.8 10S5 4.5 10 4.5 18.2 10 18.2 10 15 15.5 10 15.5 1.8 10 1.8 10z"/><circle cx="10" cy="10" r="2.6" fill="currentColor" fill-opacity=".25"/></svg>',
  sello: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="8" r="5.2" fill="currentColor" fill-opacity=".18"/><path d="M7.6 8l1.7 1.7 3.2-3.2M7 12.5L5.5 18l4.5-2 4.5 2-1.5-5.5"/></svg>',
  chispa: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l1.9 5.3 5.6 1.9-5.6 1.9L10 16l-1.9-5.4L2.5 8.7l5.6-1.9z" fill-opacity=".85"/><path d="M15.8 13.3l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/></svg>'
};

/** Insignia del nivel: h = { nivel, listos, generados, pct }. */
function nivelHtml(h, corto) {
  if (!h || !h.nivel || h.nivel === 'sin') return corto ? '<span class="tenue">-</span>' : '<span class="nivel gris">' + IC_HUM.semilla + 'Sin textos generados</span>';
  var nv = NIVEL_HUM[h.nivel];
  var det = h.listos + ' de ' + h.generados + ' textos humanizados (' + h.pct + ' %)';
  return '<span class="nivel ' + nv.c + (h.nivel === 'listo' ? ' brilla' : '') + '" title="' + esc(det) + '" data-tip="' + esc(det) + '">' + (IC_HUM[h.nivel] || '') + esc(nv.n) + (corto ? ' · ' + h.listos + '/' + h.generados : '') + '</span>';
}

/** Estado de un campo para el estudiante (o el expediente que se revisa). */
function humCampo(h, clave) { return h ? h.campos.filter(function (c) { return c.campo === clave; })[0] : null; }
function humChipHtml(c) {
  if (!c) return '';
  if (c.noAplica && c.estado !== 'listo') return '<span class="hum-chip noaplica" title="Es posible que este ítem de tu tesis no aplique según el Reglamento de Similitud y Originalidad (Art. 12): ' + (c.noAplica === 'anexo' ? 'va en los anexos, que se excluyen del análisis' : 'no forma parte del documento que se somete al análisis') + '. Humanizarlo igual te ayuda a defenderlo.">' + IC_HUM.pluma + 'Puede no aplicar</span>';
  if (c.estado === 'listo' && c.propio) return '<span class="hum-chip listo propio" title="El estudiante declaró que es texto propio y lo pegó de su documento (' + c.coincidencia + ' % de frases repetidas con el origen)">' + IC.check + 'Humanizado · texto propio</span>';
  if (c.estado === 'listo') return '<span class="hum-chip listo" title="Reescrito con sus palabras: ' + c.coincidencia + ' % de frases repetidas">' + IC.check + 'Humanizado</span>';
  if (c.estado === 'parcial') return '<span class="hum-chip parcial" title="Guardado antes de completar los chequeos (' + c.coincidencia + ' % de frases repetidas)">' + IC_HUM.pluma + 'Humanizado en parte</span>';
  if (c.borrador && c.estado !== 'listo') return '<span class="hum-chip pendiente" title="Tiene un avance guardado sin terminar">' + IC_HUM.pluma + 'Avance guardado</span>';
  if (c.estado === 'cambiado') return '<span class="hum-chip cambiado" title="Después de humanizarlo volvió a parecerse al texto de origen (' + c.coincidencia + ' %)">' + IC.alerta + 'Revisar humanización</span>';
  return '<span class="hum-chip pendiente" title="Texto ' + (c.de === 'ia' ? 'propuesto por la IA' : 'del borrador generado') + ': ' + c.coincidencia + ' % igual al origen">' + IC_HUM.chispa + 'Por humanizar</span>';
}
function esHumanizable(c) { return c && (c.tipo === 'parrafo' || c.tipo === 'texto'); }
function botonHumanizar(c) {
  if (!esHumanizable(c)) return '';
  var st = humCampo(S.d && S.d.humanizacion, c.clave);
  return '<button class="btn chico humanizar' + (st && st.estado === 'listo' ? ' hecho' : '') + '" data-a="humanizar" data-campo="' + esc(c.clave) + '" title="Reescribe este texto con tus propias palabras">' + IC_HUM.pluma + (st && st.estado === 'listo' ? 'Humanizado' : 'Humanizar') + '</button>';
}

/** Tarjeta lúdica de progreso para el estudiante. */
function tarjetaHumHtml() {
  var h = S.d && S.d.humanizacion;
  if (!h || !h.generados) return '';
  var sig = siguienteHum(h);
  var pasos = h.campos.map(function (c) { return '<i class="' + c.estado + '" title="' + esc(c.etiqueta) + '"></i>'; }).join('');
  return '<div class="tarjeta hum-tarjeta" id="tarjeta-hum"><div class="fila entre"><div class="fila" style="gap:10px"><span class="hum-medalla ' + NIVEL_HUM[h.nivel].c + '">' + (IC_HUM[h.nivel] || IC_HUM.semilla) + '</span><div><b>Humaniza tu tesis</b><div class="pequeno tenue">Nivel <b>' + esc(NIVEL_HUM[h.nivel].n) + '</b> · ' + h.xp + ' XP de escritura propia</div></div></div>' +
    (sig ? '<button class="btn primario chico" data-a="humanizar" data-campo="' + esc(sig.campo) + '">' + IC_HUM.pluma + 'Humanizar «' + esc(sig.etiqueta.length > 28 ? sig.etiqueta.substring(0, 26) + '…' : sig.etiqueta) + '»</button>' : '<span class="nivel verde brilla">' + IC_HUM.listo + '¡Todo humanizado!</span>') + '</div>' +
    '<div class="hum-pasos-barra" aria-label="' + h.listos + ' de ' + h.generados + ' textos humanizados">' + pasos + '</div><div class="pequeno tenue" style="margin-top:6px">' + h.listos + ' de ' + h.generados + ' textos generados ya están escritos con tus palabras. Cada texto que humanizas suma XP.</div></div>';
}

// ------------------------------------------------------------------ comparación en el navegador (igual que el servidor)
function palabrasHum(t) {
  return sinTildes(String(t || '').toLowerCase()).replace(/\[@[^\]]*\]/g, ' ').replace(/[^a-z0-9ñ]+/g, ' ').trim().split(/\s+/).filter(function (w) { return w; });
}
function tejasHum(t) { var w = palabrasHum(t), o = {}; for (var i = 0; i + 4 <= w.length; i++) o[w.slice(i, i + 4).join(' ')] = 1; return o; }
function coincidenciaHum(a, b) { var A = tejasHum(a), B = tejasHum(b), n = 0, c = 0, k; for (k in A) { if (A.hasOwnProperty(k)) { n++; if (B[k]) c++; } } return n ? Math.round(100 * c / n) : 0; }
function citasHum(t) { var o = {}, m, re = /\[@([^\]\s;,]+)/g; t = String(t || ''); while ((m = re.exec(t)) !== null) o[m[1]] = 1; return Object.keys(o); }
function origenesHum(clave) {
  var e = S.exp, l = [];
  if (e[clave]) l.push(String(e[clave]));
  if (e['_orig_' + clave]) l.push(String(e['_orig_' + clave]));
  try { (e['_ia_' + clave] ? JSON.parse(e['_ia_' + clave]) : []).forEach(function (p) { if (p && p.t) l.push(p.t); }); } catch (x) { /* sin propuestas */ }
  return l;
}

// ------------------------------------------------------------------ la ventana de escritura
function abrirHumanizar(clave) {
  var c = campoDe(clave);
  if (!esHumanizable(c)) return;
  guardarAhora().catch(function () {}).then(function () {
    var ref = String(S.exp[clave] || '');
    if (palabrasHum(ref).length < 8 && !S.exp['_orig_' + clave]) { toast('Primero escribe o genera un texto en este campo; luego lo humanizas.'); return; }
    var origenes = origenesHum(clave);
    var largo = Math.max.apply(null, origenes.map(function (t) { return palabrasHum(t).length; }).concat([0]));
    var min = Math.max(8, Math.floor(0.6 * largo));
    var citas = citasHum(ref);
    var borr = null;
    try { borr = S.exp['_humb_' + clave] ? JSON.parse(S.exp['_humb_' + clave]) : null; } catch (x) { borr = null; }
    S.hum = { clave: clave, origenes: origenes, min: min, citas: citas, teclas: borr ? (parseInt(borr.k, 10) || 0) : 0, intentos: 0, pegados: 0, propio: false, inicio: Date.now() };
    modal('<div class="hum">' +
      '<div class="hum-cab"><span class="hum-medalla violeta">' + IC_HUM.pluma + '</span><div><h2 style="margin:0">Humaniza: ' + esc(etiquetaDe(c)) + '</h2><p class="pequeno tenue" style="margin:2px 0 0">Lee la idea, ciérrala y escríbela con tu propia voz. Aquí no se puede pegar: cada palabra cuenta.</p></div></div>' +
      '<ol class="hum-ruta"><li class="hecho"><b>1</b>Lee y entiende</li><li id="hr-2"><b>2</b>Escribe con tus palabras</li><li id="hr-3"><b>3</b>Verifica y guarda</li></ol>' +
      '<div class="hum-grid"><div class="hum-ref" id="hum-ref"><div class="fila entre"><b class="pequeno">Texto de referencia</b><span class="fila" style="gap:10px">' + (vozDisponible() ? '<button class="enlace pequeno hum-voz-btn" type="button" id="hum-escuchar" data-que="ref">' + IC_HUM.parlante + 'Escuchar</button>' : '') + '<button class="enlace pequeno" type="button" id="hum-ocultar">Ocultar</button></span></div><div class="hum-ref-t" id="hum-ref-t">' + esc(ref || S.exp['_orig_' + clave] || '') + '</div>' +
      (citas.length ? '<p class="pequeno" style="margin-top:8px">Conserva estas citas: ' + citas.map(function (k) { return '<span class="mono chip borde">[@' + esc(k) + ']</span>'; }).join(' ') + '</p>' : '') + '</div>' +
      '<div class="hum-esc"><textarea id="hum-t" rows="9" placeholder="Escribe aquí, con tus palabras, lo que entendiste…" spellcheck="true">' + (borr ? esc(borr.t) : '') + '</textarea>' + (borr ? '<p class="pequeno" style="margin:4px 0 0;color:var(--violeta)">Retomas tu avance guardado el ' + esc(fechaCorta(borr.f)) + '.</p>' : '') + '' +
      '<div class="hum-medidor"><div class="fila entre pequeno"><span>Tu voz</span><b id="hum-voz">0 %</b></div><div class="hum-barra"><i id="hum-voz-b" style="width:0"></i></div></div>' +
      '<div id="hum-propio" class="aviso ambar pequeno" style="margin:8px 0 0" hidden></div>' +
      (vozDisponible() ? '<div style="margin-top:6px"><button class="enlace pequeno hum-voz-btn" type="button" id="hum-escuchar2" data-que="mio">' + IC_HUM.parlante + 'Escuchar lo que escribí</button></div>' : '') +
      '<ul class="hum-checks" id="hum-checks"></ul></div></div>' +
      '<div class="fila entre" style="margin-top:14px"><span class="pequeno tenue" id="hum-xp">Escribe al menos ' + min + ' palabras.</span><div class="fila"><button class="btn" type="button" data-a="cerrarModal">Cancelar</button><button class="btn" type="button" id="hum-avance" title="Guarda lo que llevas escrito sin cambiar tu tesis; lo retomas después">Guardar avance</button><button class="btn primario" type="button" id="hum-guardar" disabled>' + IC.check + 'Verificar y guardar</button></div></div>' +
      '<div id="hum-alerta" class="aviso ambar" style="margin-top:12px" hidden></div></div>', true);
    var t = $('#hum-t'), refT = $('#hum-ref-t');
    ['copy', 'cut', 'contextmenu', 'dragstart'].forEach(function (ev) { refT.addEventListener(ev, function (e) { e.preventDefault(); }); });
    ['paste', 'drop'].forEach(function (ev) {
      t.addEventListener(ev, function (e) {
        if (S.hum.propio) { S.hum.pegados++; return; }
        e.preventDefault(); S.hum.intentos++; t.classList.remove('sacude'); void t.offsetWidth; t.classList.add('sacude');
        if (S.hum.intentos >= 2) mostrarPropio(); else toast('Aquí se escribe a mano: pegar no está permitido.');
      });
    });
    t.addEventListener('input', function (e) {
      var tipo = e.inputType || 'insertText';
      if (/^insertFrom(Paste|Drop)/.test(tipo)) { revisarHum(); return; }
      S.hum.teclas++;
      revisarHum();
    });
    $$('.hum-voz-btn').forEach(function (bt) { bt.addEventListener('click', function () { leerEnVoz(this.getAttribute('data-que') === 'ref' ? (S.exp[clave] || S.exp['_orig_' + clave] || '') : ($('#hum-t') ? $('#hum-t').value : ''), this); }); });
    $('#hum-ocultar').addEventListener('click', function () { var r = $('#hum-ref'); r.classList.toggle('oculto'); this.textContent = r.classList.contains('oculto') ? 'Mostrar' : 'Ocultar'; });
    $('#hum-guardar').addEventListener('click', function () { if (S.hum && S.hum.todo) guardarHumanizado(this, 'final'); else alertaHum(); });
    $('#hum-avance').addEventListener('click', function () { guardarHumanizado(this, 'avance'); });
    revisarHum();
    setTimeout(function () { t.focus(); }, 60);
  });
}

function revisarHum() {
  var h = S.hum, t = $('#hum-t');
  if (!h || !t) return;
  var txt = t.value, pal = palabrasHum(txt).length;
  var coinc = 0;
  h.origenes.forEach(function (o) { coinc = Math.max(coinc, coincidenciaHum(txt, o)); });
  var faltan = h.citas.filter(function (k) { return citasHum(txt).indexOf(k) < 0; });
  var tecleo = h.propio ? true : h.teclas >= Math.floor(0.3 * txt.length);
  var checks = [
    { ok: pal >= h.min, t: 'Extensión suficiente', d: pal + ' de ' + h.min + ' palabras' },
    { ok: pal >= 8 && coinc <= 25, t: 'Con tus propias palabras', d: pal < 8 ? 'aún sin texto' : coinc + ' % de frases repetidas (máximo 25 %)' },
    { ok: !faltan.length, t: 'Citas conservadas', d: faltan.length ? 'falta ' + faltan.map(function (k) { return '[@' + k + ']'; }).join(', ') : (h.citas.length ? 'todas presentes' : 'no tiene citas') },
    h.propio ? { ok: pal > 0, t: 'Texto propio declarado', d: 'pegado de tu documento' + (h.pegados ? ' (' + h.pegados + (h.pegados === 1 ? ' vez)' : ' veces)') : '') } : { ok: tecleo && pal > 0, t: 'Escrito a mano', d: h.teclas + ' pulsaciones' + (h.intentos ? ' · ' + h.intentos + ' intento(s) de pegar bloqueados' : '') }
  ];
  $('#hum-checks').innerHTML = checks.map(function (c) { return '<li class="' + (c.ok ? 'ok' : '') + '"><span class="hum-ic">' + (c.ok ? IC.check : '') + '</span><span><b>' + c.t + '</b><small>' + esc(c.d) + '</small></span></li>'; }).join('');
  var voz = pal < 8 ? 0 : Math.max(0, 100 - coinc);
  var avance = Math.min(1, pal / Math.max(1, h.min));
  var puntaje = Math.round(voz * avance);
  $('#hum-voz').textContent = puntaje + ' %';
  var b = $('#hum-voz-b');
  b.style.width = puntaje + '%';
  b.className = puntaje >= 75 ? 'verde' : (puntaje >= 40 ? 'ambar' : 'rojo');
  var todo = checks.every(function (c) { return c.ok; });
  // El boton se desbloquea desde 25 % de voz propia (escrito a mano); si aun falta algo, avisa antes de guardar
  var habil = todo || (puntaje >= 25 && tecleo && pal >= 8);
  h.todo = todo; h.puntaje = puntaje; h.faltan = checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.t.toLowerCase() + ' (' + c.d + ')'; }); h.pal = pal;
  var bg = $('#hum-guardar');
  bg.disabled = !habil;
  bg.classList.toggle('primario', todo || !habil);
  bg.classList.toggle('ambar', habil && !todo);
  if (!habil || todo) { var al = $('#hum-alerta'); if (al) al.hidden = true; }
  var r2 = $('#hr-2'), r3 = $('#hr-3');
  if (r2) r2.classList.toggle('hecho', pal >= h.min);
  if (r3) r3.classList.toggle('hecho', todo);
  $('#hum-xp').innerHTML = todo ? '<b style="color:var(--verde)">¡Listo para guardar! Ganarás ' + pal + ' XP.</b>' : (habil ? '<b style="color:var(--ambar)">Ya puedes guardar, pero aún no está completo.</b>' : 'Llega al 25 % de «Tu voz» para poder guardar.');
}

/** Aviso antes de guardar un texto que aún no cumple todo. */
function alertaHum() {
  var h = S.hum, al = $('#hum-alerta');
  if (!h || !al) return;
  var actual = palabrasHum(S.exp[h.clave]).length;
  al.innerHTML = '<b>' + IC.alerta + ' Todavía no está listo.</b> Falta: ' + esc(h.faltan.join('; ')) + '.' +
    '<p style="margin:6px 0 0">Si lo guardas igual, <b>reemplazará el texto actual de tu tesis</b>' + (actual > h.pal ? ' (' + actual + ' palabras) por tus ' + h.pal + ' palabras' : '') + ' y quedará como <b>«humanizado en parte»</b>: no suma XP ni sube tu nivel hasta que lo completes. Si prefieres, guarda tu avance y termínalo después.</p>' +
    '<div class="fila" style="margin-top:10px"><button class="btn chico" type="button" id="hum-seguir">Seguir escribiendo</button><button class="btn chico" type="button" id="hum-avance2">Guardar avance (no cambia mi tesis)</button><button class="btn chico ambar" type="button" id="hum-forzar">Guardar igual en mi tesis</button></div>';
  al.hidden = false;
  $('#hum-seguir').addEventListener('click', function () { al.hidden = true; var t = $('#hum-t'); if (t) t.focus(); });
  $('#hum-avance2').addEventListener('click', function () { guardarHumanizado(this, 'avance'); });
  $('#hum-forzar').addEventListener('click', function () { guardarHumanizado(this, 'forzar'); });
  al.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function guardarHumanizado(btn, modo) {
  var h = S.hum, t = $('#hum-t');
  if (!h || !t) return;
  modo = modo || 'final';
  if (modo === 'avance' && !t.value.trim()) { toast('Escribe algo antes de guardar tu avance.'); return; }
  var fin = ocupar(btn, modo === 'avance' ? 'Guardando' : 'Verificando');
  llamar('humanizar', { campo: h.clave, texto: t.value, modo: modo, stats: { teclas: h.teclas, pegados: h.pegados, propio: h.propio, intentos: h.intentos, segundos: Math.round((Date.now() - h.inicio) / 1000) } }).then(function (r) {
    fin();
    if (r.modo === 'avance') {
      S.exp = r.expediente; S.d.expediente = r.expediente; S.d.humanizacion = r.humanizacion;
      S.hum = null; cerrarModal();
      toast('Avance guardado. Tu tesis no cambió: retómalo cuando quieras con «Humanizar».', 'bien');
      return;
    }
    if (r.parcial) {
      S.exp = r.expediente; S.d.expediente = r.expediente; S.d.humanizacion = r.humanizacion;
      if (r.avance) S.d.avance = r.avance;
      if (r.vista) S.vistaDoc = r.vista;
      S.hum = null; cerrarModal();
      toast('Guardado como «humanizado en parte» (tu voz: ' + r.puntaje + ' %). Complétalo para sumar XP.', 'bien');
      cerrarHum();
      return;
    }
    var antes = S.d.humanizacion ? S.d.humanizacion.nivel : '';
    S.exp = r.expediente; S.d.expediente = r.expediente; S.d.humanizacion = r.humanizacion;
    if (r.avance) S.d.avance = r.avance;
    if (r.vista) S.vistaDoc = r.vista;
    var hz = r.humanizacion, nv = NIVEL_HUM[hz.nivel], sube = antes && antes !== hz.nivel;
    S.hum = null;
    modal('<div class="hum-fiesta">' + confeti() + '<span class="hum-medalla grande ' + nv.c + '">' + (IC_HUM[hz.nivel] || IC_HUM.listo) + '</span><h2>¡Texto humanizado!</h2><p class="xp">+' + r.xp + ' XP</p>' +
      '<p class="tenue">' + (sube ? 'Subiste al nivel <b>' + esc(nv.n) + '</b>. ' : 'Nivel <b>' + esc(nv.n) + '</b>. ') + 'Llevas ' + hz.listos + ' de ' + hz.generados + ' textos con tu voz (' + r.coincidencia + ' % de frases repetidas en este).</p>' +
      '<div class="hum-pasos-barra" style="margin:14px 0">' + hz.campos.map(function (c) { return '<i class="' + c.estado + '"></i>'; }).join('') + '</div>' +
      '<div class="fila" style="justify-content:center">' + (siguienteHum(hz) ? '<button class="btn primario" data-a="humanizarSiguiente">' + IC_HUM.pluma + 'Humanizar el siguiente</button>' : '') + '<button class="btn" data-a="cerrarHum">Seguir</button></div></div>');
  }).catch(function (e) { fin(); fallo(e); });
}
function confeti() {
  var cols = ['#5B4FE8', '#0F9D8A', '#D9822B', '#E04F86', '#F5C542', '#2B8FD9'], s = '';
  for (var i = 0; i < 26; i++) s += '<i style="left:' + Math.round(Math.random() * 100) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's;transform:rotate(' + Math.round(Math.random() * 360) + 'deg)"></i>';
  return '<div class="confeti" aria-hidden="true">' + s + '</div>';
}
function cerrarHum() { cerrarModal(); var y = window.scrollY; ir(S.vista, S.vista === 'etapa' ? S.etapa : '').then(function () { window.scrollTo(0, y); }); }
/** El siguiente campo por humanizar: primero los que están a la vista en la pantalla actual. */
function siguienteHum(h) {
  var pend = (h ? h.campos : []).filter(function (c) { return c.estado !== 'listo' && !c.noAplica; });
  var visibles = pend.filter(function (c) {
    if (S.vista === 'tesis') return preguntasSencillas().some(function (f) { return f.campo === c.campo; });
    if (S.vista === 'etapa') return c.etapa === S.etapa;
    return false;
  });
  return visibles[0] || pend[0];
}
function humanizarSiguiente() {
  var sig = siguienteHum(S.d.humanizacion);
  cerrarModal();
  if (sig) abrirHumanizar(sig.campo);
}

// ------------------------------------------------------------------ vistas del asesor, coordinador y administrador
/** Tarjeta con el estado de humanización de un expediente que se revisa. */
function humRevisionHtml(a) {
  var h = a.humanizacion;
  if (!h || !h.generados) return '<div class="tarjeta plana" style="margin-bottom:16px"><h3>Humanización</h3><p class="tenue">Este expediente no tiene textos generados por la IA ni borrador precargado.</p></div>';
  var orden = { cambiado: 0, parcial: 1, pendiente: 2, listo: 3 };
  var l = h.campos.slice().sort(function (x, y) { return orden[x.estado] - orden[y.estado]; });
  return '<div class="tarjeta plana hum-rev" style="margin-bottom:16px"><div class="fila entre"><h3 style="margin:0">' + IC_HUM.pluma.replace('<svg', '<svg class="foco-ic"') + ' Humanización</h3>' + nivelHtml(h) + '</div>' +
    '<div class="hum-pasos-barra" style="margin:10px 0 6px">' + h.campos.map(function (c) { return '<i class="' + c.estado + '" title="' + esc(c.etiqueta) + '"></i>'; }).join('') + '</div>' +
    '<p class="pequeno tenue">' + h.listos + ' de ' + h.generados + ' textos generados (borrador o IA) reescritos y verificados · ' + h.palabrasIA + ' palabras generadas, ' + h.palabrasHumanas + ' escritas a mano. Verificado: frases repetidas ' + h.umbral + ' % o menos, extensión suficiente, citas conservadas y escritura sin pegar.</p>' +
    '<div class="pila" style="gap:4px;margin-top:8px">' + l.map(function (c) { return '<div class="dato"><span>' + esc(c.etiqueta) + '<span class="pequeno tenue"> · ' + (c.de === 'ia' ? 'propuesta de la IA' : 'borrador') + ' · ' + c.coincidencia + ' % igual</span></span>' + humChipHtml(c) + '</div>'; }).join('') + '</div></div>';
}

// ------------------------------------------------------------------ lectura en voz alta y texto propio
function vozDisponible() { return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined'; }
/** Lee un texto en voz alta (voz en español si el navegador tiene una). Un segundo clic detiene la lectura. */
function leerEnVoz(texto, btn) {
  if (!vozDisponible()) { toast('Tu navegador no tiene lectura en voz alta.'); return; }
  var sy = window.speechSynthesis;
  if (sy.speaking) { sy.cancel(); $$('.hum-voz-btn').forEach(function (b) { b.classList.remove('activo'); }); return; }
  var limpio = String(texto || '').replace(/\[@[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  if (!limpio) { toast('Aún no hay texto para leer.'); return; }
  var u = new window.SpeechSynthesisUtterance(limpio);
  u.lang = 'es-PE';
  var voces = sy.getVoices ? sy.getVoices() : [];
  var v = voces.filter(function (x) { return /^es[-_](PE|419|MX|US|CO|AR|CL)/i.test(x.lang); })[0] || voces.filter(function (x) { return /^es/i.test(x.lang); })[0];
  if (v) u.voice = v;
  u.rate = 0.95;
  if (btn) btn.classList.add('activo');
  u.onend = u.onerror = function () { if (btn) btn.classList.remove('activo'); };
  sy.speak(u);
}
function callarVoz() { try { if (vozDisponible()) window.speechSynthesis.cancel(); } catch (e) { /* sin voz */ } }

/** Tras dos intentos de pegar: opcion de declarar que el texto es propio, con advertencia. */
function mostrarPropio() {
  var box = $('#hum-propio');
  if (!box || !box.hidden) return;
  box.innerHTML = '<label style="display:flex;flex-wrap:nowrap;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="hum-propio-ok" style="width:18px;height:18px;flex:0 0 auto;margin:2px 0 0"><span><b>Este texto ya lo escribí yo</b> en mi documento y quiero pegarlo.</span></label>' +
    '<p style="margin:6px 0 0">Declararlo queda registrado y tu asesor lo verá. Aun así, <b>te recomendamos humanizarlo escribiéndolo aquí</b>: al redactarlo de nuevo con tus palabras lo entiendes a fondo y podrás defender tu tesis ante el jurado. Si lo pegas, debe ser distinto del borrador de la IA (25 % de frases repetidas como máximo).</p>';
  box.hidden = false;
  $('#hum-propio-ok').addEventListener('change', function () {
    S.hum.propio = this.checked;
    toast(this.checked ? 'Pegar activado para texto propio. Recuerda: humanizarlo te prepara para la sustentación.' : 'Pegar desactivado.', this.checked ? 'bien' : '');
    revisarHum();
  });
}

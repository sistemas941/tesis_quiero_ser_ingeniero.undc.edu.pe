// ------------------------------------------------------------------ estado y utilidades
var S = {
  token: '', perfil: null, info: null, d: null, exp: {}, tablas: {},
  vista: '', etapa: '', pend: {}, reloj: null, guardando: null, foco: null,
  ia: null, propuestas: {}, panel: null, alumno: null, admin: null, tablero: null, tabOrden: null, busqueda: null, abiertos: {}, plan: null, pestana: 'buscar',
  via: '', claveIA: '', copia: null, orienta: {},
  modo: '', vistaDoc: null, escudo: ''
};

var IC = {
  subir: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V2.5M4.5 6 8 2.5 11.5 6M2.5 10.5v2.2c0 .5.4.8.8.8h9.4c.4 0 .8-.3.8-.8v-2.2"/></svg>',
  engrane: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/><circle cx="8" cy="8" r="4.6"/></svg>',
  grupo: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5.5" r="2.2"/><path d="M1.8 13.2c.4-2.3 2.1-3.7 4.2-3.7s3.8 1.4 4.2 3.7"/><circle cx="11.4" cy="6.2" r="1.7"/><path d="M11 9.6c1.7 0 3 1.1 3.3 3"/></svg>',
  pluma: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.8 2.7l2.5 2.5-7.6 7.6-3.3.8.8-3.3z"/><path d="M9.3 4.2l2.5 2.5"/></svg>',
  rejilla: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M2 6.2h12M2 9.8h12M6.2 2.5v11M10 2.5v11"/></svg>',
  ruta: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.5" cy="12.5" r="1.6"/><circle cx="12.5" cy="3.5" r="1.6"/><path d="M5 12.5h4.5a2.5 2.5 0 0 0 0-5h-3a2.5 2.5 0 0 1 0-5H11"/></svg>',
  brujulaN: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M10.4 5.6 9 9 5.6 10.4 7 7z"/></svg>',
  rubrica: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 4h7M5.5 8h7M5.5 12h7"/><path d="M2.5 4l.6.6 1-1.2M2.5 8l.6.6 1-1.2M2.5 12l.6.6 1-1.2"/></svg>',
  plan: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2.5" width="10" height="11.5" rx="1.4"/><path d="M6 2.5V1.6h4v.9M5.6 7h4.8M5.6 10h3"/></svg>',
  guia: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M6.4 6.3a1.7 1.7 0 1 1 2.3 1.6c-.5.2-.7.6-.7 1.1v.4M8 11.3v.1"/></svg>',
  trofeo: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5h6v3.2a3 3 0 0 1-6 0zM5 3.7H2.8c0 1.8 1 2.8 2.4 3M11 3.7h2.2c0 1.8-1 2.8-2.4 3M8 8.7v2.5M5.6 13.5h4.8M6.4 11.2h3.2v2.3H6.4z"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 5"/></svg>',
  reloj: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.6V8l2.3 1.6"/></svg>',
  candado: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.2" y="7" width="9.6" height="6.6" rx="1.6"/><path d="M5.3 7V5.2a2.7 2.7 0 015.4 0V7"/></svg>',
  alerta: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.2l6.2 11H1.8z"/><path d="M8 6.6v3.2M8 11.7v.1"/></svg>',
  equis: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  chispa: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 4.2L14 6.6l-4.2 1.6L8 12.6 6.3 8.2 2 6.6l4.5-1.4z"/><path d="M12.6 10.6l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z"/></svg>',
  libro: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M2.5 3h4.2A1.8 1.8 0 018 4.4 1.8 1.8 0 019.3 3h4.2v9.5H9.3A1.5 1.5 0 008 13.6a1.5 1.5 0 00-1.3-1.1H2.5z"/><path d="M8 4.4v9"/></svg>',
  flecha: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  mas: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  doc: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="M4 1.8h5.2L12.5 5v9.2H4z"/><path d="M9 1.8V5h3.5M6 8.2h4.5M6 10.8h4.5"/></svg>',
  brujula: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="M10.6 5.4L9.2 9.2 5.4 10.6l1.4-3.8z"/></svg>',
  copiar: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8.5" rx="1.6"/><path d="M10.5 5.5V3.6A1.6 1.6 0 008.9 2H4.1a1.6 1.6 0 00-1.6 1.6v5.8A1.6 1.6 0 004.1 11h1.4"/></svg>',
  llave: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.4" cy="10.6" r="3"/><path d="M7.6 8.4L13.6 2.4M11.2 4.8l1.9 1.9M9.5 6.5l1.5 1.5"/></svg>',
  afuera: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2.5h4v4M13.5 2.5L7.5 8.5M11.5 9.5v3a1 1 0 01-1 1h-7a1 1 0 01-1-1v-7a1 1 0 011-1h3"/></svg>',
  birrete: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M10 3.5L1.8 7.6 10 11.7l8.2-4.1z"/><path d="M5 9.4v3.7c1.3 1.2 3 1.9 5 1.9s3.7-.7 5-1.9V9.4M18.2 7.6v4.6"/></svg>'
};

/** Coordinador, asistente y administrador ven a todos los estudiantes. */
function esGlobal() { var r = S.perfil ? S.perfil.rol : ''; return r === 'admin' || r === 'coordinador' || r === 'asistente'; }
/** Solo el asesor y el administrador aprueban o devuelven etapas y secciones. */
function puedeDecidir() { var r = S.perfil ? S.perfil.rol : ''; return r === 'asesor' || r === 'admin'; }
/** El coordinador tambien puede dejar comentarios; el asistente no. */
function puedeComentar() { var r = S.perfil ? S.perfil.rol : ''; return r === 'asesor' || r === 'admin'; }
/** Reiniciar claves: asesor (sus estudiantes), administrador y asistente. El coordinador solo mira. */
function puedeReiniciar() { var r = S.perfil ? S.perfil.rol : ''; return r !== 'coordinador'; }
// Foco de reelaboración: cuánto del texto propuesto por la IA reescribió el estudiante con sus palabras
var FOCO_TXT = { verde: 'Texto reelaborado', ambar: 'Reelaboración parcial', rojo: 'Casi igual a la IA' };
function focoSvg() { return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.6 10.6C4.4 9.7 3.7 8.4 3.7 7a4.3 4.3 0 018.6 0c0 1.4-.7 2.7-1.9 3.6v1.6H5.6z" class="foco-luz"/><path d="M6.2 14h3.6"/></svg>'; }
/** r = { foco, reelaborados, parciales, iguales, total }. corto: solo el foco con su cuenta. */
function focoHtml(r, corto) {
  if (!r || !r.foco) return corto ? '<span class="tenue" title="La IA no le propuso redacciones">-</span>' : '<span class="foco apagado">' + focoSvg() + 'Sin textos de la IA</span>';
  var det = r.reelaborados + ' de ' + r.total + ' textos de la IA reelaborados' + (r.parciales ? ', ' + r.parciales + ' en parte' : '') + (r.iguales ? ', ' + r.iguales + ' casi iguales' : '');
  return '<span class="foco ' + r.foco + '" title="' + esc(det) + '" data-tip="' + esc(det) + '">' + focoSvg() + (corto ? r.reelaborados + '/' + r.total : esc(FOCO_TXT[r.foco])) + '</span>';
}
/** Foco de un campo: c = { estado, coincidencia }. */
function focoCampoHtml(c) {
  if (!c) return '';
  var col = { reelaborado: 'verde', parcial: 'ambar', igual: 'rojo', sin_texto: 'apagado' }[c.estado];
  var txt = c.estado === 'sin_texto' ? 'Aún sin texto' : (c.estado === 'reelaborado' ? 'Reelaborado' : (c.estado === 'parcial' ? 'Reelaborado en parte' : 'Casi igual a la IA'));
  var det = c.estado === 'sin_texto' ? 'La IA propuso un texto, pero el campo aún está vacío' : c.coincidencia + ' % del texto actual coincide con la propuesta de la IA';
  return '<span class="foco ' + col + '" title="' + esc(det) + '" data-tip="' + esc(det) + '">' + focoSvg() + txt + (c.estado === 'sin_texto' ? '' : ' · ' + c.coincidencia + ' %') + '</span>';
}
function esc(s) {
  return String(s === null || s === undefined ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function $(sel, raiz) { return (raiz || document).querySelector(sel); }
function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
function sinTildes(s) {
  var de = 'áéíóúüñÁÉÍÓÚÜÑ', a = 'aeiouunAEIOUUN', r = '';
  s = String(s || '');
  for (var i = 0; i < s.length; i++) { var k = de.indexOf(s.charAt(i)); r += k >= 0 ? a.charAt(k) : s.charAt(i); }
  return r;
}
/** Solo se enlazan direcciones http o https. */
function enlace(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) || /^\/(doc|archivo)\/[A-Za-z0-9_.-]+$/.test(u) ? u : ''; }

// ------------------------------------------------------------------ version 1 (Google) o version 2 (servidor propio)
// En el servidor propio, la pagina define window.QSI_SERVIDOR y los documentos se sirven desde el mismo sitio.
var SERVIDOR = !!(typeof window !== 'undefined' && window.QSI_SERVIDOR);
/** Enlace a un documento generado. tipo: 'docx', 'pdf' o 'ver'. */
function urlDoc(id, tipo) {
  id = encodeURIComponent(String(id || ''));
  if (SERVIDOR) return '/doc/' + id + (tipo === 'docx' ? '.docx' : '.pdf');
  return 'https://docs.google.com/document/d/' + id + (tipo === 'ver' ? '/edit' : '/export?format=' + tipo);
}
/** Identificador del documento a partir de su enlace (de Google Docs o del servidor propio). */
function idDoc(url) {
  var u = String(url || ''), m = /\/d\/([A-Za-z0-9_-]+)/.exec(u) || /\/doc\/([A-Za-z0-9_-]+)/.exec(u);
  return m ? m[1] : '';
}
var DOCS = SERVIDOR ? 'Word' : 'Google Docs';
var TXT_ABRIR_DOC = SERVIDOR ? 'Ver en PDF' : 'Abrir en Google Docs';
function palabras(s) { s = String(s || '').trim(); return s ? s.split(/\s+/).length : 0; }
function fechaCorta(f) {
  var m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?/.exec(String(f || ''));
  if (!m) return '';
  var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return parseInt(m[3], 10) + ' ' + meses[parseInt(m[2], 10) - 1] + ' ' + m[1] + (m[4] ? ', ' + m[4] + ':' + m[5] : '');
}
/** Texto con las citas [@clave] y las marcas [por completar: ...] resaltadas. */
function conMarcas(s) {
  return esc(s).replace(/\[@([A-Za-z0-9_\-]+)\]/g, '<span class="cita">[@$1]</span>').replace(/\[por completar[^\]]*\]/g, function (m) { return '<span class="marca-pc">' + m + '</span>'; });
}

// ------------------------------------------------------------------ servidor
var SOLO_LECTURA = { vista: 1, vistaDe: 1, escudo: 1, yo: 1, estado: 1, panel: 1, tablero: 1, verEstudiante: 1, adminEstado: 1, iaConsulta: 1, info: 1 };
function llamar(nombre, args) {
  // Cualquier accion que cambia datos deja la pagina armada como pendiente de rehacer
  if (!SOLO_LECTURA[nombre]) S.vistaSucia = true;
  return new Promise(function (resolver, rechazar) {
    google.script.run
      .withSuccessHandler(function (r) {
        if (r && r.ok) { resolver(r.data); return; }
        if (r && r.error === 'SESION') { salir(true); }
        if (r && r.error === 'CAMBIAR' && nombre !== 'cambiarClave') { verCambioClave(''); }
        rechazar(new Error(r && r.mensaje ? r.mensaje : 'El servidor no respondió.'));
      })
      .withFailureHandler(function (e) { rechazar(new Error(e && e.message ? e.message : String(e))); })
      .api(nombre, S.token, args || {});
  });
}

// ------------------------------------------------------------------ avisos, ventana y botones ocupados
function toast(texto, tipo) {
  var t = document.createElement('div');
  t.className = 'toast' + (tipo ? ' ' + tipo : '');
  t.setAttribute('role', 'status');
  t.textContent = texto;
  var caja = $('#toasts');
  while (caja.children.length >= 3) caja.removeChild(caja.firstChild);
  caja.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, tipo === 'error' ? 8000 : 4500);
}
function fallo(e) { toast(e && e.message ? e.message : String(e), 'error'); }
function modal(html, ancha) {
  var m = $('#modal');
  m.innerHTML = '<div class="caja' + (ancha ? ' ancha' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
  m.hidden = false;
  var primero = $('input, textarea, select, button', m);
  if (primero) primero.focus();
}
function cerrarModal() { if (typeof callarVoz === 'function') callarVoz(); var m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
/** Deshabilita un boton mientras dura una tarea. Devuelve la funcion que lo restaura. */
function ocupar(btn, texto) {
  if (!btn) return function () {};
  var antes = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="giro"></span>' + esc(texto || 'Un momento');
  return function () { btn.disabled = false; btn.innerHTML = antes; };
}
function crecer(t) { if (t && t.tagName === 'TEXTAREA') { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; } }
function crecerTodos(raiz) { $$('textarea', raiz).forEach(crecer); }

// ------------------------------------------------------------------ reglas compartidas con el servidor
function aplica(regla, exp) {
  exp = exp || S.exp;
  regla = regla || 'todos';
  if (regla === 'artefacto') return exp.tipo_proyecto === 'artefacto';
  if (regla === 'explicativa') return exp.tipo_proyecto !== 'artefacto';
  if (regla === 'hipotesis') return exp.con_hipotesis !== 'NO';
  return true;
}
function itemAplica(r, exp) {
  exp = exp || S.exp;
  if (r.marca === '**' && exp.tipo_proyecto !== 'artefacto') return false;
  if ((r.item === 17 || r.item === 18) && exp.con_hipotesis === 'NO') return false;
  return true;
}
function etiquetaDe(c, exp) {
  exp = exp || S.exp;
  return String(c.etiqueta).split('{var1}').join(exp.var1 || 'variable 1').split('{var2}').join(exp.var2 || 'variable 2');
}
function tablaDe(exp, clave) {
  var v = exp[clave];
  if (!v) return [];
  if (typeof v !== 'string') return v;
  try { var a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function campoDe(clave) {
  var cs = S.d ? S.d.campos : [];
  for (var i = 0; i < cs.length; i++) { if (cs[i].clave === clave) return cs[i]; }
  return null;
}
function etapaDe(id, etapas) {
  etapas = etapas || (S.d ? S.d.etapas : []);
  for (var i = 0; i < etapas.length; i++) { if (etapas[i].id === String(id)) return etapas[i]; }
  return null;
}
function accesible(id, d) {
  d = d || S.d;
  // Por defecto las etapas estan abiertas; solo se encadenan si el curso lo pide
  if (d.config.ETAPAS_EN_ORDEN !== 'SI') return d.etapas.some(function (e) { return e.id === String(id); });
  var permitir = d.config.AVANZAR_EN_REVISION === 'SI';
  for (var i = 0; i < d.etapas.length; i++) {
    if (d.etapas[i].id === String(id)) return true;
    var a = d.avance[d.etapas[i].id];
    var est = a ? a.estado : '';
    if (!(est === 'aprobada' || (permitir && est === 'en_revision'))) return false;
  }
  return false;
}
/** Estado visible de una etapa: { clave, texto, color, icono } */
function estadoEtapa(id, d) {
  d = d || S.d;
  var a = d.avance[String(id)];
  if (!accesible(id, d)) return { clave: 'bloqueada', texto: 'Bloqueada', color: '', icono: IC.candado };
  if (!a) return { clave: 'nueva', texto: 'Por empezar', color: 'borde', icono: '' };
  if (a.estado === 'aprobada') return { clave: 'aprobada', texto: a.semaforo === 'ambar' ? 'Aprobada con mejoras pendientes' : 'Aprobada', color: 'verde', icono: IC.check };
  if (a.estado === 'en_revision') return { clave: 'en_revision', texto: 'En revisión del asesor', color: 'indigo', icono: IC.reloj };
  if (a.estado === 'devuelta') return { clave: 'devuelta', texto: 'Devuelta por el asesor', color: 'rojo', icono: IC.alerta };
  if (a.semaforo === 'rojo') return { clave: 'observada', texto: 'Con observaciones', color: 'rojo', icono: IC.alerta };
  return { clave: 'en_curso', texto: 'En curso', color: 'ambar', icono: '' };
}
function chip(e) { return '<span class="chip ' + e.color + '">' + e.icono + esc(e.texto) + '</span>'; }

function citaCorta(b) {
  var a = b.autores || [], anio = b.anio || 's. f.';
  if (!a.length) return 'Autor desconocido, ' + anio;
  if (a.length === 1) return a[0].apellido + ', ' + anio;
  if (a.length === 2) return a[0].apellido + ' y ' + a[1].apellido + ', ' + anio;
  return a[0].apellido + ' et al., ' + anio;
}
function iniciales(n) { return String(n || '').trim().split(/\s+/).filter(function (p) { return p; }).map(function (p) { return p.charAt(0).toUpperCase() + '.'; }).join(' '); }

// ------------------------------------------------------------------ estilos de cita (IEEE por defecto)
var ESTILOS_CITA = [['ieee', 'IEEE', 'Numérica: [1], [2]. La más usada en ingeniería.'], ['apa', 'APA 7', 'Autor y año: (Pérez, 2024).'], ['vancouver', 'Vancouver', 'Numérica: (1), (2). Común en ciencias de la salud.'], ['chicago', 'Chicago (autor-fecha)', 'Autor y año sin coma: (Pérez 2024).']];
function estiloCita() {
  var e = S.exp && S.exp._estilo_cita;
  if (!e && S.vista === 'alumno' && S.alumno && S.alumno.expediente) e = S.alumno.expediente._estilo_cita;
  return e || (S.d && S.d.config && S.d.config.CITAS_DEFECTO) || 'ieee';
}
function nombreEstilo(e) { for (var i = 0; i < ESTILOS_CITA.length; i++) { if (ESTILOS_CITA[i][0] === e) return ESTILOS_CITA[i][1]; } return 'IEEE'; }
function esNumerico(e) { return e === 'ieee' || e === 'vancouver'; }
/** Cita del texto, tal como saldra en el documento. En los estilos numericos usa el numero de la ultima pagina armada. */
function citaEnTexto(claves) {
  var e = estiloCita(), nums = [], partes = [], num = (S.vistaDoc && S.vistaDoc.numCitas) || {};
  claves.forEach(function (k) {
    var b = S.d.biblioteca.filter(function (x) { return x.clave_cita === k; })[0];
    if (!b) return;
    if (esNumerico(e)) nums.push(num[k] || '•');
    else partes.push(e === 'chicago' ? citaCorta(b).replace(/, (\S+)$/, ' $1') : citaCorta(b));
  });
  if (nums.length) return e === 'ieee' ? nums.map(function (n) { return '[' + n + ']'; }).join(', ') : '(' + nums.join(',') + ')';
  return partes.length ? '(' + partes.join('; ') + ')' : '';
}
function autoresTexto(b, e) {
  var l = b.autores || [];
  if (!l.length) return 'Autor desconocido';
  if (e === 'ieee') { var x = l.map(function (a) { var i = iniciales(a.nombre); return (i ? i + ' ' : '') + a.apellido; }); return x.length > 6 ? x[0] + ' et al.' : (x.length > 1 ? x.slice(0, x.length - 1).join(', ') + ' y ' + x[x.length - 1] : x[0]); }
  if (e === 'vancouver') { var v = l.map(function (a) { return a.apellido + (a.nombre ? ' ' + iniciales(a.nombre).replace(/[.\s]/g, '') : ''); }); return v.length > 6 ? v.slice(0, 6).join(', ') + ', et al' : v.join(', '); }
  if (e === 'chicago') { var p = l[0].apellido + (l[0].nombre ? ', ' + l[0].nombre : ''); var r = l.slice(1).map(function (a) { return (a.nombre ? a.nombre + ' ' : '') + a.apellido; }); return r.length ? p + (r.length > 1 ? ', ' + r.slice(0, r.length - 1).join(', ') : '') + ' y ' + r[r.length - 1] : p; }
  var a = l.map(function (z) { var i = iniciales(z.nombre); return z.apellido + (i ? ', ' + i : ''); });
  return a.length > 1 ? a.slice(0, a.length - 1).join(', ') + ' y ' + a[a.length - 1] : a[0];
}
/** Referencia en HTML, en el estilo elegido, para las listas de la biblioteca. */
function refHtml(b, estilo) {
  var e = estilo || (S.d ? estiloCita() : 'apa'), anio = esc(b.anio || 's. f.'), t = esc(String(b.titulo || '').replace(/[.\s]+$/, '')), f = esc(b.fuente || ''), ed = esc(b.editorial || b.fuente || '');
  var au = esc(autoresTexto(b, e));
  if (e === 'ieee') {
    if (b.tipo === 'articulo') return au + ', «' + t + '», <i>' + f + '</i>' + (b.volumen ? ', vol. ' + esc(b.volumen) : '') + (b.numero ? ', n.º ' + esc(b.numero) : '') + (b.paginas ? ', pp. ' + esc(b.paginas) : '') + ', ' + anio + (b.doi ? ', doi: ' + esc(b.doi) : '') + '.';
    if (b.tipo === 'libro') return au + ', <i>' + t + '</i>. ' + (ed ? ed + ', ' : '') + anio + '.';
    return au + ', «' + t + '», ' + (b.tipo === 'tesis' ? esc(b.grado || 'Tesis') + (f ? ', ' + f : '') : f) + ', ' + anio + '.';
  }
  if (e === 'vancouver') {
    if (b.tipo === 'articulo') return au + '. ' + t + '. ' + (f ? f + '. ' : '') + anio + (b.volumen ? ';' + esc(b.volumen) : '') + (b.numero ? '(' + esc(b.numero) + ')' : '') + (b.paginas ? ':' + esc(b.paginas) : '') + '.';
    if (b.tipo === 'tesis') return au + '. ' + t + ' [' + esc(String(b.grado || 'tesis').toLowerCase()) + ']. ' + (f ? f + '; ' : '') + anio + '.';
    return au + '. ' + t + '. ' + (ed ? ed + '; ' : '') + anio + '.';
  }
  if (e === 'chicago') {
    var cab = au.replace(/\.?$/, '.') + ' ' + anio + '. ';
    if (b.tipo === 'articulo') return cab + '«' + t + '». <i>' + f + '</i>' + (b.volumen ? ' ' + esc(b.volumen) : '') + (b.numero ? ' (' + esc(b.numero) + ')' : '') + (b.paginas ? ': ' + esc(b.paginas) : '') + '.';
    if (b.tipo === 'libro') return cab + '<i>' + t + '</i>. ' + (ed ? ed + '.' : '');
    return cab + '«' + t + '». ' + (b.tipo === 'tesis' ? esc(b.grado || 'Tesis') + (f ? ', ' + f : '') : f) + '.';
  }
  var s = au + ' (' + anio + '). ';
  if (b.tipo === 'articulo') s += t + '. <i>' + f + '</i>' + (b.volumen ? ', <i>' + esc(b.volumen) + '</i>' : '') + (b.numero ? '(' + esc(b.numero) + ')' : '') + (b.paginas ? ', ' + esc(b.paginas) : '') + '.';
  else if (b.tipo === 'tesis') s += '<i>' + t + '</i> [' + esc(b.grado || 'Tesis') + (f ? ', ' + f : '') + '].';
  else s += '<i>' + t + '</i>. ' + ed + (ed ? '.' : '');
  return s;
}

// ------------------------------------------------------------------ modos del asistente
// curso: la clave de Gemini del curso. propia: la clave del estudiante, guardada solo en su navegador.
// copiar: la aplicacion arma la consulta y el estudiante trae la respuesta de su propio asistente.
var VIAS = {
  curso: { nombre: 'Asistente del curso', corto: 'Asistente del curso' },
  propia: { nombre: 'Mi propia clave de API' },
  copiar: { nombre: 'Copiar y pegar con mi asistente', corto: 'Copiar y pegar' },
  nano: { nombre: 'Gemini Nano en mi navegador', corto: 'Gemini Nano' }
};
function leerLocal(k) { try { return window.localStorage.getItem(k) || ''; } catch (e) { return ''; } }
function ponerLocal(k, v) { try { if (v) window.localStorage.setItem(k, v); else window.localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
function modosIA() {
  var c = S.d ? S.d.config : null;
  return String(c && c.MODOS_IA ? c.MODOS_IA : '').split(',').filter(function (m) { return !!VIAS[m]; });
}
function viaUsable(v) {
  if (modosIA().indexOf(v) < 0) return false;
  if (v === 'curso') return S.d.config.IA_ACTIVA === 'SI';
  if (v === 'propia') return !!claveIA();
  if (v === 'nano') return nanoUsable();
  return true;
}
/** Modo en uso: el que eligio el estudiante, o el del curso por defecto, o el primero que se pueda usar. */
function viaIA() {
  if (!S.d) return '';
  var orden = [viaGuardada(), S.d.config.MODO_IA_POR_DEFECTO, 'propia', 'curso', 'nano', 'copiar'];
  for (var i = 0; i < orden.length; i++) { if (orden[i] && viaUsable(orden[i])) return orden[i]; }
  return '';
}
/** Hay al menos un modo que el estudiante puede usar o configurar por su cuenta. */
function iaDisponible() {
  var m = modosIA();
  return m.indexOf('copiar') >= 0 || m.indexOf('propia') >= 0 || (m.indexOf('curso') >= 0 && S.d.config.IA_ACTIVA === 'SI');
}
/** Agrega a los argumentos de una consulta el modo y, si corresponde, la clave del estudiante. */
function conVia(args, via) {
  args.via = via;
  if (via === 'propia') { args.clave = claveIA(); args.proveedor = provIA(); var md = modeloIA(); if (md) args.modelo = md; }
  return args;
}
function attrIA() { return iaDisponible() ? '' : ' disabled title="El asistente aún no está configurado"'; }

/** Copia un texto al portapapeles. Dentro de Apps Script la API moderna puede estar bloqueada: se intenta primero la seleccion. */
function copiarTexto(texto, area) {
  var ok = false;
  try {
    if (area) { area.focus(); area.select(); try { area.setSelectionRange(0, texto.length); } catch (e1) { /* sin rango */ } ok = document.execCommand('copy'); }
  } catch (e) { ok = false; }
  if (ok) return Promise.resolve(true);
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return false; });
  return Promise.resolve(false);
}

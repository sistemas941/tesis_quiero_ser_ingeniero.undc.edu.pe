// ------------------------------------------------------------------ Mi tesis: escribir lo esencial y ver la pagina en vivo
// Modo sencillo. A la izquierda, pocas preguntas en el orden del documento, empezando por el titulo.
// A la derecha, la pagina tal como saldra en Word: se actualiza al escribir y lleva a cada campo con un clic.

function modoApp() {
  if (!S.d) return 'sencillo';
  var m = S.modo || leerLocalUsuario('qsi_modo') || S.d.config.MODO_INICIAL;
  return m === 'completo' ? 'completo' : 'sencillo';
}
function ponerModo(m) { S.modo = m; ponerLocal(llaveLocal('qsi_modo'), m); }

function preguntasSencillas() { return (S.d.sencillo || []).filter(function (f) { return aplica(f.aplica); }); }
function respondida(f) {
  if (f.campo === '#biblioteca') return S.d.biblioteca.some(function (b) { return b.uso === 'antecedente'; });
  return String(S.exp[f.campo] || '').trim().length > 0;
}
function progresoSencillo() {
  var ps = preguntasSencillas(), n = ps.filter(respondida).length;
  return { llenas: n, total: ps.length, pct: ps.length ? Math.round(100 * n / ps.length) : 0 };
}

function preguntaHtml(f) {
  if (f.campo === '#biblioteca') {
    var cb = conteoBiblioteca(S.d.biblioteca);
    return '<section class="campo sc" id="c-biblioteca"><div class="fila entre"><div><span class="rotulo">' + esc(f.pregunta) + '</span><p class="ayuda" style="margin-bottom:0">' + esc(f.ayuda) + ' Llevas <b>' + cb.articulos + '</b> artículos y <b>' + cb.tesis + '</b> tesis.</p></div><button class="btn" data-a="ir" data-v="biblioteca">' + IC.libro + 'Abrir mi biblioteca</button></div></section>';
  }
  var c = campoDe(f.campo);
  if (!c) return '';
  var no = attrIA(), identidad = /^(autor\d|orcid\d|asesor_|coasesor_)/.test(c.clave), acc = '';
  // Pocas ayudas por pregunta: la que mas sirve en cada caso
  if (!identidad && c.clave !== 'linea') {
    acc += '<button class="btn chico fantasma" data-a="ia" data-modo="ayuda" data-campo="' + esc(c.clave) + '"' + no + '>Explícame</button>';
    if (c.clave === 'var1') acc += '<button class="btn chico" data-a="desglosar"' + no + '>' + IC.chispa + 'Sacarlas de mi título</button>';
    else if (c.tipo !== 'opcion' && c.clave !== 'var2') {
      if (c.ia) acc += '<button class="btn chico" data-a="ia" data-modo="proponer" data-campo="' + esc(c.clave) + '"' + no + '>' + IC.chispa + (c.clave === 'titulo' ? 'Mejorar mi título' : 'Ayúdame a escribirlo') + '</button>';
      else acc += '<button class="btn chico fantasma" data-a="ia" data-modo="preguntar" data-campo="' + esc(c.clave) + '"' + no + '>Hazme preguntas</button>';
      acc += botonHumanizar(c);
      if (c.tipo === 'parrafo') acc += '<button class="btn chico fantasma" data-a="citar" data-campo="' + esc(c.clave) + '">' + IC.libro + 'Citar</button>';
      acc += '<button class="btn chico fantasma" data-a="profundizar" data-campo="' + esc(c.clave) + '" title="Abre esta parte en la ruta completa, con todos sus campos">Profundizar' + IC.flecha + '</button>';
    }
  }
  return '<section class="campo sc" id="c-' + esc(c.clave) + '"><div class="campo-cab">' +
    (c.tipo === 'opcion' ? '<span class="rotulo">' + esc(f.pregunta || etiquetaDe(c)) + '</span>' : '<label for="f-' + esc(c.clave) + '">' + esc(f.pregunta || etiquetaDe(c)) + '</label>') + '</div>' +
    (f.ayuda ? '<p class="ayuda">' + esc(f.ayuda) + '</p>' : '<div style="height:8px"></div>') + controlHtml(c) +
    '<div class="campo-pie"><span class="cuenta" id="n-' + esc(c.clave) + '"></span>' + humChipHtml(humCampo(S.d.humanizacion, c.clave)) + '<span class="acciones">' + acc + '</span></div><div class="obs-campo" id="o-' + esc(c.clave) + '"></div></section>';
}

function formularioTesisHtml() {
  var grupo = null, h = '';
  preguntasSencillas().forEach(function (f) {
    if (f.grupo !== grupo) { grupo = f.grupo; h += '<h2 class="esc-grupo">' + esc(grupo) + '</h2>'; }
    h += preguntaHtml(f);
  });
  h += '<div class="tarjeta plana esc-mas"><h3>¿Quieres profundizar?</h3><p class="tenue pequeno">Con esto ya tienes la base de tu proyecto. La ruta completa agrega el árbol de problemas, los objetivos específicos, la operacionalización, el cronograma, el presupuesto, la revisión con la rúbrica y el visto bueno de tu asesor. Entra cuando quieras: lo que escribiste aquí ya estará allá.</p><div class="fila" style="margin-top:10px"><button class="btn" data-a="modoCompleto">Abrir la ruta completa' + IC.flecha + '</button><button class="btn fantasma" data-a="ir" data-v="orientacion">Ver la orientación</button></div></div>';
  return h;
}

function progresoHtml() {
  var p = progresoSencillo();
  return '<div class="barra-prog" style="height:6px" role="img" aria-label="' + p.llenas + ' de ' + p.total + ' respuestas"><i style="width:' + p.pct + '%"></i></div><div class="pequeno tenue" style="margin-top:4px">' + (p.llenas === 0 ? 'Empieza por el título: aparecerá en tu carátula.' : (p.llenas === p.total ? 'Tienes lo esencial. Descárgalo en Word o profundiza.' : 'Llevas ' + p.llenas + ' de ' + p.total + ' respuestas.')) + '</div>';
}

function vistaTesis() {
  var nombre = String(S.d.perfil.nombre || '').split(' ')[0], vacio = !String(S.exp.titulo || '').trim();
  var h = '<div class="cabecera"><h1>' + (vacio ? 'Hola, ' + esc(nombre) + '. Empecemos por el título' : 'Mi tesis') + '</h1><p>' + (S.exp._borrador ? 'Tu borrador ya está escrito con la plantilla de la escuela. Aquí corriges lo esencial y lo ves cambiar al instante; en «Ver mi tesis» lo revisas sección por sección.' : 'Responde pocas preguntas, en el orden de tu documento. Lo que escribes aparece al instante en tu página, con la carátula y la estructura de la ' + esc(S.d.config.UNIVERSIDAD) + ', y puedes descargarlo en Word cuando quieras.') + '</p></div>' + avisoTitulo() + tarjetaHumHtml();
  var av = miAvance();
  h += '<div class="tarjeta plana mi-avance"><div class="crece"><div class="fila entre pequeno"><b>Tu avance</b><button class="enlace" data-a="ir" data-v="clase">Ver mi clase</button></div>' + barraAvanceHtml(av.pct, av.nivel, true) + '</div><button class="btn" data-a="importar" title="Sube el plan que ya escribiste en Word o PDF">' + IC.subir + 'Importar mi plan</button></div>';
  h += '<div class="escritor" id="escritor"><div class="esc-form pila" id="esc-form">' + formularioTesisHtml() + '</div>';
  h += '<aside class="esc-doc" id="esc-doc" aria-label="Tu documento"><div class="doc-barra"><div class="fila entre"><div><h3 style="margin:0">Tu documento</h3><span class="pequeno tenue" id="doc-estado">Se actualiza mientras escribes</span></div>' +
    '<button class="btn chico ambar" data-a="descargarWord" id="boton-word">' + IC.doc + 'Descargar en Word</button></div><div id="doc-progreso" style="margin-top:8px">' + progresoHtml() + '</div><div id="doc-revision" style="margin-top:8px"></div></div>' +
    '<div class="hojas" id="hojas">' + (S.vistaDoc ? hojasHtml(S.vistaDoc.bloques) : '<div class="pensando" style="padding:30px 10px"><i></i><span>Preparando tu página…</span></div>') + '</div></aside></div>';
  h += asistenteHtml(true);
  h += '<button class="btn primario boton-doc-movil" data-a="verDoc" id="boton-doc">' + IC.doc + 'Ver mi documento</button>';
  return h;
}

/** Lo que se hace despues de insertar el HTML de la vista. */
function despuesDeTesis() {
  preguntasSencillas().forEach(function (f) { var c = campoDe(f.campo); if (c) pintarCuenta(c); });
  pintarAsistente();
  cargarVista();
  cargarEscudo();
  var primero = preguntasSencillas().filter(function (f) { return f.campo !== '#biblioteca' && !respondida(f); })[0];
  if (primero && primero.campo === 'titulo' && window.innerWidth > 980) { var el = $('#f-titulo'); if (el) el.focus({ preventScroll: true }); }
}
function repintarFormTesis() {
  var f = $('#esc-form');
  if (!f) return;
  var y = window.scrollY;
  f.innerHTML = formularioTesisHtml();
  crecerTodos(f);
  preguntasSencillas().forEach(function (x) { var c = campoDe(x.campo); if (c) pintarCuenta(c); });
  window.scrollTo(0, y);
  aplicarCongelado();
}
function pintarProgreso() { var p = $('#doc-progreso'); if (p) p.innerHTML = progresoHtml(); }

// ------------------------------------------------------------------ la pagina
function enDocumento() { return S.vista === 'tesis' || S.vista === 'documento' || (S.vista === 'alumno' && S.alumnoTab === 'tesis'); }
function cargarVista() {
  // Si nada cambio desde la ultima pagina armada, se reusa sin ir al servidor
  // La pagina ya armada se muestra al instante; igual se pide la ultima al servidor (por si alguien mas la cambio)
  if (S.vista !== 'alumno' && S.vistaDoc && !S.vistaSucia && !Object.keys(S.pend).length) ponerVista(S.vistaDoc);
  var pedido = S.vista === 'alumno' ? llamar('vistaDe', { correo: S.alumno.perfil.correo }) : llamar('vista');
  pedido.then(function (v) { if (enDocumento() && !(S.vista === 'documento' && S.docModo === 'borrador' && planCongelado())) ponerVista(v); }).catch(function (e) {
    var hj = $('#hojas');
    if (hj && !S.vistaDoc) hj.innerHTML = '<div class="aviso rojo" style="margin:14px">No se pudo preparar la página: ' + esc(e.message) + '</div>';
  });
}
/** Pinta la pagina que llega del servidor sin perder el punto de lectura ni lo que aun no se guardo. */
function ponerVista(v) {
  if (v !== S.vistaDoc) S.vistaSucia = false;
  S.vistaDoc = v;
  var hj = $('#hojas');
  if (!hj) return;
  var y = hj.scrollTop;
  hj.innerHTML = hojasHtml(v.bloques);
  hj.scrollTop = y;
  if (S.vista !== 'alumno') Object.keys(S.pend).forEach(ecoVista);
  var est = $('#doc-estado');
  if (est) est.textContent = S.vista === 'alumno' ? 'Así está hoy su documento' : (Object.keys(S.pend).length ? 'Escribiendo…' : 'Al día con lo que escribiste');
  pintarRevision();
  ponerEscudo();
}

// ------------------------------------------------------------------ revision por secciones
function secciones() { return S.vistaDoc && S.vistaDoc.revision ? S.vistaDoc.revision.secciones : []; }
function seccion(id) { return secciones().filter(function (x) { return x.id === id; })[0]; }
/** Resumen y boton de descarga: verde cuando todo esta revisado, «por revisar» mientras falte algo. */
function pintarRevision() {
  var r = S.vistaDoc && S.vistaDoc.revision, b = $('#boton-word'), caja = $('#doc-revision');
  if (!r) return;
  if (S.vista === 'alumno') pintarBloques();
  var falta = r.total - r.revisadas;
  if (b) {
    b.className = 'btn chico ' + (r.completa ? 'verde' : 'ambar');
    b.innerHTML = r.completa ? IC.check + 'Tesis revisada · Descargar en Word' : IC.doc + 'Por revisar (' + falta + ') · Descargar en Word';
    b.title = r.completa ? 'Todas las secciones están revisadas' : 'Puedes descargarla igual: las secciones sin revisar siguen siendo un borrador';
  }
  if (caja) {
    var dev = secciones().filter(function (x) { return x.estado === 'devuelto'; }).length;
    caja.innerHTML = '<div class="fila entre pequeno"><span>' + (S.vista === 'alumno' ? 'Secciones revisadas' : 'Revisaste') + ' <b>' + r.revisadas + '</b> de ' + r.total + ' secciones' + (dev ? ' · <span style="color:var(--rojo)">' + dev + ' devuelta' + (dev > 1 ? 's' : '') + ' por el asesor</span>' : '') + '</span>' +
      (falta && S.vista !== 'alumno' ? '<button class="enlace" data-a="siguienteRevision">Ir a la siguiente por revisar</button>' : '') + '</div><div class="barra-prog verde" style="margin-top:6px"><i style="width:' + Math.round(100 * r.revisadas / Math.max(1, r.total)) + '%"></i></div>';
  }
}
function revHtml(b) {
  var s = seccion(b.id);
  if (!s) return '';
  var asesor = S.vista === 'alumno', soloAsesor = S.d && S.d.config && S.d.config.REVISION_VERDE === 'asesor';
  var h = '<div class="d-rev ' + s.estado + '" data-rev="' + esc(b.id) + '">';
  if (s.estado === 'revisado') h += '<span class="chip verde">' + IC.check + 'Revisado' + (s.por === 'asesor' ? ' por el asesor' : '') + '</span>';
  else if (s.estado === 'devuelto') h += '<span class="chip rojo">Devuelto por ' + (asesor ? (puedeDecidir() ? 'ti' : 'el asesor') : 'tu asesor') + '</span><span class="d-rev-c">' + esc(s.comentario) + '</span>';
  else h += '<span class="chip ambar">Por revisar</span>' + (s.cambio ? '<span class="d-rev-c">Cambió después de tu revisión</span>' : '');
  if (asesor && !puedeDecidir()) {
    h += '';
  } else if (asesor) {
    h += '<span class="crece"></span>' + (s.estado !== 'revisado' ? '<button class="btn chico" data-a="aprobarSeccion" data-id="' + esc(b.id) + '">' + IC.check + 'Aprobar</button>' : '') + '<button class="btn chico fantasma" data-a="devolverSeccion" data-id="' + esc(b.id) + '">Devolver</button>';
  } else if (!soloAsesor) {
    h += '<span class="crece"></span>' + (s.estado === 'revisado' ? '<button class="enlace" data-a="revisarSeccion" data-id="' + esc(b.id) + '" data-e="quitar">Deshacer</button>' : '<button class="btn chico" data-a="revisarSeccion" data-id="' + esc(b.id) + '" data-e="ok" title="La leíste, la corregiste y estás de acuerdo con ella">' + IC.check + (s.estado === 'devuelto' ? 'Ya lo corregí' : 'Lo revisé') + '</button>');
  }
  return h + '</div>';
}
function revisarSeccion(id, estado, btn) {
  var fin = ocupar(btn, '');
  guardarAhora().then(function () { return llamar('revisar', { seccion: id, estado: estado }); }).then(function (v) {
    fin();
    ponerVista(v);
    var r = v.revision;
    if (estado === 'ok') toast(r.completa ? '¡Revisaste toda tu tesis! Ya puedes descargarla y enviársela a tu asesor.' : 'Sección revisada. Te faltan ' + (r.total - r.revisadas) + '.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}
function siguienteRevision() {
  var s = secciones().filter(function (x) { return x.estado !== 'revisado'; })[0];
  var hj = $('#hojas'), n = s && hj ? $('[data-rev="' + s.id + '"]', hj) : null;
  if (!n) return;
  var dy = n.getBoundingClientRect().top - hj.getBoundingClientRect().top;
  hj.scrollTop += dy - 20;
  n.classList.add('d-foco');
  setTimeout(function () { n.classList.remove('d-foco'); }, 1600);
}
function aprobarSeccion(id, btn) {
  var fin = ocupar(btn, '');
  llamar('revisarAsesor', { correo: S.alumno.perfil.correo, seccion: id, decision: 'aprobar' }).then(function (v) { fin(); ponerVista(v); toast('Sección aprobada.', 'bien'); }).catch(function (e) { fin(); fallo(e); });
}
function devolverSeccion(id) {
  var s = seccion(id);
  modal('<h2>Devolver: ' + esc(s ? s.titulo : id) + '</h2><p class="tenue">El estudiante verá tu comentario en esa sección, en rojo, hasta que la corrija.</p><textarea id="dev-com" rows="4" style="margin-top:10px" placeholder="Qué debe corregir"></textarea>' +
    '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn peligro" data-a="confirmarDevolver" data-id="' + esc(id) + '">Devolver la sección</button></div>');
}
function confirmarDevolver(id, btn) {
  var fin = ocupar(btn, 'Devolviendo');
  llamar('revisarAsesor', { correo: S.alumno.perfil.correo, seccion: id, decision: 'devolver', comentario: $('#dev-com').value }).then(function (v) { cerrarModal(); ponerVista(v); toast('Sección devuelta al estudiante.', 'bien'); }).catch(function (e) { fin(); fallo(e); });
}

/** Aviso del titulo ajustado (o propuesto) al cargar el padron. */
function avisoTitulo() {
  var e = S.exp || {};
  if (!e._titulo_motivo) return '';
  var prop = e._titulo_propuesto === 'SI';
  return '<div class="aviso ' + (prop ? 'ambar' : '') + '" style="margin-bottom:16px"><b>' + (prop ? 'Tu título es una propuesta.' : 'Ajustamos tu título para que sea de tesis.') + '</b> ' + esc(e._titulo_motivo) +
    (e._titulo_original ? '<div class="pequeno" style="margin-top:6px">Título original: «' + esc(e._titulo_original) + '»</div>' : '') + '</div>';
}

/** Ver mi tesis: el documento completo, sus secciones por revisar y la descarga en Word. */
function vistaDocumento() {
  if (!S.docModo) S.docModo = planCongelado() ? 'borrador' : 'plan';
  var borr = planCongelado() && S.docModo === 'borrador';
  var conmuta = planCongelado() ? '<div class="segmentos" style="margin-top:10px"><button class="' + (borr ? '' : 'activo') + '" data-a="docModo" data-m="plan">' + IC.candado + 'Plan aprobado</button><button class="' + (borr ? 'activo' : '') + '" data-a="docModo" data-m="borrador">' + IC.libroAbierto + 'Borrador de tesis</button></div>' : '';
  if (borr) return '<div class="cabecera"><h1>Ver mi tesis</h1><p>Así va tu borrador de tesis completo, con la estructura del Anexo 6. Haz clic en una sección vacía para escribirla.</p>' + conmuta + '</div>' + documentoHtml(true);
  var h = '<div class="cabecera"><h1>Ver mi tesis</h1><p>' + (planCongelado() ? 'Tu plan aprobado, tal como quedó congelado. Para seguir, pasa al borrador de tesis.' : 'Así queda tu proyecto con la plantilla de la escuela. Es un borrador: léelo sección por sección, corrige lo que haga falta y marca cada una como revisada. Lo resaltado en amarillo son datos que solo tú puedes conseguir. Cuando todo esté en verde, tu tesis está lista para tu asesor.') + '</p>' + conmuta + '</div>' + avisoTitulo();
  return h + '<div id="reglamento" style="margin-bottom:14px"></div>' + documentoHtml(true);
}
function documentoHtml(conDescarga) {
  return '<div class="doc-solo"><aside class="esc-doc" id="esc-doc" aria-label="Documento"><div class="doc-barra"><div class="fila entre"><div><h3 style="margin:0">' + (S.vista === 'alumno' ? 'Su documento' : 'Tu documento') + '</h3><span class="pequeno tenue" id="doc-estado">Preparando…</span></div>' +
    (conDescarga ? (S.docModo === 'borrador' && planCongelado() ? '<button class="btn chico ambar" data-a="infWord" id="boton-word">' + IC.doc + 'Descargar borrador en Word</button>' : '<button class="btn chico ambar" data-a="descargarWord" id="boton-word">' + IC.doc + 'Descargar en Word</button>') : '') + '</div><div id="doc-revision" style="margin-top:8px"></div></div>' +
    '<div class="hojas" id="hojas">' + (S.vistaDoc && S.vista !== 'alumno' && !(S.docModo === 'borrador' && planCongelado()) ? hojasHtml(S.vistaDoc.bloques) : '<div class="pensando" style="padding:30px 10px"><i></i><span>Preparando la página…</span></div>') + '</div></aside></div>';
}
function cargarEscudo() {
  if (!S.escudo && S.escudo !== false) {
    S.escudo = false;
    llamar('escudo').then(function (r) { S.escudo = r.imagen || false; ponerEscudo(); }).catch(function () { S.escudo = false; });
  }
}
function despuesDeDocumento() {
  if (S.vista !== 'alumno' && S.docModo === 'borrador' && planCongelado()) { cargarBorradorDoc(); return; }
  if (S.vista !== 'alumno') S.vistaDoc = S.vistaDoc || null; cargarVista(); cargarEscudo(); pintarRevision(); cargarReglamento();
}
function ponerEscudo() {
  $$('.d-logo').forEach(function (n) { n.innerHTML = S.escudo ? '<img src="' + esc(S.escudo) + '" alt="Escudo">' : ''; });
}

/** Texto de la pagina con las marcas pendientes resaltadas, como en el documento. */
function nombreCaratula(s) { s = String(s || '').trim(); var i = s.indexOf(','); return i > 0 ? (s.substring(i + 1).trim() + ' ' + s.substring(0, i).trim()).trim() : s; }
function textoDoc(x) {
  return esc(x).replace(/\[(por completar|cita no encontrada)[^\]]*\]/gi, function (m) { return '<span class="d-pend">' + m + '</span>'; });
}
function soloMarca(x) { return /^[“"]?\[por completar:[^\]]*\][”"]?$/i.test(String(x).trim()); }
function textoMarca(x) { var m = /\[por completar:\s*([^\]]*)\]/i.exec(String(x)); var t = m ? m[1].trim() : String(x); return t.charAt(0).toUpperCase() + t.substring(1); }
function irA(clave) { return clave ? ' data-a="docIr" data-c="' + esc(clave) + '"' : ''; }
/** La parte pendiente se llena en este formulario (y no en la ruta completa). */
function esDeAqui(clave) { return !!clave && !!S.d && (S.d.sencillo || []).some(function (f) { return f.campo === clave && aplica(f.aplica); }); }
function vacioHtml(clave, texto, extra, estilo) {
  var aqui = esDeAqui(clave);
  return '<p class="' + (extra ? extra + ' ' : '') + 'd-vacio' + (aqui ? ' d-aqui' : '') + '"' + (clave ? ' data-k="' + esc(clave) + '"' : '') + irA(clave) + (estilo ? ' style="' + estilo + '"' : '') +
    (clave ? ' title="' + (aqui ? 'Haz clic para escribirlo' : 'Se completa en la ruta completa: haz clic para abrirla') + '"' : '') + '>' + esc(texto) + '</p>';
}
function tam(d) { return d ? 'font-size:' + (1 + d / 12).toFixed(3) + 'em;' : ''; }

function bloqueHtml(b) {
  if (b.t === 'car') {
    var est = tam(b.d) + 'margin-top:' + (b.an / 12).toFixed(2) + 'em;margin-bottom:' + (b.de / 12).toFixed(2) + 'em;' + (b.b ? 'font-weight:bold;' : '');
    if (soloMarca(b.x)) return vacioHtml(b.k, textoMarca(b.x), 'd-car', est);
    return '<p class="d-car"' + (b.k ? ' data-k="' + esc(b.k) + '"' : '') + irA(b.k) + ' style="' + est + '">' + textoDoc(b.x) + '</p>';
  }
  if (b.t === 'rev') return revHtml(b);
  if (b.t === 'idx') return '<p class="d-idx d-idx' + b.n + '">' + esc(b.x) + '</p>';
  if (b.t === 'logo') return '<p class="d-logo">' + (S.escudo ? '<img src="' + esc(S.escudo) + '" alt="Escudo">' : '') + '</p>';
  if (b.t === 'h') return '<p class="d-h d-h' + b.n + '"' + irA(b.f) + (b.f ? ' data-f="' + esc(b.f) + '"' : '') + '>' + esc(b.x) + '</p>';
  if (b.t === 'p') {
    if (b.pend) return vacioHtml(b.k, textoMarca(b.x), '', '');
    return '<p class="d-p' + (b.a === 'c' ? ' d-c' : '') + (b.s ? ' d-s' : '') + '"' + (b.k ? ' data-k="' + esc(b.k) + '"' : '') + irA(b.k) + ' style="' + tam(b.d) + (b.b ? 'font-weight:bold' : '') + '">' + textoDoc(b.x) + '</p>';
  }
  if (b.t === 'rot') return '<p class="d-p d-rot' + (b.s ? ' d-s' : '') + '"' + (b.k ? ' data-k="' + esc(b.k) + '" data-r="' + esc(b.r) + '"' + irA(b.k) : '') + '>' + (b.cur ? '<i>' + esc(b.r) + '</i>' : '<b>' + esc(b.r) + '</b>') + ' ' + textoDoc(b.x) + '</p>';
  if (b.t === 'ley') return '<p class="d-ley"><b>' + esc(b.r) + '</b></p><p class="d-ley-t"><i>' + esc(b.x) + '</i></p>';
  if (b.t === 'tnota') return '<p class="d-tnota"><i>Nota.</i> ' + esc(b.x) + '</p>';
  if (b.t === 'li') return '<p class="d-li"' + irA(b.f) + '>' + textoDoc(b.x) + '</p>';
  if (b.t === 'ref') return '<p class="d-ref' + (b.num ? ' num' : '') + '">' + b.tr.map(function (x) { return x.i ? '<i>' + esc(x.t) + '</i>' : esc(x.t); }).join('') + '</p>';
  if (b.t === 'arbol') { var a = arbolSvg(S.vista === 'alumno' && S.alumno ? S.alumno.expediente : S.exp); return a.svg ? '<div class="d-arbol"' + irA('problema_central') + '>' + a.svg + '</div>' : '<p class="d-vacio"' + irA('problema_central') + '>Árbol de problemas</p>'; }
  if (b.t === 'tabla') {
    var suma = 0, sombra = {}, negrita = {};
    (b.an || []).forEach(function (x) { suma += x; });
    (b.so || []).forEach(function (s) { sombra[s[0] + ',' + s[1]] = s[2] || '#5B4FE8'; });
    (b.ne || []).forEach(function (i) { negrita[i] = true; });
    return '<table class="d-tabla"' + irA(b.f) + ' style="' + tam(b.d) + '">' + b.c.map(function (fila, i) {
      return '<tr>' + fila.map(function (c, j) {
        var e = (i === 0 && suma && b.an[j] ? 'width:' + (100 * b.an[j] / suma).toFixed(1) + '%;' : '') + (sombra[i + ',' + j] ? 'background:' + sombra[i + ',' + j] + ';' : '') + (negrita[i] ? 'font-weight:bold;' : '');
        return (i === 0 ? '<th' : '<td') + (e ? ' style="' + e + '"' : '') + '>' + textoDoc(c) + (i === 0 ? '</th>' : '</td>');
      }).join('') + '</tr>';
    }).join('') + '</table>';
  }
  return '';
}
function hojasHtml(bloques) {
  var h = '<div class="hoja">';
  bloques.forEach(function (b) { h += b.t === 'salto' ? '</div><div class="hoja">' : bloqueHtml(b); });
  return h + '</div><p class="pequeno tenue" style="text-align:center;margin:4px 0 10px">Vista previa. Los saltos de página y el índice se ajustan en el documento de Word.</p>';
}

/** Cita [@clave] como se vera en el documento, con la biblioteca que ya esta en el navegador. */
function citasLocales(texto) {
  return String(texto).replace(/\[@[A-Za-z0-9_\-]+\](?:\s*[,;]?\s*\[@[A-Za-z0-9_\-]+\])*/g, function (grupo) {
    var claves = [], re = /\[@([A-Za-z0-9_\-]+)\]/g, m;
    while ((m = re.exec(grupo)) !== null) claves.push(m[1]);
    var malas = claves.filter(function (k) { return !S.d.biblioteca.some(function (x) { return x.clave_cita === k; }); }).map(function (k) { return '[cita no encontrada: ' + k + ']'; });
    return [citaEnTexto(claves)].concat(malas).filter(function (x) { return x; }).join(' ');
  });
}
/** Eco inmediato: lo que se esta escribiendo aparece en la pagina sin esperar al servidor. */
function ecoVista(clave) {
  var hj = $('#hojas');
  if (!hj) return;
  var nodos = $$('[data-k="' + clave + '"]', hj);
  if (!nodos.length) return;   // secciones armadas por el servidor: llegan con el guardado
  var c = campoDe(clave), v = String(S.exp[clave] || '').trim(), primero = nodos[0];
  if (c && c.tipo === 'tabla') return;
  if (primero.classList.contains('d-car')) {
    var vacioC = !v;
    primero.classList.toggle('d-vacio', vacioC);
    primero.innerHTML = vacioC ? esc({ titulo: 'Título del proyecto', autor1: 'Nombres y apellidos del autor', asesor_nombre: 'Asesor' }[clave] || 'Por completar') : textoDoc(clave === 'autor1' ? nombreCaratula(v) : (clave === 'asesor_nombre' ? 'ASESOR: ' + v : v));
    return;
  }
  if (primero.classList.contains('d-rot')) {
    primero.innerHTML = '<b>' + esc(primero.getAttribute('data-r')) + '</b> ' + textoDoc(citasLocales(v.replace(/\s*\n+\s*/g, ' ')));
    var est0 = $('#doc-estado');
    if (est0) est0.textContent = 'Escribiendo…';
    return;
  }
  var partes = v.split(/\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return s; });
  var html = partes.length ? partes.map(function (p) { return '<p class="d-p d-s" data-k="' + esc(clave) + '"' + irA(clave) + '>' + textoDoc(citasLocales(p)) + '</p>'; }).join('')
    : vacioHtml(clave, c ? etiquetaDe(c) : 'Por completar', '', '');
  primero.insertAdjacentHTML('beforebegin', html);
  nodos.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
  var est = $('#doc-estado');
  if (est) est.textContent = 'Escribiendo…';
}
/** Lleva la pagina a la parte que corresponde al campo en el que se escribe. */
function enfocarDoc(clave) {
  var hj = $('#hojas');
  if (!hj) return;
  var n = $('[data-k="' + clave + '"]', hj) || $('[data-f="' + clave + '"]', hj);
  if (!n) return;
  $$('.d-foco', hj).forEach(function (x) { x.classList.remove('d-foco'); });
  n.classList.add('d-foco');
  var dy = n.getBoundingClientRect().top - hj.getBoundingClientRect().top;
  if (dy < 40 || dy > hj.clientHeight - 80) hj.scrollTop += dy - Math.round(hj.clientHeight / 3);
}
/** Clic en la pagina: va al campo si esta en este formulario; si no, lo abre en la ruta completa. */
function docIr(clave) {
  if (!clave || S.vista === 'alumno') return;
  if (clave === '#biblioteca') { ir('biblioteca'); return; }
  if ($('#c-' + clave)) { var e = $('#escritor'); if (e) e.classList.remove('ver-doc'); pintarBotonDoc(); irCampo(clave); return; }
  profundizar(clave);
}
function profundizar(clave) {
  var c = campoDe(clave);
  if (!c) return;
  ponerModo('completo');
  S.ia = null;
  ir('etapa', c.etapa).then(function () { irCampo(clave); toast('Esta es la ruta completa: aquí están todos los campos de esta parte. Vuelve a «Mi tesis» cuando quieras.'); });
}
function pintarBotonDoc() {
  var b = $('#boton-doc'), e = $('#escritor');
  if (b && e) b.innerHTML = e.classList.contains('ver-doc') ? IC.flecha + 'Seguir escribiendo' : IC.doc + 'Ver mi documento';
}
function verDoc() {
  var e = $('#escritor');
  if (!e) return;
  e.classList.toggle('ver-doc');
  pintarBotonDoc();
  window.scrollTo(0, 0);
}

// ------------------------------------------------------------------ Word en un clic
function descargarWord(btn) {
  var fin = ocupar(btn, 'Escribiendo tu Word');
  guardarAhora().then(arbolPng).then(function (png) { return llamar('generarPlan', { imagenArbol: png }); }).then(function (r) {
    fin();
    S.plan = r;
    S.exp._plan_url = r.url;
    S.exp._plan_fecha = r.fecha;
    var id = idDoc(r.url);
    modal('<h2>Tu documento está listo</h2><p class="tenue">Tiene la carátula, los capítulos y los anexos de la plantilla. ' + (r.pendientes ? 'Lo que aún falta quedó resaltado en amarillo: sigue escribiendo y vuelve a descargarlo cuando quieras.' : 'No quedaron marcas pendientes.') + '</p>' +
      (r.compartido === false ? '<div class="aviso rojo" style="margin-top:10px">El documento se creó, pero no se pudo compartir automáticamente. Pide a tu profesor que te lo comparta desde su Google Drive.</div>' : '') +
      '<div class="fila" style="margin-top:16px"><a class="btn primario" href="' + esc(urlDoc(id, 'docx')) + '" target="_blank" rel="noopener">' + IC.doc + 'Descargar en Word</a><a class="btn" href="' + esc(urlDoc(id, 'pdf')) + '" target="_blank" rel="noopener">Descargar en PDF</a>' + (SERVIDOR ? '' : '<a class="btn" href="' + esc(enlace(r.url)) + '" target="_blank" rel="noopener">' + TXT_ABRIR_DOC + IC.afuera + '</a>') + '</div>' +
      '<p class="pequeno tenue" style="margin-top:14px">En Word, el índice se inserta desde Referencias, Tabla de contenido: los títulos ya tienen estilo de encabezado.</p>' +
      '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="cerrarModal">Seguir escribiendo</button></div>');
  }).catch(function (e) { fin(); fallo(e); });
}

// ------------------------------------------------------------------ las piezas del titulo
function usarPiezas() {
  var ia = S.ia;
  if (!ia || !ia.r) return;
  var r = ia.r;
  [['var1', r.var1], ['var2', r.var2]].forEach(function (x) { if (x[1]) ponerValor(x[0], x[1]); });
  if (r.contexto && !String(S.exp.contexto || '').trim()) ponerValor('contexto', r.contexto);
  if (r.tipo && !S.exp.tipo_proyecto) { S.exp.tipo_proyecto = r.tipo; programar('tipo_proyecto', r.tipo); }
  if (r.id) llamar('marcarIA', { id: r.id, estado: 'aceptado' }).catch(function () {});
  S.ia = null;
  cerrarAsistente();
  if (S.vista === 'tesis') { repintarFormTesis(); pintarProgreso(); irCampo('var1'); }
  toast('Listo. Revisa las dos piezas y corrígelas si hace falta.', 'bien');
}

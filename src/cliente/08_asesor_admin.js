// ------------------------------------------------------------------ Panel del asesor
function tablaPanelHtml() {
  var p = S.panel, l = p.estudiantes.slice();
  if (!l.length && esGlobal()) return '<div class="vacio">Aún no hay estudiantes registrados.</div>';
  if (!l.length) return '<div class="vacio">Aún no tienes estudiantes asignados. El administrador asigna el asesor de cada estudiante en Administración.</div>';
  l.sort(function (a, b) { return (b.enRevision.length - a.enRevision.length) || ((parseInt(b.dias, 10) || 0) - (parseInt(a.dias, 10) || 0)); });
  var espera = l.filter(function (x) { return x.enRevision.length; }).length, quietos = l.filter(function (x) { return x.dias !== '' && x.dias >= 14 && x.etapa !== 'Completo'; }).length;
  var h = '<div class="fila" style="margin-bottom:14px"><span class="chip borde">' + l.length + ' estudiantes</span><span class="chip ' + (espera ? 'indigo' : 'borde') + '">' + IC.reloj + espera + (puedeDecidir() ? ' esperan tu revisión' : ' esperan revisión del asesor') + '</span><span class="chip ' + (quietos ? 'ambar' : 'borde') + '">' + quietos + ' sin actividad en 14 días o más</span></div>';
  h += '<div class="tarjeta" style="padding:6px 8px"><div class="desliza"><table class="tabla" style="min-width:1260px"><thead><tr><th style="min-width:240px">Estudiante</th><th>Avance</th><th class="num">Revisión de la tesis</th><th class="num">Lo esencial</th><th>Etapa actual</th><th>Etapas</th><th>Por revisar</th><th class="num">Días sin actividad</th><th class="num">Consultas IA</th><th>Humanizado</th><th>Texto propio</th><th class="num">Rúbrica</th><th>Plan</th></tr></thead><tbody>';
  l.forEach(function (x) {
    h += '<tr class="clic" data-a="verAlumno" data-correo="' + esc(x.correo) + '" tabindex="0"><td><b>' + esc(x.nombre) + '</b><div class="pequeno tenue">' + esc(x.titulo || x.correo) + '</div>' + (x.tipo ? '<span class="chip borde" style="margin-top:4px">' + (x.tipo === 'artefacto' ? 'Con artefacto' : 'Explicativa') + '</span>' : '') + (x.importacion ? ' ' + chipImportacion(x.importacion) : '') + '</td>' +
      '<td>' + barraAvanceMini(x.avance, x.humanizacion ? x.humanizacion.nivel : 'semilla') + '</td>' +
 '<td class="num">' + (x.revision && x.revision.total ? '<span class="chip ' + (x.revision.revisadas === x.revision.total ? 'verde' : 'ambar') + '">' + x.revision.revisadas + ' / ' + x.revision.total + '</span>' : '-') + (x.pendienteClave === 'SI' ? '<div class="pequeno tenue" style="font-family:var(--fuente)">Aún no entra</div>' : '') + '</td>' +
      '<td class="num">' + (x.esenciales ? x.esenciales.llenas + ' / ' + x.esenciales.total : '-') + '</td>' +
      '<td>' + esc(x.etapa) + '</td><td><div class="barra-prog" style="width:90px;height:8px"><i style="width:' + Math.round(100 * x.aprobadas / Math.max(1, x.total)) + '%"></i></div><span class="pequeno tenue mono">' + x.aprobadas + ' / ' + x.total + '</span></td>' +
      '<td>' + (x.enRevision.length ? x.enRevision.map(function (id) { var e = etapaDe(id, p.etapas); return '<span class="chip indigo">' + esc(e ? e.nombre : id) + '</span>'; }).join(' ') : '<span class="tenue">-</span>') + '</td>' +
      '<td class="num">' + (x.dias === '' ? '-' : (x.dias >= 14 ? '<span class="chip ambar">' + x.dias + '</span>' : x.dias)) + '</td><td class="num">' + x.consultas + '</td><td>' + nivelHtml(x.humanizacion, true) + '</td><td>' + focoHtml(x.reelaboracion, true) + '</td><td class="num">' + (x.rubrica ? x.rubrica + ' %' + (x.rubricaNoVerificados ? '<div class="pequeno" style="color:var(--ambar);font-family:var(--fuente)" title="Ítems cuya estimación pegó el estudiante desde un asistente externo">' + x.rubricaNoVerificados + ' sin verificar</div>' : '') : '-') + '</td>' +
      '<td>' + chipPlan(x.planEstado) + (enlace(x.plan) ? '<div><a class="pequeno" href="' + esc(enlace(x.plan)) + '" target="_blank" rel="noopener" data-a="nada">Abrir el Word</a></div>' : '') + '</td></tr>';
  });
  return h + '</tbody></table></div></div>';
}
function vistaPanel() {
  var txt = puedeDecidir() ? 'Aquí ves dónde va cada estudiante, qué espera tu visto bueno y quién lleva días sin avanzar. Abre a un estudiante para leer su expediente, aprobar o devolver una etapa.' : 'Aquí ves dónde va cada estudiante. Puedes abrir su expediente y su tesis en modo de solo lectura: aprobar o devolver le corresponde a su asesor.';
  return '<div class="cabecera"><h1>Estudiantes</h1><p>' + txt + '</p></div><div id="tabla-panel">' + tablaPanelHtml() + '</div>';
}
function refrescarPanel() {
  if (esGlobal()) return;
  if (S.panelHora && Date.now() - S.panelHora < 60000) return;
  S.panelHora = Date.now();
  llamar('panel').then(function (p) { S.panel = p; var t = $('#tabla-panel'); if (t && S.vista === 'panel') t.innerHTML = tablaPanelHtml(); }).catch(function () {});
}
function verAlumno(correo) {
  llamar('verEstudiante', { correo: correo }).then(function (a) {
    S.alumno = a;
    var rev = a.etapas.filter(function (e) { return a.avance[e.id] && a.avance[e.id].estado === 'en_revision'; })[0];
    var sig = siguienteEtapa(a);
    S.alumnoTab = rev ? rev.id : (sig ? sig.id : a.etapas[0].id);
    ir('alumno');
  }).catch(fallo);
}

function valorLectura(c, exp) {
  var v = exp[c.clave];
  if (c.tipo === 'tabla') {
    var f = tablaDe(exp, c.clave);
    if (!f.length) return '<span class="tenue">Sin llenar</span>';
    return '<div class="desliza"><table class="tabla" style="font-size:13.5px"><thead><tr>' + c.columnas.map(function (col) { return '<th>' + esc(col.etiqueta) + '</th>'; }).join('') + '</tr></thead><tbody>' + f.map(function (x) { return '<tr>' + c.columnas.map(function (col) { return '<td>' + conMarcas(x[col.clave]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  if (!v) return '<span class="tenue">Sin llenar</span>';
  if (c.tipo === 'opcion') { for (var i = 0; i < c.opciones.length; i++) { if (c.opciones[i].valor === v) return esc(c.opciones[i].texto); } }
  return '<div style="white-space:pre-wrap">' + conMarcas(v) + '</div>';
}

function alumnoEtapaHtml(a, id) {
  var exp = a.expediente, e = etapaDe(id, a.etapas), av = a.avance[id], det = av && av.detalle ? av.detalle : null, st = estadoEtapa(id, a);
  var h = '<div class="rejilla dos"><div class="pila">';
  a.campos.filter(function (c) { return c.etapa === id && aplica(c.aplica, exp); }).forEach(function (c) {
    h += '<section class="campo"><div class="campo-cab"><span class="rotulo">' + esc(etiquetaDe(c, exp)) + '</span>' + (c.tipo === 'parrafo' ? '<span class="pequeno tenue mono">' + palabras(exp[c.clave]) + ' palabras</span>' : '') + humChipHtml(humCampo(a.humanizacion, c.clave)) + focoCampoHtml(focoDeCampo(a, c.clave)) + '</div><div style="margin-top:8px">' + valorLectura(c, exp) + '</div></section>';
  });
  if (a.campos.some(function (c) { return c.etapa === id && c.clave === 'problema_central'; })) { var arb = arbolSvg(exp); if (arb.svg) h += '<div class="tarjeta plana"><h3>Árbol de problemas</h3><div class="figura">' + arb.svg + '</div></div>'; }
  h += '</div><aside class="pila"><div class="tarjeta"><div class="fila entre"><h3 style="margin:0">' + esc(e.nombre) + '</h3>' + chip(st) + '</div>';
  if (det && det.fecha) h += '<p class="pequeno tenue" style="margin-top:6px">Última revisión: ' + esc(fechaCorta(det.fecha)) + ' · ' + comoSeReviso(det, true) + '</p>' + (det.resumen ? '<p style="margin-top:6px">' + esc(det.resumen) + '</p>' : '');
  if (det && det.excepcion) h += '<div class="aviso ambar" style="margin-top:10px"><b>El estudiante pide una excepción:</b> ' + esc(det.excepcion) + '</div>';
  if (det && det.observaciones && det.observaciones.length) {
    h += '<div class="obs-lista">' + det.observaciones.map(function (o) { return '<div class="obs ' + (o.nivel === 'bloqueante' ? 'bloqueante' : '') + '"><b>' + (o.nivel === 'bloqueante' ? 'Bloqueante' : 'Por mejorar') + (o.origen === 'ia' ? ' (asistente)' : ' (regla)') + ':</b> ' + esc(o.texto) + '</div>'; }).join('') + '</div>';
  }
  var enRev = av && av.estado === 'en_revision' && puedeDecidir();
  if (!puedeComentar()) h += '<div class="separador"></div><p class="pequeno tenue">Modo de solo lectura: aprobar, devolver o comentar le corresponde al asesor.</p></div>';
  else h += '<div class="separador"></div><label for="comentario-asesor" class="pequeno" style="font-weight:600">' + (enRev ? 'Tu decisión' : 'Dejar un comentario') + '</label><textarea id="comentario-asesor" rows="3" style="margin-top:6px" placeholder="' + (enRev ? 'Qué debe corregir o por qué está conforme' : 'Comentario para el estudiante') + '"></textarea><div class="fila" style="margin-top:10px">' +
    (enRev ? '<button class="btn primario" data-a="decidir" data-d="aprobar">' + IC.check + 'Aprobar</button><button class="btn peligro" data-a="decidir" data-d="devolver">Devolver</button>' : '<button class="btn" data-a="comentar">Enviar comentario</button>') + '</div></div>';
  var com = a.comentarios.filter(function (c) { return String(c.etapa) === id; });
  if (com.length) h += '<div class="tarjeta"><h3>Historial</h3><div class="pila" style="gap:10px">' + com.map(function (c) { return '<div class="comentario"><div class="meta">' + esc(c.autor) + ' · ' + esc(fechaCorta(c.fecha)) + '</div>' + (c.decision ? '<b>' + (c.decision === 'aprobada' ? 'Aprobó. ' : 'Devolvió. ') + '</b>' : '') + esc(c.texto) + '</div>'; }).join('') + '</div></div>';
  return h + '</aside></div>';
}

function alumnoIAHtml(a) {
  var r = a.ia, nombres = { ayuda: 'Explicación de un campo', preguntar: 'Preguntas guía', proponer: 'Propuesta de redacción', revisar: 'Revisión de etapa', jurado: 'Preguntas de jurado', jurado_eval: 'Evaluación de respuestas al jurado', resumir: 'Ficha de antecedente', rubrica: 'Evaluación con la rúbrica' };
  var prop = r.porModo.proponer || 0, sinMarca = Math.max(0, prop - r.aceptadas - r.editadas - r.descartadas);
  var h = '<div class="rejilla" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))"><div class="tarjeta"><h3>Uso del asistente</h3><div class="dato"><span>Consultas en total</span><b>' + r.total + '</b></div><div class="dato"><span>Consultas hoy</span><b>' + a.uso + '</b></div><div class="dato"><span>Tokens consumidos</span><b>' + String(r.tokens).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '</b></div></div>' +
    '<div class="tarjeta"><h3>Qué hizo con las propuestas de redacción</h3><div class="dato"><span>Aceptadas sin cambios</span><b>' + r.aceptadas + '</b></div><div class="dato"><span>Aceptadas con cambios</span><b>' + r.editadas + '</b></div><div class="dato"><span>Descartadas</span><b>' + r.descartadas + '</b></div><div class="dato"><span>Sin usar</span><b>' + sinMarca + '</b></div><p class="pequeno tenue" style="margin-top:8px">Muchas propuestas aceptadas sin cambios son una señal para conversar con el estudiante.</p></div>' +
    '<div class="tarjeta"><h3>Por tipo de consulta</h3>';
  var hay = false, k;
  for (k in r.porModo) { if (r.porModo.hasOwnProperty(k)) { hay = true; h += '<div class="dato"><span>' + esc(nombres[k] || k) + '</span><b>' + r.porModo[k] + '</b></div>'; } }
  h += (hay ? '' : '<p class="tenue">Aún no usa el asistente.</p>') + '</div>';
  var pv = r.porVia || {};
  h += '<div class="tarjeta"><h3>Por modo del asistente</h3><div class="dato"><span>Asistente del curso</span><b>' + (pv.curso || 0) + '</b></div><div class="dato"><span>Clave propia de Gemini</span><b>' + (pv.propia || 0) + '</b></div><div class="dato"><span>Copiar y pegar</span><b>' + (pv.copiar || 0) + '</b></div><div class="dato"><span>Gemini Nano (local)</span><b>' + (pv.nano || 0) + '</b></div><p class="pequeno tenue" style="margin-top:8px">Lo que llega por copiar y pegar lo trae el estudiante desde un asistente externo: la aplicación lo valida, pero no puede comprobar su origen.</p></div>';
  return h + '</div>';
}

function focoDeCampo(a, clave) {
  var r = a.reelaboracion;
  return r ? r.campos.filter(function (c) { return c.campo === clave; })[0] : null;
}
/** Tarjeta con el foco de cada texto que propuso la IA. resumen: solo los campos que no están reelaborados. */
function reelaboracionHtml(a, resumen) {
  var r = a.reelaboracion;
  if (!r || !r.campos.length) return resumen ? '' : '<div class="tarjeta plana" style="margin-bottom:16px"><h3>' + focoSvg().replace('<svg', '<svg class="foco-ic"') + ' Reelaboración de los textos de la IA</h3><p class="tenue">La IA aún no le propuso redacciones.</p></div>';
  var l = r.campos.slice().sort(function (x, y) { return y.coincidencia - x.coincidencia; });
  if (resumen) l = l.filter(function (c) { return c.estado === 'igual' || c.estado === 'parcial'; });
  var h = '<div class="tarjeta plana reelab" style="margin-bottom:16px"><div class="fila entre"><h3 style="margin:0">Reelaboración de los textos de la IA</h3>' + focoHtml(r) + '</div>' +
    '<p class="pequeno tenue" style="margin-top:6px">Compara el texto actual de cada campo con las propuestas de redacción que la IA le dio en la aplicación (secuencias de cuatro palabras). Verde: coincide ' + r.umbralVerde + ' % o menos; ámbar: hasta ' + r.umbralRojo + ' %; rojo: más de ' + r.umbralRojo + ' %, es decir, el texto sigue casi igual a lo que propuso la IA. No detecta textos traídos de asistentes externos y no anticipa el resultado de Turnitin.</p>';
  if (resumen && !l.length) return h + '<p class="pequeno" style="margin-top:8px;color:var(--verde)">Todos los textos propuestos por la IA fueron reescritos.</p></div>';
  h += '<div class="pila" style="gap:6px;margin-top:10px">' + l.map(function (c) { return '<div class="dato"><span>' + esc(c.etiqueta) + '<span class="pequeno tenue"> · ' + c.propuestas + ' propuesta' + (c.propuestas > 1 ? 's' : '') + '</span></span>' + focoCampoHtml(c) + '</div>'; }).join('') + '</div>';
  return h + '</div>';
}
function vistaAlumno() {
  var a = S.alumno, exp = a.expediente, tab = S.alumnoTab;
  var h = '<div class="cabecera"><div class="miga"><button data-a="ir" data-v="panel">Estudiantes</button> / ' + esc(a.perfil.nombre) + '</div><div class="fila entre"><h1>' + esc(a.perfil.nombre) + '</h1>' + (enlace(exp._plan_url) ? '<a class="btn" href="' + esc(enlace(exp._plan_url)) + '" target="_blank" rel="noopener">' + IC.doc + 'Abrir su plan</a>' : '') + '</div><p>' + esc(exp.titulo || exp.tema_oracion || 'Aún sin título') + '</p>' +
    '<div class="fila" style="margin-top:8px"><span class="chip borde">' + esc(a.perfil.correo) + '</span>' + (exp.tipo_proyecto ? '<span class="chip borde">' + (exp.tipo_proyecto === 'artefacto' ? 'Con artefacto' : 'Explicativa') + '</span>' : '') + (exp.con_hipotesis === 'NO' ? '<span class="chip borde">Sin hipótesis</span>' : '') + nivelHtml(a.humanizacion) + focoHtml(a.reelaboracion) + '</div></div>';
  h += planPanelHtml(a);
  h += '<nav class="nav" style="margin-bottom:16px" aria-label="Secciones del expediente">' + a.etapas.map(function (e) {
    var st = estadoEtapa(e.id, a);
    return '<button data-a="tabAlumno" data-t="' + esc(e.id) + '" class="' + (tab === e.id ? 'activo' : '') + '">' + esc(e.id + '. ' + e.nombre) + (st.clave === 'en_revision' ? ' <span class="chip indigo">revisar</span>' : (st.clave === 'aprobada' ? ' <span class="chip verde">' + IC.check + '</span>' : '')) + '</button>';
  }).join('') + [['tesis', 'Su tesis']].concat(planCongelado(exp) ? [['borrador', 'Borrador de tesis']] : []).concat([['matriz', 'Matriz'], ['rubrica', 'Rúbrica'], ['biblioteca', 'Biblioteca (' + a.biblioteca.length + ')'], ['ia', 'Uso de IA']]).map(function (t) { return '<button data-a="tabAlumno" data-t="' + t[0] + '" class="' + (tab === t[0] ? 'activo' : '') + '">' + t[1] + '</button>'; }).join('') + '</nav>';
  if (tab === 'tesis') h += '<div id="bloques-rev"></div><div id="reglamento" style="margin-bottom:16px"></div>' + humRevisionHtml(a) + reelaboracionHtml(a, true) + (puedeReiniciar() ? '<div class="fila" style="margin-bottom:12px"><button class="btn" data-a="reiniciarClave">Reiniciar su clave</button><span class="pequeno tenue">Si la olvidó: le das una clave inicial nueva y se le pide cambiarla al entrar.</span></div>' : '') + '<p class="tenue" style="margin-bottom:12px">' + (puedeDecidir() ? 'Aprueba las secciones que estén bien o devuélvelas con un comentario: el estudiante lo verá en rojo en esa sección.' : 'Solo lectura: ves el estado de revisión de cada sección, pero no puedes cambiar el contenido ni las decisiones del asesor.') + '</p>' + documentoHtml(false);
  else if (tab === 'matriz') h += matrizHtml(exp);
  else if (tab === 'borrador') h += borradorAlumnoHtml();
  else if (tab === 'rubrica') h += rubricaHtml(a, exp, false);
  else if (tab === 'ia') h += reelaboracionHtml(a, false) + alumnoIAHtml(a);
  else if (tab === 'biblioteca') {
    h += a.biblioteca.length ? '<div class="pila" style="gap:10px">' + a.biblioteca.map(function (b) {
      return '<div class="estudio"><div class="ref">' + refHtml(b) + '</div><div class="meta"><span class="cita">[@' + esc(b.clave_cita) + ']</span><span class="chip borde">' + esc(nombreDe(TIPOS, b.tipo)) + '</span><span class="chip borde">' + esc(nombreDe(USOS, b.uso)) + '</span>' + verificacion(b) + (b.uso === 'antecedente' ? (fichaCompleta(b) ? '<span class="chip verde">Ficha completa</span>' : '<span class="chip ambar">Ficha incompleta</span>') : '') + (enlace(b.url) ? '<a href="' + esc(enlace(b.url)) + '" target="_blank" rel="noopener" class="pequeno">Abrir</a>' : '') + '</div></div>';
    }).join('') + '</div>' : '<div class="vacio">Su biblioteca está vacía.</div>';
  } else h += alumnoEtapaHtml(a, tab);
  return h;
}

function despuesDeAlumno() { if (S.alumnoTab === 'borrador') { cargarBorradorAlumno(); return; } if (S.alumnoTab === 'tesis') { S.vistaDoc = null; cargarVista(); cargarEscudo(); cargarReglamento(); } }
function reiniciarClaveAlumno(btn) {
  var a = S.alumno, fin = ocupar(btn, 'Reiniciando');
  llamar('reiniciarClave', { correo: a.perfil.correo }).then(function (r) {
    fin();
    modal('<h2>Clave reiniciada</h2><p class="tenue">Entrégale esta clave inicial a ' + esc(a.perfil.nombre) + '. Al entrar se le pedirá cambiarla.</p><div class="codigo-grande" style="margin:16px 0">' + esc(r.clave) + '</div><div class="fila" style="justify-content:flex-end"><button class="btn primario" data-a="cerrarModal">Listo</button></div>');
  }).catch(function (e) { fin(); fallo(e); });
}
function decidir(decision, btn) {
  var a = S.alumno, fin = ocupar(btn, decision === 'aprobar' ? 'Aprobando' : 'Devolviendo');
  llamar('decidir', { correo: a.perfil.correo, etapa: S.alumnoTab, decision: decision, comentario: $('#comentario-asesor').value }).then(function (r) {
    S.alumno = r;
    toast(decision === 'aprobar' ? 'Etapa aprobada.' : 'Etapa devuelta al estudiante.', 'bien');
    ir('alumno');
  }).catch(function (e) { fin(); fallo(e); });
}
function comentar(btn) {
  var a = S.alumno, fin = ocupar(btn, 'Enviando');
  llamar('comentar', { correo: a.perfil.correo, etapa: S.alumnoTab, texto: $('#comentario-asesor').value }).then(function (r) { S.alumno = r; toast('Comentario enviado.', 'bien'); ir('alumno'); }).catch(function (e) { fin(); fallo(e); });
}

// ------------------------------------------------------------------ Administracion
var NOMBRE_ROL = { estudiante: 'Estudiante', asesor: 'Asesor', admin: 'Administrador', coordinador: 'Coordinador', asistente: 'Asistente' };
function filtroUsuariosHtml() {
  var f = S.filtroUsuarios || '';
  return '<div class="fila" style="padding:0 8px 10px;gap:8px"><input id="filtro-usuarios" type="search" placeholder="Buscar por nombre o correo" value="' + esc(f) + '" style="max-width:280px" aria-label="Buscar usuarios"></div>';
}
function filasUsuariosHtml() {
  var a = S.admin, f = sinTildes(String(S.filtroUsuarios || '').toLowerCase());
  return a.usuarios.filter(function (u) { return !f || sinTildes((u.nombre + ' ' + u.correo + ' ' + u.rol).toLowerCase()).indexOf(f) >= 0; }).map(function (u) {
    var editable = (a.roles || []).indexOf(u.rol) >= 0;
    return '<tr><td><b>' + esc(u.nombre) + '</b><div class="pequeno tenue">' + esc(u.correo) + '</div></td><td>' + esc(NOMBRE_ROL[u.rol] || u.rol) + '</td><td class="pequeno">' + esc(u.asesor || '-') + '</td><td class="mono">' + (u.pendiente === 'SI' ? (editable ? esc(u.codigo || '(pedir reinicio)') : '<span class="tenue">Pendiente</span>') : '<span class="chip verde">' + IC.check + 'Propia</span>') + '</td><td>' + (u.activo === 'NO' ? '<span class="chip rojo">Inactivo</span>' : '<span class="chip verde">Activo</span>') + '</td><td>' + (editable ? '<button class="btn chico" data-a="editarUsuario" data-correo="' + esc(u.correo) + '">Editar</button>' : '') + '</td></tr>';
  }).join('');
}
function vistaAdmin() {
  var a = S.admin, s = a.sistema, okIA = s && s.gemini === 'Configurada', rol = S.perfil.rol;
  var intro = rol === 'admin' ? 'Usuarios y estado del sistema. La configuración (nombres de la carátula, mínimos, modelos, líneas de investigación), los campos, las indicaciones para la IA, la rúbrica y la plantilla del documento se editan en la hoja de datos.' : (rol === 'asistente' ? 'Aquí registras a estudiantes y asesores, les asignas asesor y reinicias su clave si la olvidan. No puedes modificar el contenido de las tesis.' : 'Aquí ves a todos los usuarios y su estado. Tu perfil de coordinación es de solo lectura: el administrador y el asistente crean usuarios y reinician claves.');
  var h = '<div class="cabecera"><h1>' + (rol === 'admin' ? 'Administración' : 'Usuarios') + '</h1><p>' + intro + '</p></div>';
  h += '<div class="rejilla dos"><div class="tarjeta" style="padding:14px 10px"><div class="fila entre" style="padding:0 8px 10px"><h2>Usuarios</h2>' + ((a.roles || []).length ? '<button class="btn primario chico" data-a="editarUsuario" data-correo="">' + IC.mas + 'Nuevo usuario</button>' : '<span class="chip borde">Solo lectura</span>') + '</div>' + filtroUsuariosHtml() + '<div class="desliza"><table class="tabla" style="min-width:640px"><thead><tr><th>Nombre</th><th>Rol</th><th>Asesor</th><th>Clave inicial</th><th>Estado</th><th></th></tr></thead><tbody id="filas-usuarios">' +
    filasUsuariosHtml() + '</tbody></table></div></div>';
  h += '<aside class="pila"><div class="tarjeta"><h3>Clave del curso</h3><div class="codigo-grande" style="font-size:22px">' + esc(a.claveRegistro) + '</div><p class="pequeno tenue" style="margin-top:8px">' + (a.registro === 'SI' ? 'Entrégala a los estudiantes: con ella crean su usuario.' : 'El registro está cerrado: los usuarios se crean aquí.') + '</p></div>';
  h += '<div class="tarjeta"><h3>Qué puede hacer cada perfil</h3><p class="pequeno tenue">Detalle completo en la <button class="enlace" data-a="ir" data-v="guia" data-p="roles">Guía</button>.</p><div class="dato"><span>Coordinador</span><span class="pequeno" style="text-align:right">Tablero y todo en solo lectura</span></div><div class="dato"><span>Asistente</span><span class="pequeno" style="text-align:right">Tablero, lectura y alta de estudiantes y asesores</span></div><div class="dato"><span>Asesor</span><span class="pequeno" style="text-align:right">Sus estudiantes: aprueba, devuelve y comenta</span></div></div>';
  if (!s) return h + '</aside></div>';
  h += '<div class="tarjeta"><h3>Sistema</h3><div class="dato"><span>Gemini</span><span class="chip ' + (okIA ? 'verde' : 'rojo') + '">' + (okIA ? IC.check + 'Clave configurada' : 'Falta la clave') + '</span></div>' + (okIA ? '' : '<p class="pequeno tenue" style="padding:6px 0">' + (SERVIDOR ? 'Pide al responsable del servidor que la agregue en el archivo .env (GEMINI_API_KEY) y reinicie el servicio. ' : 'Guárdala en Apps Script: Configuración del proyecto, Propiedades del script, propiedad GEMINI_API_KEY. ') + (/propia|copiar/.test(s.modos || '') ? 'Mientras tanto, los estudiantes pueden usar su propia clave o copiar y pegar.' : '') + '</p>') +
    '<div class="dato"><span>El estudiante empieza en</span><span class="pequeno" style="text-align:right">' + (s.modoInicial === 'completo' ? 'La ruta completa' : 'El modo sencillo') + '</span></div><div class="dato"><span>Etapas</span><span class="pequeno" style="text-align:right">' + (s.etapasEnOrden === 'SI' ? 'En orden, con candado' : 'Abiertas') + '</span></div>' +
    '<div class="dato"><span>Modos habilitados</span><span class="pequeno" style="text-align:right">' + esc(String(s.modos || '').split(',').map(function (v) { return VIAS[v] ? VIAS[v].corto : v; }).join(', ')) + '</span></div><div class="dato"><span>Cierre sin revisión verificada</span><span class="pequeno" style="text-align:right">' + (s.revisionSinIA === 'asesor' ? 'Pasa al asesor' : 'Bastan las reglas') + '</span></div>' +
    '<div class="dato"><span>Modelo de revisión</span><span class="mono pequeno">' + esc(s.modeloCompuertas) + '</span></div><div class="dato"><span>Modelo ligero</span><span class="mono pequeno">' + esc(s.modeloLigero) + '</span></div><div class="dato"><span>OpenAlex</span><span class="pequeno" style="text-align:right">' + esc(s.openalex) + '</span></div>' +
    '<div class="dato"><span>Cuota diaria por estudiante</span><b>' + esc(s.cuota) + '</b></div><div class="dato"><span>Consultas registradas</span><b>' + s.consultas + '</b></div><div class="fila" style="margin-top:12px">' + (SERVIDOR ? '<button class="btn" data-a="descargarDatos" title="Excel con todas las pestañas de datos, para revisar o respaldar">Descargar los datos (Excel)</button>' : '<a class="btn" href="' + esc(enlace(s.hoja)) + '" target="_blank" rel="noopener">Abrir la hoja de datos</a>') + '<button class="btn" data-a="refrescarDatos" title="Si editaste la hoja a mano, la aplicación lo verá al instante (si no, en 15 minutos como máximo)">Recargar datos de la hoja</button></div></div></aside></div>';
  return h;
}
function editarUsuario(correo) {
  var a = S.admin, u = a.usuarios.filter(function (x) { return x.correo === correo; })[0] || { correo: '', nombre: '', rol: 'estudiante', asesor: '', activo: 'SI' };
  var asesores = a.usuarios.filter(function (x) { return x.rol === 'asesor' || x.rol === 'admin' || x.rol === 'coordinador'; });
  var roles = (a.roles || ['estudiante']).map(function (r) { return [r, NOMBRE_ROL[r] || r]; });
  if (correo && u.rol && (a.roles || []).indexOf(u.rol) < 0) roles.push([u.rol, NOMBRE_ROL[u.rol] || u.rol]);
  modal('<h2>' + (correo ? 'Editar usuario' : 'Nuevo usuario') + '</h2><form data-f="usuario"><div class="campo-simple"><label for="u-correo">Correo</label><input id="u-correo" type="email" required value="' + esc(u.correo) + '"' + (correo ? ' readonly' : '') + '></div><div class="campo-simple"><label for="u-nombre">Nombres y apellidos</label><input id="u-nombre" type="text" required value="' + esc(u.nombre) + '"></div>' +
    '<div class="ficha" style="border:0;padding:0;margin:0"><div class="par"><div class="campo-simple"><label for="u-rol">Rol</label><select id="u-rol">' + opcionesSel(roles, u.rol) + '</select></div><div class="campo-simple"><label for="u-activo">Estado</label><select id="u-activo">' + opcionesSel([['SI', 'Activo'], ['NO', 'Inactivo']], u.activo === 'NO' ? 'NO' : 'SI') + '</select></div></div></div>' +
    '<div class="campo-simple"><label for="u-asesor">Asesor (para estudiantes)</label><select id="u-asesor"><option value="">Sin asesor</option>' + asesores.map(function (x) { return '<option value="' + esc(x.correo) + '"' + (u.asesor === x.correo ? ' selected' : '') + '>' + esc(x.nombre + ' (' + x.correo + ')') + '</option>'; }).join('') + '</select></div>' +
    (correo ? '<label class="fila pequeno" style="margin-bottom:12px"><input type="checkbox" id="u-nuevo" style="width:auto"> Reiniciar su clave (recibe una clave inicial nueva y debe cambiarla al entrar)</label>' : '<p class="pequeno tenue" style="margin-bottom:12px">Al guardar se genera su clave inicial (apellido y cuatro números). La verás en la tabla para entregársela; al entrar se le pedirá cambiarla.</p>') +
    '<div class="fila" style="justify-content:flex-end"><button class="btn" type="button" data-a="cerrarModal">Cancelar</button><button class="btn primario" type="submit">Guardar</button></div></form>');
}
function guardarUsuario(form) {
  var fin = ocupar($('button[type=submit]', form), 'Guardando'), nuevo = $('#u-nuevo');
  llamar('adminUsuario', { correo: $('#u-correo').value, nombre: $('#u-nombre').value, rol: $('#u-rol').value, asesor: $('#u-asesor').value, activo: $('#u-activo').value, nuevoCodigo: nuevo ? nuevo.checked : false }).then(function (r) {
    S.admin = r;
    cerrarModal();
    toast('Usuario guardado.', 'bien');
    ir('admin');
  }).catch(function (e) { fin(); fallo(e); });
}

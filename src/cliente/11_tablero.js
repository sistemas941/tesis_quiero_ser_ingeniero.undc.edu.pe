// ------------------------------------------------------------------ Tablero del coordinador
var SERIES_ING = [['estudiante', 'Estudiantes', '#5B4FE8'], ['asesor', 'Asesores', '#0F9D8A'], ['otros', 'Coordinación', '#D9822B']];

function ponerTablero(t) {
  var orden = { rojo: 3, ambar: 2, verde: 1 };
  (t.estudiantes || []).forEach(function (x) { x.focoN = x.reelaboracion && x.reelaboracion.foco ? orden[x.reelaboracion.foco] : 0; var hz = x.humanizacion || {}; x.humPct = hz.generados ? hz.pct : -1; x.palabrasIA = hz.palabrasIA || 0; x.importo = x.importacion && !x.importacion.deshecha ? 1 : 0; x.avance = x.avance || 0; });
  S.tablero = t;
  S.panel = t.panel;
}
function actualizarTablero(btn) {
  var fin = ocupar(btn, 'Calculando');
  llamar('tablero', { forzar: true }).then(function (t) { fin(); ponerTablero(t); toast('Tablero actualizado.', 'bien'); ir('tablero'); }).catch(function (e) { fin(); fallo(e); });
}
/** Quien importo su plan: fecha, archivo y lo que entro. */
function chipImportacion(im) {
  if (!im) return '<span class="tenue">-</span>';
  var det = 'Importó «' + im.archivo + '» el ' + String(im.f || '').substring(0, 10) + ': ' + im.campos + ' secciones, ' + im.tablas + ' tablas, ' + im.refs + ' referencias' + (im.ia ? ' (ordenado con IA)' : '') + (im.deshecha ? ' · deshecha' : '');
  return '<span class="chip ' + (im.deshecha ? 'borde' : 'indigo') + '" title="' + esc(det) + '" data-tip="' + esc(det) + '">' + IC.subir + (im.deshecha ? 'Deshecha' : String(im.f || '').substring(5, 10).split('-').reverse().join('/')) + '</span>';
}
function pct(n) { return (n || 0) + ' %'; }
function diasTxt(d) { return d === '' || d === undefined ? '-' : String(d); }

function kpiHtml(valor, rotulo, nota, tono) {
  return '<div class="kpi' + (tono ? ' ' + tono : '') + '"><b>' + esc(String(valor)) + '</b><span>' + esc(rotulo) + '</span>' + (nota ? '<small>' + esc(nota) + '</small>' : '') + '</div>';
}

/** Barras horizontales de una sola serie: [[rotulo, valor, detalle]]. */
function barrasH(datos, max, sufijo) {
  max = max || Math.max.apply(null, datos.map(function (d) { return d[1]; }).concat([1]));
  return '<div class="barras-h">' + datos.map(function (d) {
    var w = Math.round(100 * d[1] / Math.max(1, max));
    return '<div class="bh" data-tip="' + esc(d[0] + ': ' + d[1] + (sufijo || '') + (d[2] ? ' · ' + d[2] : '')) + '"><span class="bh-r" title="' + esc(d[0]) + '">' + esc(d[0]) + '</span><span class="bh-p"><i style="width:' + w + '%"></i></span><span class="bh-v mono">' + d[1] + (sufijo || '') + '</span></div>';
  }).join('') + '</div>';
}

/** Columnas apiladas de los ingresos por semana. */
function columnasIngresos(sem) {
  var max = Math.max.apply(null, sem.map(function (s) { return s.estudiante + s.asesor + s.otros; }).concat([1]));
  var W = 560, H = 200, base = 170, alto = 150, paso = W / sem.length, ancho = Math.min(38, paso - 14);
  var g = '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="#E4E3EE"/>';
  sem.forEach(function (s, i) {
    var x = i * paso + (paso - ancho) / 2, y = base, total = s.estudiante + s.asesor + s.otros;
    SERIES_ING.forEach(function (se, j) {
      var v = s[se[0]];
      if (!v) return;
      var h = Math.max(2, alto * v / max);
      var esTope = !SERIES_ING.slice(j + 1).some(function (o) { return s[o[0]]; });
      var r = esTope ? 4 : 0;
      g += '<path d="' + barraPath(x, y - h, ancho, h, r) + '" fill="' + se[2] + '"/>';
      y -= h + 2;
    });
    g += '<rect x="' + (i * paso) + '" y="0" width="' + paso + '" height="' + H + '" fill="transparent" data-tip="' + esc('Semana del ' + s.desde + ': ' + s.estudiante + ' de estudiantes, ' + s.asesor + ' de asesores, ' + s.otros + ' de coordinación') + '"/>';
    if (total) g += '<text x="' + (x + ancho / 2) + '" y="' + (y - 4) + '" text-anchor="middle" font-size="11" fill="#55546B">' + total + '</text>';
    g += '<text x="' + (x + ancho / 2) + '" y="' + (base + 18) + '" text-anchor="middle" font-size="11" fill="#8A89A0">' + esc(s.desde) + '</text>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="grafico" role="img" aria-label="Ingresos por semana">' + g + '</svg>' +
    '<div class="leyenda">' + SERIES_ING.map(function (s) { return '<span><i style="background:' + s[2] + '"></i>' + s[1] + '</span>'; }).join('') + '</div>';
}
/** Rectangulo con las esquinas superiores redondeadas (extremo de dato) y la base recta. */
function barraPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
}

var COLS_EST = [
  ['nombre', 'Estudiante'], ['avance', 'Avance', 1], ['asesorNombre', 'Asesor'], ['importo', 'Importó plan'], ['esenciales', 'Lo esencial', 1], ['revision', 'Revisión', 1], ['devueltas', 'Devueltas', 1],
  ['enRevision', 'Por revisar', 1], ['diasIngreso', 'Último ingreso', 1], ['dias', 'Días sin avanzar', 1], ['ingresos', 'Ingresos', 1], ['palabrasIA', 'IA generó', 1], ['seccionesAprobadas', 'Aprobadas', 1], ['humPct', 'Humanizado'], ['consultas', 'Consultas IA', 1], ['focoN', 'Texto propio'], ['rubrica', 'Rúbrica', 1], ['planV', 'Plan', 1], ['borrador', 'Borrador', 1]
];
var COLS_ASE = [
  ['nombre', 'Asesor'], ['estudiantes', 'Estudiantes', 1], ['diasIngreso', 'Último ingreso', 1], ['ingresos30', 'Ingresos (30 días)', 1], ['aprobaciones', 'Aprobaciones', 1], ['devoluciones', 'Devoluciones', 1],
  ['comentarios', 'Comentarios', 1], ['porRevisar', 'Esperan revisión', 1], ['esenciales', 'Avance medio', 1], ['revision', 'Revisión media', 1], ['inactivos', 'Inactivos 14+', 1]
];
var FILTROS_TAB = [['todos', 'Todos'], ['nunca', 'Nunca ingresaron'], ['inactivos', 'Sin avanzar 14+ días'], ['clave', 'Clave pendiente'], ['devueltas', 'Con secciones devueltas'], ['porRevisar', 'Esperan revisión'], ['sinPlan', 'Sin plan generado'], ['copiaIA', 'Texto casi igual a la IA'], ['humListo', 'Humanizado ✓'], ['humPend', 'Por humanizar'], ['importaron', 'Importaron su plan'], ['planOk', 'Plan aprobado'], ['planPend', 'Plan por aprobar'], ['solicitudes', 'Piden cambiar el plan']];

function ordenarLista(l, k, desc) {
  return l.slice().sort(function (a, b) {
    var x = a[k], y = b[k];
    if (x === '' || x === undefined) x = desc ? -1 : 1e9;
    if (y === '' || y === undefined) y = desc ? -1 : 1e9;
    if (typeof x === 'string' && typeof y === 'string') return desc ? y.localeCompare(x, 'es') : x.localeCompare(y, 'es');
    return desc ? (y - x) : (x - y);
  });
}
function ordenarTablero(tabla, k) {
  var o = S.tabOrden || {};
  var actual = o[tabla];
  o[tabla] = { k: k, desc: actual && actual.k === k ? !actual.desc : true };
  S.tabOrden = o;
  if (tabla === 'est') pintarTablaTablero(); else { var n = $('#tabla-asesores'); if (n) n.innerHTML = tablaAsesoresHtml(); }
}
function cabezaTabla(cols, tabla) {
  var o = (S.tabOrden || {})[tabla] || {};
  return '<thead><tr>' + cols.map(function (c) {
    var flecha = o.k === c[0] ? (o.desc ? ' ↓' : ' ↑') : '';
    return '<th class="' + (c[2] ? 'num' : '') + '"><button class="orden" data-a="ordenTablero" data-t="' + tabla + '" data-k="' + c[0] + '" aria-sort="' + (o.k === c[0] ? (o.desc ? 'descending' : 'ascending') : 'none') + '">' + esc(c[1]) + flecha + '</button></th>';
  }).join('') + '</tr></thead>';
}
function estudiantesFiltrados() {
  var t = S.tablero, f = S.filtroTab || 'todos', q = sinTildes(String(S.buscaTab || '').toLowerCase());
  var l = t.estudiantes.filter(function (x) {
    if (f === 'nunca' && x.ultimoIngreso) return false;
    if (f === 'inactivos' && !(x.dias !== '' && x.dias >= 14)) return false;
    if (f === 'clave' && x.pendienteClave !== 'SI') return false;
    if (f === 'devueltas' && !x.devueltas) return false;
    if (f === 'porRevisar' && !x.enRevision) return false;
    if (f === 'sinPlan' && x.plan) return false;
    if (f === 'humListo' && !(x.humanizacion && x.humanizacion.nivel === 'listo')) return false;
    if (f === 'humPend' && !(x.humanizacion && x.humanizacion.generados && x.humanizacion.nivel !== 'listo')) return false;
    if (f === 'importaron' && !x.importo) return false;
    if (f === 'planOk' && !(x.planEstado && x.planEstado.v)) return false;
    if (f === 'planPend' && x.planEstado && x.planEstado.v) return false;
    if (f === 'solicitudes' && !(x.planEstado && x.planEstado.sol === 'pendiente')) return false;
    if (f === 'copiaIA' && !(x.reelaboracion && x.reelaboracion.foco === 'rojo')) return false;
    if (q && sinTildes((x.nombre + ' ' + x.correo + ' ' + x.asesorNombre + ' ' + x.titulo).toLowerCase()).indexOf(q) < 0) return false;
    return true;
  });
  var o = (S.tabOrden || {}).est;
  return o ? ordenarLista(l, o.k, o.desc) : ordenarLista(l, 'nombre', false);
}
function tablaEstudiantesHtml() {
  var l = estudiantesFiltrados();
  var h = '<table class="tabla tab-tablero" style="min-width:1480px">' + cabezaTabla(COLS_EST, 'est') + '<tbody>';
  if (!l.length) h += '<tr><td colspan="' + COLS_EST.length + '" class="tenue" style="text-align:center;padding:18px">Nadie cumple este filtro.</td></tr>';
  l.forEach(function (x) {
    h += '<tr class="clic" data-a="verAlumno" data-correo="' + esc(x.correo) + '" tabindex="0"><td><b>' + esc(x.nombre) + '</b>' + (x.companeros && x.companeros.length ? '<div class="pequeno" style="color:var(--indigo-osc)">Tesis en pareja con ' + esc(x.companeros.join(', ')) + '</div>' : '') + '<div class="pequeno tenue recorte" title="' + esc(x.titulo) + '">' + esc(x.titulo || x.correo) + '</div></td>' +
      '<td class="num">' + barraAvanceMini(x.avance, x.humanizacion ? x.humanizacion.nivel : 'semilla') + '</td>' +
      '<td class="pequeno" title="' + esc(x.asesorNombre) + '">' + esc(x.asesorNombre ? x.asesorNombre.split(',')[0] : 'Sin asesor') + '</td>' +
      '<td>' + chipImportacion(x.importacion) + '</td>' +
      '<td class="num"><div class="mini"><i style="width:' + x.esenciales + '%"></i></div><span class="mono pequeno">' + esc(x.esencialesTxt || pct(x.esenciales)) + '</span></td>' +
      '<td class="num">' + (x.secciones ? '<span class="chip ' + (x.revisadas === x.secciones ? 'verde' : 'borde') + '">' + x.revisadas + ' / ' + x.secciones + '</span>' : '-') + '</td>' +
      '<td class="num">' + (x.devueltas ? '<span class="chip rojo">' + x.devueltas + '</span>' : '0') + '</td>' +
      '<td class="num">' + (x.enRevision ? '<span class="chip indigo">' + x.enRevision + '</span>' : '0') + '</td>' +
      '<td class="num">' + (x.ultimoIngreso ? '<span title="' + esc(x.ultimoIngreso) + '">' + (x.diasIngreso === 0 ? 'Hoy' : 'Hace ' + x.diasIngreso + ' d') + '</span>' : '<span class="chip ambar">Nunca</span>') + (x.pendienteClave === 'SI' ? '<div class="pequeno tenue">Clave pendiente</div>' : '') + '</td>' +
      '<td class="num">' + (x.dias !== '' && x.dias >= 14 ? '<span class="chip ambar">' + x.dias + '</span>' : diasTxt(x.dias)) + '</td>' +
      '<td class="num">' + x.ingresos + '</td><td class="num">' + (x.palabrasIA ? x.palabrasIA.toLocaleString('es-PE') + '<div class="pequeno tenue">palabras</div>' : '-') + '</td><td class="num">' + (x.seccionesAprobadas ? '<span class="chip ambar">' + x.seccionesAprobadas + '</span>' : '0') + (x.seccionesTotal ? '<div class="pequeno tenue">de ' + x.seccionesTotal + '</div>' : '') + '</td><td>' + nivelHtml(x.humanizacion, true) + '</td><td class="num">' + x.consultas + '</td><td>' + focoHtml(x.reelaboracion, true) + '</td><td class="num">' + (x.rubrica ? pct(x.rubrica) : '-') + '</td>' +
      '<td>' + chipPlan(x.planEstado) + (enlace(x.plan) ? '<div><a class="pequeno" href="' + esc(enlace(x.plan)) + '" target="_blank" rel="noopener" data-a="nada">Abrir el Word</a></div>' : '') + '</td><td class="num">' + (x.planEstado && x.planEstado.inf && x.planEstado.inf.total ? x.planEstado.inf.con + ' / ' + x.planEstado.inf.total + '<div class="pequeno tenue">' + (x.planEstado.inf.palabras || 0).toLocaleString('es-PE') + ' palabras</div>' : '-') + '</td></tr>';
  });
  return h + '</tbody></table>';
}
function pintarTablaTablero() {
  var n = $('#tabla-estudiantes');
  if (n) n.innerHTML = tablaEstudiantesHtml();
  $$('[data-a="filtroTablero"]').forEach(function (b) { b.classList.toggle('activo', b.getAttribute('data-f') === (S.filtroTab || 'todos')); });
  var c = $('#cuenta-tablero');
  if (c) c.textContent = estudiantesFiltrados().length + ' de ' + S.tablero.estudiantes.length;
}
function tablaAsesoresHtml() {
  var t = S.tablero, o = (S.tabOrden || {}).ase;
  var l = o ? ordenarLista(t.asesores, o.k, o.desc) : ordenarLista(t.asesores, 'nombre', false);
  var h = '<table class="tabla tab-tablero" style="min-width:1040px">' + cabezaTabla(COLS_ASE, 'ase') + '<tbody>';
  if (!l.length) h += '<tr><td colspan="' + COLS_ASE.length + '" class="tenue" style="text-align:center;padding:18px">Aún no hay asesores registrados.</td></tr>';
  l.forEach(function (a) {
    h += '<tr><td><b>' + esc(a.nombre) + '</b><div class="pequeno tenue">' + esc(a.correo) + '</div>' + (a.activo ? '' : '<span class="chip rojo">Inactivo</span>') + '</td>' +
      '<td class="num">' + a.estudiantes + (a.tesis !== a.estudiantes ? '<div class="pequeno tenue">' + a.tesis + ' tesis</div>' : '') + '</td>' +
      '<td class="num">' + (a.ultimoIngreso ? '<span title="' + esc(a.ultimoIngreso) + '">' + (a.diasIngreso === 0 ? 'Hoy' : 'Hace ' + a.diasIngreso + ' d') + '</span>' : '<span class="chip ambar">Nunca</span>') + (a.pendienteClave === 'SI' ? '<div class="pequeno tenue">Clave pendiente</div>' : '') + '</td>' +
      '<td class="num">' + a.ingresos30 + '<div class="pequeno tenue">' + a.ingresos + ' en total</div></td>' +
      '<td class="num">' + a.aprobaciones + '</td><td class="num">' + a.devoluciones + '</td><td class="num">' + a.comentarios + '</td>' +
      '<td class="num">' + (a.porRevisar ? '<span class="chip indigo">' + a.porRevisar + '</span>' : '0') + '</td>' +
      '<td class="num"><div class="mini"><i style="width:' + a.esenciales + '%"></i></div><span class="mono pequeno">' + pct(a.esenciales) + '</span></td>' +
      '<td class="num">' + pct(a.revision) + '</td><td class="num">' + (a.inactivos ? '<span class="chip ambar">' + a.inactivos + '</span>' : '0') + '</td></tr>';
  });
  return h + '</tbody></table>';
}

function vistaTablero() {
  var t = S.tablero;
  if (!t) return '<div class="vacio">Cargando el tablero…</div>';
  var k = t.kpi, n = Math.max(1, k.estudiantes);
  var h = '<div class="cabecera"><div class="fila entre"><h1>Tablero de tesistas</h1><div class="fila"><span class="pequeno tenue">Calculado: ' + esc(fechaCorta(t.generado)) + '</span><button class="btn" data-a="exportarTablero">' + IC.copiar + 'Copiar tabla</button><button class="btn primario" data-a="actualizarTablero">Actualizar</button></div></div>' +
    '<p>El avance de todos los tesistas y la actividad de los asesores. Se recalcula cada diez minutos; pulsa Actualizar para ver lo último. ' + (puedeDecidir() ? '' : 'Tu perfil es de solo lectura: puedes abrir cualquier expediente, pero no cambiar su contenido.') + '</p></div>';
  h += '<div class="kpis">' +
    kpiHtml(k.estudiantes, 'Tesistas', k.tesis + ' tesis · ' + k.asesores + ' asesores') +
    kpiHtml(pct(k.esenciales), 'Avance medio', 'preguntas esenciales respondidas') +
    kpiHtml(pct(k.revision), 'Revisión media', k.revisionCompleta + ' con la tesis revisada completa') +
    kpiHtml(k.activos7, 'Ingresaron en 7 días', Math.round(100 * k.activos7 / n) + ' % del total') +
    kpiHtml(k.nuncaIngresaron, 'Nunca ingresaron', k.clavePendiente + ' con clave inicial pendiente', k.nuncaIngresaron ? 'ambar' : '') +
    kpiHtml(k.inactivos14, 'Sin avanzar 14+ días', '', k.inactivos14 ? 'ambar' : '') +
    kpiHtml(k.porRevisar, 'Etapas por revisar', k.devueltas + ' secciones devueltas', k.porRevisar ? 'indigo' : '') +
    kpiHtml(k.planes, 'Planes generados', (SERVIDOR ? 'documento Word' : 'documento Word en Drive')) +
    kpiHtml(k.planesAprobados || 0, 'Planes aprobados', (k.solicitudesPlan || 0) + ' piden cambio · ' + (k.palabrasBorrador || 0).toLocaleString('es-PE') + ' palabras de borrador', k.solicitudesPlan ? 'ambar' : (k.planesAprobados ? 'verde' : '')) +
    kpiHtml(k.importaron || 0, 'Importaron su plan', 'avance general medio ' + pct(k.avance), k.importaron ? 'indigo' : '') +
    kpiHtml(k.consultas, 'Consultas a la IA', 'rúbrica media ' + pct(k.rubrica)) +
    kpiHtml((k.focoVerde || 0) + ' / ' + (k.conIA || 0), 'Reelaboraron la IA', (k.focoRojo || 0) + ' con texto casi igual a la IA', k.focoRojo ? 'ambar' : '') +
    '</div>';
  h += embudoHumHtml(t) + '\n';
  // Distribucion del avance
  var tramos = [['0 a 24 %', 0], ['25 a 49 %', 0], ['50 a 74 %', 0], ['75 a 100 %', 0]];
  t.estudiantes.forEach(function (x) { tramos[Math.min(3, Math.floor(x.esenciales / 25))][1]++; });
  var porAsesor = t.asesores.filter(function (a) { return a.estudiantes; }).sort(function (a, b) { return b.esenciales - a.esenciales; }).map(function (a) { return [a.nombre.split(',')[0], a.esenciales, a.estudiantes + ' estudiante' + (a.estudiantes > 1 ? 's' : '') + ', revisión ' + a.revision + ' %']; });
  var v = t.porVia || {};
  h += '<div class="rejilla graficos">' +
    '<div class="tarjeta"><h3>¿Cuánto llevan escrito?</h3><p class="pequeno tenue">Tesistas según el porcentaje de preguntas esenciales respondidas.</p>' + barrasH(tramos.map(function (x) { return [x[0], x[1]]; }), 0, '') + '</div>' +
    '<div class="tarjeta"><h3>Avance medio por asesor</h3><p class="pequeno tenue">Promedio de lo esencial de sus estudiantes.</p>' + (porAsesor.length ? barrasH(porAsesor, 100, ' %') : '<p class="tenue">Sin asesores con estudiantes asignados.</p>') + '</div>' +
    '<div class="tarjeta"><h3>Ingresos por semana</h3><p class="pequeno tenue">' + (t.accesosDesde ? 'Registrados desde el ' + esc(fechaCorta(t.accesosDesde)) + '.' : 'El registro de ingresos empieza con esta versión: se llenará a medida que entren.') + '</p>' + columnasIngresos(t.semanas) + '</div>' +
    '<div class="tarjeta"><h3>Consultas a la IA por modo</h3><p class="pequeno tenue">Cómo usan el asistente: con la clave del curso, con su propia clave, Gemini Nano o copiando y pegando.</p>' + barrasH([['Asistente del curso', v.curso || 0], ['Clave propia', v.propia || 0], ['Gemini Nano', v.nano || 0], ['Copiar y pegar', v.copiar || 0]], 0, '') + '</div>' +
    '</div>';
  h += '<div class="tarjeta" style="padding:14px 10px;margin-top:16px"><div class="fila entre" style="padding:0 8px 10px"><h2>Tesistas <span class="pequeno tenue" id="cuenta-tablero" style="font-weight:500">' + estudiantesFiltrados().length + ' de ' + t.estudiantes.length + '</span></h2><input id="buscar-tablero" type="search" placeholder="Buscar estudiante, asesor o título" value="' + esc(S.buscaTab || '') + '" style="max-width:300px" aria-label="Buscar en el tablero"></div>' +
    '<div class="nav filtros" style="padding:0 8px 10px" aria-label="Filtros">' + FILTROS_TAB.map(function (f) { return '<button data-a="filtroTablero" data-f="' + f[0] + '" class="' + ((S.filtroTab || 'todos') === f[0] ? 'activo' : '') + '">' + f[1] + '</button>'; }).join('') + '</div>' +
    '<div class="desliza" id="tabla-estudiantes">' + tablaEstudiantesHtml() + '</div><p class="pequeno tenue" style="padding:8px 8px 0">Pulsa un encabezado para ordenar. Pulsa una fila para abrir el expediente.</p></div>';
  h += '<div class="tarjeta" style="padding:14px 10px;margin-top:16px"><div style="padding:0 8px 10px"><h2>Asesores</h2><p class="pequeno tenue">Acceso y actividad: ingresos a la aplicación, decisiones sobre etapas y secciones, y comentarios a sus estudiantes.</p></div><div class="desliza" id="tabla-asesores">' + tablaAsesoresHtml() + '</div></div>';
  return h;
}

/** Copia la tabla de tesistas como texto separado por tabuladores, para pegarla en una hoja de cálculo. */
function exportarTablero() {
  var cab = ['Estudiante', 'Correo', 'Asesor', 'Pareja', 'Título', 'Lo esencial %', 'Secciones revisadas', 'Secciones totales', 'Devueltas', 'Etapas por revisar', 'Último ingreso', 'Días sin avanzar', 'Ingresos', 'Consultas IA', 'Textos IA reelaborados', 'Rúbrica %', 'Plan'];
  var filas = estudiantesFiltrados().map(function (x) {
    return [x.nombre, x.correo, x.asesorNombre, (x.companeros || []).join('; '), x.titulo, x.esenciales, x.revisadas, x.secciones, x.devueltas, x.enRevision, x.ultimoIngreso || 'Nunca', x.dias, x.ingresos, x.consultas, x.reelaboracion && x.reelaboracion.total ? x.reelaboracion.reelaborados + '/' + x.reelaboracion.total : '', x.rubrica, x.plan].map(function (v) { return String(v === undefined ? '' : v).replace(/[\t\n\r]+/g, ' '); }).join('\t');
  });
  var texto = [cab.join('\t')].concat(filas).join('\n');
  modal('<h2>Copiar la tabla</h2><p class="tenue">' + filas.length + ' filas (con el filtro actual). Cópialas y pégalas en Google Sheets o Excel.</p><textarea id="tsv-tablero" rows="8" readonly style="margin-top:10px;font-family:var(--mono);font-size:12px;white-space:pre">' + esc(texto) + '</textarea><div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cerrar</button><button class="btn primario" id="copiar-tsv">' + IC.copiar + 'Copiar</button></div>', true);
  $('#copiar-tsv').addEventListener('click', function () {
    copiarTexto(texto, $('#tsv-tablero')).then(function (ok) { toast(ok ? 'Tabla copiada: pégala en una hoja de cálculo.' : 'Selecciona el texto y cópialo con Ctrl+C.', ok ? 'bien' : ''); });
  });
}

// Información al pasar el cursor sobre las barras
(function () {
  var tip = null;
  document.addEventListener('mouseover', function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-tip]') : null;
    if (!el) { if (tip) tip.hidden = true; return; }
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
    tip.textContent = el.getAttribute('data-tip');
    tip.hidden = false;
  });
  document.addEventListener('mousemove', function (ev) {
    if (!tip || tip.hidden) return;
    var x = Math.min(ev.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    tip.style.left = x + 'px';
    tip.style.top = (ev.clientY + 16) + 'px';
  });
})();

/** Embudo lúdico: lo que generó la IA, lo revisado, lo aprobado y lo ya humanizado; con podio y niveles. */
function embudoHumHtml(t) {
  var k = t.kpi, p = function (a, b) { return b ? Math.round(100 * a / b) : 0; };
  var etapas = [
    { ic: IC_HUM.chispa, c: 'violeta', n: (k.humGenerados || 0), u: 'textos', t: 'La IA generó', d: (k.palabrasIA || 0).toLocaleString('es-PE') + ' palabras de borrador y propuestas', pct: 100 },
    { ic: IC_HUM.ojo, c: 'cielo', n: (k.secRevisadas || 0), u: 'de ' + (k.secTotal || 0), t: 'Revisado por los tesistas', d: p(k.secRevisadas, k.secTotal) + ' % de las secciones', pct: p(k.secRevisadas, k.secTotal) },
    { ic: IC_HUM.sello, c: 'ambar', n: (k.secAprobadas || 0), u: 'de ' + (k.secTotal || 0), t: 'Aprobado por el asesor', d: p(k.secAprobadas, k.secTotal) + ' % de las secciones', pct: p(k.secAprobadas, k.secTotal) },
    { ic: IC_HUM.listo, c: 'verde', n: (k.humListos || 0), u: 'de ' + (k.humGenerados || 0), t: 'Humanizado y listo', d: (k.palabrasHumanas || 0).toLocaleString('es-PE') + ' palabras escritas a mano · ' + (k.humListosEst || 0) + ' tesistas al 100 %', pct: p(k.humListos, k.humGenerados) }
  ];
  var h = '<div class="tarjeta embudo-hum"><div class="fila entre"><div><h2 style="margin:0">De la IA a la voz del tesista</h2><p class="pequeno tenue" style="margin-top:4px">Cuánto texto generó la IA, cuánto se revisó y aprobó, y cuánto ya está reescrito y verificado con palabras propias.</p></div></div><div class="embudo">';
  etapas.forEach(function (e, i) {
    h += (i ? '<span class="embudo-flecha" aria-hidden="true">' + IC.flecha + '</span>' : '') + '<div class="embudo-paso ' + e.c + '" data-tip="' + esc(e.t + ': ' + e.d) + '"><span class="hum-medalla ' + e.c + '">' + e.ic + '</span><div class="embudo-n"><b>' + e.n.toLocaleString('es-PE') + '</b><small>' + esc(e.u) + '</small></div><div class="embudo-t">' + esc(e.t) + '</div><div class="hum-barra"><i class="' + e.c + '" style="width:' + e.pct + '%"></i></div><div class="pequeno tenue">' + esc(e.d) + '</div></div>';
  });
  h += '</div>';
  // Podio y niveles
  var con = t.estudiantes.filter(function (x) { return x.humanizacion && x.humanizacion.generados; });
  var podio = con.slice().sort(function (a, b) { return (b.humanizacion.pct - a.humanizacion.pct) || (b.humanizacion.palabrasHumanas - a.humanizacion.palabrasHumanas); }).filter(function (x) { return x.humanizacion.listos > 0; }).slice(0, 3);
  var niveles = ['semilla', 'brote', 'camino', 'casi', 'listo'].map(function (n) { return { n: n, c: con.filter(function (x) { return x.humanizacion.nivel === n; }).length }; });
  h += '<div class="rejilla dos" style="margin-top:16px;gap:16px"><div><h3>Podio de la humanización</h3>' + (podio.length ? '<div class="podio">' + podio.map(function (x, i) {
    return '<div class="podio-p p' + (i + 1) + '" data-a="verAlumno" data-correo="' + esc(x.correo) + '"><span class="medalla m' + (i + 1) + '">' + (i + 1) + '</span><b>' + esc(x.nombre.split(',')[0]) + '</b><small>' + x.humanizacion.pct + ' % · ' + x.humanizacion.palabrasHumanas + ' XP</small></div>';
  }).join('') + '</div>' : '<p class="tenue pequeno">Aún nadie humanizó un texto. El primero que lo haga sube al podio.</p>') + '</div>' +
    '<div><h3>Tesistas por nivel</h3><div class="niveles-fila">' + niveles.map(function (x) { return '<div class="nivel-caja ' + NIVEL_HUM[x.n].c + '"><span class="hum-medalla ' + NIVEL_HUM[x.n].c + '">' + IC_HUM[x.n] + '</span><b>' + x.c + '</b><small>' + esc(NIVEL_HUM[x.n].n) + '</small></div>'; }).join('') + '</div></div></div>';
  return h + '</div>';
}

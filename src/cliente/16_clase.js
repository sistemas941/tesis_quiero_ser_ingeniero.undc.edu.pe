// ------------------------------------------------------------------ Mi clase: el avance del grupo y los tres primeros en cada cosa
// Es la primera pantalla del estudiante: ver como avanza la promocion anima a seguir. Solo se muestran nombres cortos.

/** Barra de avance con el color del nivel de humanizacion (semilla, brote, en camino, casi listo, listo). */
function barraAvanceHtml(pct, nivel, conTexto) {
  pct = Math.max(0, Math.min(100, Math.round(pct || 0)));
  var nv = NIVEL_HUM[nivel] ? nivel : 'semilla';
  return '<div class="barra-av nv-' + nv + '" role="img" aria-label="Avance ' + pct + ' %, nivel ' + esc(NIVEL_HUM[nv].n) + '"><i style="width:' + Math.max(pct, 2) + '%"></i></div>' +
    (conTexto ? '<div class="barra-av-pie"><b>' + pct + ' %</b><span class="nivel ' + NIVEL_HUM[nv].c + '">' + (IC_HUM[nv] || IC_HUM.semilla) + esc(NIVEL_HUM[nv].n) + '</span></div>' : '');
}
/** Version corta para tablas de paneles. */
function barraAvanceMini(pct, nivel) {
  var nv = NIVEL_HUM[nivel] ? nivel : 'semilla';
  pct = Math.round(pct || 0);
  return '<span class="av-mini nv-' + nv + '" title="Avance ' + pct + ' % · ' + esc(NIVEL_HUM[nv].n) + '" data-tip="Avance ' + pct + ' % · ' + esc(NIVEL_HUM[nv].n) + '"><i style="width:' + Math.max(pct, 3) + '%"></i></span><span class="av-mini-n">' + pct + '%</span>';
}
/** Avance del propio estudiante con lo que ya esta en el navegador (mismo calculo que el servidor). */
function miAvance() {
  var d = S.d, h = d.humanizacion || {}, p = progresoSencillo();
  var r = S.vistaDoc && S.vistaDoc.revision ? S.vistaDoc.revision : null;
  var esen = p.total ? p.llenas / p.total : 0, rev = r && r.total ? r.revisadas / r.total : 0, hum = h.generados ? (h.pct || 0) / 100 : 0;
  return { pct: Math.round(100 * (esen + rev + hum) / 3), nivel: h.nivel || 'semilla' };
}

function vistaClase() {
  var nombre = String((S.d && S.d.perfil.nombre) || '').split(',').pop().trim().split(' ')[0];
  return '<div class="cabecera"><h1>' + (nombre ? '¡Hola, ' + esc(nombre) + '!' : 'Mi clase') + '</h1><p>Así va tu promoción. Cada sección que escribes, revisas y humanizas te acerca a la sustentación… y al podio.</p></div>' +
    '<div id="clase">' + (S.clase ? claseHtml(S.clase) : '<div class="pensando" style="padding:30px 10px"><i></i><span>Juntando el avance de tu clase…</span></div>') + '</div>';
}
function despuesDeClase() {
  llamar('clase').then(function (c) { S.clase = c; var n = $('#clase'); if (n && S.vista === 'clase') n.innerHTML = claseHtml(c); })
    .catch(function (e) { var n = $('#clase'); if (n && !S.clase) n.innerHTML = '<div class="aviso rojo">No se pudo cargar el avance de la clase: ' + esc(e.message) + '</div>'; });
}
var MEDALLA_CAT = { av: IC_HUM.camino, xp: IC_HUM.pluma, rv: IC_HUM.ojo, ap: IC_HUM.sello, bi: IC.libro };
var COLOR_CAT = { av: 'indigo', xp: 'violeta', rv: 'cielo', ap: 'ambar', bi: 'verde' };
function claseHtml(c) {
  var yo = c.yo || {}, hum = S.d.humanizacion || {};
  var pend = (hum.campos || []).filter(function (x) { return x.estado !== 'listo' && !x.noAplica; }).length;
  var h = '<div class="clase-cabeza">';
  // Mi avance
  h += '<div class="tarjeta clase-yo"><div class="fila entre"><h2 style="margin:0">Tu avance</h2>' + (yo.puesto ? '<span class="puesto">' + IC.trofeo + 'Puesto <b>' + yo.puesto + '</b> de ' + c.n + '</span>' : '') + '</div>' +
    '<div style="margin:14px 0 6px">' + barraAvanceHtml(yo.avance, yo.nivel, true) + '</div>' +
    '<p class="pequeno tenue">Se calcula con lo esencial que escribiste, las secciones que revisaste y los textos que humanizaste. El color es tu nivel de humanización.</p>' +
    '<div class="fila" style="margin-top:12px"><button class="btn primario" data-a="ir" data-v="tesis">' + IC.pluma + 'Seguir con mi tesis</button>' +
    (pend ? '<button class="btn" data-a="humanizarSiguiente">' + IC_HUM.pluma + 'Humanizar (' + pend + ' por hacer)</button>' : '') +
    '<button class="btn fantasma" data-a="importar">' + IC.subir + 'Importar mi plan</button></div></div>';
  // La clase
  h += '<div class="tarjeta clase-grupo"><h2 style="margin:0">Tu clase</h2><div class="clase-cifras"><div><b>' + c.n + '</b><span>tesistas</span></div><div><b>' + c.promedio + '%</b><span>avance promedio</span></div><div><b>' + (c.palabras || 0).toLocaleString('es-PE') + '</b><span>palabras con voz propia</span></div><div><b>' + (c.revisadas || 0) + '</b><span>secciones revisadas</span></div></div>' +
    '<div class="pista" aria-label="Avance de cada tesista de la clase">' + (c.distribucion || []).map(function (v) { return '<i style="left:' + v + '%"></i>'; }).join('') + '<em style="left:' + (yo.avance || 0) + '%" title="Tú"><span>Tú</span></em><s style="left:' + c.promedio + '%" title="Promedio"></s></div><div class="pista-ej"><span>0 %</span><span>Promedio ' + c.promedio + ' %</span><span>100 %</span></div>' +
    '<div class="niveles-fila" style="margin-top:12px">' + ['semilla', 'brote', 'camino', 'casi', 'listo'].map(function (n) { return '<div class="nivel-caja ' + NIVEL_HUM[n].c + (yo.nivel === n ? ' mio' : '') + '"><span class="hum-medalla ' + NIVEL_HUM[n].c + '">' + IC_HUM[n] + '</span><b>' + (c.niveles[n] || 0) + '</b><small>' + esc(NIVEL_HUM[n].n) + '</small></div>'; }).join('') + '</div></div>';
  h += '</div>';
  // Los tres primeros en cada cosa
  h += '<h2 style="margin:22px 0 10px">' + IC.trofeo + ' Los tres primeros</h2><div class="rejilla-podios">';
  c.categorias.forEach(function (cat) {
    var col = COLOR_CAT[cat.k] || 'indigo';
    h += '<div class="tarjeta podio-cat ' + col + '"><div class="fila" style="gap:8px;flex-wrap:nowrap"><span class="hum-medalla ' + col + '">' + (MEDALLA_CAT[cat.k] || '') + '</span><div><b>' + esc(cat.t) + '</b><small class="tenue" style="display:block;font-size:12px">' + esc(cat.d) + '</small></div></div><ol>';
    if (!cat.top.length) h += '<li class="vacio-p">Nadie todavía: ¡sé el primero!</li>';
    cat.top.forEach(function (x, i) { h += '<li class="' + (x.yo ? 'yo' : '') + '"><span class="medalla m' + (i + 1) + '">' + (i + 1) + '</span><span class="crece">' + esc(x.n) + (x.yo ? ' <span class="chip indigo">Tú</span>' : '') + '</span><b>' + fmtCat(x.v, cat.u) + '</b></li>'; });
    h += '</ol><div class="podio-mio">' + (cat.mio.puesto ? 'Tú: puesto <b>' + cat.mio.puesto + '</b> · ' + fmtCat(cat.mio.v, cat.u) : '') + '</div></div>';
  });
  h += '</div><p class="pequeno tenue" style="margin-top:12px">Se actualiza cada diez minutos. Solo se muestra el nombre y la inicial del apellido de los tres primeros.</p>';
  return h;
}
function fmtCat(v, u) { return u === '%' ? v + ' %' : (Number(v) || 0).toLocaleString('es-PE') + ' ' + u; }

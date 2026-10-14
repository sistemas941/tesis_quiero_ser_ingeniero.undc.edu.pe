// ------------------------------------------------------------------ revision por bloques (asesor) y reglamento de similitud
/** Secciones agrupadas por capitulo, en el orden del documento. */
function bloquesRevision() {
  var orden = [], por = {};
  secciones().forEach(function (s) {
    var b = s.bloque || 'Otras secciones';
    if (!por[b]) { por[b] = { nombre: b, secs: [], excluido: !!s.excluida }; orden.push(por[b]); }
    por[b].secs.push(s);
  });
  return orden;
}
function nombreBloque(n) { n = String(n || ''); return n.charAt(0) + n.substring(1).toLowerCase(); }

/** Tarjeta del asesor: aprobar o devolver por capitulos, sin abrir seccion por seccion. */
function bloquesHtml() {
  var bl = bloquesRevision();
  if (!bl.length) return '';
  var decide = puedeDecidir();
  var listasEst = secciones().filter(function (s) { return s.estado === 'revisado' && s.por !== 'asesor'; });
  var h = '<div class="tarjeta bloques-rev"><div class="fila entre"><div><h2 style="margin:0">Revisión por bloques</h2><p class="pequeno tenue" style="margin-top:4px">' + (decide ? 'Aprueba o devuelve un capítulo completo con un solo comentario. Si quieres, abre cada sección más abajo.' : 'Avance de la revisión por capítulos.') + '</p></div>' +
    (decide && listasEst.length ? '<button class="btn primario" data-a="aprobarRevisadas">' + IC.check + 'Aprobar lo que ya revisó (' + listasEst.length + ')</button>' : '') + '</div><div class="bloques-lista">';
  bl.forEach(function (b, i) {
    var n = b.secs.length, rev = b.secs.filter(function (s) { return s.estado === 'revisado'; }).length, apr = b.secs.filter(function (s) { return s.estado === 'revisado' && s.por === 'asesor'; }).length, dev = b.secs.filter(function (s) { return s.estado === 'devuelto'; }).length;
    var todo = apr === n;
    h += '<div class="bloque' + (todo ? ' hecho' : '') + '"><div class="crece"><b>' + esc(nombreBloque(b.nombre)) + '</b><div class="pequeno tenue">' + n + (n > 1 ? ' secciones' : ' sección') + ' · ' + rev + ' revisada' + (rev === 1 ? '' : 's') + ' por el estudiante · ' + apr + ' aprobada' + (apr === 1 ? '' : 's') + (dev ? ' · <span style="color:var(--rojo)">' + dev + ' devuelta' + (dev > 1 ? 's' : '') + '</span>' : '') + '</div>' +
      '<div class="barra-prog verde" style="height:6px;margin-top:6px"><i style="width:' + Math.round(100 * apr / Math.max(1, n)) + '%"></i></div>' +
      (b.excluido ? '<span class="chip borde" style="margin-top:6px" title="Reglamento de Similitud y Originalidad, Art. 8 y 12">Fuera del análisis de similitud</span>' : '') + '</div>' +
      (decide ? '<div class="fila" style="flex:none">' + (todo ? '<span class="chip verde">' + IC.check + 'Aprobado</span>' : '<button class="btn chico" data-a="aprobarBloque" data-i="' + i + '">' + IC.check + 'Aprobar bloque</button>') + '<button class="btn chico fantasma" data-a="devolverBloque" data-i="' + i + '">Devolver</button></div>' : (todo ? '<span class="chip verde">' + IC.check + 'Aprobado</span>' : '')) + '</div>';
  });
  return h + '</div></div>';
}
function pintarBloques() { var n = $('#bloques-rev'); if (n && S.vista === 'alumno') n.innerHTML = bloquesHtml(); }
function revisarBloqueEn(ids, decision, comentario, nombre, btn) {
  var fin = ocupar(btn, decision === 'aprobar' ? 'Aprobando' : 'Devolviendo');
  return llamar('revisarBloque', { correo: S.alumno.perfil.correo, ids: ids, decision: decision, comentario: comentario || '', bloque: nombre }).then(function (v) {
    cerrarModal(); ponerVista(v); pintarBloques(); cargarReglamento();
    toast(decision === 'aprobar' ? ids.length + ' sección(es) aprobadas.' : 'Bloque devuelto al estudiante.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}
function aprobarBloque(i, btn) {
  var b = bloquesRevision()[i];
  if (!b) return;
  revisarBloqueEn(b.secs.filter(function (s) { return !(s.estado === 'revisado' && s.por === 'asesor'); }).map(function (s) { return s.id; }), 'aprobar', '', b.nombre, btn);
}
function aprobarRevisadas(btn) {
  var ids = secciones().filter(function (s) { return s.estado === 'revisado' && s.por !== 'asesor'; }).map(function (s) { return s.id; });
  if (ids.length) revisarBloqueEn(ids, 'aprobar', '', 'lo revisado por el estudiante', btn);
}
function devolverBloque(i) {
  var b = bloquesRevision()[i];
  if (!b) return;
  modal('<h2>Devolver: ' + esc(nombreBloque(b.nombre)) + '</h2><p class="tenue">Tu comentario aparecerá en rojo en las ' + b.secs.length + ' secciones de este bloque hasta que el estudiante las corrija. Basta con una indicación general.</p>' +
    '<textarea id="dev-bloque" rows="4" style="margin-top:10px" placeholder="Qué debe corregir en este capítulo"></textarea><div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn peligro" data-a="confirmarDevolverBloque" data-i="' + i + '">Devolver el bloque</button></div>');
}
function confirmarDevolverBloque(i, btn) {
  var b = bloquesRevision()[i];
  if (b) revisarBloqueEn(b.secs.map(function (s) { return s.id; }), 'devolver', $('#dev-bloque').value, b.nombre, btn);
}

// ------------------------------------------------------------------ Reglamento de Similitud y Originalidad
var REG_IC = { ok: ['verde', 'Cumple'], alerta: ['ambar', 'Revisar'], no_aplica: ['borde', 'Puede no aplicar'] };
function reglamentoHtml(r) {
  var simOk = r.similitud <= r.norma.umbral;
  var h = '<details class="tarjeta reglamento"' + (r.alertas ? ' open' : '') + '><summary><div class="fila entre" style="flex-wrap:nowrap"><div><b>' + IC.rubrica + ' ' + esc(r.norma.nombre) + '</b><div class="pequeno tenue">' + esc(r.norma.norma) + ' · tesis de pregrado: hasta ' + r.norma.umbral + ' % de similitud</div></div>' +
    '<span class="chip ' + (r.alertas ? 'ambar' : 'verde') + '">' + (r.alertas ? r.alertas + ' por revisar' : IC.check + 'Cumple') + '</span></div></summary>';
  h += '<div class="reg-medidor"><div class="reg-barra"><i class="' + (simOk ? 'ok' : 'mal') + '" style="width:' + Math.min(100, r.similitud * 2) + '%"></i><em style="left:' + (r.norma.umbral * 2) + '%"><span>Máx. ' + r.norma.umbral + ' %</span></em></div><div><b>' + r.similitud + ' %</b><span class="pequeno tenue">similitud estimada con el texto generado</span></div></div>';
  h += '<ul class="reg-items">' + r.items.map(function (x) {
    var e = REG_IC[x.estado] || REG_IC.ok;
    return '<li class="' + x.estado + '"><span class="chip ' + e[0] + '">' + (x.estado === 'ok' ? IC.check : (x.estado === 'alerta' ? IC.alerta : '')) + e[1] + '</span><div><b>' + esc(x.t) + '</b> <span class="pequeno tenue">' + esc(x.art) + '</span><div class="pequeno">' + esc(x.d) + '</div></div></li>';
  }).join('') + '</ul>';
  h += '<div class="aviso gris pequeno" style="margin-top:10px"><b>Es posible que estos ítems de tu tesis no apliquen según el reglamento:</b> ' + esc(r.excluidas.join(', ')) + (r.noAplica.length ? ' y lo que va en anexos (' + esc(r.noAplica.join(', ')) + ')' : '') + '. El Art. 12 los excluye del análisis de similitud, igual que las coincidencias de ' + r.norma.palabras + ' palabras o menos y las citas bien referenciadas.</div>' +
    '<p class="pequeno tenue" style="margin-top:8px">Es una estimación interna frente a los textos que generó la aplicación; no reemplaza el informe del software institucional de similitud (Art. 14).</p></details>';
  return h;
}
function cargarReglamento() {
  var n = $('#reglamento');
  if (!n) return;
  var p = S.vista === 'alumno' ? llamar('reglamentoDe', { correo: S.alumno.perfil.correo }) : llamar('reglamento');
  p.then(function (r) { var m = $('#reglamento'); if (m) m.innerHTML = reglamentoHtml(r); }).catch(function () { var m = $('#reglamento'); if (m) m.innerHTML = ''; });
}

// ------------------------------------------------------------------ Mi ruta
function siguienteEtapa(d) {
  d = d || S.d;
  for (var i = 0; i < d.etapas.length; i++) {
    var a = d.avance[d.etapas[i].id];
    if (!a || a.estado !== 'aprobada') {
      if (a && a.estado === 'en_revision' && d.config.AVANZAR_EN_REVISION === 'SI' && i < d.etapas.length - 1) continue;
      return d.etapas[i];
    }
  }
  return null;
}

function mapaSvg(d) {
  var n = d.etapas.length;
  var W = 1000, y = 54, x0 = 70, paso = n > 1 ? (W - 2 * x0) / (n - 1) : 0;
  var s = '<svg viewBox="0 0 ' + W + ' 132" role="img" aria-label="Mapa de la ruta de tesis">';
  var i, x;
  for (i = 0; i < n - 1; i++) {
    var hecho = d.avance[d.etapas[i].id] && d.avance[d.etapas[i].id].estado === 'aprobada';
    s += '<line x1="' + (x0 + i * paso + 24) + '" y1="' + y + '" x2="' + (x0 + (i + 1) * paso - 24) + '" y2="' + y + '" stroke="' + (hecho ? '#5B4FE8' : '#D5D4E2') + '" stroke-width="3" stroke-linecap="round"' + (hecho ? '' : ' stroke-dasharray="2 8"') + '/>';
  }
  for (i = 0; i < n; i++) {
    var e = d.etapas[i], st = estadoEtapa(e.id, d);
    x = x0 + i * paso;
    var relleno = '#FFFFFF', borde = '#5B4FE8', tinta = '#4338CA', dentro = '';
    if (st.clave === 'aprobada') { relleno = '#0F7A55'; borde = '#0F7A55'; dentro = '<path d="M' + (x - 8) + ' ' + (y + 1) + 'l5.5 5.5L' + (x + 9) + ' ' + (y - 6) + '" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'; }
    else if (st.clave === 'en_revision') { relleno = '#EEECFD'; }
    else if (st.clave === 'devuelta' || st.clave === 'observada') { relleno = '#FCE8EA'; borde = '#C22D39'; tinta = '#C22D39'; }
    else if (st.clave === 'en_curso') { relleno = '#FDF1DC'; borde = '#A85A06'; tinta = '#A85A06'; }
    else if (st.clave === 'bloqueada') { relleno = '#EFEFF5'; borde = '#D5D4E2'; tinta = '#8A89A0'; }
    s += '<g data-a="abrirEtapa" data-e="' + esc(e.id) + '" style="cursor:pointer"><title>' + esc(e.nombre + ': ' + st.texto) + '</title>' +
      '<circle cx="' + x + '" cy="' + y + '" r="22" fill="' + relleno + '" stroke="' + borde + '" stroke-width="2.5"/>' +
      (dentro || '<text x="' + x + '" y="' + (y + 5.5) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600" fill="' + tinta + '">' + esc(e.id) + '</text>') +
      '<text x="' + x + '" y="' + (y + 46) + '" text-anchor="middle" font-size="14" font-weight="600" fill="#1B1A2E">' + esc(e.nombre) + '</text>' +
      '<text x="' + x + '" y="' + (y + 64) + '" text-anchor="middle" font-size="11.5" fill="#8A89A0">' + esc(st.clave === 'aprobada' ? 'Aprobada' : st.texto) + '</text></g>';
  }
  return s + '</svg>';
}

function anillo(pct) {
  var r = 30, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  return '<svg viewBox="0 0 76 76" role="img" aria-label="' + p + ' por ciento"><circle cx="38" cy="38" r="' + r + '" fill="none" stroke="#EFEFF5" stroke-width="8"/>' +
    (p > 0 ? '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="#5B4FE8" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (c * p / 100).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 38 38)"/>' : '') +
    '<text x="38" y="43" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600" fill="#1B1A2E">' + Math.round(p) + '%</text></svg>';
}

function conteoBiblioteca(bib) {
  var ant = bib.filter(function (b) { return b.uso === 'antecedente'; });
  return {
    total: bib.length,
    articulos: ant.filter(function (b) { return b.tipo === 'articulo' && b.verificado !== 'no'; }).length,
    tesis: ant.filter(function (b) { return b.tipo === 'tesis'; }).length
  };
}

function filaEtapa(e, d, soloLectura) {
  var st = estadoEtapa(e.id, d);
  var color = st.clave === 'aprobada' ? 'verde' : (st.clave === 'en_revision' ? 'indigo' : (st.clave === 'devuelta' || st.clave === 'observada' ? 'rojo' : (st.clave === 'en_curso' ? 'ambar' : '')));
  var cerrada = st.clave === 'bloqueada';
  return '<div class="etapa-fila' + (cerrada ? ' cerrada' : '') + '"><div class="num ' + color + '">' + esc(e.id) + '</div>' +
    '<div><div class="fila" style="gap:8px"><h3>' + esc(e.nombre) + '</h3>' + chip(st) + (e.requiere_asesor ? '<span class="chip borde" title="Al cerrarla pasa a tu asesor">Visto bueno del asesor</span>' : '') + '</div><div class="prod">' + esc(e.producto) + '</div></div>' +
    '<div class="acc">' + (cerrada ? '<span class="pequeno tenue">Aprueba primero la etapa anterior</span>' : '<button class="btn ' + (st.clave === 'aprobada' ? '' : 'primario') + '" data-a="' + (soloLectura ? 'verEtapaAlumno' : 'abrirEtapa') + '" data-e="' + esc(e.id) + '">' + (st.clave === 'aprobada' || soloLectura ? 'Ver' : (st.clave === 'nueva' ? 'Empezar' : 'Continuar')) + IC.flecha + '</button>') + '</div></div>';
}

function vistaRuta() {
  var d = S.d, sig = siguienteEtapa(d), cb = conteoBiblioteca(d.biblioteca), rr = d.resultadoRubrica;
  var cuota = parseInt(d.config.CUOTA_DIARIA, 10) || 40;
  var nombre = String(d.perfil.nombre || '').split(' ')[0];
  var h = '<div class="cabecera"><h1>Hola, ' + esc(nombre) + '</h1><p>' + (S.exp.titulo ? esc(S.exp.titulo) : (S.exp.tema_oracion ? esc(S.exp.tema_oracion) : 'Esta es tu ruta. Cada etapa deja un producto y se cierra cuando pasa la revisión; así llegas al plan de tesis sin vacíos.')) + '</p><div class="fila" style="margin-top:10px"><button class="btn chico" data-a="importar">' + IC.subir + 'Importar mi plan de tesis</button></div></div>';
  var via = viaIA(), m = modosIA();
  if (!iaDisponible()) h += '<div class="aviso ambar" style="margin-bottom:16px">El asistente de IA aún no está configurado. Puedes avanzar: las etapas se revisarán solo con las reglas automáticas. Avisa a tu profesor.</div>';
  else if (!via || (d.config.IA_ACTIVA !== 'SI' && m.indexOf('curso') >= 0 && !viaGuardada())) h += '<div class="aviso" style="margin-bottom:16px"><div class="fila entre"><span>El asistente del curso aún no tiene clave. Puedes usar ' + [m.indexOf('propia') >= 0 ? 'tu propia clave gratuita de Gemini' : '', m.indexOf('copiar') >= 0 ? 'el modo de copiar y pegar con el asistente que ya tienes' : ''].filter(function (x) { return x; }).join(' o ') + '.</span><button class="btn chico" data-a="modoIA">Elegir cómo usar el asistente</button></div></div>';
  if (enlace(d.config.BRUJULA_URL) && !String(S.exp.tema_oracion || '').trim()) h += '<div class="aviso" style="margin-bottom:16px"><div class="fila entre"><span><b>¿Aún no sabes por dónde empezar?</b> La Brújula de Tesis te ayuda a ubicar tu área y tu línea; la Orientación te explica las cuatro preguntas que toda tesis responde.</span><span class="fila"><a class="btn chico primario" href="' + esc(enlace(d.config.BRUJULA_URL)) + '" target="_blank" rel="noopener">' + IC.brujula + 'Abrir la Brújula</a><button class="btn chico" data-a="ir" data-v="orientacion">Ver la orientación</button></span></div></div>';
  h += '<div class="tarjeta mapa" style="margin-bottom:16px">' + mapaSvg(d) + '</div>';
  h += '<div class="rejilla dos"><div class="etapas-lista">' + d.etapas.map(function (e) { return filaEtapa(e, d, false); }).join('') + '</div><aside class="pila">';
  h += '<div class="tarjeta"><h3>Tu siguiente paso</h3>' + (sig ? '<p class="tenue" style="margin-bottom:12px">Etapa ' + esc(sig.id) + ': ' + esc(sig.nombre) + '. ' + esc(sig.instruccion) + '</p><button class="btn primario" data-a="abrirEtapa" data-e="' + esc(sig.id) + '">Ir a la etapa' + IC.flecha + '</button>' : '<p class="tenue" style="margin-bottom:12px">Completaste todas las etapas. Genera tu plan de tesis.</p><button class="btn primario" data-a="ir" data-v="plan">Ir a mi plan' + IC.flecha + '</button>') + '</div>';
  h += '<div class="tarjeta"><h3>Rúbrica de la UNDC</h3><div class="anillo">' + anillo(rr.porcentaje) + '<div class="pequeno tenue">' + (rr.evaluados ? rr.puntaje + ' de ' + rr.maximo + ' puntos. ' + rr.evaluados + ' de ' + rr.aplicables + ' ítems evaluados.' : 'Aún sin evaluar. Cuando tengas contenido, pide una valoración por capítulo.') + '<br><button class="btn chico" style="margin-top:8px" data-a="ir" data-v="rubrica">Ver rúbrica</button></div></div></div>';
  h += '<div class="tarjeta"><h3>En números</h3>' +
    '<div class="dato"><span>Artículos como antecedentes</span><b>' + cb.articulos + ' / ' + esc(d.config.MIN_ARTICULOS) + '</b></div>' +
    '<div class="dato"><span>Tesis como antecedentes</span><b>' + cb.tesis + ' / ' + esc(d.config.MIN_TESIS) + '</b></div>' +
    '<div class="dato"><span>Fuentes en tu biblioteca</span><b>' + cb.total + '</b></div>' +
    (iaDisponible() ? '<div class="dato"><span>Asistente</span><span>' + (via ? esc(VIAS[via].corto) : 'Sin elegir') + (m.length > 1 || !via ? ' · <button class="enlace" data-a="modoIA">cambiar</button>' : '') + '</span></div>' : '') +
    (via === 'curso' ? '<div class="dato"><span>Consultas de hoy</span><b>' + d.uso + ' / ' + cuota + '</b></div>' : '') +
    (enlace(S.exp._plan_url) ? '<div class="dato"><span>Plan de tesis</span><a href="' + esc(enlace(S.exp._plan_url)) + '" target="_blank" rel="noopener">Abrir</a></div>' : '') + '</div>';
  var com = d.comentarios.filter(function (c) { return c.rol !== 'estudiante'; }).slice(-3).reverse();
  if (com.length) {
    h += '<div class="tarjeta"><h3>Mensajes de tu asesor</h3><div class="pila" style="gap:10px">' + com.map(function (c) {
      var e = etapaDe(c.etapa);
      return '<div class="comentario"><div class="meta">' + esc(c.autor) + ' · ' + esc(fechaCorta(c.fecha)) + (e ? ' · ' + esc(e.nombre) : '') + '</div>' + (c.decision ? '<b>' + (c.decision === 'aprobada' ? 'Aprobó la etapa. ' : 'Devolvió la etapa. ') + '</b>' : '') + esc(c.texto) + '</div>';
    }).join('') + '</div></div>';
  }
  return h + '</aside></div>';
}

// ------------------------------------------------------------------ Asistente de IA
var turnoIA = 0;

function asistenteHtml(flotante) {
  return '<aside class="asistente' + (flotante ? ' flotante' : '') + '" id="asistente" aria-label="Asistente"><div class="asistente-cab"><span class="ia">' + IC.chispa + '</span><div><h3>Asistente</h3><div class="pequeno tenue">Propone y pregunta. Tú decides.</div></div><button class="btn chico fantasma cerrar" data-a="cerrarAsistente" aria-label="Cerrar asistente">' + IC.equis + '</button></div>' +
    '<div class="asistente-cuerpo" id="asistente-cuerpo" aria-live="polite"></div><div class="asistente-pie"><span id="uso-ia"></span><span id="via-ia"></span></div></aside>';
}
function abrirAsistente() { var a = $('#asistente'); if (a) a.classList.add('abierto'); document.body.classList.add('con-asistente'); }
function cerrarAsistente() { var a = $('#asistente'); if (a) a.classList.remove('abierto'); document.body.classList.remove('con-asistente'); }

function pintarAsistente() {
  var cont = $('#asistente-cuerpo');
  if (!cont) return;
  var cuota = parseInt(S.d.config.CUOTA_DIARIA, 10) || 40;
  var via = viaIA(), activa = iaDisponible();
  $('#uso-ia').textContent = via === 'curso' ? 'Hoy: ' + S.d.uso + ' de ' + cuota + ' consultas' : (activa ? 'Modo' : 'Sin asistente');
  $('#via-ia').innerHTML = !activa ? '' : (modosIA().length > 1 || !via ? '<button class="enlace" data-a="modoIA">' + (via ? esc(VIAS[via].corto) + ' · cambiar' : 'Elegir modo') + '</button>' : esc(VIAS[via].corto));
  var ia = S.ia;
  if (ia && ia.etapa !== S.etapa) { ia = S.ia = null; }
  var h = '';
  if (!ia) {
    h = (activa ? (via ? (viaLocal(via) ? '<div class="aviso pequeno">Estás en modo <b>copiar y pegar</b>: en cada ayuda te entrego la consulta lista, armada con tu avance, para que la pegues en tu asistente y traigas su respuesta.</div>' : '') : '<div class="aviso">Falta elegir cómo usarás el asistente. <button class="enlace" data-a="modoIA">Elegir ahora</button></div>') : '<div class="aviso ambar">El asistente aún no está configurado. Avisa a tu profesor.</div>') +
      '<p>En cada campo tienes tres ayudas:</p><ul class="lista-ia"><li><b>Explícame</b>: qué se escribe ahí y qué pide la rúbrica.</li><li><b>Hazme preguntas</b>: preguntas guía para que redactes tú.</li><li><b>Proponer</b>: un borrador hecho con lo que ya escribiste y con tu biblioteca.</li></ul>' +
      '<div class="aviso gris pequeno">Solo cito fuentes de tu biblioteca. Lo que no pueda sustentar lo dejo marcado así: <span class="marca-pc">[por completar: …]</span>. Revisa todo lo que aceptes: el autor eres tú.</div>' +
      (S.vista === 'tesis' ? '' : '<div class="separador" style="margin:2px 0"></div><p class="pequeno tenue">Antes de cerrar la etapa, pon a prueba tu trabajo:</p><button class="btn" data-a="ia" data-modo="jurado"' + (activa ? '' : ' disabled') + '>Haz de jurado en esta etapa</button>');
  } else if (ia.modo === 'item') {
    var r0 = S.d.rubrica.filter(function (x) { return x.item === ia.n; })[0];
    h = '<div><span class="chip indigo">Rúbrica · ítem ' + ia.n + '</span></div><p><b>' + esc(r0.criterio) + '</b></p>' + (r0.descripcion ? '<p class="tenue">' + esc(r0.descripcion) + '</p>' : '') +
      [4, 3, 2, 1].map(function (n) { return '<div class="nivel' + (n === 4 ? ' logrado' : '') + '"><b>NIVEL ' + n + (n === 4 ? ' · la meta' : '') + '</b>' + esc(r0['n' + n]) + '</div>'; }).join('') +
      '<button class="btn chico" data-a="limpiarIA">Cerrar</button>';
  } else if (ia.cargando) {
    h = '<div class="pensando"><i></i><span>' + (ia.modo === 'desglosar' ? 'Leyendo tu título…' : ia.modo === 'proponer' ? 'Redactando una propuesta con tu expediente…' : (ia.modo === 'jurado_eval' ? 'Evaluando tus respuestas…' : 'Pensando…')) + '</span></div>';
  } else if (ia.error) {
    h = '<div class="aviso rojo">' + esc(ia.error) + '</div><div class="fila"><button class="btn chico" data-a="limpiarIA">Cerrar</button>' + (modosIA().length > 1 ? '<button class="btn chico fantasma" data-a="modoIA">Cambiar de modo</button>' : '') + '</div>';
  } else {
    h = respuestaIA(ia);
  }
  cont.innerHTML = h;
  crecerTodos(cont);
}

function respuestaIA(ia) {
  var r = ia.r, c = ia.campo ? campoDe(ia.campo) : null, h = '';
  if (c) h += '<div><span class="chip indigo">' + esc(etiquetaDe(c)) + '</span></div>';
  if (ia.modo === 'desglosar') {
    h += '<div><span class="chip indigo">Las piezas de tu título</span></div><p class="tenue pequeno">Esto encontré. Tú decides si lo usas; después puedes corregirlo.</p>' +
      [['Lo que propones o estudias', r.var1], ['Lo que quieres mejorar o explicar', r.var2], ['Dónde', r.contexto], ['Tipo de proyecto', r.tipo === 'artefacto' ? 'Construyes algo (con artefacto)' : (r.tipo === 'explicativa' ? 'Relacionas variables (explicativo)' : '')]].map(function (x) {
        return '<div class="dato"><span class="tenue">' + x[0] + '</span><span style="text-align:right;max-width:62%">' + (x[1] ? '<b style="font-family:inherit">' + esc(x[1]) + '</b>' : '<span class="tenue">No aparece en el título</span>') + '</span></div>';
      }).join('') +
      '<div class="fila"><button class="btn chico primario" data-a="usarPiezas">Usar estas piezas</button><button class="btn chico fantasma" data-a="descartarPropuesta">Descartar</button></div>';
  } else if (ia.modo === 'ayuda') {
    h += '<p>' + conMarcas(r.texto) + '</p>' + (r.ejemplo ? '<div class="propuesta"><b class="pequeno tenue">EJEMPLO DE OTRO TEMA</b><br>' + conMarcas(r.ejemplo) + '</div>' : '') +
      '<div class="fila"><button class="btn chico" data-a="irCampo" data-campo="' + esc(ia.campo) + '">Ir al campo</button><button class="btn chico fantasma" data-a="limpiarIA">Cerrar</button></div>';
  } else if (ia.modo === 'preguntar') {
    h += '<p class="tenue pequeno">Respóndelas con tus palabras en el campo:</p><ol class="lista-ia">' + r.preguntas.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
      '<div class="fila"><button class="btn chico" data-a="irCampo" data-campo="' + esc(ia.campo) + '">Ir al campo</button><button class="btn chico fantasma" data-a="limpiarIA">Cerrar</button></div>';
  } else if (ia.modo === 'proponer') {
    if (c.tipo === 'tabla') {
      h += '<div class="desliza"><table class="tabla" style="font-size:13px"><thead><tr>' + c.columnas.map(function (col) { return '<th>' + esc(col.etiqueta) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        r.filas.map(function (f) { return '<tr>' + c.columnas.map(function (col) { return '<td>' + conMarcas(f[col.clave]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    } else {
      h += '<div class="propuesta">' + conMarcas(r.texto) + '</div>';
    }
    if (r.faltantes && r.faltantes.length) h += '<div class="aviso ambar pequeno"><b>Falta para que quede bien:</b><ul class="lista-ia" style="margin-top:4px">' + r.faltantes.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></div>';
    if (ia.usada) {
      h += '<div class="aviso verde pequeno">Quedó en el campo. Ahora léela, corrígela y completa lo marcado: el texto es tuyo.</div><button class="btn chico fantasma" data-a="limpiarIA">Cerrar</button>';
    } else {
      var tiene = c.tipo === 'tabla' ? filasLlenas(c).length > 0 : String(S.exp[c.clave] || '').trim().length > 0;
      h += '<div class="fila">' + (tiene ? '<button class="btn chico primario" data-a="usarPropuesta" data-como="agregar">' + (c.tipo === 'tabla' ? 'Agregar las filas' : 'Agregar al final') + '</button><button class="btn chico" data-a="usarPropuesta" data-como="reemplazar">Reemplazar lo mío</button>' : '<button class="btn chico primario" data-a="usarPropuesta" data-como="reemplazar">Usar la propuesta</button>') +
        '<button class="btn chico fantasma" data-a="descartarPropuesta">Descartar</button></div>';
    }
  } else if (ia.modo === 'jurado') {
    h += '<p><b>Preguntas del jurado</b></p><p class="tenue pequeno">Responde como lo harías en la sustentación. Luego te digo qué tan sólidas son.</p>' +
      r.preguntas.map(function (p, i) { return '<div><p style="margin-bottom:6px">' + (i + 1) + '. ' + esc(p) + '</p><textarea id="j-' + i + '" rows="2" placeholder="Tu respuesta" aria-label="Respuesta ' + (i + 1) + '"></textarea></div>'; }).join('') +
      '<div class="fila"><button class="btn chico primario" data-a="evaluarJurado">Evaluar mis respuestas</button><button class="btn chico fantasma" data-a="limpiarIA">Cerrar</button></div>';
  } else if (ia.modo === 'jurado_eval') {
    h += '<p><b>Cómo te fue con el jurado</b></p>' + r.evaluacion.map(function (e, i) {
      var v = sinTildes(e.valoracion).toLowerCase(), color = v.indexOf('sol') === 0 ? 'verde' : (v.indexOf('deb') === 0 ? 'rojo' : 'ambar');
      return '<div><div class="fila" style="gap:6px"><span class="chip ' + color + '">' + esc(e.valoracion) + '</span><span class="pequeno tenue">Pregunta ' + (i + 1) + '</span></div><p style="margin-top:4px">' + esc(e.comentario) + '</p></div>';
    }).join('') + (r.consejo ? '<div class="aviso pequeno"><b>Consejo:</b> ' + esc(r.consejo) + '</div>' : '') + '<button class="btn chico fantasma" data-a="limpiarIA">Cerrar</button>';
  }
  return h;
}

function tituloConsulta(modo, clave) {
  var nombres = { ayuda: 'Explícame', preguntar: 'Hazme preguntas', proponer: 'Proponer', jurado: 'Preguntas de jurado', jurado_eval: 'Evaluar mis respuestas al jurado', desglosar: 'Sacar las piezas de mi título' };
  var c = clave ? campoDe(clave) : null;
  return (nombres[modo] || 'Consulta') + (c ? ': ' + etiquetaDe(c) : '');
}

function pedirIA(modo, clave, extra) {
  var via = viaIA();
  if (!via) { abrirModoIA(); return; }
  var etapa = S.etapa, turno = ++turnoIA;
  var args = conVia({ modo: modo, etapa: etapa, campo: clave || '' }, via);
  if (extra) args.respuestas = extra;
  var pedido;
  if (viaLocal(via)) {
    // La consulta se arma con lo ya guardado: primero se guarda lo pendiente
    pedido = guardarAhora().then(function () { return porCopia('iaRespuesta', args, tituloConsulta(modo, clave)); });
  } else {
    S.ia = { modo: modo, campo: clave || '', etapa: etapa, cargando: true };
    pintarAsistente();
    abrirAsistente();
    pedido = guardarAhora().then(function () { return llamar('ia', args); });
  }
  pedido.then(function (r) {
    if (typeof r.uso === 'number') S.d.uso = r.uso;
    if (turno !== turnoIA || S.etapa !== etapa) return;
    S.ia = { modo: modo, campo: clave || '', etapa: etapa, r: r };
    pintarAsistente();
    abrirAsistente();
  }).catch(function (e) {
    if ((e && e.cancelado) || turno !== turnoIA) return;
    S.ia = { modo: modo, campo: clave || '', etapa: etapa, error: e.message };
    pintarAsistente();
    abrirAsistente();
  });
}

function usarPropuesta(como) {
  var ia = S.ia;
  if (!ia || !ia.r) return;
  var c = campoDe(ia.campo), r = ia.r, estado = 'aceptado';
  if (c.tipo === 'tabla') {
    var nuevas = r.filas.map(function (f) { var o = {}; c.columnas.forEach(function (col) { o[col.clave] = String(f[col.clave] === undefined ? '' : f[col.clave]); }); return o; });
    S.tablas[c.clave] = como === 'agregar' ? filasLlenas(c).concat(nuevas) : nuevas;
    if (como === 'agregar') estado = 'editado';
    sincronizarTabla(c);
    repintarTabla(c, false);
  } else {
    var actual = String(S.exp[c.clave] || ''), texto = String(r.texto || '');
    if (c.tipo !== 'parrafo') texto = texto.replace(/\s*\n\s*/g, ' ');
    var nuevo = (como === 'agregar' && actual.trim()) ? actual.replace(/\s+$/, '') + (c.tipo === 'parrafo' ? '\n' : ' ') + texto : texto;
    if (como === 'agregar' && actual.trim()) estado = 'editado'; else S.propuestas[c.clave] = { id: r.id, texto: nuevo };
    ponerValor(c.clave, nuevo);
  }
  llamar('marcarIA', { id: r.id, estado: estado }).catch(function () {});
  ia.usada = true;
  pintarAsistente();
  cerrarAsistente();
  irCampo(c.clave);
}
function descartarPropuesta() {
  if (S.ia && S.ia.r && S.ia.r.id) llamar('marcarIA', { id: S.ia.r.id, estado: 'descartado' }).catch(function () {});
  S.ia = null;
  pintarAsistente();
}
function evaluarJurado() {
  var ia = S.ia;
  if (!ia || !ia.r) return;
  var resp = ia.r.preguntas.map(function (p, i) { return { pregunta: p, respuesta: $('#j-' + i).value }; });
  if (!resp.some(function (x) { return x.respuesta.trim(); })) { toast('Escribe al menos una respuesta.'); return; }
  pedirIA('jurado_eval', '', resp);
}

// ------------------------------------------------------------------ citar
function abrirCitar(clave) {
  S.citarCampo = clave;
  var bib = S.d.biblioteca;
  if (!bib.length) {
    modal('<h2>Tu biblioteca está vacía</h2><p class="tenue">Solo se pueden citar las fuentes que agregues a tu biblioteca: así ninguna referencia es inventada.</p><div class="fila" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="cerrarModal">Cerrar</button><button class="btn primario" data-a="irBiblioteca">Ir a la biblioteca</button></div>');
    return;
  }
  modal('<h2>Citar una fuente</h2><input type="search" id="filtro-cita" placeholder="Filtra por autor, año o título" aria-label="Filtrar fuentes"><div class="pila" style="gap:8px;margin-top:12px" id="lista-citas">' + bib.map(function (b) {
    return '<button class="resultado" style="text-align:left;cursor:pointer" data-a="insertarCita" data-k="' + esc(b.clave_cita) + '" data-t="' + esc(sinTildes(citaCorta(b) + ' ' + b.titulo).toLowerCase()) + '"><div class="fila entre" style="flex-wrap:nowrap"><b>(' + esc(citaCorta(b)) + ')</b><span class="cita">[@' + esc(b.clave_cita) + ']</span></div><div class="pequeno tenue">' + esc(b.titulo) + '</div></button>';
  }).join('') + '</div><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="cerrarModal">Cerrar</button></div>');
}
function filtrarCitas(q) {
  q = sinTildes(q).toLowerCase().trim();
  $$('#lista-citas [data-t]').forEach(function (b) { b.hidden = q && b.getAttribute('data-t').indexOf(q) < 0; });
}
function insertarCita(k) {
  var clave = S.citarCampo, el = null;
  if (S.foco && document.body.contains(S.foco) && S.foco.getAttribute('data-campo') === clave && S.foco.tagName === 'TEXTAREA') el = S.foco;
  if (!el) el = $('#c-' + clave + ' textarea');
  cerrarModal();
  if (!el) return;
  var a = el.selectionStart, b = el.selectionEnd, v = el.value;
  if (typeof a !== 'number' || S.foco !== el) { a = b = v.length; }
  var antes = v.substring(0, a), sep = antes && !/\s$/.test(antes) ? ' ' : '', marca = '[@' + k + ']';
  el.value = antes + sep + marca + v.substring(b);
  var pos = (antes + sep + marca).length;
  el.focus();
  try { el.setSelectionRange(pos, pos); } catch (e) { /* sin seleccion */ }
  alEscribir(el);
}

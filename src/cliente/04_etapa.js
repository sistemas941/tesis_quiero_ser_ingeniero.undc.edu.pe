// ------------------------------------------------------------------ Etapa: formulario, guardado y compuerta
function camposEtapa(id) { return S.d.campos.filter(function (c) { return c.etapa === String(id) && aplica(c.aplica); }); }
function tieneCampo(id, clave) { return camposEtapa(id).some(function (c) { return c.clave === clave; }); }

function filasTabla(c) {
  if (!S.tablas[c.clave]) {
    var f = tablaDe(S.exp, c.clave).map(function (x) { var o = {}; c.columnas.forEach(function (col) { o[col.clave] = x[col.clave] === undefined ? '' : String(x[col.clave]); }); return o; });
    var min = Math.max(1, c.min_filas || 0);
    while (f.length < min) f.push(filaVacia(c));
    S.tablas[c.clave] = f;
  }
  return S.tablas[c.clave];
}
function filaVacia(c) { var o = {}; c.columnas.forEach(function (col) { o[col.clave] = ''; }); return o; }
function filasLlenas(c) { return (S.tablas[c.clave] || []).filter(function (f) { return c.columnas.some(function (col) { return String(f[col.clave] || '').trim(); }); }); }

function tablaHtml(c) {
  var filas = filasTabla(c);
  var h = '<div class="tabla-ed' + (c.columnas.length > 3 ? ' ancha' : '') + '"><table><thead><tr><th></th>' + c.columnas.map(function (col) { return '<th>' + esc(col.etiqueta) + '</th>'; }).join('') + '<th></th></tr></thead><tbody>';
  filas.forEach(function (f, i) {
    h += '<tr><td class="n">' + (i + 1) + '</td>' + c.columnas.map(function (col) {
      var at = ' data-campo="' + esc(c.clave) + '" data-i="' + i + '" data-col="' + esc(col.clave) + '" aria-label="' + esc(col.etiqueta + ', fila ' + (i + 1)) + '"';
      if (col.opciones) return '<td><select' + at + '><option value=""></option>' + col.opciones.map(function (o) { return '<option' + (f[col.clave] === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></td>';
      if (col.numero) return '<td style="width:120px"><input type="number" min="0" step="any"' + at + ' value="' + esc(f[col.clave]) + '"></td>';
      return '<td><textarea rows="1"' + at + '>' + esc(f[col.clave]) + '</textarea></td>';
    }).join('') + '<td class="x"><button class="quitar" data-a="quitarFila" data-campo="' + esc(c.clave) + '" data-i="' + i + '" title="Quitar fila" aria-label="Quitar fila ' + (i + 1) + '">' + IC.equis + '</button></td></tr>';
  });
  return h + '</tbody></table></div>';
}

function controlHtml(c) {
  var v = S.exp[c.clave] || '';
  if (c.tipo === 'tabla') return '<div id="t-' + esc(c.clave) + '">' + tablaHtml(c) + '</div>';
  if (c.tipo === 'opcion') {
    if (c.opciones.length > 6) {
      return '<select id="f-' + esc(c.clave) + '" data-campo="' + esc(c.clave) + '"><option value="">Elige una opción</option>' + c.opciones.map(function (o) { return '<option value="' + esc(o.valor) + '"' + (v === o.valor ? ' selected' : '') + '>' + esc(o.texto) + '</option>'; }).join('') + '</select>';
    }
    var largo = c.opciones.some(function (o) { return o.texto.length > 26; });
    return '<div class="opciones' + (largo ? '' : ' linea') + '" role="radiogroup" aria-label="' + esc(etiquetaDe(c)) + '">' + c.opciones.map(function (o) {
      return '<label class="opcion' + (v === o.valor ? ' elegida' : '') + '"><input type="radio" name="f-' + esc(c.clave) + '" data-campo="' + esc(c.clave) + '" value="' + esc(o.valor) + '"' + (v === o.valor ? ' checked' : '') + '><span>' + esc(o.texto) + '</span></label>';
    }).join('') + '</div>';
  }
  if (c.tipo === 'parrafo') return '<textarea id="f-' + esc(c.clave) + '" data-campo="' + esc(c.clave) + '" rows="3">' + esc(v) + '</textarea>';
  return '<textarea id="f-' + esc(c.clave) + '" data-campo="' + esc(c.clave) + '" rows="1" data-una="1">' + esc(v) + '</textarea>';
}

function campoHtml(c) {
  var no = attrIA();
  var et = etiquetaDe(c);
  var chips = c.rubrica.map(function (n) {
    var r = S.d.rubrica.filter(function (x) { return x.item === n; })[0];
    if (!r || !itemAplica(r)) return '';
    return '<button class="chip borde" data-a="verItem" data-n="' + n + '" title="' + esc(r.criterio) + '" style="cursor:pointer">Rúbrica ' + n + '</button>';
  }).join(' ');
  var acc = '<button class="btn chico" data-a="ia" data-modo="ayuda" data-campo="' + esc(c.clave) + '"' + no + '>Explícame</button>';
  // Los datos de identificacion (autores, asesor, ORCID) no necesitan asistente
  if (/^(autor\d|orcid\d|asesor_|coasesor_)/.test(c.clave)) acc = '';
  else if (c.tipo !== 'opcion') {
    acc += '<button class="btn chico" data-a="ia" data-modo="preguntar" data-campo="' + esc(c.clave) + '"' + no + '>Hazme preguntas</button>';
    if (c.ia) acc += '<button class="btn chico" data-a="ia" data-modo="proponer" data-campo="' + esc(c.clave) + '"' + no + '>' + IC.chispa + 'Proponer</button>';
    acc += botonHumanizar(c);
    if (c.tipo !== 'corto') acc += '<button class="btn chico" data-a="citar" data-campo="' + esc(c.clave) + '">' + IC.libro + 'Citar</button>';
    if (c.tipo === 'tabla') acc = '<button class="btn chico" data-a="agregarFila" data-campo="' + esc(c.clave) + '">' + IC.mas + 'Fila</button>' + acc;
  }
  return '<section class="campo" id="c-' + esc(c.clave) + '"><div class="campo-cab"><div>' +
    (c.tipo === 'tabla' || c.tipo === 'opcion' ? '<span class="rotulo">' + esc(et) + '</span>' : '<label for="f-' + esc(c.clave) + '">' + esc(et) + '</label>') +
    (c.obligatorio ? '' : '<span class="req">opcional</span>') + '</div><div class="fila" style="gap:4px;flex-wrap:nowrap">' + chips + '</div></div>' +
    (c.ayuda ? '<p class="ayuda">' + esc(c.ayuda) + '</p>' : '<div style="height:8px"></div>') + controlHtml(c) +
    '<div class="campo-pie"><span class="cuenta" id="n-' + esc(c.clave) + '"></span>' + humChipHtml(humCampo(S.d.humanizacion, c.clave)) + '<span class="acciones">' + acc + '</span></div><div class="obs-campo" id="o-' + esc(c.clave) + '"></div></section>';
}

function vistaEtapa() {
  var d = S.d, e = etapaDe(S.etapa);
  if (!e || !accesible(S.etapa)) return '<div class="vacio">Esta etapa aún está bloqueada. <button class="btn" data-a="ir" data-v="ruta">Volver a mi ruta</button></div>';
  var st = estadoEtapa(e.id), cs = camposEtapa(e.id);
  var ancla = { '0': 'empezar', '1': 'empezar', '2': 'p1', '3': 'p2', '4': 'p3', '5': 'p4', '6': 'cadena' }[e.id] || 'empezar';
  var h = '<div class="cabecera"><div class="miga"><button data-a="ir" data-v="ruta">Mi ruta</button> / Etapa ' + esc(e.id) + '</div><div class="fila"><h1>' + esc(e.nombre) + '</h1><span id="chip-etapa">' + chip(st) + '</span></div><p>' + esc(e.instruccion) + ' <button class="enlace" data-a="ir" data-v="orientacion" data-p="' + ancla + '">Ver la orientación de esta etapa</button></p></div>';
  h += '<div class="rejilla dos"><div class="pila" id="formulario">';
  h += '<div id="aviso-etapa">' + avisoEtapa() + '</div>';
  if (tieneCampo(e.id, 'brujula_resultado') && enlace(d.config.BRUJULA_URL)) {
    h += '<div class="tarjeta plana" id="tarjeta-brujula"><div class="fila entre"><div style="max-width:62ch"><h3>¿Aún no tienes tema?</h3><p class="tenue pequeno">Empieza por la Brújula de Tesis: en pocos minutos te ubica en un área, una línea y sublíneas posibles. Cuando termines, pega su recomendación en el primer campo y úsala para escribir tu tema.</p></div><a class="btn primario" href="' + esc(enlace(d.config.BRUJULA_URL)) + '" target="_blank" rel="noopener">' + IC.brujula + 'Abrir la Brújula de Tesis</a></div></div>';
  }
  if (tieneCampo(e.id, 'brechas')) {
    var cb = conteoBiblioteca(d.biblioteca);
    h += '<div class="tarjeta plana"><div class="fila entre"><div><h3>Tu biblioteca</h3><p class="tenue pequeno">Los antecedentes no se escriben aquí: se registran en la biblioteca con su ficha y el plan los redacta. Artículos: <b>' + cb.articulos + ' de ' + esc(d.config.MIN_ARTICULOS) + '</b>. Tesis: <b>' + cb.tesis + ' de ' + esc(d.config.MIN_TESIS) + '</b>.</p></div><button class="btn" data-a="ir" data-v="biblioteca">' + IC.libro + 'Abrir biblioteca</button></div></div>';
  }
  h += cs.map(campoHtml).join('');
  if (tieneCampo(e.id, 'problema_central')) h += '<div class="tarjeta plana"><h3>Árbol de problemas</h3><p class="tenue pequeno" style="margin-bottom:10px">Se dibuja con lo que escribes arriba y se incluye en los anexos de tu plan.</p><div class="figura" id="arbol"></div></div>';
  if (tieneCampo(e.id, 'titulo')) h += '<div class="tarjeta plana"><div class="fila entre"><div><h3>Matriz de consistencia</h3><p class="tenue pequeno">Se arma sola con tus problemas, objetivos, hipótesis y variables. Mírala antes de cerrar la etapa.</p></div><button class="btn" data-a="ir" data-v="matriz">Ver matriz' + IC.flecha + '</button></div></div>';
  if (tieneCampo(e.id, 'cronograma')) h += '<div class="tarjeta plana"><div class="fila entre"><div><h3>Plan de tesis</h3><p class="tenue pequeno">Puedes generar un borrador en cualquier momento. Lo que falte aparecerá resaltado.</p></div><button class="btn" data-a="ir" data-v="plan">' + IC.doc + 'Ir a mi plan</button></div></div>';
  h += '<div class="compuerta" id="compuerta"></div><div id="comentarios-etapa"></div></div>';
  h += asistenteHtml() + '</div><button class="btn primario boton-ia-movil" data-a="abrirAsistente">' + IC.chispa + 'Asistente</button>';
  return h;
}

function avisoEtapa() {
  var a = S.d.avance[S.etapa];
  if (!a) return '';
  if (a.estado === 'aprobada' || a.estado === 'en_revision') return '<div class="aviso gris">Esta etapa ya está cerrada. Si cambias un campo, se reabrirá junto con las etapas siguientes y tendrás que cerrarlas otra vez.</div>';
  if (a.estado === 'devuelta') return '<div class="aviso rojo">Tu asesor devolvió esta etapa. Lee su comentario al final, corrige y vuelve a cerrarla.</div>';
  return '';
}

/** Lo que se pinta despues de insertar el HTML de la etapa. */
function despuesDeEtapa() {
  if (!etapaDe(S.etapa) || !accesible(S.etapa)) return;
  camposEtapa(S.etapa).forEach(pintarCuenta);
  pintarObservaciones();
  pintarCompuerta();
  pintarComentarios();
  pintarArbol();
  pintarAsistente();
}

function pintarCuenta(c) {
  var el = $('#n-' + c.clave);
  if (!el) return;
  if (c.tipo === 'parrafo') el.textContent = palabras(S.exp[c.clave]) + ' palabras';
  else if (c.clave === 'titulo') el.textContent = palabras(S.exp[c.clave]) + ' de 20 palabras';
  else if (c.tipo === 'tabla') el.textContent = filasLlenas(c).length + ' fila(s)' + (c.min_filas ? ' · mínimo ' + c.min_filas : '');
  else el.textContent = '';
}

function pintarObservaciones() {
  var a = S.d.avance[S.etapa];
  var obs = a && a.detalle && a.detalle.observaciones ? a.detalle.observaciones : [];
  camposEtapa(S.etapa).forEach(function (c) {
    var el = $('#o-' + c.clave);
    if (!el) return;
    el.innerHTML = obs.filter(function (o) { return o.campo === c.clave; }).map(function (o) {
      return '<div class="obs ' + (o.nivel === 'bloqueante' ? 'bloqueante' : '') + '"><b>' + (o.nivel === 'bloqueante' ? 'Bloqueante' : 'Por mejorar') + (o.origen === 'ia' ? ' (asistente)' : '') + ':</b> ' + esc(o.texto) + '</div>';
    }).join('');
  });
}

// ------------------------------------------------------------------ edicion y guardado
function alEscribir(el) {
  var clave = el.getAttribute('data-campo');
  var c = campoDe(clave);
  if (!c) return;
  if (c.tipo === 'tabla') {
    var i = parseInt(el.getAttribute('data-i'), 10), col = el.getAttribute('data-col');
    var filas = filasTabla(c);
    if (!filas[i]) return;
    filas[i][col] = el.value;
    sincronizarTabla(c);
    crecer(el);
  } else {
    if (el.getAttribute('data-una')) { var limpio = el.value.replace(/\n/g, ' '); if (limpio !== el.value) el.value = limpio; }
    S.exp[clave] = el.value;
    programar(clave, el.value);
    crecer(el);
    if (c.tipo === 'opcion' && el.type === 'radio') $$('#c-' + clave + ' .opcion').forEach(function (o) { o.classList.toggle('elegida', $('input', o).checked); });
  }
  pintarCuenta(c);
  var ob = $('#o-' + clave);
  if (ob && ob.innerHTML) ob.innerHTML = '';
  if (clave === 'problema_central' || clave === 'causas' || clave === 'efectos' || clave === 'efecto_final') pintarArbolLuego();
  if (S.vista === 'tesis') {
    ecoVista(clave);
    pintarProgreso();
    // Estas dos respuestas cambian que preguntas y que secciones aplican
    if (clave === 'tipo_proyecto' || clave === 'con_hipotesis') repintarFormTesis();
  }
}
function sincronizarTabla(c) {
  var llenas = filasLlenas(c);
  S.exp[c.clave] = llenas.length ? JSON.stringify(llenas) : '';
  programar(c.clave, llenas.length ? llenas : '');
}
function programar(clave, valor) {
  S.pend[clave] = valor;
  S.vistaSucia = true;
  pintarGuardado('pendiente');
  if (S.reloj) clearTimeout(S.reloj);
  S.reloj = setTimeout(function () { S.reloj = null; guardarAhora().catch(function () {}); }, 1400);
}
function pintarGuardado(estado) {
  var el = $('#guardado');
  if (!el) return;
  el.className = 'guardado' + (estado === 'error' ? ' mal' : '');
  el.textContent = estado === 'pendiente' ? 'Sin guardar' : (estado === 'guardando' ? 'Guardando' : (estado === 'error' ? 'No se guardó' : (estado === 'ok' ? 'Guardado' : '')));
}
function guardarAhora() {
  if (S.reloj) { clearTimeout(S.reloj); S.reloj = null; }
  if (S.guardando) return S.guardando.then(guardarAhora, guardarAhora);
  var claves = Object.keys(S.pend);
  if (!claves.length || !S.token || !S.d) return Promise.resolve();
  var envio = S.pend;
  S.pend = {};
  pintarGuardado('guardando');
  var conVista = S.vista === 'tesis';
  S.guardando = llamar('guardar', conVista ? { valores: envio, vista: true } : { valores: envio }).then(function (r) {
    S.guardando = null;
    S.d.avance = r.avance;
    if (r.bloqueados && r.bloqueados.length) { toast('Tu plan está aprobado: esos cambios no se guardaron. Pide un cambio desde «Borrador».', 'error'); }
    if (r.vista && S.vista === 'tesis') ponerVista(r.vista);
    if (r.reabiertas.length) {
      toast('Cambiaste una etapa que ya estaba cerrada. Se reabrió ' + (r.reabiertas.length > 1 ? 'junto con las siguientes (' + r.reabiertas.join(', ') + ')' : 'la etapa ' + r.reabiertas[0]) + ': tendrás que cerrarla de nuevo.');
      if (S.vista === 'etapa') { var ch = $('#chip-etapa'); if (ch) ch.innerHTML = chip(estadoEtapa(S.etapa)); var av = $('#aviso-etapa'); if (av) av.innerHTML = avisoEtapa(); pintarCompuerta(); }
    }
    claves.forEach(function (k) {
      var p = S.propuestas[k];
      if (p && typeof envio[k] === 'string' && envio[k].trim() !== p.texto.trim()) { delete S.propuestas[k]; llamar('marcarIA', { id: p.id, estado: 'editado' }).catch(function () {}); }
    });
    pintarGuardado(Object.keys(S.pend).length ? 'pendiente' : 'ok');
  }, function (e) {
    S.guardando = null;
    for (var k in envio) { if (envio.hasOwnProperty(k) && !S.pend.hasOwnProperty(k)) S.pend[k] = envio[k]; }
    pintarGuardado('error');
    throw e;
  });
  return S.guardando;
}

function agregarFila(clave) {
  var c = campoDe(clave);
  filasTabla(c).push(filaVacia(c));
  repintarTabla(c, true);
}
function quitarFila(clave, i) {
  var c = campoDe(clave), f = filasTabla(c);
  f.splice(i, 1);
  if (!f.length) f.push(filaVacia(c));
  sincronizarTabla(c);
  repintarTabla(c, false);
  if (clave === 'causas' || clave === 'efectos') pintarArbol();
}
function repintarTabla(c, enfocarUltima) {
  var cont = $('#t-' + c.clave);
  if (!cont) return;
  cont.innerHTML = tablaHtml(c);
  crecerTodos(cont);
  pintarCuenta(c);
  if (enfocarUltima) { var ult = $$('tbody tr', cont).pop(); var prim = ult ? $('textarea, input, select', ult) : null; if (prim) prim.focus(); }
}
/** Pone un valor en un campo de texto de la etapa abierta y lo guarda. */
function ponerValor(clave, valor) {
  S.exp[clave] = valor;
  var el = $('#f-' + clave);
  if (el) { el.value = valor; crecer(el); }
  var c = campoDe(clave);
  if (c) pintarCuenta(c);
  programar(clave, valor);
  if (S.vista === 'tesis') { ecoVista(clave); pintarProgreso(); }
}

// ------------------------------------------------------------------ compuerta
function pintarCompuerta() {
  var cont = $('#compuerta');
  if (!cont) return;
  var e = etapaDe(S.etapa), a = S.d.avance[S.etapa], det = a && a.detalle ? a.detalle : null;
  var obs = det && det.observaciones ? det.observaciones : [];
  var h = '', via0 = viaIA();
  if (a && det && det.fecha) {
    var color = a.estado === 'en_revision' ? 'indigo' : (a.semaforo || 'ambar');
    var titulo = a.estado === 'aprobada' ? (a.semaforo === 'ambar' ? 'Etapa aprobada, con puntos por mejorar' : 'Etapa aprobada') : (a.estado === 'en_revision' ? (det.excepcion ? 'Tu asesor decidirá sobre la observación' : 'Enviada a tu asesor') : (a.estado === 'devuelta' ? 'Tu asesor devolvió la etapa' : (a.semaforo === 'rojo' ? 'Aún no: hay observaciones que corregir' : 'Etapa reabierta: vuelve a cerrarla')));
    if (a.estado === 'devuelta') color = 'rojo';
    if (a.estado === 'en_curso' && a.semaforo !== 'rojo') color = 'ambar';
    h += '<div class="semaforo ' + color + '"><span class="luz">' + (color === 'verde' ? IC.check : (color === 'indigo' ? IC.reloj : IC.alerta)) + '</span><div><h2>' + titulo + '</h2><div class="pequeno tenue">Última revisión: ' + esc(fechaCorta(det.fecha)) + ' · ' + comoSeReviso(det, false) + '</div></div></div>';
    if (det.resumen) h += '<p class="tenue">' + esc(det.resumen) + '</p>';
    if (a.estado === 'en_revision' && S.d.config.AVANZAR_EN_REVISION === 'SI') h += '<p class="tenue pequeno" style="margin-top:6px">Mientras tu asesor revisa, puedes avanzar con la etapa siguiente.</p>';
    if (obs.length) {
      h += '<div class="obs-lista">' + obs.map(function (o) {
        var c = o.campo ? campoDe(o.campo) : null;
        return '<div class="obs-item"><span class="chip ' + (o.nivel === 'bloqueante' ? 'rojo' : 'ambar') + '">' + (o.nivel === 'bloqueante' ? 'Bloqueante' : 'Por mejorar') + '</span><div>' + esc(o.texto) + '<div class="pequeno tenue">' + (o.origen === 'ia' ? 'Asistente' : 'Regla automática') + (o.item ? ' · rúbrica, ítem ' + o.item : '') + (c ? ' · ' + esc(etiquetaDe(c)) : '') + '</div></div>' +
          (c && c.etapa === S.etapa ? '<button class="btn chico" data-a="irCampo" data-campo="' + esc(o.campo) + '">Ir al campo</button>' : '<span></span>') + '</div>';
      }).join('') + '</div>';
    }
  } else {
    var medio = viaLocal(via0) ? 'recibes la consulta de revisión para pegarla en tu asistente y traer su respuesta' : (via0 ? 'el asistente revisa la coherencia con la rúbrica' : 'la revisión queda en las reglas, porque aún no hay un asistente configurado,');
    h += '<h2>Cerrar la etapa</h2><p class="tenue" style="margin:6px 0 12px">Al cerrar pasan tres cosas: se aplican las reglas automáticas, ' + medio + (e.requiere_asesor ? ' y, si todo está bien, la etapa pasa a tu asesor para su visto bueno.' : ' y, si todo está bien, se abre la etapa siguiente.') + '</p>';
  }
  if (iaDisponible()) h += '<p class="pequeno tenue" id="via-cierre">La revisión se hará con: <b>' + (via0 ? esc(VIAS[via0].corto) : 'sin asistente') + '</b>' + (modosIA().length > 1 || !via0 ? ' · <button class="enlace" data-a="modoIA">cambiar</button>' : '') + '</p>';
  var bloqueaRegla = obs.some(function (o) { return o.nivel === 'bloqueante' && o.origen === 'regla'; });
  var bloqueaIA = obs.some(function (o) { return o.nivel === 'bloqueante' && o.origen === 'ia'; });
  var cerrada = a && (a.estado === 'aprobada' || a.estado === 'en_revision');
  h += '<div class="fila" style="margin-top:12px"><button class="btn ' + (cerrada ? '' : 'primario') + '" data-a="cerrarEtapa">' + (a && det && det.fecha ? 'Revisar y cerrar de nuevo' : 'Cerrar etapa') + '</button>';
  if (a && a.semaforo === 'rojo' && a.estado === 'en_curso' && bloqueaIA && !bloqueaRegla) h += '<button class="btn" data-a="excepcion">No estoy de acuerdo: que decida mi asesor</button>';
  if (cerrada) { var sig = siguienteDe(S.etapa); h += sig ? '<button class="btn primario" data-a="abrirEtapa" data-e="' + esc(sig.id) + '">Siguiente: ' + esc(sig.nombre) + IC.flecha + '</button>' : '<button class="btn primario" data-a="ir" data-v="plan">Ir a mi plan' + IC.flecha + '</button>'; }
  h += '</div>';
  cont.innerHTML = h;
}
function siguienteDe(id) {
  var et = S.d.etapas;
  for (var i = 0; i < et.length - 1; i++) { if (et[i].id === String(id)) return accesible(et[i + 1].id) ? et[i + 1] : null; }
  return null;
}
function pintarComentarios() {
  var cont = $('#comentarios-etapa');
  if (!cont) return;
  var l = S.d.comentarios.filter(function (c) { return String(c.etapa) === S.etapa; });
  cont.innerHTML = l.length ? '<div class="tarjeta plana"><h3>Comentarios de esta etapa</h3><div class="pila" style="gap:10px">' + l.map(function (c) {
    return '<div class="comentario"><div class="meta">' + esc(c.autor) + (c.rol === 'estudiante' ? ' (tú)' : '') + ' · ' + esc(fechaCorta(c.fecha)) + '</div>' + (c.decision ? '<b>' + (c.decision === 'aprobada' ? 'Aprobó la etapa. ' : 'Devolvió la etapa. ') + '</b>' : '') + esc(c.texto) + '</div>';
  }).join('') + '</div></div>' : '';
}

/** Con qué se hizo la última revisión de una etapa. lector: quien lee es el asesor. */
function comoSeReviso(det, lector) {
  if (det.ia === 'si') return 'reglas y asistente';
  if (det.ia === 'pegada') return lector ? 'reglas y revisión pegada por el estudiante (no verificada)' : 'reglas y revisión de tu propio asistente (no verificada)';
  if (det.ia === 'error') return 'reglas; la revisión del asistente falló';
  return 'solo reglas automáticas';
}

function cerrarEtapa(btn) {
  var via = viaIA();
  if (!via) {
    // Sin ningun modo utilizable: si el curso es una opcion, la etapa se cierra solo con reglas
    if (modosIA().indexOf('curso') >= 0) via = 'curso';
    else { abrirModoIA(); toast('Elige primero cómo usarás el asistente.'); return; }
  }
  var fin = ocupar(btn, 'Revisando la etapa');
  var etapa = S.etapa, e0 = etapaDe(etapa);
  var args = conVia({ etapa: etapa }, via);
  guardarAhora().then(function () {
    return viaLocal(via) ? porCopia('cerrarEtapa', args, 'Revisión de la etapa ' + e0.id + ': ' + e0.nombre) : llamar('cerrarEtapa', args);
  }).then(function (r) {
    fin();
    S.d.avance[etapa] = { estado: r.estado, semaforo: r.semaforo, detalle: r.detalle, actualizado: r.detalle.fecha };
    if (r.detalle.ia === 'si' && via === 'curso') S.d.uso++;
    if (S.vista !== 'etapa' || S.etapa !== etapa) return;
    $('#chip-etapa').innerHTML = chip(estadoEtapa(etapa));
    $('#aviso-etapa').innerHTML = avisoEtapa();
    pintarObservaciones();
    pintarCompuerta();
    pintarAsistente();
    $('#compuerta').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (r.estado === 'aprobada') toast('Etapa aprobada.', 'bien');
    else if (r.estado === 'en_revision') toast('Etapa enviada a tu asesor.', 'bien');
    else toast('La etapa tiene observaciones por corregir.');
  }).catch(function (e) { fin(); if (e && e.cancelado) return; fallo(e); });
}

function abrirExcepcion() {
  modal('<h2>Pedir que decida tu asesor</h2><p class="tenue" style="margin-bottom:12px">Explica por qué no estás de acuerdo con la observación del asistente. Tu asesor la leerá y aprobará o devolverá la etapa.</p><textarea id="motivo" rows="4" placeholder="Mi argumento es…"></textarea><div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="enviarExcepcion">Enviar a mi asesor</button></div>');
}
function enviarExcepcion(btn) {
  var fin = ocupar(btn, 'Enviando');
  var etapa = S.etapa, motivo = $('#motivo').value;
  llamar('excepcion', { etapa: etapa, motivo: motivo }).then(function () { return llamar('estado'); }).then(function (d) {
    ponerDatos(d);
    cerrarModal();
    toast('Tu asesor decidirá sobre la observación.', 'bien');
    ir('etapa', etapa);
  }).catch(function (e) { fin(); fallo(e); });
}

function irCampo(clave) {
  var s = $('#c-' + clave);
  if (!s) return;
  s.scrollIntoView({ behavior: 'smooth', block: 'center' });
  s.classList.add('marcado');
  setTimeout(function () { s.classList.remove('marcado'); }, 2200);
  var f = $('textarea, input, select', s);
  if (f) f.focus({ preventScroll: true });
}

// ------------------------------------------------------------------ arbol de problemas (SVG)
function partirTexto(t, max, lineasMax) {
  var pal = String(t || '').replace(/\[@[^\]]+\]/g, '').replace(/\[por completar[^\]]*\]/g, '').replace(/\s+/g, ' ').trim().split(' ');
  var lineas = [], act = '';
  pal.forEach(function (p) {
    if ((act + ' ' + p).trim().length > max && act) { lineas.push(act); act = p; } else { act = (act + ' ' + p).trim(); }
  });
  if (act) lineas.push(act);
  if (lineas.length > lineasMax) { lineas = lineas.slice(0, lineasMax); lineas[lineasMax - 1] = lineas[lineasMax - 1].replace(/.{0,3}$/, '') + '…'; }
  return lineas;
}
function arbolSvg(exp) {
  var causas = tablaDe(exp, 'causas').map(function (f) { return f.causa; }).filter(function (x) { return String(x || '').trim(); }).slice(0, 6);
  var efectos = tablaDe(exp, 'efectos').map(function (f) { return f.efecto; }).filter(function (x) { return String(x || '').trim(); }).slice(0, 6);
  var central = String(exp.problema_central || '').trim(), final = String(exp.efecto_final || '').trim();
  if (!central && !causas.length && !efectos.length) return { svg: '', ancho: 0, alto: 0 };
  var W = 920, M = 20, y = 16, s = '', F = 'Arial, Helvetica, sans-serif';
  function caja(x, yy, w, lineas, o) {
    var alto = 18 + lineas.length * 16;
    var r = '<rect x="' + x + '" y="' + yy + '" width="' + w + '" height="' + alto + '" rx="8" fill="' + o.fondo + '" stroke="' + o.borde + '" stroke-width="1.5"/>';
    lineas.forEach(function (l, i) { r += '<text x="' + (x + w / 2) + '" y="' + (yy + 22 + i * 16) + '" text-anchor="middle" font-family="' + F + '" font-size="12.5" font-weight="' + (o.negrita ? '700' : '400') + '" fill="' + o.tinta + '">' + esc(l) + '</text>'; });
    return { svg: r, alto: alto };
  }
  function rotulo(t, yy) { return '<text x="' + M + '" y="' + yy + '" font-family="' + F + '" font-size="10.5" font-weight="700" letter-spacing="1.2" fill="#8A89A0">' + t + '</text>'; }
  function fila(items, yy, o) {
    var n = items.length, hueco = 14, w = Math.min(280, (W - 2 * M - (n - 1) * hueco) / n), total = n * w + (n - 1) * hueco, x0 = (W - total) / 2, max = 0, r = '', centros = [];
    var partes = items.map(function (t) { return partirTexto(t, Math.floor(w / 6.7), 6); });
    partes.forEach(function (l) { if (l.length > max) max = l.length; });
    partes.forEach(function (l, i) { while (l.length < max) l.push(''); var c = caja(x0 + i * (w + hueco), yy, w, l, o); r += c.svg; centros.push(x0 + i * (w + hueco) + w / 2); });
    return { svg: r, alto: 18 + max * 16, centros: centros };
  }
  function union(centros, yDesde, yHasta) {
    var ym = (yDesde + yHasta) / 2, r = '', xs = centros.concat([W / 2]), a = Math.min.apply(null, xs), b = Math.max.apply(null, xs);
    centros.forEach(function (x) { r += '<line x1="' + x + '" y1="' + yDesde + '" x2="' + x + '" y2="' + ym + '" stroke="#8A89A0" stroke-width="1.5"/>'; });
    r += '<line x1="' + a + '" y1="' + ym + '" x2="' + b + '" y2="' + ym + '" stroke="#8A89A0" stroke-width="1.5"/><line x1="' + (W / 2) + '" y1="' + ym + '" x2="' + (W / 2) + '" y2="' + yHasta + '" stroke="#8A89A0" stroke-width="1.5"/>';
    return r;
  }
  var gris = { fondo: '#FFFFFF', borde: '#B9B8CC', tinta: '#1B1A2E' };
  var yFinalBase = 0, yEfectosTop = 0, yEfectosBase = 0, fe = null;
  if (final) {
    s += rotulo('EFECTO FINAL', y + 10); y += 18;
    var cf = caja((W - 560) / 2, y, 560, partirTexto(final, 82, 3), { fondo: '#F6F6FB', borde: '#B9B8CC', tinta: '#1B1A2E' });
    s += cf.svg; y += cf.alto; yFinalBase = y; y += 34;
  }
  if (efectos.length) {
    s += rotulo('EFECTOS', y - 6);
    fe = fila(efectos, y, gris); s += fe.svg; yEfectosTop = y; y += fe.alto; yEfectosBase = y;
    if (final) s += union(fe.centros, yEfectosTop, yFinalBase);
    y += 38;
  }
  s += rotulo('PROBLEMA CENTRAL', y - 6);
  var cc = caja((W - 640) / 2, y, 640, partirTexto(central || 'Escribe el problema central', 92, 4), { fondo: '#5B4FE8', borde: '#4338CA', tinta: '#FFFFFF', negrita: true });
  s += cc.svg;
  if (fe) s += union(fe.centros, yEfectosBase, y);
  y += cc.alto;
  if (causas.length) {
    var yBaseCentral = y; y += 38;
    s += rotulo('CAUSAS', y - 6);
    var fc = fila(causas, y, gris); s += fc.svg;
    s += union(fc.centros, y, yBaseCentral);
    y += fc.alto;
  }
  y += 16;
  return { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + y + '" viewBox="0 0 ' + W + ' ' + y + '" role="img" aria-label="Árbol de problemas"><rect width="' + W + '" height="' + y + '" fill="#FFFFFF"/>' + s + '</svg>', ancho: W, alto: y };
}
function pintarArbol() {
  var el = $('#arbol');
  if (!el) return;
  var a = arbolSvg(S.exp);
  el.innerHTML = a.svg || '<div class="vacio" style="border:0">Escribe el problema central, las causas y los efectos para ver el árbol.</div>';
}
var relojArbol = null;
function pintarArbolLuego() { if (relojArbol) clearTimeout(relojArbol); relojArbol = setTimeout(pintarArbol, 500); }
/** Convierte el arbol a PNG (data URL). Si el navegador no lo permite, devuelve cadena vacia. */
function arbolPng() {
  var a = arbolSvg(S.exp);
  return new Promise(function (resolver) {
    if (!a.svg) { resolver(''); return; }
    try {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = a.ancho * 2; c.height = a.alto * 2;
          var g = c.getContext('2d');
          g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0, c.width, c.height);
          resolver(c.toDataURL('image/png'));
        } catch (e) { resolver(''); }
      };
      img.onerror = function () { resolver(''); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(a.svg);
    } catch (e) { resolver(''); }
  });
}

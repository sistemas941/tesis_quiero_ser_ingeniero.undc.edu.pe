// ------------------------------------------------------------------ Modos del asistente y flujo de copiar y pegar
function llaveLocal(k) { return k + ':' + String(S.perfil && S.perfil.correo ? S.perfil.correo : '').toLowerCase(); }
// La clave y el modo elegidos se guardan por usuario, para que en una computadora compartida no pasen de un estudiante a otro
function leerLocalUsuario(k) { return leerLocal(llaveLocal(k)); }
// Proveedores con clave propia: la clave se guarda solo en el navegador y viaja con cada consulta
var PROVS = [
  { id: 'gemini', n: 'Gemini', url: 'https://aistudio.google.com/apikey', sitio: 'Google AI Studio', costo: 'Gratis con tu cuenta de Google (con tope diario).', pista: 'AIza…', pasos: 'Entra con tu cuenta de Google, pulsa «Crear clave de API» y copia el código que empieza con AIza.' },
  { id: 'groq', n: 'Groq', url: 'https://console.groq.com/keys', sitio: 'GroqCloud', costo: 'Gratis con límites por minuto; muy rápido (Llama 3.3 70B).', pista: 'gsk_…', pasos: 'Crea tu cuenta con Google o correo, pulsa «Create API Key», ponle un nombre y copia la clave (empieza con gsk_). Solo se muestra una vez.' },
  { id: 'claude', n: 'Claude', url: 'https://platform.claude.com/settings/keys', sitio: 'Claude Platform', costo: 'Pago por uso: necesitas cargar crédito. La suscripción de claude.ai no incluye la API.', pista: 'sk-ant-…', pasos: 'Entra a la plataforma de desarrolladores de Anthropic, carga crédito en «Billing», ve a «API keys», pulsa «Create Key» y copia la clave (empieza con sk-ant-).' },
  { id: 'kimi', n: 'Kimi', url: 'https://platform.kimi.ai/', sitio: 'Kimi (Moonshot AI)', costo: 'Pago por uso, económico; acepta textos muy largos.', pista: 'sk-…', pasos: 'Crea tu cuenta en la plataforma de Kimi, recarga saldo, entra a «API Keys», crea una clave y cópiala (empieza con sk-).' },
  { id: 'deepseek', n: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys', sitio: 'DeepSeek Platform', costo: 'Pago por uso, muy económico.', pista: 'sk-…', pasos: 'Crea tu cuenta, recarga un saldo pequeño en «Top up», ve a «API keys», pulsa «Create new API key» y copia la clave.' },
  { id: 'openai', n: 'OpenAI', url: 'https://platform.openai.com/api-keys', sitio: 'OpenAI Platform', costo: 'Pago por uso. La suscripción de ChatGPT Plus no incluye la API.', pista: 'sk-…', pasos: 'Entra a la plataforma de OpenAI, carga crédito en «Billing», ve a «API keys», pulsa «Create new secret key» y cópiala.' },
  { id: 'openrouter', n: 'OpenRouter', url: 'https://openrouter.ai/keys', sitio: 'OpenRouter', costo: 'Una sola clave para muchos modelos. Hay modelos gratuitos (terminan en :free) y otros de pago.', pista: 'sk-or-…', pasos: 'Crea tu cuenta, ve a «Keys», pulsa «Create Key» y cópiala. En «Modelo» puedes escribir, por ejemplo, un modelo terminado en :free.' }
];
Object.defineProperty(VIAS.propia, 'corto', { get: function () { return 'Mi clave de ' + provDe(provIA()).n; } });
function provDe(id) { for (var i = 0; i < PROVS.length; i++) { if (PROVS[i].id === id) return PROVS[i]; } return PROVS[0]; }
function provIA() { return S.prov || leerLocalUsuario('qsi_prov') || 'gemini'; }
function llaveClave(id) { return id === 'gemini' ? 'qsi_clave' : 'qsi_clave_' + id; }
function claveDe(id) { return (S.claves || {})[id] || leerLocalUsuario(llaveClave(id)); }
function claveIA() { var p = provIA(); return (p === 'gemini' && S.claveIA) || claveDe(p); }
function modeloIA() { return leerLocalUsuario('qsi_modelo_' + provIA()); }
function viaGuardada() { return S.via || leerLocalUsuario('qsi_via'); }

function abrirModoIA() { modal(modoIAHtml(), true); }

function modoIAHtml() {
  var m = modosIA(), act = viaIA(), c = S.d.config, cuota = parseInt(c.CUOTA_DIARIA, 10) || 40;
  var h = '<h2>¿Cómo quieres usar el asistente?</h2><p class="tenue" style="margin-bottom:14px">' + (m.length > 1 ? 'Todas las formas hacen lo mismo: explican, preguntan, proponen y revisan a partir de lo que ya escribiste. Puedes cambiar de modo cuando quieras.' : 'El asistente explica, pregunta, propone y revisa a partir de lo que ya escribiste.') + '</p><div class="vias">';
  function cab(v, icono, estado) {
    return '<div class="via' + (act === v ? ' activa' : '') + '"><div class="fila entre"><div class="fila" style="gap:8px"><span class="via-ic">' + icono + '</span><h3 style="margin:0">' + VIAS[v].nombre + '</h3></div>' + (act === v ? '<span class="chip verde">' + IC.check + 'En uso</span>' : estado) + '</div>';
  }
  function boton(v) { return act === v ? '' : '<button class="btn chico primario" data-a="elegirVia" data-v="' + v + '">Usar este modo</button>'; }
  if (m.indexOf('curso') >= 0) {
    var hay = c.IA_ACTIVA === 'SI';
    h += cab('curso', IC.chispa, hay ? '' : '<span class="chip ambar">Sin configurar</span>') +
      '<p class="tenue pequeno">Gemini con la clave que puso tu profesor. Tienes ' + cuota + ' consultas al día y la revisión de cada etapa queda verificada por la aplicación.</p>' +
      (hay ? boton('curso') : '<p class="pequeno" style="color:var(--ambar)">Tu profesor aún no configura la clave del curso.' + (m.length > 1 ? ' Usa otro modo mientras tanto.' : '') + '</p>') + '</div>';
  }
  if (m.indexOf('propia') >= 0) {
    var pa = S.provForm || provIA(), pd = provDe(pa), k = claveDe(pa);
    h += cab('propia', IC.llave, claveIA() && act !== 'propia' ? '<span class="chip borde">' + esc(provDe(provIA()).n) + '</span>' : '') +
      '<p class="tenue pequeno">Tu propia clave de API: el asistente responde aquí mismo, sin copiar ni pegar y sin gastar las consultas del curso. Elige el proveedor:</p>' +
      '<div class="segmentos" style="margin:8px 0">' + PROVS.map(function (x) { return '<button class="' + (x.id === pa ? 'activo' : '') + '" data-a="elegirProv" data-p="' + x.id + '">' + esc(x.n) + (claveDe(x.id) ? ' ✓' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="prov-guia"><b>' + esc(pd.n) + '</b> · <span class="tenue">' + esc(pd.costo) + '</span><ol class="pequeno" style="margin:6px 0"><li>Abre <a href="' + pd.url + '" target="_blank" rel="noopener">' + esc(pd.sitio) + IC.afuera + '</a>.</li><li>' + esc(pd.pasos) + '</li><li>Pégala aquí y pulsa «Probar y guardar».</li></ol></div>';
    if (k) {
      h += '<div class="fila"><span class="chip borde mono">Clave guardada: ····' + esc(k.slice(-4)) + '</span>' + (act === 'propia' && provIA() === pa ? '' : '<button class="btn chico primario" data-a="usarProv" data-p="' + pa + '">Usar ' + esc(pd.n) + '</button>') + '<button class="btn chico fantasma" data-a="olvidarClave" data-p="' + pa + '">Olvidar esta clave</button></div>';
    } else {
      h += '<form data-f="claveIA" data-p="' + pa + '"><div class="fila" style="align-items:flex-end"><div class="campo-simple crece" style="margin:0;min-width:200px"><label for="clave-ia">Tu clave de ' + esc(pd.n) + '</label><input id="clave-ia" type="password" autocomplete="off" required class="mono" placeholder="' + esc(pd.pista) + '"></div>' +
        (pa === 'gemini' ? '' : '<div class="campo-simple" style="margin:0;width:200px"><label for="modelo-ia">Modelo (opcional)</label><input id="modelo-ia" type="text" class="mono" autocomplete="off" placeholder="el recomendado" value="' + esc(leerLocalUsuario('qsi_modelo_' + pa)) + '"></div>') +
        '<button class="btn primario" type="submit">Probar y guardar</button></div>' +
        '<label class="fila pequeno" style="margin-top:8px;gap:6px"><input type="checkbox" id="clave-recordar" checked style="width:auto"> Recordarla en este navegador (desmárcalo si la computadora es compartida)</label><div id="clave-error" class="aviso rojo pequeno" style="margin-top:8px" hidden></div></form>';
    }
    h += '<p class="pequeno tenue" style="margin-top:8px">La clave se guarda solo en tu navegador: se envía con cada consulta y la aplicación no la almacena. Cada proveedor cobra o limita según su plan; revisa tu consumo en su página. No compartas tu clave.</p></div>';
  }
  if (m.indexOf('nano') >= 0) {
    var en = S.nano || { estado: 'buscando' };
    var txt = { si: '', descargable: '<span class="chip ambar">Se descarga al usarlo</span>', auxiliar: '<span class="chip borde">En otra pestaña</span>', no: '<span class="chip borde">No disponible aquí</span>', buscando: '<span class="chip borde">Comprobando…</span>' }[en.estado] || '';
    h += cab('nano', IC.chispa, txt) +
      '<p class="tenue pequeno">El modelo Gemini Nano viene dentro de Chrome y responde en tu propia computadora: sin claves, sin internet para cada consulta y sin que tu texto salga del equipo. Sirve para ayudas cortas (explicar, preguntar, mejorar el título); para revisar una etapa completa conviene tu clave propia.</p>' +
      (en.estado === 'no' ? '<p class="pequeno tenue">Este navegador no lo ofrece aquí. Requiere Chrome de escritorio reciente, 16 GB de RAM o una tarjeta gráfica de más de 4 GB y 22 GB libres en disco.' + (S.d.config.NANO_URL ? '' : ' Tu profesor puede habilitar una página auxiliar para usarlo en otra pestaña.') + '</p>' : boton('nano')) +
      (en.estado === 'auxiliar' ? '<p class="pequeno tenue" style="margin-top:6px">Dentro de esta aplicación el navegador no permite usarlo, así que cada consulta se abrirá en una pestaña auxiliar y la respuesta volverá sola.</p>' : '') + '</div>';
  }
  if (m.indexOf('copiar') >= 0) {
    h += cab('copiar', IC.copiar, '') +
      '<p class="tenue pequeno">Sin claves ni cuotas. La aplicación arma la consulta con tu avance, tu biblioteca y la rúbrica; tú la pegas en el asistente que prefieras (Gemini, ChatGPT, Claude, DeepSeek, Kimi o Copilot) y traes su respuesta.</p><div class="fila" style="gap:6px;margin-bottom:8px">' + botonesChat(true) + '</div>' + miniGuiaChat() +
      '<p class="pequeno tenue" style="margin-bottom:8px">Como la respuesta la traes tú, las revisiones de etapa hechas así quedan anotadas como «no verificadas»' + (c.REVISION_SIN_IA === 'asesor' ? ' y la etapa pasa a tu asesor.' : '.') + '</p>' + boton('copiar') + '</div>';
  }
  return h + '</div><div class="fila" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-a="cerrarModal">Cerrar</button></div>';
}

/** Vuelve a pintar lo que depende del modo elegido, sin perder lo que se esta editando. */
function refrescarVia() {
  if (S.vista === 'etapa') { pintarAsistente(); pintarCompuerta(); }
  else if (S.vista === 'ruta') { var p = $('#pagina'); if (p) p.innerHTML = vistaRuta(); }
  else if (S.vista === 'tesis' && $('#via-ia')) pintarAsistente();
  var b = document.querySelector('header.barra');
  if (b) b.outerHTML = barra();
}
function elegirVia(v) {
  if (!viaUsable(v)) { toast('Ese modo aún no se puede usar.'); return; }
  S.via = v;
  ponerLocal(llaveLocal('qsi_via'), v);
  cerrarModal();
  toast('Modo del asistente: ' + VIAS[v].corto + '.', 'bien');
  refrescarVia();
  cerrarAsistente();   // en el telefono el asistente es un panel inferior que taparia los campos
}
function probarClave(form) {
  var p = form.getAttribute('data-p') || 'gemini', pd = provDe(p);
  var k = $('#clave-ia').value.trim(), recordar = $('#clave-recordar').checked, err = $('#clave-error'), mod = $('#modelo-ia') ? $('#modelo-ia').value.trim() : '';
  var fin = ocupar($('button[type=submit]', form), 'Probando');
  err.hidden = true;
  llamar('probarClave', { clave: k, proveedor: p, modelo: mod }).then(function (r) {
    S.claves = S.claves || {};
    S.claves[p] = k;
    if (p === 'gemini') S.claveIA = k;
    ponerLocal(llaveLocal(llaveClave(p)), recordar ? k : '');
    ponerLocal(llaveLocal('qsi_modelo_' + p), mod);
    S.prov = p; ponerLocal(llaveLocal('qsi_prov'), p);
    S.via = 'propia';
    ponerLocal(llaveLocal('qsi_via'), 'propia');
    S.provForm = '';
    cerrarModal();
    toast('Tu clave funciona. El asistente ya usa ' + pd.n + (r && r.modelo ? ' (' + r.modelo + ')' : '') + '.', 'bien');
    refrescarVia();
  }).catch(function (e) { fin(); err.textContent = e.message; err.hidden = false; });
}
function olvidarClave(p) {
  p = p || provIA();
  if (S.claves) delete S.claves[p];
  if (p === 'gemini') S.claveIA = '';
  ponerLocal(llaveLocal(llaveClave(p)), '');
  if (viaGuardada() === 'propia' && provIA() === p) { S.via = ''; ponerLocal(llaveLocal('qsi_via'), ''); }
  abrirModoIA();
  refrescarVia();
}
function usarProv(p) {
  S.prov = p; ponerLocal(llaveLocal('qsi_prov'), p);
  S.via = 'propia'; ponerLocal(llaveLocal('qsi_via'), 'propia');
  S.provForm = '';
  cerrarModal();
  toast('El asistente ahora usa tu clave de ' + provDe(p).n + '.', 'bien');
  refrescarVia();
}

// ------------------------------------------------------------------ copiar y pegar
function clonar(o) { var r = {}; for (var k in o) { if (o.hasOwnProperty(k)) r[k] = o[k]; } return r; }

/**
 * Lleva una consulta por el modo de copiar y pegar. ruta: 'iaRespuesta' (ayudas, rubrica, ficha) o 'cerrarEtapa'.
 * Devuelve una promesa con el mismo resultado que daria el asistente del curso. Si el estudiante cancela, rechaza con { cancelado: true }.
 */
function porCopia(ruta, args, titulo) {
  return new Promise(function (resolver, rechazar) {
    if (S.copia) { rechazar({ cancelado: true }); return; }   // ya hay una consulta en curso
    // S.copia se marca antes de llamar: mientras exista, la ventana no se cierra con Escape ni con un clic afuera
    var c = S.copia = { ruta: ruta, args: args, consulta: '', titulo: titulo, resolver: resolver, rechazar: rechazar, ocupada: true };
    modal('<div class="pensando" style="padding:18px 4px"><i></i><span>Armando la consulta con tu avance…</span></div>', true);
    (ruta === 'cerrarEtapa' ? llamar('cerrarEtapa', args) : llamar('iaConsulta', args)).then(function (r) {
      if (S.copia !== c) return;
      // Al cerrar una etapa, si las reglas automaticas bloquean no hay nada que consultar
      if (ruta === 'cerrarEtapa' && r.fase !== 'consulta') { S.copia = null; cerrarModal(); resolver(r); return; }
      c.consulta = r.consulta;
      c.ocupada = false;
      if (args.via === 'nano') { resolverConNano(c); return; }
      pintarCopia();
    }).catch(function (e) { if (S.copia === c) { S.copia = null; cerrarModal(); } rechazar(e); });
  });
}

function pintarCopia() {
  var c = S.copia, cierre = c.ruta === 'cerrarEtapa', alAsesor = S.d.config.REVISION_SIN_IA === 'asesor';
  var h = '<div class="fila entre" style="margin-bottom:6px"><h2 style="margin:0">' + esc(c.titulo) + '</h2><button class="chip indigo" style="cursor:pointer;border:0" data-a="cambiarModoDesdeCopia" title="Cambiar la forma de usar el asistente">' + IC.copiar + 'Copiar y pegar · cambiar</button></div>' +
    (modosIA().indexOf('propia') >= 0 && !claveIA() ? '<div class="aviso verde pequeno" style="margin-bottom:10px"><div class="fila entre"><span>' + IC.llave + ' <b>¿Tienes una clave de API (Gemini gratis, Groq gratis, Claude, Kimi, DeepSeek, OpenAI u OpenRouter)?</b> Pégala una vez y el asistente responderá aquí mismo, sin copiar ni pegar.</span><button class="btn chico primario" data-a="cambiarModoDesdeCopia">Usar mi clave</button></div></div>' : '') +
    '<p class="tenue" style="margin-bottom:6px">' + (cierre ? 'Tu etapa pasó las reglas automáticas. Falta la revisión de coherencia: pídesela a tu asistente con esta consulta.' : 'Tu asistente solo tiene que responder: la consulta ya lleva todo lo necesario.') +
    ' Incluye lo que escribiste en esta etapa, lo que decidiste en las anteriores, tu biblioteca y los criterios de la rúbrica.</p>';
  h += '<div class="paso-copia"><b class="n">1</b><div><div class="fila entre"><h3>Copia la consulta</h3><span class="pequeno tenue mono">' + String(c.consulta.length).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' caracteres</span></div>' +
    '<textarea id="copia-consulta" class="fijo mono" readonly rows="5" aria-label="Consulta para tu asistente">' + esc(c.consulta) + '</textarea>' +
    '<div class="fila" style="margin-top:8px"><button class="btn primario" data-a="copiarConsulta">' + IC.copiar + 'Copiar la consulta</button><span id="copia-ok" class="pequeno" aria-live="polite"></span></div></div></div>';
  h += '<div class="paso-copia"><b class="n">2</b><div><h3>Pégala en tu asistente</h3><p class="tenue pequeno">Abre una conversación nueva, pega la consulta completa y espera la respuesta. Sirve cualquier asistente, también el del panel lateral del navegador.</p>' +
    '<div class="fila" style="margin-top:6px;gap:6px">' + botonesChat(true) + '</div>' + miniGuiaChat() + '</div></div>';
  h += '<div class="paso-copia"><b class="n">3</b><div><h3>Pega aquí su respuesta completa</h3><textarea id="copia-respuesta" class="fijo" rows="4" placeholder="Pega aquí lo que respondió tu asistente" aria-label="Respuesta de tu asistente"></textarea>' +
    '<div id="copia-error" class="aviso rojo pequeno" style="margin-top:8px" hidden></div>' +
    (cierre ? '<p class="pequeno tenue" style="margin-top:8px">Como esta revisión la traes tú, quedará anotada como «no verificada»' + (alAsesor ? ' y la etapa pasará a tu asesor.' : '; tu asesor puede verla en tu expediente.') + '</p>' : '') +
    '<div class="fila entre" style="margin-top:10px"><div class="fila"><button class="btn primario" data-a="enviarPegado">' + (cierre ? 'Registrar la revisión' : 'Usar la respuesta') + '</button><button class="btn" data-a="cancelarCopia">Cancelar</button></div>' +
    (cierre ? '<button class="btn chico fantasma" data-a="cerrarSinRevision" title="Solo se aplican las reglas automáticas">Cerrar sin revisión del asistente</button>' : '') + '</div></div></div>';
  modal(h, true);
}

function copiarConsulta(btn) {
  var c = S.copia, area = $('#copia-consulta'), ok = $('#copia-ok');
  if (!c || c.ocupada) return;
  copiarTexto(c.consulta, area).then(function (bien) {
    if (bien) { ok.textContent = 'Copiada. Ahora pégala en tu asistente.'; ok.style.color = 'var(--verde)'; }
    else { ok.textContent = 'No se pudo copiar sola: el texto ya está seleccionado, pulsa Ctrl+C.'; ok.style.color = 'var(--ambar)'; area.focus(); area.select(); }
  });
}
function errorCopia(texto) { var e = $('#copia-error'); if (e) { e.textContent = texto; e.hidden = false; } }
/** Mientras viaja un envio, ningun otro boton de la ventana responde: el servidor ya esta cambiando la etapa. */
function ocuparCopia(c, btn, texto) {
  c.ocupada = true;
  var otros = $$('#modal button').filter(function (b) { return b !== btn && !b.disabled; });
  otros.forEach(function (b) { b.disabled = true; });
  var fin = ocupar(btn, texto);
  return function () { c.ocupada = false; fin(); otros.forEach(function (b) { b.disabled = false; }); };
}
function enviarPegado(btn) {
  var c = S.copia;
  if (!c || c.ocupada) return;
  var resp = $('#copia-respuesta').value;
  if (!resp.trim()) { errorCopia('Pega la respuesta de tu asistente.'); return; }
  var fin = ocuparCopia(c, btn, c.ruta === 'cerrarEtapa' ? 'Registrando la revisión' : 'Leyendo la respuesta');
  var args = clonar(c.args);
  args.respuesta = resp;
  llamar(c.ruta === 'cerrarEtapa' ? 'cerrarEtapa' : 'iaRespuesta', args).then(function (r) {
    S.copia = null;
    cerrarModal();
    c.resolver(r);
  }).catch(function (e) { fin(); errorCopia(e.message); });
}
function cerrarSinRevision(btn) {
  var c = S.copia;
  if (!c || c.ocupada) return;
  var fin = ocuparCopia(c, btn, 'Cerrando');
  var args = clonar(c.args);
  args.sinRevision = true;
  llamar('cerrarEtapa', args).then(function (r) { S.copia = null; cerrarModal(); c.resolver(r); }).catch(function (e) { fin(); errorCopia(e.message); });
}
function cancelarCopia() {
  var c = S.copia;
  if (!c || c.ocupada) return;
  S.copia = null;
  cerrarModal();
  c.rechazar({ cancelado: true });
}

// ------------------------------------------------------------------ Gemini Nano (modelo local de Chrome)
/** Comprueba una vez si Gemini Nano se puede usar dentro de la aplicacion o en la pagina auxiliar. */
function detectarNano() {
  if (S.nano && S.nano.estado !== 'buscando') return Promise.resolve(S.nano);
  S.nano = { estado: 'buscando' };
  var auxiliar = function () { S.nano = { estado: S.d && S.d.config.NANO_URL ? 'auxiliar' : 'no' }; return S.nano; };
  try {
    if (typeof window.LanguageModel === 'undefined' || !window.LanguageModel.availability) return Promise.resolve(auxiliar());
    return window.LanguageModel.availability({ expectedInputs: [{ type: 'text', languages: ['es'] }], expectedOutputs: [{ type: 'text', languages: ['es'] }] }).then(function (a) {
      if (a === 'available') S.nano = { estado: 'si' };
      else if (a === 'downloadable' || a === 'downloading') S.nano = { estado: 'descargable' };
      else return auxiliar();
      return S.nano;
    }).catch(function () { return auxiliar(); });
  } catch (e) { return Promise.resolve(auxiliar()); }
}
function nanoUsable() { return !!S.nano && ['si', 'descargable', 'auxiliar'].indexOf(S.nano.estado) >= 0; }
/** Copiar y pegar y Gemini Nano llevan la consulta al navegador y traen la respuesta. */
function viaLocal(v) { return v === 'copiar' || v === 'nano'; }

/** Pregunta a Gemini Nano dentro de la pagina. Rechaza con { largo: true } si la consulta no cabe. */
function nanoEnPagina(texto) {
  var opciones = { expectedInputs: [{ type: 'text', languages: ['es'] }], expectedOutputs: [{ type: 'text', languages: ['es'] }] };
  return window.LanguageModel.create(opciones).then(function (s) {
    var medir = s.measureInputUsage ? s.measureInputUsage(texto) : Promise.resolve(0);
    return medir.then(function (n) {
      if (s.inputQuota && n > s.inputQuota) { if (s.destroy) s.destroy(); throw { largo: true }; }
      return s.prompt(texto).then(function (r) { if (s.destroy) s.destroy(); return r; });
    });
  });
}

/** Pregunta a Gemini Nano en la pagina auxiliar (otra pestana) y espera su respuesta por mensaje. */
function nanoAuxiliar(texto) {
  return new Promise(function (resolver, rechazar) {
    var url = S.d.config.NANO_URL, origen = '';
    try { origen = new URL(url).origin; } catch (e) { rechazar(new Error('La dirección de la página auxiliar no es válida.')); return; }
    var id = 'q' + Date.now(), w = window.open(url, 'qsi_nano');
    if (!w) { rechazar(new Error('El navegador bloqueó la pestaña auxiliar. Permite las ventanas emergentes para esta página.')); return; }
    var listo = false, plazo = setTimeout(function () { fin(); rechazar(new Error('La pestaña auxiliar no respondió a tiempo.')); }, 240000);
    function fin() { clearTimeout(plazo); window.removeEventListener('message', oir); }
    function oir(ev) {
      if (ev.source !== w || ev.origin !== origen || !ev.data || typeof ev.data !== 'object') return;
      if (ev.data.tipo === 'qsi-listo' && !listo) { listo = true; w.postMessage({ tipo: 'qsi-consulta', id: id, texto: texto }, origen); return; }
      if (ev.data.tipo === 'qsi-respuesta' && ev.data.id === id) { fin(); if (ev.data.error) rechazar(new Error(String(ev.data.error))); else resolver(String(ev.data.texto || '')); }
    }
    window.addEventListener('message', oir);
  });
}

/** Resuelve una consulta con Gemini Nano y la envia como si se hubiera pegado. Si no se puede, ofrece copiar y pegar. */
function resolverConNano(c) {
  c.ocupada = true;
  modal('<div class="pensando" style="padding:18px 4px"><i></i><span>Gemini Nano está pensando en tu computadora…</span></div><p class="pequeno tenue">La primera vez Chrome puede tardar unos minutos en descargar el modelo.</p>', true);
  var pedir = S.nano && S.nano.estado === 'auxiliar' ? nanoAuxiliar(c.consulta) : nanoEnPagina(c.consulta);
  pedir.then(function (resp) {
    if (S.copia !== c) return null;
    var args = clonar(c.args);
    args.respuesta = resp;
    return llamar(c.ruta === 'cerrarEtapa' ? 'cerrarEtapa' : 'iaRespuesta', args).then(function (r) { S.copia = null; cerrarModal(); c.resolver(r); });
  }).catch(function (e) {
    if (S.copia !== c) return;
    c.ocupada = false;
    var porque = e && e.largo ? 'Esta consulta es demasiado larga para Gemini Nano.' : 'Gemini Nano no pudo responder' + (e && e.message ? ' (' + e.message + ')' : '') + '.';
    pintarCopia();
    errorCopia(porque + ' Puedes copiarla y pegarla en otro asistente, o usar tu clave propia.');
  });
}

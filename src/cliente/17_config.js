// ------------------------------------------------------------------ Mi configuracion (la tuerquita): color, asistente, citas y contrasena
var TEMAS = [
  ['indigo', 'Índigo', '#5B4FE8', '#4338CA', '#EEECFD', '#CFCAF9'],
  ['oceano', 'Océano', '#0E7490', '#155E75', '#E0F4F8', '#B5E1EA'],
  ['bosque', 'Bosque', '#15803D', '#166534', '#E5F5EA', '#BCE3C8'],
  ['atardecer', 'Atardecer', '#C2410C', '#9A3412', '#FDEEE5', '#F6CDB5'],
  ['frambuesa', 'Frambuesa', '#BE185D', '#9D174D', '#FCE8F1', '#F4BFD6'],
  ['grafito', 'Grafito', '#374151', '#1F2937', '#ECEEF2', '#CDD2DA']
];
function aplicarTema(id) {
  var t = TEMAS.filter(function (x) { return x[0] === id; })[0] || TEMAS[0], r = document.documentElement.style;
  r.setProperty('--indigo', t[2]); r.setProperty('--indigo-osc', t[3]); r.setProperty('--indigo-claro', t[4]); r.setProperty('--indigo-borde', t[5]);
}
function temaGuardado() { return leerLocalUsuario('qsi_tema') || 'indigo'; }

// Asistentes de chat que sirven para el modo copiar y pegar, con su mini guia
var IAS_CHAT = [
  { id: 'gemini', n: 'Gemini', url: 'https://gemini.google.com/app', g: 'Gratis con tu cuenta de Google. Pega la consulta completa en un chat nuevo. Si tienes la clave de AI Studio, mejor úsala: responde aquí mismo.' },
  { id: 'chatgpt', n: 'ChatGPT', url: 'https://chatgpt.com/', g: 'Gratis con cuenta. Abre un chat nuevo, pega la consulta y envía. Si la respuesta trae texto además del JSON, copia solo el bloque de código.' },
  { id: 'claude', n: 'Claude', url: 'https://claude.ai/new', g: 'Gratis con cuenta. Acepta consultas largas sin problema. Copia la respuesta con el botón «Copiar» que aparece debajo del bloque de código.' },
  { id: 'deepseek', n: 'DeepSeek', url: 'https://chat.deepseek.com/', g: 'Gratis con cuenta. Deja apagada la búsqueda en internet: la consulta ya trae tus fuentes. El modo de razonamiento (DeepThink) tarda más, pero revisa mejor.' },
  { id: 'kimi', n: 'Kimi', url: 'https://www.kimi.com/', g: 'Gratis con cuenta. Lee textos muy largos, ideal para revisar etapas completas o la rúbrica. Pídele «solo el JSON» si se extiende.' },
  { id: 'copilot', n: 'Copilot', url: 'https://copilot.microsoft.com/', g: 'Gratis, también desde el panel lateral de Edge. Si corta la respuesta, escribe «continúa» y pega todo junto.' }
];
function chatPreferido() { return leerLocalUsuario('qsi_chat') || ''; }
function botonesChat(chico) {
  var pref = chatPreferido();
  var orden = IAS_CHAT.slice().sort(function (a, b) { return (b.id === pref) - (a.id === pref); });
  return orden.map(function (x) { return '<a class="btn ' + (chico ? 'chico ' : '') + (x.id === pref ? 'primario' : '') + '" href="' + x.url + '" target="_blank" rel="noopener" data-chat="' + x.id + '" title="' + esc(x.g) + '">' + esc(x.n) + IC.afuera + '</a>'; }).join('');
}
function miniGuiaChat() {
  return '<details class="mini-guia"><summary>' + IC.guia + ' Mini guía: cómo usar Gemini, ChatGPT, Claude, DeepSeek, Kimi o Copilot</summary><ol class="pequeno">' +
    '<li>Pulsa <b>Copiar la consulta</b>. Ya lleva tu avance, tus fuentes y lo que se pide; no agregues nada.</li>' +
    '<li>Abre el asistente que prefieras, inicia una <b>conversación nueva</b> y pega la consulta completa.</li>' +
    '<li>Copia <b>toda</b> su respuesta (o solo el bloque de código, si lo hay) y pégala en el paso 3.</li>' +
    '<li>Si te dice que no puede, pídele: «responde solo con el JSON pedido». Si la corta, escribe «continúa» y pega todo junto.</li></ol>' +
    '<div class="guia-ias">' + IAS_CHAT.map(function (x) { return '<div><b>' + esc(x.n) + '</b><span>' + esc(x.g) + '</span></div>'; }).join('') + '</div>' +
    '<p class="pequeno tenue">Ninguno necesita clave. Lo que pegas en esos servicios queda en tu cuenta de ese servicio: no pegues datos personales de otras personas. Según el reglamento de la UNDC, declara el asistente que usaste: la aplicación lo anota en tu anexo de uso de IA.</p></details>';
}

function abrirConfig() {
  var est = S.perfil && S.perfil.rol === 'estudiante', tema = temaGuardado();
  var h = '<h2>' + IC.engrane + ' Mi configuración</h2>';
  h += '<section class="conf-sec"><h3>Color de la aplicación</h3><div class="temas">' + TEMAS.map(function (t) { return '<button class="tema' + (t[0] === tema ? ' activo' : '') + '" data-a="tema" data-t="' + t[0] + '" style="--c:' + t[2] + ';--cc:' + t[4] + '"><i></i>' + esc(t[1]) + '</button>'; }).join('') + '</div><p class="pequeno tenue">Se guarda en este navegador, solo para ti.</p></section>';
  if (est) {
    var via = viaIA();
    h += '<section class="conf-sec"><h3>Asistente de inteligencia artificial</h3><div class="fila entre"><span>' + (via ? 'Usas: <b>' + esc(via === 'propia' ? 'Mi clave de ' + provDe(provIA()).n : VIAS[via].nombre) + '</b>' + (via === 'propia' && claveIA() ? ' <span class="chip borde mono">····' + esc(claveIA().slice(-4)) + '</span>' : '') : '<span style="color:var(--ambar)">Aún no eliges cómo usar el asistente.</span>') + '</span><button class="btn chico primario" data-a="modoIA">' + IC.llave + (via ? 'Cambiar' : 'Activar mi IA') + '</button></div>' +
      '<p class="pequeno tenue" style="margin-top:8px">Con «copiar y pegar» puedes usar el asistente que prefieras. Marca tu favorito para tenerlo a la mano:</p><div class="fila" style="gap:6px;margin-top:6px">' +
      IAS_CHAT.map(function (x) { return '<button class="btn chico' + (chatPreferido() === x.id ? ' primario' : '') + '" data-a="chatPreferido" data-c="' + x.id + '">' + esc(x.n) + '</button>'; }).join('') + '</div>' + miniGuiaChat() + '</section>';
    h += '<section class="conf-sec"><h3>Consensus (búsqueda de papers y estado del arte)</h3><div class="fila entre"><span>' + (claveConsensus() ? 'Clave guardada <span class="chip borde mono">····' + esc(claveConsensus().slice(-4)) + '</span>' : (S.d.config.CONSENSUS_CURSO === 'SI' ? 'Usas la clave del curso.' : '<span style="color:var(--ambar)">Aún sin clave.</span>')) + '</span><button class="btn chico" data-a="abrirConsensus">' + IC.brujulaN + 'Abrir Consensus</button></div>' +
      '<form data-f="probarConsensus" class="fila" style="align-items:flex-end;margin-top:8px"><div class="campo-simple crece" style="margin:0;min-width:200px"><label for="conf-cons">' + (claveConsensus() ? 'Cambiar o verificar la clave' : 'Pega tu clave de la API de Consensus') + '</label><input id="conf-cons" type="password" class="mono" autocomplete="off" placeholder="' + (claveConsensus() ? 'deja vacío para verificar la guardada' : 'tu clave') + '"></div><button class="btn primario" type="submit">Verificar y guardar</button></form>' +
      '<p class="pequeno tenue" style="margin-top:4px">La verificación hace una búsqueda de prueba y usa 1 de tus consultas del mes.</p><div id="conf-cons-res" class="pequeno" style="margin-top:4px"></div>' + guiaConsensusHtml(!claveConsensus()) + '</section>';
    var e = estiloCita();
    h += '<section class="conf-sec"><h3>Estilo de citas</h3><div class="segmentos">' + ESTILOS_CITA.map(function (x) { return '<button class="' + (x[0] === e ? 'activo' : '') + '" data-a="estiloCitas" data-e="' + x[0] + '" title="' + esc(x[2]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div><p class="pequeno tenue" style="margin-top:6px">IEEE viene por defecto. Las tablas y figuras siguen el formato APA 7.</p></section>';
    h += expedienteConfigHtml();
    h += '<section class="conf-sec"><h3>Forma de trabajo</h3><div class="segmentos"><button class="' + (modoApp() === 'sencillo' ? 'activo' : '') + '" data-a="modoSencillo">Modo sencillo</button><button class="' + (modoApp() === 'completo' ? 'activo' : '') + '" data-a="modoCompleto">Ruta completa</button></div></section>';
  }
  h += '<section class="conf-sec"><h3>Cambiar mi contraseña</h3><form data-f="miClave" class="conf-clave"><div class="campo-simple" style="margin:0"><label for="mc-actual">Contraseña actual</label><input id="mc-actual" type="password" autocomplete="current-password" required></div>' +
    '<div class="campo-simple" style="margin:0"><label for="mc-nueva">Nueva</label><input id="mc-nueva" type="password" autocomplete="new-password" required minlength="8" placeholder="8 o más, letras y números"></div>' +
    '<div class="campo-simple" style="margin:0"><label for="mc-repite">Repite la nueva</label><input id="mc-repite" type="password" autocomplete="new-password" required minlength="8"></div><button class="btn" type="submit">Cambiar</button></form></section>';
  h += '<div class="fila" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-a="cerrarModal">Listo</button></div>';
  modal(h, true);
}
function cambiarMiClave(form) {
  var a = $('#mc-actual').value, n = $('#mc-nueva').value, r = $('#mc-repite').value;
  if (n !== r) { toast('Las dos contraseñas nuevas no coinciden.', 'error'); return; }
  var fin = ocupar($('button[type=submit]', form), 'Cambiando');
  llamar('cambiarClave', { actual: a, nueva: n }).then(function () { fin(); form.reset(); toast('Tu contraseña quedó cambiada.', 'bien'); }).catch(function (e) { fin(); fallo(e); });
}

function probarConsensus(form) {
  var k = $('#conf-cons').value.trim() || claveConsensus(), res = $('#conf-cons-res');
  if (!k) { toast('Pega tu clave de Consensus.'); return; }
  var fin = ocupar($('button[type=submit]', form), 'Verificando');
  llamar('probarConsensus', { claveConsensus: k }).then(function (r) {
    fin();
    S.claveCons = k;
    ponerLocal(llaveLocal('qsi_consensus'), k);
    res.innerHTML = '<span style="color:var(--verde)">' + IC.check + ' Clave válida: Consensus respondió con ' + r.resultados + ' artículos de prueba. Ya quedó guardada.</span>';
  }).catch(function (e) { fin(); res.innerHTML = '<span style="color:var(--rojo)">' + esc(e.message) + '</span>'; });
}

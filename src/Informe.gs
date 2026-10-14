/**
 * Informe.gs - Segundo nivel: «Borrador de tesis».
 *  - El coordinador aprueba el plan: queda congelado (solo lectura) y se abre el borrador.
 *  - Para cambiar el plan, el estudiante pide un cambio; el coordinador autoriza solo esas secciones.
 *  - El borrador sigue la estructura de la tesis del Reglamento de Grados y Titulos de la UNDC
 *    (RCO N. 115-2025-UNDC/CO, Anexo 6). Cada seccion se guarda aparte, en la pestana Informe, y se
 *    carga solo cuando se abre (la pagina no trae todo el borrador de golpe).
 *  - El texto se escribe en Markdown ligero con una barra de botones; las ecuaciones en LaTeX salen en
 *    el Word como ecuaciones nativas y editables (Ecuaciones.gs).
 */

var INFORME_NORMA_ = 'Reglamento de Grados y Títulos de la UNDC (RCO N.° 115-2025-UNDC/CO), Anexo 6';
var INF_MAX_ = 45000;           // caracteres por seccion (una celda de la hoja admite 50 000)
var INF_FIG_MAX_ = 4500000;     // base64 de una figura (unos 3,3 MB)
var MSJ_CONGELADO_ = 'Tu plan ya está aprobado y quedó congelado. Para cambiar algo, pide un cambio desde «Borrador de tesis».';

/*
 * Estructura del informe final (Anexo 6). c: capitulo; s: secciones.
 * Cada seccion: id, t (titulo), plan (titulos de la plantilla del plan de donde se trae el texto),
 * cons (busqueda de Consensus sugerida), aplica (regla de la plantilla), ayuda.
 */
function estructuraInforme_() {
  return [
    { c: 'pre', t: '', s: [
      { id: 'dedicatoria', t: 'Dedicatoria', h: 'DEDICATORIA', ayuda: 'Opcional. Unas líneas, en tono personal.' },
      { id: 'agradecimiento', t: 'Agradecimiento', h: 'AGRADECIMIENTO', ayuda: 'Opcional. Menciona a quienes apoyaron la investigación (asesor, institución, participantes).' },
      { id: 'resumen', t: 'Resumen', h: 'RESUMEN', ayuda: 'Escríbelo al final, entre 200 y 300 palabras y en un solo párrafo: objetivo, método (enfoque, diseño, muestra), resultados principales con sus cifras y conclusión. Termina con una línea «Palabras clave:» y de 3 a 5 términos.' },
      { id: 'abstract', t: 'Abstract', h: 'ABSTRACT', ayuda: 'Traducción fiel del resumen al inglés. Termina con «Keywords:».' },
      { id: 'introduccion', t: 'Introducción', h: 'INTRODUCCIÓN', cons: 'intro', ayuda: 'Presenta el tema y su importancia, el problema y el objetivo, cómo se investigó y cómo está organizado el informe (un párrafo por capítulo).' }
    ] },
    { c: 'I', t: 'PLANTEAMIENTO DEL PROBLEMA', s: [
      { id: '1.1', t: 'Descripción de la realidad problemática', plan: ['Descripción de la realidad problemática'], cons: 'contexto', ayuda: 'Viene de tu plan. Actualiza los datos si hay cifras más recientes.' },
      { id: '1.2', t: 'Formulación del problema', plan: ['Formulación del problema'], ayuda: 'Problema general y problemas específicos, tal como se aprobaron en el plan.' },
      { id: '1.3', t: 'Objetivos', plan: ['Objetivos'], ayuda: 'Objetivo general y específicos del plan aprobado.' },
      { id: '1.4', t: 'Justificación', plan: ['Justificación'], ayuda: 'Pasa a tiempo pasado lo que corresponda («se aportó», «permitió»).' },
      { id: '1.5', t: 'Delimitación de la investigación', plan: ['Delimitación de la investigación'], ayuda: 'Delimitación teórica, temporal y espacial. Usa ### para cada una.' }
    ] },
    { c: 'II', t: 'MARCO TEÓRICO Y EMPÍRICO', s: [
      { id: '2.1.1', t: 'Variable 1: {var1}', antes: '2.1 Marco teórico', plan: ['Variable 1: {var1}'], cons: 'var1', ayuda: 'Definición, dimensiones, indicadores y teorías (usa ## para cada uno). Amplía con fuentes recientes de Consensus.' },
      { id: '2.1.2', t: 'Variable 2: {var2}', plan: ['Variable 2: {var2}'], cons: 'var2', ayuda: 'Igual que la variable 1.' },
      { id: '2.2', t: 'Antecedentes', plan: ['Antecedentes'], cons: 'antecedentes', ayuda: 'Antecedentes nacionales e internacionales (usa ## para cada grupo). Un párrafo por estudio: autor, objetivo, método, resultado y relación con tu tesis.' },
      { id: '2.3', t: 'Definición de términos básicos', plan: ['Definición de términos básicos'], ayuda: 'Términos técnicos en orden alfabético, cada uno con su fuente.' }
    ] },
    { c: 'III', t: 'HIPÓTESIS Y VARIABLES', s: [
      { id: '3.1', t: 'Hipótesis', plan: ['Hipótesis'], aplica: 'hipotesis', ayuda: 'Hipótesis general y específicas del plan aprobado.' },
      { id: '3.2', t: 'Definición conceptual de las variables', plan: ['Definición conceptual de las variables'] },
      { id: '3.3', t: 'Operacionalización de las variables', plan: ['Operacionalización de las variables'], ayuda: 'La tabla de operacionalización del plan.' }
    ] },
    { c: 'IV', t: 'DISEÑO METODOLÓGICO', s: [
      { id: '4.1', t: 'Tipo de investigación', plan: ['Tipo de investigación'], ayuda: 'En tiempo pasado: «La investigación fue de tipo…».' },
      { id: '4.2', t: 'Diseño de investigación', plan: ['Diseño de investigación'] },
      { id: '4.3', t: 'Método de investigación', plan: ['Método de investigación'], cons: 'metodo' },
      { id: '4.4', t: 'Población y muestra', plan: ['Población y muestra'], ayuda: 'Indica la muestra que realmente participó y cualquier diferencia con lo previsto.' },
      { id: '4.5', t: 'Lugar de estudio', plan: ['Lugar de estudio'] },
      { id: '4.6', t: 'Técnicas e instrumentos para la recolección de los datos', plan: ['Técnicas e instrumentos para la recolección de los datos'], cons: 'instrumentos', ayuda: 'Incluye la validez y la confiabilidad obtenidas (por ejemplo, el alfa de Cronbach).' },
      { id: '4.7', t: 'Análisis y procesamiento de datos', plan: ['Análisis y procesamiento de datos'], ayuda: 'Programas, pruebas estadísticas o métricas que se usaron de verdad.' }
    ] },
    { c: 'V', t: 'RESULTADOS', s: [
      { id: '5.1', t: 'Resultados descriptivos', ayuda: 'Tablas y figuras de tus datos, cada una con su interpretación debajo. Solo tus datos: la IA no inventa resultados.' },
      { id: '5.2', t: 'Resultados inferenciales', ayuda: 'Prueba de normalidad y contraste de cada hipótesis (o la validación del artefacto contra la línea base), con el estadístico, el valor p y la decisión.' }
    ] },
    { c: 'VI', t: 'DISCUSIÓN DE RESULTADOS', s: [
      { id: 'discusion', t: 'Discusión de resultados', cap: true, cons: 'discusion', ayuda: 'Por cada resultado: qué encontraste, qué estudios coinciden o difieren y por qué. Usa la tabla de contraste de Consensus como guía.' }
    ] },
    { c: 'VII', t: 'CONCLUSIONES', s: [
      { id: 'conclusiones', t: 'Conclusiones', cap: true, ayuda: 'Una conclusión por objetivo, en el mismo orden, respondiendo con tus resultados.' }
    ] },
    { c: 'VIII', t: 'RECOMENDACIONES', s: [
      { id: 'recomendaciones', t: 'Recomendaciones', cap: true, cons: 'futuro', ayuda: 'Una por conclusión, dirigida a alguien concreto (la organización, futuros investigadores).' }
    ] },
    { c: 'anexos', t: 'ANEXOS', s: [
      { id: 'anexos', t: 'Anexos', cap: true, ayuda: 'La matriz de consistencia y la declaración de uso de IA se agregan solas. Aquí van los demás: cada «## Título» es un anexo nuevo (instrumento, validación de expertos, base de datos, evidencias).' }
    ] }
  ];
}

/** Lista plana de secciones que aplican al estudiante, con su rotulo ya armado. */
function seccionesInforme_(exp) {
  var r = [];
  estructuraInforme_().forEach(function (cap) {
    cap.s.forEach(function (s) {
      if (s.aplica && !aplica_(s.aplica, exp)) return;
      var t = sust_(sust_(s.t, '{var1}', mayuscula_(exp.var1 || 'variable independiente')), '{var2}', mayuscula_(exp.var2 || 'variable dependiente'));
      var o = { id: s.id, t: t, c: cap.c, ct: cap.t, rot: s.cap || cap.c === 'pre' ? t : s.id + ' ' + t, ayuda: s.ayuda || '', cons: s.cons || '', plan: !!s.plan, antes: s.antes || '', h: s.h || '', cap: !!s.cap };
      r.push(o);
    });
  });
  return r;
}
function seccionInforme_(exp, id) {
  var l = seccionesInforme_(exp);
  for (var i = 0; i < l.length; i++) { if (l[i].id === id) return l[i]; }
  return null;
}
function defSeccion_(id) {
  var e = estructuraInforme_();
  for (var i = 0; i < e.length; i++) { for (var j = 0; j < e[i].s.length; j++) { if (e[i].s[j].id === id) return e[i].s[j]; } }
  return null;
}

// ---------------------------------------------------------------- estado del plan
function jsonExp_(exp, k, def) { try { return exp[k] ? JSON.parse(exp[k]) : def; } catch (e) { return def; } }
function estadoPlan_(exp) {
  return { aprobado: jsonExp_(exp, '_plan_ok', null), solicitud: jsonExp_(exp, '_plan_sol', null), abiertos: jsonExp_(exp, '_plan_abiertos', []), historial: jsonExp_(exp, '_plan_hist', []) };
}
function planCongelado_(exp) { return !!jsonExp_(exp, '_plan_ok', null); }
/** Claves del plan que no se pueden escribir: todas, salvo las autorizadas en una solicitud de cambio. */
function camposBloqueados_(exp, claves) {
  if (!planCongelado_(exp)) return [];
  var ab = jsonExp_(exp, '_plan_abiertos', []);
  return claves.filter(function (k) { return String(k).charAt(0) !== '_' && ab.indexOf(k) < 0; });
}
function exigirEditable_(correo, claves) {
  if (camposBloqueados_(expediente_(correo), claves).length) throw new Error(MSJ_CONGELADO_);
}
function historialPlan_(exp, ev) {
  var h = jsonExp_(exp, '_plan_hist', []);
  h.push(ev);
  return JSON.stringify(h.slice(-40));
}

/** El coordinador (o el administrador) aprueba el plan: se congela y se abre el borrador. */
function aprobarPlan_(ses, a) {
  var correo = normCorreo_(a.correo);
  var u = usuario_(correo);
  if (!u || u.rol !== 'estudiante') throw new Error('Estudiante no encontrado.');
  var exp = expediente_(correo);
  if (!String(exp.titulo || '').trim()) throw new Error('El plan aún no tiene título: no se puede aprobar.');
  var previo = jsonExp_(exp, '_plan_ok', null);
  var v = previo ? (parseInt(previo.v, 10) || 1) + 1 : 1;
  var nota = String(a.nota || '').trim().substring(0, 600);
  // Copia fija del plan aprobado (el Word del plan tal como se aprobo)
  var copia = '';
  try {
    var g = generarPlanDe_(correo, {});
    var f = DriveApp.getFileById(g.id).makeCopy('Plan aprobado v' + v + ' - ' + (exp.autor1 || u.nombre));
    try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e1) { /* se abre desde la cuenta propietaria */ }
    copia = f.getId();
  } catch (e) { copia = ''; }
  var ok = { v: v, f: ahora_(), por: ses.nombre, rol: ses.rol, doc: copia, nota: nota };
  conBloqueo_(function () {
    olvidar_('Expedientes');
    var e2 = expediente_(correo);
    guardarCampos_(correo, { _plan_ok: JSON.stringify(ok), _plan_abiertos: '', _plan_sol: '', _plan_hist: historialPlan_(e2, { f: ok.f, a: previo ? 'reaprobado' : 'aprobado', v: v, por: ses.nombre, x: nota }) });
    agregar_('Comentarios', { fecha: ahora_(), correo: correo, etapa: 'plan', autor: ses.nombre, rol: ses.rol, texto: (previo ? 'Plan aprobado de nuevo (versión ' + v + ').' : 'Plan aprobado. Se abrió el borrador de tesis.') + (nota ? ' ' + nota : ''), decision: 'plan_aprobado' });
  });
  olvidar_('Expedientes');
  try { CacheService.getScriptCache().remove('tablero_v5'); } catch (e3) { /* sin cache */ }
  return verEstudiante_(ses, { correo: correo });
}

/** El estudiante pide cambiar secciones del plan aprobado. */
function solicitarCambioPlan_(ses, a) {
  var exp = expediente_(ses.correo);
  if (!planCongelado_(exp)) throw new Error('Tu plan aún no está aprobado: puedes editarlo directamente.');
  var sol = jsonExp_(exp, '_plan_sol', null);
  if (sol && sol.estado === 'pendiente') throw new Error('Ya tienes una solicitud esperando respuesta de la coordinación.');
  var validas = {};
  campos_().forEach(function (c) { validas[c.clave] = c.etiqueta; });
  var campos = (Array.isArray(a.campos) ? a.campos : []).map(String).filter(function (k) { return validas[k]; }).slice(0, 40);
  if (!campos.length) throw new Error('Elige al menos una sección del plan que necesitas cambiar.');
  var motivo = String(a.motivo || '').trim();
  if (motivo.length < 15) throw new Error('Explica en una o dos oraciones por qué necesitas el cambio.');
  var s = { f: ahora_(), campos: campos, motivo: motivo.substring(0, 800), estado: 'pendiente' };
  conBloqueo_(function () {
    guardarCampos_(ses.correo, { _plan_sol: JSON.stringify(s), _plan_hist: historialPlan_(exp, { f: s.f, a: 'solicitud', por: ses.nombre, x: s.motivo, s: campos }) });
  });
  olvidar_('Expedientes');
  try { CacheService.getScriptCache().remove('tablero_v5'); } catch (e) { /* sin cache */ }
  return { expediente: expediente_(ses.correo) };
}

/** El coordinador autoriza (solo esas secciones) o rechaza la solicitud. */
function resolverCambioPlan_(ses, a) {
  var correo = normCorreo_(a.correo);
  var exp = expediente_(correo);
  var sol = jsonExp_(exp, '_plan_sol', null);
  if (!sol || sol.estado !== 'pendiente') throw new Error('No hay una solicitud pendiente.');
  var decision = a.decision === 'autorizar' ? 'autorizar' : (a.decision === 'rechazar' ? 'rechazar' : '');
  if (!decision) throw new Error('Decisión no válida.');
  var com = String(a.comentario || '').trim().substring(0, 600);
  if (decision === 'rechazar' && com.length < 10) throw new Error('Al rechazar, explica el motivo al estudiante.');
  sol.estado = decision === 'autorizar' ? 'autorizada' : 'rechazada';
  sol.resuelto = ahora_(); sol.por = ses.nombre; sol.comentario = com;
  conBloqueo_(function () {
    var v = { _plan_sol: JSON.stringify(sol), _plan_hist: historialPlan_(exp, { f: sol.resuelto, a: decision === 'autorizar' ? 'autorizado' : 'rechazado', por: ses.nombre, x: com, s: sol.campos }) };
    if (decision === 'autorizar') v._plan_abiertos = JSON.stringify(sol.campos);
    guardarCampos_(correo, v);
    agregar_('Comentarios', { fecha: ahora_(), correo: correo, etapa: 'plan', autor: ses.nombre, rol: ses.rol, texto: (decision === 'autorizar' ? 'Cambio al plan autorizado (' + sol.campos.length + ' secciones). Al terminar, la coordinación vuelve a aprobar el plan.' : 'Cambio al plan no autorizado.') + (com ? ' ' + com : ''), decision: decision === 'autorizar' ? 'plan_cambio_ok' : 'plan_cambio_no' });
  });
  olvidar_('Expedientes');
  try { CacheService.getScriptCache().remove('tablero_v5'); } catch (e) { /* sin cache */ }
  return verEstudiante_(ses, { correo: correo });
}

// ---------------------------------------------------------------- pestana Informe (una fila por seccion)
var COLS_INFORME_ = ['correo', 'seccion', 'texto', 'actualizado'];
function hojaInforme_() {
  var ss = libro_();
  var sh = ss.getSheetByName('Informe');
  if (sh) return sh;
  // Sin bloqueo propio: se llama tambien desde dentro de conBloqueo_()
  sh = ss.insertSheet('Informe');
  try { sh.getRange(1, 1, sh.getMaxRows(), COLS_INFORME_.length).setNumberFormat('@'); } catch (e) { /* hoja simulada */ }
  sh.getRange(1, 1, 1, COLS_INFORME_.length).setValues([COLS_INFORME_]);
  return sh;
}
function idxInforme_(exp) { return jsonExp_(exp, '_inf_idx', {}); }
function exigirBorrador_(exp) { if (!planCongelado_(exp)) throw new Error('El borrador de tesis se abre cuando la coordinación aprueba tu plan.'); }

function leerSeccion_(correo, id) {
  var it = idxInforme_(expediente_(correo))[id];
  if (!it || !it.r) return { texto: '', f: '' };
  var fila = hojaInforme_().getRange(it.r, 1, 1, 3).getValues()[0];
  // La fila debe ser de este estudiante y de esta seccion (defensa ante una hoja editada a mano)
  if (normCorreo_(fila[0]) !== normCorreo_(correo) || String(fila[1]) !== id) return { texto: '', f: '' };
  return { texto: texto_(fila[2]), f: it.f || '' };
}

/** Todas las secciones de un estudiante en una sola lectura del bloque de filas que ocupa. */
function todasSecciones_(correo) {
  var idx = idxInforme_(expediente_(correo)), ids = Object.keys(idx).filter(function (k) { return idx[k] && idx[k].r; });
  var r = {};
  if (!ids.length) return r;
  var filas = ids.map(function (k) { return idx[k].r; });
  var min = Math.min.apply(null, filas), max = Math.max.apply(null, filas);
  var vals = hojaInforme_().getRange(min, 1, max - min + 1, 3).getValues();
  ids.forEach(function (k) {
    var f = vals[idx[k].r - min];
    if (f && normCorreo_(f[0]) === normCorreo_(correo) && String(f[1]) === k) r[k] = texto_(f[2]);
  });
  return r;
}

function palabrasMd_(t) { return palabrasDe_(String(t || '').replace(/[#*_>|$\[\]()!-]/g, ' ')).length; }

/** Guarda una seccion. base: fecha de la version que el estudiante tenia abierta (evita pisar otra ventana). */
function guardarSeccion_(ses, a) {
  var correo = ses.correo;
  var exp = expediente_(correo);
  exigirBorrador_(exp);
  var id = String(a.id || '');
  if (!seccionInforme_(exp, id)) throw new Error('Esa sección no existe en tu borrador.');
  var texto = String(a.texto || '').replace(/\r\n?/g, '\n').replace(/\s+$/, '');
  if (texto.length > INF_MAX_) throw new Error('La sección supera los ' + INF_MAX_ + ' caracteres. Divide el texto con subtítulos o pasa parte a los anexos.');
  return conBloqueo_(function () {
    olvidar_('Expedientes');
    var e2 = expediente_(correo);
    var idx = idxInforme_(e2), it = idx[id] || {};
    if (it.f && a.base !== undefined && a.base !== it.f && !a.forzar) throw new Error('CONFLICTO: esta sección se guardó desde otra ventana o dispositivo (' + it.f + '). Vuelve a abrirla antes de guardar.');
    var sh = hojaInforme_();
    var ahora = ahora_();
    var previo = '';
    if (it.r) {
      var chk = sh.getRange(it.r, 1, 1, 3).getValues()[0];
      if (normCorreo_(chk[0]) !== correo || String(chk[1]) !== id) it.r = 0; else previo = texto_(chk[2]);
    }
    if (it.r && previo === texto) return { id: id, f: it.f || '', n: it.n || 0, e: it.e || '', igual: true };
    if (it.r) sh.getRange(it.r, 3, 1, 2).setValues([[celda_(texto), celda_(ahora)]]);
    else {
      asegurarFilas_(sh, COLS_INFORME_.length, 1);
      sh.appendRow([celda_(correo, true), celda_(id, true), celda_(texto, true), celda_(ahora, true)]);
      it.r = sh.getLastRow();
    }
    it.f = ahora; it.n = palabrasMd_(texto);
    // Si cambia una seccion ya aprobada, vuelve a quedar por revisar
    if (it.e === 'ok') it.e = '';
    idx[id] = it;
    guardarCampos_(correo, { _inf_idx: JSON.stringify(idx) });
    return { id: id, f: ahora, n: it.n, e: it.e || '' };
  });
}

/** El estudiante marca una seccion como lista para su asesor (o quita la marca). */
function marcarSeccionInf_(ses, a) {
  var correo = ses.correo, id = String(a.id || '');
  return conBloqueo_(function () {
    olvidar_('Expedientes');
    var exp = expediente_(correo);
    exigirBorrador_(exp);
    if (!seccionInforme_(exp, id)) throw new Error('Esa sección no existe en tu borrador.');
    var idx = idxInforme_(exp), it = idx[id] || {};
    if (!it.n) throw new Error('La sección aún está vacía.');
    it.e = a.lista ? 'lista' : '';
    idx[id] = it;
    guardarCampos_(correo, { _inf_idx: JSON.stringify(idx) });
    return { idx: idx };
  });
}

/** El asesor aprueba o devuelve una seccion del borrador. */
function revisarSeccionInf_(ses, a) {
  var correo = normCorreo_(a.correo), id = String(a.id || '');
  if (!puedeVer_(ses, correo)) throw new Error('Ese estudiante no está a tu cargo.');
  var dec = a.decision === 'aprobar' ? 'ok' : (a.decision === 'devolver' ? 'dev' : '');
  if (!dec) throw new Error('Decisión no válida.');
  var com = String(a.comentario || '').trim().substring(0, 1000);
  if (dec === 'dev' && com.length < 10) throw new Error('Al devolver una sección, escribe qué debe corregir el estudiante.');
  return conBloqueo_(function () {
    olvidar_('Expedientes');
    var exp = expediente_(correo), sec = seccionInforme_(exp, id);
    if (!sec) throw new Error('Esa sección no existe.');
    var idx = idxInforme_(exp), it = idx[id] || {};
    it.e = dec; it.c = dec === 'dev' ? com : ''; it.rf = ahora_(); it.rp = ses.nombre;
    idx[id] = it;
    guardarCampos_(correo, { _inf_idx: JSON.stringify(idx) });
    agregar_('Comentarios', { fecha: ahora_(), correo: correo, etapa: 'borrador', autor: ses.nombre, rol: ses.rol, texto: (dec === 'ok' ? 'Sección aprobada: ' : 'Sección devuelta: ') + sec.rot + (com ? '. ' + com : ''), decision: dec === 'ok' ? 'inf_ok' : 'inf_devuelta' });
    return { idx: idx };
  });
}

/** Lo que el navegador necesita para abrir el borrador: estructura e indice (sin los textos). */
function informe_(correo) {
  var exp = expediente_(correo);
  return { secciones: seccionesInforme_(exp), idx: idxInforme_(exp), plan: estadoPlan_(exp), norma: INFORME_NORMA_, figuras: figurasPermitidas_(exp), doc: { url: exp._inf_url || '', docx: exp._inf_docx || '', fecha: exp._inf_fecha || '' } };
}

// ---------------------------------------------------------------- traer del plan y pasar a tiempo pasado
var PASADO_IRREG_ = {
  'será': 'fue', 'serán': 'fueron', 'estará': 'estuvo', 'estarán': 'estuvieron', 'tendrá': 'tuvo', 'tendrán': 'tuvieron', 'hará': 'hizo', 'harán': 'hicieron',
  'podrá': 'pudo', 'podrán': 'pudieron', 'habrá': 'hubo', 'obtendrá': 'obtuvo', 'obtendrán': 'obtuvieron', 'mantendrá': 'mantuvo', 'contendrá': 'contuvo', 'contendrán': 'contuvieron',
  'dispondrá': 'dispuso', 'propondrá': 'propuso', 'propondrán': 'propusieron', 'pondrá': 'puso', 'dirá': 'dijo', 'sabrá': 'supo', 'vendrá': 'vino', 'querrá': 'quiso',
  'requerirá': 'requirió', 'requerirán': 'requirieron', 'elegirá': 'eligió', 'medirá': 'midió', 'medirán': 'midieron', 'seguirá': 'siguió', 'conseguirá': 'consiguió', 'servirá': 'sirvió',
  'permitirá': 'permitió', 'permitirán': 'permitieron', 'constituirá': 'constituyó', 'incluirá': 'incluyó', 'incluirán': 'incluyeron', 'construirá': 'construyó', 'distribuirá': 'distribuyó',
  'contribuirá': 'contribuyó', 'contribuirán': 'contribuyeron', 'leerá': 'leyó', 'creerá': 'creyó', 'proveerá': 'proveyó', 'producirá': 'produjo', 'traducirá': 'tradujo', 'reducirá': 'redujo', 'conducirá': 'condujo'
};
function aPasado_(t) {
  // \b no sirve con letras acentuadas: los bordes de palabra se piden a mano
  var L = 'A-Za-zÁÉÍÓÚáéíóúÑñü';
  var re = new RegExp('(^|[^' + L + '])([' + L + ']+?(?:rán|rá))(?![' + L + '])', 'g');
  return String(t || '').replace(re, function (todo, antes, m) {
    var bajo = m.toLowerCase();
    var r = PASADO_IRREG_[bajo];
    if (!r) {
      var mm = /^(.+?)(arán|erán|irán|ará|erá|irá)$/.exec(bajo);
      if (!mm || mm[1].length < 2) return todo;
      var plural = /án$/.test(mm[2]);
      r = mm[1] + (mm[2].charAt(0) === 'a' ? (plural ? 'aron' : 'ó') : (plural ? 'ieron' : 'ió'));
    }
    return antes + (m.charAt(0) !== m.charAt(0).toLowerCase() ? r.charAt(0).toUpperCase() + r.substring(1) : r);
  }).replace(/\b[Ee]l presente proyecto\b/g, function (m) { return m.charAt(0) === 'E' ? 'La presente investigación' : 'la presente investigación'; })
    .replace(/\b[Ee]ste proyecto\b/g, function (m) { return m.charAt(0) === 'E' ? 'Esta investigación' : 'esta investigación'; });
}

function normTitulo_(s) { return sinTildes_(String(s || '')).toLowerCase().replace(/^(?:[ivx]+\.|\d+(?:\.\d+)*|[a-z]\.)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim(); }

/** Bloques de la vista del plan convertidos a Markdown, con las citas sin resolver ([@clave]). */
function bloquesAMd_(bloques, nivelBase) {
  var out = [], titulo = '';
  bloques.forEach(function (b) {
    if (b.t === 'h') { out.push((b.n <= nivelBase + 1 ? '## ' : '### ') + String(b.x).replace(/^(?:[IVX]+\.|\d+(?:\.\d+)*|[A-Z]\.)\s+/, '')); return; }
    if (b.t === 'p') { if (b.pend) return; out.push(b.b ? '**' + b.x + '**' : b.x); return; }
    if (b.t === 'rot') { out.push((b.cur ? '*' + b.r + '*' : '**' + b.r + '**') + ' ' + b.x); return; }
    if (b.t === 'li') { out.push('- ' + b.x); return; }
    if (b.t === 'ley') { titulo = b.x; return; }
    if (b.t === 'tabla') {
      out.push('Tabla: ' + (titulo || 'Título de la tabla'));
      titulo = '';
      b.c.forEach(function (f, i) {
        out.push('| ' + f.map(function (c) { return String(c).replace(/\|/g, '/').replace(/\n+/g, ' '); }).join(' | ') + ' |');
        if (i === 0) out.push('|' + f.map(function () { return '---'; }).join('|') + '|');
      });
      return;
    }
    if (b.t === 'tnota') { out.push('Nota: ' + b.x); return; }
    if (b.t === 'arbol') { out.push('![' + (titulo || 'Árbol de problemas') + ']()'); titulo = ''; return; }
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function traerDelPlan_(ses, a) {
  var correo = ses.correo;
  var exp = expediente_(correo);
  exigirBorrador_(exp);
  var def = defSeccion_(String(a.id || ''));
  if (!def || !def.plan) throw new Error('Esta sección no viene del plan: se escribe desde cero.');
  var buscados = def.plan.map(function (t) { return normTitulo_(sust_(sust_(t, '{var1}', exp.var1 || 'variable independiente'), '{var2}', exp.var2 || 'variable dependiente')); });
  var D;
  CACHE_.crudo = true;
  try { D = nuevoD_(correo, {}); D.vista = true; recorrer_(D); } finally { CACHE_.crudo = false; }
  var bl = D.bloques, ini = -1, nivel = 0;
  for (var i = 0; i < bl.length; i++) {
    if (bl[i].t === 'h' && buscados.indexOf(normTitulo_(bl[i].x)) >= 0) { ini = i; nivel = bl[i].n; break; }
  }
  if (ini < 0) return { md: '', encontrado: false };
  var fin = bl.length;
  for (var j = ini + 1; j < bl.length; j++) { if ((bl[j].t === 'h' && bl[j].n <= nivel) || bl[j].t === 'salto') { fin = j; break; } }
  var md = bloquesAMd_(bl.slice(ini + 1, fin), nivel);
  if (a.pasado) md = aPasado_(md);
  return { md: md, encontrado: true };
}

// ---------------------------------------------------------------- figuras
function figurasPermitidas_(exp) { return jsonExp_(exp, '_inf_figs', []); }
function subirFigura_(ses, a) {
  var correo = ses.correo;
  var exp = expediente_(correo);
  exigirBorrador_(exp);
  var tipo = a.tipo === 'image/png' ? 'image/png' : (a.tipo === 'image/jpeg' ? 'image/jpeg' : '');
  if (!tipo) throw new Error('Sube una imagen PNG o JPG.');
  var datos = String(a.datos || '').replace(/^data:[^,]*,/, '');
  if (!datos || datos.length > INF_FIG_MAX_) throw new Error('La imagen pesa demasiado. La aplicación la reduce sola; si aún falla, recórtala o usa una captura más pequeña.');
  if (figurasPermitidas_(exp).length >= 80) throw new Error('Llegaste al máximo de 80 figuras subidas.');
  var nombre = String(a.nombre || 'figura').replace(/[^\w.\- áéíóúñÁÉÍÓÚÑ]/g, '').substring(0, 80) || 'figura';
  var blob = Utilities.newBlob(Utilities.base64Decode(datos), tipo, nombre);
  var u = usuario_(correo);
  var carpeta = carpetaEstudiante_(u, exp);
  var it = carpeta.getFoldersByName('Figuras del borrador');
  var sub = it.hasNext() ? it.next() : carpeta.createFolder('Figuras del borrador');
  var f = sub.createFile(blob);
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* la vista previa usara la copia del navegador */ }
  var id = f.getId();
  conBloqueo_(function () {
    olvidar_('Expedientes');
    var l = figurasPermitidas_(expediente_(correo));
    if (l.indexOf(id) < 0) l.push(id);
    guardarCampos_(correo, { _inf_figs: JSON.stringify(l) });
  });
  return { id: id };
}

// ---------------------------------------------------------------- Markdown ligero
/**
 * Convierte el texto de una seccion en bloques:
 *  h (## y ###), p, li (- o 1.), cita (>), tabla (Tabla: titulo + filas | ... | + Nota:),
 *  fig (![titulo](fig:ID) o ![titulo]() + Fuente:), eq ($$ ... $$).
 */
function leerMd_(texto) {
  var lineas = String(texto || '').replace(/\r\n?/g, '\n').split('\n');
  var out = [], i = 0, tituloTabla = null;
  while (i < lineas.length) {
    var l = lineas[i], t = l.trim();
    if (!t) { i++; continue; }
    var m;
    if ((m = /^(#{2,4})\s+(.*)$/.exec(t))) { out.push({ t: 'h', n: m[1].length, x: m[2].trim() }); i++; continue; }
    if (/^\$\$/.test(t)) {
      var eq = t.replace(/^\$\$/, '');
      if (/\$\$$/.test(eq) && eq.length >= 2) { out.push({ t: 'eq', x: eq.replace(/\$\$$/, '').trim() }); i++; continue; }
      i++;
      while (i < lineas.length && !/\$\$\s*$/.test(lineas[i])) { eq += '\n' + lineas[i]; i++; }
      if (i < lineas.length) { eq += '\n' + lineas[i].replace(/\$\$\s*$/, ''); i++; }
      out.push({ t: 'eq', x: eq.trim() });
      continue;
    }
    if ((m = /^Tabla\s*:\s*(.*)$/i.exec(t)) && i + 1 < lineas.length && /^\s*\|/.test(lineas[i + 1])) { tituloTabla = m[1].trim(); i++; continue; }
    if (/^\|/.test(t)) {
      var filas = [];
      while (i < lineas.length && /^\s*\|/.test(lineas[i])) {
        var f = lineas[i].trim().replace(/^\|/, '').replace(/\|$/, '');
        if (!/^\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*$/.test(f)) filas.push(f.split('|').map(function (c) { return c.trim(); }));
        i++;
      }
      var nota = '';
      if (i < lineas.length && /^\s*Nota\s*[:.]/i.test(lineas[i])) { nota = lineas[i].trim().replace(/^Nota\s*[:.]\s*/i, ''); i++; }
      var ancho = 0;
      filas.forEach(function (x) { ancho = Math.max(ancho, x.length); });
      filas = filas.map(function (x) { while (x.length < ancho) x.push(''); return x; });
      if (filas.length) out.push({ t: 'tabla', titulo: tituloTabla || '', filas: filas, nota: nota });
      tituloTabla = null;
      continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)]*)\)\s*$/.exec(t))) {
      var src = m[2].trim(), id = /^fig:([A-Za-z0-9_\-]{10,})$/.exec(src);
      var fuente = '';
      if (i + 1 < lineas.length && /^\s*Fuente\s*[:.]/i.test(lineas[i + 1])) { fuente = lineas[i + 1].trim().replace(/^Fuente\s*[:.]\s*/i, ''); i++; }
      out.push({ t: 'fig', titulo: m[1].trim(), id: id ? id[1] : '', fuente: fuente });
      i++;
      continue;
    }
    if ((m = /^[-*•]\s+(.*)$/.exec(t))) { out.push({ t: 'li', o: false, x: m[1] }); i++; continue; }
    if ((m = /^(\d+)[.)]\s+(.*)$/.exec(t))) { out.push({ t: 'li', o: true, num: parseInt(m[1], 10), x: m[2] }); i++; continue; }
    if (/^>\s?/.test(t)) {
      var q = [];
      while (i < lineas.length && /^\s*>/.test(lineas[i])) { q.push(lineas[i].trim().replace(/^>\s?/, '')); i++; }
      out.push({ t: 'cita', x: q.join(' ') });
      continue;
    }
    out.push({ t: 'p', x: t });
    i++;
  }
  return out;
}

/** Tramos con formato de una linea: **negrita**, *cursiva*, __subrayado__ y $ecuacion$. */
function tramosMd_(s) {
  var r = [], re = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*)\*|\$([^$]+)\$)/g, m, ult = 0;
  s = String(s || '');
  while ((m = re.exec(s)) !== null) {
    if (m.index > ult) r.push({ t: s.substring(ult, m.index) });
    if (m[2] !== undefined) r.push({ t: m[2], b: 1, i: 1 });
    else if (m[3] !== undefined) r.push({ t: m[3], b: 1 });
    else if (m[4] !== undefined) r.push({ t: m[4], u: 1 });
    else if (m[5] !== undefined) r.push({ t: m[5], i: 1 });
    else r.push({ t: latexLineal_(m[6]), m: 1 });
    ult = re.lastIndex;
  }
  if (ult < s.length) r.push({ t: s.substring(ult) });
  return r;
}
function sinMarcasMd_(s) { return tramosMd_(s).map(function (x) { return x.t; }).join(''); }

// ---------------------------------------------------------------- piezas del documento
/** Recorre la estructura y arma la lista de piezas (titulos y contenido) con su numeracion final. */
function piezasInforme_(exp, textos) {
  var piezas = [], tablas = [], figuras = [], neq = 0;
  estructuraInforme_().forEach(function (cap) {
    var nCap = ROMANOS_.indexOf(cap.c) + 1;
    if (cap.c !== 'pre' && cap.c !== 'anexos') piezas.push({ k: 'h', n: 1, x: cap.c + '. ' + cap.t, salto: true });
    if (cap.c === 'anexos') { piezas.push({ k: 'h', n: 1, x: 'REFERENCIAS', salto: true }); piezas.push({ k: 'referencias' }); }
    cap.s.forEach(function (s) {
      if (s.aplica && !aplica_(s.aplica, exp)) return;
      var titulo = sust_(sust_(s.t, '{var1}', mayuscula_(exp.var1 || 'variable independiente')), '{var2}', mayuscula_(exp.var2 || 'variable dependiente'));
      if (cap.c === 'pre') piezas.push({ k: 'h', n: 1, x: s.h, salto: true, pre: true });
      else if (cap.c === 'anexos') piezas.push({ k: 'h', n: 1, x: 'ANEXOS', salto: true });
      else if (!s.cap) {
        if (s.antes) piezas.push({ k: 'h', n: 2, x: s.antes });
        piezas.push({ k: 'h', n: s.id.split('.').length, x: s.id + ' ' + titulo });
      }
      var bl = leerMd_(textos[s.id] || '');
      if (cap.c === 'anexos') { piezas.push({ k: 'h', n: 2, x: 'Anexo 01: Matriz de consistencia' }); piezas.push({ k: 'anexoAuto', que: 'matriz' }); tablas.push('Matriz de consistencia'); }
      var partes = s.id.split('.'), n1 = 0, n2 = 0, nAnexo = 1;
      if (!bl.length && cap.c !== 'anexos') piezas.push({ k: 'falta', x: titulo, id: s.id });
      bl.forEach(function (b) {
        if (b.t === 'h') {
          var x = sinMarcasMd_(b.x), nivel, rot;
          if (cap.c === 'anexos') { nAnexo++; rot = 'Anexo ' + (nAnexo < 10 ? '0' : '') + nAnexo + ': ' + x; nivel = 2; }
          else if (cap.c === 'pre') { rot = x; nivel = 2; }
          else if (s.cap) { if (b.n === 2) { n1++; n2 = 0; rot = nCap + '.' + n1 + ' ' + x; nivel = 2; } else { n2++; rot = nCap + '.' + n1 + '.' + n2 + ' ' + x; nivel = 3; } }
          else if (partes.length === 2 && b.n === 2) { n1++; n2 = 0; rot = s.id + '.' + n1 + ' ' + x; nivel = 3; }
          else { n2++; rot = LETRAS_.charAt((n2 - 1) % 26) + '. ' + x; nivel = 4; }
          piezas.push({ k: 'h', n: nivel, x: rot, sub: true });
          return;
        }
        if (b.t === 'tabla') tablas.push(b.titulo ? sinMarcasMd_(b.titulo) : 'Tabla sin título');
        if (b.t === 'fig') figuras.push(b.titulo ? sinMarcasMd_(b.titulo) : 'Figura sin título');
        if (b.t === 'eq') { neq++; b.num = neq; }
        piezas.push({ k: 'b', b: b, sec: s.id });
      });
      if (cap.c === 'anexos') { piezas.push({ k: 'h', n: 2, x: 'Anexo ' + (nAnexo + 1 < 10 ? '0' : '') + (nAnexo + 1) + ': Declaración de uso de inteligencia artificial', salto: true }); piezas.push({ k: 'anexoAuto', que: 'ia' }); }
    });
  });
  return { piezas: piezas, tablas: tablas, figuras: figuras, ecuaciones: neq };
}

// ---------------------------------------------------------------- Word del borrador
function parrafoMd_(D, linea, o) {
  o = o || {};
  var r = resolverCitas_(linea, D.mapa, D.usadas, D.faltan);
  var tr = tramosMd_(r);
  var pref = o.pref || '';
  var plano = pref + tr.map(function (x) { return x.t; }).join('');
  var p;
  if (o.lista) {
    p = D.body.appendListItem(plano);
    p.setGlyphType(o.lista === 'num' ? DocumentApp.GlyphType.NUMBER : DocumentApp.GlyphType.BULLET);
    if (o.listaId) p.setListId(o.listaId);
    p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY).setLineSpacing(D.inter).setSpacingBefore(0).setSpacingAfter(4);
  } else {
    p = nuevoParrafo_(D, plano);
    p.setAlignment(o.centro ? DocumentApp.HorizontalAlignment.CENTER : DocumentApp.HorizontalAlignment.JUSTIFY).setLineSpacing(o.cita ? 1.0 : D.inter).setSpacingBefore(0).setSpacingAfter(6)
      .setIndentStart(o.cita ? 1.27 * CM_ : 0).setIndentFirstLine(o.cita ? 1.27 * CM_ : (o.sinSangria ? 0 : 1.25 * CM_));
  }
  estilo_(p, D, {});
  var t = p.editAsText(), pos = pref.length;
  tr.forEach(function (x) {
    var n = x.t.length;
    if (n) {
      if (x.b) t.setBold(pos, pos + n - 1, true);
      if (x.i || x.m) t.setItalic(pos, pos + n - 1, true);
      if (x.u && t.setUnderline) t.setUnderline(pos, pos + n - 1, true);
      if (x.m) t.setFontFamily(pos, pos + n - 1, 'Cambria Math');
    }
    pos += n;
  });
  resaltar_(p, D);
  return p;
}

function figuraDoc_(D, b) {
  leyenda_(D, 'Figura', b.titulo ? sinMarcasMd_(b.titulo) : '[por completar: título de la figura]');
  var puesta = false;
  if (b.id && D.figuras.indexOf(b.id) >= 0) {
    try {
      var img = D.body.appendImage(DriveApp.getFileById(b.id).getBlob());
      var w = img.getWidth(), h = img.getHeight();
      var ancho = Math.min(D.ancho, w), alto = h * ancho / w, max = 17 * CM_;
      if (alto > max) { ancho = ancho * max / alto; alto = max; }
      img.setWidth(ancho).setHeight(alto);
      img.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      puesta = true;
    } catch (e) { puesta = false; }
  }
  if (!puesta) {
    var p = texto_doc_(D, '[por completar: inserte aquí la figura «' + (sinMarcasMd_(b.titulo) || 'sin título') + '»]', { centro: true });
    if (p) p.setSpacingBefore(30).setSpacingAfter(30);
  }
  notaTabla_(D, b.fuente ? (/[.]$/.test(b.fuente) ? b.fuente : b.fuente + '.') : 'Elaboración propia.');
}

function ecuacionDoc_(D, b) {
  var lineal = latexLineal_(b.x);
  var texto = lineal + '     (' + b.num + ')';
  var p = nuevoParrafo_(D, texto);
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setLineSpacing(D.inter).setSpacingBefore(6).setSpacingAfter(6).setIndentFirstLine(0).setIndentStart(0);
  estilo_(p, D, {});
  if (lineal.length) p.editAsText().setFontFamily(0, lineal.length - 1, 'Cambria Math');
  D.ecs.push({ texto: texto, latex: b.x, num: b.num });
}

function hojaJuradoDoc_(D) {
  texto_doc_(D, 'Tesis sustentada y aprobada ante el jurado evaluador conformado por:', { sinSangria: true });
  ['Presidente', 'Secretario', 'Vocal', 'Asesor'].forEach(function (cargo) {
    var p = texto_doc_(D, '______________________________________', { centro: true });
    if (p) p.setSpacingBefore(36).setSpacingAfter(0);
    texto_doc_(D, cargo + (cargo === 'Asesor' && D.exp.asesor_nombre ? ': ' + D.exp.asesor_nombre : ': [por completar: nombre]'), { centro: true });
  });
}

function listaDoc_(D, titulo, items, tipo) {
  tituloDoc_(D, titulo, 1);
  if (!items.length) { texto_doc_(D, 'No hay ' + (tipo === 'Tabla' ? 'tablas' : 'figuras') + ' en el borrador.', { sinSangria: true }); return; }
  items.forEach(function (x, i) {
    var t = tipo + ' ' + (i + 1) + '. ' + x;
    if (D.vista) { D.bloques.push({ t: 'idx', n: 3, x: t }); return; }
    var p = nuevoParrafo_(D, t);
    p.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(1.15).setSpacingBefore(0).setSpacingAfter(3).setIndentFirstLine(0).setIndentStart(0);
    estilo_(p, D, {});
    p.editAsText().setBold(0, (tipo + ' ' + (i + 1)).length - 1, true);
  });
}

function escribirInforme_(D, info) {
  var titulos = info.piezas.filter(function (x) { return x.k === 'h'; });
  caratula_(D);
  saltoPagina_(D); tituloDoc_(D, 'HOJA DEL JURADO', 1); hojaJuradoDoc_(D);
  var listaId = null, listaTipo = null, ultimo = '';
  var indiceHecho = false;
  info.piezas.forEach(function (pz) {
    if (pz.k === 'h') {
      // El indice y las listas van antes del resumen, como en el Anexo 6
      if (pz.x === 'RESUMEN' && !indiceHecho) {
        indiceHecho = true;
        saltoPagina_(D); tituloDoc_(D, 'ÍNDICE', 1);
        titulos.forEach(function (x) {
          if (x.x === 'DEDICATORIA' || x.x === 'AGRADECIMIENTO') return;
          var sangria = [0, 0, 0.8, 1.6, 2.4][x.n] || 0;
          var p = nuevoParrafo_(D, x.x);
          p.setAlignment(DocumentApp.HorizontalAlignment.LEFT).setLineSpacing(1.15).setSpacingBefore(0).setSpacingAfter(2).setIndentFirstLine(sangria * CM_).setIndentStart(sangria * CM_);
          estilo_(p, D, { negrita: x.n === 1 });
        });
        saltoPagina_(D); listaDoc_(D, 'LISTA DE TABLAS', info.tablas, 'Tabla');
        saltoPagina_(D); listaDoc_(D, 'LISTA DE GRÁFICOS', info.figuras, 'Figura');
      }
      if (pz.salto) saltoPagina_(D);
      tituloDoc_(D, pz.x, pz.n);
      listaId = null; ultimo = 'h';
      return;
    }
    if (pz.k === 'falta') { nota_(D, 'redacta la sección «' + pz.x + '»'); ultimo = ''; return; }
    if (pz.k === 'referencias') { referenciasDoc_(D); return; }
    if (pz.k === 'anexoAuto') {
      if (pz.que === 'matriz') matrizDoc_(D);
      else { declaracionDoc_(D); declaracionInformeDoc_(D); }
      return;
    }
    var b = pz.b;
    // Una lista nueva empieza al cambiar de tipo (vinetas a numerada o al reves)
    if (b.t !== 'li' || (listaTipo !== null && listaTipo !== !!b.o)) listaId = null;
    listaTipo = b.t === 'li' ? !!b.o : null;
    if (b.t === 'p') parrafoMd_(D, b.x, {});
    else if (b.t === 'cita') parrafoMd_(D, b.x, { cita: true });
    else if (b.t === 'li') {
      // setListId recibe el primer elemento de la lista: asi la numeracion sigue
      var p = parrafoMd_(D, b.x, { lista: b.o ? 'num' : 'vin', listaId: listaId });
      if (!listaId) listaId = p;
    }
    else if (b.t === 'tabla') {
      leyenda_(D, 'Tabla', b.titulo ? sinMarcasMd_(b.titulo) : '[por completar: título de la tabla]');
      var enc = b.filas[0].map(sinMarcasMd_), filas = b.filas.slice(1).map(function (f) { return f.map(sinMarcasMd_); });
      if (!filas.length) filas = [enc.map(function () { return ''; })];
      tablaDoc_(D, enc, filas, null, { nota: b.nota ? (/[.]$/.test(b.nota) ? b.nota : b.nota + '.') : 'Elaboración propia.' });
    }
    else if (b.t === 'fig') figuraDoc_(D, b);
    else if (b.t === 'eq') ecuacionDoc_(D, b);
    ultimo = b.t;
  });
}

/** Parrafo extra de la declaracion de IA: busquedas de Consensus y edicion del borrador. */
function declaracionInformeDoc_(D) {
  var n = parseInt(D.exp._inf_cons, 10) || 0;
  texto_doc_(D, 'Para el borrador de tesis se usó, además, la API de Consensus como buscador académico' + (n ? ' (' + n + ' búsquedas registradas)' : '') + ': propuso artículos que el estudiante revisó, verificó por su DOI y citó. Los resultados, su análisis y la discusión son obra ' + (D.exp.autor2 ? 'de los autores' : 'del autor') + '; la aplicación no genera datos.');
}

function generarInforme_(ses, a) {
  var correo = ses.correo;
  var u = usuario_(correo);
  var exp = expediente_(correo);
  exigirBorrador_(exp);
  var textos = todasSecciones_(correo);
  var bib = biblioteca_(correo);
  var D = {
    exp: exp, bib: bib, mapa: mapaBiblioteca_(bib), usadas: {}, faltan: [], pendientes: 0,
    fuente: cfg_('FUENTE', 'Arial'), tam: cfgNum_('TAMANO_FUENTE', 12), inter: cfgNum_('INTERLINEADO', 1.5),
    nTabla: 0, nFigura: 0, correo: correo, vista: false, bloques: [], seccion: '', sid: '', hashes: {}, titulos: null, nivel4: 0, estilo: estiloDe_(exp),
    tipoDoc: cfg_('INFORME_TIPO_DOCUMENTO', 'TESIS PARA OPTAR EL TÍTULO PROFESIONAL DE INGENIERO DE SISTEMAS'), figuras: figurasPermitidas_(exp), ecs: []
  };
  iniciarCitas_(D.estilo);
  var info = piezasInforme_(exp, textos);
  var nombreDoc = 'Borrador de tesis - ' + (exp.autor1 || u.nombre);
  var doc = null, nuevo = false, body = null;
  if (exp._inf_doc) { try { doc = DocumentApp.openById(exp._inf_doc); body = doc.getBody(); body.appendParagraph(''); body.clear(); } catch (e) { doc = null; } }
  if (!doc) { doc = DocumentApp.create(nombreDoc); nuevo = true; body = doc.getBody(); body.clear(); }
  var izq = cfgNum_('MARGEN_IZQ_CM', 2.54) * CM_, otros = cfgNum_('MARGEN_OTROS_CM', 2.54) * CM_;
  var carta = String(cfg_('PAPEL', 'carta')).toLowerCase() !== 'a4';
  var anchoPag = carta ? 612 : 595.28, altoPag = carta ? 792 : 841.89;
  body.setPageWidth(anchoPag).setPageHeight(altoPag);
  body.setMarginLeft(izq).setMarginRight(otros).setMarginTop(otros).setMarginBottom(otros);
  D.body = body; D.ancho = anchoPag - izq - otros; D.primero = true;
  escribirInforme_(D, info);
  doc.saveAndClose();
  var id = doc.getId();
  var archivo = DriveApp.getFileById(id);
  var carpeta = null;
  try { carpeta = carpetaEstudiante_(u, exp); if (nuevo) archivo.moveTo(carpeta); } catch (e2) { /* queda en Mi unidad */ }
  try { archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e3) { /* se abre desde la cuenta propietaria */ }
  var docx = urlDoc_(id, 'docx'), avisoEq = '';
  // Con ecuaciones, el Word se arma aparte para que queden como ecuaciones nativas y editables
  if (D.ecs.length) {
    try {
      var x = docxConEcuaciones_(id, D.ecs, D.ancho, nombreDoc);
      var f = carpeta ? carpeta.createFile(x.blob) : DriveApp.createFile(x.blob);
      try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e4) { /* idem */ }
      if (exp._inf_docx_id) { try { DriveApp.getFileById(exp._inf_docx_id).setTrashed(true); } catch (e5) { /* ya no existe */ } }
      docx = urlArchivo_(f.getId());
      if (x.faltan) avisoEq = x.faltan + ' ecuación(es) quedaron como texto: ábrelas en Word y conviértelas con Insertar, Ecuación.';
      exp._inf_docx_id = f.getId();
    } catch (e6) { avisoEq = 'Las ecuaciones quedaron como texto en el Word (' + e6.message + ').'; }
  }
  var fecha = ahora_();
  conBloqueo_(function () {
    olvidar_('Expedientes');
    guardarCampos_(correo, { _inf_doc: id, _inf_url: urlDoc_(id, 'ver'), _inf_docx: docx, _inf_docx_id: exp._inf_docx_id || '', _inf_fecha: fecha });
  });
  return { url: urlDoc_(id, 'ver'), docx: docx, pdf: urlDoc_(id, 'pdf'), fecha: fecha, pendientes: D.pendientes, citasRotas: D.faltan, ecuaciones: D.ecs.length, avisoEcuaciones: avisoEq };
}

/** Exporta el Doc a .docx y cambia cada parrafo de ecuacion por una ecuacion de Office (OMML). */
function docxConEcuaciones_(docId, ecs, anchoPt, nombre) {
  var r = UrlFetchApp.fetch('https://docs.google.com/document/d/' + docId + '/export?format=docx', { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('no se pudo exportar (código ' + r.getResponseCode() + ')');
  var partes = Utilities.unzip(r.getBlob());
  var faltan = 0, salida = [];
  var centro = Math.round(anchoPt * 10), der = Math.round(anchoPt * 20);   // en veinteavos de punto
  partes.forEach(function (p) {
    if (p.getName() !== 'word/document.xml') { salida.push(p); return; }
    var xml = p.getDataAsString('UTF-8');
    if (!/xmlns:m=/.test(xml)) xml = xml.replace(/<w:document\b/, '<w:document xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
    var pend = ecs.slice();
    xml = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, function (par) {
      if (!pend.length || par.indexOf('<m:oMath') >= 0) return par;
      var txt = '', re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g, m;
      while ((m = re.exec(par)) !== null) txt += m[1] !== undefined ? m[1] : ' ';
      txt = txt.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
      for (var k = 0; k < pend.length; k++) {
        if (txt === pend[k].texto.replace(/\s+/g, ' ').trim()) {
          var e = pend.splice(k, 1)[0];
          return '<w:p><w:pPr><w:tabs><w:tab w:val="center" w:pos="' + centro + '"/><w:tab w:val="right" w:pos="' + der + '"/></w:tabs><w:spacing w:before="120" w:after="120"/></w:pPr>' +
            '<w:r><w:tab/></w:r>' + latexOmml_(e.latex) + '<w:r><w:tab/><w:t>(' + e.num + ')</w:t></w:r></w:p>';
        }
      }
      return par;
    });
    faltan = pend.length;
    salida.push(Utilities.newBlob(xml, 'application/xml', 'word/document.xml'));
  });
  return { blob: Utilities.zip(salida, (nombre || 'Borrador de tesis') + '.docx'), faltan: faltan };
}

/** Busquedas de Consensus hechas desde el borrador (para la declaracion de IA). */
function contarConsensusInf_(correo, n) {
  try {
    conBloqueo_(function () {
      olvidar_('Expedientes');
      var e = expediente_(correo);
      guardarCampos_(correo, { _inf_cons: String((parseInt(e._inf_cons, 10) || 0) + (n || 1)) });
    });
  } catch (e) { /* informativo */ }
}

/** Similitud del borrador frente a los resumenes de la biblioteca (secuencias de 11 palabras, Art. 12). */
function similitudInforme_(correo) {
  var textos = todasSecciones_(correo), bib = biblioteca_(correo);
  var origenes = bib.map(function (b) { return [b.resumen, b.objetivo, b.metodologia, b.resultados, b.conclusion].join(' '); }).filter(function (t) { return t.trim(); });
  var excluidas = { dedicatoria: 1, agradecimiento: 1, anexos: 1 };
  var marcadas = 0, total = 0, porSec = [];
  Object.keys(textos).forEach(function (id) {
    if (excluidas[id]) return;
    var plano = leerMd_(textos[id]).filter(function (b) { return b.t === 'p' || b.t === 'li'; }).map(function (b) { return sinMarcasMd_(b.x).replace(/\[@[^\]]+\]/g, ''); }).join(' ');
    var r = palabrasCopiadas_(plano, origenes);
    marcadas += r.marcadas; total += r.total;
    if (r.fragmentos) porSec.push({ id: id, fragmentos: r.fragmentos, pct: r.total ? Math.round(100 * r.marcadas / r.total) : 0 });
  });
  return { pct: total ? Math.round(100 * marcadas / total) : 0, palabras: total, secciones: porSec, umbral: REGLAMENTO_.umbral };
}

/** Estado del plan y del borrador para la fila del panel y el tablero. */
function resumenPlanFila_(exp) {
  var ok = jsonExp_(exp, '_plan_ok', null), sol = jsonExp_(exp, '_plan_sol', null), idx = idxInforme_(exp), ab = jsonExp_(exp, '_plan_abiertos', []);
  var r = { con: 0, apr: 0, lista: 0, dev: 0, palabras: 0, total: ok ? seccionesInforme_(exp).length : 0 };
  Object.keys(idx).forEach(function (k) { var it = idx[k] || {}; if (it.n) { r.con++; r.palabras += it.n; } if (it.e === 'ok') r.apr++; if (it.e === 'lista') r.lista++; if (it.e === 'dev') r.dev++; });
  return { v: ok ? ok.v : 0, f: ok ? ok.f : '', doc: ok ? ok.doc : '', sol: sol && sol.estado === 'pendiente' ? 'pendiente' : (ab.length ? 'abierto' : ''), inf: r };
}

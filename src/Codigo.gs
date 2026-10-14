/**
 * ¡Quiero ser Ingeniero! - Asistente para el proyecto de tesis.
 * Universidad Nacional de Cañete - Escuela Profesional de Ingeniería de Sistemas.
 *
 * Codigo.gs - Publicacion de la pagina, sesiones, permisos y rutas del servidor.
 * Instalacion: ejecutar instalar() una vez, guardar GEMINI_API_KEY en las propiedades del script
 * e implementar como aplicacion web (ejecutar como: yo; acceso: cualquier usuario).
 *
 * Seguridad: el navegador puede llamar a cualquier funcion cuyo nombre NO termine en guion bajo.
 * Por eso solo hay cuatro funciones publicas: doGet, api (que valida sesion y rol), instalar y
 * cargarPadron (estas dos solo las ejecuta el propietario y no devuelven datos). Todas las demas terminan en guion bajo.
 */

var VERSION_ = '1.7';

function doGet() {
  var t = HtmlService.createTemplateFromFile('Index');
  var out = t.evaluate();
  out.setTitle(cfg_('APP_NOMBRE', 'Quiero ser Ingeniero'));
  out.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  // El administrador eligio publicar la app dentro de Google Sites (asi no aparece la franja de Apps Script).
  // Se apaga con PERMITIR_INSERTAR = NO en la hoja Config.
  if (String(cfg_('PERMITIR_INSERTAR', 'SI')).toUpperCase() !== 'NO') { try { out.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); } catch (e) { /* entorno sin esta opcion */ } }
  return out;
}

/** Solo para la plantilla Index. Termina en guion bajo para que el navegador no pueda llamarla. */
function incluir_(nombre) { return HtmlService.createHtmlOutputFromFile(nombre).getContent(); }

/** Sustituye todas las apariciones de una marca, sin interpretar simbolos especiales. */
function sust_(texto, marca, valor) { return String(texto === null || texto === undefined ? '' : texto).split(marca).join(String(valor === null || valor === undefined ? '' : valor)); }

// ---------------------------------------------------------------- enrutador
// Es una funcion (y no una variable global) para no depender del orden en que Apps Script carga los archivos.
var ROLES_ = ['estudiante', 'asesor', 'admin', 'coordinador', 'asistente'];
// Roles que ven a todos los estudiantes (en solo lectura, salvo el administrador)
var GLOBALES_ = ['admin', 'coordinador', 'asistente'];

function rutas_() {
  return {
  yo: { roles: ROLES_, f: function (s, a) {
    var o = { correo: s.correo, rol: s.rol, nombre: s.nombre, cambiarClave: !!s.cambiarClave };
    // Con a.todo, la primera pantalla llega en la misma llamada (una ida y vuelta menos al entrar)
    if (a && a.todo && !s.cambiarClave) {
      if (s.rol === 'estudiante') o.estado = estadoEstudiante_(s.correo);
      else if (GLOBALES_.indexOf(s.rol) >= 0) { o.tablero = tablero_(s, {}); o.admin = adminEstado_(s); }
      else o.panel = panel_(s);
    }
    return o;
  } },
  estado: { roles: ['estudiante'], f: function (s) { return estadoEstudiante_(s.correo); } },
  clase: { roles: ['estudiante'], f: clase_ },
  guardar: { roles: ['estudiante'], f: guardar_ },
  cerrarEtapa: { roles: ['estudiante'], f: cerrarEtapa_ },
  excepcion: { roles: ['estudiante'], f: pedirExcepcion_ },
  ia: { roles: ['estudiante'], f: consultarIA_ },
  marcarIA: { roles: ['estudiante'], f: marcarIA_ },
  buscar: { roles: ['estudiante'], f: function (s, a) { return buscarEstudios_(a.q, a.desde); } },
  agregarEstudio: { roles: ['estudiante'], f: function (s, a) { agregarEstudio_(s.correo, a); return biblioteca_(s.correo); } },
  editarEstudio: { roles: ['estudiante'], f: editarEstudio_ },
  borrarEstudio: { roles: ['estudiante'], f: borrarEstudio_ },
  iaConsulta: { roles: ['estudiante'], f: consultaParaCopiar_ },
  iaRespuesta: { roles: ['estudiante'], f: function (s, a) { var r = respuestaPegada_(s, a); if (r.modo === 'rubrica') r.resultado = resultadoRubrica_(expediente_(s.correo)); return r; } },
  probarClave: { roles: ['estudiante'], f: probarClave_ },
  vista: { roles: ['estudiante'], f: function (s) { return vistaPrevia_(s.correo); } },
  vistaDe: { roles: ['asesor', 'admin', 'coordinador', 'asistente'], f: function (s, a) { if (!puedeVer_(s, a.correo)) throw new Error('Ese estudiante no está a tu cargo.'); return vistaPrevia_(a.correo); } },
  revisar: { roles: ['estudiante'], f: revisarSeccion_ },
  revisarAsesor: { roles: ['asesor', 'admin'], f: revisarSeccionAsesor_ },
  revisarBloque: { roles: ['asesor', 'admin'], f: revisarBloque_ },
  reglamento: { roles: ['estudiante'], f: function (s) { return reglamento_(s.correo); } },
  reglamentoDe: { roles: ['asesor', 'admin', 'coordinador', 'asistente'], f: function (s, a) { if (!puedeVer_(s, a.correo)) throw new Error('Ese estudiante no está a tu cargo.'); return reglamento_(a.correo); } },
  cambiarClave: { roles: ROLES_, f: cambiarClave_ },
  reiniciarClave: { roles: ['asesor', 'admin', 'asistente'], f: reiniciarClave_ },
  escudo: { roles: ROLES_, f: function () { return escudoParaVista_(); } },
  resumirEstudio: { roles: ['estudiante'], f: function (s, a) { a.modo = 'resumir'; return consultarIA_(s, a); } },
  rubrica: { roles: ['estudiante'], f: function (s, a) { a.modo = 'rubrica'; var r = consultarIA_(s, a); r.resultado = resultadoRubrica_(expediente_(s.correo)); return r; } },
  generarPlan: { roles: ['estudiante'], f: generarPlan_ },
  humanizar: { roles: ['estudiante'], f: humanizar_ },
  analizarReferencias: { roles: ['estudiante'], f: function (s, a) { return analizarReferenciasTexto_(a.texto, s.correo); } },
  agregarReferencias: { roles: ['estudiante'], f: function (s, a) { var r = agregarReferencias_(s.correo, a.items, a.uso); return { biblioteca: biblioteca_(s.correo), agregadas: r.agregadas.length, omitidas: r.omitidas, errores: r.errores }; } },
  verificarReferencias: { roles: ['estudiante'], f: function (s, a) { return verificarLista_(a.items, s.correo); } },
  importarPlan: { roles: ['estudiante'], f: importarPlan_ },
  consensus: { roles: ['estudiante'], f: function (s, a) { var r = buscarConsensus_(s, a); if (a.borrador) contarConsensusInf_(s.correo, (r.consultas || []).length); return r; } },
  probarConsensus: { roles: ['estudiante'], f: function (s, a) { var r = buscarConsensus_(s, { q: 'machine learning', cuantos: 5, claveConsensus: a.claveConsensus }); return { ok: true, resultados: r.resultados.length }; } },
  guardarEstadoArte: { roles: ['estudiante'], f: guardarEstadoArte_ },
  deshacerImportacion: { roles: ['estudiante'], f: deshacerImportacion_ },
  estiloCitas: { roles: ['estudiante'], f: function (s, a) {
    var e = claveEstilo_(a.estilo);
    if (!e) throw new Error('Estilo de citas no válido.');
    conBloqueo_(function () { guardarCampos_(s.correo, { _estilo_cita: e }); });
    olvidar_('Expedientes');
    return { estilo: e, vista: vistaPrevia_(s.correo) };
  } },
  panel: { roles: ['asesor', 'admin', 'coordinador', 'asistente'], f: panel_ },
  verEstudiante: { roles: ['asesor', 'admin', 'coordinador', 'asistente'], f: verEstudiante_ },
  decidir: { roles: ['asesor', 'admin'], f: decidir_ },
  comentar: { roles: ['asesor', 'admin'], f: comentar_ },
  adminUsuario: { roles: ['admin', 'asistente'], f: adminUsuario_ },
  adminEstado: { roles: GLOBALES_, f: adminEstado_ },
  tablero: { roles: GLOBALES_, f: tablero_ },
  // nivel «Borrador de tesis»
  aprobarPlan: { roles: ['coordinador', 'admin'], f: aprobarPlan_ },
  resolverCambioPlan: { roles: ['coordinador', 'admin'], f: resolverCambioPlan_ },
  solicitarCambioPlan: { roles: ['estudiante'], f: solicitarCambioPlan_ },
  informe: { roles: ['estudiante'], f: function (s) { return informe_(s.correo); } },
  informeSeccion: { roles: ['estudiante'], f: function (s, a) { var e = expediente_(s.correo); exigirBorrador_(e); if (!seccionInforme_(e, String(a.id || ''))) throw new Error('Esa sección no existe.'); return leerSeccion_(s.correo, String(a.id)); } },
  informeTodo: { roles: ['estudiante'], f: function (s) { exigirBorrador_(expediente_(s.correo)); return { secciones: todasSecciones_(s.correo) }; } },
  guardarSeccion: { roles: ['estudiante'], f: guardarSeccion_ },
  marcarSeccionInf: { roles: ['estudiante'], f: marcarSeccionInf_ },
  traerDelPlan: { roles: ['estudiante'], f: traerDelPlan_ },
  subirFigura: { roles: ['estudiante'], f: subirFigura_ },
  generarInforme: { roles: ['estudiante'], f: generarInforme_ },
  similitudInforme: { roles: ['estudiante'], f: function (s) { exigirBorrador_(expediente_(s.correo)); return similitudInforme_(s.correo); } },
  informeDe: { roles: ['asesor', 'admin', 'coordinador', 'asistente'], f: function (s, a) {
    if (!puedeVer_(s, a.correo)) throw new Error('Ese estudiante no está a tu cargo.');
    var r = informe_(a.correo); r.textos = planCongelado_(expediente_(a.correo)) ? todasSecciones_(a.correo) : {}; r.similitud = planCongelado_(expediente_(a.correo)) ? similitudInforme_(a.correo) : null; return r;
  } },
  revisarSeccionInf: { roles: ['asesor', 'admin'], f: revisarSeccionInf_ },
  // paso a la version 2 (Migracion.gs)
  exportarExpediente: { roles: ['estudiante'], f: descargarExpediente_ },
  importarExpediente: { roles: ['estudiante', 'admin'], f: importarExpediente_ },
  descargarDatos: { roles: ['admin'], f: function () {
    if (!servidorPropio_() || typeof SERVIDOR_.exportarXlsx !== 'function') throw new Error('En la versión 1, abre la hoja de cálculo desde Google Drive.');
    return SERVIDOR_.exportarXlsx();
  } },
  refrescarDatos: { roles: ['admin'], f: function () { renovarCacheCompartida_(); try { CacheService.getScriptCache().remove('clase_v1'); CacheService.getScriptCache().remove('tablero_v5'); } catch (e) { /* sin cache */ } return { ok: true }; } }
  };
}

// Con SOLO_LECTURA = SI (version 1 despues del traslado) solo se atienden estas acciones
var LECTURA_ = { info: 1, ingresar: 1, cambiarClave: 1, yo: 1, estado: 1, clase: 1, vista: 1, vistaDe: 1, escudo: 1, panel: 1, tablero: 1, verEstudiante: 1, adminEstado: 1,
  reglamento: 1, reglamentoDe: 1, informe: 1, informeSeccion: 1, informeTodo: 1, informeDe: 1, exportarExpediente: 1 };
function soloLectura_() { return !servidorPropio_() && String(cfg_('SOLO_LECTURA', 'NO')).toUpperCase() === 'SI'; }
function msjTraslado_() {
  var u = String(cfg_('NUEVA_DIRECCION', '') || '').trim();
  return 'La aplicación se trasladó' + (u ? ' a ' + u : ' a su nueva dirección') + '. Esta versión quedó solo para consulta: aquí puedes ver tu trabajo y descargar tu expediente.';
}

/** Unica funcion que llama el navegador: api(nombre, token, argumentos). */
function api(nombre, token, args) {
  CACHE_ = {};
  try {
    args = args || {};
    if (nombre === 'info') return { ok: true, data: info_() };
    if (nombre === 'ingresar') return { ok: true, data: ingresar_(args) };
    if (nombre === 'registrar') return { ok: true, data: registrar_(args) };
    if (soloLectura_() && !LECTURA_[nombre]) return { ok: false, error: 'ERROR', mensaje: msjTraslado_() };
    var ses = sesion_(token);
    if (!ses) return { ok: false, error: 'SESION', mensaje: 'Tu sesión terminó. Vuelve a ingresar.' };
    if (ses.cambiarClave && nombre !== 'cambiarClave' && nombre !== 'yo') return { ok: false, error: 'CAMBIAR', mensaje: 'Antes de seguir, cambia tu clave inicial por una propia.' };
    var rutas = rutas_();
    var ruta = Object.prototype.hasOwnProperty.call(rutas, nombre) ? rutas[nombre] : null;
    if (!ruta) throw new Error('Acción desconocida: ' + nombre);
    if (ruta.roles.indexOf(ses.rol) < 0) throw new Error('No tienes permiso para esta acción.');
    return { ok: true, data: ruta.f(ses, args) };
  } catch (err) {
    return { ok: false, error: 'ERROR', mensaje: sinClave_(err && err.message ? err.message : err, args && args.clave ? String(args.clave) : '') };
  }
}

// ---------------------------------------------------------------- acceso
function info_() {
  var instalada = true;
  try { libro_(); hoja_('Config'); } catch (e) { instalada = false; }
  if (!instalada) return { instalada: false, app: 'Quiero ser Ingeniero' };
  return { instalada: true, app: cfg_('APP_NOMBRE', ''), universidad: cfg_('UNIVERSIDAD', ''), escuela: cfg_('ESCUELA', ''), registro: cfg_('PERMITIR_REGISTRO', 'SI') === 'SI', aviso: cfg_('AVISO_INGRESO', ''), traslado: soloLectura_() ? (String(cfg_('NUEVA_DIRECCION', '') || '').trim() || '-') : '', version: servidorPropio_() ? SERVIDOR_.version : VERSION_,
    credito: { autor: cfg_('CREDITO_AUTOR', ''), orcid: cfg_('CREDITO_ORCID', ''), linkedin: cfg_('CREDITO_LINKEDIN', '') } };
}

function sesion_(token) {
  if (!token) return null;
  var c = CacheService.getScriptCache();
  var v = c.get('ses_' + token);
  if (!v) return null;
  c.put('ses_' + token, v, 21600);
  var ses = JSON.parse(v);
  var u = usuario_(ses.correo);
  if (!u || u.activo === 'NO') return null;
  ses.rol = u.rol;
  ses.nombre = u.nombre;
  ses.cambiarClave = debeCambiar_(u);
  return ses;
}

function registrar_(a) {
  if (cfg_('PERMITIR_REGISTRO', 'SI') !== 'SI') throw new Error('El registro está cerrado. Pide a tu profesor que cree tu usuario.');
  var clave = String(a.clave || '').trim().toUpperCase();
  if (!clave || clave !== String(cfg_('CLAVE_REGISTRO', '')).trim().toUpperCase()) throw new Error('La clave del curso no es correcta.');
  var propia = String(a.contrasena || '');
  if (propia.length < 8 || !/[a-zA-Z]/.test(propia) || !/[0-9]/.test(propia)) throw new Error('Tu clave debe tener al menos 8 caracteres, con letras y números.');
  var correo = normCorreo_(a.correo);
  var nombre = String(a.nombre || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) throw new Error('Escribe un correo válido.');
  if (nombre.length < 5) throw new Error('Escribe tus nombres y apellidos completos.');
  return conBloqueo_(function () {
    olvidar_('Usuarios');
    if (usuarioIngreso_(correo)) throw new Error('Ese correo ya está registrado. Ingresa con tu clave o pide a tu asesor que la reinicie.');
    var sal = Utilities.getUuid();
    agregar_('Usuarios', { correo: correo, nombre: nombre, rol: 'estudiante', codigo: '', asesor: normCorreo_(cfg_('ASESOR_POR_DEFECTO', '')), activo: 'SI', creado: ahora_(), alias: '', clave_hash: huellaClave_(sal, propia), sal: sal, cambiar_clave: 'NO', intentos: '0', bloqueo: '', ultimo_ingreso: '' });
    return { correo: correo };
  });
}

// ---------------------------------------------------------------- estudiante
function estadoEstudiante_(correo) {
  var u = usuario_(correo);
  if (!u) throw new Error('Usuario no encontrado.');
  var exp = expediente_(correo);
  return {
    perfil: { correo: normCorreo_(u.correo), nombre: u.nombre, rol: u.rol, asesor: u.asesor },
    config: configPublica_(), etapas: etapas_(), campos: campos_(), rubrica: rubrica_(),
    expediente: exp, avance: avance_(correo), biblioteca: biblioteca_(correo), comentarios: comentarios_(correo),
    uso: usoHoy_(correo), resultadoRubrica: resultadoRubrica_(exp), plantilla: plantilla_(), sencillo: sencillo_(), humanizacion: humanizacionDoc_(exp)
  };
}

function guardar_(ses, a) {
  var correo = ses.correo;
  var valores = a.valores || {};
  var etapaDe = Object.create(null);
  campos_().forEach(function (c) { etapaDe[c.clave] = c.etapa; });
  var limpios = {};
  // Plan aprobado: solo se escriben las secciones que la coordinacion autorizo cambiar
  var bloqueados = camposBloqueados_(expediente_(correo), Object.keys(valores));
  Object.keys(valores).forEach(function (k) {
    if (etapaDe[k] === undefined) return;
    if (bloqueados.indexOf(k) >= 0) return;
    var v = valores[k];
    limpios[k] = (typeof v === 'string') ? v.replace(/\s+$/, '') : v;
  });
  var reabiertas = [];
  conBloqueo_(function () {
    var cambiadas = guardarCampos_(correo, limpios);
    if (!cambiadas.length) return;
    // Se reabre desde la etapa mas temprana que tenga un campo cambiado
    var orden = etapas_().map(function (e) { return e.id; });
    var primera = -1;
    cambiadas.forEach(function (k) { var i = orden.indexOf(etapaDe[k]); if (i >= 0 && (primera < 0 || i < primera)) primera = i; });
    if (primera >= 0) { olvidar_('Avance'); reabiertas = reabrirDesde_(correo, orden[primera]); }
  });
  var salida = { ok: true, reabiertas: reabiertas, avance: avance_(correo) };
  if (bloqueados.length) salida.bloqueados = bloqueados;
  // En el modo sencillo la pagina en vivo viaja con el guardado: una sola llamada
  if (a.vista) { olvidar_('Expedientes'); salida.vista = vistaPrevia_(correo); }
  return salida;
}

function marcarIA_(ses, a) {
  var estado = String(a.estado || '');
  if (['aceptado', 'editado', 'descartado'].indexOf(estado) < 0) throw new Error('Estado no válido.');
  var filas = leer_('Bitacora');
  for (var i = 0; i < filas.length; i++) {
    if (filas[i].id === a.id && normCorreo_(filas[i].correo) === ses.correo) { actualizar_('Bitacora', filas[i]._fila, { aceptado: estado }); return { ok: true }; }
  }
  return { ok: false };
}

function editarEstudio_(ses, a) {
  var permitidos = ['ambito', 'tipo', 'uso', 'indizacion', 'objetivo', 'metodologia', 'resultados', 'conclusion', 'relacion', 'sin_resolver', 'grado', 'fuente', 'editorial', 'url', 'anio', 'titulo', 'volumen', 'numero', 'paginas'];
  return conBloqueo_(function () {
    olvidar_('Biblioteca');
    var f = filaBiblioteca_(ses.correo, a.id);
    if (!f) throw new Error('No se encontró el estudio.');
    var o = {};
    var d = a.datos || {};
    permitidos.forEach(function (k) {
      if (!d.hasOwnProperty(k)) return;
      // Los datos bibliograficos de un estudio verificado por DOI no se cambian a mano
      if (f.verificado === 'crossref' && ['anio', 'titulo', 'fuente', 'volumen', 'numero', 'paginas'].indexOf(k) >= 0) return;
      o[k] = (k === 'url') ? urlSegura_(d[k]) : String(d[k]);
    });
    if (d.hasOwnProperty('autores') && f.verificado !== 'crossref') o.autores = JSON.stringify(parsearAutores_(d.autores));
    actualizar_('Biblioteca', f._fila, o);
    return biblioteca_(ses.correo);
  });
}

function borrarEstudio_(ses, a) {
  return conBloqueo_(function () {
    olvidar_('Biblioteca');
    var f = filaBiblioteca_(ses.correo, a.id);
    if (!f) throw new Error('No se encontró el estudio.');
    borrarFila_('Biblioteca', f._fila);
    return biblioteca_(ses.correo);
  });
}

// ---------------------------------------------------------------- asesor
function misEstudiantes_(ses) {
  return leer_('Usuarios').filter(function (u) {
    if (u.rol !== 'estudiante') return false;
    return GLOBALES_.indexOf(ses.rol) >= 0 || normCorreo_(u.asesor) === ses.correo;
  });
}

function puedeVer_(ses, correo) {
  var u = usuario_(correo);
  if (!u || u.rol !== 'estudiante') return false;
  return GLOBALES_.indexOf(ses.rol) >= 0 || normCorreo_(u.asesor) === ses.correo;
}

/** Roles que cada perfil puede crear, editar o cuya clave puede reiniciar. */
function rolesGestionables_(ses) {
  if (ses.rol === 'admin') return ROLES_.slice();
  if (ses.rol === 'asistente') return ['estudiante', 'asesor'];
  return [];
}

/** Lo costoso de la fila del panel de un estudiante. Se guarda en cache hasta que cambia algo suyo. */
function filaPanel_(correo, etapas) {
  var k = claveEst_('pn2', correo);
  var c = CACHE_[k] || cacheTraer_(k);
  if (c) return c;
  var av = avance_(correo);
  var exp = expediente_(correo);
  var aprobadas = 0, enRevision = [], actual = etapas.length ? etapas[0].nombre : '', ultima = '', hallada = false;
  etapas.forEach(function (e) {
    var a = av[e.id];
    if (a && a.estado === 'aprobada') aprobadas++;
    if (a && a.estado === 'en_revision') enRevision.push(e.id);
    if (a && a.actualizado > ultima) ultima = a.actualizado;
    if (!hallada && !(a && a.estado === 'aprobada')) { actual = e.nombre; hallada = true; }
  });
  if (!hallada) actual = 'Completo';
  var ia = resumenIA_(correo);
  var rub = resultadoRubrica_(exp);
  var re = reelaboracion_(exp);
  var f = {
    revision: resumenRevision_(correo), tituloAjustado: exp._titulo_motivo ? 'SI' : 'NO', esenciales: esenciales_(exp, biblioteca_(correo)),
    titulo: exp.titulo || exp.tema_oracion || '', tipo: exp.tipo_proyecto || '', etapa: actual, aprobadas: aprobadas, total: etapas.length, enRevision: enRevision,
    ultimaEtapa: ultima, ultimaEdicion: ultimaEdicion_(correo), consultas: ia.total, tokens: ia.tokens, plan: exp._plan_url || '', planId: exp._plan_id || '',
    rubrica: rub.porcentaje, rubricaNoVerificados: rub.noVerificados, humanizacion: resumenHum_(exp), secciones: seccionesRev_(exp),
    reelaboracion: { foco: re.foco, reelaborados: re.reelaborados, parciales: re.parciales, iguales: re.iguales, total: re.total },
    porVia: ia.porVia, importacion: resumenImportacion_(exp), planEstado: resumenPlanFila_(exp), biblio: biblioteca_(correo).length, devueltas: (function () { var n = 0, rv = leerRevision_(exp); Object.keys(rv).forEach(function (x) { if (rv[x] && rv[x].e === 'devuelto') n++; }); return n; })()
  };
  CACHE_[k] = f;
  cachePoner_(k, f, 21600);
  return f;
}

/** Avance general del tesista (0 a 100): lo esencial escrito, las secciones revisadas y los textos humanizados, en partes iguales. */
function avanceGeneral_(f) {
  var esen = f.esenciales && f.esenciales.total ? f.esenciales.llenas / f.esenciales.total : 0;
  var rev = f.revision && f.revision.total ? f.revision.revisadas / f.revision.total : 0;
  var hum = f.humanizacion && f.humanizacion.generados ? (f.humanizacion.pct || 0) / 100 : 0;
  return Math.round(100 * (esen + rev + hum) / 3);
}

/** Nombre corto para mostrar a los companeros: «Karla V.» (sin correo ni apellidos completos). */
function nombreCorto_(n) {
  n = String(n || '').trim();
  var i = n.indexOf(',');
  var nombres = i >= 0 ? n.substring(i + 1).trim() : n.split(/\s+/)[0];
  var apellidos = i >= 0 ? n.substring(0, i).trim() : n.split(/\s+/).slice(1).join(' ');
  return (nombres.split(/\s+/)[0] || 'Tesista') + (apellidos ? ' ' + apellidos.charAt(0).toUpperCase() + '.' : '');
}

/**
 * Panel de la clase para el estudiante: el avance del grupo y los tres primeros en cada cosa, para animar
 * la competencia sana. Nunca se envian correos ni datos de otros: solo un nombre corto y la cifra del ranking.
 */
function clase_(ses) {
  var cache = CacheService.getScriptCache();
  var filas = null;
  try { var c = cache.get('clase_v1'); if (c) filas = JSON.parse(c); } catch (e0) { filas = null; }
  if (!filas) {
    var etapas = etapas_();
    filas = leer_('Usuarios').filter(function (u) { return u.rol === 'estudiante' && u.activo !== 'NO'; }).map(function (u) {
      var correo = normCorreo_(u.correo);
      var f = filaPanel_(correo, etapas);
      return { c: correo, n: nombreCorto_(u.nombre), av: avanceGeneral_(f), nv: f.humanizacion.nivel, xp: f.humanizacion.palabrasHumanas || 0, hp: f.humanizacion.pct || 0,
        rv: f.revision ? f.revision.revisadas : 0, rt: f.revision ? f.revision.total : 0, ap: f.secciones ? f.secciones.aprobadas : 0, bi: f.biblio || 0, im: f.importacion && !f.importacion.deshecha ? 1 : 0 };
    });
    try { cache.put('clase_v1', JSON.stringify(filas), 600); } catch (e1) { /* sin cache */ }
  }
  var yo = normCorreo_(ses.correo);
  var n = filas.length;
  var niveles = { semilla: 0, brote: 0, camino: 0, casi: 0, listo: 0, sin: 0 };
  filas.forEach(function (f) { niveles[f.nv] = (niveles[f.nv] || 0) + 1; });
  var cats = [
    { k: 'av', t: 'Avance general', u: '%', d: 'Lo esencial escrito, las secciones revisadas y los textos humanizados' },
    { k: 'xp', t: 'Humanización', u: 'XP', d: 'Palabras escritas con su propia voz' },
    { k: 'rv', t: 'Revisión de la tesis', u: 'secciones', d: 'Secciones leídas y marcadas como revisadas' },
    { k: 'ap', t: 'Aprobado por el asesor', u: 'secciones', d: 'Secciones con el visto bueno del asesor' },
    { k: 'bi', t: 'Biblioteca', u: 'fuentes', d: 'Fuentes verificadas para citar' }
  ].map(function (cat) {
    var orden = filas.slice().sort(function (x, y) { return (y[cat.k] - x[cat.k]) || (y.av - x.av) || (x.n < y.n ? -1 : 1); });
    var mio = 0;
    orden.forEach(function (f, i) { if (f.c === yo) mio = i + 1; });
    var mi = filas.filter(function (f) { return f.c === yo; })[0];
    return { k: cat.k, t: cat.t, u: cat.u, d: cat.d, top: orden.filter(function (f) { return f[cat.k] > 0; }).slice(0, 3).map(function (f) { return { n: f.n, v: f[cat.k], yo: f.c === yo }; }), mio: { v: mi ? mi[cat.k] : 0, puesto: mio } };
  });
  var mia = filas.filter(function (f) { return f.c === yo; })[0] || { av: 0, nv: 'sin', xp: 0, hp: 0 };
  var suma = function (k) { return filas.reduce(function (s, f) { return s + (f[k] || 0); }, 0); };
  return {
    n: n, promedio: n ? Math.round(suma('av') / n) : 0, niveles: niveles, palabras: suma('xp'), revisadas: suma('rv'), secciones: suma('rt'), aprobadas: suma('ap'), importaron: suma('im'),
    categorias: cats, yo: { avance: mia.av, nivel: mia.nv, xp: mia.xp, puesto: cats[0].mio.puesto }, distribucion: filas.map(function (f) { return f.av; }).sort(function (a, b) { return a - b; }), actualizado: ahora_()
  };
}

function panel_(ses) {
  var etapas = etapas_();
  var hoy = new Date();
  var lista = misEstudiantes_(ses).map(function (u) {
    var correo = normCorreo_(u.correo);
    var f = filaPanel_(correo, etapas);
    // Dias sin actividad: desde lo ultimo entre su alta, sus etapas y lo que escribio (se calcula hoy, no se guarda)
    var ultima = [String(u.creado || ''), String(f.ultimaEtapa || ''), String(f.ultimaEdicion || '')].sort().pop();
    var dias = diasDesde_(ultima, hoy);
    var o = {};
    Object.keys(f).forEach(function (x) { o[x] = f[x]; });
    o.correo = correo; o.nombre = u.nombre; o.asesor = u.asesor; o.pendienteClave = debeCambiar_(u) ? 'SI' : 'NO'; o.ultimoIngreso = u.ultimo_ingreso || '';
    o.dias = dias; o.hoy = usoHoy_(correo); o.avance = avanceGeneral_(f);
    return o;
  });
  return { estudiantes: lista, etapas: etapas, config: configPublica_() };
}

function verEstudiante_(ses, a) {
  if (!puedeVer_(ses, a.correo)) throw new Error('Ese estudiante no está a tu cargo.');
  var e = estadoEstudiante_(a.correo);
  e.ia = resumenIA_(a.correo);
  e.reelaboracion = reelaboracion_(e.expediente);
  return e;
}

function decidir_(ses, a) {
  if (!puedeVer_(ses, a.correo)) throw new Error('Ese estudiante no está a tu cargo.');
  var etapa = String(a.etapa);
  var decision = String(a.decision);
  if (['aprobar', 'devolver'].indexOf(decision) < 0) throw new Error('Decisión no válida.');
  var texto = String(a.comentario || '').trim();
  if (decision === 'devolver' && texto.length < 10) throw new Error('Al devolver una etapa, escribe qué debe corregir el estudiante.');
  return conBloqueo_(function () {
    olvidar_('Avance');
    var av = avance_(a.correo)[etapa];
    if (!av || av.estado !== 'en_revision') throw new Error('Esta etapa no está esperando revisión.');
    var cambio = { estado: decision === 'aprobar' ? 'aprobada' : 'devuelta', semaforo: decision === 'aprobar' ? (av.semaforo === 'rojo' ? 'ambar' : av.semaforo) : av.semaforo };
    // Al aprobar, el asesor resuelve lo que estaba pendiente de una revision verificada
    if (decision === 'aprobar' && av.detalle && av.detalle.sinVerificar) { var dd = av.detalle; delete dd.sinVerificar; cambio.detalle = dd; }
    ponerAvance_(a.correo, etapa, cambio);
    agregar_('Comentarios', { fecha: ahora_(), correo: normCorreo_(a.correo), etapa: etapa, autor: ses.nombre, rol: ses.rol, texto: texto, decision: decision === 'aprobar' ? 'aprobada' : 'devuelta' });
    return verEstudiante_(ses, a);
  });
}

function comentar_(ses, a) {
  if (!puedeVer_(ses, a.correo)) throw new Error('Ese estudiante no está a tu cargo.');
  var texto = String(a.texto || '').trim();
  if (!texto) throw new Error('Escribe el comentario.');
  conBloqueo_(function () { agregar_('Comentarios', { fecha: ahora_(), correo: normCorreo_(a.correo), etapa: String(a.etapa), autor: ses.nombre, rol: ses.rol, texto: texto, decision: '' }); });
  return verEstudiante_(ses, a);
}

// ---------------------------------------------------------------- administrador
function adminUsuario_(ses, a) {
  var correo = normCorreo_(a.correo);
  var nombre = String(a.nombre || '').trim();
  var rol = String(a.rol || 'estudiante');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) throw new Error('Escribe un correo válido.');
  var gestion = rolesGestionables_(ses);
  if (ROLES_.indexOf(rol) < 0) throw new Error('Rol no válido.');
  if (gestion.indexOf(rol) < 0) throw new Error('Tu perfil no puede asignar el rol «' + rol + '».');
  if (correo === ses.correo && (rol !== ses.rol || a.activo === 'NO')) throw new Error('No puedes cambiar tu propio rol ni desactivarte.');
  try { CacheService.getScriptCache().remove('tablero_v5'); } catch (e0) { /* sin cache */ }
  return conBloqueo_(function () {
    olvidar_('Usuarios');
    var u = usuario_(correo);
    if (u && correo !== ses.correo && gestion.indexOf(u.rol) < 0) throw new Error('Tu perfil no puede modificar a ese usuario.');
    if (u) {
      var o = { rol: rol, asesor: normCorreo_(a.asesor), activo: a.activo === 'NO' ? 'NO' : 'SI' };
      if (nombre) o.nombre = nombre;
      if (a.nuevoCodigo) { o.codigo = claveInicial_(nombre || u.nombre); o.clave_hash = ''; o.sal = ''; o.cambiar_clave = 'SI'; o.intentos = '0'; o.bloqueo = ''; }
      if (a.alias !== undefined) o.alias = normCorreo_(a.alias);
      actualizar_('Usuarios', u._fila, o);
    } else {
      if (nombre.length < 3) throw new Error('Escribe el nombre como «Apellidos, Nombres».');
      agregar_('Usuarios', { correo: correo, nombre: nombre, rol: rol, codigo: claveInicial_(nombre), asesor: normCorreo_(a.asesor), activo: 'SI', creado: ahora_(), alias: normCorreo_(a.alias), clave_hash: '', sal: '', cambiar_clave: 'SI', intentos: '0', bloqueo: '', ultimo_ingreso: '' });
    }
    return adminEstado_(ses);
  });
}

/** Cuentas institucionales que pidio la coordinacion. Se crean una sola vez, la primera vez que el administrador abre su panel. */
var USUARIOS_FIJOS_ = [
  { correo: 'calmidon@undc.edu.pe', nombre: 'Almid\u00f3n, Carlos', rol: 'coordinador' },
  { correo: '2101010021@undc.edu.pe', nombre: 'Brando', rol: 'asistente' }
];
function asegurarFijos_() {
  var p = props_();
  if (p.getProperty('USUARIOS_FIJOS') === 'v1') return;
  conBloqueo_(function () {
    olvidar_('Usuarios');
    USUARIOS_FIJOS_.forEach(function (f) {
      if (usuario_(f.correo)) return;
      agregar_('Usuarios', { correo: f.correo, nombre: f.nombre, rol: f.rol, codigo: claveInicial_(f.nombre), asesor: '', activo: 'SI', creado: ahora_(), alias: '', clave_hash: '', sal: '', cambiar_clave: 'SI', intentos: '0', bloqueo: '', ultimo_ingreso: '' });
    });
  });
  p.setProperty('USUARIOS_FIJOS', 'v1');
}

function adminEstado_(ses) {
  if (ses.rol === 'admin') { try { asegurarFijos_(); } catch (e) { /* no impide abrir el panel */ } }
  var p = props_();
  var gestion = rolesGestionables_(ses);
  var base = { usuarios: usuariosPublicos_(), roles: gestion, claveRegistro: cfg_('CLAVE_REGISTRO', ''), registro: cfg_('PERMITIR_REGISTRO', 'SI') };
  // El coordinador y el asistente no ven el estado del sistema ni las claves iniciales de quienes no gestionan
  if (ses.rol !== 'admin') {
    base.usuarios = base.usuarios.map(function (u) { if (gestion.indexOf(u.rol) < 0 && u.correo !== ses.correo) u.codigo = ''; return u; });
    return base;
  }
  return {
    usuarios: base.usuarios, roles: gestion, claveRegistro: base.claveRegistro, registro: base.registro,
    sistema: {
      gemini: p.getProperty('GEMINI_API_KEY') ? 'Configurada' : 'Falta la clave GEMINI_API_KEY en las propiedades del script',
      openalex: p.getProperty('OPENALEX_API_KEY') ? 'Con clave' : 'Sin clave (uso básico; si falla, se usa Crossref)',
      modeloCompuertas: cfg_('MODELO_COMPUERTAS', ''), modeloLigero: cfg_('MODELO_LIGERO', ''),
      claveRegistro: cfg_('CLAVE_REGISTRO', ''), registro: cfg_('PERMITIR_REGISTRO', 'SI'), cuota: cfg_('CUOTA_DIARIA', '40'),
      modoInicial: configPublica_().MODO_INICIAL, etapasEnOrden: configPublica_().ETAPAS_EN_ORDEN, modos: modosIA_().join(','), revisionVerde: String(cfg_('REVISION_VERDE', 'estudiante')).toLowerCase(), nano: cfg_('NANO_URL', '') || '(solo dentro de la aplicación)', revisionSinIA: String(cfg_('REVISION_SIN_IA', 'reglas')).trim().toLowerCase(),
      hoja: libro_().getUrl(), consultas: leer_('Bitacora').length
    }
  };
}

// ---------------------------------------------------------------- tablero del coordinador
/** Fecha 'yyyy-MM-dd HH:mm:ss' a dias transcurridos ('' si no hay fecha). */
function diasDesde_(f, hoy) {
  if (!f) return '';
  var d = new Date(String(f).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  return Math.max(0, Math.floor((hoy.getTime() - d.getTime()) / 86400000));
}

/**
 * Metricas de todos los tesistas y de los asesores. Es costoso (arma la vista de cada tesis),
 * por eso se guarda diez minutos en cache; a.forzar lo recalcula.
 */
function tablero_(ses, a) {
  a = a || {};
  var cache = CacheService.getScriptCache();
  if (!a.forzar) {
    var guardado = cache.get('tablero_v5');
    if (guardado) { try { return JSON.parse(guardado); } catch (e0) { /* se recalcula */ } }
  }
  var hoy = new Date();
  var global = { correo: ses.correo, rol: 'admin', nombre: ses.nombre };
  var p = panel_(global);
  var usuarios = leer_('Usuarios');
  var nombreDe = {};
  usuarios.forEach(function (u) { nombreDe[normCorreo_(u.correo)] = u.nombre; });
  var acc = accesos_();
  var ingresos = {}, ingresos30 = {};
  acc.forEach(function (r) {
    var c = normCorreo_(r.correo);
    ingresos[c] = (ingresos[c] || 0) + 1;
    var d = diasDesde_(r.fecha, hoy);
    if (d !== '' && d <= 30) ingresos30[c] = (ingresos30[c] || 0) + 1;
  });
  // Comentarios y decisiones por estudiante
  var com = {};
  leer_('Comentarios').forEach(function (r) {
    if (r.rol === 'estudiante') return;
    var c = normCorreo_(r.correo);
    var o = com[c] || (com[c] = { comentarios: 0, aprobaciones: 0, devoluciones: 0, ultima: '', porRol: {} });
    if (r.decision === 'aprobada' || r.decision === 'seccion_ok') o.aprobaciones++;
    else if (r.decision === 'devuelta' || r.decision === 'seccion_devuelta') o.devoluciones++;
    else o.comentarios++;
    if (String(r.fecha) > o.ultima) o.ultima = String(r.fecha);
    o.porRol[r.rol] = (o.porRol[r.rol] || 0) + 1;
  });
  // Grupos de tesis: los coautores comparten el identificador del plan
  var grupos = {};
  var filas = p.estudiantes.map(function (x) {
    var g = x.planId || x.correo;
    (grupos[g] = grupos[g] || []).push(x.correo);
    var c = com[x.correo] || { comentarios: 0, aprobaciones: 0, devoluciones: 0, ultima: '' };
    var esen = x.esenciales && x.esenciales.total ? Math.round(100 * x.esenciales.llenas / x.esenciales.total) : 0;
    var rev = x.revision && x.revision.total ? Math.round(100 * x.revision.revisadas / x.revision.total) : 0;
    var devueltas = x.devueltas || 0;
    return {
      correo: x.correo, nombre: x.nombre, asesor: normCorreo_(x.asesor), asesorNombre: nombreDe[normCorreo_(x.asesor)] || '', titulo: x.titulo, tipo: x.tipo, grupo: g,
      esenciales: esen, esencialesTxt: x.esenciales ? x.esenciales.llenas + '/' + x.esenciales.total : '', revisadas: x.revision ? x.revision.revisadas : 0, secciones: x.revision ? x.revision.total : 0, revision: rev,
      devueltas: devueltas, etapa: x.etapa, aprobadas: x.aprobadas, totalEtapas: x.total, enRevision: x.enRevision.length,
      ultimoIngreso: x.ultimoIngreso, diasIngreso: diasDesde_(x.ultimoIngreso, hoy), dias: x.dias, pendienteClave: x.pendienteClave,
      consultas: x.consultas, tokens: x.tokens, rubrica: x.rubrica || 0, plan: x.plan, ingresos: ingresos[x.correo] || 0,
      avance: x.avance, importacion: x.importacion, fuentes: x.biblio || 0,
      planEstado: x.planEstado || null, planV: x.planEstado ? (x.planEstado.sol === 'pendiente' ? 0.5 : x.planEstado.v) : 0, borrador: x.planEstado && x.planEstado.inf ? x.planEstado.inf.con : 0,
      reelaboracion: x.reelaboracion, humanizacion: x.humanizacion, seccionesRevisadas: x.revision ? x.revision.revisadas : 0, seccionesAprobadas: x.secciones.aprobadas, seccionesTotal: x.revision ? x.revision.total : 0, comentariosAsesor: c.comentarios, aprobaciones: c.aprobaciones, devoluciones: c.devoluciones, ultimaAccionAsesor: c.ultima
    };
  });
  filas.forEach(function (f) {
    f.companeros = grupos[f.grupo].filter(function (c) { return c !== f.correo; }).map(function (c) { return nombreDe[c] || c; });
  });
  // IA por modo, sumando a todos
  var porVia = { curso: 0, propia: 0, copiar: 0, nano: 0 };
  p.estudiantes.forEach(function (x) { var pv = x.porVia || {}; Object.keys(porVia).forEach(function (k) { porVia[k] += pv[k] || 0; }); });
  // Asesores
  var asesores = usuarios.filter(function (u) { return u.rol === 'asesor' || (u.rol === 'admin' && filas.some(function (f) { return f.asesor === normCorreo_(u.correo); })); }).map(function (u) {
    var c = normCorreo_(u.correo);
    var suyos = filas.filter(function (f) { return f.asesor === c; });
    var prom = function (k) { return suyos.length ? Math.round(suyos.reduce(function (s, f) { return s + (f[k] || 0); }, 0) / suyos.length) : 0; };
    var ultima = '';
    suyos.forEach(function (f) { if (f.ultimaAccionAsesor > ultima) ultima = f.ultimaAccionAsesor; });
    return {
      correo: c, nombre: u.nombre, activo: u.activo !== 'NO', estudiantes: suyos.length, tesis: Object.keys(suyos.reduce(function (m, f) { m[f.grupo] = 1; return m; }, {})).length,
      ultimoIngreso: u.ultimo_ingreso || '', diasIngreso: diasDesde_(u.ultimo_ingreso, hoy), pendienteClave: debeCambiar_(u) ? 'SI' : 'NO',
      ingresos: ingresos[c] || 0, ingresos30: ingresos30[c] || 0,
      comentarios: suyos.reduce(function (s, f) { return s + f.comentariosAsesor; }, 0), aprobaciones: suyos.reduce(function (s, f) { return s + f.aprobaciones; }, 0), devoluciones: suyos.reduce(function (s, f) { return s + f.devoluciones; }, 0),
      ultimaAccion: ultima, esenciales: prom('esenciales'), revision: prom('revision'),
      inactivos: suyos.filter(function (f) { return f.dias !== '' && f.dias >= 14; }).length, porRevisar: suyos.reduce(function (s, f) { return s + f.enRevision; }, 0)
    };
  });
  // Ingresos por semana (ultimas 8), separados por rol
  var semanas = [];
  for (var i = 7; i >= 0; i--) semanas.push({ desde: Utilities.formatDate(new Date(hoy.getTime() - (i * 7 + 6) * 86400000), TZ_, 'dd/MM'), estudiante: 0, asesor: 0, otros: 0 });
  acc.forEach(function (r) {
    var d = diasDesde_(r.fecha, hoy);
    if (d === '' || d > 55) return;
    var s = semanas[7 - Math.floor(d / 7)];
    if (!s) return;
    if (r.rol === 'estudiante') s.estudiante++; else if (r.rol === 'asesor') s.asesor++; else s.otros++;
  });
  var n = filas.length;
  var media = function (k) { return n ? Math.round(filas.reduce(function (s, f) { return s + (f[k] || 0); }, 0) / n) : 0; };
  var kpi = {
    estudiantes: n, tesis: Object.keys(grupos).length, asesores: asesores.length,
    activos7: filas.filter(function (f) { return f.diasIngreso !== '' && f.diasIngreso <= 7; }).length,
    nuncaIngresaron: filas.filter(function (f) { return !f.ultimoIngreso; }).length,
    clavePendiente: filas.filter(function (f) { return f.pendienteClave === 'SI'; }).length,
    esenciales: media('esenciales'), revision: media('revision'),
    revisionCompleta: filas.filter(function (f) { return f.secciones && f.revisadas === f.secciones; }).length,
    planes: filas.filter(function (f) { return !!f.plan; }).length,
    inactivos14: filas.filter(function (f) { return f.dias !== '' && f.dias >= 14; }).length,
    porRevisar: filas.reduce(function (s, f) { return s + f.enRevision; }, 0),
    devueltas: filas.reduce(function (s, f) { return s + f.devueltas; }, 0),
    consultas: filas.reduce(function (s, f) { return s + f.consultas; }, 0),
    rubrica: media('rubrica'), avance: media('avance'),
    importaron: filas.filter(function (f) { return f.importacion && !f.importacion.deshecha; }).length,
    humGenerados: filas.reduce(function (s, f) { return s + f.humanizacion.generados; }, 0),
    humListos: filas.reduce(function (s, f) { return s + f.humanizacion.listos; }, 0),
    palabrasIA: filas.reduce(function (s, f) { return s + f.humanizacion.palabrasIA; }, 0),
    palabrasHumanas: filas.reduce(function (s, f) { return s + f.humanizacion.palabrasHumanas; }, 0),
    secRevisadas: filas.reduce(function (s, f) { return s + f.seccionesRevisadas; }, 0),
    secAprobadas: filas.reduce(function (s, f) { return s + f.seccionesAprobadas; }, 0),
    secTotal: filas.reduce(function (s, f) { return s + f.seccionesTotal; }, 0),
    humListosEst: filas.filter(function (f) { return f.humanizacion.nivel === 'listo'; }).length,
    conIA: filas.filter(function (f) { return f.reelaboracion && f.reelaboracion.total; }).length,
    focoVerde: filas.filter(function (f) { return f.reelaboracion && f.reelaboracion.foco === 'verde'; }).length,
    focoRojo: filas.filter(function (f) { return f.reelaboracion && f.reelaboracion.foco === 'rojo'; }).length,
    planesAprobados: filas.filter(function (f) { return f.planEstado && f.planEstado.v; }).length,
    solicitudesPlan: filas.filter(function (f) { return f.planEstado && f.planEstado.sol === 'pendiente'; }).length,
    palabrasBorrador: filas.reduce(function (s, f) { return s + (f.planEstado && f.planEstado.inf ? f.planEstado.inf.palabras : 0); }, 0)
  };
  var salida = { generado: ahora_(), kpi: kpi, estudiantes: filas, asesores: asesores, porVia: porVia, semanas: semanas, accesosDesde: acc.length ? acc[0].fecha : '', panel: p };
  try { cache.put('tablero_v5', JSON.stringify(salida), 600); } catch (e2) { /* demasiado grande para la cache */ }
  return salida;
}

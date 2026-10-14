/* Prueba del servidor en Node: carga el simulador y los archivos .gs de dist/ en un mismo contexto. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
ctx.globalThis = ctx;
function cargar(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); }
const MODO = process.env.MODO || 'F1A1';
ctx.__hojaModo = { formato: MODO.indexOf('F1') >= 0, apostrofo: MODO.indexOf('A1') >= 0 };
// MODO_AP simula que appendRow trata los textos de otra manera que setValues
const MODO_AP = process.env.MODO_AP || MODO;
if (process.env.MODO_AP) ctx.__hojaModoAnexar = { formato: MODO_AP.indexOf('F1') >= 0, apostrofo: MODO_AP.indexOf('A1') >= 0 };
ctx.__filasIniciales = 95;
cargar(path.join(RAIZ, 'test/mock.js'));
cargar(path.join(RAIZ, 'test/demo.js'));
for (const f of fs.readdirSync(path.join(RAIZ, 'dist')).filter(x => x.endsWith('.gs')).sort()) cargar(path.join(RAIZ, 'dist', f));
const G = ctx;
let fallos = 0, pruebas = 0;
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
function api(n, t, a) { return vm.runInContext('api', ctx)(n, t, a === undefined ? {} : JSON.parse(JSON.stringify(a))); }
function bien(n, t, a) { const r = api(n, t, a); if (!r.ok) { fallos++; console.log('  ERROR en ' + n + ': ' + r.mensaje); return null; } return JSON.parse(JSON.stringify(r.data)); }

// --- antes de instalar
ok(api('info').data.instalada === false, 'info antes de instalar');
const salidaInstalar = vm.runInContext('instalar()', ctx);
ok(!/Código|ING-|docs\.google/.test(salidaInstalar), 'instalar() no devuelve datos sensibles: ' + salidaInstalar);
ok(G.__mock.props.MODO_TEXTO === MODO + '|' + MODO_AP, 'modo de texto detectado, por separado para setValues y appendRow: ' + G.__mock.props.MODO_TEXTO + ' (esperado ' + MODO + '|' + MODO_AP + ')');
ctx.__usuarioActivo = '';
let negado = ''; try { vm.runInContext('instalar()', ctx); } catch (e) { negado = e.message; }
ok(/solo puede ejecutarla el propietario/.test(negado), 'instalar() llamada por un visitante de la aplicación web se rechaza: ' + negado);
ctx.__usuarioActivo = 'otro@undc.edu.pe';
negado = ''; try { vm.runInContext('instalar()', ctx); } catch (e) { negado = e.message; }
ok(/solo puede ejecutarla el propietario/.test(negado), 'instalar() llamada por otro usuario del dominio se rechaza');
ctx.__usuarioActivo = undefined;
ok(typeof vm.runInContext('typeof guardarClaveGemini', ctx) === 'string' && vm.runInContext('typeof guardarClaveGemini', ctx) === 'undefined' && vm.runInContext('typeof include', ctx) === 'undefined', 'no quedan funciones publicas de mas');
const publicas = Object.keys(ctx).filter(k => typeof ctx[k] === 'function' && !/_$/.test(k) && /^[a-z]/.test(k) && !/^(console|setTimeout)$/.test(k));
ok(publicas.sort().join() === 'api,cargarPadron,doGet,exportarTodo,instalar', 'funciones publicas: ' + publicas.sort().join());
const info = bien('info');
ok(info.instalada && info.app === '¡Quiero ser Ingeniero!', 'info despues de instalar');
const libro = Object.values(G.__mock.libros)[0];
const hoja = n => libro.getSheetByName(n).datos;
// --- valores por defecto de la versión 1.2: modo sencillo y etapas abiertas. El recorrido que sigue prueba la ruta estricta.
ok(vm.runInContext('cfg_("MODO_INICIAL", "")', ctx) === 'sencillo' && vm.runInContext('cfg_("ETAPAS_EN_ORDEN", "")', ctx) === 'NO' && hoja('Sencillo').length === 18 && hoja('Sencillo')[1][2] === 'titulo', 'por defecto: modo sencillo, etapas abiertas y 17 preguntas esenciales que empiezan por el título');
vm.runInContext('ponerConfig_("ETAPAS_EN_ORDEN", "SI")', ctx);
ok(hoja('Rubrica').length === 37, 'rubrica 36 items: ' + hoja('Rubrica').length);
ok(hoja('Campos').length > 70, 'campos');
const cfg = k => hoja('Config').find(f => f[0] === k)[1];
const clave = cfg('CLAVE_REGISTRO');
ok(/^ING-/.test(clave), 'clave de registro');
const admin = hoja('Usuarios')[1];
ok(admin[2] === 'admin', 'admin creado');

// --- acceso
ok(api('ingresar', '', { correo: 'x@y.pe', codigo: 'NADA' }).ok === false, 'ingreso invalido');
ok(api('registrar', '', { correo: 'ana@undc.edu.pe', nombre: 'Ana Demo Demo', clave: 'MALA' }).ok === false, 'registro con clave mala');
ok(api('registrar', '', { correo: 'ana@undc.edu.pe', nombre: 'Ana Demo Demo', clave, contrasena: 'corta' }).ok === false, 'registro con clave propia débil');
const reg = bien('registrar', '', { correo: 'Ana@undc.edu.pe ', nombre: 'Ana Demo Demo', clave: clave.toLowerCase(), contrasena: 'AnaClave2026' });
ok(reg && reg.correo === 'ana@undc.edu.pe' && !reg.codigo, 'registro con clave propia (no se devuelve ningún código)');
ok(!hoja('Usuarios').some(f => f.indexOf('AnaClave2026') >= 0), 'la clave propia no se guarda en claro');
ok(api('registrar', '', { correo: 'ana@undc.edu.pe', nombre: 'Ana Demo Demo', clave }).ok === false, 'registro duplicado');
const NUEVA = 'MiClaveSegura9';
function entrar(correo, inicial) {
  const s = bien('ingresar', '', { correo, contrasena: inicial });
  if (s && s.perfil.cambiarClave) {
    ok(api('estado', s.token).error === 'CAMBIAR' || api('panel', s.token).error === 'CAMBIAR', 'con clave inicial no se puede usar la aplicación: ' + correo);
    bien('cambiarClave', s.token, { actual: inicial, nueva: NUEVA });
  }
  return s;
}
const sA = entrar(admin[0], admin[3]);
const tA = sA.token;
ok(sA.perfil.cambiarClave === true, 'el administrador debe cambiar su clave inicial');
ok(api('ingresar', '', { correo: admin[0], contrasena: admin[3] }).ok === false && api('ingresar', '', { correo: admin[0], contrasena: NUEVA }).ok, 'tras cambiarla, la inicial deja de servir y la nueva sí');
ok(hoja('Usuarios')[1][3] === '' && hoja('Usuarios')[1].join('|').indexOf(NUEVA) < 0, 'la clave inicial se borra y la nueva no queda en claro');
ok(sA.perfil.rol === 'admin', 'sesion admin');
// admin crea asesor y asigna
let ad = bien('adminUsuario', tA, { correo: 'asesor@undc.edu.pe', nombre: 'Dr. Asesor Demo', rol: 'asesor' });
ad = bien('adminUsuario', tA, { correo: 'ana@undc.edu.pe', rol: 'estudiante', asesor: 'asesor@undc.edu.pe', activo: 'SI' });
ok(ad.usuarios.length === 5 && ad.usuarios.some(u => u.correo === 'calmidon@undc.edu.pe' && u.rol === 'coordinador') && ad.usuarios.some(u => u.correo === '2101010021@undc.edu.pe' && u.rol === 'asistente') && ad.usuarios.find(u => u.correo === 'ana@undc.edu.pe').asesor === 'asesor@undc.edu.pe', 'admin usuarios');
ok(ad.sistema.gemini.indexOf('Falta') === 0, 'gemini sin clave');
const asesor = ad.usuarios.find(u => u.rol === 'asesor');
ok(/^asesor\d{4}$/.test(asesor.codigo) && asesor.pendiente === 'SI' && !('clave_hash' in asesor) && !('sal' in asesor), 'clave inicial del asesor: apellido + 4 dígitos; el panel no expone huellas: ' + asesor.codigo);
const tS = entrar('asesor@undc.edu.pe', asesor.codigo).token;
const tE = bien('ingresar', '', { correo: 'ana@undc.edu.pe', contrasena: 'AnaClave2026' }).token;
// bloqueo tras cinco intentos fallidos
for (let i = 0; i < 5; i++) api('ingresar', '', { correo: 'asesor@undc.edu.pe', contrasena: 'equivocada' + i });
ok(/Demasiados intentos/.test(api('ingresar', '', { correo: 'asesor@undc.edu.pe', contrasena: NUEVA }).mensaje), 'cinco intentos fallidos bloquean el acceso, aun con la clave correcta');
vm.runInContext('(function(){ var u = usuario_("asesor@undc.edu.pe"); actualizar_("Usuarios", u._fila, { bloqueo: "" }); })()', ctx);
ok(api('ingresar', '', { correo: 'asesor@undc.edu.pe', contrasena: NUEVA }).ok, 'pasado el bloqueo se puede entrar');
const rc = bien('reiniciarClave', tS, { correo: 'ana@undc.edu.pe' });
ok(rc && /^ana\d{4}$/.test(rc.clave) && api('ingresar', '', { correo: 'ana@undc.edu.pe', contrasena: 'AnaClave2026' }).ok === false, 'el asesor reinicia la clave: la anterior deja de servir');
ok(api('estado', tE).error === 'CAMBIAR', 'tras el reinicio, la sesión abierta pide cambiar la clave');
entrar('ana@undc.edu.pe', rc.clave);
ok(api('estado', tE).ok, 'cambiada la clave, la sesión sigue');
ok(api('panel', tE).ok === false, 'estudiante no ve el panel');
ok(api('estado', tS).ok === false, 'asesor no tiene expediente');
ok(api('estado', 'tokenfalso').error === 'SESION', 'token falso');

// --- estado inicial
let est = bien('estado', tE);
ok(est.etapas.length === 7 && est.campos.length > 70 && est.rubrica.length === 36, 'estado inicial');
ok(est.config.IA_ACTIVA === 'NO', 'IA inactiva');
ok(est.resultadoRubrica.aplicables === 34, 'aplicables sin artefacto: ' + est.resultadoRubrica.aplicables);

// --- etapa 0 incompleta -> rojo
let r = bien('cerrarEtapa', tE, { etapa: '0' });
ok(r.semaforo === 'rojo' && r.detalle.observaciones.length >= 8, 'etapa 0 vacia en rojo');
ok(api('cerrarEtapa', tE, { etapa: '2' }).ok === false, 'no se salta etapas');
const D = G.__DEMO;
let g = bien('guardar', tE, { valores: D.valores[0] });
// sin IA: se aprueba con reglas
r = bien('cerrarEtapa', tE, { etapa: '0' });
ok(r.estado === 'aprobada' && r.semaforo === 'verde' && r.detalle.ia === 'no', 'etapa 0 aprobada sin IA: ' + JSON.stringify(r).substring(0, 300));
// IA sin clave
ok(/no está configurado/.test(api('ia', tE, { modo: 'ayuda', etapa: '0', campo: 'tema' }).mensaje), 'IA sin clave da mensaje claro');
vm.runInContext('PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", "AIza-prueba")', ctx);
est = bien('estado', tE);
ok(est.config.IA_ACTIVA === 'SI', 'IA activa');
ok(est.resultadoRubrica.aplicables === 36, 'aplicables con artefacto: ' + est.resultadoRubrica.aplicables);
// reapertura en cascada al cambiar un campo de una etapa aprobada
g = bien('guardar', tE, { valores: { tema: D.valores[0].tema + ' ' } });
ok(g.reabiertas.length === 0, 'espacio final no reabre (se guarda igual?) ' + JSON.stringify(g.reabiertas));
g = bien('guardar', tE, { valores: { tema: D.valores[0].tema + ' Cambio.' } });
ok(g.reabiertas.join() === '0', 'reabre etapa 0');
bien('guardar', tE, { valores: { tema: D.valores[0].tema } });
r = bien('cerrarEtapa', tE, { etapa: '0' });
ok(r.estado === 'aprobada' && r.semaforo === 'ambar' && r.detalle.ia === 'si', 'etapa 0 con IA en ambar');

// --- IA: modos
let ia = bien('ia', tE, { modo: 'ayuda', etapa: '0', campo: 'tema' });
ok(ia.texto && ia.ejemplo && ia.id, 'ayuda');
ia = bien('ia', tE, { modo: 'preguntar', etapa: '0', campo: 'tema' });
ok(ia.preguntas.length === 3, 'preguntar');
ok(api('ia', tE, { modo: 'proponer', etapa: '0', campo: 'tema' }).ok === false, 'proponer en campo sin IA se rechaza');
ia = bien('ia', tE, { modo: 'proponer', etapa: '0', campo: 'tema_oracion' });
ok(ia.texto.indexOf('[@') < 0 && ia.texto.indexOf('[por completar: cita]') > 0 && ia.faltantes.length === 2, 'proponer depura citas inexistentes: ' + ia.texto);
ok(bien('marcarIA', tE, { id: ia.id, estado: 'editado' }).ok, 'marcarIA');

// --- textos que parecen formulas: se guardan como texto literal y se leen igual
bien('guardar', tE, { valores: { orcid2: '=HYPERLINK("http://x","y")', coasesor_nombre: "'entre comillas'", coasesor_orcid: '-0001' } });
est = bien('estado', tE);
ok(est.expediente.orcid2 === '=HYPERLINK("http://x","y")' && est.expediente.coasesor_nombre === "'entre comillas'" && est.expediente.coasesor_orcid === '-0001', 'textos con =, - y apostrofo se conservan: ' + JSON.stringify([est.expediente.orcid2, est.expediente.coasesor_nombre, est.expediente.coasesor_orcid]));
bien('guardar', tE, { valores: { orcid2: '', coasesor_nombre: '', coasesor_orcid: '' } });
r = bien('cerrarEtapa', tE, { etapa: '0' });
// --- semilla: todas las filas tienen el ancho de su cabecera
['Config', 'Etapas', 'Campos', 'Prompts', 'Plantilla', 'Rubrica'].forEach(n => { const d = hoja(n); ok(d.every(f => f.length === d[0].length), 'ancho de filas en ' + n + ': ' + JSON.stringify([...new Set(d.map(f => f.length))])); });

// --- etapa 1
bien('guardar', tE, { valores: Object.assign({}, D.valores[1], { acceso_datos: 'nose' }) });
r = bien('cerrarEtapa', tE, { etapa: '1' });
ok(r.semaforo === 'rojo', 'viabilidad sin acceso a datos es rojo');
bien('guardar', tE, { valores: { acceso_datos: 'publicos' } });
r = bien('cerrarEtapa', tE, { etapa: '1' });
ok(r.estado === 'aprobada', 'etapa 1 aprobada');

// --- biblioteca
let b = bien('buscar', tE, { q: 'covid chest x-ray deep learning' });
ok(b.origen === 'OpenAlex' && b.resultados.length === 2 && b.resultados[0].resumen.indexOf('The novel coronavirus') === 0, 'buscar OpenAlex');
G.__openalexCae = true;
b = bien('buscar', tE, { q: 'covid chest x-ray deep learning' });
ok(b.origen === 'Crossref' && b.resultados.length === 1, 'respaldo Crossref');
G.__openalexCae = false;
let bib;
D.estudios.forEach(e => { bib = bien('agregarEstudio', tE, e); });
ok(bib.length === 16, 'biblioteca con 16: ' + (bib && bib.length));
const claves = bib.map(x => x.clave_cita);
console.log('  claves: ' + claves.join(', '));
['wang2020', 'ozturk2020', 'mezina2024', 'elhouby2024', 'bardaleztrigoso2020', 'solomon2021', 'lecun2015', 'sokolova2009', 'goodfellow2016', 'peffers2007', 'wieringa2014', 'cayaperez2020', 'maldonadolezama2021'].forEach(k => ok(claves.indexOf(k) >= 0, 'clave ' + k));
ok(bib.find(x => x.clave_cita === 'ozturk2020').verificado === 'crossref' && bib.find(x => x.clave_cita === 'ozturk2020').autores.length === 6, 'verificado por Crossref con autores oficiales');
ok(bib.find(x => x.clave_cita === 'cayaperez2020').verificado === 'manual', 'tesis manual');
ok(api('agregarEstudio', tE, { doi: 'https://doi.org/10.1016/J.COMPBIOMED.2020.103792' }).ok === false, 'duplicado por DOI');
// estudio de OpenAlex sin registro en Crossref, luego se borra
let bib2 = bien('agregarEstudio', tE, { doi: '10.1000/sin-crossref', titulo: 'Estudio sin registro en Crossref', autores: [{ apellido: 'Soto', nombre: 'Ana Perez' }], anio: '2023', fuente: 'Revista de Prueba', origen: 'OpenAlex', tipo: 'articulo', resumen: 'x'.repeat(200) });
const extra = bib2.find(x => x.doi === '10.1000/sin-crossref');
ok(extra.verificado === 'openalex' && extra.clave_cita === 'soto2023', 'estudio openalex');
let res = bien('resumirEstudio', tE, { id: extra.id });
ok(res.objetivo && res.id, 'resumir con IA');
bib2 = bien('editarEstudio', tE, { id: extra.id, datos: { objetivo: res.objetivo, titulo: 'Cambiado', relacion: 'r' } });
ok(bib2.find(x => x.id === extra.id).titulo === 'Cambiado', 'editar estudio no verificado por crossref');
const oz = bib.find(x => x.clave_cita === 'ozturk2020');
bib2 = bien('editarEstudio', tE, { id: oz.id, datos: { titulo: 'Hack', indizacion: 'Web of Science' } });
ok(bib2.find(x => x.id === oz.id).titulo !== 'Hack' && bib2.find(x => x.id === oz.id).indizacion === 'Web of Science', 'no se cambian datos verificados');
bib2 = bien('borrarEstudio', tE, { id: extra.id });
ok(bib2.length === 16, 'borrar estudio');

// --- etapa 2: requiere asesor
bien('guardar', tE, { valores: Object.assign({}, D.valores[2], { planteamiento: 'Texto corto sin citas.' }) });
r = bien('cerrarEtapa', tE, { etapa: '2' });
ok(r.semaforo === 'rojo' && r.detalle.observaciones.some(o => o.item === 4), 'planteamiento sin citas es rojo');
bien('guardar', tE, { valores: { planteamiento: D.valores[2].planteamiento + ' [@noexiste2020]' } });
r = bien('cerrarEtapa', tE, { etapa: '2' });
ok(r.semaforo === 'rojo' && r.detalle.observaciones.some(o => /noexiste2020/.test(o.texto)), 'cita rota es rojo');
bien('guardar', tE, { valores: { planteamiento: D.valores[2].planteamiento } });
G.__revision = { observaciones: [{ campo: 'problema_central', nivel: 'Bloqueante', texto: 'El problema describe la falta de una solución.', item: 3 }], resumen: 'Hay un punto bloqueante.' };
r = bien('cerrarEtapa', tE, { etapa: '2' });
ok(r.semaforo === 'rojo' && r.estado === 'en_curso' && r.detalle.observaciones.some(o => o.origen === 'ia'), 'bloqueo por IA');
ok(api('excepcion', tE, { etapa: '2', motivo: 'corto' }).ok === false, 'excepcion sin motivo');
r = bien('excepcion', tE, { etapa: '2', motivo: 'El problema sí es un estado negativo: describe demora e inexactitud, no la falta de un sistema.' });
ok(r.estado === 'en_revision', 'excepcion enviada');
G.__revision = null;
let pan = bien('panel', tS);
ok(pan.estudiantes.length === 1 && pan.estudiantes[0].enRevision.join() === '2', 'panel del asesor');
let ve = bien('verEstudiante', tS, { correo: 'ana@undc.edu.pe' });
ok(ve.avance['2'].detalle.excepcion && ve.comentarios.length === 1 && ve.ia.total >= 5, 'asesor ve expediente y excepcion');
ok(api('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '2', decision: 'devolver', comentario: '' }).ok === false, 'devolver exige comentario');
ve = bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '2', decision: 'devolver', comentario: 'Precisa el dato local del hospital antes de continuar.' });
ok(ve.avance['2'].estado === 'devuelta', 'devuelta');
r = bien('cerrarEtapa', tE, { etapa: '2' });
ok(r.estado === 'en_revision' && r.semaforo === 'ambar', 'reenvio al asesor');
// puede avanzar a la etapa 3 mientras el asesor revisa
bien('guardar', tE, { valores: D.valores[3] });
r = bien('cerrarEtapa', tE, { etapa: '3' });
ok(r.estado === 'aprobada', 'etapa 3 aprobada mientras 2 esta en revision: ' + JSON.stringify(r.detalle.observaciones.filter(o => o.nivel === 'bloqueante')));
bien('guardar', tE, { valores: D.valores[4] });
ok(/aún no aprueba/.test(api('cerrarEtapa', tE, { etapa: '4' }).mensaje), 'etapa 4 espera la aprobacion de la 2');
ve = bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '2', decision: 'aprobar', comentario: 'Conforme.' });
ok(ve.avance['2'].estado === 'aprobada', 'aprobada por asesor');
ve = bien('comentar', tS, { correo: 'ana@undc.edu.pe', etapa: '3', texto: 'Agrega una tesis internacional más reciente.' });
ok(ve.comentarios.length === 4, 'comentario del asesor: ' + ve.comentarios.length);

// --- etapa 4: reglas de correspondencia
bien('guardar', tE, { valores: { objetivos_especificos: [D.valores[4].objetivos_especificos[0]], objetivo_general: 'El objetivo es determinar algo.' } });
r = bien('cerrarEtapa', tE, { etapa: '4' });
ok(r.semaforo === 'rojo' && r.detalle.observaciones.filter(o => o.nivel === 'bloqueante').length === 4 && r.detalle.observaciones.some(o => /infinitivo/.test(o.texto)) && r.detalle.observaciones.some(o => /uno a uno/.test(o.texto)), 'correspondencia e infinitivo: ' + JSON.stringify(r.detalle.observaciones.map(o => o.texto)));
bien('guardar', tE, { valores: { objetivos_especificos: D.valores[4].objetivos_especificos, objetivo_general: D.valores[4].objetivo_general } });
r = bien('cerrarEtapa', tE, { etapa: '4' });
ok(r.estado === 'en_revision', 'etapa 4 en revision');
bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '4', decision: 'aprobar', comentario: '' });
bien('guardar', tE, { valores: D.valores[5] });
r = bien('cerrarEtapa', tE, { etapa: '5' });
ok(r.estado === 'aprobada', 'etapa 5: ' + JSON.stringify(r.detalle.observaciones.filter(o => o.nivel === 'bloqueante')));
ia = bien('ia', tE, { modo: 'proponer', etapa: '6', campo: 'cronograma' });
ok(ia.filas.length === 2 && ia.filas[0].actividad && ia.filas[0].inicio === '1', 'proponer tabla: ' + JSON.stringify(ia.filas));
ia = bien('ia', tE, { modo: 'jurado', etapa: '4' });
ok(ia.preguntas.length === 3, 'jurado');
ia = bien('ia', tE, { modo: 'jurado_eval', etapa: '4', respuestas: ia.preguntas.map(p => ({ pregunta: p, respuesta: 'Respuesta de prueba.' })) });
ok(ia.evaluacion.length === 3 && ia.consejo, 'jurado_eval');
bien('guardar', tE, { valores: Object.assign({}, D.valores[6], { presupuesto: D.valores[6].presupuesto.filter(f => f.rubro !== 'Personal') }) });
r = bien('cerrarEtapa', tE, { etapa: '6' });
ok(r.semaforo === 'rojo' && r.detalle.observaciones.some(o => /Personal/.test(o.texto)), 'presupuesto sin personal');
bien('guardar', tE, { valores: { presupuesto: D.valores[6].presupuesto } });
r = bien('cerrarEtapa', tE, { etapa: '6' });
ok(r.estado === 'en_revision', 'etapa 6 en revision: ' + JSON.stringify(r.detalle.observaciones.filter(o => o.nivel === 'bloqueante')));

// --- rubrica
const grupos = [...new Set(est.rubrica.map(x => x.grupo))];
let rr;
grupos.forEach(gr => { rr = bien('rubrica', tE, { grupo: gr }); });
ok(rr.resultado.evaluados === 36 && rr.resultado.porcentaje > 67, 'rubrica: ' + JSON.stringify({ e: rr.resultado.evaluados, p: rr.resultado.porcentaje, max: rr.resultado.maximo }));

// --- via 2: la clave propia del estudiante
const ultimaBit = () => hoja('Bitacora')[hoja('Bitacora').length - 1];
const usoCurso = bien('estado', tE).uso;
ia = bien('ia', tE, { modo: 'ayuda', campo: 'tema', via: 'propia', clave: 'AIzaSy-clave-del-estudiante-0001' });
ok(ia.via === 'propia' && G.__mock.ultimaClave === 'AIzaSy-clave-del-estudiante-0001', 'la consulta sale con la clave del estudiante');
ok(ultimaBit()[6].indexOf('(clave propia)') > 0, 'la bitacora anota la clave propia: ' + ultimaBit()[6]);
ok(bien('estado', tE).uso === usoCurso, 'la clave propia no gasta la cuota del curso');
ok(/no parece una clave de Gemini/.test(api('ia', tE, { modo: 'ayuda', campo: 'tema', via: 'propia', clave: 'corta' }).mensaje), 'clave propia mal formada');
ok(/API key not valid/.test(api('ia', tE, { modo: 'ayuda', campo: 'tema', via: 'propia', clave: 'AIzaSy-clave-MALA-del-estudiante' }).mensaje), 'clave propia rechazada por Gemini');
ok(bien('probarClave', tE, { clave: 'AIzaSy-clave-del-estudiante-0001' }).ok === true, 'probar clave');
ok(!JSON.stringify(G.__mock.props).includes('clave-del-estudiante') && !hoja('Usuarios').some(f => f.join('|').includes('clave-del-estudiante')), 'la clave del estudiante no se guarda en el servidor');

// --- via 3: copiar y pegar
let c1 = bien('iaConsulta', tE, { modo: 'proponer', campo: 'planteamiento' });
const debe = ['=== CONSULTA GENERADA POR ¡QUIERO SER INGENIERO! ===', 'PROYECTO (columna vertebral', D.valores[0].tema_oracion, 'Etapas aprobadas: 0 Tema, 1 Viabilidad, 2 Problema',
  'LO QUE EL ESTUDIANTE YA ESCRIBIÓ EN ESTA ETAPA', D.valores[2].prob_hoy.substring(0, 60), '[@solomon2021]', 'CAMPO SOBRE EL QUE SE TRABAJA: «Planteamiento del problema (redacción final)»',
  'ya tiene un borrador', 'FORMATO: {"texto"', 'CRITERIOS DE LA RÚBRICA', 'Ítem 4.', 'CÓMO RESPONDER'];
debe.forEach(s => ok(c1.consulta.indexOf(s) >= 0, 'la consulta para copiar incluye: ' + s));
ok(c1.consulta.indexOf(D.valores[6].financiamiento) < 0 && c1.consulta.indexOf('Cronograma') < 0, 'la consulta no arrastra etapas posteriores');
const pos = ['INSTRUCCIONES', 'EXPEDIENTE DEL ESTUDIANTE', 'PROYECTO (columna', 'AVANCE DEL ESTUDIANTE', 'LO YA DECIDIDO EN ETAPAS ANTERIORES', 'LO QUE EL ESTUDIANTE YA ESCRIBIÓ', 'BIBLIOTECA DEL ESTUDIANTE (únicas', 'CAMPO SOBRE EL QUE SE TRABAJA', 'TAREA: ', 'ya tiene un borrador', 'FORMATO: {"texto"', 'CÓMO RESPONDER'].map(x => c1.consulta.indexOf(x));
ok(pos.every((x, i) => x >= 0 && (i === 0 || x > pos[i - 1])), 'orden lógico de la consulta: ' + JSON.stringify(pos));
ok(bien('iaConsulta', tE, { modo: 'preguntar', campo: 'tema' }).consulta.indexOf('0000-0002-1825-0097') < 0 && bien('iaConsulta', tE, { modo: 'preguntar', campo: 'tema' }).consulta.indexOf('[autor1]') < 0, 'los nombres y los ORCID no viajan en la consulta');
ok(c1.consulta.split('Redes como COVID-Net y DarkCovidNet').length === 2 && c1.consulta.indexOf('[planteamiento]: (es el campo sobre el que se trabaja') > 0, 'el campo que se trabaja no se repite en la consulta');
ok(c1.consulta.indexOf('Precisa el dato local del hospital') < 0 && c1.consulta.indexOf('OBSERVACIONES PENDIENTES') < 0, 'los comentarios anteriores a la aprobación del asesor ya no se arrastran');
ok(/\n\nBIBLIOTECA DEL ESTUDIANTE \(únicas/.test(c1.consulta) && !/\n\n\n/.test(c1.consulta), 'bloques separados por una línea en blanco');
let c3 = bien('iaConsulta', tE, { modo: 'proponer', campo: 'brechas' });
ok(c3.consulta.indexOf('Comentario del asesor') > 0 && c3.consulta.indexOf('Agrega una tesis internacional más reciente.') > 0 && c3.consulta.indexOf(D.valores[2].problema_central) > 0, 'la consulta de la etapa 3 trae el comentario del asesor y el problema central');
let c4 = bien('iaConsulta', tE, { modo: 'proponer', campo: 'afirmacion' });
ok(c4.consulta.indexOf(D.valores[3].declaracion_brecha) > 0 && c4.consulta.indexOf('LO YA DECIDIDO EN ETAPAS ANTERIORES') > 0 && c4.consulta.indexOf('«El artefacto consigue X, mejor que Y, medido en Z»') > 0, 'la consulta de la afirmación parte de la brecha');
const filasAntes = hoja('Bitacora').length;
ok(/Pegaste la consulta/.test(api('iaRespuesta', tE, { modo: 'proponer', campo: 'planteamiento', respuesta: c1.consulta }).mensaje), 'pegar la consulta en vez de la respuesta se detecta');
ok(/Pega la respuesta/.test(api('iaRespuesta', tE, { modo: 'proponer', campo: 'planteamiento', respuesta: ' ' }).mensaje), 'respuesta vacia');
ia = bien('iaRespuesta', tE, { modo: 'proponer', campo: 'planteamiento', respuesta: 'Claro, aquí tienes:\n\x60\x60\x60json\n' + JSON.stringify({ texto: 'Texto con cita [@solomon2021] y otra [@inventada2022].', faltantes: ['Dato local'] }) + '\n\x60\x60\x60\nEspero que te sirva.' });
ok(ia.via === 'copiar' && /\[@solomon2021\]/.test(ia.texto) && !/inventada/.test(ia.texto) && ia.faltantes.length === 2 && ia.id, 'respuesta pegada: mismo filtro de citas que con Gemini: ' + JSON.stringify(ia));
ok(ultimaBit()[6] === 'copiar y pegar' && hoja('Bitacora').length === filasAntes + 1, 'la bitacora anota copiar y pegar');
ia = bien('iaRespuesta', tE, { modo: 'proponer', campo: 'planteamiento', respuesta: 'Un párrafo sin formato que el asistente devolvió.' });
ok(ia.texto === 'Un párrafo sin formato que el asistente devolvió.', 'texto corrido aceptado en propuestas de texto');
ok(/No pude leer/.test(api('iaRespuesta', tE, { modo: 'proponer', campo: 'cronograma', respuesta: 'Actividad 1, del mes 1 al 2' }).mensaje), 'una tabla exige JSON');
ia = bien('iaRespuesta', tE, { modo: 'proponer', campo: 'cronograma', respuesta: JSON.stringify({ filas: [{ actividad: 'Revisión', inicio: 1, fin: 2, sobra: 'x' }] }) });
ok(ia.filas.length === 1 && ia.filas[0].inicio === '1' && ia.filas[0].sobra === undefined, 'filas pegadas: solo las columnas del campo');
ia = bien('iaRespuesta', tE, { modo: 'preguntar', campo: 'tema', respuesta: '1. ¿Qué dato lo demuestra hoy?\n2) ¿A quién afecta el problema?\n- ¿Dónde ocurre?' });
ok(ia.preguntas.length === 3 && ia.preguntas.every(p => p.charAt(0) === '¿'), 'preguntas en lista simple: ' + JSON.stringify(ia.preguntas));
ok(api('iaRespuesta', tE, { modo: 'proponer', campo: 'tema', respuesta: 'x y z' }).ok === false, 'copiar tampoco propone en campos de decisión propia');
c1 = bien('iaConsulta', tE, { modo: 'rubrica', grupo: grupos[0] });
ok(/Ítem 1:/.test(c1.consulta) && /Nivel 4:/.test(c1.consulta), 'consulta de rubrica para copiar');
rr = bien('iaRespuesta', tE, { modo: 'rubrica', grupo: grupos[0], respuesta: JSON.stringify([{ item: 1, nivel: 2, observacion: 'Falta el ámbito.' }, { item: 99, nivel: 4, observacion: 'no existe' }]) });
ok(rr.items.length === 1 && rr.resultado.items['1'].nivel === 2 && rr.resultado.items['1'].via === 'copiar', 'rubrica pegada: se descartan ítems ajenos y queda marcada: ' + JSON.stringify(rr.resultado.items['1']));
ok(rr.resultado.noVerificados === 1 && bien('panel', tS).estudiantes.find(x => x.correo === 'ana@undc.edu.pe').rubricaNoVerificados === 1, 'el resultado de la rúbrica cuenta los ítems no verificados, también en el panel del asesor');
const estOz = bien('estado', tE).biblioteca.find(x => x.clave_cita === 'ozturk2020');
ok(/no tiene resumen/.test(api('iaConsulta', tE, { modo: 'resumir', id: estOz.id }).mensaje), 'sin resumen no hay consulta de ficha');
hoja('Biblioteca').forEach((f, i) => { if (i && f[0] === estOz.id) libro.getSheetByName('Biblioteca').getRange(i + 1, hoja('Biblioteca')[0].indexOf('resumen') + 1).setValue('Se propone una red convolucional para detectar COVID-19 en radiografías de tórax. El modelo se evaluó con 1 125 imágenes y obtuvo una exactitud de 98.08 % en la clasificación binaria. Como trabajo futuro se plantea validar con más imágenes.'); });
c1 = bien('iaConsulta', tE, { modo: 'resumir', id: estOz.id });
ok(c1.consulta.indexOf('RESUMEN: Se propone una red convolucional') > 0 && c1.consulta.indexOf('"sin_resolver": ""') > 0, 'consulta de ficha para copiar');
ia = bien('iaRespuesta', tE, { modo: 'resumir', id: estOz.id, respuesta: JSON.stringify({ objetivo: 'Detectar COVID-19.', metodologia: '', resultados: 'Exactitud de 98.08 %.', conclusion: '', sin_resolver: 'Validar con más imágenes.' }) });
ok(ia.objetivo === 'Detectar COVID-19.' && ia.sin_resolver === 'Validar con más imágenes.' && ia.via === 'copiar', 'ficha pegada: ' + JSON.stringify(ia));
// cierre de etapa por copia: dos pasos
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar' });
ok(r.fase === 'consulta' && r.consulta.indexOf('TAREA: revisa la etapa') > 0 && r.consulta.indexOf('que la línea base sea externa') > 0 && bien('estado', tE).avance['5'].estado === 'aprobada', 'cierre por copia, paso 1: entrega la consulta y no cambia el estado');
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', respuesta: JSON.stringify({ observaciones: [{ campo: 'linea_base', nivel: 'bloqueante', texto: 'La línea base no tiene valor medido.', item: 26 }], resumen: 'Falta medir la línea base.' }) });
ok(r.estado === 'en_curso' && r.semaforo === 'rojo' && r.detalle.ia === 'pegada' && r.detalle.observaciones.some(o => o.origen === 'ia' && o.campo === 'linea_base'), 'cierre por copia, paso 2: una observación bloqueante pegada bloquea');
ok(/Pegaste la consulta/.test(api('cerrarEtapa', tE, { etapa: '5', via: 'copiar', respuesta: bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar' }).consulta }).mensaje), 'cierre por copia: pegar la consulta se detecta');
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', respuesta: '{"observaciones": [], "resumen": "La etapa es coherente."}' });
ok(r.estado === 'aprobada' && r.detalle.ia === 'pegada' && /no verificada/.test(r.detalle.resumen), 'cierre por copia sin observaciones: aprobada y marcada como no verificada: ' + r.estado + ' ' + r.detalle.resumen);
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', sinRevision: true });
ok(r.estado === 'aprobada' && r.detalle.ia === 'no', 'cierre por copia sin revisión: solo reglas');
// una respuesta pegada enorme no rompe el registro de la etapa
const muchas = []; for (let i = 0; i < 60; i++) muchas.push({ campo: 'linea_base', nivel: 'mejorable', texto: 'Observación ' + i + ' ' + 'x'.repeat(880), item: 26 });
ok(/demasiado larga/.test(api('cerrarEtapa', tE, { etapa: '5', via: 'copiar', respuesta: 'x'.repeat(60001) }).mensaje), 'una respuesta pegada desmesurada se rechaza en vez de recortarse');
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', respuesta: JSON.stringify({ observaciones: muchas, resumen: 'Muchas.' }) });
const det5 = bien('estado', tE).avance['5'].detalle;
ok(r.detalle.observaciones.filter(o => o.origen === 'ia').length === 25 && det5.ia === 'pegada' && det5.observaciones.length === r.detalle.observaciones.length, 'una revisión pegada desmesurada se acota y su registro se conserva: ' + det5.observaciones.length);
// una revisión verificada que bloquea no se esquiva cambiando a copiar y pegar
G.__revision = { observaciones: [{ campo: 'linea_base', nivel: 'bloqueante', texto: 'La línea base no es externa.', item: 26 }], resumen: 'Bloqueada.' };
r = bien('cerrarEtapa', tE, { etapa: '5' });
ok(r.estado === 'en_curso' && r.semaforo === 'rojo' && r.detalle.ia === 'si', 'revisión verificada del curso: bloquea');
G.__revision = null;
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', sinRevision: true });
ok(r.estado === 'en_revision' && r.detalle.sinVerificar === true && /lo decide tu asesor/.test(r.detalle.resumen), 'tras un bloqueo verificado, cerrar sin revisión no aprueba: pasa al asesor: ' + r.estado);
bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '5', decision: 'devolver', comentario: 'Corrige la línea base antes de cerrar.' });
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', respuesta: '{"observaciones": [], "resumen": "Todo bien."}' });
ok(r.estado === 'en_revision' && r.detalle.sinVerificar === true, 'la marca se arrastra: una revisión pegada tampoco la aprueba');
bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '5', decision: 'aprobar', comentario: '' });
ok(bien('estado', tE).avance['5'].estado === 'aprobada' && !bien('estado', tE).avance['5'].detalle.sinVerificar, 'el asesor resuelve la marca al aprobar');
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', sinRevision: true });
ok(r.estado === 'aprobada', 'sin bloqueo verificado pendiente, el cierre con reglas vuelve a bastar');
vm.runInContext('ponerConfig_("REVISION_SIN_IA", " Asesor ")', ctx);
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'copiar', sinRevision: true });
ok(r.estado === 'en_revision' && bien('estado', tE).config.REVISION_SIN_IA === 'asesor', 'con REVISION_SIN_IA = asesor (aunque se escriba con mayúsculas), la etapa sin revisión verificada pasa al asesor');
bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '5', decision: 'aprobar', comentario: '' });
vm.runInContext('ponerConfig_("REVISION_SIN_IA", "reglas")', ctx);
// la clave del estudiante no se guarda ni cuando Google la cita en su mensaje de error
const SUSP = 'AIzaSy-SUSPENDIDA-clave-del-estudiante-99';
r = bien('cerrarEtapa', tE, { etapa: '5', via: 'propia', clave: SUSP });
ok(r.detalle.ia === 'error' && r.estado === 'en_revision' && /clave oculta/.test(r.detalle.resumen), 'revisión con clave propia rechazada: queda el aviso');
ok(JSON.stringify([hoja('Avance'), hoja('Bitacora'), hoja('Expedientes'), hoja('Comentarios'), G.__mock.props, G.__mock.cache]).indexOf(SUSP) < 0 && JSON.stringify(r).indexOf(SUSP) < 0, 'la clave citada por Google no llega a la hoja ni a la respuesta');
const rr2 = api('ia', tE, { modo: 'ayuda', campo: 'tema', via: 'propia', clave: SUSP });
ok(rr2.ok === false && rr2.mensaje.indexOf(SUSP) < 0 && /clave oculta/.test(rr2.mensaje), 'tampoco aparece en el mensaje de error de una consulta: ' + rr2.mensaje);
bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '5', decision: 'aprobar', comentario: '' });
ok(/dato de identificación/.test(api('iaConsulta', tE, { modo: 'ayuda', campo: 'autor1' }).mensaje) && /dato de identificación/.test(api('ia', tE, { modo: 'preguntar', campo: 'asesor_nombre' }).mensaje), 'los campos de identificación no se consultan al asistente');
vm.runInContext('ponerConfig_("MODOS_IA", "curso")', ctx);
ok(/no está habilitado/.test(api('iaConsulta', tE, { modo: 'ayuda', campo: 'tema' }).mensaje) && /no está habilitado/.test(api('ia', tE, { modo: 'ayuda', campo: 'tema', via: 'propia', clave: 'AIzaSy-clave-del-estudiante-0001' }).mensaje), 'los modos se pueden restringir desde la configuración');
ok(bien('estado', tE).config.MODOS_IA === 'curso', 'modos publicados al cliente');
vm.runInContext('ponerConfig_("MODOS_IA", "curso,propia,copiar")', ctx);
ok(bien('verEstudiante', tS, { correo: 'ana@undc.edu.pe' }).ia.porVia.copiar >= 5, 'el asesor ve cuántas consultas fueron por copia');

// --- reglas del taller
const reglas = (cambios, etapa, quitar) => JSON.parse(vm.runInContext('JSON.stringify(reglasEtapa_("ana@undc.edu.pe", Object.assign(expediente_("ana@undc.edu.pe"), ' + JSON.stringify(cambios) + '), biblioteca_("ana@undc.edu.pe").map(function (b) { ' + (quitar ? 'b.sin_resolver = "";' : '') + ' return b; }), "' + etapa + '"))', ctx));
ok(reglas({ problema_central: 'Implementación de un sistema web para la gestión de citas.' }, '2').some(o => /nombrando una solución/.test(o.texto)), 'regla: el problema no empieza con una solución');
ok(reglas({}, '3', true).some(o => /qué dejan sin resolver/.test(o.texto)) && !reglas({}, '3', false).some(o => /qué dejan sin resolver/.test(o.texto)), 'regla: antecedentes sin «qué deja sin resolver»');
ok(reglas({ declaracion_brecha: 'Faltan estudios en Cañete.' }, '3').some(o => /declaración de brecha/.test(o.texto)), 'regla: forma de la declaración de brecha');
ok(reglas({ problema_general: '¿Cómo influyen las redes neuronales en la identificación de daño pulmonar?' }, '4').some(o => /contra qué se compara/.test(o.texto)) && !reglas({}, '4').some(o => /contra qué se compara/.test(o.texto)), 'regla: la pregunta de un proyecto con artefacto nombra la línea base');
ok(reglas({ linea_base: '' }, '5').some(o => o.campo === 'linea_base' && o.nivel === 'bloqueante'), 'regla: la línea base es obligatoria con artefacto');

// --- cuota
const usoAntes = bien('estado', tE).uso;
ok(usoAntes > 15, 'uso registrado: ' + usoAntes);
vm.runInContext('ponerConfig_("CUOTA_DIARIA", "' + usoAntes + '")', ctx);
ok(/Ya usaste/.test(api('ia', tE, { modo: 'ayuda', etapa: '0', campo: 'tema' }).mensaje), 'cuota diaria');
vm.runInContext('ponerConfig_("CUOTA_DIARIA", "40")', ctx);
// fallo de Gemini: la etapa se cierra con reglas
G.__geminiFalla = 503;
bien('guardar', tE, { valores: { riesgo: D.valores[1].riesgo + ' Se documentará.' } });
r = bien('cerrarEtapa', tE, { etapa: '1' });
ok(r.estado === 'en_revision' && r.semaforo === 'ambar' && r.detalle.ia === 'error', 'con Gemini caido la etapa no se aprueba sola: pasa al asesor: ' + r.estado + '/' + r.semaforo);
G.__geminiFalla = 0;
G.__geminiTimeout = true;
ok(/tardó demasiado/.test(api('ia', tE, { modo: 'ayuda', etapa: '0', campo: 'tema' }).mensaje), 'corte de UrlFetchApp con mensaje claro');
G.__geminiTimeout = false;
bien('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: '1', decision: 'aprobar', comentario: '' });

// --- endurecimiento
G.__crossrefCae = true;
ok(/Crossref no respondió/.test(api('agregarEstudio', tE, { doi: '10.1038/nature14539x' }).mensaje), 'Crossref caido no se confunde con DOI inexistente');
G.__crossrefCae = false;
let bx = bien('agregarEstudio', tE, { tipo: 'otro', uso: 'contexto', autores: 'Prueba, P.', anio: '2024', titulo: 'Fuente con enlace malicioso', url: 'javascript:alert(1)' });
let mal = bx.find(x => x.titulo === 'Fuente con enlace malicioso');
ok(mal.url === '' && mal.verificado === 'no', 'enlace que no es http se descarta: ' + JSON.stringify([mal.url, mal.verificado]));
bx = bien('editarEstudio', tE, { id: mal.id, datos: { url: ' JaVaScript:alert(2)' } });
ok(bx.find(x => x.id === mal.id).url === '', 'enlace malicioso al editar se descarta');
bx = bien('editarEstudio', tE, { id: mal.id, datos: { url: 'https://example.org/a' } });
ok(bx.find(x => x.id === mal.id).url === 'https://example.org/a', 'enlace https se conserva');
bien('borrarEstudio', tE, { id: mal.id });
const nExp = hoja('Expedientes').length;
bien('guardar', tE, { valores: { constructor: 'x', hasOwnProperty: 'y', toString: 'z', _plan_url: 'https://malo', noexiste: 'w' } });
ok(hoja('Expedientes').length === nExp, 'claves que no son campos se ignoran');
ok(api('constructor', tE, {}).mensaje.indexOf('Acción desconocida') === 0 && api('toString', tE, {}).mensaje.indexOf('Acción desconocida') === 0, 'rutas heredadas no existen');
ok(/45 000/.test(api('guardar', tE, { valores: { recursos: 'x'.repeat(45001) } }).mensaje), 'campo demasiado largo se rechaza');
bien('guardar', tE, { valores: { recursos: D.valores[1].recursos + ' [@constructor]' } });
r = bien('cerrarEtapa', tE, { etapa: '1' });
ok(r.semaforo === 'rojo' && r.detalle.observaciones.some(o => /@constructor/.test(o.texto)), 'una cita [@constructor] no pasa por existente');
bien('guardar', tE, { valores: { recursos: D.valores[1].recursos } });
r = bien('cerrarEtapa', tE, { etapa: '1' });
ok(r.estado === 'aprobada', 'etapa 1 aprobada de nuevo');

// --- plan
let plan = bien('generarPlan', tE, {});
ok(plan.url && plan.pendientes >= 3 && plan.citasRotas.length === 0, 'plan generado: ' + JSON.stringify(plan));
const idDoc = plan.url.split('/d/')[1].split('/')[0];
let plan2 = bien('generarPlan', tE, {});
ok(plan2.url === plan.url && Object.keys(G.__mock.docs).length === 1, 'el plan se regenera en el mismo documento');
fs.mkdirSync(path.join(RAIZ, 'test/salida'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'test/salida/plan_artefacto.html'), G.__docHtml(idDoc));
est = bien('estado', tE);
ok(est.expediente._plan_url === plan.url, 'url del plan en el expediente');
// las etapas 2..6 se reabrieron al tocar la etapa 1; el asesor lo ve
pan = bien('panel', tA);
ok(pan.estudiantes[0].plan === plan.url, 'panel admin con plan');

// --- instalaciones anteriores (versión 1.0): instalar() renueva las definiciones, las respalda y no toca los datos
const nUsuarios = hoja('Usuarios').length, nBib = hoja('Biblioteca').length, nExpM = hoja("Expedientes").length, nAvM = hoja("Avance").length;
hoja('Biblioteca').forEach(f => { if (f.length === 27) { f.pop(); f.pop(); } });   // la versión 1.0 no tenía la columna sin_resolver
{
  const quitar = (h, col, k) => { const d = hoja(h); d.splice(d.findIndex(f => f[col] === k), 1); };
  ['VERSION_DATOS', 'TALLER_URL', 'MODOS_IA'].forEach(k => quitar('Config', 0, k));
  ['brujula_resultado', 'prob_quien', 'limites'].forEach(k => quitar('Campos', 1, k));
  quitar('Prompts', 0, 'indicacion_limites');
  hoja('Prompts').find(f => f[0] === 'modo_ayuda')[1] = 'TAREA personalizada por el profesor.';
  hoja('Etapas')[2][5] = 'tema';
}
ok(!hoja('Campos').some(f => f[1] === 'limites') && hoja('Biblioteca')[0].indexOf('sin_resolver') < 0 && !hoja('Config').some(f => f[0] === 'VERSION_DATOS'), 'instalación 1.0 simulada');
G.__mock.props.MODO_TEXTO = MODO;   // la 1.0 guardaba una sola medida
vm.runInContext('instalar()', ctx);
const campos11 = hoja('Campos');
ok(G.__mock.props.MODO_TEXTO === MODO + '|' + MODO_AP, 'la prueba de escritura se repite al actualizar');
ok(hoja('Config').some(f => f[0] === 'VERSION_DATOS' && f[1] === '1.3') && hoja('Config').some(f => f[0] === 'TALLER_URL') && hoja('Config').some(f => f[0] === 'MODOS_IA'), 'instalar() completa la configuración y anota la versión');
ok(campos11.length === 95 && campos11[1][1] === 'brujula_resultado' && campos11.findIndex(f => f[1] === 'prob_quien') < campos11.findIndex(f => f[1] === 'problema_central') && campos11.findIndex(f => f[1] === 'limites') > 0, 'los campos quedan completos y en su orden: ' + campos11.length);
ok(hoja('Prompts').find(f => f[0] === 'modo_ayuda')[1].indexOf('TAREA: explica') === 0 && hoja('Prompts').some(f => f[0] === 'indicacion_limites') && hoja('Etapas')[2][5].indexOf('brujula_resultado') >= 0, 'indicaciones y etapas renovadas');
ok(['Etapas', 'Campos', 'Prompts', 'Plantilla', 'Rubrica'].every(n => libro.getSheetByName(n + ' (v1.0)')) && libro.getSheetByName('Prompts (v1.0)').datos.find(f => f[0] === 'modo_ayuda')[1] === 'TAREA personalizada por el profesor.', 'las definiciones anteriores quedan en pestañas de respaldo, con lo personalizado');
ok(hoja('Biblioteca')[0].indexOf('sin_resolver') === 25 && hoja('Biblioteca')[0].indexOf('ambito') === 26, 'instalar() agrega las columnas nuevas de la biblioteca');
ok(hoja('Usuarios').length === nUsuarios && hoja('Biblioteca').length === nBib && hoja("Expedientes").length === nExpM && hoja("Avance").length === nAvM && bien('estado', tE).biblioteca.find(x => x.clave_cita === 'wang2020').resultados.length > 20 && bien('estado', tE).biblioteca.find(x => x.clave_cita === 'wang2020').sin_resolver === '', 'instalar() no toca los datos existentes');
const wg = bien('estado', tE).biblioteca.find(x => x.clave_cita === 'wang2020');
ok(bien('editarEstudio', tE, { id: wg.id, datos: { sin_resolver: 'No aborda las secuelas posteriores a la infección.' } }).find(x => x.id === wg.id).sin_resolver.length > 20, 'la columna nueva queda utilizable tras la migración');
const nHojas = libro.getSheets().length;
vm.runInContext('instalar()', ctx);
ok(libro.getSheets().length === nHojas && hoja('Campos').length === 95, 'repetir instalar() en la misma versión no cambia nada');
ok(bien('estado', tE).campos.length === 94 && !!bien('estado', tE).avance['4'] && bien('estado', tE).expediente.titulo.length > 20, 'la aplicación sigue en pie con los datos del estudiante: ' + bien('estado', tE).campos.length + ' ' + JSON.stringify(bien('estado', tE).avance['4'] && bien('estado', tE).avance['4'].estado));

// --- de la 1.1 a la 1.2: no se renueva nada; solo aparece lo nuevo (pestaña Sencillo, configuración e indicación)
libro.deleteSheet(libro.getSheetByName('Sencillo'));
{
  const quitar = (h, col, k) => { const d = hoja(h); d.splice(d.findIndex(f => f[col] === k), 1); };
  ['MODO_INICIAL', 'ETAPAS_EN_ORDEN', 'ESCUDO_INCLUIDO'].forEach(k => quitar('Config', 0, k));
  quitar('Prompts', 0, 'modo_desglosar');
  hoja('Campos').find(f => f[1] === 'tema')[2] = 'Tema (personalizado en la 1.1)';
}
const nHojas11 = libro.getSheets().length;
vm.runInContext('instalar()', ctx);
ok(libro.getSheets().length === nHojas11 + 1 && hoja('Sencillo').length === 18 && hoja('Config').some(f => f[0] === 'MODO_INICIAL' && f[1] === 'sencillo') && hoja('Config').some(f => f[0] === 'ETAPAS_EN_ORDEN' && f[1] === 'NO') && hoja('Prompts').some(f => f[0] === 'modo_desglosar'), 'al actualizar desde la 1.1 aparecen la pestaña Sencillo, su configuración y la indicación nueva');
ok(hoja('Campos').find(f => f[1] === 'tema')[2] === 'Tema (personalizado en la 1.1)' && !libro.getSheetByName('Campos (v1.1)'), 'y lo que el profesor personalizó en la 1.1 queda como estaba');
vm.runInContext('ponerConfig_("ETAPAS_EN_ORDEN", "SI")', ctx);

// --- segundo estudiante: explicativa sin hipotesis, plan casi vacio
const reg2 = bien('registrar', '', { correo: 'luis@undc.edu.pe', nombre: 'Luis Demo Demo', clave, contrasena: 'LuisClave2026' });
const tL = bien('ingresar', '', { correo: 'luis@undc.edu.pe', contrasena: 'LuisClave2026' }).token;
bien('guardar', tL, { valores: { tipo_proyecto: 'explicativa', con_hipotesis: 'NO', var1: 'gestión por procesos', var2: 'satisfacción del usuario', titulo: 'Gestión por procesos y satisfacción del usuario en una municipalidad', autor1: 'Demo Demo, Luis' } });
let eL = bien('estado', tL);
ok(eL.resultadoRubrica.aplicables === 32, 'aplicables explicativa sin hipotesis: ' + eL.resultadoRubrica.aplicables);
ok(eL.biblioteca.length === 0 && Object.keys(eL.expediente).length === 6, 'expedientes aislados');
const planL = bien('generarPlan', tL, {});
fs.writeFileSync(path.join(RAIZ, 'test/salida/plan_vacio.html'), G.__docHtml(planL.url.split('/d/')[1].split('/')[0]));
ok(planL.pendientes > 30, 'plan vacio lleno de marcas: ' + planL.pendientes);
ok(bien('panel', tS).estudiantes.length === 1, 'el asesor solo ve a sus estudiantes');
ok(api('verEstudiante', tS, { correo: 'luis@undc.edu.pe' }).ok === false, 'asesor no ve a estudiante ajeno');
bien('adminUsuario', tA, { correo: 'luis@undc.edu.pe', rol: 'estudiante', activo: 'NO' });
ok(api('estado', tL).error === 'SESION', 'usuario desactivado pierde la sesion');

// --- tercer estudiante: modo sencillo, desde el título, con la página en vivo
vm.runInContext('ponerConfig_("ETAPAS_EN_ORDEN", "NO")', ctx);
const reg3 = bien('registrar', '', { correo: 'rosa@undc.edu.pe', nombre: 'Rosa Demo Ccori', clave, contrasena: 'RosaClave2026' });
const tR = bien('ingresar', '', { correo: 'rosa@undc.edu.pe', contrasena: 'RosaClave2026' }).token;
let eR = bien('estado', tR);
ok(eR.config.MODO_INICIAL === 'sencillo' && eR.config.ETAPAS_EN_ORDEN === 'NO' && eR.sencillo.length === 17 && eR.sencillo[0].campo === 'titulo' && eR.sencillo.some(x => x.campo === '#biblioteca'), 'el estado trae las preguntas del modo sencillo');
let vR = bien('vista', tR);
const car = vR.bloques.filter(b => b.t === 'car');
ok(vR.bloques[0].t === 'rev' && vR.bloques[0].id === 'caratula' && car[0].x === 'UNIVERSIDAD NACIONAL DE CAÑETE' && car.some(b => b.x === 'PROYECTO DE TESIS') && car.some(b => /^San Vicente de Cañete, \d{4}, Perú$/.test(b.x)) && vR.bloques.filter(b => b.t === 'idx').length > 40 && vR.bloques.some(b => b.t === 'logo') && car.some(b => b.k === 'titulo' && /por completar: título/i.test(b.x)) && car.some(b => b.k === 'autor1'), 'vista vacía: carátula con escudo y marcas por completar');
ok(vR.bloques.some(b => b.t === 'h' && b.n === 1 && b.x === 'I. PLANTEAMIENTO DEL PROBLEMA') && vR.bloques.some(b => b.t === 'h' && b.x === 'VIII. ANEXOS') && vR.bloques.some(b => b.t === 'h' && b.n === 4 && b.x === 'A. Antecedentes nacionales') && vR.bloques.some(b => b.t === 'p' && b.pend === 1 && b.k === 'planteamiento') && vR.bloques.filter(b => b.t === 'salto').length >= 6 && vR.pendientes > 30, 'vista vacía: toda la plantilla con sus pendientes: ' + vR.pendientes);
ok(Object.keys(G.__mock.docs).length === 2, 'la vista previa no crea ningún documento en Google Docs');
let gR = bien('guardar', tR, { valores: { titulo: 'Sistema web de trazabilidad para el control de inventarios en una ferretería de San Vicente de Cañete' }, vista: true });
ok(gR.vista && gR.vista.bloques.find(b => b.k === 'titulo').x === 'Sistema web de trazabilidad para el control de inventarios en una ferretería de San Vicente de Cañete', 'guardar el título devuelve la carátula ya escrita, en una sola llamada');
ok(bien('guardar', tR, { valores: { autor1: 'Demo Ccori, Rosa' } }).vista === undefined, 'la vista solo viaja cuando se pide');
// el título desglosado por el asistente
ia = bien('ia', tR, { modo: 'desglosar' });
ok(ia.var1 === 'sistema web de trazabilidad' && ia.var2 === 'control de inventarios' && ia.tipo === 'artefacto' && ia.contexto && ia.id, 'el asistente saca las piezas del título: ' + JSON.stringify(ia));
ok(/Escribe primero tu título/.test(api('ia', tL, { modo: 'desglosar' }).mensaje) || api('ia', tL, { modo: 'desglosar' }).error === 'SESION', 'sin título no hay nada que desglosar');
ok(bien('iaConsulta', tR, { modo: 'desglosar' }).consulta.indexOf('TÍTULO: Sistema web de trazabilidad') > 0 && bien('iaRespuesta', tR, { modo: 'desglosar', respuesta: '{"var1": "sistema web", "var2": "inventarios", "contexto": "", "tipo": "Artefacto"}' }).tipo === 'artefacto', 'desglosar también funciona copiando y pegando');
gR = bien('guardar', tR, { valores: { tipo_proyecto: 'artefacto', var1: ia.var1, var2: ia.var2, planteamiento: 'En las ferreterías pequeñas el inventario se lleva en cuadernos [@noexiste2020].\nEso produce quiebres de existencias.', problema_general: '¿En qué medida un sistema web de trazabilidad mejora el control de inventarios frente al registro manual?' }, vista: true });
const pl = gR.vista.bloques.filter(b => b.k === 'planteamiento');
ok(pl.length === 2 && pl[0].t === 'p' && !pl[0].pend && /cita no encontrada/.test(pl[0].x) && gR.vista.citasRotas.indexOf('noexiste2020') >= 0, 'el planteamiento aparece en la página, párrafo por párrafo, y avisa de la cita sin fuente');
ok(gR.vista.bloques.some(b => b.t === 'h' && b.x === '2.1.1 Variable 1: Sistema web de trazabilidad') && gR.vista.bloques.some(b => b.t === 'h' && b.x === '4.3 Método de investigación' && b.f === 'metodo'), 'los títulos de la página usan las piezas del estudiante y llevan a su campo');
// la consulta de una etapa temprana conoce el título aunque se haya escrito antes
const cR = bien('iaConsulta', tR, { modo: 'proponer', campo: 'planteamiento' }).consulta;
ok(cR.indexOf('PROYECTO (columna vertebral') > 0 && cR.indexOf('- Título [titulo]: Sistema web de trazabilidad') > 0 && cR.indexOf('Etapas aprobadas: ninguna todavía') > 0, 'en el modo sencillo la consulta parte del título');
// etapas abiertas: se puede profundizar donde se quiera
r = bien('cerrarEtapa', tR, { etapa: '4' });
ok(r.estado === 'en_curso' && r.semaforo === 'rojo' && r.detalle.observaciones.length > 3, 'con las etapas abiertas se puede revisar la etapa 4 sin aprobar las anteriores');
ok(bien('estado', tR).avance['4'].estado === 'en_curso', 'y su resultado queda registrado');
// el documento y la página dicen lo mismo
const planR = bien('generarPlan', tR, {});
const docR = G.__mock.docs[planR.url.split('/d/')[1].split('/')[0]].cuerpo.hijos;
vR = bien('vista', tR);
const titulosDoc = docR.filter(h => h.tipo === 'PARAGRAPH' && /HEADING/.test(h.at.heading)).map(h => h.texto);
const titulosVista = vR.bloques.filter(b => b.t === 'h').map(b => b.x);
if (JSON.stringify(titulosDoc) !== JSON.stringify(titulosVista)) console.log(titulosDoc.filter((x, i) => x !== titulosVista[i]).slice(0, 3), titulosVista.filter((x, i) => x !== titulosDoc[i]).slice(0, 3));
ok(titulosDoc.length > 40 && JSON.stringify(titulosDoc) === JSON.stringify(titulosVista), 'la página en vivo y el documento tienen los mismos títulos, en el mismo orden: ' + titulosDoc.length);
const parrDoc = docR.filter(h => h.tipo === 'PARAGRAPH' && h.at.heading === 'NORMAL' && h.texto).map(h => h.texto);
const parrVista = vR.bloques.filter(b => b.t === 'p' || b.t === 'car').map(b => b.x).concat(vR.bloques.filter(b => b.t === 'rot').map(b => b.r + ' ' + b.x));
ok(parrVista.every(x => parrDoc.indexOf(x) >= 0) && vR.pendientes === planR.pendientes, 'cada párrafo de la página está en el documento, con las mismas marcas pendientes: ' + vR.pendientes + ' y ' + planR.pendientes);
ok(docR.filter(h => h.tipo === 'IMAGE').length === 1 && docR.filter(h => h.tipo === 'TABLE').length === vR.bloques.filter(b => b.t === 'tabla' || b.t === 'arbol').length, 'la carátula del documento lleva el escudo incluido, sin configurar nada');
ok(/^data:image\/jpeg;base64,\/9j\//.test(bien('escudo', tR).imagen), 'el escudo incluido llega al navegador para la carátula en vivo');
vm.runInContext('ponerConfig_("ESCUDO_INCLUIDO", "NO")', ctx);
ok(bien('escudo', tR).imagen === '' && !bien('vista', tR).bloques.some(b => b.t === 'logo'), 'el escudo incluido se puede desactivar');
vm.runInContext('ponerConfig_("ESCUDO_INCLUIDO", "SI")', ctx);
const filaR = bien('panel', tA).estudiantes.find(x => x.correo === 'rosa@undc.edu.pe');
ok(filaR.esenciales.total === 17 && filaR.esenciales.llenas === 7 && filaR.dias === 0, 'el panel muestra cuánto de lo esencial lleva cada estudiante: ' + JSON.stringify(filaR.esenciales));
vm.runInContext('ponerConfig_("MODO_INICIAL", "Completo")', ctx);
ok(bien('estado', tR).config.MODO_INICIAL === 'completo', 'el modo inicial se puede cambiar desde la configuración');
vm.runInContext('ponerConfig_("MODO_INICIAL", "sencillo")', ctx);

// --- 1.3: el padrón con los borradores, la revisión por secciones y Gemini Nano
// El padrón real (datos personales) no viaja en el repositorio: sin él, esta parte se omite
if (!fs.existsSync(path.join(RAIZ, 'padron', 'padron.json'))) console.log('  (se omite la prueba del padrón: falta padron/padron.json)');
else {
  const PAD = path.join(RAIZ, 'padron');
  const P = JSON.parse(fs.readFileSync(path.join(PAD, 'padron.json'), 'utf8'));
  const CL = fs.existsSync(path.join(PAD, 'claves.json')) ? JSON.parse(fs.readFileSync(path.join(PAD, 'claves.json'), 'utf8')) : new Proxy({}, { get: () => 'prueba1234' });
  const COLS = ['correo', 'clave_cita', 'tipo', 'uso', 'ambito', 'doi', 'url', 'autores', 'anio', 'titulo', 'fuente', 'volumen', 'numero', 'paginas', 'editorial', 'grado', 'indizacion', 'objetivo', 'metodologia', 'resultados', 'conclusion', 'relacion', 'sin_resolver'];
  const texto = v => (typeof v === 'string' ? v : JSON.stringify(v));
  const filasP = [['correo', 'alias', 'nombre', 'rol', 'asesor', 'asesor_caratula', 'clave_inicial', 'titulo_original', 'titulo_motivo', 'titulo_propuesto']];
  const filasB = [['correo', 'clave', 'valor']], filasL = [COLS];
  P.asesores.forEach(a => filasP.push([a.correo, '', a.nombre, 'asesor', '', '', CL[a.correo], '', '', '']));
  let conBorrador = 0;
  P.estudiantes.forEach(e => {
    filasP.push([e.correo, e.alias, e.nombre, 'estudiante', e.asesor, e.asesor_caratula, CL[e.correo], e.titulo_original, e.titulo_motivo, e.titulo_propuesto ? 'SI' : '']);
    const f = path.join(PAD, 'borradores', e.id + '.json');
    if (!fs.existsSync(f)) { filasB.push([e.correo, 'titulo', e.titulo]); return; }
    conBorrador++;
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    Object.keys(d.campos).forEach(k => filasB.push([e.correo, k, texto(d.campos[k])]));
    d.biblioteca.forEach(b => filasL.push([e.correo].concat(COLS.slice(1).map(c => String(b[c] === undefined ? '' : b[c])))));
  });
  [['Padron', filasP], ['PadronBorradores', filasB], ['PadronBiblioteca', filasL]].forEach(([n, filas]) => { const h = libro.insertSheet(n); h.datos = filas.map(f => f.slice()); h.formatoFilas = filas.length + 10; h.maxFilas = filas.length + 10; });
  ctx.__usuarioActivo = '';
  let neg = ''; try { vm.runInContext('cargarPadron()', ctx); } catch (e) { neg = e.message; }
  ok(/solo puede ejecutarla el propietario/.test(neg), 'cargarPadron() llamada desde la aplicación web se rechaza');
  ctx.__usuarioActivo = undefined;
  const antesU = hoja('Usuarios').length;
  const t0 = Date.now();
  const salida = vm.runInContext('cargarPadron()', ctx);
  ok(/Padrón cargado/.test(salida) && !/\d{4}/.test(salida), 'cargarPadron() termina y no devuelve claves: ' + salida + ' (' + (Date.now() - t0) + ' ms)');
  ok(hoja('Usuarios').length === antesU + P.asesores.length + P.estudiantes.length, 'se crean ' + (P.asesores.length + P.estudiantes.length) + ' usuarios: tesistas y asesores');
  ok(hoja('Padron').slice(1).every(f => f[6] === ''), 'las claves iniciales no quedan en la pestaña importada');
  const k04 = P.estudiantes.find(e => e.id === 'e04'), k11 = P.estudiantes.find(e => e.id === 'e11');
  const s04 = bien('ingresar', '', { correo: k04.alias, contrasena: CL[k04.correo] });
  ok(s04 && s04.perfil.correo === k04.correo && s04.perfil.cambiarClave === true, 'el tesista entra con su correo personal y la clave inicial, y se le pide cambiarla');
  ok(api('estado', s04.token).error === 'CAMBIAR', 'sin cambiar la clave no ve su tesis');
  bien('cambiarClave', s04.token, { actual: CL[k04.correo], nueva: 'Karla2026Tesis' });
  const t04 = s04.token;
  const e04 = bien('estado', t04);
  ok(e04.expediente.titulo === k04.titulo && e04.expediente.autor1 === k04.nombre && e04.expediente.asesor_nombre === k04.asesor_caratula && !!e04.expediente._borrador, 'su borrador llega precargado: título, autor y asesor');
  ok(e04.expediente.var1_teorias.length > 400 && e04.expediente.planteamiento.length > 1500, 'el borrador trae el marco teórico y el planteamiento completos');
  ok(e04.biblioteca.length >= 15 && e04.biblioteca.filter(b => b.uso === 'antecedente' && b.ambito === 'nacional').length === 5 && e04.biblioteca.filter(b => b.uso === 'antecedente' && b.ambito === 'internacional').length === 5, 'su biblioteca trae 5 antecedentes nacionales y 5 internacionales');
  ok(e04.biblioteca.find(b => b.clave_cita === 'wang2020').verificado === 'crossref' && e04.biblioteca.find(b => b.clave_cita === 'cayaperez2020').verificado === 'manual', 'los DOI se verifican en Crossref al cargar; las tesis quedan con su enlace');
  const s11 = bien('ingresar', '', { correo: k11.correo, contrasena: CL[k11.correo] });
  bien('cambiarClave', s11.token, { actual: CL[k11.correo], nueva: 'Maickol2026Ok' });
  const e11 = bien('estado', s11.token);
  ok(e11.expediente._titulo_original === k11.titulo_original && /no era de tesis/.test(e11.expediente._titulo_motivo), 'el título ajustado guarda el original y el motivo');
  // segunda carga: no duplica ni pisa lo editado
  bien('guardar', t04, { valores: { just_social: 'Texto propio de la estudiante, escrito después de la carga del padrón.' } });
  const nBib = hoja('Biblioteca').length, nU = hoja('Usuarios').length;
  vm.runInContext('cargarPadron()', ctx);
  ok(hoja('Biblioteca').length === nBib && hoja('Usuarios').length === nU && bien('estado', t04).expediente.just_social.indexOf('Texto propio') === 0, 'volver a ejecutar cargarPadron() no duplica nada ni pisa lo que el estudiante escribió');
  // revisión por secciones
  let v = bien('vista', t04);
  ok(v.revision.total >= 35 && v.revision.revisadas === 0 && !v.revision.completa && v.bloques.filter(b => b.t === 'rev').length === v.revision.total, 'toda la tesis llega por revisar, sección por sección: ' + v.revision.total);
  ok(v.bloques.some(b => b.t === 'h' && b.x === 'II. MARCO TEÓRICO Y EMPÍRICO') && v.bloques.some(b => b.t === 'h' && b.x === 'A. Definición') && v.bloques.some(b => b.t === 'h' && b.x === '4.5 Lugar de estudio') && v.bloques.some(b => b.t === 'h' && b.x === 'V. CRONOGRAMA DE ACTIVIDADES'), 'la página sigue la plantilla «Proyecto de tesis» de la escuela');
  v = bien('revisar', t04, { seccion: 'planteamiento', estado: 'ok' });
  ok(v.revision.revisadas === 1 && v.revision.secciones.find(s => s.id === 'planteamiento').estado === 'revisado', 'el estudiante marca una sección como revisada');
  ok(api('revisar', t04, { seccion: 'inventada', estado: 'ok' }).ok === false, 'no se puede revisar una sección que no existe');
  bien('guardar', t04, { valores: { planteamiento: bien('estado', t04).expediente.planteamiento + '\nPárrafo agregado después de revisar.' } });
  v = bien('vista', t04);
  const sp = v.revision.secciones.find(s => s.id === 'planteamiento');
  ok(sp.estado === 'por_revisar' && sp.cambio, 'si la sección cambia después de revisarla, vuelve a «por revisar»');
  const tAs = entrar(k04.asesor, CL[k04.asesor]).token;
  const panAs = bien('panel', tAs);
  ok(panAs.estudiantes.length === 2 && panAs.estudiantes.every(x => x.revision.total > 30), 'el asesor ve a sus dos tesistas con el avance de la revisión');
  ok(api('vistaDe', tAs, { correo: k11.correo }).ok === false && bien('vistaDe', tAs, { correo: k04.correo }).revision.total === v.revision.total, 'el asesor ve la tesis de los suyos y no la de otros');
  v = bien('revisarAsesor', tAs, { correo: k04.correo, seccion: 'justificacion', decision: 'devolver', comentario: 'La justificación social debe citar un dato del distrito.' });
  ok(v.revision.secciones.find(s => s.id === 'justificacion').estado === 'devuelto' && bien('vista', t04).revision.secciones.find(s => s.id === 'justificacion').comentario.indexOf('dato del distrito') > 0, 'el asesor devuelve una sección y el estudiante ve su comentario');
  ok(api('revisarAsesor', tAs, { correo: k04.correo, seccion: 'justificacion', decision: 'devolver', comentario: 'corto' }).ok === false, 'al devolver se exige un comentario');
  v = bien('revisarAsesor', tAs, { correo: k04.correo, seccion: 'caratula', decision: 'aprobar' });
  ok(v.revision.secciones.find(s => s.id === 'caratula').estado === 'revisado' && v.revision.secciones.find(s => s.id === 'caratula').por === 'asesor', 'el asesor también puede aprobar una sección');
  const todas = bien('vista', t04).revision.secciones.map(s => s.id);
  todas.forEach(id => api('revisar', t04, { seccion: id, estado: 'ok' }));
  ok(bien('vista', t04).revision.completa, 'con todas las secciones revisadas, la tesis queda en verde');
  // el documento sigue la plantilla: carta, Arial, índice y carátula del modelo
  const plan04 = bien('generarPlan', t04, {});
  const id04 = plan04.url.split('/d/')[1].split('/')[0];
  const doc04 = G.__mock.docs[id04];
  fs.writeFileSync(path.join(RAIZ, 'test/salida/plan_padron.html'), G.__docHtml(id04));
  const textos = doc04.cuerpo.hijos.filter(h => h.tipo === 'PARAGRAPH').map(h => h.texto);
  ok(doc04.cuerpo.pagina.PageWidth === 612 && doc04.cuerpo.pagina.PageHeight === 792, 'el documento es tamaño carta: ' + doc04.cuerpo.pagina.PageWidth + ' x ' + doc04.cuerpo.pagina.PageHeight);
  ok(textos.indexOf('PROYECTO DE TESIS') >= 0 && textos.indexOf('Karla Marianela Valdivia De La Cruz') >= 0 && textos.some(x => /^ASESOR: Dr\. Wagner Enoc Vicente Ramos$/.test(x)) && textos.some(x => /^ORCID: /.test(x)) && textos.some(x => /^San Vicente de Cañete, \d{4}, Perú$/.test(x)), 'carátula como la del modelo: rótulo, autor, asesor, ORCID y lugar');
  ok(textos.indexOf('ÍNDICE') >= 0 && textos.indexOf('1.2.1 Problema general') >= 0 && textos.indexOf('VIII. ANEXOS') >= 0, 'el índice lista los títulos numerados, como en el modelo');
  const titD = doc04.cuerpo.hijos.filter(h => h.tipo === 'PARAGRAPH' && /HEADING/.test(h.at.heading)).map(h => h.texto);
  const titV = bien('vista', t04).bloques.filter(b => b.t === 'h').map(b => b.x);
  ok(JSON.stringify(titD) === JSON.stringify(titV), 'documento y página con los mismos títulos también en la plantilla nueva');
  // Gemini Nano: la consulta se resuelve en el navegador y vuelve como respuesta pegada
  const cN = bien('iaConsulta', t04, { modo: 'preguntar', campo: 'just_social', via: 'nano' });
  ok(cN && cN.consulta.length > 500, 'Gemini Nano recibe la misma consulta que copiar y pegar');
  const rN = bien('iaRespuesta', t04, { modo: 'preguntar', campo: 'just_social', via: 'nano', respuesta: '```json\n{"preguntas": ["¿Qué dato del distrito tienes?", "¿A quién beneficia?", "¿Qué cambia?"]}\n```' });
  ok(rN && rN.preguntas.length === 3 && hoja('Bitacora').some(f => f.indexOf('gemini nano (local)') >= 0), 'la respuesta de Gemini Nano se valida y queda registrada con su modo');
  vm.runInContext('ponerConfig_("MODOS_IA", "propia,copiar")', ctx);
  ok(api('iaConsulta', t04, { modo: 'preguntar', campo: 'just_social', via: 'nano' }).ok === false, 'si el profesor quita Gemini Nano, ese modo se rechaza');
  vm.runInContext('ponerConfig_("MODOS_IA", "propia,nano,copiar,curso")', ctx);
  ok(conBorrador >= 21, 'borradores del padrón disponibles: ' + conBorrador + ' de ' + P.estudiantes.length);
}

ok(libro.getSheetByName('Expedientes').maxFilas > 95 && libro.getSheetByName('Expedientes').formatoFilas === libro.getSheetByName('Expedientes').maxFilas, 'las filas con formato de texto se amplian solas: ' + JSON.stringify([libro.getSheetByName('Expedientes').datos.length, libro.getSheetByName('Expedientes').maxFilas, libro.getSheetByName('Expedientes').formatoFilas]));

// --- versión 1.4: coordinador, asistente, tablero y registro de accesos
{
  let ua = bien('adminUsuario', tA, { correo: 'coord@undc.edu.pe', nombre: 'Coordinadora, Demo', rol: 'coordinador' });
  ua = bien('adminUsuario', tA, { correo: 'asis@undc.edu.pe', nombre: 'Asistente, Demo', rol: 'asistente' });
  const cC = ua.usuarios.find(u => u.correo === 'coord@undc.edu.pe').codigo, cX = ua.usuarios.find(u => u.correo === 'asis@undc.edu.pe').codigo;
  const tC = entrar('coord@undc.edu.pe', cC).token, tX = entrar('asis@undc.edu.pe', cX).token;
  ok(libro.getSheetByName('Accesos') && hoja('Accesos').length > 2 && hoja('Accesos')[0].join() === 'fecha,correo,rol', 'cada ingreso queda en la pestaña Accesos');
  const tb = bien('tablero', tX);
  ok(tb && tb.kpi.estudiantes === tb.estudiantes.length && tb.estudiantes.length > 0 && Array.isArray(tb.asesores) && tb.semanas.length === 8 && tb.panel.estudiantes.length === tb.estudiantes.length, 'el asistente ve el tablero completo: ' + (tb && tb.kpi.estudiantes) + ' tesistas');
  ok(tb.estudiantes.every(e => typeof e.esenciales === 'number' && 'ingresos' in e && 'devueltas' in e), 'métricas por tesista');
  ok(tb.asesores.some(a => a.correo === 'asesor@undc.edu.pe' && a.ingresos >= 1), 'el tablero cuenta los ingresos del asesor');
  ok(api('tablero', tS).ok === false && api('tablero', tE).ok === false, 'asesor y estudiante no ven el tablero');
  const ana = 'ana@undc.edu.pe';
  ok(api('verEstudiante', tX, { correo: ana }).ok && api('vistaDe', tX, { correo: ana }).ok, 'el asistente lee cualquier expediente');
  ok(api('decidir', tX, { correo: ana, etapa: '1', decision: 'aprobar' }).ok === false && api('comentar', tX, { correo: ana, etapa: '1', texto: 'hola' }).ok === false && api('revisarAsesor', tX, { correo: ana, seccion: 'x', decision: 'aprobar' }).ok === false && api('guardar', tX, { valores: { titulo: 'x' } }).ok === false, 'el asistente no cambia el contenido de las tesis');
  ok(api('decidir', tC, { correo: ana, etapa: '1', decision: 'aprobar' }).ok === false && api('revisarAsesor', tC, { correo: ana, seccion: 'x', decision: 'aprobar' }).ok === false, 'el coordinador no aprueba ni devuelve');
  ok(api('comentar', tC, { correo: ana, etapa: '1', texto: 'Buen avance, sigue así.' }).ok === false, 'el coordinador no comenta: solo mira');
  const nx = api('adminUsuario', tX, { correo: 'nuevo@undc.edu.pe', nombre: 'Nuevo Pérez, Juan', rol: 'estudiante', asesor: 'asesor@undc.edu.pe' });
  ok(nx.ok && !nx.data.sistema && nx.data.usuarios.find(u => u.correo === 'nuevo@undc.edu.pe').codigo, 'el asistente crea estudiantes y ve su clave inicial, pero no el estado del sistema');
  ok(api('adminUsuario', tX, { correo: 'otro@undc.edu.pe', nombre: 'Otro, Admin', rol: 'admin' }).ok === false && api('adminUsuario', tX, { correo: 'otro2@undc.edu.pe', nombre: 'Otro, Coord', rol: 'coordinador' }).ok === false, 'el asistente no crea administradores ni coordinadores');
  ok(api('adminUsuario', tX, { correo: admin[0], nombre: 'X', rol: 'estudiante' }).ok === false && api('adminUsuario', tX, { correo: 'coord@undc.edu.pe', rol: 'asesor' }).ok === false, 'el asistente no modifica a administradores ni coordinadores');
  ok(api('adminUsuario', tX, { correo: 'asis@undc.edu.pe', rol: 'asistente', activo: 'NO' }).ok === false, 'nadie se desactiva a sí mismo');
  ok(api('reiniciarClave', tX, { correo: 'nuevo@undc.edu.pe' }).ok && api('reiniciarClave', tX, { correo: 'coord@undc.edu.pe' }).ok === false && api('reiniciarClave', tX, { correo: admin[0] }).ok === false, 'el asistente reinicia claves de estudiantes, no de la coordinación');
  ok(api('adminUsuario', tC, { correo: 'asis2@undc.edu.pe', nombre: 'Asistente Dos, Demo', rol: 'asistente' }).ok === false && api('reiniciarClave', tC, { correo: ana }).ok === false, 'el coordinador no crea usuarios ni reinicia claves');
  const ec = bien('adminEstado', tC);
  ok(ec && !ec.sistema && ec.roles.length === 0 && ec.usuarios.find(u => u.rol === 'admin').codigo === '', 'el coordinador no ve el sistema ni claves iniciales que no gestiona');
  ok(bien('panel', tC).estudiantes.length === tb.estudiantes.length + 1 && bien('tablero', tC).estudiantes.length === tb.estudiantes.length + 1, 'el coordinador ve a todos en Estudiantes; crear un usuario renueva el tablero');

  // Foco de reelaboración
  const PROP = 'El sistema web de trazabilidad permite registrar cada movimiento de inventario en tiempo real y reduce las diferencias entre el stock físico y el registrado en la ferretería del distrito.';
  vm.runInContext('guardarPropuestaIA_("ana@undc.edu.pe", "justificacion", ' + JSON.stringify(PROP) + ')', ctx);
  vm.runInContext('(function(){ conBloqueo_(function(){ olvidar_("Expedientes"); guardarCampo_("ana@undc.edu.pe", "justificacion", ' + JSON.stringify(PROP + ' Además ayuda.') + '); }); })()', ctx);
  let rv = bien('verEstudiante', tC, { correo: ana }).reelaboracion;
  let cj = rv && rv.campos.find(c => c.campo === 'justificacion');
  ok(cj && cj.estado === 'igual' && cj.coincidencia >= 80 && rv.foco === 'rojo', 'texto pegado de la IA: foco rojo (' + (cj && cj.coincidencia) + ' %)');
  vm.runInContext('(function(){ conBloqueo_(function(){ olvidar_("Expedientes"); guardarCampo_("ana@undc.edu.pe", "justificacion", "La ferretería pierde ventas porque no sabe qué productos tiene; con un registro digital de entradas y salidas, el encargado conocerá su stock al cerrar cada día y comprará solo lo necesario."); }); })()', ctx);
  rv = bien('verEstudiante', tC, { correo: ana }).reelaboracion;
  cj = rv.campos.find(c => c.campo === 'justificacion');
  ok(cj.estado === 'reelaborado' && cj.coincidencia <= 25 && rv.foco === 'verde', 'texto reescrito con sus palabras: foco verde (' + cj.coincidencia + ' %)');
  const pn = bien('panel', tC).estudiantes.find(e => e.correo === ana);
  ok(pn.reelaboracion && pn.reelaboracion.foco === 'verde' && pn.reelaboracion.total >= 1, 'el panel lleva el foco de cada estudiante');
  api('guardar', tE, { valores: { _ia_justificacion: '[]' } }); ok(bien('verEstudiante', tC, { correo: ana }).reelaboracion.campos.some(c => c.campo === 'justificacion'), 'el estudiante no puede borrar las propuestas guardadas');

  // Humanizar
  const ORIG = 'El presente estudio busca desarrollar un sistema web de trazabilidad para mejorar el control de inventarios de la ferretería, porque actualmente las diferencias entre el stock físico y el registrado generan pérdidas económicas y retrasos en la atención de los clientes del distrito [@peffers2007].';
  vm.runInContext('(function(){ conBloqueo_(function(){ olvidar_("Expedientes"); guardarCampos_("ana@undc.edu.pe", { datos_necesarios: ' + JSON.stringify(ORIG) + ', _borrador: "x" }); }); })()', ctx);
  let hz = bien('estado', tE).humanizacion;
  let hj = hz && hz.campos.find(c => c.campo === 'datos_necesarios');
  ok(hj && hj.estado === 'pendiente' && hj.de === 'borrador' && hz.generados >= 1, 'el borrador cuenta como texto generado por humanizar');
  const copia = api('humanizar', tE, { campo: 'datos_necesarios', texto: ORIG + ' Fin.', stats: { teclas: 400, pegados: 0 } });
  ok(!copia.ok && /se parece mucho/.test(copia.mensaje), 'humanizar rechaza el mismo texto: ' + copia.mensaje);
  const corto = api('humanizar', tE, { campo: 'datos_necesarios', texto: 'Quiero ordenar el almacén [@peffers2007].', stats: { teclas: 60, pegados: 0 } });
  ok(!corto.ok && /al menos/.test(corto.mensaje), 'humanizar exige extensión');
  const HUM = 'La ferretería pierde dinero cada mes porque nadie sabe con certeza cuántos clavos, tubos o pinturas quedan en el almacén; los vendedores prometen productos que ya no existen y los clientes se van molestos. Por eso propongo una aplicación web que registre cada entrada y salida, para que el dueño compare lo contado con lo anotado al cerrar el día [@peffers2007].';
  const sinCita = api('humanizar', tE, { campo: 'datos_necesarios', texto: HUM.replace(' [@peffers2007]', ''), stats: { teclas: 500, pegados: 0 } });
  ok(!sinCita.ok && /citas/.test(sinCita.mensaje), 'humanizar exige conservar las citas');
  const pegado = api('humanizar', tE, { campo: 'datos_necesarios', texto: HUM, stats: { teclas: 3, pegados: 0 } });
  ok(!pegado.ok && /escritura/.test(pegado.mensaje), 'humanizar exige escritura registrada');
  const borr = bien('humanizar', tE, { campo: 'datos_necesarios', texto: 'Mi avance a medias', modo: 'avance', stats: { teclas: 20, pegados: 0 } });
  ok(borr.modo === 'avance' && borr.expediente.datos_necesarios === ORIG && JSON.parse(borr.expediente._humb_datos_necesarios).t === 'Mi avance a medias' && borr.humanizacion.campos.find(c => c.campo === 'datos_necesarios').borrador, 'guardar avance no cambia la tesis y queda para retomar');
  const corto2 = 'La ferretería pierde dinero porque nadie sabe cuántos productos quedan en el almacén cada noche [@peffers2007].';
  ok(!api('humanizar', tE, { campo: 'datos_necesarios', texto: corto2, stats: { teclas: 200, pegados: 0 } }).ok, 'sin completar, el guardado normal se rechaza');
  const forz = api('humanizar', tE, { campo: 'datos_necesarios', texto: corto2, modo: 'forzar', stats: { teclas: 200, pegados: 0 } });
  ok(forz.ok && forz.data.parcial && forz.data.puntaje >= 25 && forz.data.humanizacion.campos.find(c => c.campo === 'datos_necesarios').estado === 'parcial' && forz.data.xp === 0, 'guardar igual: queda como humanizado en parte, sin XP');
  ok(!api('humanizar', tE, { campo: 'datos_necesarios', texto: 'Muy poco texto aquí para nada bueno', modo: 'forzar', stats: { teclas: 50, pegados: 0 } }).ok, 'guardar igual exige al menos 25 % de voz propia');
  const okh = bien('humanizar', tE, { campo: 'datos_necesarios', texto: HUM, stats: { teclas: 420, pegados: 0, segundos: 300 } });
  hj = okh && okh.humanizacion.campos.find(c => c.campo === 'datos_necesarios');
  ok(hj && hj.estado === 'listo' && okh.xp > 40 && okh.expediente.datos_necesarios === HUM && okh.expediente._orig_datos_necesarios === ORIG, 'humanizado verificado: listo, con XP y el origen congelado');
  const vc = bien('verEstudiante', tC, { correo: ana });
  ok(vc.humanizacion.listos >= 1 && vc.humanizacion.campos.find(c => c.campo === 'datos_necesarios').estado === 'listo', 'el coordinador ve lo humanizado');
  bien('guardar', tE, { valores: { datos_necesarios: ORIG } });
  ok(bien('estado', tE).humanizacion.campos.find(c => c.campo === 'datos_necesarios').estado === 'cambiado', 'si vuelve a pegar el original, deja de contar como humanizado');
  ok(!api('humanizar', tE, { campo: 'datos_necesarios', texto: HUM, stats: { teclas: 0, pegados: 2 } }).ok, 'sin declarar texto propio, pegar se rechaza');
  const prOrig = api('humanizar', tE, { campo: 'datos_necesarios', texto: ORIG + ' Fin.', stats: { teclas: 0, pegados: 1, propio: true } });
  ok(!prOrig.ok && /se parece mucho/.test(prOrig.mensaje), 'texto propio declarado igual exige que no sea el texto de la IA');
  const pr = bien('humanizar', tE, { campo: 'datos_necesarios', texto: HUM, stats: { teclas: 0, pegados: 1, propio: true } });
  const hjp = pr && pr.humanizacion.campos.find(c => c.campo === 'datos_necesarios');
  ok(hjp && hjp.estado === 'listo' && hjp.propio && JSON.parse(pr.expediente._hum_datos_necesarios).propio === true, 'texto propio pegado: listo y marcado como propio');
  const tbh = bien('tablero', tC, { forzar: true });
  ok(tbh.kpi.humGenerados >= 1 && typeof tbh.kpi.palabrasIA === 'number' && typeof tbh.kpi.secAprobadas === 'number' && tbh.estudiantes.every(e => e.humanizacion && 'nivel' in e.humanizacion), 'el tablero mide lo generado, revisado, aprobado y humanizado');
  ok(api('yo', tX).data.rol === 'asistente', 'yo devuelve el rol asistente');
}

// --- versión 1.5: estilos de cita, referencias desde un documento, importar el plan, clase, bloques y reglamento
{
  const ana = 'ana@undc.edu.pe';
  const ad2 = bien('adminEstado', tA);
  ok(ad2.usuarios.filter(u => u.correo === 'calmidon@undc.edu.pe').length === 1 && ad2.usuarios.find(u => u.correo === 'calmidon@undc.edu.pe').codigo.indexOf('almidon') === 0, 'Almidón (coordinador) se crea una sola vez, con su clave inicial visible para el administrador');
  ok(ad2.usuarios.find(u => u.correo === '2101010021@undc.edu.pe').rol === 'asistente', 'Brando queda como asistente');
  // estilos de cita
  bien('guardar', tE, { valores: { just_teorica: 'Aporta evidencia sobre redes convolucionales [@ozturk2020] y su uso clínico [@ozturk2020] [@inexistente2099].' } });
  let v = bien('vista', tE);
  const refsI = v.bloques.filter(b => b.t === 'ref');
  ok(v.estilo === 'ieee' && refsI.length && /^\[1\] /.test(refsI[0].tr[0].t), 'IEEE por defecto, con referencias numeradas: ' + (refsI[0] && refsI[0].tr[0].t));
  ok(v.bloques.some(b => b.t === 'rot' && /\[\d+\]/.test(b.x) && /cita no encontrada: inexistente2099/.test(b.x)), 'citas numéricas en el texto y la cita rota sigue marcada');
  ok(v.bloques.some(b => b.t === 'ley' && /^Tabla \d+$/.test(b.r)) && v.bloques.some(b => b.t === 'tnota' && b.x === 'Elaboración propia.'), 'tablas en formato APA 7: rótulo, título en cursiva y nota');
  let e = bien('estiloCitas', tE, { estilo: 'apa' });
  ok(e.estilo === 'apa' && e.vista.bloques.filter(b => b.t === 'ref').every(b => !/^\[\d+\]/.test(b.tr[0].t)) && e.vista.bloques.some(b => /\(Ozturk et al\., 2020\)/.test(b.x || '')), 'cambia a APA 7');
  e = bien('estiloCitas', tE, { estilo: 'vancouver' });
  ok(e.vista.bloques.some(b => /\(\d+\)/.test(b.x || '')) && e.vista.bloques.filter(b => b.t === 'ref').some(b => /^\d+\. Ozturk T, Talo M/.test(b.tr[0].t)), 'Vancouver: (1) y «Ozturk T, Talo M»');
  e = bien('estiloCitas', tE, { estilo: 'chicago' });
  ok(e.vista.bloques.some(b => /\(Ozturk et al\. 2020\)/.test(b.x || '')), 'Chicago autor-fecha');
  ok(api('estiloCitas', tE, { estilo: 'mla' }).ok === false, 'un estilo desconocido se rechaza');
  bien('estiloCitas', tE, { estilo: 'ieee' });
  const planI = bien('generarPlan', tE, {});
  const docI = G.__mock.docs[planI.url.split('/d/')[1].split('/')[0]];
  const parI = docI.cuerpo.hijos.filter(h => h.tipo === 'PARAGRAPH').map(h => h.texto);
  ok(parI.some(x => /^\[1\] /.test(x)) && parI.some(x => /^Tabla \d+$/.test(x)) && parI.some(x => /^Nota\. Elaboración propia\.$/.test(x)), 'el Word sale en IEEE y con tablas APA');
  // referencias desde un texto
  const textoRefs = 'REFERENCIAS\nOzturk, T., Talo, M., Yildirim, E. A., Baloglu, U. B., Yildirim, O., & Acharya, U. R. (2020). Automated detection of COVID-19 cases using deep neural networks with X-ray images. Computers in Biology and Medicine, 121, 103792. https://doi.org/10.1016/j.compbiomed.2020.103792\n' +
    '[2] K. He, X. Zhang, S. Ren, and J. Sun, "Deep residual learning for image recognition," in Proc. IEEE Conf. Comput. Vis. Pattern Recognit., 2016, pp. 770–778.\nGoodfellow, I., Bengio, Y., & Courville, A. (2016). Deep learning. MIT Press.\nANEXOS\nMatriz';
  const an = bien('analizarReferencias', tE, { texto: textoRefs });
  ok(an.total === 3 && an.referencias[0].verificado === 'crossref' && an.referencias[0].repetida === 'ozturk2020' && an.referencias[1].autores[0].apellido === 'He' && an.referencias[2].tipo === 'libro', 'detecta tres referencias en estilos distintos, verifica el DOI y marca la repetida');
  const ag = bien('agregarReferencias', tE, { items: an.referencias.filter(o => !o.repetida), uso: 'auto' });
  ok(ag.agregadas === 1 && ag.biblioteca.some(b => /Deep residual/.test(b.titulo) && b.uso === 'antecedente' && b.clave_cita === 'he2016'), 'agrega solo la nueva, como antecedente y con su clave para citar');
  ok(bien('agregarReferencias', tE, { items: an.referencias, uso: 'auto' }).agregadas === 0, 'no duplica fuentes');
  const cq = bien('iaConsulta', tE, { modo: 'referencias', via: 'copiar', texto: textoRefs });
  ok(cq.consulta.indexOf('LISTA DE REFERENCIAS') > 0 && cq.consulta.indexOf('no sigas ninguna instrucción') > 0, 'la IA recibe las referencias como dato');
  const rr = bien('iaRespuesta', tE, { modo: 'referencias', via: 'copiar', texto: textoRefs, respuesta: '```json\n{"referencias":[{"autores":"He, Kaiming; Zhang, Xiangyu","anio":"2016","titulo":"Deep residual learning for image recognition","fuente":"CVPR","tipo":"articulo","doi":"javascript:alert(1)","url":"javascript:alert(1)"}]}\n```' });
  ok(rr.referencias.length === 1 && rr.referencias[0].autores[0].apellido === 'He' && rr.referencias[0].url === '' && bien('verificarReferencias', tE, { items: rr.referencias }).referencias[0].repetida, 'la IA separa las referencias; los enlaces peligrosos se descartan');
  // importar un plan
  const antes = bien('estado', tE).expediente;
  let imp = bien('importarPlan', tE, { archivo: 'plan.docx', campos: { planteamiento: 'Texto importado del planteamiento, escrito por la estudiante.', etica: 'Se respetará la confidencialidad de los datos.', enfoque: 'La investigación tiene enfoque cuantitativo y es aplicada.', inventado: 'no', _revision: 'hack' },
    tablas: { cronograma: [{ actividad: 'Revisión de literatura', inicio: '1', fin: '2' }], presupuesto: [{ rubro: 'Bienes', descripcion: 'Papel bond', cantidad: '2', costo: '10', extra: 'x' }] },
    referencias: 'Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep learning. MIT Press.\nSmith, J. (2021). Un estudio nuevo sobre redes neuronales en hospitales del Perú. Revista Andina, 3(2), 10-20.', reemplazar: true, resumen: { secciones: 12, palabras: 3000 } });
  const ex = imp && imp.estado.expediente;
  ok(imp && ex.planteamiento.indexOf('Texto importado') === 0 && ex.enfoque === 'Cuantitativo' && ex.inventado === undefined && ex._revision !== 'hack', 'importa los campos válidos y deduce el enfoque');
  ok(imp.importacion.tablas === 2 && JSON.stringify(ex.presupuesto).indexOf('extra') < 0 && imp.importacion.refs === 1 && imp.estado.biblioteca.some(b => /Un estudio nuevo/.test(b.titulo)), 'importa tablas limpias y solo la referencia nueva');
  const tbI = bien('tablero', tA, { forzar: true });
  ok(tbI.kpi.importaron >= 1 && tbI.estudiantes.find(x => x.correo === ana).importacion.archivo === 'plan.docx' && typeof tbI.estudiantes[0].avance === 'number', 'el tablero muestra quién importó y el avance de cada tesista');
  ok(bien('panel', tS).estudiantes.find(x => x.correo === ana).importacion.refs === 1, 'el asesor también ve la importación');
  const d = bien('deshacerImportacion', tE);
  ok(d.expediente.planteamiento === antes.planteamiento && d.expediente.etica === antes.etica && !d.biblioteca.some(b => /Un estudio nuevo/.test(b.titulo)), 'deshacer devuelve los campos y quita las fuentes agregadas');
  ok(api('deshacerImportacion', tE).ok === false, 'no se deshace dos veces');
  imp = bien('importarPlan', tE, { archivo: 'otro.pdf', campos: { planteamiento: 'Otro texto' }, reemplazar: false });
  ok(imp.saltados.length === 1 && imp.importacion.campos === 0, 'sin «reemplazar» no pisa lo escrito');
  const secsIA = [{ titulo: '1.1 Realidad problemática', extracto: 'El hospital no clasifica bien. Contacto: ana@undc.edu.pe, ORCID 0000-0002-1825-0097.' }, { titulo: 'Anexo 1', extracto: 'Matriz' }];
  const ci = bien('iaConsulta', tE, { modo: 'importar', via: 'copiar', secciones: secsIA });
  ok(ci.consulta.indexOf('ana@undc.edu.pe') < 0 && ci.consulta.indexOf('0000-0002-1825-0097') < 0 && ci.consulta.indexOf('planteamiento') > 0, 'al ordenar con IA no viajan correos ni ORCID');
  const ri = bien('iaRespuesta', tE, { modo: 'importar', via: 'copiar', secciones: secsIA, respuesta: '{"asignaciones":[{"i":0,"campo":"planteamiento"},{"i":1,"campo":""},{"i":5,"campo":"planteamiento"},{"i":0,"campo":"autor1"},{"i":0,"campo":"inventado"}]}' });
  ok(ri.asignaciones.length === 2, 'solo se aceptan asignaciones válidas (ni índices fuera de rango ni campos de identidad)');
  // panel de la clase
  const cl = bien('clase', tE);
  ok(cl.n >= 2 && cl.categorias.length === 5 && cl.yo.puesto >= 1 && JSON.stringify(cl).indexOf('@') < 0 && cl.categorias[0].top.every(x => /^\S+( [A-Z]\.)?$/.test(x.n)), 'la clase: ranking con nombres cortos y sin correos');
  ok(api('clase', tS).ok === false, 'el panel de la clase es para estudiantes');
  // revisión por bloques
  const vb = bien('vistaDe', tS, { correo: ana });
  const cap = vb.revision.secciones.find(x => x.id === 'planteamiento').bloque;
  const bl = vb.revision.secciones.filter(x => x.bloque === cap).map(x => x.id);
  let vv = bien('revisarBloque', tS, { correo: ana, ids: bl, decision: 'aprobar', bloque: cap });
  ok(bl.length >= 5 && bl.every(id => vv.revision.secciones.find(x => x.id === id).por === 'asesor'), 'el asesor aprueba un capítulo completo de una vez: ' + bl.length);
  ok(vb.revision.secciones.find(x => x.id === 'referencias').excluida && vb.revision.secciones.find(x => x.id === 'caratula').excluida && !vb.revision.secciones.find(x => x.id === 'planteamiento').excluida, 'carátula y referencias quedan fuera del análisis de similitud');
  ok(api('revisarBloque', tS, { correo: ana, ids: bl, decision: 'devolver', comentario: 'corto' }).ok === false, 'devolver un bloque exige comentario');
  vv = bien('revisarBloque', tS, { correo: ana, ids: bl, decision: 'devolver', comentario: 'Revisa la coherencia de todo el capítulo.' });
  ok(bl.every(id => vv.revision.secciones.find(x => x.id === id).estado === 'devuelto'), 'devuelve el bloque completo');
  ok(api('revisarBloque', tE, { correo: ana, ids: bl, decision: 'aprobar' }).ok === false, 'el estudiante no aprueba bloques');
  // reglamento de similitud
  const rg = bien('reglamento', tE);
  ok(rg.norma.umbral === 20 && rg.norma.palabras === 10 && rg.items.length === 7 && typeof rg.similitud === 'number' && rg.items.some(x => x.id === 'citas' && x.estado === 'alerta'), 'reglamento: siete verificaciones y detecta la cita rota');
  ok(bien('reglamentoDe', tS, { correo: ana }).items.length === 7 && api('reglamentoDe', tS, { correo: 'luis@undc.edu.pe' }).ok === (bien('panel', tS).estudiantes.some(x => x.correo === 'luis@undc.edu.pe')), 'el asesor ve el reglamento de los suyos');
  const hz = bien('estado', tE).humanizacion;
  ok(hz.campos.find(c => c.campo === 'datos_necesarios').noAplica === 'fuera', 'un campo que no va al documento se marca «puede no aplicar»');
  const pc = vm.runInContext('palabrasCopiadas_', ctx)('uno dos tres cuatro cinco seis siete ocho nueve diez once doce y algo mas', ['uno dos tres cuatro cinco seis siete ocho nueve diez once doce']);
  const pc2 = vm.runInContext('palabrasCopiadas_', ctx)('uno dos tres cuatro cinco seis siete ocho nueve diez y algo mas', ['uno dos tres cuatro cinco seis siete ocho nueve diez']);
  ok(pc.marcadas === 12 && pc.fragmentos === 1 && pc2.marcadas === 0, 'el filtro de diez palabras del Art. 12: cuenta solo coincidencias de más de diez palabras');
}

// --- versión 1.5.1: otros proveedores de IA con clave propia y Consensus
{
  const pg = bien('probarClave', tE, { clave: 'gsk_clavePruebaGroq1234567890', proveedor: 'groq' });
  ok(pg && pg.modelo === 'llama-3.1-8b-instant' && pg.proveedor === 'groq', 'Groq: la clave se prueba con su modelo ligero');
  const mala = api('probarClave', tE, { clave: 'sk-ant-clavemala12345678901234', proveedor: 'claude' });
  ok(!mala.ok && /Claude no aceptó tu clave/.test(mala.mensaje) && mala.mensaje.indexOf('clavemala') < 0, 'una clave rechazada se informa sin mostrarla');
  ok(api('probarClave', tE, { clave: 'gsk_clavePruebaGroq1234567890', proveedor: 'inventado' }).ok === false, 'proveedor desconocido se rechaza');
  const pc = bien('ia', tE, { modo: 'preguntar', campo: 'just_social', via: 'propia', proveedor: 'claude', clave: 'sk-ant-clavePrueba12345678901234' });
  ok(pc && pc.preguntas.length >= 2 && hoja('Bitacora').some(f => f.join('|').indexOf('claude-haiku-5-5 (clave propia)') >= 0), 'Claude responde y queda en la bitácora como clave propia');
  const pk = bien('ia', tE, { modo: 'preguntar', campo: 'just_social', via: 'propia', proveedor: 'openrouter', modelo: 'meta-llama/llama-3.3-70b-instruct:free', clave: 'sk-or-clavePrueba1234567890123' });
  ok(pk && hoja('Bitacora').some(f => f.join('|').indexOf('llama-3.3-70b-instruct:free (clave propia)') >= 0), 'OpenRouter con un modelo elegido por el estudiante');
  ok(api('ia', tE, { modo: 'preguntar', campo: 'just_social', via: 'propia', proveedor: 'kimi', modelo: 'mal modelo; rm', clave: 'sk-clavePrueba12345678901234' }).ok === false, 'un nombre de modelo inválido se rechaza');
  ok(G.__mock.fetchLog.some(u => /api\.anthropic\.com/.test(u)) && G.__mock.fetchLog.some(u => /api\.groq\.com/.test(u)), 'las consultas van al proveedor elegido');
  // Consensus
  ok(api('consensus', tE, { q: 'pneumonia cnn' }).ok === false, 'sin clave de Consensus pide configurarla');
  ok(/no aceptó la clave/.test(api('consensus', tE, { q: 'pneumonia cnn', claveConsensus: 'clave-mala-de-consensus-123' }).mensaje), 'clave de Consensus rechazada');
  const cs = bien('consensus', tE, { consultas: ['pneumonia cnn children', 'pneumonia cnn limitations', 'pneumonia cnn systematic review'], desde: 2019, tipo: 'revisiones', dominio: 'cs', claveConsensus: 'cons-clave-de-prueba-123456' });
  ok(cs.resultados.length === 3 && cs.consultas.length === 3 && cs.resultados[0].ya === 'ozturk2020' && cs.resultados[1].hallazgo && cs.resultados[1].cuartil === 1, 'búsqueda profunda: tres consultas unidas sin repetir, con hallazgo y cuartil');
  ok(G.__mock.fetchLog.filter(u => /consensus\.app\/v1\/search/.test(u)).some(u => /year_min=2019/.test(u) && /study_types=systematic%20review/.test(u) && /domain=cs/.test(u)), 'los filtros viajan a Consensus');
  const agC = bien('agregarReferencias', tE, { items: cs.resultados.filter(r => !r.ya).map(r => ({ autores: r.autores, anio: r.anio, titulo: r.titulo, fuente: r.fuente, doi: r.doi, tipo: 'articulo', verificado: 'consensus', resumen: 'Hallazgo clave (Consensus): ' + r.hallazgo + '\n' + r.resumen })), uso: 'auto' });
  const claves = agC.biblioteca.filter(b => /Pediatric pneumonia|Limitations of deep/.test(b.titulo)).map(b => b.clave_cita);
  ok(agC.agregadas === 2 && claves.length === 2 && agC.biblioteca.find(b => b.clave_cita === claves[0]).verificado === 'openalex', 'los artículos de Consensus entran como «en catálogo»');
  const ea = bien('ia', tE, { modo: 'estado_arte', claves: claves, via: 'propia', proveedor: 'groq', clave: 'gsk_clavePruebaGroq1234567890' });
  ok(ea && ea.estado.brechas.length === 1 && ea.estado.preguntas_abiertas.length === 1 && ea.estado.sintesis.indexOf('inventada2030') < 0 && /\[@/.test(ea.estado.sintesis), 'estado del arte: síntesis con citas válidas, brechas y preguntas abiertas');
  ok(api('ia', tE, { modo: 'estado_arte', claves: [claves[0]], via: 'propia', proveedor: 'groq', clave: 'gsk_clavePruebaGroq1234567890' }).ok === false, 'se piden al menos dos fuentes');
  const nBr = bien('estado', tE).expediente.brechas;
  const ge = bien('guardarEstadoArte', tE, { estado: ea.estado, brechas: ea.estado.brechas, sintesis: true, consultas: cs.consultas });
  const brs = typeof ge.expediente.brechas === 'string' ? JSON.parse(ge.expediente.brechas) : ge.expediente.brechas;
  const nAntes = nBr ? (typeof nBr === 'string' ? JSON.parse(nBr) : nBr).length : 0;
  ok(brs.length === nAntes + 1 && /Faltan validaciones/.test(JSON.stringify(brs)) && JSON.parse(ge.expediente._estado_arte).preguntas.length === 1 && /hospitales/.test(ge.expediente.contexto_internacional), 'guardar: suma la brecha, la síntesis a los apuntes y deja las preguntas abiertas');
  ok(bien('probarConsensus', tE, { claveConsensus: 'cons-clave-de-prueba-123456' }).ok && api('probarConsensus', tE, { claveConsensus: 'clave-mala-de-consensus-123' }).ok === false, 'la tuerquita verifica la clave de Consensus');
  // BibTeX y RIS
  const bt = bien('analizarReferencias', tE, { texto: '@article{lopez2024,\n  author = {Lopez, Maria and Smith, John},\n  title = {Pediatric pneumonia classification},\n  journal = {Pediatric Radiology},\n  year = {2024},\n  doi = {10.9999/ped.2024.1}\n}\n' });
  ok(bt.total === 1 && bt.referencias[0].autores[1].apellido === 'Smith' && bt.referencias[0].repetida, 'lee BibTeX (exportado de Consensus, Zotero o Mendeley)');
  const ri = bien('analizarReferencias', tE, { texto: 'TY  - JOUR\nAU  - Quispe, Ana\nTI  - Un estudio en RIS sobre radiografías\nJO  - Revista Andina\nPY  - 2022\nVL  - 4\nER  - \n' });
  ok(ri.total === 1 && ri.referencias[0].titulo === 'Un estudio en RIS sobre radiografías' && ri.referencias[0].anio === '2022', 'lee RIS');
}
console.log('\nLlamadas externas simuladas: ' + G.__mock.fetchLog.length + ' | filas en Bitacora: ' + (hoja('Bitacora').length - 1));
console.log(fallos ? ('\n' + fallos + ' FALLAS de ' + pruebas) : ('\nTodas las pruebas pasaron (' + pruebas + ')'));
process.exit(fallos ? 1 : 0);

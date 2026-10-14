'use strict';
/**
 * Prueba de punta a punta de la version 2: el mismo dist/Codigo.gs sobre SQLite, disco y .docx reales.
 * Cubre instalacion, flujo del plan, aprobacion, borrador con ecuaciones y figuras, Word y PDF,
 * descarga de datos, y la migracion desde la version 1 (expediente firmado, sin firma y completa).
 *
 *   node servidor/test/runtime.js           (requiere LibreOffice para la parte de PDF; si falta, la omite)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const { execFileSync, spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'qsi-prueba-'));
const SECRETO = 'secreto-de-prueba-0123456789';
process.env.MIGRACION_SECRETO = SECRETO;
const { cargar } = require('../runtime/gas');
const { abrir } = require('../runtime/bd');
const { leerZip, crearZip } = require('../runtime/zip');
const { leerXlsx } = require('../runtime/xlsx');
const { crearAnfitrion } = require('../runtime/anfitrion');
const sim = require('./simulador');

let fallos = 0, pruebas = 0;
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
const hayLibreOffice = spawnSync('soffice', ['--version']).status === 0;

function nuevaApp(dir) {
  const bd = abrir(dir);
  return cargar({ bd, dist: path.join(RAIZ, 'dist'), propietario: 'admin@undc.edu.pe', usuarioActivo: 'admin@undc.edu.pe', anfitrion: crearAnfitrion(bd, '2.0'), simuladorFetch: sim.fetch, log: () => {} });
}
function cliente(app) {
  const api = (n, t, a) => app.api(n, t, a || {});
  const bien = (n, t, a) => { const r = api(n, t, a); if (!r.ok) { fallos++; console.log('  ERROR en ' + n + ': ' + r.mensaje); return null; } return r.data; };
  return { api, bien };
}
function docXml(buf) { return leerZip(buf).find((p) => p.nombre === 'word/document.xml').datos.toString('utf8'); }
function pdfTexto(docx) {
  const dir = fs.mkdtempSync(path.join(TMP, 'pdf-'));
  fs.writeFileSync(path.join(dir, 'd.docx'), docx);
  execFileSync('soffice', ['-env:UserInstallation=file://' + path.join(dir, 'perfil'), '--headless', '--convert-to', 'pdf', '--outdir', dir, path.join(dir, 'd.docx')], { stdio: 'ignore', timeout: 120000 });
  return { pdf: path.join(dir, 'd.pdf'), texto: execFileSync('pdftotext', ['-layout', path.join(dir, 'd.pdf'), '-']).toString('utf8') };
}
/** PNG real de 2x1 pixeles (para probar figuras) */
function png(w, h) {
  const crc = (b) => { const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(b) >>> 0); return c; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); return Buffer.concat([l, td, crc(td)]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const filas = []; for (let y = 0; y < h; y++) { filas.push(Buffer.from([0])); for (let x = 0; x < w; x++) filas.push(Buffer.from([91, 79, 232])); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(filas))), chunk('IEND', Buffer.alloc(0))]);
}

const t0 = Date.now();
// =====================================================================================
console.log('1. Instalación y usuarios');
const DIR = path.join(TMP, 'datos');
const app = nuevaApp(DIR);
app.llamar('instalar');
const { api, bien } = cliente(app);
ok(bien('info', '').instalada === true, 'instalada');
const CL = 'MiClaveSegura9';
function entrar(correo, inicial) {
  const s = bien('ingresar', '', { correo, contrasena: inicial });
  if (s && s.perfil.cambiarClave) bien('cambiarClave', s.token, { actual: inicial, nueva: CL });
  return s.token;
}
const usuarios = () => app.evaluar('JSON.stringify(leer_("Usuarios", true))');
const admin = JSON.parse(usuarios())[0];
ok(admin.correo === 'admin@undc.edu.pe' && admin.rol === 'admin', 'el administrador es el correo de ADMIN_CORREO');
const tA = entrar(admin.correo, admin.codigo);
let ad = bien('adminUsuario', tA, { correo: 'asesor@undc.edu.pe', nombre: 'Dra. Asesora Demo', rol: 'asesor' });
ad = bien('adminUsuario', tA, { correo: 'coord@undc.edu.pe', nombre: 'Dr. Coordinador Demo', rol: 'coordinador' });
const clave = app.evaluar('cfg_("CLAVE_REGISTRO", "")');
bien('registrar', '', { correo: 'ana@undc.edu.pe', nombre: 'Ana Demo Quispe', clave, contrasena: 'AnaClave2026' });
ad = bien('adminUsuario', tA, { correo: 'ana@undc.edu.pe', rol: 'estudiante', asesor: 'asesor@undc.edu.pe', activo: 'SI' });
const tS = entrar('asesor@undc.edu.pe', ad.usuarios.find((u) => u.correo === 'asesor@undc.edu.pe').codigo);
const tC = entrar('coord@undc.edu.pe', ad.usuarios.find((u) => u.correo === 'coord@undc.edu.pe').codigo);
const tE = bien('ingresar', '', { correo: 'ana@undc.edu.pe', contrasena: 'AnaClave2026' }).token;
ok(tE && tE.length > 40, 'sesión del estudiante');
ok(api('panel', 'token-inventado').error === 'SESION', 'sin sesión válida no entra');
const hash = JSON.parse(usuarios()).find((u) => u.correo === 'ana@undc.edu.pe').clave_hash;
ok(/^[0-9a-f]{64}$/.test(hash), 'contraseña guardada como huella SHA-256 (compatible con la versión 1)');

// =====================================================================================
console.log('2. Plan de tesis en Word');
const D = sim.demo();
D.estudios.forEach((e) => bien('agregarEstudio', tE, e));
for (let i = 0; i <= 6; i++) bien('guardar', tE, { valores: D.valores[i] });
bien('guardar', tE, { valores: { autor1: 'Quispe Demo, Ana', titulo: 'Modelo de red neuronal convolucional para detectar daño pulmonar en radiografías de tórax del Hospital Rezola de Cañete, 2026' } });
const plan = bien('generarPlan', tE, {});
ok(plan && /^\/doc\/[0-9a-f]{32}$/.test(plan.url) && plan.docx === plan.url + '.docx' && plan.pdf === plan.url + '.pdf', 'enlaces del servidor propio: ' + (plan && plan.url));
const idPlan = plan.url.split('/').pop();
const docPlan = fs.readFileSync(path.join(DIR, 'archivos', idPlan));
const xmlPlan = docXml(docPlan);
ok(/Modelo de red neuronal convolucional/.test(xmlPlan) && /<w:pStyle w:val="Heading1"\/>/.test(xmlPlan) && /<w:tbl>/.test(xmlPlan) && /<w:numPr>/.test(xmlPlan), 'el .docx tiene título, encabezados con estilo, tablas y listas');
ok(leerZip(docPlan).some((p) => /^word\/media\/imagen1\.(jpeg|png)$/.test(p.nombre)) && /<wp:inline/.test(xmlPlan), 'el escudo va como imagen en línea');
ok(/w:w="12240" w:h="15840"/.test(xmlPlan), 'papel carta por defecto');
const plan2 = bien('generarPlan', tE, {});
ok(plan2.url === plan.url, 'regenerar reutiliza el mismo documento');
if (hayLibreOffice) {
  const p = pdfTexto(docPlan);
  ok(/UNIVERSIDAD NACIONAL DE CA/.test(p.texto) && /PROYECTO DE TESIS/.test(p.texto) && /Modelo de red neuronal/.test(p.texto), 'LibreOffice abre el Word y lo convierte a PDF');
  fs.copyFileSync(p.pdf, path.join(TMP, 'plan.pdf'));
}

// =====================================================================================
console.log('3. Aprobación y borrador');
const ap = bien('aprobarPlan', tC, { correo: 'ana@undc.edu.pe', nota: 'Conforme.' });
const okPlan = JSON.parse(ap.expediente._plan_ok);
ok(okPlan.v === 1 && okPlan.doc && okPlan.doc !== idPlan && fs.existsSync(path.join(DIR, 'archivos', okPlan.doc)), 'copia fija del plan aprobado');
ok(bien('guardar', tE, { valores: { titulo: 'Otro' } }).bloqueados.indexOf('titulo') >= 0, 'plan congelado');
const md = ['## Primer subtítulo', 'Texto con **negrita**, *cursiva*, __subrayado__ y $E = mc^2$ [@ozturk2020].', '- viñeta uno', '- viñeta dos', '1. paso uno', '2. paso dos',
  'Tabla: Exactitud por modelo', '| Modelo | Exactitud |', '|---|---|', '| CNN | 0,95 |', 'Nota: Elaboración propia.', '$$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$', '### Detalle', '> Cita textual larga.'].join('\n');
bien('guardarSeccion', tE, { id: '5.1', texto: md });
const imagen = png(40, 20);
const fig = bien('subirFigura', tE, { nombre: 'matriz.png', tipo: 'image/png', datos: imagen.toString('base64') });
ok(fig && fs.readFileSync(path.join(DIR, 'archivos', fig.id)).equals(imagen), 'la figura se guarda tal cual en disco');
bien('guardarSeccion', tE, { id: '5.2', texto: '![Matriz de confusión](fig:' + fig.id + ')\nFuente: Elaboración propia' });
const w = bien('generarInforme', tE);
ok(w && w.ecuaciones === 1 && /^\/archivo\/[0-9a-f]{32}$/.test(w.docx) && !w.avisoEcuaciones, 'Word del borrador con la ecuación convertida: ' + JSON.stringify(w && { docx: w.docx, a: w.avisoEcuaciones }));
const docInf = fs.readFileSync(path.join(DIR, 'archivos', w.docx.split('/').pop()));
const xmlInf = docXml(docInf);
ok(/<m:oMath>/.test(xmlInf) && /<m:f>/.test(xmlInf) && /<m:rad>/.test(xmlInf) && /\(1\)<\/w:t>/.test(xmlInf), 'ecuación OMML editable en el .docx');
ok(leerZip(docInf).some((p) => /^word\/media\/imagen\d+\.png$/.test(p.nombre) && p.datos.equals(imagen)), 'la figura del estudiante va dentro del Word');
ok(/<w:numFmt w:val="decimal"\/>/.test(leerZip(docInf).find((p) => p.nombre === 'word/numbering.xml').datos.toString()), 'lista numerada');
if (hayLibreOffice) {
  const p = pdfTexto(docInf);
  ok(/TESIS PARA OPTAR/.test(p.texto) && /RESULTADOS/.test(p.texto) && /Exactitud por modelo/.test(p.texto) && /Matriz de confusi/.test(p.texto), 'el borrador con ecuación y figura se convierte a PDF');
  fs.copyFileSync(p.pdf, path.join(TMP, 'borrador.pdf'));
}
ok(bien('similitudInforme', tE) !== null, 'similitud del borrador');

// =====================================================================================
console.log('4. Datos para el administrador');
const xl = bien('descargarDatos', tA);
const libro = leerXlsx(Buffer.from(xl.base64, 'base64'));
ok(libro.Usuarios && libro.Expedientes && libro.Informe, 'Excel con todas las pestañas: ' + Object.keys(libro).join(','));
const iH = libro.Usuarios[0].indexOf('clave_hash');
ok(iH >= 0 && libro.Usuarios.slice(1).every((f) => !f[iH] || f[iH] === '(oculto)'), 'las huellas de contraseña no salen en la descarga');
ok(/permiso/.test(api('descargarDatos', tE).mensaje), 'solo el administrador descarga los datos');
ok(/^v?2/.test(bien('info', '').version), 'la versión informada es la 2');

// =====================================================================================
console.log('5. Expediente desde la versión 1 (simulada con Apps Script)');
const v1 = vm.createContext({ console });
v1.globalThis = v1;
v1.__hojaModo = { formato: true, apostrofo: true };
['test/mock.js', 'test/demo.js', 'dist/Codigo.gs'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), v1, { filename: f }));
vm.runInContext('instalar()', v1);
v1.__mock.props.MIGRACION_SECRETO = SECRETO;
const api1 = (n, t, a) => vm.runInContext('api', v1)(n, t, a === undefined ? {} : JSON.parse(JSON.stringify(a)));
const bien1 = (n, t, a) => { const r = api1(n, t, a); if (!r.ok) { fallos++; console.log('  ERROR v1 en ' + n + ': ' + r.mensaje); return null; } return JSON.parse(JSON.stringify(r.data)); };
const libro1 = Object.values(v1.__mock.libros)[0];
const adm1 = libro1.getSheetByName('Usuarios').datos[1];
function entrar1(correo, inicial) { const s = bien1('ingresar', '', { correo, contrasena: inicial }); if (s.perfil.cambiarClave) bien1('cambiarClave', s.token, { actual: inicial, nueva: CL }); return s.token; }
const tA1 = entrar1(adm1[0], adm1[3]);
bien1('adminUsuario', tA1, { correo: 'coord@undc.edu.pe', nombre: 'Dr. Coordinador Demo', rol: 'coordinador' });
let ad1 = bien1('adminUsuario', tA1, { correo: 'luis@undc.edu.pe', nombre: 'Luis Prueba Rojas', rol: 'estudiante', activo: 'SI' });
ad1 = bien1('adminUsuario', tA1, { correo: 'eva@undc.edu.pe', nombre: 'Eva Prueba Salas', rol: 'estudiante', activo: 'SI' });
const tL1 = entrar1('luis@undc.edu.pe', ad1.usuarios.find((u) => u.correo === 'luis@undc.edu.pe').codigo);
const tEv1 = entrar1('eva@undc.edu.pe', ad1.usuarios.find((u) => u.correo === 'eva@undc.edu.pe').codigo);
const tC1 = entrar1('coord@undc.edu.pe', ad1.usuarios.find((u) => u.correo === 'coord@undc.edu.pe').codigo);
[tL1, tEv1].forEach((t) => {
  D.estudios.slice(0, 3).forEach((e) => bien1('agregarEstudio', t, e));
  for (let i = 0; i <= 3; i++) bien1('guardar', t, { valores: D.valores[i] });
  bien1('guardar', t, { valores: { titulo: 'Sistema web para la gestión de inventarios de una ferretería de Cañete, 2026' } });
});
bien1('aprobarPlan', tC1, { correo: 'luis@undc.edu.pe', nota: 'Aprobado en la versión 1.' });
bien1('guardarSeccion', tL1, { id: '1.1', texto: 'Realidad problemática escrita en la versión 1 [@ozturk2020].' });
const ex1 = bien1('exportarExpediente', tL1);
ok(ex1 && ex1.firmado && /^expediente_luis_undc_edu_pe_/.test(ex1.nombre) && /drive\.google\.com/.test(ex1.url), 'la versión 1 entrega el expediente firmado (y una copia en Drive)');
const exEva = bien1('exportarExpediente', tEv1);
ok(/versión 2/.test(api1('importarExpediente', tL1, { contenido: ex1.contenido }).mensaje), 'en la versión 1 no se importa');

// En la versión 2, Luis y Eva ya existen (los crea el administrador o vienen de la migración completa)
ad = bien('adminUsuario', tA, { correo: 'luis@undc.edu.pe', nombre: 'Luis Prueba Rojas', rol: 'estudiante', activo: 'SI' });
ad = bien('adminUsuario', tA, { correo: 'eva@undc.edu.pe', nombre: 'Eva Prueba Salas', rol: 'estudiante', activo: 'SI' });
const tL = entrar('luis@undc.edu.pe', ad.usuarios.find((u) => u.correo === 'luis@undc.edu.pe').codigo);
const tEv = entrar('eva@undc.edu.pe', ad.usuarios.find((u) => u.correo === 'eva@undc.edu.pe').codigo);
ok(/otra cuenta/.test(api('importarExpediente', tE, { contenido: ex1.contenido }).mensaje), 'nadie importa el expediente de otra persona');
ok(/no es un expediente/i.test(api('importarExpediente', tL, { contenido: '{"hola":1}' }).mensaje), 'archivo que no es un expediente');
const rv = bien('importarExpediente', tL, { contenido: ex1.contenido });
ok(rv && rv.revisar && rv.resumen.firmado && rv.resumen.planAprobado && rv.resumen.estudios === 3 && rv.resumen.secciones === 1, 'primero muestra el resumen: ' + JSON.stringify(rv && rv.resumen));
const im = bien('importarExpediente', tL, { contenido: ex1.contenido, confirmar: true });
ok(im && im.importado && !im.aviso, 'importado con firma: ' + (im && im.aviso));
const expL = bien('estado', tL).expediente;
const okL = JSON.parse(expL._plan_ok || 'null');
ok(okL && okL.v === 1 && okL.por === 'Dr. Coordinador Demo' && fs.existsSync(path.join(DIR, 'archivos', okL.doc)), 'la aprobación del plan viaja con la firma y su Word se regenera aquí');
ok(!expL._plan_url || /^\/doc\//.test(expL._plan_url), 'no quedan enlaces a Google Docs: ' + expL._plan_url);
ok(/escrita en la versión 1/.test(bien('informeSeccion', tL, { id: '1.1' }).texto), 'el borrador de la versión 1 se lee en la 2');
ok(bien('guardarSeccion', tL, { id: '1.2', texto: 'Nueva sección en la versión 2.' }) !== null, 'y se sigue escribiendo');

// Sin firma (archivo alterado): solo contenido
const alterado = JSON.parse(exEva.contenido);
const datEva = JSON.parse(alterado.datos);
datEva.expediente._plan_ok = JSON.stringify({ v: 9, f: '2026-01-01', por: 'Falso', doc: '' });
alterado.datos = JSON.stringify(datEva);
const rvE = bien('importarExpediente', tEv, { contenido: JSON.stringify(alterado) });
ok(rvE && rvE.resumen.firmado === false && rvE.resumen.planAprobado === false, 'un archivo alterado pierde la firma');
bien('importarExpediente', tEv, { contenido: JSON.stringify(alterado), confirmar: true });
const expE = bien('estado', tEv).expediente;
ok(!expE._plan_ok && /ferretería/.test(expE.titulo), 'sin firma: llega el contenido, nunca la aprobación');
ok(bien('estado', tEv).biblioteca.length === 3, 'sin firma también llega la biblioteca');
// Respaldo antes de importar
ok(app.evaluar('DriveApp.getRootFolder().getFoldersByName("Luis Prueba Rojas (luis@undc.edu.pe)").hasNext()') !== undefined, 'carpeta del estudiante');
const respaldos = abrir(DIR).q("SELECT COUNT(*) c FROM archivos WHERE nombre LIKE 'Respaldo antes de importar%'").get().c;
ok(respaldos >= 2, 'cada importación deja un respaldo de lo anterior: ' + respaldos);
// Expediente de la versión 2 (respaldo propio)
const ex2 = bien('exportarExpediente', tE);
ok(ex2 && ex2.firmado && !ex2.url && JSON.parse(ex2.contenido).origen === 'v2', 'la versión 2 también descarga el expediente firmado');
const dat2 = JSON.parse(JSON.parse(ex2.contenido).datos);
ok(dat2.figuras.length === 1 && Buffer.from(dat2.figuras[0].datos, 'base64').equals(imagen), 'el expediente lleva las figuras');

// La versión 1 queda solo para consulta tras el traslado
vm.runInContext('conBloqueo_(function () { ponerConfig_("SOLO_LECTURA", "SI"); ponerConfig_("NUEVA_DIRECCION", "https://tesis.ejemplo.pe"); }); renovarCacheCompartida_();', v1);
ok(bien1('info', '').traslado === 'https://tesis.ejemplo.pe', 'la versión 1 anuncia la nueva dirección');
ok(/se trasladó a https:\/\/tesis\.ejemplo\.pe/.test(api1('guardar', tL1, { valores: { titulo: 'x' } }).mensaje), 'en solo lectura no se guarda nada');
ok(bien1('exportarExpediente', tL1).firmado && bien1('estado', tL1), 'pero se consulta y se descarga el expediente');
ok(bien('info', '').traslado === '', 'la versión 2 nunca queda en solo lectura');
vm.runInContext('conBloqueo_(function () { ponerConfig_("SOLO_LECTURA", "NO"); }); renovarCacheCompartida_();', v1);

// =====================================================================================
console.log('6. Migración completa (exportarTodo + importar-v1)');
v1.__usuarioActivo = 'otro@undc.edu.pe';
let negado = ''; try { vm.runInContext('exportarTodo()', v1); } catch (e) { negado = e.message; }
ok(/propietario/.test(negado), 'exportarTodo() solo la ejecuta el propietario');
v1.__usuarioActivo = undefined;
let registro = '';
v1.__verLog = false;
const logOrig = v1.Logger.log; v1.Logger.log = (m) => { registro += m; };
vm.runInContext('exportarTodo()', v1);
v1.Logger.log = logOrig;
ok(/Exportación lista/.test(registro) && /drive\.google\.com\/file\/d\//.test(registro) && !/\d{6}/.test(registro.replace(/https:\S+/g, '')), 'exportarTodo() deja el enlace en el registro y no muestra claves');
const zipMock = Object.values(v1.__mock.archivos).filter((a) => a.blob && a.blob.__zip && /QSI_migracion_/.test(a.blob.nombre)).pop();
ok(zipMock, 'el .zip quedó en Drive');
const zipReal = crearZip(zipMock.blob.partes.map((p) => ({ nombre: p.name, datos: p.data })));
const archZip = path.join(TMP, 'QSI_migracion.zip');
fs.writeFileSync(archZip, zipReal);
const DIR2 = path.join(TMP, 'datos-migrados');
const env = Object.assign({}, process.env, { DATOS: DIR2, DIST: path.join(RAIZ, 'dist'), ADMIN_CORREO: 'admin@undc.edu.pe' });
delete env.MIGRACION_SECRETO;
const sal = spawnSync(process.execPath, [path.join(__dirname, '..', 'herramientas.js'), 'importar-v1', archZip], { env, encoding: 'utf8' });
ok(sal.status === 0 && /Migración terminada: 2 estudiantes, 1 planes aprobados, 1 Word regenerados/.test(sal.stdout), 'importar-v1: ' + (sal.stdout + sal.stderr).replace(/\n/g, ' | '));
const app2 = nuevaApp(DIR2);
const c2 = cliente(app2);
const s2 = c2.bien('ingresar', '', { correo: 'luis@undc.edu.pe', contrasena: CL });
ok(s2 && s2.token, 'la contraseña de la versión 1 sigue sirviendo en la 2');
const e2 = s2 && c2.bien('estado', s2.token).expediente;
ok(e2 && JSON.parse(e2._plan_ok).doc && fs.existsSync(path.join(DIR2, 'archivos', JSON.parse(e2._plan_ok).doc)), 'plan aprobado con su Word regenerado');
ok(e2 && !/google/.test(JSON.stringify(e2)), 'sin enlaces de Google en el expediente migrado');
const ex1b = s2 && c2.bien('exportarExpediente', s2.token);
ok(ex1b && ex1b.firmado, 'el secreto de firma viajó con la migración');
const est = spawnSync(process.execPath, [path.join(__dirname, '..', 'herramientas.js'), 'estado'], { env, encoding: 'utf8' });
ok(/Expedientes\s+\d+ filas/.test(est.stdout), 'herramientas estado');
const cfg = spawnSync(process.execPath, [path.join(__dirname, '..', 'herramientas.js'), 'config', 'PERMITIR_REGISTRO', 'NO'], { env, encoding: 'utf8' });
ok(cfg.status === 0 && nuevaApp(DIR2).evaluar('cfg_("PERMITIR_REGISTRO", "")') === 'NO', 'herramientas config cambia la configuración');
const rc = spawnSync(process.execPath, [path.join(__dirname, '..', 'herramientas.js'), 'reiniciar-clave', 'eva@undc.edu.pe'], { env, encoding: 'utf8' });
const nueva = (/: (\S+)\s+\(/.exec(rc.stdout) || [])[1];
ok(nueva && cliente(nuevaApp(DIR2)).bien('ingresar', '', { correo: 'eva@undc.edu.pe', contrasena: nueva }).perfil.cambiarClave, 'herramientas reiniciar-clave');
const rb = spawnSync(process.execPath, [path.join(__dirname, '..', 'herramientas.js'), 'respaldo-bd', path.join(TMP, 'copia.sqlite')], { env, encoding: 'utf8' });
ok(rb.status === 0 && fs.statSync(path.join(TMP, 'copia.sqlite')).size > 10000, 'respaldo de la base en caliente');

// =====================================================================================
console.log('7. Concurrencia: el bloqueo es una transacción de SQLite');
const otra = nuevaApp(DIR);
app.bd.bloquear(1000);
let bloqueado = false;
try { otra.evaluar('LockService.getScriptLock().waitLock(1000)'); } catch (e) { bloqueado = /bloqueo/.test(e.message); }
ok(bloqueado, 'un segundo proceso espera (y desiste) mientras otro tiene el bloqueo');
app.bd.liberar();
let libre = true;
try { otra.evaluar('var l = LockService.getScriptLock(); l.waitLock(1000); l.releaseLock();'); } catch (e) { libre = false; }
ok(libre, 'al terminar la llamada el bloqueo se libera solo');

console.log('\n' + (fallos ? fallos + ' FALLAS de ' + pruebas : 'Todas las pruebas pasaron (' + pruebas + ')') + ' en ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (hayLibreOffice ? '' : ' (sin LibreOffice: se omitió el PDF)') + '\nArchivos de prueba: ' + TMP);
process.exit(fallos ? 1 : 0);

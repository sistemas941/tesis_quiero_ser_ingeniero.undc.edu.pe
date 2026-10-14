'use strict';
/**
 * Prueba en navegador de la version 2: levanta el servidor real (HTTP + hilos) sobre una base nueva,
 * ingresa como estudiante y como administrador, y revisa lo que cambia respecto de la version 1:
 * enlaces propios a Word y PDF, figuras, descarga e importacion del expediente, y el Excel de datos.
 *
 *   node servidor/test/navegador.js            (necesita Playwright con Chromium; capturas en servidor/test/salida)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
let chromium;
try { chromium = require('playwright').chromium; } catch (e) { console.log('Playwright no está instalado: se omite la prueba en navegador.'); process.exit(0); }

const RAIZ = path.join(__dirname, '..', '..');
const SALIDA = path.join(__dirname, 'salida');
fs.mkdirSync(SALIDA, { recursive: true });
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'qsi-nav-'));
const DATOS = path.join(TMP, 'datos');
const PUERTO = 3000 + Math.floor(Math.random() * 900) + 100;
const URL0 = 'http://localhost:' + PUERTO;
process.env.MIGRACION_SECRETO = 'secreto-navegador';

let fallos = 0, pruebas = 0;
const errores = [];
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }

// ---------------------------------------------------------------- datos iniciales (sin navegador)
const { cargar } = require('../runtime/gas');
const { abrir } = require('../runtime/bd');
const { crearAnfitrion } = require('../runtime/anfitrion');
const sim = require('./simulador');
const bd = abrir(DATOS);
const app = cargar({ bd, dist: path.join(RAIZ, 'dist'), propietario: 'admin@undc.edu.pe', usuarioActivo: 'admin@undc.edu.pe', anfitrion: crearAnfitrion(bd, '2.0'), simuladorFetch: sim.fetch, log: () => {} });
app.llamar('instalar');
const bien = (n, t, a) => { const r = app.api(n, t, a || {}); if (!r.ok) throw new Error(n + ': ' + r.mensaje); return r.data; };
const CL = 'MiClaveSegura9';
function entrar(correo, inicial) { const s = bien('ingresar', '', { correo, contrasena: inicial }); if (s.perfil.cambiarClave) bien('cambiarClave', s.token, { actual: inicial, nueva: CL }); return s.token; }
const admin = JSON.parse(app.evaluar('JSON.stringify(leer_("Usuarios", true)[0])'));
const tA = entrar(admin.correo, admin.codigo);
bien('adminUsuario', tA, { correo: 'coord@undc.edu.pe', nombre: 'Dr. Coordinador Demo', rol: 'coordinador' });
let ad = bien('adminUsuario', tA, { correo: 'ana@undc.edu.pe', nombre: 'Ana Demo Quispe', rol: 'estudiante', activo: 'SI' });
const tC = entrar('coord@undc.edu.pe', ad.usuarios.find((u) => u.correo === 'coord@undc.edu.pe').codigo);
const tE = entrar('ana@undc.edu.pe', ad.usuarios.find((u) => u.correo === 'ana@undc.edu.pe').codigo);
const D = sim.demo();
D.estudios.forEach((e) => bien('agregarEstudio', tE, e));
for (let i = 0; i <= 6; i++) bien('guardar', tE, { valores: D.valores[i] });
bien('guardar', tE, { valores: { autor1: 'Quispe Demo, Ana', titulo: 'Modelo de red neuronal convolucional para detectar daño pulmonar en radiografías de tórax, 2026' } });
bien('aprobarPlan', tC, { correo: 'ana@undc.edu.pe' });
bien('guardarSeccion', tE, { id: '5.1', texto: '## Resultados del modelo\nEl modelo alcanzó $E = mc^2$ [@ozturk2020].\n$$\\frac{a}{b}$$' });
bd.cerrar();

// ---------------------------------------------------------------- servidor real
const srv = spawn(process.execPath, [path.join(__dirname, '..', 'principal.js')], {
  env: Object.assign({}, process.env, { DATOS, PUERTO: String(PUERTO), TRABAJADORES: '2', QSI_SIMULADOR: path.join(__dirname, 'simulador.js'), ADMIN_CORREO: 'admin@undc.edu.pe' }),
  stdio: ['ignore', 'pipe', 'pipe']
});
let registro = '';
srv.stdout.on('data', (d) => { registro += d; });
srv.stderr.on('data', (d) => { registro += d; });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function listo() { for (let i = 0; i < 60; i++) { try { const r = await fetch(URL0 + '/salud'); if (r.ok && (await r.json()).libres > 0) return; } catch (e) { /* aun no */ } await espera(250); } throw new Error('El servidor no arrancó:\n' + registro); }
const quieto = async (p) => { await p.waitForFunction(() => !document.querySelector('.giro, .pensando, .btn.ocupado'), null, { timeout: 60000 }); await p.waitForTimeout(300); };
const texto = (p, s) => p.$eval(s, (n) => n.innerText).catch(() => '');
const foto = (p, n) => p.screenshot({ path: path.join(SALIDA, n + '.png') });

async function pagina(b, w) {
  const ctx = await b.newContext({ viewport: { width: w || 1360, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g|ERR_|katex/i.test(m.text())) errores.push('console: ' + m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX\/0\.16\.9\/(.*)$/, (r) => {
    const f = path.join(RAIZ, 'test/vendor/package/dist', r.request().url().split('/KaTeX/0.16.9/')[1]);
    if (!fs.existsSync(f)) return r.abort();
    r.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.css') ? 'text/css' : (f.endsWith('.js') ? 'application/javascript' : 'font/woff2') });
  });
  await p.goto(URL0 + '/');
  await p.waitForSelector('.ingreso', { timeout: 60000 });
  return p;
}
async function ingresar(p, correo, clave) {
  await p.fill('#i-correo', correo); await p.fill('#i-clave', clave);
  await p.click('form[data-f=ingresar] button[type=submit]');
  await p.waitForSelector('.barra', { timeout: 60000 }); await quieto(p);
}

(async () => {
  await listo();
  const t0 = Date.now();
  const b = await chromium.launch();
  try {
    // ---------------------------------------------------------- estudiante
    let p = await pagina(b);
    ok(await p.evaluate(() => window.QSI_SERVIDOR === true && typeof google.script.run.withSuccessHandler === 'function'), 'la página trae el puente de la versión 2');
    await foto(p, 'v2_01_ingreso');
    await ingresar(p, 'ana@undc.edu.pe', CL);
    ok(/Ana/.test(await texto(p, '.barra')), 'el estudiante entra');
    await foto(p, 'v2_02_inicio');

    // Plan: enlaces propios, sin Google Docs
    await p.click('.nav button[data-v=documento]');
    await quieto(p);
    await foto(p, 'v2_03_ver_tesis');
    const boton = await p.$('#boton-word');
    ok(!!boton, 'botón de Word en «Ver mi tesis»');
    if (boton) {
      await boton.click();
      await p.waitForSelector('#modal:not([hidden]) a[href^="/"]', { timeout: 120000 });
      const enlaces = await p.$$eval('#modal a', (as) => as.map((a) => a.getAttribute('href')));
      ok(enlaces.some((h) => /^\/(doc|archivo)\/[0-9a-f]{32}(\.docx)?$/.test(h)) && enlaces.every((h) => !/google\.com/.test(h)), 'el Word se descarga del propio servidor: ' + enlaces.join(' '));
      ok(!/Google Docs/.test(await texto(p, '#modal')), 'sin menciones a Google Docs en la versión 2');
      await foto(p, 'v2_04_word_listo');
      const pdf = enlaces.find((h) => /\.pdf$/.test(h) || /^\/doc\/[0-9a-f]+$/.test(h));
      if (pdf) {
        const r = await p.request.get(URL0 + pdf, { timeout: 180000 });
        ok(r.status() === 200 && /application\/pdf/.test(r.headers()['content-type'] || ''), 'el PDF se genera con LibreOffice: ' + r.status());
      }
      const docx = enlaces.find((h) => /^\/(archivo\/[0-9a-f]{32}|doc\/[0-9a-f]{32}\.docx)$/.test(h));
      const r2 = await p.request.get(URL0 + docx);
      ok(r2.status() === 200 && /attachment/.test(r2.headers()['content-disposition'] || '') && (await r2.body()).slice(0, 2).toString() === 'PK', 'el .docx se descarga como archivo de Word');
      await p.click('#modal [data-a=cerrarModal]');
    }

    // Mi configuración: expediente
    await p.click('[data-a=configurar]');
    await p.waitForSelector('#modal [data-a=exportarExpediente]');
    ok(!!(await p.$('#modal [data-a=importarExpediente]')), 'en la versión 2 se puede importar desde la versión 1');
    await p.$eval('#modal [data-a=exportarExpediente]', (n) => n.scrollIntoView());
    await foto(p, 'v2_05_mi_expediente');
    const [descarga] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#modal [data-a=exportarExpediente]')]);
    const archivoExp = path.join(TMP, descarga.suggestedFilename());
    await descarga.saveAs(archivoExp);
    const exp = JSON.parse(fs.readFileSync(archivoExp, 'utf8'));
    ok(exp.formato === 'qsi-expediente' && exp.firma && exp.correo === 'ana@undc.edu.pe', 'se descarga el expediente firmado: ' + descarga.suggestedFilename());
    await quieto(p);
    // Importar el mismo archivo (simula traerlo de la versión 1)
    const [elegir] = await Promise.all([p.waitForEvent('filechooser'), p.click('#modal [data-a=importarExpediente]')]);
    await elegir.setFiles(archivoExp);
    await p.waitForSelector('#modal [data-a=confirmarImportacion]', { timeout: 60000 });
    ok(/firma es válida/.test(await texto(p, '#modal')), 'el resumen reconoce la firma');
    await foto(p, 'v2_06_importar_resumen');
    await Promise.all([p.waitForNavigation({ timeout: 60000 }), p.click('#modal [data-a=confirmarImportacion]')]);
    await p.waitForSelector('.barra', { timeout: 60000 }); await quieto(p);
    ok(/Ana/.test(await texto(p, '.barra')), 'tras importar, la página se recarga con la sesión');

    // Borrador
    await p.click('.nav button[data-v=borrador]');
    await quieto(p);
    ok(/RESULTADOS|Resultados/.test(await texto(p, '#pagina')), 'el borrador se abre');
    await foto(p, 'v2_07_borrador');
    await p.close();

    // ---------------------------------------------------------- administrador
    p = await pagina(b);
    await ingresar(p, admin.correo, CL);
    await p.click('.nav button[data-v=admin]');
    await quieto(p);
    const bot = await p.$('[data-a=descargarDatos]');
    ok(!!bot && !(await p.$('a[href*="docs.google.com/spreadsheets"]')), 'el administrador descarga los datos en Excel (no hay hoja de Google)');
    if (bot) {
      await bot.scrollIntoViewIfNeeded();
      await foto(p, 'v2_08_admin');
      const [dx] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), bot.click()]);
      ok(/\.xlsx$/.test(dx.suggestedFilename()), 'Excel descargado: ' + dx.suggestedFilename());
    }
    // Móvil
    const m = await pagina(b, 390);
    await ingresar(m, 'ana@undc.edu.pe', CL);
    await foto(m, 'v2_09_movil');
    const ancho = await m.evaluate(() => document.documentElement.scrollWidth);
    ok(ancho <= 392, 'sin desplazamiento horizontal en el móvil: ' + ancho);
  } catch (e) {
    fallos++; console.log('  ERROR: ' + (e && e.stack || e));
  } finally {
    await b.close();
    srv.kill('SIGTERM');
  }
  ok(!errores.length, 'sin errores de JavaScript: ' + errores.slice(0, 3).join(' | '));
  ok(!/FALLO|Error interno/.test(registro), 'el registro del servidor no muestra fallos');
  console.log('\n' + (fallos ? fallos + ' FALLAS de ' + pruebas : 'Navegador: todas las pruebas pasaron (' + pruebas + ')') + ' en ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s. Capturas en ' + SALIDA);
  process.exit(fallos ? 1 : 0);
})();

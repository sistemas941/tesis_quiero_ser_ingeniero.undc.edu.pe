/* Captura y prueba del tablero, la guía y los perfiles coordinador y asistente (versión 1.4). */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const R = path.resolve(__dirname, '..'), OUT = path.join(R, 'test/salida/capturas');
fs.mkdirSync(OUT, { recursive: true });
const URL0 = 'file://' + path.join(R, 'test/salida/app.html');
let fallos = 0, pruebas = 0; const errores = [];
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
const foto = (p, n, full) => p.screenshot({ path: path.join(OUT, n + '.png'), fullPage: !!full });
const quieto = async p => { await p.waitForFunction(() => !document.querySelector('.giro, .pensando'), null, { timeout: 15000 }); await p.waitForTimeout(300); };
async function ingresar(p, c) { await p.fill('#i-correo', c.correo); await p.fill('#i-clave', c.codigo); await p.click('form[data-f=ingresar] button[type=submit]'); await p.waitForSelector('.barra', { timeout: 60000 }); await quieto(p); }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errores.push('console: ' + m.text()); });
  await p.goto(URL0 + '#padron-sencillo-sinclave');
  await p.waitForSelector('.ingreso', { timeout: 120000 });
  const cred = await p.evaluate(() => __cred);
  // Usuarios de prueba creados por el servidor simulado
  const extra = await p.evaluate(c => {
    function okr(r) { if (!r.ok) throw new Error(r.mensaje); return r.data; }
    const tA = okr(api('ingresar', '', { correo: c.admin.correo, contrasena: c.admin.codigo })).token;
    const out = {};
    [['coord@undc.edu.pe', 'Rojas Vega, Carla', 'coordinador'], ['asis@undc.edu.pe', 'Lopez Diaz, Mario', 'asistente']].forEach(function (x) {
      const us = okr(api('adminUsuario', tA, { correo: x[0], nombre: x[1], rol: x[2] })).usuarios;
      const ini = us.filter(u => u.correo === x[0])[0].codigo;
      const t = okr(api('ingresar', '', { correo: x[0], contrasena: ini })).token;
      okr(api('cambiarClave', t, { actual: ini, nueva: c.admin.codigo }));
      out[x[2]] = { correo: x[0], codigo: c.admin.codigo };
    });
    // Propuestas de la IA para un estudiante: una se dejó igual y otra se reescribió
    const est = Object.values(__mock.libros)[0].getSheetByName('Usuarios').datos.filter(f => f[2] === 'estudiante')[0][0];
    const exp = expediente_(est);
    const llenos = Object.keys(exp).filter(k => k.charAt(0) !== '_' && String(exp[k]).split(/\s+/).length > 30 && String(exp[k]).charAt(0) !== '[');
    guardarPropuestaIA_(est, llenos[0], exp[llenos[0]]);
    guardarPropuestaIA_(est, llenos[1], 'Este texto propuesto por el asistente no tiene ninguna relación con lo que el estudiante terminó escribiendo en este campo de su proyecto de tesis.');
    guardarPropuestaIA_(est, llenos[2], String(exp[llenos[2]]).split(/\s+/).slice(0, 25).join(' ') + ' y otras ideas distintas que el estudiante luego cambió por completo con su propia redacción del tema.');
    out.est = est;
    return out;
  }, cred);
  // Coordinador
  await ingresar(p, extra.coordinador);
  ok(await p.$('.kpis') !== null, 'el coordinador entra al tablero');
  const nKpi = (await p.$$('.kpi')).length; ok(nKpi === 12, 'doce indicadores: ' + nKpi);
  const filas = (await p.$$('#tabla-estudiantes tbody tr')).length; ok(filas >= 2, 'tabla de tesistas: ' + filas);
  ok((await p.$$('#tabla-asesores tbody tr')).length >= 1, 'tabla de asesores');
  await foto(p, '50_tablero', true);
  await p.click('[data-a=filtroTablero][data-f=nunca]'); await p.waitForTimeout(200);
  ok(/de/.test(await p.innerText('#cuenta-tablero')), 'filtro aplicado: ' + await p.innerText('#cuenta-tablero'));
  await p.click('[data-a=filtroTablero][data-f=todos]');
  await p.click('[data-a=ordenTablero][data-t=est][data-k=esenciales]');
  await p.fill('#buscar-tablero', extra.est); await p.waitForTimeout(200);
  await p.click('#tabla-estudiantes tbody tr.clic td'); await p.waitForSelector('.miga', { timeout: 30000 }); await quieto(p);
  ok((await p.$$('[data-a=decidir]')).length === 0, 'el coordinador no ve botones para decidir');
  await p.click('[data-a=tabAlumno][data-t=tesis]'); await p.waitForTimeout(1500); await quieto(p);
  ok((await p.$$('[data-a=aprobarSeccion], [data-a=devolverSeccion]')).length === 0, 'tesis en solo lectura para el coordinador');
  await foto(p, '51_alumno_lectura');
  ok((await p.$$('.reelab .foco')).length >= 2, 'resumen de reelaboración en Su tesis');
  await p.click('[data-a=tabAlumno][data-t=ia]'); await quieto(p);
  await foto(p, '51b_alumno_reelaboracion');
  await p.click('.barra [data-v=panel]'); await quieto(p);
  await foto(p, '51c_panel_focos');
  ok((await p.$$('#tabla-panel .foco')).length >= 1, 'foco en el panel de estudiantes');
  await p.click('[data-a=ir][data-v=guia]'); await quieto(p);
  ok((await p.$$('.g-sec')).length === 10, 'guía completa para la coordinación (con las novedades)');
  await foto(p, '52_guia', true);
  await p.click('[data-a=ir][data-v=admin]'); await quieto(p);
  await foto(p, '53_usuarios_coord');
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  // Asistente
  await ingresar(p, extra.asistente);
  ok(await p.$('.kpis') !== null, 'el asistente ve el tablero');
  await p.click('[data-a=ir][data-v=admin]'); await quieto(p);
  ok(/Usuarios/.test(await p.innerText('.cabecera h1')) && !(await p.innerText('#pagina')).includes('Modelo de revisión'), 'el asistente no ve el estado del sistema');
  await p.click('[data-a=editarUsuario][data-correo=""]');
  const opciones = await p.$$eval('#u-rol option', o => o.map(x => x.value));
  ok(opciones.join() === 'estudiante,asesor', 'el asistente solo asigna estudiante o asesor: ' + opciones.join());
  await p.fill('#u-correo', 'nuevo@undc.edu.pe'); await p.fill('#u-nombre', 'Huaman Soto, Rosa');
  await p.selectOption('#u-asesor', { index: 1 });
  await foto(p, '54_nuevo_usuario');
  await p.click('form[data-f=usuario] button[type=submit]'); await p.waitForSelector('.toast'); await quieto(p);
  ok((await p.innerText('#filas-usuarios')).includes('Huaman Soto, Rosa'), 'el asistente registra un estudiante');
  await p.fill('#filtro-usuarios', 'huaman'); await p.waitForTimeout(200);
  ok((await p.$$('#filas-usuarios tr')).length === 1, 'buscador de usuarios');
  await foto(p, '55_usuarios_asistente');
  await p.click('[data-a=ir][data-v=guia]'); await quieto(p);
  await p.click('.g-indice [data-p=ia]'); await quieto(p);
  await foto(p, '56_guia_ia');
  // Celular
  await p.setViewportSize({ width: 390, height: 844 });
  await p.click('[data-a=ir][data-v=tablero]'); await quieto(p);
  const desborde = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(desborde <= 1, 'sin desborde horizontal en celular: ' + desborde);
  await foto(p, '57_tablero_movil');
  ok(errores.length === 0, 'sin errores en la consola: ' + errores.join(' | '));
  await b.close();
  console.log(fallos ? ('\n' + fallos + ' FALLAS de ' + pruebas) : ('\nTodas las pruebas pasaron (' + pruebas + ')'));
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error(e.message.split('\n')[0]); console.error(errores.join('\n')); process.exit(2); });

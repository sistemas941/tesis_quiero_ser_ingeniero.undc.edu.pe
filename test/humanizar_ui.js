/* Prueba de la ventana Humanizar (estudiante) y del embudo lúdico del tablero (coordinador). */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const R = path.resolve(__dirname, '..'), OUT = path.join(R, 'test/salida/capturas');
fs.mkdirSync(OUT, { recursive: true });
const URL0 = 'file://' + path.join(R, 'test/salida/app.html');
let fallos = 0, pruebas = 0; const errores = [];
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
const foto = (p, n, full) => p.screenshot({ path: path.join(OUT, n + '.png'), fullPage: !!full });
const quieto = async p => { await p.waitForFunction(() => !document.querySelector('.giro, .pensando'), null, { timeout: 20000 }); await p.waitForTimeout(300); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errores.push('console: ' + m.text()); });
  await p.goto(URL0 + '#padron-sencillo-sinclave');
  await p.waitForSelector('.ingreso', { timeout: 120000 });
  const c = await p.evaluate(() => __cred);
  await p.fill('#i-correo', c.karla.correo); await p.fill('#i-clave', c.karla.codigo); await p.click('form[data-f=ingresar] button[type=submit]');
  await p.waitForSelector('form[data-f=cambiarClave]');
  await p.fill('#c-nueva', 'Karla2026Tesis'); await p.fill('#c-repite', 'Karla2026Tesis'); await p.click('form[data-f=cambiarClave] button[type=submit]');
  await p.waitForSelector('.barra'); await p.waitForSelector('.hoja'); await quieto(p);
  ok(await p.$('#tarjeta-hum') !== null, 'tarjeta «Humaniza tu tesis»');
  ok((await p.$$('[data-a=humanizar]')).length >= 3, 'botones Humanizar en los campos');
  ok((await p.$$('.hum-chip.pendiente')).length >= 3, 'campos marcados «Por humanizar»');
  await foto(p, '60_tesis_humaniza');
  // Abrir la ventana desde la tarjeta
  await p.click('#tarjeta-hum [data-a=humanizar]'); await p.waitForSelector('#hum-t');
  const info = await p.evaluate(() => ({ min: parseInt(document.querySelector('#hum-checks li small').textContent.match(/de (\d+)/)[1], 10), citas: Array.from(document.querySelectorAll('.hum-ref .chip')).map(x => x.textContent) }));
  // Pegar está bloqueado
  await p.evaluate(() => { const t = document.querySelector('#hum-t'); const ev = new ClipboardEvent('paste', { clipboardData: new DataTransfer(), bubbles: true, cancelable: true }); ev.clipboardData.setData('text/plain', 'texto pegado'); t.dispatchEvent(ev); });
  ok((await p.inputValue('#hum-t')) === '', 'no se puede pegar en la ventana');
  await foto(p, '61_humanizar_vacio');
  const frases = ['Mi idea es simple', 'quiero que la gente del distrito reciba ayuda rapida', 'cuando llega al centro de salud con una placa de pecho', 'el medico vera en pantalla donde mirar', 'y yo medire si acierta mas que antes', 'usando datos reales del hospital', 'con permiso firmado por la direccion'];
  let txt = '', i = 0;
  while (txt.split(/\s+/).length < info.min + 6) { txt += (i % frases.length === 0 && i ? '. ' : (i ? ', ' : '')) + frases[i % frases.length] + ' ' + ['hoy', 'luego', 'siempre', 'tambien', 'ademas', 'pronto'][i % 6]; i++; }
  txt += '. ' + info.citas.join(' ');
  await p.click('#hum-t');
  await p.keyboard.type(txt.slice(0, 120));
  ok(await p.evaluate(() => document.querySelector('#hum-guardar').disabled), 'con poco texto no se puede guardar');
  await foto(p, '62_humanizar_escribiendo');
  await p.keyboard.type(txt.slice(120));
  await p.waitForTimeout(200);
  ok((await p.$$('#hum-checks li.ok')).length === 4 && !(await p.evaluate(() => document.querySelector('#hum-guardar').disabled)), 'cuatro chequeos en verde');
  await foto(p, '63_humanizar_listo');
  await p.click('#hum-guardar'); await p.waitForTimeout(2500); console.log('toast:', await p.evaluate(() => Array.from(document.querySelectorAll('.toast')).map(x => x.innerText).join(' | '))); await p.waitForSelector('.hum-fiesta', { timeout: 30000 });
  ok(/\+\d+ XP/.test(await p.innerText('.hum-fiesta')), 'celebración con XP');
  await p.waitForTimeout(700);
  await foto(p, '64_humanizado_fiesta');
  await p.click('[data-a=cerrarHum]'); await quieto(p);
  ok((await p.$$('.hum-chip.listo')).length >= 1, 'el campo queda «Humanizado»');
  await foto(p, '65_tesis_despues');
  // Coordinador
  const cr = await p.evaluate(c => {
    function okr(r) { if (!r.ok) throw new Error(r.mensaje); return r.data; }
    const tA = okr(api('ingresar', '', { correo: c.admin.correo, contrasena: c.admin.codigo })).token;
    const us = okr(api('adminUsuario', tA, { correo: 'carlos@undc.edu.pe', nombre: 'Almidón, Carlos', rol: 'coordinador' })).usuarios;
    const ini = us.filter(u => u.correo === 'carlos@undc.edu.pe')[0].codigo;
    const t = okr(api('ingresar', '', { correo: 'carlos@undc.edu.pe', contrasena: ini })).token;
    okr(api('cambiarClave', t, { actual: ini, nueva: c.admin.codigo }));
    return { correo: 'carlos@undc.edu.pe', codigo: c.admin.codigo };
  }, c);
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await p.fill('#i-correo', cr.correo); await p.fill('#i-clave', cr.codigo); await p.click('form[data-f=ingresar] button[type=submit]');
  await p.waitForSelector('.kpis', { timeout: 60000 }); await quieto(p);
  ok(await p.$('.embudo-hum') !== null && (await p.$$('.embudo-paso')).length === 4, 'embudo de cuatro pasos en el tablero');
  ok((await p.$$('.podio-p')).length >= 1, 'podio con quien humanizó');
  await foto(p, '66_tablero_embudo', true);
  await p.click('.podio-p'); await p.waitForSelector('.miga'); await quieto(p);
  await p.click('[data-a=tabAlumno][data-t=tesis]'); await p.waitForTimeout(1200); await quieto(p);
  ok(await p.$('.hum-rev') !== null && (await p.$$('[data-a=comentar], [data-a=decidir], [data-a=reiniciarClave]')).length === 0, 'el coordinador ve la humanización y no puede modificar');
  await foto(p, '67_alumno_humanizacion');
  await p.click('.barra [data-v=admin]'); await quieto(p);
  ok(/Solo lectura/.test(await p.innerText('#pagina')) && (await p.$$('[data-a=editarUsuario]')).length === 0, 'Usuarios en solo lectura para el coordinador');
  await p.setViewportSize({ width: 390, height: 844 });
  await p.click('.barra [data-v=tablero]'); await quieto(p);
  ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'sin desborde en celular');
  await foto(p, '68_tablero_movil', true);
  ok(errores.length === 0, 'sin errores en la consola: ' + errores.join(' | '));
  await b.close();
  console.log(fallos ? ('\n' + fallos + ' FALLAS de ' + pruebas) : ('\nTodas las pruebas pasaron (' + pruebas + ')'));
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error(String(e.message).split('\n')[0]); console.error(errores.join('\n')); process.exit(2); });

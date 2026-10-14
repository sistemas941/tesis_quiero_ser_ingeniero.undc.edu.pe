/* Prueba de la versión 1.6: aprobación y congelado del plan, borrador de tesis con mini editor, Consensus y revisión. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const R = path.resolve(__dirname, '..'), OUT = path.join(R, 'test/salida/capturas');
fs.mkdirSync(OUT, { recursive: true });
const URL0 = 'file://' + path.join(R, 'test/salida/app.html');
let fallos = 0, pruebas = 0; const errores = [];
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
const foto = (p, n, full) => p.screenshot({ path: path.join(OUT, n + '.png'), fullPage: !!full });
const quieto = async p => { await p.waitForFunction(() => !document.querySelector('.giro, .pensando'), null, { timeout: 60000 }); await p.waitForTimeout(300); };
const texto = (p, s) => p.$eval(s, n => n.innerText);
async function pagina(b, hash, w) {
  const p = await (await b.newContext({ viewport: { width: w || 1360, height: 900 } })).newPage();
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g|ERR_|katex/i.test(m.text())) errores.push('console: ' + m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.route(/drive\.google\.com\/thumbnail/, r => r.abort());
  // KaTeX se sirve desde cdnjs en produccion; aqui, desde la copia local del paquete npm
  await p.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX\/0\.16\.9\/(.*)$/, r => {
    const f = path.join(R, 'test/vendor/package/dist', r.request().url().split('/KaTeX/0.16.9/')[1]);
    if (!fs.existsSync(f)) return r.abort();
    r.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.css') ? 'text/css' : (f.endsWith('.js') ? 'application/javascript' : 'font/woff2') });
  });
  await p.goto(URL0 + hash);
  await p.waitForSelector('.ingreso', { timeout: 180000 });
  return p;
}
async function ingresar(p, c) { await p.fill('#i-correo', c.correo); await p.fill('#i-clave', c.codigo); await p.click('form[data-f=ingresar] button[type=submit]'); await p.waitForSelector('.barra', { timeout: 60000 }); await quieto(p); }
async function irA(p, v) { await p.click('.nav button[data-v=' + v + ']'); await quieto(p); }

(async () => {
  const b = await chromium.launch();
  // ---------------- A. plan sin aprobar
  let p = await pagina(b, '#demo-aprobado-sinaprobar');
  let c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  const nav = await p.$$eval('.nav button', l => l.map(x => [x.getAttribute('data-v'), x.className]));
  ok(nav.map(x => x[0]).slice(0, 5).join() === 'tesis,matriz,ruta,documento,borrador' && /bloqueado/.test(nav[4][1]), 'menú: «Borrador» después de «Ver mi tesis», con candado mientras el plan no se aprueba');
  const anim = await p.$eval('.nav button.destacado', n => getComputedStyle(n).animationName);
  ok(/brillo-ver/.test(anim), '«Ver mi tesis» está animado: ' + anim);
  await irA(p, 'borrador');
  ok(/Se abre cuando la coordinación apruebe tu plan/.test(await texto(p, '#pagina')) && (await p.$$('.inf-caps div')).length === 8, 'borrador bloqueado, con los ocho capítulos del Anexo 6');
  await foto(p, 'a1_borrador_bloqueado');
  await p.click('button[data-a=salir]'); await p.waitForSelector('.ingreso');
  // la coordinación aprueba
  await ingresar(p, c.coord);
  await p.click('.nav button[data-v=panel]'); await quieto(p);
  await p.click('tr[data-correo="ana@undc.edu.pe"]'); await quieto(p);
  ok(/Plan en elaboración/.test(await texto(p, '.plan-estado')), 'el expediente muestra el estado del plan');
  await p.click('button[data-a=aprobarPlan]');
  await p.waitForSelector('#ap-nota');
  await foto(p, 'a2_aprobar_plan');
  await p.fill('#ap-nota', 'Conforme, adelante con el borrador.');
  await p.click('button[data-a=confirmarAprobarPlan]'); await quieto(p);
  await p.waitForSelector('.plan-estado .chip.verde');
  ok(/Aprobado · v1/.test(await texto(p, '.plan-estado')) && await p.$('.nav button[data-t=borrador]'), 'aprobado: chip verde v1 y pestaña «Borrador de tesis» en el expediente');
  await foto(p, 'a3_plan_aprobado');
  await p.close();

  // ---------------- B. plan aprobado: el estudiante
  p = await pagina(b, '#demo-aprobado');
  c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  await irA(p, 'tesis');
  ok(await p.$('#aviso-congelado') && await p.$eval('#f-titulo', n => n.readOnly), 'Mi tesis: aviso de plan congelado y campos en solo lectura');
  await foto(p, 'b1_tesis_congelada');
  await irA(p, 'borrador');
  await p.waitForSelector('#inf-texto');
  ok((await p.$$('.inf-sec')).length >= 25 && /1\.1 Descripción/.test(await texto(p, '.inf-cab')), 'abre el borrador en 1.1, con el índice completo');
  await p.click('button[data-a=infTraer]'); await p.waitForSelector('#tr-pasado');
  await p.click('button[data-a=infTraerHacer]'); await quieto(p);
  const traido = await p.$eval('#inf-texto', n => n.value);
  ok(traido.length > 100 && /\[@/.test(traido), 'trae la sección del plan con sus citas');
  ok(await p.$eval('#inf-guardar', n => !n.disabled) && /Sin guardar/.test(await texto(p, '#inf-estado')), 'con cambios: «Sin guardar» y el botón Guardar activo');
  // formato con la barra
  await p.focus('#inf-texto');
  await p.evaluate(() => { const t = document.querySelector('#inf-texto'); t.setSelectionRange(t.value.length, t.value.length); });
  await p.keyboard.press('Enter');
  await p.click('button[data-op=b]');
  await p.keyboard.type('clave');
  ok(/\*\*clave\*\*/.test(await p.$eval('#inf-texto', n => n.value)), 'negrita con la barra');
  await p.keyboard.press('End'); await p.keyboard.press('Enter');
  await p.click('button[data-op=h2]');
  ok(/\n## Subtítulo$/.test(await p.$eval('#inf-texto', n => n.value)), 'subtítulo con la barra');
  await p.keyboard.press('End'); await p.keyboard.press('Enter');
  // tabla
  await p.click('button[data-op=tabla]'); await p.waitForSelector('#tb-titulo');
  await p.fill('#tb-titulo', 'Indicadores del hospital');
  await p.fill('[data-tb="1,0"]', 'Tiempo de lectura'); await p.fill('[data-tb="1,1"]', '15 min');
  await foto(p, 'b2_tabla_dialogo');
  await p.click('button[data-a=tbInsertar]');
  let v = await p.$eval('#inf-texto', n => n.value);
  ok(/Tabla: Indicadores del hospital\n\| Columna 1 \| Columna 2 \| Columna 3 \|\n\|---\|---\|---\|\n\| Tiempo de lectura \| 15 min \|  \|/.test(v), 'tabla insertada en Markdown');
  // editar la tabla con el cursor dentro
  await p.evaluate(() => { const t = document.querySelector('#inf-texto'); const i = t.value.indexOf('Tiempo de lectura'); t.focus(); t.setSelectionRange(i, i); });
  await p.click('button[data-op=tabla]'); await p.waitForSelector('#tb-titulo');
  ok(await p.$eval('#tb-titulo', n => n.value) === 'Indicadores del hospital' && /Editar/.test(await texto(p, '#modal h2')), 'con el cursor en una tabla, el botón la edita');
  await p.fill('[data-tb="0,0"]', 'Indicador'); await p.click('button[data-a=tbInsertar]');
  v = await p.$eval('#inf-texto', n => n.value);
  ok(/\| Indicador \| Columna 2/.test(v) && (v.match(/Tabla: Indicadores/g) || []).length === 1, 'la tabla editada se reemplaza, no se duplica');
  // ecuación
  await p.evaluate(() => { const t = document.querySelector('#inf-texto'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); });
  await p.click('button[data-op=ecuacion]'); await p.waitForSelector('#eq-tex');
  await p.click('#modal details summary');
  await p.click('button[data-a=eqEjemplo][data-i="1"]');
  await p.waitForSelector('#eq-previa .katex', { timeout: 15000 }).catch(() => {});
  ok(await p.$('#eq-previa .katex'), 'vista previa de la ecuación con KaTeX');
  await foto(p, 'b3_ecuacion_dialogo');
  await p.click('button[data-a=eqInsertar]');
  ok(/\$\$\\text\{Exactitud\} = \\frac/.test(await p.$eval('#inf-texto', n => n.value)), 'ecuación insertada en LaTeX');
  // figura: dejar el espacio
  await p.click('button[data-op=figura]'); await p.waitForSelector('#fg-titulo');
  await p.fill('#fg-titulo', 'Arquitectura propuesta');
  await p.click('button[data-a=fgModo][data-m=espacio]');
  await p.click('button[data-a=fgInsertar]');
  ok(/!\[Arquitectura propuesta\]\(\)\nFuente: Elaboración propia/.test(await p.$eval('#inf-texto', n => n.value)), 'figura con espacio para pegarla en Word');
  // vista previa
  await p.click('button[data-a=infPrevia]'); await p.waitForSelector('#inf-previa');
  await p.waitForTimeout(800);
  const prev = await texto(p, '#inf-previa');
  ok(/1\.1 Descripción/.test(prev) && /1\.1\.1 Subtítulo/.test(prev) && /Tabla 1/.test(prev) && /Figura 1/.test(prev) && /\(1\)/.test(prev) && !/\*\*/.test(prev), 'vista previa: subtítulo numerado, tabla, figura y ecuación numeradas, sin marcas');
  await p.evaluate(() => { const v = document.querySelector('#inf-previa'); v.scrollTop = v.scrollHeight; document.querySelector('#inf-previa').scrollIntoView(); });
  await p.waitForTimeout(400);
  await foto(p, 'b4_editor_previa');
  // guardar con Ctrl+S
  await p.focus('#inf-texto');
  await p.keyboard.press('Control+s');
  await p.waitForFunction(() => /Guardado/.test(document.querySelector('#inf-estado').innerText), null, { timeout: 30000 });
  ok(await p.$eval('#inf-guardar', n => n.disabled) && /pal\./.test(await p.$eval('.inf-sec.activo', n => n.innerText)), 'Ctrl+S guarda y el índice muestra las palabras');
  // tutorial
  await p.click('.md-tutorial summary');
  ok((await p.$$('.md-tutorial tbody tr')).length >= 14, 'mini tutorial con la sintaxis esencial');
  await foto(p, 'b5_tutorial', true);
  // cambios sin guardar al cambiar de sección
  await p.focus('#inf-texto'); await p.keyboard.type(' extra');
  await p.click('.inf-sec[data-id="5.1"]');
  await p.waitForSelector('button[data-a=infGuardarYCambiar]');
  ok(/cambios sin guardar/i.test(await texto(p, '#modal')), 'al cambiar de sección con cambios, pregunta');
  await p.click('button[data-a=infCambiarSinGuardar]'); await quieto(p);
  await p.waitForSelector('#inf-texto');
  ok(/5\.1 Resultados descriptivos/.test(await texto(p, '.inf-cab')) && /Para el asesor/.test(await texto(p, '.inf-cab')), 'abre 5.1, marcada para el asesor');
  ok(!(await p.$('.inf-cons')), 'resultados no lleva Consensus: son datos propios');
  await p.click('.inf-sec[data-id="1.1"]'); await quieto(p);
  ok(await p.$('button[data-a=infRecuperar]'), 'al volver, ofrece recuperar el texto sin guardar');
  await p.click('button[data-a=infRecuperar]');
  ok(/ extra/.test(await p.$eval('#inf-texto', n => n.value)), 'recupera el texto que quedó en el navegador');
  await p.click('button[data-a=infGuardar]');
  await p.waitForFunction(() => /Guardado/.test(document.querySelector('#inf-estado').innerText), null, { timeout: 30000 });
  // Consensus en 2.1.1
  await p.click('.inf-sec[data-id="2.1.1"]'); await quieto(p);
  await p.evaluate(() => { localStorage.setItem('qsi_consensus:ana@undc.edu.pe', 'clave-consensus-prueba'); });
  await p.click('.inf-sec[data-id="2.2"]'); await quieto(p);
  await p.click('.inf-sec[data-id="2.1.1"]'); await quieto(p);
  if (await p.$('form[data-f=infConsensus]')) {
    await p.click('form[data-f=infConsensus] button[type=submit]'); await quieto(p);
    const nres = (await p.$$('[data-infcons]')).length;
    ok(nres > 0, 'Consensus devuelve artículos en el borrador: ' + nres);
    if (nres) {
      await p.check('[data-infcons="0"]');
      await p.focus('#inf-texto');
      await p.click('button[data-a=infConsCitar]'); await quieto(p);
      ok(/\[@[a-z0-9_]+\]/.test(await p.$eval('#inf-texto', n => n.value)), 'agrega el artículo a la biblioteca y lo cita en el texto');
      await foto(p, 'b6_consensus_borrador');
    }
  } else ok(false, 'no aparece el buscador de Consensus aun con clave');
  // Ver mi tesis en modo borrador
  await irA(p, 'documento');
  await p.waitForFunction(() => /RESULTADOS/.test((document.querySelector('#hojas') || {}).innerText || ''), null, { timeout: 30000 });
  ok(/V\. RESULTADOS/.test(await texto(p, '#hojas')) && /5\.1\.1 Exactitud del modelo/.test(await texto(p, '#hojas')) && await p.$('button[data-a=docModo][data-m=plan]'), 'Ver mi tesis: el borrador completo, con el conmutador al plan aprobado');
  await p.evaluate(() => { const h = [...document.querySelectorAll('#hojas .d-h1')].find(x => /RESULTADOS/.test(x.innerText)); h.scrollIntoView(); });
  await p.waitForTimeout(800);
  await foto(p, 'b7_ver_borrador');
  // Word del borrador
  await p.click('#boton-word'); await quieto(p);
  await p.waitForSelector('#modal:not([hidden]) h2');
  ok(/borrador de tesis está listo/i.test(await texto(p, '#modal')) && /ecuación/.test(await texto(p, '#modal')), 'Word del borrador con ecuaciones editables');
  await foto(p, 'b8_word_borrador');
  await p.click('#modal button[data-a=cerrarModal]');
  // solicitar un cambio
  await irA(p, 'borrador');
  await p.click('button[data-a=infSolicitar]'); await p.waitForSelector('#sol-motivo');
  await p.click('.sol-campos details summary');
  await p.check('[data-solk]');
  await p.fill('#sol-motivo', 'El hospital cambió y hay que ajustar la delimitación espacial.');
  await p.click('button[data-a=infEnviarSolicitud]'); await quieto(p);
  ok(/espera respuesta/.test(await texto(p, '.cabecera')), 'solicitud enviada: queda en espera');
  await p.click('button[data-a=salir]'); await p.waitForSelector('.ingreso');
  // ---------------- C. el asesor revisa
  await ingresar(p, c.asesor);
  await p.click('tr[data-correo="ana@undc.edu.pe"]'); await quieto(p);
  ok(/Pide cambiar el plan/.test(await texto(p, '.plan-estado')) && !(await p.$('button[data-a=resolverCambio]')), 'el asesor ve la solicitud, pero la decide la coordinación');
  await p.click('.nav button[data-t=borrador]'); await quieto(p);
  await p.waitForSelector('.inf-rev');
  ok(await p.$('.inf-rev.espera'), 'la sección lista resalta para el asesor');
  await p.click('.inf-rev.espera button[data-a=revInf][data-d=aprobar]'); await quieto(p);
  ok(/Aprobada/.test(await texto(p, '#inf-alumno')), 'el asesor aprueba la sección');
  await foto(p, 'c1_asesor_borrador');
  await p.click('button[data-a=salir]'); await p.waitForSelector('.ingreso');
  // ---------------- D. la coordinación autoriza y el tablero lo cuenta
  await ingresar(p, c.coord);
  ok(/Planes aprobados/.test(await texto(p, '.kpis')), 'tablero: indicador de planes aprobados');
  await p.click('tr[data-correo="ana@undc.edu.pe"]'); await quieto(p);
  await p.click('button[data-a=resolverCambio][data-d=autorizar]'); await quieto(p);
  ok(/Cambio autorizado/.test(await texto(p, '.plan-estado')) && await p.$('.plan-estado button[data-a=aprobarPlan]'), 'la coordinación autoriza y puede volver a aprobar (versión 2)');
  await foto(p, 'd1_cambio_autorizado');
  // móvil
  await p.close();
  p = await pagina(b, '#demo-aprobado', 390);
  c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  await p.evaluate(() => document.querySelector('.nav button[data-v=borrador]').click()); await quieto(p);
  await p.waitForSelector('#inf-texto');
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  ok(ancho <= 392, 'en el celular no hay desplazamiento horizontal: ' + ancho);
  await foto(p, 'e1_borrador_movil', true);
  await b.close();
  ok(!errores.length, 'sin errores en la consola: ' + errores.slice(0, 3).join(' | '));
  console.log('\n' + (fallos ? fallos + ' de ' + pruebas + ' pruebas fallaron' : 'Todas las pruebas pasaron (' + pruebas + ')'));
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.log('ERROR', e); process.exit(1); });

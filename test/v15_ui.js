/* Prueba de la versión 1.5: clase, navegación, configuración, estilos de cita, referencias desde un documento, importar el plan, bloques y reglamento. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const R = path.resolve(__dirname, '..'), OUT = path.join(R, 'test/salida/capturas');
fs.mkdirSync(OUT, { recursive: true });
const URL0 = 'file://' + path.join(R, 'test/salida/app.html');
let fallos = 0, pruebas = 0; const errores = [];
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
const foto = (p, n, full) => p.screenshot({ path: path.join(OUT, n + '.png'), fullPage: !!full });
const quieto = async p => { await p.waitForFunction(() => !document.querySelector('.giro, .pensando'), null, { timeout: 30000 }); await p.waitForTimeout(300); };
const texto = (p, s) => p.$eval(s, n => n.innerText);
async function pagina(b, hash) {
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g|ERR_/.test(m.text())) errores.push('console: ' + m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto(URL0 + hash);
  await p.waitForSelector('.ingreso', { timeout: 120000 });
  return p;
}
async function entrar(p, correo, codigo, nueva) {
  await p.fill('#i-correo', correo); await p.fill('#i-clave', codigo); await p.click('form[data-f=ingresar] button[type=submit]');
  await p.waitForSelector('form[data-f=cambiarClave]');
  await p.fill('#c-nueva', nueva); await p.fill('#c-repite', nueva); await p.click('form[data-f=cambiarClave] button[type=submit]');
  await p.waitForSelector('.barra'); await quieto(p);
}
(async () => {
  const b = await chromium.launch();
  let p = await pagina(b, '#padron-sencillo-sinclave-clase');
  const c = await p.evaluate(() => __cred);
  await entrar(p, c.karla.correo, c.karla.codigo, 'Karla2026Tesis');
  // 1. la primera pantalla es la clase
  await p.waitForSelector('.clase-yo'); await quieto(p);
    ok((await p.$$('.podio-cat')).length === 5 && /Puesto\s*\d+\s*de\s*\d+/.test(await texto(p, '.clase-yo')) && (await p.$$('.pista i')).length >= 2, 'al entrar ve su clase: avance, puesto y los tres primeros en cinco categorías');
  ok(!/@/.test(await texto(p, '#clase')), 'la clase no muestra correos');
  await foto(p, '90_clase', true);
  // 2. menú con íconos y «Ver mi tesis» resaltado
  const nav = await p.$$eval('.nav button', l => l.map(x => [x.innerText.trim(), !!x.querySelector('svg'), x.classList.contains('destacado')]));
  ok(nav.slice(0, 4).map(x => x[0]).join('|') === 'Mi tesis|Matriz|Mi ruta|Ver mi tesis' && nav.every(x => x[1]) && nav[3][2], 'menú: Mi tesis, Matriz, Mi ruta y Ver mi tesis (resaltado), todos con ícono');
  // 3. la tuerquita
  await p.click('[data-a=configurar]'); await p.waitForSelector('#modal .temas');
  ok((await p.$$('#modal .tema')).length === 6 && (await p.$$('#modal form[data-f=miClave]')).length === 1 && (await p.$$('#modal [data-a=chatPreferido]')).length === 6 && (await p.$$('#modal [data-a=estiloCitas]')).length === 4, 'configuración: color, asistente (seis IA), estilo de citas y contraseña');
  await p.click('#modal [data-t=bosque]'); await p.waitForTimeout(200);
  ok((await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--indigo').trim().toLowerCase())) === '#15803d', 'el color de la aplicación cambia');
  await p.click('#modal [data-c=claude]'); await p.waitForTimeout(200);
  await foto(p, '91_config');
  await p.fill('#mc-actual', 'Karla2026Tesis'); await p.fill('#mc-nueva', 'Karla2026Nueva'); await p.fill('#mc-repite', 'Karla2026Nueva'); await p.click('form[data-f=miClave] button[type=submit]');
  await p.waitForSelector('.toast'); await p.waitForTimeout(400);
  ok(/contraseña quedó cambiada/.test(await p.evaluate(() => Array.from(document.querySelectorAll('.toast')).map(x => x.innerText).join(' '))), 'cambia su contraseña desde la tuerquita');
  await p.click('#modal [data-t=indigo]'); await p.waitForTimeout(200);
  await p.click('#modal [data-a=cerrarModal]');
  // 4. biblioteca: estilo y referencias desde un documento
  await p.click('.nav [data-v=biblioteca]'); await p.waitForSelector('#estilo-citas');
  ok(/IEEE/.test(await texto(p, '#estilo-citas .activo')), 'IEEE viene por defecto');
  await p.click('#estilo-citas [data-e=apa]'); await p.waitForFunction(() => /APA/.test(document.querySelector('#estilo-citas .activo').innerText)); await quieto(p);
  ok(/\(\d{4}\)\./.test(await texto(p, '#lista-fuentes .ref')), 'en APA la biblioteca muestra (año).');
  await p.click('#estilo-citas [data-e=ieee]'); await p.waitForFunction(() => /IEEE/.test(document.querySelector('#estilo-citas .activo').innerText)); await quieto(p);
  await p.click('[data-a=pestanaBib][data-p=extraer]'); await p.waitForSelector('#ref-texto');
  await p.fill('#ref-texto', 'Kermany, D. S., Goldbaum, M., & Cai, W. (2018). Identifying medical diagnoses and treatable diseases by image-based deep learning. Cell, 172(5), 1122-1131.\n[2] K. He, X. Zhang, S. Ren, and J. Sun, "Deep residual learning for image recognition," in Proc. CVPR, 2016, pp. 770–778.\nOzturk, T., Talo, M., & Acharya, U. R. (2020). Automated detection of COVID-19 cases using deep neural networks with X-ray images. Computers in Biology and Medicine, 121, 103792. https://doi.org/10.1016/j.compbiomed.2020.103792');
  await p.click('[data-a=refDetectar]'); await p.waitForSelector('.ref-cand'); await quieto(p);
  ok((await p.$$('.ref-cand')).length === 3 && (await p.$$('.ref-cand .chip.verde')).length >= 1, 'detecta tres referencias y verifica la del DOI');
  await foto(p, '92_referencias');
  const nAntes = (await p.$$('#lista-fuentes .estudio')).length;
  await p.click('[data-a=refAgregar]'); await p.waitForFunction(n => document.querySelectorAll('#lista-fuentes .estudio').length > n, nAntes); await quieto(p);
  ok((await p.$$('#lista-fuentes .estudio')).length > nAntes, 'agrega las referencias nuevas a la biblioteca');
  // 5. importar el plan desde Word
  await p.click('.nav [data-v=tesis]'); await p.waitForSelector('.mi-avance'); await quieto(p);
  ok((await p.$$('.mi-avance .barra-av')).length === 1, 'Mi tesis muestra la barra de avance con el color del nivel');
  await p.click('.mi-avance [data-a=importar]'); await p.waitForSelector('#imp-archivo', { state: 'attached' });
  await foto(p, '93_importar_inicio');
  await p.setInputFiles('#imp-archivo', path.join(R, 'test/muestras/plan_prueba.docx'));
  await p.waitForSelector('#modal .imp-cifras', { timeout: 20000 });
  const cif = await p.$$eval('#modal .imp-cifras b', l => l.map(x => +x.innerText));
  ok(cif[0] >= 15 && cif[1] >= 8 && cif[2] === 3 && cif[3] === 3, 'lee secciones, tablas y referencias del Word: ' + cif.join(', '));
  ok(/REDES NEURONALES CONVOLUCIONALES PARA CLASIFICAR/.test(await texto(p, '#modal .imp-titulo')), 'reconoce el título en la carátula');
  const dest = await p.$$eval('#modal select[data-imp=sec]', l => l.map(s => s.value));
  ok(['planteamiento', 'problema_general', 'problemas_especificos', 'objetivo_general', 'just_practica', 'terminos', 'enfoque_fund', 'poblacion', '#referencias'].every(k => dest.indexOf(k) >= 0), 'propone el campo de cada sección: ' + dest.filter(x => x).join(','));
  const tabs = await p.$$eval('#modal select[data-imp=tab]', l => l.map(s => s.value));
  ok(tabs.join(',') === 'operacionalizacion,cronograma,presupuesto', 'reconoce la operacionalización, el cronograma y el presupuesto: ' + tabs.join(','));
  await foto(p, '94_importar_revision', true);
  await p.check('#modal [data-imp=reemplazar]'); await p.waitForTimeout(200);
  await p.check('#modal [data-imp=titulo]'); await p.waitForTimeout(200);
  await p.click('#modal [data-a=impImportar]');
  await p.waitForFunction(() => /importado/.test((document.querySelector('#modal h2') || {}).innerText || ''), null, { timeout: 30000 }); await quieto(p);
  const res = await p.$$eval('#modal .imp-cifras b', l => l.map(x => +x.innerText));
  ok(res[0] >= 7 && res[1] >= 3 && res[2] >= 1, 'importa secciones, tablas y referencias nuevas: ' + res.join(', '));
  await foto(p, '95_importado');
  await p.click('#modal [data-v=documento]'); await p.waitForSelector('#reglamento .reglamento', { timeout: 30000 }); await quieto(p);
  ok((await p.$$('#reglamento .reg-items li')).length === 7 && /RCO N\.° 503-2025-UNDC\/CO/.test(await texto(p, '#reglamento')) && /no apliquen/.test(await texto(p, '#reglamento')), 'Ver mi tesis muestra el reglamento con sus siete verificaciones y lo que puede no aplicar');
  const hj = await texto(p, '#hojas');
  ok(/lectura de radiografías pediátricas/.test(hj) && /CLASIFICAR NEUMONÍA/i.test(await texto(p, '.d-car[data-k=titulo]')) && /enfoque cuantitativo/i.test(hj) && /Revisión de literatura/.test(hj) && /Asesor estadístico/.test(hj) && /Personal/.test(hj) && /Servicios/.test(hj) && /Número de capas/.test(hj), 'los textos y las tablas importadas quedan en su lugar del documento');
  ok((await p.$$('.hoja .d-ley-t')).length >= 3 && (await p.$$('.hoja .d-tnota')).length >= 3 && (await p.$$('.hoja .d-ref.num')).length >= 3, 'la página muestra tablas APA y referencias IEEE numeradas');
  await foto(p, '96_reglamento');
  await p.evaluate(() => { const r = document.querySelector('.hoja .d-ref'); if (r) r.scrollIntoView(); });
  await p.waitForTimeout(300);
  await foto(p, '97_referencias_ieee');
  await p.context().close();
  // 6. el asesor revisa por bloques
  p = await pagina(b, '#padron-sencillo-sinclave-clase');
  await entrar(p, c.asesorKarla.correo, c.asesorKarla.codigo, 'Asesor2026Ok');
  ok((await p.$$('.tabla .av-mini')).length >= 1, 'el panel del asesor muestra la barra de avance de cada tesista');
  await p.click('.tabla tr.clic'); await p.waitForSelector('.cabecera h1'); await quieto(p);
  await p.click('[data-a=tabAlumno][data-t=tesis]'); await p.waitForSelector('.bloques-rev', { timeout: 30000 }); await quieto(p);
  const nb = (await p.$$('.bloque')).length;
  ok(nb >= 6 && (await p.$$('.bloque [data-a=aprobarBloque]')).length >= 5 && /Fuera del análisis de similitud/.test(await texto(p, '.bloques-rev')), 'revisión por bloques: un botón por capítulo y los excluidos marcados: ' + nb);
  await foto(p, '98_bloques');
  await p.click('.bloque [data-a=aprobarBloque]'); await p.waitForSelector('.bloque.hecho', { timeout: 20000 }); await quieto(p);
  ok((await p.$$('.bloque.hecho')).length >= 1, 'aprueba un capítulo entero con un clic');
  await p.click('.bloque:not(.hecho) [data-a=devolverBloque]'); await p.waitForSelector('#dev-bloque');
  await p.fill('#dev-bloque', 'Revisa la coherencia entre objetivos y metodología en todo el capítulo.');
  await p.click('[data-a=confirmarDevolverBloque]'); await p.waitForSelector('.toast'); await quieto(p);
  ok((await p.$$('.hoja .d-rev.devuelto')).length >= 2, 'devuelve un capítulo con un solo comentario');
  ok((await p.$$('#reglamento .reg-items li')).length === 7, 'el asesor también ve el reglamento');
  await foto(p, '99_bloques_hechos');
  await p.context().close();
  // 7. otros proveedores de IA y Consensus
  p = await pagina(b, '#padron-sencillo-sinclave');
  await entrar(p, c.karla.correo, c.karla.codigo, 'Karla2026Tesis');
  await p.click('.boton-clave'); await p.waitForSelector('#modal [data-a=elegirProv]');
  ok((await p.$$('#modal [data-a=elegirProv]')).length === 7, 'siete proveedores con clave propia: Gemini, Groq, Claude, Kimi, DeepSeek, OpenAI y OpenRouter');
  await p.click('#modal [data-a=elegirProv][data-p=groq]'); await p.waitForSelector('#modal form[data-f=claveIA][data-p=groq]');
  ok(/console\.groq\.com\/keys/.test(await p.$eval('#modal .prov-guia', n => n.innerHTML)) && (await p.$$('#modal #modelo-ia')).length === 1, 'la mini guía de Groq trae su enlace y un campo de modelo opcional');
  await foto(p, '100_proveedores');
  await p.fill('#clave-ia', 'gsk_clavePruebaGroq1234567890'); await p.click('#modal form[data-f=claveIA] button[type=submit]');
  await p.waitForFunction(() => /Mi IA: Groq/.test(document.querySelector('.boton-clave').innerText), null, { timeout: 20000 });
  ok(true, 'la barra muestra «Mi IA: Groq»');
  await p.click('[data-a=configurar]'); await p.waitForSelector('#conf-cons');
  await p.fill('#conf-cons', 'clave-mala-de-consensus-123'); await p.click('form[data-f=probarConsensus] button[type=submit]');
  await p.waitForFunction(() => /no aceptó/.test(document.querySelector('#conf-cons-res').innerText), null, { timeout: 15000 });
  ok(true, 'la tuerquita avisa si la clave de Consensus es inválida');
  await p.click('#modal [data-a=cerrarModal]');
  await p.click('.nav [data-v=biblioteca]'); await p.waitForSelector('#estilo-citas');
  await p.click('[data-a=pestanaBib][data-p=consensus]'); await p.waitForSelector('#cons-clave');
  ok(/consensus\.app\/api-mcp/.test(await p.$eval('#agregar', n => n.innerHTML)), 'Consensus pide la clave con su guía y enlace');
  await p.fill('#cons-clave', 'cons-clave-de-prueba-123456'); await p.click('form[data-f=claveConsensus] button[type=submit]');
  await p.waitForSelector('#cons-q'); await p.check('#cons-profunda');
  await p.click('form[data-f=consensus] button[type=submit]'); await p.waitForSelector('.ref-cand.cons', { timeout: 20000 }); await quieto(p);
  ok((await p.$$('.ref-cand.cons')).length === 3 && (await p.$$('.cons-hallazgo')).length === 3, 'resultados de Consensus con su hallazgo clave');
  await foto(p, '101_consensus');
  await p.click('[data-a=consEstado]');
  await p.waitForFunction(() => /estado del arte/.test((document.querySelector('#modal h2') || {}).innerText || ''), null, { timeout: 30000 }); await quieto(p);
  ok((await p.$$('#modal [data-ea]')).length === 1 && /Preguntas abiertas/.test(await texto(p, '#modal')), 'arma el estado del arte: síntesis, tendencias, brechas y preguntas abiertas');
  await foto(p, '102_estado_arte');
  await p.click('#modal [data-a=guardarEstadoArte]'); await p.waitForSelector('.toast'); await quieto(p);
  ok(/Estado del arte guardado/.test(await p.evaluate(() => Array.from(document.querySelectorAll('.toast')).map(x => x.innerText).join(' '))), 'guarda el estado del arte en la tesis');
  await p.context().close();
  await b.close();
  if (errores.length) { console.log(errores.slice(0, 8).join('\n')); fallos += errores.length; }
  console.log(fallos ? fallos + ' FALLAS de ' + pruebas : 'Todas las pruebas pasaron (' + pruebas + ')');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.log(e); process.exit(1); });

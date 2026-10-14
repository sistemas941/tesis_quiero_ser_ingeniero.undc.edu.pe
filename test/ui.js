/* Prueba de la interfaz en Chromium con el servidor simulado dentro de la pagina. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const R = path.resolve(__dirname, '..'), OUT = path.join(R, 'test/salida/capturas');
fs.mkdirSync(OUT, { recursive: true });
const URL0 = 'file://' + path.join(R, 'test/salida/app.html');
let fallos = 0, pruebas = 0;
const errores = [];
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
async function nueva(b, hash, w, h) {
  const ctx = await b.newContext({ viewport: { width: w || 1320, height: h || 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errores.push('console: ' + m.text()); });
  await p.goto(URL0 + (hash ? '#' + hash : ''));
  await p.waitForSelector('.ingreso, .barra');
  return p;
}
const foto = (p, n, full) => p.screenshot({ path: path.join(OUT, n + '.png'), fullPage: !!full });
const quieto = async p => { await p.waitForFunction(() => !document.querySelector('.giro, .pensando'), null, { timeout: 8000 }); await p.waitForTimeout(250); };
async function ingresar(p, c) { await p.fill('#i-correo', c.correo); await p.fill('#i-clave', c.codigo); await p.click('form[data-f=ingresar] button[type=submit]'); await p.waitForSelector('.barra'); await quieto(p); }
const hoja = (p, n) => p.evaluate(n => Object.values(__mock.libros)[0].getSheetByName(n).datos, n);
const texto = (p, s) => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText : ''; }, s);

(async () => {
  const b = await chromium.launch();
  // ---------------------------------------------------------------- 1. registro y primera etapa
  let p = await nueva(b, 'vacio');
  await foto(p, '01_ingreso');
  ok(/Quiero ser Ingeniero/.test(await texto(p, '.lado h1')), 'nombre de la app en el ingreso');
  await p.click('[data-p=registrar]');
  const cred = await p.evaluate(() => __cred);
  await p.fill('#r-nombre', 'Karla Demo Quispe'); await p.fill('#r-correo', 'karla@undc.edu.pe'); await p.fill('#r-clave', 'mala'); await p.fill('#r-propia', 'Karla2026demo');
  await p.click('form[data-f=registrar] button[type=submit]');
  await p.waitForSelector('.toast.error');
  ok(/clave del curso/.test(await texto(p, '.toast.error')), 'registro con clave mala avisa');
  await p.fill('#r-clave', cred.clave);
  await p.click('form[data-f=registrar] button[type=submit]');
  await p.waitForSelector('.barra'); await quieto(p);
  const codigo = 'Karla2026demo';
  ok((await hoja(p, 'Usuarios')).every(f => f.join('|').indexOf(codigo) < 0), 'la clave elegida al registrarse no se guarda en claro');
  ok((await p.$$('.etapa-fila')).length === 7 && (await p.$$('.etapa-fila.cerrada')).length === 6, 'ruta inicial: 7 etapas, 6 bloqueadas');
  await foto(p, '03_ruta_inicial');
  await p.click('.etapa-fila [data-a=abrirEtapa]');
  await p.waitForSelector('#c-tema');
  ok((await p.$$('.campo')).length === 17 && (await p.$$('#tarjeta-brujula a[href*="script.google.com/macros"]')).length === 1, 'etapa 0 con 17 campos y la tarjeta de la Brújula: ' + (await p.$$('.campo')).length);
  // cerrar vacia -> rojo
  await p.click('[data-a=cerrarEtapa]'); await quieto(p);
  ok(/Aún no/.test(await texto(p, '#compuerta h2')) && (await p.$$('#compuerta .obs-item')).length >= 8, 'compuerta en rojo con observaciones');
  ok((await p.$$('#o-tema .obs.bloqueante')).length === 1, 'observacion bajo el campo');
  await p.click('#compuerta [data-a=irCampo]');
  // llenar
  await p.click('input[name=f-tipo_proyecto][value=artefacto]');
  await p.click('input[name=f-con_hipotesis][value=SI]');
  await p.fill('#f-tema', 'Quiero comprobar si un sistema web de trazabilidad mejora el control de inventarios de una ferretería.');
  await p.selectOption('#f-linea', { index: 1 }).catch(async () => { await p.click('input[name=f-linea]'); });
  await p.fill('#f-contexto', 'Ferretería del distrito de San Vicente de Cañete.');
  await p.fill('#f-var1', 'sistema web de trazabilidad'); await p.fill('#f-var2', 'control de inventarios');
  await p.fill('#f-autor1', 'Demo Quispe, Karla'); await p.fill('#f-asesor_nombre', 'Dra. Asesora Demo');
  // asistente: explicar, preguntar, proponer
  await p.click('#c-tema [data-modo=ayuda]'); await quieto(p);
  ok(/EJEMPLO DE OTRO TEMA/.test(await texto(p, '#asistente-cuerpo')), 'ayuda del asistente');
  await p.click('#c-tema [data-modo=preguntar]'); await quieto(p);
  ok((await p.$$('#asistente-cuerpo ol li')).length === 3, 'preguntas guia');
  ok((await p.$$('#c-tema [data-modo=proponer]')).length === 0 && (await p.$$('#c-tema_oracion [data-modo=proponer]')).length === 1, 'proponer solo donde se permite');
  await p.click('#c-tema_oracion [data-modo=proponer]'); await quieto(p);
  ok(/por completar: cita/.test(await texto(p, '#asistente-cuerpo .propuesta')), 'cita inventada retirada de la propuesta');
  await foto(p, '04_etapa0_propuesta');
  await p.click('[data-a=usarPropuesta]');
  await p.waitForTimeout(1900); await quieto(p);
  let exp = await hoja(p, 'Expedientes');
  ok(exp.some(f => f[1] === 'tema_oracion' && /por completar/.test(f[2])), 'propuesta guardada en la hoja');
  ok(exp.some(f => f[1] === 'tipo_proyecto' && f[2] === 'artefacto') && exp.some(f => f[1] === 'var2' && f[2] === 'control de inventarios'), 'campos guardados solos');
  let bit = await hoja(p, 'Bitacora');
  ok(bit.some(f => f[4] === 'proponer' && f[9] === 'aceptado'), 'bitacora: propuesta aceptada');
  await p.fill('#f-tema_oracion', 'Sistema web de trazabilidad para el control de inventarios en una ferretería de San Vicente de Cañete.');
  await p.waitForTimeout(1900); await quieto(p);
  bit = await hoja(p, 'Bitacora');
  ok(bit.some(f => f[4] === 'proponer' && f[9] === 'editado'), 'bitacora: propuesta editada');
  ok((await texto(p, '#guardado')) === 'Guardado', 'indicador de guardado: ' + await texto(p, '#guardado'));
  // citar con biblioteca vacia
  await p.click('#c-tema [data-a=citar]');
  ok(/vacía/.test(await texto(p, '#modal h2')), 'citar con biblioteca vacia');
  await p.click('#modal [data-a=cerrarModal]');
  // rubrica en el asistente
  await p.click('#c-var1 [data-a=verItem]');
  ok(/NIVEL 4/.test(await texto(p, '#asistente-cuerpo')), 'item de la rubrica en el asistente');
  await p.click('[data-a=cerrarEtapa]'); await quieto(p);
  ok(/aprobada/i.test(await texto(p, '#compuerta h2')), 'etapa 0 aprobada: ' + await texto(p, '#compuerta h2'));
  ok(/Aprobada/.test(await texto(p, '#chip-etapa')), 'chip de etapa aprobada');
  await foto(p, '05_etapa0_aprobada', true);
  // reapertura
  await p.fill('#f-contexto', 'Ferretería El Constructor, distrito de San Vicente de Cañete.');
  await p.waitForTimeout(1900); await quieto(p);
  ok(/En curso/.test(await texto(p, '#chip-etapa')), 'reapertura al editar una etapa cerrada');
  await p.click('[data-a=cerrarEtapa]'); await quieto(p);
  await p.click('#compuerta [data-a=abrirEtapa]');
  await p.waitForSelector('#c-datos_necesarios');
  ok(/Viabilidad/.test(await texto(p, 'h1')), 'siguiente etapa abierta');
  // tabla de la etapa 2 no accesible todavia
  await p.click('.nav [data-v=ruta]'); await p.waitForSelector('.etapas-lista');
  ok((await p.$$('.etapa-fila.cerrada')).length === 5, 'cinco etapas bloqueadas');
  // salir y volver a entrar con el codigo
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await ingresar(p, { correo: 'karla@undc.edu.pe', codigo });
  ok(/Hola, Karla/.test(await texto(p, 'h1')), 'reingreso con la clave propia');
  await p.context().close();

  // ---------------------------------------------------------------- 2. estudiante con avance (hasta la etapa 3; la 2 espera al asesor)
  p = await nueva(b, 'demo-hasta2-pendiente');
  let c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  await foto(p, '06_ruta_avance');
  ok((await texto(p, '.etapas-lista')).indexOf('En revisión del asesor') > 0, 'etapa 2 en revision');
  await p.click('.etapa-fila [data-e="2"]'); await p.waitForSelector('#arbol svg');
  ok((await p.$$('#arbol svg rect')).length >= 7, 'arbol de problemas dibujado');
  ok((await p.$$('#t-causas tbody tr')).length === 3, 'tabla de causas con 3 filas');
  await p.click('#c-causas [data-a=agregarFila]');
  ok((await p.$$('#t-causas tbody tr')).length === 4, 'fila agregada');
  await p.click('#t-causas tbody tr:last-child [data-a=quitarFila]');
  ok((await p.$$('#t-causas tbody tr')).length === 3, 'fila quitada');
  // citar
  await p.click('#f-contexto_local'); await p.keyboard.press('End');
  await p.click('#c-contexto_local [data-a=citar]');
  await p.fill('#filtro-cita', 'solomon');
  ok((await p.$$('#lista-citas [data-t]:not([hidden])')).length === 1, 'filtro de citas');
  await p.click('#lista-citas [data-t]:not([hidden])');
  ok(/\[@solomon2021\]$/.test(await p.inputValue('#f-contexto_local')), 'cita insertada: ' + (await p.inputValue('#f-contexto_local')).slice(-30));
  await p.waitForTimeout(1900); await quieto(p);
  ok(/En curso/.test(await texto(p, '#chip-etapa')), 'etapa 2 reabierta al editar');
  // jurado
  await p.click('#asistente [data-modo=jurado]'); await quieto(p);
  await p.fill('#j-0', 'El dato sale del registro del hospital.');
  await p.click('[data-a=evaluarJurado]'); await quieto(p);
  ok((await p.$$('#asistente-cuerpo .chip')).length === 3 && /Consejo/.test(await texto(p, '#asistente-cuerpo')), 'jurado evaluado');
  await foto(p, '07_etapa2_arbol_jurado', true);
  await p.click('[data-a=limpiarIA]');
  // bloqueo por IA y excepcion
  await p.evaluate(() => { window.__revision = { observaciones: [{ campo: 'problema_central', nivel: 'bloqueante', texto: 'El problema central describe la falta de una solución.', item: 3 }], resumen: 'Hay un punto bloqueante.' }; });
  await p.click('[data-a=cerrarEtapa]'); await quieto(p);
  ok((await p.$$('[data-a=excepcion]')).length === 1, 'boton de excepcion ante bloqueo de la IA');
  await foto(p, '08_etapa2_rojo');
  await p.click('[data-a=excepcion]'); await p.fill('#motivo', 'El problema sí es un estado negativo: habla de demora e inexactitud.');
  await p.click('[data-a=enviarExcepcion]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok(/Tu asesor decidirá/.test(await texto(p, '#compuerta h2')), 'excepcion enviada: ' + await texto(p, '#compuerta h2'));
  await p.evaluate(() => { window.__revision = null; });
  await p.context().close();

  // ---------------------------------------------------------------- 3. estudiante con todo: biblioteca, matriz, rubrica, plan
  p = await nueva(b, 'demo-hasta6-pendiente');
  c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  await foto(p, '09_ruta_completa');
  await p.click('.etapa-fila [data-e="4"]'); await p.waitForSelector('#c-operacionalizacion');
  await foto(p, '10_etapa4', true);
  await p.click('.nav [data-v=biblioteca]'); await p.waitForSelector('#lista-fuentes .estudio');
  ok((await p.$$('#lista-fuentes .estudio')).length === 16, 'biblioteca con 16 fuentes');
  ok((await p.$$('#conteo-bib .chip.verde')).length === 2, 'minimos de antecedentes cumplidos');
  await p.fill('#b-q', 'covid chest x-ray deep learning'); await p.click('form[data-f=buscar] button[type=submit]'); await quieto(p);
  ok((await p.$$('#resultados .resultado')).length === 2 && /Ya está en tu biblioteca/.test(await texto(p, '#resultados')), 'busqueda con duplicado marcado');
  await p.click('#resultados [data-a=agregarResultado]'); await quieto(p);
  ok((await p.$$('#lista-fuentes .estudio')).length === 17 && (await p.$$('#lista-fuentes form.ficha')).length === 1 && (await p.$$('form.ficha textarea[data-k=sin_resolver]')).length === 1, 'resultado agregado y ficha abierta, con el campo «qué deja sin resolver»');
  await foto(p, '11_biblioteca', false);
  await p.click('form.ficha [data-a=pedirBorrar]'); await p.click('#modal [data-a=borrarEstudio]'); await quieto(p);
  ok((await p.$$('#lista-fuentes .estudio')).length === 16, 'fuente quitada');
  await p.click('[data-a=pestanaBib][data-p=doi]'); await p.fill('#d-doi', '10.9999/no-existe'); await p.click('form[data-f=porDoi] button[type=submit]');
  await p.waitForSelector('.toast.error');
  ok(/Crossref no reconoce/.test(await texto(p, '.toast.error')), 'DOI inexistente rechazado');
  await p.click('[data-a=pestanaBib][data-p=mano]');
  await p.selectOption('#m-tipo', 'libro');
  ok(await p.isHidden('#m-grado') && await p.isVisible('#m-editorial'), 'formulario manual cambia segun el tipo');
  await p.fill('#m-autores', 'Sommerville, I.'); await p.fill('#m-anio', '2016'); await p.fill('#m-titulo', 'Software engineering'); await p.fill('#m-editorial', 'Pearson'); await p.selectOption('#m-uso', 'teoria');
  await p.click('form[data-f=aMano] button[type=submit]'); await quieto(p);
  ok((await p.$$('#lista-fuentes .estudio')).length === 17 && /Sin verificar/.test(await texto(p, '#lista-fuentes')), 'libro manual sin enlace queda sin verificar');
  // ficha de un antecedente: llenar con IA
  await p.click('#lista-fuentes .estudio [data-a=alternarFicha]');
  await p.waitForSelector('form.ficha');
  await p.click('form.ficha [data-a=resumirEstudio]').catch(() => {});
  await quieto(p);
  await foto(p, '12_ficha', false);
  await p.click('.nav [data-v=matriz]'); await p.waitForSelector('.matriz');
  ok((await p.$$('.matriz tbody tr')).length === 3 && (await p.$$('.matriz td.vacio')).length === 0, 'matriz completa');
  await foto(p, '13_matriz', true);
  await p.click('.nav [data-v=rubrica]'); await p.waitForSelector('.rub-item');
  ok((await p.$$('.rub-item')).length === 36, 'rubrica con 36 items');
  const botones = await p.$$('[data-a=evaluarGrupo]');
  ok(botones.length === 7, 'siete grupos de la rubrica');
  for (let i = 0; i < 7; i++) { await (await p.$$('[data-a=evaluarGrupo]'))[i].click(); await quieto(p); }
  ok(/Conforme/.test(await texto(p, '#pagina .tarjeta')), 'rubrica evaluada: ' + (await texto(p, '#pagina .tarjeta')).replace(/\n/g, ' ').slice(0, 90));
  await p.click('.rub-item details summary');
  await foto(p, '14_rubrica', false);
  await p.click('.nav [data-v=plan]'); await p.waitForSelector('[data-a=generarPlan]');
  await p.click('[data-a=generarPlan]'); await quieto(p);
  ok(/marcas por completar/.test(await texto(p, '#pagina')) && (await p.$$('a[href*="export?format=docx"]')).length === 1, 'plan generado con enlaces');
  const doc = await p.evaluate(() => { const id = Object.keys(__mock.docs)[0]; return { html: __docHtml(id), img: __mock.docs[id].cuerpo.hijos.filter(h => h.tipo === 'IMAGE').length }; });
  ok(doc.img === 2 && /Figura 1[\s\S]{0,400}Árbol de problemas de la investigación/.test(doc.html), 'el documento lleva el escudo incluido y el árbol como imagen: ' + doc.img);
  fs.writeFileSync(path.join(R, 'test/salida/plan_ui.html'), doc.html);
  await foto(p, '15_plan', true);
  await p.context().close();

  // ---------------------------------------------------------------- 4. asesor y administrador
  p = await nueva(b, 'demo-hasta6-pendiente');
  c = await p.evaluate(() => __cred);
  await ingresar(p, c.asesor);
  ok((await p.$$('#tabla-panel tbody tr')).length === 2 && /esperan tu revisión/.test(await texto(p, '#tabla-panel')), 'panel del asesor con dos estudiantes');
  ok((await p.$$('.nav button')).length === 2 && !/Administraci/.test(await texto(p, '.barra nav')), 'el asesor ve Estudiantes y Guía, no Administración');
  await foto(p, '16_panel_asesor');
  await p.click('#tabla-panel tbody tr'); await p.waitForSelector('#comentario-asesor');
  ok(/Plan/.test(await texto(p, '#pagina .nav button.activo')), 'abre la etapa que espera revision: ' + await texto(p, '#pagina .nav button.activo'));
  await foto(p, '17_asesor_etapa', true);
  await p.click('[data-a=decidir][data-d=devolver]');
  await p.waitForSelector('.toast.error');
  ok(/qué debe corregir/.test(await texto(p, '.toast.error')), 'devolver exige comentario');
  await p.fill('#comentario-asesor', 'Conforme con el cronograma y el presupuesto.');
  await p.click('[data-a=decidir][data-d=aprobar]'); await quieto(p);
  ok((await p.$$('.nav .chip.verde')).length === 7, 'siete etapas aprobadas tras la decision');
  for (const t of ['matriz', 'rubrica', 'biblioteca', 'ia']) { await p.click('[data-a=tabAlumno][data-t=' + t + ']'); await p.waitForTimeout(350); }
  ok(/Tokens consumidos/.test(await texto(p, '#pagina')), 'pestana de uso de IA');
  await foto(p, '18_asesor_ia');
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await ingresar(p, c.admin);
  await p.click('.nav [data-v=admin]'); await p.waitForSelector('.codigo-grande');
  ok((await p.$$('#pagina table tbody tr')).length === 6, 'administracion con 6 usuarios (incluye a Almidón y Brando)');
  await p.click('[data-a=editarUsuario][data-correo=""]');
  await p.fill('#u-correo', 'nuevo@undc.edu.pe'); await p.fill('#u-nombre', 'Nuevo Demo'); await p.selectOption('#u-asesor', 'asesor@undc.edu.pe');
  await p.click('form[data-f=usuario] button[type=submit]'); await quieto(p);
  ok((await p.$$('#pagina table tbody tr')).length === 7, 'usuario creado por el administrador');
  await foto(p, '19_admin');
  await p.context().close();

  // ---------------------------------------------------------------- 6. los tres modos del asistente
  p = await nueva(b, 'demo-hasta6-pendiente');
  c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  ok(/Asistente del curso/.test(await texto(p, '#pagina aside')), 'la ruta muestra el modo en uso');
  await p.click('.etapa-fila [data-e="2"]'); await p.waitForSelector('#c-planteamiento');
  ok(/Asistente del curso/.test(await texto(p, '#via-ia')) && /Hoy: \d+ de 40/.test(await texto(p, '#uso-ia')), 'pie del asistente: modo del curso y cuota: ' + await texto(p, '#uso-ia'));
  await p.click('#via-ia button'); await p.waitForSelector('.vias');
  ok((await p.$$('.via')).length === 4 && /En uso/.test(await texto(p, '.via.activa')) && /Asistente del curso/.test(await texto(p, '.via.activa')), 'cuatro modos (clave propia, Gemini Nano, copiar y pegar, curso); con clave del curso, ese está en uso');
  await foto(p, '24_modos');
  // clave propia: una mala y una buena
  await p.fill('#clave-ia', 'AIza-MALA-0000000000000000000000'); await p.click('form[data-f=claveIA] button[type=submit]');
  await p.waitForSelector('#clave-error:not([hidden])');
  ok((await texto(p, '#clave-error')).length > 10 && await p.isVisible('.vias'), 'clave propia inválida: se avisa y no se guarda: ' + await texto(p, '#clave-error'));
  const MIA = 'AIzaSyD-clave-de-ana-0123456789abcd';
  await p.fill('#clave-ia', MIA); await p.click('form[data-f=claveIA] button[type=submit]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok(/Mi clave de Gemini/.test(await texto(p, '#via-ia')) && (await texto(p, '#uso-ia')) === 'Modo', 'modo: clave propia, sin contador de cuota');
  ok((await p.evaluate(() => localStorage.getItem('qsi_clave:ana@undc.edu.pe'))) === MIA && (await p.evaluate(() => localStorage.getItem('qsi_via:ana@undc.edu.pe'))) === 'propia', 'la clave queda en el navegador, por usuario');
  let usoAntes = (await hoja(p, 'Bitacora')).length;
  await p.click('#c-planteamiento [data-modo=ayuda]'); await quieto(p);
  ok(/EJEMPLO DE OTRO TEMA/.test(await texto(p, '#asistente-cuerpo')) && (await p.evaluate(() => __mock.ultimaClave)) === MIA, 'la consulta viaja con la clave del estudiante');
  bit = await hoja(p, 'Bitacora');
  ok(bit.length === usoAntes + 1 && /\(clave propia\)$/.test(bit[bit.length - 1][6]), 'bitácora: clave propia: ' + bit[bit.length - 1][6]);
  const todo = JSON.stringify(await p.evaluate(() => { const l = Object.values(__mock.libros)[0]; return [['Config', 'Usuarios', 'Expedientes', 'Avance', 'Bitacora', 'Comentarios'].map(n => l.getSheetByName(n).datos), __mock.props, __mock.cache]; }));
  ok(todo.indexOf(MIA) < 0, 'la clave del estudiante no queda en la hoja, ni en las propiedades, ni en la memoria del servidor');
  await p.click('[data-a=limpiarIA]');
  // copiar y pegar
  await p.click('#via-ia button'); await p.waitForSelector('.vias');
  ok(/····abcd/.test(await texto(p, '.vias')) && (await p.$$('#clave-ia')).length === 0, 'la clave guardada se muestra enmascarada');
  await p.click('[data-a=elegirVia][data-v=copiar]'); await quieto(p);
  ok(/Copiar y pegar/.test(await texto(p, '#via-ia')) && /copiar y pegar/.test(await texto(p, '#asistente-cuerpo')), 'modo: copiar y pegar');
  await p.click('#c-planteamiento [data-modo=proponer]'); await p.waitForSelector('#copia-consulta');
  const consulta = await p.inputValue('#copia-consulta');
  ok(consulta.indexOf('=== CONSULTA GENERADA POR') === 0 && consulta.indexOf('CAMPO SOBRE EL QUE SE TRABAJA: «Planteamiento') > 0 && consulta.indexOf('[@solomon2021]') > 0 && consulta.indexOf('Problema central') > 0 && consulta.indexOf('0000-0002-1825-0097') < 0, 'la consulta para copiar se arma con el avance del estudiante');
  ok(/Proponer: Planteamiento/.test(await texto(p, '#modal h2')) && (await p.$$('#modal a[data-chat]')).length === 6, 'ventana de copiar y pegar con sus tres pasos y seis asistentes');
  await foto(p, '25_copiar');
  await p.click('[data-a=copiarConsulta]'); await p.waitForTimeout(300);
  ok(/Copiada|seleccionado/.test(await texto(p, '#copia-ok')), 'el botón de copiar responde: ' + await texto(p, '#copia-ok'));
  await p.keyboard.press('Escape'); await p.mouse.click(8, 400);
  ok(await p.isVisible('#copia-respuesta'), 'la ventana no se cierra por accidente');
  await p.click('[data-a=enviarPegado]');
  ok(/Pega la respuesta/.test(await texto(p, '#copia-error')), 'respuesta vacía');
  await p.fill('#copia-respuesta', consulta); await p.click('[data-a=enviarPegado]');
  await p.waitForFunction(() => /Pegaste la consulta/.test(document.querySelector('#copia-error').textContent));
  ok(await p.isVisible('#copia-respuesta'), 'pegar la consulta en vez de la respuesta se avisa sin perder la ventana');
  usoAntes = (await hoja(p, 'Bitacora')).length;
  await p.fill('#copia-respuesta', 'Claro, aquí tienes:\n\x60\x60\x60json\n' + JSON.stringify({ texto: 'El problema persiste [@solomon2021] y se agrava [@inventada2099].', faltantes: ['Dato local del hospital'] }) + '\n\x60\x60\x60');
  await p.click('[data-a=enviarPegado]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok(/por completar: cita/.test(await texto(p, '#asistente-cuerpo .propuesta')) && /solomon2021/.test(await texto(p, '#asistente-cuerpo .propuesta')) && /Se retiraron 1 cita/.test(await texto(p, '#asistente-cuerpo')), 'respuesta pegada: se valida igual que la del curso');
  bit = await hoja(p, 'Bitacora');
  ok(bit.length === usoAntes + 1 && bit[bit.length - 1][6] === 'copiar y pegar' && bit[bit.length - 1][4] === 'proponer', 'bitácora: copiar y pegar');
  await foto(p, '26_copiar_resultado');
  await p.click('[data-a=descartarPropuesta]');
  await p.click('#c-planteamiento [data-modo=preguntar]'); await p.waitForSelector('#copia-consulta');
  await p.click('[data-a=cancelarCopia]');
  ok(await p.isHidden('#modal') && !/aviso rojo/.test(await p.innerHTML('#asistente-cuerpo')), 'cancelar la copia no deja errores');
  // cierre de etapa por copia: dos pasos y marca de no verificada
  await p.click('[data-a=cerrarEtapa]'); await p.waitForSelector('#copia-consulta');
  ok(/Revisión de la etapa 2/.test(await texto(p, '#modal h2')) && (await p.inputValue('#copia-consulta')).indexOf('TAREA: revisa la etapa') > 0 && (await p.$$('[data-a=cerrarSinRevision]')).length === 1, 'cierre por copia: consulta de revisión');
  await foto(p, '27_cierre_copia');
  await p.fill('#copia-respuesta', JSON.stringify({ observaciones: [{ campo: 'contexto_local', nivel: 'mejorable', texto: 'Falta el dato local del hospital.', item: 4 }], resumen: 'La etapa es coherente; falta un dato local.' }));
  await p.click('[data-a=enviarPegado]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok(/Enviada a tu asesor/.test(await texto(p, '#compuerta h2')) && /no verificada/.test(await texto(p, '#compuerta')) && (await p.$$('#o-contexto_local .obs')).length === 1, 'cierre por copia registrado como no verificado: ' + (await texto(p, '#compuerta')).replace(/\n/g, ' ').slice(0, 140));
  await foto(p, '28_compuerta_copia');
  await p.click('.nav [data-v=ruta]'); await p.waitForSelector('.etapas-lista');
  await p.click('.etapa-fila [data-e="3"]'); await p.waitForSelector('#c-declaracion_brecha');
  await p.click('[data-a=cerrarEtapa]'); await p.waitForSelector('#copia-consulta');
  await p.click('[data-a=cerrarSinRevision]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok(/aprobada/i.test(await texto(p, '#compuerta h2')) && /solo reglas automáticas/.test(await texto(p, '#compuerta')), 'cierre sin revisión del asistente: solo reglas: ' + await texto(p, '#compuerta h2'));
  // rubrica por copia
  await p.click('.nav [data-v=rubrica]'); await p.waitForSelector('.rub-item');
  await p.click('[data-a=evaluarGrupo]'); await p.waitForSelector('#copia-consulta');
  ok(/Nivel 4:/.test(await p.inputValue('#copia-consulta')), 'rúbrica por copia: la consulta lleva los niveles');
  await p.fill('#copia-respuesta', JSON.stringify([{ item: 1, nivel: 3, observacion: 'Falta precisar el ámbito.' }, { item: 2, nivel: 4, observacion: 'Bien.' }]));
  await p.click('[data-a=enviarPegado]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok((await p.$$('.rub-item .chip[title*="asistente externo"]')).length === 2 && /Nivel 3 de 4/.test(await texto(p, '.rub-item')), 'rúbrica pegada: ítems marcados como no verificados');
  ok(/2 ítems tienen una estimación pegada/.test(await texto(p, '#pagina .tarjeta')), 'la rúbrica avisa de que su porcentaje no está verificado');
  // ficha por copia
  await p.click('.nav [data-v=biblioteca]'); await p.waitForSelector('#lista-fuentes .estudio');
  await p.fill('#b-q', 'covid chest x-ray deep learning'); await p.click('form[data-f=buscar] button[type=submit]'); await quieto(p);
  await p.click('#resultados [data-a=agregarResultado]'); await quieto(p);
  await p.click('form.ficha [data-a=resumirEstudio]'); await p.waitForSelector('#copia-consulta');
  ok(/RESUMEN: /.test(await p.inputValue('#copia-consulta')) && /Llenar la ficha/.test(await texto(p, '#modal h2')), 'ficha por copia: la consulta lleva el resumen');
  await p.fill('#copia-respuesta', JSON.stringify({ objetivo: 'Detectar COVID-19 en radiografías.', metodologia: '', resultados: 'Exactitud de 98 %.', conclusion: '', sin_resolver: 'No aborda las secuelas.' }));
  await p.click('[data-a=enviarPegado]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok((await p.inputValue('form.ficha textarea[data-k=sin_resolver]')) === 'No aborda las secuelas.' && (await p.inputValue('form.ficha textarea[data-k=objetivo]')) === 'Detectar COVID-19 en radiografías.', 'ficha pegada: llena también lo que deja sin resolver');
  await p.fill('form.ficha textarea[data-k=relacion]', 'Estudia la misma técnica.'); await p.click('form.ficha button[type=submit]'); await quieto(p);
  ok((await hoja(p, 'Biblioteca')).some(f => f[25] === 'No aborda las secuelas.'), 'la ficha guarda «qué deja sin resolver» en la hoja');

  // ---------------------------------------------------------------- 7. orientación: taller, cadena y Brújula
  await p.click('.nav [data-v=orientacion]'); await p.waitForSelector('#or-empezar');
  ok((await p.$$('.or-sec')).length === 10 && (await p.$$('.or-indice button')).length === 10, 'orientación con sus diez secciones');
  ok((await p.$$('#or-empezar a[href*="script.google.com/macros/s/AKfycbw3J2naXDer7RbekQ8Ao1RqtURx2rSLsIWvJouFaHTO9SJtmGIJ99Zgu8FQl7AFQ_-1/exec"]')).length === 1 && (await p.$$('#or-empezar a[href*="claude.ai/artifact/AUKo1MCghnTdo4sbLYMjX2"]')).length === 1, 'enlaces a la Brújula de Tesis y a la guía del taller');
  ok(/9 de 9 eslabones/.test(await texto(p, '#or-cadena')) && (await p.$$('#or-cadena tbody tr')).length === 9 && /lenta y poco exacta/.test(await texto(p, '#or-cadena')), 'la cadena se arma con lo que el estudiante escribió');
  await p.selectOption('#fr-proceso', 'CRISP-DM');
  ok(/usé CRISP-DM/.test(await texto(p, '.or-frase')) && /método convencional de descriptores manuales/.test(await texto(p, '.or-frase')) && /el experimento estadístico de diferencia/.test(await texto(p, '.or-frase')), 'la frase de metodología usa la línea base y el método del estudiante: ' + (await texto(p, '.or-frase')).slice(0, 80));
  ok((await p.$$('#or-p4 .or-rejilla > div')).length === 4 && (await p.$$('.or-dsrm > div')).length === 6 && (await p.$$('#or-fuentes li')).length === 9, 'cuatro métodos de validación, seis pasos y nueve fuentes');
  await foto(p, '29_orientacion', true);
  await p.click('#or-p3 [data-a=abrirEtapa]'); await p.waitForSelector('#c-afirmacion');
  ok(/Propuesta/.test(await texto(p, 'h1')), 'de la orientación a la etapa');
  await p.click('.cabecera [data-v=orientacion]'); await p.waitForSelector('#or-p3');
  ok(await p.evaluate(() => { const r = document.querySelector('#or-p3').getBoundingClientRect(); return r.top >= 0 && r.top < 200; }), 'de la etapa a su sección de la orientación');
  // el asesor ve la revisión pegada y los modos usados
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await ingresar(p, c.asesor);
  ok(/2 sin verificar/.test(await texto(p, '#tabla-panel')), 'el panel del asesor marca la rúbrica no verificada');
  await p.click('#tabla-panel tbody tr'); await p.waitForSelector('#comentario-asesor');
  await p.click('[data-a=tabAlumno][data-t="2"]'); await p.waitForTimeout(350);
  ok(/pegada por el estudiante \(no verificada\)/.test(await texto(p, '#pagina')), 'el asesor ve que la revisión fue pegada');
  await p.click('[data-a=tabAlumno][data-t=ia]'); await p.waitForTimeout(350);
  ok(/Por modo del asistente/.test(await texto(p, '#pagina')) && /Clave propia de Gemini\s*1/.test(await texto(p, '#pagina')) && /Copiar y pegar\s*[3-9]/.test(await texto(p, '#pagina')), 'el asesor ve el uso por modo');
  await foto(p, '30_asesor_modos');
  await p.click('[data-a=tabAlumno][data-t=rubrica]'); await p.waitForTimeout(350);
  ok((await p.$$('.rub-item .chip[title*="asistente externo"]')).length === 2, 'el asesor ve los ítems de rúbrica no verificados');
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await ingresar(p, c.admin);
  await p.click('.nav [data-v=admin]'); await p.waitForSelector('.codigo-grande');
  ok(/Modos habilitados/.test(await texto(p, '#pagina')) && /Bastan las reglas/.test(await texto(p, '#pagina')), 'administración: modos habilitados');
  // el modo elegido se recuerda por usuario, y la clave se puede olvidar
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await ingresar(p, c.ana);
  ok(/Copiar y pegar/.test(await texto(p, '#pagina aside')), 'el modo elegido se recuerda al volver a entrar');
  await p.click('[data-a=modoIA]'); await p.waitForSelector('.vias');
  await p.click('[data-a=olvidarClave]'); await p.waitForSelector('#clave-ia');
  ok((await p.evaluate(() => localStorage.getItem('qsi_clave:ana@undc.edu.pe'))) === null, 'olvidar mi clave la borra del navegador');
  await p.context().close();

  // ---------------------------------------------------------------- 8. curso sin clave: el estudiante igual tiene asistente
  p = await nueva(b, 'vacio-sinclave');
  c = await p.evaluate(() => __cred);
  await p.click('[data-p=registrar]');
  await p.fill('#r-nombre', 'Karla Demo Quispe'); await p.fill('#r-correo', 'karla@undc.edu.pe'); await p.fill('#r-clave', c.clave); await p.fill('#r-propia', 'Karla2026demo');
  await p.click('form[data-f=registrar] button[type=submit]'); await p.waitForSelector('.barra'); await quieto(p);
  ok(/aún no tiene clave/.test(await texto(p, '#pagina')) && /Brújula de Tesis/.test(await texto(p, '#pagina')) && (await p.$$('#pagina a[href*="script.google.com/macros"]')).length === 1, 'sin clave del curso: se ofrecen los otros modos y la Brújula');
  await foto(p, '31_ruta_sin_clave');
  await p.click('.etapa-fila [data-a=abrirEtapa]'); await p.waitForSelector('#c-tema');
  ok(/Copiar y pegar/.test(await texto(p, '#via-ia')) && (await p.$$('#c-tema [data-modo=ayuda]:not([disabled])')).length === 1, 'sin clave del curso se empieza en copiar y pegar, con las ayudas activas');
  await p.click('#via-ia button'); await p.waitForSelector('.vias');
  ok(/Sin configurar/.test(await texto(p, '.vias')) && (await p.$$('[data-a=elegirVia][data-v=curso]')).length === 0, 'el modo del curso aparece como no configurado');
  await p.click('#modal [data-a=cerrarModal]');
  await p.click('#c-tema [data-modo=preguntar]'); await p.waitForSelector('#copia-consulta');
  ok((await p.inputValue('#copia-consulta')).indexOf('Etapas aprobadas: ninguna todavía') > 0, 'la consulta refleja que el estudiante recién empieza');
  await p.fill('#copia-respuesta', '1. ¿Qué problema viste en tu entorno?\n2. ¿A quién afecta ese problema?\n3. ¿Qué se hace hoy para atenderlo?');
  await p.click('[data-a=enviarPegado]'); await p.waitForSelector('#modal[hidden]', { state: 'attached' }); await quieto(p);
  ok((await p.$$('#asistente-cuerpo ol li')).length === 3, 'respuesta en lista simple aceptada');
  await p.context().close();

  // ---------------------------------------------------------------- 9. modo sencillo: desde el título, con la página en vivo
  p = await nueva(b, 'vacio-sencillo');
  c = await p.evaluate(() => __cred);
  await p.click('[data-p=registrar]');
  await p.fill('#r-nombre', 'Rosa Demo Ccori'); await p.fill('#r-correo', 'rosa@undc.edu.pe'); await p.fill('#r-clave', c.clave); await p.fill('#r-propia', 'Rosa2026demo');
  await p.click('form[data-f=registrar] button[type=submit]'); await p.waitForSelector('.barra'); await quieto(p);
  await p.waitForSelector('.hoja'); await quieto(p);
  ok(/Empecemos por el título/.test(await texto(p, 'h1')) && (await p.$$('.nav button')).length === 9 && /Ruta completa/.test(await texto(p, '.barra .der')), 'el estudiante nuevo llega a «Mi tesis», con tres secciones y la ruta completa a un clic');
  ok((await p.$$('#esc-form .sc')).length === 15 && (await p.evaluate(() => document.querySelector('#esc-form .sc').id)) === 'c-titulo', 'pocas preguntas, y la primera es el título: ' + (await p.$$('#esc-form .sc')).length);
  ok((await p.evaluate(() => document.activeElement && document.activeElement.id)) === 'f-titulo', 'el cursor espera en el título');
  await p.waitForSelector('.d-logo img');
  ok((await p.evaluate(() => document.querySelector('.d-logo img').src.indexOf('data:image/jpeg') === 0 && document.querySelector('.d-logo img').naturalWidth)) > 100 && /UNIVERSIDAD NACIONAL DE CAÑETE/.test(await texto(p, '.hoja')), 'la carátula aparece con el escudo antes de escribir nada');
  ok((await p.$$('.hoja')).length >= 8 && (await p.$$('.hoja .d-vacio.d-aqui')).length >= 8 && /Título/i.test(await texto(p, '.d-car.d-vacio[data-k=titulo]')), 'la plantilla completa está a la vista, con lo pendiente marcado');
  await foto(p, '33_tesis_vacia');
  const TIT = 'Sistema web de trazabilidad para el control de inventarios en una ferretería de San Vicente de Cañete';
  await p.fill('#f-titulo', TIT);
  ok((await texto(p, '.d-car[data-k=titulo]')).trim() === TIT && (await texto(p, '#guardado')) === 'Sin guardar' && !(await p.evaluate(() => document.querySelector('.d-car[data-k=titulo]').classList.contains('d-vacio'))), 'el título aparece en la carátula al instante, antes de guardarse');
  ok(/Llevas 1 de 15/.test(await texto(p, '#doc-progreso')), 'el avance cuenta la primera respuesta: ' + await texto(p, '#doc-progreso'));
  await foto(p, '34_titulo_en_vivo');
  await p.fill('#f-autor1', 'Demo Ccori, Rosa');
  await p.waitForTimeout(1900); await quieto(p);
  exp = await hoja(p, 'Expedientes');
  ok(exp.some(f => f[1] === 'titulo' && f[2] === TIT) && (await texto(p, '#guardado')) === 'Guardado' && /Al día/.test(await texto(p, '#doc-estado')) && (await texto(p, '.d-car[data-k=titulo]')).trim() === TIT && /Rosa Demo Ccori/.test(await texto(p, '.d-car[data-k=autor1]')), 'se guarda solo y la página del servidor coincide con lo escrito');
  ok((await p.evaluate(() => window.__llamadas)) > 0 && (await p.$$('.d-logo img')).length === 1, 'la página se actualiza sin perder el escudo');
  // tipo de proyecto: cambian las preguntas y las secciones
  await p.click('input[name=f-tipo_proyecto][value=artefacto]');
  ok((await p.$$('#esc-form .sc')).length === 17 && (await p.$$('#c-artefacto_descripcion')).length === 1, 'al decir que construye algo aparecen las dos preguntas del artefacto');
  await p.waitForTimeout(1900); await quieto(p);
  ok(/Descripción del artefacto/.test(await texto(p, '#hojas')), 'y la página gana las secciones del artefacto');
  // las piezas del título
  await p.click('[data-a=desglosar]'); await quieto(p);
  ok(await p.evaluate(() => document.querySelector('#asistente').classList.contains('abierto') && document.querySelector('#asistente').classList.contains('flotante')) && /sistema web de trazabilidad/.test(await texto(p, '#asistente-cuerpo')), 'el asistente saca las piezas del título');
  await foto(p, '35_piezas');
  await p.click('[data-a=usarPiezas]'); await p.waitForTimeout(300);
  ok((await p.inputValue('#f-var1')) === 'sistema web de trazabilidad' && (await p.inputValue('#f-var2')) === 'control de inventarios', 'las piezas quedan en sus campos');
  await p.waitForTimeout(1900); await quieto(p);
  ok(/2\.1\.1 Variable 1: Sistema web de trazabilidad/.test(await texto(p, '#hojas')), 'los títulos de la página usan las piezas del estudiante');
  // escribir un párrafo y verlo en el capítulo I
  await p.click('#f-planteamiento');
  ok(await p.evaluate(() => { const n = document.querySelector('.hoja [data-k=planteamiento]'), h = document.querySelector('#hojas'); const r = n.getBoundingClientRect(), R = h.getBoundingClientRect(); return n.classList.contains('d-foco') && r.top > R.top && r.bottom < R.bottom; }), 'al entrar a una pregunta, la página se mueve a esa parte');
  await p.fill('#f-planteamiento', 'En las ferreterías pequeñas el inventario se lleva en cuadernos [@noexiste2020].\nEso produce quiebres de existencias y compras duplicadas.');
  ok((await p.$$('.hoja p.d-p[data-k=planteamiento]')).length === 2 && /cita no encontrada: noexiste2020/.test(await texto(p, '.hoja [data-k=planteamiento]')), 'el párrafo aparece en el capítulo I mientras se escribe, y avisa de la cita sin fuente');
  await foto(p, '36_capitulo_en_vivo');
  await p.waitForTimeout(1900); await quieto(p);
  ok((await p.$$('.hoja p.d-p[data-k=planteamiento]')).length === 2, 'tras guardar, el capítulo conserva los dos párrafos');
  // ayuda del asistente dentro del modo sencillo
  await p.click('#c-objetivo_general [data-modo=proponer]'); await quieto(p);
  await p.click('[data-a=usarPropuesta]'); await p.waitForTimeout(300);
  ok((await p.inputValue('#f-objetivo_general')).length > 20 && (await p.$$('.hoja p.d-p[data-k=objetivo_general]')).length >= 1, 'una propuesta aceptada llega al campo y a la página');
  // de la página al campo, y de la página a la ruta completa
  await p.evaluate(() => { const n = document.querySelector('.hoja [data-k=problema_general]'); n.scrollIntoView(); n.click(); });
  await p.waitForTimeout(300);
  ok((await p.evaluate(() => document.activeElement && document.activeElement.id)) === 'f-problema_general', 'un clic en una parte pendiente de la página lleva a su pregunta');
  await p.waitForTimeout(1900); await quieto(p);
  await p.evaluate(() => { document.querySelector('.hoja [data-k=problemas_especificos]').click(); });
  await p.waitForSelector('#c-problemas_especificos');
  ok(/Propuesta/.test(await texto(p, 'h1')) && (await p.$$('.nav button')).length === 11 && /Modo sencillo/.test(await texto(p, '.barra .der')) && await p.evaluate(() => document.querySelector('#c-problemas_especificos').classList.contains('marcado')), 'lo que no está en el modo sencillo se abre en la ruta completa, en su campo');
  ok((await p.inputValue('#f-titulo')) === TIT, 'en la ruta completa está lo que ya escribió');
  await p.click('.nav [data-v=ruta]'); await p.waitForSelector('.etapas-lista');
  ok((await p.$$('.etapa-fila.cerrada')).length === 0 && (await p.$$('.etapa-fila [data-a=abrirEtapa]')).length === 7, 'por defecto ninguna etapa está con candado');
  await p.click('[data-a=modoSencillo]'); await p.waitForSelector('#esc-form'); await quieto(p);
  ok(/Mi tesis/.test(await texto(p, 'h1')) && (await p.$$('.nav button')).length === 9, 'vuelve al modo sencillo con un clic');
  // Word en un clic
  await p.click('[data-a=descargarWord]'); await p.waitForSelector('#modal a[href*="export?format=docx"]');
  const docS = await p.evaluate(() => { const id = Object.keys(__mock.docs)[0]; return { n: Object.keys(__mock.docs).length, img: __mock.docs[id].cuerpo.hijos.filter(h => h.tipo === 'IMAGE').length, html: __docHtml(id) }; });
  ok(docS.n === 1 && docS.img === 1 && docS.html.indexOf(TIT) > 0 && /Rosa Demo Ccori/.test(docS.html) && (await p.$$('#modal a[href*="export?format=pdf"]')).length === 1, 'descargar en Word crea el documento con la carátula, el escudo y lo escrito');
  await foto(p, '37_word_listo');
  fs.writeFileSync(path.join(R, 'test/salida/plan_sencillo.html'), docS.html);
  await p.click('#modal [data-a=cerrarModal]');
  // el modo elegido se recuerda; el asesor ve lo esencial
  await p.click('[data-a=modoCompleto]'); await p.waitForSelector('.etapas-lista');
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await ingresar(p, { correo: 'rosa@undc.edu.pe', codigo: 'Rosa2026demo' });
  ok(/Hola, Rosa/.test(await texto(p, 'h1')) && (await p.$$('.etapas-lista')).length === 1, 'quien eligió la ruta completa vuelve a ella al entrar');
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await ingresar(p, c.admin); await p.click('.barra [data-v=panel]'); await quieto(p);
  ok(/Lo esencial/i.test(await texto(p, '#tabla-panel thead')) && /\b7 \/ 17\b/.test(await texto(p, '#tabla-panel tbody')), 'el panel muestra cuánto de lo esencial lleva el estudiante: ' + (await texto(p, '#tabla-panel tbody')).replace(/\s+/g, ' ').slice(100, 260));
  await p.click('.nav [data-v=admin]'); await p.waitForSelector('.codigo-grande');
  ok(/El modo sencillo/.test(await texto(p, '#pagina')) && /Abiertas/.test(await texto(p, '#pagina')), 'administración: modo inicial y etapas abiertas');
  await p.context().close();

  // estudiante con avance, en el modo sencillo: todo lo escrito está en la página
  p = await nueva(b, 'demo-hasta6-sencillo');
  c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  await p.waitForSelector('.hoja');
  ok(/Tienes lo esencial/.test(await texto(p, '#doc-progreso')) && (await p.$$('.hoja .d-tabla')).length >= 7 && (await p.$$('.hoja .d-arbol svg')).length === 1 && (await p.$$('.hoja .d-ref')).length >= 10, 'la página de un proyecto avanzado trae tablas, árbol y referencias');
  ok(await p.evaluate(() => Array.prototype.every.call(document.querySelectorAll('.hoja'), h => h.scrollHeight <= h.offsetHeight + 1)), 'ninguna hoja se desborda sobre la siguiente');
  await p.fill('#f-just_practica', 'El prototipo ayuda al personal de salud [@solomon2021].');
  ok(/\[(\d+|•)\]/.test(await texto(p, '.hoja [data-k=just_practica]')), 'las citas de la biblioteca se ven resueltas (IEEE) mientras se escribe');
  await p.evaluate(() => { const h = document.querySelector('#hojas'); h.scrollTop = h.scrollHeight * 0.3; });
  await foto(p, '38_tesis_avanzada');
  await p.context().close();

  // teléfono: se escribe y se mira por turnos
  p = await nueva(b, 'demo-hasta6-sencillo', 390, 800);
  c = await p.evaluate(() => __cred);
  await ingresar(p, c.ana);
  await p.waitForSelector('#esc-form');
  ok(await p.isHidden('#esc-doc') && (await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'en el teléfono se empieza escribiendo, sin desborde');
  await p.click('#boton-doc'); await p.waitForTimeout(300);
  ok(await p.isVisible('#hojas') && await p.isHidden('#esc-form') && /Seguir escribiendo/.test(await texto(p, '#boton-doc')) && (await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'y con un botón se mira el documento');
  await foto(p, '39_movil_documento');
  await p.context().close();

  // ---------------------------------------------------------------- 5. telefono
  p = await nueva(b, 'demo-hasta3', 390, 800);
  c = await p.evaluate(() => __cred);
  await foto(p, '20_movil_ingreso');
  await ingresar(p, c.ana);
  await foto(p, '21_movil_ruta', true);
  await p.click('.etapa-fila [data-e="4"]'); await p.waitForSelector('#c-titulo');
  const desborde = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(desborde <= 1, 'sin desborde horizontal en telefono: ' + desborde);
  await p.click('#c-titulo [data-modo=ayuda]'); await quieto(p);
  ok(await p.evaluate(() => document.querySelector('#asistente').classList.contains('abierto')), 'asistente como panel inferior en telefono');
  await foto(p, '22_movil_asistente');
  await p.click('[data-a=limpiarIA]');
  await foto(p, '23_movil_etapa');
  await p.click('.boton-ia-movil'); await p.waitForTimeout(350);
  await p.click('#via-ia button'); await p.waitForSelector('.vias');
  await p.click('[data-a=elegirVia][data-v=copiar]'); await quieto(p);
  await p.click('#c-titulo [data-modo=ayuda]'); await p.waitForSelector('#copia-consulta');
  ok(await p.evaluate(() => { const r = document.querySelector('#modal .caja').getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth + 1; }), 'ventana de copiar y pegar dentro de la pantalla del teléfono');
  await foto(p, '32_movil_copiar');
  await p.click('[data-a=cancelarCopia]');
  await p.evaluate(() => document.querySelector('.nav [data-v=orientacion]').click()); await p.waitForSelector('#or-empezar');
  ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1, 'orientación sin desborde horizontal en teléfono');
  await p.context().close();

  // ---------------------------------------------------------------- 10. padrón: primer ingreso, borrador precargado y revisión por secciones
  p = await nueva(b, 'padron-sencillo-sinclave');
  c = await p.evaluate(() => __cred);
  await p.fill('#i-correo', c.karla.correo); await p.fill('#i-clave', c.karla.codigo); await p.click('form[data-f=ingresar] button[type=submit]');
  await p.waitForSelector('form[data-f=cambiarClave]');
  ok(/Crea tu clave/.test(await texto(p, '.forma h2')) && !(await p.$('.barra')), 'con la clave inicial se pide crear una clave propia antes de entrar');
  await foto(p, '40_cambiar_clave');
  await p.fill('#c-nueva', 'Karla2026Tesis'); await p.fill('#c-repite', 'otra2026xx'); await p.click('form[data-f=cambiarClave] button[type=submit]');
  await p.waitForSelector('.toast.error');
  ok(/no coinciden/.test(await texto(p, '.toast.error')), 'las dos claves nuevas deben coincidir');
  await p.fill('#c-repite', 'Karla2026Tesis'); await p.click('form[data-f=cambiarClave] button[type=submit]');
  await p.waitForSelector('.barra'); await p.waitForSelector('.hoja'); await quieto(p);
  ok(/Mi tesis/.test(await texto(p, 'h1')) && /borrador ya está escrito/.test(await texto(p, '.cabecera')) && /Redes neuronales convolucionales para identificar/.test(await texto(p, '.d-car[data-k=titulo]')), 'entra a su tesis con el borrador precargado');
  ok((await p.$$('.hoja .d-rev')).length > 30 && /Por revisar \(\d+\)/.test(await texto(p, '#boton-word')) && (await p.evaluate(() => document.querySelector('#boton-word').classList.contains('ambar'))), 'cada sección dice «Por revisar» y el botón de Word avisa cuántas faltan');
  await foto(p, '41_tesis_padron');
  await p.click('.nav [data-v=documento]'); await p.waitForSelector('#hojas .d-rev'); await quieto(p);
  ok(/Ver mi tesis/.test(await texto(p, 'h1')) && (await p.$$('#hojas .d-idx')).length > 40 && /I\. PLANTEAMIENTO DEL PROBLEMA/.test(await texto(p, '#hojas')) && /VIII\. ANEXOS/.test(await texto(p, '#hojas')), 'Ver mi tesis: el documento completo, con índice y los ocho capítulos del modelo');
  const total = (await p.$$('#hojas .d-rev')).length;
  await p.click('#hojas .d-rev [data-a=revisarSeccion][data-e=ok]'); await quieto(p);
  ok((await p.$$('#hojas .d-rev.revisado')).length === 1 && new RegExp('Revisaste 1 de ' + total).test(await texto(p, '#doc-revision')), 'marcar una sección como revisada la pone en verde');
  await foto(p, '42_revision');
  await p.evaluate(() => { const tok = sessionStorage.getItem('qsi_token'); api('vista', tok).data.revision.secciones.forEach(s => api('revisar', tok, { seccion: s.id, estado: 'ok' })); });
  await p.click('.nav [data-v=documento]'); await p.waitForSelector('#hojas .d-rev'); await quieto(p);
  ok((await p.evaluate(() => document.querySelector('#boton-word').classList.contains('verde'))) && /Tesis revisada/.test(await texto(p, '#boton-word')), 'con todo revisado, el botón de descarga se pone verde');
  await foto(p, '43_tesis_verde');
  // desde otra pantalla también se ve la tesis
  await p.click('.nav [data-v=biblioteca]'); await p.waitForSelector('.boton-ver-tesis');
  ok(/Nacional \(Perú\)/.test(await texto(p, '#pagina')) && /Internacional/.test(await texto(p, '#pagina')), 'la biblioteca muestra el ámbito de cada antecedente');
  await p.click('.boton-ver-tesis'); await p.waitForSelector('#hojas .d-rev');
  ok(/Ver mi tesis/.test(await texto(p, 'h1')), 'el botón «Ver mi tesis» está en todas las pantallas');
  // el asesor devuelve una sección
  await p.click('[data-a=salir]'); await p.waitForSelector('.ingreso');
  await p.fill('#i-correo', c.asesorKarla.correo); await p.fill('#i-clave', c.asesorKarla.codigo); await p.click('form[data-f=ingresar] button[type=submit]');
  await p.waitForSelector('form[data-f=cambiarClave]');
  await p.fill('#c-nueva', 'Asesor2026Ok'); await p.fill('#c-repite', 'Asesor2026Ok'); await p.click('form[data-f=cambiarClave] button[type=submit]');
  await p.waitForSelector('#tabla-panel tbody tr'); await quieto(p);
  ok(/Revisión de la tesis/i.test(await texto(p, '#tabla-panel thead')) && new RegExp(total + ' / ' + total).test(await texto(p, '#tabla-panel tbody')), 'el asesor ve en el panel cuánto revisó cada tesista: ' + total + ' | ' + (await texto(p, '#tabla-panel tbody')).replace(/\s+/g, ' ').slice(250, 600));
  await p.click('#tabla-panel tbody tr[data-correo="' + c.karla.institucional + '"]'); await p.waitForSelector('.cabecera h1');
  await p.click('[data-a=tabAlumno][data-t=tesis]'); await p.waitForSelector('#hojas .d-rev [data-a=devolverSeccion]'); await quieto(p);
  await p.click('#hojas .d-rev [data-a=devolverSeccion]'); await p.waitForSelector('#dev-com');
  await p.fill('#dev-com', 'Completa el ORCID del asesor y revisa el año.'); await p.click('[data-a=confirmarDevolver]'); await quieto(p);
  ok((await p.$$('#hojas .d-rev.devuelto')).length === 1, 'el asesor devuelve una sección con su comentario');
  await foto(p, '44_asesor_revision');
  await p.context().close();

  await b.close();
  if (errores.length) { fallos += errores.length; console.log('ERRORES DE PAGINA:\n  ' + [...new Set(errores)].join('\n  ')); }
  console.log(fallos ? ('\n' + fallos + ' FALLAS de ' + pruebas) : ('\nInterfaz: todas las pruebas pasaron (' + pruebas + ')'));
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

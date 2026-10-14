/* Prueba del servidor, versión 1.6: aprobación y congelado del plan, solicitudes de cambio y borrador de tesis. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.resolve(__dirname, '..');
const ctx = vm.createContext({ console });
ctx.globalThis = ctx;
function cargar(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); }
ctx.__hojaModo = { formato: true, apostrofo: true };
ctx.__filasIniciales = 95;
cargar(path.join(RAIZ, 'test/mock.js'));
cargar(path.join(RAIZ, 'test/demo.js'));
for (const f of fs.readdirSync(path.join(RAIZ, 'dist')).filter(x => x.endsWith('.gs')).sort()) cargar(path.join(RAIZ, 'dist', f));
const G = ctx;
let fallos = 0, pruebas = 0;
function ok(c, m) { pruebas++; if (!c) { fallos++; console.log('  FALLA: ' + m); } }
function api(n, t, a) { return vm.runInContext('api', ctx)(n, t, a === undefined ? {} : JSON.parse(JSON.stringify(a))); }
function bien(n, t, a) { const r = api(n, t, a); if (!r.ok) { fallos++; console.log('  ERROR en ' + n + ': ' + r.mensaje); return null; } return JSON.parse(JSON.stringify(r.data)); }
const ev = s => vm.runInContext(s, ctx);

vm.runInContext('instalar()', ctx);
const libro = Object.values(G.__mock.libros)[0];
const hoja = n => libro.getSheetByName(n) ? libro.getSheetByName(n).datos : null;
const admin = hoja('Usuarios')[1];
const CL = 'MiClaveSegura9';
function entrar(correo, inicial) {
  const s = bien('ingresar', '', { correo, contrasena: inicial });
  if (s && s.perfil.cambiarClave) bien('cambiarClave', s.token, { actual: inicial, nueva: CL });
  return s.token;
}
const tA = entrar(admin[0], admin[3]);
let ad = bien('adminUsuario', tA, { correo: 'asesor@undc.edu.pe', nombre: 'Dra. Asesora Demo', rol: 'asesor' });
ad = bien('adminUsuario', tA, { correo: 'coord@undc.edu.pe', nombre: 'Dr. Coordinador Demo', rol: 'coordinador' });
const clave = hoja('Config').find(f => f[0] === 'CLAVE_REGISTRO')[1];
bien('registrar', '', { correo: 'ana@undc.edu.pe', nombre: 'Ana Demo Quispe', clave, contrasena: 'AnaClave2026' });
ad = bien('adminUsuario', tA, { correo: 'ana@undc.edu.pe', rol: 'estudiante', asesor: 'asesor@undc.edu.pe', activo: 'SI' });
const tS = entrar('asesor@undc.edu.pe', ad.usuarios.find(u => u.correo === 'asesor@undc.edu.pe').codigo);
const tC = entrar('coord@undc.edu.pe', ad.usuarios.find(u => u.correo === 'coord@undc.edu.pe').codigo);
const tE = bien('ingresar', '', { correo: 'ana@undc.edu.pe', contrasena: 'AnaClave2026' }).token;
const D = G.__DEMO;
D.estudios.forEach(e => bien('agregarEstudio', tE, e));
for (let i = 0; i <= 6; i++) bien('guardar', tE, { valores: D.valores[i] });
bien('guardar', tE, { valores: { autor1: 'Quispe Demo, Ana', titulo: 'Modelo de red neuronal convolucional para detectar daño pulmonar en radiografías de tórax del Hospital Rezola de Cañete, 2026', planteamiento: 'El hospital no cuenta con apoyo automatizado [@ozturk2020]. Se aplicará una encuesta y se analizarán los datos; el presente proyecto permitirá mejorar el tamizaje.' } });

// --- 1. antes de aprobar
ok(/coordinación aprueba/.test(api('informeSeccion', tE, { id: '1.1' }).mensaje), 'sin plan aprobado no se abre el borrador');
const inf0 = bien('informe', tE);
ok(inf0.secciones.length >= 25 && inf0.secciones[0].id === 'dedicatoria' && inf0.secciones.some(s => s.id === '5.2') && !inf0.plan.aprobado, 'estructura del Anexo 6 disponible, plan aún sin aprobar: ' + inf0.secciones.length);
ok(inf0.secciones.map(s => s.c).filter((c, i, a) => a.indexOf(c) === i).join(',') === 'pre,I,II,III,IV,V,VI,VII,VIII,anexos', 'capítulos I a VIII del Anexo 6, con preliminares y anexos');
ok(/RCO N\.° 115-2025/.test(inf0.norma), 'la norma citada es el Reglamento de Grados y Títulos (RCO 115-2025)');
ok(/permiso/.test(api('aprobarPlan', tS, { correo: 'ana@undc.edu.pe' }).mensaje), 'el asesor no aprueba el plan: lo hace la coordinación');
ok(/permiso/.test(api('aprobarPlan', tE, { correo: 'ana@undc.edu.pe' }).mensaje), 'el estudiante no se aprueba solo');

// --- 2. la coordinación aprueba
const ap = bien('aprobarPlan', tC, { correo: 'ana@undc.edu.pe', nota: 'Conforme con el plan.' });
const okPlan = JSON.parse(ap.expediente._plan_ok);
ok(okPlan.v === 1 && okPlan.por === 'Dr. Coordinador Demo' && okPlan.doc, 'plan aprobado v1 con copia fija del Word: ' + JSON.stringify(okPlan));
ok(G.__mock.archivos[okPlan.doc] && G.__mock.archivos[okPlan.doc].copiaDe && /Plan aprobado v1/.test(G.__mock.archivos[okPlan.doc].nombre), 'la copia fija es un archivo aparte');
ok(hoja('Comentarios').some(f => f.indexOf('plan_aprobado') >= 0), 'queda constancia en los comentarios');

// --- 3. plan congelado
const tit0 = ev('expediente_("ana@undc.edu.pe").titulo');
const g1 = bien('guardar', tE, { valores: { titulo: 'Otro título cualquiera para probar' } });
ok(g1.bloqueados && g1.bloqueados.indexOf('titulo') >= 0 && ev('expediente_("ana@undc.edu.pe").titulo') === tit0, 'el plan aprobado no se puede modificar: ' + JSON.stringify(g1 && g1.bloqueados));
ok(/congelado/.test(api('humanizar', tE, { campo: 'planteamiento', texto: 'x '.repeat(80), stats: { teclas: 500, pegados: 0 } }).mensaje), 'tampoco se puede humanizar un campo congelado');
ok(/congelado/.test(api('importarPlan', tE, { campos: { titulo: 'X' } }).mensaje), 'ni importar otro plan encima');

// --- 4. solicitud de cambio
ok(api('solicitarCambioPlan', tE, { campos: ['titulo'], motivo: 'corto' }).ok === false, 'la solicitud pide un motivo');
const sol = bien('solicitarCambioPlan', tE, { campos: ['titulo', 'campo_inventado'], motivo: 'La muestra cambió de hospital y el título debe reflejarlo.' });
ok(JSON.parse(sol.expediente._plan_sol).campos.join() === 'titulo', 'solo se piden campos reales del plan');
ok(/esperando/.test(api('solicitarCambioPlan', tE, { campos: ['titulo'], motivo: 'Otra solicitud más con su motivo.' }).mensaje), 'una solicitud a la vez');
ok(api('resolverCambioPlan', tC, { correo: 'ana@undc.edu.pe', decision: 'rechazar' }).ok === false, 'al rechazar se explica el motivo');
bien('resolverCambioPlan', tC, { correo: 'ana@undc.edu.pe', decision: 'autorizar', comentario: 'Adelante.' });
const g2 = bien('guardar', tE, { valores: { titulo: 'Título corregido con el nuevo hospital de estudio 2026', objetivo_general: 'No debería cambiar' } });
ok(ev('expediente_("ana@undc.edu.pe").titulo') === 'Título corregido con el nuevo hospital de estudio 2026' && g2.bloqueados.join() === 'objetivo_general', 'se abre solo lo autorizado');
const ap2 = bien('aprobarPlan', tC, { correo: 'ana@undc.edu.pe' });
ok(JSON.parse(ap2.expediente._plan_ok).v === 2 && !ap2.expediente._plan_abiertos, 'al aprobar de nuevo: versión 2 y todo vuelve a congelarse');
ok(JSON.parse(ap2.expediente._plan_hist).map(h => h.a).join() === 'aprobado,solicitud,autorizado,reaprobado', 'historial completo del plan');

// --- 5. pasar a tiempo pasado y traer del plan
ok(ev('aPasado_("Se aplicará una encuesta y se analizarán los datos; el presente proyecto permitirá mejorar. Será útil y se obtendrán resultados.")') === 'Se aplicó una encuesta y se analizaron los datos; la presente investigación permitió mejorar. Fue útil y se obtuvieron resultados.', 'futuro a pasado: ' + ev('aPasado_("Se aplicará una encuesta y se analizarán los datos; el presente proyecto permitirá mejorar. Será útil y se obtendrán resultados.")'));
ok(ev('aPasado_("Se construirá un sistema que leerá los datos")') === 'Se construyó un sistema que leyó los datos', 'verbos con y: construyó, leyó');
const tr = bien('traerDelPlan', tE, { id: '1.1', pasado: true });
ok(tr.encontrado && /se aplicó una encuesta/i.test(tr.md) && /\[@ozturk2020\]/.test(tr.md) && /la presente investigación permitió/.test(tr.md), 'trae la realidad problemática del plan, en pasado y con las citas vivas: ' + tr.md.substring(0, 160));
const tr3 = bien('traerDelPlan', tE, { id: '3.3' });
ok(/^Tabla: /m.test(tr3.md) && /^\| .* \|$/m.test(tr3.md) && /^\|---/m.test(tr3.md), 'la operacionalización llega como tabla Markdown');
const tr2 = bien('traerDelPlan', tE, { id: '1.2' });
ok(tr2.encontrado && /^## Problema general/m.test(tr2.md), 'los subtítulos del plan llegan como ##');
ok(/no viene del plan/.test(api('traerDelPlan', tE, { id: '5.1' }).mensaje), 'resultados no se traen del plan');

// --- 6. guardar secciones
const md = ['## Primer subtítulo', 'Texto con **negrita**, *cursiva*, __subrayado__ y la ecuación $E = mc^2$ [@ozturk2020].', '- viñeta uno', '- viñeta dos',
  'Tabla: Exactitud por modelo', '| Modelo | Exactitud |', '|---|---|', '| CNN | 0,95 |', 'Nota: Elaboración propia.', '$$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$', '### Detalle', '> Cita textual larga de más de cuarenta palabras.'].join('\n');
let gs = bien('guardarSeccion', tE, { id: '5.1', texto: md });
ok(gs.n > 10 && gs.f, 'sección guardada con su conteo de palabras: ' + gs.n);
const fila = hoja('Informe').find(f => f[0] === 'ana@undc.edu.pe' && f[1] === '5.1');
ok(fila && fila[2] === md, 'la sección vive en la pestaña Informe, una fila por sección');
ok(api('guardarSeccion', tE, { id: '5.1', texto: md + '\nMás.', base: '2020-01-01 00:00:00' }).mensaje.indexOf('CONFLICTO') === 0, 'detecta que la sección cambió en otra ventana');
gs = bien('guardarSeccion', tE, { id: '5.1', texto: md + '\nMás texto.', base: gs.f });
ok(gs && gs.n > 10, 'con la versión al día sí guarda');
ok(/no existe/.test(api('guardarSeccion', tE, { id: '9.9', texto: 'x' }).mensaje), 'secciones inventadas no');
ok(/supera/.test(api('guardarSeccion', tE, { id: '5.2', texto: 'a'.repeat(46000) }).mensaje), 'límite por sección');
const ls = bien('informeSeccion', tE, { id: '5.1' });
ok(ls.texto === md + '\nMás texto.' && ls.f === gs.f, 'se lee la sección al abrirla (carga perezosa)');
bien('guardarSeccion', tE, { id: 'resumen', texto: 'Resumen de prueba.\nPalabras clave: CNN, radiografía.' });
bien('guardarSeccion', tE, { id: 'anexos', texto: '## Instrumento de recolección\nFicha de registro.' });
const todo = bien('informeTodo', tE);
ok(Object.keys(todo.secciones).length === 3 && todo.secciones.resumen, 'todo el borrador en una lectura para la vista previa');

// --- 7. figuras
const fig = bien('subirFigura', tE, { nombre: 'matriz.png', tipo: 'image/png', datos: 'iVBORw0KGgo=' });
ok(fig.id && ev('figurasPermitidas_(expediente_("ana@undc.edu.pe"))').indexOf(fig.id) >= 0, 'figura subida a Drive y registrada como del estudiante');
ok(/PNG o JPG/.test(api('subirFigura', tE, { nombre: 'x.gif', tipo: 'image/gif', datos: 'R0lG' }).mensaje), 'solo PNG o JPG');
bien('guardarSeccion', tE, { id: '5.2', texto: '![Matriz de confusión](fig:' + fig.id + ')\nFuente: Elaboración propia\n![Figura de otro](fig:ARCHIVO_AJENO_1234567)\n![Esquema pendiente]()' });

// --- 8. Word del borrador con ecuaciones nativas
const w = bien('generarInforme', tE);
ok(w && w.ecuaciones === 1 && /uc\?export=download/.test(w.docx) && !w.avisoEcuaciones, 'Word generado, con su ecuación convertida: ' + JSON.stringify(w && { e: w.ecuaciones, a: w.avisoEcuaciones }));
const docx = Object.values(G.__mock.archivos).find(a => a.blob && a.blob.__zip);
const xml = docx && docx.blob.partes.find(p => p.name === 'word/document.xml').data;
ok(xml && /<m:oMath>/.test(xml) && /<m:f>/.test(xml) && /<m:rad>/.test(xml) && /<m:sSup>/.test(xml) && /xmlns:m=/.test(xml) && /\(1\)<\/w:t>/.test(xml), 'en el .docx la ecuación es OMML editable, con su número');
const docId = ev('expediente_("ana@undc.edu.pe")._inf_doc');
const html = G.__docHtml(docId);
fs.writeFileSync(path.join(RAIZ, 'test/salida/borrador_informe.html'), html);
ok(/TESIS PARA OPTAR EL TÍTULO PROFESIONAL/.test(html) && /HOJA DEL JURADO/.test(html) && /ÍNDICE/.test(html) && /LISTA DE TABLAS/.test(html) && /LISTA DE GRÁFICOS/.test(html), 'carátula de tesis, hoja del jurado, índice y listas (Anexo 6)');
ok(/V\. RESULTADOS/.test(html) && /5\.1 Resultados descriptivos/.test(html) && /5\.1\.1 Primer subtítulo/.test(html) && /A\. Detalle/.test(html), 'numeración: capítulo, sección, ## como 5.1.1 y ### como A.');
ok(/Tabla 1/.test(html) && /Exactitud por modelo/.test(html) && /Figura 1/.test(html) && /Matriz de confusión/.test(html), 'tablas y figuras con rótulo APA');
ok(/inserte aquí la figura «Figura de otro»/.test(html) && /inserte aquí la figura «Esquema pendiente»/.test(html), 'una figura ajena no se incrusta: queda el espacio para pegarla');
ok(/Anexo 01: Matriz de consistencia/.test(html) && /Anexo 02: Instrumento de recolección/.test(html) && /Anexo 03: Declaración de uso de inteligencia artificial/.test(html), 'anexos numerados: matriz, los del estudiante y la declaración de IA');
ok(/REFERENCIAS/.test(html) && /redacta la sección/.test(html), 'referencias y marcas de lo que falta');
ok(html.indexOf('**') < 0 && !/__[A-Za-z]/.test(html), 'el Markdown no se ve en el Word');
ok(/E = mc²/.test(html), 'ecuación en línea como texto matemático: ' + (html.match(/E = mc[^<]*/) || [''])[0]);

// --- 9. ecuaciones
ok(ev('latexLineal_("\\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}")') === '(−b ± √(b²−4ac))/(2a)', 'LaTeX a texto lineal: ' + ev('latexLineal_("\\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}")'));
ok(ev('latexLineal_("\\\\sum_{i=1}^{n} x_i")') === '∑ᵢ₌₁ⁿxᵢ', 'sumatoria lineal: ' + ev('latexLineal_("\\\\sum_{i=1}^{n} x_i")'));
const om = ev('latexOmml_("\\\\sum_{i=1}^{n} x_i^2 + \\\\alpha \\\\left( \\\\frac{a}{b} \\\\right) + \\\\text{error}")');
ok(/<m:nary>.*<m:chr m:val="∑"\/>.*<m:e><m:sSubSup>/.test(om) && /<m:d>/.test(om) && /α/.test(om) && /<m:sty m:val="p"\/><\/m:rPr><m:t xml:space="preserve">error/.test(om), 'OMML: sumatoria con operando, delimitadores, griegas y texto normal');
ok(ev('latexLineal_("\\\\comandoRaro{x}")').indexOf('comandoRaro') >= 0, 'un comando desconocido no se pierde');

// --- 10. revisión del asesor
bien('marcarSeccionInf', tE, { id: '5.1', lista: true });
ok(api('revisarSeccionInf', tS, { correo: 'ana@undc.edu.pe', id: '5.1', decision: 'devolver', comentario: 'x' }).ok === false, 'al devolver se explica');
let rv = bien('revisarSeccionInf', tS, { correo: 'ana@undc.edu.pe', id: '5.1', decision: 'devolver', comentario: 'Interpreta la tabla debajo.' });
ok(rv.idx['5.1'].e === 'dev' && rv.idx['5.1'].c === 'Interpreta la tabla debajo.', 'el asesor devuelve una sección con su comentario');
rv = bien('revisarSeccionInf', tS, { correo: 'ana@undc.edu.pe', id: '5.1', decision: 'aprobar' });
ok(rv.idx['5.1'].e === 'ok', 'y la aprueba');
const gs3 = bien('guardarSeccion', tE, { id: '5.1', texto: md + '\nCambio después de aprobada.' });
ok(gs3.e === '', 'si cambia una sección aprobada, vuelve a quedar por revisar');
ok(api('revisarSeccionInf', tC, { correo: 'ana@undc.edu.pe', id: '5.1', decision: 'aprobar' }).ok === false, 'el coordinador no revisa contenido');
const de = bien('informeDe', tC, { correo: 'ana@undc.edu.pe' });
ok(de.textos['5.1'] && de.similitud && typeof de.similitud.pct === 'number', 'la coordinación ve el borrador y su similitud en solo lectura');

// --- 11. panel
const pn = bien('panel', tS);
const fl = pn.estudiantes.find(x => x.correo === 'ana@undc.edu.pe');
ok(fl.planEstado && fl.planEstado.v === 2 && fl.planEstado.inf.con >= 4, 'el panel muestra el plan aprobado y el avance del borrador: ' + JSON.stringify(fl.planEstado));

console.log('\n' + (fallos ? fallos + ' de ' + pruebas + ' pruebas fallaron' : 'Todas las pruebas pasaron (' + pruebas + ')'));
process.exit(fallos ? 1 : 0);

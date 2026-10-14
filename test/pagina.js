/* Arma test/salida/app.html: la aplicacion completa con el servidor simulado dentro de la pagina. */
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..');
const lee = f => fs.readFileSync(path.join(R, f), 'utf8');
const gs = fs.readdirSync(path.join(R, 'dist')).filter(f => f.endsWith('.gs')).sort().map(f => lee('dist/' + f)).join('\n');
const preparar = `
(function () {
  instalar();
  if (location.hash.indexOf('sinclave') < 0) PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', 'AIza-prueba');
  // Los recorridos anteriores entran directo a su modo; con 'clase' en la direccion se prueba la primera pantalla nueva
  if (location.hash.indexOf('clase') < 0) ponerConfig_('INICIO_ESTUDIANTE', 'modo');
  if (location.hash.indexOf('alasesor') >= 0) ponerConfig_('REVISION_SIN_IA', 'asesor');
  // Los recorridos anteriores prueban la ruta estricta; con 'sencillo' en la direccion se prueba lo que ve un curso por defecto
  if (location.hash.indexOf('sencillo') < 0) { ponerConfig_('MODO_INICIAL', 'completo'); ponerConfig_('ETAPAS_EN_ORDEN', 'SI'); }
  var libro = Object.values(__mock.libros)[0];
  var hoja = function (n) { return libro.getSheetByName(n).datos; };
  var clave = hoja('Config').filter(function (f) { return f[0] === 'CLAVE_REGISTRO'; })[0][1];
  var adm = hoja('Usuarios')[1];
  function ok(r) { if (!r.ok) throw new Error(r.mensaje); return r.data; }
  var CLAVE = 'Clave2026demo';
  var tA = ok(api('ingresar', '', { correo: adm[0], contrasena: adm[3] })).token;
  ok(api('cambiarClave', tA, { actual: adm[3], nueva: CLAVE }));
  ok(api('adminUsuario', tA, { correo: adm[0], nombre: 'Profesor Demo', rol: 'admin', activo: 'SI' }));
  var us = ok(api('adminUsuario', tA, { correo: 'asesor@undc.edu.pe', nombre: 'Dra. Asesora Demo', rol: 'asesor' })).usuarios;
  var inicialAs = us.filter(function (u) { return u.rol === 'asesor'; })[0].codigo;
  var tS0 = ok(api('ingresar', '', { correo: 'asesor@undc.edu.pe', contrasena: inicialAs })).token;
  ok(api('cambiarClave', tS0, { actual: inicialAs, nueva: CLAVE }));
  window.__cred = { clave: clave, admin: { correo: adm[0], codigo: CLAVE }, asesor: { correo: 'asesor@undc.edu.pe', codigo: CLAVE } };
  ponerConfig_('ASESOR_POR_DEFECTO', 'asesor@undc.edu.pe');
  if (location.hash.indexOf('padron') >= 0) {
    var PD = window.__PADRON;
    ['Padron', 'PadronBorradores', 'PadronBiblioteca'].forEach(function (n) { var h = libro.insertSheet(n); h.datos = PD[n].map(function (f) { return f.slice(); }); h.formatoFilas = h.datos.length + 10; h.maxFilas = h.datos.length + 10; });
    cargarPadron();
    window.__cred.karla = PD.karla;
    window.__cred.asesorKarla = PD.asesorKarla;
    __mock.cache = {};
    return;
  }
  if (location.hash.indexOf('demo') < 0) return;
  var D = __DEMO;
  ok(api('registrar', '', { correo: 'ana@undc.edu.pe', nombre: 'Ana Demo Quispe', clave: clave, contrasena: CLAVE }));
  window.__cred.ana = { correo: 'ana@undc.edu.pe', codigo: CLAVE };
  var tE = ok(api('ingresar', '', { correo: 'ana@undc.edu.pe', contrasena: CLAVE })).token, tS = ok(api('ingresar', '', { correo: 'asesor@undc.edu.pe', contrasena: CLAVE })).token;
  D.estudios.forEach(function (e) { ok(api('agregarEstudio', tE, JSON.parse(JSON.stringify(e)))); });
  var hasta = parseInt((location.hash.match(/hasta(\\d)/) || [0, 6])[1], 10);
  for (var i = 0; i <= hasta; i++) {
    ok(api('guardar', tE, { valores: JSON.parse(JSON.stringify(D.valores[i])) }));
    if (location.hash.indexOf('abierta' + i) >= 0) break;
    var r = ok(api('cerrarEtapa', tE, { etapa: String(i) }));
    if (r.estado === 'en_revision' && !(i === hasta && location.hash.indexOf('pendiente') >= 0)) ok(api('decidir', tS, { correo: 'ana@undc.edu.pe', etapa: String(i), decision: 'aprobar', comentario: i === 2 ? 'Conforme. Consigue el dato local del hospital antes de la sustentación.' : '' }));
  }
  ok(api('registrar', '', { correo: 'luis@undc.edu.pe', nombre: 'Luis Demo Huamán', clave: clave, contrasena: CLAVE }));
  var tL = ok(api('ingresar', '', { correo: 'luis@undc.edu.pe', contrasena: CLAVE })).token;
  ok(api('guardar', tL, { valores: { tipo_proyecto: 'explicativa', con_hipotesis: 'SI', tema: 'Relación entre la gestión por procesos y la satisfacción del usuario.', var1: 'gestión por procesos', var2: 'satisfacción del usuario', tema_oracion: 'Gestión por procesos y satisfacción del usuario en una municipalidad distrital de Cañete.' } }));
  ok(api('cerrarEtapa', tL, { etapa: '0' }));
  if (location.hash.indexOf('aprobado') >= 0) {
    var cu = ok(api('adminUsuario', tA, { correo: 'coord@undc.edu.pe', nombre: 'Dr. Coordinador Demo', rol: 'coordinador' })).usuarios;
    var inicialC = cu.filter(function (u) { return u.correo === 'coord@undc.edu.pe'; })[0].codigo;
    var tC0 = ok(api('ingresar', '', { correo: 'coord@undc.edu.pe', contrasena: inicialC })).token;
    ok(api('cambiarClave', tC0, { actual: inicialC, nueva: CLAVE }));
    window.__cred.coord = { correo: 'coord@undc.edu.pe', codigo: CLAVE };
    if (location.hash.indexOf('sinaprobar') < 0) {
      ok(api('aprobarPlan', tC0, { correo: 'ana@undc.edu.pe', nota: 'Conforme.' }));
      ok(api('guardarSeccion', tE, { id: '5.1', texto: '## Exactitud del modelo\\nEl modelo alcanzó una exactitud alta [@ozturk2020].\\nTabla: Exactitud por clase\\n| Clase | Exactitud |\\n|---|---|\\n| COVID-19 | 0,95 |\\n| Normal | 0,97 |\\nNota: Elaboración propia.\\n$$\\\\text{Exactitud} = \\\\frac{VP + VN}{VP + VN + FP + FN}$$\\n![Matriz de confusión]()\\nFuente: Elaboración propia' }));
      ok(api('marcarSeccionInf', tE, { id: '5.1', lista: true }));
    }
  }
  __mock.cache = {};
})();`;
const shim = `
window.google = { script: { run: (function () {
  function mk(ok, ko) { return {
    withSuccessHandler: function (f) { return mk(f, ko); },
    withFailureHandler: function (f) { return mk(ok, f); },
    api: function (n, t, a) { window.__llamadas = (window.__llamadas || 0) + 1; setTimeout(function () { var r; try { r = JSON.parse(JSON.stringify(api(n, t, JSON.parse(JSON.stringify(a || {}))))); } catch (e) { if (ko) ko(e); return; } if (ok) ok(r); }, window.__latencia === undefined ? 80 : window.__latencia); }
  }; }
  return mk(null, null);
})() } };`;
// Un padron reducido (Karla, su compañero y su asesor) para probar el primer ingreso y la revision por secciones
const padronPrueba = (function () {
  const PAD = path.join(R, 'padron');
  // Sin el padrón real (datos personales, fuera del repositorio) se usa uno ficticio
  if (!fs.existsSync(path.join(PAD, 'padron.json'))) return JSON.parse(lee('test/muestras/padron_prueba.json'));
  const P = JSON.parse(lee('padron/padron.json')), CL = fs.existsSync(path.join(PAD, 'claves.json')) ? JSON.parse(lee('padron/claves.json')) : new Proxy({}, { get: () => 'prueba1234' });
  const COLS = ['correo', 'clave_cita', 'tipo', 'uso', 'ambito', 'doi', 'url', 'autores', 'anio', 'titulo', 'fuente', 'volumen', 'numero', 'paginas', 'editorial', 'grado', 'indizacion', 'objetivo', 'metodologia', 'resultados', 'conclusion', 'relacion', 'sin_resolver'];
  const ASE = (P.estudiantes.find(e => e.id === 'e04') || {}).asesor;
  const est = P.estudiantes.filter(e => e.asesor === ASE), as = P.asesores.filter(a => a.correo === ASE);
  const out = { Padron: [['correo', 'alias', 'nombre', 'rol', 'asesor', 'asesor_caratula', 'clave_inicial', 'titulo_original', 'titulo_motivo', 'titulo_propuesto']], PadronBorradores: [['correo', 'clave', 'valor']], PadronBiblioteca: [COLS] };
  as.forEach(a => out.Padron.push([a.correo, '', a.nombre, 'asesor', '', '', CL[a.correo], '', '', '']));
  est.forEach(e => {
    out.Padron.push([e.correo, e.alias, e.nombre, 'estudiante', e.asesor, e.asesor_caratula, CL[e.correo], e.titulo_original, e.titulo_motivo, '']);
    const d = JSON.parse(lee('padron/borradores/' + e.id + '.json'));
    Object.keys(d.campos).forEach(k => out.PadronBorradores.push([e.correo, k, typeof d.campos[k] === 'string' ? d.campos[k] : JSON.stringify(d.campos[k])]));
    d.biblioteca.forEach(b => out.PadronBiblioteca.push([e.correo].concat(COLS.slice(1).map(c => String(b[c] === undefined ? '' : b[c])))));
  });
  const k = est.find(e => e.id === 'e04');
  out.karla = { correo: k.alias, codigo: CL[k.correo], nombre: k.nombre, institucional: k.correo };
  out.asesorKarla = { correo: ASE, codigo: CL[ASE] };
  return out;
})();
let html = lee('dist/Index.html');
// Para las capturas de la guia: las fuentes van incrustadas, porque el entorno de pruebas no tiene acceso a Google Fonts
let fuentes = '';
if (process.env.FUENTES) {
  const F = process.env.FUENTES;
  const cara = (fam, peso, arch) => "@font-face{font-family:'" + fam + "';font-weight:" + peso + ";font-style:normal;src:url(data:font/woff2;base64," + fs.readFileSync(path.join(F, arch)).toString('base64') + ") format('woff2')}";
  fuentes = '<style>' + [400, 500, 600, 700].map(w => cara('Space Grotesk', w, '@fontsource/space-grotesk/files/space-grotesk-latin-' + w + '-normal.woff2')).join('') + [400, 600].map(w => cara('JetBrains Mono', w, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-' + w + '-normal.woff2')).join('') + '</style>';
  html = html.replace(/<link[^>]*fonts\.g[^>]*>\n?/g, '');
}
html = html.replace("<?!= incluir_('Estilos'); ?>", () => fuentes + lee('dist/Estilos.html'));
const cuerpo = '<script>window.__PADRON = ' + JSON.stringify(padronPrueba).replace(/<\//g, '<\\/') + ';\n' + lee('test/mock.js') + '\n' + gs + '\n' + lee('test/demo.js') + '\n' + preparar + '\n' + shim + '\n<\/script>\n' + lee('dist/Script.html');
html = html.replace("<?!= incluir_('Script'); ?>", () => cuerpo);
fs.mkdirSync(path.join(R, 'test/salida'), { recursive: true });
fs.mkdirSync(path.join(R, 'test/salida'), { recursive: true });
fs.writeFileSync(path.join(R, 'test/salida/' + (process.env.FUENTES ? 'app_guia.html' : 'app.html')), html);
console.log('app.html', Math.round(html.length / 1024) + ' KB');

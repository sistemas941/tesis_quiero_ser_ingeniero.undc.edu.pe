'use strict';
/**
 * Carga dist/Codigo.gs (el mismo archivo que se pega en Apps Script) en un contexto aislado
 * con los servicios de Google simulados sobre SQLite y disco, y expone api(), doGet() y
 * cualquier otra funcion del codigo (para las herramientas de linea de comandos).
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { crearServicios } = require('./servicios');
const { abrir } = require('./bd');

const VERSION_SERVIDOR = '2.0';

/**
 * op: { datos, dist, usuarioActivo, propietario, urlPublica, simuladorFetch, log, anfitrion }
 * anfitrion: funciones del servidor que el codigo puede usar con SERVIDOR_.<nombre> (por ejemplo, exportar a Excel)
 */
function cargar(op) {
  const dist = op.dist || path.join(__dirname, '..', '..', 'dist');
  const bd = op.bd || abrir(op.datos);
  let contexto = null;
  const servicios = crearServicios({
    bd, dist,
    usuarioActivo: op.usuarioActivo || '',
    propietario: op.propietario || '',
    urlPublica: op.urlPublica || '',
    simuladorFetch: op.simuladorFetch,
    log: op.log,
    evaluar: (expr) => vm.runInContext(expr, contexto)
  });
  const globales = Object.assign({}, servicios, {
    console,
    SERVIDOR_: Object.assign({ version: VERSION_SERVIDOR, url: op.urlPublica || '' }, op.anfitrion || {})
  });
  delete globales.Blob; delete globales._registrarArchivo; delete globales._rutaArchivo;
  contexto = vm.createContext(globales, { name: 'Apps Script' });
  const codigo = fs.readFileSync(path.join(dist, 'Codigo.gs'), 'utf8');
  vm.runInContext(codigo, contexto, { filename: 'Codigo.gs' });
  // Puente: los argumentos entran y los resultados salen como JSON, para que los objetos
  // pertenezcan al contexto del codigo y no al del servidor.
  vm.runInContext(
    'function __api(n, t, a) { return JSON.stringify(api(n, t, JSON.parse(a))); }\n' +
    'function __llamar(f, a) { var r = this[f].apply(null, JSON.parse(a)); return r === undefined ? "null" : JSON.stringify(r); }\n' +
    'function __doGet() { var o = doGet({ parameter: {} }); return JSON.stringify({ html: o.getContent(), titulo: o.titulo, metas: o.metas, marcos: o.marcos }); }',
    contexto, { filename: 'puente.js' });

  function seguro(f) {
    try { return f(); } finally { bd.cerrarPendientes(); }
  }
  return {
    bd, servicios, contexto,
    api: (nombre, token, args) => seguro(() => JSON.parse(contexto.__api(String(nombre), token === undefined || token === null ? '' : String(token), JSON.stringify(args || {})))),
    doGet: () => seguro(() => JSON.parse(contexto.__doGet())),
    llamar: (f, ...args) => seguro(() => { if (typeof contexto[f] !== 'function') throw new Error('No existe la función ' + f); return JSON.parse(contexto.__llamar(f, JSON.stringify(args))); }),
    /** Ejecuta codigo arbitrario en el contexto (solo herramientas internas y pruebas). */
    evaluar: (codigoJs) => seguro(() => vm.runInContext(codigoJs, contexto))
  };
}

module.exports = { cargar, VERSION_SERVIDOR };

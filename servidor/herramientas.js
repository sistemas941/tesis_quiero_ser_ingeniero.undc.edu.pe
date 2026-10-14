#!/usr/bin/env node
'use strict';
/**
 * Herramientas de administracion de la version 2 (se ejecutan en el servidor, no desde el navegador).
 *
 *   node servidor/herramientas.js instalar                      crea la base y el usuario administrador
 *   node servidor/herramientas.js importar-v1 <archivo> [--forzar]
 *        <archivo>: el .zip de exportarTodo() (recomendado) o el .xlsx descargado de la hoja de Google
 *   node servidor/herramientas.js config [CLAVE [VALOR]]        ver o cambiar la pestana Config
 *   node servidor/herramientas.js reiniciar-clave <correo>      clave inicial nueva (pedira cambiarla)
 *   node servidor/herramientas.js exportar-datos <archivo.xlsx> todas las pestanas en un Excel
 *   node servidor/herramientas.js respaldo-bd <archivo.sqlite>  copia consistente de la base (en caliente)
 *   node servidor/herramientas.js ejecutar <funcion>            funciones del propietario (p. ej. cargarPadron)
 *   node servidor/herramientas.js recargar                      descarta la cache (tras editar datos a mano)
 *   node servidor/herramientas.js estado                        resumen de la instalacion
 *
 * Variables: DATOS (carpeta de datos), DIST, ADMIN_CORREO, MIGRACION_SECRETO.
 */
const fs = require('fs');
const path = require('path');
const { cargar, VERSION_SERVIDOR } = require('./runtime/gas');
const { abrir } = require('./runtime/bd');
const { leerZip } = require('./runtime/zip');
const { leerXlsx, escribirXlsx } = require('./runtime/xlsx');
const { crearAnfitrion, hojasDelLibro } = require('./runtime/anfitrion');

const DATOS = path.resolve(process.env.DATOS || path.join(__dirname, '..', 'datos'));
const DIST = path.resolve(process.env.DIST || path.join(__dirname, '..', 'dist'));
const ADMIN = String(process.env.ADMIN_CORREO || '').trim().toLowerCase();

function app(bd) {
  return cargar({ bd, dist: DIST, propietario: ADMIN || 'propietario@local', usuarioActivo: ADMIN || 'propietario@local', anfitrion: crearAnfitrion(bd, VERSION_SERVIDOR), log: (m) => console.log(m) });
}
function salir(msg) { console.error('ERROR: ' + msg); process.exit(1); }
function hojaId(bd) { const r = bd.q('SELECT v FROM props WHERE k = ?').get('HOJA_ID'); return r ? r.v : ''; }

const ordenes = {
  instalar() {
    if (!ADMIN) salir('Defina ADMIN_CORREO (correo del administrador) en el archivo .env.');
    const bd = abrir(DATOS);
    app(bd).llamar('instalar');
  },

  'importar-v1'(archivo, opcion) {
    if (!archivo) salir('Indique el archivo: el .zip de exportarTodo() o el .xlsx de la hoja de cálculo.');
    if (!fs.existsSync(archivo)) salir('No existe ' + archivo);
    const bd = abrir(DATOS);
    const id0 = hojaId(bd);
    if (id0) {
      const n = bd.q("SELECT COUNT(*) c FROM filas WHERE libro = ? AND hoja = 'Usuarios'").get(id0).c;
      if (n > 2 && opcion !== '--forzar') salir('Esta instalación ya tiene ' + (n - 1) + ' usuarios. Para reemplazarlo todo con la versión 1, repita con --forzar (haga antes un respaldo).');
    }
    let datos, archivos = [];
    const buf = fs.readFileSync(archivo);
    if (/\.xlsx$/i.test(archivo)) {
      const hojas = leerXlsx(buf);
      datos = { formato: 'qsi-migracion', hojas, archivos: [], props: {} };
      console.log('Libro de Excel: ' + Object.keys(hojas).length + ' pestañas. (Las figuras del borrador no viajan en un Excel: use exportarTodo() si ya hay figuras.)');
    } else {
      const partes = leerZip(buf);
      const dj = partes.find((p) => p.nombre === 'datos.json');
      if (!dj) salir('El .zip no contiene datos.json: ¿es el archivo de exportarTodo()?');
      datos = JSON.parse(dj.datos.toString('utf8'));
      if (datos.formato !== 'qsi-migracion') salir('datos.json no tiene el formato esperado.');
      archivos = partes.filter((p) => p.nombre.indexOf('archivos/') === 0);
      console.log('Exportación de la versión ' + (datos.app || '1') + ' (' + datos.generado + '): ' + Object.keys(datos.hojas).length + ' pestañas, ' + archivos.length + ' archivos.');
    }
    if (!datos.hojas.Usuarios || !datos.hojas.Expedientes) salir('Faltan las pestañas Usuarios o Expedientes: no parece la hoja de la aplicación.');
    const libro = 'libro_v1_' + Date.now();
    bd.transaccion(() => {
      bd.q('INSERT INTO libros (id, nombre) VALUES (?, ?)').run(libro, 'Quiero ser Ingeniero - Datos (migrados de la versión 1)');
      let orden = 0;
      Object.keys(datos.hojas).forEach((nombre) => {
        const filas = datos.hojas[nombre] || [];
        const ancho = filas.reduce((m, f) => Math.max(m, f.length), 0);
        bd.q('INSERT INTO hojas (libro, nombre, orden, max_filas, max_cols) VALUES (?, ?, ?, ?, ?)').run(libro, nombre, ++orden, Math.max(1000, filas.length + 500), Math.max(26, ancho));
        filas.forEach((f, i) => {
          const v = (f || []).map((x) => (x === null || x === undefined ? '' : (typeof x === 'number' ? String(x) : x)));
          let k = v.length;
          while (k > 0 && v[k - 1] === '') k--;
          if (k) bd.q('INSERT INTO filas (libro, hoja, n, v) VALUES (?, ?, ?, ?)').run(libro, nombre, i + 1, JSON.stringify(v.slice(0, k)));
        });
      });
      const props = Object.assign({ MODO_TEXTO: 'F1A1|F1A1' }, datos.props || {});
      props.HOJA_ID = libro;
      Object.keys(props).forEach((k) => { if (props[k]) bd.q('INSERT INTO props (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(k, String(props[k])); });
      bd.q("DELETE FROM props WHERE k = 'CARPETA_ID'").run();
    });
    // Archivos (figuras, escudo) con el mismo identificador que tenian en Drive
    const tipos = {};
    (datos.archivos || []).forEach((a) => { tipos[a.id] = a.mime; });
    const ahora = new Date().toISOString();
    archivos.forEach((p) => {
      const id = p.nombre.substring('archivos/'.length);
      if (!/^[A-Za-z0-9_-]{6,120}$/.test(id)) return;
      fs.writeFileSync(path.join(DATOS, 'archivos', id), p.datos);
      bd.q("INSERT OR REPLACE INTO archivos (id, nombre, mime, carpeta, tipo, tam, creado, actualizado, papelera) VALUES (?, ?, ?, 'raiz', 'archivo', ?, ?, ?, 0)").run(id, 'figura ' + id, tipos[id] || 'image/png', p.datos.length, ahora, ahora);
    });
    if (datos.props && datos.props.MIGRACION_SECRETO && !process.env.MIGRACION_SECRETO) console.log('El secreto de firma de la versión 1 quedó guardado: los expedientes firmados se reconocerán.');
    const a = app(bd);
    console.log('Completando la configuración (instalar no borra datos)...');
    a.llamar('instalar');
    console.log('Regenerando los Word de los planes aprobados...');
    const r = a.llamar('posMigracion_');
    console.log('Migración terminada: ' + r.estudiantes + ' estudiantes, ' + r.planesAprobados + ' planes aprobados, ' + r.regenerados + ' Word regenerados.' + (r.errores.length ? '\nErrores:\n  ' + r.errores.join('\n  ') : ''));
    if (id0) console.log('Los datos anteriores de la versión 2 siguen en la base (libro ' + id0 + '), pero ya no se usan.');
    console.log('Reinicie el servicio para vaciar la memoria de los hilos: docker compose restart app');
  },

  config(clave, valor) {
    const bd = abrir(DATOS);
    const a = app(bd);
    if (!clave) { a.evaluar('leer_("Config", true)').forEach((f) => console.log(f.clave + ' = ' + String(f.valor).substring(0, 100))); return; }
    if (valor === undefined) { console.log(a.evaluar('cfg_(' + JSON.stringify(clave) + ', "(sin valor)")')); return; }
    a.evaluar('conBloqueo_(function () { ponerConfig_(' + JSON.stringify(clave) + ', ' + JSON.stringify(valor) + '); }); renovarCacheCompartida_();');
    console.log(clave + ' = ' + valor);
  },

  'reiniciar-clave'(correo) {
    if (!correo) salir('Indique el correo.');
    const bd = abrir(DATOS);
    const r = app(bd).evaluar('(function (c) { return conBloqueo_(function () { olvidar_("Usuarios"); var u = usuario_(c); if (!u) throw new Error("Usuario no encontrado: " + c); var k = claveInicial_(u.nombre); actualizar_("Usuarios", u._fila, { codigo: k, clave_hash: "", sal: "", cambiar_clave: "SI", intentos: "0", bloqueo: "" }); return k; }); })(' + JSON.stringify(correo) + ')');
    console.log('Clave inicial de ' + correo + ': ' + r + '  (la cambiará al ingresar)');
  },

  'exportar-datos'(archivo) {
    if (!archivo) salir('Indique el archivo .xlsx de salida.');
    const bd = abrir(DATOS);
    fs.writeFileSync(archivo, escribirXlsx(hojasDelLibro(bd)));
    console.log('Escrito ' + archivo + ' (incluye huellas de contraseñas: guárdelo con cuidado).');
  },

  'respaldo-bd'(archivo) {
    if (!archivo) salir('Indique el archivo de destino.');
    const bd = abrir(DATOS);
    if (fs.existsSync(archivo)) fs.rmSync(archivo);
    bd.db.exec("VACUUM INTO '" + path.resolve(archivo).replace(/'/g, "''") + "'");
    console.log('Base copiada en ' + archivo);
  },

  ejecutar(funcion) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(String(funcion || ''))) salir('Indique una función pública (sin guion bajo), por ejemplo cargarPadron.');
    const bd = abrir(DATOS);
    const r = app(bd).llamar(funcion);
    if (r !== null && r !== undefined) console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 2));
  },

  recargar() { const bd = abrir(DATOS); app(bd).evaluar('renovarCacheCompartida_()'); bd.q("DELETE FROM cache WHERE k LIKE 'hoja_%' OR k LIKE 'tablero%' OR k LIKE 'clase%'").run(); console.log('Cache renovada.'); },

  estado() {
    const bd = abrir(DATOS);
    const id = hojaId(bd);
    console.log('Versión del servidor: ' + VERSION_SERVIDOR + '\nCarpeta de datos: ' + DATOS + '\nInstalada: ' + (id ? 'sí' : 'no'));
    if (!id) return;
    bd.q('SELECT nombre FROM hojas WHERE libro = ? ORDER BY orden').all(id).forEach((h) => {
      const n = bd.q('SELECT COUNT(*) c FROM filas WHERE libro = ? AND hoja = ?').get(id, h.nombre).c;
      console.log('  ' + h.nombre.padEnd(20) + Math.max(0, n - 1) + ' filas');
    });
    const a = bd.q('SELECT COUNT(*) c, COALESCE(SUM(tam), 0) t FROM archivos WHERE papelera = 0').get();
    console.log('Archivos: ' + a.c + ' (' + (a.t / 1048576).toFixed(1) + ' MB)');
  }
};

const [orden, ...args] = process.argv.slice(2);
if (!orden || !ordenes[orden]) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 18).map((l) => l.replace(/^ \*\/?\s?/, '')).join('\n'));
  process.exit(orden ? 1 : 0);
}
try { ordenes[orden](...args); } catch (e) { salir(e.message); }

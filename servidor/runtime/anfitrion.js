'use strict';
/**
 * Funciones del servidor que el codigo de la aplicacion puede usar a traves de SERVIDOR_
 * (solo existen en la version 2; en Apps Script SERVIDOR_ no esta definido).
 */
const { escribirXlsx } = require('./xlsx');

// Columnas que nunca salen del servidor en una descarga
const OCULTAS = { Usuarios: ['clave_hash', 'sal', 'bloqueo', 'intentos'] };

function hojasDelLibro(bd) {
  const p = bd.q('SELECT v FROM props WHERE k = ?').get('HOJA_ID');
  if (!p) return [];
  return bd.q('SELECT nombre FROM hojas WHERE libro = ? ORDER BY orden').all(p.v).map((h) => {
    const filas = [];
    bd.q('SELECT n, v FROM filas WHERE libro = ? AND hoja = ? ORDER BY n').all(p.v, h.nombre).forEach((f) => {
      while (filas.length < f.n - 1) filas.push([]);
      filas[f.n - 1] = JSON.parse(f.v);
    });
    return { nombre: h.nombre, filas };
  });
}

function crearAnfitrion(bd, version) {
  return {
    version,
    exportarXlsx() {
      const hojas = hojasDelLibro(bd).map((h) => {
        const ocultas = OCULTAS[h.nombre] || [];
        if (!ocultas.length || !h.filas.length) return h;
        const cab = h.filas[0] || [];
        const idx = ocultas.map((c) => cab.indexOf(c)).filter((i) => i >= 0);
        return { nombre: h.nombre, filas: h.filas.map((f, r) => (r === 0 ? f : f.map((v, j) => (idx.includes(j) && v !== '' ? '(oculto)' : v)))) };
      });
      const fecha = new Date().toISOString().substring(0, 10);
      return { nombre: 'QuieroSerIngeniero_datos_' + fecha + '.xlsx', base64: escribirXlsx(hojas).toString('base64') };
    }
  };
}

module.exports = { crearAnfitrion, hojasDelLibro };

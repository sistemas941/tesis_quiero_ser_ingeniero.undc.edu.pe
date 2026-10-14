'use strict';
/**
 * Base de datos SQLite (modulo node:sqlite, sin dependencias nativas que compilar).
 * Guarda lo que en la version 1 estaba en Google: las pestanas de la hoja de calculo, la cache,
 * las propiedades del script y el indice de archivos. Los archivos mismos van a la carpeta de datos.
 *
 * La base trabaja en modo WAL: varios procesos leen a la vez y uno escribe. El bloqueo de Apps Script
 * (LockService) se implementa como una transaccion BEGIN IMMEDIATE, que excluye a otros escritores
 * de cualquier proceso (servidor, trabajadores y herramientas de linea de comandos).
 */
const path = require('path');
const fs = require('fs');

process.removeAllListeners('warning');
process.on('warning', (w) => { if (!/SQLite is an experimental/.test(String(w && w.message))) console.warn(w); });
const { DatabaseSync } = require('node:sqlite');

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS libros (id TEXT PRIMARY KEY, nombre TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS hojas (libro TEXT NOT NULL, nombre TEXT NOT NULL, orden INTEGER NOT NULL, max_filas INTEGER NOT NULL DEFAULT 1000, max_cols INTEGER NOT NULL DEFAULT 26, PRIMARY KEY (libro, nombre));
CREATE TABLE IF NOT EXISTS filas (libro TEXT NOT NULL, hoja TEXT NOT NULL, n INTEGER NOT NULL, v TEXT NOT NULL, PRIMARY KEY (libro, hoja, n));
CREATE TABLE IF NOT EXISTS cache (k TEXT PRIMARY KEY, v TEXT NOT NULL, expira INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS props (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS carpetas (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, padre TEXT);
CREATE TABLE IF NOT EXISTS archivos (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, mime TEXT NOT NULL, carpeta TEXT, tipo TEXT NOT NULL DEFAULT 'archivo', tam INTEGER NOT NULL DEFAULT 0, creado TEXT NOT NULL, actualizado TEXT NOT NULL, papelera INTEGER NOT NULL DEFAULT 0, copia_de TEXT);
CREATE INDEX IF NOT EXISTS cache_expira ON cache (expira);
`;

function abrir(dirDatos) {
  fs.mkdirSync(dirDatos, { recursive: true });
  fs.mkdirSync(path.join(dirDatos, 'archivos'), { recursive: true });
  const db = new DatabaseSync(path.join(dirDatos, 'qsi.sqlite'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 30000; PRAGMA foreign_keys = OFF;');
  db.exec(ESQUEMA);
  const sentencias = new Map();
  const bd = {
    db,
    dir: dirDatos,
    /** Sentencia preparada y reutilizada. */
    q(sql) { let s = sentencias.get(sql); if (!s) { s = db.prepare(sql); sentencias.set(sql, s); } return s; },
    /** Ejecuta fn dentro de una transaccion (o dentro de la que ya esta abierta). */
    transaccion(fn) {
      if (db.isTransaction) return fn();
      db.exec('BEGIN IMMEDIATE');
      try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { try { db.exec('ROLLBACK'); } catch (e2) { /* ya cerrada */ } throw e; }
    },
    // ---- bloqueo de Apps Script (reentrante dentro del mismo proceso)
    profundidad: 0,
    bloquear(ms) {
      if (bd.profundidad > 0) { bd.profundidad++; return; }
      if (db.isTransaction) db.exec('COMMIT');
      db.exec('PRAGMA busy_timeout = ' + Math.max(1000, Math.min(Number(ms) || 30000, 120000)));
      try { db.exec('BEGIN IMMEDIATE'); } catch (e) {
        throw new Error('No se pudo obtener el bloqueo: el servidor está ocupado. Intenta de nuevo en un momento.');
      } finally { db.exec('PRAGMA busy_timeout = 30000'); }
      bd.profundidad = 1;
    },
    liberar() {
      if (bd.profundidad <= 0) return;
      bd.profundidad--;
      if (bd.profundidad === 0 && db.isTransaction) db.exec('COMMIT');
    },
    /** Al terminar cada peticion: nunca queda un bloqueo abierto. */
    cerrarPendientes() { bd.profundidad = 0; if (db.isTransaction) { try { db.exec('COMMIT'); } catch (e) { try { db.exec('ROLLBACK'); } catch (e2) { /* nada */ } } } },
    limpiarCache() { bd.q('DELETE FROM cache WHERE expira < ?').run(Date.now()); },
    cerrar() { bd.cerrarPendientes(); db.close(); }
  };
  return bd;
}

module.exports = { abrir };

'use strict';
/**
 * Servicios de Google Apps Script implementados en el servidor propio.
 * El codigo de la aplicacion (dist/Codigo.gs) se ejecuta sin cambios sobre estos objetos:
 *   SpreadsheetApp -> tablas de SQLite          CacheService, PropertiesService -> SQLite
 *   LockService    -> transaccion de SQLite     DriveApp -> carpeta de datos en disco
 *   DocumentApp    -> archivos .docx reales     UrlFetchApp -> proceso auxiliar con fetch
 *   HtmlService    -> plantillas de dist/       Utilities, Session, Logger, ScriptApp
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { crearZip, leerZip } = require('./zip');
const { crearDocumentApp } = require('./docx');

const TZ = 'America/Lima';
// Propiedades que se leen de las variables de entorno (archivo .env) y nunca de la base
const PROPS_ENTORNO = ['GEMINI_API_KEY', 'CONSENSUS_API_KEY', 'OPENALEX_API_KEY', 'MIGRACION_SECRETO'];

function ahoraTexto() { return new Date().toISOString(); }
function nuevoId() { return crypto.randomBytes(16).toString('hex'); }
function conSigno(buf) { return Array.from(buf, (b) => (b > 127 ? b - 256 : b)); }
function aBuffer(x, charset) {
  if (x === null || x === undefined) return Buffer.alloc(0);
  if (Buffer.isBuffer(x)) return x;
  if (typeof x === 'string') return Buffer.from(x, 'utf8');
  if (x instanceof Uint8Array) return Buffer.from(x);
  if (Array.isArray(x) || (typeof x === 'object' && typeof x.length === 'number')) return Buffer.from(Array.from(x, (b) => b & 255));
  if (typeof x.getBytes === 'function') return aBuffer(x.getBytes());
  return Buffer.from(String(x), 'utf8');
}

/** Blob compatible con Apps Script. */
class Blob {
  constructor(datos, mime, nombre) { this.datos = aBuffer(datos); this.mime = mime || 'application/octet-stream'; this.nombre = nombre || null; }
  getBytes() { return this.datos; }
  getContentType() { return this.mime; }
  setContentType(m) { this.mime = m; return this; }
  getName() { return this.nombre; }
  setName(n) { this.nombre = n; return this; }
  getDataAsString() { return this.datos.toString('utf8'); }
  setDataFromString(s) { this.datos = Buffer.from(String(s), 'utf8'); return this; }
  copyBlob() { return new Blob(Buffer.from(this.datos), this.mime, this.nombre); }
  getBlob() { return this; }
  isGoogleType() { return false; }
}

/** Objeto que acepta cualquier metodo set*/
function tolerante(obj) {
  return new Proxy(obj, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'string' && /^(set|auto|hide|show|protect|activate|clearFormat|clearNote|merge|apply|sort|trim)/.test(k)) return function () { return this; };
      return undefined;
    }
  });
}

function formatDate(d, tz, fmt) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz || TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const p = {};
  f.formatToParts(new Date(d.getTime ? d.getTime() : d)).forEach((x) => { p[x.type] = x.value; });
  return String(fmt).replace(/yyyy|yy|MM|dd|HH|mm|ss|SSS/g, (t) => ({ yyyy: p.year, yy: p.year.slice(2), MM: p.month, dd: p.day, HH: p.hour, mm: p.minute, ss: p.second, SSS: '000' }[t]));
}

/**
 * opciones: { bd, dist, usuarioActivo, propietario, simuladorFetch, log }
 */
function crearServicios(op) {
  const bd = op.bd;
  const dirArch = path.join(bd.dir, 'archivos');
  const q = (s) => bd.q(s);

  // ---------------------------------------------------------------- Utilities
  const espera = new Int32Array(new SharedArrayBuffer(4));
  const Utilities = {
    DigestAlgorithm: { MD2: 'md2', MD5: 'md5', SHA_1: 'sha1', SHA_256: 'sha256', SHA_384: 'sha384', SHA_512: 'sha512' },
    MacAlgorithm: { HMAC_MD5: 'md5', HMAC_SHA_1: 'sha1', HMAC_SHA_256: 'sha256', HMAC_SHA_384: 'sha384', HMAC_SHA_512: 'sha512' },
    Charset: { UTF_8: 'utf8', US_ASCII: 'ascii' },
    getUuid: () => crypto.randomUUID(),
    formatDate,
    sleep: (ms) => { Atomics.wait(espera, 0, 0, Math.max(0, Math.min(Number(ms) || 0, 60000))); },
    computeDigest: (alg, valor) => conSigno(crypto.createHash(alg === 'md2' ? 'md5' : alg).update(aBuffer(valor)).digest()),
    computeHmacSha256Signature: (valor, clave) => conSigno(crypto.createHmac('sha256', aBuffer(clave)).update(aBuffer(valor)).digest()),
    computeHmacSignature: (alg, valor, clave) => conSigno(crypto.createHmac(alg, aBuffer(clave)).update(aBuffer(valor)).digest()),
    base64Encode: (x) => aBuffer(x).toString('base64'),
    base64EncodeWebSafe: (x) => aBuffer(x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    base64Decode: (s) => Buffer.from(String(s || ''), 'base64'),
    base64DecodeWebSafe: (s) => Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64'),
    newBlob: (datos, mime, nombre) => new Blob(datos, mime, nombre),
    zip: (blobs, nombre) => new Blob(crearZip(blobs.map((b) => ({ nombre: b.getName(), datos: b.getBytes() }))), 'application/zip', nombre || null),
    unzip: (blob) => leerZip(blob.getBytes()).map((p) => new Blob(p.datos, /\.xml$|\.rels$/.test(p.nombre) ? 'application/xml' : 'application/octet-stream', p.nombre)),
    jsonStringify: (o) => JSON.stringify(o),
    jsonParse: (s) => JSON.parse(s)
  };

  // ---------------------------------------------------------------- Session, Logger, ScriptApp
  const usuario = (c) => ({ getEmail: () => c || '', toString: () => c || '' });
  const Session = {
    getActiveUser: () => usuario(op.usuarioActivo || ''),
    getEffectiveUser: () => usuario(op.propietario || ''),
    getScriptTimeZone: () => TZ,
    getTemporaryActiveUserKey: () => ''
  };
  const Logger = { log: (...a) => { (op.log || console.log)(a.map(String).join(' ')); return Logger; }, getLog: () => '', clear: () => {} };
  const ScriptApp = { getOAuthToken: () => 'servidor-propio', getScriptId: () => 'servidor-propio', getService: () => ({ getUrl: () => op.urlPublica || '' }) };

  // ---------------------------------------------------------------- PropertiesService
  function almacenProps() {
    return {
      getProperty: (k) => { if (PROPS_ENTORNO.includes(k) && process.env[k]) return process.env[k]; const r = q('SELECT v FROM props WHERE k = ?').get(String(k)); return r ? r.v : null; },
      setProperty(k, v) { q('INSERT INTO props (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v').run(String(k), String(v)); return this; },
      deleteProperty(k) { q('DELETE FROM props WHERE k = ?').run(String(k)); return this; },
      getProperties: () => { const o = {}; q('SELECT k, v FROM props').all().forEach((r) => { o[r.k] = r.v; }); return o; },
      setProperties(m) { bd.transaccion(() => Object.keys(m).forEach((k) => this.setProperty(k, m[k]))); return this; },
      getKeys: () => q('SELECT k FROM props').all().map((r) => r.k)
    };
  }
  const PropertiesService = { getScriptProperties: almacenProps, getUserProperties: almacenProps, getDocumentProperties: almacenProps };

  // ---------------------------------------------------------------- CacheService
  const MAXV = 100 * 1024;
  function cache() {
    const ttlMs = (t) => 1000 * Math.max(1, Math.min(Number(t) || 600, 21600));
    const poner = (k, v, t) => {
      v = String(v);
      if (Buffer.byteLength(v, 'utf8') > MAXV) throw new Error('Argumento demasiado grande: value');
      q('INSERT INTO cache (k, v, expira) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, expira = excluded.expira').run(String(k), v, Date.now() + ttlMs(t));
    };
    return {
      get: (k) => { const r = q('SELECT v, expira FROM cache WHERE k = ?').get(String(k)); return r && r.expira > Date.now() ? r.v : null; },
      getAll: (ks) => { const o = {}; const ahora = Date.now(); ks.forEach((k) => { const r = q('SELECT v, expira FROM cache WHERE k = ?').get(String(k)); if (r && r.expira > ahora) o[k] = r.v; }); return o; },
      put: (k, v, t) => { poner(k, v, t); },
      putAll: (m, t) => { Object.keys(m).forEach((k) => { if (Buffer.byteLength(String(m[k]), 'utf8') > MAXV) throw new Error('Argumento demasiado grande: value'); }); bd.transaccion(() => Object.keys(m).forEach((k) => poner(k, m[k], t))); },
      remove: (k) => { q('DELETE FROM cache WHERE k = ?').run(String(k)); },
      removeAll: (ks) => { bd.transaccion(() => ks.forEach((k) => q('DELETE FROM cache WHERE k = ?').run(String(k)))); }
    };
  }
  const CacheService = { getScriptCache: cache, getUserCache: cache, getDocumentCache: cache };

  // ---------------------------------------------------------------- LockService
  function candado() {
    let tengo = false;
    return {
      waitLock: (ms) => { bd.bloquear(ms); tengo = true; },
      tryLock: (ms) => { try { bd.bloquear(ms); tengo = true; return true; } catch (e) { return false; } },
      releaseLock: () => { if (tengo) { bd.liberar(); tengo = false; } },
      hasLock: () => tengo
    };
  }
  const LockService = { getScriptLock: candado, getUserLock: candado, getDocumentLock: candado };

  // ---------------------------------------------------------------- SpreadsheetApp
  function leerFila(libro, hoja, n) { const r = q('SELECT v FROM filas WHERE libro = ? AND hoja = ? AND n = ?').get(libro, hoja, n); return r ? JSON.parse(r.v) : []; }
  function escribirFila(libro, hoja, n, fila) {
    let k = fila.length;
    while (k > 0 && (fila[k - 1] === '' || fila[k - 1] === null || fila[k - 1] === undefined)) k--;
    if (!k) { q('DELETE FROM filas WHERE libro = ? AND hoja = ? AND n = ?').run(libro, hoja, n); return; }
    const v = fila.slice(0, k).map((x) => (x === null || x === undefined ? '' : x));
    q('INSERT INTO filas (libro, hoja, n, v) VALUES (?, ?, ?, ?) ON CONFLICT(libro, hoja, n) DO UPDATE SET v = excluded.v').run(libro, hoja, n, JSON.stringify(v));
  }
  function valorCelda(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v.charAt(0) === "'" ? v.substring(1) : v;   // el apostrofo inicial es un marcador, como en Hojas
    if (typeof v === 'number' || typeof v === 'boolean') return v;
    if (v && typeof v.getTime === 'function') return formatDate(v, TZ, 'yyyy-MM-dd HH:mm:ss');
    return String(v);
  }
  function desplazar(libro, hoja, desde, delta) {
    // Dos pasos (negativo y vuelta) para no chocar con la clave primaria mientras se mueven las filas
    q('UPDATE filas SET n = -(n + ?) WHERE libro = ? AND hoja = ? AND n >= ?').run(delta, libro, hoja, desde);
    q('UPDATE filas SET n = -n WHERE libro = ? AND hoja = ? AND n < 0').run(libro, hoja);
  }
  function a1(ref) {
    const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i.exec(String(ref).replace(/^.*!/, '').replace(/\$/g, ''));
    if (!m) throw new Error('Rango no admitido: ' + ref);
    const col = (s) => s.toUpperCase().split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
    const r1 = +m[2], c1 = col(m[1]), r2 = m[4] ? +m[4] : r1, c2 = m[3] ? col(m[3]) : c1;
    return [Math.min(r1, r2), Math.min(c1, c2), Math.abs(r2 - r1) + 1, Math.abs(c2 - c1) + 1];
  }

  function Rango(h, r, c, nr, nc) {
    const self = tolerante({
      getRow: () => r, getColumn: () => c, getNumRows: () => nr, getNumColumns: () => nc, getSheet: () => h,
      getValues() {
        const filas = q('SELECT n, v FROM filas WHERE libro = ? AND hoja = ? AND n BETWEEN ? AND ?').all(h._libro, h._nombre, r, r + nr - 1);
        const mapa = new Map(filas.map((f) => [f.n, JSON.parse(f.v)]));
        const o = [];
        for (let i = 0; i < nr; i++) { const f = mapa.get(r + i) || []; const fila = []; for (let j = 0; j < nc; j++) { const v = f[c - 1 + j]; fila.push(v === undefined ? '' : v); } o.push(fila); }
        return o;
      },
      getDisplayValues() { return self.getValues().map((f) => f.map((v) => String(v))); },
      getValue() { return self.getValues()[0][0]; },
      getDisplayValue() { return String(self.getValue()); },
      getFormulas() { return Array.from({ length: nr }, () => Array.from({ length: nc }, () => '')); },
      setValues(vals) {
        if (!Array.isArray(vals) || vals.length !== nr || vals.some((f) => !f || f.length !== nc)) throw new Error('Las dimensiones de los datos no coinciden con las del rango (' + nr + 'x' + nc + ') en ' + h._nombre + '.');
        h._crecer(r + nr - 1);
        bd.transaccion(() => {
          for (let i = 0; i < nr; i++) {
            const f = leerFila(h._libro, h._nombre, r + i);
            for (let j = 0; j < nc; j++) { while (f.length < c - 1 + j) f.push(''); f[c - 1 + j] = valorCelda(vals[i][j]); }
            escribirFila(h._libro, h._nombre, r + i, f);
          }
        });
        return self;
      },
      setValue(v) { return self.setValues(Array.from({ length: nr }, () => Array.from({ length: nc }, () => v))); },
      clearContent() {
        bd.transaccion(() => {
          for (let i = 0; i < nr; i++) {
            const f = leerFila(h._libro, h._nombre, r + i);
            if (!f.length) continue;
            for (let j = 0; j < nc; j++) { if (f.length > c - 1 + j) f[c - 1 + j] = ''; }
            escribirFila(h._libro, h._nombre, r + i, f);
          }
        });
        return self;
      },
      clear() { return self.clearContent(); },
      getA1Notation() { const L = (n) => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }; return L(c) + r + ':' + L(c + nc - 1) + (r + nr - 1); }
    });
    return self;
  }

  function Hoja(libro, nombre) {
    const meta = () => q('SELECT * FROM hojas WHERE libro = ? AND nombre = ?').get(libro, h._nombre);
    const h = tolerante({
      _libro: libro, _nombre: nombre,
      _crecer(n) { const m = meta(); if (m && n > m.max_filas) q('UPDATE hojas SET max_filas = ? WHERE libro = ? AND nombre = ?').run(n, libro, h._nombre); },
      getName: () => h._nombre,
      setName(n) {
        n = String(n);
        bd.transaccion(() => { q('UPDATE hojas SET nombre = ? WHERE libro = ? AND nombre = ?').run(n, libro, h._nombre); q('UPDATE filas SET hoja = ? WHERE libro = ? AND hoja = ?').run(n, libro, h._nombre); });
        h._nombre = n; return h;
      },
      getSheetId: () => meta().orden,
      getIndex: () => meta().orden,
      getParent: () => Libro(libro),
      getMaxRows: () => meta().max_filas,
      getMaxColumns: () => meta().max_cols,
      getLastRow: () => { const r = q('SELECT MAX(n) m FROM filas WHERE libro = ? AND hoja = ?').get(libro, h._nombre); return r && r.m ? r.m : 0; },
      getLastColumn: () => { let m = 0; q('SELECT v FROM filas WHERE libro = ? AND hoja = ?').all(libro, h._nombre).forEach((f) => { const l = JSON.parse(f.v).length; if (l > m) m = l; }); return m; },
      getDataRange() {
        const filas = q('SELECT n, v FROM filas WHERE libro = ? AND hoja = ? ORDER BY n').all(libro, h._nombre);
        let nc = 0; const nr = filas.length ? filas[filas.length - 1].n : 0;
        filas.forEach((f) => { f.a = JSON.parse(f.v); if (f.a.length > nc) nc = f.a.length; });
        const datos = Array.from({ length: nr }, () => null);
        filas.forEach((f) => { datos[f.n - 1] = f.a; });
        // Rango ya leido: getValues no vuelve a consultar la base
        const rg = Rango(h, 1, 1, Math.max(nr, 1), Math.max(nc, 1));
        rg.getValues = () => (nr === 0 ? [['']] : datos.map((f) => { const o = []; for (let j = 0; j < nc; j++) { const v = f ? f[j] : undefined; o.push(v === undefined ? '' : v); } return o; }));
        return rg;
      },
      getRange(a, b, c, d) {
        if (typeof a === 'string') { const x = a1(a); return Rango(h, x[0], x[1], x[2], x[3]); }
        if (!(a >= 1) || !(b >= 1)) throw new Error('Las coordenadas del rango no son válidas.');
        return Rango(h, a, b, c || 1, d || 1);
      },
      appendRow(f) {
        bd.transaccion(() => { const r = h.getLastRow() + 1; h._crecer(r); escribirFila(libro, h._nombre, r, f.map(valorCelda)); });
        return h;
      },
      insertRowsAfter(despues, n) { bd.transaccion(() => { desplazar(libro, h._nombre, despues + 1, n); q('UPDATE hojas SET max_filas = max_filas + ? WHERE libro = ? AND nombre = ?').run(n, libro, h._nombre); }); return h; },
      insertRowsBefore(antes, n) { return h.insertRowsAfter(antes - 1, n); },
      insertRows(antes, n) { return h.insertRowsAfter(antes - 1, n || 1); },
      deleteRows(r, n) {
        bd.transaccion(() => {
          q('DELETE FROM filas WHERE libro = ? AND hoja = ? AND n BETWEEN ? AND ?').run(libro, h._nombre, r, r + n - 1);
          desplazar(libro, h._nombre, r + n, -n);
          q('UPDATE hojas SET max_filas = MAX(1, max_filas - ?) WHERE libro = ? AND nombre = ?').run(n, libro, h._nombre);
        });
        return h;
      },
      deleteRow(r) { return h.deleteRows(r, 1); },
      insertColumnsAfter(despues, n) { q('UPDATE hojas SET max_cols = max_cols + ? WHERE libro = ? AND nombre = ?').run(n, libro, h._nombre); return h; },
      clear() { q('DELETE FROM filas WHERE libro = ? AND hoja = ?').run(libro, h._nombre); return h; },
      clearContents() { return h.clear(); },
      getFrozenRows: () => 1
    });
    return h;
  }

  function Libro(id) {
    const l = tolerante({
      getId: () => id,
      getName: () => (q('SELECT nombre FROM libros WHERE id = ?').get(id) || {}).nombre || '',
      rename(n) { q('UPDATE libros SET nombre = ? WHERE id = ?').run(String(n), id); },
      // La hoja de calculo no tiene pagina propia en el servidor: el administrador descarga un Excel
      getUrl: () => (op.urlPublica || '') + '/admin/datos',
      getSheetByName: (n) => (q('SELECT nombre FROM hojas WHERE libro = ? AND nombre = ?').get(id, String(n)) ? Hoja(id, String(n)) : null),
      getSheets: () => q('SELECT nombre FROM hojas WHERE libro = ? ORDER BY orden').all(id).map((r) => Hoja(id, r.nombre)),
      insertSheet(n) {
        n = n === undefined ? 'Hoja' + (q('SELECT COUNT(*) c FROM hojas WHERE libro = ?').get(id).c + 1) : String(n);
        if (q('SELECT 1 FROM hojas WHERE libro = ? AND nombre = ?').get(id, n)) throw new Error('Ya existe una hoja con el nombre «' + n + '».');
        const o = (q('SELECT MAX(orden) m FROM hojas WHERE libro = ?').get(id).m || 0) + 1;
        q('INSERT INTO hojas (libro, nombre, orden) VALUES (?, ?, ?)').run(id, n, o);
        return Hoja(id, n);
      },
      deleteSheet(h) { bd.transaccion(() => { q('DELETE FROM filas WHERE libro = ? AND hoja = ?').run(id, h.getName()); q('DELETE FROM hojas WHERE libro = ? AND nombre = ?').run(id, h.getName()); }); },
      getSpreadsheetTimeZone: () => TZ
    });
    return l;
  }

  const SpreadsheetApp = {
    flush: () => {},
    getActiveSpreadsheet: () => null,
    getActive: () => null,
    openById(id) { if (!q('SELECT 1 FROM libros WHERE id = ?').get(String(id))) throw new Error('No se encontró la hoja de cálculo ' + id); return Libro(String(id)); },
    create(nombre) { const id = 'libro_' + nuevoId(); q('INSERT INTO libros (id, nombre) VALUES (?, ?)').run(id, String(nombre || 'Libro')); Libro(id).insertSheet('Hoja 1'); return Libro(id); }
  };

  // ---------------------------------------------------------------- DriveApp (carpeta de datos)
  const RAIZ = 'raiz';
  if (!q('SELECT 1 FROM carpetas WHERE id = ?').get(RAIZ)) q('INSERT OR IGNORE INTO carpetas (id, nombre, padre) VALUES (?, ?, NULL)').run(RAIZ, 'Mi unidad');
  const rutaArchivo = (id) => { if (!/^[A-Za-z0-9_-]{6,120}$/.test(id)) throw new Error('Identificador de archivo no válido.'); return path.join(dirArch, id); };
  function registrarArchivo(id, nombre, mime, carpeta, tipo, datos, copiaDe) {
    fs.writeFileSync(rutaArchivo(id), datos);
    const t = ahoraTexto();
    q('INSERT INTO archivos (id, nombre, mime, carpeta, tipo, tam, creado, actualizado, papelera, copia_de) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?) ON CONFLICT(id) DO UPDATE SET nombre = excluded.nombre, mime = excluded.mime, tam = excluded.tam, actualizado = excluded.actualizado, papelera = 0')
      .run(id, String(nombre || 'archivo'), mime, carpeta || RAIZ, tipo || 'archivo', datos.length, t, t, copiaDe || null);
  }
  const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  function Archivo(id) {
    const meta = () => q('SELECT * FROM archivos WHERE id = ?').get(id);
    const a = tolerante({
      getId: () => id,
      getName: () => meta().nombre,
      setName(n) { q('UPDATE archivos SET nombre = ? WHERE id = ?').run(String(n), id); return a; },
      getMimeType: () => (meta().tipo === 'doc' ? 'application/vnd.google-apps.document' : meta().mime),
      getSize: () => meta().tam,
      getDateCreated: () => new Date(meta().creado),
      getLastUpdated: () => new Date(meta().actualizado),
      getBlob: () => { const m = meta(); return new Blob(fs.readFileSync(rutaArchivo(id)), m.tipo === 'doc' ? MIME_DOCX : m.mime, m.nombre + (m.tipo === 'doc' ? '.docx' : '')); },
      getAs: () => a.getBlob(),
      getUrl: () => (meta().tipo === 'doc' ? 'https://docs.google.com/document/d/' + id + '/edit' : (op.urlPublica || '') + '/archivo/' + id),
      getDownloadUrl: () => (op.urlPublica || '') + '/archivo/' + id,
      setTrashed(v) { q('UPDATE archivos SET papelera = ? WHERE id = ?').run(v ? 1 : 0, id); return a; },
      isTrashed: () => !!meta().papelera,
      moveTo(c) { q('UPDATE archivos SET carpeta = ? WHERE id = ?').run(c.getId(), id); return a; },
      makeCopy(nombre, carpeta) {
        const m = meta(), nid = nuevoId();
        registrarArchivo(nid, nombre || ('Copia de ' + m.nombre), m.mime, carpeta ? carpeta.getId() : m.carpeta, m.tipo, fs.readFileSync(rutaArchivo(id)), id);
        return Archivo(nid);
      },
      addViewer() { return a; }, addViewers() { return a; }, addEditor() { return a; }, removeViewer() { return a; },
      setSharing() { return a; },
      getParents: () => { const c = meta().carpeta; let dado = false; return { hasNext: () => !dado, next: () => { dado = true; return Carpeta(c); } }; }
    });
    return a;
  }
  function iterador(l) { let i = 0; return { hasNext: () => i < l.length, next: () => { if (i >= l.length) throw new Error('No hay más elementos.'); return l[i++]; } }; }
  function Carpeta(id) {
    const c = tolerante({
      getId: () => id,
      getName: () => (q('SELECT nombre FROM carpetas WHERE id = ?').get(id) || {}).nombre,
      setName(n) { q('UPDATE carpetas SET nombre = ? WHERE id = ?').run(String(n), id); return c; },
      createFolder(n) { const nid = nuevoId(); q('INSERT INTO carpetas (id, nombre, padre) VALUES (?, ?, ?)').run(nid, String(n), id); return Carpeta(nid); },
      createFile(b, contenido, mime) {
        if (typeof b === 'string') b = new Blob(contenido || '', mime || 'text/plain', b);
        const nid = nuevoId();
        registrarArchivo(nid, b.getName() || 'archivo', b.getContentType() || 'application/octet-stream', id, 'archivo', b.getBytes());
        return Archivo(nid);
      },
      getFoldersByName: (n) => iterador(q('SELECT id FROM carpetas WHERE padre = ? AND nombre = ?').all(id, String(n)).map((r) => Carpeta(r.id))),
      getFolders: () => iterador(q('SELECT id FROM carpetas WHERE padre = ?').all(id).map((r) => Carpeta(r.id))),
      getFilesByName: (n) => iterador(q('SELECT id FROM archivos WHERE carpeta = ? AND nombre = ? AND papelera = 0').all(id, String(n)).map((r) => Archivo(r.id))),
      getFiles: () => iterador(q('SELECT id FROM archivos WHERE carpeta = ? AND papelera = 0').all(id).map((r) => Archivo(r.id))),
      addFile(f) { f.moveTo(c); return c; },
      setSharing() { return c; }, addViewer() { return c; }, addEditor() { return c; }
    });
    return c;
  }
  const DriveApp = {
    Access: { ANYONE: 'ANYONE', ANYONE_WITH_LINK: 'ANYONE_WITH_LINK', DOMAIN: 'DOMAIN', DOMAIN_WITH_LINK: 'DOMAIN_WITH_LINK', PRIVATE: 'PRIVATE' },
    Permission: { VIEW: 'VIEW', EDIT: 'EDIT', COMMENT: 'COMMENT', NONE: 'NONE' },
    getRootFolder: () => Carpeta(RAIZ),
    getFolderById(id) { if (!q('SELECT 1 FROM carpetas WHERE id = ?').get(String(id))) throw new Error('No se encontró la carpeta ' + id); return Carpeta(String(id)); },
    createFolder: (n) => Carpeta(RAIZ).createFolder(n),
    createFile: (b, contenido, mime) => Carpeta(RAIZ).createFile(b, contenido, mime),
    getFileById(id) {
      id = String(id);
      const m = /^[A-Za-z0-9_-]{6,120}$/.test(id) ? q('SELECT papelera FROM archivos WHERE id = ?').get(id) : null;
      if (!m || !fs.existsSync(path.join(dirArch, id))) throw new Error('No se encontró el archivo con el identificador ' + id + ' o no tienes permiso para acceder a él.');
      return Archivo(id);
    }
  };

  // ---------------------------------------------------------------- DocumentApp (.docx)
  const DocumentApp = crearDocumentApp({
    nuevoId,
    existe: (id) => (/^[A-Za-z0-9_-]{6,120}$/.test(String(id)) ? q('SELECT * FROM archivos WHERE id = ? AND papelera = 0').get(String(id)) : null),
    guardarDoc: (id, nombre, bytes) => { const m = q('SELECT carpeta FROM archivos WHERE id = ?').get(id); registrarArchivo(id, nombre, MIME_DOCX, m ? m.carpeta : RAIZ, 'doc', bytes); }
  });

  // ---------------------------------------------------------------- UrlFetchApp
  function respuesta(codigo, cabeceras, cuerpo) {
    const ct = cabeceras['content-type'] || 'application/octet-stream';
    return {
      getResponseCode: () => codigo,
      getContentText: () => cuerpo.toString('utf8'),
      getContent: () => cuerpo,
      getBlob: () => new Blob(cuerpo, ct.split(';')[0], null),
      getAs: () => new Blob(cuerpo, ct.split(';')[0], null),
      getHeaders: () => Object.assign({}, cabeceras),
      getAllHeaders: () => Object.assign({}, cabeceras)
    };
  }
  function pedido(url, o) {
    o = o || {};
    const cab = {};
    Object.keys(o.headers || {}).forEach((k) => { cab[k] = String(o.headers[k]); });
    let cuerpo = null;
    const metodo = String(o.method || 'get').toUpperCase();
    if (o.payload !== undefined && o.payload !== null) {
      if (typeof o.payload === 'string' || Buffer.isBuffer(o.payload)) {
        cuerpo = aBuffer(o.payload);
        if (!Object.keys(cab).some((k) => k.toLowerCase() === 'content-type')) cab['Content-Type'] = o.contentType || 'application/x-www-form-urlencoded';
      } else if (o.payload && typeof o.payload.getBytes === 'function') {
        cuerpo = o.payload.getBytes(); cab['Content-Type'] = o.contentType || o.payload.getContentType();
      } else {
        cuerpo = Buffer.from(Object.keys(o.payload).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(o.payload[k])).join('&'), 'utf8');
        cab['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }
    if (o.contentType && cuerpo) cab['Content-Type'] = o.contentType;
    return { url: String(url), metodo, cabeceras: cab, cuerpo: cuerpo ? cuerpo.toString('base64') : null, seguir: o.followRedirects !== false, limiteMs: 120000, mudo: !!o.muteHttpExceptions };
  }
  function local(p) {
    // Exportacion de un documento propio (lo que en Google seria docs.google.com/.../export)
    const m = /docs\.google\.com\/document\/d\/([A-Za-z0-9_-]+)\/export\?format=docx/.exec(p.url);
    if (!m) return null;
    const meta = q('SELECT tipo FROM archivos WHERE id = ?').get(m[1]);
    if (!meta) return respuesta(404, { 'content-type': 'text/plain' }, Buffer.from('no existe'));
    return respuesta(200, { 'content-type': MIME_DOCX }, fs.readFileSync(rutaArchivo(m[1])));
  }
  function ejecutar(pedidos) {
    const salida = new Array(pedidos.length);
    const remotos = [];
    pedidos.forEach((p, i) => {
      const l = local(p);
      if (l) salida[i] = l;
      else if (op.simuladorFetch) salida[i] = op.simuladorFetch(p.url, p);
      else remotos.push(i);
    });
    if (remotos.length) {
      const env = Object.assign({}, process.env);
      if (env.HTTPS_PROXY || env.https_proxy) env.NODE_USE_ENV_PROXY = '1';
      const r = spawnSync(process.execPath, [path.join(__dirname, 'fetch_hijo.js')], { input: JSON.stringify(remotos.map((i) => pedidos[i])), maxBuffer: 256 * 1024 * 1024, timeout: 130000, env });
      if (r.error || r.status !== 0) throw new Error('No se pudo conectar con el servicio externo' + (r.error ? ': ' + r.error.message : '.'));
      const res = JSON.parse(r.stdout.toString('utf8'));
      remotos.forEach((i, k) => {
        const x = res[k];
        if (x.error) throw new Error(x.error);
        salida[i] = respuesta(x.codigo, x.cabeceras, Buffer.from(x.cuerpo, 'base64'));
      });
    }
    pedidos.forEach((p, i) => {
      const c = salida[i].getResponseCode();
      if (c >= 400 && !p.mudo) throw new Error('Request failed for ' + p.url.split('?')[0] + ' returned code ' + c + '. Truncated server response: ' + salida[i].getContentText().substring(0, 200));
    });
    return salida;
  }
  const UrlFetchApp = {
    fetch: (url, o) => ejecutar([pedido(url, o)])[0],
    fetchAll: (l) => ejecutar(l.map((x) => (typeof x === 'string' ? pedido(x, {}) : pedido(x.url, x)))),
    getRequest: (url, o) => pedido(url, o)
  };

  // ---------------------------------------------------------------- HtmlService
  function salidaHtml(contenido) {
    const s = {
      contenido: String(contenido), titulo: '', metas: [], marcos: 'DEFAULT',
      setTitle(t) { s.titulo = String(t); return s; }, getTitle: () => s.titulo,
      addMetaTag(n, c) { s.metas.push([n, c]); return s; },
      setXFrameOptionsMode(m) { s.marcos = m; return s; },
      setSandboxMode() { return s; }, setFaviconUrl(u) { s.icono = u; return s; }, setWidth() { return s; }, setHeight() { return s; },
      getContent: () => s.contenido, setContent(c) { s.contenido = String(c); return s; }, append(c) { s.contenido += String(c); return s; }
    };
    return s;
  }
  const leerPlantilla = (n) => fs.readFileSync(path.join(op.dist, n + '.html'), 'utf8');
  const HtmlService = {
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' },
    SandboxMode: { IFRAME: 'IFRAME', NATIVE: 'NATIVE', EMULATED: 'EMULATED' },
    createHtmlOutput: (c) => salidaHtml(c || ''),
    createHtmlOutputFromFile: (n) => salidaHtml(leerPlantilla(n)),
    createTemplate: (t) => plantilla(String(t)),
    createTemplateFromFile: (n) => plantilla(leerPlantilla(n))
  };
  function plantilla(texto) {
    const t = {
      evaluate() {
        const html = texto.replace(/<\?(!?=)?([\s\S]*?)\?>/g, (m, tipo, expr) => {
          if (!tipo) throw new Error('Las plantillas del servidor solo admiten <?= ?> y <?!= ?>.');
          const v = op.evaluar(expr.trim().replace(/;$/, ''), t);
          const s = v === null || v === undefined ? '' : String(v);
          return tipo === '!=' ? s : s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        });
        return salidaHtml(html);
      }
    };
    return t;
  }

  return { Utilities, Session, Logger, ScriptApp, PropertiesService, CacheService, LockService, SpreadsheetApp, DriveApp, DocumentApp, UrlFetchApp, HtmlService, Blob, _registrarArchivo: registrarArchivo, _rutaArchivo: rutaArchivo };
}

module.exports = { crearServicios, Blob, formatDate, nuevoId };

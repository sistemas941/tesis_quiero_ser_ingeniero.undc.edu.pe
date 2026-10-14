'use strict';
/**
 * ¡Quiero ser Ingeniero! - version 2 (servidor propio).
 *
 * Servidor HTTP sin dependencias externas. Sirve la misma pagina y el mismo codigo que la version 1
 * (dist/), pero los datos viven en SQLite y los documentos en la carpeta de datos.
 *
 *   GET  /                    la aplicacion
 *   POST /api                 { nombre, token, args } -> lo mismo que google.script.run.api(...)
 *   GET  /doc/<id>.docx       Word generado          GET /doc/<id>.pdf  (o /doc/<id>)  PDF
 *   GET  /archivo/<id>        figuras y archivos subidos
 *   GET  /salud               estado del servidor (para el monitoreo y el despliegue)
 *
 * Variables de entorno: ver despliegue/.env.example
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { abrir } = require('./runtime/bd');
const { pdfDe } = require('./runtime/pdf');
const { VERSION_SERVIDOR } = require('./runtime/gas');

const CFG = {
  puerto: parseInt(process.env.PUERTO || '3000', 10),
  datos: path.resolve(process.env.DATOS || path.join(__dirname, '..', 'datos')),
  dist: path.resolve(process.env.DIST || path.join(__dirname, '..', 'dist')),
  trabajadores: Math.max(1, parseInt(process.env.TRABAJADORES || '4', 10)),
  urlPublica: String(process.env.URL_PUBLICA || '').replace(/\/$/, ''),
  propietario: String(process.env.ADMIN_CORREO || '').trim().toLowerCase(),
  marcos: process.env.MARCOS_PERMITIDOS || "'self' https://sites.google.com https://*.google.com https://*.googleusercontent.com",
  limiteMs: parseInt(process.env.LIMITE_LLAMADA_MS || '360000', 10),
  simulador: process.env.QSI_SIMULADOR ? path.resolve(process.env.QSI_SIMULADOR) : ''
};

const bd = abrir(CFG.datos);
const MAX_CUERPO = 30 * 1024 * 1024;
let apagando = false;

// ------------------------------------------------------------------ hilos trabajadores
const hilos = [];
const cola = [];
let siguienteId = 1;
const pendientes = new Map();

function crearHilo(k) {
  const w = new Worker(path.join(__dirname, 'runtime', 'trabajador.js'), { workerData: { datos: CFG.datos, dist: CFG.dist, urlPublica: CFG.urlPublica, propietario: CFG.propietario, simulador: CFG.simulador } });
  const h = { w, k, libre: false, trabajo: null, temporizador: null };
  w.on('message', (m) => {
    if (m.listo) { h.libre = true; repartir(); return; }
    const p = pendientes.get(m.id);
    pendientes.delete(m.id);
    clearTimeout(h.temporizador);
    h.trabajo = null; h.libre = true;
    if (p) { if (m.ok) p.resolver(m.json); else p.rechazar(new Error(m.error)); }
    repartir();
  });
  w.on('error', (e) => console.error('[hilo ' + k + '] error:', e && e.message));
  w.on('exit', (c) => {
    if (h.trabajo) { const p = pendientes.get(h.trabajo); pendientes.delete(h.trabajo); if (p) p.rechazar(new Error('El proceso se reinició. Intenta de nuevo.')); }
    clearTimeout(h.temporizador);
    if (!apagando) { console.error('[hilo ' + k + '] terminó (' + c + '); se crea otro'); hilos[k] = crearHilo(k); }
  });
  return h;
}
function repartir() {
  while (cola.length) {
    const h = hilos.find((x) => x && x.libre);
    if (!h) return;
    const t = cola.shift();
    h.libre = false; h.trabajo = t.msg.id;
    h.temporizador = setTimeout(() => { console.error('[hilo ' + h.k + '] superó el límite de tiempo; se reinicia'); h.w.terminate(); }, CFG.limiteMs);
    h.w.postMessage(t.msg);
  }
}
function enviar(msg) {
  return new Promise((resolver, rechazar) => {
    msg.id = siguienteId++;
    pendientes.set(msg.id, { resolver, rechazar });
    cola.push({ msg });
    repartir();
  });
}
for (let k = 0; k < CFG.trabajadores; k++) hilos.push(crearHilo(k));

// ------------------------------------------------------------------ pagina principal
const PUENTE = '<script>window.QSI_SERVIDOR=true;(function(){' +
  'function R(s,f){this._s=s;this._f=f;}' +
  'R.prototype.withSuccessHandler=function(fn){return new R(fn,this._f);};' +
  'R.prototype.withFailureHandler=function(fn){return new R(this._s,fn);};' +
  'R.prototype.api=function(n,t,a){var s=this._s,f=this._f;fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({nombre:n,token:t,args:a})})' +
  '.then(function(r){if(r.status===429)throw new Error("Demasiadas solicitudes seguidas. Espera un momento.");if(!r.ok)throw new Error("El servidor no respondió ("+r.status+").");return r.json();})' +
  '.then(function(d){if(s)s(d);}).catch(function(e){if(f)f(e);});};' +
  'window.google={script:{run:new R(null,null)}};})();</script>';
let paginaCache = null;
async function pagina() {
  if (paginaCache && Date.now() - paginaCache.t < 15000) return paginaCache;
  const d = JSON.parse(await enviar({ tipo: 'doGet' }));
  let html = d.html.replace('<head>', '<head>\n' + PUENTE);
  if (d.titulo) html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + d.titulo.replace(/[<&]/g, '') + '</title>');
  paginaCache = { t: Date.now(), html, insertar: d.marcos === 'ALLOWALL' };
  return paginaCache;
}

// ------------------------------------------------------------------ limite de peticiones por IP
const conteo = new Map();
function permitido(ip, tipo) {
  const lim = tipo === 'ingreso' ? 150 : 4000;   // por 5 minutos (un laboratorio comparte IP)
  const k = tipo + '|' + ip, ahora = Date.now();
  let c = conteo.get(k);
  if (!c || ahora - c.t > 300000) { c = { t: ahora, n: 0 }; conteo.set(k, c); }
  c.n++;
  return c.n <= lim;
}
setInterval(() => { const ahora = Date.now(); for (const [k, c] of conteo) if (ahora - c.t > 300000) conteo.delete(k); }, 60000).unref();
setInterval(() => { enviar({ tipo: 'limpiar' }).catch(() => {}); }, 3600000).unref();

// ------------------------------------------------------------------ utilidades HTTP
function cabecerasBase(res, insertar) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', 'frame-ancestors ' + (insertar ? CFG.marcos : "'self'"));
  if (!insertar) res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}
function responder(res, codigo, tipo, cuerpo, extra) {
  res.writeHead(codigo, Object.assign({ 'Content-Type': tipo, 'Cache-Control': 'no-store' }, extra || {}));
  res.end(cuerpo);
}
function ipDe(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(); }
function leerCuerpo(req) {
  return new Promise((resolver, rechazar) => {
    const partes = []; let tam = 0;
    req.on('data', (d) => { tam += d.length; if (tam > MAX_CUERPO) { rechazar(new Error('demasiado grande')); req.destroy(); } else partes.push(d); });
    req.on('end', () => resolver(Buffer.concat(partes)));
    req.on('error', rechazar);
  });
}
function nombreDescarga(n, ext) {
  const limpio = String(n || 'documento').replace(/[\r\n"\\/]/g, ' ').trim() + ext;
  return 'filename="' + limpio.replace(/[^\x20-\x7e]/g, '_') + '"; filename*=UTF-8\'\'' + encodeURIComponent(limpio);
}
function metaArchivo(id) {
  if (!/^[A-Za-z0-9_-]{6,120}$/.test(id)) return null;
  const m = bd.q('SELECT * FROM archivos WHERE id = ? AND papelera = 0').get(id);
  if (!m || !fs.existsSync(path.join(CFG.datos, 'archivos', id))) return null;
  return m;
}
function servirArchivo(res, ruta, tipo, disposicion) {
  const st = fs.statSync(ruta);
  res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': st.size, 'Content-Disposition': disposicion, 'Cache-Control': 'private, max-age=300' });
  fs.createReadStream(ruta).pipe(res);
}

// ------------------------------------------------------------------ rutas
const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  const ruta = url.pathname;
  // HEAD se atiende como GET (Node no envia el cuerpo)
  if (req.method === 'HEAD') req.method = 'GET';
  try {
    if (req.method === 'GET' && (ruta === '/' || ruta === '/index.html')) {
      const p = await pagina();
      cabecerasBase(res, p.insertar);
      return responder(res, 200, 'text/html; charset=utf-8', p.html);
    }
    if (req.method === 'POST' && ruta === '/api') {
      cabecerasBase(res, false);
      let cuerpo;
      try { cuerpo = JSON.parse((await leerCuerpo(req)).toString('utf8') || '{}'); } catch (e) { return responder(res, 400, 'application/json', JSON.stringify({ ok: false, error: 'ERROR', mensaje: 'Solicitud no válida o demasiado grande.' })); }
      const nombre = String(cuerpo.nombre || '');
      const tipo = nombre === 'ingresar' || nombre === 'registrar' ? 'ingreso' : 'api';
      if (!permitido(ipDe(req), tipo)) return responder(res, 429, 'application/json', JSON.stringify({ ok: false, error: 'ERROR', mensaje: 'Demasiadas solicitudes seguidas. Espera unos minutos.' }));
      const t0 = Date.now();
      try {
        const json = await enviar({ tipo: 'api', nombre, token: cuerpo.token || '', args: cuerpo.args || {} });
        const ok = json.substring(0, 10) === '{"ok":true';
        console.log(new Date().toISOString() + ' api ' + nombre + ' ' + (Date.now() - t0) + 'ms' + (ok ? '' : ' (rechazada)'));
        return responder(res, 200, 'application/json; charset=utf-8', json);
      } catch (e) {
        console.error(new Date().toISOString() + ' api ' + nombre + ' FALLO: ' + e.message);
        return responder(res, 200, 'application/json; charset=utf-8', JSON.stringify({ ok: false, error: 'ERROR', mensaje: 'Error interno del servidor. Intenta de nuevo.' }));
      }
    }
    let m;
    if (req.method === 'GET' && (m = /^\/doc\/([A-Za-z0-9_-]+)(\.docx|\.pdf)?$/.exec(ruta))) {
      const meta = metaArchivo(m[1]);
      if (!meta) return responder(res, 404, 'text/plain; charset=utf-8', 'El documento no existe o fue reemplazado. Vuelve a generarlo desde la aplicación.');
      cabecerasBase(res, false);
      if (m[2] === '.docx') return servirArchivo(res, path.join(CFG.datos, 'archivos', meta.id), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'attachment; ' + nombreDescarga(meta.nombre, meta.tipo === 'doc' ? '.docx' : ''));
      if (meta.tipo !== 'doc' && !/wordprocessingml/.test(meta.mime)) return responder(res, 404, 'text/plain; charset=utf-8', 'No es un documento.');
      try {
        const pdf = await pdfDe(CFG.datos, meta.id, meta.actualizado);
        return servirArchivo(res, pdf, 'application/pdf', 'inline; ' + nombreDescarga(meta.nombre, '.pdf'));
      } catch (e) {
        console.error('PDF ' + meta.id + ': ' + e.message);
        return responder(res, 503, 'text/plain; charset=utf-8', 'No se pudo convertir a PDF en este momento. Descarga el Word: /doc/' + meta.id + '.docx');
      }
    }
    if (req.method === 'GET' && (m = /^\/archivo\/([A-Za-z0-9_-]+)$/.exec(ruta))) {
      const meta = metaArchivo(m[1]);
      if (!meta) return responder(res, 404, 'text/plain; charset=utf-8', 'El archivo no existe.');
      cabecerasBase(res, false);
      const imagen = /^image\/(png|jpeg|gif)$/.test(meta.mime);
      const tipo = imagen ? meta.mime : (meta.tipo === 'doc' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : (/^(application\/(json|zip|pdf)|application\/vnd\.openxmlformats)/.test(meta.mime) ? meta.mime : 'application/octet-stream'));
      return servirArchivo(res, path.join(CFG.datos, 'archivos', meta.id), tipo, (imagen ? 'inline; ' : 'attachment; ') + nombreDescarga(meta.nombre, meta.tipo === 'doc' ? '.docx' : ''));
    }
    if (req.method === 'GET' && ruta === '/salud') {
      let base = true;
      try { bd.q('SELECT 1').get(); } catch (e) { base = false; }
      return responder(res, base ? 200 : 503, 'application/json', JSON.stringify({ ok: base, version: VERSION_SERVIDOR, compilacion: process.env.QSI_COMPILACION || '', hilos: hilos.filter((h) => h).length, libres: hilos.filter((h) => h && h.libre).length, cola: cola.length }));
    }
    if (req.method === 'GET' && ruta === '/robots.txt') return responder(res, 200, 'text/plain', 'User-agent: *\nDisallow: /\n');
    responder(res, 404, 'text/plain; charset=utf-8', 'No encontrado');
  } catch (e) {
    console.error('Error en ' + ruta + ': ' + (e && e.stack || e));
    if (!res.headersSent) responder(res, 500, 'text/plain; charset=utf-8', 'Error interno');
    else res.destroy();
  }
});
servidor.requestTimeout = 0;
servidor.headersTimeout = 60000;
servidor.keepAliveTimeout = 65000;

function apagar() {
  if (apagando) return;
  apagando = true;
  console.log('Cerrando...');
  servidor.close(() => { hilos.forEach((h) => h && h.w.terminate()); try { bd.cerrar(); } catch (e) { /* ya cerrada */ } process.exit(0); });
  setTimeout(() => process.exit(0), 15000).unref();
}
process.on('SIGTERM', apagar);
process.on('SIGINT', apagar);

servidor.listen(CFG.puerto, () => {
  console.log('Quiero ser Ingeniero v' + VERSION_SERVIDOR + ' escuchando en el puerto ' + CFG.puerto + ' (datos: ' + CFG.datos + ', hilos: ' + CFG.trabajadores + ')');
  if (!bd.q('SELECT v FROM props WHERE k = ?').get('HOJA_ID')) console.log('AVISO: la aplicación aún no está instalada. Ejecute: node servidor/herramientas.js instalar');
});

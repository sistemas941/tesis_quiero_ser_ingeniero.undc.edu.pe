'use strict';
/**
 * Hilo trabajador: carga la aplicacion una vez y atiende las llamadas que le pasa el servidor.
 * El codigo de Apps Script es sincrono (espera a la IA, a la base, etc.); por eso cada llamada
 * ocupa un hilo y el servidor reparte el trabajo entre varios.
 */
const { parentPort, workerData } = require('worker_threads');
const { cargar, VERSION_SERVIDOR } = require('./gas');
const { abrir } = require('./bd');
const { crearAnfitrion } = require('./anfitrion');

const bd = abrir(workerData.datos);
let simulador;
if (workerData.simulador) simulador = require(workerData.simulador).fetch;
const app = cargar({
  bd, dist: workerData.dist, urlPublica: workerData.urlPublica || '',
  propietario: workerData.propietario || '', usuarioActivo: '',
  anfitrion: crearAnfitrion(bd, VERSION_SERVIDOR),
  simuladorFetch: simulador,
  log: (m) => console.log('[app] ' + m)
});

parentPort.on('message', (m) => {
  const t0 = Date.now();
  let r;
  try {
    if (m.tipo === 'api') r = { ok: true, json: JSON.stringify(app.api(m.nombre, m.token, m.args)) };
    else if (m.tipo === 'doGet') r = { ok: true, json: JSON.stringify(app.doGet()) };
    else if (m.tipo === 'limpiar') { bd.limpiarCache(); r = { ok: true, json: 'null' }; }
    else r = { ok: false, error: 'Tipo de mensaje desconocido' };
  } catch (e) {
    r = { ok: false, error: String(e && e.message || e) };
  }
  r.id = m.id; r.ms = Date.now() - t0;
  parentPort.postMessage(r);
});
parentPort.postMessage({ listo: true });

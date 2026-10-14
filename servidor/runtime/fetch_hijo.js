'use strict';
/**
 * Proceso auxiliar de UrlFetchApp: recibe por la entrada estandar una lista de pedidos en JSON,
 * los hace en paralelo con fetch y escribe las respuestas en la salida estandar.
 * Se usa porque el codigo de Apps Script es sincrono: el trabajador espera a este proceso.
 */
let entrada = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { entrada += d; });
process.stdin.on('end', async () => {
  const pedidos = JSON.parse(entrada);
  const salida = await Promise.all(pedidos.map(async (p) => {
    try {
      const r = await fetch(p.url, {
        method: p.metodo || 'GET',
        headers: p.cabeceras || {},
        body: p.cuerpo === undefined || p.cuerpo === null ? undefined : Buffer.from(p.cuerpo, 'base64'),
        redirect: p.seguir === false ? 'manual' : 'follow',
        signal: AbortSignal.timeout(p.limiteMs || 120000)
      });
      const buf = Buffer.from(await r.arrayBuffer());
      const cab = {};
      r.headers.forEach((v, k) => { cab[k] = v; });
      return { codigo: r.status, cabeceras: cab, cuerpo: buf.toString('base64') };
    } catch (e) {
      const causa = e && e.cause ? ' (' + (e.cause.code || e.cause.message) + ')' : '';
      return { error: (e && e.name === 'TimeoutError' ? 'Tiempo de espera agotado' : String(e && e.message || e)) + causa + ': ' + p.url };
    }
  }));
  process.stdout.write(JSON.stringify(salida));
});

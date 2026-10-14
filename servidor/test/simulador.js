'use strict';
/**
 * Respuestas simuladas de los servicios externos (Gemini, OpenAlex, Crossref, Consensus...) para las pruebas.
 * Reutiliza el simulador de test/mock.js, el mismo que usan las pruebas de la version 1.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({ console });
ctx.globalThis = ctx;
const RAIZ = path.join(__dirname, '..', '..');
vm.runInContext(fs.readFileSync(path.join(RAIZ, 'test', 'mock.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(RAIZ, 'test', 'demo.js'), 'utf8'), ctx);

const llamadas = [];
function fetch(url, p) {
  llamadas.push(url);
  const o = { method: p.metodo, headers: p.cabeceras, payload: p.cuerpo ? Buffer.from(p.cuerpo, 'base64').toString('utf8') : undefined, muteHttpExceptions: p.mudo };
  const r = ctx.UrlFetchApp.fetch(url, o);
  const texto = r.getContentText();
  return {
    getResponseCode: () => r.getResponseCode(),
    getContentText: () => texto,
    getContent: () => Buffer.from(texto, 'utf8'),
    getBlob: () => { throw new Error('getBlob no simulado para ' + url); },
    getHeaders: () => ({}), getAllHeaders: () => ({})
  };
}
module.exports = { fetch, llamadas, demo: () => JSON.parse(JSON.stringify(ctx.__DEMO)) };

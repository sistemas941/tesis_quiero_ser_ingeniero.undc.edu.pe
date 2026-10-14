'use strict';
/**
 * Conversion de .docx a PDF con LibreOffice sin interfaz (soffice --headless).
 * Cada conversion usa su propio perfil temporal, asi pueden correr dos a la vez.
 * El resultado se guarda en datos/cache_pdf y se reutiliza mientras el .docx no cambie.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const SOFFICE = process.env.SOFFICE || 'soffice';
const MAX_PARALELO = Math.max(1, parseInt(process.env.PDF_PARALELO || '2', 10));
let activos = 0;
const cola = [];

function turno() {
  return new Promise((resolver) => {
    if (activos < MAX_PARALELO) { activos++; resolver(); } else cola.push(resolver);
  });
}
function liberar() { const sig = cola.shift(); if (sig) sig(); else activos--; }

function convertir(docx, salidaPdf) {
  return turno().then(() => new Promise((resolver, rechazar) => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qsi-pdf-'));
    const entrada = path.join(tmp, 'documento.docx');
    fs.copyFileSync(docx, entrada);
    const perfil = 'file://' + path.join(tmp, 'perfil');
    const p = spawn(SOFFICE, ['-env:UserInstallation=' + perfil, '--headless', '--norestore', '--convert-to', 'pdf:writer_pdf_Export', '--outdir', tmp, entrada], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    const limite = setTimeout(() => { p.kill('SIGKILL'); }, 120000);
    p.on('error', (e) => { clearTimeout(limite); fs.rmSync(tmp, { recursive: true, force: true }); liberar(); rechazar(new Error('LibreOffice no está disponible: ' + e.message)); });
    p.on('close', () => {
      clearTimeout(limite);
      const pdf = path.join(tmp, 'documento.pdf');
      try {
        if (!fs.existsSync(pdf)) throw new Error('LibreOffice no produjo el PDF. ' + err.substring(0, 300));
        fs.mkdirSync(path.dirname(salidaPdf), { recursive: true });
        fs.copyFileSync(pdf, salidaPdf + '.tmp');
        fs.renameSync(salidaPdf + '.tmp', salidaPdf);
        resolver(salidaPdf);
      } catch (e) { rechazar(e); } finally { fs.rmSync(tmp, { recursive: true, force: true }); liberar(); }
    });
  }));
}

/** PDF de un documento: lo convierte la primera vez y lo reutiliza despues. */
function pdfDe(dirDatos, id, actualizado) {
  const docx = path.join(dirDatos, 'archivos', id);
  const huella = crypto.createHash('sha1').update(id + '|' + actualizado).digest('hex').substring(0, 16);
  const destino = path.join(dirDatos, 'cache_pdf', id + '_' + huella + '.pdf');
  if (fs.existsSync(destino)) return Promise.resolve(destino);
  // Se borran las versiones anteriores del mismo documento
  try { fs.readdirSync(path.join(dirDatos, 'cache_pdf')).filter((f) => f.startsWith(id + '_')).forEach((f) => fs.rmSync(path.join(dirDatos, 'cache_pdf', f), { force: true })); } catch (e) { /* aun no existe la carpeta */ }
  return convertir(docx, destino);
}

module.exports = { pdfDe, convertir };

'use strict';
/**
 * Excel (.xlsx) minimo: escribir todas las pestanas como texto y leer un libro descargado de
 * Google Hojas de calculo (Archivo > Descargar > Microsoft Excel). Sin dependencias externas.
 */
const { crearZip, leerZip } = require('./zip');

function esc(s) { return String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function desc(s) { return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&'); }
function letra(n) { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function columna(ref) { const m = /^([A-Z]+)/.exec(ref); return m[1].split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1; }

/** hojas: [{ nombre, filas: [[...]] }] -> Buffer (.xlsx). Excel limita cada celda a 32 767 caracteres. */
function escribirXlsx(hojas) {
  const nombres = [];
  const partes = [];
  hojas.forEach((h, i) => {
    let nombre = String(h.nombre).replace(/[\[\]\*\?\/\\:]/g, ' ').substring(0, 31) || ('Hoja' + (i + 1));
    while (nombres.includes(nombre)) nombre = nombre.substring(0, 28) + '_' + i;
    nombres.push(nombre);
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>';
    h.filas.forEach((f, r) => {
      xml += '<row r="' + (r + 1) + '">';
      f.forEach((v, c) => {
        if (v === '' || v === null || v === undefined) return;
        const ref = letra(c) + (r + 1);
        if (typeof v === 'number' && isFinite(v)) xml += '<c r="' + ref + '"><v>' + v + '</v></c>';
        else xml += '<c r="' + ref + '" t="inlineStr"' + (r === 0 ? ' s="1"' : '') + '><is><t xml:space="preserve">' + esc(String(v).substring(0, 32767)) + '</t></is></c>';
      });
      xml += '</row>';
    });
    xml += '</sheetData></worksheet>';
    partes.push({ nombre: 'xl/worksheets/sheet' + (i + 1) + '.xml', datos: xml });
  });
  const libro = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
    nombres.map((n, i) => '<sheet name="' + esc(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>';
  const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    nombres.map((n, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') +
    '<Relationship Id="rIdE" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  const estilos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" numFmtId="49" applyNumberFormat="1"/><xf fontId="1" numFmtId="49" applyFont="1" applyNumberFormat="1"/></cellXfs></styleSheet>';
  const tipos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    nombres.map((n, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>';
  return crearZip([
    { nombre: '[Content_Types].xml', datos: tipos },
    { nombre: '_rels/.rels', datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { nombre: 'xl/workbook.xml', datos: libro },
    { nombre: 'xl/_rels/workbook.xml.rels', datos: rels },
    { nombre: 'xl/styles.xml', datos: estilos },
    ...partes
  ]);
}

/** Buffer (.xlsx) -> { nombreHoja: [[texto...]] } */
function leerXlsx(buf) {
  const partes = new Map(leerZip(buf).map((p) => [p.nombre, p.datos.toString('utf8')]));
  const libro = partes.get('xl/workbook.xml');
  if (!libro) throw new Error('El archivo no es un libro de Excel (.xlsx).');
  const rels = partes.get('xl/_rels/workbook.xml.rels') || '';
  const destino = {};
  rels.replace(/<Relationship\b[^>]*>/g, (r) => { const id = /Id="([^"]+)"/.exec(r), t = /Target="([^"]+)"/.exec(r); if (id && t) destino[id[1]] = t[1].replace(/^\/?xl\//, '').replace(/^\//, ''); return r; });
  const compartidas = [];
  const ss = partes.get('xl/sharedStrings.xml') || '';
  ss.replace(/<si>([\s\S]*?)<\/si>/g, (m, si) => { let t = ''; si.replace(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, (x, y) => { t += desc(y); return x; }); compartidas.push(t); return m; });
  const salida = {};
  libro.replace(/<sheet\b[^>]*>/g, (s) => {
    const nombre = desc((/name="([^"]*)"/.exec(s) || [])[1] || '');
    const rid = (/r:id="([^"]+)"/.exec(s) || [])[1];
    const xml = partes.get('xl/' + destino[rid]) || '';
    const filas = [];
    xml.replace(/<row\b([^>]*)>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g, (m, atr, cuerpo) => {
      if (!cuerpo) return m;
      const r = parseInt((/\br="(\d+)"/.exec(atr) || [])[1], 10) || filas.length + 1;
      const fila = [];
      cuerpo.replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, (mc, ca, cc) => {
        const ref = (/\br="([A-Z]+\d+)"/.exec(ca) || [])[1];
        const t = (/\bt="([^"]+)"/.exec(ca) || [])[1] || 'n';
        const c = ref ? columna(ref) : fila.length;
        let v = '';
        if (cc) {
          if (t === 'inlineStr') { cc.replace(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, (x, y) => { v += desc(y); return x; }); }
          else {
            const vv = /<v>([\s\S]*?)<\/v>/.exec(cc);
            const crudo = vv ? desc(vv[1]) : '';
            if (t === 's') v = compartidas[parseInt(crudo, 10)] || '';
            else if (t === 'b') v = crudo === '1' ? 'TRUE' : 'FALSE';
            else v = crudo;
          }
        }
        while (fila.length < c) fila.push('');
        fila[c] = v;
        return mc;
      });
      while (filas.length < r - 1) filas.push([]);
      filas[r - 1] = fila;
      return m;
    });
    salida[nombre] = filas;
    return s;
  });
  return salida;
}

module.exports = { escribirXlsx, leerXlsx };

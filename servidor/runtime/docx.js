'use strict';
/**
 * DocumentApp compatible: el codigo de Apps Script arma el documento con las mismas llamadas
 * (appendParagraph, appendTable, appendListItem, appendImage, editAsText...) y al guardar
 * se escribe un .docx de Word real. El PDF se obtiene despues con LibreOffice (ver pdf.js).
 */
const { crearZip } = require('./zip');

const EN = {
  ParagraphHeading: { NORMAL: 'NORMAL', TITLE: 'TITLE', SUBTITLE: 'SUBTITLE', HEADING1: 'HEADING1', HEADING2: 'HEADING2', HEADING3: 'HEADING3', HEADING4: 'HEADING4', HEADING5: 'HEADING5', HEADING6: 'HEADING6' },
  HorizontalAlignment: { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFY: 'justify' },
  GlyphType: { BULLET: 'BULLET', HOLLOW_BULLET: 'HOLLOW_BULLET', SQUARE_BULLET: 'SQUARE_BULLET', NUMBER: 'NUMBER', LATIN_LOWER: 'LATIN_LOWER', LATIN_UPPER: 'LATIN_UPPER', ROMAN_LOWER: 'ROMAN_LOWER', ROMAN_UPPER: 'ROMAN_UPPER' },
  ElementType: { PARAGRAPH: 'PARAGRAPH', TABLE: 'TABLE', LIST_ITEM: 'LIST_ITEM', INLINE_IMAGE: 'INLINE_IMAGE', PAGE_BREAK: 'PAGE_BREAK', TABLE_CELL: 'TABLE_CELL', TEXT: 'TEXT' }
};

let contadorListas = 0;

// ------------------------------------------------------------------ texto con formato
function Texto(p) {
  const self = this;
  function poner(prop, a, b, c) {
    if (b === undefined) { p.base[prop] = a; p.rangos = p.rangos.filter((r) => r.prop !== prop); }
    else {
      if (a < 0 || b >= p.texto.length || b < a) throw new Error('Índice (' + b + ') fuera de rango para el texto de longitud ' + p.texto.length + '.');
      p.rangos.push({ prop, a, b, v: c });
    }
    return self;
  }
  this.setFontFamily = (a, b, c) => poner('fuente', a, b, c);
  this.setFontSize = (a, b, c) => poner('tam', a, b, c);
  this.setBold = (a, b, c) => poner('negrita', a, b, c);
  this.setItalic = (a, b, c) => poner('cursiva', a, b, c);
  this.setUnderline = (a, b, c) => poner('subrayado', a, b, c);
  this.setForegroundColor = (a, b, c) => poner('color', a, b, c);
  this.setBackgroundColor = (a, b, c) => poner('fondo', a, b, c);
  this.getText = () => p.texto;
  this.setText = (t) => { p.texto = String(t); p.rangos = []; return self; };
}

// ------------------------------------------------------------------ parrafos y elementos de lista
function Parrafo(texto, tipo) {
  const self = this;
  this.tipo = tipo || 'PARAGRAPH';
  this.texto = texto === undefined || texto === null ? '' : String(texto);
  this.base = {}; this.rangos = []; this.at = { heading: 'NORMAL' };
  this.hijos = [];       // imagenes en linea
  if (this.tipo === 'LIST_ITEM') { this.lista = { id: ++contadorListas }; this.glifo = 'BULLET'; this.nivel = 0; }
  this.getType = () => self.tipo;
  this.asParagraph = () => self;
  this.asListItem = () => self;
  this.setText = (t) => { self.texto = String(t); self.rangos = []; return self; };
  this.getText = () => self.texto;
  this.appendText = (t) => { self.texto += String(t); return new Texto(self); };
  this.editAsText = () => new Texto(self);
  this.getNumChildren = () => (self.texto ? 1 : 0) + self.hijos.length;
  this.setHeading = (v) => { self.at.heading = v; return self; };
  this.getHeading = () => self.at.heading;
  this.setAlignment = (v) => { self.at.alignment = v; return self; };
  this.getAlignment = () => self.at.alignment || 'left';
  this.setLineSpacing = (v) => { self.at.lineSpacing = v; return self; };
  this.setSpacingBefore = (v) => { self.at.spacingBefore = v; return self; };
  this.setSpacingAfter = (v) => { self.at.spacingAfter = v; return self; };
  this.setIndentFirstLine = (v) => { self.at.indentFirstLine = v; return self; };
  this.setIndentStart = (v) => { self.at.indentStart = v; return self; };
  this.setIndentEnd = (v) => { self.at.indentEnd = v; return self; };
  this.setKeepWithNext = (v) => { self.at.keepNext = !!v; return self; };
  this.setGlyphType = (g) => { self.glifo = g; return self; };
  this.setListId = (otro) => { if (otro && otro.lista) self.lista = otro.lista; return self; };
  this.getListId = () => (self.lista ? 'lista' + self.lista.id : null);
  this.setNestingLevel = (n) => { self.nivel = Math.max(0, Math.min(8, n | 0)); return self; };
  this.setAttributes = () => self;
}

function Celda(texto) {
  const self = this;
  this.p = new Parrafo(texto);
  this.fondo = ''; this.pad = {};
  ['Top', 'Bottom', 'Left', 'Right'].forEach((k) => { self['setPadding' + k] = (v) => { self.pad[k] = v; return self; }; });
  this.editAsText = () => self.p.editAsText();
  this.getText = () => self.p.texto;
  this.setText = (t) => { self.p.setText(t); return self; };
  this.setBackgroundColor = (c) => { self.fondo = c; return self; };
  this.setVerticalAlignment = () => self;
  this.getNumChildren = () => 1;
  this.getChild = () => self.p;
  this.getType = () => 'TABLE_CELL';
}

function Tabla(celdas) {
  const self = this;
  this.tipo = 'TABLE'; this.anchos = {}; this.borde = 1; this.colorBorde = '#000000';
  this.filas = celdas.map((f) => f.map((c) => new Celda(c === null || c === undefined ? '' : String(c))));
  this.getType = () => 'TABLE';
  this.getNumRows = () => self.filas.length;
  this.getRow = (i) => {
    const f = self.filas[i];
    if (!f) throw new Error('Fila inexistente ' + i);
    return { getNumCells: () => f.length, getCell: (j) => { if (!f[j]) throw new Error('Celda inexistente ' + i + ',' + j); return f[j]; } };
  };
  this.getCell = (i, j) => self.getRow(i).getCell(j);
  this.setColumnWidth = (i, w) => { self.anchos[i] = w; return self; };
  this.setBorderWidth = (w) => { self.borde = w; return self; };
  this.setBorderColor = (c) => { self.colorBorde = c; return self; };
}

/** Tamano en pixeles de una imagen PNG, JPEG o GIF (lo mismo que devuelve Docs con getWidth/getHeight). */
function tamImagen(buf) {
  try {
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') return [buf.readUInt16LE(6), buf.readUInt16LE(8)];
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch (e) { /* imagen no reconocida */ }
  return [400, 300];
}

function Imagen(blob, parrafo) {
  const self = this;
  this.tipo = 'INLINE_IMAGE';
  this.datos = blob.getBytes();
  this.mime = /png/i.test(blob.getContentType() || '') ? 'image/png' : (/gif/i.test(blob.getContentType() || '') ? 'image/gif' : 'image/jpeg');
  const t = tamImagen(this.datos);
  this.w = t[0]; this.h = t[1]; this.pp = parrafo;
  this.getType = () => 'INLINE_IMAGE';
  this.getWidth = () => self.w; this.getHeight = () => self.h;
  this.setWidth = (v) => { self.w = v; return self; };
  this.setHeight = (v) => { self.h = v; return self; };
  this.getParent = () => self.pp;
  this.setAltTitle = () => self; this.setAltDescription = () => self;
}

function Cuerpo() {
  const self = this;
  this.hijos = [new Parrafo('')]; this.pagina = {};
  this.clear = () => { self.hijos = [new Parrafo('')]; return self; };
  ['PageWidth', 'PageHeight', 'MarginLeft', 'MarginRight', 'MarginTop', 'MarginBottom'].forEach((k) => {
    self['set' + k] = (v) => { self.pagina[k] = v; return self; };
    self['get' + k] = () => self.pagina[k];
  });
  this.getChild = (i) => self.hijos[i];
  this.getNumChildren = () => self.hijos.length;
  this.getText = () => self.hijos.map((h) => h.texto || '').join('\n');
  this.appendParagraph = (t) => { const p = new Parrafo(t); self.hijos.push(p); return p; };
  this.appendPageBreak = () => { const p = new Parrafo('', 'PAGE_BREAK'); self.hijos.push(p); return p; };
  this.appendListItem = (t) => { const p = new Parrafo(t, 'LIST_ITEM'); self.hijos.push(p); return p; };
  this.appendTable = (c) => { const t = new Tabla(c || [['']]); self.hijos.push(t); return t; };
  this.appendHorizontalRule = () => { const p = new Parrafo(''); p.at.regla = true; self.hijos.push(p); return p; };
  this.appendImage = (b) => {
    if (!b || typeof b.getBytes !== 'function') throw new Error('appendImage requiere una imagen (blob).');
    const p = new Parrafo('');
    const im = new Imagen(b, p);
    p.hijos.push(im);
    self.hijos.push(p);
    return im;
  };
}

// ------------------------------------------------------------------ escritura del .docx
const PT = 20;            // veinteavos de punto (dxa) por punto
const EMU = 12700;        // EMU por punto

function xml(s) {
  return String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function color(c) { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '')); return m ? m[1].toUpperCase() : null; }

function rPr(e) {
  let s = '';
  if (e.fuente) s += '<w:rFonts w:ascii="' + xml(e.fuente) + '" w:hAnsi="' + xml(e.fuente) + '" w:cs="' + xml(e.fuente) + '" w:eastAsia="' + xml(e.fuente) + '"/>';
  if (e.negrita) s += '<w:b/><w:bCs/>'; else if (e.negrita === false) s += '<w:b w:val="0"/><w:bCs w:val="0"/>';
  if (e.cursiva) s += '<w:i/><w:iCs/>'; else if (e.cursiva === false) s += '<w:i w:val="0"/><w:iCs w:val="0"/>';
  const col = color(e.color); if (col) s += '<w:color w:val="' + col + '"/>';
  if (e.tam) s += '<w:sz w:val="' + Math.round(e.tam * 2) + '"/><w:szCs w:val="' + Math.round(e.tam * 2) + '"/>';
  if (e.subrayado) s += '<w:u w:val="single"/>';
  const f = color(e.fondo); if (f) s += '<w:shd w:val="clear" w:color="auto" w:fill="' + f + '"/>';
  return s ? '<w:rPr>' + s + '</w:rPr>' : '';
}

function textoRun(t) {
  let out = '', buf = '';
  const vaciar = () => { if (buf) { out += '<w:t xml:space="preserve">' + xml(buf) + '</w:t>'; buf = ''; } };
  for (const ch of t) {
    if (ch === '\n' || ch === '\r' || ch === '\u000b') { vaciar(); out += '<w:br/>'; }
    else if (ch === '\t') { vaciar(); out += '<w:tab/>'; }
    else buf += ch;
  }
  vaciar();
  return out;
}

function runs(p) {
  const n = p.texto.length;
  if (!n) return '';
  const estilo = (k) => { const e = Object.assign({}, p.base); for (const r of p.rangos) { if (k >= r.a && k <= r.b) e[r.prop] = r.v; } return e; };
  let out = '', i = 0;
  while (i < n) {
    const e = estilo(i), clave = JSON.stringify(e);
    let j = i + 1;
    while (j < n && JSON.stringify(estilo(j)) === clave) j++;
    out += '<w:r>' + rPr(e) + textoRun(p.texto.substring(i, j)) + '</w:r>';
    i = j;
  }
  return out;
}

function pPr(p, ctx, extra) {
  const a = p.at;
  let s = '';
  const h = /^HEADING(\d)$/.exec(a.heading || '');
  if (h) s += '<w:pStyle w:val="Heading' + h[1] + '"/>';
  else if (a.heading === 'TITLE') s += '<w:pStyle w:val="Title"/>';
  if (a.keepNext || h) s += '<w:keepNext/>';
  if (p.tipo === 'LIST_ITEM') s += '<w:numPr><w:ilvl w:val="' + (p.nivel || 0) + '"/><w:numId w:val="' + ctx.numId(p) + '"/></w:numPr>';
  if (a.regla) s += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="auto"/></w:pBdr>';
  let sp = '';
  if (a.spacingBefore !== undefined) sp += ' w:before="' + Math.round(a.spacingBefore * PT) + '"';
  sp += ' w:after="' + Math.round((a.spacingAfter || 0) * PT) + '"';
  sp += ' w:line="' + Math.round((a.lineSpacing || 1.15) * 240) + '" w:lineRule="auto"';
  s += '<w:spacing' + sp + '/>';
  const ini = a.indentStart, pri = a.indentFirstLine;
  if (ini !== undefined || pri !== undefined || a.indentEnd !== undefined || p.tipo === 'LIST_ITEM') {
    const izq = ini !== undefined ? ini : (p.tipo === 'LIST_ITEM' ? 36 * ((p.nivel || 0) + 1) : 0);
    const prim = pri !== undefined ? pri : (p.tipo === 'LIST_ITEM' ? izq - 18 : izq);
    const dif = prim - izq;
    s += '<w:ind w:left="' + Math.round(izq * PT) + '"' + (a.indentEnd ? ' w:right="' + Math.round(a.indentEnd * PT) + '"' : '') + (dif >= 0 ? ' w:firstLine="' + Math.round(dif * PT) + '"' : ' w:hanging="' + Math.round(-dif * PT) + '"') + '/>';
  }
  const al = { left: 'left', center: 'center', right: 'right', justify: 'both' }[a.alignment];
  if (al) s += '<w:jc w:val="' + al + '"/>';
  // La marca de parrafo lleva el tamano de letra: asi una linea vacia mide lo mismo que el texto
  const marca = rPr({ fuente: p.base.fuente, tam: p.base.tam });
  return '<w:pPr>' + s + (extra || '') + marca + '</w:pPr>';
}

function imagenXml(im, ctx) {
  const rid = ctx.imagen(im);
  const cx = Math.round(im.w * EMU), cy = Math.round(im.h * EMU), id = ++ctx.docPr;
  return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + id + '" name="Imagen ' + id + '"/>' +
    '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:nvPicPr><pic:cNvPr id="' + id + '" name="imagen' + id + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
}

function parrafoXml(p, ctx) {
  if (p.tipo === 'PAGE_BREAK') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  return '<w:p>' + pPr(p, ctx) + runs(p) + p.hijos.map((im) => imagenXml(im, ctx)).join('') + '</w:p>';
}

function tablaXml(t, ctx) {
  const nc = t.filas.reduce((m, f) => Math.max(m, f.length), 0) || 1;
  const fijos = Object.keys(t.anchos).reduce((s, k) => s + (t.anchos[k] || 0), 0);
  const sinAncho = nc - Object.keys(t.anchos).filter((k) => t.anchos[k]).length;
  const resto = sinAncho > 0 ? Math.max(30, (ctx.anchoUtil - fijos) / sinAncho) : 0;
  const anchos = [];
  for (let j = 0; j < nc; j++) anchos.push(Math.round((t.anchos[j] || resto) * PT));
  const b = Math.max(2, Math.round((t.borde || 0.5) * 8)), cb = color(t.colorBorde) || '000000';
  const borde = (n) => '<w:' + n + ' w:val="single" w:sz="' + b + '" w:space="0" w:color="' + cb + '"/>';
  let s = '<w:tbl><w:tblPr><w:tblW w:w="' + anchos.reduce((x, y) => x + y, 0) + '" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(borde).join('') + '</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>';
  s += '<w:tblGrid>' + anchos.map((w) => '<w:gridCol w:w="' + w + '"/>').join('') + '</w:tblGrid>';
  t.filas.forEach((f, i) => {
    s += '<w:tr>' + (i === 0 ? '<w:trPr><w:tblHeader/></w:trPr>' : '');
    f.forEach((c, j) => {
      const mar = ['Top', 'Left', 'Bottom', 'Right'].filter((k) => c.pad[k] !== undefined).map((k) => '<w:' + k.toLowerCase() + ' w:w="' + Math.round(c.pad[k] * PT) + '" w:type="dxa"/>').join('');
      const fondo = color(c.fondo);
      s += '<w:tc><w:tcPr><w:tcW w:w="' + anchos[j] + '" w:type="dxa"/>' + (fondo ? '<w:shd w:val="clear" w:color="auto" w:fill="' + fondo + '"/>' : '') + (mar ? '<w:tcMar>' + mar + '</w:tcMar>' : '') + '</w:tcPr>' + parrafoXml(c.p, ctx) + '</w:tc>';
    });
    // Filas con menos celdas: se completan para que Word no marque la tabla como danada
    for (let j = f.length; j < nc; j++) s += '<w:tc><w:tcPr><w:tcW w:w="' + anchos[j] + '" w:type="dxa"/></w:tcPr><w:p/></w:tc>';
    s += '</w:tr>';
  });
  return s + '</w:tbl>';
}

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';

const NIVELES_GLIFO = {
  BULLET: ['bullet', '•'], HOLLOW_BULLET: ['bullet', 'o'], SQUARE_BULLET: ['bullet', '▪'],
  NUMBER: ['decimal', '%1.'], LATIN_LOWER: ['lowerLetter', '%1)'], LATIN_UPPER: ['upperLetter', '%1)'], ROMAN_LOWER: ['lowerRoman', '%1.'], ROMAN_UPPER: ['upperRoman', '%1.']
};

function numeracionXml(listas) {
  let abs = '', nums = '';
  listas.forEach((l, k) => {
    const g = NIVELES_GLIFO[l.glifo] || NIVELES_GLIFO.BULLET;
    let lv = '';
    for (let n = 0; n < 9; n++) {
      const fmt = g[0], txt = fmt === 'bullet' ? g[1] : g[1].replace('%1', '%' + (n + 1));
      lv += '<w:lvl w:ilvl="' + n + '"><w:start w:val="1"/><w:numFmt w:val="' + fmt + '"/><w:lvlText w:val="' + xml(txt) + '"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="' + (720 * (n + 1)) + '" w:hanging="360"/></w:pPr>' + (fmt === 'bullet' ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr>' : '') + '</w:lvl>';
    }
    abs += '<w:abstractNum w:abstractNumId="' + k + '"><w:multiLevelType w:val="hybridMultilevel"/>' + lv + '</w:abstractNum>';
    nums += '<w:num w:numId="' + (k + 1) + '"><w:abstractNumId w:val="' + k + '"/></w:num>';
  });
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ' + NS + '>' + abs + nums + '</w:numbering>';
}

function estilosXml(fuente) {
  const f = xml(fuente || 'Arial');
  const titulo = (n, tam) => '<w:style w:type="paragraph" w:styleId="Heading' + n + '"><w:name w:val="heading ' + n + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="' + (n - 1) + '"/></w:pPr><w:rPr><w:b/><w:sz w:val="' + tam + '"/></w:rPr></w:style>';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + NS + '>' +
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="' + f + '" w:hAnsi="' + f + '" w:cs="' + f + '" w:eastAsia="' + f + '"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-PE" w:eastAsia="es-PE" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:sz w:val="40"/></w:rPr></w:style>' +
    titulo(1, 28) + titulo(2, 26) + titulo(3, 24) + titulo(4, 24) + titulo(5, 22) + titulo(6, 22) +
    '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
    '</w:styles>';
}

/** Convierte el documento armado en los bytes de un .docx. */
function aDocx(doc) {
  const b = doc.cuerpo, pg = b.pagina;
  const ancho = pg.PageWidth || 612, alto = pg.PageHeight || 792;
  const mi = pg.MarginLeft !== undefined ? pg.MarginLeft : 72, md = pg.MarginRight !== undefined ? pg.MarginRight : 72;
  const ms = pg.MarginTop !== undefined ? pg.MarginTop : 72, mb = pg.MarginBottom !== undefined ? pg.MarginBottom : 72;
  const listas = [], idLista = new Map(), imagenes = [];
  const ctx = {
    anchoUtil: ancho - mi - md,
    docPr: 0,
    numId(p) {
      if (!idLista.has(p.lista.id)) { listas.push({ glifo: p.glifo }); idLista.set(p.lista.id, listas.length); }
      return idLista.get(p.lista.id);
    },
    imagen(im) {
      const ext = im.mime === 'image/png' ? 'png' : (im.mime === 'image/gif' ? 'gif' : 'jpeg');
      imagenes.push({ nombre: 'imagen' + (imagenes.length + 1) + '.' + ext, datos: im.datos, ext });
      return 'rIdImg' + imagenes.length;
    }
  };
  // Fuente predominante: la del primer parrafo con fuente
  let fuente = 'Arial';
  for (const h of b.hijos) { if (h.base && h.base.fuente) { fuente = h.base.fuente; break; } }
  let cuerpo = '';
  b.hijos.forEach((h) => { cuerpo += h.tipo === 'TABLE' ? tablaXml(h, ctx) : parrafoXml(h, ctx); });
  // Word exige un parrafo despues de una tabla final
  if (b.hijos.length && b.hijos[b.hijos.length - 1].tipo === 'TABLE') cuerpo += '<w:p/>';
  const sect = '<w:sectPr><w:pgSz w:w="' + Math.round(ancho * PT) + '" w:h="' + Math.round(alto * PT) + '"/><w:pgMar w:top="' + Math.round(ms * PT) + '" w:right="' + Math.round(md * PT) + '" w:bottom="' + Math.round(mb * PT) + '" w:left="' + Math.round(mi * PT) + '" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';
  const documento = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + '><w:body>' + cuerpo + sect + '</w:body></w:document>';
  const exts = Array.from(new Set(imagenes.map((i) => i.ext)));
  const tipos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    exts.map((e) => '<Default Extension="' + e + '" ContentType="image/' + e + '"/>').join('') +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';
  const relsRaiz = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>';
  const relsDoc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdEst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdCfg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
    imagenes.map((im, k) => '<Relationship Id="rIdImg' + (k + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + im.nombre + '"/>').join('') + '</Relationships>';
  const ajustes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings ' + NS + '><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>';
  const ahora = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + xml(doc.nombre || '') + '</dc:title><dc:creator>Quiero ser Ingeniero</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + ahora + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + ahora + '</dcterms:modified></cp:coreProperties>';
  const app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Quiero ser Ingeniero</Application></Properties>';
  return crearZip([
    { nombre: '[Content_Types].xml', datos: tipos },
    { nombre: '_rels/.rels', datos: relsRaiz },
    { nombre: 'docProps/core.xml', datos: core },
    { nombre: 'docProps/app.xml', datos: app },
    { nombre: 'word/document.xml', datos: documento },
    { nombre: 'word/styles.xml', datos: estilosXml(fuente) },
    { nombre: 'word/numbering.xml', datos: numeracionXml(listas.length ? listas : [{ glifo: 'BULLET' }]) },
    { nombre: 'word/settings.xml', datos: ajustes },
    { nombre: 'word/_rels/document.xml.rels', datos: relsDoc },
    ...imagenes.map((im) => ({ nombre: 'word/media/' + im.nombre, datos: im.datos }))
  ]);
}

/**
 * almacen: { nuevoId(), existe(id), guardarDoc(id, nombre, bytes) }
 */
function crearDocumentApp(almacen) {
  function Doc(id, nombre) {
    const self = this;
    this.cuerpo = new Cuerpo(); this.nombre = nombre;
    this.getBody = () => self.cuerpo;
    this.getId = () => id;
    this.getName = () => self.nombre;
    this.setName = (n) => { self.nombre = n; return self; };
    this.getUrl = () => 'https://docs.google.com/document/d/' + id + '/edit';
    this.saveAndClose = () => { almacen.guardarDoc(id, self.nombre, aDocx(self)); };
  }
  return {
    ParagraphHeading: EN.ParagraphHeading, HorizontalAlignment: EN.HorizontalAlignment, GlyphType: EN.GlyphType, ElementType: EN.ElementType,
    create(nombre) { const id = almacen.nuevoId(); const d = new Doc(id, String(nombre || 'Documento')); almacen.guardarDoc(id, d.nombre, aDocx(d)); return d; },
    // El documento se reconstruye siempre desde cero (body.clear), asi que se abre vacio
    openById(id) { const meta = almacen.existe(id); if (!meta || meta.tipo !== 'doc') throw new Error('No se encontró el documento ' + id); return new Doc(id, meta.nombre); }
  };
}

module.exports = { crearDocumentApp, aDocx, tamImagen, EN };

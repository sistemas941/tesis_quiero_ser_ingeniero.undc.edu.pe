/* Simulador minimo de los servicios de Google Apps Script para pruebas locales (Node y navegador). */
(function (G) {
  'use strict';
  var estado = { libros: {}, props: {}, cache: {}, docs: {}, carpetas: {}, archivos: {}, fetchLog: [], n: 0 };
  G.__mock = estado;
  function uid() { estado.n++; var s = ''; var h = '0123456789abcdef'; for (var i = 0; i < 32; i++) { s += h.charAt(Math.floor(Math.random() * 16)); if (i === 7 || i === 11 || i === 15 || i === 19) s += '-'; } return s; }
  function dos(n) { return (n < 10 ? '0' : '') + n; }


  // SHA-256 en JavaScript puro (bytes con signo, como los devuelve Apps Script)
  function utf8Bytes(str) { var utf = unescape(encodeURIComponent(String(str))), o = []; for (var i = 0; i < utf.length; i++) o.push(utf.charCodeAt(i)); return o; }
  function sha256(str) { return sha256Bytes(utf8Bytes(str)); }
  function hmac256(msg, clave) {
    var k = utf8Bytes(clave), m = utf8Bytes(msg);
    if (k.length > 64) k = sha256Bytes(k).map(function (x) { return x & 255; });
    while (k.length < 64) k.push(0);
    var ip = k.map(function (x) { return x ^ 0x36; }), op = k.map(function (x) { return x ^ 0x5c; });
    var interno = sha256Bytes(ip.concat(m)).map(function (x) { return x & 255; });
    return sha256Bytes(op.concat(interno));
  }
  function sha256Bytes(bytes) {
    bytes = bytes.slice();
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var l = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var s = 7; s >= 0; s--) bytes.push(s > 3 ? 0 : (l >>> (s * 8)) & 0xff);
    function rot(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var o = 0; o < bytes.length; o += 64) {
      var w = [];
      for (var j = 0; j < 64; j++) {
        if (j < 16) w[j] = (bytes[o + j * 4] << 24) | (bytes[o + j * 4 + 1] << 16) | (bytes[o + j * 4 + 2] << 8) | bytes[o + j * 4 + 3];
        else { var s0 = rot(w[j - 15], 7) ^ rot(w[j - 15], 18) ^ (w[j - 15] >>> 3), s1 = rot(w[j - 2], 17) ^ rot(w[j - 2], 19) ^ (w[j - 2] >>> 10); w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0; }
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (var k = 0; k < 64; k++) {
        var t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[k] + w[k]) | 0;
        var t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H = [(H[0] + a) | 0, (H[1] + b) | 0, (H[2] + c) | 0, (H[3] + d) | 0, (H[4] + e) | 0, (H[5] + f) | 0, (H[6] + g) | 0, (H[7] + h) | 0];
    }
    var out = [];
    H.forEach(function (x) { for (var q = 3; q >= 0; q--) { var v = (x >>> (q * 8)) & 0xff; out.push(v > 127 ? v - 256 : v); } });
    return out;
  }

  // ------------------------------------------------------------ Utilities, Session, Logger
  G.Utilities = {
    getUuid: uid,
    formatDate: function (d, tz, f) {
      var s = d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
      return f.length > 10 ? s + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes()) + ':' + dos(d.getSeconds()) : s;
    },
    sleep: function () {},
    DigestAlgorithm: { SHA_256: 'SHA_256', MD5: 'MD5' },
    Charset: { UTF_8: 'UTF_8' },
    computeDigest: function (alg, s) { return sha256(String(s)); },
    computeHmacSha256Signature: function (v, k) { return hmac256(v, k); },
    base64Decode: function (s) { return { base64: s, length: Math.floor(String(s).length * 3 / 4) }; },
    base64Encode: function (b) { return b && b.base64 ? b.base64 : ''; },
    newBlob: function (bytes, mime, nombre) { return { bytes: bytes, mime: mime, nombre: nombre, __blob: true, getBytes: function () { return bytes; }, getContentType: function () { return mime; }, getName: function () { return nombre; }, getDataAsString: function () { return typeof bytes === 'string' ? bytes : ''; } }; },
    unzip: function (b) { if (!b || !b.__zip) throw new Error('unzip: no es un zip'); return b.partes.map(function (q) { return G.Utilities.newBlob(q.data, 'application/xml', q.name); }); },
    zip: function (l, nombre) { return { __zip: true, __blob: true, nombre: nombre, partes: l.map(function (b) { return { name: b.getName(), data: b.getDataAsString() }; }), getName: function () { return nombre; } }; }
  };
  G.Session = { getEffectiveUser: function () { return { getEmail: function () { return 'profesor@undc.edu.pe'; } }; },
    // __usuarioActivo simula quien llama: el propietario en el editor, o un visitante de la aplicacion web (cadena vacia)
    getActiveUser: function () { return { getEmail: function () { return G.__usuarioActivo === undefined ? 'profesor@undc.edu.pe' : G.__usuarioActivo; } }; } };
  G.Logger = { log: function (m) { if (G.__verLog) console.log('[Logger]', m); } };
  G.PropertiesService = { getScriptProperties: function () { return { getProperty: function (k) { return estado.props.hasOwnProperty(k) ? estado.props[k] : null; }, setProperty: function (k, v) { estado.props[k] = String(v); } }; } };
  G.CacheService = { getScriptCache: function () { return {
    get: function (k) { return estado.cache.hasOwnProperty(k) ? estado.cache[k] : null; },
    put: function (k, v) { if (String(v).length > 100000) throw new Error('Argumento demasiado grande: value'); estado.cache[k] = String(v); },
    putAll: function (m) { Object.keys(m).forEach(function (k) { if (String(m[k]).length > 100000) throw new Error('Argumento demasiado grande: value'); }); Object.keys(m).forEach(function (k) { estado.cache[k] = String(m[k]); }); },
    getAll: function (ks) { var o = {}; ks.forEach(function (k) { if (estado.cache.hasOwnProperty(k)) o[k] = estado.cache[k]; }); return o; },
    remove: function (k) { delete estado.cache[k]; } }; } };
  G.LockService = { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } };

  // ------------------------------------------------------------ SpreadsheetApp
  // G.__hojaModo = { formato, apostrofo } simula como trata Hojas de calculo los textos en celdas con formato de texto:
  //   formato: "=1+1" queda como texto. apostrofo: el apostrofo inicial es un marcador y no se guarda.
  // G.__hojaModoAnexar, si existe, simula que appendRow se comporta distinto de setValues.
  function escribir(hoja, r, c, v, anexar) {
    var modo = (anexar && G.__hojaModoAnexar) || G.__hojaModo || { formato: true, apostrofo: true };
    var prueba = hoja.nombre.charAt(0) === '_';
    var txt = hoja.formatoFilas >= r;
    if (!txt && !prueba) throw new Error('Escritura sin formato de texto en ' + hoja.nombre + ', fila ' + r);
    if (r > hoja.maxFilas) throw new Error('Escritura fuera de la cuadricula en ' + hoja.nombre + ', fila ' + r);
    delete hoja.formulas[r + ',' + c];
    if (typeof v === 'string') {
      if (v.charAt(0) === "'" && modo.apostrofo) v = v.substring(1);
      else if (v.charAt(0) === '=' && !(txt && modo.formato)) { if (!prueba) throw new Error('Formula en la hoja: ' + v.substring(0, 30)); hoja.formulas[r + ',' + c] = v; v = 2; }
      else if (/^[+-]\d+$/.test(v) && !(txt && modo.formato)) { if (!prueba) throw new Error('Numero en la hoja: ' + v); v = parseFloat(v); }
    }
    while (hoja.datos.length < r) hoja.datos.push([]);
    hoja.datos[r - 1][c - 1] = v;
  }
  function Rango(hoja, r, c, nr, nc) {
    var self = this;
    this.getValues = function () { var o = []; for (var i = 0; i < nr; i++) { var f = []; for (var j = 0; j < nc; j++) { var fila = hoja.datos[r - 1 + i]; f.push(fila && fila[c - 1 + j] !== undefined ? fila[c - 1 + j] : ''); } o.push(f); } return o; };
    this.getFormulas = function () { var o = []; for (var i = 0; i < nr; i++) { var f = []; for (var j = 0; j < nc; j++) f.push(hoja.formulas[(r + i) + ',' + (c + j)] || ''); o.push(f); } return o; };
    this.setValues = function (v) { if (v.length !== nr || v.some(function (f) { return f.length !== nc; })) throw new Error('setValues: las dimensiones no coinciden con el rango en ' + hoja.nombre); for (var i = 0; i < v.length; i++) { for (var j = 0; j < v[i].length; j++) escribir(hoja, r + i, c + j, v[i][j]); } return self; };
    this.setValue = function (v) { escribir(hoja, r, c, v); return self; };
    this.setNumberFormat = function (f) { if (f === '@' && r <= hoja.formatoFilas + 1) hoja.formatoFilas = Math.max(hoja.formatoFilas, r + nr - 1); return self; };
    this.setFontWeight = function () { return self; };
    this.clearContent = function () { for (var i = 0; i < nr; i++) { var f = hoja.datos[r - 1 + i]; if (!f) continue; for (var j = 0; j < nc; j++) { if (f.length >= c + j) f[c - 1 + j] = ''; } } return self; };
    this.setBackground = function () { return self; };
  }
  function Hoja(nombre) {
    var self = this;
    this.nombre = nombre; this.datos = []; this.formulas = {}; this.formatoFilas = 0; this.maxFilas = G.__filasIniciales || 1000; this.maxColumnas = 26;
    this.getName = function () { return self.nombre; };
    this.setName = function (n) { self.nombre = n; return self; };
    this.getMaxRows = function () { return self.maxFilas; };
    this.getLastRow = function () { return self.datos.length; };
    this.getLastColumn = function () { var nc = 0; self.datos.forEach(function (f) { if (f.length > nc) nc = f.length; }); return nc; };
    this.getMaxColumns = function () { return self.maxColumnas; };
    this.insertColumnsAfter = function (despues, cuantas) { self.maxColumnas += cuantas; return self; };
    this.getDataRange = function () { G.__lecturas = (G.__lecturas || 0) + 1; G.__celdas = (G.__celdas || 0) + self.datos.length; var nc = 0; self.datos.forEach(function (f) { if (f.length > nc) nc = f.length; }); return new Rango(self, 1, 1, self.datos.length, nc); };
    this.getRange = function (r, c, nr, nc) { return new Rango(self, r, c, nr || 1, nc || 1); };
    this.insertRowsAfter = function (despues, cuantas) { if (despues !== self.maxFilas) throw new Error('insertRowsAfter: solo se simula al final'); self.maxFilas += cuantas; return self; };
    this.appendRow = function (f) { var r = self.datos.length + 1; if (r > self.maxFilas) self.maxFilas = r; f.forEach(function (v, j) { escribir(self, r, j + 1, v, true); }); return self; };
    this.deleteRow = function (r) { self.datos.splice(r - 1, 1); return self; };
    this.setFrozenRows = function () { return self; };
  }
  function Libro(id, nombre) {
    var self = this;
    this.hojas = [];
    this.getId = function () { return id; };
    this.getUrl = function () { return 'https://docs.google.com/spreadsheets/d/' + id + '/edit'; };
    this.getSheetByName = function (n) { for (var i = 0; i < self.hojas.length; i++) { if (self.hojas[i].nombre === n) return self.hojas[i]; } return null; };
    this.insertSheet = function (n) { var h = new Hoja(n); self.hojas.push(h); return h; };
    this.getSheets = function () { return self.hojas; };
    this.deleteSheet = function (h) { self.hojas = self.hojas.filter(function (x) { return x !== h; }); };
  }
  G.SpreadsheetApp = {
    flush: function () {},
    getActiveSpreadsheet: function () { return null; },
    openById: function (id) { if (!estado.libros[id]) throw new Error('No existe la hoja ' + id); return estado.libros[id]; },
    create: function (nombre) { var id = 'hoja_' + uid(); estado.libros[id] = new Libro(id, nombre); return estado.libros[id]; }
  };

  // ------------------------------------------------------------ DriveApp
  function Carpeta(nombre) {
    var self = this; var id = 'carp_' + uid(); this.nombre = nombre; this.hijas = [];
    estado.carpetas[id] = this;
    this.getId = function () { return id; };
    this.createFolder = function (n) { var c = new Carpeta(n); self.hijas.push(c); return c; };
    this.createFile = function (b) { var id = 'arch_' + uid().replace(/-/g, ''); estado.archivos[id] = { id: id, carpeta: self.nombre, vistas: [], compartido: '', blob: b }; return G.DriveApp.getFileById(id); };
    this.getFoldersByName = function (n) { var l = self.hijas.filter(function (c) { return c.nombre === n; }); var i = 0; return { hasNext: function () { return i < l.length; }, next: function () { return l[i++]; } }; };
  }
  var raiz = new Carpeta('Mi unidad');
  G.DriveApp = {
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, Permission: { VIEW: 'VIEW' },
    createFolder: function (n) { return raiz.createFolder(n); },
    getFolderById: function (id) { return estado.carpetas[id]; },
    getRootFolder: function () { return raiz; },
    createFile: function (b) { return raiz.createFile(b); },
    getFileById: function (id) { if (!estado.archivos[id]) estado.archivos[id] = { id: id, carpeta: null, vistas: [], compartido: '' }; var a = estado.archivos[id]; return { getId: function () { return id; }, setTrashed: function (v) { a.papelera = v; return this; }, makeCopy: function (n) { var nid = 'copia_' + uid().replace(/-/g, ''); estado.archivos[nid] = { id: nid, nombre: n, copiaDe: id, vistas: [], compartido: '' }; return G.DriveApp.getFileById(nid); }, moveTo: function (c) { a.carpeta = c.nombre; }, addViewer: function (e) { a.vistas.push(e); }, setSharing: function (x) { a.compartido = x; }, getBlob: function () { if (a.blob) { var bb = { __blob: true, bytes: { base64: '', length: 10 }, tam: [800, 600] }; bb.getBytes = function () { return bb.bytes; }; bb.getContentType = function () { return 'image/jpeg'; }; return bb; } var b = G.__logoBase64 ? { __blob: true, logo: true, bytes: { base64: G.__logoBase64, length: Math.floor(G.__logoBase64.length * 3 / 4) }, tam: G.__logoTam } : { __blob: true, logo: true, bytes: { base64: '', length: 0 } }; b.getBytes = function () { return b.bytes; }; b.getContentType = function () { return 'image/png'; }; return b; } }; }
  };

  // ------------------------------------------------------------ DocumentApp
  var EN = { ParagraphHeading: { NORMAL: 'NORMAL', HEADING1: 'HEADING1', HEADING2: 'HEADING2', HEADING3: 'HEADING3', HEADING4: 'HEADING4' }, HorizontalAlignment: { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFY: 'justify' }, GlyphType: { BULLET: 'BULLET', NUMBER: 'NUMBER' }, ElementType: { PARAGRAPH: 'PARAGRAPH', TABLE: 'TABLE', LIST_ITEM: 'LIST_ITEM' } };
  function Texto(p) {
    var self = this;
    function poner(prop, a, b, c) {
      if (b === undefined) { p.base[prop] = a; p.rangos = p.rangos.filter(function (r) { return r.prop !== prop; }); }
      else { if (a < 0 || b >= p.texto.length || b < a) throw new Error('Rango de texto fuera de limites: ' + a + '-' + b + ' en un texto de ' + p.texto.length); p.rangos.push({ prop: prop, a: a, b: b, v: c }); }
      return self;
    }
    this.setFontFamily = function (a, b, c) { return poner('fuente', a, b, c); };
    this.setFontSize = function (a, b, c) { return poner('tam', a, b, c); };
    this.setBold = function (a, b, c) { return poner('negrita', a, b, c); };
    this.setItalic = function (a, b, c) { return poner('cursiva', a, b, c); };
    this.setForegroundColor = function (a, b, c) { return poner('color', a, b, c); };
    this.setBackgroundColor = function (a, b, c) { return poner('fondo', a, b, c); };
    this.setUnderline = function (a, b, c) { return poner('subrayado', a, b, c); };
  }
  function Parrafo(texto, tipo) {
    var self = this;
    this.tipo = tipo || 'PARAGRAPH'; this.texto = texto || ''; this.base = {}; this.rangos = []; this.at = { heading: 'NORMAL' };
    this.getType = function () { return self.tipo; };
    this.asParagraph = function () { return self; };
    this.setText = function (t) { self.texto = t; return self; };
    this.getText = function () { return self.texto; };
    this.editAsText = function () { return new Texto(self); };
    ['Heading', 'Alignment', 'LineSpacing', 'SpacingBefore', 'SpacingAfter', 'IndentFirstLine', 'IndentStart', 'GlyphType', 'ListId'].forEach(function (k) {
      self['set' + k] = function (v) { self.at[k.charAt(0).toLowerCase() + k.substring(1)] = (k === 'ListId') ? 'lista' : v; return self; };
    });
  }
  function Celda(texto) {
    var self = this; this.p = new Parrafo(texto); this.fondo = '';
    ['Top', 'Bottom', 'Left', 'Right'].forEach(function (k) { self['setPadding' + k] = function () { return self; }; });
    this.editAsText = function () { return self.p.editAsText(); };
    this.setBackgroundColor = function (c) { self.fondo = c; return self; };
    this.getNumChildren = function () { return 1; };
    this.getChild = function () { return self.p; };
  }
  function Tabla(celdas) {
    var self = this; this.tipo = 'TABLE'; this.anchos = {};
    this.filas = celdas.map(function (f) { return f.map(function (c) { if (typeof c !== 'string') throw new Error('appendTable requiere cadenas'); return new Celda(c); }); });
    this.getType = function () { return 'TABLE'; };
    this.getNumRows = function () { return self.filas.length; };
    this.getRow = function (i) { var f = self.filas[i]; if (!f) throw new Error('Fila inexistente ' + i); return { getNumCells: function () { return f.length; }, getCell: function (j) { if (!f[j]) throw new Error('Celda inexistente ' + i + ',' + j); return f[j]; } }; };
    this.setColumnWidth = function (i, w) { self.anchos[i] = w; return self; };
    this.setBorderWidth = function (w) { self.borde = w; return self; };
    this.setBorderColor = function (c) { self.colorBorde = c; return self; };
  }
  function Imagen(blob) {
    var self = this; this.tipo = 'IMAGE'; this.blob = blob; this.w = blob.tam ? blob.tam[0] : 400; this.h = blob.tam ? blob.tam[1] : 300; this.pp = new Parrafo('');
    this.getWidth = function () { return self.w; }; this.getHeight = function () { return self.h; };
    this.setWidth = function (v) { self.w = v; return self; }; this.setHeight = function (v) { self.h = v; return self; };
    this.getParent = function () { return self.pp; };
  }
  function Cuerpo() {
    var self = this; this.hijos = [new Parrafo('')]; this.pagina = {};
    this.clear = function () { self.hijos = [new Parrafo('')]; return self; };
    ['PageWidth', 'PageHeight', 'MarginLeft', 'MarginRight', 'MarginTop', 'MarginBottom'].forEach(function (k) { self['set' + k] = function (v) { self.pagina[k] = v; return self; }; });
    this.getChild = function (i) { return self.hijos[i]; };
    this.appendParagraph = function (t) { var p = new Parrafo(t); self.hijos.push(p); return p; };
    this.appendPageBreak = function () { var p = new Parrafo('', 'PAGE_BREAK'); self.hijos.push(p); return p; };
    this.appendListItem = function (t) { var p = new Parrafo(t, 'LIST_ITEM'); self.hijos.push(p); return p; };
    this.appendTable = function (c) { var t = new Tabla(c); self.hijos.push(t); return t; };
    this.appendImage = function (b) { if (!b || !b.__blob) throw new Error('appendImage requiere un blob'); var im = new Imagen(b); self.hijos.push(im); return im; };
  }
  function Doc(id, nombre) {
    var self = this; this.cuerpo = new Cuerpo(); this.nombre = nombre; this.guardado = 0;
    this.getBody = function () { return self.cuerpo; };
    this.getId = function () { return id; };
    this.getUrl = function () { return 'https://docs.google.com/document/d/' + id + '/edit'; };
    this.saveAndClose = function () { self.guardado++; };
  }
  G.DocumentApp = {
    ParagraphHeading: EN.ParagraphHeading, HorizontalAlignment: EN.HorizontalAlignment, GlyphType: EN.GlyphType, ElementType: EN.ElementType,
    create: function (n) { var id = 'doc_' + uid(); estado.docs[id] = new Doc(id, n); return estado.docs[id]; },
    openById: function (id) { if (!estado.docs[id]) throw new Error('No existe el documento'); return estado.docs[id]; }
  };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function htmlParrafo(p, etiqueta) {
    var n = p.texto.length; var out = ''; var i = 0;
    function estiloEn(k) { var e = {}; for (var a in p.base) e[a] = p.base[a]; p.rangos.forEach(function (r) { if (k >= r.a && k <= r.b) e[r.prop] = r.v; }); return e; }
    function css(e) { return (e.fuente ? 'font-family:\'' + e.fuente + '\',serif;' : '') + (e.tam ? 'font-size:' + e.tam + 'pt;' : '') + (e.negrita ? 'font-weight:bold;' : 'font-weight:normal;') + (e.cursiva ? 'font-style:italic;' : 'font-style:normal;') + (e.fondo ? 'background:' + e.fondo + ';' : ''); }
    while (i < n) { var c = css(estiloEn(i)); var j = i; while (j < n && css(estiloEn(j)) === c) j++; out += '<span style="' + c + '">' + esc(p.texto.substring(i, j)) + '</span>'; i = j; }
    var a = p.at; var est = 'margin:0;text-align:' + (a.alignment || 'left') + ';line-height:' + (a.lineSpacing || 1.15) + ';margin-top:' + (a.spacingBefore || 0) + 'pt;margin-bottom:' + (a.spacingAfter || 0) + 'pt;text-indent:' + (a.indentFirstLine !== undefined && a.indentStart !== undefined ? (a.indentFirstLine - a.indentStart) : (a.indentFirstLine || 0)) + 'pt;padding-left:' + (a.indentStart || 0) + 'pt;' + css(p.base);
    return '<' + etiqueta + ' style="' + est + '">' + (out || '&nbsp;') + '</' + etiqueta + '>';
  }
  /** Vista previa HTML del documento generado (para control visual). */
  G.__docHtml = function (id) {
    var d = estado.docs[id]; var b = d.cuerpo; var pg = b.pagina;
    var h = '<!doctype html><html><head><meta charset="utf-8"><style>@page{size:' + (pg.PageWidth ? pg.PageWidth + 'pt ' + pg.PageHeight + 'pt' : 'A4') + ';margin:' + (pg.MarginTop || 70) + 'pt ' + (pg.MarginRight || 70) + 'pt ' + (pg.MarginBottom || 70) + 'pt ' + (pg.MarginLeft || 85) + 'pt}body{margin:0;font-family:Arial,"Liberation Sans",sans-serif;font-size:12pt}table{border-collapse:collapse;width:100%;margin:0 0 4pt}td{border:1px solid #000;padding:3pt 4pt;vertical-align:top}ul{margin:0;padding-left:28pt}</style></head><body>';
    var enLista = false;
    b.hijos.forEach(function (e) {
      if (e.tipo !== 'LIST_ITEM' && enLista) { h += '</ul>'; enLista = false; }
      if (e.tipo === 'PAGE_BREAK') h += '<div style="break-after:page"></div>';
      else if (e.tipo === 'LIST_ITEM') { if (!enLista) { h += '<ul>'; enLista = true; } h += htmlParrafo(e, 'li'); }
      else if (e.tipo === 'TABLE') {
        var total = 0; var k; for (k in e.anchos) total += e.anchos[k];
        h += '<table>'; e.filas.forEach(function (f) { h += '<tr>'; f.forEach(function (c, j) { h += '<td style="' + (c.fondo ? 'background:' + c.fondo + ';' : '') + (total && e.anchos[j] ? 'width:' + (100 * e.anchos[j] / total).toFixed(1) + '%' : '') + '">' + htmlParrafo(c.p, 'div').replace(/\n/g, '<br>') + '</td>'; }); h += '</tr>'; }); h += '</table>';
      } else if (e.tipo === 'IMAGE') {
        var src = e.blob.bytes && e.blob.bytes.base64 ? 'data:image/png;base64,' + e.blob.bytes.base64 : '';
        h += '<div style="text-align:' + (e.pp.at.alignment || 'left') + ';margin-bottom:' + (e.pp.at.spacingAfter || 0) + 'pt">' + (src ? '<img src="' + src + '" style="width:' + e.w + 'pt;height:' + e.h + 'pt">' : '<div style="display:inline-block;width:' + Math.round(e.w) + 'pt;height:' + Math.round(e.h) + 'pt;border:1px dashed #888;line-height:' + Math.round(e.h) + 'pt;font-size:9pt;color:#666">escudo</div>') + '</div>';
      } else {
        var tag = e.at.heading === 'HEADING1' ? 'h1' : (e.at.heading === 'HEADING2' ? 'h2' : (e.at.heading === 'HEADING3' ? 'h3' : (e.at.heading === 'HEADING4' ? 'h4' : 'p')));
        h += htmlParrafo(e, tag);
      }
    });
    if (enLista) h += '</ul>';
    return h + '</body></html>';
  };

  // ------------------------------------------------------------ HtmlService
  G.HtmlService = {
    createTemplateFromFile: function (n) { return { evaluate: function () { var o = { titulo: '', setTitle: function (t) { o.titulo = t; return o; }, addMetaTag: function () { return o; }, getContent: function () { return G.__leerArchivo ? G.__leerArchivo(n + '.html') : ''; } }; return o; } }; },
    createHtmlOutputFromFile: function (n) { return { getContent: function () { return G.__leerArchivo ? G.__leerArchivo(n + '.html') : ''; } }; }
  };

  // ------------------------------------------------------------ UrlFetchApp
  function resp(cod, cuerpo) { return { getResponseCode: function () { return cod; }, getContentText: function () { return typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo); } }; }
  var CROSSREF = {
    '10.1016/j.compbiomed.2020.103792': { DOI: '10.1016/j.compbiomed.2020.103792', title: ['Automated detection of COVID-19 cases using deep neural networks with X-ray images'], author: [{ given: 'Tulin', family: 'Ozturk' }, { given: 'Muhammed', family: 'Talo' }, { given: 'Eylul Azra', family: 'Yildirim' }, { given: 'Ulas Baran', family: 'Baloglu' }, { given: 'Ozal', family: 'Yildirim' }, { given: 'U. Rajendra', family: 'Acharya' }], 'container-title': ['Computers in Biology and Medicine'], volume: '121', page: '103792', type: 'journal-article', issued: { 'date-parts': [[2020, 6]] }, publisher: 'Elsevier BV', URL: 'https://doi.org/10.1016/j.compbiomed.2020.103792' }
  };
  G.__crossref = CROSSREF;
  function geminiSimulado(cuerpo) {
    var u = cuerpo.contents[0].parts[0].text; var j;
    if (G.__geminiHook) { j = G.__geminiHook(u, cuerpo); }
    if (!j) {
      if (u.indexOf('"sintesis"') >= 0) { var cl = []; var rc = /\[@([A-Za-z0-9_\-]+)\] /g; var mc; while ((mc = rc.exec(u)) !== null) { if (cl.indexOf(mc[1]) < 0) cl.push(mc[1]); } j = { sintesis: 'Los modelos convolucionales alcanzan alta exactitud [@' + cl[0] + '], aunque su desempeño baja en otros hospitales [@' + (cl[1] || cl[0]) + '] [@inventada2030].', tendencias: ['Transferencia de aprendizaje'], brechas: [{ brecha: 'Faltan validaciones en hospitales peruanos', estudios: '[@' + cl[0] + '] [@' + (cl[1] || cl[0]) + ']', respuesta: 'Validar con radiografías de Cañete' }], preguntas_abiertas: ['¿El modelo generaliza a equipos de rayos X antiguos?'], metodos: ['Validación cruzada de cinco pliegues'], declaracion_brecha: 'Lo que existe consigue alta exactitud, pero no en hospitales locales; esta investigación propone validarlo en Cañete.' }; }
      else if (u.indexOf('"observaciones"') >= 0) j = G.__revision || { observaciones: [{ campo: 'tema', nivel: 'mejorable', texto: 'Precisa el periodo de estudio.', item: 1 }], resumen: 'La etapa es coherente; hay un punto mejorable.' };
      else if (u.indexOf('"evaluacion"') >= 0) j = { evaluacion: [{ pregunta: 'P1', valoracion: 'parcial', comentario: 'Falta precisar la fuente de los datos.' }, { pregunta: 'P2', valoracion: 'sólida', comentario: 'Bien sustentada.' }, { pregunta: 'P3', valoracion: 'débil', comentario: 'No responde a la pregunta.' }], consejo: 'Vuelve a la tabla de causas y añade evidencia local.' };
      else if (u.indexOf('"filas"') >= 0) { var cols = []; var re = /"([a-z_0-9]+)" \(/g; var m; var zona = u.substring(u.lastIndexOf('exactamente estas claves')); while ((m = re.exec(zona)) !== null) cols.push(m[1]); var f1 = {}, f2 = {}; cols.forEach(function (c, i) { f1[c] = 'Propuesta A' + (i + 1); f2[c] = 'Propuesta B' + (i + 1); }); if (f1.inicio !== undefined) { f1.inicio = '1'; f1.fin = '2'; f2.inicio = '3'; f2.fin = '4'; } if (f1.rubro !== undefined) { f1.rubro = 'Personal'; f2.rubro = 'Bienes'; f1.cantidad = '1'; f1.costo = '500'; f2.cantidad = '2'; f2.costo = '120'; } j = { filas: [f1, f2], faltantes: ['Confirma los valores con tus datos.'] }; }
      else if (u.indexOf('"preguntas"') >= 0) j = { preguntas: ['¿Qué dato demuestra que el problema existe hoy?', '¿A quién afecta y con qué frecuencia?', '¿Qué fuente de tu biblioteca lo respalda?'] };
      else if (u.indexOf('"objetivo": ""') >= 0) j = { objetivo: 'desarrollar un modelo de red neuronal profunda para detectar COVID-19 en radiografías de tórax', metodologia: 'se entrenó la red DarkCovidNet con 1 125 radiografías y validación cruzada de cinco pliegues', resultados: 'el modelo alcanzó una exactitud de 98.08 % en la clasificación binaria y de 87.02 % en la de tres clases', conclusion: 'el modelo puede apoyar al radiólogo en el tamizaje inicial' };
      else if (u.indexOf('"items"') >= 0) { var its = []; var r2 = /Ítem (\d+):/g; var mm; while ((mm = r2.exec(u)) !== null) its.push({ item: parseInt(mm[1], 10), nivel: 3 + (parseInt(mm[1], 10) % 2), observacion: 'Para subir de nivel, precisa la evidencia y la relación con las variables.' }); j = { items: its }; }
      else if (u.indexOf('{"ok": true}') >= 0) j = { ok: true };
      else if (u.indexOf('"var1": ""') >= 0) j = { var1: 'sistema web de trazabilidad', var2: 'control de inventarios', contexto: 'una ferretería de San Vicente de Cañete', tipo: 'artefacto' };
      else if (u.indexOf('"ejemplo"') >= 0) j = { texto: 'Describe el estado negativo actual con un dato que lo demuestre. La rúbrica pide que sea claro, actual y relevante.', ejemplo: 'En la biblioteca municipal, el 40 % de los préstamos se registra con retraso de más de un día.' };
      else j = { texto: 'A nivel internacional, el problema ha sido documentado por diversos estudios [@ozturk2020]. En el plano nacional la situación es similar [@inventado2021]. [por completar: dato local de la organización]', faltantes: ['Dato local con su fuente.'] };
    }
    return resp(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(j) }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: Math.round(u.length / 4), candidatesTokenCount: 180, totalTokenCount: Math.round(u.length / 4) + 180 } });
  }
  G.ScriptApp = { getOAuthToken: function () { return 'token-simulado'; } };
  G.UrlFetchApp = {
    fetchAll: function (pedidos) { return pedidos.map(function (q) { return G.UrlFetchApp.fetch(q.url, q); }); },
    fetch: function (url, o) {
      estado.fetchLog.push({ url: url, o: o });
      var mx = /docs\.google\.com\/document\/d\/([^\/]+)\/export\?format=docx/.exec(url);
      if (mx) {
        var d = estado.docs[mx[1]];
        if (!d) return resp(404, 'no existe');
        var xml = '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + d.cuerpo.hijos.filter(function (e) { return e.tipo === 'PARAGRAPH' || e.tipo === 'LIST_ITEM'; }).map(function (e) { return '<w:p><w:pPr></w:pPr><w:r><w:t xml:space="preserve">' + esc(e.texto) + '</w:t></w:r></w:p>'; }).join('') + '</w:body></w:document>';
        var zr = resp(200, ''); zr.getBlob = function () { return { __zip: true, __blob: true, partes: [{ name: '[Content_Types].xml', data: '<Types/>' }, { name: 'word/document.xml', data: xml }] }; };
        estado.ultimoDocx = xml;
        return zr;
      }
      if (url.indexOf('generativelanguage.googleapis.com') >= 0) {
        if (G.__geminiTimeout) throw new Error('Timeout: ' + url);
        if (!o.headers || !o.headers['x-goog-api-key']) return resp(403, { error: { message: 'API key missing' } });
        estado.ultimaClave = o.headers['x-goog-api-key'];
        if (o.headers['x-goog-api-key'].indexOf('SUSPENDIDA') >= 0) return resp(403, { error: { message: "Consumer 'api_key:" + o.headers['x-goog-api-key'] + "' has been suspended." } });
        if (o.headers['x-goog-api-key'].indexOf('MALA') >= 0) return resp(400, { error: { message: 'API key not valid. Please pass a valid API key.' } });
        if (G.__geminiFalla) return resp(G.__geminiFalla, { error: { message: 'fallo simulado' } });
        return geminiSimulado(JSON.parse(o.payload));
      }
      if (url.indexOf('api.openalex.org') >= 0) {
        if (G.__openalexCae) return resp(429, { error: 'Too many requests' });
        return resp(200, { meta: { count: 2 }, results: [
          { id: 'https://openalex.org/W1', doi: 'https://doi.org/10.1016/j.compbiomed.2020.103792', display_name: 'Automated detection of COVID-19 cases using deep neural networks with X-ray images', publication_year: 2020, type: 'article', authorships: [{ author: { display_name: 'Tulin Ozturk' } }, { author: { display_name: 'Muhammed Talo' } }], primary_location: { source: { display_name: 'Computers in Biology and Medicine' }, landing_page_url: 'https://doi.org/10.1016/j.compbiomed.2020.103792' }, cited_by_count: 2500, abstract_inverted_index: { 'The': [0], 'novel': [1], 'coronavirus': [2], '2019': [3], '(COVID-19)': [4], 'first': [5], 'appeared': [6], 'in': [7, 20], 'Wuhan.': [8], 'A': [9], 'new': [10], 'model': [11], 'for': [12], 'automatic': [13], 'COVID-19': [14], 'detection': [15], 'using': [16], 'raw': [17], 'chest': [18], 'X-ray': [19], 'images': [21], 'is': [22], 'presented,': [23], 'with': [24], 'an': [25], 'accuracy': [26], 'of': [27], '98.08%': [28], 'for': [29], 'binary': [30], 'classes.': [31] } },
          { id: 'https://openalex.org/W2', doi: 'https://doi.org/10.1000/sin-crossref', display_name: 'Estudio sin registro en Crossref', publication_year: 2023, type: 'article', authorships: [{ author: { display_name: 'Ana Perez Soto' } }], primary_location: { source: { display_name: 'Revista de Prueba' } }, cited_by_count: 3, abstract_inverted_index: {"Se": [0], "propone": [1], "un": [2], "modelo": [3, 15, 36], "de": [4, 12, 26, 39], "redes": [5], "convolucionales": [6], "para": [7], "detectar": [8], "COVID-19": [9], "en": [10], "radiografías": [11], "tórax.": [13], "El": [14], "se": [16, 32], "evaluó": [17], "con": [18, 37], "1": [19], "200": [20], "imágenes": [21, 38], "y": [22], "obtuvo": [23], "una": [24], "exactitud": [25], "96": [27], "%.": [28], "Como": [29], "trabajo": [30], "futuro": [31], "plantea": [33], "validar": [34], "el": [35], "otros": [40], "hospitales.": [41]} }
        ] });
      }
      if (url.indexOf('api.crossref.org/works?') >= 0) {
        return resp(200, { status: 'ok', message: { 'total-results': 1, items: [CROSSREF['10.1016/j.compbiomed.2020.103792']] } });
      }
      if (url.indexOf('api.crossref.org/works/') >= 0) {
        if (G.__crossrefCae) return resp(503, 'Service Unavailable');
        var doi = decodeURIComponent(url.split('/works/')[1].split('?')[0]).toLowerCase();
        return CROSSREF[doi] ? resp(200, { status: 'ok', message: CROSSREF[doi] }) : resp(404, 'Resource not found.');
      }
      // Otros proveedores de IA (BYOK): responden con el mismo simulador de Gemini
      if (/api\.groq\.com|api\.anthropic\.com|api\.moonshot\.ai|api\.deepseek\.com|api\.openai\.com|openrouter\.ai/.test(url)) {
        G.__mock.fetchLog.push(url);
        var cu = JSON.parse(o.payload), h = o.headers || {};
        var k = h['x-api-key'] || String(h.Authorization || '').replace('Bearer ', '');
        if (k.indexOf('mala') >= 0) return resp(401, { error: { message: 'invalid api key ' + k } });
        var txtU = cu.messages.map(function (m) { return m.content; }).join('\n') + (cu.system ? '\n' + cu.system : '');
        var g = JSON.parse(geminiSimulado({ contents: [{ parts: [{ text: txtU }] }], systemInstruction: { parts: [{ text: cu.system || '' }] } }).getContentText());
        var texto = g.candidates[0].content.parts[0].text;
        if (/api\.anthropic\.com/.test(url)) return resp(200, { model: cu.model, content: [{ type: 'text', text: texto }], usage: { input_tokens: 10, output_tokens: 20 } });
        return resp(200, { model: cu.model, choices: [{ message: { content: texto } }], usage: { prompt_tokens: 10, completion_tokens: 20 } });
      }
      if (url.indexOf('api.consensus.app/v1/search') >= 0) {
        G.__mock.fetchLog.push(url);
        var hk = (o.headers || {})['x-api-key'] || '';
        if (hk.indexOf('mala') >= 0) return resp(401, { detail: 'Not authenticated' });
        return resp(200, { page: 0, page_size: 3, is_end: true, next_page: null, results: [
          { title: 'Automated detection of COVID-19 cases using deep neural networks with X-ray images', authors: ['Tulin Ozturk', 'Muhammed Talo'], publish_year: 2020, doi: '10.1016/j.compbiomed.2020.103792', journal_name: 'Computers in Biology and Medicine', abstract: 'A deep model for COVID-19 detection.', url: 'https://consensus.app/papers/x', citation_count: 2500, pages: '103792', volume: '121', takeaway: 'DarkCovidNet reaches 98% accuracy.', study_type: 'non-rct experimental', sjr_best_quartile: 1 },
          { title: 'Pediatric pneumonia classification with transfer learning on chest radiographs', authors: ['Maria Lopez', 'John Smith'], publish_year: 2024, doi: '10.9999/ped.2024.1', journal_name: 'Pediatric Radiology', abstract: 'Transfer learning improves pneumonia classification in children.', url: 'https://consensus.app/papers/y', citation_count: 12, pages: '1-10', volume: '54', takeaway: 'Transfer learning improves sensitivity in children.', study_type: 'systematic review', sjr_best_quartile: 1, sample_size: 5800 },
          { title: 'Limitations of deep learning for chest X-ray diagnosis in low-resource hospitals', authors: ['Ana Quispe'], publish_year: 2023, doi: '10.9999/lim.2023.7', journal_name: 'Health Informatics Journal', abstract: 'Models degrade with images from different hospitals.', url: 'https://consensus.app/papers/z', citation_count: 30, pages: '22-30', volume: '29', takeaway: 'Accuracy drops on external hospitals.' }
        ] });
      }
      return resp(404, 'no simulado');
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);

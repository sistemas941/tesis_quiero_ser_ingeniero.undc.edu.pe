// ------------------------------------------------------------------ Markdown ligero del borrador (lectura y vista previa)
// La misma sintaxis que entiende el servidor al armar el Word (Informe.gs: leerMd_ y tramosMd_).

/** Bloques de una seccion: h, p, li, cita, tabla, fig, eq. */
function leerMd(texto) {
  var lineas = String(texto || '').replace(/\r\n?/g, '\n').split('\n');
  var out = [], i = 0, tituloTabla = null, m;
  while (i < lineas.length) {
    var t = lineas[i].trim();
    if (!t) { i++; continue; }
    if ((m = /^(#{2,4})\s+(.*)$/.exec(t))) { out.push({ t: 'h', n: m[1].length, x: m[2].trim() }); i++; continue; }
    if (/^\$\$/.test(t)) {
      var eq = t.replace(/^\$\$/, '');
      if (/\$\$$/.test(eq) && eq.length >= 2) { out.push({ t: 'eq', x: eq.replace(/\$\$$/, '').trim() }); i++; continue; }
      i++;
      while (i < lineas.length && !/\$\$\s*$/.test(lineas[i])) { eq += '\n' + lineas[i]; i++; }
      if (i < lineas.length) { eq += '\n' + lineas[i].replace(/\$\$\s*$/, ''); i++; }
      out.push({ t: 'eq', x: eq.trim() });
      continue;
    }
    if ((m = /^Tabla\s*:\s*(.*)$/i.exec(t)) && i + 1 < lineas.length && /^\s*\|/.test(lineas[i + 1])) { tituloTabla = m[1].trim(); i++; continue; }
    if (/^\|/.test(t)) {
      var filas = [];
      while (i < lineas.length && /^\s*\|/.test(lineas[i])) {
        var f = lineas[i].trim().replace(/^\|/, '').replace(/\|$/, '');
        if (!/^\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*$/.test(f)) filas.push(f.split('|').map(function (c) { return c.trim(); }));
        i++;
      }
      var nota = '';
      if (i < lineas.length && /^\s*Nota\s*[:.]/i.test(lineas[i])) { nota = lineas[i].trim().replace(/^Nota\s*[:.]\s*/i, ''); i++; }
      var ancho = 0;
      filas.forEach(function (x) { ancho = Math.max(ancho, x.length); });
      filas = filas.map(function (x) { while (x.length < ancho) x.push(''); return x; });
      if (filas.length) out.push({ t: 'tabla', titulo: tituloTabla || '', filas: filas, nota: nota });
      tituloTabla = null;
      continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)]*)\)\s*$/.exec(t))) {
      var id = /^fig:([A-Za-z0-9_\-]{10,})$/.exec(m[2].trim()), fuente = '';
      if (i + 1 < lineas.length && /^\s*Fuente\s*[:.]/i.test(lineas[i + 1])) { fuente = lineas[i + 1].trim().replace(/^Fuente\s*[:.]\s*/i, ''); i++; }
      out.push({ t: 'fig', titulo: m[1].trim(), id: id ? id[1] : '', fuente: fuente });
      i++;
      continue;
    }
    if ((m = /^[-*•]\s+(.*)$/.exec(t))) { out.push({ t: 'li', o: false, x: m[1] }); i++; continue; }
    if ((m = /^(\d+)[.)]\s+(.*)$/.exec(t))) { out.push({ t: 'li', o: true, x: m[2] }); i++; continue; }
    if (/^>\s?/.test(t)) {
      var q = [];
      while (i < lineas.length && /^\s*>/.test(lineas[i])) { q.push(lineas[i].trim().replace(/^>\s?/, '')); i++; }
      out.push({ t: 'cita', x: q.join(' ') });
      continue;
    }
    out.push({ t: 'p', x: t });
    i++;
  }
  return out;
}
function tramosMd(s) {
  var r = [], re = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*)\*|\$([^$]+)\$)/g, m, ult = 0;
  s = String(s || '');
  while ((m = re.exec(s)) !== null) {
    if (m.index > ult) r.push({ t: s.substring(ult, m.index) });
    if (m[2] !== undefined) r.push({ t: m[2], b: 1, i: 1 });
    else if (m[3] !== undefined) r.push({ t: m[3], b: 1 });
    else if (m[4] !== undefined) r.push({ t: m[4], u: 1 });
    else if (m[5] !== undefined) r.push({ t: m[5], i: 1 });
    else r.push({ t: m[6], m: 1 });
    ult = re.lastIndex;
  }
  if (ult < s.length) r.push({ t: s.substring(ult) });
  return r;
}
function sinMarcasMd(s) { return tramosMd(s).map(function (x) { return x.t; }).join(''); }

// ------------------------------------------------------------------ KaTeX (se carga solo cuando hace falta)
var KATEX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/';
function cargarKatex() {
  if (window.katex) return Promise.resolve(true);
  if (S.katexCarga) return S.katexCarga;
  S.katexCarga = new Promise(function (ok) {
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = KATEX_URL + 'katex.min.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = KATEX_URL + 'katex.min.js';
    js.onload = function () { ok(true); };
    js.onerror = function () { S.katexCarga = null; ok(false); };
    document.head.appendChild(js);
  });
  return S.katexCarga;
}
function mathHtml(latex, aparte) {
  if (window.katex) {
    try { return window.katex.renderToString(latex, { displayMode: !!aparte, throwOnError: false, strict: 'ignore', output: 'html' }); } catch (e) { /* cae al texto */ }
  }
  return '<code class="md-tex">' + esc(aparte ? '$$' + latex + '$$' : '$' + latex + '$') + '</code>';
}

// ------------------------------------------------------------------ citas con una biblioteca dada
/** ctx: { bib, estilo, num: {clave: n}, sig: siguiente numero } para numerar por orden de aparicion. */
function nuevoCtxMd(bib) { return { bib: bib || [], estilo: estiloCita(), num: {}, sig: 1, tablas: 0, figuras: 0, ecs: 0 }; }
function citasMd(texto, ctx) {
  return String(texto).replace(/\[@[A-Za-z0-9_\-]+\](?:\s*[,;]?\s*\[@[A-Za-z0-9_\-]+\])*/g, function (grupo) {
    var claves = [], re = /\[@([A-Za-z0-9_\-]+)\]/g, mm;
    while ((mm = re.exec(grupo)) !== null) claves.push(mm[1]);
    var nums = [], partes = [], malas = [];
    claves.forEach(function (k) {
      var b = ctx.bib.filter(function (x) { return x.clave_cita === k; })[0];
      if (!b) { malas.push('[cita no encontrada: ' + k + ']'); return; }
      ctx.citadas = ctx.citadas || {};
      ctx.citadas[k] = true;
      if (esNumerico(ctx.estilo)) { if (!ctx.num[k]) ctx.num[k] = ctx.sig++; nums.push(ctx.num[k]); }
      else partes.push(ctx.estilo === 'chicago' ? citaCorta(b).replace(/, (\S+)$/, ' $1') : citaCorta(b));
    });
    var buenas = nums.length ? (ctx.estilo === 'ieee' ? nums.map(function (n) { return '[' + n + ']'; }).join(', ') : '(' + nums.join(',') + ')') : (partes.length ? '(' + partes.join('; ') + ')' : '');
    return [buenas].concat(malas).filter(function (x) { return x; }).join(' ');
  });
}
function lineaMdHtml(s, ctx) {
  return tramosMd(s).map(function (x) {
    if (x.m) return mathHtml(x.t, false);
    var h = esc(citasMd(x.t, ctx)).replace(/\[(por completar|cita no encontrada)[^\]]*\]/gi, function (m) { return '<span class="d-pend">' + m + '</span>'; });
    if (x.b) h = '<b>' + h + '</b>';
    if (x.i) h = '<i>' + h + '</i>';
    if (x.u) h = '<u>' + h + '</u>';
    return h;
  }).join('');
}
function urlFigura(id) {
  if (S.figLocal && S.figLocal[id]) return S.figLocal[id];
  if (SERVIDOR) return '/archivo/' + encodeURIComponent(id);
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1200';
}

/**
 * HTML de una seccion. o: { id (para numerar los subtitulos), cap (numero del capitulo), anexos, pre }.
 * Se usa en la vista previa del editor y en «Ver mi tesis».
 */
function mdHtml(texto, ctx, o) {
  o = o || {};
  var partes = String(o.id || '').split('.'), n1 = 0, n2 = 0, nAnexo = o.anexoIni || 1;
  var h = '', enLista = '';
  function cerrarLista() { if (enLista) { h += '</' + enLista + '>'; enLista = ''; } }
  leerMd(texto).forEach(function (b) {
    if (b.t !== 'li') cerrarLista();
    if (b.t === 'h') {
      var x = sinMarcasMd(b.x), rot, nivel;
      if (o.anexos) { nAnexo++; rot = 'Anexo ' + (nAnexo < 10 ? '0' : '') + nAnexo + ': ' + x; nivel = 2; }
      else if (o.pre) { rot = x; nivel = 2; }
      else if (o.cap) { if (b.n === 2) { n1++; n2 = 0; rot = o.cap + '.' + n1 + ' ' + x; nivel = 2; } else { n2++; rot = o.cap + '.' + n1 + '.' + n2 + ' ' + x; nivel = 3; } }
      else if (partes.length === 2 && b.n === 2) { n1++; n2 = 0; rot = o.id + '.' + n1 + ' ' + x; nivel = 3; }
      else { n2++; rot = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt((n2 - 1) % 26) + '. ' + x; nivel = 4; }
      h += '<p class="d-h d-h' + nivel + '">' + esc(rot) + '</p>';
      return;
    }
    if (b.t === 'p') { h += '<p class="d-p d-s">' + lineaMdHtml(b.x, ctx) + '</p>'; return; }
    if (b.t === 'cita') { h += '<blockquote class="md-cita">' + lineaMdHtml(b.x, ctx) + '</blockquote>'; return; }
    if (b.t === 'li') {
      var tipo = b.o ? 'ol' : 'ul';
      if (enLista !== tipo) { cerrarLista(); h += '<' + tipo + ' class="md-lista">'; enLista = tipo; }
      h += '<li>' + lineaMdHtml(b.x, ctx) + '</li>';
      return;
    }
    if (b.t === 'tabla') {
      ctx.tablas++;
      h += '<p class="d-ley"><b>Tabla ' + ctx.tablas + '</b></p><p class="d-ley-t"><i>' + (b.titulo ? esc(sinMarcasMd(b.titulo)) : '<span class="d-pend">[por completar: título de la tabla]</span>') + '</i></p>';
      h += '<table class="d-tabla">' + b.filas.map(function (f, i) { return '<tr>' + f.map(function (c) { return (i === 0 ? '<th>' : '<td>') + lineaMdHtml(c, ctx) + (i === 0 ? '</th>' : '</td>'); }).join('') + '</tr>'; }).join('') + '</table>';
      h += '<p class="d-tnota"><i>Nota.</i> ' + esc(b.nota ? (/[.]$/.test(b.nota) ? b.nota : b.nota + '.') : 'Elaboración propia.') + '</p>';
      return;
    }
    if (b.t === 'fig') {
      ctx.figuras++;
      h += '<p class="d-ley"><b>Figura ' + ctx.figuras + '</b></p><p class="d-ley-t"><i>' + (b.titulo ? esc(sinMarcasMd(b.titulo)) : '<span class="d-pend">[por completar: título de la figura]</span>') + '</i></p>';
      h += b.id ? '<div class="md-fig"><img loading="lazy" src="' + esc(urlFigura(b.id)) + '" alt="' + esc(b.titulo) + '"></div>' : '<div class="md-fig vacia">' + IC.subir + '<span>Espacio para la figura: pégala en el Word descargado o súbela desde el editor.</span></div>';
      h += '<p class="d-tnota"><i>Nota.</i> ' + esc(b.fuente ? (/[.]$/.test(b.fuente) ? b.fuente : b.fuente + '.') : 'Elaboración propia.') + '</p>';
      return;
    }
    if (b.t === 'eq') { ctx.ecs++; h += '<div class="md-eq"><div>' + mathHtml(b.x, true) + '</div><span>(' + ctx.ecs + ')</span></div>'; return; }
  });
  cerrarLista();
  return h;
}
function palabrasMdCli(t) { return palabras(String(t || '').replace(/[#*_>|$\[\]()!-]/g, ' ')); }

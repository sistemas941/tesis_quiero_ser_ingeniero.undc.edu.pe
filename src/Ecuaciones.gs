/**
 * Ecuaciones.gs - Ecuaciones del borrador de tesis.
 * El estudiante las escribe en LaTeX ($...$ en linea, $$...$$ aparte). Aqui se leen con un analizador
 * pequeno (fracciones, raices, potencias, subindices, sumatorias, integrales, delimitadores, acentos,
 * letras griegas y simbolos) y se escriben de dos maneras:
 *  - en texto lineal Unicode, para Google Docs y la vista previa sin KaTeX;
 *  - en OMML (Office Math), para que en el Word queden como ecuaciones nativas y editables.
 */

var LTX_SIMBOLOS_ = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈', equiv: '≡', sim: '∼', propto: '∝',
  infty: '∞', partial: '∂', nabla: '∇', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩', forall: '∀', exists: '∃', emptyset: '∅',
  rightarrow: '→', to: '→', leftarrow: '←', Rightarrow: '⇒', Leftrightarrow: '⇔', leftrightarrow: '↔', mapsto: '↦', ldots: '…', cdots: '⋯', dots: '…',
  prime: '′', degree: '°', circ: '∘', bullet: '•', star: '⋆', ast: '∗', wedge: '∧', vee: '∨', neg: '¬', lt: '<', gt: '>', percent: '%'
};
var LTX_NARIOS_ = { sum: '∑', prod: '∏', int: '∫', iint: '∬', oint: '∮', coprod: '∐', bigcup: '⋃', bigcap: '⋂' };
var LTX_FUNCIONES_ = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp', 'max', 'min', 'lim', 'arg', 'det', 'sup', 'inf', 'mod', 'sinh', 'cosh', 'tanh', 'arcsin', 'arccos', 'arctan'];
var LTX_ACENTOS_ = { hat: '̂', widehat: '̂', tilde: '̃', widetilde: '̃', dot: '̇', ddot: '̈', vec: '⃗', acute: '́', grave: '̀', check: '̌' };
var LTX_ESPACIOS_ = { ',': ' ', ';': ' ', ':': ' ', quad: '  ', qquad: '    ', ' ': ' ', '!': '' };

/** Lee un texto LaTeX y devuelve un arbol: lista de nodos { k: tipo, ... }. */
function leerLatex_(s) {
  s = String(s || '');
  var i = 0;
  function blanco() { while (i < s.length && /\s/.test(s.charAt(i))) i++; }
  function comando() {
    // s.charAt(i) === '\\'
    i++;
    if (i >= s.length) return '';
    var c = s.charAt(i);
    if (/[A-Za-z]/.test(c)) { var j = i; while (j < s.length && /[A-Za-z]/.test(s.charAt(j))) j++; var n = s.substring(i, j); i = j; return n; }
    i++;
    return c;
  }
  function argumento() {
    blanco();
    if (i >= s.length) return [];
    if (s.charAt(i) === '{') { i++; var g = secuencia('}'); if (s.charAt(i) === '}') i++; return g; }
    var a = atomo();
    return a ? [a] : [];
  }
  function textoLlave() {
    blanco();
    if (s.charAt(i) !== '{') return '';
    var prof = 0, j = i;
    for (; j < s.length; j++) { if (s.charAt(j) === '{') prof++; else if (s.charAt(j) === '}') { prof--; if (prof === 0) break; } }
    var t = s.substring(i + 1, j);
    i = j + 1;
    return t;
  }
  function delimitador() {
    blanco();
    if (s.charAt(i) === '\\') { var n = comando(); if (n === '{' || n === '}') return n; if (n === '|') return '‖'; if (n === 'langle') return '⟨'; if (n === 'rangle') return '⟩'; return LTX_SIMBOLOS_[n] || ''; }
    var c = s.charAt(i); i++;
    return c === '.' ? '' : c;
  }
  function atomo() {
    blanco();
    if (i >= s.length) return null;
    var c = s.charAt(i);
    if (c === '{') { i++; var g = secuencia('}'); if (s.charAt(i) === '}') i++; return { k: 'grupo', h: g }; }
    if (c === '}') return null;
    if (c === '\\') {
      var n = comando();
      if (n === 'frac' || n === 'dfrac' || n === 'tfrac' || n === 'cfrac') { var num = argumento(); var den = argumento(); return { k: 'frac', a: num, b: den }; }
      if (n === 'binom') { var bn = argumento(); var bk = argumento(); return { k: 'delim', i: '(', f: ')', h: [{ k: 'frac', a: bn, b: bk, sin: true }] }; }
      if (n === 'sqrt') {
        blanco();
        var grado = null;
        if (s.charAt(i) === '[') { var j = s.indexOf(']', i); if (j > 0) { grado = leerLatex_(s.substring(i + 1, j)); i = j + 1; } }
        return { k: 'raiz', g: grado, h: argumento() };
      }
      if (LTX_NARIOS_[n]) return { k: 'nario', c: LTX_NARIOS_[n] };
      if (n === 'left') { var ab = delimitador(); var dentro = secuencia('\\right'); if (s.substr(i, 6) === '\\right') { i += 6; } var ci = delimitador(); return { k: 'delim', i: ab, f: ci, h: dentro }; }
      if (n === 'right') return null;
      if (n === 'text' || n === 'mathrm' || n === 'textrm' || n === 'operatorname' || n === 'mbox') return { k: 'texto', t: textoLlave() };
      if (n === 'mathbf' || n === 'textbf' || n === 'boldsymbol') return { k: 'negrita', h: argumento() };
      if (n === 'mathit' || n === 'textit' || n === 'mathcal' || n === 'mathbb') return { k: 'grupo', h: argumento() };
      if (n === 'overline' || n === 'bar') return { k: 'barra', h: argumento() };
      if (n === 'underline') return { k: 'grupo', h: argumento() };
      if (LTX_ACENTOS_[n]) return { k: 'acento', c: LTX_ACENTOS_[n], h: argumento() };
      if (LTX_FUNCIONES_.indexOf(n) >= 0) return { k: 'texto', t: n };
      if (LTX_SIMBOLOS_[n]) return { k: 'sim', t: LTX_SIMBOLOS_[n] };
      if (LTX_ESPACIOS_.hasOwnProperty(n)) return { k: 'sim', t: LTX_ESPACIOS_[n] };
      if (n === '{' || n === '}' || n === '%' || n === '$' || n === '&' || n === '#' || n === '_') return { k: 'sim', t: n };
      if (n === '\\') return { k: 'sim', t: ' ' };
      return { k: 'texto', t: n };   // comando desconocido: queda como texto, nunca se pierde
    }
    i++;
    if (/[0-9.]/.test(c)) { var t = c; while (i < s.length && /[0-9.,]/.test(s.charAt(i)) && !(s.charAt(i) === ',' && !/[0-9]/.test(s.charAt(i + 1) || ''))) { t += s.charAt(i); i++; } return { k: 'num', t: t }; }
    if (/[A-Za-z]/.test(c)) return { k: 'var', t: c };
    if (c === '^' || c === '_') return { k: 'sim', t: '' };
    return { k: 'sim', t: c === '-' ? '−' : (c === '*' ? '∗' : (c === "'" ? '′' : c)) };
  }
  function secuencia(fin) {
    var r = [];
    while (i < s.length) {
      blanco();
      if (i >= s.length) break;
      if (fin === '}' && s.charAt(i) === '}') break;
      if (fin === '\\right' && s.substr(i, 6) === '\\right') break;
      var a;
      if (s.charAt(i) === '^' || s.charAt(i) === '_') {
        // Superindice o subindice sin base: se pega al nodo anterior o a uno vacio
        a = r.length ? r.pop() : { k: 'sim', t: '' };
      } else {
        a = atomo();
        if (!a) { if (s.charAt(i) === '}' && fin !== '}') { i++; continue; } break; }
      }
      blanco();
      var sup = null, sub = null, vueltas = 0;
      while ((s.charAt(i) === '^' || s.charAt(i) === '_') && vueltas < 2) {
        var cual = s.charAt(i); i++;
        var arg = argumento();
        if (cual === '^') sup = arg; else sub = arg;
        blanco();
        vueltas++;
      }
      if (sup || sub) a = { k: 'guion', b: a, sup: sup, sub: sub };
      r.push(a);
    }
    return r;
  }
  return secuencia('');
}

// ---------------------------------------------------------------- texto lineal (Unicode)
var LTX_SUPER_ = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '−': '⁻', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ' };
var LTX_SUB_ = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '−': '₋', '-': '₋', '=': '₌', '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', n: 'ₙ', o: 'ₒ', t: 'ₜ', x: 'ₓ' };

function linealNodos_(l) { return (l || []).map(linealNodo_).join(''); }
function envolver_(t) { return t.length > 1 && !/^[(\[{].*[)\]}]$/.test(t) ? '(' + t + ')' : t; }
function mapaTodo_(t, m) { var r = ''; for (var i = 0; i < t.length; i++) { if (!m[t.charAt(i)]) return null; r += m[t.charAt(i)]; } return r; }
function linealNodo_(n) {
  if (!n) return '';
  switch (n.k) {
    case 'grupo': case 'negrita': return linealNodos_(n.h);
    case 'frac': return n.sin ? linealNodos_(n.a) + ' ' + linealNodos_(n.b) : envolver_(linealNodos_(n.a)) + '/' + envolver_(linealNodos_(n.b));
    case 'raiz': return (n.g ? linealNodos_(n.g) : '') + '√' + envolver_(linealNodos_(n.h));
    case 'nario': return n.c;
    case 'delim': return (n.i || '') + linealNodos_(n.h) + (n.f || '');
    case 'texto': return n.t;
    case 'barra': return linealNodos_(n.h) + '̄';
    case 'acento': return linealNodos_(n.h) + n.c;
    case 'guion':
      var b = linealNodo_(n.b), r = b;
      if (n.sub) { var ts = linealNodos_(n.sub).replace(/\s+/g, ''); r += mapaTodo_(ts, LTX_SUB_) || '_' + envolver_(ts); }
      if (n.sup) { var tp = linealNodos_(n.sup).replace(/\s+/g, ''); r += mapaTodo_(tp, LTX_SUPER_) || '^' + envolver_(tp); }
      return r;
    case 'sim': return /^[=<>≤≥≠≈≡∼∝→←⇒⇔↔±∓×÷·∈∉⊂⊆]$/.test(n.t) ? ' ' + n.t + ' ' : n.t;
    default: return n.t || '';
  }
}
/** LaTeX a texto lineal legible: x = (−b ± √(b² − 4ac))/(2a). */
function latexLineal_(s) { try { return linealNodos_(leerLatex_(s)).replace(/\s+/g, ' ').trim(); } catch (e) { return String(s || ''); } }

// ---------------------------------------------------------------- OMML (Office Math)
function xmlEsc_(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function ommlRun_(t, normal, negrita) {
  if (t === '') return '';
  var pr = normal || negrita ? '<m:rPr>' + (normal ? '<m:sty m:val="p"/>' : '') + (negrita ? '<m:sty m:val="b"/>' : '') + '</m:rPr>' : '';
  return '<m:r>' + pr + '<m:t xml:space="preserve">' + xmlEsc_(t) + '</m:t></m:r>';
}
function ommlNodos_(l, negrita) {
  var r = '';
  var lista = l || [];
  for (var i = 0; i < lista.length; i++) {
    var n = lista[i];
    // Sumatorias e integrales: el operando es el nodo siguiente
    if (n && (n.k === 'nario' || (n.k === 'guion' && n.b && n.b.k === 'nario'))) {
      var sig = i + 1 < lista.length ? [lista[i + 1]] : [];
      r += ommlNario_(n, sig, negrita);
      if (sig.length) i++;
      continue;
    }
    r += ommlNodo_(n, negrita);
  }
  return r;
}
function ommlNario_(n, operando, negrita) {
  var chr = n.k === 'nario' ? n.c : n.b.c;
  var sub = n.k === 'guion' ? n.sub : null, sup = n.k === 'guion' ? n.sup : null;
  var integral = /[∫∬∮]/.test(chr);
  return '<m:nary><m:naryPr><m:chr m:val="' + chr + '"/><m:limLoc m:val="' + (integral ? 'subSup' : 'undOvr') + '"/>' + (sub ? '' : '<m:subHide m:val="1"/>') + (sup ? '' : '<m:supHide m:val="1"/>') + '</m:naryPr>' +
    '<m:sub>' + ommlNodos_(sub, negrita) + '</m:sub><m:sup>' + ommlNodos_(sup, negrita) + '</m:sup><m:e>' + ommlNodos_(operando, negrita) + '</m:e></m:nary>';
}
function ommlNodo_(n, negrita) {
  if (!n) return '';
  switch (n.k) {
    case 'grupo': return ommlNodos_(n.h, negrita);
    case 'negrita': return ommlNodos_(n.h, true);
    case 'frac': return '<m:f>' + (n.sin ? '<m:fPr><m:type m:val="noBar"/></m:fPr>' : '') + '<m:num>' + ommlNodos_(n.a, negrita) + '</m:num><m:den>' + ommlNodos_(n.b, negrita) + '</m:den></m:f>';
    case 'raiz': return '<m:rad>' + (n.g ? '<m:radPr></m:radPr><m:deg>' + ommlNodos_(n.g, negrita) + '</m:deg>' : '<m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/>') + '<m:e>' + ommlNodos_(n.h, negrita) + '</m:e></m:rad>';
    case 'nario': return ommlNario_(n, [], negrita);
    case 'delim': return '<m:d><m:dPr><m:begChr m:val="' + xmlEsc_(n.i || '') + '"/><m:endChr m:val="' + xmlEsc_(n.f || '') + '"/></m:dPr><m:e>' + ommlNodos_(n.h, negrita) + '</m:e></m:d>';
    case 'texto': return ommlRun_(n.t, true, negrita);
    case 'barra': return '<m:bar><m:barPr><m:pos m:val="top"/></m:barPr><m:e>' + ommlNodos_(n.h, negrita) + '</m:e></m:bar>';
    case 'acento': return '<m:acc><m:accPr><m:chr m:val="' + n.c + '"/></m:accPr><m:e>' + ommlNodos_(n.h, negrita) + '</m:e></m:acc>';
    case 'guion':
      var b = ommlNodo_(n.b, negrita) || ommlRun_('​', false, false);
      if (n.sub && n.sup) return '<m:sSubSup><m:e>' + b + '</m:e><m:sub>' + ommlNodos_(n.sub, negrita) + '</m:sub><m:sup>' + ommlNodos_(n.sup, negrita) + '</m:sup></m:sSubSup>';
      if (n.sub) return '<m:sSub><m:e>' + b + '</m:e><m:sub>' + ommlNodos_(n.sub, negrita) + '</m:sub></m:sSub>';
      return '<m:sSup><m:e>' + b + '</m:e><m:sup>' + ommlNodos_(n.sup, negrita) + '</m:sup></m:sSup>';
    case 'num': return ommlRun_(n.t, false, negrita);
    case 'var': return ommlRun_(n.t, false, negrita);
    default: return ommlRun_(n.t || '', false, negrita);
  }
}
/** LaTeX a <m:oMath> para el Word. */
function latexOmml_(s) {
  var cuerpo;
  try { cuerpo = ommlNodos_(leerLatex_(s)); } catch (e) { cuerpo = ommlRun_(String(s || ''), true); }
  return '<m:oMath>' + (cuerpo || ommlRun_(' ', true)) + '</m:oMath>';
}

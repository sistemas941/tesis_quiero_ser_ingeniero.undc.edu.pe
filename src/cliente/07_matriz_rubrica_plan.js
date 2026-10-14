// ------------------------------------------------------------------ Matriz de consistencia
function matrizDatos(exp) {
  var conH = exp.con_hipotesis !== 'NO';
  var pe = tablaDe(exp, 'problemas_especificos'), oe = tablaDe(exp, 'objetivos_especificos'), he = conH ? tablaDe(exp, 'hipotesis_especificas') : [];
  var filas = [{ nivel: 'General', problema: exp.problema_general || '', objetivo: exp.objetivo_general || '', hipotesis: conH ? (exp.hipotesis_general || '') : '' }];
  var n = Math.max(pe.length, oe.length, he.length);
  for (var i = 0; i < n; i++) filas.push({ nivel: 'Específico ' + (i + 1), problema: pe[i] ? pe[i].texto || '' : '', objetivo: oe[i] ? oe[i].texto || '' : '', hipotesis: he[i] ? he[i].texto || '' : '' });
  return { filas: filas, conH: conH, npe: pe.length, noe: oe.length, nhe: he.length, op: tablaDe(exp, 'operacionalizacion') };
}

function matrizHtml(exp) {
  var m = matrizDatos(exp), h = '';
  function celda(t) { return t ? '<td>' + conMarcas(t) + '</td>' : '<td class="vacio">Falta</td>'; }
  if (m.npe !== m.noe && (m.npe || m.noe)) h += '<div class="aviso rojo" style="margin-bottom:12px">Hay ' + m.npe + ' problemas específicos y ' + m.noe + ' objetivos específicos. Deben corresponderse uno a uno.</div>';
  if (m.conH && m.noe !== m.nhe && (m.noe || m.nhe)) h += '<div class="aviso rojo" style="margin-bottom:12px">Hay ' + m.noe + ' objetivos específicos y ' + m.nhe + ' hipótesis específicas. Deben corresponderse uno a uno.</div>';
  h += '<div class="tarjeta"><div class="pequeno tenue">Título</div><h2 style="margin-bottom:12px">' + (exp.titulo ? esc(exp.titulo) : '<span class="tenue">Aún sin título</span>') + '</h2><div class="desliza"><table class="tabla matriz" style="min-width:680px"><thead><tr><th></th><th>Problemas</th><th>Objetivos</th>' + (m.conH ? '<th>Hipótesis</th>' : '') + '</tr></thead><tbody>' +
    m.filas.map(function (f) { return '<tr><td><b>' + esc(f.nivel) + '</b></td>' + celda(f.problema) + celda(f.objetivo) + (m.conH ? celda(f.hipotesis) : '') + '</tr>'; }).join('') + '</tbody></table></div></div>';
  h += '<div class="rejilla" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:16px"><div class="tarjeta"><h3>Variables, dimensiones e indicadores</h3>';
  if (m.op.length) {
    h += '<div class="desliza"><table class="tabla"><thead><tr><th>Variable</th><th>Dimensión</th><th>Indicador</th><th>Escala</th></tr></thead><tbody>' + m.op.map(function (f) { return '<tr><td>' + esc(f.variable) + '</td><td>' + esc(f.dimension) + '</td><td>' + esc(f.indicador) + '</td><td>' + esc(f.escala) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  } else h += '<p class="tenue">Aún no operacionalizas las variables.</p>';
  h += '</div><div class="tarjeta"><h3>Metodología</h3>' + [['Enfoque', exp.enfoque], ['Tipo', exp.tipo_inv], ['Nivel', exp.nivel_inv], ['Diseño', exp.diseno_esquema], ['Población', exp.poblacion], ['Muestra', exp.muestra]].map(function (p) {
    return '<div class="dato"><span class="tenue">' + p[0] + '</span><span style="text-align:right;max-width:70%">' + (p[1] ? esc(String(p[1]).length > 140 ? String(p[1]).substring(0, 140) + '…' : p[1]) : '<span class="tenue">Falta</span>') + '</span></div>';
  }).join('') + '</div></div>';
  return h;
}

function vistaMatriz() {
  var c = campoDe('problema_general'), puede = c && accesible(c.etapa);
  return '<div class="cabecera"><div class="fila entre"><h1>Matriz de consistencia</h1>' + (puede ? '<button class="btn" data-a="abrirEtapa" data-e="' + esc(c.etapa) + '">Editar en la etapa Propuesta</button>' : '') + '</div><p>Léela por filas: cada problema debe tener su objetivo y su hipótesis, con las mismas variables y el mismo ámbito. Se arma sola con lo que escribes y va en los anexos de tu plan.</p></div>' + matrizHtml(S.exp);
}

// ------------------------------------------------------------------ Rubrica
function gruposRubrica(rub) { var g = []; rub.forEach(function (r) { if (g.indexOf(r.grupo) < 0) g.push(r.grupo); }); return g; }

function rubricaHtml(d, exp, conBotones) {
  var rr = d.resultadoRubrica, parcial = rr.evaluados < rr.aplicables, conforme = rr.porcentaje >= 67;
  var h = '<div class="tarjeta" style="margin-bottom:16px"><div class="fila entre"><div><div class="pequeno tenue">Resultado estimado</div><div style="font-size:34px;font-weight:700;font-family:var(--mono);line-height:1.1">' + rr.porcentaje + ' %</div></div><div style="text-align:right">' +
    (rr.evaluados === 0 ? '<span class="chip">Sin evaluar</span>' : (parcial ? '<span class="chip ambar">Evaluación parcial</span>' : (conforme ? '<span class="chip verde">' + IC.check + 'Conforme</span>' : '<span class="chip rojo">' + IC.alerta + 'Observado</span>'))) +
    '<div class="pequeno tenue" style="margin-top:6px">' + rr.puntaje + ' de ' + rr.maximo + ' puntos · ' + rr.evaluados + ' de ' + rr.aplicables + ' ítems evaluados</div></div></div>' +
    '<div class="barra-prog" style="margin-top:12px" role="img" aria-label="' + rr.porcentaje + ' por ciento; se requiere 67"><i style="width:' + Math.min(100, rr.porcentaje) + '%"></i><em></em></div><div class="pequeno tenue" style="margin-top:6px">La línea marca el 67 % que se necesita para el resultado Conforme. Los ítems sin evaluar cuentan como cero.</div>' +
    (rr.noVerificados ? '<div class="aviso ambar pequeno" style="margin-top:10px">' + (rr.noVerificados === 1 ? '1 ítem tiene' : rr.noVerificados + ' ítems tienen') + ' una estimación pegada desde un asistente externo: la aplicación la registró, pero no puede comprobar de dónde salió. Este porcentaje no está verificado.</div>' : '') + '</div>';
  gruposRubrica(d.rubrica).forEach(function (g) {
    var items = d.rubrica.filter(function (r) { return r.grupo === g; }), suma = 0, max = 0;
    items.forEach(function (r) { if (itemAplica(r, exp)) { max += 4; if (rr.items[r.item]) suma += rr.items[r.item].nivel; } });
    h += '<div class="tarjeta" style="margin-bottom:16px"><div class="fila entre"><h2>' + esc(g) + '</h2><div class="fila"><span class="mono tenue">' + suma + ' / ' + max + '</span>' +
      (conBotones ? '<button class="btn chico" data-a="evaluarGrupo" data-g="' + esc(g) + '"' + attrIA() + '>' + IC.chispa + 'Evaluar con el asistente</button>' : '') + '</div></div>';
    items.forEach(function (r) {
      var ap = itemAplica(r, exp), ev = rr.items[r.item];
      h += '<div class="rub-item"' + (ap ? '' : ' style="opacity:.55"') + '><div class="n">' + r.item + '</div><div><div class="fila" style="gap:8px"><b>' + esc(r.criterio) + '</b>' +
        (!ap ? '<span class="chip">No aplica a tu proyecto</span>' : (ev ? '<span class="chip ' + (ev.nivel >= 3 ? 'verde' : (ev.nivel === 2 ? 'ambar' : 'rojo')) + '">Nivel ' + ev.nivel + ' de 4</span>' : '<span class="chip borde">Sin evaluar</span>')) + (ap && ev && viaLocal(ev.via) ? '<span class="chip borde" title="La estimación se pegó desde un asistente externo">No verificada</span>' : '') + '</div>' +
        (r.descripcion ? '<p class="tenue pequeno" style="margin-top:3px">' + esc(r.descripcion) + '</p>' : '') +
        (ap && ev && ev.observacion ? '<p style="margin-top:6px">' + esc(ev.observacion) + '</p>' : '') +
        '<details style="margin-top:6px"><summary class="pequeno" style="cursor:pointer;color:var(--indigo-osc)">Ver los cuatro niveles</summary><div class="niveles">' + [1, 2, 3, 4].map(function (n) { return '<div class="nivel' + (ap && ev && ev.nivel === n ? ' logrado' : '') + '"><b>NIVEL ' + n + '</b>' + esc(r['n' + n]) + '</div>'; }).join('') + '</div></details></div></div>';
    });
    h += '</div>';
  });
  return h;
}

function vistaRubrica() {
  return '<div class="cabecera"><h1>Rúbrica de evaluación del proyecto</h1><p>Es la rúbrica con la que la UNDC evaluará tu proyecto: 36 ítems en cuatro niveles. Los ítems que no corresponden a tu tipo de proyecto se excluyen del puntaje máximo. El asistente estima tu nivel para que mejores antes de presentar; la calificación oficial es del jurado.</p></div>' + rubricaHtml(S.d, S.exp, true);
}

function evaluarGrupo(grupo, btn) {
  var via = viaIA();
  if (!via) { abrirModoIA(); return; }
  var fin = ocupar(btn, 'Evaluando');
  var args = conVia({ grupo: grupo }, via);
  guardarAhora().then(function () {
    if (!viaLocal(via)) return llamar('rubrica', args);
    args.modo = 'rubrica';
    return porCopia('iaRespuesta', args, 'Evaluar con la rúbrica: ' + grupo);
  }).then(function (r) {
    S.d.resultadoRubrica = r.resultado;
    if (via === 'curso') S.d.uso++;
    if (S.vista !== 'rubrica') return;
    var y = window.scrollY;
    $('#pagina').innerHTML = vistaRubrica();
    window.scrollTo(0, y);
    toast('Capítulo evaluado. Lee las observaciones de cada ítem.', 'bien');
  }).catch(function (e) { fin(); if (e && e.cancelado) return; fallo(e); });
}

// ------------------------------------------------------------------ Mi plan
function seccionLlena(s, d, exp) {
  if (s.tipo === 'campo') return String(exp[s.fuente] || '').trim() ? 1 : 0;
  if (s.tipo === 'lista' || s.tipo === 'tabla') return tablaDe(exp, s.fuente).length ? 1 : 0;
  if (s.tipo !== 'especial') return -1;
  var f = s.fuente, cb = conteoBiblioteca(d.biblioteca);
  if (f === 'antecedentes_articulos') return cb.articulos ? 1 : 0;
  if (f === 'antecedentes_tesis') return cb.tesis ? 1 : 0;
  if (f === 'terminos') return tablaDe(exp, 'terminos').length ? 1 : 0;
  if (f === 'definiciones') return exp.defconc_v1 && exp.defconc_v2 ? 1 : 0;
  if (f === 'enfoque') return exp.enfoque && exp.enfoque_fund ? 1 : 0;
  if (f === 'diseno') return exp.diseno && exp.diseno_esquema ? 1 : 0;
  if (f === 'artefacto') return exp.artefacto_descripcion ? 1 : 0;
  if (f === 'evaluacion_artefacto') return exp.artefacto_evaluacion ? 1 : 0;
  if (f === 'cronograma' || f === 'presupuesto') return tablaDe(exp, f).length ? 1 : 0;
  if (f === 'matriz_consistencia') return exp.problema_general && exp.objetivo_general ? 1 : 0;
  if (f === 'esquema_artefacto') return exp.esquema_artefacto ? 1 : 0;
  if (f === 'arbol_problemas') return exp.problema_central ? 1 : 0;
  if (f === 'referencias') return d.biblioteca.length ? 1 : 0;
  return -1;
}

function indiceHtml(d, exp) {
  var h = '<div class="indice">';
  d.plantilla.forEach(function (s) {
    if (!aplica(s.aplica, exp) || s.tipo === 'caratula' || s.tipo === 'indice') return;
    var lleno = seccionLlena(s, d, exp);
    var t = String(s.titulo).split('{var1}').join(exp.var1 || 'Variable 1').split('{var2}').join(exp.var2 || 'Variable 2');
    var clase = s.nivel === '1' ? '' : (s.nivel === '3' ? 'n3' : 'n2');
    h += '<div class="' + clase + '">' + (lleno < 0 ? '<span class="punto" style="visibility:hidden"></span>' : '<span class="punto' + (lleno ? ' ok' : '') + '" title="' + (lleno ? 'Con contenido' : 'Falta') + '"></span>') + (s.nivel === '1' ? '<b>' + esc(t) + '</b>' : esc((s.nivel === 'A' ? 'Anexo: ' : '') + t)) + '</div>';
  });
  return h + '</div>';
}

function vistaPlan() {
  var d = S.d, exp = S.exp, aprob = d.etapas.filter(function (e) { return d.avance[e.id] && d.avance[e.id].estado === 'aprobada'; }).length, total = d.etapas.length, p = S.plan;
  var h = '<div class="cabecera"><h1>Mi plan de tesis</h1><p>La aplicación arma tu proyecto en ' + DOCS + ' con la carátula y la estructura de la ' + esc(d.config.UNIVERSIDAD) + ': capítulos, citas y referencias en ' + esc(d.config.ESTILO_CITAS) + ', matriz de consistencia y anexos.</p></div><div class="rejilla dos"><div class="pila">';
  h += '<div class="tarjeta"><div class="fila entre"><h2>' + (exp._plan_url ? 'Tu documento' : 'Generar el documento') + '</h2><span class="chip ' + (aprob === total ? 'verde' : 'ambar') + '">' + aprob + ' de ' + total + ' etapas aprobadas</span></div>';
  if (aprob < total) h += '<p class="tenue" style="margin-top:8px">Todavía es un borrador: lo que falte quedará resaltado en amarillo dentro del documento.</p>';
  h += '<div class="fila" style="margin-top:14px"><button class="btn primario" data-a="generarPlan">' + IC.doc + (exp._plan_url ? 'Actualizar mi plan' : 'Generar mi plan en ' + DOCS) + '</button>';
  if (enlace(exp._plan_url)) {
    var id = idDoc(exp._plan_url);
    h += (SERVIDOR ? '' : '<a class="btn" href="' + esc(enlace(exp._plan_url)) + '" target="_blank" rel="noopener">' + TXT_ABRIR_DOC + '</a>') + '<a class="btn" href="' + esc(urlDoc(id, 'docx')) + '" target="_blank" rel="noopener">Descargar Word</a><a class="btn" href="' + esc(urlDoc(id, 'pdf')) + '" target="_blank" rel="noopener">Descargar PDF</a>';
  }
  h += '</div>';
  if (exp._plan_fecha) h += '<p class="pequeno tenue" style="margin-top:10px">Última generación: ' + esc(fechaCorta(exp._plan_fecha)) + '</p>';
  if (p) {
    h += '<div class="aviso ' + (p.pendientes || p.citasRotas.length ? 'ambar' : 'verde') + '" style="margin-top:12px">' + (p.pendientes ? 'El documento tiene <b>' + p.pendientes + '</b> marcas por completar, resaltadas en amarillo. ' : 'El documento no tiene marcas pendientes. ') + (p.citasRotas.length ? 'Citas sin fuente en tu biblioteca: ' + esc(p.citasRotas.join(', ')) + '.' : '') + '</div>';
    if (p.compartido === false) h += '<div class="aviso rojo" style="margin-top:10px">El documento se creó, pero no se pudo compartir automáticamente. Pide a tu profesor que te lo comparta desde su Google Drive.</div>';
  }
  h += '</div><div class="tarjeta"><h3>Después de generarlo</h3><ol class="lista-ia" style="margin-top:6px"><li>Inserta el índice automático en la segunda página: menú Insertar, opción Índice. Los títulos ya tienen estilo de encabezado.</li><li>Completa lo resaltado en amarillo. Lo mejor es corregirlo aquí, en la etapa que corresponde, y volver a generar.</li><li>Pega las imágenes que falten y los anexos firmados: certificados de validez y constancias de SUNEDU.</li><li>Descárgalo en Word o en PDF para presentarlo.</li></ol>' +
    '<div class="aviso gris pequeno" style="margin-top:12px">Cada vez que actualizas el plan, el documento se escribe de nuevo. ' + (SERVIDOR ? 'Si necesitas editarlo a mano, descarga el Word y trabaja en tu copia.' : 'Si necesitas editarlo a mano, haz antes una copia en Google Docs (Archivo, Hacer una copia) y trabaja en ella.') + '</div></div></div>';
  h += '<aside class="tarjeta"><h3>Estructura del documento</h3><p class="pequeno tenue" style="margin-bottom:10px">El punto verde indica que la sección ya tiene contenido.</p>' + indiceHtml(d, exp) + '</aside></div>';
  return h;
}

function generarPlan(btn) {
  var fin = ocupar(btn, 'Escribiendo el documento');
  guardarAhora().then(arbolPng).then(function (png) { return llamar('generarPlan', { imagenArbol: png }); }).then(function (r) {
    S.plan = r;
    S.exp._plan_url = r.url;
    S.exp._plan_fecha = r.fecha;
    if (S.vista === 'plan') $('#pagina').innerHTML = vistaPlan();
    toast('Tu plan está listo en ' + DOCS + '.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}

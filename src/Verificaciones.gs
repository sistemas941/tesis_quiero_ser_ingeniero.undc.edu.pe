/**
 * Verificaciones.gs - Reglas automaticas, semaforo de cada etapa, matriz de consistencia y rubrica.
 */

function itemAplica_(r, exp) {
  if (r.marca === '**' && exp.tipo_proyecto !== 'artefacto') return false;
  if ((r.item === 17 || r.item === 18) && exp.con_hipotesis === 'NO') return false;
  return true;
}

function palabras_(s) { s = String(s || '').trim(); return s ? s.split(/\s+/).length : 0; }

function obs_(lista, nivel, campo, texto, item) { lista.push({ campo: campo || '', nivel: nivel, texto: texto, item: item || 0, origen: 'regla' }); }

function esInfinitivo_(frase) {
  var p = sinTildes_(String(frase || '').trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');
  return /(ar|er|ir)$/.test(p) && p.length > 3;
}

/** Reglas que el codigo comprueba sin IA. Devuelve una lista de observaciones. */
function reglasEtapa_(correo, exp, bib, etapa) {
  etapa = String(etapa);
  var o = [];
  var campos = campos_().filter(function (c) { return c.etapa === etapa && aplica_(c.aplica, exp); });

  // Reglas generales: obligatorios, minimo de filas, celdas vacias
  campos.forEach(function (c) {
    var et = etiqueta_(c, exp);
    var item = c.rubrica.length ? c.rubrica[0] : 0;
    if (c.tipo === 'tabla') {
      var filas = tabla_(exp, c.clave).filter(function (f) { return c.columnas.some(function (col) { return String(f[col.clave] || '').trim(); }); });
      if (c.obligatorio && filas.length < Math.max(1, c.min_filas)) {
        obs_(o, 'bloqueante', c.clave, '«' + et + '» necesita al menos ' + Math.max(1, c.min_filas) + ' fila(s); tiene ' + filas.length + '.', item);
      }
      var incompletas = filas.filter(function (f) { return c.columnas.some(function (col) { return !String(f[col.clave] || '').trim(); }); }).length;
      if (incompletas) obs_(o, 'bloqueante', c.clave, '«' + et + '» tiene ' + incompletas + ' fila(s) con celdas vacías.', item);
    } else if (c.obligatorio && !String(exp[c.clave] || '').trim()) {
      obs_(o, 'bloqueante', c.clave, 'Falta completar «' + et + '».', item);
    }
  });

  var mapa = mapaBiblioteca_(bib);
  var anio = new Date().getFullYear();
  var antMax = cfgNum_('ANTIGUEDAD_MAX', 5);

  // Citas rotas en los campos de esta etapa
  campos.forEach(function (c) {
    clavesEn_(exp[c.clave]).forEach(function (k) {
      if (!mapa[k]) obs_(o, 'bloqueante', c.clave, 'La cita [@' + k + '] no corresponde a ningún estudio de tu biblioteca.', 35);
    });
  });

  if (etapa === '1') {
    if (exp.acceso_datos === 'nose') obs_(o, 'bloqueante', 'acceso_datos', 'Aún no sabes cómo conseguir los datos. Resuélvelo o reduce el alcance del tema antes de seguir.', 0);
    if (exp.acceso_datos === 'tramite') obs_(o, 'mejorable', 'acceso_datos', 'El permiso sigue en trámite: no fijes el título hasta tenerlo por escrito.', 0);
    var meses = parseFloat(exp.tiempo_meses);
    if (exp.tiempo_meses && isNaN(meses)) obs_(o, 'bloqueante', 'tiempo_meses', 'Escribe los meses disponibles como un número.', 0);
    if (!isNaN(meses) && meses < 4) obs_(o, 'mejorable', 'tiempo_meses', 'Con menos de cuatro meses, el alcance debe ser muy acotado.', 0);
  }

  if (etapa === '2') {
    var pc = sinTildes_(String(exp.problema_central || '')).toLowerCase().trim();
    if (/^(la |el )?(falta|ausencia|carencia|inexistencia) de|^no (existe|hay|se cuenta)/.test(pc)) {
      obs_(o, 'mejorable', 'problema_central', 'El problema parece describir la falta de una solución. Escríbelo como el estado negativo que hoy afecta a las personas o a la organización.', 3);
    }
    if (/^(la |el )?(implementacion|desarrollo|diseno|construccion|creacion|elaboracion) de/.test(pc)) {
      obs_(o, 'mejorable', 'problema_central', 'El problema empieza nombrando una solución («implementación de», «desarrollo de»). Describe lo que hoy funciona mal; la solución viene después del estado del arte.', 3);
    }
    var pl = String(exp.planteamiento || '');
    if (pl) {
      var nc = clavesEn_(pl).filter(function (k) { return mapa[k]; }).length;
      if (nc === 0) obs_(o, 'bloqueante', 'planteamiento', 'El planteamiento no cita ninguna fuente de tu biblioteca. La rúbrica pide respaldo en literatura científica.', 4);
      else if (nc < 3) obs_(o, 'mejorable', 'planteamiento', 'El planteamiento cita ' + nc + ' fuente(s). Para el nivel más alto, respalda los tres contextos (internacional, nacional y local).', 4);
      if (palabras_(pl) < 250) obs_(o, 'mejorable', 'planteamiento', 'El planteamiento tiene ' + palabras_(pl) + ' palabras; suele necesitar al menos 250 para cubrir los tres contextos.', 3);
    }
  }

  if (etapa === '3') {
    var minA = cfgNum_('MIN_ARTICULOS', 5);
    var minT = cfgNum_('MIN_TESIS', 5);
    var ant = bib.filter(function (b) { return b.uso === 'antecedente'; });
    var arts = ant.filter(function (b) { return b.tipo === 'articulo'; });
    var tesis = ant.filter(function (b) { return b.tipo === 'tesis'; });
    var artsOk = arts.filter(function (b) { return b.verificado !== 'no'; });
    if (artsOk.length < minA) obs_(o, 'bloqueante', '', 'Tienes ' + artsOk.length + ' artículo(s) verificados como antecedentes; la rúbrica pide al menos ' + minA + '.', 12);
    if (tesis.length < minT) obs_(o, 'bloqueante', '', 'Tienes ' + tesis.length + ' tesis como antecedentes; la rúbrica pide al menos ' + minT + '.', 13);
    var sinVerificar = arts.length - artsOk.length;
    if (sinVerificar) obs_(o, 'mejorable', '', sinVerificar + ' artículo(s) no se pudieron verificar por DOI. Revisa el DOI o reemplázalos.', 12);
    var viejos = ant.filter(function (b) { var a = parseInt(b.anio, 10); return a && (anio - a) > antMax; }).length;
    if (viejos) obs_(o, 'mejorable', '', viejos + ' antecedente(s) tienen más de ' + antMax + ' años. La rúbrica prefiere los últimos ' + antMax + '.', 12);
    var sinIndiz = arts.filter(function (b) { return !b.indizacion || b.indizacion === 'No sé'; }).length;
    if (sinIndiz) obs_(o, 'mejorable', '', sinIndiz + ' artículo(s) no indican dónde está indizada la revista (Scopus, Web of Science o SciELO).', 12);
    var incompletos = ant.filter(function (b) { return !(b.objetivo && b.metodologia && b.resultados && b.conclusion && b.relacion); }).length;
    if (incompletos) obs_(o, 'bloqueante', '', incompletos + ' antecedente(s) tienen la ficha incompleta (objetivo, metodología, resultados, conclusión y relación con tu estudio).', 11);
    var sinBrecha = ant.filter(function (b) { return !String(b.sin_resolver || '').trim(); }).length;
    if (ant.length && sinBrecha) obs_(o, 'mejorable', '', sinBrecha + ' antecedente(s) no dicen qué dejan sin resolver. Esa columna es la que sostiene tu brecha.', 11);
    var db = String(exp.declaracion_brecha || '');
    if (db && !/\bpero\b|sin embargo|no obstante|aunque/i.test(db)) obs_(o, 'mejorable', 'declaracion_brecha', 'La declaración de brecha debe decir qué consigue lo que existe y qué deja sin resolver: «Lo que existe consigue X, pero no resuelve Y en el contexto Z».', 11);
    ['var1_teorias', 'var2_teorias', 'var1_definicion', 'var2_definicion'].forEach(function (k) {
      if (exp[k] && !clavesEn_(exp[k]).length) obs_(o, 'mejorable', k, 'Esta parte del marco teórico no cita ninguna fuente de tu biblioteca.', 15);
    });
    var sinAmbito = ant.filter(function (b) { return b.ambito !== 'nacional' && b.ambito !== 'internacional'; }).length;
    if (sinAmbito) obs_(o, 'mejorable', '', sinAmbito + ' antecedente(s) no dicen si son nacionales o internacionales. En la biblioteca, abre su ficha y elige el ámbito: el documento los separa así.', 11);
  }

  if (etapa === '4') {
    var nt = palabras_(exp.titulo);
    if (nt > 20) obs_(o, 'bloqueante', 'titulo', 'El título tiene ' + nt + ' palabras; el máximo es 20.', 2);
    var pg = String(exp.problema_general || '').trim();
    if (pg && pg.indexOf('?') < 0) obs_(o, 'mejorable', 'problema_general', 'El problema general debe formularse como pregunta.', 5);
    if (exp.tipo_proyecto === 'artefacto') {
      if (pg && !/frente a|respecto (de|a)|en comparacion|comparad[oa]|en lugar de| que (el|la|los|las) /.test(sinTildes_(pg).toLowerCase())) {
        obs_(o, 'mejorable', 'problema_general', 'La pregunta no dice contra qué se compara el artefacto. Forma sugerida: «¿En qué medida <el artefacto> mejora <la métrica> frente a <la línea base> en <el contexto>?».', 5);
      }
      var af = sinTildes_(String(exp.afirmacion || '')).toLowerCase();
      if (af && !/mejor|mayor|menor|mas |menos|frente a|supera|reduce|aumenta/.test(af)) {
        obs_(o, 'mejorable', 'afirmacion', 'La afirmación debe comparar: «Mi artefacto consigue X, mejor que Y, medido en Z».', 26);
      }
    }
    var pe = tabla_(exp, 'problemas_especificos');
    var oe = tabla_(exp, 'objetivos_especificos');
    var he = tabla_(exp, 'hipotesis_especificas');
    if (pe.length && oe.length && pe.length !== oe.length) obs_(o, 'bloqueante', 'objetivos_especificos', 'Hay ' + pe.length + ' problemas específicos y ' + oe.length + ' objetivos específicos: deben corresponderse uno a uno.', 8);
    if (exp.con_hipotesis !== 'NO' && oe.length && he.length && oe.length !== he.length) obs_(o, 'bloqueante', 'hipotesis_especificas', 'Hay ' + oe.length + ' objetivos específicos y ' + he.length + ' hipótesis específicas: deben corresponderse uno a uno.', 18);
    if (exp.objetivo_general && !esInfinitivo_(exp.objetivo_general)) obs_(o, 'bloqueante', 'objetivo_general', 'El objetivo general debe empezar con un verbo en infinitivo.', 8);
    var malos = oe.filter(function (f) { return f.texto && !esInfinitivo_(f.texto); }).length;
    if (malos) obs_(o, 'bloqueante', 'objetivos_especificos', malos + ' objetivo(s) específico(s) no empiezan con un verbo en infinitivo.', 8);
    var op = tabla_(exp, 'operacionalizacion');
    if (op.length) {
      var vars = {};
      op.forEach(function (f) { vars[sinTildes_(String(f.variable || '')).toLowerCase().trim()] = true; });
      if (Object.keys(vars).length < 2 && exp.var1 && exp.var2) obs_(o, 'mejorable', 'operacionalizacion', 'La operacionalización solo desagrega una variable. Incluye las dos.', 20);
    }
  }

  if (etapa === '6') {
    var cr = tabla_(exp, 'cronograma');
    var mal = cr.filter(function (f) { var a = parseFloat(f.inicio); var b = parseFloat(f.fin); return isNaN(a) || isNaN(b) || b < a || a < 1; }).length;
    if (mal) obs_(o, 'bloqueante', 'cronograma', mal + ' actividad(es) del cronograma tienen meses no válidos (usa números; el fin no puede ser anterior al inicio).', 32);
    if (cr.length && !cr.some(function (f) { return /informe|sustentaci/i.test(sinTildes_(String(f.actividad || ''))); })) {
      obs_(o, 'mejorable', 'cronograma', 'El cronograma debe llegar hasta la presentación del informe final.', 32);
    }
    var pr = tabla_(exp, 'presupuesto');
    if (pr.length) {
      ['Personal', 'Bienes', 'Servicios'].forEach(function (rub) {
        if (!pr.some(function (f) { return f.rubro === rub; })) obs_(o, 'bloqueante', 'presupuesto', 'El presupuesto no tiene ningún rubro de «' + rub + '». La rúbrica pide personal, bienes y servicios.', 33);
      });
      var nn = pr.filter(function (f) { return isNaN(parseFloat(f.cantidad)) || isNaN(parseFloat(f.costo)); }).length;
      if (nn) obs_(o, 'bloqueante', 'presupuesto', nn + ' fila(s) del presupuesto tienen cantidad o costo que no son números.', 33);
    }
    // Citas y referencias de todo el proyecto
    var todas = clavesEn_(textoCompleto_(exp));
    var rotas = todas.filter(function (k) { return !mapa[k]; });
    if (rotas.length) obs_(o, 'bloqueante', '', 'Hay ' + rotas.length + ' cita(s) sin estudio en la biblioteca: ' + rotas.slice(0, 5).join(', ') + '.', 35);
    var sinCitar = bib.filter(function (b) { return b.uso === 'antecedente' && todas.indexOf(b.clave_cita) < 0; });
    if (sinCitar.length) obs_(o, 'mejorable', '', sinCitar.length + ' antecedente(s) de tu biblioteca no se citan en ningún campo. Los antecedentes se citan solos en el capítulo II, pero conviene usarlos también en el planteamiento o en las bases teóricas.', 35);
  }
  return o;
}

function semaforo_(obs) {
  if (obs.some(function (x) { return x.nivel === 'bloqueante'; })) return 'rojo';
  if (obs.length) return 'ambar';
  return 'verde';
}

/** Estados de las etapas para decidir cual se puede abrir. */
/** Las etapas solo se encadenan si el curso lo pide; por defecto todas estan abiertas. */
function enOrden_() { return String(cfg_('ETAPAS_EN_ORDEN', 'NO')).trim().toUpperCase() === 'SI'; }

function accesible_(avance, etapas, id) {
  if (!enOrden_()) return etapas.some(function (e) { return e.id === String(id); });
  var permitir = cfg_('AVANZAR_EN_REVISION', 'SI') === 'SI';
  for (var i = 0; i < etapas.length; i++) {
    if (etapas[i].id === String(id)) return true;
    var a = avance[etapas[i].id];
    var est = a ? a.estado : '';
    if (!(est === 'aprobada' || (permitir && est === 'en_revision'))) return false;
  }
  return false;
}

/**
 * Cierra una etapa: reglas automaticas, revision del asistente y, si corresponde, envio al asesor.
 * a = { etapa, via, clave, respuesta, sinRevision }
 * Con la clave del curso o la del estudiante, la revision se hace aqui mismo.
 * En el modo de copiar y pegar hay dos pasos: sin "respuesta" se devuelve la consulta de revision
 * (fase: 'consulta'); con "respuesta" se registra la revision pegada, que queda marcada como no verificada.
 */
function cerrarEtapa_(ses, a) {
  var correo = ses.correo;
  var etapa = String(a.etapa);
  var via = viaDe_(a);
  var etapas = etapas_();
  var et = etapas.filter(function (e) { return e.id === etapa; })[0];
  if (!et) throw new Error('Etapa desconocida.');
  var exp = expediente_(correo);
  var bib = biblioteca_(correo);
  var av = avance_(correo);
  if (!accesible_(av, etapas, etapa)) throw new Error('Primero debes aprobar las etapas anteriores.');
  // Una etapa que requiere asesor no puede cerrarse si una anterior aun espera su visto bueno
  for (var i = 0; i < etapas.length && etapas[i].id !== etapa; i++) {
    var prev = av[etapas[i].id];
    if (enOrden_() && et.requiere_asesor && prev && prev.estado === 'en_revision') throw new Error('Tu asesor aún no aprueba la etapa «' + etapas[i].nombre + '». Puedes seguir editando, pero no cerrar esta etapa todavía.');
  }
  var obs = reglasEtapa_(correo, exp, bib, etapa);
  var det = { observaciones: obs, resumen: '', ia: 'no', fecha: ahora_() };
  // Si la ultima revision verificada del asistente dejo la etapa bloqueada, un cierre sin revision verificada
  // (copiar y pegar, o sin asistente) no la aprueba solo: lo decide el asesor. La marca se arrastra hasta entonces.
  var previa = av[etapa];
  var pd = previa && previa.detalle ? previa.detalle : {};
  var arrastre = !!previa && previa.estado !== 'aprobada' && (pd.sinVerificar === true ||
    (pd.ia === 'si' && previa.semaforo === 'rojo' && (pd.observaciones || []).some(function (o) { return o.origen === 'ia' && o.nivel === 'bloqueante'; })));
  if (semaforo_(obs) === 'rojo') {
    det.resumen = 'Corrige las observaciones marcadas como bloqueantes y vuelve a cerrar la etapa.';
    if (arrastre) det.sinVerificar = true;
    conBloqueo_(function () { olvidar_('Avance'); ponerAvance_(correo, etapa, { estado: 'en_curso', semaforo: 'rojo', detalle: det }); });
    return { estado: 'en_curso', semaforo: 'rojo', detalle: det };
  }
  var rev = null;
  var errIA = '';
  if (via === 'copiar' || via === 'nano') {
    if (a.sinRevision) {
      det.resumen = 'La etapa se cerró sin la revisión de un asistente: solo se aplicaron las reglas automáticas.';
    } else if (!String(a.respuesta || '').trim()) {
      // Paso 1: las reglas pasaron; se entrega la consulta de revision y la etapa no cambia de estado
      return { fase: 'consulta', consulta: textoParaChat_(armar_(correo, { modo: 'revisar', etapa: etapa })), detalle: det };
    } else {
      var q = armar_(correo, { modo: 'revisar', etapa: etapa });
      rev = aplicar_(correo, q, leerPegado_(a.respuesta, q), { via: via, modelo: via === 'nano' ? VIA_NANO_ : VIA_COPIAR_ });
      det.ia = 'pegada';
    }
  } else {
    try { rev = revisarEtapaIA_(correo, etapa, via, a.clave, a.proveedor, a.modelo); if (rev) det.ia = 'si'; } catch (e) { errIA = sinClave_(e && e.message ? e.message : e, a.clave).substring(0, 300); }
    if (!rev && errIA) { det.ia = 'error'; det.resumen = 'La revisión del asistente no pudo completarse (' + errIA + '). La etapa pasó las reglas automáticas y queda a la espera de tu asesor; también puedes volver a cerrarla más tarde.'; }
    else if (!rev) { det.resumen = 'Se aplicaron solo las reglas automáticas: el asistente del curso no está configurado.'; }
  }
  if (rev) {
    obs = obs.concat(rev.observaciones);
    det.observaciones = obs;
    det.resumen = rev.resumen + (det.ia === 'pegada' ? ' (Revisión traída por el estudiante desde su propio asistente: no verificada.)' : '');
  }
  var sem = semaforo_(obs);
  if (errIA && sem === 'verde') sem = 'ambar';
  var estado = 'en_curso';
  // Sin una revision verificada del asistente, la etapa pasa al asesor si asi se configuro o si la revision fallo
  var pendiente = arrastre && det.ia !== 'si';
  if (pendiente) {
    det.sinVerificar = true;
    det.resumen = (det.resumen ? det.resumen + ' ' : '') + 'La última revisión verificada del asistente había dejado esta etapa con observaciones bloqueantes; como este cierre no tiene una revisión verificada, lo decide tu asesor.';
  }
  var alAsesor = et.requiere_asesor || !!errIA || pendiente || (det.ia !== 'si' && String(cfg_('REVISION_SIN_IA', 'reglas')).trim().toLowerCase() === 'asesor');
  if (sem !== 'rojo') estado = alAsesor ? 'en_revision' : 'aprobada';
  // El registro de la etapa viaja como JSON en una celda: nunca debe recortarse a medias
  while (JSON.stringify(det).length > 40000 && det.observaciones.length > 1) det.observaciones.pop();
  conBloqueo_(function () { olvidar_('Avance'); ponerAvance_(correo, etapa, { estado: estado, semaforo: sem, detalle: det }); });
  return { estado: estado, semaforo: sem, detalle: det };
}

/** El estudiante no esta de acuerdo con una observacion bloqueante de la IA y pide que decida el asesor. */
function pedirExcepcion_(ses, a) {
  var correo = ses.correo;
  var etapa = String(a.etapa);
  var motivo = String(a.motivo || '').trim();
  if (motivo.length < 20) throw new Error('Explica en una o dos oraciones por qué no estás de acuerdo con la observación.');
  var av = avance_(correo)[etapa];
  if (!av || av.semaforo !== 'rojo') throw new Error('Esta etapa no tiene observaciones bloqueantes.');
  var det = av.detalle || {};
  var deReglas = (det.observaciones || []).some(function (x) { return x.nivel === 'bloqueante' && x.origen === 'regla'; });
  if (deReglas) throw new Error('Las observaciones de las reglas automáticas no admiten excepción: corrígelas primero.');
  det.excepcion = motivo;
  conBloqueo_(function () {
    olvidar_('Avance');
    ponerAvance_(correo, etapa, { estado: 'en_revision', detalle: det });
    agregar_('Comentarios', { fecha: ahora_(), correo: correo, etapa: etapa, autor: ses.nombre, rol: 'estudiante', texto: 'Solicita excepción: ' + motivo, decision: '' });
  });
  return { estado: 'en_revision' };
}

/** Si cambia un campo de una etapa ya cerrada, esa etapa y las siguientes vuelven a estar en curso. */
function reabrirDesde_(correo, etapa) {
  var av = avance_(correo);
  var etapas = etapas_();
  var desde = false;
  var cambios = [];
  etapas.forEach(function (e) {
    if (e.id === String(etapa)) desde = true;
    if (!desde) return;
    var a = av[e.id];
    if (a && (a.estado === 'aprobada' || a.estado === 'en_revision')) { ponerAvance_(correo, e.id, { estado: 'en_curso' }); cambios.push(e.id); }
  });
  return cambios;
}

/** Matriz de consistencia: una fila general y una por cada especifico. */
function matrizConsistencia_(exp) {
  var pe = tabla_(exp, 'problemas_especificos');
  var oe = tabla_(exp, 'objetivos_especificos');
  var he = exp.con_hipotesis === 'NO' ? [] : tabla_(exp, 'hipotesis_especificas');
  var filas = [{ nivel: 'General', problema: exp.problema_general || '', objetivo: exp.objetivo_general || '', hipotesis: exp.con_hipotesis === 'NO' ? '' : (exp.hipotesis_general || '') }];
  var n = Math.max(pe.length, oe.length, he.length);
  for (var i = 0; i < n; i++) {
    filas.push({ nivel: 'Específico ' + (i + 1), problema: pe[i] ? pe[i].texto || '' : '', objetivo: oe[i] ? oe[i].texto || '' : '', hipotesis: he[i] ? he[i].texto || '' : '' });
  }
  var op = tabla_(exp, 'operacionalizacion');
  var variables = [];
  var porVar = {};
  op.forEach(function (f) {
    var v = String(f.variable || '').trim() || '(sin variable)';
    if (!porVar[v]) { porVar[v] = []; variables.push(v); }
    porVar[v].push((f.dimension || '') + ': ' + (f.indicador || ''));
  });
  var textoVars = variables.map(function (v) { return v + '\n' + porVar[v].map(function (x) { return '- ' + x; }).join('\n'); }).join('\n\n');
  var metodo = ['Enfoque: ' + (exp.enfoque || ''), 'Tipo: ' + (exp.tipo_inv || ''), 'Nivel: ' + (exp.nivel_inv || ''), 'Diseño: ' + (exp.diseno_esquema || ''),
    'Población: ' + recortar_(exp.poblacion, 200), 'Muestra: ' + recortar_(exp.muestra, 200),
    'Técnicas e instrumentos: ' + tabla_(exp, 'tecnicas_instrumentos').map(function (f) { return (f.tecnica || '') + ' / ' + (f.instrumento || ''); }).join('; ')].join('\n');
  return { filas: filas, variables: textoVars, metodologia: metodo, conHipotesis: exp.con_hipotesis !== 'NO' };
}

/** Resultado de la rubrica con los niveles guardados. */
function resultadoRubrica_(exp) {
  var guardado = {};
  try { guardado = exp._rubrica ? JSON.parse(exp._rubrica) : {}; } catch (e) { guardado = {}; }
  var suma = 0;
  var aplicables = 0;
  var evaluados = 0;
  var noVerificados = 0;
  rubrica_().forEach(function (r) {
    if (!itemAplica_(r, exp)) return;
    aplicables++;
    if (guardado[r.item]) { suma += guardado[r.item].nivel; evaluados++; if (guardado[r.item].via === 'copiar' || guardado[r.item].via === 'nano') noVerificados++; }
  });
  var maximo = 4 * aplicables;
  // noVerificados: items cuya estimacion pego el estudiante desde un asistente externo
  return { puntaje: suma, maximo: maximo, aplicables: aplicables, evaluados: evaluados, noVerificados: noVerificados, porcentaje: maximo ? Math.round(1000 * suma / maximo) / 10 : 0, items: guardado };
}

// ---------------------------------------------------------------- revision por bloques (asesor)
/**
 * El asesor aprueba o devuelve varias secciones de una vez (un capitulo o todo lo que el estudiante ya reviso).
 * a = { correo, ids: [...], decision: aprobar|devolver, comentario, bloque }
 */
function revisarBloque_(ses, a) {
  var correo = normCorreo_(a.correo);
  if (!puedeVer_(ses, correo)) throw new Error('Ese estudiante no está a tu cargo.');
  var decision = String(a.decision || '');
  if (['aprobar', 'devolver'].indexOf(decision) < 0) throw new Error('Decisión no válida.');
  var texto = String(a.comentario || '').trim();
  if (decision === 'devolver' && texto.length < 10) throw new Error('Al devolver un bloque, escribe qué debe corregir el estudiante.');
  var v = vistaPrevia_(correo);
  var ids = (Array.isArray(a.ids) ? a.ids : []).map(String).filter(function (id) { return v.hashes.hasOwnProperty(id); });
  if (!ids.length) throw new Error('Ese bloque no tiene secciones para revisar.');
  conBloqueo_(function () {
    olvidar_('Expedientes');
    var rev = leerRevision_(expediente_(correo));
    ids.forEach(function (id) {
      rev[id] = decision === 'aprobar' ? { e: 'ok', h: v.hashes[id], f: ahora_(), por: 'asesor' } : { e: 'devuelto', c: texto, f: ahora_(), por: 'asesor' };
    });
    guardarCampos_(correo, { _revision: JSON.stringify(rev) });
    var nombre = String(a.bloque || '').substring(0, 80) || (ids.length + ' secciones');
    agregar_('Comentarios', { fecha: ahora_(), correo: correo, etapa: 'doc', autor: ses.nombre, rol: ses.rol, texto: (decision === 'aprobar' ? 'Bloque aprobado: ' + nombre + ' (' + ids.length + ' secciones)' + (texto ? '. ' + texto : '') : 'Bloque devuelto (' + nombre + '): ' + texto), decision: decision === 'aprobar' ? 'seccion_ok' : 'seccion_devuelta' });
  });
  olvidar_('Expedientes');
  return vistaPrevia_(correo);
}

// ---------------------------------------------------------------- Reglamento de Similitud y Originalidad (RCO N.° 503-2025-UNDC/CO)
var REGLAMENTO_ = { nombre: 'Reglamento de Similitud y Originalidad de la UNDC', norma: 'RCO N.° 503-2025-UNDC/CO (R-M02-VRI-012, 31/10/2025)', umbral: 20, palabras: 10 };

/** Campos que van en el cuerpo del documento, segun la plantilla. Devuelve { clave: 'cuerpo' | 'excluida' }. */
function camposEnDocumento_(exp) {
  var mapa = {
    justificacion: ['just_teorica', 'just_practica', 'just_metodologica', 'just_social'], terminos: ['terminos'], definiciones: ['defconc_v1', 'defconc_v2'],
    enfoque: ['enfoque', 'tipo_inv', 'nivel_inv', 'enfoque_fund'], diseno: ['diseno', 'diseno_esquema', 'afirmacion', 'metodo_validacion', 'linea_base', 'artefacto_evaluacion', 'refutacion', 'limites', 'requisitos_artefacto'],
    metodo: ['metodo', 'problema_diseno', 'artefacto_descripcion', 'artefacto_componentes'], poblacion: ['poblacion', 'muestra', 'muestreo'], tecnicas: ['tecnicas_instrumentos', 'procedimiento'],
    analisis: ['analisis', 'etica'], cronograma: ['cronograma'], presupuesto: ['presupuesto', 'financiamiento'], antecedentes_internacionales: ['brechas', 'declaracion_brecha'],
    arbol_problemas: ['problema_central', 'causas', 'efectos', 'efecto_final'], esquema_artefacto: ['esquema_artefacto'], evaluacion_artefacto: ['afirmacion', 'linea_base', 'artefacto_evaluacion', 'refutacion', 'limites', 'requisitos_artefacto'],
    artefacto: ['problema_diseno', 'artefacto_descripcion', 'artefacto_componentes']
  };
  var out = {}, anexos = false, cap = '';
  plantilla_().forEach(function (s) {
    if (s.nivel === '1') cap = s.titulo;
    if (s.nivel === 'A') anexos = true;
    if (!aplica_(s.aplica, exp)) return;
    var donde = anexos || /^referencias/i.test(cap) ? 'excluida' : 'cuerpo';
    var lista = s.tipo === 'especial' ? (mapa[s.fuente] || []) : (s.tipo === 'campo' || s.tipo === 'lista' || s.tipo === 'tabla' ? [s.fuente] : []);
    lista.forEach(function (k) { if (out[k] !== 'cuerpo') out[k] = donde; });
  });
  return out;
}

/** Palabras del texto que forman parte de una secuencia de mas de diez palabras identica a alguno de los origenes. */
function palabrasCopiadas_(actual, origenes) {
  var n = REGLAMENTO_.palabras + 1;
  var w = palabrasDe_(actual);
  if (w.length < n) return { marcadas: 0, total: w.length, fragmentos: 0 };
  var set = {};
  origenes.forEach(function (o) { var p = palabrasDe_(o); for (var i = 0; i + n <= p.length; i++) set[p.slice(i, i + n).join(' ')] = 1; });
  var marca = [], frag = 0, dentro = false;
  for (var j = 0; j + n <= w.length; j++) {
    if (set[w.slice(j, j + n).join(' ')]) { if (!dentro) frag++; dentro = true; for (var q = j; q < j + n; q++) marca[q] = 1; }
    else dentro = false;
  }
  var m = 0;
  marca.forEach(function (x) { if (x) m++; });
  return { marcadas: m, total: w.length, fragmentos: frag };
}

/** Verifica la tesis contra el Reglamento de Similitud y Originalidad de la UNDC. */
function reglamento_(correo) {
  var k = claveEst_('rg', correo);
  var c = CACHE_[k] || cacheTraer_(k);
  if (c) return c;
  var exp = expediente_(correo), bib = biblioteca_(correo), v = vistaPrevia_(correo);
  var donde = camposEnDocumento_(exp);
  var etiquetas = {};
  campos_().forEach(function (x) { etiquetas[x.clave] = etiqueta_(x, exp); });
  var marcadas = 0, total = 0, conFrag = [], citasSinRef = [];
  Object.keys(donde).forEach(function (clave) {
    if (donde[clave] !== 'cuerpo') return;
    var actual = textoPlanoCampo_(exp[clave]);
    if (!actual) return;
    var or = origenesCampo_(exp, clave).map(function (o) { return textoPlanoCampo_(o.t); });
    var r = palabrasCopiadas_(actual, or);
    total += r.total;
    marcadas += r.marcadas;
    if (r.fragmentos) conFrag.push({ campo: clave, etiqueta: etiquetas[clave] || clave, fragmentos: r.fragmentos, pct: r.total ? Math.round(100 * r.marcadas / r.total) : 0 });
    // Citas textuales: un fragmento entre comillas de 12 palabras o mas debe llevar su cita en el mismo parrafo
    String(actual).split(/\n+/).forEach(function (par) {
      var m = par.match(/[«“"][^»”"]{60,}[»”"]/g);
      if (m && m.some(function (q) { return q.split(/\s+/).length >= 12; }) && !/\[@[^\]]+\]/.test(par)) citasSinRef.push(etiquetas[clave] || clave);
    });
  });
  var pctSim = total ? Math.round(100 * marcadas / total) : 0;
  var hum = humanizacion_(exp);
  var ia = resumenIA_(correo);
  var usoIA = ia.total > 0 || hum.generados > 0;
  var tieneDecl = plantilla_().some(function (s) { return s.fuente === 'declaracion_ia' && aplica_(s.aplica, exp); });
  var citadas = clavesEn_(textoCompleto_(exp));
  var sinCitar = bib.filter(function (b) { return b.uso !== 'antecedente' && citadas.indexOf(b.clave_cita) < 0; }).length;
  var rotas = (v.citasRotas || []).length;
  var items = [
    { id: 'similitud', art: 'Art. 13', t: 'Similitud con el texto generado: hasta ' + REGLAMENTO_.umbral + ' %', estado: !total ? 'no_aplica' : (pctSim <= REGLAMENTO_.umbral ? 'ok' : 'alerta'),
      d: !total ? 'Aún no hay texto en el cuerpo de la tesis.' : 'Estimación: ' + pctSim + ' % de tus palabras repite secuencias de más de ' + REGLAMENTO_.palabras + ' palabras del borrador o de las propuestas de la IA. El máximo para la tesis de pregrado es ' + REGLAMENTO_.umbral + ' %.' },
    { id: 'fragmentos', art: 'Art. 12', t: 'Sin fragmentos de más de ' + REGLAMENTO_.palabras + ' palabras copiados del texto generado', estado: !total ? 'no_aplica' : (conFrag.length ? 'alerta' : 'ok'),
      d: conFrag.length ? conFrag.length + ' sección(es) conservan fragmentos idénticos: ' + conFrag.slice(0, 5).map(function (x) { return x.etiqueta + ' (' + x.fragmentos + ')'; }).join('; ') + '. Humanízalas.' : 'Ninguna sección del cuerpo conserva fragmentos largos del texto generado.', secciones: conFrag },
    { id: 'declaracion', art: 'Arts. 5 y 13', t: 'Uso de IA declarado (modelo, consultas y aportes)', estado: !usoIA ? 'no_aplica' : (tieneDecl ? 'ok' : 'alerta'),
      d: !usoIA ? 'Es posible que este ítem de tu tesis no aplique según el reglamento: aún no usaste IA.' : (tieneDecl ? 'Tu documento incluye el anexo «Declaración de uso de inteligencia artificial», que la aplicación llena sola con ' + ia.total + ' consultas registradas.' : 'Falta el anexo de declaración de uso de IA en la plantilla.') },
    { id: 'citas', art: 'Arts. 4 y 5', t: 'Cada cita tiene su referencia', estado: rotas ? 'alerta' : (citadas.length ? 'ok' : 'no_aplica'),
      d: rotas ? rotas + ' cita(s) sin fuente en tu biblioteca: ' + v.citasRotas.slice(0, 5).join(', ') + '.' : (citadas.length ? citadas.length + ' fuentes citadas, todas con su referencia en ' + ESTILOS_CITA_[estiloDe_(exp)] + '.' : 'Es posible que este ítem de tu tesis no aplique todavía: aún no citas fuentes.') },
    { id: 'textuales', art: 'Art. 4', t: 'Citas textuales entre comillas y con su fuente', estado: citasSinRef.length ? 'alerta' : 'ok',
      d: citasSinRef.length ? 'Hay texto entre comillas sin cita en: ' + citasSinRef.slice(0, 4).join(', ') + '.' : 'No se encontraron fragmentos entre comillas sin su cita.' },
    { id: 'humanizado', art: 'Arts. 1 y 18', t: 'Texto generado reescrito con tu propia voz', estado: !hum.generados ? 'no_aplica' : (hum.pct >= 100 ? 'ok' : 'alerta'),
      d: !hum.generados ? 'Es posible que este ítem de tu tesis no aplique según el reglamento: no hay texto generado por la IA.' : hum.listos + ' de ' + hum.generados + ' textos generados ya están humanizados (' + hum.pct + ' %).' },
    { id: 'fuentes', art: 'Art. 4', t: 'Las fuentes de tu biblioteca se usan en el texto', estado: sinCitar ? 'alerta' : 'ok',
      d: sinCitar ? sinCitar + ' fuente(s) de teoría, contexto o metodología no se citan: cítalas o quítalas.' : 'Todas tus fuentes se citan o son antecedentes.' }
  ];
  var noAplica = [];
  Object.keys(donde).forEach(function (kk) { if (donde[kk] === 'excluida' && etiquetas[kk]) noAplica.push(etiquetas[kk]); });
  var r = { norma: REGLAMENTO_, similitud: pctSim, palabras: total, items: items, alertas: items.filter(function (x) { return x.estado === 'alerta'; }).length,
    excluidas: ['Carátula', 'Índice', 'Referencias', 'Anexos'], noAplica: noAplica, donde: donde, fecha: ahora_() };
  CACHE_[k] = r;
  cachePoner_(k, r, 21600);
  return r;
}

// ------------------------------------------------------------------ Orientacion
// Resume el Taller de Titulacion por Tesis (las cuatro preguntas, la cadena, la metodologia y la validacion)
// y lo conecta con las etapas de la ruta y con lo que el estudiante ya escribio.

/** Eslabones de la cadena segun el tipo de proyecto: [nombre, que es, clave del campo que lo contiene]. */
function eslabones(exp) {
  if (exp.tipo_proyecto === 'artefacto') {
    return [
      ['Problema de impacto', 'Lo que alguien sufre hoy y se puede medir.', 'problema_central'],
      ['Brecha en la literatura', 'Lo que las soluciones existentes no resuelven.', 'declaracion_brecha'],
      ['Problema de diseño', 'Lo que vas a construir, para quién y con qué criterio de éxito.', 'problema_diseno'],
      ['Artefacto', 'El software, modelo, método o prototipo que propones.', 'artefacto_descripcion'],
      ['Afirmación', 'Mi artefacto consigue X, mejor que Y, medido en Z.', 'afirmacion'],
      ['Pregunta de conocimiento', 'Lo que vas a averiguar midiendo: tu problema general.', 'problema_general'],
      ['Método de validación', 'Cómo obtendrás la evidencia.', 'metodo_validacion'],
      ['Línea base', 'Contra qué se compara: algo externo a tu artefacto.', 'linea_base'],
      ['Límites', 'Dónde no aplicaría el resultado y qué supuestos haces.', 'limites']
    ];
  }
  var l = [
    ['Problema de impacto', 'Lo que alguien sufre hoy y se puede medir.', 'problema_central'],
    ['Brecha en la literatura', 'Lo que los estudios previos no han respondido.', 'declaracion_brecha'],
    ['Pregunta de investigación', 'Tu problema general: la relación entre tus variables.', 'problema_general'],
    ['Objetivo', 'Lo que el estudio va a determinar.', 'objetivo_general']
  ];
  if (exp.con_hipotesis !== 'NO') l.push(['Hipótesis', 'La respuesta que esperas y que los datos pueden refutar.', 'hipotesis_general']);
  l.push(['Diseño', 'Cómo se observará o medirá la relación.', 'diseno']);
  l.push(['Evidencia', 'Con qué técnicas se analizan los datos.', 'analisis']);
  return l;
}
function valorEslabon(clave) {
  var c = campoDe(clave), v = String(S.exp[clave] || '').trim();
  if (!c || !v) return '';
  if (c.tipo === 'opcion') { for (var i = 0; i < c.opciones.length; i++) { if (c.opciones[i].valor === v) return c.opciones[i].texto; } }
  return v;
}
function botonEtapa(id, texto) {
  var e = etapaDe(id);
  if (!e) return '';
  return accesible(id) ? '<button class="btn chico" data-a="abrirEtapa" data-e="' + esc(id) + '">' + esc(texto || ('Ir a la etapa ' + id + ': ' + e.nombre)) + IC.flecha + '</button>' : '<span class="chip">' + IC.candado + 'Etapa ' + esc(id) + ': ' + esc(e.nombre) + '</span>';
}

function cadenaHtml() {
  var l = eslabones(S.exp), llenos = 0;
  var filas = l.map(function (x, i) {
    var c = campoDe(x[2]), v = valorEslabon(x[2]);
    if (v) llenos++;
    return '<tr><td class="or-n"><span class="' + (v ? 'ok' : '') + '">' + (i + 1) + '</span></td><td><b>' + esc(x[0]) + '</b><div class="pequeno tenue">' + esc(x[1]) + '</div></td>' +
      '<td>' + (v ? '<div class="or-tuyo">' + conMarcas(v.length > 260 ? v.substring(0, 260) + '…' : v) + '</div>' : '<span class="chip ambar">Falta</span>') + '</td>' +
      '<td style="white-space:nowrap">' + (c && accesible(c.etapa) ? '<button class="btn chico fantasma" data-a="abrirEtapa" data-e="' + esc(c.etapa) + '">Etapa ' + esc(c.etapa) + IC.flecha + '</button>' : (c ? '<span class="pequeno tenue">Etapa ' + esc(c.etapa) + '</span>' : '')) + '</td></tr>';
  }).join('');
  var tira = l.map(function (x) { return '<span class="' + (valorEslabon(x[2]) ? 'ok' : '') + '">' + esc(x[0]) + '</span>'; }).join('<i>' + IC.flecha + '</i>');
  return '<div class="fila entre"><h2>Tu cadena, hasta hoy</h2><span class="chip ' + (llenos === l.length ? 'verde' : 'ambar') + '">' + llenos + ' de ' + l.length + ' eslabones</span></div>' +
    '<p class="tenue" style="margin:6px 0 12px">Es lo que deberías poder recitar en la sustentación. Cada eslabón se justifica con el anterior: si uno se cae, se cae la tesis.</p>' +
    '<div class="or-tira">' + tira + '</div><div class="desliza"><table class="tabla" style="min-width:640px"><tbody>' + filas + '</tbody></table></div>' +
    (S.exp.tipo_proyecto ? '' : '<p class="pequeno tenue" style="margin-top:10px">Aún no eliges el tipo de proyecto en la etapa 0: se muestra la cadena de un proyecto explicativo.</p>');
}

var PROCESOS = ['Scrum', 'XP', 'RUP', 'un prototipado incremental', 'Mobile-D', 'CRISP-DM', 'KDD', 'la metodología de Kimball', 'Hefesto'];
function fraseHtml() {
  var o = S.orienta, cm = campoDe('metodo_validacion');
  var metodos = cm ? cm.opciones.map(function (x) { return x.valor; }) : ['Opinión de expertos', 'Caso único o experimento de mecanismo', 'Investigación-acción técnica', 'Experimento estadístico de diferencia'];
  if (!o.proceso) o.proceso = PROCESOS[0];
  if (!o.metodo) o.metodo = (S.exp.metodo_validacion && metodos.indexOf(S.exp.metodo_validacion) >= 0) ? S.exp.metodo_validacion : metodos[metodos.length - 1];
  var lb = String(S.exp.linea_base || '').trim().split(/[.;:(]/)[0].trim();
  if (lb.length > 120) lb = lb.substring(0, 120) + '…';
  var m = (/^(opini|investigaci)/i.test(o.metodo) ? 'la ' : 'el ') + o.metodo.charAt(0).toLowerCase() + o.metodo.substring(1);
  return '<div class="fila" style="align-items:flex-end;margin-bottom:10px"><div class="campo-simple" style="margin:0;width:230px"><label for="fr-proceso">Proceso de construcción</label><select id="fr-proceso" data-cambio="frase">' + PROCESOS.map(function (p) { return '<option' + (p === o.proceso ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></div>' +
    '<div class="campo-simple crece" style="margin:0;min-width:240px"><label for="fr-metodo">Método de validación</label><select id="fr-metodo" data-cambio="frase">' + metodos.map(function (p) { return '<option' + (p === o.metodo ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></div></div>' +
    '<blockquote class="or-frase">«Mi metodología de investigación es la ciencia del diseño. Dentro de su fase de diseño y desarrollo usé <b>' + esc(o.proceso) + '</b> para organizar la construcción del artefacto, y en su fase de evaluación lo comparé contra una línea base externa (<b>' + (lb ? esc(lb.charAt(0).toLowerCase() + lb.substring(1)) : 'la que definas en la etapa 5') + '</b>), con <b>' + esc(m) + '</b> como método de validación.»</blockquote>' +
    '<p class="pequeno tenue" style="margin-top:8px">' + (lb ? 'La línea base sale de lo que escribiste en la etapa 5.' : 'Cuando escribas tu línea base en la etapa 5, aparecerá aquí.') + ' La frase que no funciona es la habitual: «mi metodología es Scrum». Scrum organiza el trabajo; no responde si lo construido es mejor que lo que ya existía.</p>';
}
function pintarFrase() {
  var p = $('#fr-proceso'), m = $('#fr-metodo'), cont = $('#or-frase');
  if (!cont) return;
  if (p) S.orienta.proceso = p.value;
  if (m) S.orienta.metodo = m.value;
  cont.innerHTML = fraseHtml();
}

function vistaOrientacion() {
  var d = S.d, c = d.config, art = S.exp.tipo_proyecto === 'artefacto', cr = S.info.credito || {};
  var bru = enlace(c.BRUJULA_URL), taller = enlace(c.TALLER_URL);
  var cm = campoDe('metodo_validacion');
  function seccion(id, cuerpo) { return '<section class="tarjeta or-sec" id="or-' + id + '">' + cuerpo + '</section>'; }
  function pregunta(id, n, titulo, etapa, cuerpo) {
    return seccion(id, '<div class="or-preg"><b class="or-num">' + n + '</b><div><div class="pequeno tenue" style="text-transform:uppercase;letter-spacing:.06em;font-weight:600">Pregunta ' + n + '</div><h2>' + titulo + '</h2></div><span style="margin-left:auto">' + botonEtapa(etapa) + '</span></div>' + cuerpo);
  }
  function plantilla(titulo, sub, lineas, ejemplo, nota) {
    return '<div class="or-plantilla"><b>' + titulo + '</b><div class="pequeno tenue">' + sub + '</div><pre>' + lineas.map(esc).join('\n') + '</pre><p class="pequeno"><b>Ejemplo:</b> ' + ejemplo + '</p>' + (nota ? '<p class="pequeno tenue" style="margin-top:6px">' + nota + '</p>' : '') + '</div>';
  }
  function error(titulo, texto) { return '<div class="or-error"><span class="chip rojo">' + IC.alerta + 'Error de la catapulta</span><div><b>' + titulo + '</b> ' + texto + '</div></div>'; }

  var h = '<div class="cabecera"><h1>Orientación</h1><p>Antes de llenar formatos, una tesis de Ingeniería de Sistemas responde cuatro preguntas, en este orden: cuál es el problema, qué ya existe, qué construyes o propones y con qué lo demuestras. Aquí está el resumen del Taller de Titulación por Tesis y la etapa de tu ruta donde se trabaja cada cosa.</p></div>';
  h += '<div class="rejilla dos"><div class="pila">';

  // ---- por donde empezar
  h += seccion('empezar', '<h2>Por dónde empezar</h2><div class="or-pasos">' +
    '<div><b class="or-num chico">1</b><div><h3>Si aún no tienes tema, usa la Brújula de Tesis</h3><p class="tenue">Te ayuda a ubicar un área, una línea y sublíneas de investigación. Cuando termines, pega su recomendación en el primer campo de la etapa 0 y úsala para escribir tu tema con tus palabras.</p></div></div>' +
    '<div><b class="or-num chico">2</b><div><h3>Trae un problema, no un título</h3><p class="tenue">No empieces por la tecnología que te gusta. Empieza por algo que alguien sufre hoy y que se puede medir. El título se escribe recién en la etapa 4.</p></div></div>' +
    '<div><b class="or-num chico">3</b><div><h3>Sigue la ruta en orden</h3><p class="tenue">Problema, estado del arte y evidencia, en ese orden. La secuencia inversa (elegir la tecnología, buscar bibliografía que la respalde e inventar al final cómo medir) es la del estudiante de la catapulta.</p></div></div></div>' +
    '<div class="fila" style="margin-top:14px">' + (bru ? '<a class="btn primario" href="' + esc(bru) + '" target="_blank" rel="noopener">' + IC.brujula + 'Abrir la Brújula de Tesis</a>' : '') + botonEtapa('0', 'Ir a la etapa 0: Tema') +
    (taller ? '<a class="btn fantasma" href="' + esc(taller) + '" target="_blank" rel="noopener">Guía completa del taller' + IC.afuera + '</a>' : '') + '</div>');

  // ---- la catapulta
  h += seccion('catapulta', '<h2>La catapulta: por qué se desaprueba una tesis que «funciona»</h2><p class="tenue" style="margin-top:6px">Wazlawick abre su libro con un estudiante que quería cruzar un río. Estudió todo sobre ríos y nada sobre puentes, eligió una catapulta, mejoró del 5 % al 95 % comparándose únicamente consigo mismo, y fue desaprobado. La aplicación vigila cuatro de esos errores:</p>' +
    '<div class="or-rejilla cuatro" style="margin-top:12px">' +
    '<div><b>Elegir la herramienta antes que el problema</b><p class="tenue pequeno">El síntoma es una tecnología en el título o un problema que empieza con «implementación de». Se corrige en la etapa 2.</p></div>' +
    '<div><b>Estudiar el dominio en vez de las soluciones</b><p class="tenue pequeno">Un marco teórico sobre ríos cuando hacía falta un inventario de puentes, botes y teleféricos. Se corrige en la etapa 3.</p></div>' +
    '<div><b>Compararse solo consigo mismo</b><p class="tenue pequeno">Mejorar frente a tu versión anterior no cuenta: hace falta una línea base externa. Se corrige en las etapas 4 y 5.</p></div>' +
    '<div><b>Tomar un problema puramente local</b><p class="tenue pequeno">No abandones tu caso: nombra la clase de problema a la que pertenece. Tu caso es el lugar donde se mide.</p></div></div>');

  // ---- pregunta 1
  h += pregunta('p1', 1, '¿Cuál es el problema?', '2',
    '<p style="margin-top:10px">Escríbelo como problema y no como solución, en tres partes. Son los tres primeros campos de la etapa 2:</p><ol class="lista-ia" style="margin-top:8px"><li><b>Quién lo tiene y cómo se nota.</b></li><li><b>Qué se hace hoy y qué falla en eso.</b> Lo que se hace hoy será después tu línea base.</li><li><b>Qué mejoraría si se resolviera.</b></li></ol>' +
    '<div class="aviso gris pequeno" style="margin-top:12px">Prohibido nombrar una tecnología, empezar con «implementación de» o «desarrollo de», y entregar un título.</div>' +
    '<h3 style="margin-top:16px">Cuatro filtros: si falla uno, todavía no hay tesis</h3><div class="or-rejilla cuatro" style="margin-top:8px">' +
    '<div><b>1. Alguien concreto lo sufre</b><p class="tenue pequeno">Y se le puede poner nombre: una institución, un área, una población. «Mejorar la educación en el Perú» no es un problema: es un deseo.</p></div>' +
    '<div><b>2. Se puede medir hoy</b><p class="tenue pequeno">Aunque se mida mal: cuánto demora, cuánto cuesta, cuántos errores. Si nadie puede decir cómo está hoy, nadie podrá decir si mejoró.</p></div>' +
    '<div><b>3. Resolverlo cambia una decisión o un costo</b><p class="tenue pequeno">Y se puede nombrar cuál. Si lo único que cambia es «la satisfacción de los usuarios», el impacto está por demostrarse.</p></div>' +
    '<div><b>4. No está ya resuelto y disponible</b><p class="tenue pequeno">Si la solución existe y solo hay que instalarla, es un proyecto de implementación, no una tesis. Este filtro se responde con el estado del arte.</p></div></div>' +
    '<p class="pequeno tenue" style="margin-top:12px"><b>Si tu problema es local:</b> en lugar de «la Municipalidad de Imperial no controla sus incidencias», escribe «las municipalidades distritales sin mesa de ayuda pierden trazabilidad de incidencias», con Imperial como el caso donde se mide.</p>');

  // ---- pregunta 2
  h += pregunta('p2', 2, '¿Qué ya existe?', '3',
    '<p style="margin-top:10px">Busca <b>soluciones</b>, no temas. Cada antecedente se registra en tu biblioteca con una ficha que es una fila de la matriz de líneas base:</p>' +
    '<div class="desliza" style="margin-top:8px"><table class="tabla or-matriz"><thead><tr><th>Qué construyeron</th><th>Qué consiguieron</th><th>Con qué lo midieron</th><th>Sobre qué datos o contexto</th><th>Qué quedó sin resolver</th></tr></thead><tbody><tr><td class="pequeno tenue">En la ficha: objetivo</td><td class="pequeno tenue">Resultados, con cifras</td><td class="pequeno tenue">Metodología</td><td class="pequeno tenue">Metodología</td><td class="pequeno"><b>La columna que interesa</b></td></tr></tbody></table></div>' +
    '<div class="aviso pequeno" style="margin-top:12px"><b>Regla para cerrar la matriz:</b> si todas las filas de la última columna dicen lo mismo, esa es la brecha. Si ninguna coincide, el problema todavía está mal delimitado.</div>' +
    plantilla('Declaración de brecha', 'Una sola frase. Es la bisagra de la tesis y la primera línea de la justificación.', ['Lo que existe consigue <X>,', 'pero no resuelve <Y>', 'en el contexto <Z>.'], 'lo que existe detecta la neumonía aguda con exactitudes superiores al 90 %, pero no resuelve la identificación de las secuelas en equipos sin aceleración gráfica.') +
    '<p class="pequeno tenue" style="margin-top:10px">Entre ocho y doce trabajos bien leídos superan a cuarenta citados de oídas. En esta aplicación el mínimo es de ' + esc(c.MIN_ARTICULOS) + ' artículos y ' + esc(c.MIN_TESIS) + ' tesis como antecedentes. El jurado detecta lo no leído con una sola pregunta: cuál era la métrica del tercer trabajo que citaste.</p>' +
    '<div class="fila" style="margin-top:10px"><button class="btn chico" data-a="ir" data-v="biblioteca">' + IC.libro + 'Abrir mi biblioteca</button></div>');

  // ---- pregunta 3
  h += pregunta('p3', 3, art ? '¿Qué construyes?' : '¿Qué construyes o propones?', '4',
    '<p style="margin-top:10px">Wieringa separa dos cosas que el formato habitual mezcla: un <b>problema de diseño</b> pide construir algo; una <b>pregunta de conocimiento</b> pide averiguar algo. Una tesis con artefacto tiene uno de cada uno, y en ese orden.</p>' +
    '<div class="or-rejilla" style="margin-top:12px">' +
    plantilla('Problema de diseño', 'Lo que se va a construir. Se resuelve construyendo.', ['Diseñar <artefacto>', 'que consiga <objetivo medible>', 'para <quién tiene el problema>', 'en <contexto>,', 'de modo que <criterio de éxito>.'], 'diseñar un modelo predictivo que identifique a los estudiantes en riesgo de deserción al final del primer ciclo, para la Oficina de Tutoría, con los datos ya disponibles en el sistema, de modo que la identificación ocurra con al menos un ciclo de anticipación.') +
    plantilla('Pregunta de conocimiento', 'Lo que se va a averiguar. Se responde midiendo. En tu plan es el problema general.', ['¿En qué medida <el artefacto>', 'mejora <la métrica>', 'frente a <la línea base>', 'en <el contexto>?'], '¿en qué medida el modelo propuesto mejora la sensibilidad en la detección temprana de deserción frente al criterio de riesgo por promedio ponderado que se usa hoy, sobre las cohortes 2020 a 2022?') + '</div>' +
    plantilla('Afirmación', 'Si no puedes escribirla, todavía no hay proyecto.', ['Mi artefacto consigue <X>,', 'mejor que <Y>,', 'medido en <Z>.'], 'el modelo propuesto detecta a los estudiantes en riesgo de deserción mejor que el criterio de promedio ponderado que se usa hoy, medido en sensibilidad sobre las cohortes 2020 a 2022.', '<b>Y tiene que ser algo externo:</b> el procedimiento actual, otra técnica publicada o una línea base reconocida. Compararte con una versión anterior de tu propio artefacto no cuenta.') +
    '<p class="pequeno tenue" style="margin-top:10px"><b>Si tu proyecto es explicativo</b> (no construye un artefacto), la propuesta es la pregunta sobre la relación entre tus variables, con sus objetivos' + (S.exp.con_hipotesis === 'NO' ? '' : ' e hipótesis') + ' en correspondencia uno a uno. Revísalo en la matriz de consistencia.</p>');

  // ---- pregunta 4
  h += pregunta('p4', 4, '¿Con qué lo demuestras?', '5',
    '<p style="margin-top:10px">El método de validación se elige por la afirmación que quieres sostener, no por costumbre. Wieringa distingue cuatro:</p><div class="or-rejilla cuatro" style="margin-top:8px">' +
    (cm ? cm.opciones : []).map(function (o) { var t = String(o.texto), i = t.indexOf(':'); return '<div><b>' + esc(i > 0 ? t.substring(0, i) : t) + '</b><p class="tenue pequeno">' + esc(i > 0 ? t.substring(i + 1).trim().replace(/^./, function (x) { return x.toUpperCase(); }) : '') + '</p></div>'; }).join('') + '</div>' +
    '<h3 style="margin-top:16px">El plan de validación</h3><p class="tenue" style="margin-top:4px">Qué vas a medir, con qué instrumento, sobre qué casos, contra qué línea base y <b>cuál sería el resultado que refutaría tu afirmación</b>. Esa última casilla separa un plan de validación de una lista de deseos. Los límites se escriben antes de medir: en qué contexto no aplicaría el resultado, qué supuestos haces y qué queda fuera.</p>' +
    '<div class="aviso verde pequeno" style="margin-top:12px"><b>El piso en pregrado:</b> un artefacto con evidencia propia y al menos un punto de comparación. No se exige un cuasiexperimento con grupo de control: el estándar del área es comparar contra lo que existe, con los datos y el artefacto disponibles.</div>');

  // ---- metodologia
  h += seccion('metodo', '<h2>¿Cuál es mi metodología?</h2><p class="tenue" style="margin-top:6px">Scrum, RUP o CRISP-DM organizan la <b>construcción</b>: dicen cómo repartir el trabajo y cuándo se entrega. No dicen qué se afirma ni cómo se demuestra. La metodología de investigación de una tesis que construye es la ciencia del diseño, que Peffers y sus colegas ordenan en seis pasos:</p>' +
    '<div class="or-dsrm">' + [
      ['01', 'Identificar el problema y motivarlo', 'Quién lo sufre, cómo se nota, por qué importa.', 'Etapas 0 a 2'],
      ['02', 'Definir los objetivos de la solución', 'Qué tendría que conseguir el artefacto, en términos medibles.', 'Etapa 4: requisitos'],
      ['03', 'Diseñar y desarrollar', 'Aquí, y solo aquí, entran Scrum, XP, RUP, CRISP-DM, Kimball o Mobile-D.', 'Etapa 5: artefacto'],
      ['04', 'Demostrar', 'Usar el artefacto en un caso: que funcione en algo real.', 'Etapa 5: validación'],
      ['05', 'Evaluar', 'Medir contra los objetivos y contra una alternativa.', 'Etapa 5: línea base'],
      ['06', 'Comunicar', 'La tesis, el artículo y el artefacto depositado.', 'Plan y tesis']
    ].map(function (p) { return '<div' + (p[0] === '03' ? ' class="marcado"' : '') + '><span class="mono">' + p[0] + '</span><b>' + p[1] + '</b><p class="pequeno tenue">' + p[2] + '</p><span class="chip borde">' + p[3] + '</span></div>'; }).join('') + '</div>' +
    '<h3 style="margin-top:18px">Dónde va cada metodología que conoces</h3><div class="desliza" style="margin-top:6px"><table class="tabla" style="min-width:620px"><thead><tr><th>Familia</th><th>Para qué sirve</th><th>Ejemplos</th><th>En tu tesis</th></tr></thead><tbody>' + [
      ['Proceso de desarrollo de software', 'Organiza cómo se construye el software: iteraciones, roles, entregas.', 'Scrum, XP, Kanban, RUP, prototipado, Mobile-D', 'Paso 03'],
      ['Datos y analítica', 'Organiza el trabajo con los datos y los modelos.', 'CRISP-DM, KDD, SEMMA, Kimball, Hefesto', 'Paso 03'],
      ['Gestión, calidad y servicios', 'Organiza la organización, no el artefacto.', 'ISO/IEC, ITIL, COBIT, BPM, PMBOK, CMMI', 'Marco de referencia'],
      ['Arquitectura y plataforma', 'Decide la forma técnica de la solución.', 'SOA, microservicios, TOGAF', 'Paso 03'],
      ['Evaluación e investigación', 'La única familia que habla de evidencia.', 'Usabilidad, TAM, juicio de expertos, revisión sistemática, AHP', 'Pasos 04 y 05']
    ].map(function (f) { return '<tr><td><b>' + f[0] + '</b></td><td class="pequeno">' + f[1] + '</td><td class="pequeno tenue">' + f[2] + '</td><td><span class="chip ' + (f[3].indexOf('04') >= 0 ? 'verde' : 'borde') + '">' + f[3] + '</span></td></tr>'; }).join('') + '</tbody></table></div>' +
    '<p class="pequeno tenue" style="margin-top:8px">CRISP-DM incluye una fase de evaluación, pero evalúa contra los objetivos de negocio del proyecto, no contra el estado del arte: sirve para decidir si el modelo se despliega, no para sostener que es mejor que lo publicado.</p>' +
    '<h3 style="margin-top:18px">La frase que hay que poder decir</h3><p class="tenue pequeno" style="margin-bottom:10px">En la sustentación y en tu capítulo de metodología. Ármala con tu proyecto:</p><div id="or-frase">' + fraseHtml() + '</div>' +
    '<div class="aviso gris pequeno" style="margin-top:12px">En la UNDC no es obligatorio declarar la «ciencia del diseño»: tu plan puede usar el vocabulario habitual (enfoque, tipo, nivel y diseño de investigación). Lo que no puede faltar es la lógica: el artefacto, la afirmación, la línea base y la evidencia.</div>');

  // ---- cadena
  h += seccion('cadena', cadenaHtml() + '<div class="aviso gris pequeno" style="margin-top:12px">Un artefacto sin brecha es una catapulta. Una afirmación sin línea base es compararse con uno mismo. Una validación sin límites es una promesa.</div>');

  // ---- consensus
  h += seccion('consensus', '<h2>Buscar el estado del arte con Consensus</h2><p class="tenue" style="margin-top:6px">Consensus es un buscador académico que devuelve afirmaciones extraídas de los artículos en lugar de una lista de enlaces. Bien usado acorta la búsqueda de semanas a horas; mal usado produce el capítulo de la catapulta, pero con citas.</p>' +
    '<ol class="lista-ia" style="margin-top:10px"><li><b>Convierte el problema en una pregunta contestable.</b> «Deserción universitaria» devuelve ruido; «¿los modelos de aprendizaje automático predicen la deserción mejor que los indicadores académicos tradicionales?» devuelve evidencia comparable.</li><li><b>Pregunta en inglés.</b> Se consulta en inglés y se escribe en español.</li><li><b>Lee el medidor de consenso como mapa, nunca como conclusión.</b> No es una respuesta que se pueda citar.</li><li><b>Abre los artículos que vas a citar.</b> Con qué lo midieron no está en el resumen: está en la sección de método.</li><li><b>Vuelca todo a la ficha del antecedente</b>, incluida la columna «qué deja sin resolver». Trae el artículo a tu biblioteca con su DOI: la aplicación verifica sus datos.</li><li><b>Cierra con la búsqueda clásica:</b> IEEE Xplore, ACM Digital Library y Scopus, más RENATI y ALICIA para las tesis peruanas.</li></ol>' +
    '<div class="aviso ambar pequeno" style="margin-top:12px"><b>Tres advertencias.</b> Buscar rápido no es leer. La herramienta devuelve afirmaciones, no métodos: la ficha se llena leyendo. Y lo que se cita se lee: el uso de herramientas de IA en la búsqueda se declara en el método. Declararlo no resta rigor; ocultarlo sí.</div>' +
    '<div class="fila" style="margin-top:10px"><a class="btn chico" href="https://consensus.app/" target="_blank" rel="noopener">Abrir Consensus' + IC.afuera + '</a><button class="btn chico" data-a="ir" data-v="biblioteca">' + IC.libro + 'Agregar un artículo por su DOI</button></div>');

  // ---- fuentes
  h += seccion('fuentes', '<h2>Fuentes</h2><p class="tenue pequeno" style="margin:6px 0 10px">Todo el marco proviene de literatura de computación y sistemas de información.</p><ul class="or-fuentes">' + [
    'Wazlawick, R. S. (2021). <i>Metodologia de Pesquisa para Ciência da Computação</i> (3.ª ed.). LTC.',
    'Wieringa, R. J. (2014). <i>Design Science Methodology for Information Systems and Software Engineering</i>. Springer.',
    'Hevner, A. R., March, S. T., Park, J. y Ram, S. (2004). Design science in information systems research. <i>MIS Quarterly, 28</i>(1), 75-105.',
    'Peffers, K., Tuunanen, T., Rothenberger, M. A. y Chatterjee, S. (2007). A design science research methodology for information systems research. <i>Journal of Management Information Systems, 24</i>(3), 45-77.',
    'March, S. T. y Smith, G. F. (1995). Design and natural science research on information technology. <i>Decision Support Systems, 15</i>(4), 251-266.',
    'Glass, R. L., Ramesh, V. y Vessey, I. (2004). An analysis of research in computing disciplines. <i>Communications of the ACM, 47</i>(6), 89-94.',
    'Shaw, M. (2003). Writing good software engineering research papers. <i>Proceedings of ICSE 2003</i>, 726-736.',
    'Sjøberg, D. I. K. et al. (2005). A survey of controlled experiments in software engineering. <i>IEEE Transactions on Software Engineering, 31</i>(9), 733-753.',
    'ACM (2020). <i>Artifact Review and Badging</i>, versión 1.1.'
  ].map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' +
    (cr.autor ? '<p class="pequeno tenue" style="margin-top:12px">Contenido adaptado del Taller de Titulación por Tesis de ' + esc(cr.autor) +
      (/^https:\/\//.test(cr.orcid || '') ? ' · <a href="' + esc(cr.orcid) + '" target="_blank" rel="noopener">ORCID</a>' : '') + (/^https:\/\//.test(cr.linkedin || '') ? ' · <a href="' + esc(cr.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>' : '') + '</p>' : ''));

  h += '</div><aside class="tarjeta or-indice"><h3>En esta página</h3>' + [['empezar', 'Por dónde empezar'], ['catapulta', 'La catapulta'], ['p1', '1. ¿Cuál es el problema?'], ['p2', '2. ¿Qué ya existe?'], ['p3', '3. ¿Qué construyes?'], ['p4', '4. ¿Con qué lo demuestras?'], ['metodo', '¿Cuál es mi metodología?'], ['cadena', 'Tu cadena, hasta hoy'], ['consensus', 'Consensus'], ['fuentes', 'Fuentes']].map(function (x) {
    return '<button data-a="ancla" data-p="' + x[0] + '">' + x[1] + '</button>';
  }).join('') + (bru ? '<div class="separador"></div><a class="btn primario" style="justify-content:center" href="' + esc(bru) + '" target="_blank" rel="noopener">' + IC.brujula + 'Brújula de Tesis</a>' : '') + '</aside></div>';
  return h;
}

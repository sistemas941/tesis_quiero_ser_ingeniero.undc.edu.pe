// ------------------------------------------------------------------ Guía de uso
function pasos(l) { return '<ol class="g-pasos">' + l.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol>'; }
function gSeccion(id, titulo, cuerpo) { return '<section class="tarjeta g-sec" id="g-' + id + '"><h2>' + titulo + '</h2>' + cuerpo + '</section>'; }

var GUIA = {
  novedades: ['Novedades de las versiones 1.7, 1.6 y 1.5', function () {
    return '<h3>Versión 1.7: mi expediente y el paso a la versión 2</h3>' +
      '<p><b>Descargar mi expediente.</b> En <b>Mi configuración</b> (la tuerquita), el estudiante descarga un archivo con todo su trabajo: campos del plan, biblioteca, borrador y figuras. Va <b>firmado</b>, para que la versión 2 reconozca la aprobación del plan. Sirve también como respaldo personal.</p>' +
      '<p><b>Versión 2 en servidor propio.</b> La misma aplicación, con las mismas contraseñas, en la dirección de la escuela. El Word y el PDF se descargan directamente. Quien siguió trabajando en la versión 1 importa su expediente desde <b>Mi configuración, Importar desde la versión 1</b>: con firma válida llega todo; sin firma, solo el contenido.</p>' +
      '<p><b>Traslado.</b> Cuando la aplicación se traslada, la versión 1 queda <b>solo para consulta</b> y muestra la nueva dirección al ingresar (Config: SOLO_LECTURA y NUEVA_DIRECCION).</p>' +
      '<h3>Versión 1.6: el borrador de tesis</h3>' +
      '<p><b>Aprobación del plan.</b> La coordinación (o el administrador) abre el expediente del estudiante y pulsa <b>Aprobar el plan y abrir el borrador</b>. Se guarda una copia fija del Word del plan aprobado, el plan queda <b>congelado</b> (solo lectura en «Mi tesis», «Mi ruta» y «Matriz») y se abre el nivel «Borrador» en el menú del estudiante.</p>' +
      '<p><b>Cambios al plan solo si se piden.</b> El estudiante pulsa <b>Solicitar un cambio al plan</b>, marca las secciones y explica el motivo. La coordinación autoriza solo esas secciones (o explica por qué no) y, cuando el estudiante termina, vuelve a aprobar el plan: queda la versión 2, 3… con todo el historial.</p>' +
      '<p><b>Borrador con la estructura oficial.</b> Sigue el Anexo 6 del Reglamento de Grados y Títulos de la UNDC (RCO N.° 115-2025-UNDC/CO): dedicatoria, agradecimiento, resumen, abstract, introducción, capítulos I a VIII (planteamiento, marco teórico y empírico, hipótesis y variables, diseño metodológico, resultados, discusión, conclusiones y recomendaciones), referencias y anexos. Las secciones de los capítulos I a IV se traen del plan con un clic, con la opción de pasarlas a tiempo pasado («se aplicará» pasa a «se aplicó»).</p>' +
      '<p><b>Mini editor.</b> Barra con negrita, cursiva, subrayado, subtítulos que se numeran solos (1.1.1, A.), viñetas, listas numeradas, cita textual en bloque, citar desde la biblioteca, <b>tablas</b> (con un editor de filas y columnas; formato APA 7), <b>figuras</b> (se suben y se reducen solas, o se deja el espacio para pegarlas en Word) y <b>ecuaciones</b> en LaTeX con vista previa y ejemplos. En el Word, las ecuaciones aparte salen como ecuaciones de Office editables y numeradas. Hay un mini tutorial dentro del editor.</p>' +
      '<p><b>Guardar con botón.</b> Cada sección se carga al abrirla y se guarda con <b>Guardar</b> o <b>Ctrl+S</b>; mientras tanto el texto queda en el navegador, así que no se pierde si se corta la conexión. Si la sección se guardó desde otra ventana, la aplicación avisa antes de pisarla.</p>' +
      '<p><b>Consensus primero.</b> En el marco teórico, los antecedentes, la metodología, la discusión y las recomendaciones aparece «Evidencia con Consensus», con búsquedas ya armadas desde las variables. Lo elegido entra a la biblioteca y se cita donde está el cursor; en la discusión se arma una <b>tabla de contraste</b> (resultado propio, estudio, hallazgo, coincidencia y explicación).</p>' +
      '<p><b>Revisión y similitud.</b> El estudiante marca cada sección como «lista para mi asesor»; el asesor la aprueba o la devuelve con un comentario desde la pestaña «Borrador de tesis» del expediente. «Revisar similitud» estima los fragmentos de once palabras o más copiados de los resúmenes de la biblioteca (máximo 20 % en pregrado). El tablero muestra planes aprobados, pedidos de cambio y el avance del borrador.</p>' +
      '<p><b>Google Sites.</b> La aplicación se puede insertar en un Google Sites gratuito (Insertar, «Por URL», pegar la dirección /exec) para que no aparezca la franja de Apps Script. Se desactiva con PERMITIR_INSERTAR = NO en la hoja Config.</p>' +
      '<h3>Versión 1.5</h3><p><b>Mi clase.</b> Al entrar, el estudiante ve el avance de su promoción, su puesto y los tres primeros en avance general, humanización, revisión, aprobación del asesor y biblioteca. Solo se muestran el nombre y la inicial del apellido.</p>' +
      '<p><b>Barra de avance por nivel.</b> El avance general combina lo esencial escrito, las secciones revisadas y los textos humanizados. Su color indica el nivel: Semilla (gris), Brote (ámbar), En camino (celeste), Casi listo (violeta) y Listo (verde). Se ve en «Mi clase», en «Mi tesis» y en los paneles del asesor y del coordinador.</p>' +
      '<p><b>Importar un plan ya escrito.</b> Desde «Mi tesis», «Mi ruta» o «Mi clase», pulse <b>Importar mi plan</b> y suba el archivo (Word .docx recomendado, también PDF o texto). La aplicación reconoce las secciones, el título, las tablas (operacionalización, cronograma, presupuesto, términos) y las referencias; el estudiante revisa a qué campo va cada parte, puede pedir al asistente que las ordene y decide si reemplaza lo ya escrito. Las referencias se verifican con Crossref y entran a la biblioteca. La importación se puede deshacer, y queda registrada para el asesor y la coordinación.</p>' +
      '<p><b>Referencias desde un documento.</b> En Biblioteca, pestaña «Desde un documento», se pega una lista de referencias en cualquier estilo o se sube el archivo donde están. Se separan, se verifican y se agregan con su clave para citar.</p>' +
      '<p><b>Estilo de citas.</b> IEEE viene por defecto; cada estudiante puede cambiar a APA 7, Vancouver o Chicago (autor-fecha) en la Biblioteca o en su configuración. Las citas del texto y la lista de referencias se rehacen solas. Las tablas y figuras siguen el formato APA 7: «Tabla 1» en negrita, el título en cursiva y la nota debajo.</p>' +
      '<p><b>La tuerquita.</b> Cada usuario elige el color de la aplicación y cambia su contraseña; el estudiante además elige su asistente de IA, su asistente favorito para copiar y pegar, su estilo de citas y su forma de trabajo.</p>' +
      '<p><b>Otras IA.</b> En el modo «copiar y pegar» sirven Gemini, ChatGPT, Claude, DeepSeek, Kimi y Copilot, con una mini guía para cada uno. No necesitan clave.</p>' +
      '<p><b>Clave propia de otros proveedores.</b> En «Activar mi IA», tarjeta «Mi propia clave de API», se elige Gemini, Groq, Claude, Kimi, DeepSeek, OpenAI u OpenRouter. Cada uno trae su enlace y sus pasos: se crea la clave en la página del proveedor, se pega y se pulsa «Probar y guardar». Gemini y Groq tienen nivel gratuito; los demás cobran por uso (las suscripciones de ChatGPT o claude.ai no incluyen la API). Se puede escribir otro modelo en «Modelo (opcional)». La clave se guarda solo en el navegador del estudiante; el administrador puede cambiar los modelos por defecto en la hoja Config (MODELO_GROQ, MODELO_CLAUDE, MODELO_KIMI, MODELO_DEEPSEEK, MODELO_OPENAI, MODELO_OPENROUTER y sus variantes _LIGERO).</p>' +
      '<p><b>Consensus y estado del arte.</b> En Biblioteca, pestaña «Consensus», el estudiante pega su clave de la API (se crea gratis en <a href="https://consensus.app/api-mcp/" target="_blank" rel="noopener">consensus.app/api-mcp</a>, pestaña «Keys and clients»; el plan gratuito trae 30 consultas al mes). Busca papers con filtros de año, tipo de estudio y área, o activa la <b>búsqueda profunda</b> (tres consultas: el tema, sus límites y las revisiones). Cada resultado trae su hallazgo clave, el tipo de estudio, el cuartil y las citas. Con «Agregar y armar mi estado del arte», las fuentes entran a la biblioteca y el asistente arma la síntesis, las tendencias, las brechas, las preguntas abiertas, los métodos útiles y la declaración de brecha, que se guardan en la tesis. El administrador puede poner una clave para todo el curso en las propiedades del script (CONSENSUS_API_KEY). También se pueden importar exportaciones en BibTeX o RIS desde «Desde un documento».</p>' +
      '<p><b>Revisión por bloques.</b> En «Su tesis», el asesor aprueba o devuelve un capítulo completo con un solo comentario, o aprueba de una vez todo lo que el estudiante ya revisó.</p>' +
      '<p><b>Reglamento de Similitud y Originalidad (RCO N.° 503-2025-UNDC/CO).</b> En «Ver mi tesis» y en la vista del asesor se verifica: similitud estimada con el texto generado (máximo 20 % en pregrado, Art. 13), fragmentos de más de diez palabras (Art. 12), declaración del uso de IA (Arts. 5 y 13), citas con su referencia y citas textuales entre comillas (Art. 4) y humanización. Lo que el reglamento excluye del análisis (carátula, índice, referencias y anexos) se marca como «puede no aplicar». Es una estimación interna: no reemplaza el informe del software institucional.</p>';
  }],
  inicio: ['Primer ingreso', function () {
    return '<p>La aplicación funciona en cualquier navegador moderno (Chrome, Edge, Firefox o Safari), en computadora o celular. No hay que instalar nada.</p>' +
      pasos(['Abra el enlace de la aplicación que le entregó la coordinación.', 'Escriba su correo y la <b>clave inicial</b> que le entregaron (su primer apellido en minúsculas y cuatro números, por ejemplo <span class="mono">garcia0427</span>).',
        'La aplicación le pedirá crear una <b>clave propia</b>: al menos 8 caracteres, con letras y números, distinta de la inicial y sin su correo.', 'Desde entonces ingrese siempre con su correo y su clave propia.']) +
      '<div class="aviso gris" style="margin-top:12px"><b>¿Olvidó su clave?</b> Pida a su asesor, al asistente o a la coordinación que la reinicien: recibirá una nueva clave inicial y deberá cambiarla al entrar. Tras cinco intentos fallidos, el acceso queda en pausa quince minutos.</div>' +
      '<p style="margin-top:12px">Si la coordinación habilitó el registro, también puede crear su usuario desde la pestaña «Soy nuevo» con la <b>clave del curso</b>.</p>';
  }],
  estudiante: ['Para estudiantes', function () {
    return '<p>La aplicación le acompaña desde la idea hasta el plan de tesis en Word, con la estructura de la UNDC y la metodología de ciencia del diseño.</p>' +
      '<h3>Dos formas de trabajar</h3><div class="rejilla dos" style="gap:12px"><div class="tarjeta plana"><b>Modo sencillo</b><p class="pequeno tenue">Solo las preguntas esenciales, con su tesis a la vista mientras escribe. Recomendado para empezar.</p></div><div class="tarjeta plana"><b>Ruta completa</b><p class="pequeno tenue">Todas las etapas con su revisión, la matriz de consistencia y la rúbrica. Cambie de modo con el botón de la barra superior.</p></div></div>' +
      '<h3>Paso a paso</h3>' + pasos(['<b>Mi tesis:</b> responda las preguntas. Todo se guarda solo; verá «Guardado» arriba a la derecha.',
        '<b>Biblioteca:</b> agregue sus antecedentes por DOI o búsqueda. Los datos se verifican en Crossref y OpenAlex; complete la ficha de cada antecedente.',
        '<b>Ver mi tesis:</b> lea el documento armado, revise cada sección y marque «Lo revisé». Las secciones que su asesor devuelva aparecen en rojo con su comentario.',
        '<b>Rúbrica y matriz:</b> en la ruta completa, compruebe la coherencia de su plan con la rúbrica oficial.',
        '<b>Descargar:</b> genere el plan en Word o PDF cuando quiera; lo pendiente queda resaltado en amarillo.']) +
      '<div class="aviso" style="margin-top:12px">El asistente de IA propone, pero usted decide: cada propuesta que acepta, edita o descarta queda registrada y su asesor puede verlo. Revise siempre lo que propone y declare su uso en el anexo correspondiente.</div>';
  }],
  asesor: ['Para asesores', function () {
    return pasos(['En <b>Estudiantes</b> ve a sus tesistas: lo esencial respondido, secciones revisadas, etapas que esperan su visto bueno y días sin actividad.',
      'Pulse un estudiante para abrir su expediente. En la pestaña <b>Su tesis</b> lee el documento completo y, en cada sección, puede <b>Aprobar</b> o <b>Devolver</b> con un comentario.',
      'En las pestañas de cada etapa aprueba o devuelve la etapa (al devolver, el comentario es obligatorio) o deja un comentario.',
      'En <b>Uso de IA</b> ve cuántas consultas hizo y qué hizo con las propuestas de redacción.',
      'Si su estudiante olvidó la clave, use <b>Reiniciar su clave</b> y entréguele la clave inicial que aparece.']) +
      '<p class="pequeno tenue" style="margin-top:10px">Solo ve a los estudiantes que tiene asignados. La asignación la hace la coordinación o el asistente en Usuarios.</p>';
  }],
  coordinador: ['Para la coordinación', function () {
    return '<p>El <b>Tablero</b> reúne el avance de todos los tesistas y la actividad de los asesores.</p>' +
      '<h3>Indicadores</h3><div class="pila" style="gap:6px">' + [
        ['Avance medio', 'Porcentaje promedio de preguntas esenciales respondidas.'], ['Revisión media', 'Porcentaje promedio de secciones del documento revisadas.'],
        ['Ingresaron en 7 días', 'Tesistas que entraron a la aplicación en la última semana.'], ['Nunca ingresaron', 'Aún no han entrado; normalmente tienen la clave inicial pendiente.'],
        ['Sin avanzar 14+ días', 'Tesistas sin cambios en dos semanas o más: conviene contactarlos.'], ['Etapas por revisar', 'Etapas cerradas por el estudiante que esperan la decisión del asesor.'],
        ['Planes generados', 'Tesistas que ya descargaron su plan en Word.'], ['Reelaboraron la IA', 'Foco de reelaboración: compara el texto actual de cada campo con las propuestas de redacción que la IA dio en la aplicación. Encendido (verde): reescrito con palabras propias; ámbar: en parte; apagado (rojo): casi igual a la propuesta. No detecta textos de asistentes externos ni anticipa el resultado de Turnitin.'], ['Consultas a la IA', 'Uso total del asistente, con el detalle por modo en el gráfico.']
      ].map(function (x) { return '<div class="dato"><span><b>' + x[0] + '</b></span><span class="pequeno" style="text-align:right;max-width:60%">' + x[1] + '</span></div>'; }).join('') + '</div>' +
      '<h3>Tablas</h3>' + pasos(['Use los filtros (nunca ingresaron, sin avanzar, clave pendiente, con devoluciones…) y el buscador.', 'Pulse un encabezado para ordenar; pulse una fila para abrir el expediente en solo lectura.',
        'La tabla de <b>Asesores</b> muestra su último ingreso, sus ingresos de los últimos 30 días, sus aprobaciones, devoluciones y comentarios, y cuántos de sus estudiantes están inactivos.',
        '<b>Copiar tabla</b> lleva los datos filtrados a Google Sheets o Excel.', 'Los datos se recalculan cada diez minutos; <b>Actualizar</b> los recalcula al momento.']) +
      '<p class="pequeno tenue" style="margin-top:10px">El registro de ingresos empieza con la versión 1.4: los gráficos de acceso se llenan a medida que las personas entran.</p>';
  }],
  asistente: ['Para el asistente: registrar usuarios', function () {
    return pasos(['Abra <b>Usuarios</b> y pulse <b>Nuevo usuario</b>.', 'Escriba el correo y el nombre como «Apellidos, Nombres» (por ejemplo, «García Torres, Ana»).',
      'Elija el rol (estudiante o asesor) y, para un estudiante, su asesor.', 'Guarde. La <b>clave inicial</b> aparece en la tabla: entréguela a la persona; al entrar deberá cambiarla.',
      'Para corregir datos, asignar otro asesor, desactivar a alguien o reiniciar su clave, use <b>Editar</b>.']) +
      '<div class="aviso ambar" style="margin-top:12px">El asistente ve el tablero y los expedientes en <b>solo lectura</b>: no puede aprobar, devolver, comentar ni cambiar el contenido de las tesis, y no puede crear coordinadores ni administradores.</div>';
  }],
  humanizar: ['Humanizar: escribir con voz propia', function () {
    return '<p>Los borradores precargados y las propuestas de la IA son un punto de partida. Antes de presentar la tesis, cada texto generado debe quedar escrito con las palabras del tesista: así se apropia de sus ideas y puede defenderlas ante el jurado.</p>' +
      pasos(['En «Mi tesis» o en cada etapa, pulse <b>Humanizar</b> junto al campo (o el botón de la tarjeta «Humaniza tu tesis»).', 'Lea el texto de referencia; si quiere, ocúltelo para escribir de memoria.',
        'Escríbalo con sus palabras en la ventana. No se puede pegar: cada palabra cuenta.', 'Cuando los cuatro chequeos se ponen en verde (extensión suficiente, frases repetidas 25 % o menos, citas conservadas y escritura a mano), pulse <b>Verificar y guardar</b>. El servidor vuelve a comprobarlo.']) +
      '<h3>Niveles</h3><div class="fila" style="flex-wrap:wrap;gap:8px">' + ['semilla', 'brote', 'camino', 'casi', 'listo'].map(function (k) { return nivelHtml({ nivel: k, listos: 0, generados: 0, pct: 0 }); }).join('') + '</div>' +
      '<p class="pequeno tenue" style="margin-top:10px">Semilla: aún nada humanizado · Brote: algo · En camino: 40 % · Casi listo: 80 % · ¡Listo!: todo. Cada palabra escrita a mano suma 1 XP. La verificación mide cuánto cambió el texto respecto de su origen; no es un detector de IA y no anticipa el resultado de Turnitin.</p>';
  }],
  roles: ['Qué puede hacer cada perfil', function () {
    var si = '<span class="chip verde">' + IC.check + 'Sí</span>', no = '<span class="tenue">No</span>';
    var filas = [
      ['Escribir y editar su propia tesis', si, no, no, no, no],
      ['Ver el avance de sus estudiantes', '-', si, si, si, si],
      ['Ver a todos los estudiantes y el tablero', no, no, si, si, si],
      ['Aprobar o devolver etapas y secciones', no, si, si, no, no],
      ['Comentar a un estudiante', no, si, si, no, no],
      ['Crear estudiantes y asesores', no, no, si, no, si],
      ['Crear asistentes y coordinadores', no, no, si, no, no],
      ['Reiniciar claves', no, 'Sus estudiantes', si, no, 'Estudiantes y asesores'],
      ['Humanizar su texto (reescribir con sus palabras)', si, no, no, no, no],
      ['Ver el estado del sistema y la configuración', no, no, si, no, no]
    ];
    return '<div class="desliza"><table class="tabla" style="min-width:720px"><thead><tr><th>Acción</th><th>Estudiante</th><th>Asesor</th><th>Administrador</th><th>Coordinador</th><th>Asistente</th></tr></thead><tbody>' +
      filas.map(function (f) { return '<tr><td>' + f[0] + '</td>' + f.slice(1).map(function (c) { return '<td class="pequeno">' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }],
  ia: ['Cómo activar la inteligencia artificial', function () {
    var adm = S.perfil && S.perfil.rol === 'admin';
    return '<p>El asistente puede funcionar de cuatro maneras. La coordinación decide cuáles están habilitadas (en la hoja de datos, pestaña Config, clave <span class="mono">MODOS_IA</span>); el estudiante elige la suya con el botón del asistente.</p>' +
      '<h3>1. Clave propia de Gemini (recomendada, gratuita)</h3>' + pasos(['Entre a <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> con su cuenta de Google y acepte las condiciones.',
        'Pulse <b>Crear clave de API</b> (Create API key) y cópiela.', 'En la aplicación, abra el asistente, elija <b>Mi propia clave de Gemini</b>, pegue la clave y pulse <b>Probar y guardar</b>.']) +
      '<div class="aviso verde">La clave se guarda <b>solo en su navegador</b>: nunca se almacena en el servidor ni la ve la coordinación. No la comparta. Si usa una computadora pública, pulse «Olvidar mi clave» al terminar. La capa gratuita de Google tiene límites de uso por minuto y por día.</div>' +
      '<h3>2. Asistente del curso</h3><p>Usa una sola clave de Gemini para todo el curso, con una cuota diaria por estudiante (<span class="mono">CUOTA_DIARIA</span>). La configura el propietario del proyecto:</p>' +
      pasos(['Cree una clave en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (de preferencia con una cuenta institucional).', 'Abra el proyecto en <a href="https://script.google.com" target="_blank" rel="noopener">script.google.com</a> y vaya a <b>Configuración del proyecto</b> (el engranaje).',
        'En <b>Propiedades del script</b>, pulse <b>Agregar propiedad</b>: nombre <span class="mono">GEMINI_API_KEY</span>, valor la clave. Guarde.', 'Opcional: agregue <span class="mono">OPENALEX_API_KEY</span> para búsquedas bibliográficas con más cupo.', 'Recargue la aplicación: en Administración, Sistema mostrará «Clave configurada».']) +
      (adm ? '' : '<p class="pequeno tenue">Este paso solo lo puede hacer el administrador del proyecto.</p>') +
      '<h3>3. Gemini Nano en Chrome (sin clave, en su computadora)</h3><p>El modelo viene dentro de Chrome y responde sin enviar su texto a internet. Sirve para ayudas cortas; para revisar una etapa completa conviene la clave propia.</p>' +
      pasos(['Use Chrome de escritorio actualizado (Windows, macOS o Linux) con unos 22 GB libres en disco y 16 GB de RAM o una tarjeta gráfica de más de 4 GB.', 'Elija <b>Gemini Nano</b> en el asistente: la primera vez Chrome descarga el modelo y puede tardar varios minutos.',
        'Si no aparece disponible, escriba <span class="mono">chrome://flags</span> en la barra de direcciones, active <b>Prompt API for Gemini Nano</b> y <b>Enables optimization guide on device</b>, y reinicie Chrome (los nombres pueden variar según la versión).',
        'Puede comprobar la descarga en <span class="mono">chrome://components</span> («Optimization Guide On Device Model»).']) +
      '<p class="pequeno tenue">Si el navegador no permite usarlo dentro de la aplicación, la coordinación puede publicar la página auxiliar <span class="mono">asistente_local.html</span> y poner su dirección en <span class="mono">NANO_URL</span>.</p>' +
      '<h3>4. Copiar y pegar con cualquier asistente</h3>' + pasos(['Elija <b>Copiar y pegar</b> en el asistente y pulse <b>Copiar la consulta</b>.', 'Péguela en el asistente que prefiera (Gemini, ChatGPT, Claude, Copilot…).', 'Copie la respuesta completa y péguela de vuelta en la aplicación: se valida antes de usarla.']) +
      '<p class="pequeno tenue">Lo que llega por copiar y pegar se marca como «sin verificar»: la aplicación comprueba su formato, pero no su origen.</p>';
  }],
  problemas: ['Preguntas frecuentes', function () {
    return '<div class="pila" style="gap:10px">' + [
      ['«Tu sesión terminó»', 'Las sesiones duran seis horas. Vuelva a ingresar: lo escrito ya está guardado.'],
      ['No veo a un estudiante', 'Pida a la coordinación o al asistente que revise en Usuarios que esté activo y con el asesor correcto.'],
      ['El asistente no responde', 'Revise que su clave de Gemini siga vigente (Probar y guardar), que no haya superado la cuota diaria, o cambie de modo (copiar y pegar siempre funciona).'],
      ['La referencia no se verifica', 'Revise el DOI. Si la obra no tiene DOI, agréguela a mano con su URL: quedará marcada como no verificada.'],
      ['El Word no tiene índice', 'En Word, inserte la tabla de contenido desde Referencias: los títulos ya tienen estilo de encabezado.']
    ].map(function (x) { return '<div class="comentario"><div class="meta"><b>' + x[0] + '</b></div>' + x[1] + '</div>'; }).join('') + '</div>';
  }]
};

function seccionesGuia() {
  var r = S.perfil ? S.perfil.rol : '';
  if (r === 'estudiante') return ['novedades', 'inicio', 'estudiante', 'humanizar', 'ia', 'problemas'];
  if (r === 'asesor') return ['novedades', 'inicio', 'asesor', 'humanizar', 'ia', 'roles', 'problemas'];
  if (r === 'asistente') return ['novedades', 'inicio', 'asistente', 'coordinador', 'humanizar', 'roles', 'ia', 'asesor', 'estudiante', 'problemas'];
  return ['novedades', 'inicio', 'coordinador', 'humanizar', 'asistente', 'roles', 'ia', 'asesor', 'estudiante', 'problemas'];
}
function vistaGuia() {
  var l = seccionesGuia();
  var h = '<div class="cabecera"><h1>Guía de uso</h1><p>Cómo usar «' + esc(S.info.app) + '» según su perfil y cómo activar el asistente de inteligencia artificial.</p></div>';
  h += '<div class="g-cuerpo"><nav class="g-indice tarjeta plana" aria-label="Contenido de la guía"><b class="pequeno tenue">Contenido</b>' + l.map(function (id) { return '<button class="enlace" data-a="ir" data-v="guia" data-p="' + id + '">' + GUIA[id][0] + '</button>'; }).join('') + '</nav><div class="pila">';
  l.forEach(function (id) { h += gSeccion(id, GUIA[id][0], GUIA[id][1]()); });
  return h + '</div></div>';
}

/**
 * Semilla.gs - Configuracion inicial de la aplicacion.
 * Todo lo que esta aqui se copia a la hoja de calculo al ejecutar instalar().
 * Despues de instalar, los cambios se hacen en la hoja, no en este archivo.
 */

var SEMILLA_CONFIG = [
  ['APP_NOMBRE', '¡Quiero ser Ingeniero!', 'Nombre que se muestra en la aplicación'],
  ['UNIVERSIDAD', 'Universidad Nacional de Cañete', 'Nombre de la universidad (carátula)'],
  ['FACULTAD', 'Facultad de Ingeniería', 'Nombre de la facultad (carátula)'],
  ['ESCUELA', 'Escuela Profesional de Ingeniería de Sistemas', 'Nombre de la escuela (carátula)'],
  ['NIVEL', 'Pregrado', 'Nivel de los estudiantes'],
  ['CARATULA_TIPO_DOCUMENTO', 'PROYECTO DE TESIS', 'Rótulo del documento en la carátula'],
  ['CIUDAD', 'San Vicente de Cañete', 'Ciudad que cierra la carátula'],
  ['CARATULA_PIE', '{ciudad}, {anio}, Perú', 'Última línea de la carátula. {ciudad} se reemplaza por CIUDAD y {anio} por el año en curso'],
  ['LINEAS', 'Ciencia de Datos e Inteligencia Artificial;Otra (precisarla en el tema)', 'Líneas de investigación de la escuela, separadas por punto y coma'],
  ['ESTILO_CITAS', 'APA 7', 'Obsoleto desde la 1.5: el estilo se elige con CITAS_DEFECTO y cada estudiante puede cambiarlo'],
  ['CITAS_DEFECTO', 'IEEE', 'Estilo de citas con el que empieza cada estudiante: IEEE, APA 7, Vancouver o Chicago. Cada uno puede cambiarlo en su configuración. Las tablas y figuras siguen APA 7'],
  ['INFORME_TIPO_DOCUMENTO', 'TESIS PARA OPTAR EL TÍTULO PROFESIONAL DE INGENIERO DE SISTEMAS', 'Texto de la carátula del borrador de tesis (informe final), según el Anexo 5 del Reglamento de Grados y Títulos'],
  ['SOLO_LECTURA', 'NO', 'SI: solo se puede consultar y descargar el expediente; nada se modifica. Se usa en la versión 1 cuando la aplicación pasa al servidor propio (versión 2)'],
  ['NUEVA_DIRECCION', '', 'Dirección de la versión 2 (por ejemplo https://tesis.midominio.pe). Con SOLO_LECTURA = SI se muestra a quien ingrese'],
  ['PERMITIR_INSERTAR', 'SI', 'SI: la aplicación se puede insertar en Google Sites u otra página (así no aparece la franja de Apps Script). NO: solo se abre en su propia dirección'],
  ['INICIO_ESTUDIANTE', 'clase', 'Primera pantalla del estudiante. clase: el avance de su clase y los tres primeros en cada cosa. modo: directo a «Mi tesis» o a «Mi ruta»'],
  ['MODELO_COMPUERTAS', 'gemini-3.8-flash', 'Modelo de Gemini para revisiones, propuestas, jurado y rúbrica'],
  ['MODELO_LIGERO', 'gemini-3.1-flash-lite', 'Modelo de Gemini para ayudas cortas, preguntas y resúmenes'],
  ['MAX_TOKENS_IA', '16384', 'Máximo de tokens de salida por consulta a Gemini (incluye el razonamiento del modelo)'],
  ['NIVEL_RAZONAMIENTO', 'low', 'Nivel de razonamiento del modelo de revisión: minimal, low, medium o high. Más alto = mejor revisión pero más lento (Apps Script corta las consultas a los 60 segundos). Vacío = el del modelo'],
  ['TEMPERATURA_IA', '', 'Temperatura de Gemini. Vacío = valor por defecto del modelo (recomendado)'],
  ['CUOTA_DIARIA', '40', 'Consultas por estudiante y por día con la clave del curso (las hechas con clave propia o copiando y pegando no cuentan)'],
  ['VERSION_DATOS', '1.3', 'Versión de las definiciones de la hoja (etapas, campos, indicaciones, plantilla y rúbrica). La escribe instalar(): no la cambies'],
  ['MODOS_IA', 'propia,nano,copiar,curso', 'Formas de usar el asistente que el estudiante puede elegir. propia: la clave gratuita de cada estudiante (BYOK, se guarda solo en su navegador). nano: Gemini Nano, el modelo local de Chrome, si el equipo lo admite. copiar: copiar la consulta y pegar la respuesta de cualquier asistente. curso: la clave de Gemini del curso, solo si se configuró GEMINI_API_KEY'],
  ['MODO_IA_POR_DEFECTO', 'propia', 'Modo con el que empieza un estudiante que aún no eligió (propia, nano, copiar o curso). Mientras no pegue su clave propia, se le ofrece copiar y pegar'],
  ['NANO_URL', '', 'Opcional. Dirección donde publicó la página auxiliar asistente_local.html (GitHub Pages o Netlify), para usar Gemini Nano cuando el navegador no lo permite dentro de la aplicación. Vacío = solo se intenta dentro de la aplicación'],
  ['REVISION_VERDE', 'estudiante', 'Quién pone en verde una sección del borrador: estudiante (el estudiante la marca como revisada y el asesor puede devolverla) o asesor (solo el asesor)'],
  ['REVISION_SIN_IA', 'reglas', 'Qué pasa al cerrar una etapa sin revisión verificada de la IA (modo copiar o curso sin clave). reglas: basta con las reglas automáticas. asesor: toda etapa así cerrada pasa al asesor'],
  ['BRUJULA_URL', 'https://script.google.com/macros/s/AKfycbw3J2naXDer7RbekQ8Ao1RqtURx2rSLsIWvJouFaHTO9SJtmGIJ99Zgu8FQl7AFQ_-1/exec', 'Dirección de la Brújula de Tesis, para quien aún no sabe por dónde empezar (vacío = no mostrar)'],
  ['TALLER_URL', 'https://claude.ai/artifact/AUKo1MCghnTdo4sbLYMjX2', 'Dirección de la guía del Taller de Titulación por Tesis (vacío = no mostrar)'],
  ['MIN_ARTICULOS', '5', 'Mínimo de artículos científicos como antecedentes (rúbrica, ítem 12)'],
  ['MIN_TESIS', '5', 'Mínimo de tesis como antecedentes (rúbrica, ítem 13)'],
  ['ANTIGUEDAD_MAX', '5', 'Antigüedad máxima recomendada de los antecedentes, en años'],
  ['PERMITIR_REGISTRO', 'SI', 'SI: los estudiantes se registran con la clave del curso. NO: solo el administrador crea usuarios'],
  ['CLAVE_REGISTRO', '', 'Clave del curso que el profesor entrega a sus estudiantes (se genera al instalar)'],
  ['ASESOR_POR_DEFECTO', '', 'Correo del asesor que se asigna a los estudiantes que se registran solos'],
  ['MODO_INICIAL', 'sencillo', 'Cómo empieza el estudiante. sencillo: escribe lo esencial desde el título y ve su documento en vivo. completo: entra a la ruta de siete etapas'],
  ['ETAPAS_EN_ORDEN', 'NO', 'NO: todas las etapas están abiertas y el estudiante profundiza donde quiera. SI: cada etapa se abre cuando se aprueba la anterior'],
  ['ESCUDO_INCLUIDO', 'SI', 'SI: si LOGO_ARCHIVO_ID está vacío, la carátula usa el escudo de la UNDC incluido en la aplicación. NO: sin escudo'],
  ['AVANZAR_EN_REVISION', 'SI', 'SI: el estudiante puede trabajar la etapa siguiente mientras el asesor revisa'],
  ['LOGO_ARCHIVO_ID', '', 'ID de un archivo de imagen en Drive con el escudo de la universidad. Vacío: se usa el escudo incluido (ver ESCUDO_INCLUIDO)'],
  ['COMPARTIR_PLAN', 'enlace', 'enlace: cualquiera con el enlace puede ver el plan. correo: solo el estudiante y su asesor'],
  ['CORREO_CONTACTO', '', 'Correo con el que la aplicación se identifica ante Crossref y OpenAlex'],
  ['FUENTE', 'Arial', 'Tipo de letra del plan de tesis'],
  ['PAPEL', 'carta', 'Tamaño del papel: carta o A4'],
  ['TAMANO_FUENTE', '12', 'Tamaño de letra del plan de tesis'],
  ['INTERLINEADO', '1.5', 'Interlineado del plan de tesis'],
  ['MARGEN_IZQ_CM', '2.54', 'Margen izquierdo en centímetros'],
  ['MARGEN_OTROS_CM', '2.54', 'Margen superior, inferior y derecho en centímetros'],
  ['CREDITO_AUTOR', 'Dr. José Alfredo Herrera Quispe', 'Autor de la aplicación, visible al pie de la pantalla de ingreso (vacío = no mostrar)'],
  ['CREDITO_ORCID', 'https://orcid.org/0000-0002-8207-9714', 'Enlace ORCID del autor'],
  ['CREDITO_LINKEDIN', 'https://www.linkedin.com/in/jose-herrera-b1a84787/', 'Enlace de LinkedIn del autor'],
  ['AVISO_INGRESO', 'Esta aplicación usa inteligencia artificial (Gemini) para orientarte. La IA propone y tú decides: revisa todo lo que aceptes. No subas datos personales de terceros ni información confidencial de una organización. Tu avance y el uso que hagas de la IA quedan registrados y tu asesor puede verlos.', 'Aviso que se muestra al ingresar']
];

/* id | nombre | producto | instruccion | requiere_asesor | contexto (campos de etapas anteriores que la IA necesita) */
var SEMILLA_ETAPAS = [
  ['0', 'Tema', 'Ficha de tema', 'Define de qué tratará tu tesis y qué tipo de proyecto es. Todo lo demás se construye sobre esta ficha. Si aún no sabes por dónde empezar, explora primero con la Brújula de Tesis.', 'NO', ''],
  ['1', 'Viabilidad', 'Semáforo de viabilidad', 'Antes de pensar en el título, comprueba que puedes conseguir los datos, el permiso, el tiempo y las habilidades que tu tema exige.', 'NO', 'tema,brujula_resultado'],
  ['2', 'Problema', 'Árbol de problemas y planteamiento', 'Primera pregunta de tu tesis: ¿cuál es el problema? Escríbelo como problema, no como solución: quién lo tiene y cómo se nota, qué se hace hoy y qué falla, y qué mejoraría. Luego arma el árbol y redacta el planteamiento de lo internacional a lo local.', 'SI', 'tema,datos_necesarios'],
  ['3', 'Estado del arte', 'Biblioteca, antecedentes y brecha', 'Segunda pregunta: ¿qué ya existe? Busca soluciones, no temas. Reúne al menos cinco artículos y cinco tesis, anota de cada uno qué consiguió y qué dejó sin resolver, y cierra con tu declaración de brecha. Puedes buscarlos con Consensus u otro buscador académico y traerlos aquí por su DOI.', 'NO', 'prob_quien,prob_hoy,prob_mejora,causas,efectos'],
  ['4', 'Propuesta', 'Matriz de consistencia', 'Tercera pregunta: ¿qué propones? De la brecha salen tu problema de investigación, tus objetivos, tus hipótesis y tus variables; si construyes algo, también tu problema de diseño y la afirmación que vas a sostener. Todo debe decir lo mismo: de eso se trata la matriz de consistencia.', 'SI', 'datos_necesarios,acceso_datos,prob_quien,prob_hoy,prob_mejora,causas,efectos,brechas'],
  ['5', 'Metodología', 'Marco metodológico', 'Cuarta pregunta: ¿con qué lo demuestras? Decide enfoque, método, diseño, población, instrumentos, análisis y ética. Si propones un artefacto, descríbelo y define contra qué línea base lo vas a comparar y con qué método lo validarás.', 'NO', 'datos_necesarios,acceso_datos,prob_hoy,brechas,problema_general,objetivos_especificos,hipotesis_general,operacionalizacion,requisitos_artefacto,problema_diseno,afirmacion'],
  ['6', 'Plan', 'Plan de tesis en Google Docs', 'Completa el cronograma, el presupuesto y los anexos. Cuando el asesor apruebe esta etapa, tu plan de tesis estará listo para presentarse.', 'SI', 'tiempo_meses,recursos,objetivos_especificos,tecnicas_instrumentos,artefacto_componentes,metodo_validacion,linea_base']
];

/*
 * Modo sencillo: lo esencial, en el orden del documento y empezando por el titulo. Cada fila es una pregunta
 * que llena un campo de la pestana Campos. El estudiante lo escribe y lo ve aparecer en su pagina.
 * orden | grupo | campo | pregunta | ayuda | aplica
 * campo "#biblioteca" no es un campo: es la tarjeta que lleva a la biblioteca.
 */
var SEMILLA_SENCILLO = [
  ['1', 'Carátula', 'titulo', '¿Cómo se llama tu tesis?', 'Escríbelo como te salga: qué harás, para qué y dónde. Después lo afinas.', 'todos'],
  ['2', 'Carátula', 'autor1', 'Tu nombre', 'Apellidos y nombres, como irán en la carátula.', 'todos'],
  ['3', 'Carátula', 'asesor_nombre', 'Tu asesor', 'Con su grado: Dr., Mg. o Ing. Si aún no tienes asesor, sigue y vuelve luego.', 'todos'],
  ['4', 'Carátula', 'linea', 'Línea de investigación', '', 'todos'],
  ['5', 'Tu idea en tres piezas', 'tipo_proyecto', '¿Tu tesis construye algo?', 'Un sistema, una aplicación, un modelo o un prototipo cuentan como construir.', 'todos'],
  ['6', 'Tu idea en tres piezas', 'var1', 'Lo que propones o estudias', 'En pocas palabras: «sistema web de trazabilidad», «redes neuronales convolucionales».', 'todos'],
  ['7', 'Tu idea en tres piezas', 'var2', 'Lo que quieres mejorar o explicar', 'En pocas palabras: «control de inventarios», «identificación de daño pulmonar».', 'todos'],
  ['8', 'Capítulo I · Planteamiento del problema', 'planteamiento', '¿Cuál es el problema?', 'Cuenta qué pasa hoy, a quién afecta y cómo se nota. Todavía no nombres tu solución.', 'todos'],
  ['9', 'Capítulo I · Planteamiento del problema', 'problema_general', 'Tu pregunta de investigación', 'Una sola pregunta con tus dos piezas y el lugar. Suele empezar con «¿En qué medida…?».', 'todos'],
  ['10', 'Capítulo I · Planteamiento del problema', 'objetivo_general', 'Tu objetivo general', 'Empieza con un verbo en infinitivo: determinar, desarrollar, evaluar.', 'todos'],
  ['11', 'Capítulo I · Planteamiento del problema', 'just_practica', '¿Por qué vale la pena?', 'Quién se beneficia y qué cambia si lo logras.', 'todos'],
  ['12', 'Capítulo II · Marco teórico y empírico', '#biblioteca', 'Tus antecedentes', 'Los estudios que ya trataron tu problema se guardan en la biblioteca y el documento los redacta solo.', 'todos'],
  ['13', 'Capítulo III · Hipótesis y variables', 'hipotesis_general', 'Tu hipótesis', 'Lo que esperas encontrar, en una oración afirmativa.', 'hipotesis'],
  ['14', 'Capítulo IV · Diseño metodológico', 'artefacto_descripcion', '¿Qué vas a construir?', 'Qué recibe, qué hace y qué entrega tu sistema, modelo o prototipo.', 'artefacto'],
  ['15', 'Capítulo IV · Diseño metodológico', 'linea_base', '¿Contra qué lo vas a comparar?', 'Lo que se hace hoy u otra solución que ya exista.', 'artefacto'],
  ['16', 'Capítulo IV · Diseño metodológico', 'diseno', '¿Cómo vas a demostrarlo?', 'Qué vas a medir y cómo: antes y después, con dos grupos o en un solo momento.', 'todos'],
  ['17', 'Capítulo IV · Diseño metodológico', 'poblacion', '¿Con qué datos o con quiénes?', 'Las personas, los registros o las imágenes con que trabajarás, y cuántos son si lo sabes.', 'todos']
];

/* etapa | clave | etiqueta | tipo | columnas | opciones | ayuda | obligatorio | aplica | rubrica | ia | min_filas */
var SEMILLA_CAMPOS = [
  // ---------------- Etapa 0: Tema
  ['0', 'brujula_resultado', 'Lo que te recomendó la Brújula de Tesis', 'parrafo', '', '', 'Si aún no tienes tema, abre la Brújula de Tesis con el botón de arriba, haz el recorrido y pega aquí las áreas, líneas y sublíneas que te recomendó. Si ya tienes tema, deja este campo vacío.', 'NO', 'todos', '', 'NO', ''],
  ['0', 'tema', 'Tema', 'parrafo', '', '', 'Cuenta en dos o tres oraciones qué quieres investigar y por qué te interesa.', 'SI', 'todos', '', 'NO', ''],
  ['0', 'linea', 'Línea de investigación', 'opcion', '', '@LINEAS', 'Elige la línea de la escuela en la que encaja tu tema.', 'SI', 'todos', '', 'NO', ''],
  ['0', 'contexto', 'Lugar, organización o población', 'parrafo', '', '', '¿Dónde ocurre el problema? Nombra la organización, el distrito o el grupo de personas.', 'SI', 'todos', '10', 'NO', ''],
  ['0', 'tipo_proyecto', 'Tipo de proyecto', 'opcion', '', 'explicativa=Explicativa: analiza la relación entre variables, sin construir un artefacto;artefacto=Con artefacto: propone un software, modelo, método o prototipo y lo evalúa', 'Si vas a construir algo (un sistema, un modelo, una app, un prototipo) y medir si mejora una situación, elige «Con artefacto»: es lo habitual en Ingeniería de Sistemas. No necesitas declarar tu tesis como «ciencia del diseño»: usarás variables, hipótesis y diseño como en cualquier tesis de la UNDC, y además dirás qué construyes, contra qué lo comparas y cómo lo validas.', 'SI', 'todos', '', 'NO', ''],
  ['0', 'con_hipotesis', '¿Tu tesis contrastará hipótesis?', 'opcion', '', 'SI=Sí, tendrá hipótesis general y específicas;NO=No (estudio descriptivo o de desarrollo sin contraste)', 'En pregrado de Ingeniería de Sistemas lo habitual es que sí. Si dudas, elige «Sí».', 'SI', 'todos', '', 'NO', ''],
  ['0', 'var1', 'Variable independiente o artefacto que propones', 'corto', '', '', 'Ejemplos: «sistema web de trazabilidad», «redes neuronales convolucionales», «gestión por procesos». Si tu proyecto es explicativo, es la variable que explica.', 'SI', 'todos', '1', 'NO', ''],
  ['0', 'var2', 'Variable dependiente: lo que quieres explicar o mejorar', 'corto', '', '', 'Ejemplos: «control de inventarios», «identificación de daño pulmonar», «satisfacción del usuario».', 'SI', 'todos', '1', 'NO', ''],
  ['0', 'tema_oracion', 'Tu tema en una sola oración', 'corto', '', '', 'Debe decir qué estudias, en quién o en qué, y dónde. Aún no es el título.', 'SI', 'todos', '1', 'SI', ''],
  ['0', 'autor1', 'Autor 1 (Apellidos, Nombres)', 'corto', '', '', 'Como debe aparecer en la carátula.', 'SI', 'todos', '', 'NO', ''],
  ['0', 'orcid1', 'ORCID del autor 1', 'corto', '', '', 'Ejemplo: 0000-0002-1825-0097. Créalo gratis en orcid.org.', 'NO', 'todos', '', 'NO', ''],
  ['0', 'autor2', 'Autor 2 (si la tesis es en pareja)', 'corto', '', '', 'Déjalo vacío si la tesis es individual.', 'NO', 'todos', '', 'NO', ''],
  ['0', 'orcid2', 'ORCID del autor 2', 'corto', '', '', '', 'NO', 'todos', '', 'NO', ''],
  ['0', 'asesor_nombre', 'Asesor (grado, nombres y apellidos)', 'corto', '', '', 'Ejemplo: Dra. Nombre Apellido Apellido.', 'SI', 'todos', '', 'NO', ''],
  ['0', 'asesor_orcid', 'ORCID del asesor', 'corto', '', '', '', 'NO', 'todos', '', 'NO', ''],
  ['0', 'coasesor_nombre', 'Coasesor (si lo hay)', 'corto', '', '', '', 'NO', 'todos', '', 'NO', ''],
  ['0', 'coasesor_orcid', 'ORCID del coasesor', 'corto', '', '', '', 'NO', 'todos', '', 'NO', ''],
  // ---------------- Etapa 1: Viabilidad
  ['1', 'datos_necesarios', '¿Qué datos necesitas y de dónde saldrán?', 'parrafo', '', '', 'Sé concreto: registros de ventas de 2025 de la empresa X, encuestas a 80 usuarios, 1 000 imágenes de un repositorio público, etc.', 'SI', 'todos', '', 'NO', ''],
  ['1', 'acceso_datos', '¿Ya tienes acceso a esos datos?', 'opcion', '', 'tengo=Ya los tengo;permiso=Tengo permiso por escrito;tramite=El permiso está en trámite;publicos=Son datos públicos;nose=Aún no sé cómo conseguirlos', 'Si el título promete datos de una organización, necesitas su autorización. Si no puedes conseguirla, es mejor cambiar el alcance ahora.', 'SI', 'todos', '', 'NO', ''],
  ['1', 'fuente_datos', 'Fuente y persona que autoriza', 'parrafo', '', '', 'Nombre de la organización o del repositorio, enlace si es público, y quién firma la autorización.', 'SI', 'todos', '', 'NO', ''],
  ['1', 'unidad_analisis', 'Unidad de análisis', 'corto', '', '', '¿Qué o quién será medido? Personas, pedidos, expedientes, imágenes, procesos…', 'SI', 'todos', '10', 'NO', ''],
  ['1', 'tiempo_meses', 'Meses disponibles hasta la sustentación', 'corto', '', '', 'Escribe solo el número.', 'SI', 'todos', '', 'NO', ''],
  ['1', 'habilidades', 'Herramientas que dominas y las que tendrás que aprender', 'parrafo', '', '', 'Lenguajes, marcos de trabajo, estadística, modelado… Sé honesto: sirve para planificar.', 'SI', 'todos', '', 'NO', ''],
  ['1', 'recursos', 'Equipo, software y dinero con que cuentas', 'parrafo', '', '', '', 'NO', 'todos', '', 'NO', ''],
  ['1', 'riesgo', 'Principal riesgo y qué harías si ocurre', 'parrafo', '', '', '¿Qué podría impedir que termines? Por ejemplo, que la empresa retire el permiso.', 'SI', 'todos', '', 'NO', ''],
  // ---------------- Etapa 2: Problema
  ['2', 'prob_quien', '¿Quién tiene el problema y cómo se nota?', 'parrafo', '', '', 'Una institución, un área o una población con nombre, y la señal visible del problema: cuánto demora, cuánto cuesta, cuántos errores. Si hoy no se puede medir, después tampoco se podrá decir si mejoró.', 'SI', 'todos', '3', 'NO', ''],
  ['2', 'prob_hoy', '¿Qué se hace hoy y qué falla en eso?', 'parrafo', '', '', 'Describe el procedimiento actual y, si lo tienes, su resultado medido. Será tu línea base: contra esto se comparará lo que propongas.', 'SI', 'todos', '3', 'NO', ''],
  ['2', 'prob_mejora', '¿Qué mejoraría si se resolviera?', 'parrafo', '', '', 'Qué decisión o qué costo cambia, y para quién. Aquí todavía no se nombra la solución ni una tecnología.', 'SI', 'todos', '3', 'NO', ''],
  ['2', 'problema_central', 'Problema central', 'parrafo', '', '', 'Un estado negativo que existe hoy y afecta a alguien. No lo escribas como «falta de un sistema», no lo empieces con «implementación de» o «desarrollo de» y no nombres una tecnología: eso es una solución disfrazada.', 'SI', 'todos', '3', 'NO', ''],
  ['2', 'causas', 'Causas del problema', 'tabla', 'causa=Causa|evidencia=Evidencia (dato, observación o fuente)', '', 'Mínimo tres. Cada causa necesita una evidencia: un dato de la organización, una observación tuya o una fuente de tu biblioteca.', 'SI', 'todos', '3', 'NO', '3'],
  ['2', 'efectos', 'Efectos del problema', 'tabla', 'efecto=Efecto|evidencia=Evidencia (dato, observación o fuente)', '', 'Qué consecuencias tiene el problema para las personas o la organización. Mínimo dos.', 'SI', 'todos', '3', 'NO', '2'],
  ['2', 'efecto_final', 'Efecto final', 'corto', '', '', 'La consecuencia más grave si nada cambia.', 'NO', 'todos', '', 'NO', ''],
  ['2', 'contexto_internacional', 'El problema en el mundo (apuntes con fuente)', 'parrafo', '', '', 'Dos o tres datos de estudios internacionales. Usa el botón «Citar» para insertar fuentes de tu biblioteca.', 'SI', 'todos', '4', 'NO', ''],
  ['2', 'contexto_nacional', 'El problema en el Perú (apuntes con fuente)', 'parrafo', '', '', 'Datos de fuentes nacionales: INEI, ministerios, estudios peruanos.', 'SI', 'todos', '4', 'NO', ''],
  ['2', 'contexto_local', 'El problema en tu localidad u organización (apuntes con fuente)', 'parrafo', '', '', 'Datos de Cañete o de la organización: registros, reportes, entrevistas.', 'SI', 'todos', '4', 'NO', ''],
  ['2', 'planteamiento', 'Planteamiento del problema (redacción final)', 'parrafo', '', '', 'Va de lo internacional a lo local y termina en el problema central. Pide una propuesta al asistente cuando tengas el árbol y los tres apuntes; luego corrígela con tus palabras.', 'SI', 'todos', '3,4', 'SI', ''],
  // ---------------- Etapa 3: Estado del arte
  ['3', 'var1_definicion', 'Variable 1 ({var1}): definición', 'parrafo', '', '', 'Qué es la variable según los autores de tu biblioteca, y cómo la entiendes en tu tesis.', 'SI', 'todos', '14', 'SI', ''],
  ['3', 'var1_dimensiones', 'Variable 1 ({var1}): dimensiones', 'parrafo', '', '', 'Las partes en que se descompone la variable. Deben coincidir con tu operacionalización.', 'SI', 'todos', '14,20', 'SI', ''],
  ['3', 'var1_indicadores', 'Variable 1 ({var1}): indicadores', 'parrafo', '', '', 'Cómo se mide cada dimensión. Deben coincidir con tu operacionalización.', 'SI', 'todos', '14,21', 'SI', ''],
  ['3', 'var1_teorias', 'Variable 1 ({var1}): teorías', 'parrafo', '', '', 'Las teorías o modelos que sustentan la variable, con citas.', 'SI', 'todos', '14,15', 'SI', ''],
  ['3', 'var2_definicion', 'Variable 2 ({var2}): definición', 'parrafo', '', '', 'Qué es la variable según los autores de tu biblioteca, y cómo la entiendes en tu tesis.', 'SI', 'todos', '14', 'SI', ''],
  ['3', 'var2_dimensiones', 'Variable 2 ({var2}): dimensiones', 'parrafo', '', '', 'Las partes en que se descompone la variable. De ellas salen tus problemas, objetivos e hipótesis específicos.', 'SI', 'todos', '14,20', 'SI', ''],
  ['3', 'var2_indicadores', 'Variable 2 ({var2}): indicadores', 'parrafo', '', '', 'Cómo se mide cada dimensión. Deben coincidir con tu operacionalización.', 'SI', 'todos', '14,21', 'SI', ''],
  ['3', 'var2_teorias', 'Variable 2 ({var2}): teorías', 'parrafo', '', '', 'Las teorías o modelos que sustentan la variable, con citas.', 'SI', 'todos', '14,15', 'SI', ''],
  ['3', 'terminos', 'Definición de términos básicos', 'tabla', 'termino=Término|definicion=Definición', '', 'Mínimo cinco términos que salgan de tus bases teóricas. Definiciones breves y precisas.', 'SI', 'todos', '16', 'SI', '5'],
  ['3', 'brechas', 'Brechas: qué no resuelven los antecedentes', 'tabla', 'brecha=Brecha|estudios=Estudios que la muestran|respuesta=Cómo la atiende tu tesis', '', 'Mínimo dos. Salen de lo que tus antecedentes dejan sin resolver: si varios dejan lo mismo, esa es tu brecha. Es el puente entre el estado del arte y tu propuesta.', 'SI', 'todos', '11', 'SI', '2'],
  ['3', 'declaracion_brecha', 'Declaración de brecha (una sola frase)', 'corto', '', '', 'Con esta forma: «Lo que existe consigue X, pero no resuelve Y en el contexto Z». Es la bisagra de la tesis y la primera línea de tu justificación.', 'SI', 'todos', '11', 'SI', ''],
  // ---------------- Etapa 4: Propuesta
  ['4', 'problema_diseno', 'Problema de diseño: lo que vas a construir', 'parrafo', '', '', 'Con esta forma: «Diseñar <artefacto> que consiga <objetivo medible> para <quién tiene el problema> en <contexto>, de modo que <criterio de éxito>».', 'SI', 'artefacto', '25', 'SI', ''],
  ['4', 'afirmacion', 'Afirmación que vas a sostener', 'corto', '', '', 'En una frase: «Mi artefacto consigue X, mejor que Y, medido en Z». La «Y» tiene que ser algo externo: el procedimiento actual, otra técnica publicada o una línea base reconocida. Si no puedes escribirla, todavía no hay proyecto.', 'SI', 'artefacto', '26', 'SI', ''],
  ['4', 'titulo', 'Título', 'corto', '', '', 'Máximo 20 palabras. Debe contener las variables (o el artefacto), el objeto de estudio y el ámbito.', 'SI', 'todos', '1,2', 'SI', ''],
  ['4', 'problema_general', 'Problema general', 'corto', '', '', 'Una pregunta que incluya las variables, la unidad de análisis y el ámbito. Si propones un artefacto, es tu pregunta de conocimiento: «¿En qué medida <el artefacto> mejora <la métrica> frente a <la línea base> en <el contexto>?».', 'SI', 'todos', '5', 'SI', ''],
  ['4', 'problemas_especificos', 'Problemas específicos', 'tabla', 'texto=Problema específico', '', 'Se derivan del problema general: uno por cada dimensión o indicador que medirás. Mínimo dos.', 'SI', 'todos', '6,7', 'SI', '2'],
  ['4', 'objetivo_general', 'Objetivo general', 'corto', '', '', 'Empieza con un verbo en infinitivo (determinar, evaluar, desarrollar…) y responde al problema general.', 'SI', 'todos', '8', 'SI', ''],
  ['4', 'objetivos_especificos', 'Objetivos específicos', 'tabla', 'texto=Objetivo específico', '', 'Uno por cada problema específico, en el mismo orden.', 'SI', 'todos', '8', 'SI', '2'],
  ['4', 'hipotesis_general', 'Hipótesis general', 'corto', '', '', 'Respuesta tentativa al problema general, con las mismas variables, unidad de análisis y ámbito.', 'SI', 'hipotesis', '17,18', 'SI', ''],
  ['4', 'hipotesis_especificas', 'Hipótesis específicas', 'tabla', 'texto=Hipótesis específica', '', 'Una por cada problema específico, en el mismo orden.', 'SI', 'hipotesis', '17,18', 'SI', '2'],
  ['4', 'just_teorica', 'Justificación teórica (científica)', 'parrafo', '', '', '¿Qué conocimiento aporta o qué teoría pone a prueba?', 'SI', 'todos', '9', 'SI', ''],
  ['4', 'just_practica', 'Justificación práctica', 'parrafo', '', '', '¿Qué problema concreto ayuda a resolver y a quién beneficia?', 'SI', 'todos', '9', 'SI', ''],
  ['4', 'just_metodologica', 'Justificación metodológica', 'parrafo', '', '', '¿Qué método, instrumento o procedimiento propone o valida que otros puedan reutilizar?', 'SI', 'todos', '9', 'SI', ''],
  ['4', 'just_social', 'Justificación social', 'parrafo', '', '', '¿Cómo beneficia a la comunidad?', 'SI', 'todos', '9', 'SI', ''],
  ['4', 'delim_espacial', 'Delimitación espacial', 'corto', '', '', 'Lugar donde se realiza el estudio.', 'SI', 'todos', '10', 'NO', ''],
  ['4', 'delim_temporal', 'Delimitación temporal', 'corto', '', '', 'Periodo en que se recogen los datos y se desarrolla la tesis.', 'SI', 'todos', '10', 'NO', ''],
  ['4', 'delim_conceptual', 'Delimitación teórica', 'parrafo', '', '', 'Qué teorías, variables y conceptos abarca el estudio y cuáles deja fuera.', 'SI', 'todos', '10', 'SI', ''],
  ['4', 'defconc_v1', 'Definición conceptual de: {var1}', 'parrafo', '', '', 'Una definición con autor y año, tomada de tus bases teóricas.', 'SI', 'todos', '19', 'SI', ''],
  ['4', 'defconc_v2', 'Definición conceptual de: {var2}', 'parrafo', '', '', 'Una definición con autor y año, tomada de tus bases teóricas.', 'SI', 'todos', '19', 'SI', ''],
  ['4', 'operacionalizacion', 'Operacionalización de las variables', 'tabla', 'variable=Variable|dimension=Dimensión|indicador=Indicador|escala=Escala de medición|instrumento=Instrumento', '', 'Desagrega cada variable en dimensiones e indicadores medibles. Indica la escala (nominal, ordinal, intervalo, razón) y el instrumento.', 'SI', 'todos', '20,21', 'SI', '2'],
  ['4', 'requisitos_artefacto', 'Requisitos del artefacto y cómo se evaluarán', 'tabla', 'requisito=Requisito|criterio=Criterio de evaluación|metrica=Métrica', '', 'Qué debe cumplir tu artefacto para resolver el problema. Criterios: funcionalidad, utilidad, eficiencia, usabilidad, calidad. Cada uno con su métrica.', 'SI', 'artefacto', '20,26', 'SI', '3'],
  // ---------------- Etapa 5: Metodologia
  ['5', 'enfoque', 'Enfoque', 'opcion', '', 'Cuantitativo=Cuantitativo;Cualitativo=Cualitativo;Mixto=Mixto;Ciencia del diseño=Ciencia del diseño (declarada)', 'Si medirás con números y contrastarás hipótesis, es cuantitativo. Declarar «ciencia del diseño» es opcional aunque propongas un artefacto.', 'SI', 'todos', '22', 'NO', ''],
  ['5', 'tipo_inv', 'Tipo de investigación', 'opcion', '', 'Aplicada=Aplicada;Básica=Básica', 'En ingeniería casi siempre es aplicada.', 'SI', 'todos', '22', 'NO', ''],
  ['5', 'nivel_inv', 'Nivel o alcance', 'opcion', '', 'Exploratorio=Exploratorio;Descriptivo=Descriptivo;Correlacional=Correlacional;Explicativo=Explicativo', 'Explicativo si buscas el efecto de una variable sobre otra.', 'SI', 'todos', '22', 'NO', ''],
  ['5', 'enfoque_fund', 'Fundamentación del enfoque, el tipo y el nivel', 'parrafo', '', '', 'Explica por qué corresponden a tu estudio, con un autor de metodología de tu biblioteca, de preferencia del área de computación.', 'SI', 'todos', '22', 'SI', ''],
  ['5', 'metodo', 'Método de investigación', 'parrafo', '', '', 'El método general y, si propones un artefacto, el proceso de construcción (Scrum, RUP, CRISP-DM, Kimball, Mobile-D u otro) y por qué. Ese proceso organiza la construcción, no demuestra nada: la evidencia sale de la validación. Mira «Orientación» si dudas.', 'SI', 'todos', '23', 'SI', ''],
  ['5', 'diseno', 'Diseño de investigación', 'parrafo', '', '', 'Experimental (preexperimental, cuasiexperimental) o no experimental (transversal, longitudinal). Fundaméntalo.', 'SI', 'todos', '24', 'SI', ''],
  ['5', 'diseno_esquema', 'Esquema del diseño', 'corto', '', '', 'Ejemplo: G: O1 X O2 (un grupo con medición antes y después).', 'SI', 'todos', '24', 'NO', ''],
  ['5', 'artefacto_descripcion', 'Descripción del artefacto', 'parrafo', '', '', 'Qué es, qué hace, cómo se construirá (proceso) y cómo responde al problema y a los objetivos.', 'SI', 'artefacto', '25', 'SI', ''],
  ['5', 'artefacto_componentes', 'Componentes y tecnologías del artefacto', 'tabla', 'componente=Componente|funcion=Función|tecnologia=Tecnología', '', 'Módulos o capas de la arquitectura, qué hace cada uno y con qué tecnología. Mínimo dos.', 'SI', 'artefacto', '25', 'SI', '2'],
  ['5', 'metodo_validacion', 'Método de validación del artefacto', 'opcion', '', 'Opinión de expertos=Opinión de expertos: especialistas juzgan si el diseño serviría en su contexto;Caso único o experimento de mecanismo=Caso único o experimento de mecanismo: el artefacto se prueba en un caso o escenario controlado;Investigación-acción técnica=Investigación-acción técnica: el artefacto se usa para ayudar a un cliente real;Experimento estadístico de diferencia=Experimento estadístico de diferencia: se compara, en una muestra, el resultado con el artefacto y con la línea base', 'Se elige por la afirmación que quieres sostener, no por costumbre. En pregrado se espera un artefacto con evidencia propia y al menos un punto de comparación.', 'SI', 'artefacto', '26', 'NO', ''],
  ['5', 'linea_base', 'Línea base: contra qué se compara', 'parrafo', '', '', 'El procedimiento actual, otra técnica publicada o una línea base reconocida, con su valor medido si existe. Compararte con una versión anterior de tu propio artefacto no cuenta.', 'SI', 'artefacto', '26', 'SI', ''],
  ['5', 'artefacto_evaluacion', 'Plan de validación: qué se mide, con qué, sobre qué casos y dónde', 'parrafo', '', '', 'Qué vas a medir, con qué instrumento, sobre qué casos o datos y en qué escenario. Los criterios y las métricas ya están en tu tabla de requisitos.', 'SI', 'artefacto', '26', 'SI', ''],
  ['5', 'refutacion', '¿Qué resultado refutaría tu afirmación?', 'corto', '', '', 'Por ejemplo: «si la exactitud no supera a la del método actual en el conjunto de prueba». Es lo que separa un plan de validación de una lista de deseos.', 'SI', 'artefacto', '26', 'NO', ''],
  ['5', 'limites', 'Límites y supuestos', 'parrafo', '', '', 'Escríbelos antes de medir: en qué contexto no aplicaría el resultado, qué supuestos haces y qué queda fuera del alcance.', 'SI', 'artefacto', '26', 'SI', ''],
  ['5', 'lugar_estudio', 'Lugar de estudio', 'parrafo', '', '', 'Dónde se realiza el estudio: organización, área, distrito, y dónde se recogen los datos o se prueba el artefacto.', 'SI', 'todos', '10,27', 'SI', ''],
  ['5', 'poblacion', 'Población', 'parrafo', '', '', 'Conjunto total de unidades de análisis, con su tamaño si se conoce.', 'SI', 'todos', '27', 'SI', ''],
  ['5', 'muestra', 'Muestra', 'parrafo', '', '', 'Cuántas unidades estudiarás y cómo se calculó el tamaño.', 'SI', 'todos', '27', 'SI', ''],
  ['5', 'muestreo', 'Muestreo', 'parrafo', '', '', 'Probabilístico o no probabilístico, y el procedimiento.', 'SI', 'todos', '27', 'SI', ''],
  ['5', 'tecnicas_instrumentos', 'Técnicas e instrumentos de recolección de datos', 'tabla', 'tecnica=Técnica|instrumento=Instrumento|mide=Qué indicador mide', '', 'Ejemplos: observación con ficha de registro; encuesta con cuestionario.', 'SI', 'todos', '28', 'SI', '1'],
  ['5', 'procedimiento', 'Procedimiento de recolección, validez y confiabilidad', 'parrafo', '', '', 'Pasos para recoger los datos, cómo validarás los instrumentos (juicio de expertos) y cómo medirás la confiabilidad.', 'SI', 'todos', '29', 'SI', ''],
  ['5', 'analisis', 'Técnicas de análisis de datos', 'parrafo', '', '', 'Estadística descriptiva, prueba de normalidad y prueba de hipótesis que usarás, y con qué software.', 'SI', 'todos', '30', 'SI', ''],
  ['5', 'etica', 'Consideraciones éticas', 'parrafo', '', '', 'Explica cómo cumplirás los principios de beneficencia, no maleficencia, autonomía y justicia, y la protección de datos personales.', 'SI', 'todos', '31', 'SI', ''],
  // ---------------- Etapa 6: Plan
  ['6', 'cronograma', 'Cronograma', 'tabla', 'actividad=Actividad|inicio=Mes de inicio#|fin=Mes de fin#', '', 'Mínimo seis actividades, hasta la presentación del informe final. Los meses se numeran desde el 1.', 'SI', 'todos', '32', 'SI', '6'],
  ['6', 'presupuesto', 'Presupuesto', 'tabla', 'rubro=Rubro:Personal;Bienes;Servicios|descripcion=Descripción|cantidad=Cantidad#|costo=Costo unitario (S/)#', '', 'Debe incluir personal, bienes y servicios.', 'SI', 'todos', '33', 'SI', '3'],
  ['6', 'financiamiento', 'Financiamiento', 'parrafo', '', '', 'Indica si es autofinanciado, si lo financia la UNDC mediante un fondo de apoyo a la investigación u otra entidad, y en qué porcentaje.', 'SI', 'todos', '34', 'NO', ''],
  ['6', 'instrumento_anexo', 'Instrumento de recolección de datos (contenido)', 'parrafo', '', '', 'Escribe los campos de tu ficha de registro o las preguntas de tu cuestionario. Irá en los anexos.', 'SI', 'todos', '36', 'SI', ''],
  ['6', 'esquema_artefacto', 'Esquema o prototipo preliminar del artefacto', 'parrafo', '', '', 'Describe las pantallas, la arquitectura o el flujo. En el documento quedará un espacio para que pegues la imagen.', 'SI', 'artefacto', '36', 'NO', '']
];

/* clave | texto */
var SEMILLA_PROMPTS = [
  ['reglas', 'Eres el asistente de tesis de la aplicación {app} de la {universidad}. Orientas a estudiantes de {nivel} de la {escuela} en la elaboración de su proyecto de tesis.\n\nREGLAS OBLIGATORIAS\n1. No inventes datos, cifras, resultados, instituciones ni referencias.\n2. Solo puedes citar estudios de la BIBLIOTECA DEL ESTUDIANTE, con su clave entre corchetes, por ejemplo [@perez2023]. Si falta sustento, escribe [por completar: lo que falta].\n3. Escribe en español formal, en tercera persona, con oraciones claras y sin adornos.\n4. Tu papel es orientar: el estudiante decide. No lo felicites ni lo regañes; sé concreto.\n5. Tipo de proyecto: {tipo_texto}\n6. Apunta siempre al nivel 4 (el más alto) de los criterios de la rúbrica de la UNDC que se te entregan.\n7. Trabaja sobre lo que el estudiante ya escribió y aprobó: respeta la columna vertebral del proyecto y lo decidido en las etapas anteriores, y usa siempre las mismas variables, la misma unidad de análisis y el mismo ámbito.\n8. La tesis es una cadena y cada eslabón se justifica con el anterior: problema de impacto, brecha en la literatura, propuesta (problema de investigación, objetivos, hipótesis), método y evidencia. Si un eslabón anterior está flojo, dilo en lugar de construir sobre él.\n9. Responde únicamente con JSON válido, con el formato exacto que pide la tarea. No agregues texto fuera del JSON.'],
  ['tipo_explicativa', 'explicativo. Analiza la relación entre variables que ya existen; no construye un artefacto. La evidencia sale de medir esas variables en la población o en los datos declarados.'],
  ['tipo_artefacto', 'con artefacto. El estudiante construirá un software, modelo, método o prototipo y evaluará si mejora la situación. La tesis NO necesita declararse como «ciencia del diseño»: usa la terminología habitual de la UNDC (variable independiente = el artefacto; variable dependiente = lo que mejora; hipótesis; diseño de investigación). Pero vigila la lógica de fondo, que es esta cadena: problema de impacto, brecha en la literatura, problema de diseño, artefacto, afirmación, pregunta de conocimiento, método de validación, línea base y límites. En concreto: el problema no es «la falta del artefacto» ni nombra una tecnología; los antecedentes son soluciones, no el dominio; los requisitos salen de las causas del problema; la afirmación compara el artefacto con algo externo (el procedimiento actual, otra técnica publicada o una línea base reconocida), nunca con una versión anterior del mismo artefacto; Scrum, RUP, CRISP-DM y similares son procesos de construcción, no la metodología de investigación ni la evidencia; y el método de validación se elige por la afirmación. En pregrado basta un artefacto con evidencia propia y al menos un punto de comparación.'],
  ['etapa_0', 'ETAPA 0, TEMA. El estudiante delimita su tema. Un buen tema dice qué se estudia, en quién o en qué y dónde, y es alcanzable por un estudiante de pregrado en pocos meses. Si el tema ya nombra una tecnología («con machine learning», «con blockchain»), adviértelo: la herramienta se elige después de entender el problema.'],
  ['etapa_1', 'ETAPA 1, VIABILIDAD. Se comprueba que el estudiante puede conseguir lo que su tema exige: datos, permisos, tiempo y habilidades. El error más grave es prometer datos de una organización o de una población a la que no se tendrá acceso. Si el acceso no está asegurado, propón reducir el alcance.'],
  ['etapa_2', 'ETAPA 2, PROBLEMA. Primera pregunta de la tesis: ¿cuál es el problema? Un problema tiene impacto si pasa cuatro filtros: alguien concreto lo sufre y se le puede poner nombre; se puede medir hoy, aunque se mida mal; resolverlo cambia una decisión o un costo; y no está ya resuelto y disponible. El problema central es un estado negativo existente: no es la ausencia de una solución, no empieza con «implementación de» o «desarrollo de» y no nombra una tecnología. Lo que se hace hoy es la futura línea base. Cada causa requiere evidencia. El planteamiento va del contexto internacional al nacional y al local, con fuentes actuales de la biblioteca en los tres niveles, y termina enunciando el problema central. Si el problema es puramente local, ayuda a nombrar la clase de problema a la que pertenece, con el caso local como el lugar donde se mide.'],
  ['etapa_3', 'ETAPA 3, ESTADO DEL ARTE. Segunda pregunta: ¿qué ya existe? Los antecedentes son soluciones al problema, no descripciones del dominio. Cada antecedente se resume con autor, año, objetivo, metodología, resultados y conclusión, se relaciona con las variables del estudio y dice qué dejó sin resolver. Las bases teóricas se organizan por variable, con sus dimensiones e indicadores. Las brechas son lo que los antecedentes no resuelven: si varios dejan lo mismo sin resolver, esa es la brecha; si ninguno coincide, el problema aún está mal delimitado. La declaración de brecha tiene la forma «lo que existe consigue X, pero no resuelve Y en el contexto Z».'],
  ['etapa_4', 'ETAPA 4, PROPUESTA. Tercera pregunta: ¿qué se propone? Todo sale de la brecha. Título de máximo 20 palabras con las variables, el objeto de estudio y el ámbito. El problema general es una pregunta con las variables, la unidad de análisis y el ámbito; si hay artefacto, es la pregunta de conocimiento: «¿en qué medida el artefacto mejora la métrica frente a la línea base en el contexto?». Los problemas específicos se derivan del general y expresan la relación entre la variable independiente y cada dimensión o indicador de la dependiente. Los objetivos empiezan con verbo en infinitivo y corresponden uno a uno con los problemas; las hipótesis, uno a uno con los objetivos, con las mismas variables. La operacionalización desagrega cada variable en dimensiones e indicadores medibles, con escala e instrumento. Si hay artefacto: el problema de diseño tiene la forma «diseñar <artefacto> que consiga <objetivo medible> para <quién> en <contexto>, de modo que <criterio de éxito>», y la afirmación, la forma «mi artefacto consigue X, mejor que Y, medido en Z», donde Y es externo.'],
  ['etapa_5', 'ETAPA 5, METODOLOGÍA. Cuarta pregunta: ¿con qué se demuestra? Enfoque, tipo y nivel deben fundamentarse con autores de metodología de la biblioteca, de preferencia del área de computación. El diseño debe corresponder a los objetivos y a los datos realmente disponibles, y tener su esquema. La población, la muestra y el muestreo deben coincidir con la unidad de análisis. Las consideraciones éticas explican beneficencia, no maleficencia, autonomía y justicia. Si hay artefacto: se describen sus componentes, tecnologías y proceso de construcción; el proceso de construcción (Scrum, RUP, CRISP-DM, Kimball, Mobile-D) no es la metodología de investigación; el método de validación corresponde a la afirmación; la línea base es externa (el procedimiento actual, otra técnica publicada o una línea base reconocida); el plan de validación dice qué se mide, con qué instrumento, sobre qué casos y contra qué línea base; se declara qué resultado refutaría la afirmación y cuáles son los límites.'],
  ['etapa_6', 'ETAPA 6, PLAN. El cronograma llega hasta la presentación del informe final. El presupuesto incluye personal, bienes y servicios. Se especifica el financiamiento. El instrumento del anexo debe medir los indicadores de la operacionalización.'],
  ['modo_ayuda', 'TAREA: explica al estudiante, en un máximo de 120 palabras, qué debe escribir en el campo «{campo_etiqueta}» y qué exige la rúbrica para alcanzar el nivel más alto. Si el campo ya tiene contenido, di en una frase qué le falta. Luego da un ejemplo breve de OTRO tema distinto al del estudiante, para que no lo copie.\nFORMATO: {"texto": "explicación", "ejemplo": "ejemplo de otro tema"}'],
  ['modo_preguntar', 'TAREA: formula de tres a cinco preguntas concretas que ayuden al estudiante a escribir por sí mismo el campo «{campo_etiqueta}», a partir de lo que ya tiene en su expediente. Cada pregunta debe apoyarse en algo que el estudiante ya escribió. No redactes el contenido.\nFORMATO: {"preguntas": ["pregunta 1", "pregunta 2", "pregunta 3"]}'],
  ['modo_proponer_texto', 'TAREA: redacta una propuesta para el campo «{campo_etiqueta}» usando solo la información del expediente y de la biblioteca. {indicacion}\nSi falta información para redactar bien, deja la marca [por completar: ...] en el lugar exacto y enumera lo que falta.\nFORMATO: {"texto": "propuesta", "faltantes": ["dato que falta"]}'],
  ['modo_proponer_tabla', 'TAREA: propone filas para la tabla «{campo_etiqueta}» usando solo la información del expediente y de la biblioteca. {indicacion}\nCada fila es un objeto con exactamente estas claves: {columnas}.\nFORMATO: {"filas": [{...}], "faltantes": ["dato que falta"]}'],
  ['modo_revisar', 'TAREA: revisa la etapa como lo haría un asesor exigente, criterio por criterio de la rúbrica. Señala solo problemas reales y concretos, indicando el campo. Clasifica cada observación como «bloqueante» (impide alcanzar el nivel 3 de la rúbrica o rompe la coherencia del proyecto con lo ya decidido) o «mejorable». Comprueba en especial: {comprobaciones}\nSi todo está bien, devuelve una lista vacía.\nFORMATO: {"observaciones": [{"campo": "clave_del_campo", "nivel": "bloqueante", "texto": "qué está mal y cómo corregirlo", "item": 3}], "resumen": "una oración"}'],
  ['modo_jurado', 'TAREA: actúa como jurado de la UNDC. Plantea las tres preguntas más difíciles que un jurado haría sobre esta etapa del proyecto, apuntando a sus puntos débiles reales.\nFORMATO: {"preguntas": ["pregunta 1", "pregunta 2", "pregunta 3"]}'],
  ['modo_jurado_eval', 'TAREA: evalúa las respuestas del estudiante a las preguntas del jurado. Para cada una indica si la respuesta es «sólida», «parcial» o «débil» y qué le falta. Termina con un consejo para mejorar el proyecto.\nPREGUNTAS Y RESPUESTAS:\n{respuestas}\nFORMATO: {"evaluacion": [{"pregunta": "...", "valoracion": "sólida", "comentario": "..."}], "consejo": "..."}'],
  ['modo_desglosar', 'TAREA: a partir del título provisional de la tesis, identifica sus piezas. No inventes: si una pieza no está en el título, deja la cadena vacía. «var1» es lo que el estudiante propone o estudia (el artefacto o la variable independiente), en minúsculas y sin artículo. «var2» es lo que quiere mejorar o explicar (la variable dependiente), en minúsculas y sin artículo. «contexto» es el lugar, la organización o la población. «tipo» es "artefacto" si el título anuncia construir, desarrollar, implementar o proponer un sistema, una aplicación, un modelo, un método o un prototipo, y "explicativa" si solo relaciona variables.\nTÍTULO: {titulo}\nFORMATO: {"var1": "", "var2": "", "contexto": "", "tipo": "artefacto"}'],
  ['modo_resumir', 'TAREA: a partir ÚNICAMENTE del resumen del estudio que se entrega, completa la ficha del antecedente. Si un dato no aparece en el resumen, deja la cadena vacía. No agregues nada que el resumen no diga. En «sin_resolver» anota solo las limitaciones o el trabajo futuro que el propio resumen declare; si no declara ninguno, déjalo vacío para que el estudiante lo complete al leer el estudio.\nESTUDIO: {estudio}\nRESUMEN: {resumen}\nFORMATO: {"objetivo": "", "metodologia": "", "resultados": "", "conclusion": "", "sin_resolver": ""}'],
  ['modo_rubrica', 'TAREA: actúa como evaluador de proyectos de tesis de la UNDC. Califica cada ítem de la rúbrica con un nivel de 1 a 4 según los descriptores, basándote solo en el contenido entregado. Sé estricto: si el contenido falta, el nivel es 1. Para cada ítem escribe una observación de una o dos oraciones que diga qué falta para subir de nivel.\nÍTEMS A EVALUAR:\n{items}\nFORMATO: {"items": [{"item": 1, "nivel": 3, "observacion": "..."}]}'],
  ['comprobar_0', 'que el tema esté delimitado (qué, en quién o qué, dónde); que las dos variables estén bien identificadas; que el tipo de proyecto corresponda a lo que el estudiante describe; y que el tema no parta de una tecnología ya elegida.'],
  ['comprobar_1', 'que los datos que el tema exige existan y el estudiante pueda conseguirlos; que la unidad de análisis sea medible; que el tiempo y las habilidades alcancen. Si el acceso a los datos no está asegurado, es bloqueante.'],
  ['comprobar_2', 'que el problema pase los cuatro filtros de impacto (alguien concreto lo sufre, se puede medir hoy, resolverlo cambia una decisión o un costo, no está ya resuelto); que el problema central sea un estado negativo y no la falta de una solución ni nombre una tecnología; que «lo que se hace hoy» sirva como línea base; que cada causa tenga evidencia verosímil; que causas y efectos no estén confundidos; que el planteamiento cubra los tres niveles con citas de la biblioteca y termine en el problema central.'],
  ['comprobar_3', 'que los antecedentes sean soluciones al problema y no solo descripciones del dominio; que cada antecedente se relacione de verdad con las variables y diga qué dejó sin resolver; que las bases teóricas estén organizadas por variable, dimensión e indicador y citen fuentes; que los términos salgan de las bases teóricas; que las brechas se desprendan de los antecedentes; que la declaración de brecha tenga la forma «lo que existe consigue X, pero no resuelve Y en el contexto Z» y conecte con el problema central.'],
  ['comprobar_4', 'que la propuesta responda a la declaración de brecha; que el título se sostenga con los datos declarados en viabilidad; que problemas, objetivos e hipótesis se correspondan uno a uno y usen las mismas variables; que los objetivos empiecen con verbo en infinitivo; que las hipótesis sean contrastables; que cada indicador sea medible con su escala e instrumento; si hay artefacto, que el problema de diseño tenga artefacto, objetivo medible, destinatario, contexto y criterio de éxito, que la afirmación compare contra algo externo y que los requisitos respondan a las causas del problema y tengan métrica.'],
  ['comprobar_5', 'que el diseño corresponda a los objetivos y a los datos disponibles; que población, muestra y muestreo coincidan con la unidad de análisis; que cada indicador tenga un instrumento; que el análisis corresponda a las hipótesis; que la ética nombre los cuatro principios; si hay artefacto, que estén sus componentes, tecnologías y proceso de construcción, que el proceso de construcción no se presente como la metodología de investigación, que el método de validación corresponda a la afirmación, que la línea base sea externa y coincida con «lo que se hace hoy», que se diga qué resultado refutaría la afirmación y que los límites estén escritos.'],
  ['comprobar_6', 'que el cronograma cubra todas las actividades hasta el informe final y sea realista para los meses disponibles; que el presupuesto tenga personal, bienes y servicios; que el instrumento mida los indicadores de la operacionalización.'],
  ['indicacion_planteamiento', 'Redacta de cuatro a seis párrafos: contexto internacional, nacional y local (cada uno con citas de la biblioteca tomadas de los apuntes del estudiante), luego quién tiene el problema, qué se hace hoy y qué falla, las causas y los efectos del árbol, y cierra enunciando el problema central. No menciones la solución ni una tecnología.'],
  ['indicacion_titulo', 'Propón el título en una sola línea, de máximo 20 palabras, con las variables o el artefacto, el objeto de estudio y el ámbito. Debe poder sostenerse con los datos declarados en viabilidad.'],
  ['indicacion_tema_oracion', 'Una sola oración que diga qué se estudia, en quién o en qué, y dónde.'],
  ['indicacion_brechas', 'Deriva las brechas de lo que los antecedentes de la biblioteca dejan sin resolver y de sus resultados. En «estudios» pon las claves de cita de los estudios que la muestran. En «respuesta» di cómo la atiende esta tesis, sin prometer más de lo que el estudiante declaró en viabilidad.'],
  ['indicacion_declaracion_brecha', 'Una sola frase con la forma «Lo que existe consigue X, pero no resuelve Y en el contexto Z», tomada de la tabla de brechas y del problema central.'],
  ['indicacion_problema_diseno', 'Usa exactamente la forma «Diseñar <artefacto> que consiga <objetivo medible> para <quién tiene el problema> en <contexto>, de modo que <criterio de éxito>». Tómalo de la declaración de brecha, de quién tiene el problema y de lo que mejoraría.'],
  ['indicacion_afirmacion', 'Una sola frase con la forma «El artefacto consigue X, mejor que Y, medido en Z», donde Y es lo que se hace hoy u otra solución de los antecedentes, y Z es una métrica.'],
  ['indicacion_problema_general', 'Si hay artefacto, usa la forma «¿En qué medida <el artefacto> mejora <la métrica> frente a <la línea base> en <el contexto>?».'],
  ['indicacion_linea_base', 'Toma como línea base lo que el estudiante describió en «qué se hace hoy» o una solución de sus antecedentes, con su valor medido si existe. No uses una versión anterior del propio artefacto.'],
  ['indicacion_limites', 'Di en qué contexto no aplicaría el resultado, qué supuestos se hacen y qué queda fuera del alcance, a partir de los datos y el escenario declarados.']
];

/* nivel | titulo | tipo | fuente | aplica
   tipo: caratula, indice, titulo, campo, lista, tabla, especial, nota */
var SEMILLA_PLANTILLA = [
  ['0', '', 'caratula', '', 'todos'],
  ['0', 'ÍNDICE', 'indice', '', 'todos'],
  ['1', 'PLANTEAMIENTO DEL PROBLEMA', 'titulo', '', 'todos'],
  ['2', 'Descripción de la realidad problemática', 'campo', 'planteamiento', 'todos'],
  ['2', 'Formulación del problema', 'titulo', '', 'todos'],
  ['3', 'Problema general', 'campo', 'problema_general', 'todos'],
  ['3', 'Problemas específicos', 'lista', 'problemas_especificos', 'todos'],
  ['2', 'Objetivos', 'titulo', '', 'todos'],
  ['3', 'Objetivo general', 'campo', 'objetivo_general', 'todos'],
  ['3', 'Objetivos específicos', 'lista', 'objetivos_especificos', 'todos'],
  ['2', 'Justificación', 'especial', 'justificacion', 'todos'],
  ['2', 'Delimitación de la investigación', 'titulo', '', 'todos'],
  ['3', 'Delimitación teórica', 'campo', 'delim_conceptual', 'todos'],
  ['3', 'Delimitación temporal', 'campo', 'delim_temporal', 'todos'],
  ['3', 'Delimitación espacial', 'campo', 'delim_espacial', 'todos'],
  ['1', 'MARCO TEÓRICO Y EMPÍRICO', 'titulo', '', 'todos'],
  ['2', 'Marco teórico', 'titulo', '', 'todos'],
  ['3', 'Variable 1: {var1}', 'titulo', '', 'todos'],
  ['4', 'Definición', 'campo', 'var1_definicion', 'todos'],
  ['4', 'Dimensiones', 'campo', 'var1_dimensiones', 'todos'],
  ['4', 'Indicadores', 'campo', 'var1_indicadores', 'todos'],
  ['4', 'Teorías', 'campo', 'var1_teorias', 'todos'],
  ['3', 'Variable 2: {var2}', 'titulo', '', 'todos'],
  ['4', 'Definición', 'campo', 'var2_definicion', 'todos'],
  ['4', 'Dimensiones', 'campo', 'var2_dimensiones', 'todos'],
  ['4', 'Indicadores', 'campo', 'var2_indicadores', 'todos'],
  ['4', 'Teorías', 'campo', 'var2_teorias', 'todos'],
  ['2', 'Antecedentes', 'titulo', '', 'todos'],
  ['4', 'Antecedentes nacionales', 'especial', 'antecedentes_nacionales', 'todos'],
  ['4', 'Antecedentes internacionales', 'especial', 'antecedentes_internacionales', 'todos'],
  ['2', 'Definición de términos básicos', 'especial', 'terminos', 'todos'],
  ['1', 'HIPÓTESIS Y VARIABLES', 'titulo', '', 'todos'],
  ['2', 'Hipótesis', 'titulo', '', 'hipotesis'],
  ['3', 'Hipótesis general', 'campo', 'hipotesis_general', 'hipotesis'],
  ['3', 'Hipótesis específicas', 'lista', 'hipotesis_especificas', 'hipotesis'],
  ['2', 'Definición conceptual de las variables', 'especial', 'definiciones', 'todos'],
  ['2', 'Operacionalización de las variables', 'tabla', 'operacionalizacion', 'todos'],
  ['1', 'DISEÑO METODOLÓGICO', 'titulo', '', 'todos'],
  ['2', 'Tipo de investigación', 'especial', 'enfoque', 'todos'],
  ['2', 'Diseño de investigación', 'especial', 'diseno', 'todos'],
  ['2', 'Método de investigación', 'especial', 'metodo', 'todos'],
  ['2', 'Población y muestra', 'especial', 'poblacion', 'todos'],
  ['2', 'Lugar de estudio', 'campo', 'lugar_estudio', 'todos'],
  ['2', 'Técnicas e instrumentos para la recolección de los datos', 'especial', 'tecnicas', 'todos'],
  ['2', 'Análisis y procesamiento de datos', 'especial', 'analisis', 'todos'],
  ['1', 'CRONOGRAMA DE ACTIVIDADES', 'especial', 'cronograma', 'todos'],
  ['1', 'PRESUPUESTO', 'especial', 'presupuesto', 'todos'],
  ['1', 'REFERENCIAS', 'especial', 'referencias', 'todos'],
  ['1', 'ANEXOS', 'titulo', '', 'todos'],
  ['A', 'Matriz de consistencia', 'especial', 'matriz_consistencia', 'todos'],
  ['A', 'Instrumento de recolección de datos', 'campo', 'instrumento_anexo', 'todos'],
  ['A', 'Certificado de validez de contenido (juicio de expertos)', 'nota', 'Inserte aquí los certificados de validez firmados por los expertos.', 'todos'],
  ['A', 'Constancia de grados y títulos de los validadores (SUNEDU)', 'nota', 'Inserte aquí las constancias descargadas del Registro Nacional de Grados y Títulos de la SUNEDU, una por validador.', 'todos'],
  ['A', 'Esquema o prototipo preliminar del artefacto', 'especial', 'esquema_artefacto', 'artefacto'],
  ['A', 'Árbol de problemas', 'especial', 'arbol_problemas', 'todos'],
  ['A', 'Declaración de uso de inteligencia artificial', 'especial', 'declaracion_ia', 'todos']
];

var HOJAS_ = {
  Config: ['clave', 'valor', 'descripcion'],
  Usuarios: ['correo', 'nombre', 'rol', 'codigo', 'asesor', 'activo', 'creado', 'alias', 'clave_hash', 'sal', 'cambiar_clave', 'intentos', 'bloqueo', 'ultimo_ingreso'],
  Etapas: ['id', 'nombre', 'producto', 'instruccion', 'requiere_asesor', 'contexto'],
  Campos: ['etapa', 'clave', 'etiqueta', 'tipo', 'columnas', 'opciones', 'ayuda', 'obligatorio', 'aplica', 'rubrica', 'ia', 'min_filas'],
  Prompts: ['clave', 'texto'],
  Rubrica: ['item', 'grupo', 'criterio', 'descripcion', 'n1', 'n2', 'n3', 'n4', 'marca', 'campos'],
  Plantilla: ['nivel', 'titulo', 'tipo', 'fuente', 'aplica'],
  Sencillo: ['orden', 'grupo', 'campo', 'pregunta', 'ayuda', 'aplica'],
  Expedientes: ['correo', 'clave', 'valor', 'actualizado'],
  Avance: ['correo', 'etapa', 'estado', 'semaforo', 'detalle', 'actualizado'],
  Biblioteca: ['id', 'correo', 'clave_cita', 'tipo', 'uso', 'doi', 'url', 'autores', 'anio', 'titulo', 'fuente', 'volumen', 'numero', 'paginas', 'editorial', 'grado', 'indizacion', 'verificado', 'resumen', 'objetivo', 'metodologia', 'resultados', 'conclusion', 'relacion', 'creado', 'sin_resolver', 'ambito'],
  Comentarios: ['fecha', 'correo', 'etapa', 'autor', 'rol', 'texto', 'decision'],
  Bitacora: ['id', 'fecha', 'correo', 'etapa', 'modo', 'campo', 'modelo', 'tokens_entrada', 'tokens_salida', 'aceptado', 'extracto'],
  Accesos: ['fecha', 'correo', 'rol'],
  Informe: ['correo', 'seccion', 'texto', 'actualizado']
};

/**
 * Instala o repara la aplicacion. Se ejecuta una vez desde el editor de Apps Script.
 * No borra datos: solo crea las pestanas que faltan y completa la configuracion ausente.
 * Los datos de acceso se escriben en el registro de ejecucion; la funcion no devuelve nada sensible,
 * porque su nombre no termina en guion bajo y el navegador podria llamarla.
 */
function instalar() {
  var p = PropertiesService.getScriptProperties();
  // El nombre de esta funcion no termina en guion bajo, asi que el navegador podria llamarla.
  // Una vez instalada la aplicacion, solo la ejecuta el propietario desde el editor.
  var activo = '';
  var efectivo = '';
  try { activo = String(Session.getActiveUser().getEmail() || ''); } catch (e0) { activo = ''; }
  try { efectivo = String(Session.getEffectiveUser().getEmail() || ''); } catch (e1) { efectivo = ''; }
  if (p.getProperty('HOJA_ID') && p.getProperty('PERMITIR_INSTALAR') !== 'SI' && (!activo || activo.toLowerCase() !== efectivo.toLowerCase())) {
    throw new Error('instalar() solo puede ejecutarla el propietario, desde el editor de Apps Script.');
  }
  var ss = null;
  var id = p.getProperty('HOJA_ID');
  if (id) { ss = SpreadsheetApp.openById(id); }
  if (!ss) { try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create('Quiero ser Ingeniero - Datos'); }
  p.setProperty('HOJA_ID', ss.getId());
  // La prueba de escritura se repite si falta o si es de una version que no media appendRow
  if (String(p.getProperty('MODO_TEXTO') || '').indexOf('|') < 0) { p.setProperty('MODO_TEXTO', probarHoja_(ss)); }
  CACHE_ = {};
  renovarCacheCompartida_();

  var nombres = Object.keys(HOJAS_);
  var existian = {};
  nombres.forEach(function (n) { existian[n] = !!ss.getSheetByName(n); });
  var previa = existian.Config ? String(cfg_('VERSION_DATOS', '1.0')) : VERSION_DATOS_;
  for (var i = 0; i < nombres.length; i++) {
    if (!existian[nombres[i]]) crearHoja_(ss, nombres[i]);
  }
  // Instalaciones anteriores. Los datos de los estudiantes (usuarios, expedientes, avance, biblioteca,
  // comentarios y bitacora) no se tocan. Las definiciones (etapas, campos, indicaciones, plantilla y rubrica)
  // cambian de una version a otra y su orden importa: se renuevan desde la semilla, y las anteriores quedan
  // en pestanas de respaldo por si el administrador las habia personalizado.
  var renovadas = [];
  if (previa !== VERSION_DATOS_) {
    HOJAS_DEFINICION_.forEach(function (n) { if (existian[n]) { renovadas.push(renovarHoja_(ss, n, previa)); } });
  }
  for (var k = 0; k < nombres.length; k++) { completarColumnas_(ss.getSheetByName(nombres[k]), HOJAS_[nombres[k]]); }
  CACHE_ = {};
  completarFilas_('Config', SEMILLA_CONFIG, 'clave');
  completarFilas_('Prompts', SEMILLA_PROMPTS, 'clave');
  CACHE_ = {};
  if (existian.Config && previa !== VERSION_DATOS_ && parseFloat(previa) < 1.3) migrar13_();
  if (cfg_('VERSION_DATOS', '') !== VERSION_DATOS_) { ponerConfig_('VERSION_DATOS', VERSION_DATOS_); }
  var vieja = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (vieja && ss.getSheets().length > 1 && vieja.getLastRow() === 0) { ss.deleteSheet(vieja); }

  // Configuracion que depende de la cuenta
  var correo = efectivo;
  CACHE_ = {};
  if (!cfg_('CLAVE_REGISTRO', '')) { ponerConfig_('CLAVE_REGISTRO', 'ING-' + codigo_(5)); }
  if (!cfg_('CORREO_CONTACTO', '') && correo) { ponerConfig_('CORREO_CONTACTO', correo); }
  if (correo && !usuario_(correo)) {
    agregar_('Usuarios', { correo: correo.toLowerCase(), nombre: 'Administrador', rol: 'admin', codigo: codigo_(6), asesor: '', activo: 'SI', creado: ahora_() });
  }
  if (!p.getProperty('CARPETA_ID')) {
    var carpeta = DriveApp.createFolder('Quiero ser Ingeniero - Planes de tesis');
    p.setProperty('CARPETA_ID', carpeta.getId());
  }
  CACHE_ = {};
  var admin = correo ? usuario_(correo) : null;
  renovarCacheCompartida_();
  Logger.log('Instalación completa (versión ' + VERSION_DATOS_ + ').\nHoja de datos: ' + ss.getUrl() +
    '\nClave del curso para el registro de estudiantes: ' + cfg_('CLAVE_REGISTRO', '') +
    (admin ? '\nTu usuario administrador: ' + admin.correo + (admin.codigo ? '  Clave inicial: ' + admin.codigo + ' (te pedirá cambiarla al entrar)' : '') : '') +
    (renovadas.length ? '\nSe actualizaron las definiciones desde la versión ' + previa + '. Las anteriores quedaron en estas pestañas de respaldo: ' + renovadas.join(', ') + '. Si habías personalizado campos o indicaciones, cópialos de ahí.' : '') +
    (p.getProperty('GEMINI_API_KEY') ? '' : '\nOpcional: guardar la clave de Gemini del curso en Propiedades del script (GEMINI_API_KEY). Sin ella, los estudiantes usan su propia clave o el modo de copiar y pegar.') +
    '\nSi cambiaste el código, publica una versión nueva de la aplicación web.');
  return 'Instalación completa. Los datos de acceso están en el registro de ejecución del editor y en la hoja de datos.';
}

var VERSION_DATOS_ = '1.3';

/**
 * Paso a la 1.3: la plantilla sigue el modelo «Proyecto de tesis» de la escuela (carta, Arial) y el asistente
 * empieza por la clave propia del estudiante. Solo se cambian los valores que seguian siendo los de fabrica:
 * lo que el administrador personalizo se respeta.
 */
function migrar13_() {
  var cambios = [
    ['CARATULA_TIPO_DOCUMENTO', 'PROYECTO DE TRABAJO DE INVESTIGACIÓN', 'PROYECTO DE TESIS'],
    ['CIUDAD', 'San Vicente de Cañete, Perú', 'San Vicente de Cañete'],
    ['FUENTE', 'Times New Roman', 'Arial'],
    ['MARGEN_IZQ_CM', '3', '2.54'],
    ['MARGEN_OTROS_CM', '2.5', '2.54'],
    ['MODOS_IA', 'curso,propia,copiar', 'propia,nano,copiar,curso'],
    ['MODO_IA_POR_DEFECTO', 'curso', 'propia']
  ];
  cambios.forEach(function (c) { if (String(cfg_(c[0], '')) === c[1]) ponerConfig_(c[0], c[2]); });
  CACHE_ = {};
}
var HOJAS_DEFINICION_ = ['Etapas', 'Campos', 'Prompts', 'Plantilla', 'Rubrica', 'Sencillo'];

function crearHoja_(ss, n) {
  var sh = ss.insertSheet(n);
  sh.getRange(1, 1, sh.getMaxRows(), HOJAS_[n].length).setNumberFormat('@');
  sh.getRange(1, 1, 1, HOJAS_[n].length).setValues([HOJAS_[n]]).setFontWeight('bold').setBackground('#E8E6FD');
  sh.setFrozenRows(1);
  sembrar_(sh, n);
  return sh;
}

/** Guarda la pestaña actual con otro nombre y la vuelve a crear desde la semilla. Devuelve el nombre del respaldo. */
function renovarHoja_(ss, n, previa) {
  var respaldo = n + ' (v' + previa + ')';
  var k = 2;
  while (ss.getSheetByName(respaldo)) { respaldo = n + ' (v' + previa + ' - ' + k + ')'; k++; }
  ss.getSheetByName(n).setName(respaldo);
  crearHoja_(ss, n);
  return respaldo;
}

/**
 * Comprueba como trata esta cuenta de Hojas de calculo los textos que empiezan con = o con apostrofo
 * en celdas con formato de texto. El resultado (por ejemplo F1A1) decide como escribe celda_().
 * F1: el formato de texto basta para que "=1+1" no se convierta en formula. A1: el apostrofo inicial no se guarda.
 */
function probarHoja_(ss) {
  var sh = ss.getSheetByName('_prueba') || ss.insertSheet('_prueba');
  var datos = [['=1+1'], ["'=1+1"], ["'x"], ['-5']];
  sh.getRange(1, 1, 12, 1).setNumberFormat('@');
  sh.getRange(1, 1, 4, 1).setValues(datos);
  // Las mismas cuatro pruebas con appendRow, que es como se agregan las filas nuevas
  for (var i = 0; i < datos.length; i++) { sh.appendRow(datos[i]); }
  SpreadsheetApp.flush();
  function medir(desde) {
    var r = sh.getRange(desde, 1, 4, 1);
    var v = r.getValues();
    var f = r.getFormulas();
    var formato = (v[0][0] === '=1+1' && !f[0][0] && v[3][0] === '-5');
    var apostrofo = (v[2][0] === 'x' && v[1][0] === '=1+1' && !f[1][0]);
    return (formato ? 'F1' : 'F0') + (apostrofo ? 'A1' : 'A0');
  }
  var modo = medir(1) + '|' + medir(5);
  ss.deleteSheet(sh);
  return modo;
}

/** Agrega al final de la cabecera las columnas que falten. */
function completarColumnas_(sh, columnas) {
  var ancho = Math.max(1, sh.getLastColumn());
  var cab = sh.getRange(1, 1, 1, ancho).getValues()[0].map(function (v) { return String(v); });
  var faltan = columnas.filter(function (c) { return cab.indexOf(c) < 0; });
  if (!faltan.length) return;
  var desde = cab.length + 1;
  var necesarias = cab.length + faltan.length;
  if (sh.getMaxColumns() < necesarias) sh.insertColumnsAfter(sh.getMaxColumns(), necesarias - sh.getMaxColumns());
  sh.getRange(1, desde, sh.getMaxRows(), faltan.length).setNumberFormat('@');
  sh.getRange(1, desde, 1, faltan.length).setValues([faltan]).setFontWeight('bold').setBackground('#E8E6FD');
}

/** Agrega las filas de la semilla cuya clave aun no existe en la hoja. */
function completarFilas_(n, semilla, columnaClave) {
  var cols = HOJAS_[n];
  var pos = cols.indexOf(columnaClave);
  var hay = Object.create(null);
  leer_(n).forEach(function (r) { hay[r[columnaClave]] = true; });
  semilla.forEach(function (fila) {
    if (hay[fila[pos]]) return;
    var o = {};
    cols.forEach(function (c, i) { o[c] = fila[i]; });
    agregar_(n, o);
  });
}

function sembrar_(sh, n) {
  var datos = null;
  if (n === 'Config') datos = SEMILLA_CONFIG;
  if (n === 'Etapas') datos = SEMILLA_ETAPAS;
  if (n === 'Campos') datos = SEMILLA_CAMPOS;
  if (n === 'Prompts') datos = SEMILLA_PROMPTS;
  if (n === 'Plantilla') datos = SEMILLA_PLANTILLA;
  if (n === 'Sencillo') datos = SEMILLA_SENCILLO;
  if (n === 'Rubrica') {
    datos = SEMILLA_RUBRICA.map(function (r) { return [String(r.item), r.grupo, r.criterio, r.descripcion, r.n1, r.n2, r.n3, r.n4, r.marca, r.campos]; });
  }
  if (datos && datos.length) {
    sh.getRange(2, 1, datos.length, datos[0].length).setValues(datos);
  }
}

function codigo_(n) {
  var letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var s = '';
  for (var i = 0; i < n; i++) { s += letras.charAt(Math.floor(Math.random() * letras.length)); }
  return s;
}

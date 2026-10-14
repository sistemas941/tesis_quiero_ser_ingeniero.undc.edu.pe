// ------------------------------------------------------------------ arranque, ingreso y navegacion
function guardarToken(t) { S.token = t || ''; try { if (t) sessionStorage.setItem('qsi_token', t); else sessionStorage.removeItem('qsi_token'); } catch (e) { /* sin almacenamiento */ } }
function leerToken() { try { return sessionStorage.getItem('qsi_token') || ''; } catch (e) { return ''; } }

function arrancar() {
  llamar('info').then(function (info) {
    S.info = info;
    document.title = info.app || 'Quiero ser Ingeniero';
    if (!info.instalada) {
      $('#app').innerHTML = '<div class="pagina"><div class="tarjeta" style="max-width:640px;margin:60px auto"><h2>La aplicación aún no está instalada</h2><p class="tenue" style="margin-top:8px">Abre el editor de Apps Script, elige la función <span class="mono">instalar</span> y pulsa «Ejecutar». Después vuelve a cargar esta página.</p></div></div>';
      return;
    }
    var t = leerToken();
    if (!t) { verIngreso('ingresar'); return; }
    S.token = t;
    entrar().catch(function () { guardarToken(''); verIngreso('ingresar'); });
  }).catch(function (e) {
    $('#app').innerHTML = '<div class="pagina"><div class="aviso rojo">No se pudo cargar la aplicación: ' + esc(e.message) + '</div></div>';
  });
}

function verIngreso(pestana, mensaje) {
  var info = S.info || {};
  var reg = info.registro;
  var h = '<div class="ingreso"><div class="lado"><div><div class="marca" style="font-size:15px"><span class="sello" style="background:rgba(255,255,255,.18)">' + IC.birrete + '</span><span>' + esc(info.universidad || '') + '<small style="color:#DCD9FB">' + esc(info.escuela || '') + '</small></span></div>' +
    '<h1 style="margin-top:40px">' + esc(info.app || '') + '</h1><p>Tu proyecto de tesis, desde el título hasta el documento listo para presentar: lo ves crecer en la plantilla de la escuela mientras escribes, lo revisas sección por sección y lo descargas en Word cuando quieras.</p></div>' +
    '<div class="pasos"><div><b>I</b>Planteamiento</div><div><b>II</b>Marco teórico</div><div><b>III</b>Hipótesis</div><div><b>IV</b>Metodología</div><div><b>V</b>Cronograma</div><div><b>VI</b>Presupuesto</div><div><b>W</b>Tu Word</div></div></div>' +
    '<div class="forma"><h2>' + (pestana === 'registrar' ? 'Crea tu usuario' : 'Ingresa a tu tesis') + '</h2>';
  if (reg) h += '<div class="pestanas"><button data-a="pestanaIngreso" data-p="ingresar" class="' + (pestana === 'ingresar' ? 'activo' : '') + '">Ya tengo clave</button><button data-a="pestanaIngreso" data-p="registrar" class="' + (pestana === 'registrar' ? 'activo' : '') + '">Soy nuevo</button></div>';
  else h += '<div style="height:18px"></div>';
  if (mensaje) h += '<div class="aviso ambar" style="margin-bottom:14px">' + esc(mensaje) + '</div>';
  if (pestana === 'registrar') {
    h += '<form data-f="registrar"><div class="campo-simple"><label for="r-nombre">Nombres y apellidos</label><input id="r-nombre" type="text" autocomplete="name" required></div>' +
      '<div class="campo-simple"><label for="r-correo">Correo</label><input id="r-correo" type="email" autocomplete="email" required placeholder="tu.correo@undc.edu.pe"></div>' +
      '<div class="campo-simple"><label for="r-clave">Clave del curso</label><input id="r-clave" type="text" required placeholder="Te la da tu profesor" style="text-transform:uppercase"></div>' +
      '<div class="campo-simple"><label for="r-propia">Tu clave para entrar</label><input id="r-propia" type="password" autocomplete="new-password" required minlength="8" placeholder="8 caracteres o más, con letras y números"></div>' +
      '<button class="btn primario" type="submit" style="width:100%;justify-content:center;margin-top:6px">Crear mi usuario</button></form>';
  } else {
    h += '<form data-f="ingresar"><div class="campo-simple"><label for="i-correo">Correo</label><input id="i-correo" type="email" autocomplete="email" required></div>' +
      '<div class="campo-simple"><label for="i-clave">Clave</label><input id="i-clave" type="password" autocomplete="current-password" required></div>' +
      '<button class="btn primario" type="submit" style="width:100%;justify-content:center;margin-top:6px">Ingresar</button></form>' +
      '<p class="pequeno tenue" style="margin-top:12px">La primera vez, entra con tu correo de la universidad y la clave inicial que te dio tu profesor: tu primer apellido seguido de cuatro números. Te pediremos cambiarla por una tuya. ¿La olvidaste? Tu asesor puede reiniciarla.</p>';
  }
  if (info.aviso) h += '<div class="aviso gris pequeno" style="margin-top:22px">' + esc(info.aviso) + '</div>';
  if (info.traslado) h += '<div class="aviso ambar" style="margin-top:14px"><b>La aplicación se trasladó.</b> ' + (enlace(info.traslado) ? 'Ahora está en <a href="' + esc(info.traslado) + '" target="_top" rel="noopener">' + esc(info.traslado) + '</a>. ' : '') + 'Aquí solo puedes consultar tu trabajo y descargar tu expediente (en Mi configuración).</div>';
  var cr = info.credito || {};
  if (cr.autor) {
    var enl = [];
    if (/^https:\/\//.test(cr.orcid || '')) enl.push('<a href="' + esc(cr.orcid) + '" target="_blank" rel="noopener">ORCID</a>');
    if (/^https:\/\//.test(cr.linkedin || '')) enl.push('<a href="' + esc(cr.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>');
    h += '<p class="pequeno tenue" style="margin-top:18px">Desarrollado por ' + esc(cr.autor) + (enl.length ? ' · ' + enl.join(' · ') : '') + '</p>';
  }
  h += '</div></div>';
  $('#app').innerHTML = h;
}

function enviarIngreso(form) {
  var fin = ocupar($('button[type=submit]', form), 'Ingresando');
  var clave = $('#i-clave').value;
  llamar('ingresar', { correo: $('#i-correo').value, contrasena: clave }).then(function (r) {
    guardarToken(r.token);
    if (r.perfil.cambiarClave) { verCambioClave(clave); return null; }
    return entrar();
  }).catch(function (e) { fin(); fallo(e); });
}

function enviarRegistro(form) {
  var fin = ocupar($('button[type=submit]', form), 'Creando');
  var propia = $('#r-propia').value;
  llamar('registrar', { nombre: $('#r-nombre').value, correo: $('#r-correo').value, clave: $('#r-clave').value, contrasena: propia }).then(function (r) {
    return llamar('ingresar', { correo: r.correo, contrasena: propia }).then(function (s) {
      guardarToken(s.token);
      return entrar().then(function () { toast('Listo. Con tu correo y tu clave volverás a entrar.', 'bien'); });
    });
  }).catch(function (e) { fin(); fallo(e); });
}

/** Primer ingreso (o clave reiniciada): se cambia la clave inicial por una propia antes de seguir. */
function verCambioClave(actual, mensaje) {
  S.claveActual = actual || '';
  var h = '<div class="ingreso"><div class="lado"><div><div class="marca" style="font-size:15px"><span class="sello" style="background:rgba(255,255,255,.18)">' + IC.birrete + '</span><span>' + esc((S.info || {}).universidad || '') + '</span></div>' +
    '<h1 style="margin-top:40px">Bienvenido</h1><p>Tu borrador de tesis ya te espera. Antes de verlo, cambia la clave inicial por una que solo tú conozcas.</p></div></div>' +
    '<div class="forma"><h2>Crea tu clave</h2>' + (mensaje ? '<div class="aviso ambar" style="margin-bottom:14px">' + esc(mensaje) + '</div>' : '') +
    '<form data-f="cambiarClave">' + (actual ? '' : '<div class="campo-simple"><label for="c-actual">Clave actual (la inicial)</label><input id="c-actual" type="password" autocomplete="current-password" required></div>') +
    '<div class="campo-simple"><label for="c-nueva">Clave nueva</label><input id="c-nueva" type="password" autocomplete="new-password" required minlength="8" placeholder="8 caracteres o más, con letras y números"></div>' +
    '<div class="campo-simple"><label for="c-repite">Repite la clave nueva</label><input id="c-repite" type="password" autocomplete="new-password" required minlength="8"></div>' +
    '<button class="btn primario" type="submit" style="width:100%;justify-content:center;margin-top:6px">Guardar y entrar</button></form>' +
    '<p class="pequeno tenue" style="margin-top:12px">No uses tu apellido, tu código ni tu fecha de nacimiento. La aplicación guarda solo una huella cifrada de tu clave: nadie puede leerla, ni tu profesor.</p>' +
    '<button class="btn chico fantasma" data-a="salir" style="margin-top:10px">Salir</button></div></div>';
  $('#app').innerHTML = h;
}
function enviarCambioClave(form) {
  var nueva = $('#c-nueva').value, rep = $('#c-repite').value;
  var actual = S.claveActual || ($('#c-actual') ? $('#c-actual').value : '');
  if (nueva !== rep) { toast('Las dos claves nuevas no coinciden.', 'error'); return; }
  var fin = ocupar($('button[type=submit]', form), 'Guardando');
  llamar('cambiarClave', { actual: actual, nueva: nueva }).then(function () {
    S.claveActual = '';
    return entrar().then(function () { toast('Tu clave quedó guardada.', 'bien'); });
  }).catch(function (e) { fin(); fallo(e); });
}

/** Carga los datos segun el rol y muestra la primera pantalla. */
function entrar() {
  return llamar('yo', { todo: true }).then(function (yo) {
    S.perfil = { correo: yo.correo, rol: yo.rol, nombre: yo.nombre, cambiarClave: yo.cambiarClave };
    aplicarTema(temaGuardado());
    if (yo.cambiarClave) { verCambioClave(''); return null; }
    if (yo.rol === 'estudiante') {
      var est = yo.estado ? Promise.resolve(yo.estado) : llamar('estado');
      return est.then(function (d) { ponerDatos(d); return ir(d.config.INICIO_ESTUDIANTE === 'modo' ? (modoApp() === 'sencillo' ? 'tesis' : 'ruta') : 'clase'); });
    }
    if (esGlobal()) {
      if (yo.tablero && yo.admin) { ponerTablero(yo.tablero); S.admin = yo.admin; return ir('tablero'); }
      return llamar('tablero').then(function (t) {
        ponerTablero(t);
        return llamar('adminEstado').then(function (a) { S.admin = a; });
      }).then(function () { return ir('tablero'); });
    }
    if (yo.panel) { S.panel = yo.panel; S.panelHora = Date.now(); return ir('panel'); }
    return llamar('panel').then(function (p) { S.panel = p; return ir('panel'); });
  });
}

function ponerDatos(d) {
  S.d = d;
  if (String(d.config.MODOS_IA || '').indexOf('nano') >= 0) detectarNano();
  S.exp = d.expediente;
  S.tablas = {};
}

function salir(porSesion) {
  guardarToken('');
  aplicarTema('indigo');
  S.clase = null; S.imp = null; S.extraer = null; S.inf = null; S.infAlumno = null; S.figLocal = null; S.docModo = '';
  S.d = null; S.perfil = null; S.panel = null; S.admin = null; S.tablero = null; S.alumno = null; S.pend = {}; S.via = ''; S.claveIA = ''; S.copia = null; S.ia = null; S.modo = ''; S.vistaDoc = null;
  cerrarModal();
  verIngreso('ingresar', porSesion === true ? 'Tu sesión terminó. Vuelve a ingresar.' : '');
}

function barra() {
  var rol = S.perfil ? S.perfil.rol : '';
  var items = [];
  var sencillo = rol === 'estudiante' && modoApp() === 'sencillo';
  if (rol === 'estudiante') {
    items = [['tesis', 'Mi tesis', IC.pluma], ['matriz', 'Matriz', IC.rejilla], ['ruta', 'Mi ruta', IC.ruta], ['documento', 'Ver mi tesis', IC.doc, 'destacado'], ['borrador', 'Borrador', planCongelado() ? IC.libroAbierto : IC.candado, planCongelado() ? 'nivel2' : 'nivel2 bloqueado'], ['clase', 'Mi clase', IC.grupo], ['biblioteca', 'Biblioteca', IC.libro], ['orientacion', 'Orientación', IC.brujulaN]];
    if (!sencillo) items.push(['rubrica', 'Rúbrica', IC.rubrica], ['plan', 'Mi plan', IC.plan]);
  }
  else if (esGlobal()) items = [['tablero', 'Tablero', IC.rejilla], ['panel', 'Estudiantes', IC.grupo], ['admin', rol === 'admin' ? 'Administración' : 'Usuarios', IC.engrane]];
  else items = [['panel', 'Estudiantes', IC.grupo]];
  items.push(['guia', 'Guía', IC.guia]);
  var activa = S.vista === 'etapa' ? 'ruta' : (S.vista === 'alumno' ? 'panel' : S.vista);
  var nombre = S.perfil ? S.perfil.nombre : '';
  return '<header class="barra"><div class="barra-in"><div class="marca"><span class="sello">' + IC.birrete + '</span><span>' + esc(S.info.app) + '<small>' + esc(S.info.universidad) + '</small></span></div>' +
    '<nav class="nav" aria-label="Secciones">' + items.map(function (i) { return '<button data-a="ir" data-v="' + i[0] + '" class="' + (activa === i[0] ? 'activo' : '') + (i[3] ? ' ' + i[3] : '') + '">' + (i[2] || '') + '<span>' + i[1] + '</span></button>'; }).join('') + '</nav>' +
    '<div class="der">' + (rol === 'estudiante' ? '<button class="btn chico" data-a="' + (sencillo ? 'modoCompleto' : 'modoSencillo') + '" title="' + (sencillo ? 'Todas las etapas, con sus revisiones y la rúbrica' : 'Solo lo esencial, con tu documento a la vista') + '">' + (sencillo ? 'Ruta completa' : 'Modo sencillo') + '</button>' : '') + (rol === 'estudiante' && S.d && modosIA().length ? '<button class="btn chico boton-clave" data-a="modoIA" title="Elige cómo usar el asistente o pega tu clave de Google AI Studio">' + IC.llave + (viaIA() === 'propia' ? 'Mi IA: ' + esc(provDe(provIA()).n) : (viaIA() ? 'Mi IA: ' + esc(VIAS[viaIA()].corto) : 'Activar mi IA')) + '</button>' : '') + '<span class="guardado" id="guardado" aria-live="polite"></span><span class="quien" title="' + esc(nombre) + '">' + esc(nombre) + '</span><button class="btn chico fantasma boton-engrane" data-a="configurar" title="Mi configuración: color, asistente de IA, estilo de citas y contraseña" aria-label="Mi configuración">' + IC.engrane + '</button><button class="btn chico fantasma" data-a="salir">Salir</button></div></div></header>';
}

/** Cambia de pantalla. Antes guarda lo pendiente. */
function ir(vista, param) {
  if (S.vista === 'borrador' && vista !== 'borrador' && S.inf && S.inf.sucio) toast('Tu sección sin guardar quedó en este navegador. Al volver al borrador, púlsala y guárdala.');
  return guardarAhora().then(function () {
    S.vista = vista;
    if (vista === 'etapa') S.etapa = String(param);
    if (vista === 'tesis') { S.etapa = ''; if (S.ia && S.ia.etapa !== '') S.ia = null; }
    var cuerpo = '';
    if (vista === 'tesis') cuerpo = vistaTesis();
    else if (vista === 'documento') cuerpo = vistaDocumento();
    else if (vista === 'ruta') cuerpo = vistaRuta();
    else if (vista === 'etapa') cuerpo = vistaEtapa();
    else if (vista === 'orientacion') cuerpo = vistaOrientacion();
    else if (vista === 'biblioteca') cuerpo = vistaBiblioteca();
    else if (vista === 'matriz') cuerpo = vistaMatriz();
    else if (vista === 'rubrica') cuerpo = vistaRubrica();
    else if (vista === 'plan') cuerpo = vistaPlan();
    else if (vista === 'panel') cuerpo = vistaPanel();
    else if (vista === 'alumno') cuerpo = vistaAlumno();
    else if (vista === 'admin') cuerpo = vistaAdmin();
    else if (vista === 'tablero') cuerpo = vistaTablero();
    else if (vista === 'guia') cuerpo = vistaGuia();
    else if (vista === 'clase') cuerpo = vistaClase();
    else if (vista === 'borrador') cuerpo = vistaBorrador();
    var flotante = S.perfil && S.perfil.rol === 'estudiante' && ['tesis', 'documento', 'clase', 'borrador'].indexOf(vista) < 0 ? '<button class="btn primario boton-ver-tesis" data-a="ir" data-v="documento">' + IC.doc + 'Ver mi tesis</button>' : '';
    $('#app').innerHTML = barra() + '<main class="pagina" id="pagina">' + cuerpo + '</main>' + flotante;
    window.scrollTo(0, 0);
    crecerTodos($('#pagina'));
    if (vista === 'etapa') despuesDeEtapa();
    if (vista === 'alumno') despuesDeAlumno();
    if (vista === 'tesis') despuesDeTesis();
    if (vista === 'documento') despuesDeDocumento();
    if (vista === 'panel') refrescarPanel();
    if (vista === 'clase') despuesDeClase();
    if (vista === 'borrador') despuesDeBorrador();
    aplicarCongelado();
    if (vista === 'guia' && param) { var g = document.getElementById('g-' + param); if (g) g.scrollIntoView({ block: 'start' }); }
    if (vista === 'orientacion' && param) { var ancla = document.getElementById('or-' + param); if (ancla) ancla.scrollIntoView({ block: 'start' }); }
  });
}

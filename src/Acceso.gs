/**
 * Acceso.gs - Ingreso con correo y clave, cambio obligatorio de la clave inicial y bloqueo por intentos.
 *
 * La clave inicial (apellido + cuatro digitos) se guarda en la columna «codigo» solo hasta que la persona
 * la cambia. La clave elegida se guarda como huella SHA-256 con sal, nunca en claro.
 */

var INTENTOS_MAX_ = 5;
var BLOQUEO_MIN_ = 15;

/** Huella de una clave: SHA-256 iterado sobre sal + clave, en hexadecimal. */
function huellaClave_(sal, clave) {
  var s = String(sal) + '|' + String(clave);
  for (var i = 0; i < 200; i++) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
    s = bytes.map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
  }
  return s;
}

/** Compara dos textos sin cortar en la primera diferencia. */
function igualSeguro_(a, b) {
  a = String(a); b = String(b);
  var d = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

/** Clave inicial: el primer apellido en minusculas y sin tildes, mas cuatro digitos al azar. */
function claveInicial_(nombre) {
  var ap = String(nombre || '').split(',')[0].trim().replace(/^((dr|dra|mg|ing|lic|mtro|mtra)\.?\s+)+/i, '');
  var pal = ap.split(/\s+/);
  var base = /^(de|del|la|las|los|san)$/i.test(pal[0] || '') ? pal.slice(0, 3).join('') : (pal[0] || 'clave');
  base = sinTildes_(base).toLowerCase().replace(/[^a-z]/g, '') || 'clave';
  var n = String(Math.floor(Math.random() * 10000));
  return base + '0000'.substring(n.length) + n;
}

/** Busca el usuario por su correo principal o por su correo alterno. */
function usuarioIngreso_(id) {
  id = normCorreo_(id);
  if (!id) return null;
  var u = usuario_(id);
  if (u) return u;
  var us = leer_('Usuarios');
  for (var i = 0; i < us.length; i++) { if (us[i].alias && normCorreo_(us[i].alias) === id) return us[i]; }
  return null;
}

/** Debe cambiar la clave: aun no tiene una propia, o el administrador se lo pidio. */
function debeCambiar_(u) { return !u.clave_hash || String(u.cambiar_clave).toUpperCase() === 'SI'; }

function ingresar_(a) {
  var clave = String(a.contrasena !== undefined ? a.contrasena : (a.codigo || '')).trim();
  var generico = 'El correo o la clave no coinciden.';
  return conBloqueo_(function () {
    olvidar_('Usuarios');
    var u = usuarioIngreso_(a.correo);
    if (!u || !clave) throw new Error(generico);
    var ahora = new Date();
    if (u.bloqueo) {
      var hasta = parseInt(u.bloqueo, 10) || 0;
      if (hasta > ahora.getTime()) {
        var min = Math.max(1, Math.ceil((hasta - ahora.getTime()) / 60000));
        throw new Error('Demasiados intentos fallidos. Espera ' + min + ' minuto(s) o pide a tu asesor que reinicie tu clave.');
      }
    }
    var ok = false;
    if (u.clave_hash) ok = igualSeguro_(huellaClave_(u.sal, clave), u.clave_hash);
    else if (u.codigo) ok = igualSeguro_(String(u.codigo).trim().toLowerCase(), clave.toLowerCase());
    if (!ok) {
      var n = (parseInt(u.intentos, 10) || 0) + 1;
      var cambio = { intentos: String(n) };
      if (n >= INTENTOS_MAX_) {
        cambio.intentos = '0';
        cambio.bloqueo = String(ahora.getTime() + BLOQUEO_MIN_ * 60000);
      }
      actualizar_('Usuarios', u._fila, cambio);
      throw new Error(n >= INTENTOS_MAX_ ? 'Demasiados intentos fallidos. Tu acceso queda en pausa ' + BLOQUEO_MIN_ + ' minutos.' : generico);
    }
    if (u.activo === 'NO') throw new Error('Tu usuario está desactivado. Consulta con tu profesor.');
    actualizar_('Usuarios', u._fila, { intentos: '0', bloqueo: '', ultimo_ingreso: ahora_() });
    registrarAcceso_(u);
    if (u.rol === 'estudiante') congelarBorrador_(u.correo);
    var token = Utilities.getUuid() + Utilities.getUuid();
    var ses = { correo: normCorreo_(u.correo), rol: u.rol, nombre: u.nombre };
    CacheService.getScriptCache().put('ses_' + token, JSON.stringify(ses), 21600);
    ses.cambiarClave = debeCambiar_(u);
    return { token: token, perfil: ses };
  });
}

/** Cambia la clave. Pide la actual (la inicial o la propia) y exige una nueva distinta y de 8 caracteres o mas. */
function cambiarClave_(ses, a) {
  var actual = String(a.actual || '').trim();
  var nueva = String(a.nueva || '');
  if (nueva.length < 8) throw new Error('La clave nueva debe tener al menos 8 caracteres.');
  if (!/[a-zA-Z]/.test(nueva) || !/[0-9]/.test(nueva)) throw new Error('La clave nueva debe tener letras y números.');
  return conBloqueo_(function () {
    olvidar_('Usuarios');
    var u = usuario_(ses.correo);
    if (!u) throw new Error('Usuario no encontrado.');
    var ok = u.clave_hash ? igualSeguro_(huellaClave_(u.sal, actual), u.clave_hash) : igualSeguro_(String(u.codigo).trim().toLowerCase(), actual.toLowerCase());
    if (!ok) throw new Error('La clave actual no es correcta.');
    if (nueva.toLowerCase() === String(u.codigo || '').toLowerCase() || nueva.toLowerCase() === actual.toLowerCase()) throw new Error('La clave nueva debe ser distinta de la anterior.');
    if (nueva.toLowerCase().indexOf(String(ses.correo).split('@')[0].toLowerCase()) >= 0) throw new Error('La clave no debe contener tu correo.');
    var sal = Utilities.getUuid();
    actualizar_('Usuarios', u._fila, { sal: sal, clave_hash: huellaClave_(sal, nueva), codigo: '', cambiar_clave: 'NO', intentos: '0', bloqueo: '' });
    return { ok: true };
  });
}

/** El asesor o el administrador reinician la clave: vuelve a una clave inicial que se debe cambiar. */
function reiniciarClave_(ses, a) {
  var correo = normCorreo_(a.correo);
  var global = GLOBALES_.indexOf(ses.rol) >= 0;
  if (!global && !puedeVer_(ses, correo)) throw new Error('Ese estudiante no está a tu cargo.');
  return conBloqueo_(function () {
    olvidar_('Usuarios');
    var u = usuario_(correo);
    if (!u) throw new Error('Usuario no encontrado.');
    if (global && rolesGestionables_(ses).indexOf(u.rol) < 0) throw new Error('No puedes reiniciar esa clave.');
    var c = claveInicial_(u.nombre);
    actualizar_('Usuarios', u._fila, { codigo: c, clave_hash: '', sal: '', cambiar_clave: 'SI', intentos: '0', bloqueo: '' });
    return { correo: correo, clave: c };
  });
}

/** Usuarios para el panel del administrador, sin huellas ni sales. La clave inicial solo se ve mientras no se cambia. */
function usuariosPublicos_() {
  return leer_('Usuarios').map(function (u) {
    var o = sinFila_(u);
    delete o.clave_hash; delete o.sal; delete o.bloqueo; delete o.intentos;
    o.pendiente = debeCambiar_(u) ? 'SI' : 'NO';
    return o;
  });
}

/** Deja constancia de cada ingreso en la pestana Accesos (se crea sola la primera vez). Nunca impide entrar. */
function registrarAcceso_(u) {
  try {
    var ss = libro_();
    var sh = ss.getSheetByName('Accesos');
    if (!sh) {
      sh = ss.insertSheet('Accesos');
      sh.getRange(1, 1, sh.getMaxRows(), 3).setNumberFormat('@');
      sh.getRange(1, 1, 1, 3).setValues([['fecha', 'correo', 'rol']]).setFontWeight('bold').setBackground('#E8E6FD');
      sh.setFrozenRows(1);
      olvidar_('Accesos');
      delete CACHE_['c_Accesos'];
    }
    agregar_('Accesos', { fecha: ahora_(), correo: normCorreo_(u.correo), rol: u.rol });
  } catch (e) { /* el registro de accesos es informativo */ }
}

/** Ingresos registrados, o lista vacia si la pestana aun no existe. */
function accesos_() {
  try { if (!libro_().getSheetByName('Accesos')) return []; return leer_('Accesos'); } catch (e) { return []; }
}

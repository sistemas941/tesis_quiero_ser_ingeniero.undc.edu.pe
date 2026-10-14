// ------------------------------------------------------------------ mi expediente: respaldo y paso a la version 2
function expedienteConfigHtml() {
  var h = '<section class="conf-sec"><h3>Mi expediente</h3>';
  h += '<p class="pequeno tenue">Un archivo con todo tu trabajo: campos del plan, biblioteca, borrador y figuras. ' + (SERVIDOR ? 'Sirve como respaldo, y para traer aquí lo que hiciste en la versión 1 de la aplicación.' : 'Sirve como respaldo y para pasar tu trabajo a la versión 2 de la aplicación. Va firmado: así la versión 2 reconoce la aprobación de tu plan.') + '</p>';
  h += '<div class="fila" style="margin-top:8px"><button class="btn chico" data-a="exportarExpediente">' + IC.doc + 'Descargar mi expediente</button>' +
    (SERVIDOR ? '<button class="btn chico primario" data-a="importarExpediente">Importar desde la versión 1</button><input type="file" id="archivo-expediente" accept=".json,application/json" hidden>' : '') + '</div>';
  h += '<div id="exp-res" class="pequeno" style="margin-top:6px"></div></section>';
  return h;
}

/** Descarga un contenido como archivo desde el navegador. */
function descargarComoArchivo(nombre, contenido, tipo, base64) {
  var datos = contenido;
  if (base64) { var bin = atob(contenido), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); datos = arr; }
  var url = URL.createObjectURL(new Blob([datos], { type: tipo }));
  var a = document.createElement('a');
  a.href = url; a.download = nombre; a.rel = 'noopener';
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
}

function exportarExpediente(btn) {
  var fin = ocupar(btn, 'Preparando');
  guardarAhora().catch(function () {}).then(function () { return llamar('exportarExpediente'); }).then(function (r) {
    fin();
    try { descargarComoArchivo(r.nombre, r.contenido, 'application/json'); } catch (e) { /* la descarga directa puede estar bloqueada dentro de Google Sites */ }
    var res = $('#exp-res');
    if (res) res.innerHTML = 'Listo: <b>' + esc(r.nombre) + '</b>' + (r.firmado ? ' (firmado).' : '.') + (r.url ? ' Si no se descargó, <a href="' + esc(enlace(r.url)) + '" target="_blank" rel="noopener">ábrelo desde aquí</a>.' : '');
    toast('Tu expediente está listo.', 'bien');
  }).catch(function (e) { fin(); fallo(e); });
}

function importarExpediente() {
  var input = $('#archivo-expediente');
  if (!input) return;
  input.value = '';
  input.onchange = function () {
    var f = input.files && input.files[0];
    if (!f) return;
    if (f.size > 40 * 1024 * 1024) { toast('El archivo es demasiado grande.', 'error'); return; }
    var lector = new FileReader();
    lector.onload = function () {
      S.importacion = String(lector.result || '');
      var res = $('#exp-res');
      if (res) res.textContent = 'Revisando el archivo…';
      llamar('importarExpediente', { contenido: S.importacion }).then(function (r) { verResumenImportacion(r.resumen); }).catch(function (e) { if (res) res.textContent = ''; S.importacion = null; fallo(e); });
    };
    lector.readAsText(f);
  };
  input.click();
}

function verResumenImportacion(x) {
  var h = '<h2>Importar mi expediente</h2>';
  h += '<p class="tenue">Archivo de <b>' + esc(x.correo) + '</b>, generado el ' + esc(fechaCorta(x.generado)) + ' en la ' + (x.origen === 'v2' ? 'versión 2' : 'versión 1') + '.</p>';
  h += '<div class="aviso ' + (x.firmado ? 'verde' : 'ambar') + '" style="margin-top:10px">' + (x.firmado ? 'La firma es válida: se importa todo, incluidos la aprobación del plan, el avance de las etapas y los comentarios de tu asesor.' : 'El archivo no tiene una firma válida: se importa solo tu contenido (campos del plan, biblioteca y borrador). Las aprobaciones tendrán que darse de nuevo.') + '</div>';
  h += '<ul style="margin:12px 0 0 18px"><li>' + x.campos + ' campos del plan con contenido</li><li>' + x.estudios + ' estudios de la biblioteca</li><li>' + x.secciones + ' secciones del borrador</li><li>' + x.figuras + ' figuras' + (x.figurasOmitidas ? ' (' + x.figurasOmitidas + ' no entraron en el archivo)' : '') + '</li>' + (x.firmado ? '<li>' + x.etapas + ' etapas con su avance' + (x.planAprobado ? '; plan aprobado' : '') + '</li>' : '') + '</ul>';
  h += '<div class="aviso gris pequeno" style="margin-top:12px">Lo que tienes ahora en esta versión se reemplaza. Antes se guarda una copia de respaldo.</div>';
  h += '<div class="fila" style="justify-content:flex-end;margin-top:14px"><button class="btn" data-a="cerrarModal">Cancelar</button><button class="btn primario" data-a="confirmarImportacion">Importar</button></div>';
  modal(h);
}

function confirmarImportacion(btn) {
  if (!S.importacion) { cerrarModal(); return; }
  var fin = ocupar(btn, 'Importando');
  llamar('importarExpediente', { contenido: S.importacion, confirmar: true }).then(function (r) {
    fin();
    S.importacion = null;
    cerrarModal();
    toast('Expediente importado.' + (r.aviso ? ' ' + r.aviso : ''), r.aviso ? '' : 'bien');
    setTimeout(function () { location.reload(); }, 1200);
  }).catch(function (e) { fin(); fallo(e); });
}

function descargarDatos(btn) {
  var fin = ocupar(btn, 'Preparando el Excel');
  llamar('descargarDatos').then(function (r) {
    fin();
    descargarComoArchivo(r.nombre, r.base64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', true);
  }).catch(function (e) { fin(); fallo(e); });
}

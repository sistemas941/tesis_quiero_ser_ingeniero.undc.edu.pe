// ------------------------------------------------------------------ eventos
var ACCIONES = {
  nada: function () {},
  pestanaIngreso: function (el) { verIngreso(el.getAttribute('data-p')); },
  cerrarModal: function () {
    cerrarModal();
    // Quien recien llega vuelve al titulo en cuanto cierra la ventana de su codigo
    if (S.vista === 'tesis' && !String(S.exp.titulo || '').trim() && window.innerWidth > 980) { var t = $('#f-titulo'); if (t) t.focus({ preventScroll: true }); }
  },
  ir: function (el) { if (!$('#modal').hidden && !S.copia) cerrarModal(); ir(el.getAttribute('data-v'), el.getAttribute('data-p') || ''); },
  modoIA: function () { abrirModoIA(); },
  exportarExpediente: function (el) { exportarExpediente(el); },
  importarExpediente: function () { importarExpediente(); },
  confirmarImportacion: function (el) { confirmarImportacion(el); },
  descargarDatos: function (el) { descargarDatos(el); },
  modoCompleto: function () { cerrarModal(); ponerModo('completo'); ir('ruta'); },
  modoSencillo: function () { cerrarModal(); ponerModo('sencillo'); ir('tesis'); },
  profundizar: function (el) { profundizar(el.getAttribute('data-campo')); },
  desglosar: function () { if (String(S.exp.titulo || '').trim().split(/\s+/).length < 4) { toast('Escribe primero tu título, aunque sea provisional.'); irCampo('titulo'); return; } pedirIA('desglosar', ''); },
  usarPiezas: function () { usarPiezas(); },
  descargarWord: function (el) { descargarWord(el); },
  verDoc: function () { verDoc(); },
  docIr: function (el) { docIr(el.getAttribute('data-c')); },
  elegirVia: function (el) { elegirVia(el.getAttribute('data-v')); },
  olvidarClave: function (el) { olvidarClave(el.getAttribute('data-p')); },
  elegirProv: function (el) { S.provForm = el.getAttribute('data-p'); var m = $('#modal'), y = m.scrollTop; abrirModoIA(); m.scrollTop = y; },
  usarProv: function (el) { usarProv(el.getAttribute('data-p')); },
  copiarConsulta: function (el) { copiarConsulta(el); },
  enviarPegado: function (el) { enviarPegado(el); },
  cerrarSinRevision: function (el) { cerrarSinRevision(el); },
  cancelarCopia: function () { cancelarCopia(); },
  ancla: function (el) { var n = document.getElementById('or-' + el.getAttribute('data-p')); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  salir: function () { guardarAhora().catch(function () {}).then(function () { salir(false); }); },
  abrirEtapa: function (el) {
    var id = el.getAttribute('data-e');
    if (!accesible(id)) { toast('Esa etapa se abre cuando apruebes la anterior.'); return; }
    if (S.ia && S.ia.etapa !== id) S.ia = null;
    ir('etapa', id);
  },
  verItem: function (el) { S.ia = { modo: 'item', n: parseInt(el.getAttribute('data-n'), 10), etapa: S.etapa }; pintarAsistente(); abrirAsistente(); },
  ia: function (el) { pedirIA(el.getAttribute('data-modo'), el.getAttribute('data-campo') || ''); },
  citar: function (el) { abrirCitar(el.getAttribute('data-campo')); },
  agregarFila: function (el) { agregarFila(el.getAttribute('data-campo')); },
  quitarFila: function (el) { quitarFila(el.getAttribute('data-campo'), parseInt(el.getAttribute('data-i'), 10)); },
  cerrarEtapa: function (el) { cerrarEtapa(el); },
  excepcion: function () { abrirExcepcion(); },
  enviarExcepcion: function (el) { enviarExcepcion(el); },
  irCampo: function (el) { cerrarAsistente(); irCampo(el.getAttribute('data-campo')); },
  abrirAsistente: function () { abrirAsistente(); },
  cerrarAsistente: function () { cerrarAsistente(); },
  limpiarIA: function () { S.ia = null; pintarAsistente(); cerrarAsistente(); },
  usarPropuesta: function (el) { usarPropuesta(el.getAttribute('data-como')); },
  descartarPropuesta: function () { descartarPropuesta(); cerrarAsistente(); },
  evaluarJurado: function () { evaluarJurado(); },
  insertarCita: function (el) { insertarCita(el.getAttribute('data-k')); },
  irBiblioteca: function () { cerrarModal(); ir('biblioteca'); },
  pestanaBib: function (el) { S.pestana = el.getAttribute('data-p'); $('#agregar').innerHTML = agregarHtml(); },
  verResumen: function (el) { var r = $('#res-' + el.getAttribute('data-i')); if (r) { r.classList.toggle('abierto'); el.textContent = r.classList.contains('abierto') ? 'Ocultar resumen' : 'Ver resumen completo'; } },
  agregarResultado: function (el) { agregarResultado(parseInt(el.getAttribute('data-i'), 10), el); },
  alternarFicha: function (el) {
    var id = el.getAttribute('data-id');
    if (S.abiertos[id]) delete S.abiertos[id]; else S.abiertos[id] = true;
    var b = S.d.biblioteca.filter(function (x) { return x.id === id; })[0], nodo = $('#e-' + id);
    if (b && nodo) { nodo.outerHTML = estudioHtml(b); crecerTodos($('#e-' + id)); }
  },
  resumirEstudio: function (el) { resumirEstudio(el.getAttribute('data-id'), el); },
  pedirBorrar: function (el) { pedirBorrar(el.getAttribute('data-id')); },
  borrarEstudio: function (el) { borrarEstudio(el.getAttribute('data-id'), el); },
  evaluarGrupo: function (el) { evaluarGrupo(el.getAttribute('data-g'), el); },
  generarPlan: function (el) { generarPlan(el); },
  verAlumno: function (el) { verAlumno(el.getAttribute('data-correo')); },
  tabAlumno: function (el) { S.alumnoTab = el.getAttribute('data-t'); var y = window.scrollY; ir('alumno').then(function () { window.scrollTo(0, y); }); },
  decidir: function (el) { decidir(el.getAttribute('data-d'), el); },
  comentar: function (el) { comentar(el); },
  editarUsuario: function (el) { editarUsuario(el.getAttribute('data-correo')); },
  revisarSeccion: function (el) { revisarSeccion(el.getAttribute('data-id'), el.getAttribute('data-e'), el); },
  siguienteRevision: function () { siguienteRevision(); },
  aprobarSeccion: function (el) { aprobarSeccion(el.getAttribute('data-id'), el); },
  devolverSeccion: function (el) { devolverSeccion(el.getAttribute('data-id')); },
  confirmarDevolver: function (el) { confirmarDevolver(el.getAttribute('data-id'), el); },
  reiniciarClave: function (el) { reiniciarClaveAlumno(el); },
  actualizarTablero: function (el) { actualizarTablero(el); },
  ordenTablero: function (el) { ordenarTablero(el.getAttribute('data-t'), el.getAttribute('data-k')); },
  filtroTablero: function (el) { S.filtroTab = el.getAttribute('data-f'); pintarTablaTablero(); },
  exportarTablero: function () { exportarTablero(); },
  cambiarModoDesdeCopia: function () { cancelarCopia(); abrirModoIA(); },
  refrescarDatos: function (el) { var fin = ocupar(el, 'Recargando'); llamar('refrescarDatos').then(function () { fin(); toast('Listo: la aplicación ya usa lo último de la hoja de datos.', 'bien'); }).catch(function (e) { fin(); fallo(e); }); },
  humanizar: function (el) { abrirHumanizar(el.getAttribute('data-campo')); },
  humanizarSiguiente: function () { humanizarSiguiente(); },
  cerrarHum: function () { cerrarHum(); },
  configurar: function () { abrirConfig(); },
  consTodos: function () { var l = (S.cons || {}).resultados || [], libres = l.filter(function (r) { return !r.ya; }), todos = libres.every(function (r) { return r.sel; }); libres.forEach(function (r) { r.sel = !todos; }); pintarCons(); },
  consAgregar: function (el) { consAgregar(el); },
  consEstado: function (el) { consEstado(el); },
  guardarEstadoArte: function (el) { guardarEstadoArte(el); },
  olvidarConsensus: function () { olvidarConsensus(); },
  abrirConsensus: function () { cerrarModal(); S.pestana = 'consensus'; ir('biblioteca'); },
  aprobarBloque: function (el) { aprobarBloque(+el.getAttribute('data-i'), el); },
  devolverBloque: function (el) { devolverBloque(+el.getAttribute('data-i')); },
  confirmarDevolverBloque: function (el) { confirmarDevolverBloque(+el.getAttribute('data-i'), el); },
  aprobarRevisadas: function (el) { aprobarRevisadas(el); },
  tema: function (el) { var t = el.getAttribute('data-t'); ponerLocal(llaveLocal('qsi_tema'), t); aplicarTema(t); abrirConfig(); },
  chatPreferido: function (el) { ponerLocal(llaveLocal('qsi_chat'), el.getAttribute('data-c')); abrirConfig(); toast('Listo: ese asistente aparecerá primero al copiar y pegar.', 'bien'); },
  estiloCitas: function (el) { cambiarEstilo(el.getAttribute('data-e'), el); },
  importar: function () { abrirImportar(); },
  impTexto: function () { impTexto(); },
  impVolver: function () { abrirImportar(); },
  impIA: function (el) { impIA(el); },
  impImportar: function (el) { impImportar(el); },
  impDeshacer: function (el) { impDeshacer(el); },
  refDetectar: function () { refDetectar(); },
  refIA: function (el) { refIA(el); },
  refAgregar: function (el) { refAgregar(el); },
  // borrador de tesis
  infAbrir: function (el) { abrirSeccion(el.getAttribute('data-id')); },
  infIrSec: function (el) { nInf().sel = el.getAttribute('data-id'); nInf().texto = undefined; ir('borrador'); },
  infGuardar: function () { guardarInf().catch(function () {}); },
  infGuardarYCambiar: function (el) { var fin = ocupar(el, 'Guardando'); guardarInf().then(function () { fin(); cerrarModal(); abrirSeccion(nInf().pendienteAbrir, true); }).catch(function () { fin(); }); },
  infCambiarSinGuardar: function () { cerrarModal(); var I = nInf(); ponerLocal(llaveBorrador(I.sel), JSON.stringify({ t: I.texto, base: I.base, h: Date.now() })); abrirSeccion(I.pendienteAbrir, true); },
  infGuardarEncima: function () { cerrarModal(); guardarInf('encima').catch(function () {}); },
  infVerGuardada: function () { cerrarModal(); var I = nInf(); ponerLocal(llaveBorrador(I.sel), JSON.stringify({ t: I.texto, base: I.base, h: Date.now() })); delete I.textos[I.sel]; abrirSeccion(I.sel, true); },
  infRecuperar: function () { var I = nInf(), r = I.recuperar; if (!r) return; I.recuperar = null; repintarInf(); var ta = areaInf(); if (ta) mdReemplazar(ta, 0, ta.value.length, r.t, 0); },
  infDescartarLocal: function () { var I = nInf(); ponerLocal(llaveBorrador(I.sel), ''); I.recuperar = null; repintarInf(); },
  infPrevia: function () { var I = nInf(); I.previa = !I.previa; repintarInf(); if (I.previa && /\$/.test(I.texto || '')) cargarKatex().then(pintarPreviaInf); },
  infTraer: function () { abrirTraerInf(); },
  infTraerHacer: function (el) { traerInf(el.getAttribute('data-m'), el); },
  infLista: function (el) { marcarListaInf(el); },
  infWord: function (el) { wordInf(el); },
  infSimilitud: function (el) { similitudInf(el); },
  infSolicitar: function () { abrirSolicitudPlan(); },
  infEnviarSolicitud: function (el) { enviarSolicitudPlan(el); },
  mdOp: function (el) { mdOp(el.getAttribute('data-op')); },
  infCitarK: function (el) { citarInf(el.getAttribute('data-k')); },
  tbDims: function () { tbDims(); },
  tbInsertar: function () { tbInsertar(); },
  fgModo: function (el) { fgModo(el.getAttribute('data-m')); },
  fgInsertar: function (el) { fgInsertar(el); },
  eqAtajo: function (el) { eqAtajo(+el.getAttribute('data-i')); },
  eqEjemplo: function (el) { var t = $('#eq-tex'); if (t) { t.value = EQ_EJEMPLOS[+el.getAttribute('data-i')][1]; pintarEq(); } },
  eqModo: function (el) { nInf().eq.modo = el.getAttribute('data-m'); $$('[data-a=eqModo]').forEach(function (b) { b.classList.toggle('activo', b === el); }); },
  eqInsertar: function () { eqInsertar(); },
  infConsSug: function (el) { var q = $('#inf-cons-q'), s = secInf(nInf().sel); if (q && s) q.value = consultasInf(s)[+el.getAttribute('data-i')]; },
  infConsCitar: function (el) { consCitarInf(el); },
  infConsContraste: function (el) { consContrasteInf(el); },
  docModo: function (el) { S.docModo = el.getAttribute('data-m'); ir('documento'); },
  // aprobación del plan (coordinación) y revisión del borrador (asesor)
  aprobarPlan: function () { abrirAprobarPlan(); },
  confirmarAprobarPlan: function (el) { confirmarAprobarPlan(el); },
  resolverCambio: function (el) { resolverCambio(el.getAttribute('data-d')); },
  confirmarResolver: function (el) { confirmarResolver(el.getAttribute('data-d'), el); },
  revInf: function (el) { revInf(el.getAttribute('data-id'), el.getAttribute('data-d'), el); },
  refTodas: function () { var x = S.extraer || {}, l = x.lista || [], todas = l.every(function (o) { return o.sel; }); l.forEach(function (o) { o.sel = !todas; }); pintarExtraidas(); }
};
var FORMULARIOS = { infConsensus: buscarConsInf, probarConsensus: probarConsensus, consensus: buscarConsensus, claveConsensus: guardarClaveConsensus, miClave: cambiarMiClave, ingresar: enviarIngreso, registrar: enviarRegistro, cambiarClave: enviarCambioClave, buscar: buscarEstudios, porDoi: agregarPorDoi, aMano: agregarAMano, ficha: guardarFicha, usuario: guardarUsuario, claveIA: probarClave };

document.addEventListener('click', function (ev) {
  if (ev.target.id === 'modal') { if (!S.copia) cerrarModal(); return; }
  var chat = ev.target.closest ? ev.target.closest('[data-chat]') : null;
  if (chat) ponerLocal(llaveLocal('qsi_chat'), chat.getAttribute('data-chat'));
  var el = ev.target.closest ? ev.target.closest('[data-a]') : null;
  if (!el || el.disabled) return;
  var f = ACCIONES[el.getAttribute('data-a')];
  if (f) f(el, ev);
});
document.addEventListener('submit', function (ev) {
  var form = ev.target, f = FORMULARIOS[form.getAttribute('data-f')];
  if (!f) return;
  ev.preventDefault();
  f(form);
});
function alCambiar(ev) {
  var t = ev.target;
  if (!t || !t.getAttribute) return;
  if (t.getAttribute('data-campo')) { alEscribir(t); return; }
  if (t.id === 'inf-texto') { if (ev.type === 'input') infEscribio(t); return; }
  if (t.id === 'inf-cita-q') { var lc = $('#inf-cita-l'); if (lc) lc.innerHTML = listaCitasInf(t.value); return; }
  if (t.id === 'eq-tex') { if (ev.type === 'input') pintarEq(); return; }
  if (t.id === 'fg-archivo') { if (ev.type === 'change' && t.files && t.files[0]) fgLeer(t.files[0]); return; }
  if (t.getAttribute('data-infcons') !== null) { if (ev.type !== 'change') return; var ic = ((nInf().cons || {}).resultados || [])[+t.getAttribute('data-infcons')]; if (ic) { ic.sel = t.checked; pintarConsInf(); } return; }
  if (t.id === 'filtro-cita') { filtrarCitas(t.value); return; }
  if (t.id === 'filtro-usuarios') { if (ev.type !== 'input') return; S.filtroUsuarios = t.value; var fu = $('#filas-usuarios'); if (fu) fu.innerHTML = filasUsuariosHtml(); return; }
  if (t.id === 'buscar-tablero') { if (ev.type !== 'input') return; S.buscaTab = t.value; pintarTablaTablero(); return; }
  if (t.getAttribute('data-cambio') === 'tipoMano') { cambiarTipoMano(); return; }
  if (t.id === 'imp-archivo' || t.id === 'ref-archivo') { if (ev.type !== 'change' || !t.files || !t.files[0]) return; if (t.id === 'imp-archivo') impLeer(t.files[0]); else refLeer(t.files[0]); return; }
  if (t.getAttribute('data-cons') !== null) { if (ev.type !== 'change') return; var rc = ((S.cons || {}).resultados || [])[+t.getAttribute('data-cons')]; if (rc) { rc.sel = t.checked; pintarCons(); } return; }
  if (t.getAttribute('data-ea') !== null) { if (ev.type !== 'change') return; var be = (S.estadoArte || { brechas: [] }).brechas[+t.getAttribute('data-ea')]; if (be) { be.sel = t.checked; t.closest('.ref-cand').classList.toggle('sel', t.checked); } return; }
  if (t.getAttribute('data-imp')) { if (ev.type === 'change') impCambio(t); return; }
  if (t.getAttribute('data-ref') !== null) { if (ev.type !== 'change') return; var o = (S.extraer.lista || [])[+t.getAttribute('data-ref')]; if (o) { o.sel = t.checked; pintarExtraidas(); } return; }
  if (t.getAttribute('data-cambio') === 'frase') { pintarFrase(); return; }
  if (t.getAttribute('data-k') === 'uso') { var form = t.closest('form'); var bloque = form ? $('#ant-' + form.getAttribute('data-id')) : null; if (bloque) { bloque.hidden = t.value !== 'antecedente'; crecerTodos(bloque); } return; }
  if (t.tagName === 'TEXTAREA' && t.id !== 'hum-t') crecer(t);
}
document.addEventListener('input', alCambiar);
document.addEventListener('change', alCambiar);
document.addEventListener('focusin', function (ev) {
  if (!(ev.target && ev.target.getAttribute && ev.target.getAttribute('data-campo'))) return;
  S.foco = ev.target;
  if (S.vista === 'tesis') enfocarDoc(ev.target.getAttribute('data-campo'));
});
document.addEventListener('keydown', function (ev) {
  // En el borrador: Ctrl+S guarda; Ctrl+B y Ctrl+I dan formato
  if ((ev.ctrlKey || ev.metaKey) && S.vista === 'borrador' && !ev.altKey) {
    var k = String(ev.key || '').toLowerCase();
    if (k === 's') { ev.preventDefault(); if ($('#modal').hidden) guardarInf().catch(function () {}); return; }
    if (ev.target && ev.target.id === 'inf-texto' && (k === 'b' || k === 'i')) { ev.preventDefault(); mdOp(k); return; }
  }
  if (ev.key === 'Escape') { if (!$('#modal').hidden) { if (!S.copia) cerrarModal(); } else cerrarAsistente(); }
  if (ev.key === 'Enter' && ev.target && ev.target.classList && ev.target.classList.contains('clic')) ev.target.click();
});
// Arrastrar un archivo sobre una zona de carga
['dragover', 'dragenter'].forEach(function (n) { document.addEventListener(n, function (ev) { var z = ev.target.closest ? ev.target.closest('.zona-archivo') : null; if (z) { ev.preventDefault(); z.classList.add('encima'); } }); });
document.addEventListener('dragleave', function (ev) { var z = ev.target.closest ? ev.target.closest('.zona-archivo') : null; if (z) z.classList.remove('encima'); });
document.addEventListener('drop', function (ev) {
  var z = ev.target.closest ? ev.target.closest('.zona-archivo') : null;
  if (!z) return;
  ev.preventDefault();
  z.classList.remove('encima');
  var f = ev.dataTransfer && ev.dataTransfer.files ? ev.dataTransfer.files[0] : null;
  if (!f) return;
  if (z.getAttribute('data-zona') === 'imp-archivo') impLeer(f); else if (z.getAttribute('data-zona') === 'fg-archivo') fgLeer(f); else refLeer(f);
});
window.addEventListener('beforeunload', function (ev) {
  if (Object.keys(S.pend).length) { guardarAhora().catch(function () {}); ev.preventDefault(); ev.returnValue = ''; }
  else if (S.inf && S.inf.sucio) { ponerLocal(llaveBorrador(S.inf.sel), JSON.stringify({ t: S.inf.texto, base: S.inf.base, h: Date.now() })); ev.preventDefault(); ev.returnValue = ''; }
});

arrancar();

/* ==========================================================================
   HOTEL NORTE — INTERFAZ MODAL Y FORMULARIO DE FACTURACIÓN D2FAC
   Archivo: src/modules/billing/d2fac-modal.js
   ========================================================================== */

function seleccionarModoFacturaCin(modo) {
  const inputModo = document.getElementById('cin-modo-factura');
  if (inputModo) inputModo.value = modo;

  const btnNinguna = document.getElementById('btn-modo-fac-ninguna');
  const btnUsuario = document.getElementById('btn-modo-fac-usuario');
  const btnEmpresa = document.getElementById('btn-modo-fac-empresa');
  const fields = document.getElementById('cin-factura-fields');
  const txtBanner = document.getElementById('cin-texto-modo-factura');
  const lblRuc = document.getElementById('lbl-cin-ruc');
  const lblRazon = document.getElementById('lbl-cin-razon');

  const activeCls = 'p-2.5 rounded-lg border text-left transition flex flex-col justify-between bg-blue-950/90 border-sky-400 text-white shadow-sm';
  const inactiveCls = 'p-2.5 rounded-lg border text-left transition flex flex-col justify-between bg-slate-900/50 border-slate-700 text-slate-300 hover:border-blue-500';

  if (btnNinguna) btnNinguna.className = modo === 'ninguna' ? activeCls : inactiveCls;
  if (btnUsuario) btnUsuario.className = modo === 'usuario' ? activeCls : inactiveCls;
  if (btnEmpresa) btnEmpresa.className = modo === 'empresa' ? activeCls : inactiveCls;

  if (modo === 'ninguna') {
    if (fields) fields.classList.add('hidden');
    return;
  }

  if (fields) fields.classList.remove('hidden');

  if (modo === 'usuario') {
    if (txtBanner) txtBanner.innerText = 'Modo 2: Factura con los datos personales del huésped (Cédula o RUC personal).';
    if (lblRuc) lblRuc.innerText = 'Cédula / RUC del Huésped *';
    if (lblRazon) lblRazon.innerText = 'Nombres y Apellidos del Huésped *';

    const ciHuesped = document.getElementById('cin-cedula')?.value.trim() || '';
    const nomHuesped = document.getElementById('cin-nombre')?.value.trim() || '';
    const procHuesped = document.getElementById('cin-procedencia')?.value.trim() || 'CUENCA';
    const telHuesped = document.getElementById('cin-telefono')?.value.trim() || '';

    document.getElementById('cin-ruc').value = ciHuesped;
    document.getElementById('cin-razon').value = nomHuesped;
    document.getElementById('cin-direccion').value = procHuesped || 'CUENCA';
    document.getElementById('cin-tel-factura').value = telHuesped;
    if (ciHuesped.length >= 10) {
      consultarClienteD2FacEnVivo(ciHuesped, false);
    }
  } else if (modo === 'empresa') {
    if (txtBanner) txtBanner.innerText = 'Modo 3: Factura corporativa con RUC de Empresa (el huésped queda registrado como ocupante).';
    if (lblRuc) lblRuc.innerText = 'RUC de la Empresa (13 dígitos) *';
    if (lblRazon) lblRazon.innerText = 'Razón Social de la Empresa *';

    const ciHuesped = document.getElementById('cin-cedula')?.value.trim() || '';
    const c = baseHistoricaHuespedes.find(x => x.cedula === ciHuesped);
    if (c && c.ruc && c.ruc.length === 13) {
      document.getElementById('cin-ruc').value = c.ruc;
      document.getElementById('cin-razon').value = c.razonSocial || '';
      document.getElementById('cin-correo').value = c.correo || '';
      document.getElementById('cin-direccion').value = c.direccion || 'CUENCA';
    } else {
      document.getElementById('cin-ruc').value = '';
      document.getElementById('cin-razon').value = '';
      document.getElementById('cin-correo').value = '';
      document.getElementById('cin-direccion').value = 'CUENCA';
      setTimeout(() => document.getElementById('cin-ruc')?.focus(), 80);
    }
  }
}

function limpiarFormularioEmisionD2Fac(mostrarMensajeLimpio = false) {
  const selHab = document.getElementById('d2fac-select-hab');
  const inpRuc = document.getElementById('d2fac-dir-ruc');
  const inpNom = document.getElementById('d2fac-dir-nombre');
  const inpEmail = document.getElementById('d2fac-dir-email');
  const inpDir = document.getElementById('d2fac-dir-direccion');
  const inpTel = document.getElementById('d2fac-dir-telefono');
  const inpTot = document.getElementById('d2fac-dir-total');
  const fb = document.getElementById('d2fac-dir-feedback');

  if (selHab) selHab.value = '';
  if (inpRuc) inpRuc.value = '';
  if (inpNom) inpNom.value = '';
  if (inpEmail) inpEmail.value = '';
  if (inpDir) inpDir.value = 'CUENCA';
  if (inpTel) inpTel.value = '';
  if (inpTot) inpTot.value = '';

  if (fb) {
    fb.innerText = mostrarMensajeLimpio
      ? '✓ Formulario limpio y listo para registrar una nueva factura electrónica.'
      : 'Concepto: SERVICIO DE HOSPEDAJE (Cód. x001 · IVA 15% desglosado automáticamente)';
  }
}

function emitirFacturaDesdeDetalle(modo) {
  if (!habitacionSeleccionada) return;
  const hab = habitacionSeleccionada;
  cerrarModalDetalle();
  abrirModalD2Fac(hab.id, modo);
}

function imprimirTicketFacturaHabActual() {
  if (!habitacionSeleccionada || !habitacionSeleccionada.facturaEmitida) return;
  const ca = habitacionSeleccionada.facturaEmitida.claveAcceso;
  window.open(D2FAC_CONFIG.apiBase + 'php/web/ws_imprimirComprobante.php?ca=' + ca + '&usuario=' + D2FAC_CONFIG.rucUsuario, '_blank');
}

function verPdfFacturaHabActual() {
  if (!habitacionSeleccionada || !habitacionSeleccionada.facturaEmitida) return;
  const ca = habitacionSeleccionada.facturaEmitida.claveAcceso;
  window.open(D2FAC_CONFIG.apiBase + 'php/web/ws_verComprobante.php?ca=' + ca + '&tipo=pdfVer', '_blank');
}

function abrirModalD2Fac(preselectHabId = null, preselectModo = 'usuario') {
  const selHab = document.getElementById('d2fac-select-hab');
  if (selHab) {
    const habs = obtenerHabitacionesDia(fechaSeleccionada).filter(h => h.estado === 'ocupada' || h.estado === 'reservada');
    selHab.innerHTML = '<option value="">— Seleccionar Habitación Activa —</option>' +
      habs.map(h => '<option value="' + h.id + '">Hab #' + h.numero + ' — ' + (h.huesped ? h.huesped.nombre : '') + ' ($' + (h.pagado || h.tarifa) + ')</option>').join('');
    if (preselectHabId) {
      selHab.value = String(preselectHabId);
      cargarDatosHabEnD2FacDirecto(preselectHabId);
    } else {
      limpiarFormularioEmisionD2Fac(false);
    }
  }
  cambiarTabEmisionDirectaD2Fac(preselectModo || 'usuario', !preselectHabId);
  document.getElementById('modal-d2fac').classList.remove('hidden');
  cargarFacturasRealesD2Fac();
}

function cerrarModalD2Fac() {
  document.getElementById('modal-d2fac').classList.add('hidden');
}

function cambiarTabEmisionDirectaD2Fac(modo, limpiarSiCambia = false) {
  document.getElementById('d2fac-dir-modo').value = modo;
  const btnU = document.getElementById('btn-d2fac-tab-usuario');
  const btnE = document.getElementById('btn-d2fac-tab-empresa');
  const lblRuc = document.getElementById('lbl-d2fac-dir-ruc');
  const lblNom = document.getElementById('lbl-d2fac-dir-nombre');

  if (modo === 'usuario') {
    btnU.className = 'px-3 py-1.5 rounded-md bg-blue-700 text-white font-semibold text-xs transition';
    btnE.className = 'px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs transition';
    lblRuc.innerText = 'Cédula / RUC del Usuario *';
    lblNom.innerText = 'Nombres y Apellidos del Usuario *';
    const habId = document.getElementById('d2fac-select-hab')?.value;
    if (habId) cargarDatosHabEnD2FacDirecto(habId);
  } else {
    btnE.className = 'px-3 py-1.5 rounded-md bg-blue-700 text-white font-semibold text-xs transition';
    btnU.className = 'px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs transition';
    lblRuc.innerText = 'RUC de la Empresa (13 dígitos) *';
    lblNom.innerText = 'Razón Social de la Empresa *';
    document.getElementById('d2fac-dir-ruc').value = '';
    document.getElementById('d2fac-dir-nombre').value = '';
    if (!limpiarSiCambia) document.getElementById('d2fac-dir-ruc').focus();
  }
}

function cargarDatosHabEnD2FacDirecto(habId) {
  if (!habId) {
    limpiarFormularioEmisionD2Fac(false);
    return;
  }
  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const hab = habs.find(h => String(h.id) === String(habId));
  if (!hab || !hab.huesped) return;

  const modo = document.getElementById('d2fac-dir-modo')?.value || 'usuario';
  if (modo === 'usuario') {
    document.getElementById('d2fac-dir-ruc').value = hab.huesped.cedula || '';
    document.getElementById('d2fac-dir-nombre').value = hab.huesped.nombre || '';
    document.getElementById('d2fac-dir-direccion').value = hab.huesped.procedencia || 'CUENCA';
    document.getElementById('d2fac-dir-telefono').value = hab.huesped.telefono || '';
  }
  const monto = (hab.pagado && hab.pagado > 0) ? hab.pagado : hab.tarifa;
  document.getElementById('d2fac-dir-total').value = Number(monto).toFixed(2);
}

async function buscarIdEnD2FacDirecto(valor, forzar = false) {
  const v = (valor || '').trim();
  if (!forzar && v.length !== 10 && v.length !== 13) return;
  if (v.length < 10) return;
  const fb = document.getElementById('d2fac-dir-feedback');
  if (fb) fb.innerText = 'Consultando RUC/Cédula ' + v + ' en D2Fac (SRI)...';
  const info = await consultarPersonaD2FacAPI(v);
  if (info) {
    document.getElementById('d2fac-dir-ruc').value = info.ruc;
    document.getElementById('d2fac-dir-nombre').value = info.nombres;
    if (info.email) document.getElementById('d2fac-dir-email').value = info.email;
    if (info.direccion) document.getElementById('d2fac-dir-direccion').value = info.direccion;
    if (info.telefono) document.getElementById('d2fac-dir-telefono').value = info.telefono;
    if (fb) fb.innerText = '✓ Datos cargados desde ' + info.origen + ': ' + info.nombres;
  } else {
    if (fb) fb.innerText = 'Identificación no registrada previamente en D2Fac. Ingrese el nombre o razón social.';
  }
}

async function ejecutarEmisionDirectaD2Fac() {
  const modo = document.getElementById('d2fac-dir-modo')?.value || 'usuario';
  const ruc = document.getElementById('d2fac-dir-ruc')?.value.trim();
  const nombres = document.getElementById('d2fac-dir-nombre')?.value.trim();
  const email = document.getElementById('d2fac-dir-email')?.value.trim() || 'hotelnortecuenca@gmail.com';
  const direccion = document.getElementById('d2fac-dir-direccion')?.value.trim() || 'CUENCA';
  const telefono = document.getElementById('d2fac-dir-telefono')?.value.trim() || '0999999999';
  const total = parseFloat(document.getElementById('d2fac-dir-total')?.value) || 0;
  const habId = document.getElementById('d2fac-select-hab')?.value;

  if (!ruc || !nombres) {
    UIModal.aviso({
      titulo: 'Datos Requeridos para Facturar',
      mensaje: 'Por favor complete la Cédula/RUC y el Nombre/Razón Social antes de emitir la factura electrónica.',
      tipo: 'alerta'
    });
    return;
  }

  if (total <= 0) {
    UIModal.aviso({
      titulo: 'Monto Requerido',
      mensaje: 'Ingrese el valor total en dólares (USD) a facturar.',
      tipo: 'alerta'
    });
    return;
  }

  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const habObj = habId ? habs.find(h => String(h.id) === String(habId)) : null;

  const btn = document.getElementById('btn-emitir-directo-d2fac');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Transmitiendo a D2Fac...';
  }

  await emitirFacturaD2FacAPI({
    modo,
    ruc,
    nombres,
    direccion,
    telefono,
    email,
    montoTotal: total,
    metodoPago: habObj?.metodoPago || 'Efectivo',
    habNumero: habObj ? habObj.numero : 'S/N',
    huespedNombre: habObj?.huesped?.nombre || nombres,
    habObj: habObj
  });

  if (btn) {
    btn.disabled = false;
    btn.innerText = 'Emitir y Autorizar Factura en D2Fac';
  }
  renderCuadrados();
  cargarFacturasRealesD2Fac();
}

/* ==========================================================================
   HOTEL NORTE — MODAL DE DETALLE Y GESTIÓN DE HABITACIÓN ACTIVA
   Archivo: src/modules/rooms/room-detail.js
   ========================================================================== */

function abrirModalDetalle(hab, contexto) {
  const post12 = esPost12PM();
  const pendiente = (fechaSeleccionada === FECHA_HOY) && hab.venceHoy && post12;

  document.getElementById('det-hab-num').innerText = '#' + hab.numero;
  document.getElementById('det-hab-tipo').innerText = (hab.piso || '') + ' · ' + hab.tipo + ' (' + (hab.descripcionCamas || '') + ') · Capacidad: ' + (hab.capacidad || hab.camas) + ' pers. · $' + hab.tarifa + '.00 / noche';
  document.getElementById('det-huesped-nombre').innerText = hab.huesped?.nombre || '—';
  document.getElementById('det-huesped-ci').innerText = hab.huesped?.cedula || '—';
  document.getElementById('det-huesped-proc').innerText = hab.huesped?.procedencia || '—';
  document.getElementById('det-huesped-tel').innerText = hab.huesped?.telefono || '—';

  document.getElementById('det-registrado-por').innerText = hab.registradoPor || 'No especificado';
  document.getElementById('det-turno-registro').innerText = hab.turnoRegistro || 'Turno previo';
  document.getElementById('det-hora-registro').innerText = hab.horaEntrada || hab.horaRegistro || '—';
  const elDetSalida = document.getElementById('det-hora-salida');
  if (elDetSalida) elDetSalida.innerText = hab.horaSalida || 'Alojado actualmente';

  document.getElementById('det-pagado').innerText = '$' + (hab.pagado || 0).toFixed(2);
  document.getElementById('det-debito').innerText = '$' + (hab.debito || 0).toFixed(2);
  document.getElementById('det-dotacion').innerText = hab.estado === 'reservada' ? 'Pendiente entrega' : (hab.controles + ' ctrl · ' + hab.toallas + ' toa');

  const avisoPas = document.getElementById('det-aviso-pasado-bloqueado');
  const avisoRes = document.getElementById('det-aviso-reserva-futura');
  const alerta12 = document.getElementById('det-alerta-12pm');
  [avisoPas, avisoRes, alerta12].forEach(el => el.classList.add('hidden'));

  const btnLN = document.getElementById('btn-det-lista-negra');
  const btnExt = document.getElementById('btn-det-extender');
  const btnCO = document.getElementById('btn-det-checkout');
  const btnAb = document.getElementById('btn-det-abonar');
  const btnCan = document.getElementById('btn-det-cancelar-reserva');
  const btnCer = document.getElementById('btn-det-cerrar-pasado');
  const btnCheckin = document.getElementById('btn-det-hacer-checkin');
  const btnCambiarHab = document.getElementById('btn-det-cambiar-hab');
  [btnLN, btnExt, btnCO, btnAb, btnCan, btnCer, btnCheckin, btnCambiarHab].forEach(el => { if (el) el.classList.add('hidden'); });

  if (contexto === 'pasado') {
    document.getElementById('det-hab-estado').innerText = 'Archivo Histórico (Solo Lectura)';
    avisoPas.classList.remove('hidden');
    btnCer.classList.remove('hidden');
  } else if (contexto === 'reserva' || hab.estado === 'reservada') {
    document.getElementById('det-hab-estado').innerText = hab.origenBooking ? 'Habitación Pre-Asignada (Booking.com)' : 'Habitación con Reserva Pendiente';
    avisoRes.classList.remove('hidden');
    if (btnCheckin) btnCheckin.classList.remove('hidden');
    if (btnCambiarHab) btnCambiarHab.classList.remove('hidden');
    btnLN.classList.remove('hidden');
    btnAb.classList.remove('hidden');
    btnCan.classList.remove('hidden');
  } else {
    document.getElementById('det-hab-estado').innerText = pendiente ? 'Verificación de Salida (12:00 PM)' : 'Habitación Ocupada (Check-in Realizado)';
    if (pendiente) alerta12.classList.remove('hidden');
    btnLN.classList.remove('hidden');
    btnExt.classList.remove('hidden');
    btnCO.classList.remove('hidden');
  }

  const txtFac = document.getElementById('det-estado-factura-txt');
  const btnsEmitida = document.getElementById('det-botones-factura-emitida');
  const btnsEmitirAhora = document.getElementById('det-botones-emitir-ahora');
  if (txtFac && btnsEmitida && btnsEmitirAhora) {
    if (hab.facturaEmitida && hab.facturaEmitida.claveAcceso) {
      const tipoEtq = hab.facturaEmitida.modo === 'empresa' ? 'Datos de Empresa' : 'Datos del Usuario';
      txtFac.innerHTML = '<span class="text-emerald-400 font-bold">FACTURA EMITIDA (' + tipoEtq + '):</span> ' +
        '<span class="font-mono text-sky-300">' + (hab.facturaEmitida.secuencial || '001-002') + '</span> · ' +
        hab.facturaEmitida.nombres + ' (' + hab.facturaEmitida.ruc + ')';
      btnsEmitida.classList.remove('hidden');
      btnsEmitirAhora.classList.add('hidden');
    } else {
      txtFac.innerText = 'No solicitada por el cliente (Puede emitirla si el huésped la requiere)';
      btnsEmitida.classList.add('hidden');
      if (contexto === 'pasado') {
        btnsEmitirAhora.classList.add('hidden');
      } else {
        btnsEmitirAhora.classList.remove('hidden');
      }
    }
  }

  // Consumos de Bar / Frigobar
  const seccionBar = document.getElementById('det-seccion-bar-cargos');
  const listaBar = document.getElementById('det-bar-lista-cargos');
  const totalBarEl = document.getElementById('det-bar-total-cargos');
  if (seccionBar && listaBar && totalBarEl) {
    if (hab.cargosBar && hab.cargosBar.length > 0) {
      seccionBar.classList.remove('hidden');
      let sumaBar = 0;
      listaBar.innerHTML = hab.cargosBar.map(c => {
        sumaBar += (c.total || 0);
        return `<div class="flex items-center justify-between border-b border-slate-100 pb-1">
          <span><strong>${c.cantidad}x</strong> ${c.producto} <span class="text-slate-400">(${c.hora})</span></span>
          <strong class="font-mono text-slate-800">$${Number(c.total).toFixed(2)}</strong>
        </div>`;
      }).join('');
      totalBarEl.innerText = 'Total Consumos: $' + sumaBar.toFixed(2);
    } else {
      seccionBar.classList.add('hidden');
      listaBar.innerHTML = '';
      totalBarEl.innerText = '';
    }
  }

  document.getElementById('modal-detalle-hab').classList.remove('hidden');
}

function cerrarModalDetalle() {
  document.getElementById('modal-detalle-hab').classList.add('hidden');
}

function extenderEstadiaModal() {
  if (!habitacionSeleccionada) return;
  habitacionSeleccionada.venceHoy = false;
  habitacionSeleccionada.pagado += habitacionSeleccionada.tarifa;
  registrarAccion('RENOVACIÓN', 'Hab #' + habitacionSeleccionada.numero + ' renovada por 1 día adicional ($' + habitacionSeleccionada.tarifa + ')', habitacionSeleccionada.numero);

  if (sesionActiva) {
    sesionActiva.totalPagado += habitacionSeleccionada.tarifa;
    sesionActiva.totalEfectivo += habitacionSeleccionada.tarifa;
    guardarStorage('sesion_activa', sesionActiva);
  }
  guardarStorage('registros_diarios', registrosDiarios);
  cerrarModalDetalle();
  renderCuadrados();
}

function reportarHuespedListaNegra() {
  if (!habitacionSeleccionada || !habitacionSeleccionada.huesped) return;
  const nom = habitacionSeleccionada.huesped.nombre || 'el huésped';
  const ci = habitacionSeleccionada.huesped.cedula || '';

  UIModal.confirmar({
    titulo: 'Reportar Restricción de Ingreso',
    subtitulo: 'Hotel Norte · Seguridad y Control',
    mensaje: `¿Desea registrar una alerta restrictiva para el huésped "${nom}" (ID: ${ci}) en la base de datos de Hotel Norte?`,
    textoConfirmar: 'Sí, Registrar Restricción',
    tipo: 'alerta',
    onConfirm: () => {
      const idx = baseHistoricaHuespedes.findIndex(c => c.cedula === ci);
      if (idx >= 0) {
        baseHistoricaHuespedes[idx].esListaNegra = true;
        baseHistoricaHuespedes[idx].motivoListaNegra = 'Reportado desde recepción / Incumplimiento de políticas';
      } else {
        baseHistoricaHuespedes.push({
          cedula: ci,
          nombre: nom,
          esListaNegra: true,
          motivoListaNegra: 'Reportado desde recepción / Incumplimiento de políticas'
        });
      }
      guardarStorage('huespedes_db', baseHistoricaHuespedes);
      registrarAccion('RESTRICCIÓN', `${nom} (ID: ${ci}) registrado con restricción`, habitacionSeleccionada.numero);
      UIModal.aviso({
        titulo: 'Registro de Restricción Guardado',
        mensaje: `El titular ${nom} fue marcado con alerta restrictiva para futuras consultas en el sistema.`,
        tipo: 'alerta'
      });
    }
  });
}

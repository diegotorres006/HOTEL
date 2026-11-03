/* ==========================================================================
   HOTEL NORTE — GESTIÓN DE RESERVAS, ABONOS Y REASIGNACIÓN DE HABITACIONES
   Archivo: src/modules/rooms/reservations.js
   ========================================================================== */

function abrirModalAbonoReserva() {
  if (!habitacionSeleccionada) return;
  const hab = habitacionSeleccionada;
  const saldoPendiente = Math.max(0, Number(hab.debito || 0));

  const badgeHab = document.getElementById('abono-hab-badge');
  if (badgeHab) badgeHab.innerText = '#' + hab.numero;

  const subtitulo = document.getElementById('abono-subtitulo');
  if (subtitulo) subtitulo.innerText = `Hotel Norte · Habitación #${hab.numero} (${hab.tipo})`;

  const titNom = document.getElementById('abono-titular-nombre');
  if (titNom) titNom.innerText = hab.huesped?.nombre || 'Reserva Sin Nombre';

  const descHab = document.getElementById('abono-hab-desc');
  if (descHab) descHab.innerText = `Hab #${hab.numero} (${hab.pisoCorto} · ${hab.tipo} ${hab.capacidad}p)`;

  const tTotal = document.getElementById('abono-tarifa-total');
  if (tTotal) tTotal.innerText = '$' + Number(hab.tarifa || 30).toFixed(2);

  const sPend = document.getElementById('abono-saldo-pendiente');
  if (sPend) sPend.innerText = '$' + saldoPendiente.toFixed(2);

  const inpMonto = document.getElementById('abono-monto-input');
  if (inpMonto) {
    inpMonto.value = saldoPendiente > 0 ? (saldoPendiente >= 10 ? '10.00' : saldoPendiente.toFixed(2)) : '10.00';
  }

  const inpObs = document.getElementById('abono-obs-input');
  if (inpObs) inpObs.value = '';

  const selMetodo = document.getElementById('abono-metodo-pago');
  if (selMetodo) selMetodo.value = 'Efectivo';

  document.getElementById('modal-abono-reserva')?.classList.remove('hidden');
  setTimeout(() => document.getElementById('abono-monto-input')?.focus(), 120);
}

function agregarAbonoReservaModal() {
  abrirModalAbonoReserva();
}

function cerrarModalAbonoReserva() {
  document.getElementById('modal-abono-reserva')?.classList.add('hidden');
}

function setMontoAbonoRapido(val) {
  const inp = document.getElementById('abono-monto-input');
  if (inp) {
    const cur = parseFloat(inp.value) || 0;
    inp.value = (cur + val).toFixed(2);
  }
}

function setMontoAbonoTotalPendiente() {
  if (!habitacionSeleccionada) return;
  const saldoPendiente = Math.max(0, Number(habitacionSeleccionada.debito || 0));
  const inp = document.getElementById('abono-monto-input');
  if (inp && saldoPendiente > 0) {
    inp.value = saldoPendiente.toFixed(2);
  }
}

function confirmarGuardarAbonoReserva() {
  if (!habitacionSeleccionada) return;
  const hab = habitacionSeleccionada;
  const saldoMax = Math.max(0, Number(hab.debito || hab.tarifa || 0));

  const inpMonto = document.getElementById('abono-monto-input');
  const resMonto = ValidadorHotelNorte.sanitizarMonto(inpMonto?.value, 0.50, 5000);

  if (!resMonto.valido) {
    UIModal.aviso({
      titulo: 'Monto de Abono Inválido',
      mensaje: resMonto.error,
      tipo: 'alerta'
    });
    return;
  }

  const valor = resMonto.valor;
  if (saldoMax > 0 && valor > (saldoMax + 0.01)) {
    UIModal.aviso({
      titulo: 'Abono Superior al Saldo',
      mensaje: `El monto a abonar ($${valor.toFixed(2)}) excede el saldo pendiente actual ($${saldoMax.toFixed(2)}). Ingrese un valor menor o igual al saldo.`,
      tipo: 'alerta'
    });
    return;
  }

  const metodoRaw = document.getElementById('abono-metodo-pago')?.value || 'Efectivo';
  const metodosValidos = ['Efectivo', 'Transferencia', 'Datafast'];
  const metodo = metodosValidos.includes(metodoRaw) ? metodoRaw : 'Efectivo';

  const obsRaw = document.getElementById('abono-obs-input')?.value || '';
  const resObs = ValidadorHotelNorte.sanitizarTexto(obsRaw, 0, 100);
  const obs = resObs.texto;

  hab.pagado = Math.round(((hab.pagado || 0) + valor) * 100) / 100;
  hab.debito = Math.max(0, Math.round(((hab.debito || 0) - valor) * 100) / 100);

  if (obs && hab.huesped) {
    hab.huesped.obs = (hab.huesped.obs ? hab.huesped.obs + ' · ' : '') + `Abono $${valor.toFixed(2)} (${metodo}: ${obs})`;
  }

  if (sesionActiva) {
    if (valor > 0) {
      registrarIngresoHospedaje(valor, metodo);
    }
    guardarStorage('sesion_activa', sesionActiva);
  }

  const detalleAccion = `Hab #${hab.numero} · Abono $${valor.toFixed(2)} (${metodo}) - ${hab.huesped?.nombre || 'Reserva'}${obs ? ' [' + obs + ']' : ''}`;
  registrarAccion('ABONO', detalleAccion, hab.numero);
  guardarStorage('registros_diarios', registrosDiarios);

  cerrarModalAbonoReserva();
  cerrarModalDetalle();
  renderCuadrados();

  UIModal.aviso({
    titulo: 'Abono Registrado Exitosamente',
    subtitulo: `Habitación #${hab.numero} · Hotel Norte`,
    mensaje: `Se ha registrado el abono de $${valor.toFixed(2)} (${metodo}) a nombre de ${hab.huesped?.nombre || 'el huésped'}.`,
    tipo: 'exito',
    detalles: [
      { etiqueta: 'Habitación', valor: '#' + hab.numero },
      { etiqueta: 'Monto Abonado', valor: '$' + valor.toFixed(2) },
      { etiqueta: 'Método de Pago', valor: metodo },
      { etiqueta: 'Saldo Pendiente', valor: '$' + hab.debito.toFixed(2) }
    ]
  });
}

function cancelarReservaModal() {
  if (!habitacionSeleccionada) return;
  const hab = habitacionSeleccionada;
  const nom = hab.huesped?.nombre || 'Huésped Reserva';

  UIModal.confirmar({
    titulo: 'Anulación de Reserva',
    subtitulo: `Habitación #${hab.numero} · Hotel Norte`,
    mensaje: `¿Confirma la anulación de la reserva a nombre de "${nom}" en la Habitación #${hab.numero}?\n\nLa habitación quedará libre y disponible para una nueva reserva o check-in.`,
    textoConfirmar: 'Sí, Anular Reserva',
    tipo: 'alerta',
    onConfirm: () => {
      registrarAccion('ANULACIÓN RESERVA', 'Hab #' + hab.numero + ' · ' + nom, hab.numero);
      hab.estado = 'libre';
      hab.huesped = null;
      hab.pagado = 0;
      hab.debito = 0;
      hab.codigoBooking = null;
      hab.origenBooking = false;

      guardarStorage('registros_diarios', registrosDiarios);
      cerrarModalDetalle();
      renderCuadrados();

      UIModal.aviso({
        titulo: 'Reserva Anulada',
        subtitulo: `Habitación #${hab.numero} Disponible`,
        mensaje: `La reserva de "${nom}" fue anulada y la Habitación #${hab.numero} se encuentra libre.`,
        tipo: 'info'
      });
    }
  });
}

function iniciarCheckinDesdeDetalleReserva() {
  if (!habitacionSeleccionada) return;
  const hab = habitacionSeleccionada;
  cerrarModalDetalle();

  abrirModalCheckin(hab, 'checkin');

  if (hab.huesped) {
    if (document.getElementById('cin-nombre')) document.getElementById('cin-nombre').value = hab.huesped.nombre || '';
    if (document.getElementById('cin-cedula')) document.getElementById('cin-cedula').value = hab.huesped.cedula && !hab.huesped.cedula.startsWith('BOOKING-') ? hab.huesped.cedula : '';
    if (document.getElementById('cin-procedencia')) document.getElementById('cin-procedencia').value = hab.huesped.procedencia || '';
    if (document.getElementById('cin-telefono')) document.getElementById('cin-telefono').value = hab.huesped.telefono || '';
    if (document.getElementById('cin-obs')) document.getElementById('cin-obs').value = hab.huesped.obs || '';
    if (document.getElementById('cin-total')) document.getElementById('cin-total').value = Number(hab.tarifa || 30).toFixed(2);
    if (document.getElementById('cin-pagado')) document.getElementById('cin-pagado').value = Number(hab.tarifa || 30).toFixed(2);
    if (document.getElementById('cin-num-huespedes')) document.getElementById('cin-num-huespedes').value = String(hab.numHuespedes || hab.capacidad || 1);
    calcularDebitoCin();
  }
}

function abrirModalCambiarHab() {
  if (!habitacionSeleccionada) return;
  const habActual = habitacionSeleccionada;
  const habsDia = obtenerHabitacionesDia(fechaSeleccionada);

  const badgeHab = document.getElementById('rehab-hab-actual-badge');
  if (badgeHab) badgeHab.innerText = '#' + habActual.numero;

  const descHab = document.getElementById('rehab-hab-actual-desc');
  if (descHab) descHab.innerText = `Hab #${habActual.numero} (${habActual.pisoCorto} · ${habActual.tipo} ${habActual.capacidad}p)`;

  const titNom = document.getElementById('rehab-titular-nombre');
  if (titNom) titNom.innerText = habActual.huesped?.nombre || 'Reserva Pendiente';

  const fEst = document.getElementById('rehab-fecha-estadia');
  if (fEst) fEst.innerText = fechaSeleccionada;

  const origDesc = document.getElementById('rehab-origen-desc');
  if (origDesc) origDesc.innerText = habActual.origenBooking ? `Booking.com (Reserva #${habActual.codigoBooking || ''})` : 'Reserva Directa PMS';

  const selectEl = document.getElementById('rehab-select-nueva-hab');
  if (selectEl) {
    selectEl.innerHTML = DISTRIBUCION_HOTEL_NORTE.map(d => {
      const hEstado = habsDia.find(x => x.id === d.id);
      const esMisma = d.id === habActual.id;
      let estadoTxt = '';
      let disabled = '';

      if (esMisma) {
        estadoTxt = ' [Habitación Actual]';
        disabled = 'disabled';
      } else if (hEstado && hEstado.estado === 'ocupada') {
        estadoTxt = ' [Ocupada · Check-in]';
        disabled = 'disabled';
      } else if (hEstado && hEstado.estado === 'reservada') {
        estadoTxt = ` [Reservada · ${hEstado.huesped?.nombre ? hEstado.huesped.nombre.slice(0, 16) : 'Pre-asignada'}]`;
        disabled = 'disabled';
      } else {
        estadoTxt = ' [Disponible]';
      }

      return `<option value="${d.id}" ${disabled}>
        Hab #${d.numero} (${d.pisoCorto}) · ${d.tipo} (${d.capacidad}p) — $${d.tarifa}${estadoTxt}
      </option>`;
    }).join('');

    const primerLibre = DISTRIBUCION_HOTEL_NORTE.find(d => {
      if (d.id === habActual.id) return false;
      const h = habsDia.find(x => x.id === d.id);
      return !h || h.estado === 'libre';
    });
    if (primerLibre) {
      selectEl.value = String(primerLibre.id);
    }
  }

  document.getElementById('modal-cambiar-hab')?.classList.remove('hidden');
}

function cambiarHabitacionDesdeDetalleReserva() {
  abrirModalCambiarHab();
}

function cerrarModalCambiarHab() {
  document.getElementById('modal-cambiar-hab')?.classList.add('hidden');
}

function confirmarReasignarHabitacion() {
  if (!habitacionSeleccionada) return;
  const habActual = habitacionSeleccionada;
  const selectEl = document.getElementById('rehab-select-nueva-hab');
  const nuevoId = parseInt(selectEl?.value, 10);

  if (!nuevoId || !esHabitacionValidaHotelNorte(nuevoId) || nuevoId === habActual.id) {
    UIModal.aviso({
      titulo: 'Selección No Válida',
      mensaje: 'Por favor seleccione una habitación disponible diferente en la lista desplegable.',
      tipo: 'alerta'
    });
    return;
  }

  const destinoInfo = DISTRIBUCION_HOTEL_NORTE.find(d => d.id === nuevoId);
  const habsDia = obtenerHabitacionesDia(fechaSeleccionada);
  const habDestino = habsDia.find(h => h.id === nuevoId);

  const nochesReserva = habActual.origenBooking
    ? (reservasBooking.find(r => String(r.codigoBooking) === String(habActual.codigoBooking))?.noches || 1)
    : 1;

  const disp = ValidadorHotelNorte.verificarDisponibilidadEstadia(
    nuevoId,
    fechaSeleccionada,
    nochesReserva,
    habActual.codigoBooking
  );

  if (!disp.disponible) {
    UIModal.aviso({
      titulo: 'Conflicto de Disponibilidad en Habitación',
      mensaje: disp.motivo,
      tipo: 'alerta'
    });
    return;
  }

  if (habActual.codigoBooking) {
    cambiarHabitacionReservaBooking(habActual.codigoBooking, nuevoId);
  } else {
    if (habDestino) {
      habDestino.estado = 'reservada';
      habDestino.huesped = { ...habActual.huesped };
      habDestino.pagado = habActual.pagado;
      habDestino.debito = habActual.debito;
      habDestino.registradoPor = habActual.registradoPor;
      habDestino.turnoRegistro = habActual.turnoRegistro;
      habDestino.horaRegistro = habActual.horaRegistro;
      habDestino.origenBooking = false;
      habDestino.codigoBooking = null;
    }

    habActual.estado = 'libre';
    habActual.huesped = null;
    habActual.pagado = 0;
    habActual.debito = 0;
    habActual.codigoBooking = null;
    habActual.origenBooking = false;

    guardarStorage('registros_diarios', registrosDiarios);
    renderCuadrados();
  }

  cerrarModalCambiarHab();
  cerrarModalDetalle();

  UIModal.aviso({
    titulo: 'Habitación Reasignada con Éxito',
    subtitulo: `Hotel Norte · Fecha: ${fechaSeleccionada}`,
    mensaje: `La reserva de "${habActual.huesped?.nombre || 'el huésped'}" ha sido pre-asignada a la Habitación #${destinoInfo ? destinoInfo.numero : nuevoId} (${destinoInfo ? destinoInfo.tipo : ''}).`,
    tipo: 'exito',
    detalles: [
      { etiqueta: 'Habitación Anterior', valor: '#' + habActual.numero },
      { etiqueta: 'Nueva Habitación Asignada', valor: '#' + (destinoInfo ? destinoInfo.numero : nuevoId) + ' (' + (destinoInfo ? destinoInfo.tipo : '') + ')' },
      { etiqueta: 'Ubicación', valor: destinoInfo ? destinoInfo.piso : '—' },
      { etiqueta: 'Tarifa', valor: '$' + (destinoInfo ? Number(destinoInfo.tarifa).toFixed(2) : '—') }
    ]
  });
}

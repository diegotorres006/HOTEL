/* ==========================================================================
   HOTEL NORTE — SERVICIO DE REGISTRO E INGRESO (CHECK-IN)
   Archivo: src/modules/rooms/checkin-service.js
   ========================================================================== */

function procesarBusquedaCedula(cedula) {
  cedula = cedula.trim();
  const badge = document.getElementById('cin-cedula-badge');
  const alertaLN = document.getElementById('alerta-lista-negra');
  const notifFrec = document.getElementById('notif-cliente-frecuente');
  const btnConf = document.getElementById('btn-confirmar-ingreso');

  alertaLN.classList.add('hidden');
  notifFrec.classList.add('hidden');
  badge.classList.add('hidden');
  btnConf.disabled = false;
  btnConf.className = 'bg-blue-700 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition text-xs shadow-xs';

  if (cedula.length < 10) return;
  const c = baseHistoricaHuespedes.find(x => x.cedula === cedula);
  if (!c) {
    badge.innerText = 'CONSULTANDO SRI / D2FAC...';
    badge.classList.remove('hidden');
    badge.className = 'absolute right-3 top-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-sky-300 border border-blue-700';
    consultarCedulaEnD2FacParaCheckin(cedula);
    return;
  }
  if (c.esListaNegra) {
    badge.innerText = 'RESTRINGIDO';
    badge.classList.remove('hidden');
    badge.className = 'absolute right-3 top-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-red-700 text-white';
    document.getElementById('lista-negra-motivo').innerText = c.motivoListaNegra;
    alertaLN.classList.remove('hidden');
    document.getElementById('cin-nombre').value = c.nombre;
    document.getElementById('cin-procedencia').value = c.procedencia;
    document.getElementById('cin-telefono').value = c.telefono;
    btnConf.className = 'bg-red-800 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition text-xs shadow-xs';
    btnConf.innerText = 'Autorizar Ingreso Bajo Responsabilidad';
    return;
  }
  badge.innerText = 'CLIENTE REGISTRADO (' + c.visitasPrevias + ' estancias)';
  badge.classList.remove('hidden');
  badge.className = 'absolute right-3 top-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700';
  document.getElementById('cin-nombre').value = c.nombre;
  document.getElementById('cin-procedencia').value = c.procedencia;
  document.getElementById('cin-telefono').value = c.telefono;
  if (c.ruc) {
    document.getElementById('cin-ruc').value = c.ruc;
    document.getElementById('cin-razon').value = c.razonSocial || '';
    document.getElementById('cin-correo').value = c.correo || '';
    document.getElementById('cin-direccion').value = c.direccion || '';
  }
  document.getElementById('frecuente-detalle').innerText = 'Datos cargados automáticamente. ' + c.visitasPrevias + ' registros previos sin incidencias.';
  notifFrec.classList.remove('hidden');
}

function clickCuadrado(id) {
  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const hab = habs.find(x => x.id === id);
  if (!hab) return;
  habitacionSeleccionada = hab;

  const esPasado = fechaSeleccionada < FECHA_HOY;
  const esFuturo = fechaSeleccionada > FECHA_HOY;

  if (esPasado) {
    if (hab.estado === 'ocupada') abrirModalDetalle(hab, 'pasado');
    else {
      UIModal.aviso({
        titulo: 'Archivo Histórico Cerrado',
        subtitulo: formatearFechaLegible(fechaSeleccionada),
        mensaje: 'Esta habitación permaneció en estado ' + hab.estado.toUpperCase() + ' en la fecha seleccionada. No se admiten registros retroactivos.',
        tipo: 'alerta'
      });
    }
    return;
  }

  if (!sesionActiva || !sesionActiva.empleado) {
    UIModal.aviso({
      titulo: 'Autenticación de Operador Requerida',
      mensaje: 'Seleccione su usuario e ingrese su clave PIN para operar en el turno actual.',
      tipo: 'alerta',
      onClose: () => abrirModalLoginEmpleado()
    });
    return;
  }

  if (esFuturo) {
    if (hab.estado === 'libre') abrirModalCheckin(hab, 'reserva');
    else abrirModalDetalle(hab, hab.estado === 'reservada' ? 'reserva' : 'hoy');
    return;
  }

  if (hab.estado === 'libre') abrirModalCheckin(hab, 'checkin');
  else if (hab.estado === 'ocupada' || hab.estado === 'reservada') abrirModalDetalle(hab, hab.estado === 'reservada' ? 'reserva' : 'hoy');
  else if (hab.estado === 'sucia') {
    hab.estado = 'libre';
    guardarStorage('registros_diarios', registrosDiarios);
    abrirModalCheckin(hab, 'checkin');
  }
}

function limpiarCamposModalCheckin() {
  ['cin-cedula', 'cin-nombre', 'cin-procedencia', 'cin-telefono', 'cin-obs', 'cin-ruc', 'cin-razon', 'cin-correo', 'cin-tel-factura']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  if (document.getElementById('cin-direccion')) document.getElementById('cin-direccion').value = 'CUENCA';
  if (document.getElementById('cin-estado-busqueda-d2fac')) document.getElementById('cin-estado-busqueda-d2fac').innerText = '';
  seleccionarModoFacturaCin('ninguna');
}

function abrirModalCheckin(hab, modo) {
  const esReserva = modo === 'reserva';
  document.getElementById('cin-hab-num').innerText = 'HAB ' + hab.numero;
  document.getElementById('cin-hab-sub').innerText = hab.piso + ' · ' + hab.tipo + ' (' + hab.descripcionCamas + ') · Capacidad: ' + hab.capacidad + ' pers. · Tarifa oficial $' + hab.tarifa + '.00 / noche';
  document.getElementById('cin-modal-titulo').innerText = esReserva ? 'Registro de Reserva Futura' : 'Registro de Ingreso (Check-in)';

  document.getElementById('cin-aviso-futuro').classList.toggle('hidden', !esReserva);
  if (esReserva) document.getElementById('cin-aviso-fecha-texto').innerText = formatearFechaLegible(fechaSeleccionada);
  const ahoraHora = formatHora(new Date());
  if (document.getElementById('cin-hora-entrada')) document.getElementById('cin-hora-entrada').value = ahoraHora;
  if (document.getElementById('cin-hora-pago')) document.getElementById('cin-hora-pago').value = ahoraHora;
  if (document.getElementById('cin-num-huespedes')) document.getElementById('cin-num-huespedes').value = '1';
  document.getElementById('cin-seccion-dotacion').classList.toggle('hidden', esReserva);
  document.getElementById('cin-titulo-pagos').innerText = esReserva ? 'Liquidación de Anticipo de Reserva' : 'Liquidación de Hospedaje';
  document.getElementById('cin-lbl-pagado').innerText = esReserva ? 'Anticipo Recibido ($)' : 'Valor Pagado ($)';
  document.getElementById('btn-confirmar-ingreso').innerText = esReserva ? 'Confirmar Reserva' : 'Registrar Ingreso';
  document.getElementById('btn-confirmar-ingreso').className = 'bg-blue-700 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition text-xs shadow-xs';

  document.getElementById('cin-total').value = hab.tarifa.toFixed(2);
  document.getElementById('cin-pagado').value = esReserva ? (hab.tarifa * 0.5).toFixed(2) : hab.tarifa.toFixed(2);
  calcularDebitoCin();

  if (sesionActiva) {
    document.getElementById('cin-empleado-badge').innerText = sesionActiva.empleado.nombre;
    document.getElementById('cin-turno-badge').innerText = sesionActiva.turno;
    document.getElementById('cin-hora-registro').innerText = formatHora(new Date());
  }

  limpiarCamposModalCheckin();
  document.getElementById('alerta-lista-negra').classList.add('hidden');
  document.getElementById('notif-cliente-frecuente').classList.add('hidden');
  document.getElementById('cin-cedula-badge').classList.add('hidden');

  document.getElementById('modal-checkin').classList.remove('hidden');
  setTimeout(() => document.getElementById('cin-cedula').focus(), 150);
}

function cerrarModalCheckin() {
  document.getElementById('modal-checkin').classList.add('hidden');
}

function calcularDebitoCin() {
  const total = parseFloat(document.getElementById('cin-total').value) || 0;
  const pag = parseFloat(document.getElementById('cin-pagado').value) || 0;
  document.getElementById('cin-debito').value = '$' + Math.max(0, total - pag).toFixed(2);
}

async function guardarRegistro() {
  const nomRaw = document.getElementById('cin-nombre').value;
  const ciRaw = document.getElementById('cin-cedula').value;

  // 1. Doble validación de identidad del huésped
  const valNom = ValidadorHotelNorte.sanitizarTexto(nomRaw, 3, 100);
  if (!valNom.valido) {
    UIModal.aviso({
      titulo: 'Nombre de Huésped Requerido',
      mensaje: 'Ingrese el nombre completo del huésped (mínimo 3 caracteres alfabéticos).',
      tipo: 'alerta'
    });
    return;
  }

  const valDoc = ValidadorHotelNorte.validarIdentificacionHuesped(ciRaw);
  if (!valDoc.valido) {
    UIModal.aviso({
      titulo: 'Identificación No Válida',
      mensaje: valDoc.mensaje,
      tipo: 'alerta'
    });
    return;
  }

  const nom = valNom.texto;
  const ci = String(ciRaw).trim();
  const habTarget = habitacionSeleccionada;
  if (!habTarget) return;

  const esReserva = fechaSeleccionada > FECHA_HOY;

  // 2. Doble validación de disponibilidad (prevención absoluta de Overbooking/colisión)
  if (!esReserva && habTarget.estado === 'ocupada') {
    UIModal.aviso({
      titulo: 'Habitación Ya Ocupada',
      mensaje: `La Habitación #${habTarget.numero} ya se encuentra ocupada por ${habTarget.huesped?.nombre || 'otro huésped'}. Debe registrar la salida (Check-out) de la estancia previa antes de asignar un nuevo huésped.`,
      tipo: 'alerta'
    });
    return;
  }

  // 3. Doble validación de montos monetarios (sin NaN, sin negativos)
  const valTotal = ValidadorHotelNorte.sanitizarMonto(document.getElementById('cin-total').value, 1, 3000);
  if (!valTotal.valido) {
    UIModal.aviso({
      titulo: 'Tarifa Inválida',
      mensaje: `El total de la tarifa no es válido: ${valTotal.error}`,
      tipo: 'alerta'
    });
    return;
  }

  const valPagado = ValidadorHotelNorte.sanitizarMonto(document.getElementById('cin-pagado').value, 0, 5000);
  if (!valPagado.valido) {
    UIModal.aviso({
      titulo: 'Monto Pagado Inválido',
      mensaje: `El monto pagado no es válido: ${valPagado.error}`,
      tipo: 'alerta'
    });
    return;
  }

  const total = valTotal.valor;
  const pagado = valPagado.valor;
  const debito = Math.max(0, Math.round((total - pagado) * 100) / 100);

  // 4. Doble validación de datos de facturación electrónica SRI
  const modoFac = document.getElementById('cin-modo-factura')?.value || 'ninguna';
  let rucFac = '', razonFac = '', correoFac = '', dirFac = '', telFac = '';
  if (modoFac !== 'ninguna') {
    rucFac = (document.getElementById('cin-ruc')?.value || '').trim();
    razonFac = (document.getElementById('cin-razon')?.value || '').trim();
    correoFac = (document.getElementById('cin-correo')?.value || '').trim() || 'hotelnortecuenca@gmail.com';
    dirFac = (document.getElementById('cin-direccion')?.value || '').trim() || 'CUENCA';
    telFac = (document.getElementById('cin-tel-factura')?.value || '').trim() || document.getElementById('cin-telefono').value.trim() || '0999999999';

    const valSRI = ValidadorHotelNorte.validarFacturacionSRI({
      modo: modoFac,
      ruc: rucFac,
      nombres: razonFac,
      email: correoFac,
      montoTotal: pagado > 0 ? pagado : total,
      habNumero: habTarget.numero
    });

    if (!valSRI.valido) {
      UIModal.aviso({
        titulo: 'Datos de Facturación SRI Incompletos o Inválidos',
        mensaje: valSRI.errores.join('\n'),
        tipo: 'alerta'
      });
      return;
    }
  }

  const metodo = document.getElementById('cin-metodo-pago').value;
  const ahora = new Date();
  habTarget.estado = esReserva ? 'reservada' : 'ocupada';
  habTarget.venceHoy = false;
  habTarget.huesped = {
    nombre: nom,
    cedula: ci,
    procedencia: document.getElementById('cin-procedencia').value,
    telefono: document.getElementById('cin-telefono').value,
    obs: document.getElementById('cin-obs').value
  };
  habTarget.controles = esReserva ? 0 : (parseInt(document.getElementById('cin-controles').value) || 1);
  habTarget.toallas = esReserva ? 0 : (parseInt(document.getElementById('cin-toallas').value) || 2);
  habTarget.pagado = pagado;
  habTarget.debito = debito;
  habTarget.metodoPago = metodo;

  habTarget.modoFactura = modoFac;
  if (modoFac === 'ninguna') {
    habTarget.datosFactura = null;
    habTarget.facturaEmitida = null;
  } else {
    habTarget.datosFactura = {
      modo: modoFac,
      ruc: rucFac,
      razonSocial: razonFac,
      correo: correoFac,
      direccion: dirFac,
      telefono: telFac
    };
  }

  habTarget.registradoPor = sesionActiva ? sesionActiva.empleado.nombre : 'Recepción';
  habTarget.turnoRegistro = sesionActiva ? sesionActiva.turno : 'Turno Regular';
  const horaEntElegida = document.getElementById('cin-hora-entrada')?.value || formatHora(ahora);
  const horaPagoElegida = document.getElementById('cin-hora-pago')?.value || formatHora(ahora);
  const numHuesElegido = parseInt(document.getElementById('cin-num-huespedes')?.value) || 1;
  habTarget.horaRegistro = horaEntElegida;
  habTarget.horaEntrada = horaEntElegida;
  habTarget.horaPago = horaPagoElegida;
  habTarget.numHuespedes = numHuesElegido;
  habTarget.horaSalida = null;
  habTarget.controlesSalida = null;
  habTarget.toallasSalida = null;

  const existingGuest = baseHistoricaHuespedes.find(c => c.cedula === ci);
  if (!existingGuest) {
    baseHistoricaHuespedes.push({
      cedula: ci,
      nombre: nom,
      procedencia: document.getElementById('cin-procedencia').value,
      telefono: document.getElementById('cin-telefono').value,
      ruc: modoFac === 'empresa' ? rucFac : ci,
      razonSocial: modoFac === 'empresa' ? razonFac : nom,
      correo: correoFac,
      direccion: dirFac,
      visitasPrevias: 1,
      esListaNegra: false
    });
  } else if (modoFac === 'empresa') {
    existingGuest.ruc = rucFac;
    existingGuest.razonSocial = razonFac;
    existingGuest.correo = correoFac;
    existingGuest.direccion = dirFac;
  }
  guardarStorage('huespedes_db', baseHistoricaHuespedes);

  if (sesionActiva) {
    if (pagado > 0) {
      registrarIngresoHospedaje(pagado, metodo);
    }
    sesionActiva.totalDebito = Math.round(((sesionActiva.totalDebito || 0) + debito) * 100) / 100;

    const etqFac = modoFac === 'ninguna' ? 'Sin factura' : (modoFac === 'empresa' ? 'Factura Empresa (' + rucFac + ')' : 'Factura Usuario (' + rucFac + ')');
    const tipo = esReserva ? 'RESERVA' : 'CHECK-IN';
    registrarAccion(tipo, 'Hab #' + habTarget.numero + ' - ' + nom + ' (ID: ' + ci + ') · $' + pagado.toFixed(2) + ' ' + metodo + ' · ' + etqFac, habTarget.numero);
    guardarStorage('sesion_activa', sesionActiva);
  }

  // Si esta habitación correspondía a una reserva pre-asignada de Booking, confirmar Check-in oficial
  if (habTarget.codigoBooking) {
    const bkRes = reservasBooking.find(x => String(x.codigoBooking) === String(habTarget.codigoBooking));
    if (bkRes) {
      bkRes.recibido = true;
      guardarStorage('reservas_booking', reservasBooking);
      if (typeof actualizarBadgeBookingHeader === 'function') {
        actualizarBadgeBookingHeader();
      }
      fetch('http://127.0.0.1:3847/api/booking/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoBooking: bkRes.codigoBooking, recibido: true })
      }).catch(() => {});
    }
  }

  guardarStorage('registros_diarios', registrosDiarios);
  const autoEmitir = document.getElementById('cin-auto-emitir-d2fac')?.checked;

  limpiarCamposModalCheckin();
  cerrarModalCheckin();
  renderCuadrados();

  if (modoFac !== 'ninguna' && autoEmitir) {
    const montoFacturar = pagado > 0 ? pagado : total;
    await emitirFacturaD2FacAPI({
      modo: modoFac,
      ruc: rucFac,
      nombres: razonFac,
      direccion: dirFac,
      telefono: telFac,
      email: correoFac,
      montoTotal: montoFacturar,
      metodoPago: metodo,
      habNumero: habTarget.numero,
      huespedNombre: nom,
      habObj: habTarget
    });
  }
}

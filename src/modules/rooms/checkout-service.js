/* ==========================================================================
   HOTEL NORTE — SERVICIO DE SALIDAS (CHECK-OUT) Y MULTI-ESTANCIAS DIARIAS
   Archivo: src/modules/rooms/checkout-service.js
   ========================================================================== */

function abrirModalCheckout() {
  if (!habitacionSeleccionada) return;
  cerrarModalDetalle();

  document.getElementById('co-hab-num').innerText = '#' + habitacionSeleccionada.numero;
  document.getElementById('co-huesped-nombre').innerText = habitacionSeleccionada.huesped?.nombre || 'Huésped';
  document.getElementById('co-hora-entrada-prev').innerText = habitacionSeleccionada.horaEntrada || habitacionSeleccionada.horaRegistro || '—';
  document.getElementById('co-hora-salida').value = formatHora(new Date());

  const contEsperados = habitacionSeleccionada.controles || 1;
  const toaEsperadas = habitacionSeleccionada.toallas || 2;
  document.getElementById('co-controles').value = contEsperados;
  document.getElementById('co-controles-esperados').innerText = 'Entregados al ingreso: ' + contEsperados;
  document.getElementById('co-toallas').value = toaEsperadas;
  document.getElementById('co-toallas-esperadas').innerText = 'Entregadas al ingreso: ' + toaEsperadas;

  const debito = habitacionSeleccionada.debito || 0;
  const alertDebito = document.getElementById('co-alerta-debito');
  if (debito > 0) {
    alertDebito.classList.remove('hidden');
    document.getElementById('co-monto-debito').innerText = '$' + debito.toFixed(2);
  } else {
    alertDebito.classList.add('hidden');
  }

  document.getElementById('modal-checkout').classList.remove('hidden');
}

function cerrarModalCheckout() {
  document.getElementById('modal-checkout').classList.add('hidden');
}

function confirmarSalidaHuesped() {
  if (!habitacionSeleccionada) return;
  const debitoPendiente = Number(habitacionSeleccionada.debito || 0);
  const nom = habitacionSeleccionada.huesped?.nombre || 'el huésped';

  if (debitoPendiente > 0.05) {
    UIModal.confirmar({
      titulo: 'Alerta: Saldo Pendiente sin Cobrar',
      subtitulo: `Habitación #${habitacionSeleccionada.numero} · Saldo: $${debitoPendiente.toFixed(2)}`,
      mensaje: `El huésped "${nom}" mantiene un saldo pendiente de $${debitoPendiente.toFixed(2)} USD.\n\n¿Desea registrar el Check-out de todas formas y marcar la deuda como pendiente de cobro?`,
      textoConfirmar: 'Sí, Registrar Salida con Deuda',
      tipo: 'alerta',
      onConfirm: () => {
        ejecutarSalidaHuespedEfectiva();
      }
    });
    return;
  }

  ejecutarSalidaHuespedEfectiva();
}

function ejecutarSalidaHuespedEfectiva() {
  if (!habitacionSeleccionada) return;
  const horaSal = document.getElementById('co-hora-salida').value || formatHora(new Date());
  const cDevueltos = parseInt(document.getElementById('co-controles').value) || 0;
  const tDevueltas = parseInt(document.getElementById('co-toallas').value) || 0;
  const nom = habitacionSeleccionada.huesped?.nombre || '';
  const debitoPrevio = Number(habitacionSeleccionada.debito || 0);

  if (!Array.isArray(habitacionSeleccionada.estanciasPasadas)) {
    habitacionSeleccionada.estanciasPasadas = [];
  }

  const estanciaFinalizada = {
    numeroEstancia: habitacionSeleccionada.estanciasPasadas.length + 1,
    huesped: nom,
    cedula: habitacionSeleccionada.huesped?.cedula || '—',
    procedencia: habitacionSeleccionada.huesped?.procedencia || '—',
    telefono: habitacionSeleccionada.huesped?.telefono || '—',
    numHuespedes: habitacionSeleccionada.numHuespedes || 1,
    controlesEntrada: habitacionSeleccionada.controles || 1,
    toallasEntrada: habitacionSeleccionada.toallas || 2,
    horaEntrada: habitacionSeleccionada.horaEntrada || habitacionSeleccionada.horaRegistro || '—',
    horaPago: habitacionSeleccionada.horaPago || habitacionSeleccionada.horaRegistro || '—',
    pagado: Number(habitacionSeleccionada.pagado || 0),
    debito: debitoPrevio,
    metodoPago: habitacionSeleccionada.metodoPago || 'Efectivo',
    horaSalida: horaSal,
    controlesSalida: cDevueltos,
    toallasSalida: tDevueltas,
    registradoPor: habitacionSeleccionada.registradoPor || (sesionActiva ? sesionActiva.empleado.nombre : 'Recepción'),
    turnoRegistro: habitacionSeleccionada.turnoRegistro || (sesionActiva ? sesionActiva.turno : 'Turno Regular'),
    observaciones: habitacionSeleccionada.huesped?.obs || habitacionSeleccionada.observaciones || '',
    cargosBar: [...(habitacionSeleccionada.cargosBar || [])],
    estadoEstancia: 'finalizada',
    tarifa: habitacionSeleccionada.tarifa
  };

  habitacionSeleccionada.estanciasPasadas.push(estanciaFinalizada);
  habitacionSeleccionada.registroSalidaPrevio = estanciaFinalizada;

  habitacionSeleccionada.horaSalida = horaSal;
  habitacionSeleccionada.controlesSalida = cDevueltos;
  habitacionSeleccionada.toallasSalida = tDevueltas;

  const obsDeuda = debitoPrevio > 0 ? ` [SALDO PENDIENTE: $${debitoPrevio.toFixed(2)}]` : '';
  registrarAccion('CHECK-OUT', 'Hab #' + habitacionSeleccionada.numero + ' - ' + nom + ' · Salida: ' + horaSal + obsDeuda, habitacionSeleccionada.numero);

  habitacionSeleccionada.estado = 'libre';
  habitacionSeleccionada.huesped = null;
  habitacionSeleccionada.pagado = 0;
  habitacionSeleccionada.debito = 0;
  habitacionSeleccionada.controles = 0;
  habitacionSeleccionada.toallas = 0;
  habitacionSeleccionada.horaEntrada = null;
  habitacionSeleccionada.horaRegistro = null;
  habitacionSeleccionada.horaPago = null;
  habitacionSeleccionada.horaSalida = null;
  habitacionSeleccionada.controlesSalida = null;
  habitacionSeleccionada.toallasSalida = null;
  habitacionSeleccionada.venceHoy = false;
  habitacionSeleccionada.origenBooking = false;
  habitacionSeleccionada.codigoBooking = null;
  habitacionSeleccionada.observaciones = '';
  habitacionSeleccionada.cargosBar = [];
  habitacionSeleccionada.registradoPor = null;

  guardarStorage('registros_diarios', registrosDiarios, true);
  cerrarModalCheckout();
  renderCuadrados();
  if (modoVistaActual === 'hoja') renderTablaHojaRegistro();

  UIModal.aviso({
    titulo: 'Salida Registrada Exitosamente',
    subtitulo: `Habitación #${habitacionSeleccionada.numero} Disponible`,
    mensaje: `Se ha registrado formalmente el Check-out de "${nom}". La habitación quedó disponible para un nuevo ingreso.`,
    tipo: 'exito'
  });
}

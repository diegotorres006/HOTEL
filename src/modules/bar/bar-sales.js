/* ==========================================================================
   HOTEL NORTE — MODAL DE REGISTRO RÁPIDO DE VENTAS DEL BAR
   Archivo: src/modules/bar/bar-sales.js
   ========================================================================== */

let productoVentaSeleccionado = null;
let cantidadVentaActual = 1;

/**
 * Apertura del modal rápido para registrar una venta
 */
function abrirModalVentaRapida(productoId) {
  const prod = productosBar.find(p => p.id === productoId);
  if (!prod) return;
  if (prod.stock <= 0) {
    UIModal.aviso({
      titulo: 'Producto Agotado',
      mensaje: `No hay unidades disponibles en inventario de "${prod.nombre}". Notifique al Administrador para reponer stock.`,
      tipo: 'alerta'
    });
    return;
  }

  productoVentaSeleccionado = prod;
  cantidadVentaActual = 1;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setEl('mv-prod-nombre', prod.nombre);
  setEl('mv-prod-codigo', prod.codigo);
  setEl('mv-prod-categoria', prod.categoria);
  setEl('mv-prod-precio', '$' + Number(prod.precio).toFixed(2));
  setEl('mv-prod-stock', prod.stock + ' unidades disponibles');

  const inpCant = document.getElementById('mv-cantidad');
  if (inpCant) {
    inpCant.value = 1;
    inpCant.max = prod.stock;
  }

  const selectHab = document.getElementById('mv-select-habitacion');
  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const habsOcupadas = habs.filter(h => h.estado === 'ocupada' && h.huesped);

  if (selectHab) {
    if (habsOcupadas.length === 0) {
      selectHab.innerHTML = '<option value="" disabled selected>No hay habitaciones ocupadas con huéspedes alojados</option>';
    } else {
      selectHab.innerHTML = habsOcupadas.map(h => {
        return `<option value="${h.id}">Hab #${h.numero} · ${h.huesped.nombre} (Debito actual: $${Number(h.debito || 0).toFixed(2)})</option>`;
      }).join('');
    }
  }

  const radioHab = document.getElementById('mv-dest-hab');
  const radioBarra = document.getElementById('mv-dest-barra');
  if (habsOcupadas.length > 0) {
    if (radioHab) radioHab.checked = true;
    cambiarDestinoVenta('habitacion');
  } else {
    if (radioBarra) radioBarra.checked = true;
    cambiarDestinoVenta('barra');
  }

  recalcularSubtotalVenta();

  const modal = document.getElementById('modal-venta-bar');
  if (modal) modal.classList.remove('hidden');
}

function cerrarModalVentaRapida() {
  const modal = document.getElementById('modal-venta-bar');
  if (modal) modal.classList.add('hidden');
  productoVentaSeleccionado = null;
  cantidadVentaActual = 1;
}

function cambiarCantidadVenta(delta) {
  if (!productoVentaSeleccionado) return;
  const inp = document.getElementById('mv-cantidad');
  let val = parseInt(inp.value, 10) || 1;
  val += delta;
  if (val < 1) val = 1;
  if (val > productoVentaSeleccionado.stock) val = productoVentaSeleccionado.stock;
  inp.value = val;
  cantidadVentaActual = val;
  recalcularSubtotalVenta();
}

function recalcularSubtotalVenta() {
  if (!productoVentaSeleccionado) return;
  const inp = document.getElementById('mv-cantidad');
  let val = parseInt(inp?.value, 10) || 1;
  if (val < 1) val = 1;
  if (val > productoVentaSeleccionado.stock) val = productoVentaSeleccionado.stock;
  cantidadVentaActual = val;

  const subtotal = cantidadVentaActual * Number(productoVentaSeleccionado.precio);
  const el = document.getElementById('mv-subtotal');
  if (el) el.innerText = '$' + subtotal.toFixed(2);
}

function cambiarDestinoVenta(destino) {
  const bloqueHab = document.getElementById('mv-bloque-habitacion');
  const optCuenta = document.getElementById('mv-pago-cuenta');
  const optInmediato = document.getElementById('mv-pago-inmediato');

  if (destino === 'habitacion') {
    if (bloqueHab) bloqueHab.classList.remove('hidden');
    if (optCuenta) {
      optCuenta.disabled = false;
      optCuenta.checked = true;
    }
    cambiarEstadoCobroVenta('pendiente');
  } else {
    if (bloqueHab) bloqueHab.classList.add('hidden');
    if (optCuenta) {
      optCuenta.disabled = true;
    }
    if (optInmediato) optInmediato.checked = true;
    cambiarEstadoCobroVenta('pagado');
  }
}

function cambiarEstadoCobroVenta(estado) {
  const bloqueMetodo = document.getElementById('mv-bloque-metodo-pago');
  if (estado === 'pagado') {
    if (bloqueMetodo) bloqueMetodo.classList.remove('hidden');
  } else {
    if (bloqueMetodo) bloqueMetodo.classList.add('hidden');
  }
}

/**
 * Confirmación y ejecución formal de la venta
 */
function confirmarVentaRapida() {
  if (!productoVentaSeleccionado) return;

  const inpCant = document.getElementById('mv-cantidad');
  const cant = parseInt(inpCant?.value, 10) || 1;

  if (cant <= 0) {
    UIModal.aviso({ titulo: 'Cantidad no válida', mensaje: 'Debe ingresar al menos 1 unidad para la venta.', tipo: 'alerta' });
    return;
  }

  if (cant > productoVentaSeleccionado.stock) {
    UIModal.aviso({
      titulo: 'Stock Insuficiente',
      mensaje: `Solo hay ${productoVentaSeleccionado.stock} unidades disponibles en inventario.`,
      tipo: 'alerta'
    });
    return;
  }

  const esDestHabitacion = document.getElementById('mv-dest-hab')?.checked;
  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  let habObj = null;

  if (esDestHabitacion) {
    const selHabId = parseInt(document.getElementById('mv-select-habitacion')?.value, 10);
    habObj = habs.find(h => h.id === selHabId);
    if (!habObj || habObj.estado !== 'ocupada') {
      UIModal.aviso({ titulo: 'Seleccione una Habitación', mensaje: 'Debe seleccionar una habitación ocupada válida para cargar el consumo.', tipo: 'alerta' });
      return;
    }
  }

  const esPendientePago = document.getElementById('mv-pago-cuenta')?.checked;
  const metodoPago = esPendientePago ? 'Cuenta de Habitación' : (document.getElementById('mv-metodo-pago')?.value || 'Efectivo');
  const totalVenta = cant * Number(productoVentaSeleccionado.precio);
  const ahora = new Date();
  const horaStr = ahora.toTimeString().slice(0, 5);
  const operadorNombre = sesionActiva ? sesionActiva.empleado.nombre : 'Recepción';

  // 1. Descontar stock
  productoVentaSeleccionado.stock -= cant;
  guardarStorage('productos_bar', productosBar, true);

  // 2. Registrar venta consolidada
  const nuevaVenta = {
    id: Date.now(),
    fecha: fechaSeleccionada,
    hora: horaStr,
    timestamp: ahora.toISOString(),
    productoId: productoVentaSeleccionado.id,
    productoNombre: productoVentaSeleccionado.nombre,
    codigo: productoVentaSeleccionado.codigo,
    categoria: productoVentaSeleccionado.categoria,
    cantidad: cant,
    precioUnitario: Number(productoVentaSeleccionado.precio),
    total: totalVenta,
    destino: esDestHabitacion ? `Hab #${habObj.numero}` : 'Venta en Barra',
    habitacionId: habObj ? habObj.id : null,
    habitacionNumero: habObj ? habObj.numero : null,
    huespedNombre: habObj && habObj.huesped ? habObj.huesped.nombre : null,
    estadoPago: esPendientePago ? 'pendiente' : 'pagado',
    metodoPago: metodoPago,
    registradoPor: operadorNombre,
    turnoId: sesionActiva ? sesionActiva.idTurno : null
  };

  ventasBar.unshift(nuevaVenta);
  guardarStorage('ventas_bar', ventasBar, true);

  // 3. Imputar a habitación si es a crédito
  if (esDestHabitacion && habObj) {
    if (!habObj.cargosBar) habObj.cargosBar = [];
    habObj.cargosBar.push({
      ventaId: nuevaVenta.id,
      producto: productoVentaSeleccionado.nombre,
      cantidad: cant,
      precio: Number(productoVentaSeleccionado.precio),
      total: totalVenta,
      hora: horaStr,
      fecha: fechaSeleccionada,
      operador: operadorNombre,
      estadoPago: esPendientePago ? 'pendiente' : 'pagado'
    });

    if (esPendientePago) {
      habObj.debito = Number((Number(habObj.debito || 0) + totalVenta).toFixed(2));
    } else {
      habObj.pagado = Number((Number(habObj.pagado || 0) + totalVenta).toFixed(2));
    }

    guardarStorage('registros_diarios', registrosDiarios, true);
  }

  // 4. Si fue pagado de inmediato, sumar a la Caja Bar del turno activo
  if (!esPendientePago && sesionActiva) {
    registrarIngresoBar(totalVenta, metodoPago);
  }

  // 5. Registrar en bitácora de auditoría
  const nombreProd = productoVentaSeleccionado.nombre;
  const descAuditoria = `Venta Bar: ${cant}x ${nombreProd} ($${totalVenta.toFixed(2)}) · ${nuevaVenta.destino} · ${nuevaVenta.estadoPago === 'pendiente' ? 'A Cuenta' : 'Cobrado (' + metodoPago + ')'}`;
  registrarAccion('VENTA_BAR', descAuditoria, habObj ? habObj.numero : 'BAR');

  cerrarModalVentaRapida();
  renderVistaBar();
  renderCuadrados();
  if (modoVistaActual === 'hoja') renderTablaHojaRegistro();

  UIModal.aviso({
    titulo: 'Venta Registrada Exitosamente',
    subtitulo: `${cant}x ${nombreProd} ($${totalVenta.toFixed(2)})`,
    mensaje: esPendientePago 
      ? `Se cargó el monto a la cuenta de la Habitación #${habObj.numero} (${habObj.huesped.nombre}). Su saldo deudor aumentó en $${totalVenta.toFixed(2)}.`
      : `El valor de $${totalVenta.toFixed(2)} fue cobrado de inmediato mediante ${metodoPago} y asentado en caja.`,
    tipo: 'exito'
  });
}

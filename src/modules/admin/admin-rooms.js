/* ==========================================================================
   HOTEL NORTE — GESTIÓN MAESTRA DE HABITACIONES (ADMINISTRACIÓN)
   Archivo: src/modules/admin/admin-rooms.js
   ========================================================================== */

function renderAdminHabitaciones() {
  const tbody = document.getElementById('tbody-admin-habitaciones');
  if (!tbody) return;
  tbody.innerHTML = '';

  const cfg = obtenerHabitacionesConfig();

  cfg.forEach(h => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-700/60 hover:bg-slate-800/40 text-xs text-slate-200';

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-base text-white">#${h.numero}</td>
      <td class="py-2.5 px-3 font-semibold text-purple-300">${h.pisoCorto} · ${h.piso}</td>
      <td class="py-2.5 px-3 font-bold text-white">${h.tipo}</td>
      <td class="py-2.5 px-3 text-slate-300">${h.descripcionCamas}</td>
      <td class="py-2.5 px-3 text-center font-mono font-semibold">${h.capacidad} pers (${h.camas} c.)</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm">$${Number(h.tarifa).toFixed(2)}</td>
      <td class="py-2.5 px-3 text-right space-x-1">
        <button onclick="abrirModalEditarHabitacion(${h.id})" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-semibold transition" title="Modificar tarifa, tipo o camas">
          Modificar
        </button>
        <button onclick="eliminarHabitacionAdmin(${h.id})" class="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-semibold transition" title="Eliminar habitación">
          Eliminar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalNuevaHabitacion() {
  const modal = document.getElementById('modal-admin-hab-form');
  if (!modal) return;
  document.getElementById('ah-form-titulo').innerText = 'Agregar Nueva Habitación';
  document.getElementById('ah-hab-id').value = '';
  document.getElementById('ah-numero').value = '';
  document.getElementById('ah-piso').value = 'pb';
  document.getElementById('ah-tipo').value = 'Matrimonial';
  document.getElementById('ah-capacidad').value = '2';
  document.getElementById('ah-camas').value = '1';
  document.getElementById('ah-descripcion-camas').value = '1 CAMA DE 2 PLAZAS';
  document.getElementById('ah-tarifa').value = '30';
  modal.classList.remove('hidden');
}

function abrirModalEditarHabitacion(habId) {
  const cfg = obtenerHabitacionesConfig();
  const h = cfg.find(x => x.id === habId);
  if (!h) return;

  const modal = document.getElementById('modal-admin-hab-form');
  if (!modal) return;
  document.getElementById('ah-form-titulo').innerText = `Modificar Habitación #${h.numero}`;
  document.getElementById('ah-hab-id').value = h.id;
  document.getElementById('ah-numero').value = h.numero;
  document.getElementById('ah-piso').value = h.pisoId || 'pb';
  document.getElementById('ah-tipo').value = h.tipo;
  document.getElementById('ah-capacidad').value = h.capacidad;
  document.getElementById('ah-camas').value = h.camas;
  document.getElementById('ah-descripcion-camas').value = h.descripcionCamas;
  document.getElementById('ah-tarifa').value = h.tarifa;
  modal.classList.remove('hidden');
}

function cerrarModalHabitacionForm() {
  const modal = document.getElementById('modal-admin-hab-form');
  if (modal) modal.classList.add('hidden');
}

function guardarHabitacionAdmin() {
  const idStr = document.getElementById('ah-hab-id').value;
  const numero = document.getElementById('ah-numero').value.trim();
  const pisoId = document.getElementById('ah-piso').value;
  const tipo = document.getElementById('ah-tipo').value.trim();
  const capacidad = parseInt(document.getElementById('ah-capacidad').value, 10) || 1;
  const camas = parseInt(document.getElementById('ah-camas').value, 10) || 1;
  const descCamas = document.getElementById('ah-descripcion-camas').value.trim() || `${camas} CAMAS`;
  const tarifa = parseFloat(document.getElementById('ah-tarifa').value) || 0;

  if (!numero) {
    UIModal.aviso({ titulo: 'Dato Requerido', mensaje: 'Ingrese el número identificador de la habitación.', tipo: 'alerta' });
    return;
  }
  if (tarifa <= 0) {
    UIModal.aviso({ titulo: 'Tarifa Requerida', mensaje: 'Ingrese la tarifa por noche de la habitación.', tipo: 'alerta' });
    return;
  }

  const mapaPisos = {
    'pb': { piso: 'PLANTA BAJA', pisoCorto: 'PB' },
    'piso1': { piso: '1° PISO ALTO', pisoCorto: '1P' },
    'piso2': { piso: '2° PISO ALTO', pisoCorto: '2P' },
    'piso3': { piso: '3° PISO ALTO', pisoCorto: '3P' }
  };
  const pisoInfo = mapaPisos[pisoId] || mapaPisos['pb'];

  const catFiltro = tipo.toLowerCase().includes('matrimonial') ? 'matrimonial'
    : (tipo.toLowerCase().includes('individual') ? 'individual'
    : (tipo.toLowerCase().includes('doble') ? 'doble'
    : (tipo.toLowerCase().includes('triple') ? 'triple'
    : (tipo.toLowerCase().includes('cuadruple') || tipo.toLowerCase().includes('cuádruple') ? 'cuadruple'
    : 'quintuple'))));

  let cfg = obtenerHabitacionesConfig();

  if (idStr) {
    const h = cfg.find(x => x.id === parseInt(idStr, 10));
    if (h) {
      h.numero = numero;
      h.piso = pisoInfo.piso;
      h.pisoCorto = pisoInfo.pisoCorto;
      h.pisoId = pisoId;
      h.tipo = tipo;
      h.categoriaFiltro = catFiltro;
      h.capacidad = capacidad;
      h.camas = camas;
      h.descripcionCamas = descCamas;
      h.tarifa = tarifa;
    }
  } else {
    const nuevoId = (cfg.reduce((max, h) => Math.max(max, h.id || 0), 0)) + 1;
    cfg.push({
      id: nuevoId,
      numero,
      piso: pisoInfo.piso,
      pisoCorto: pisoInfo.pisoCorto,
      pisoId,
      capacidad,
      tipo,
      categoriaFiltro: catFiltro,
      descripcionCamas: descCamas,
      camas,
      tarifa
    });
  }

  habitacionesConfig = cfg;
  guardarStorage('habitaciones_config', habitacionesConfig, true);

  delete registrosDiarios[fechaSeleccionada];
  obtenerHabitacionesDia(fechaSeleccionada);
  guardarStorage('registros_diarios', registrosDiarios, true);

  cerrarModalHabitacionForm();
  renderAdminHabitaciones();
  renderCuadrados();
  if (modoVistaActual === 'hoja') renderTablaHojaRegistro();

  UIModal.aviso({
    titulo: 'Habitación Guardada',
    mensaje: `Habitación #${numero} (${tipo}) actualizada exitosamente con tarifa de $${tarifa.toFixed(2)}.`,
    tipo: 'exito'
  });
}

function eliminarHabitacionAdmin(habId) {
  const cfg = obtenerHabitacionesConfig();
  const h = cfg.find(x => x.id === habId);
  if (!h) return;

  const habsDia = obtenerHabitacionesDia(fechaSeleccionada);
  const habActual = habsDia.find(x => x.id === habId);
  if (habActual && habActual.estado === 'ocupada') {
    UIModal.aviso({
      titulo: 'No se puede eliminar',
      mensaje: `La Habitación #${h.numero} tiene huéspedes alojados actualmente (${habActual.huesped.nombre}). Realice el Check-out antes de eliminarla.`,
      tipo: 'alerta'
    });
    return;
  }

  UIModal.confirmar({
    titulo: 'Eliminar Habitación del Hotel',
    subtitulo: 'Hotel Norte · Administración',
    mensaje: `¿Confirma que desea eliminar permanentemente la Habitación #${h.numero} (${h.tipo})? Dejará de aparecer en el Rack y en la Planilla oficial.`,
    textoConfirmar: 'Sí, Eliminar Habitación',
    tipo: 'peligro',
    onConfirm: () => {
      habitacionesConfig = cfg.filter(x => x.id !== habId);
      guardarStorage('habitaciones_config', habitacionesConfig, true);

      if (registrosDiarios[fechaSeleccionada]) {
        registrosDiarios[fechaSeleccionada] = registrosDiarios[fechaSeleccionada].filter(x => x.id !== habId);
        guardarStorage('registros_diarios', registrosDiarios, true);
      }

      renderAdminHabitaciones();
      renderCuadrados();
      if (modoVistaActual === 'hoja') renderTablaHojaRegistro();

      UIModal.aviso({
        titulo: 'Habitación Eliminada',
        mensaje: `Habitación #${h.numero} eliminada de la configuración oficial.`,
        tipo: 'info'
      });
    }
  });
}

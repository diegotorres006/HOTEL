/* ==========================================================================
   HOTEL NORTE — NAVEGACIÓN Y FILTROS DE HABITACIONES
   Archivo: src/modules/rooms/rooms-navigation.js
   ========================================================================== */

function navegarDia(delta) {
  const d = new Date(fechaSeleccionada + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  seleccionarFechaDirecta(d.toISOString().slice(0, 10));
}

function irAHoy() {
  seleccionarFechaDirecta(FECHA_HOY);
}

function seleccionarFechaDirecta(f) {
  fechaSeleccionada = f;
  actualizarInterfazSegunFecha();
  renderCuadrados();
}

function actualizarInterfazSegunFecha() {
  const inputFecha = document.getElementById('input-fecha-selector');
  const lblDia = document.getElementById('label-dia-semana');
  if (inputFecha) inputFecha.value = fechaSeleccionada;
  if (lblDia) lblDia.innerText = formatearFechaLegible(fechaSeleccionada);

  const banner = document.getElementById('banner-contextual-dia');
  const badgeEstado = document.getElementById('badge-estado-dia');
  const badgeTexto = document.getElementById('badge-estado-texto');
  const btnReservadas = document.getElementById('f-reservadas');
  const btnPendientes = document.getElementById('f-pendientes');
  const leyendaReserva = document.getElementById('leyenda-item-reservada');
  const leyenda12PM = document.getElementById('leyenda-item-12pm');
  if (!banner) return;

  if (fechaSeleccionada < FECHA_HOY) {
    banner.className = 'bg-amber-950/60 border-b border-amber-800 px-5 py-1.5 flex flex-wrap items-center justify-between text-xs text-amber-200';
    document.getElementById('banner-icono').className = 'w-2 h-2 rounded-full bg-amber-400 inline-block';
    document.getElementById('banner-texto').innerHTML = '<strong>ARCHIVO HISTÓRICO (Solo Lectura):</strong> Registro correspondiente al ' + formatearFechaLegible(fechaSeleccionada) + '. Modificaciones deshabilitadas.';
    document.getElementById('banner-etiqueta').innerText = 'Archivo Cerrado';
    badgeEstado.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 bg-amber-950 text-amber-300 border border-amber-700';
    badgeTexto.innerText = 'Día Cerrado';
    btnReservadas.classList.add('hidden');
    btnPendientes.classList.add('hidden');
    leyendaReserva.classList.add('hidden');
    leyenda12PM.classList.add('hidden');
  } else if (fechaSeleccionada > FECHA_HOY) {
    banner.className = 'bg-indigo-950/60 border-b border-indigo-800 px-5 py-1.5 flex flex-wrap items-center justify-between text-xs text-indigo-200';
    document.getElementById('banner-icono').className = 'w-2 h-2 rounded-full bg-indigo-400 inline-block';
    document.getElementById('banner-texto').innerHTML = '<strong>PROGRAMACIÓN DE RESERVAS:</strong> ' + formatearFechaLegible(fechaSeleccionada) + '. Seleccione una habitación disponible para registrar una reserva.';
    document.getElementById('banner-etiqueta').innerText = 'Modo Reservas';
    badgeEstado.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 bg-indigo-950 text-indigo-300 border border-indigo-700';
    badgeTexto.innerText = 'Fecha Futura';
    btnReservadas.classList.remove('hidden');
    btnPendientes.classList.add('hidden');
    leyendaReserva.classList.remove('hidden');
    leyenda12PM.classList.add('hidden');
  } else {
    banner.className = 'bg-slate-200/70 border-b border-slate-300 px-5 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-700';
    document.getElementById('banner-icono').className = 'w-2 h-2 rounded-full bg-emerald-400 inline-block';
    document.getElementById('banner-texto').innerHTML = '<strong>OPERACIÓN DIARIA:</strong> Registro de ingresos, control de cobros y salidas del turno en curso.';
    document.getElementById('banner-etiqueta').innerText = 'En curso';
    badgeEstado.className = 'px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-700';
    badgeTexto.innerText = 'Operación del Día';
    btnReservadas.classList.remove('hidden');
    btnPendientes.classList.remove('hidden');
    leyendaReserva.classList.remove('hidden');
    leyenda12PM.classList.remove('hidden');
  }
}

function filtrar(f) {
  filtroActivo = f;
  ['todas', 'pendientes', 'ocupadas', 'reservadas', 'libres', 'debito'].forEach(id => {
    const btn = document.getElementById('f-' + id);
    if (!btn) return;
    if (id === 'pendientes' && fechaSeleccionada !== FECHA_HOY) return;
    btn.className = id === f
      ? 'px-2.5 py-1 rounded-md bg-blue-800 text-white border border-blue-600 font-semibold flex items-center gap-1.5'
      : 'px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium flex items-center gap-1.5';
  });
  renderCuadrados();
  if (modoVistaActual === 'hoja') renderTablaHojaRegistro();
}

function buscarHuespedActivo(texto) {
  busquedaActivosTexto = texto.trim().toLowerCase();
  const resultadoEl = document.getElementById('resultado-busqueda-activos');
  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  if (!busquedaActivosTexto) {
    resultadoEl.classList.add('hidden');
    renderCuadrados();
    return;
  }

  const encontrados = habs.filter(h =>
    (h.estado === 'ocupada' || h.estado === 'reservada') && h.huesped && (
      h.huesped.nombre.toLowerCase().includes(busquedaActivosTexto) ||
      h.huesped.cedula.includes(busquedaActivosTexto) ||
      h.numero.includes(busquedaActivosTexto)
    )
  );

  if (encontrados.length > 0) {
    resultadoEl.classList.remove('hidden');
    const h = encontrados[0];
    resultadoEl.innerHTML = 'Localizado: <strong>' + h.huesped.nombre + '</strong> — Habitación <strong>#' + h.numero + '</strong> <span class="text-slate-400">(Operador: ' + (h.registradoPor || '—') + ')</span>';
  } else {
    resultadoEl.classList.remove('hidden');
    resultadoEl.innerHTML = 'Sin coincidencias en las habitaciones activas.';
  }
  renderCuadrados();
}

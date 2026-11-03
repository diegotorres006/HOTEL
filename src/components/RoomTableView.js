/* ==========================================================================
   HOTEL NORTE — COMPONENTE DE PLANILLA DIARIA DE REGISTRO OFICIAL
   Archivo: src/components/RoomTableView.js
   Visualización Contable Optimizada para Pantallas 2K/32" sin Scroll Horizontal
   ========================================================================== */

function renderTablaHojaRegistro() {
  const tbody = document.getElementById('tbody-hoja-registro');
  if (!tbody) return;
  tbody.innerHTML = '';

  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const esHoy = fechaSeleccionada === FECHA_HOY;
  const post12 = esPost12PM();

  habs.forEach(hab => {
    if (filtroPisoActivo !== 'todos' && hab.pisoId !== filtroPisoActivo) return;
    if (filtroTipoActivo !== 'todos' && hab.categoriaFiltro !== filtroTipoActivo) return;

    const descCamas = hab.descripcionCamas || `${hab.camas} ${hab.camas === 1 ? 'cama' : 'camas'} (${hab.capacidad} pers)`;
    const descripcionHtml = `<div class="font-semibold text-slate-800">${hab.tipo}</div><div class="text-[10.5px] text-slate-500 font-mono tracking-tight">${descCamas}</div>`;

    // 1. RENDERIZAR ESTANCIAS PREVIAS COMPLETADAS HOY EN ESTA HABITACIÓN
    if (Array.isArray(hab.estanciasPasadas) && hab.estanciasPasadas.length > 0) {
      hab.estanciasPasadas.forEach((est, idx) => {
        if (filtroActivo === 'libres') return;
        if (filtroActivo === 'reservadas') return;
        if (filtroActivo === 'pendientes') return;
        if (filtroActivo === 'debito' && !(Number(est.debito || 0) > 0.05)) return;

        const trPast = document.createElement('tr');
        trPast.className = 'cursor-pointer hover:bg-slate-100 transition border-b border-slate-200 bg-slate-50/80';
        if (Number(est.debito || 0) > 0.05) trPast.classList.add('row-debito');

        const pagadoVal = Number(est.pagado || 0);
        const debitoVal = Number(est.debito || 0);

        trPast.innerHTML = [
          '<td class="text-center font-bold font-mono text-slate-900 bg-purple-50/70 border-r border-purple-200 whitespace-nowrap">#' + hab.numero + '<br><span class="text-[9px] font-bold text-purple-700 bg-purple-100 border border-purple-300 px-1 py-0.2 rounded">' + (idx + 1) + 'ª Estancia</span></td>',
          '<td class="text-left">' + descripcionHtml + '</td>',
          '<td class="text-center font-mono text-slate-800 font-semibold">' + (est.horaEntrada || '—') + '</td>',
          '<td class="text-center font-mono text-slate-700">' + (est.controlesEntrada ?? '—') + '</td>',
          '<td class="text-center font-mono text-slate-700">' + (est.toallasEntrada ?? '—') + '</td>',
          '<td class="text-center font-mono font-semibold text-slate-800">' + (est.numHuespedes || 1) + '</td>',
          '<td><strong class="text-slate-900 font-bold">' + est.huesped + '</strong> <span class="text-[10px] text-slate-500 font-semibold">(Salida: ' + (est.horaSalida || '—') + ')</span></td>',
          '<td class="font-mono text-slate-700">' + (est.cedula || '—') + '</td>',
          '<td class="text-slate-700">' + (est.procedencia || '—') + '</td>',
          '<td class="font-mono text-slate-700">' + (est.telefono || '—') + '</td>',
          '<td class="text-center font-mono text-slate-700">' + (est.horaPago || '—') + '</td>',
          '<td class="text-right font-mono font-semibold text-emerald-600">$' + pagadoVal.toFixed(2) + '</td>',
          '<td class="text-right font-mono font-semibold ' + ((debitoVal > 0) ? 'text-amber-600 font-bold' : 'text-slate-400') + '">' + (debitoVal > 0 ? ('$' + debitoVal.toFixed(2)) : '—') + '</td>',
          '<td class="text-center font-mono font-semibold text-red-600">' + (est.horaSalida || '—') + '</td>',
          '<td class="text-center font-mono text-slate-700">' + (est.controlesSalida ?? '—') + '</td>',
          '<td class="text-center font-mono text-slate-700">' + (est.toallasSalida ?? '—') + '</td>',
          '<td class="text-center text-[11px] text-slate-700 font-medium">' + (est.registradoPor || '—') + '</td>',
          '<td class="text-slate-700 text-xs font-medium">' + (est.observaciones ? est.observaciones : 'Estancia de paso finalizada hoy') + '</td>'
        ].join('');

        trPast.onclick = () => verDetalleEstanciaPasada(hab.id, idx);
        tbody.appendChild(trPast);
      });
    }

    // 2. RENDERIZAR ESTANCIA ACTIVA O ESTADO ACTUAL
    const pendiente12 = esHoy && hab.estado === 'ocupada' && hab.venceHoy && post12;
    if (filtroActivo === 'libres' && hab.estado !== 'libre' && hab.estado !== 'sucia') return;
    if (filtroActivo === 'ocupadas' && hab.estado !== 'ocupada') return;
    if (filtroActivo === 'reservadas' && hab.estado !== 'reservada') return;
    if (filtroActivo === 'debito' && !(Number(hab.debito || 0) > 0.05)) return;
    if (filtroActivo === 'pendientes' && !pendiente12) return;

    const tr = document.createElement('tr');
    tr.className = 'cursor-pointer hover:bg-slate-100 transition border-b border-slate-200';
    const tieneHuesped = !!hab.huesped;
    const esOcupada = hab.estado === 'ocupada';
    const esReserva = hab.estado === 'reservada';
    const tieneDebito = Number(hab.debito || 0) > 0.05;

    if (esOcupada) tr.classList.add('row-ocupada');
    else if (esReserva) tr.classList.add('row-reservada');
    if (tieneDebito) tr.classList.add('row-debito');

    const horaEntrada = hab.horaEntrada || hab.horaRegistro || '—';
    const contEntrada = tieneHuesped ? (hab.controles ?? '—') : '—';
    const toaEntrada = tieneHuesped ? (hab.toallas ?? '—') : '—';
    const numHues = tieneHuesped ? (hab.numHuespedes || hab.capacidad || 1) : '—';
    const nombre = hab.huesped ? hab.huesped.nombre : (esReserva ? (hab.origenBooking ? 'Reserva Booking' : 'Reserva Interna') : 'Disponible');
    const cedula = hab.huesped ? hab.huesped.cedula : '—';
    const procedencia = hab.huesped ? (hab.huesped.procedencia || '—') : '—';
    const telefono = hab.huesped ? (hab.huesped.telefono || '—') : '—';
    const horaPago = hab.horaPago || hab.horaRegistro || '—';
    const pagadoVal = tieneHuesped ? Number(hab.pagado || 0) : null;
    const debitoVal = tieneHuesped ? Number(hab.debito || 0) : null;
    const pagado = pagadoVal !== null ? ('$' + pagadoVal.toFixed(2)) : '—';
    const debito = debitoVal !== null ? ('$' + debitoVal.toFixed(2)) : '—';
    const horaSalida = hab.horaSalida || '—';
    const contSalida = hab.controlesSalida ?? '—';
    const toaSalida = hab.toallasSalida ?? '—';
    const turno = hab.registradoPor || '—';

    const cantEstPrev = (hab.estanciasPasadas || []).length;
    const obsHuesped = (hab.huesped && hab.huesped.obs && hab.huesped.obs.trim())
      ? hab.huesped.obs.trim()
      : (esReserva
          ? (hab.origenBooking ? 'Reserva programada vía Booking.com' : 'Reserva interna programada')
          : (cantEstPrev > 0 ? `Habitación libre tras ${cantEstPrev} estancia(s) hoy (Última salida: ${hab.estanciasPasadas[cantEstPrev - 1].horaSalida})` : '—'));

    const badgeHab = cantEstPrev > 0
      ? (hab.estado === 'ocupada'
          ? '<br><span class="text-[9px] font-bold text-blue-700 bg-blue-100 border border-blue-300 px-1 py-0.2 rounded">' + (cantEstPrev + 1) + 'ª Estancia (Activa)</span>'
          : '<br><span class="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded">Disponible</span>')
      : '<br><span class="text-[9px] font-medium text-slate-500">' + hab.pisoCorto + ' · ' + hab.capacidad + 'p</span>';

    tr.innerHTML = [
      '<td class="text-center font-bold font-mono text-slate-900 bg-slate-100 whitespace-nowrap">#' + hab.numero + badgeHab + '</td>',
      '<td class="text-left">' + descripcionHtml + '</td>',
      '<td class="text-center font-mono text-slate-800 font-semibold">' + horaEntrada + '</td>',
      '<td class="text-center font-mono text-slate-700">' + contEntrada + '</td>',
      '<td class="text-center font-mono text-slate-700">' + toaEntrada + '</td>',
      '<td class="text-center font-mono font-semibold text-slate-800">' + numHues + '</td>',
      '<td class="' + (tieneHuesped ? 'font-bold text-slate-900' : 'text-slate-400') + '">' + nombre + '</td>',
      '<td class="font-mono text-slate-700">' + cedula + '</td>',
      '<td class="text-slate-700">' + procedencia + '</td>',
      '<td class="font-mono text-slate-700">' + telefono + '</td>',
      '<td class="text-center font-mono text-slate-700">' + horaPago + '</td>',
      '<td class="text-right font-mono font-semibold text-emerald-600">' + pagado + '</td>',
      '<td class="text-right font-mono font-semibold ' + ((debitoVal > 0) ? 'text-amber-600 font-bold' : 'text-slate-400') + '">' + debito + '</td>',
      '<td class="text-center font-mono font-semibold text-red-600">' + horaSalida + '</td>',
      '<td class="text-center font-mono text-slate-700">' + contSalida + '</td>',
      '<td class="text-center font-mono text-slate-700">' + toaSalida + '</td>',
      '<td class="text-center text-[11px] text-slate-700 font-medium">' + turno + '</td>',
      '<td class="text-slate-700 text-xs font-medium">' + obsHuesped + '</td>'
    ].join('');

    tr.onclick = () => clickCuadrado(hab.id);
    tbody.appendChild(tr);
  });
}

function verDetalleEstanciaPasada(habId, indexEstancia) {
  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const hab = habs.find(h => h.id === habId);
  if (!hab || !hab.estanciasPasadas || !hab.estanciasPasadas[indexEstancia]) return;
  const est = hab.estanciasPasadas[indexEstancia];

  UIModal.aviso({
    titulo: `Habitación #${hab.numero} — ${indexEstancia + 1}ª Estancia Completada Hoy`,
    subtitulo: `${est.huesped} · Salida: ${est.horaSalida}`,
    mensaje: `Esta estancia fue registrada formalmente a las ${est.horaEntrada} por ${est.registradoPor} y el huésped realizó su Check-out a las ${est.horaSalida}. La habitación quedó posteriormente libre para nuevos ingresos.`,
    tipo: 'info',
    detalles: [
      { etiqueta: 'Huésped Titular', valor: est.huesped },
      { etiqueta: 'Identificación (Cédula)', valor: est.cedula || '—' },
      { etiqueta: 'Procedencia / Teléfono', valor: `${est.procedencia || '—'} · ${est.telefono || '—'}` },
      { etiqueta: 'Monto Recaudado', valor: '$' + Number(est.pagado || 0).toFixed(2) + ` (${est.metodoPago || 'Efectivo'})` },
      { etiqueta: 'Saldo Pendiente al Salir', valor: '$' + Number(est.debito || 0).toFixed(2) },
      { etiqueta: 'Dotación Devuelta', valor: `${est.controlesSalida ?? est.controlesEntrada} controles · ${est.toallasSalida ?? est.toallasEntrada} toallas` },
      { etiqueta: 'Horario de Estancia', valor: `${est.horaEntrada} hasta ${est.horaSalida}` },
      { etiqueta: 'Operador en Turno', valor: est.registradoPor || 'Recepción' }
    ]
  });
}

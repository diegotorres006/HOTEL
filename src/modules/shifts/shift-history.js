/* ==========================================================================
   HOTEL NORTE — AUDITORÍA E HISTORIAL DE TURNOS CERRADOS
   Archivo: src/modules/shifts/shift-history.js
   ========================================================================== */

function abrirModalHistorialTurnos(desdeLogin = false) {
  renderHistorialTurnos();
  document.getElementById('modal-historial-turnos').classList.remove('hidden');
}

function cerrarModalHistorialTurnos() {
  document.getElementById('modal-historial-turnos').classList.add('hidden');
}

function renderHistorialTurnos() {
  const filtroEmp = document.getElementById('filtro-historial-empleado')?.value || 'todos';
  const lista = document.getElementById('lista-turnos-cerrados');
  if (!lista) return;

  let turnos = turnosHistoricos;
  if (filtroEmp !== 'todos') {
    turnos = turnos.filter(t => t.empleado === filtroEmp);
  }

  const badgeTotal = document.getElementById('total-turnos-badge');
  if (badgeTotal) badgeTotal.innerText = turnos.length;

  if (turnos.length === 0) {
    lista.innerHTML = '<div class="text-center py-10 text-slate-500">No se encontraron actas de turno para el criterio seleccionado.</div>';
    return;
  }

  lista.innerHTML = turnos.map(t => {
    const inicio = new Date(t.horaInicio);
    const fin = new Date(t.horaFin);
    const numRegistros = (t.registros || []).filter(r => r.tipo === 'CHECK-IN' || r.tipo === 'RESERVA').length;

    const retiroAdmin = t.retiroTotalAdministradora !== undefined
      ? '$' + Number(t.retiroTotalAdministradora).toFixed(2)
      : '$' + Number(t.totalEfectivo || 0).toFixed(2);

    const remanenteHotel = t.fondosFijosRemanentesHotel !== undefined
      ? '$' + Number(t.fondosFijosRemanentesHotel).toFixed(2)
      : '$250.00';

    return `
      <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 text-sm">${t.empleado}</span>
            <span class="text-[11px] bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded font-medium">${t.turno}</span>
            <span class="text-[10px] text-slate-400 font-mono">${t.id}</span>
          </div>
          <div class="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
            <span>Apertura: ${formatHoraCompleta(inicio)}</span>
            <span>—</span>
            <span>Cierre: ${formatHoraCompleta(fin)}</span>
          </div>
          <div class="text-[11px] text-slate-600 flex items-center gap-3">
            <span>Operaciones de hospedaje: <strong class="text-slate-900 font-mono">${numRegistros}</strong></span>
            ${t.cajaHospedaje ? `<span class="text-emerald-700">· Hospedaje Recaudado: <strong>+$${Number(t.cajaHospedaje.recaudadoEfectivo || 0).toFixed(2)}</strong></span>` : ''}
            ${t.cajaBar ? `<span class="text-sky-700">· Bar Recaudado: <strong>+$${Number(t.cajaBar.recaudadoEfectivo || 0).toFixed(2)}</strong></span>` : ''}
          </div>
        </div>

        <div class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200 pt-2 md:pt-0">
          <div class="text-right">
            <span class="text-[10px] text-purple-700 block uppercase font-bold">Retiro Admin</span>
            <span class="text-purple-700 font-mono font-bold text-sm">${retiroAdmin}</span>
          </div>
          <div class="text-right border-l border-slate-200 pl-3">
            <span class="text-[10px] text-slate-500 block uppercase font-bold">Quedó en Cajas</span>
            <span class="text-emerald-600 font-mono font-bold text-sm">${remanenteHotel}</span>
          </div>
          <div class="text-right border-l border-slate-200 pl-3">
            <span class="text-[10px] text-slate-500 block uppercase font-bold">Total Recaudado</span>
            <span class="text-slate-900 font-mono font-bold text-sm">$${(t.totalPagado || 0).toFixed(2)}</span>
          </div>
          <button onclick="verDetalleTurnoEspecifico('${t.id}')"
            class="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition">
            Ver Detalle
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function verDetalleTurnoEspecifico(idTurno) {
  const turno = turnosHistoricos.find(t => t.id === idTurno);
  if (!turno) return;

  document.getElementById('dte-titulo').innerText = 'Acta de Turno — ' + turno.empleado;
  document.getElementById('dte-subtitulo').innerText =
    turno.turno + ' · ' + formatHoraCompleta(new Date(turno.horaInicio)) + ' a ' + formatHoraCompleta(new Date(turno.horaFin));

  const numRegs = (turno.registros || []).filter(r => r.tipo === 'CHECK-IN' || r.tipo === 'RESERVA').length;
  document.getElementById('dte-registros').innerText = numRegs;

  const retiroAdmin = turno.retiroTotalAdministradora !== undefined
    ? '$' + Number(turno.retiroTotalAdministradora).toFixed(2)
    : '$' + (turno.totalEfectivo || 0).toFixed(2);
  document.getElementById('dte-efectivo').innerText = retiroAdmin;
  document.getElementById('dte-total').innerText = '$' + (turno.totalPagado || 0).toFixed(2);

  const cont = document.getElementById('dte-lista-movimientos');
  if (!turno.registros || turno.registros.length === 0) {
    cont.innerHTML = '<div class="text-slate-500 italic py-4 text-center">Sin movimientos registrados en este turno.</div>';
  } else {
    cont.innerHTML = turno.registros.map(r => `
      <div class="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900">${r.tipo} ${r.hab ? 'Hab #' + r.hab : ''}</span>
            <span class="text-slate-500 font-mono text-[11px]">${formatHora(new Date(r.hora))}</span>
          </div>
          <div class="text-slate-600 mt-0.5">${r.descripcion}</div>
        </div>
        <span class="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-300">
          ${turno.empleado}
        </span>
      </div>
    `).join('');
  }

  document.getElementById('modal-detalle-turno-especifico').classList.remove('hidden');
}

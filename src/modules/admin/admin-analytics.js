/* ==========================================================================
   HOTEL NORTE — AUDITORÍA Y RESUMEN ANALÍTICO DE EMPLEADOS
   Archivo: src/modules/admin/admin-analytics.js
   ========================================================================== */

function renderAdminResumenEmpleados() {
  const select = document.getElementById('select-resumen-empleado');
  if (!select) return;

  select.innerHTML = empleados.map(e => {
    return `<option value="${e.id}" ${e.id === empleadoResumenSeleccionadoId ? 'selected' : ''}>${e.nombre} (${e.cargo})</option>`;
  }).join('');

  if (!empleadoResumenSeleccionadoId && empleados.length > 0) {
    empleadoResumenSeleccionadoId = empleados[0].id;
  }

  select.value = empleadoResumenSeleccionadoId;
  cargarDetalleResumenEmpleado(empleadoResumenSeleccionadoId);
}

function verResumenEmpleadoDirecto(empId) {
  empleadoResumenSeleccionadoId = empId;
  cambiarTabAdmin('resumen');
}

function cargarDetalleResumenEmpleado(empId) {
  empleadoResumenSeleccionadoId = parseInt(empId, 10);
  const emp = empleados.find(x => x.id === empleadoResumenSeleccionadoId);
  if (!emp) return;

  const turnosEmp = turnosHistoricos.filter(t => (t.empleado === emp.nombre) || (t.empleado && t.empleado.id === emp.id));
  const ventasEmp = ventasBar.filter(v => v.registradoPor && v.registradoPor.toLowerCase().includes(emp.nombre.toLowerCase().split(' ')[0]));
  
  let totalRecaudadoTurnos = 0;
  let totalDiferenciasCaja = 0;
  let totalCheckinsContados = 0;

  turnosEmp.forEach(t => {
    totalRecaudadoTurnos += Number(t.totalPagado || 0);
    const dif = (t.cajaHospedaje?.diferencia || 0) + (t.cajaBar?.diferencia || 0) || Number(t.diferencia || 0);
    totalDiferenciasCaja += dif;
    if (Array.isArray(t.registros)) {
      totalCheckinsContados += t.registros.filter(r => r.tipo === 'CHECK-IN').length;
    }
  });

  let totalVentasBarMonto = 0;
  ventasEmp.forEach(v => {
    totalVentasBarMonto += Number(v.total || 0);
  });

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setT('re-emp-nombre', emp.nombre);
  setT('re-emp-cargo', emp.cargo + ' · ' + emp.turno);
  setT('re-total-turnos', turnosEmp.length);
  setT('re-total-recaudado', '$' + totalRecaudadoTurnos.toFixed(2));
  setT('re-total-checkins', totalCheckinsContados);
  setT('re-total-ventas-bar', '$' + totalVentasBarMonto.toFixed(2));
  
  const difEl = document.getElementById('re-diferencia-caja');
  if (difEl) {
    difEl.innerText = (totalDiferenciasCaja >= 0 ? '+$' : '-$') + Math.abs(totalDiferenciasCaja).toFixed(2);
    difEl.className = 'font-mono font-bold text-sm ' + (Math.abs(totalDiferenciasCaja) < 0.01 ? 'text-slate-200' : (totalDiferenciasCaja > 0 ? 'text-emerald-400' : 'text-red-400'));
  }

  const tbody = document.getElementById('tbody-resumen-turnos-empleado');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (turnosEmp.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-slate-400 text-xs">Este empleado aún no tiene turnos cerrados en el historial.</td></tr>';
    return;
  }

  turnosEmp.forEach(t => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-700/60 hover:bg-slate-800/40 text-xs text-slate-200';

    const difNum = (t.cajaHospedaje?.diferencia || 0) + (t.cajaBar?.diferencia || 0) || Number(t.diferencia || 0);
    const difTxt = Math.abs(difNum) < 0.01 
      ? '<span class="text-emerald-400 font-mono font-bold">Cuadrado ($0.00)</span>' 
      : (difNum > 0 ? `<span class="text-blue-300 font-mono font-bold">Sobrante +$${difNum.toFixed(2)}</span>` : `<span class="text-red-400 font-mono font-bold">Faltante -$${Math.abs(difNum).toFixed(2)}</span>`);

    const horaIniStr = t.horaInicio ? formatHora(new Date(t.horaInicio)) : '—';
    const horaFinStr = t.horaFin ? formatHora(new Date(t.horaFin)) : 'Cierre';
    const fechaTurnoStr = t.horaInicio ? t.horaInicio.slice(0, 10) : (t.fechaApertura || t.fecha || '—');

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-white">${fechaTurnoStr}</td>
      <td class="py-2.5 px-3 text-slate-300">${t.turno}</td>
      <td class="py-2.5 px-3 font-mono text-slate-400">${horaIniStr} – ${horaFinStr}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">$${Number(t.totalPagado || 0).toFixed(2)}</td>
      <td class="py-2.5 px-3 text-right font-mono text-slate-300">$${Number(t.totalEfectivo || t.conteoEfectivoFinal || 0).toFixed(2)}</td>
      <td class="py-2.5 px-3 text-center">${difTxt}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================================================================
   HOTEL NORTE — PROTOCOLO DE CIERRE DE TURNO Y ROTACIÓN DE HORARIO
   Archivo: src/modules/shifts/shift-close.js
   ========================================================================== */

function iniciarCierreTurno() {
  if (!sesionActiva) {
    abrirModalLoginEmpleado();
    return;
  }
  const ahora = new Date();
  const inicio = new Date(sesionActiva.horaInicio);
  const diffMs = ahora - inicio;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  document.getElementById('cierre-empleado').innerText = sesionActiva.empleado.nombre;
  document.getElementById('cierre-turno').innerText = sesionActiva.turno;
  document.getElementById('cierre-inicio').innerText = formatHoraCompleta(inicio);
  document.getElementById('cierre-fin').innerText = formatHoraCompleta(ahora);
  document.getElementById('cierre-duracion').innerText = diffHrs + ' h ' + diffMins + ' min';

  const fBaseHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const recHosp = Number(sesionActiva.recaudadoEfectivoHospedaje || 0);
  const espHosp = fBaseHosp + recHosp;

  const fBaseBar = Number(configCajas?.fondoFijoBar || 50.00);
  const recBar = Number(sesionActiva.recaudadoEfectivoBar || 0);
  const espBar = fBaseBar + recBar;

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setT('cierre-hosp-base', '$' + fBaseHosp.toFixed(2));
  setT('cierre-hosp-recaudado', (recHosp >= 0 ? '+' : '') + '$' + recHosp.toFixed(2));
  setT('cierre-hosp-esperado', '$' + espHosp.toFixed(2));

  setT('cierre-bar-base', '$' + fBaseBar.toFixed(2));
  setT('cierre-bar-recaudado', (recBar >= 0 ? '+' : '') + '$' + recBar.toFixed(2));
  setT('cierre-bar-esperado', '$' + espBar.toFixed(2));

  const inpHosp = document.getElementById('cierre-fisico-hospedaje');
  const inpBar = document.getElementById('cierre-fisico-bar');
  if (inpHosp) inpHosp.value = espHosp.toFixed(2);
  if (inpBar) inpBar.value = espBar.toFixed(2);

  recalcularCuadraturaCierre();

  const listaMovs = document.getElementById('cierre-detalle-movimientos');
  if (listaMovs) {
    if (sesionActiva.registros.length === 0) {
      listaMovs.innerHTML = '<div class="text-slate-400 italic">Sin movimientos registrados en esta sesión.</div>';
    } else {
      listaMovs.innerHTML = sesionActiva.registros.map(r => `
        <div class="flex items-center justify-between py-1 border-b border-slate-100">
          <span class="font-semibold text-slate-800">${r.tipo} ${r.hab ? '#' + r.hab : ''}</span>
          <span class="text-slate-600 truncate max-w-[220px]">${r.descripcion}</span>
          <span class="font-mono text-[10px] text-slate-500">${formatHora(new Date(r.hora))}</span>
        </div>
      `).join('');
    }
  }

  document.getElementById('modal-cierre-sesion').classList.remove('hidden');
}

function cerrarSesionDesdeArqueo() {
  cerrarModalArqueo();
  iniciarCierreTurno();
}

function confirmarCierreSesion() {
  if (!sesionActiva) return;
  const ahora = new Date();

  const fBaseHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const recHosp = Number(sesionActiva.recaudadoEfectivoHospedaje || 0);
  const espHosp = fBaseHosp + recHosp;

  const fBaseBar = Number(configCajas?.fondoFijoBar || 50.00);
  const recBar = Number(sesionActiva.recaudadoEfectivoBar || 0);
  const espBar = fBaseBar + recBar;

  const inpHosp = document.getElementById('cierre-fisico-hospedaje');
  const inpBar = document.getElementById('cierre-fisico-bar');
  const fisHosp = Math.max(0, parseFloat(inpHosp?.value) || 0);
  const fisBar = Math.max(0, parseFloat(inpBar?.value) || 0);

  const difHosp = Math.round((fisHosp - espHosp) * 100) / 100;
  const difBar = Math.round((fisBar - espBar) * 100) / 100;

  const retiroHosp = Math.max(0, Math.round((fisHosp - fBaseHosp) * 100) / 100);
  const quedanHosp = Math.min(fisHosp, fBaseHosp);

  const retiroBar = Math.max(0, Math.round((fisBar - fBaseBar) * 100) / 100);
  const quedanBar = Math.min(fisBar, fBaseBar);

  const totalRetiroAdmin = Math.round((retiroHosp + retiroBar) * 100) / 100;
  const totalFondosQuedan = Math.round((quedanHosp + quedanBar) * 100) / 100;

  registrarAccion('CIERRE DE TURNO', `${sesionActiva.empleado.nombre} finalizó turno. Retiro Administradora: $${totalRetiroAdmin.toFixed(2)} (Hosp: $${retiroHosp.toFixed(2)}, Bar: $${retiroBar.toFixed(2)}). Fondos en hotel: $${totalFondosQuedan.toFixed(2)}.`);

  const turnoFinalizado = {
    id: sesionActiva.idTurno,
    empleado: sesionActiva.empleado.nombre,
    cargo: sesionActiva.empleado.cargo,
    turno: sesionActiva.turno,
    horaInicio: sesionActiva.horaInicio,
    horaFin: ahora.toISOString(),

    // Liquidación Caja Hospedaje
    cajaHospedaje: {
      fondoBase: fBaseHosp,
      recaudadoEfectivo: recHosp,
      totalEsperadoGaveta: espHosp,
      conteoFisico: fisHosp,
      diferencia: difHosp,
      retiroAdministradora: retiroHosp,
      fondoRemanenteGaveta: quedanHosp,
      transferencias: Number(sesionActiva.recaudadoTransferenciaHospedaje || 0),
      datafono: Number(sesionActiva.recaudadoDatafonoHospedaje || 0)
    },

    // Liquidación Caja Bar
    cajaBar: {
      fondoBase: fBaseBar,
      recaudadoEfectivo: recBar,
      totalEsperadoGaveta: espBar,
      conteoFisico: fisBar,
      diferencia: difBar,
      retiroAdministradora: retiroBar,
      fondoRemanenteGaveta: quedanBar,
      transferencias: Number(sesionActiva.recaudadoTransferenciaBar || 0),
      datafono: Number(sesionActiva.recaudadoDatafonoBar || 0)
    },

    // Protocolo de Rotación
    retiroTotalAdministradora: totalRetiroAdmin,
    fondosFijosRemanentesHotel: totalFondosQuedan,

    // Totales globales compatibles
    totalPagado: sesionActiva.totalPagado,
    totalEfectivo: fisHosp + fisBar,
    totalTransferencia: Number(sesionActiva.totalTransferencia || 0),
    totalDatafono: Number(sesionActiva.totalDatafono || 0),
    totalDebito: Number(sesionActiva.totalDebito || 0),
    registros: [...sesionActiva.registros]
  };

  turnosHistoricos.unshift(turnoFinalizado);
  guardarStorage('turnos_historicos', turnosHistoricos, true);

  sesionActiva = null;
  guardarStorage('sesion_activa', null);

  document.getElementById('modal-cierre-sesion').classList.add('hidden');
  document.getElementById('hdr-empleado').innerText = 'Sin operador activo';
  document.getElementById('hdr-turno').innerText = 'Turno Cerrado';
  document.getElementById('hdr-hora-inicio').innerText = '—';
  volverSeleccion();
  renderListaEmpleados();
  actualizarIndicadoresCajaHeader();
  renderCuadrados();

  UIModal.aviso({
    titulo: 'Turno Cerrado y Cuadrado con Éxito',
    subtitulo: 'Hotel Norte · Protocolo de Rotación de Horario Cumplido',
    mensaje: `Se selló la jornada de "${turnoFinalizado.empleado}". La administradora toma $${totalRetiroAdmin.toFixed(2)} de ganancias del turno y quedan exactamente $${totalFondosQuedan.toFixed(2)} en cajas para el siguiente turno ($${quedanHosp.toFixed(2)} en Hospedaje y $${quedanBar.toFixed(2)} en Bar).`,
    tipo: 'exito',
    detalles: [
      { etiqueta: 'Operador Saliente', valor: turnoFinalizado.empleado },
      { etiqueta: 'Ganancia Retirada por Administradora', valor: '$' + totalRetiroAdmin.toFixed(2) },
      { etiqueta: 'Fondo Caja Hospedaje Entregado', valor: '$' + quedanHosp.toFixed(2) },
      { etiqueta: 'Fondo Caja Bar Entregado', valor: '$' + quedanBar.toFixed(2) },
      { etiqueta: 'Total Recaudado en Jornada', valor: '$' + turnoFinalizado.totalPagado.toFixed(2) }
    ]
  });
}

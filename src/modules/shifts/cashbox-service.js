/* ==========================================================================
   HOTEL NORTE — CONTROL DE CAJAS DUALES (HOSPEDAJE $200 / BAR $50)
   Archivo: src/modules/shifts/cashbox-service.js
   ========================================================================== */

function actualizarIndicadoresCajaHeader() {
  const fHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const fBar = Number(configCajas?.fondoFijoBar || 50.00);

  let recEfectivoHosp = 0;
  let recEfectivoBar = 0;

  if (sesionActiva) {
    recEfectivoHosp = Number(sesionActiva.recaudadoEfectivoHospedaje || 0);
    recEfectivoBar = Number(sesionActiva.recaudadoEfectivoBar || 0);
  }

  const totalGavetaHosp = fHosp + recEfectivoHosp;
  const totalGavetaBar = fBar + recEfectivoBar;

  const elHospRec = document.getElementById('hdr-caja-hosp-recaudado');
  const elHospTot = document.getElementById('hdr-caja-hosp-total');
  const elBarRec = document.getElementById('hdr-caja-bar-recaudado');
  const elBarTot = document.getElementById('hdr-caja-bar-total');

  if (elHospRec) elHospRec.innerText = (recEfectivoHosp >= 0 ? '+' : '') + '$' + recEfectivoHosp.toFixed(2);
  if (elHospTot) elHospTot.innerText = '$' + totalGavetaHosp.toFixed(2);
  if (elBarRec) elBarRec.innerText = (recEfectivoBar >= 0 ? '+' : '') + '$' + recEfectivoBar.toFixed(2);
  if (elBarTot) elBarTot.innerText = '$' + totalGavetaBar.toFixed(2);
}

function registrarIngresoHospedaje(monto, metodo) {
  const m = Number(monto || 0);
  if (!sesionActiva || m <= 0) return;

  sesionActiva.totalPagado = Math.round(((sesionActiva.totalPagado || 0) + m) * 100) / 100;
  if (metodo === 'Efectivo') {
    sesionActiva.recaudadoEfectivoHospedaje = Math.round(((sesionActiva.recaudadoEfectivoHospedaje || 0) + m) * 100) / 100;
    sesionActiva.totalEfectivo = Math.round(((sesionActiva.totalEfectivo || 0) + m) * 100) / 100;
  } else if (metodo === 'Transferencia') {
    sesionActiva.recaudadoTransferenciaHospedaje = Math.round(((sesionActiva.recaudadoTransferenciaHospedaje || 0) + m) * 100) / 100;
    sesionActiva.totalTransferencia = Math.round(((sesionActiva.totalTransferencia || 0) + m) * 100) / 100;
  } else {
    sesionActiva.recaudadoDatafonoHospedaje = Math.round(((sesionActiva.recaudadoDatafonoHospedaje || 0) + m) * 100) / 100;
    sesionActiva.totalDatafono = Math.round(((sesionActiva.totalDatafono || 0) + m) * 100) / 100;
  }

  guardarStorage('sesion_activa', sesionActiva);
  actualizarIndicadoresCajaHeader();
}

function registrarIngresoBar(monto, metodo) {
  const m = Number(monto || 0);
  if (!sesionActiva || m <= 0) return;

  sesionActiva.totalPagado = Math.round(((sesionActiva.totalPagado || 0) + m) * 100) / 100;
  if (metodo === 'Efectivo') {
    sesionActiva.recaudadoEfectivoBar = Math.round(((sesionActiva.recaudadoEfectivoBar || 0) + m) * 100) / 100;
    sesionActiva.totalEfectivo = Math.round(((sesionActiva.totalEfectivo || 0) + m) * 100) / 100;
  } else if (metodo === 'Transferencia') {
    sesionActiva.recaudadoTransferenciaBar = Math.round(((sesionActiva.recaudadoTransferenciaBar || 0) + m) * 100) / 100;
    sesionActiva.totalTransferencia = Math.round(((sesionActiva.totalTransferencia || 0) + m) * 100) / 100;
  } else {
    sesionActiva.recaudadoDatafonoBar = Math.round(((sesionActiva.recaudadoDatafonoBar || 0) + m) * 100) / 100;
    sesionActiva.totalDatafono = Math.round(((sesionActiva.totalDatafono || 0) + m) * 100) / 100;
  }

  guardarStorage('sesion_activa', sesionActiva);
  actualizarIndicadoresCajaHeader();
}

function cuadrarExactoCaja(tipo) {
  if (!sesionActiva) return;
  if (tipo === 'hospedaje') {
    const fBaseHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
    const recHosp = Number(sesionActiva.recaudadoEfectivoHospedaje || 0);
    const inpHosp = document.getElementById('cierre-fisico-hospedaje');
    if (inpHosp) inpHosp.value = (fBaseHosp + recHosp).toFixed(2);
  } else if (tipo === 'bar') {
    const fBaseBar = Number(configCajas?.fondoFijoBar || 50.00);
    const recBar = Number(sesionActiva.recaudadoEfectivoBar || 0);
    const inpBar = document.getElementById('cierre-fisico-bar');
    if (inpBar) inpBar.value = (fBaseBar + recBar).toFixed(2);
  }
  recalcularCuadraturaCierre();
}

function recalcularCuadraturaCierre() {
  const fBaseHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const recHosp = Number(sesionActiva?.recaudadoEfectivoHospedaje || 0);
  const espHosp = fBaseHosp + recHosp;

  const fBaseBar = Number(configCajas?.fondoFijoBar || 50.00);
  const recBar = Number(sesionActiva?.recaudadoEfectivoBar || 0);
  const espBar = fBaseBar + recBar;

  const inpHosp = document.getElementById('cierre-fisico-hospedaje');
  const inpBar = document.getElementById('cierre-fisico-bar');

  const fisHosp = Math.max(0, parseFloat(inpHosp?.value) || 0);
  const fisBar = Math.max(0, parseFloat(inpBar?.value) || 0);

  const difHosp = Math.round((fisHosp - espHosp) * 100) / 100;
  const difBar = Math.round((fisBar - espBar) * 100) / 100;

  const elDifHosp = document.getElementById('cierre-dif-hospedaje');
  if (elDifHosp) {
    if (Math.abs(difHosp) < 0.01) {
      elDifHosp.className = 'font-bold text-emerald-600';
      elDifHosp.innerText = '$0.00 (Exacto)';
    } else if (difHosp > 0) {
      elDifHosp.className = 'font-bold text-amber-600';
      elDifHosp.innerText = '+$' + difHosp.toFixed(2) + ' (Sobrante)';
    } else {
      elDifHosp.className = 'font-bold text-red-600';
      elDifHosp.innerText = '-$' + Math.abs(difHosp).toFixed(2) + ' (Faltante)';
    }
  }

  const elDifBar = document.getElementById('cierre-dif-bar');
  if (elDifBar) {
    if (Math.abs(difBar) < 0.01) {
      elDifBar.className = 'font-bold text-sky-600';
      elDifBar.innerText = '$0.00 (Exacto)';
    } else if (difBar > 0) {
      elDifBar.className = 'font-bold text-amber-600';
      elDifBar.innerText = '+$' + difBar.toFixed(2) + ' (Sobrante)';
    } else {
      elDifBar.className = 'font-bold text-red-600';
      elDifBar.innerText = '-$' + Math.abs(difBar).toFixed(2) + ' (Faltante)';
    }
  }

  const retiroHosp = Math.max(0, Math.round((fisHosp - fBaseHosp) * 100) / 100);
  const quedanHosp = Math.min(fisHosp, fBaseHosp);

  const retiroBar = Math.max(0, Math.round((fisBar - fBaseBar) * 100) / 100);
  const quedanBar = Math.min(fisBar, fBaseBar);

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setT('cierre-retiro-hospedaje', '$' + retiroHosp.toFixed(2));
  setT('cierre-quedan-hospedaje', '$' + quedanHosp.toFixed(2));
  setT('cierre-retiro-bar', '$' + retiroBar.toFixed(2));
  setT('cierre-quedan-bar', '$' + quedanBar.toFixed(2));

  const totalRetiroAdmin = Math.round((retiroHosp + retiroBar) * 100) / 100;
  const totalFondosQuedan = Math.round((quedanHosp + quedanBar) * 100) / 100;
  setT('cierre-total-retiro-admin', '$' + totalRetiroAdmin.toFixed(2));
  setT('cierre-total-fondos-quedan', '$' + totalFondosQuedan.toFixed(2));

  const totalBancos = Number(sesionActiva?.totalTransferencia || 0) + Number(sesionActiva?.totalDatafono || 0);
  setT('cierre-total-bancos', '$' + totalBancos.toFixed(2));
}

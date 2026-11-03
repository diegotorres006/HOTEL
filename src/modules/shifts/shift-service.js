/* ==========================================================================
   HOTEL NORTE — CONTROL DE RELOJ, BITÁCORA Y ARQUEO DE CAJA
   Archivo: src/modules/shifts/shift-service.js
   ========================================================================== */

function tickReloj() {
  const ahora = new Date();
  const hh = String(ahora.getHours()).padStart(2, '0');
  const mm = String(ahora.getMinutes()).padStart(2, '0');
  const ss = String(ahora.getSeconds()).padStart(2, '0');
  const horaStr = hh + ':' + mm + ':' + ss;

  const elRelojApp = document.getElementById('reloj-real');
  if (elRelojApp) elRelojApp.innerText = horaStr;

  const elRelojLogin = document.getElementById('reloj-login');
  if (elRelojLogin) elRelojLogin.innerText = horaStr;

  if (fechaSeleccionada === FECHA_HOY && mm === '00' && ss === '00' && hh === '12') {
    renderCuadrados();
  }
}

function abrirModalBitacora() {
  const lista = document.getElementById('bitacora-lista');
  if (!sesionActiva || sesionActiva.registros.length === 0) {
    lista.innerHTML = '<p class="text-slate-500 text-xs text-center py-8">No existen operaciones registradas en el turno actual.</p>';
  } else {
    lista.innerHTML = [...sesionActiva.registros].reverse().map(r => `
      <div class="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1 shadow-2xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-900 uppercase tracking-wide">${r.tipo}</span>
          <span class="font-mono text-slate-500 text-[11px]">${formatHoraCompleta(new Date(r.hora))}</span>
        </div>
        <div class="text-slate-700">${r.descripcion}</div>
        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Operador: <strong class="text-slate-800">${r.empleado}</strong></span>
          ${r.hab ? '<span class="text-slate-900 font-semibold font-mono">Habitación #' + r.hab + '</span>' : ''}
        </div>
      </div>
    `).join('');
  }
  document.getElementById('modal-bitacora').classList.remove('hidden');
}

function cerrarModalBitacora() {
  document.getElementById('modal-bitacora').classList.add('hidden');
}

function abrirModalArqueo() {
  if (!sesionActiva) {
    abrirModalLoginEmpleado();
    return;
  }
  document.getElementById('arq-empleado').innerText = sesionActiva.empleado.nombre;
  document.getElementById('arq-turno').innerText = sesionActiva.turno;
  document.getElementById('arq-inicio').innerText = formatHoraCompleta(new Date(sesionActiva.horaInicio));
  document.getElementById('arq-ahora').innerText = formatHoraCompleta(new Date());

  const fBaseHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const recEfectivoHosp = Number(sesionActiva.recaudadoEfectivoHospedaje || 0);
  const gavetaHosp = fBaseHosp + recEfectivoHosp;
  const digHosp = Number(sesionActiva.recaudadoTransferenciaHospedaje || 0) + Number(sesionActiva.recaudadoDatafonoHospedaje || 0);

  const fBaseBar = Number(configCajas?.fondoFijoBar || 50.00);
  const recEfectivoBar = Number(sesionActiva.recaudadoEfectivoBar || 0);
  const gavetaBar = fBaseBar + recEfectivoBar;
  const digBar = Number(sesionActiva.recaudadoTransferenciaBar || 0) + Number(sesionActiva.recaudadoDatafonoBar || 0);

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setT('arq-hosp-fondo', '$' + fBaseHosp.toFixed(2));
  setT('arq-hosp-recaudado', (recEfectivoHosp >= 0 ? '+' : '') + '$' + recEfectivoHosp.toFixed(2));
  setT('arq-hosp-gaveta', '$' + gavetaHosp.toFixed(2));
  setT('arq-hosp-digitales', '$' + digHosp.toFixed(2));

  setT('arq-bar-fondo', '$' + fBaseBar.toFixed(2));
  setT('arq-bar-recaudado', (recEfectivoBar >= 0 ? '+' : '') + '$' + recEfectivoBar.toFixed(2));
  setT('arq-bar-gaveta', '$' + gavetaBar.toFixed(2));
  setT('arq-bar-digitales', '$' + digBar.toFixed(2));

  const totalFisico = gavetaHosp + gavetaBar;
  const totalRetiroAdmin = recEfectivoHosp + recEfectivoBar;
  const totalFondosFijos = fBaseHosp + fBaseBar;

  setT('arq-total-fisico', '$' + totalFisico.toFixed(2));
  setT('arq-retiro-admin', '$' + totalRetiroAdmin.toFixed(2));
  setT('arq-fondos-remanentes', '$' + totalFondosFijos.toFixed(2) + ` ($${fBaseHosp.toFixed(0)} Hosp + $${fBaseBar.toFixed(0)} Bar)`);
  setT('arq-debito', '$' + Number(sesionActiva.totalDebito || 0).toFixed(2));

  document.getElementById('modal-arqueo').classList.remove('hidden');
}

function cerrarModalArqueo() {
  document.getElementById('modal-arqueo').classList.add('hidden');
}

/* ==========================================================================
   HOTEL NORTE — AUTENTICACIÓN DE PERSONAL Y GESTIÓN DE PIN
   Archivo: src/modules/shifts/auth-login.js
   ========================================================================== */

function renderListaEmpleados() {
  const cont = document.getElementById('lista-empleados-login');
  if (!cont) return;

  cont.innerHTML = empleados.map(e => {
    const iniciales = e.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return `
      <button onclick="seleccionarEmpleadoLogin(${e.id})"
        class="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-400 transition text-left group">
        <div class="w-9 h-9 rounded bg-slate-800 flex items-center justify-center text-white font-bold text-xs shrink-0">
          ${iniciales}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-slate-900 text-xs truncate">${e.nombre}</div>
          <div class="text-[11px] text-slate-500 truncate">${e.cargo} · <span class="text-slate-700 font-medium">${e.turno}</span></div>
        </div>
        <div class="text-[11px] text-slate-600 group-hover:text-slate-900 font-semibold transition">
          Seleccionar →
        </div>
      </button>
    `;
  }).join('');
}

function seleccionarEmpleadoLogin(id) {
  empleadoLoginSeleccionado = empleados.find(e => e.id === id);
  pinActual = '';
  document.getElementById('login-nombre-seleccionado').innerText = empleadoLoginSeleccionado.nombre;
  document.getElementById('login-turno-sugerido').innerText = empleadoLoginSeleccionado.turno;
  document.getElementById('login-error').classList.add('hidden');
  actualizarPinDots();

  document.getElementById('seccion-pin').classList.remove('hidden');
  document.getElementById('lista-empleados-login').classList.add('opacity-40', 'pointer-events-none');
}

function volverSeleccion() {
  empleadoLoginSeleccionado = null;
  pinActual = '';
  const secPin = document.getElementById('seccion-pin');
  const listaEmp = document.getElementById('lista-empleados-login');
  const errEl = document.getElementById('login-error');
  if (secPin) secPin.classList.add('hidden');
  if (listaEmp) listaEmp.classList.remove('opacity-40', 'pointer-events-none');
  if (errEl) errEl.classList.add('hidden');
}

function pinPresionar(digito) {
  if (pinActual.length >= 4) return;
  pinActual += digito;
  actualizarPinDots();
  if (pinActual.length === 4) {
    setTimeout(verificarPin, 150);
  }
}

function pinBorrar() {
  pinActual = pinActual.slice(0, -1);
  actualizarPinDots();
  document.getElementById('login-error').classList.add('hidden');
}

function actualizarPinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById('dot-' + i);
    if (dot) {
      if (i < pinActual.length) dot.classList.add('filled');
      else dot.classList.remove('filled');
    }
  }
}

function verificarPin() {
  if (!empleadoLoginSeleccionado) return;
  if (pinActual === empleadoLoginSeleccionado.pin) {
    iniciarSesion(empleadoLoginSeleccionado);
  } else {
    document.getElementById('login-error').classList.remove('hidden');
    pinActual = '';
    actualizarPinDots();
  }
}

window.addEventListener('keydown', (e) => {
  const loginEl = document.getElementById('pantalla-login');
  const pinEl = document.getElementById('seccion-pin');
  if (loginEl && !loginEl.classList.contains('hidden') && pinEl && !pinEl.classList.contains('hidden')) {
    if (e.key >= '0' && e.key <= '9') pinPresionar(e.key);
    else if (e.key === 'Backspace') pinBorrar();
    else if (e.key === 'Escape') volverSeleccion();
  }
});

function abrirModalLoginEmpleado() {
  volverSeleccion();
  renderListaEmpleados();
  document.getElementById('pantalla-login').classList.remove('hidden');
}

function cerrarModalLoginEmpleado() {
  document.getElementById('pantalla-login').classList.add('hidden');
}

function iniciarSesion(empleado) {
  const ahora = new Date();
  const fFijoHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const fFijoBar = Number(configCajas?.fondoFijoBar || 50.00);

  sesionActiva = {
    idTurno: 'TUR-' + Date.now().toString().slice(-6),
    empleado: empleado,
    turno: empleado.turno,
    horaInicio: ahora.toISOString(),
    registros: [],

    // Caja Hospedaje Independiente (Fondo Fijo $200.00)
    fondoInicialHospedaje: fFijoHosp,
    recaudadoEfectivoHospedaje: 0,
    recaudadoTransferenciaHospedaje: 0,
    recaudadoDatafonoHospedaje: 0,

    // Caja Bar Independiente (Fondo Fijo $50.00)
    fondoInicialBar: fFijoBar,
    recaudadoEfectivoBar: 0,
    recaudadoTransferenciaBar: 0,
    recaudadoDatafonoBar: 0,

    // Compatibilidad global
    totalPagado: 0,
    totalEfectivo: 0,
    totalTransferencia: 0,
    totalDatafono: 0,
    totalDebito: 0
  };
  guardarStorage('sesion_activa', sesionActiva);
  registrarAccion('APERTURA DE TURNO', empleado.nombre + ' inició sesión en ' + empleado.turno + ' · Fondo Hospedaje: $' + fFijoHosp.toFixed(2) + ' · Fondo Bar: $' + fFijoBar.toFixed(2));

  document.getElementById('pantalla-login').classList.add('hidden');
  document.getElementById('app-principal').classList.remove('hidden');

  document.getElementById('hdr-empleado').innerText = empleado.nombre;
  document.getElementById('hdr-turno').innerText = empleado.turno;
  document.getElementById('hdr-hora-inicio').innerText = formatHora(ahora);

  actualizarInterfazSegunFecha();
  actualizarIndicadoresCajaHeader();
  renderCuadrados();
  tickReloj();
}

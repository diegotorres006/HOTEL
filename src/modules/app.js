/* ==========================================================================
   HOTEL NORTE — INICIALIZADOR PRINCIPAL DE LA APLICACIÓN (APP BOOTSTRAP)
   Archivo: src/modules/app.js
   ========================================================================== */

function iniciarAplicacionHotelNorte() {
  // 1. Sincronizar e hidratar la base de datos desde el disco duro local (Alta Disponibilidad)
  if (typeof sincronizarBaseDeDatosConDisco === 'function') {
    sincronizarBaseDeDatosConDisco();
  }

  // 2. Montar todas las vistas y componentes modulares en el DOM
  if (typeof ComponentLoader !== 'undefined') {
    ComponentLoader.mountAll();
  }

  // 2. Inicializar reloj en tiempo real y badges
  actualizarBadgeBookingHeader();
  setInterval(tickReloj, 1000);
  tickReloj();
  renderListaEmpleados();

  // 3. Verificar sesión activa o inicializar operador por defecto
  const fBaseHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const fBaseBar = Number(configCajas?.fondoFijoBar || 50.00);

  if (!sesionActiva || !sesionActiva.empleado) {
    const empDefault = empleados[0];
    const ahora = new Date();
    sesionActiva = {
      idTurno: 'TUR-' + Date.now().toString().slice(-6),
      empleado: empDefault,
      turno: empDefault.turno,
      horaInicio: ahora.toISOString(),
      registros: [],
      // Cajas Independientes
      fondoInicialHospedaje: fBaseHosp,
      recaudadoEfectivoHospedaje: 0,
      recaudadoTransferenciaHospedaje: 0,
      recaudadoDatafonoHospedaje: 0,
      fondoInicialBar: fBaseBar,
      recaudadoEfectivoBar: 0,
      recaudadoTransferenciaBar: 0,
      recaudadoDatafonoBar: 0,
      totalPagado: 0,
      totalEfectivo: 0,
      totalTransferencia: 0,
      totalDatafono: 0,
      totalDebito: 0
    };
    guardarStorage('sesion_activa', sesionActiva);
  } else if (typeof sesionActiva.fondoInicialHospedaje !== 'number') {
    // Compatibilidad retroactiva para sesión en curso
    sesionActiva.fondoInicialHospedaje = fBaseHosp;
    sesionActiva.recaudadoEfectivoHospedaje = sesionActiva.totalEfectivo || 0;
    sesionActiva.recaudadoTransferenciaHospedaje = sesionActiva.totalTransferencia || 0;
    sesionActiva.recaudadoDatafonoHospedaje = sesionActiva.totalDatafono || 0;
    sesionActiva.fondoInicialBar = fBaseBar;
    sesionActiva.recaudadoEfectivoBar = 0;
    sesionActiva.recaudadoTransferenciaBar = 0;
    sesionActiva.recaudadoDatafonoBar = 0;
  }

  document.getElementById('pantalla-login').classList.add('hidden');
  document.getElementById('app-principal').classList.remove('hidden');

  document.getElementById('hdr-empleado').innerText = sesionActiva.empleado.nombre;
  document.getElementById('hdr-turno').innerText = sesionActiva.turno;
  document.getElementById('hdr-hora-inicio').innerText = formatHora(new Date(sesionActiva.horaInicio));
  if (typeof actualizarIndicadoresCajaHeader === 'function') {
    actualizarIndicadoresCajaHeader();
  }

  document.getElementById('input-fecha-selector').value = FECHA_HOY;
  fechaSeleccionada = FECHA_HOY;
  actualizarInterfazSegunFecha();
  renderCuadrados();

  // 4. Iniciar sincronización automática en tiempo real con Booking.com (ID 2862226)
  if (typeof iniciarEscuchaBookingEnTiempoReal === 'function') {
    iniciarEscuchaBookingEnTiempoReal();
  }
}

window.addEventListener('DOMContentLoaded', iniciarAplicacionHotelNorte);

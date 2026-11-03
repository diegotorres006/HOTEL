/* ==========================================================================
   HOTEL NORTE — CONFIGURACIÓN ADMINISTRATIVA DE CAJAS (HOSPEDAJE / BAR)
   Archivo: src/modules/admin/admin-cashboxes.js
   ========================================================================== */

function renderAdminCajas() {
  const fHosp = Number(configCajas?.fondoFijoHospedaje || 200.00);
  const fBar = Number(configCajas?.fondoFijoBar || 50.00);

  const inpHosp = document.getElementById('admin-fondo-hospedaje');
  const inpBar = document.getElementById('admin-fondo-bar');

  if (inpHosp) inpHosp.value = fHosp;
  if (inpBar) inpBar.value = fBar;
}

function guardarConfiguracionCajasAdmin() {
  const inpHosp = document.getElementById('admin-fondo-hospedaje');
  const inpBar = document.getElementById('admin-fondo-bar');

  const fHosp = parseFloat(inpHosp?.value) || 200.00;
  const fBar = parseFloat(inpBar?.value) || 50.00;

  if (fHosp < 0 || fBar < 0) {
    UIModal.aviso({
      titulo: 'Valores Inválidos',
      mensaje: 'Los fondos fijos no pueden ser negativos.',
      tipo: 'alerta'
    });
    return;
  }

  configCajas = {
    fondoFijoHospedaje: fHosp,
    fondoFijoBar: fBar
  };

  guardarStorage('config_cajas', configCajas, true);

  if (sesionActiva) {
    sesionActiva.fondoInicialHospedaje = fHosp;
    sesionActiva.fondoInicialBar = fBar;
    guardarStorage('sesion_activa', sesionActiva);
  }

  actualizarIndicadoresCajaHeader();

  UIModal.aviso({
    titulo: 'Configuración de Cajas Guardada',
    subtitulo: 'Hotel Norte · Administración',
    mensaje: `Se han actualizado los fondos fijos maestros: Caja Hospedaje ($${fHosp.toFixed(2)}) y Caja Bar ($${fBar.toFixed(2)}). El cambio rige inmediatamente en el sistema.`,
    tipo: 'exito'
  });
}

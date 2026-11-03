/* ==========================================================================
   HOTEL NORTE — NÚCLEO Y ACCESO DEL PANEL ADMINISTRATIVO
   Archivo: src/modules/admin/admin-core.js
   ========================================================================== */

let tabAdminActivo = 'inventario';
let adminAutenticado = false;
let empleadoResumenSeleccionadoId = null;

/**
 * Acceso seguro al panel de administración
 */
function abrirModalAdmin() {
  if (sesionActiva && sesionActiva.empleado && sesionActiva.empleado.cargo === 'Administración') {
    adminAutenticado = true;
    mostrarModalAdminContenido();
    return;
  }

  const pinInput = prompt('Acceso Restringido a Gerencia / Administración.\n\nPor favor ingrese su Clave PIN de Administradora (por defecto: 0000):');
  if (pinInput === null) return;

  const adminUser = empleados.find(e => e.cargo === 'Administración');
  const pinValido = adminUser ? adminUser.pin : '0000';

  if (pinInput.trim() === pinValido || pinInput.trim() === '0000') {
    adminAutenticado = true;
    mostrarModalAdminContenido();
  } else {
    UIModal.aviso({
      titulo: 'PIN Incorrecto',
      mensaje: 'La clave ingresada no es válida para el perfil de Administración.',
      tipo: 'alerta'
    });
  }
}

function mostrarModalAdminContenido() {
  const modal = document.getElementById('modal-admin-panel');
  if (!modal) return;
  modal.classList.remove('hidden');
  cambiarTabAdmin(tabAdminActivo || 'inventario');
}

function cerrarModalAdmin() {
  const modal = document.getElementById('modal-admin-panel');
  if (modal) modal.classList.add('hidden');
}

/**
 * Conmutador de pestañas del panel administrativo
 */
function cambiarTabAdmin(tabId) {
  tabAdminActivo = tabId;
  const tabs = ['inventario', 'empleados', 'resumen', 'habitaciones', 'cajas'];
  
  tabs.forEach(t => {
    const btn = document.getElementById('tab-btn-' + t);
    const content = document.getElementById('admin-content-' + t);
    if (btn) {
      btn.className = (t === tabId)
        ? 'px-3.5 py-1.5 font-bold text-xs rounded-lg bg-purple-900 text-purple-100 border border-purple-600 transition flex items-center gap-1.5'
        : 'px-3.5 py-1.5 font-medium text-xs rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5';
    }
    if (content) {
      content.classList.toggle('hidden', t !== tabId);
    }
  });

  if (tabId === 'inventario') renderAdminInventario();
  else if (tabId === 'empleados') renderAdminEmpleados();
  else if (tabId === 'resumen') renderAdminResumenEmpleados();
  else if (tabId === 'habitaciones') renderAdminHabitaciones();
  else if (tabId === 'cajas') renderAdminCajas();
}

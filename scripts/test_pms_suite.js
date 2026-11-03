/* ==========================================================================
   HOTEL NORTE — TEST DE INTEGRACIÓN Y VERIFICACIÓN DE REGLAS DE NEGOCIO
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// 1. Simular entorno DOM básico
function createMockElement(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    value: '',
    innerText: '',
    innerHTML: '',
    className: '',
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
      toggle: () => {}
    },
    focus: () => {},
    checked: false,
    setAttribute: () => {},
    removeAttribute: () => {},
    getAttribute: () => '',
    dataset: {},
    appendChild: (c) => c,
    removeChild: (c) => c,
    addEventListener: () => {},
    onclick: null,
    children: []
  };
}

global.window = global;
global.window.addEventListener = () => {};
global.addEventListener = () => {};
global.document = {
  getElementById: (id) => createMockElement(),
  createElement: (tag) => createMockElement(tag),
  querySelector: () => createMockElement(),
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

function loadInGlobal(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInThisContext(code, { filename: fullPath });
}

// Cargar módulos en orden idéntico a index.html
loadInGlobal('src/config/constants.js');
loadInGlobal('src/utils/formatters.js');
loadInGlobal('src/utils/storage.js');
loadInGlobal('src/utils/validators.js');
loadInGlobal('src/state/store.js');
loadInGlobal('src/components/ComponentLoader.js');
loadInGlobal('src/components/UIModal.js');
loadInGlobal('src/components/RoomRackView.js');
loadInGlobal('src/components/RoomTableView.js');
loadInGlobal('src/modules/shifts/cashbox-service.js');
loadInGlobal('src/modules/shifts/auth-login.js');
loadInGlobal('src/modules/shifts/shift-service.js');
loadInGlobal('src/modules/shifts/shift-close.js');
loadInGlobal('src/modules/shifts/shift-history.js');
loadInGlobal('src/modules/rooms/rooms-navigation.js');
loadInGlobal('src/modules/rooms/checkin-service.js');
loadInGlobal('src/modules/rooms/room-detail.js');
loadInGlobal('src/modules/rooms/reservations.js');
loadInGlobal('src/modules/rooms/checkout-service.js');
loadInGlobal('src/modules/billing/d2fac-client.js');
loadInGlobal('src/modules/billing/d2fac-modal.js');
loadInGlobal('src/modules/booking/booking-sync-api.js');
loadInGlobal('src/modules/booking/booking-modal-ui.js');
loadInGlobal('src/modules/bar/bar-catalog.js');
loadInGlobal('src/modules/bar/bar-sales.js');
loadInGlobal('src/modules/admin/admin-core.js');
loadInGlobal('src/modules/admin/admin-inventory.js');
loadInGlobal('src/modules/admin/admin-employees.js');
loadInGlobal('src/modules/admin/admin-analytics.js');
loadInGlobal('src/modules/admin/admin-rooms.js');
loadInGlobal('src/modules/admin/admin-cashboxes.js');

console.log('--- INICIANDO SUITE DE PRUEBAS HOTEL NORTE PMS ---');

// Test 1: Verificar configuración de 35 habitaciones oficiales
assert.strictEqual(DISTRIBUCION_HOTEL_NORTE.length, 35, 'Debe haber 35 habitaciones oficiales');
console.log('✓ Test 1: Distribución oficial verificada (35 habitaciones).');

// Test 2: Cajas duales y fondos fijos ($200 Hospedaje / $50 Bar)
assert.strictEqual(configCajas.fondoFijoHospedaje, 200, 'Fondo fijo de hospedaje debe ser $200.00');
assert.strictEqual(configCajas.fondoFijoBar, 50, 'Fondo fijo de bar debe ser $50.00');
console.log('✓ Test 2: Fondos fijos duales inicializados ($200.00 Hospedaje / $50.00 Bar).');

// Test 3: Simular apertura de turno
const adminEmp = empleados.find(e => e.cargo === 'Administración');
assert(adminEmp, 'Debe existir empleado de administración');
iniciarSesion(adminEmp);
assert(sesionActiva, 'Sesión debe estar activa');
assert.strictEqual(sesionActiva.fondoInicialHospedaje, 200);
assert.strictEqual(sesionActiva.fondoInicialBar, 50);
console.log('✓ Test 3: Inicio de sesión correcto con trazabilidad de operador.');

// Test 4: Registro de ingresos y recaudación en ambas cajas
registrarIngresoHospedaje(60.00, 'Efectivo');
assert.strictEqual(sesionActiva.recaudadoEfectivoHospedaje, 60.00);
assert.strictEqual(sesionActiva.fondoInicialHospedaje + sesionActiva.recaudadoEfectivoHospedaje, 260.00);

registrarIngresoBar(15.00, 'Efectivo');
assert.strictEqual(sesionActiva.recaudadoEfectivoBar, 15.00);
assert.strictEqual(sesionActiva.fondoInicialBar + sesionActiva.recaudadoEfectivoBar, 65.00);
console.log('✓ Test 4: Movimientos independientes en caja hospedaje ($260 en gaveta) y bar ($65 en gaveta).');

// Test 5: Multi-estancias en el mismo día (habitación alquilada > 1 vez)
const habsHoy = obtenerHabitacionesDia(FECHA_HOY);
const habTest = habsHoy.find(h => h.id === 1);
assert(habTest, 'Habitación 1 debe existir');

// Primera estancia
habTest.estado = 'ocupada';
habTest.huesped = { nombre: 'Huésped Mañana', cedula: '0102030405', procedencia: 'Quito' };
habTest.horaEntrada = '08:00';
habTest.pagado = 30.00;
habTest.debito = 0.00;
habitacionSeleccionada = habTest;

// Checkout primera estancia
ejecutarSalidaHuespedEfectiva();
assert.strictEqual(habTest.estado, 'libre', 'Habitación debe volver a estar libre tras checkout');
assert.strictEqual(habTest.estanciasPasadas.length, 1, 'Debe tener 1 estancia pasada archivada');
assert.strictEqual(habTest.estanciasPasadas[0].huesped, 'Huésped Mañana');

// Segunda estancia el mismo día
habTest.estado = 'ocupada';
habTest.huesped = { nombre: 'Huésped Tarde', cedula: '0706050403', procedencia: 'Guayaquil' };
habTest.horaEntrada = '14:00';
habTest.pagado = 30.00;
habTest.debito = 0.00;
habitacionSeleccionada = habTest;

// Checkout segunda estancia
ejecutarSalidaHuespedEfectiva();
assert.strictEqual(habTest.estado, 'libre', 'Habitación debe volver a estar libre tras segunda estancia');
assert.strictEqual(habTest.estanciasPasadas.length, 2, 'Debe tener 2 estancias pasadas archivadas');
assert.strictEqual(habTest.estanciasPasadas[1].huesped, 'Huésped Tarde');
console.log('✓ Test 5: Multi-alquiler diario verificado (estanciasPasadas conserva historial completo).');

// Test 6: Ventas de Bar y control de inventario
const cerveza = productosBar.find(p => p.nombre.toLowerCase().includes('cerveza') || p.codigo === 'BAR-003');
assert(cerveza, 'Debe existir producto de bar');
const stockInicial = cerveza.stock;
productoVentaSeleccionado = cerveza;
document.getElementById = (id) => {
  const el = createMockElement();
  if (id === 'mv-cantidad') el.value = '2';
  if (id === 'mv-dest-hab') el.checked = false;
  if (id === 'mv-pago-cuenta') el.checked = false;
  if (id === 'mv-metodo-pago') el.value = 'Efectivo';
  return el;
};

confirmarVentaRapida();
assert.strictEqual(cerveza.stock, stockInicial - 2, 'Stock debe descontar 2 unidades');
assert(ventasBar.length > 0, 'Debe haber quedado registrada la venta');
console.log('✓ Test 6: Venta de bar ejecutada con descuento de inventario en tiempo real.');

console.log('--- TODAS LAS PRUEBAS (6/6) PASARON CON ÉXITO ---');

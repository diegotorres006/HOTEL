/* ==========================================================================
   HOTEL NORTE — CONFIGURACIÓN GENERAL Y CONSTANTES DEL SISTEMA
   Archivo: src/config/constants.js
   Distribución Oficial según "DISPONIBILIDAD HN.pdf":
   - 35 Habitaciones Reales
   - 4 Pisos (Planta Baja, 1° Piso Alto, 2° Piso Alto, 3° Piso Alto)
   - Capacidad Total: 100 Personas
   ========================================================================== */

const DISTRIBUCION_HOTEL_NORTE = [
  // PLANTA BAJA (6 habitaciones · Capacidad: 18 personas)
  {
    numero: '01',
    id: 1,
    piso: 'PLANTA BAJA',
    pisoCorto: 'PB',
    pisoId: 'pb',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 1 INDIVIDUAL',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '02',
    id: 2,
    piso: 'PLANTA BAJA',
    pisoCorto: 'PB',
    pisoId: 'pb',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 1 INDIVIDUAL',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '03',
    id: 3,
    piso: 'PLANTA BAJA',
    pisoCorto: 'PB',
    pisoId: 'pb',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '08',
    id: 8,
    piso: 'PLANTA BAJA',
    pisoCorto: 'PB',
    pisoId: 'pb',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS + 1 PLAZA Y MEDIA',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '09',
    id: 9,
    piso: 'PLANTA BAJA',
    pisoCorto: 'PB',
    pisoId: 'pb',
    capacidad: 5,
    tipo: 'Familiar Quíntuple',
    categoriaFiltro: 'quintuple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 3 INDIVIDUALES',
    camas: 4,
    tarifa: 55
  },
  {
    numero: '10',
    id: 10,
    piso: 'PLANTA BAJA',
    pisoCorto: 'PB',
    pisoId: 'pb',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },

  // PRIMER PISO ALTO (15 habitaciones · Capacidad: 51 personas)
  {
    numero: '11',
    id: 11,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 5,
    tipo: 'Familiar Quíntuple',
    categoriaFiltro: 'quintuple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 3 INDIVIDUALES',
    camas: 4,
    tarifa: 55
  },
  {
    numero: '12',
    id: 12,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 1 INDIVIDUAL',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '13',
    id: 13,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 1 INDIVIDUAL',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '14',
    id: 14,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 4,
    tipo: 'Cuádruple',
    categoriaFiltro: 'cuadruple',
    descripcionCamas: '2 CAMAS DE 2 PLAZAS',
    camas: 2,
    tarifa: 45
  },
  {
    numero: '15',
    id: 15,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 5,
    tipo: 'Familiar Quíntuple (Litera)',
    categoriaFiltro: 'quintuple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS 1 INDIVIDUAL 1 LITERA',
    camas: 3,
    tarifa: 55
  },
  {
    numero: '16',
    id: 16,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 5,
    tipo: 'Familiar Quíntuple (Litera)',
    categoriaFiltro: 'quintuple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS 1 INDIVIDUAL Y 1LITERA',
    camas: 3,
    tarifa: 55
  },
  {
    numero: '37',
    id: 37,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 4,
    tipo: 'Cuádruple',
    categoriaFiltro: 'cuadruple',
    descripcionCamas: '2 CAMAS DE 2 PLAZAS',
    camas: 2,
    tarifa: 45
  },
  {
    numero: '51',
    id: 51,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '52',
    id: 52,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '53',
    id: 53,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 2,
    tipo: 'Doble Twin',
    categoriaFiltro: 'doble',
    descripcionCamas: '2 CAMAS INDIVIDUALES',
    camas: 2,
    tarifa: 30
  },
  {
    numero: '54',
    id: 54,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 1 INDIVIUAL',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '55',
    id: 55,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 1 INDIVIDUAL',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '56',
    id: 56,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 1,
    tipo: 'Individual',
    categoriaFiltro: 'individual',
    descripcionCamas: '1 IDIVIDUAL',
    camas: 1,
    tarifa: 25
  },
  {
    numero: '57',
    id: 57,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '58',
    id: 58,
    piso: 'PRIMER PISO ALTO',
    pisoCorto: '1° Piso',
    pisoId: 'piso1',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },

  // SEGUNDO PISO ALTO (11 habitaciones · Capacidad: 23 personas)
  {
    numero: '17',
    id: 17,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '18',
    id: 18,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS + 1 PLAZA Y MEDIA',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '19',
    id: 19,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 4,
    tipo: 'Cuádruple',
    categoriaFiltro: 'cuadruple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 2 INDIVIDUALES',
    camas: 3,
    tarifa: 45
  },
  {
    numero: '59',
    id: 59,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '60',
    id: 60,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '61',
    id: 61,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '62',
    id: 62,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '63',
    id: 63,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '64',
    id: 64,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 5,
    tipo: 'Familiar Quíntuple',
    categoriaFiltro: 'quintuple',
    descripcionCamas: '2 CAMAS DE 2 PLAZAS Y 1 INDIVIDUAL',
    camas: 3,
    tarifa: 55
  },
  {
    numero: '65',
    id: 65,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 3,
    tipo: 'Triple',
    categoriaFiltro: 'triple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 1 INDUVIDUAL',
    camas: 2,
    tarifa: 35
  },
  {
    numero: '66',
    id: 66,
    piso: 'SEGUNDO PISO ALTO',
    pisoCorto: '2° Piso',
    pisoId: 'piso2',
    capacidad: 1,
    tipo: 'Individual',
    categoriaFiltro: 'individual',
    descripcionCamas: '1 CAMA INDIVIDUAL',
    camas: 1,
    tarifa: 25
  },

  // TERCER PISO ALTO (3 habitaciones · Capacidad: 8 personas)
  {
    numero: '20',
    id: 20,
    piso: 'TERCER PISO ALTO',
    pisoCorto: '3° Piso',
    pisoId: 'piso3',
    capacidad: 4,
    tipo: 'Cuádruple',
    categoriaFiltro: 'cuadruple',
    descripcionCamas: '1 CAMA DE 2 PLAZAS Y 2 INDIVIDUAL',
    camas: 3,
    tarifa: 45
  },
  {
    numero: '68',
    id: 68,
    piso: 'TERCER PISO ALTO',
    pisoCorto: '3° Piso',
    pisoId: 'piso3',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  },
  {
    numero: '69',
    id: 69,
    piso: 'TERCER PISO ALTO',
    pisoCorto: '3° Piso',
    pisoId: 'piso3',
    capacidad: 2,
    tipo: 'Matrimonial',
    categoriaFiltro: 'matrimonial',
    descripcionCamas: '1 CAMA DE 2 PLAZAS',
    camas: 1,
    tarifa: 30
  }
];

const PISOS_HOTEL_NORTE = [
  { id: 'todos', label: 'Todos', nombre: 'Todos los Pisos', cantidadHabitaciones: 35, capacidadTotal: 100 },
  { id: 'pb', label: 'Planta Baja', nombre: 'Planta Baja', cantidadHabitaciones: 6, capacidadTotal: 18 },
  { id: 'piso1', label: '1° Piso', nombre: 'Primer Piso Alto', cantidadHabitaciones: 15, capacidadTotal: 51 },
  { id: 'piso2', label: '2° Piso', nombre: 'Segundo Piso Alto', cantidadHabitaciones: 11, capacidadTotal: 23 },
  { id: 'piso3', label: '3° Piso', nombre: 'Tercer Piso Alto', cantidadHabitaciones: 3, capacidadTotal: 8 },
];

const TIPOS_HABITACION_HOTEL_NORTE = [
  { id: 'todos', label: 'Todos (35)', personas: null },
  { id: 'individual', label: 'Individual · 1 Pers. (2)', personas: 1 },
  { id: 'matrimonial', label: 'Matrimonial · 2 Pers. (14)', personas: 2 },
  { id: 'doble', label: 'Doble Twin · 2 Pers. (1)', personas: 2 },
  { id: 'triple', label: 'Triple · 3 Pers. (9)', personas: 3 },
  { id: 'cuadruple', label: 'Cuádruple · 4 Pers. (4)', personas: 4 },
  { id: 'quintuple', label: 'Quíntuple · 5 Pers. (5)', personas: 5 }
];

const EMPLEADOS_DEFAULT = [
  { id: 1, nombre: 'Wilson Paredes',  cargo: 'Recepcionista',  pin: '1234', turno: 'Mañana (08:00 – 17:00)', color: 'bg-slate-800' },
  { id: 2, nombre: 'Denis Salazar',   cargo: 'Recepcionista',  pin: '5678', turno: 'Noche (22:00 – 06:00)',  color: 'bg-blue-800' },
  { id: 3, nombre: 'Carmen Rojas',    cargo: 'Recepcionista',  pin: '9012', turno: 'Tarde (14:00 – 22:00)',  color: 'bg-teal-800' },
  { id: 4, nombre: 'Administradora General', cargo: 'Administración', pin: '0000', turno: 'Supervisión General', color: 'bg-purple-900' },
];

const CATEGORIAS_BAR = [
  'Todos',
  'Bebidas Frías',
  'Cervezas y Licores',
  'Cafetería y Calientes',
  'Snacks y Golosinas'
];

const PRODUCTOS_BAR_DEFAULT = [
  { id: 1, codigo: 'BAR-001', nombre: 'Agua Sin Gas (500ml)', categoria: 'Bebidas Frías', precio: 1.00, stock: 40, icon: '💧' },
  { id: 2, codigo: 'BAR-002', nombre: 'Agua Güitig con Gas (500ml)', categoria: 'Bebidas Frías', precio: 1.50, stock: 35, icon: '🫧' },
  { id: 3, codigo: 'BAR-003', nombre: 'Coca Cola Regular (350ml)', categoria: 'Bebidas Frías', precio: 1.50, stock: 30, icon: '🥤' },
  { id: 4, codigo: 'BAR-004', nombre: 'Coca Cola Sin Azúcar (350ml)', categoria: 'Bebidas Frías', precio: 1.50, stock: 25, icon: '🥤' },
  { id: 5, codigo: 'BAR-005', nombre: 'Sprite / Fanta (350ml)', categoria: 'Bebidas Frías', precio: 1.50, stock: 20, icon: '🥤' },
  { id: 6, codigo: 'BAR-006', nombre: 'Cerveza Club Premium (330ml)', categoria: 'Cervezas y Licores', precio: 2.50, stock: 28, icon: '🍺' },
  { id: 7, codigo: 'BAR-007', nombre: 'Cerveza Pilsener (330ml)', categoria: 'Cervezas y Licores', precio: 2.25, stock: 32, icon: '🍺' },
  { id: 8, codigo: 'BAR-008', nombre: 'Cerveza Corona Extra (355ml)', categoria: 'Cervezas y Licores', precio: 3.50, stock: 18, icon: '🍻' },
  { id: 9, codigo: 'BAR-009', nombre: 'Gatorade Frutas / Mora (500ml)', categoria: 'Bebidas Frías', precio: 2.00, stock: 20, icon: '⚡' },
  { id: 10, codigo: 'BAR-010', nombre: 'Red Bull Energy Drink (250ml)', categoria: 'Bebidas Frías', precio: 3.50, stock: 15, icon: '⚡' },
  { id: 11, codigo: 'BAR-011', nombre: 'Café Americano Pasado', categoria: 'Cafetería y Calientes', precio: 1.50, stock: 50, icon: '☕' },
  { id: 12, codigo: 'BAR-012', nombre: 'Café con Leche / Capuchino', categoria: 'Cafetería y Calientes', precio: 2.00, stock: 40, icon: '☕' },
  { id: 13, codigo: 'BAR-013', nombre: 'Té Aromático / Manzanilla', categoria: 'Cafetería y Calientes', precio: 1.25, stock: 30, icon: '🫖' },
  { id: 14, codigo: 'BAR-014', nombre: 'Sandwich Mixto Caliente', categoria: 'Cafetería y Calientes', precio: 3.00, stock: 15, icon: '🥪' },
  { id: 15, codigo: 'BAR-015', nombre: 'Papas Ruffles / Lays', categoria: 'Snacks y Golosinas', precio: 1.25, stock: 25, icon: '🥔' },
  { id: 16, codigo: 'BAR-016', nombre: 'Doritos Queso Atrevido', categoria: 'Snacks y Golosinas', precio: 1.25, stock: 20, icon: '🧀' },
  { id: 17, codigo: 'BAR-017', nombre: 'Chocolates Manicho / Galak', categoria: 'Snacks y Golosinas', precio: 1.00, stock: 30, icon: '🍫' },
  { id: 18, codigo: 'BAR-018', nombre: 'Galletas Oreo Original', categoria: 'Snacks y Golosinas', precio: 1.00, stock: 25, icon: '🍪' }
];

// Sin datos ficticios ni huéspedes simulados
const TURNOS_HISTORICOS_DEFAULT = [];
const HUESPEDES_DEFAULT = [];

// Configuración de Fondo Fijo de Cajas Independientes (Hospedaje y Bar)
const CONFIG_CAJAS_DEFAULT = {
  fondoFijoHospedaje: 200.00,
  fondoFijoBar: 50.00
};

const D2FAC_CONFIG = {
  apiBase: 'https://www.vmredes.com/facturasApp/',
  rucUsuario: '0301752861001',
  passUsuario: '0301752861',
  razonSocialEmisor: 'TORRES ROBLES EDGAR ALFREDO',
  nombreComercial: 'HOTEL NORTE',
  establecimiento: '001-002',
  servicioHospedaje: {
    idPromocion: '23893',
    codigo: 'x001',
    codigoAuxiliar: '23893',
    titulo: 'SERVICIO DE HOSPEDAJE ',
    ivaPorcentaje: 15
  }
};

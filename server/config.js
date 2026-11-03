/* ==========================================================================
   HOTEL NORTE — CONFIGURACIÓN DEL SERVIDOR Y PUENTE LOCAL
   Archivo: server/config.js
   Propiedad Oficial: Hotel Norte (Booking ID: 2862226 · Cuenca, Ecuador)
   ========================================================================== */

const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3847;
const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(BASE_DIR, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const RESERVAS_FILE = path.join(DATA_DIR, 'booking_reservas.json');

// Asegurar directorios de persistencia
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const TABLAS_PERMITIDAS = [
  'registros_diarios',
  'huespedes_db',
  'turnos_historicos',
  'sesion_activa',
  'auditoria_acciones',
  'booking_reservas',
  'empleados',
  'productos_bar',
  'ventas_bar',
  'habitaciones_config',
  'config_cajas'
];

const estadoConexionExtranet = {
  conectado: false,
  ultimaSincronizacion: null,
  urlActualExtranet: '',
  hotelId: '2862226',
  nombreHotel: 'Hotel Norte',
  totalDetectadasUltimaVez: 0
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

module.exports = {
  PORT,
  BASE_DIR,
  DATA_DIR,
  BACKUP_DIR,
  RESERVAS_FILE,
  TABLAS_PERMITIDAS,
  estadoConexionExtranet,
  MIME_TYPES
};

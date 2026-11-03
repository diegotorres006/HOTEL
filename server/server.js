/* ==========================================================================
   HOTEL NORTE — SERVIDOR PUENTE Y MOTOR DE BASE DE DATOS LOCAL RESILIENTE
   Archivo: server/server.js
   Propiedad Oficial: Hotel Norte (Booking ID: 2862226 · Cuenca, Ecuador)
   ========================================================================== */

const http = require('http');
const { PORT } = require('./config');
const { crearSnapshotBackup } = require('./database/storage-engine');
const { handleDbRoutes } = require('./routes/db-routes');
const { handleBookingRoutes } = require('./routes/booking-routes');
const { handleStaticRoutes } = require('./routes/static-routes');

// Snapshot de seguridad al arrancar
crearSnapshotBackup('arranque_servidor');

// Backup automático periódico cada 30 minutos
setInterval(() => {
  crearSnapshotBackup('periodico_30min');
}, 30 * 60 * 1000);

const server = http.createServer((req, res) => {
  // Cabeceras CORS completas para comunicación local y remota
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. Endpoints de Base de Datos
  if (pathname.startsWith('/api/db/')) {
    if (handleDbRoutes(pathname, req, res)) return;
  }

  // 2. Endpoints de Sincronización con Booking.com
  if (pathname.startsWith('/api/booking/')) {
    if (handleBookingRoutes(pathname, req, res)) return;
  }

  // 3. Servidor de Archivos Estáticos Offline-First
  handleStaticRoutes(pathname, req, res);
});

if (require.main === module) {
  server.listen(PORT, '127.0.0.1', () => {
    console.log('====================================================================');
    console.log(' HOTEL NORTE - MOTOR DE BASE DE DATOS Y PUENTE ACTIVO');
    console.log(' Persistencia en disco atómica + Snapshots automáticos en data/backups');
    console.log(' Propiedad Booking ID: 2862226 (Hotel Norte - Cuenca)');
    console.log(` Servidor escuchando en: http://localhost:${PORT}`);
    console.log('====================================================================');
  });
}

module.exports = server;

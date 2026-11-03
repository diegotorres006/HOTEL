/* ==========================================================================
   HOTEL NORTE — SERVIDOR DE ARCHIVOS ESTÁTICOS
   Archivo: server/routes/static-routes.js
   ========================================================================== */

const path = require('path');
const fs = require('fs');
const { BASE_DIR, MIME_TYPES } = require('../config');

function handleStaticRoutes(pathname, req, res) {
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(BASE_DIR, decodeURIComponent(safePath));

  if (filePath.startsWith(BASE_DIR) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Recurso no encontrado');
  return true;
}

module.exports = { handleStaticRoutes };

/* ==========================================================================
   HOTEL NORTE — RUTAS DE BASE DE DATOS LOCAL Y BACKUPS
   Archivo: server/routes/db-routes.js
   ========================================================================== */

const path = require('path');
const fs = require('fs');
const { DATA_DIR, BACKUP_DIR, TABLAS_PERMITIDAS } = require('../config');
const {
  leerArchivoSeguro,
  escribirArchivoAtomico,
  leerReservasGuardadas,
  crearSnapshotBackup
} = require('../database/storage-engine');

function handleDbRoutes(pathname, req, res) {
  // 1. Carga consolidada de todas las tablas en disco al iniciar la aplicación
  if (pathname === '/api/db/load-all' && req.method === 'GET') {
    const dataConsolidada = {
      registros_diarios: leerArchivoSeguro(path.join(DATA_DIR, 'registros_diarios.json'), {}),
      huespedes_db: leerArchivoSeguro(path.join(DATA_DIR, 'huespedes_db.json'), []),
      turnos_historicos: leerArchivoSeguro(path.join(DATA_DIR, 'turnos_historicos.json'), []),
      sesion_activa: leerArchivoSeguro(path.join(DATA_DIR, 'sesion_activa.json'), null),
      auditoria_acciones: leerArchivoSeguro(path.join(DATA_DIR, 'auditoria_acciones.json'), []),
      booking_reservas: leerReservasGuardadas(),
      empleados: leerArchivoSeguro(path.join(DATA_DIR, 'empleados.json'), null),
      productos_bar: leerArchivoSeguro(path.join(DATA_DIR, 'productos_bar.json'), null),
      ventas_bar: leerArchivoSeguro(path.join(DATA_DIR, 'ventas_bar.json'), []),
      habitaciones_config: leerArchivoSeguro(path.join(DATA_DIR, 'habitaciones_config.json'), null),
      config_cajas: leerArchivoSeguro(path.join(DATA_DIR, 'config_cajas.json'), null)
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      servidor: 'Hotel Norte Database Engine v2.0',
      timestamp: new Date().toISOString(),
      tablas: dataConsolidada
    }));
    return true;
  }

  // 2. Guardado atómico de una tabla en disco
  if (pathname === '/api/db/save' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => { chunks.push(chunk); });
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        const payload = JSON.parse(body || '{}');
        const tabla = payload.tabla;
        const datos = payload.datos;

        if (!tabla || !TABLAS_PERMITIDAS.includes(tabla)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Nombre de tabla no válido o no permitido' }));
          return;
        }

        const rutaTabla = path.join(DATA_DIR, `${tabla}.json`);
        const exito = escribirArchivoAtomico(rutaTabla, datos);

        // Si se cierra turno o se hace check-in, disparar snapshot de seguridad
        if (tabla === 'turnos_historicos' || payload.forzarBackup) {
          crearSnapshotBackup(`evento_${tabla}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: exito, tabla, timestamp: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return true;
  }

  // 3. Creación manual de copia de seguridad (Snapshot)
  if (pathname === '/api/db/backup' && req.method === 'POST') {
    const resultado = crearSnapshotBackup('manual_solicitado');
    res.writeHead(resultado.ok ? 200 : 500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(resultado));
    return true;
  }

  // 4. Listar backups disponibles en disco
  if (pathname === '/api/db/backups' && req.method === 'GET') {
    try {
      const archivos = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('snapshot_') && f.endsWith('.json'))
        .map(f => {
          const stats = fs.statSync(path.join(BACKUP_DIR, f));
          return {
            archivo: f,
            tamanoBytes: stats.size,
            creadoEn: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, total: archivos.length, backups: archivos }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return true;
  }

  return false;
}

module.exports = { handleDbRoutes };

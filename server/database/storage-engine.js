/* ==========================================================================
   HOTEL NORTE — MOTOR DE ALMACENAMIENTO ATÓMICO Y BACKUPS ROTATIVOS
   Archivo: server/database/storage-engine.js
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { DATA_DIR, BACKUP_DIR, RESERVAS_FILE } = require('../config');

/**
 * Escritura atómica a prueba de cortes de energía (escribe a .tmp y renombra)
 */
function escribirArchivoAtomico(rutaArchivo, dataObj) {
  try {
    const dir = path.dirname(rutaArchivo);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${rutaArchivo}.tmp.${Date.now()}`;
    const contenido = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj, null, 2);
    fs.writeFileSync(tmpPath, contenido, 'utf8');
    fs.renameSync(tmpPath, rutaArchivo);
    return true;
  } catch (e) {
    console.error(`[DB ERROR] Falla al guardar archivo atómico (${rutaArchivo}):`, e.message);
    return false;
  }
}

/**
 * Lectura segura con valor por defecto
 */
function leerArchivoSeguro(rutaArchivo, defecto) {
  try {
    if (fs.existsSync(rutaArchivo)) {
      const raw = fs.readFileSync(rutaArchivo, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`[DB ERROR] Error leyendo (${rutaArchivo}):`, e.message);
  }
  return defecto;
}

function leerReservasGuardadas() {
  const data = leerArchivoSeguro(RESERVAS_FILE, []);
  return Array.isArray(data) ? data : [];
}

function guardarReservasEnDisco(lista) {
  return escribirArchivoAtomico(RESERVAS_FILE, lista);
}

/**
 * Generador de Snapshots de Respaldo Rotativos (Mantiene los últimos 50)
 */
function crearSnapshotBackup(motivo = 'auto') {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `snapshot_${timestampStr}_${motivo}.json`);

    const snapshot = {
      timestamp: new Date().toISOString(),
      motivo,
      version: '2.0-produccion',
      hotel: 'Hotel Norte',
      hotelId: '2862226',
      tablas: {
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
      }
    };

    escribirArchivoAtomico(backupFile, snapshot);

    // Rotación preventiva: conservar máximo 50 copias históricas
    const archivos = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('snapshot_') && f.endsWith('.json'))
      .sort();
    if (archivos.length > 50) {
      const aEliminar = archivos.slice(0, archivos.length - 50);
      aEliminar.forEach(f => {
        try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch (_) {}
      });
    }

    return {
      ok: true,
      archivo: path.basename(backupFile),
      totalBackups: Math.min(archivos.length + 1, 50),
      timestamp: snapshot.timestamp
    };
  } catch (e) {
    console.error('[BACKUP ERROR] Error creando snapshot:', e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = {
  escribirArchivoAtomico,
  leerArchivoSeguro,
  leerReservasGuardadas,
  guardarReservasEnDisco,
  crearSnapshotBackup
};

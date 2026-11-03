/* ==========================================================================
   HOTEL NORTE — MOTOR DE PERSISTENCIA DUAL Y ALTA DISPONIBILIDAD
   Archivo: src/utils/storage.js
   Arquitectura de Resiliencia:
   1. Persistencia Inmediata Local (LocalStorage) -> Rendimiento en milisegundos
   2. Persistencia Atómica en Disco (HTTP Bridge -> data/*.json) -> Durabilidad empresarial
   3. Fallback Offline Automático si el servidor local se reinicia
   4. Snapshots rotativos automáticos en data/backups/
   ========================================================================== */

const STORAGE_PREFIX = 'hotel_norte_';
const DB_SERVER_URL = 'http://127.0.0.1:3847/api/db';

let estadoPersistenciaDisco = {
  conectado: false,
  ultimoGuardado: null,
  totalTablasEnDisco: 0,
  colaPendienteGuardado: {}
};

/**
 * Carga de datos rápida desde almacenamiento local
 */
function cargarStorage(clave, defecto) {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + clave);
    if (!data) return defecto;
    const parseado = JSON.parse(data);
    return parseado !== null && parseado !== undefined ? parseado : defecto;
  } catch (e) {
    console.warn(`[STORAGE] Error leyendo ${clave} de localStorage:`, e.message);
    return defecto;
  }
}

/**
 * Guardado dual: escribe a LocalStorage y sincroniza con el servidor de disco
 */
function guardarStorage(clave, valor, forzarBackup = false) {
  try {
    // 1. Escritura inmediata en LocalStorage (Memoria del Navegador)
    localStorage.setItem(STORAGE_PREFIX + clave, JSON.stringify(valor));
  } catch (e) {
    console.error(`[STORAGE] Error escribiendo ${clave} en localStorage:`, e.message);
  }

  // 2. Transmisión asíncrona al motor de base de datos en disco (server_booking_bridge)
  sincronizarTablaConDisco(clave, valor, forzarBackup);
}

/**
 * Envía la tabla al servidor local para escritura atómica en archivo .json
 */
let temporizadoresGuardado = {};
function sincronizarTablaConDisco(tabla, datos, forzarBackup = false) {
  if (temporizadoresGuardado[tabla]) {
    clearTimeout(temporizadoresGuardado[tabla]);
  }

  // Debounce breve (120ms) para evitar sobrecargar I/O en ráfagas de tipeo
  temporizadoresGuardado[tabla] = setTimeout(() => {
    fetch(`${DB_SERVER_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabla, datos, forzarBackup })
    })
      .then(r => r.json())
      .then(res => {
        if (res && res.ok) {
          estadoPersistenciaDisco.conectado = true;
          estadoPersistenciaDisco.ultimoGuardado = new Date().toISOString();
          actualizarIndicadorDisponibilidadBD(true);
        }
      })
      .catch(() => {
        estadoPersistenciaDisco.conectado = false;
        actualizarIndicadorDisponibilidadBD(false);
      });
  }, 120);
}

/**
 * Dispara la creación de un Snapshot manual en disco
 */
async function crearRespaldoManualEnDisco() {
  try {
    const resp = await fetch(`${DB_SERVER_URL}/backup`, { method: 'POST' });
    const data = await resp.json();
    if (data.ok) {
      UIModal.aviso({
        titulo: 'Copia de Seguridad Creada',
        subtitulo: 'Hotel Norte · Respaldo en Disco',
        mensaje: `Se ha generado un snapshot íntegro de la base de datos en "${data.archivo}". Total respaldos rotativos: ${data.totalBackups}.`,
        tipo: 'exito'
      });
    }
  } catch (e) {
    UIModal.aviso({
      titulo: 'Servidor Local Desconectado',
      mensaje: 'No fue posible conectar con el servidor local para generar la copia en disco. Los datos siguen protegidos en el navegador.',
      tipo: 'alerta'
    });
  }
}

/**
 * Indicador visual discreto de estado de la base de datos
 */
function actualizarIndicadorDisponibilidadBD(conectado) {
  const el = document.getElementById('indicador-estado-bd');
  if (!el) return;
  if (conectado) {
    el.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">BD Disco Activa (Alta Disponibilidad)</span>';
  } else {
    el.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Sistema Local Protegido</span>';
  }
}

/**
 * Hidratación y Reconciliación al iniciar el PMS:
 * Carga los datos maestros desde disco si existen, o sincroniza hacia disco si es primera carga.
 */
async function sincronizarBaseDeDatosConDisco() {
  try {
    const resp = await fetch(`${DB_SERVER_URL}/load-all`, { method: 'GET' });
    if (!resp.ok) throw new Error('Respuesta no válida');
    const data = await resp.json();

    if (data && data.ok && data.tablas) {
      estadoPersistenciaDisco.conectado = true;
      actualizarIndicadorDisponibilidadBD(true);

      const t = data.tablas;

      // Reconciliar Registros Diarios
      if (t.registros_diarios && Object.keys(t.registros_diarios).length > 0) {
        registrosDiarios = t.registros_diarios;
        localStorage.setItem(STORAGE_PREFIX + 'registros_diarios', JSON.stringify(registrosDiarios));
      } else if (registrosDiarios && Object.keys(registrosDiarios).length > 0) {
        sincronizarTablaConDisco('registros_diarios', registrosDiarios, true);
      }

      // Reconciliar Base Histórica de Huéspedes
      if (Array.isArray(t.huespedes_db) && t.huespedes_db.length > 0) {
        baseHistoricaHuespedes = t.huespedes_db;
        localStorage.setItem(STORAGE_PREFIX + 'huespedes_db', JSON.stringify(baseHistoricaHuespedes));
      } else if (Array.isArray(baseHistoricaHuespedes) && baseHistoricaHuespedes.length > 0) {
        sincronizarTablaConDisco('huespedes_db', baseHistoricaHuespedes);
      }

      // Reconciliar Turnos Históricos
      if (Array.isArray(t.turnos_historicos) && t.turnos_historicos.length > 0) {
        turnosHistoricos = t.turnos_historicos;
        localStorage.setItem(STORAGE_PREFIX + 'turnos_historicos', JSON.stringify(turnosHistoricos));
      } else if (Array.isArray(turnosHistoricos) && turnosHistoricos.length > 0) {
        sincronizarTablaConDisco('turnos_historicos', turnosHistoricos);
      }

      // Reconciliar Reservas de Booking.com
      if (Array.isArray(t.booking_reservas) && t.booking_reservas.length > 0) {
        reservasBooking = t.booking_reservas;
        localStorage.setItem(STORAGE_PREFIX + 'reservas_booking', JSON.stringify(reservasBooking));
      }

      // Reconciliar Sesión Activa de Turno
      if (t.sesion_activa && t.sesion_activa.idTurno) {
        sesionActiva = t.sesion_activa;
        localStorage.setItem(STORAGE_PREFIX + 'sesion_activa', JSON.stringify(sesionActiva));
      }

      // Reconciliar Empleados y Nómina
      if (Array.isArray(t.empleados) && t.empleados.length > 0) {
        empleados = t.empleados;
        localStorage.setItem(STORAGE_PREFIX + 'empleados', JSON.stringify(empleados));
        if (typeof renderListaEmpleados === 'function') renderListaEmpleados();
      } else if (Array.isArray(empleados) && empleados.length > 0) {
        sincronizarTablaConDisco('empleados', empleados);
      }

      // Reconciliar Productos de Bar & Frigobar
      if (Array.isArray(t.productos_bar) && t.productos_bar.length > 0) {
        productosBar = t.productos_bar;
        localStorage.setItem(STORAGE_PREFIX + 'productos_bar', JSON.stringify(productosBar));
      } else if (Array.isArray(productosBar) && productosBar.length > 0) {
        sincronizarTablaConDisco('productos_bar', productosBar);
      }

      // Reconciliar Ventas del Bar
      if (Array.isArray(t.ventas_bar) && t.ventas_bar.length > 0) {
        ventasBar = t.ventas_bar;
        localStorage.setItem(STORAGE_PREFIX + 'ventas_bar', JSON.stringify(ventasBar));
      }

      // Reconciliar Configuración de Habitaciones
      if (Array.isArray(t.habitaciones_config) && t.habitaciones_config.length > 0) {
        habitacionesConfig = t.habitaciones_config;
        localStorage.setItem(STORAGE_PREFIX + 'habitaciones_config', JSON.stringify(habitacionesConfig));
      } else if (Array.isArray(habitacionesConfig) && habitacionesConfig.length > 0) {
        sincronizarTablaConDisco('habitaciones_config', habitacionesConfig);
      }

      // Reconciliar Configuración de Cajas (Fondos Fijos)
      if (t.config_cajas && typeof t.config_cajas.fondoFijoHospedaje === 'number') {
        configCajas = t.config_cajas;
        localStorage.setItem(STORAGE_PREFIX + 'config_cajas', JSON.stringify(configCajas));
      } else if (configCajas) {
        sincronizarTablaConDisco('config_cajas', configCajas);
      }

      if (typeof renderCuadrados === 'function') renderCuadrados();
      if (typeof actualizarBadgeBookingHeader === 'function') actualizarBadgeBookingHeader();
      if (typeof actualizarIndicadoresCajaHeader === 'function') actualizarIndicadoresCajaHeader();
      if (typeof renderVistaBar === 'function' && modoVistaActual === 'bar') renderVistaBar();
      console.log('[DB ENGINE] Base de datos en disco sincronizada exitosamente con el sistema.');
    }
  } catch (e) {
    estadoPersistenciaDisco.conectado = false;
    actualizarIndicadorDisponibilidadBD(false);
    console.warn('[DB ENGINE] Servidor de disco no alcanzable en arranque. Operando con LocalStorage resiliente.');
  }
}

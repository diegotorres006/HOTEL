/* ==========================================================================
   HOTEL NORTE — ESTADO GLOBAL Y GENERADOR DE HABITACIONES (MODO PRODUCCIÓN)
   Archivo: src/state/store.js
   35 Habitaciones Reales · Capacidad 100 Personas · Sin Datos Ficticios
   ========================================================================== */

const FECHA_HOY = new Date().toISOString().slice(0, 10);

let empleados = cargarStorage('empleados', EMPLEADOS_DEFAULT);
let turnosHistoricos = cargarStorage('turnos_historicos', TURNOS_HISTORICOS_DEFAULT);
let baseHistoricaHuespedes = cargarStorage('huespedes_db', HUESPEDES_DEFAULT);
let registrosDiarios = cargarStorage('registros_diarios', {});
let sesionActiva = cargarStorage('sesion_activa', null);

let productosBar = cargarStorage('productos_bar', PRODUCTOS_BAR_DEFAULT);
let ventasBar = cargarStorage('ventas_bar', []);
let habitacionesConfig = cargarStorage('habitaciones_config', DISTRIBUCION_HOTEL_NORTE);
let configCajas = cargarStorage('config_cajas', CONFIG_CAJAS_DEFAULT);
if (!configCajas || typeof configCajas.fondoFijoHospedaje !== 'number') {
  configCajas = { ...CONFIG_CAJAS_DEFAULT, ...(configCajas || {}) };
}

function obtenerHabitacionesConfig() {
  if (!Array.isArray(habitacionesConfig) || habitacionesConfig.length === 0) {
    habitacionesConfig = [...DISTRIBUCION_HOTEL_NORTE];
  }
  return habitacionesConfig;
}

let empleadoLoginSeleccionado = null;
let pinActual = '';

let fechaSeleccionada = FECHA_HOY;
let filtroActivo = 'todas';
let filtroPisoActivo = 'todos';
let filtroTipoActivo = 'todos';
let habitacionSeleccionada = null;
let busquedaActivosTexto = '';
let modoVistaActual = 'rack';

const RESERVAS_BOOKING_DEFAULT = [];
let reservasBooking = cargarStorage('reservas_booking', RESERVAS_BOOKING_DEFAULT);

function generarHabitacionesParaFecha(fechaStr) {
  const cfg = obtenerHabitacionesConfig();
  return cfg.map((dist) => ({
    id: dist.id,
    numero: dist.numero,
    piso: dist.piso,
    pisoCorto: dist.pisoCorto,
    pisoId: dist.pisoId,
    capacidad: dist.capacidad,
    tipo: dist.tipo,
    categoriaFiltro: dist.categoriaFiltro,
    descripcionCamas: dist.descripcionCamas,
    camas: dist.camas,
    tarifa: dist.tarifa,
    estado: 'libre',
    venceHoy: false,
    huesped: null,
    controles: 0,
    toallas: 0,
    pagado: 0,
    debito: 0,
    registradoPor: null,
    horaRegistro: null,
    horaEntrada: null,
    horaPago: null,
    numHuespedes: dist.capacidad,
    turnoRegistro: null,
    cargosBar: [],
    estanciasPasadas: []
  }));
}

function obtenerHabitacionesDia(fechaStr) {
  const cfg = obtenerHabitacionesConfig();
  const cached = registrosDiarios[fechaStr];
  if (
    !cached ||
    cached.length !== cfg.length ||
    !cached[0]?.piso ||
    !cached[0]?.categoriaFiltro
  ) {
    if (cached && Array.isArray(cached) && cached.length > 0) {
      const mapaExistentes = new Map(cached.map(h => [h.id, h]));
      registrosDiarios[fechaStr] = cfg.map(dist => {
        const existente = mapaExistentes.get(dist.id);
        if (existente) {
          existente.numero = dist.numero;
          existente.piso = dist.piso;
          existente.pisoCorto = dist.pisoCorto;
          existente.pisoId = dist.pisoId;
          existente.capacidad = dist.capacidad;
          existente.tipo = dist.tipo;
          existente.categoriaFiltro = dist.categoriaFiltro;
          existente.descripcionCamas = dist.descripcionCamas;
          existente.camas = dist.camas;
          existente.tarifa = dist.tarifa;
          if (!existente.cargosBar) existente.cargosBar = [];
          if (!existente.estanciasPasadas) existente.estanciasPasadas = [];
          return existente;
        } else {
          return {
            id: dist.id,
            numero: dist.numero,
            piso: dist.piso,
            pisoCorto: dist.pisoCorto,
            pisoId: dist.pisoId,
            capacidad: dist.capacidad,
            tipo: dist.tipo,
            categoriaFiltro: dist.categoriaFiltro,
            descripcionCamas: dist.descripcionCamas,
            camas: dist.camas,
            tarifa: dist.tarifa,
            estado: 'libre',
            venceHoy: false,
            huesped: null,
            controles: 0,
            toallas: 0,
            pagado: 0,
            debito: 0,
            registradoPor: null,
            horaRegistro: null,
            horaEntrada: null,
            horaPago: null,
            numHuespedes: dist.capacidad,
            turnoRegistro: null,
            cargosBar: [],
            estanciasPasadas: []
          };
        }
      });
    } else {
      registrosDiarios[fechaStr] = generarHabitacionesParaFecha(fechaStr);
    }
    guardarStorage('registros_diarios', registrosDiarios);
  }
  // Asegurar compatibilidad para habitaciones ya en caché
  if (Array.isArray(registrosDiarios[fechaStr])) {
    registrosDiarios[fechaStr].forEach(h => {
      if (!h.cargosBar) h.cargosBar = [];
      if (!h.estanciasPasadas) h.estanciasPasadas = [];
    });
  }
  return registrosDiarios[fechaStr];
}

function registrarAccion(tipo, descripcion, hab = null) {
  if (!sesionActiva) return null;
  const ahora = new Date();
  const registro = {
    tipo,
    descripcion,
    hab,
    hora: ahora.toISOString(),
    empleado: sesionActiva.empleado.nombre,
  };
  sesionActiva.registros.push(registro);
  guardarStorage('sesion_activa', sesionActiva);
  return registro;
}

/* ==========================================================================
   HOTEL NORTE — RUTAS DE SINCRONIZACIÓN CON BOOKING.COM
   Archivo: server/routes/booking-routes.js
   ========================================================================== */

const { estadoConexionExtranet } = require('../config');
const {
  leerReservasGuardadas,
  guardarReservasEnDisco
} = require('../database/storage-engine');

function handleBookingRoutes(pathname, req, res) {
  // 1. Estado de conexión del puente con Booking
  if (pathname === '/api/booking/status' && req.method === 'GET') {
    const reservas = leerReservasGuardadas();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      puenteActivo: true,
      extranet: estadoConexionExtranet,
      totalReservas: reservas.length,
      pendientesLlegada: reservas.filter(r => !r.recibido && r.estadoBooking !== 'Cancelada').length
    }));
    return true;
  }

  // 2. Obtener todas las reservas de Booking.com
  if (pathname === '/api/booking/reservas' && req.method === 'GET') {
    const reservas = leerReservasGuardadas();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      extranet: estadoConexionExtranet,
      reservas
    }));
    return true;
  }

  // 3. Recepción de reservas en tiempo real desde la Extensión de Chrome
  if (pathname === '/api/booking/sync' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => { chunks.push(chunk); });
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        const payload = JSON.parse(body || '{}');
        const entrantes = Array.isArray(payload.reservas) ? payload.reservas : [];
        const actuales = leerReservasGuardadas();
        let nuevasInsertadas = 0;
        let actualizadas = 0;

        estadoConexionExtranet.conectado = true;
        estadoConexionExtranet.ultimaSincronizacion = new Date().toISOString();
        if (payload.urlExtranet) estadoConexionExtranet.urlActualExtranet = payload.urlExtranet;
        estadoConexionExtranet.totalDetectadasUltimaVez = entrantes.length;

        entrantes.forEach(nueva => {
          if (!nueva || !nueva.codigoBooking) return;
          const codStr = String(nueva.codigoBooking).trim();
          const idx = actuales.findIndex(r => String(r.codigoBooking).trim() === codStr);

          if (idx === -1) {
            actuales.unshift({
              codigoBooking: codStr,
              huesped: nueva.huesped || 'Huésped Booking.com',
              documento: nueva.documento || '',
              procedencia: nueva.procedencia || 'Booking.com Extranet',
              telefono: nueva.telefono || '',
              correo: nueva.correo || '',
              habAsignada: nueva.habAsignada || null,
              tipoHab: nueva.tipoHab || 'Estándar Booking',
              idTipoHabBooking: nueva.idTipoHabBooking || '',
              tarifa: Number(nueva.tarifa) || 30.00,
              fechaIngreso: nueva.fechaIngreso || new Date().toISOString().slice(0, 10),
              fechaSalida: nueva.fechaSalida || '',
              noches: Number(nueva.noches) || 1,
              numHuespedes: Number(nueva.numHuespedes) || 2,
              estadoBooking: nueva.estadoBooking || 'Confirmada',
              estadoPagoBooking: nueva.estadoPagoBooking || 'Reserva Booking.com',
              requiereFactura: nueva.requiereFactura || 'ninguna',
              rucEmpresa: nueva.rucEmpresa || '',
              razonEmpresa: nueva.razonEmpresa || '',
              recibido: Boolean(nueva.recibido),
              sincronizadoEn: new Date().toISOString()
            });
            nuevasInsertadas++;
          } else {
            // Actualizar datos de Booking sin sobreescribir check-in ni habitación modificada localmente
            const ex = actuales[idx];
            if (nueva.huesped && nueva.huesped !== 'Huésped Booking.com') ex.huesped = nueva.huesped;
            if (nueva.tipoHab) ex.tipoHab = nueva.tipoHab;
            if (nueva.tarifa && Number(nueva.tarifa) > 0) ex.tarifa = Number(nueva.tarifa);
            if (nueva.fechaIngreso) ex.fechaIngreso = nueva.fechaIngreso;
            if (nueva.fechaSalida) ex.fechaSalida = nueva.fechaSalida;
            if (nueva.noches) ex.noches = Number(nueva.noches);
            if (nueva.numHuespedes) ex.numHuespedes = Number(nueva.numHuespedes);
            if (nueva.estadoBooking) ex.estadoBooking = nueva.estadoBooking;
            if (nueva.telefono) ex.telefono = nueva.telefono;
            if (nueva.correo) ex.correo = nueva.correo;
            ex.ultimaActualizacion = new Date().toISOString();
            actualizadas++;
          }
        });

        guardarReservasEnDisco(actuales);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          nuevasInsertadas,
          actualizadas,
          totalReservas: actuales.length,
          timestamp: estadoConexionExtranet.ultimaSincronizacion
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return true;
  }

  // 4. Actualizaciones puntuales de estado de reserva (Ack / Reasignación / Check-in)
  if (pathname === '/api/booking/ack' && req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => { chunks.push(chunk); });
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        const payload = JSON.parse(body || '{}');
        const actuales = leerReservasGuardadas();
        const idx = actuales.findIndex(r => String(r.codigoBooking) === String(payload.codigoBooking));
        if (idx !== -1) {
          if (typeof payload.recibido === 'boolean') actuales[idx].recibido = payload.recibido;
          if (payload.habAsignada) actuales[idx].habAsignada = Number(payload.habAsignada);
          if (payload.eliminar) actuales.splice(idx, 1);
          guardarReservasEnDisco(actuales);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, reservas: actuales }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return true;
  }

  return false;
}

module.exports = { handleBookingRoutes };

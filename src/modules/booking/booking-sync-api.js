/* ==========================================================================
   HOTEL NORTE — COMUNICACIÓN Y SINCRONIZACIÓN API BOOKING.COM
   Archivo: src/modules/booking/booking-sync-api.js
   Propiedad Oficial: Hotel Norte (Booking ID: 2862226 · 35 Habitaciones)
   ========================================================================== */

const BOOKING_BRIDGE_URL = 'http://127.0.0.1:3847/api/booking';
let bookingMonitorInterval = null;
let filtroBandejaBooking = 'confirmadas';
let estadoPuenteBooking = {
  conectado: false,
  ultimaSincronizacion: null
};

function limpiarTextoCorruptoUTF8(str) {
  if (!str) return '';
  return String(str)
    .replace(/Est\uFFFDndar/gi, 'Estándar')
    .replace(/Econ\uFFFDmica/gi, 'Económica')
    .replace(/Habitaci\uFFFDn/gi, 'Habitación')
    .replace(/Cu\uFFFDdruple/gi, 'Cuádruple')
    .replace(/Qu\uFFFDntuple/gi, 'Quíntuple')
    .replace(/Oca\uFFFDa/gi, 'Ocaña')
    .replace(/Espa\uFFFDa/gi, 'España')
    .replace(/Cebri\uFFFD/gi, 'Cebrià')
    .replace(/Fern\uFFFDndez/gi, 'Fernández')
    .replace(/Su\uFFFDrez/gi, 'Suárez')
    .replace(/Mar\uFFFDa/gi, 'María')
    .replace(/Bail\uFFFDn/gi, 'Bailón')
    .replace(/\uFFFD/g, 'ñ');
}

function emitirSonidoNotificacionBooking() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {}
}

function esHabitacionValidaHotelNorte(habId) {
  return DISTRIBUCION_HOTEL_NORTE.some(d => d.id === Number(habId));
}

function obtenerFechasEstadiaReserva(fechaIngreso, noches = 1) {
  const fechas = [];
  const baseStr = fechaIngreso || FECHA_HOY;
  const totalNoches = Math.max(1, Math.min(30, Number(noches) || 1));
  const d = new Date(baseStr + 'T00:00:00');
  if (isNaN(d.getTime())) return [FECHA_HOY];
  for (let i = 0; i < totalNoches; i++) {
    const cur = new Date(d);
    cur.setDate(d.getDate() + i);
    fechas.push(cur.toISOString().slice(0, 10));
  }
  return fechas;
}

function asignarHabitacionInteligenteBooking(tipoHabTexto = '', fechaIngreso = FECHA_HOY, habSugerida = null, codigoBookingActual = null) {
  const habsDia = obtenerHabitacionesDia(fechaIngreso || FECHA_HOY);

  if (habSugerida && esHabitacionValidaHotelNorte(habSugerida)) {
    const hSug = habsDia.find(x => x.id === Number(habSugerida));
    if (hSug && (hSug.estado === 'libre' || hSug.codigoBooking === codigoBookingActual)) {
      return Number(habSugerida);
    }
  }

  const texto = limpiarTextoCorruptoUTF8(tipoHabTexto).toLowerCase();

  const candidatos = [];
  const seccionHab = texto.split(/hab\.?\s*#/i)[1] || '';
  if (seccionHab) {
    const nums = seccionHab.match(/\b\d{1,2}\b/g);
    if (nums) {
      nums.forEach(n => {
        const idNum = parseInt(n, 10);
        if (esHabitacionValidaHotelNorte(idNum) && !candidatos.includes(idNum)) {
          candidatos.push(idNum);
        }
      });
    }
  }

  if (texto.includes('individual') || texto.includes('286222601')) {
    [56, 66, 3, 10, 51, 52].forEach(id => { if (!candidatos.includes(id)) candidatos.push(id); });
  } else if (texto.includes('triple') || texto.includes('286222606')) {
    [1, 2, 13, 20, 37, 8, 12, 54, 55, 65].forEach(id => { if (!candidatos.includes(id)) candidatos.push(id); });
  } else if (texto.includes('cuádruple') || texto.includes('cuadruple') || texto.includes('familiar')) {
    [14, 19, 64, 67, 9, 11, 15, 16].forEach(id => { if (!candidatos.includes(id)) candidatos.push(id); });
  } else {
    [18, 17, 10, 3, 51, 52, 53, 57, 58, 59, 60, 61, 62, 63, 68, 69, 8, 12].forEach(id => {
      if (!candidatos.includes(id)) candidatos.push(id);
    });
  }

  for (const idCand of candidatos) {
    const h = habsDia.find(x => x.id === idCand);
    if (h && (h.estado === 'libre' || h.codigoBooking === codigoBookingActual)) {
      return idCand;
    }
  }

  const libreCualquiera = habsDia.find(x => x.estado === 'libre' || x.codigoBooking === codigoBookingActual);
  return libreCualquiera ? libreCualquiera.id : (candidatos[0] || 18);
}

function ordenarReservasBookingCronologicamente() {
  reservasBooking.sort((a, b) => {
    const aCancel = a.estadoBooking === 'Cancelada' ? 1 : 0;
    const bCancel = b.estadoBooking === 'Cancelada' ? 1 : 0;
    if (aCancel !== bCancel) return aCancel - bCancel;

    const aRec = a.recibido ? 1 : 0;
    const bRec = b.recibido ? 1 : 0;
    if (aRec !== bRec) return aRec - bRec;

    const fa = a.fechaIngreso || '9999-12-31';
    const fb = b.fechaIngreso || '9999-12-31';
    if (fa !== fb) return fa.localeCompare(fb);

    return String(a.codigoBooking).localeCompare(String(b.codigoBooking));
  });
}

function calcularFechaSalidaReserva(r) {
  if (r && r.fechaSalida) return r.fechaSalida;
  if (!r || !r.fechaIngreso) return FECHA_HOY;
  const d = new Date(r.fechaIngreso + 'T00:00:00');
  if (isNaN(d.getTime())) return r.fechaIngreso;
  d.setDate(d.getDate() + (Number(r.noches) || 1));
  return d.toISOString().slice(0, 10);
}

function esReservaVigente(r) {
  if (!r) return false;
  const hoyStr = FECHA_HOY;
  const fIng = r.fechaIngreso || '';
  const fSal = calcularFechaSalidaReserva(r);
  if (fIng >= hoyStr) return true;
  if (fSal && fSal > hoyStr) return true;
  return false;
}

async function forzarSincronizacionPuenteBooking(mostrarModalFeedback = false) {
  const indEl = document.getElementById('booking-bridge-indicator');
  const timeEl = document.getElementById('booking-last-sync-time');

  if (mostrarModalFeedback) {
    window.postMessage({
      type: 'PMS_DISPARAR_AUTO_SYNC_BOOKING',
      forzar: true,
      motivo: 'boton_manual_pms'
    }, '*');
  }

  try {
    const resp = await fetch(BOOKING_BRIDGE_URL + '/reservas', { method: 'GET' });
    if (resp.ok) {
      const data = await resp.json();
      estadoPuenteBooking.conectado = true;
      if (indEl) {
        indEl.innerText = 'AUTO-SYNC 65 DÍAS ACTIVO (http://localhost:3847)';
        indEl.className = 'font-mono font-bold text-emerald-600';
      }
      if (timeEl) {
        timeEl.innerText = 'Auto-Sync: ' + formatHoraCompleta(new Date());
      }
      if (Array.isArray(data.reservas) && data.reservas.length > 0) {
        integrarReservasEntrantesBooking(data.reservas, mostrarModalFeedback);
      } else {
        sincronizarReservasEnRack(false, []);
        if (mostrarModalFeedback) {
          integrarReservasEntrantesBooking([], true);
        }
      }
    }
  } catch (e) {
    estadoPuenteBooking.conectado = false;
    if (indEl) {
      indEl.innerText = 'MODO LOCAL (Extensión Auto-Sync 65 Días)';
      indEl.className = 'font-mono font-bold text-sky-600';
    }
    sincronizarReservasEnRack(false, []);
    if (mostrarModalFeedback) {
      integrarReservasEntrantesBooking([], true);
    }
  }
}

function iniciarEscuchaBookingEnTiempoReal() {
  sincronizarReservasEnRack(false, []);

  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'HOTEL_NORTE_BOOKING_SYNC') {
      if (Array.isArray(event.data.reservas) && event.data.reservas.length > 0) {
        integrarReservasEntrantesBooking(event.data.reservas, false);
      }
      const timeEl = document.getElementById('booking-last-sync-time');
      if (timeEl) {
        timeEl.innerText = 'Sincronizado Auto (65 días): ' + formatHoraCompleta(new Date());
      }
    } else if (event.data.type === 'HOTEL_NORTE_BOOKING_STATUS') {
      const timeEl = document.getElementById('booking-last-sync-time');
      if (timeEl && event.data.estadoTexto) {
        timeEl.innerText = event.data.estadoTexto;
      }
    }
  });

  setTimeout(() => {
    window.postMessage({
      type: 'PMS_DISPARAR_AUTO_SYNC_BOOKING',
      forzar: false,
      motivo: 'recarga_pagina_pms'
    }, '*');
  }, 600);

  if (bookingMonitorInterval) clearInterval(bookingMonitorInterval);
  forzarSincronizacionPuenteBooking(false);
  bookingMonitorInterval = setInterval(() => {
    forzarSincronizacionPuenteBooking(false);
  }, 4000);
}

function integrarReservasEntrantesBooking(entrantes = [], mostrarAvisoManual = false) {
  if (!Array.isArray(entrantes)) return;
  const nuevasDetectadas = [];

  entrantes.forEach(ent => {
    if (!ent || !ent.codigoBooking) return;
    const codStr = String(ent.codigoBooking).trim();
    const existenteIdx = reservasBooking.findIndex(r => String(r.codigoBooking).trim() === codStr);
    const huespedLimpio = limpiarTextoCorruptoUTF8(ent.huesped || ('Huésped Booking #' + codStr));
    const tipoHabLimpio = limpiarTextoCorruptoUTF8(ent.tipoHab || 'Estándar Booking');

    if (existenteIdx === -1) {
      const fechaIng = ent.fechaIngreso || FECHA_HOY;
      const habAsig = asignarHabitacionInteligenteBooking(tipoHabLimpio, fechaIng, ent.habAsignada, codStr);
      const nuevaObj = {
        codigoBooking: codStr,
        huesped: huespedLimpio,
        documento: ent.documento || '',
        procedencia: ent.procedencia || 'Booking.com Extranet',
        telefono: ent.telefono || '',
        correo: ent.correo || '',
        habAsignada: habAsig,
        tipoHab: tipoHabLimpio,
        tarifa: Number(ent.tarifa) || 30.00,
        fechaIngreso: fechaIng,
        fechaSalida: ent.fechaSalida || '',
        noches: Number(ent.noches) || 1,
        numHuespedes: Number(ent.numHuespedes) || 2,
        estadoBooking: ent.estadoBooking || 'Confirmada',
        estadoPagoBooking: ent.estadoPagoBooking || 'Reserva Booking.com',
        requiereFactura: ent.requiereFactura || 'ninguna',
        rucEmpresa: ent.rucEmpresa || '',
        razonEmpresa: ent.razonEmpresa || '',
        recibido: Boolean(ent.recibido)
      };
      reservasBooking.push(nuevaObj);
      nuevasDetectadas.push(nuevaObj);
    } else {
      const actual = reservasBooking[existenteIdx];
      if (huespedLimpio && !huespedLimpio.startsWith('Huésped Booking #')) actual.huesped = huespedLimpio;
      if (tipoHabLimpio && tipoHabLimpio !== 'Estándar Booking') actual.tipoHab = tipoHabLimpio;
      if (ent.tarifa && Number(ent.tarifa) > 0) actual.tarifa = Number(ent.tarifa);
      if (ent.fechaIngreso) actual.fechaIngreso = ent.fechaIngreso;
      if (ent.fechaSalida) actual.fechaSalida = ent.fechaSalida;
      if (ent.noches) actual.noches = Number(ent.noches);
      if (ent.estadoBooking) actual.estadoBooking = ent.estadoBooking;
      if (ent.telefono) actual.telefono = ent.telefono;
    }
  });

  sincronizarReservasEnRack(nuevasDetectadas.length > 0, nuevasDetectadas);

  if (mostrarAvisoManual && nuevasDetectadas.length === 0) {
    const vigentes = reservasBooking.filter(r => !r.recibido && r.estadoBooking !== 'Cancelada' && esReservaVigente(r));
    const proxima = vigentes[0];
    UIModal.aviso({
      titulo: 'Sincronización Booking.com al Día',
      subtitulo: 'Hotel Norte · ID 2862226',
      mensaje: vigentes.length > 0
        ? `Se verificaron las reservas: hay ${vigentes.length} reserva(s) confirmada(s) activa(s) asignadas al Rack. La próxima llegada es el ${proxima.fechaIngreso} (${proxima.huesped} — Hab #${String(proxima.habAsignada).padStart(2, '0')}).`
        : 'El puente local y la bandeja de Booking.com están sincronizados al día.',
      tipo: 'exito',
      detalles: [
        { etiqueta: 'Reservas Vigentes Activas', valor: String(vigentes.length) },
        { etiqueta: 'Próximo Check-in Booking', valor: proxima ? `${proxima.fechaIngreso} · ${proxima.huesped} (Hab #${String(proxima.habAsignada).padStart(2, '0')})` : 'Sin llegadas pendientes' },
        { etiqueta: 'Total Histórico en Bandeja', valor: String(reservasBooking.length) + ' reservas' }
      ]
    });
  }
}

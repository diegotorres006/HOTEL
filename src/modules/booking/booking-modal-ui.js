/* ==========================================================================
   HOTEL NORTE — INTERFAZ MODAL Y ASIGNACIÓN DE RESERVAS DE BOOKING.COM
   Archivo: src/modules/booking/booking-modal-ui.js
   ========================================================================== */

let busquedaBandejaBookingTexto = '';

function buscarReservaBookingEnBandeja(texto) {
  busquedaBandejaBookingTexto = (texto || '').toLowerCase().trim();
  renderReservasBooking();
}

function actualizarBadgeBookingHeader() {
  const badge = document.getElementById('badge-booking-pendientes') || document.getElementById('badge-booking-count');
  if (!badge) return;
  const pendientes = reservasBooking.filter(r => !r.recibido && r.estadoBooking !== 'Cancelada' && esReservaVigente(r)).length;
  badge.innerText = pendientes;
}

function poblarSelectHabitacionesBookingModal() {
  const sel = document.getElementById('bk-hab');
  if (!sel) return;
  const habsHoy = obtenerHabitacionesDia(fechaSeleccionada);
  sel.innerHTML = DISTRIBUCION_HOTEL_NORTE.map(d => {
    const hEstado = habsHoy.find(x => x.id === d.id);
    const estTxt = hEstado && hEstado.estado !== 'libre' ? ` [${hEstado.estado.toUpperCase()}]` : ' [Disponible]';
    return `<option value="${d.id}" ${d.id === 18 ? 'selected' : ''}>Hab #${d.numero} (${d.pisoCorto}) · ${d.tipo} (${d.capacidad}p) — $${d.tarifa}${estTxt}</option>`;
  }).join('');

  const fInput = document.getElementById('bk-fecha-ingreso');
  if (fInput && !fInput.value) fInput.value = fechaSeleccionada;
}

function abrirModalBooking() {
  poblarSelectHabitacionesBookingModal();
  renderReservasBooking();
  document.getElementById('modal-booking').classList.remove('hidden');
  forzarSincronizacionPuenteBooking(false);
}

function cerrarModalBooking() {
  document.getElementById('modal-booking').classList.add('hidden');
}

function filtrarBandejaBooking(tabId) {
  filtroBandejaBooking = tabId;
  ['confirmadas', 'canceladas', 'pasadas', 'todas'].forEach(id => {
    const btn = document.getElementById('tab-bk-' + id);
    if (!btn) return;
    if (id === tabId) {
      btn.className = 'px-3 py-1.5 rounded-md bg-blue-900 text-white font-semibold text-xs transition shadow-2xs';
    } else {
      btn.className = 'px-3 py-1.5 rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium text-xs transition';
    }
  });
  renderReservasBooking();
}

function irAFechaReservaBooking(fechaStr, habId) {
  if (!fechaStr) return;
  cerrarModalBooking();
  seleccionarFechaDirecta(fechaStr);
  if (filtroActivo !== 'todas' && filtroActivo !== 'reservadas') {
    filtrar('todas');
  }
  if (filtroPisoActivo !== 'todos') {
    filtrarPiso('todos');
  }
  if (filtroTipoActivo !== 'todos') {
    filtrarTipo('todos');
  }
}

function togglePegadoRapidoBooking() {
  const box = document.getElementById('box-pegado-rapido-booking');
  if (box) box.classList.toggle('hidden');
}

function sincronizarReservasEnRack(notificarNuevas = false, nuevasLista = []) {
  ordenarReservasBookingCronologicamente();
  const hoyStr = FECHA_HOY;

  reservasBooking.forEach(r => {
    r.huesped = limpiarTextoCorruptoUTF8(r.huesped);
    r.tipoHab = limpiarTextoCorruptoUTF8(r.tipoHab);

    const esVigente = esReservaVigente(r);
    const esCancelada = r.estadoBooking === 'Cancelada';
    const fechaRes = r.fechaIngreso || hoyStr;
    const fechasEstadia = obtenerFechasEstadiaReserva(fechaRes, r.noches || 1);

    if (esCancelada || !esVigente) {
      fechasEstadia.forEach(fDia => {
        if (fDia >= hoyStr || esCancelada) {
          const habsFecha = obtenerHabitacionesDia(fDia);
          habsFecha.forEach(hab => {
            if (hab.codigoBooking === r.codigoBooking && hab.estado === 'reservada') {
              hab.estado = 'libre';
              hab.origenBooking = false;
              hab.codigoBooking = null;
              hab.huesped = null;
              hab.pagado = 0;
              hab.debito = 0;
            }
          });
        }
      });
      return;
    }

    r.habAsignada = asignarHabitacionInteligenteBooking(r.tipoHab, fechaRes, r.habAsignada, r.codigoBooking);

    fechasEstadia.forEach((fDia, idxNoche) => {
      const habsFecha = obtenerHabitacionesDia(fDia);
      const hab = habsFecha.find(x => x.id === Number(r.habAsignada));
      if (!hab) return;

      if (!r.recibido && (hab.estado === 'libre' || hab.codigoBooking === r.codigoBooking)) {
        hab.estado = 'reservada';
        hab.origenBooking = true;
        hab.codigoBooking = r.codigoBooking;
        hab.huesped = {
          nombre: r.huesped,
          cedula: r.documento || ('BOOKING-' + r.codigoBooking),
          procedencia: r.procedencia || 'Booking.com',
          telefono: r.telefono || '—',
          obs: `Reserva Booking #${r.codigoBooking} · ${r.tipoHab || hab.tipo} (Noche ${idxNoche + 1}/${fechasEstadia.length})`
        };
        hab.pagado = 0;
        hab.debito = Number(r.tarifa) || hab.tarifa;
        hab.numHuespedes = Number(r.numHuespedes) || hab.capacidad;
        hab.registradoPor = 'Booking Sync';
        hab.turnoRegistro = 'Pre-asignación Booking.com';
        hab.horaRegistro = hab.horaRegistro || formatHora(new Date());
      }
    });
  });

  guardarStorage('reservas_booking', reservasBooking);
  guardarStorage('registros_diarios', registrosDiarios);
  actualizarBadgeBookingHeader();
  renderCuadrados();
  renderReservasBooking();

  const confirmadasVigentes = reservasBooking.filter(r => !r.recibido && r.estadoBooking !== 'Cancelada' && esReservaVigente(r));

  if (notificarNuevas && nuevasLista.length > 0) {
    const nuevasVigentes = nuevasLista.filter(r => r.estadoBooking !== 'Cancelada' && esReservaVigente(r));
    if (nuevasVigentes.length > 0) {
      emitirSonidoNotificacionBooking();
      const primeraConf = nuevasVigentes[0];
      UIModal.aviso({
        titulo: nuevasVigentes.length === 1
          ? 'Nueva Reserva Recibida de Booking.com'
          : `${nuevasVigentes.length} Nuevas Reservas Vigentes Sincronizadas`,
        subtitulo: 'Sincronización Automática · Hotel Norte (ID: 2862226)',
        mensaje: nuevasVigentes.length === 1
          ? `Se ha pre-asignado tentativamente la Habitación #${String(primeraConf.habAsignada).padStart(2, '0')} a ${primeraConf.huesped} (Llegada: ${primeraConf.fechaIngreso}). Puede reasignarla en cualquier momento antes del check-in.`
          : `Se sincronizaron ${nuevasVigentes.length} reservas vigentes en segundo plano y se pre-asignaron en el Rack.`,
        tipo: 'exito',
        detalles: [
          { etiqueta: 'Próxima Llegada', valor: `${primeraConf.huesped} (${primeraConf.fechaIngreso || hoyStr})` },
          { etiqueta: 'Habitación Pre-Asignada', valor: 'Hab #' + String(primeraConf.habAsignada).padStart(2, '0') },
          { etiqueta: 'Total Vigentes Activas', valor: String(confirmadasVigentes.length) + ' reserva(s)' }
        ]
      });
    }
  }
}

function cambiarHabitacionReservaBooking(codigoBooking, nuevaHabId) {
  const r = reservasBooking.find(x => String(x.codigoBooking) === String(codigoBooking));
  if (!r) return;
  const nuevoId = Number(nuevaHabId);
  if (!esHabitacionValidaHotelNorte(nuevoId)) return;

  const anteriorHabId = r.habAsignada;
  const fechasEstadia = obtenerFechasEstadiaReserva(r.fechaIngreso || fechaSeleccionada, r.noches || 1);

  fechasEstadia.forEach(fDia => {
    const habsFecha = obtenerHabitacionesDia(fDia);
    const habAnterior = habsFecha.find(x => x.id === Number(anteriorHabId));
    if (habAnterior && habAnterior.codigoBooking === r.codigoBooking && habAnterior.estado === 'reservada') {
      habAnterior.estado = 'libre';
      habAnterior.origenBooking = false;
      habAnterior.codigoBooking = null;
      habAnterior.huesped = null;
      habAnterior.pagado = 0;
      habAnterior.debito = 0;
    }
  });

  r.habAsignada = nuevoId;
  sincronizarReservasEnRack(false, []);

  fetch(BOOKING_BRIDGE_URL + '/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigoBooking: r.codigoBooking, habAsignada: nuevoId })
  }).catch(() => {});

  const infoHab = DISTRIBUCION_HOTEL_NORTE.find(d => d.id === nuevoId);
  UIModal.aviso({
    titulo: 'Pre-asignación Actualizada',
    subtitulo: `Reserva Booking #${r.codigoBooking} · ${r.huesped}`,
    mensaje: `Se asignó tentativamente a la Habitación #${infoHab ? infoHab.numero : nuevoId} (${infoHab ? infoHab.tipo : ''}). Recuerde que la asignación es tentativa y puede modificarse antes de realizar el Check-in.`,
    tipo: 'exito'
  });
}

function renderReservasBooking() {
  actualizarBadgeBookingHeader();
  const cont = document.getElementById('booking-lista-reservas');
  const sumEl = document.getElementById('booking-count-summary');
  if (!cont) return;

  const vigentesList = reservasBooking.filter(r => r.estadoBooking !== 'Cancelada' && esReservaVigente(r));
  const canceladasList = reservasBooking.filter(r => r.estadoBooking === 'Cancelada');
  const pasadasList = reservasBooking.filter(r => r.estadoBooking !== 'Cancelada' && !esReservaVigente(r));
  const todasList = reservasBooking;

  const elCountVig = document.getElementById('count-bk-vigentes');
  const elCountCanc = document.getElementById('count-bk-canceladas');
  const elCountPas = document.getElementById('count-bk-pasadas');
  const elCountTodas = document.getElementById('count-bk-todas');
  if (elCountVig) elCountVig.innerText = vigentesList.length;
  if (elCountCanc) elCountCanc.innerText = canceladasList.length;
  if (elCountPas) elCountPas.innerText = pasadasList.length;
  if (elCountTodas) elCountTodas.innerText = todasList.length;

  const pendientesCheckinCount = vigentesList.filter(r => !r.recibido).length;
  if (sumEl) {
    sumEl.innerHTML = `<span class="text-indigo-200">Próximas Llegadas Pendientes:</span> <strong class="text-white font-mono">${pendientesCheckinCount}</strong> · <span class="text-slate-300">Vigentes:</span> ${vigentesList.length}`;
  }

  let listaBase = vigentesList;
  if (filtroBandejaBooking === 'canceladas') listaBase = canceladasList;
  else if (filtroBandejaBooking === 'pasadas') listaBase = pasadasList;
  else if (filtroBandejaBooking === 'todas') listaBase = todasList;

  let listaMostrar = listaBase;
  if (busquedaBandejaBookingTexto) {
    listaMostrar = listaBase.filter(r => {
      const nom = (r.huesped || '').toLowerCase();
      const cod = String(r.codigoBooking || '').toLowerCase();
      const hab = String(r.habAsignada || '');
      const tipo = (r.tipoHab || '').toLowerCase();
      return nom.includes(busquedaBandejaBookingTexto) ||
             cod.includes(busquedaBandejaBookingTexto) ||
             hab === busquedaBandejaBookingTexto ||
             tipo.includes(busquedaBandejaBookingTexto);
    });
  }

  if (listaMostrar.length === 0) {
    let msgVacio = 'No hay reservas vigentes por recibir.';
    if (busquedaBandejaBookingTexto) {
      msgVacio = `No se encontraron reservas con "${busquedaBandejaBookingTexto}".`;
    } else if (filtroBandejaBooking === 'canceladas') {
      msgVacio = 'No hay reservas canceladas.';
    } else if (filtroBandejaBooking === 'pasadas') {
      msgVacio = 'No hay reservas en el histórico de fechas pasadas.';
    }
    cont.innerHTML = `
      <div class="text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
        <p class="text-slate-600 font-medium text-xs">${msgVacio}</p>
        <p class="text-slate-400 text-[11px] mt-1">Las reservas se sincronizan automáticamente en segundo plano.</p>
      </div>`;
    return;
  }

  cont.innerHTML = listaMostrar.map((r) => {
    const habInfo = DISTRIBUCION_HOTEL_NORTE.find(d => d.id === Number(r.habAsignada)) || DISTRIBUCION_HOTEL_NORTE[0];
    const esCancelada = r.estadoBooking === 'Cancelada';
    const esVigente = esReservaVigente(r);
    const esPasada = !esCancelada && !esVigente;
    const fechaIng = r.fechaIngreso || FECHA_HOY;
    const fechaSal = r.fechaSalida || '';

    const opcionesHab = DISTRIBUCION_HOTEL_NORTE.map(d =>
      `<option value="${d.id}" ${d.id === Number(r.habAsignada) ? 'selected' : ''}>Hab #${d.numero} (${d.pisoCorto} · ${d.tipo} ${d.capacidad}p)</option>`
    ).join('');

    let badgeEstadoHTML = '';
    if (esCancelada) {
      badgeEstadoHTML = `<span class="bg-red-950 text-red-300 border border-red-700 text-[10px] px-2 py-0.5 rounded font-semibold">Cancelada en Booking</span>`;
    } else if (esPasada) {
      badgeEstadoHTML = `<span class="bg-slate-200 text-slate-700 border border-slate-300 text-[10px] px-2 py-0.5 rounded font-semibold">Estadía Pasada (${fechaIng})</span>`;
    } else if (r.recibido) {
      badgeEstadoHTML = `<span class="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] px-2 py-0.5 rounded font-semibold">Check-in Realizado</span>`;
    } else {
      badgeEstadoHTML = `<span class="bg-indigo-950 text-indigo-300 border border-indigo-700 text-[10px] px-2 py-0.5 rounded font-semibold">Confirmada Vigente · Llegada: ${fechaIng}</span>`;
    }

    return `
      <div class="bg-white border ${esPasada ? 'border-slate-200 opacity-80' : 'border-slate-300'} rounded-lg p-3.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-2xs">
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="bg-sky-950 text-sky-300 border border-sky-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
              BOOKING #${r.codigoBooking}
            </span>
            <span class="font-bold text-slate-900 text-xs">${r.huesped}</span>
            ${badgeEstadoHTML}
          </div>
          <div class="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Estancia: <strong class="text-slate-900 font-mono">${fechaIng}${fechaSal ? ' → ' + fechaSal : ''}</strong> (${r.noches || 1} noche${(r.noches || 1) > 1 ? 's' : ''})</span>
            <span>·</span>
            <span>Categoría: <strong class="text-slate-800">${r.tipoHab || habInfo.tipo}</strong> (${r.numHuespedes || habInfo.capacidad} pers.)</span>
            <span>·</span>
            <span>Tarifa: <strong class="text-emerald-700 font-mono font-bold">$${Number(r.tarifa).toFixed(2)}</strong></span>
            ${r.telefono ? `<span>·</span><span>Tel: <strong class="text-slate-700 font-mono">${r.telefono}</strong></span>` : ''}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
          ${!esCancelada && !esPasada ? `
            <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
              <span class="text-[10px] font-bold text-slate-600 uppercase" title="Pre-asignación tentativa. Se puede reasignar en cualquier momento.">Pre-asignar:</span>
              <select onchange="cambiarHabitacionReservaBooking('${r.codigoBooking}', this.value)" ${r.recibido ? 'disabled' : ''}
                class="rounded px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600">
                ${opcionesHab}
              </select>
            </div>
            <button onclick="irAFechaReservaBooking('${fechaIng}', ${Number(r.habAsignada)})"
              class="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition shrink-0"
              title="Ir a la fecha ${fechaIng} en el Rack para ver la habitación pre-asignada">
              Ver en Rack (${fechaIng})
            </button>
          ` : !esCancelada && esPasada ? `
            <span class="text-[11px] text-slate-500 font-mono px-2">Hab #${String(r.habAsignada || '—').padStart(2, '0')}</span>
            <button onclick="irAFechaReservaBooking('${fechaIng}', ${Number(r.habAsignada)})"
              class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-2 py-1 rounded text-[11px] transition shrink-0">
              Ver Fecha (${fechaIng})
            </button>
          ` : ''}

          ${!r.recibido && !esCancelada && !esPasada ? `
            <button onclick="recibirHuespedBooking('${r.codigoBooking}')"
              class="bg-sky-800 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shrink-0 flex items-center gap-1.5 shadow-2xs">
              <svg class="w-3.5 h-3.5 text-sky-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
              Recibir Huésped (Check-in)
            </button>
          ` : !esCancelada && r.recibido ? `
            <span class="text-[11px] text-emerald-700 font-semibold font-mono bg-emerald-50 border border-emerald-300 rounded px-2 py-1">
              Check-in OK · Hab #${String(r.habAsignada).padStart(2, '0')}
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function procesarTextoPegadoBooking() {
  const txtEl = document.getElementById('txt-pegado-booking');
  const raw = (txtEl?.value || '').trim();
  if (!raw) {
    UIModal.aviso({
      titulo: 'Texto Vacío',
      mensaje: 'Copie las filas de la tabla de Reservas en Booking.com y péguelas en el recuadro.',
      tipo: 'alerta'
    });
    return;
  }

  const lineas = raw.split(/\r?\n/).filter(l => l.trim().length > 4);
  const extraidas = [];

  lineas.forEach((linea) => {
    const mCod = linea.match(/\b(\d{8,12})\b/);
    const mPrecio = linea.match(/(?:US\$|USD|\$)\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
    const mTipoHab = linea.match(/((?:Individual|Doble|Triple|Cuádruple|Familiar)[^\t\n\r]*?(?:Hab\.?\s*#\s*[\d,\s]+)?)/i);

    if (mCod || mPrecio || mTipoHab) {
      const cod = mCod ? mCod[1] : String(Math.floor(4500000000 + Math.random() * 499999999));
      const tarifa = mPrecio ? parseFloat(mPrecio[1].replace(',', '.')) : 24.00;
      const tipoHab = mTipoHab ? mTipoHab[1].trim() : 'Doble Estándar Matrimonial - Hab # 8, 10, 12, 17, 18';

      let limpioNombre = linea
        .replace(cod, '')
        .replace(/US\$\s*[0-9.,]+/gi, '')
        .replace(tipoHab, '')
        .replace(/\b\d{1,2}\s+[a-záéíóú]{3,10}\.?\s+20\d{2}\b/gi, '')
        .replace(/\b(Confirmada|OK|Cancelada|Genius|\d+\s*adultos?|\d+\s*noches?)\b/gi, '')
        .replace(/[\t|;]+/g, ' ')
        .trim();

      if (!limpioNombre || limpioNombre.length < 3) {
        limpioNombre = 'Huésped Booking #' + cod;
      } else {
        limpioNombre = limpioNombre.split(/\s{2,}/)[0].trim();
      }

      extraidas.push({
        codigoBooking: cod,
        huesped: limpioNombre,
        tipoHab,
        tarifa,
        fechaIngreso: fechaSeleccionada,
        noches: 1,
        estadoBooking: /cancelada|cancelled/i.test(linea) ? 'Cancelada' : 'Confirmada',
        estadoPagoBooking: 'Copiado de Extranet Booking'
      });
    }
  });

  if (extraidas.length === 0) {
    UIModal.aviso({
      titulo: 'Formato No Reconocido',
      mensaje: 'No se detectaron códigos de reserva o tarifas en el texto pegado. Asegúrese de copiar las filas de la pestaña Reservas de Booking.',
      tipo: 'alerta'
    });
    return;
  }

  txtEl.value = '';
  document.getElementById('box-pegado-rapido-booking')?.classList.add('hidden');
  integrarReservasEntrantesBooking(extraidas, true);

  fetch(BOOKING_BRIDGE_URL + '/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hotelId: '2862226', reservas: extraidas })
  }).catch(() => {});
}

function importarArchivoBooking(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result || '';
    const extraidas = [];

    if (text.includes('BEGIN:VEVENT')) {
      const events = text.split('BEGIN:VEVENT').slice(1);
      events.forEach((ev, i) => {
        const sumMatch = ev.match(/SUMMARY:(.*)/);
        const uidMatch = ev.match(/UID:(.*)/);
        const nombre = sumMatch ? sumMatch[1].replace(/CLOSED - /i, '').trim() : ('Reserva Booking iCal #' + (i + 1));
        extraidas.push({
          codigoBooking: uidMatch ? uidMatch[1].slice(0, 10).toUpperCase() : String(Math.floor(4000000000 + Math.random() * 900000000)),
          huesped: nombre,
          procedencia: 'Booking.com (iCal)',
          tipoHab: 'Doble Estándar Matrimonial - Hab # 8, 10, 12, 17, 18',
          tarifa: 24.00,
          fechaIngreso: fechaSeleccionada,
          noches: 1,
          estadoPagoBooking: 'Sincronizado vía iCal (.ics)'
        });
      });
    } else {
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length > 1) {
        lines.slice(1).forEach((line) => {
          const cols = line.split(/[,;\t]/);
          if (cols.length >= 2) {
            const cod = (cols[0] || '').replace(/["']/g, '').trim() || String(Math.floor(4000000000 + Math.random() * 900000000));
            const huesped = (cols[1] || 'Huésped Booking').replace(/["']/g, '').trim();
            const tipoHab = (cols[2] || 'Doble Estándar Matrimonial').replace(/["']/g, '').trim();
            const tarifa = parseFloat((cols[3] || '').replace(/[^0-9.]/g, '')) || 24.00;
            extraidas.push({
              codigoBooking: cod,
              huesped,
              procedencia: 'Booking.com (Reporte Extranet)',
              tipoHab,
              tarifa,
              fechaIngreso: fechaSeleccionada,
              noches: 1,
              estadoPagoBooking: 'Importado de Extranet'
            });
          }
        });
      }
    }

    if (extraidas.length > 0) {
      integrarReservasEntrantesBooking(extraidas, true);
      fetch(BOOKING_BRIDGE_URL + '/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: '2862226', reservas: extraidas })
      }).catch(() => {});
    }
  };
  reader.readAsText(file);
}

function registrarReservaManualBooking() {
  const cod = document.getElementById('bk-cod')?.value.trim() || String(Math.floor(4000000000 + Math.random() * 900000000));
  const habNum = parseInt(document.getElementById('bk-hab')?.value, 10) || 18;
  const nombre = document.getElementById('bk-nombre')?.value.trim();
  const tarifa = parseFloat(document.getElementById('bk-tarifa')?.value) || 24.00;
  const fechaIng = document.getElementById('bk-fecha-ingreso')?.value || fechaSeleccionada;
  const noches = parseInt(document.getElementById('bk-noches')?.value, 10) || 1;

  if (!nombre) {
    UIModal.aviso({
      titulo: 'Titular Requerido',
      mensaje: 'Ingrese el nombre del huésped titular de la reserva de Booking.com.',
      tipo: 'alerta'
    });
    return;
  }

  const distHab = DISTRIBUCION_HOTEL_NORTE.find(d => d.id === habNum) || DISTRIBUCION_HOTEL_NORTE[0];
  const nueva = {
    codigoBooking: cod,
    huesped: nombre,
    documento: '',
    procedencia: 'Booking.com Extranet',
    telefono: '',
    correo: '',
    habAsignada: distHab.id,
    tipoHab: `${distHab.tipo} (${distHab.descripcionCamas})`,
    tarifa: tarifa,
    fechaIngreso: fechaIng,
    noches: noches,
    numHuespedes: distHab.capacidad,
    estadoBooking: 'Confirmada',
    estadoPagoBooking: 'Reserva Confirmada Booking.com',
    requiereFactura: 'ninguna',
    recibido: false
  };

  integrarReservasEntrantesBooking([nueva], false);

  fetch(BOOKING_BRIDGE_URL + '/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hotelId: '2862226', reservas: [nueva] })
  }).catch(() => {});

  registrarAccion(
    'BOOKING.COM',
    `Reserva Booking #${cod} asignada a Hab #${distHab.numero} (${distHab.pisoCorto}) - ${nombre}`,
    distHab.numero
  );

  document.getElementById('bk-cod').value = '';
  document.getElementById('bk-nombre').value = '';
}

function recibirHuespedBooking(codigoBooking) {
  const r = reservasBooking.find(x => String(x.codigoBooking) === String(codigoBooking));
  if (!r) return;
  cerrarModalBooking();

  const fechaObj = r.fechaIngreso || fechaSeleccionada;
  if (fechaObj !== fechaSeleccionada) {
    seleccionarFechaDirecta(fechaObj);
  }

  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const hab = habs.find(h => h.id === Number(r.habAsignada)) || habs.find(h => h.estado === 'libre') || habs[0];
  habitacionSeleccionada = hab;
  hab.origenBooking = true;
  hab.codigoBooking = r.codigoBooking;

  abrirModalCheckin(hab, 'checkin');

  document.getElementById('cin-cedula').value = r.documento || '';
  document.getElementById('cin-nombre').value = r.huesped || '';
  document.getElementById('cin-procedencia').value = r.procedencia || 'Booking.com';
  document.getElementById('cin-telefono').value = r.telefono || '';
  document.getElementById('cin-obs').value = 'Reserva Booking.com #' + r.codigoBooking + ' (' + (r.tipoHab || hab.tipo) + ')';
  document.getElementById('cin-total').value = Number(r.tarifa || hab.tarifa).toFixed(2);
  document.getElementById('cin-pagado').value = Number(r.tarifa || hab.tarifa).toFixed(2);
  if (document.getElementById('cin-num-huespedes')) {
    document.getElementById('cin-num-huespedes').value = String(r.numHuespedes || hab.capacidad || 1);
  }
  calcularDebitoCin();

  if (r.requiereFactura === 'empresa') {
    seleccionarModoFacturaCin('empresa');
    document.getElementById('cin-ruc').value = r.rucEmpresa || '';
    document.getElementById('cin-razon').value = r.razonEmpresa || '';
    document.getElementById('cin-correo').value = r.correo || '';
  } else if (r.requiereFactura === 'usuario') {
    seleccionarModoFacturaCin('usuario');
    document.getElementById('cin-correo').value = r.correo || '';
  } else {
    seleccionarModoFacturaCin('ninguna');
  }
}

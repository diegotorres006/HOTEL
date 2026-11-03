/* ==========================================================================
   HOTEL NORTE — COMPONENTE DE VISTA RACK DE HABITACIONES
   Archivo: src/components/RoomRackView.js
   Soporte completo para Distribución Oficial: 35 Habitaciones en 4 Pisos
   ========================================================================== */

function filtrarPiso(pisoId) {
  filtroPisoActivo = pisoId;
  const botonesPiso = ['todos', 'pb', 'piso1', 'piso2', 'piso3'];
  botonesPiso.forEach(id => {
    const btn = document.getElementById('fp-' + id);
    if (!btn) return;
    btn.className = (id === pisoId)
      ? 'px-2.5 py-1 rounded-md bg-slate-900 text-white font-semibold text-xs transition shadow-2xs'
      : 'px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium text-xs transition';
  });
  renderCuadrados();
}

function filtrarTipo(tipoId) {
  filtroTipoActivo = tipoId;
  const botonesTipo = ['todos', 'individual', 'matrimonial', 'doble', 'triple', 'cuadruple', 'quintuple'];
  botonesTipo.forEach(id => {
    const btn = document.getElementById('ft-' + id);
    if (!btn) return;
    btn.className = (id === tipoId)
      ? 'px-2.5 py-1 rounded-md bg-blue-900 text-white font-semibold text-xs transition shadow-2xs'
      : 'px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-medium text-xs transition';
  });
  renderCuadrados();
}

function renderCuadrados() {
  if (modoVistaActual === 'hoja') {
    if (typeof renderTablaHojaRegistro === 'function') renderTablaHojaRegistro();
  }
  const habs = obtenerHabitacionesDia(fechaSeleccionada);
  const grid = document.getElementById('grid-habitaciones');
  if (!grid) return;
  grid.innerHTML = '';

  let libres = 0, ocupadas = 0, reservadas = 0, debito = 0, pendientes = 0, totalPag = 0, totalDeb = 0;
  const esHoy = fechaSeleccionada === FECHA_HOY;
  const esFuturo = fechaSeleccionada > FECHA_HOY;
  const esPasado = fechaSeleccionada < FECHA_HOY;
  const post12 = esPost12PM();

  habs.forEach(hab => {
    const pendiente12 = esHoy && hab.estado === 'ocupada' && hab.venceHoy && post12;
    if (hab.estado === 'libre' || hab.estado === 'sucia') libres++;
    else if (hab.estado === 'reservada') reservadas++;
    else if (hab.estado === 'ocupada') {
      ocupadas++;
      if (pendiente12) pendientes++;
    }
    if (Number(hab.debito || 0) > 0.05) {
      debito++;
    }

    if (Array.isArray(hab.estanciasPasadas)) {
      hab.estanciasPasadas.forEach(est => {
        totalPag += Number(est.pagado || 0);
        totalDeb += Number(est.debito || 0);
        if (Number(est.debito || 0) > 0.05) debito++;
      });
    }

    totalPag += (hab.pagado || 0);
    totalDeb += (hab.debito || 0);
  });

  let ultimoPisoRenderizado = null;
  let totalRenderizadas = 0;

  habs.forEach(hab => {
    if (filtroPisoActivo !== 'todos' && hab.pisoId !== filtroPisoActivo) return;
    if (filtroTipoActivo !== 'todos' && hab.categoriaFiltro !== filtroTipoActivo) return;

    const pendiente12 = esHoy && hab.estado === 'ocupada' && hab.venceHoy && post12;
    if (filtroActivo === 'libres' && hab.estado !== 'libre' && hab.estado !== 'sucia') return;
    if (filtroActivo === 'ocupadas' && hab.estado !== 'ocupada') return;
    if (filtroActivo === 'reservadas' && hab.estado !== 'reservada') return;
    if (filtroActivo === 'debito' && !(Number(hab.debito || 0) > 0.05)) return;
    if (filtroActivo === 'pendientes' && !pendiente12) return;

    totalRenderizadas++;

    let matchB1 = false;
    if (busquedaActivosTexto && hab.huesped) {
      matchB1 =
        hab.huesped.nombre.toLowerCase().includes(busquedaActivosTexto) ||
        hab.huesped.cedula.includes(busquedaActivosTexto) ||
        hab.numero.includes(busquedaActivosTexto);
    }

    if (filtroPisoActivo === 'todos' && hab.pisoId !== ultimoPisoRenderizado) {
      ultimoPisoRenderizado = hab.pisoId;
      const pisoInfo = PISOS_HOTEL_NORTE.find(p => p.id === hab.pisoId);
      const headerPiso = document.createElement('div');
      headerPiso.className = 'col-span-full mt-4 first:mt-0 mb-1 flex items-center justify-between border-b-2 border-slate-300 pb-1.5 text-slate-800';
      headerPiso.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-blue-700"></span>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-900">${hab.piso}</span>
          <span class="text-[11px] text-slate-500 font-medium">(${pisoInfo ? pisoInfo.cantidadHabitaciones : ''} Habitaciones · Capacidad: ${pisoInfo ? pisoInfo.capacidadTotal : ''} Huéspedes)</span>
        </div>
        <span class="text-[11px] text-slate-600 font-semibold font-mono">Hotel Norte</span>
      `;
      grid.appendChild(headerPiso);
    }

    let stateClass = 'room-libre', badge = '';
    if (matchB1) {
      stateClass = 'ring-2 ring-blue-500 bg-blue-950/90 border-l-4 border-l-blue-400';
      badge = '<span class="bg-blue-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Localizado</span>';
    } else if (pendiente12) {
      stateClass = 'room-pendiente';
      badge = '<span class="bg-amber-950/90 text-amber-300 border border-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded">12:00 PM</span>';
    } else if (hab.estado === 'reservada') {
      stateClass = 'room-reservada';
      badge = hab.origenBooking
        ? '<span class="bg-purple-950 text-purple-200 border border-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide shadow-xs">PRE-ASIGNADA BOOKING</span>'
        : '<span class="bg-indigo-950 text-indigo-200 border border-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide shadow-xs">RESERVA PENDIENTE</span>';
    } else if (hab.estado === 'ocupada') {
      stateClass = esPasado ? 'room-pasado' : 'room-ocupada';
      badge = esPasado
        ? '<span class="bg-slate-800 text-slate-300 text-[9px] font-semibold px-1.5 py-0.5 rounded">Cerrado</span>'
        : (hab.origenBooking
            ? '<span class="bg-blue-600 text-white border border-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">OCUPADA (CHECK-IN)</span>'
            : '<span class="bg-blue-600 text-white border border-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">OCUPADA (CHECK-IN)</span>');
    } else if (hab.estado === 'sucia') {
      hab.estado = 'libre';
      stateClass = esPasado ? 'room-pasado' : 'room-libre';
      badge = esPasado
        ? '<span class="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded">Sin uso</span>'
        : (esFuturo
            ? '<span class="bg-sky-950/80 text-sky-300 border border-sky-800/80 text-[9px] font-semibold px-1.5 py-0.5 rounded">+ Reservar</span>'
            : '<span class="bg-sky-950/80 text-sky-300 border border-sky-800/80 text-[9px] font-semibold px-1.5 py-0.5 rounded">Disponible</span>');
    } else {
      const cantEst = (hab.estanciasPasadas || []).length;
      stateClass = esPasado ? 'room-pasado' : 'room-libre';
      badge = esPasado
        ? '<span class="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded">Sin uso</span>'
        : (cantEst > 0
            ? `<span class="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">${cantEst}x hoy · Libre</span>`
            : (esFuturo
                ? '<span class="bg-sky-950/80 text-sky-300 border border-sky-800/80 text-[9px] font-semibold px-1.5 py-0.5 rounded">+ Reservar</span>'
                : '<span class="bg-sky-950/80 text-sky-300 border border-sky-800/80 text-[9px] font-semibold px-1.5 py-0.5 rounded">Disponible</span>'));
    }

    const tieneSaldoPendiente = Number(hab.debito || 0) > 0.05;
    const card = document.createElement('div');
    card.className = 'room-card p-3 cursor-pointer flex flex-col justify-between min-h-[110px] ' + stateClass + (tieneSaldoPendiente ? ' ring-1 ring-amber-500/80 border-amber-500/70 shadow-amber-950/30' : '');
    card.onclick = () => clickCuadrado(hab.id);

    const horaEnt = hab.horaEntrada || hab.horaRegistro || '';
    let medio = '';

    if (hab.estado === 'reservada') {
      medio = `
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span class="font-bold text-purple-300 truncate">${hab.tipo}</span>
          <span class="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1 py-0.2 rounded font-semibold font-mono">${hab.capacidad} pers</span>
        </div>
        <div class="text-[10px] text-slate-400 font-medium truncate mt-0.5" title="${hab.descripcionCamas}">${hab.descripcionCamas}</div>
        <div class="text-xs font-bold text-white truncate mt-1">
          <span class="text-purple-300 text-[10px] font-semibold">Reserva:</span> ${hab.huesped ? hab.huesped.nombre : 'Huésped Booking'}
        </div>
        <div class="text-[10px] text-amber-300 font-medium truncate mt-0.5 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Pendiente de Check-in
        </div>
      `;
    } else if (hab.huesped) {
      medio = `
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span class="font-bold text-blue-300 truncate">${hab.tipo}</span>
          <span class="text-[9px] bg-blue-950 text-blue-300 border border-blue-800 px-1 py-0.2 rounded font-semibold font-mono">${hab.capacidad} pers</span>
        </div>
        <div class="text-[10px] text-slate-400 font-medium truncate mt-0.5" title="${hab.descripcionCamas}">${hab.descripcionCamas}</div>
        <div class="text-xs font-bold text-white truncate mt-1">${hab.huesped.nombre}</div>
        ${horaEnt ? '<div class="text-[10px] text-slate-300 font-mono truncate mt-0.5">Ent: ' + horaEnt + (hab.registradoPor ? ' · Op: ' + hab.registradoPor : '') + '</div>' : ''}
      `;
    } else {
      const cantEst = (hab.estanciasPasadas || []).length;
      const ultEst = cantEst > 0 ? hab.estanciasPasadas[cantEst - 1] : null;
      medio = `
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span class="font-bold text-slate-200 truncate">${hab.tipo}</span>
          <span class="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-semibold font-mono">${hab.capacidad} pers</span>
        </div>
        <div class="text-[10px] text-slate-400 font-medium truncate mt-0.5" title="${hab.descripcionCamas}">${hab.descripcionCamas}</div>
        <div class="text-xs font-bold text-slate-200 font-mono mt-1">$${hab.tarifa}.00 / noche</div>
        ${ultEst ? '<div class="text-[9.5px] text-emerald-400 font-mono truncate mt-0.5">Desocupada ' + ultEst.horaSalida + ' · Lista</div>' : (hab.registroSalidaPrevio ? '<div class="text-[9px] text-slate-400 font-mono truncate mt-0.5">Sal: ' + hab.registroSalidaPrevio.horaSalida + '</div>' : '')}
      `;
    }

    const recHabHoy = (hab.estanciasPasadas || []).reduce((acc, e) => acc + Number(e.pagado || 0), 0) + Number(hab.pagado || 0);

    const pie = hab.estado === 'reservada'
      ? `<span class="text-purple-300 font-medium text-[10px]">Sin Check-in (Pre-asignada)</span>
         <span class="text-emerald-400 font-mono font-bold">$${hab.tarifa}.00</span>`
      : `<span class="text-slate-400 font-medium text-[10px]">${hab.camas} ${hab.camas === 1 ? 'cama' : 'camas'} (${hab.capacidad}p)</span>
         ${hab.debito > 0 ? '<span class="text-amber-400 bg-amber-950/80 border border-amber-700 px-1.5 py-0.5 rounded font-bold font-mono text-[10px]">Debe $' + hab.debito + '</span>' : (recHabHoy > 0 ? '<span class="text-emerald-400 font-mono font-bold text-[10px]">Hoy: $' + recHabHoy.toFixed(2) + '</span>' : (hab.facturaEmitida ? '<span class="text-sky-300 font-mono text-[9px] font-bold">FAC</span>' : ''))}`;

    card.innerHTML = `
      <div class="flex items-center justify-between pb-1 border-b border-slate-200/60">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-xs font-mono text-slate-900">#${hab.numero}</span>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">${hab.pisoCorto}</span>
        </div>
        ${badge}
      </div>
      <div class="my-1.5">${medio}</div>
      <div class="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/80">${pie}</div>
    `;
    grid.appendChild(card);
  });

  if (totalRenderizadas === 0) {
    const emptyBox = document.createElement('div');
    emptyBox.className = 'col-span-full py-10 text-center bg-slate-100/80 border border-slate-300 rounded-xl text-slate-600 text-xs';
    emptyBox.innerHTML = 'No existen habitaciones que coincidan con la combinación de filtros seleccionada (Estado / Piso / Tipo de Habitación).';
    grid.appendChild(emptyBox);
  }

  const setElText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setElText('count-todas', habs.length);
  setElText('count-libres', libres);
  setElText('count-ocupadas', ocupadas);
  setElText('count-reservadas', reservadas);
  setElText('count-debito', debito);
  setElText('count-pendientes', pendientes);

  if (sesionActiva) {
    setElText('top-pagado', '$' + (sesionActiva.totalPagado || 0).toFixed(2));
    setElText('top-debito', '$' + (sesionActiva.totalDebito || 0).toFixed(2));
  } else {
    setElText('top-pagado', '$' + totalPag.toFixed(2));
    setElText('top-debito', '$' + totalDeb.toFixed(2));
  }
}

function cambiarModoVista(modo) {
  modoVistaActual = modo;
  const btnRack = document.getElementById('btn-vista-rack');
  const btnHoja = document.getElementById('btn-vista-hoja');
  const btnBar = document.getElementById('btn-vista-bar');
  const gridHab = document.getElementById('grid-habitaciones');
  const tablaHoja = document.getElementById('contenedor-tabla-registro');
  const vistaBar = document.getElementById('contenedor-vista-bar');
  const leyenda = document.getElementById('leyenda-plano');

  const estiloInactivo = 'px-3 py-1 rounded-md text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition';
  const estiloActivo = 'px-3 py-1 rounded-md bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs transition';

  if (btnRack) btnRack.className = (modo === 'rack') ? estiloActivo : estiloInactivo;
  if (btnHoja) btnHoja.className = (modo === 'hoja') ? estiloActivo : estiloInactivo;
  if (btnBar) btnBar.className = (modo === 'bar') ? estiloActivo : estiloInactivo;

  if (gridHab) gridHab.classList.toggle('hidden', modo !== 'rack');
  if (tablaHoja) tablaHoja.classList.toggle('hidden', modo !== 'hoja');
  if (vistaBar) vistaBar.classList.toggle('hidden', modo !== 'bar');
  if (leyenda) leyenda.classList.toggle('hidden', modo !== 'rack');

  if (modo === 'hoja') {
    if (typeof renderTablaHojaRegistro === 'function') renderTablaHojaRegistro();
  } else if (modo === 'bar') {
    if (typeof renderVistaBar === 'function') renderVistaBar();
  }
}

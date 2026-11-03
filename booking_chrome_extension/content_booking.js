/* ==========================================================================
   HOTEL NORTE — EXTRACTOR AUTÓNOMO PARA BOOKING.COM EXTRANET (ID: 2862226)
   Archivo: booking_chrome_extension/content_booking.js
   Versión 2.0: Aplica automáticamente el rango de 65 días sin tocar fechas
   ni botones y sincroniza en segundo plano al instante.
   ========================================================================== */

(function () {
  const HOTEL_NORTE_ID = '2862226';
  const BRIDGE_API = 'http://127.0.0.1:3847/api/booking/sync';

  const MESES_ES = {
    ene: '01', enero: '01', jan: '01',
    feb: '02', febrero: '02',
    mar: '03', marzo: '03',
    abr: '04', abril: '04', apr: '04',
    may: '05', mayo: '05',
    jun: '06', junio: '06',
    jul: '07', julio: '07',
    ago: '08', agosto: '08', aug: '08',
    sep: '09', sept: '09', septiembre: '09', set: '09',
    oct: '10', octubre: '10',
    nov: '11', noviembre: '11',
    dic: '12', diciembre: '12', dec: '12'
  };

  function obtenerRangoFechasAmplio() {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 5);
    const hasta = new Date(hoy);
    hasta.setDate(hoy.getDate() + 65);
    return {
      dateFrom: desde.toISOString().slice(0, 10),
      dateTo: hasta.toISOString().slice(0, 10)
    };
  }

  function detectarSesTokenEnPagina() {
    const mUrl = window.location.search.match(/[?&]ses=([^&#]+)/);
    if (mUrl && mUrl[1]) return mUrl[1];

    const links = document.querySelectorAll('a[href*="ses="]');
    for (const a of links) {
      const m = a.href.match(/[?&]ses=([^&#]+)/);
      if (m && m[1]) return m[1];
    }
    return '';
  }

  function guardarSesEnExtension() {
    const ses = detectarSesTokenEnPagina();
    if (ses && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'GUARDAR_SES_BOOKING', ses }).catch(() => {});
    }
    return ses;
  }

  function verificarYRedirigirRango65DiasAutomatico() {
    const ses = guardarSesEnExtension();
    const params = new URLSearchParams(window.location.search);
    const esAutoSync = params.get('hn_autosync') === '1';
    const enSearchRes = window.location.pathname.includes('search_reservations');
    const { dateFrom, dateTo } = obtenerRangoFechasAmplio();

    // 1. Si es una pestaña abierta en 2° plano por el PMS en home.html para capturar "ses", saltar directo a reservas 65 días
    if (esAutoSync && !enSearchRes && ses) {
      window.location.replace(
        `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/search_reservations.html?source=nav&upcoming_reservations=1&hotel_id=${HOTEL_NORTE_ID}&lang=es&ses=${ses}&date_from=${dateFrom}&date_to=${dateTo}&date_type=arrival&hn_autosync=1`
      );
      return true;
    }

    // 2. Si estamos en search_reservations.html pero Booking puso su filtro corto por defecto (1 día), ampliar a 65 días automáticamente
    if (enSearchRes) {
      const currentDateTo = params.get('date_to') || '';
      const hoyStr = new Date().toISOString().slice(0, 10);
      const manana = new Date();
      manana.setDate(manana.getDate() + 2);
      const mananaStr = manana.toISOString().slice(0, 10);

      const filtroEsCorto = !currentDateTo || currentDateTo <= mananaStr || params.get('date_from') === hoyStr;
      const ultimoRedirect = Number(sessionStorage.getItem('hn_auto_65d_ts') || 0);

      if (filtroEsCorto && (Date.now() - ultimoRedirect > 20000)) {
        sessionStorage.setItem('hn_auto_65d_ts', String(Date.now()));
        const sesParam = ses ? `&ses=${ses}` : '';
        const autoParam = esAutoSync ? '&hn_autosync=1' : '';
        window.location.replace(
          `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/search_reservations.html?source=nav&upcoming_reservations=1&hotel_id=${HOTEL_NORTE_ID}&lang=es${sesParam}&date_from=${dateFrom}&date_to=${dateTo}&date_type=arrival${autoParam}`
        );
        return true;
      }
    }

    return false;
  }

  function parsearFechaBooking(texto) {
    if (!texto) return null;
    const limpio = texto.toLowerCase().replace(/\./g, '').trim();

    const isoMatch = limpio.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const dmySlash = limpio.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
    if (dmySlash) {
      return `${dmySlash[3]}-${String(dmySlash[2]).padStart(2, '0')}-${String(dmySlash[1]).padStart(2, '0')}`;
    }

    const espMatch = limpio.match(/\b(\d{1,2})\s+(?:de\s+)?([a-z\u00e1\u00e9\u00ed\u00f3\u00fa]{3,10})\s+(?:de\s+)?(20\d{2})\b/);
    if (espMatch) {
      const dia = String(espMatch[1]).padStart(2, '0');
      const mesTxt = espMatch[2].slice(0, 3);
      const mes = MESES_ES[espMatch[2]] || MESES_ES[mesTxt];
      const anio = espMatch[3];
      if (mes) return `${anio}-${mes}-${dia}`;
    }

    return null;
  }

  function calcularNoches(fEntrada, fSalida) {
    if (!fEntrada || !fSalida) return 1;
    const d1 = new Date(fEntrada + 'T00:00:00');
    const d2 = new Date(fSalida + 'T00:00:00');
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }

  function extraerPrecioUSD(texto) {
    if (!texto) return 0;
    const m = texto.match(/(?:US\$|USD|\$)\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
    if (m) {
      return parseFloat(m[1].replace(',', '.')) || 0;
    }
    return 0;
  }

  function limpiarNombreHuesped(raw) {
    if (!raw) return '';
    return raw
      .split('\n')[0]
      .replace(/Genius/gi, '')
      .replace(/\b\d+\s*(adulto|adultos|ni\u00f1o|ni\u00f1os|persona|personas|hu\u00e9sped|hu\u00e9spedes).*/i, '')
      .replace(/Enviar mensaje|Ver detalles|M\u00e1s informaci\u00f3n|Pago online/gi, '')
      .trim();
  }

  function extraerReservasDeRaizDOM(rootDoc = document) {
    const reservasMap = new Map();

    const filas = rootDoc.querySelectorAll(
      'table tbody tr, tr[data-reservation-id], .bui-table__row, [data-testid*="reservation"], [class*="reservation-row"], tbody tr'
    );

    filas.forEach((tr) => {
      const textoFila = (tr.innerText || tr.textContent || '').trim();
      if (!textoFila || textoFila.length < 15) return;

      let codigoBooking = tr.getAttribute('data-reservation-id') || '';
      if (!codigoBooking) {
        const linkRes = tr.querySelector('a[href*="res_id="], a[href*="reservation_id="], a[href*="booking.html"]');
        if (linkRes && linkRes.href) {
          const mUrl = linkRes.href.match(/(?:res_id|reservation_id)=(\d{7,13})/);
          if (mUrl) codigoBooking = mUrl[1];
        }
      }
      if (!codigoBooking) {
        const mNum = textoFila.match(/\b(\d{9,11})\b/);
        if (mNum) codigoBooking = mNum[1];
      }
      if (!codigoBooking) return;

      const fechasEncontradas = [];
      const celdas = Array.from(tr.querySelectorAll('td, th'));
      celdas.forEach((td) => {
        const f = parsearFechaBooking(td.innerText || td.textContent);
        if (f && !fechasEncontradas.includes(f)) fechasEncontradas.push(f);
      });

      if (fechasEncontradas.length === 0) {
        const regexFechas = /\b(\d{1,2}\s+(?:de\s+)?[a-z\u00e1\u00e9\u00ed\u00f3\u00fa]{3,10}\.?\s+(?:de\s+)?20\d{2}|20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})\b/gi;
        let matchF;
        while ((matchF = regexFechas.exec(textoFila)) !== null) {
          const parsed = parsearFechaBooking(matchF[1]);
          if (parsed && !fechasEncontradas.includes(parsed)) fechasEncontradas.push(parsed);
        }
      }

      const fechaIngreso = fechasEncontradas[0] || new Date().toISOString().slice(0, 10);
      const fechaSalida = fechasEncontradas[1] || '';
      const noches = calcularNoches(fechaIngreso, fechaSalida);

      let huesped = '';
      const guestEl = tr.querySelector(
        '[data-testid*="guest"], .guest-name, td:first-child a, td:nth-child(1) strong, td:nth-child(2) a, a[href*="booking.html"]'
      );
      if (guestEl && isNaN(Number((guestEl.innerText || guestEl.textContent).trim()))) {
        huesped = limpiarNombreHuesped(guestEl.innerText || guestEl.textContent);
      }
      if (!huesped && celdas.length > 0) {
        for (const td of celdas) {
          const t = limpiarNombreHuesped(td.innerText || td.textContent);
          if (t && t.length > 3 && !/^\d+$/.test(t) && !parsearFechaBooking(t) && !/US\$|Confirmada|Cancelada|OK/i.test(t)) {
            huesped = t;
            break;
          }
        }
      }
      if (!huesped) huesped = 'Hu\u00e9sped Booking #' + codigoBooking;

      let tipoHab = 'Doble Est\u00e1ndar Matrimonial';
      const matchTipoHab = textoFila.match(
        /((?:Habitaci\u00f3n|Habitacion|Individual|Doble|Triple|Cu\u00e1druple|Cuadruple|Qu\u00edntuple|Familiar|Matrimonial)[^\n\r\t]*?(?:Hab\.?\s*#\s*[\d,\s]+)?)/i
      );
      if (matchTipoHab) {
        tipoHab = matchTipoHab[1].trim();
      }

      const tarifa = extraerPrecioUSD(textoFila) || 24.00;

      let numHuespedes = 2;
      const mAdultos = textoFila.match(/(\d+)\s*(?:adulto|adultos|persona|personas|hu\u00e9sped|hu\u00e9spedes)/i);
      if (mAdultos) numHuespedes = parseInt(mAdultos[1], 10) || 2;

      let estadoBooking = 'Confirmada';
      if (/cancelada|cancelled|canceled/i.test(textoFila)) {
        estadoBooking = 'Cancelada';
      } else if (/no presentado|no-show/i.test(textoFila)) {
        estadoBooking = 'No presentado';
      }

      reservasMap.set(codigoBooking, {
        codigoBooking,
        huesped,
        tipoHab,
        tarifa,
        fechaIngreso,
        fechaSalida,
        noches,
        numHuespedes,
        estadoBooking,
        estadoPagoBooking: 'Sincronizado desde Booking Extranet'
      });
    });

    return Array.from(reservasMap.values());
  }

  function extraerReservasDesdeDOMBooking() {
    const lista = extraerReservasDeRaizDOM(document);

    const urlParams = new URLSearchParams(window.location.search);
    const resIdDetalle = urlParams.get('res_id') || urlParams.get('reservation_id');
    if (resIdDetalle && !lista.some(r => r.codigoBooking === resIdDetalle)) {
      const bodyText = document.body.innerText || '';
      const tarifaDet = extraerPrecioUSD(bodyText) || 24.00;
      const telMatch = bodyText.match(/(?:\+593|09\d)[\d\s\-]{7,12}/);
      const h1Guest = document.querySelector('h1, [data-testid*="guest-name"], .guest-name');
      const nombreDet = h1Guest ? limpiarNombreHuesped(h1Guest.innerText) : ('Hu\u00e9sped Booking #' + resIdDetalle);

      const matchHabDet = bodyText.match(
        /((?:Habitaci\u00f3n|Habitacion|Individual|Doble|Triple|Cu\u00e1druple|Familiar)[^\n\r]*?(?:Hab\.?\s*#\s*[\d,\s]+)?)/i
      );

      lista.push({
        codigoBooking: resIdDetalle,
        huesped: nombreDet,
        telefono: telMatch ? telMatch[0].trim() : '',
        tipoHab: matchHabDet ? matchHabDet[1].trim() : 'Doble Est\u00e1ndar Matrimonial',
        tarifa: tarifaDet,
        fechaIngreso: new Date().toISOString().slice(0, 10),
        noches: 1,
        numHuespedes: 2,
        estadoBooking: /cancelada|cancelled/i.test(bodyText) ? 'Cancelada' : 'Confirmada',
        estadoPagoBooking: 'Detalle Booking Extranet'
      });
    }

    return lista;
  }

  function enviarReservasAlPMS(esClickManual = false) {
    guardarSesEnExtension();
    const reservas = extraerReservasDesdeDOMBooking();
    const confirmadas = reservas.filter(r => r.estadoBooking !== 'Cancelada');
    const canceladas = reservas.filter(r => r.estadoBooking === 'Cancelada');

    const statusEl = document.getElementById('hn-booking-ext-status');
    const countEl = document.getElementById('hn-booking-ext-count');
    const feedbackEl = document.getElementById('hn-booking-ext-feedback');
    const btnSync = document.getElementById('hn-btn-sync-now');

    if (countEl) {
      countEl.innerText = `${confirmadas.length} Confirmada(s) · ${reservas.length} Total`;
    }

    if (esClickManual && btnSync) {
      btnSync.innerText = 'Sincronizando...';
      btnSync.style.background = '#0284c7';
    }

    // Si aún no cargaron las filas de la tabla y no fue click manual, esperar al siguiente pulso del DOM
    if (reservas.length === 0 && !esClickManual) {
      return false;
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'BOOKING_RESERVAS_DETECTADAS',
          hotelId: HOTEL_NORTE_ID,
          urlExtranet: window.location.href,
          reservas
        },
        () => {}
      );
    }

    fetch(BRIDGE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        hotelId: HOTEL_NORTE_ID,
        urlExtranet: window.location.href,
        reservas
      })
    })
      .then((r) => r.json())
      .then(() => {
        const hora = new Date().toLocaleTimeString('es-EC', { hour12: false });
        if (statusEl) {
          statusEl.innerText = `Auto-Sync ${hora}`;
          statusEl.style.color = '#34d399';
        }
        if (esClickManual) {
          if (btnSync) {
            btnSync.innerText = '\u00a1Sincronizado con PMS! \u2713';
            btnSync.style.background = '#059669';
            setTimeout(() => {
              btnSync.innerText = 'Sincronizar Ahora';
              btnSync.style.background = '#1d4ed8';
            }, 3500);
          }
          if (feedbackEl) {
            feedbackEl.style.display = 'block';
            feedbackEl.innerHTML = `
              <div style="font-weight:700;color:#34d399;margin-bottom:3px;">\u2713 Enviadas al Sistema Hotel Norte (${hora})</div>
              <div style="color:#e2e8f0;margin-bottom:6px;">
                <strong>${confirmadas.length}</strong> reservas confirmadas activas y <strong>${canceladas.length}</strong> canceladas sincronizadas en el Rack.
              </div>
              <a href="http://localhost:3847" target="_blank" style="display:block;text-align:center;background:#0284c7;color:#fff;text-decoration:none;padding:5px 8px;border-radius:5px;font-weight:700;font-size:11px;">
                Abrir Sistema Hotel Norte PMS \u2192
              </a>
            `;
          }
        }
      })
      .catch(() => {});

    return reservas.length > 0;
  }

  function abrirTodasLasReservas60Dias() {
    const ses = detectarSesTokenEnPagina();
    const sesParam = ses ? `&ses=${ses}` : '';
    const { dateFrom, dateTo } = obtenerRangoFechasAmplio();
    window.location.href = `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/search_reservations.html?source=nav&upcoming_reservations=1&hotel_id=${HOTEL_NORTE_ID}&lang=es${sesParam}&date_from=${dateFrom}&date_to=${dateTo}&date_type=arrival`;
  }

  function inyectarWidgetControlHotelNorte() {
    if (document.getElementById('hn-booking-bridge-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'hn-booking-bridge-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 18px;
      right: 18px;
      z-index: 999999;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #1e3a8a;
      border-radius: 10px;
      padding: 12px 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
      width: 310px;
    `;

    widget.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1e293b;padding-bottom:8px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="background:#1d4ed8;color:#fff;font-weight:700;padding:3px 6px;border-radius:5px;font-size:11px;">HN</span>
          <div>
            <div style="font-weight:700;font-size:12px;color:#fff;">Hotel Norte - Auto Sync</div>
            <div style="font-size:10px;color:#94a3b8;">Booking ID #2862226 · 65 D\u00edas Auto</div>
          </div>
        </div>
        <span id="hn-booking-ext-status" style="font-size:10px;font-weight:600;color:#34d399;">100% Autom\u00e1tico</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-size:11px;color:#cbd5e1;">
        <span id="hn-booking-ext-count">Sincronizando autom\u00e1ticamente...</span>
        <span style="font-size:10px;color:#38bdf8;">Rango: 65 d\u00edas</span>
      </div>
      <div id="hn-booking-ext-feedback" style="display:none;background:#064e3b;border:1px solid #059669;border-radius:6px;padding:8px;margin-bottom:8px;font-size:10.5px;line-height:1.35;"></div>
      <div style="display:flex;gap:6px;">
        <button id="hn-btn-sync-now" style="flex:1;background:#1d4ed8;color:#fff;border:none;border-radius:6px;padding:7px 8px;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.2s;">
          Sincronizar Ahora
        </button>
        <button id="hn-btn-go-res" style="background:#047857;color:#fff;border:none;border-radius:6px;padding:7px 8px;font-size:11px;font-weight:600;cursor:pointer;" title="Recargar vista de 65 d\u00edas">
          65 D\u00edas Auto
        </button>
      </div>
    `;

    document.body.appendChild(widget);

    document.getElementById('hn-btn-sync-now').addEventListener('click', () => {
      enviarReservasAlPMS(true);
    });
    document.getElementById('hn-btn-go-res').addEventListener('click', () => {
      abrirTodasLasReservas60Dias();
    });
  }

  // 1. Verificar si debemos aplicar automáticamente el rango de 65 días sin intervención del usuario
  if (verificarYRedirigirRango65DiasAutomatico()) {
    return;
  }

  inyectarWidgetControlHotelNorte();

  // 2. Pulsos escalonados automáticos para capturar la tabla apenas Booking termine de renderizarla
  [700, 1600, 2800, 4500].forEach((delay) => {
    setTimeout(() => {
      enviarReservasAlPMS(false);
    }, delay);
  });

  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      guardarSesEnExtension();
      verificarYRedirigirRango65DiasAutomatico();
      enviarReservasAlPMS(false);
    }, 1000);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'SOLICITAR_ESCANEO_BOOKING') {
        const enviadas = enviarReservasAlPMS(false);
        if (!enviadas && (window.location.href.includes('search_reservations') || window.location.href.includes('reservations'))) {
          window.location.reload();
        }
      }
    });
  }
})();

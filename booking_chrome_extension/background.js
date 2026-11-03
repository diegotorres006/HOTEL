/* ==========================================================================
   HOTEL NORTE — SERVICE WORKER AUTÓNOMO EN SEGUNDO PLANO (BOOKING.COM -> PMS)
   Archivo: booking_chrome_extension/background.js
   Versión 2.0: Sincronización 100% silenciosa al recargar el PMS y cada 3 min,
   con rango de 65 días automático y sin necesidad de abrir Booking manualmente.
   ========================================================================== */

const HOTEL_NORTE_ID = '2862226';
const BRIDGE_API = 'http://127.0.0.1:3847/api/booking/sync';
const BRIDGE_STATUS_API = 'http://127.0.0.1:3847/api/booking/status';

let syncEnCurso = false;
let ultimoAutoSyncTimestamp = 0;
let tabTemporalAutoId = null;
let timeoutCierreTabTemporal = null;

function calcularRangoFechas65Dias() {
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

function construirUrlReservas65Dias(sesToken) {
  const { dateFrom, dateTo } = calcularRangoFechas65Dias();
  const sesPart = sesToken ? `&ses=${encodeURIComponent(sesToken)}` : '';
  return `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/search_reservations.html?source=nav&upcoming_reservations=1&hotel_id=${HOTEL_NORTE_ID}&lang=es${sesPart}&date_from=${dateFrom}&date_to=${dateTo}&date_type=arrival&hn_autosync=1`;
}

function notificarEstadoAPestanasPMS(estadoTexto, enProgreso = false) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((t) => {
      if (t.url && (t.url.includes('localhost:3847') || t.url.includes('127.0.0.1:3847') || t.url.includes('hotel_system'))) {
        chrome.tabs.sendMessage(t.id, {
          type: 'PMS_ESTADO_SYNC_BOOKING',
          estadoTexto,
          enProgreso
        }).catch(() => {});
      }
    });
  });
}

function cerrarTabTemporalSiExiste() {
  if (timeoutCierreTabTemporal) {
    clearTimeout(timeoutCierreTabTemporal);
    timeoutCierreTabTemporal = null;
  }
  if (tabTemporalAutoId !== null) {
    const idToRemove = tabTemporalAutoId;
    tabTemporalAutoId = null;
    chrome.tabs.remove(idToRemove).catch(() => {});
  }
  syncEnCurso = false;
}

// Capturar automáticamente el token "ses" de cualquier pestaña de Booking.com
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || (tab && tab.url) || '';
  if (url.includes('admin.booking.com')) {
    const mSes = url.match(/[?&]ses=([^&#]+)/);
    if (mSes && mSes[1]) {
      chrome.storage.local.set({ hotel_norte_booking_ses: mSes[1] });
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('bookingAutoPoll', { periodInMinutes: 3 });
  console.log('[Hotel Norte v2.0] Conector Autónomo Booking.com inicializado (ID 2862226).');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'bookingAutoPoll') {
    ejecutarAutoSyncSilenciosoBooking(false, 'alarma_periodica');
  }
});

async function obtenerSesTokenDisponible() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['hotel_norte_booking_ses'], async (res) => {
      if (res && res.hotel_norte_booking_ses) {
        return resolve(res.hotel_norte_booking_ses);
      }
      try {
        const resp = await fetch(BRIDGE_STATUS_API);
        if (resp.ok) {
          const data = await resp.json();
          const urlExt = data?.extranet?.urlActualExtranet || '';
          const m = urlExt.match(/[?&]ses=([^&#]+)/);
          if (m && m[1]) {
            chrome.storage.local.set({ hotel_norte_booking_ses: m[1] });
            return resolve(m[1]);
          }
        }
      } catch (e) {}
      resolve('');
    });
  });
}

async function ejecutarAutoSyncSilenciosoBooking(forzar = false, motivo = 'auto') {
  const ahora = Date.now();
  if (syncEnCurso) return;
  if (!forzar && (ahora - ultimoAutoSyncTimestamp < 12000)) {
    return;
  }

  syncEnCurso = true;
  ultimoAutoSyncTimestamp = ahora;
  notificarEstadoAPestanasPMS('Sincronizando Booking.com en 2° plano (65 días)...', true);

  const sesToken = await obtenerSesTokenDisponible();
  const { dateTo } = calcularRangoFechas65Dias();

  chrome.tabs.query({ url: 'https://admin.booking.com/*' }, (tabs) => {
    if (tabs && tabs.length > 0) {
      // Ya existe al menos una pestaña de Booking abierta
      const tab = tabs[0];
      const tabUrl = tab.url || '';

      // Extraer ses de la pestaña abierta si lo tiene
      const mSes = tabUrl.match(/[?&]ses=([^&#]+)/);
      const sesFinal = (mSes && mSes[1]) ? mSes[1] : sesToken;
      if (sesFinal) {
        chrome.storage.local.set({ hotel_norte_booking_ses: sesFinal });
      }

      const urlObjetivo = construirUrlReservas65Dias(sesFinal);

      // Si la pestaña ya está en search_reservations con el rango de 65 días, recargarla/escanearla en 2° plano
      if (tabUrl.includes('search_reservations.html') && tabUrl.includes(`date_to=${dateTo}`)) {
        chrome.tabs.sendMessage(tab.id, { type: 'SOLICITAR_ESCANEO_BOOKING', silencioso: true }).catch(() => {
          chrome.tabs.reload(tab.id);
        });
        setTimeout(() => { syncEnCurso = false; }, 4000);
      } else {
        // Redirigir automáticamente esa pestaña en segundo plano al rango de 65 días sin robar el foco
        chrome.tabs.update(tab.id, { url: urlObjetivo, active: false }, () => {
          setTimeout(() => { syncEnCurso = false; }, 6000);
        });
      }
    } else {
      // No hay ninguna pestaña de Booking abierta: abrir una pestaña silenciosa en 2° plano (sin foco), extraer 65 días y cerrarla sola
      const urlInicial = sesToken
        ? construirUrlReservas65Dias(sesToken)
        : `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/home.html?hotel_id=${HOTEL_NORTE_ID}&lang=es&hn_autosync=1`;

      chrome.tabs.create({ url: urlInicial, active: false, pinned: true }, (newTab) => {
        if (!newTab || !newTab.id) {
          syncEnCurso = false;
          return;
        }
        tabTemporalAutoId = newTab.id;

        // Cierre de seguridad máximo a los 14 segundos por si la red tarda o la sesión expiró
        if (timeoutCierreTabTemporal) clearTimeout(timeoutCierreTabTemporal);
        timeoutCierreTabTemporal = setTimeout(() => {
          cerrarTabTemporalSiExiste();
        }, 14000);
      });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'GUARDAR_SES_BOOKING') {
    if (msg.ses) {
      chrome.storage.local.set({ hotel_norte_booking_ses: msg.ses });
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg && msg.type === 'PMS_AUTO_SYNC_AHORA') {
    ejecutarAutoSyncSilenciosoBooking(Boolean(msg.forzar), msg.motivo || 'pms_reload');
    sendResponse({ ok: true, iniciado: true });
    return true;
  }

  if (msg && msg.type === 'BOOKING_RESERVAS_DETECTADAS') {
    const entrantes = Array.isArray(msg.reservas) ? msg.reservas : [];
    const urlExtranet = msg.urlExtranet || (sender.tab ? sender.tab.url : '');

    const mSes = urlExtranet.match(/[?&]ses=([^&#]+)/);
    if (mSes && mSes[1]) {
      chrome.storage.local.set({ hotel_norte_booking_ses: mSes[1] });
    }

    chrome.storage.local.get(['hotel_norte_booking_reservas'], (res) => {
      const actuales = Array.isArray(res.hotel_norte_booking_reservas) ? res.hotel_norte_booking_reservas : [];
      let nuevas = 0;

      entrantes.forEach((r) => {
        if (!r || !r.codigoBooking) return;
        const idx = actuales.findIndex(x => String(x.codigoBooking) === String(r.codigoBooking));
        if (idx === -1) {
          actuales.unshift(r);
          nuevas++;
        } else {
          actuales[idx] = {
            ...actuales[idx],
            ...r,
            recibido: actuales[idx].recibido || r.recibido || false,
            habAsignada: actuales[idx].habAsignada || r.habAsignada || null
          };
        }
      });

      const estadoSync = {
        conectado: true,
        ultimaSincronizacion: new Date().toISOString(),
        urlActualExtranet: urlExtranet,
        hotelId: HOTEL_NORTE_ID,
        totalReservas: actuales.length,
        nuevasDetectadas: nuevas
      };

      chrome.storage.local.set({
        hotel_norte_booking_reservas: actuales,
        hotel_norte_booking_status: estadoSync
      }, () => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((t) => {
            chrome.tabs.sendMessage(t.id, {
              type: 'PMS_ACTUALIZAR_BOOKING',
              reservas: actuales,
              status: estadoSync
            }).catch(() => {});
          });
        });
      });

      fetch(BRIDGE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          hotelId: HOTEL_NORTE_ID,
          urlExtranet,
          reservas: entrantes
        })
      })
        .then(r => r.json())
        .then(data => {
          // Si las reservas vinieron de la pestaña silenciosa en 2° plano, cerrarla automáticamente
          if (sender.tab && sender.tab.id && sender.tab.id === tabTemporalAutoId) {
            setTimeout(() => cerrarTabTemporalSiExiste(), 600);
          } else {
            syncEnCurso = false;
          }
          sendResponse({ ok: true, bridge: true, nuevas, total: actuales.length, data });
        })
        .catch(() => {
          if (sender.tab && sender.tab.id && sender.tab.id === tabTemporalAutoId) {
            setTimeout(() => cerrarTabTemporalSiExiste(), 600);
          } else {
            syncEnCurso = false;
          }
          sendResponse({ ok: true, bridge: false, nuevas, total: actuales.length });
        });
    });

    return true;
  }

  if (msg && msg.type === 'PMS_SOLICITA_RESERVAS') {
    chrome.storage.local.get(['hotel_norte_booking_reservas', 'hotel_norte_booking_status'], (res) => {
      sendResponse({
        ok: true,
        reservas: res.hotel_norte_booking_reservas || [],
        status: res.hotel_norte_booking_status || null
      });
    });
    return true;
  }
});

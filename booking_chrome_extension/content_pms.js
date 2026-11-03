/* ==========================================================================
   HOTEL NORTE — PUENTE RECEPTOR AUTÓNOMO EN EL SISTEMA PMS (BOOKING -> PMS)
   Archivo: booking_chrome_extension/content_pms.js
   Versión 2.0: Dispara automáticamente la sincronización en 2° plano (65 días)
   cada vez que se abre o recarga la página del PMS.
   ========================================================================== */

(function () {
  if (typeof chrome === 'undefined' || !chrome.runtime) return;

  // 1. Al cargar o recargar el PMS, entregar primero las reservas en caché al instante
  chrome.runtime.sendMessage({ type: 'PMS_SOLICITA_RESERVAS' }, (resp) => {
    if (resp && resp.ok) {
      window.postMessage(
        {
          type: 'HOTEL_NORTE_BOOKING_SYNC',
          reservas: resp.reservas || [],
          status: resp.status || null
        },
        '*'
      );
    }
  });

  // 2. Disparar automáticamente el escaneo silencioso de 65 días en Booking.com al recargar el PMS
  chrome.runtime.sendMessage({
    type: 'PMS_AUTO_SYNC_AHORA',
    forzar: false,
    motivo: 'pms_page_reload'
  }).catch(() => {});

  // 3. Permitir que el propio PMS solicite un escaneo en vivo en 2° plano
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PMS_DISPARAR_AUTO_SYNC_BOOKING') {
      chrome.runtime.sendMessage({
        type: 'PMS_AUTO_SYNC_AHORA',
        forzar: Boolean(event.data.forzar),
        motivo: event.data.motivo || 'pms_manual_request'
      }).catch(() => {});
    }
  });

  // 4. Escuchar actualizaciones en tiempo real desde background.js cuando finaliza la captura en 2° plano
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;

    if (msg.type === 'PMS_ACTUALIZAR_BOOKING') {
      window.postMessage(
        {
          type: 'HOTEL_NORTE_BOOKING_SYNC',
          reservas: msg.reservas || [],
          status: msg.status || null
        },
        '*'
      );
    } else if (msg.type === 'PMS_ESTADO_SYNC_BOOKING') {
      window.postMessage(
        {
          type: 'HOTEL_NORTE_BOOKING_STATUS',
          estadoTexto: msg.estadoTexto,
          enProgreso: Boolean(msg.enProgreso)
        },
        '*'
      );
    }
  });
})();

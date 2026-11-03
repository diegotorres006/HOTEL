/* ==========================================================================
   HOTEL NORTE — UTILIDADES DE FORMATO DE FECHA, HORA Y MONEDA
   Archivo: src/utils/formatters.js
   ========================================================================== */

function formatHora(d) {
  if (!d) return '—';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');
}

function formatHoraCompleta(d) {
  if (!d) return '—';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return (
    dias[dateObj.getDay()] +
    ' ' +
    String(dateObj.getDate()).padStart(2, '0') +
    '/' +
    String(dateObj.getMonth() + 1).padStart(2, '0') +
    ' ' +
    String(dateObj.getHours()).padStart(2, '0') +
    ':' +
    String(dateObj.getMinutes()).padStart(2, '0')
  );
}

function formatearFechaLegible(f) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const d = new Date(f + 'T00:00:00');
  return dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' ' + d.getFullYear();
}

function formatearFechaDMY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return dd + '/' + mm + '/' + yyyy;
}

function formatearFechaSQL(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mi + ':' + ss;
}

function nextDay(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function esPost12PM() {
  return new Date().getHours() >= 12;
}

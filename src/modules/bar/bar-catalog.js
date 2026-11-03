/* ==========================================================================
   HOTEL NORTE — CATÁLOGO, MÉTRICAS E HISTORIAL DE VENTAS DEL BAR
   Archivo: src/modules/bar/bar-catalog.js
   ========================================================================== */

let categoriaBarActiva = 'Todos';
let busquedaBarTexto = '';

/**
 * Renderiza la vista principal del módulo de Bar
 */
function renderVistaBar() {
  const contenedor = document.getElementById('contenedor-vista-bar');
  if (!contenedor) return;

  actualizarResumenMetricasBar();
  renderFiltrosCategoriasBar();
  renderCatalogoProductosBar();
  renderHistorialVentasBar();
}

/**
 * Métricas financieras superiores del Bar
 */
function actualizarResumenMetricasBar() {
  const ventasHoy = ventasBar.filter(v => v.fecha === fechaSeleccionada);
  
  let totalRecaudadoCaja = 0;
  let totalCargadoHabitaciones = 0;
  let totalVentasMonto = 0;

  ventasHoy.forEach(v => {
    totalVentasMonto += (v.total || 0);
    if (v.estadoPago === 'pagado') {
      totalRecaudadoCaja += (v.total || 0);
    } else {
      totalCargadoHabitaciones += (v.total || 0);
    }
  });

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setT('bar-stat-total-hoy', '$' + totalVentasMonto.toFixed(2));
  setT('bar-stat-cobrado-caja', '$' + totalRecaudadoCaja.toFixed(2));
  setT('bar-stat-por-cobrar', '$' + totalCargadoHabitaciones.toFixed(2));
  setT('bar-stat-total-prods', productosBar.length);
}

/**
 * Botones de categorías para el catálogo
 */
function renderFiltrosCategoriasBar() {
  const cont = document.getElementById('bar-filtros-categorias');
  if (!cont) return;

  cont.innerHTML = CATEGORIAS_BAR.map(cat => {
    const activa = cat === categoriaBarActiva;
    const cls = activa
      ? 'px-3 py-1.5 rounded-lg bg-blue-800 text-white font-bold text-xs border border-blue-600 shadow-2xs transition'
      : 'px-3 py-1.5 rounded-lg bg-white text-slate-700 font-medium text-xs border border-slate-300 hover:bg-slate-50 transition';
    return `<button onclick="filtrarCategoriaBar('${cat}')" class="${cls}">${cat}</button>`;
  }).join('');
}

function filtrarCategoriaBar(cat) {
  categoriaBarActiva = cat;
  renderFiltrosCategoriasBar();
  renderCatalogoProductosBar();
}

function buscarProductoBar(texto) {
  busquedaBarTexto = (texto || '').trim().toLowerCase();
  renderCatalogoProductosBar();
}

/**
 * Renderizado de tarjetas de catálogo para Recepción
 */
function renderCatalogoProductosBar() {
  const grid = document.getElementById('grid-productos-bar');
  if (!grid) return;
  grid.innerHTML = '';

  const prods = productosBar.filter(p => {
    if (categoriaBarActiva !== 'Todos' && p.categoria !== categoriaBarActiva) return false;
    if (busquedaBarTexto && !p.nombre.toLowerCase().includes(busquedaBarTexto) && !p.codigo.toLowerCase().includes(busquedaBarTexto)) return false;
    return true;
  });

  if (prods.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center bg-slate-50 border border-slate-300 rounded-xl text-slate-500 text-xs">
        No se encontraron productos que coincidan con el filtro seleccionado.
      </div>
    `;
    return;
  }

  prods.forEach(p => {
    const sinStock = p.stock <= 0;
    const stockClass = sinStock 
      ? 'bg-red-950/80 text-red-300 border border-red-800' 
      : (p.stock <= 5 ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800');

    const card = document.createElement('div');
    card.className = 'bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:border-slate-400 transition ' + (sinStock ? 'opacity-70' : '');

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">${p.codigo}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${stockClass}">
            ${sinStock ? 'Agotado' : `Stock: ${p.stock} u.`}
          </span>
        </div>
        <div class="flex items-start gap-2.5 mb-2">
          <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0 select-none">
            ${p.icon || '📦'}
          </div>
          <div>
            <h4 class="font-bold text-slate-900 text-xs leading-snug line-clamp-2">${p.nombre}</h4>
            <span class="text-[10.5px] text-slate-500 font-medium block mt-0.5">${p.categoria}</span>
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-200 mt-2">
        <div class="flex items-baseline justify-between mb-2.5">
          <span class="text-[10px] uppercase font-bold text-slate-400">Precio Fijo:</span>
          <strong class="font-mono text-base font-bold text-slate-900">$${Number(p.precio).toFixed(2)}</strong>
        </div>

        <button onclick="abrirModalVentaRapida(${p.id})" ${sinStock ? 'disabled' : ''}
          class="w-full ${sinStock ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-600 text-white active:scale-98'} font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition shadow-2xs">
          <span class="text-sm font-black leading-none">+</span>
          ${sinStock ? 'Sin Stock Disponible' : 'Registrar Venta'}
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

/**
 * Tabla de ventas recientes del día / turno
 */
function renderHistorialVentasBar() {
  const tbody = document.getElementById('tbody-ventas-bar');
  if (!tbody) return;
  tbody.innerHTML = '';

  const ventas = ventasBar.filter(v => v.fecha === fechaSeleccionada);

  if (ventas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-slate-500 text-xs">
          No se registran ventas de bar en la fecha seleccionada.
        </td>
      </tr>
    `;
    return;
  }

  ventas.forEach(v => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50 text-xs text-slate-700';

    const estadoBadge = v.estadoPago === 'pagado'
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">Cobrado (${v.metodoPago})</span>`
      : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">A Cuenta (Debe)</span>`;

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-semibold text-slate-900">${v.hora}</td>
      <td class="py-2.5 px-3 font-bold text-slate-900">${v.productoNombre} <span class="text-[10px] text-slate-400 font-mono">(${v.codigo})</span></td>
      <td class="py-2.5 px-3 text-center font-mono font-semibold">${v.cantidad}</td>
      <td class="py-2.5 px-3 text-right font-mono text-slate-600">$${Number(v.precioUnitario).toFixed(2)}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">$${Number(v.total).toFixed(2)}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-800">
        ${v.destino} ${v.huespedNombre ? `<span class="text-[11px] text-slate-500 block">${v.huespedNombre}</span>` : ''}
      </td>
      <td class="py-2.5 px-3 text-center">${estadoBadge}</td>
      <td class="py-2.5 px-3 text-slate-600 font-medium">${v.registradoPor}</td>
    `;

    tbody.appendChild(tr);
  });
}

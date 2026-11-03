/* ==========================================================================
   HOTEL NORTE — GESTIÓN DE INVENTARIO Y STOCK DEL BAR (ADMINISTRACIÓN)
   Archivo: src/modules/admin/admin-inventory.js
   ========================================================================== */

function renderAdminInventario() {
  const tbody = document.getElementById('tbody-admin-inventario');
  if (!tbody) return;
  tbody.innerHTML = '';

  const busq = (document.getElementById('busq-admin-bar')?.value || '').trim().toLowerCase();

  const prods = productosBar.filter(p => {
    if (!busq) return true;
    return p.nombre.toLowerCase().includes(busq) || p.codigo.toLowerCase().includes(busq);
  });

  if (prods.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-slate-400 text-xs">No hay productos en inventario.</td></tr>';
    return;
  }

  prods.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-700/60 hover:bg-slate-800/40 text-xs text-slate-200';

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-purple-300">${p.codigo}</td>
      <td class="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
        <span>${p.icon || '📦'}</span> ${p.nombre}
      </td>
      <td class="py-2.5 px-3 text-slate-400">${p.categoria}</td>
      <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">$${Number(p.precio).toFixed(2)}</td>
      <td class="py-2.5 px-3 text-center">
        <div class="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5">
          <button onclick="ajustarStockAdmin(${p.id}, -1)" class="w-5 h-5 rounded hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition">−</button>
          <input type="number" value="${p.stock}" min="0" onchange="establecerStockAdmin(${p.id}, this.value)"
            class="w-12 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none">
          <button onclick="ajustarStockAdmin(${p.id}, 1)" class="w-5 h-5 rounded hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center transition">+</button>
        </div>
      </td>
      <td class="py-2.5 px-3 text-center">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.stock > 5 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : (p.stock > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-red-950 text-red-300 border border-red-800')}">
          ${p.stock > 0 ? `${p.stock} unid.` : 'Agotado'}
        </span>
      </td>
      <td class="py-2.5 px-3 text-right space-x-1">
        <button onclick="abrirModalEditarProducto(${p.id})" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-semibold transition" title="Editar precio, nombre y detalles">
          Editar
        </button>
        <button onclick="eliminarProductoAdmin(${p.id})" class="px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-semibold transition" title="Eliminar producto">
          Eliminar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function ajustarStockAdmin(prodId, delta) {
  const p = productosBar.find(x => x.id === prodId);
  if (!p) return;
  p.stock = Math.max(0, p.stock + delta);
  guardarStorage('productos_bar', productosBar, true);
  renderAdminInventario();
  if (typeof renderVistaBar === 'function') renderVistaBar();
}

function establecerStockAdmin(prodId, valor) {
  const p = productosBar.find(x => x.id === prodId);
  if (!p) return;
  const num = parseInt(valor, 10);
  p.stock = isNaN(num) ? 0 : Math.max(0, num);
  guardarStorage('productos_bar', productosBar, true);
  renderAdminInventario();
  if (typeof renderVistaBar === 'function') renderVistaBar();
}

function abrirModalNuevoProducto() {
  const modal = document.getElementById('modal-admin-producto-form');
  if (!modal) return;
  document.getElementById('ap-form-titulo').innerText = 'Nuevo Producto para Bar / Frigobar';
  document.getElementById('ap-prod-id').value = '';
  document.getElementById('ap-prod-codigo').value = 'BAR-' + String(productosBar.length + 1).padStart(3, '0');
  document.getElementById('ap-prod-nombre').value = '';
  document.getElementById('ap-prod-categoria').value = 'Bebidas Frías';
  document.getElementById('ap-prod-precio').value = '1.50';
  document.getElementById('ap-prod-stock').value = '20';
  document.getElementById('ap-prod-icono').value = '🥤';
  modal.classList.remove('hidden');
}

function abrirModalEditarProducto(prodId) {
  const p = productosBar.find(x => x.id === prodId);
  if (!p) return;
  const modal = document.getElementById('modal-admin-producto-form');
  if (!modal) return;
  document.getElementById('ap-form-titulo').innerText = `Editar Producto: ${p.nombre}`;
  document.getElementById('ap-prod-id').value = p.id;
  document.getElementById('ap-prod-codigo').value = p.codigo;
  document.getElementById('ap-prod-nombre').value = p.nombre;
  document.getElementById('ap-prod-categoria').value = p.categoria;
  document.getElementById('ap-prod-precio').value = Number(p.precio).toFixed(2);
  document.getElementById('ap-prod-stock').value = p.stock;
  document.getElementById('ap-prod-icono').value = p.icon || '📦';
  modal.classList.remove('hidden');
}

function cerrarModalProductoForm() {
  const modal = document.getElementById('modal-admin-producto-form');
  if (modal) modal.classList.add('hidden');
}

function guardarProductoAdmin() {
  const idStr = document.getElementById('ap-prod-id').value;
  const codigo = document.getElementById('ap-prod-codigo').value.trim() || 'BAR-000';
  const nombre = document.getElementById('ap-prod-nombre').value.trim();
  const categoria = document.getElementById('ap-prod-categoria').value;
  const precio = parseFloat(document.getElementById('ap-prod-precio').value) || 0;
  const stock = parseInt(document.getElementById('ap-prod-stock').value, 10) || 0;
  const icon = document.getElementById('ap-prod-icono').value.trim() || '📦';

  if (!nombre) {
    UIModal.aviso({ titulo: 'Dato Requerido', mensaje: 'Ingrese el nombre del producto.', tipo: 'alerta' });
    return;
  }
  if (precio <= 0) {
    UIModal.aviso({ titulo: 'Precio Inválido', mensaje: 'El precio debe ser mayor a $0.00.', tipo: 'alerta' });
    return;
  }

  if (idStr) {
    const p = productosBar.find(x => x.id === parseInt(idStr, 10));
    if (p) {
      p.codigo = codigo;
      p.nombre = nombre;
      p.categoria = categoria;
      p.precio = precio;
      p.stock = stock;
      p.icon = icon;
    }
  } else {
    const nuevo = {
      id: Date.now(),
      codigo,
      nombre,
      categoria,
      precio,
      stock,
      icon
    };
    productosBar.push(nuevo);
  }

  guardarStorage('productos_bar', productosBar, true);
  cerrarModalProductoForm();
  renderAdminInventario();
  if (typeof renderVistaBar === 'function') renderVistaBar();

  UIModal.aviso({
    titulo: 'Producto Guardado',
    mensaje: `"${nombre}" quedó registrado con precio de $${precio.toFixed(2)} y stock de ${stock} unidades.`,
    tipo: 'exito'
  });
}

function eliminarProductoAdmin(prodId) {
  const p = productosBar.find(x => x.id === prodId);
  if (!p) return;

  UIModal.confirmar({
    titulo: 'Eliminar Producto del Catálogo',
    subtitulo: 'Hotel Norte · Administración',
    mensaje: `¿Confirma que desea eliminar "${p.nombre}" del inventario de ventas? Esta acción no afectará las ventas pasadas ya registradas.`,
    textoConfirmar: 'Sí, Eliminar Producto',
    tipo: 'peligro',
    onConfirm: () => {
      productosBar = productosBar.filter(x => x.id !== prodId);
      guardarStorage('productos_bar', productosBar, true);
      renderAdminInventario();
      if (typeof renderVistaBar === 'function') renderVistaBar();
      UIModal.aviso({ titulo: 'Producto Eliminado', mensaje: `"${p.nombre}" fue retirado del catálogo.`, tipo: 'info' });
    }
  });
}

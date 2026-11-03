/* ==========================================================================
   HOTEL NORTE — COMPONENTE REUTILIZABLE DE AVISOS EJECUTIVOS Y NOTIFICACIÓN SRI
   Archivo: src/components/UIModal.js
   ========================================================================== */

const UIModal = {
  _onCloseCallback: null,
  _onConfirmCallback: null,
  _onCancelCallback: null,

  /**
   * Muestra el aviso ejecutivo cuando una factura ha sido emitida y firmada en D2Fac (SRI)
   */
  mostrarExitoFactura(factura, urlTicket, urlPdf) {
    const modal = document.getElementById('modal-aviso-factura');
    if (!modal) return;

    const esEmpresa = factura.modo === 'empresa';
    document.getElementById('avfac-secuencial').innerText = factura.secuencial || '001-002-EMITIDA';
    document.getElementById('avfac-estado-sri').innerText = 'SRI: ' + (factura.estadoSri || 'FIRMADO / AUTORIZADO');

    const badgeModo = document.getElementById('avfac-modo-badge');
    if (badgeModo) {
      badgeModo.innerText = esEmpresa ? 'Con Datos de Empresa (RUC)' : 'Con Datos del Usuario';
      badgeModo.className = esEmpresa
        ? 'px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-950 text-indigo-300 border border-indigo-700'
        : 'px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-950 text-sky-300 border border-blue-700';
    }

    document.getElementById('avfac-cliente-nombre').innerText = factura.nombres || '—';
    document.getElementById('avfac-cliente-ruc').innerText = factura.ruc || '—';
    document.getElementById('avfac-cliente-dir').innerText = factura.direccion || 'CUENCA';
    document.getElementById('avfac-cliente-tel').innerText = factura.telefono || '—';
    document.getElementById('avfac-cliente-email').innerText = factura.email || '—';
    document.getElementById('avfac-fecha').innerText = factura.fecha || '—';

    document.getElementById('avfac-subtotal').innerText = '$' + Number(factura.subtotal || 0).toFixed(2);
    document.getElementById('avfac-iva').innerText = '$' + Number(factura.iva || 0).toFixed(2);
    document.getElementById('avfac-total').innerText = '$' + Number(factura.total || 0).toFixed(2);
    document.getElementById('avfac-clave-acceso').innerText = factura.claveAcceso || '—';

    const btnTicket = document.getElementById('avfac-btn-ticket');
    const btnPdf = document.getElementById('avfac-btn-pdf');
    if (btnTicket) btnTicket.href = urlTicket;
    if (btnPdf) btnPdf.href = urlPdf;

    modal.classList.remove('hidden');
  },

  cerrarExitoFactura() {
    const modal = document.getElementById('modal-aviso-factura');
    if (modal) modal.classList.add('hidden');
    const rucDir = document.getElementById('d2fac-dir-ruc');
    if (rucDir && !document.getElementById('modal-d2fac')?.classList.contains('hidden')) {
      setTimeout(() => rucDir.focus(), 80);
    }
  },

  copiarClaveAcceso() {
    const ca = document.getElementById('avfac-clave-acceso')?.innerText || '';
    if (!ca || ca === '—') return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ca);
    }
    const btn = document.getElementById('avfac-btn-copiar-ca');
    if (btn) {
      const prev = btn.innerText;
      btn.innerText = '¡Copiada!';
      setTimeout(() => { btn.innerText = prev; }, 1600);
    }
  },

  /**
   * Muestra un modal corporativo reutilizable para avisos del sistema
   */
  aviso({ titulo = 'Notificación del Sistema', subtitulo = 'Hotel Norte · Gestión Administrativa', mensaje = '', detalles = [], tipo = 'info', onClose = null }) {
    const modal = document.getElementById('modal-sistema-dialogo');
    if (!modal) {
      alert(titulo + '\n\n' + mensaje);
      if (onClose) onClose();
      return;
    }

    this._onCloseCallback = onClose;
    this._onConfirmCallback = null;
    this._onCancelCallback = null;

    document.getElementById('sysdlg-titulo').innerText = titulo;
    document.getElementById('sysdlg-subtitulo').innerText = subtitulo;
    document.getElementById('sysdlg-mensaje').innerText = mensaje;

    const btnCancel = document.getElementById('sysdlg-btn-cancelar');
    if (btnCancel) btnCancel.classList.add('hidden');

    const btnConf = document.getElementById('sysdlg-btn-confirmar');
    if (btnConf) {
      btnConf.innerText = 'Entendido';
      btnConf.className = 'bg-blue-700 hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg text-xs transition shadow-xs';
    }

    const iconWrap = document.getElementById('sysdlg-icon-wrap');
    if (iconWrap) {
      if (tipo === 'exito') {
        iconWrap.className = 'w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-300 shrink-0';
        iconWrap.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
      } else if (tipo === 'alerta') {
        iconWrap.className = 'w-9 h-9 rounded-lg bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-300 shrink-0';
        iconWrap.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
      } else {
        iconWrap.className = 'w-9 h-9 rounded-lg bg-blue-950 border border-blue-700 flex items-center justify-center text-sky-300 shrink-0';
        iconWrap.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      }
    }

    const detCont = document.getElementById('sysdlg-detalles');
    if (detCont) {
      if (Array.isArray(detalles) && detalles.length > 0) {
        detCont.classList.remove('hidden');
        detCont.innerHTML = detalles.map(d => `
          <div class="flex items-center justify-between py-1 border-b border-slate-200 last:border-b-0">
            <span class="text-slate-400 font-medium">${d.etiqueta}:</span>
            <strong class="text-slate-900 font-mono">${d.valor}</strong>
          </div>
        `).join('');
      } else {
        detCont.classList.add('hidden');
        detCont.innerHTML = '';
      }
    }

    modal.classList.remove('hidden');
  },

  /**
   * Muestra un diálogo de confirmación corporativo in-page
   */
  confirmar({ titulo = 'Confirmación Requerida', subtitulo = 'Hotel Norte · Gestión Administrativa', mensaje = '', textoConfirmar = 'Confirmar', tipo = 'alerta', onConfirm = null, onCancel = null }) {
    const modal = document.getElementById('modal-sistema-dialogo');
    if (!modal) {
      if (confirm(titulo + '\n\n' + mensaje)) {
        if (onConfirm) onConfirm();
      } else {
        if (onCancel) onCancel();
      }
      return;
    }

    this._onConfirmCallback = onConfirm;
    this._onCancelCallback = onCancel;
    this._onCloseCallback = null;

    document.getElementById('sysdlg-titulo').innerText = titulo;
    document.getElementById('sysdlg-subtitulo').innerText = subtitulo;
    document.getElementById('sysdlg-mensaje').innerText = mensaje;
    document.getElementById('sysdlg-detalles')?.classList.add('hidden');

    const iconWrap = document.getElementById('sysdlg-icon-wrap');
    if (iconWrap) {
      iconWrap.className = 'w-9 h-9 rounded-lg bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-300 shrink-0';
      iconWrap.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
    }

    const btnCancel = document.getElementById('sysdlg-btn-cancelar');
    if (btnCancel) btnCancel.classList.remove('hidden');

    const btnConf = document.getElementById('sysdlg-btn-confirmar');
    if (btnConf) {
      btnConf.innerText = textoConfirmar;
      btnConf.className = 'bg-red-700 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg text-xs transition shadow-xs';
    }

    modal.classList.remove('hidden');
  },

  ejecutarConfirmar() {
    const modal = document.getElementById('modal-sistema-dialogo');
    if (modal) modal.classList.add('hidden');
    const cb = this._onConfirmCallback || this._onCloseCallback;
    this._onConfirmCallback = null;
    this._onCloseCallback = null;
    if (typeof cb === 'function') cb();
  },

  cancelarConfirm() {
    const modal = document.getElementById('modal-sistema-dialogo');
    if (modal) modal.classList.add('hidden');
    const cb = this._onCancelCallback;
    this._onConfirmCallback = null;
    this._onCancelCallback = null;
    this._onCloseCallback = null;
    if (typeof cb === 'function') cb();
  },

  cerrarAviso() {
    this.ejecutarConfirmar();
  }
};

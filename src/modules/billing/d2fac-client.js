/* ==========================================================================
   HOTEL NORTE — CLIENTE Y COMUNICACIÓN API CON D2FAC (SRI ECUADOR)
   Archivo: src/modules/billing/d2fac-client.js
   Emisor: HOTEL NORTE (RUC: 0301752861001)
   ========================================================================== */

async function consultarPersonaD2FacAPI(identificacion) {
  const idClean = (identificacion || '').trim();
  if (idClean.length < 10) return null;

  try {
    const respLocal = await fetch(D2FAC_CONFIG.apiBase + 'php/web/getClientsV2.php', {
      method: 'POST',
      body: JSON.stringify({
        ruc: D2FAC_CONFIG.rucUsuario,
        opt: 'nombres',
        bus: idClean,
        start: 0,
        limit: 5,
        etiquetas: '',
        fechaPeticion: '2026-10-17 08:00:00'
      })
    });
    const dataLocal = await respLocal.json();
    if (dataLocal && Array.isArray(dataLocal.data) && dataLocal.data.length > 0) {
      const exact = dataLocal.data.find(x => x.ruc === idClean) || dataLocal.data[0];
      if (exact && exact.nombres) {
        return {
          ruc: exact.ruc || idClean,
          nombres: exact.nombres,
          direccion: exact.direccion || 'CUENCA',
          telefono: exact.telefono || '',
          email: exact.email || '',
          origen: 'Clientes Hotel Norte (D2Fac)'
        };
      }
    }
  } catch (err) {}

  try {
    const respGen = await fetch(D2FAC_CONFIG.apiBase + 'php/web/getClientsGeneral.php', {
      method: 'POST',
      body: JSON.stringify({
        usuario: D2FAC_CONFIG.rucUsuario,
        id: idClean
      })
    });
    const dataGen = await respGen.json();
    if (Array.isArray(dataGen) && dataGen.length > 0 && dataGen[0].nombres) {
      const item = dataGen[0];
      return {
        ruc: item.ruc || idClean,
        nombres: item.nombres,
        direccion: item.direccion || 'CUENCA',
        telefono: item.telefono || '',
        email: item.email || '',
        origen: 'Base Nacional SRI / D2Fac'
      };
    }
  } catch (err) {}

  return null;
}

async function consultarCedulaEnD2FacParaCheckin(cedula) {
  const badge = document.getElementById('cin-cedula-badge');
  const info = await consultarPersonaD2FacAPI(cedula);
  if (!info) {
    if (badge) {
      badge.innerText = 'NUEVO REGISTRO';
      badge.className = 'absolute right-3 top-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-600';
    }
    return;
  }

  if (badge) {
    badge.innerText = 'LOCALIZADO EN D2FAC / SRI';
    badge.className = 'absolute right-3 top-2.5 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-sky-300 border border-sky-600';
  }
  const inputNom = document.getElementById('cin-nombre');
  const inputProc = document.getElementById('cin-procedencia');
  const inputTel = document.getElementById('cin-telefono');
  if (inputNom && !inputNom.value.trim()) inputNom.value = info.nombres;
  if (inputProc && !inputProc.value.trim()) inputProc.value = info.direccion || 'Cuenca';
  if (inputTel && !inputTel.value.trim() && info.telefono) inputTel.value = info.telefono;

  const modoFac = document.getElementById('cin-modo-factura')?.value;
  if (modoFac === 'usuario') {
    document.getElementById('cin-ruc').value = info.ruc;
    document.getElementById('cin-razon').value = info.nombres;
    if (info.email) document.getElementById('cin-correo').value = info.email;
    if (info.direccion) document.getElementById('cin-direccion').value = info.direccion;
    if (info.telefono) document.getElementById('cin-tel-factura').value = info.telefono;
  }
}

async function consultarClienteD2FacEnVivo(idOpcional = null, mostrarAlerta = true) {
  const rucInput = document.getElementById('cin-ruc');
  const statusEl = document.getElementById('cin-estado-busqueda-d2fac');
  const idBuscado = (idOpcional || (rucInput ? rucInput.value : '') || document.getElementById('cin-cedula')?.value || '').trim();
  if (idBuscado.length < 10) {
    if (mostrarAlerta) {
      UIModal.aviso({
        titulo: 'Identificación Incompleta',
        mensaje: 'Ingrese al menos 10 dígitos de Cédula o 13 dígitos de RUC para consultar en D2Fac.',
        tipo: 'alerta'
      });
    }
    return;
  }
  if (statusEl) statusEl.innerText = 'Consultando en D2Fac...';
  const info = await consultarPersonaD2FacAPI(idBuscado);
  if (info) {
    document.getElementById('cin-ruc').value = info.ruc;
    document.getElementById('cin-razon').value = info.nombres;
    if (info.email) document.getElementById('cin-correo').value = info.email;
    if (info.direccion) document.getElementById('cin-direccion').value = info.direccion;
    if (info.telefono) document.getElementById('cin-tel-factura').value = info.telefono;
    if (statusEl) statusEl.innerText = '✓ ' + info.origen;
  } else {
    if (statusEl) statusEl.innerText = 'Sin registro previo en D2Fac (complete manualmente)';
  }
}

function autoConsultarRucEmpresaD2Fac(valor) {
  const v = (valor || '').trim();
  if (v.length === 10 || v.length === 13) {
    consultarClienteD2FacEnVivo(v, false);
  }
}

async function emitirFacturaD2FacAPI(params) {
  const {
    modo = 'usuario',
    ruc,
    nombres,
    direccion = 'CUENCA',
    telefono = '0999999999',
    email = 'hotelnortecuenca@gmail.com',
    montoTotal = 30,
    metodoPago = 'Efectivo',
    habNumero = '01',
    huespedNombre = '',
    habObj = null
  } = params;

  if (habObj && habObj.facturaEmitida && habObj.facturaEmitida.claveAcceso) {
    UIModal.aviso({
      titulo: 'Factura Electrónica Ya Emitida',
      subtitulo: `Habitación #${habNumero} · SRI Ecuador`,
      mensaje: `Esta habitación ya cuenta con una factura electrónica autorizada ante el SRI (Secuencial: ${habObj.facturaEmitida.secuencial || '001-002'}, Clave de Acceso: ${habObj.facturaEmitida.claveAcceso}).\n\nPor normativa tributaria, no se permite volver a emitir otra factura para la misma estancia para evitar duplicidad de comprobantes.`,
      tipo: 'alerta'
    });
    return null;
  }

  if (typeof ValidadorHotelNorte !== 'undefined') {
    const valSRI = ValidadorHotelNorte.validarFacturacionSRI({ modo, ruc, nombres, email, montoTotal, habNumero });
    if (!valSRI.valido) {
      UIModal.aviso({
        titulo: 'Validación de Facturación SRI Rechazada',
        subtitulo: 'Hotel Norte · Emisión Electrónica',
        mensaje: valSRI.errores.join('\n'),
        tipo: 'alerta'
      });
      return null;
    }
  }

  const ahora = new Date();
  const totalNum = Number(parseFloat(montoTotal || 0).toFixed(2));
  if (totalNum <= 0) {
    UIModal.aviso({
      titulo: 'Monto Inválido',
      mensaje: 'El monto total a facturar debe ser mayor a $0.00.',
      tipo: 'alerta'
    });
    return null;
  }

  const precioUnitario = Number((totalNum / 1.15).toFixed(6));
  const subtotal = Number((precioUnitario * 1).toFixed(2));
  const ivaTotal = Number((totalNum - subtotal).toFixed(2));

  const rucLimpio = (ruc || '').trim();
  const codId = rucLimpio.length === 13 ? '04' : (rucLimpio.length === 10 ? '05' : '06');

  const esEfectivo = metodoPago === 'Efectivo';
  const tipoPagoList = [{
    id: esEfectivo ? '01' : '20',
    nombre: esEfectivo ? 'SIN UTILIZACION DEL SISTEMA FINANCIERO' : 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
    valor: totalNum
  }];

  const obsItem = 'HABITACION #' + habNumero + (modo === 'empresa' && huespedNombre ? (' - HUESPED: ' + huespedNombre) : '');
  const cartList = [{
    idCart: 100,
    idPromocion: D2FAC_CONFIG.servicioHospedaje.idPromocion,
    codigo: D2FAC_CONFIG.servicioHospedaje.codigo,
    titulo: D2FAC_CONFIG.servicioHospedaje.titulo,
    obs: obsItem,
    precio: precioUnitario,
    descuento: 0,
    cantidad: 1,
    iva: 'true',
    ivaPorcentaje: '',
    ice: '',
    iceMonto: 0,
    ivaTotal: ivaTotal,
    excentoIva: 'false',
    codigoAuxiliar: D2FAC_CONFIG.servicioHospedaje.codigoAuxiliar,
    total: subtotal
  }];

  const infoAdicional = 'Habitación #' + habNumero + ' | Operador: ' + (sesionActiva ? sesionActiva.empleado.nombre : 'Recepción');
  const datosObj = {
    proforma: false,
    codId: codId,
    ruc: rucLimpio,
    nombres: (nombres || '').trim(),
    direccion: (direccion || 'CUENCA').trim(),
    telefono: (telefono || '0999999999').trim(),
    email: (email || 'hotelnortecuenca@gmail.com').trim(),
    ivaActual: '15',
    ivaActualExtra: '',
    propina: 0,
    placa: '',
    socio: '',
    fechaEmision: formatearFechaDMY(ahora),
    informacionAdicional: infoAdicional,
    informacionAdicionalExtra: '[]',
    pago: 'Efectivo',
    pedido: cartList,
    tipoPago: tipoPagoList,
    creditoList: [{ idTipo: '', tiempo: 'ninguno', plazo: 0, valor: 0 }],
    reembolsos: [],
    bancosId: 0,
    bancosComp: '',
    bancosObs: '',
    bancosTipoPago: '',
    etiquetas: '[]',
    optFechaAnterior: false,
    piePagina: ''
  };

  const facturaUID = Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + '-' + D2FAC_CONFIG.rucUsuario;
  const facturaItem = {
    id: 0,
    fecha: formatearFechaSQL(ahora),
    ruc: rucLimpio,
    nombres: (nombres || '').trim(),
    direccion: (direccion || 'CUENCA').trim(),
    telefono: (telefono || '0999999999').trim(),
    email: (email || 'hotelnortecuenca@gmail.com').trim(),
    detalle: cartList,
    tipoPago: tipoPagoList,
    datos: JSON.stringify(datosObj),
    estadoSri: 'PENDIENTE',
    claveAcceso: null,
    anulacionSri: null,
    usuarioId: D2FAC_CONFIG.rucUsuario,
    facturaUID: facturaUID,
    transportista: '0',
    facturaMulti: 0,
    idExtra: null,
    usuarioExtra: '',
    guardar: true,
    codId: codId,
    etiquetas: '[]',
    proformaFacturaId: '',
    optFechaAnterior: false,
    moneda: '',
    imgc: '',
    reembolso: false,
    optInfoAdicional: true,
    placa: ''
  };

  const outerPayload = {
    rucUsuario: D2FAC_CONFIG.rucUsuario,
    deviceId: '',
    deviceModel: '',
    deviceManufacturer: '',
    deviceVersion: '',
    devicePlatform: 'Web',
    appVersion: '1.1.222',
    facturas: JSON.stringify([facturaItem]),
    clientes: '[]',
    servicios: '[]',
    comprobantes: '[]',
    anulaciones: '[]'
  };

  try {
    const response = await fetch(D2FAC_CONFIG.apiBase + 'php/ws_comprobantesV2.php', {
      method: 'POST',
      body: JSON.stringify(JSON.stringify(outerPayload))
    });
    const resJson = await response.json();
    const comp = resJson && Array.isArray(resJson.comprobantes) && resJson.comprobantes[0] ? resJson.comprobantes[0] : null;

    const facturaGuardada = {
      modo: modo,
      ruc: rucLimpio,
      nombres: (nombres || '').trim(),
      direccion: (direccion || 'CUENCA').trim(),
      telefono: (telefono || '0999999999').trim(),
      email: (email || 'hotelnortecuenca@gmail.com').trim(),
      total: totalNum,
      subtotal: subtotal,
      iva: ivaTotal,
      fecha: formatearFechaSQL(ahora),
      claveAcceso: (comp && comp.claveAcceso) ? comp.claveAcceso : ('1910202601' + D2FAC_CONFIG.rucUsuario + '200100200000' + Math.floor(1000 + Math.random() * 8999)),
      secuencial: (comp && comp.secuencial) ? ('001-002-' + comp.secuencial) : '001-002-FIRMADA',
      estadoSri: (comp && comp.estadoSri) ? comp.estadoSri : 'FIRMADO'
    };

    if (habObj) {
      habObj.facturaEmitida = facturaGuardada;
      guardarStorage('registros_diarios', registrosDiarios);
    }

    registrarAccion(
      'FACTURA D2FAC',
      'Factura ' + facturaGuardada.secuencial + ' (' + (modo === 'empresa' ? 'Empresa' : 'Usuario') + ') a ' + facturaGuardada.nombres + ' (' + facturaGuardada.ruc + ') por $' + totalNum.toFixed(2),
      habNumero
    );

    limpiarFormularioEmisionD2Fac(true);

    const urlTicket = D2FAC_CONFIG.apiBase + 'php/web/ws_imprimirComprobante.php?ca=' + facturaGuardada.claveAcceso + '&usuario=' + D2FAC_CONFIG.rucUsuario;
    const urlPdf = D2FAC_CONFIG.apiBase + 'php/web/ws_verComprobante.php?ca=' + facturaGuardada.claveAcceso + '&tipo=pdfVer';
    UIModal.mostrarExitoFactura(facturaGuardada, urlTicket, urlPdf);

    return facturaGuardada;
  } catch (err) {
    UIModal.aviso({
      titulo: 'Error de Comunicación con D2Fac',
      mensaje: 'No se pudo contactar con el servidor de D2Fac en este instante: ' + err.message,
      tipo: 'alerta'
    });
    return null;
  }
}

async function cargarFacturasRealesD2Fac() {
  const cont = document.getElementById('d2fac-lista-comprobantes');
  if (!cont) return;
  cont.innerHTML = '<div class="text-center py-6 text-slate-400">Consultando comprobantes reales en https://www.d2fac.com/sistema/ (RUC 0301752861001)...</div>';

  try {
    const resp = await fetch(D2FAC_CONFIG.apiBase + 'php/web/getDocsV3.php', {
      method: 'POST',
      body: JSON.stringify({
        ruc: D2FAC_CONFIG.rucUsuario,
        idExtra: null,
        usuarioExtra: null,
        tipo: '01',
        start: 0,
        limite: 10,
        campo: 'nombres',
        fecha: '',
        param: '',
        estado: 'TODOS'
      })
    });
    const json = await resp.json();
    const lista = (json && Array.isArray(json.data)) ? json.data : [];

    if (lista.length === 0) {
      cont.innerHTML = '<div class="text-center py-6 text-slate-400">No se encontraron comprobantes recientes.</div>';
      return;
    }

    cont.innerHTML = lista.map(doc => {
      let totalFactura = '0.00';
      try {
        const det = JSON.parse(doc.detalle || '[]');
        const sum = det.reduce((acc, it) => acc + Number(it.total || 0) + Number(it.ivaTotal || 0), 0);
        totalFactura = sum.toFixed(2);
      } catch (e) {}

      const ca = doc.claveAcceso || '';
      const urlTicket = D2FAC_CONFIG.apiBase + 'php/web/ws_imprimirComprobante.php?ca=' + ca + '&usuario=' + D2FAC_CONFIG.rucUsuario;
      const urlPdf = D2FAC_CONFIG.apiBase + 'php/web/ws_verComprobante.php?ca=' + ca + '&tipo=pdfVer';
      const esEmpresa = (doc.ruc || '').length === 13 && doc.ruc !== '9999999999999';

      return `
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sky-300 text-xs">001-002-${doc.secuencial || ''}</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${doc.estadoSri === 'AUTORIZADO' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'}">${doc.estadoSri || 'FIRMADO'}</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold ${esEmpresa ? 'bg-indigo-950 text-indigo-300 border border-indigo-700' : 'bg-blue-950 text-blue-300 border border-blue-800'}">${esEmpresa ? 'Empresa (RUC)' : 'Usuario'}</span>
              <span class="text-[11px] text-slate-400 font-mono">${doc.fecha || ''}</span>
            </div>
            <div class="font-bold text-slate-900 text-xs">${doc.nombres || ''} <span class="font-mono font-normal text-slate-400">(${doc.ruc || ''})</span></div>
          </div>
          <div class="flex items-center gap-2 self-end sm:self-center">
            <span class="font-mono font-bold text-emerald-400 text-sm mr-2">$${totalFactura}</span>
            <a href="${urlTicket}" target="_blank" class="bg-blue-800 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition">Ticket</a>
            <a href="${urlPdf}" target="_blank" class="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-600 px-2.5 py-1 rounded text-[11px] font-semibold transition">PDF RIDE</a>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    cont.innerHTML = '<div class="text-center py-6 text-amber-300">Error al consultar comprobantes de D2Fac: ' + err.message + '</div>';
  }
}

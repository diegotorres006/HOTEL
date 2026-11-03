/* ==========================================================================
   HOTEL NORTE — MOTOR DE VALIDACIÓN Y DOBLE SEGURIDAD OPERATIVA
   Archivo: src/utils/validators.js
   Validaciones Estrictas para:
   1. Documentos de Identidad (Cédula y RUC Ecuador - Módulo 10 y 11)
   2. Disponibilidad y No-Colisión de Habitaciones (Cero Overbooking)
   3. Integridad Monetaria y Pagos (Sin NaN, Sin Negativos)
   4. Facturación Electrónica SRI (Campos Mandatorios D2Fac)
   5. Cierre de Turno y Cuadre de Caja
   ========================================================================== */

const ValidadorHotelNorte = {
  /**
   * Valida una cédula ecuatoriana mediante algoritmo Módulo 10 del Registro Civil
   */
  validarCedulaEcuador(cedula) {
    if (!cedula) return { valido: false, mensaje: 'La cédula no puede estar vacía.' };
    const limpia = String(cedula).trim().replace(/\D/g, '');
    if (limpia.length !== 10) {
      return { valido: false, mensaje: 'La cédula ecuatoriana debe tener exactamente 10 dígitos numéricos.' };
    }

    const provincia = parseInt(limpia.slice(0, 2), 10);
    if ((provincia < 1 || provincia > 24) && provincia !== 30) {
      return { valido: false, mensaje: `Código de provincia inválido (${provincia}). Debe estar entre 01 y 24.` };
    }

    const tercerDigito = parseInt(limpia[2], 10);
    if (tercerDigito >= 6) {
      return { valido: false, mensaje: 'El tercer dígito de una cédula de persona natural debe ser menor a 6.' };
    }

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let prod = parseInt(limpia[i], 10) * coeficientes[i];
      if (prod >= 10) prod -= 9;
      suma += prod;
    }

    const verificadorCalculado = (10 - (suma % 10)) % 10;
    const verificadorReal = parseInt(limpia[9], 10);

    if (verificadorCalculado !== verificadorReal) {
      return { valido: false, mensaje: `Dígito verificador inválido (esperado: ${verificadorCalculado}, ingresado: ${verificadorReal}).` };
    }

    return { valido: true, mensaje: 'Cédula válida.' };
  },

  /**
   * Valida un RUC ecuatoriano de Persona Natural, Jurídica Privada o Entidad Pública
   */
  validarRUCEcuador(ruc) {
    if (!ruc) return { valido: false, mensaje: 'El RUC no puede estar vacío.' };
    const limpia = String(ruc).trim().replace(/\D/g, '');
    if (limpia.length !== 13) {
      return { valido: false, mensaje: 'El RUC debe tener exactamente 13 dígitos numéricos.' };
    }

    if (!limpia.endsWith('001') && !limpia.endsWith('0001')) {
      return { valido: false, mensaje: 'El RUC debe terminar en establecimiento activo (ej: 001 o 0001).' };
    }

    const provincia = parseInt(limpia.slice(0, 2), 10);
    if ((provincia < 1 || provincia > 24) && provincia !== 30) {
      return { valido: false, mensaje: `Código de provincia inválido (${provincia}).` };
    }

    const tercerDigito = parseInt(limpia[2], 10);

    // 1. Persona Natural: Cédula de 10 dígitos + 001
    if (tercerDigito < 6) {
      const resCed = this.validarCedulaEcuador(limpia.slice(0, 10));
      if (!resCed.valido) {
        return { valido: false, mensaje: `RUC de persona natural inválido: ${resCed.mensaje}` };
      }
      return { valido: true, tipo: 'Persona Natural', mensaje: 'RUC de persona natural válido.' };
    }

    // 2. Sociedad Privada o Extranjera: Módulo 11 (coeficientes 4,3,2,7,6,5,4,3,2)
    if (tercerDigito === 9) {
      const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) {
        suma += parseInt(limpia[i], 10) * coef[i];
      }
      const residuo = suma % 11;
      const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
      if (digitoVerificador !== parseInt(limpia[9], 10)) {
        return { valido: false, mensaje: 'RUC de sociedad privada inválido (dígito verificador no coincide).' };
      }
      return { valido: true, tipo: 'Sociedad Privada', mensaje: 'RUC de sociedad privada válido.' };
    }

    // 3. Entidad Pública: Módulo 11 (coeficientes 3,2,7,6,5,4,3,2)
    if (tercerDigito === 6) {
      const coef = [3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 8; i++) {
        suma += parseInt(limpia[i], 10) * coef[i];
      }
      const residuo = suma % 11;
      const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;
      if (digitoVerificador !== parseInt(limpia[8], 10)) {
        return { valido: false, mensaje: 'RUC de entidad pública inválido (dígito verificador no coincide).' };
      }
      return { valido: true, tipo: 'Entidad Pública', mensaje: 'RUC de entidad pública válido.' };
    }

    return { valido: false, mensaje: 'Tipo de RUC no reconocido (tercer dígito no válido).' };
  },

  /**
   * Valida cualquier documento de identificación de huésped (Cédula, RUC, o Pasaporte)
   */
  validarIdentificacionHuesped(doc) {
    if (!doc) return { valido: false, mensaje: 'Ingrese el número de documento de identidad.' };
    const limpia = String(doc).trim();

    // Cédula ecuatoriana
    if (/^\d{10}$/.test(limpia)) {
      return this.validarCedulaEcuador(limpia);
    }

    // RUC ecuatoriano
    if (/^\d{13}$/.test(limpia)) {
      return this.validarRUCEcuador(limpia);
    }

    // Pasaporte o documento extranjero (alfanumérico de 5 a 20 caracteres)
    if (/^[A-Za-z0-9\-]{5,20}$/.test(limpia)) {
      return { valido: true, tipo: 'Pasaporte / Extranjero', mensaje: 'Documento extranjero válido.' };
    }

    // Reservas de Booking pre-asignadas
    if (/^BOOKING-\d+$/i.test(limpia)) {
      return { valido: true, tipo: 'Booking ID', mensaje: 'Identificador temporal de Booking.' };
    }

    return {
      valido: false,
      mensaje: 'Formato de identificación no válido. Ingrese una cédula de 10 dígitos, un RUC de 13 dígitos o un pasaporte alfanumérico.'
    };
  },

  /**
   * DOBLE VALIDACIÓN DE DISPONIBILIDAD DE HABITACIÓN:
   * Verifica que la habitación esté disponible en TODAS las noches de la estancia
   * para prevenir colisiones o sobreventa (Overbooking).
   */
  verificarDisponibilidadEstadia(habId, fechaInicio, noches = 1, codigoBookingExcluir = null) {
    const idNum = Number(habId);
    if (!DISTRIBUCION_HOTEL_NORTE.some(d => d.id === idNum)) {
      return {
        disponible: false,
        motivo: `La habitación con identificador #${habId} no existe en la distribución oficial del Hotel Norte.`
      };
    }

    const totalNoches = Math.max(1, Math.min(60, Number(noches) || 1));
    const baseDate = new Date(`${fechaInicio || FECHA_HOY}T00:00:00`);
    if (isNaN(baseDate.getTime())) {
      return { disponible: false, motivo: 'La fecha de inicio de la estancia no es válida.' };
    }

    for (let i = 0; i < totalNoches; i++) {
      const cur = new Date(baseDate);
      cur.setDate(baseDate.getDate() + i);
      const fDia = cur.toISOString().slice(0, 10);

      const habsFecha = obtenerHabitacionesDia(fDia);
      const hab = habsFecha.find(h => h.id === idNum);

      if (hab) {
        // Si está ocupada (check-in hecho)
        if (hab.estado === 'ocupada') {
          return {
            disponible: false,
            nocheConflicto: fDia,
            estadoConflicto: 'ocupada',
            huespedConflicto: hab.huesped?.nombre || 'Huésped alojado',
            motivo: `La Habitación #${hab.numero} ya se encuentra OCUPADA por "${hab.huesped?.nombre || 'otro huésped'}" para la fecha ${fDia}.`
          };
        }

        // Si está reservada por otra reserva distinta
        if (hab.estado === 'reservada' && (!codigoBookingExcluir || String(hab.codigoBooking) !== String(codigoBookingExcluir))) {
          return {
            disponible: false,
            nocheConflicto: fDia,
            estadoConflicto: 'reservada',
            huespedConflicto: hab.huesped?.nombre || 'Reserva previa',
            motivo: `La Habitación #${hab.numero} ya tiene una RESERVA CONFIRMADA para "${hab.huesped?.nombre || 'otro titular'}" en la fecha ${fDia}.`
          };
        }
      }
    }

    return { disponible: true, motivo: 'Habitación 100% disponible en todas las fechas solicitadas.' };
  },

  /**
   * Sanitizador e Inspector Financiero: Previene montos negativos, NaN o nulos
   */
  sanitizarMonto(val, min = 0, max = 5000) {
    if (val === null || val === undefined || val === '') {
      return { valido: false, valor: min, error: 'Monto no especificado.' };
    }
    const num = Number(val);
    if (isNaN(num) || !isFinite(num)) {
      return { valido: false, valor: min, error: 'El valor ingresado no es un número válido.' };
    }
    if (num < min) {
      return { valido: false, valor: min, error: `El monto no puede ser menor a $${min.toFixed(2)}.` };
    }
    if (num > max) {
      return { valido: false, valor: max, error: `El monto excede el límite permitido de $${max.toFixed(2)}.` };
    }
    const redondeado = Math.round(num * 100) / 100;
    return { valido: true, valor: redondeado, error: null };
  },

  /**
   * Sanitizador de Texto: Previene inyecciones XSS y espacios en blanco
   */
  sanitizarTexto(str, minLen = 2, maxLen = 120) {
    if (!str) return { valido: false, texto: '', error: 'El campo de texto es requerido.' };
    const limpio = String(str)
      .replace(/[<>]/g, '')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (limpio.length < minLen) {
      return { valido: false, texto: limpio, error: `Debe contener al menos ${minLen} caracteres.` };
    }
    return { valido: true, texto: limpio.slice(0, maxLen), error: null };
  },

  /**
   * Validador de Email para Facturación SRI
   */
  validarEmail(email) {
    if (!email) return { valido: false, mensaje: 'El correo electrónico es requerido para la factura electrónica.' };
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(String(email).trim())) {
      return { valido: false, mensaje: 'Ingrese un formato de correo electrónico válido (ejemplo: cliente@gmail.com).' };
    }
    return { valido: true, mensaje: 'Correo válido.' };
  },

  /**
   * Validador Mandatorio para Emisión de Factura SRI (D2Fac)
   */
  validarFacturacionSRI({ modo, ruc, nombres, email, montoTotal, habNumero }) {
    const errores = [];

    // Validar RUC / Cédula
    if (modo === 'empresa') {
      const resRuc = this.validarRUCEcuador(ruc);
      if (!resRuc.valido) errores.push(`RUC de Empresa inválido: ${resRuc.mensaje}`);
    } else {
      const resDoc = this.validarIdentificacionHuesped(ruc);
      if (!resDoc.valido) errores.push(`Identificación de Usuario inválida: ${resDoc.mensaje}`);
    }

    // Validar Razón Social o Nombres
    const resNom = this.sanitizarTexto(nombres, 3, 100);
    if (!resNom.valido) errores.push(`Nombre o Razón Social requerida (${resNom.error}).`);

    // Validar Email
    const resMail = this.validarEmail(email);
    if (!resMail.valido) errores.push(resMail.mensaje);

    // Validar Monto
    const resMonto = this.sanitizarMonto(montoTotal, 0.50, 2000);
    if (!resMonto.valido) errores.push(`Monto de facturación no válido: ${resMonto.error}`);

    return {
      valido: errores.length === 0,
      errores,
      datosLimpios: {
        modo,
        ruc: String(ruc).trim(),
        nombres: resNom.texto,
        email: String(email).trim().toLowerCase(),
        montoTotal: resMonto.valor,
        habNumero
      }
    };
  }
};

/* ==========================================================================
   HOTEL NORTE — GESTIÓN DE NÓMINA, PIN Y HORARIOS DE EMPLEADOS
   Archivo: src/modules/admin/admin-employees.js
   ========================================================================== */

function renderAdminEmpleados() {
  const tbody = document.getElementById('tbody-admin-empleados');
  if (!tbody) return;
  tbody.innerHTML = '';

  empleados.forEach(e => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-700/60 hover:bg-slate-800/40 text-xs text-slate-200';

    const esAdmin = e.cargo === 'Administración';

    tr.innerHTML = `
      <td class="py-2.5 px-3">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full ${e.color || 'bg-slate-800'} border border-slate-600 flex items-center justify-center font-bold text-white text-[10px] select-none">
            ${e.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong class="font-bold text-white block">${e.nombre}</strong>
            <span class="text-[10px] text-slate-400 font-medium">${e.cargo}</span>
          </div>
        </div>
      </td>
      <td class="py-2.5 px-3">
        <select onchange="asignarHorarioEmpleado(${e.id}, this.value)" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-medium focus:outline-none focus:border-purple-500">
          <option value="Mañana (08:00 – 17:00)" ${e.turno.includes('Mañana') ? 'selected' : ''}>Mañana (08:00 – 17:00)</option>
          <option value="Tarde (14:00 – 22:00)" ${e.turno.includes('Tarde') ? 'selected' : ''}>Tarde (14:00 – 22:00)</option>
          <option value="Noche (22:00 – 06:00)" ${e.turno.includes('Noche') ? 'selected' : ''}>Noche (22:00 – 06:00)</option>
          <option value="Supervisión General" ${e.turno.includes('Supervisión') ? 'selected' : ''}>Supervisión General</option>
          <option value="${e.turno}" ${!['Mañana', 'Tarde', 'Noche', 'Supervisión'].some(x => e.turno.includes(x)) ? 'selected' : ''}>Personalizado: ${e.turno}</option>
        </select>
      </td>
      <td class="py-2.5 px-3 font-mono font-bold text-center text-slate-300">
        <span class="bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-[11px]">${e.pin}</span>
      </td>
      <td class="py-2.5 px-3 text-right space-x-1">
        <button onclick="cambiarPinEmpleadoAdmin(${e.id})" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition" title="Cambiar clave PIN">
          PIN
        </button>
        <button onclick="verResumenEmpleadoDirecto(${e.id})" class="px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-800 text-[11px] font-semibold transition" title="Ver desempeño y auditoría">
          Ver Resumen
        </button>
        ${esAdmin ? '' : `
          <button onclick="eliminarEmpleadoAdmin(${e.id})" class="px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-semibold transition" title="Eliminar de nómina">
            Eliminar
          </button>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function asignarHorarioEmpleado(empId, nuevoHorario) {
  const e = empleados.find(x => x.id === empId);
  if (!e) return;
  e.turno = nuevoHorario;
  guardarStorage('empleados', empleados, true);
  if (typeof renderListaEmpleados === 'function') renderListaEmpleados();

  UIModal.aviso({
    titulo: 'Horario Asignado',
    mensaje: `Se actualizó el horario de ${e.nombre} a "${nuevoHorario}".`,
    tipo: 'exito'
  });
}

function cambiarPinEmpleadoAdmin(empId) {
  const e = empleados.find(x => x.id === empId);
  if (!e) return;

  const nuevoPin = prompt(`Ingrese la nueva clave PIN de 4 dígitos para ${e.nombre}:`, e.pin);
  if (nuevoPin === null) return;

  if (!/^\d{4}$/.test(nuevoPin.trim())) {
    UIModal.aviso({ titulo: 'PIN Inválido', mensaje: 'El PIN debe contener exactamente 4 dígitos numéricos.', tipo: 'alerta' });
    return;
  }

  e.pin = nuevoPin.trim();
  guardarStorage('empleados', empleados, true);
  renderAdminEmpleados();
  UIModal.aviso({ titulo: 'PIN Actualizado', mensaje: `Nueva clave asignada a ${e.nombre}.`, tipo: 'exito' });
}

function abrirModalNuevoEmpleado() {
  const modal = document.getElementById('modal-admin-empleado-form');
  if (!modal) return;
  document.getElementById('ae-nombre').value = '';
  document.getElementById('ae-cargo').value = 'Recepcionista';
  document.getElementById('ae-turno').value = 'Mañana (08:00 – 17:00)';
  document.getElementById('ae-pin').value = '';
  modal.classList.remove('hidden');
}

function cerrarModalEmpleadoForm() {
  const modal = document.getElementById('modal-admin-empleado-form');
  if (modal) modal.classList.add('hidden');
}

function guardarNuevoEmpleado() {
  const nombre = document.getElementById('ae-nombre').value.trim();
  const cargo = document.getElementById('ae-cargo').value.trim() || 'Recepcionista';
  const turno = document.getElementById('ae-turno').value.trim() || 'Mañana (08:00 – 17:00)';
  const pin = document.getElementById('ae-pin').value.trim();

  if (!nombre) {
    UIModal.aviso({ titulo: 'Dato Requerido', mensaje: 'Ingrese el nombre completo del empleado.', tipo: 'alerta' });
    return;
  }
  if (!/^\d{4}$/.test(pin)) {
    UIModal.aviso({ titulo: 'PIN Requerido', mensaje: 'El PIN debe ser de 4 dígitos numéricos.', tipo: 'alerta' });
    return;
  }

  if (empleados.some(e => e.pin === pin)) {
    UIModal.aviso({ titulo: 'PIN en Uso', mensaje: 'Ese PIN ya está asignado a otro colaborador. Elija uno diferente.', tipo: 'alerta' });
    return;
  }

  const colores = ['bg-slate-800', 'bg-blue-800', 'bg-teal-800', 'bg-indigo-800', 'bg-sky-800', 'bg-slate-900'];
  const color = colores[empleados.length % colores.length];

  const nuevo = {
    id: Date.now(),
    nombre,
    cargo,
    turno,
    pin,
    color
  };

  empleados.push(nuevo);
  guardarStorage('empleados', empleados, true);
  cerrarModalEmpleadoForm();
  renderAdminEmpleados();
  if (typeof renderListaEmpleados === 'function') renderListaEmpleados();

  UIModal.aviso({
    titulo: 'Empleado Agregado',
    mensaje: `${nombre} fue incorporado a la nómina con horario "${turno}".`,
    tipo: 'exito'
  });
}

function eliminarEmpleadoAdmin(empId) {
  const e = empleados.find(x => x.id === empId);
  if (!e) return;
  if (e.cargo === 'Administración') {
    UIModal.aviso({ titulo: 'Acción No Permitida', mensaje: 'No es posible eliminar el perfil de Administradora General.', tipo: 'alerta' });
    return;
  }

  UIModal.confirmar({
    titulo: 'Eliminar Colaborador de Nómina',
    subtitulo: 'Hotel Norte · Administración',
    mensaje: `¿Confirma que desea retirar a "${e.nombre}" del sistema? No podrá autenticarse para abrir nuevos turnos.`,
    textoConfirmar: 'Sí, Eliminar de Nómina',
    tipo: 'peligro',
    onConfirm: () => {
      empleados = empleados.filter(x => x.id !== empId);
      guardarStorage('empleados', empleados, true);
      renderAdminEmpleados();
      if (typeof renderListaEmpleados === 'function') renderListaEmpleados();
      UIModal.aviso({ titulo: 'Colaborador Retirado', mensaje: `${e.nombre} fue eliminado de la nómina.`, tipo: 'info' });
    }
  });
}

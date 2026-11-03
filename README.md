# 🏨 Hotel Norte PMS — Sistema Integral de Gestión Hotelera (v2.0 Beta)

[![Test Suite](https://img.shields.io/badge/PMS%20Suite-6%2F6%20Passed-emerald.svg)](#)
[![Deployment](https://img.shields.io/badge/Demo%20En%20Vivo-GitHub%20Pages-blue.svg)](https://diegotorres006.github.io/HOTEL/)
[![Licencia](https://img.shields.io/badge/Licencia-Uso%20Interno-slate.svg)](#)

Acceso a la versión Beta web en vivo:  
🌐 **[https://diegotorres006.github.io/HOTEL/](https://diegotorres006.github.io/HOTEL/)**

---

## 📌 1. Visión General del Proyecto

**Hotel Norte PMS** es una solución de software empresarial de gestión hotelera desarrollada para optimizar la recepción, administración de habitaciones, control dual de cajas registradoras, ventas de bar/cafetería, facturación electrónica y sincronización en tiempo real con canales de venta externos (Booking.com).

Esta versión (v2.0 Beta) representa una refactorización estructural completa desde cero, migrando componentes monolíticos a una arquitectura altamente modular, desacoplada y mantenible con persistencia atómica y tolerancia a fallos.

---

## 🚀 2. Características Principales y Reglas de Negocio

### 💵 2.1. Cajas Duales Independientes (Hospedaje & Bar)
- **Caja de Hospedaje:** Fondo fijo de apertura de **$200.00 USD**. Recauda alquiler de habitaciones, abonos y penalizaciones.
- **Caja del Bar:** Fondo fijo de apertura de **$50.00 USD**. Recauda venta de bebidas, snacks y cafetería en efectivo.
- **Cierre y Rotación de Turno:**
  - El sistema calcula el total en gaveta: $\text{Total} = \text{Fondo Base} + \text{Recaudado}$.
  - Al cerrar turno, se extrae el excedente recaudado para entrega a la Administradora.
  - La caja queda automáticamente nivelada con su fondo base exacto para el relevo del siguiente empleado.

### 🔄 2.2. Multi-Alquiler en el Mismo Día (`estanciasPasadas`)
- Habitaciones alquiladas por horas o períodos cortos (ej. de 08:00 a 10:00) quedan inmediatamente disponibles para un segundo o tercer huésped en el mismo día.
- Al realizar el check-out, el sistema archiva la estancia en el array histórico `estanciasPasadas` de la habitación correspondiente, preservando la recaudación de cada turno sin colisiones ni sobreescrituras.

### 🍸 2.3. Gestión y Venta de Bar / Cafetería
- **Venta Rápida:** Los recepcionistas disponen de un catálogo visual donde añaden productos con un solo clic.
- **Cargos Directos:** Permite cobrar de inmediato (Efectivo/Transferencia/Tarjeta) o cargar el consumo directamente a la cuenta de la habitación del huésped con saldo pendiente.
- **Protección de Precios e Inventario:** Los recepcionistas no pueden alterar precios ni generar ventas con stock agotado. El stock se descuenta en tiempo real.

### 👩‍💼 2.4. Portal de Administración Integral
- **Inventario:** Modificación de stock, precio unitario, costo y alta/baja de productos.
- **Personal:** Asignación de horarios, turnos, credenciales PIN y auditoría de desempeño.
- **Habitaciones:** Configuración de tarifas, tipos de cama, piso y estado.
- **Cajas:** Ajuste de fondos fijos y auditoría de arqueos pasados.

### 🌐 2.5. Sincronización Automática con Booking.com
- **Monitoreo en Tiempo Real:** Comunicación continua mediante extensión y servidor puente en el puerto local `3847`.
- **Asignación vs Check-in:** Una reserva puede pre-asignarse a una habitación sin forzar el check-in (el check-in se formaliza cuando el huésped se presenta físicamente en recepción).
- **Filtros Temporales:** Exclusión automática de reservas de fechas pasadas para mantener el rack limpio y operativo.

### 🖥️ 2.6. Interfaz Corporativa de Alta Densidad (Optimizado para Pantallas 2K / 32")
- Diseño oscuro ejecutivo slate-blue (`#0b1324`, `#132038`, `#162947`).
- Aprovechamiento del 100% del ancho de pantalla sin márgenes residuales ni barras de desplazamiento innecesarias en resolución 2K.
- Columna diferenciada de *Descripción* técnica del inmueble frente a *Observaciones* del huésped.

---

## 🏗️ 3. Arquitectura del Código

El proyecto ha sido descompuesto de componentes de más de 1,000 líneas a módulos especializados de responsabilidad única (Single Responsibility Principle):

```
C:\HOTEL-NORTE/
├── assets/                          # Estilos CSS, fuentes corporativas e íconos SVG
├── booking_chrome_extension/         # Extensión Chrome para scraping y sincronización en tiempo real
├── data/                            # Directorio de persistencia atómica y copias de seguridad
├── scripts/                         # Suites de pruebas automáticas y compiladores de vistas
│   ├── compile-templates.js         # Generador de templates HTML embebidos en UTF-8
│   └── test_pms_suite.js            # Suite de pruebas unitarias y de integración de reglas de negocio
├── server/                          # Backend en Node.js (cero dependencias externas pesadas)
│   ├── config.js                    # Parámetros del servidor, whitelist CORS y rutas de almacenamiento
│   ├── database/
│   │   └── storage-engine.js        # Motor de persistencia transaccional con swap atómico y snapshots
│   ├── routes/
│   │   ├── db-routes.js             # Endpoints /api/db/load-all, /api/db/save, /api/db/backup
│   │   ├── booking-routes.js        # Endpoints /api/booking (status, reservas, sync, ack)
│   │   └── static-routes.js         # Servidor de archivos estáticos resiliente para red local
│   └── server.js                    # Orquestador del servidor HTTP
├── src/                             # Lógica de Frontend desacoplada
│   ├── components/                  # Vistas del Rack de Habitaciones, Tabla Hoja y Modales base
│   │   ├── ComponentLoader.js       # Registro de vistas precompiladas para ejecución offline y GitHub Pages
│   │   ├── RoomRackView.js          # Renderizado de tarjetas de habitaciones por piso
│   │   ├── RoomTableView.js         # Renderizado de sábana de registro extendida 2K
│   │   └── UIModal.js               # Sistema de diálogos modales corporativos nativos
│   ├── config/
│   │   └── constants.js             # Distribución oficial (35 habitaciones), productos bar y tarifas
│   ├── modules/
│   │   ├── admin/                   # Módulos del Administrador (Core, Stock, Empleados, Métricas, Habitaciones)
│   │   ├── bar/                     # Catálogo de venta y modal de despacho rápido
│   │   ├── billing/                 # Cliente de Facturación Electrónica SRI (D2FAC)
│   │   ├── booking/                 # Integración API y modal de conciliación de reservas
│   │   ├── rooms/                   # Navegación, Check-in, Detalle, Reservas y Check-out (multi-stay)
│   │   └── shifts/                  # Autenticación, apertura/cierre de turnos y cajas duales
│   ├── state/
│   │   └── store.js                 # Estado central reactivo sincronizado con LocalStorage y Backend
│   └── utils/
│       ├── formatters.js            # Moneda, fechas ISO, cédulas/RUC y porcentajes
│       ├── storage.js               # Abstracción bidireccional de persistencia
│       └── validators.js            # Validación de cédula ecuatoriana, teléfonos y correos
├── views/                           # Plantillas HTML semánticas
├── index.html                       # Entry point principal optimizado con rutas relativas
├── INICIAR_HOTEL_NORTE.bat          # Lanzador local de un solo clic para Windows
└── server_booking_bridge.js         # Punto de entrada del backend Node.js
```

---

## 🧪 4. Verificación y Pruebas Automatizadas

El proyecto incluye un arnés de pruebas de integración (`scripts/test_pms_suite.js`) que valida la consistencia de las reglas de negocio críticas en Node.js:

```bash
npm test
```

### Casos de Prueba Verificados (6/6):
1. **Distribución Oficial:** Verificación estricta de las 35 habitaciones configuradas y sus características.
2. **Cajas Duales:** Validación de fondos de apertura ($200.00 Hospedaje / $50.00 Bar).
3. **Control de Sesión:** Apertura de turno con operador asignado y auditoría.
4. **Independencia Contable:** Separación de ingresos por hospedaje vs bar y cálculo de gaveta.
5. **Multi-Alquiler Diario:** Verificación del array `estanciasPasadas` tras múltiples check-in / check-out en una misma habitación durante la jornada.
6. **Ventas de Bar & Stock:** Descuento instantáneo de inventario y registro de transacciones.

---

## 💻 5. Instrucciones de Ejecución

### Modo Web Directo (GitHub Pages)
Abra cualquier navegador moderno e ingrese a:  
**[https://diegotorres006.github.io/HOTEL/](https://diegotorres006.github.io/HOTEL/)**  
*(En este modo el sistema opera con el motor de almacenamiento local en el navegador).*

### Modo Servidor Local (Recepción Hotel Norte con Sincronizador de Booking)
1. Abra la terminal en `C:\HOTEL-NORTE` o ejecute el archivo:
   ```cmd
   INICIAR_HOTEL_NORTE.bat
   ```
2. O manualmente vía Node:
   ```bash
   node server_booking_bridge.js
   ```
3. Abra su navegador en `http://localhost:3847`.
4. El servidor local garantiza la persistencia en disco duro (`data/`) y la comunicación bidireccional con la extensión de Booking.com.

---

## 🔒 6. Seguridad y Resiliencia de Datos
- **Manejo de Errores Silencioso:** Sin caídas de interfaz ante pérdida momentánea de red.
- **Escritura Atómica en Disco:** Las transacciones se escriben en archivos temporales antes de renombrarse de manera atómica, previniendo corrupción de base de datos en caso de corte de energía eléctrica.
- **Backups Automáticos:** El servidor genera snapshots periódicos de seguridad rotativos en `data/backups/`.

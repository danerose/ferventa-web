# 📋 Lista Maestra de Tareas (TODO) — Feedback y Requerimientos del Cliente

Este documento consolida y estructura el feedback recibido del cliente para **Ferventa (Taller & POS)**, separando las responsabilidades de **Backend (API)** y **Frontend (Web)**, e indicando el estado actual de cada tarea.

---

## 🧭 Resumen de Estatus

* **Backend (`ferventa-api`)**: La arquitectura, modelos, endpoints de seguridad por rol, bitácora de auditoría, recepciones en borrador, cajas QR, kiosco con PIN y deduplicación inteligente de vehículos ya están implementados y listos para consumo.
* **Frontend (`ferventa-web`)**: Pendiente de integrar las vistas de Kiosco, impresión de tickets QR, botón 4% en POS, corrección de selectores y diseño móvil para mecánico y almacenista.

---

## 1. 👥 Perfiles, Permisos y Seguridad por Rol

### 👨‍🔧 Rol Mecánico
- [x] **[API] Aislamiento de órdenes:** En `GET /maintenance`, el mecánico únicamente puede ver las órdenes que tiene asignadas a su nombre (`assignedMechanic`).
- [x] **[API] Operativa permitida:**
  - [x] Recepción directa en taller (Walk-in) en `POST /maintenance/direct-reception`.
  - [x] Check-in de citas agendadas en `PATCH /appointments/:id/check-in`.
  - [x] Subir evidencias fotográficas y notas de diagnóstico.
- [x] **[API] Restricciones estrictas:**
  - [x] Bloqueo para reasignar mecánico (`403 Forbidden`).
  - [x] Bloqueo para modificar costo de mano de obra (`laborCost`) (`403 Forbidden`).
  - [x] Bloqueo para vincular o alterar venta/cobro (`saleId`).
  - [x] Bloqueo para enviar notificaciones de WhatsApp al cliente.
- [x] **[FRONT] Vista móvil optimizada para Mecánico:**
  - [x] Diseñar vista móvil simplificada enfocada en la tarjeta del vehículo, checklist de recepción, subida rápida de fotos y notas de avance sin recargar de elementos innecesarios.
  - [x] Ocultar opciones de cobro, reasignación y notificación en el drawer/detalle de orden cuando el usuario sea mecánico. Bloqueo de cambios de estatus si la orden ya fue entregada.
  - [x] Visualizador de disponibilidad y carga de trabajo del taller (WorkshopLoadModal) a 7 días.

---

### 🧑‍💼 Rol Vendedor
- [x] **[API] Gestión de Citas:** Permisos para agendar, reagendar, cancelar (`PATCH /appointments/:id/cancel`) y marcar *No Asistió*.
- [x] **[API] Taller & Mantenimiento:** Consulta de vehículos y asignación de mecánico.
- [x] **[API] Punto de Venta (POS):** Permiso para venta directa, cobro y levantamiento de pedidos especiales (`/orders`).
- [x] **[API] Restricciones de Catálogo e Inventario:**
  - [x] Puede dar de alta marcas y categorías.
  - [x] No puede modificar ni eliminar productos del catálogo existente.
  - [x] No puede recibir mercancía directo a stock activo (solo registra en `draft`).
  - [x] No puede eliminar movimientos de Kardex.
  - [x] No puede administrar usuarios.
- [x] **[FRONT] Ajuste de Tema en Perfil de Vendedor:**
  - [x] Permitir alternar entre tema Dark y Light directamente con 1-clic desde la Sidebar y barra de ajustes.

---

### 📦 Rol Almacenista
- [x] **[API] Catálogo e Inventario en Borrador:**
  - [x] Permiso para crear marcas y categorías.
  - [x] Permiso para capturar recepción física en estado `draft`.
  - [x] Permiso para escanear y abrir cajas de lotes aprobados (`POST /inventory/boxes/open`).
  - [x] Bloqueo de edición y eliminación de productos de catálogo.
- [x] **[FRONT] Vista móvil optimizada para Almacenista:**
  - [x] Interfaz móvil responsiva para conteo rápido de piezas en pasillo, captura ágil de remisiones en borrador y escaneo/apertura de cajas QR (`POST /inventory/boxes/open`).

---

### 👑 Rol Administrador
- [x] **[API] Control Total:**
  - [x] Único rol facultado para aprobar (`PATCH /inventory/receptions/:id/approve`) o rechazar (`reject`) recepciones de mercancía en borrador.
  - [x] Control exclusivo para editar productos, precios y eliminar registros.
  - [x] Acceso exclusivo a la Bitácora de Auditoría (`GET /audit-logs`).
- [x] **[FRONT] Bandeja de Aprobación de Recepciones:**
  - [x] Panel en compras/almacén para revisar remisiones capturadas en borrador y botones de *Aprobar* / *Rechazar con motivo*.

---

## 2. 🚗 Clientes, Citas y Deduplicación Inteligente de Vehículos

- [x] **[API] Identificador Unico:** Teléfono celular como identificador principal del cliente.
- [x] **[API] Deduplicación Inteligente (Smart Match):**
  - [x] Eliminada la restricción rígida que bloqueaba registros por repetición de últimos 4 dígitos de serie/placas.
  - [x] Si el cliente ya tiene un vehículo registrado con marca y modelo idénticos o cercanos (ej. `ITALIKA RUNNER` vs `ITALAKI RUNNER 2026`), el sistema reutiliza ese vehículo para no duplicar.
  - [x] Si los campos varían sustancialmente o el cliente tiene otro modelo/marca, se registra como una nueva unidad del cliente.
  - [x] Si el cliente tiene dos unidades del mismo modelo con números de serie explícitos distintos (flotilla), el sistema distingue las unidades.
  - [x] Campos `year`, `serialNumberLastFour` y `color` ahora opcionales en API y base de datos (solo `brand` y `model` obligatorios).
- [x] **[FRONT] Citas y Recepción de Vehículos:**
  - [x] Mantenido el flujo validado y probado sin alterar el comportamiento existente según instrucción del usuario.

---

## 3. 📦 Inventario: Recepciones en Borrador, Cajas QR y Precios de Mostrador

- [x] **[API] Recepción Física en Borrador (`draft`):**
  - [x] `POST /inventory/receptions` guarda la remisión sin sumar piezas al stock vendible de mostrador.
  - [x] Cada bulto/caja genera un `boxCode` único (ej. `BOX-M8B2X-1-042`).
- [x] **[API] Aprobación por Administrador:**
  - [x] `PATCH /inventory/receptions/:id/approve` valida y aprueba el lote, dejándolo listo para impresión de etiquetas QR.
- [x] **[API] Apertura de Caja y Unificación de Precios:**
  - [x] `POST /inventory/boxes/open` recibe `{ boxCode }`.
  - [x] Suma la cantidad de piezas de la caja al `stock` activo del producto.
  - [x] Actualiza el precio de venta (`sellingPrice`) del producto al nuevo precio del lote, nivelando tanto las piezas nuevas como el remanente en exhibición.
  - [x] Genera el movimiento de entrada en Kardex.
- [x] **[FRONT] Generador e Impresión de Tickets QR para Cajas:**
  - [x] Modal y plantilla de impresión para generar las etiquetas adhesivas térmicas con el código QR y texto (`boxCode`, producto, piezas) de las cajas aprobadas.
- [x] **[FRONT] Lector / Escáner de Cajas en Mostrador:**
  - [x] Modal y botón "Abrir Caja QR" en el módulo de inventario (`POST /inventory/boxes/open`).

---

## 4. 📲 Taller: Historial Acumulativo de Notificaciones

- [x] **[API] Bitácora de Envíos en Mantenimiento:**
  - [x] Arreglo `notificationHistory` en el modelo `Maintenance` guardando fecha (`sentAt`), usuario emisor (`sentBy`), canal (`whatsapp`), mensaje y notas.
  - [x] Campo `notifiedAt` con la fecha del envío más reciente.
  - [x] Poblado automático de los datos del usuario que notificó.
- [x] **[FRONT] Indicador Visual de Notificaciones:**
  - [x] En la tabla y detalle de órdenes de servicio, mostrar un badge con el número de notificaciones enviadas y fecha/hora de la última notificación.
  - [x] Drawer/Modal con el historial detallado de notificaciones para soporte ante reclamos del cliente.

---

## 5. ⏰ Kiosco de Asistencia con PIN de 4 Dígitos (Tableta en Sucursal)

- [x] **[API] Modelo de Usuario:** Campo `accessPin` (4 dígitos numéricos) administrable desde usuarios.
- [x] **[API] Endpoint de Empleados para Kiosco:**
  - [x] `GET /attendance/kiosk/employees?branchId=...` devuelve la lista de empleados de la sucursal y su estado en vivo (`working`, `on_break`, `completed`, `off_shift`).
- [x] **[API] Registro de Asistencia por PIN:**
  - [x] `POST /attendance/kiosk/clock` valida `userId`, `branchId` y `pin`, registrando la acción correspondiente (`clock-in`, `clock-out`, `break-start`, `break-end`) y grabando auditoría.
- [x] **[FRONT] Pantalla de Kiosco para Tableta:**
  - [x] Rutas dedicadas `/asistencia/kiosco` y `/kiosco` en pantalla completa y modo táctil.
  - [x] Selector de sucursal inicial (persistido en `localStorage`).
  - [x] Grid táctil con tarjetas de empleados (nombre, foto, rol y estado actual).
  - [x] Teclado numérico virtual táctil (0-9) para teclear el PIN de 4 dígitos.
  - [x] Botones contextuales habilitados según el estado del empleado (Entrada, Iniciar Comida, Regreso Comida, Salida).

---

## 6. 🛡️ Bitácora de Auditoría del Sistema (Audit Logs)

- [x] **[API] Módulo Global de Auditoría:**
  - [x] Modelo `AuditLog` y servicio centralizado `auditLogsService.logAction(...)`.
  - [x] Registro automático de acciones críticas.
  - [x] Endpoint `GET /audit-logs` exclusivo para Admin con filtros por módulo, acción, usuario, fechas y búsqueda.
- [x] **[FRONT] Pantalla de Bitácora de Auditoría (Solo Admin):**
  - [x] Vista `/admin/auditoria` con tabla filtrable por fecha, usuario, módulo y tipo de acción para supervisión de eventos críticos con visor JSON técnico.
  - [x] Modal contextual de auditoría en drawers de Mantenimiento, Ventas y Citas exclusivo para Admin.

---

## 7. 🛒 Tareas Específicas de Frontend y Punto de Venta (POS)

- [x] **[API] Corrección de Cancelación de Venta:**
  - [x] Verificado el endpoint `POST /sales/:id/cancel` con reversión de stock al almacén, registro de motivo y log en auditoría.
- [x] **[FRONT] Punto de Venta - 4% Comisión Integrado en Precios:**
  - [x] El recargo del 4% se calcula e integra directamente en el precio unitario del producto/servicio (`basePrice * 1.04`), sin mostrar cargos ni comisiones separadas en ticket.
- [x] **[FRONT] Selector de Categoría en Modal de Producto:**
  - [x] Corregido el ciclo de vida del modal para que al abrirse no pise ni pierda marcas/categorías.
- [x] **[FRONT] Mapeo de Saldo en Kardex (Movimientos de Inventario):**
  - [x] Mapeo exacto de `m.newStock ?? m.balanceAfter` en la columna de saldo resultante.
- [x] **[FRONT] Comprobante de Recepción de Servicio (PDF / Impresión Térmica):**
  - [x] Incorporado recuadro con términos y condiciones, cláusulas legales de taller automotriz bajo NOM-174-SCFI y espacio formal para firma de conformidad del cliente y taller.

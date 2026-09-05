# Documentación de API Backend — Ferventa Web

Este documento define la especificación técnica de la API REST del backend de Ferventa, incluyendo autenticación, encabezados obligatorios, rutas disponibles y estructuras de datos (payloads) de solicitud y respuesta.

---

## 1. Configuración Base y Encabezados Globales

- **Base URL:** Variable de entorno `VITE_API_URL` (por defecto: `http://localhost:3000`).
- **Encabezados Requeridos en Rutas Protegidas:**
  - `Authorization: Bearer <accessToken>`
  - `x-branch-id: <activeBranchId>` (Identificador MongoDB ObjectId de 24 caracteres de la sucursal activa).
  - `Content-Type: application/json`

---

## 2. Autenticación y Sesión (`/auth`)

### `POST /auth/login`
Inicia sesión en la plataforma.
- **Request Body:**
  ```json
  {
    "email": "admin@ferventa.com",
    "password": "AdminPassword123!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUz...",
    "refreshToken": "eyJhbGciOiJIUz...",
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "Administrador",
      "email": "admin@ferventa.com",
      "role": "admin",
      "branches": ["60d0fe4f5311236168a109cb"]
    }
  }
  ```

### `POST /auth/refresh`
Refresca el token de acceso expirado.
- **Request Body:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUz..."
  }
  ```

---

## 3. Sucursales (`/branches`)

### `GET /branches`
Lista todas las sucursales configuradas en el sistema.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "60d0fe4f5311236168a109cb",
        "name": "Sucursal Central",
        "address": "Av. Principal 123",
        "phone": "9991234567",
        "isActive": true
      }
    ]
  }
  ```

### `POST /system/migration/branches`
Ejecuta la migración de sucursales del sistema.

---

## 4. Citas y Horarios (`/appointments`)

### `GET /appointments/schedule`
Obtiene la configuración semanal de horarios y capacidad de bahías.
### `PUT /appointments/schedule`
Actualiza la configuración de horarios por día de la semana.
- **Request Body:** Array de objetos de configuración por día.

### `GET /appointments/holidays` & `POST /appointments/holidays` & `DELETE /appointments/holidays/:id`
Gestión de días inhábiles o festivos.

### `GET /appointments`
Lista citas con filtros opcionales.
- **Query Params:** `search`, `status`, `fromDate`, `toDate`.

### `PUT /appointments/:id/status`
Actualiza el estatus de una cita (`pending`, `approved`, `rejected`, `cancelled`, `completed`, `rescheduled`).
- **Request Body:**
  ```json
  {
    "status": "approved",
    "assignedMechanic": "Juan Pérez",
    "notes": "Aprobado para bahía 1"
  }
  ```

### `POST /appointments/admin/direct`
Recepción directa de un vehículo en taller sin cita previa.

### `GET /appointments/customer-lookup?phone={phone}`
Busca historial de un cliente por su número telefónico.

---

## 5. Portal de Clientes Público

### `POST /appointments/book`
Agendamiento público de cita por parte de un cliente.
### `GET /appointments/status?phone={phone}`
Consulta de estado de citas por teléfono.
### `GET /appointments/occupied-slots?date={YYYY-MM-DD}`
Horarios y horas ocupadas para una fecha dada.
### `GET /maintenance/track?phone={phone}`
Seguimiento de orden de mantenimiento activo.

---

## 6. Órdenes de Mantenimiento (`/maintenance`)

### `GET /maintenance/orders`
Lista las órdenes de trabajo activas en taller.
### `GET /maintenance/orders/:id`
Detalle completo de una orden de servicio.
### `POST /maintenance/orders/:id/mechanic`
Asigna o reasigna un mecánico.
### `POST /maintenance/orders/:id/status`
Actualiza la etapa de mantenimiento (`reception`, `diagnosis`, `in_progress`, `quality_check`, `ready`, `delivered`).
### `POST /maintenance/orders/:id/parts`
Agrega o actualiza refacciones utilizadas.
### `POST /maintenance/orders/:id/services`
Agrega o actualiza servicios/paquetes aplicados.
### `POST /maintenance/orders/:id/advance`
Registra un abono o anticipo económico.
### `POST /maintenance/orders/:id/checklist`
Actualiza la inspección de puntos de seguridad.

---

## 7. Inventario y Proveedores (`/inventory`)

### `GET /inventory/products` & `POST /inventory/products` & `PUT /inventory/products/:id` & `DELETE /inventory/products/:id`
CRUD de refacciones, partes y productos con SKU, stock mínimo, precio y costo.
### `GET /inventory/suppliers` & `POST /inventory/suppliers` & `PUT /inventory/suppliers/:id` & `DELETE /inventory/suppliers/:id`
CRUD de proveedores.
### `GET /inventory/movements` & `POST /inventory/movements`
Registro y consulta de movimientos de almacén (entradas, salidas, ajustes).

---

## 8. Punto de Venta y Ventas (`/pos` y `/sales`)

### `POST /pos/checkout`
Registra una venta de mostrador (refacciones + servicios).
- **Request Body:**
  ```json
  {
    "items": [
      { "product": "60d...", "quantity": 2, "unitPrice": 150.0 }
    ],
    "paymentMethod": "cash",
    "amountPaid": 300.0,
    "change": 0.0
  }
  ```
### `GET /sales` & `GET /sales/:id`
Consulta de historial de notas de venta y tickets emitidos.

---

## 9. Pedidos Especiales (`/special-orders`)

### `GET /special-orders`
Lista órdenes especiales de refacciones bajo encargo.
### `POST /special-orders`
Crea una nueva orden de pedido especial con anticipo.
### `PUT /special-orders/:id/status`
Actualiza el estado (`quote_pending`, `ordered`, `received_branch`, `delivered_customer`, `cancelled`).
### `POST /special-orders/:id/payments`
Registra un pago adicional o liquidación de la orden especial.
### `POST /special-orders/:id/cancel`
Cancela la orden especial registrando motivo.
### `POST /special-orders/:id/direct-reception`
Recepción directa en almacén de la pieza encargada.

---

## 10. Asistencia del Personal (`/attendance`)

### `GET /attendance/records`
Lista registros de asistencia con filtros de fecha y empleado.
### `POST /attendance/check-in`
Registro de entrada de turno.
### `POST /attendance/check-out`
Registro de salida de turno.
### `GET /attendance/today`
Estado de asistencia del día en curso para la sucursal activa.
### `PUT /attendance/records/:id`
Edición administrativa de un registro de asistencia.

---

## 11. Usuarios y Personal (`/users`)

### `GET /users` & `POST /users` & `PUT /users/:id` & `DELETE /users/:id`
Gestión de cuentas de personal, roles (`admin`, `mecanico`, `recepcion`) y sucursales asignadas.

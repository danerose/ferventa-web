export const APP_ROUTES = {
  PORTAL: '/',
  LOGIN: '/login',
  ADMIN: {
    ROOT: '/admin',
    CITAS: '/admin/citas',
    OPERACIONES: '/admin/operaciones',
    POS: '/admin/pos',
    INVENTARIO: '/admin/inventario',
    USUARIOS: '/admin/usuarios',
    HORARIOS: '/admin/horarios',
    SETTINGS: '/admin/settings',
    MANTENIMIENTO: '/admin/mantenimiento',
    ASISTENCIA: '/admin/asistencia',
    PEDIDOS: '/admin/pedidos',
  },
} as const;

export type AppRoute = typeof APP_ROUTES;

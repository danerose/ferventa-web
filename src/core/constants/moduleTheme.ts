import type { IconName } from '@/app/presentation/components/atoms/Icon/IconAtom';

export type ModuleKey =
  | 'pos'
  | 'workshop'
  | 'appointments'
  | 'inventory'
  | 'specialOrders'
  | 'users'
  | 'attendance'
  | 'settings'
  | 'operations';

export interface ModuleTheme {
  key: ModuleKey;
  title: string;
  subtitle: string;
  icon: IconName;
  bgSoft: string;
  text: string;
  border: string;
  badgeColor: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
}

export const MODULE_THEMES: Record<ModuleKey, ModuleTheme> = {
  pos: {
    key: 'pos',
    title: 'Punto de Venta',
    subtitle: 'Venta de refacciones en mostrador, emisión de tickets y control de caja.',
    icon: 'ShoppingCart',
    bgSoft: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
    badgeColor: 'success',
  },
  workshop: {
    key: 'workshop',
    title: 'Mantenimientos Activos',
    subtitle: 'Gestión del flujo de trabajo del taller de reparación en tiempo real.',
    icon: 'Wrench',
    bgSoft: 'bg-primary/10 dark:bg-primary/20',
    text: 'text-primary',
    border: 'border-primary/20 dark:border-primary/30',
    badgeColor: 'primary',
  },
  appointments: {
    key: 'appointments',
    title: 'Gestión de Citas',
    subtitle: 'Recepción, calendarización y asignación de citas del centro de servicio.',
    icon: 'Calendar',
    bgSoft: 'bg-info/10 dark:bg-info/20',
    text: 'text-info',
    border: 'border-info/20 dark:border-info/30',
    badgeColor: 'info',
  },
  inventory: {
    key: 'inventory',
    title: 'Inventario de Refacciones',
    subtitle: 'Control de stock, alertas de mínimo, entradas, salidas y catálogo de autopartes.',
    icon: 'Boxes',
    bgSoft: 'bg-secondary/10 dark:bg-secondary/20',
    text: 'text-secondary',
    border: 'border-secondary/20 dark:border-secondary/30',
    badgeColor: 'secondary',
  },
  specialOrders: {
    key: 'specialOrders',
    title: 'Pedidos',
    subtitle: 'Gestión de apartados y refacciones bajo encargo con regla del 50% de anticipo.',
    icon: 'PackageOpen',
    bgSoft: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20 dark:border-indigo-500/30',
    badgeColor: 'primary',
  },
  users: {
    key: 'users',
    title: 'Gestión de Usuarios',
    subtitle: 'Administración de credenciales, roles y accesos a sucursales.',
    icon: 'Users',
    bgSoft: 'bg-accent/10 dark:bg-accent/20',
    text: 'text-accent',
    border: 'border-accent/20 dark:border-accent/30',
    badgeColor: 'accent',
  },
  attendance: {
    key: 'attendance',
    title: 'Control de Asistencia',
    subtitle: 'Registro de asistencia, turnos y retardos de colaboradores por sucursal.',
    icon: 'Clock',
    bgSoft: 'bg-warning/10 dark:bg-warning/20',
    text: 'text-warning',
    border: 'border-warning/20 dark:border-warning/30',
    badgeColor: 'warning',
  },
  settings: {
    key: 'settings',
    title: 'Configuración del Sistema',
    subtitle: 'Preferencias de tickets térmicos, sucursales y parámetros operativos.',
    icon: 'Settings',
    bgSoft: 'bg-neutral/10 dark:bg-neutral/20',
    text: 'text-neutral-content/80',
    border: 'border-neutral/20 dark:border-neutral/30',
    badgeColor: 'neutral',
  },
  operations: {
    key: 'operations',
    title: 'Tablero de Operaciones',
    subtitle: 'Métricas clave, productividad y volumen de servicio en tiempo real.',
    icon: 'BarChart2',
    bgSoft: 'bg-primary/10 dark:bg-primary/20',
    text: 'text-primary',
    border: 'border-primary/20 dark:border-primary/30',
    badgeColor: 'primary',
  },
};

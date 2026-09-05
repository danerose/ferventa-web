export const SpecialOrderStatus = {
  ORDER_PLACED: 'order_placed',
  ORDERED: 'ordered',
  IN_TRANSIT: 'in_transit',
  IN_BRANCH: 'in_branch',
  READY_FOR_PICKUP: 'ready_for_pickup',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type SpecialOrderStatus = (typeof SpecialOrderStatus)[keyof typeof SpecialOrderStatus];

export const SPECIAL_ORDER_STATUS_LABELS: Record<SpecialOrderStatus | string, string> = {
  [SpecialOrderStatus.ORDER_PLACED]: 'Pedido Levantado',
  [SpecialOrderStatus.ORDERED]: 'Pedido a Proveedor',
  [SpecialOrderStatus.IN_TRANSIT]: 'En Tránsito',
  [SpecialOrderStatus.IN_BRANCH]: 'En Sucursal',
  [SpecialOrderStatus.READY_FOR_PICKUP]: 'Pendiente de Entrega',
  [SpecialOrderStatus.DELIVERED]: 'Entregado',
  [SpecialOrderStatus.CANCELLED]: 'Cancelado',
};

export const SPECIAL_ORDER_STATUS_COLORS: Record<
  SpecialOrderStatus | string,
  { bg: string; text: string; border: string; badgeVariant: 'soft' | 'solid' | 'outline' }
> = {
  [SpecialOrderStatus.ORDER_PLACED]: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/60',
    badgeVariant: 'soft',
  },
  [SpecialOrderStatus.ORDERED]: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/60',
    badgeVariant: 'soft',
  },
  [SpecialOrderStatus.IN_TRANSIT]: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/60',
    badgeVariant: 'soft',
  },
  [SpecialOrderStatus.IN_BRANCH]: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800/60',
    badgeVariant: 'soft',
  },
  [SpecialOrderStatus.READY_FOR_PICKUP]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    badgeVariant: 'soft',
  },
  [SpecialOrderStatus.DELIVERED]: {
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    badgeVariant: 'soft',
  },
  [SpecialOrderStatus.CANCELLED]: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/60',
    badgeVariant: 'soft',
  },
};

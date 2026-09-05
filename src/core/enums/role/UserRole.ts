export const UserRole = {
  Admin: 'admin',
  Receptionist: 'receptionist',
  Mechanic: 'mechanic',
  Warehouse: 'warehouse',
  Cashier: 'cashier',
  Seller: 'seller',
  Customer: 'customer',
  User: 'user',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_LABELS: Record<UserRole | string, string> = {
  [UserRole.Admin]: 'Administrador',
  [UserRole.Receptionist]: 'Recepción',
  [UserRole.Mechanic]: 'Mecánico',
  [UserRole.Warehouse]: 'Almacén',
  [UserRole.Cashier]: 'Cajero',
  [UserRole.Seller]: 'Vendedor',
  [UserRole.Customer]: 'Cliente',
  [UserRole.User]: 'Usuario',
};

export const USER_ROLE_COLORS: Record<
  UserRole | string,
  {
    bg: string;
    text: string;
    border: string;
    badgeColor: 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  }
> = {
  [UserRole.Admin]: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    badgeColor: 'primary',
  },
  [UserRole.Receptionist]: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    badgeColor: 'info',
  },
  [UserRole.Mechanic]: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    badgeColor: 'warning',
  },
  [UserRole.Warehouse]: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    badgeColor: 'secondary',
  },
  [UserRole.Cashier]: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/20',
    badgeColor: 'accent',
  },
  [UserRole.Seller]: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    badgeColor: 'success',
  },
  [UserRole.Customer]: {
    bg: 'bg-base-200',
    text: 'text-base-content/80',
    border: 'border-base-300',
    badgeColor: 'neutral',
  },
  [UserRole.User]: {
    bg: 'bg-base-200',
    text: 'text-base-content/80',
    border: 'border-base-300',
    badgeColor: 'neutral',
  },
};


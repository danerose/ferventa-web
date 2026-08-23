import { UserRole } from '@/core/enums/index';

const ROLE_LABELS: Record<string, string> = {
  [UserRole.Admin]: 'Administrador',
  [UserRole.Receptionist]: 'Recepción',
  [UserRole.Mechanic]: 'Mecánico',
  [UserRole.Warehouse]: 'Almacén',
  [UserRole.Cashier]: 'Cajero',
  [UserRole.Seller]: 'Vendedor',
  [UserRole.Customer]: 'Cliente',
  [UserRole.User]: 'Usuario',
  // Variantes comunes del backend
  administrator: 'Administrador',
  reception: 'Recepción',
  vendor: 'Vendedor',
  salesperson: 'Vendedor',
  sales: 'Ventas',
};

/**
 * Traduce cualquier rol (objeto, string o enum) a un nombre legible en español.
 */
export const translateRole = (rawRole?: unknown): string => {
  if (!rawRole) return 'Colaborador';

  let roleName = '';
  if (typeof rawRole === 'string') {
    roleName = rawRole;
  } else if (typeof rawRole === 'object' && rawRole !== null && 'name' in rawRole) {
    roleName = String((rawRole as { name: unknown }).name);
  }

  if (!roleName) return 'Colaborador';

  const lower = roleName.toLowerCase().trim();
  if (ROLE_LABELS[lower]) {
    return ROLE_LABELS[lower];
  }

  // Si es un ObjectId de Mongo
  if (/^[0-9a-fA-F]{24}$/.test(lower)) {
    return 'Colaborador';
  }

  return roleName;
};

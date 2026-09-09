import { UserRole } from '@/core/enums';
import { ROLE_PERMISSIONS, type Permission } from '@/core/constants';

export interface HasRoleCandidate {
  role?: UserRole | string | { name?: string };
}

/**
 * Resolves a UserRole enum value from a user entity, raw role string, or role object
 */
export function resolveUserRole(candidate: HasRoleCandidate | null | undefined): UserRole | null {
  if (!candidate || !candidate.role) return null;

  let rawRole: string;
  if (typeof candidate.role === 'string') {
    rawRole = candidate.role.toLowerCase().trim();
  } else if (typeof candidate.role === 'object' && candidate.role && 'name' in candidate.role) {
    rawRole = String(candidate.role.name || '').toLowerCase().trim();
  } else {
    return null;
  }

  // Aliases normalization
  if (rawRole === 'administrator' || rawRole === 'admin') return UserRole.Admin;
  if (rawRole === 'mecanico' || rawRole === 'mechanic') return UserRole.Mechanic;
  if (rawRole === 'recepcion' || rawRole === 'recepcionista' || rawRole === 'receptionist' || rawRole === 'reception') return UserRole.Receptionist;
  if (rawRole === 'almacen' || rawRole === 'almacén' || rawRole === 'warehouse') return UserRole.Warehouse;
  if (rawRole === 'cajero' || rawRole === 'cashier') return UserRole.Cashier;
  if (rawRole === 'vendedor' || rawRole === 'seller' || rawRole === 'salesperson') return UserRole.Seller;
  if (rawRole === 'cliente' || rawRole === 'customer') return UserRole.Customer;

  return (Object.values(UserRole) as string[]).includes(rawRole) ? (rawRole as UserRole) : null;
}

/**
 * Checks if the given user has any of the allowed roles
 */
export function hasRole(
  user: HasRoleCandidate | null | undefined,
  allowedRoles: readonly UserRole[] | UserRole[]
): boolean {
  if (!user || allowedRoles.length === 0) return false;
  const userRole = resolveUserRole(user);
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Checks if the given user has a specific permission
 */
export function hasPermission(
  user: HasRoleCandidate | null | undefined,
  permission: Permission
): boolean {
  const userRole = resolveUserRole(user);
  if (!userRole) return false;
  if (userRole === UserRole.Admin) return true;

  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Checks if the given user has any of the given permissions
 */
export function hasAnyPermission(
  user: HasRoleCandidate | null | undefined,
  permissions: readonly Permission[] | Permission[]
): boolean {
  if (!permissions.length) return true;
  return permissions.some((perm) => hasPermission(user, perm));
}

/**
 * Checks if the given user has all of the given permissions
 */
export function hasAllPermissions(
  user: HasRoleCandidate | null | undefined,
  permissions: readonly Permission[] | Permission[]
): boolean {
  if (!permissions.length) return true;
  return permissions.every((perm) => hasPermission(user, perm));
}

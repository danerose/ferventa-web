import { useMemo, useCallback } from 'react';
import { useAuthStore } from '@/app/presentation/stores';
import { UserRole } from '@/core/enums';
import type { Permission } from '@/core/constants';
import {
  resolveUserRole,
  hasRole as checkHasRole,
  hasPermission as checkHasPermission,
  hasAnyPermission as checkHasAnyPermission,
  hasAllPermissions as checkHasAllPermissions,
} from '@/core/utils';

export function useAuthorization() {
  const user = useAuthStore((s) => s.user);

  const role = useMemo(() => resolveUserRole(user), [user]);
  const isAdmin = useMemo(() => role === UserRole.Admin, [role]);

  const hasRole = useCallback(
    (allowedRoles: readonly UserRole[] | UserRole[]) => checkHasRole(user, allowedRoles),
    [user]
  );

  const hasPermission = useCallback(
    (permission: Permission) => checkHasPermission(user, permission),
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: readonly Permission[] | Permission[]) => checkHasAnyPermission(user, permissions),
    [user]
  );

  const hasAllPermissions = useCallback(
    (permissions: readonly Permission[] | Permission[]) => checkHasAllPermissions(user, permissions),
    [user]
  );

  return {
    user,
    role,
    isAdmin,
    hasRole,
    hasPermission,
    can: hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

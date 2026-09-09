import React from 'react';
import { useAuthorization } from '@/core/hooks';
import type { UserRole } from '@/core/enums';
import type { Permission } from '@/core/constants';

export interface AuthorizeProps {
  roles?: readonly UserRole[] | UserRole[];
  permissions?: readonly Permission[] | Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Authorize: React.FC<AuthorizeProps> = ({
  roles,
  permissions,
  fallback = null,
  children,
}) => {
  const { user, hasRole, hasAnyPermission } = useAuthorization();

  if (!user) {
    return <>{fallback}</>;
  }

  const roleAllowed = !roles || roles.length === 0 || hasRole(roles);
  const permissionAllowed = !permissions || permissions.length === 0 || hasAnyPermission(permissions);

  if (roleAllowed && permissionAllowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

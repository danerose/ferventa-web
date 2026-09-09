import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { branchUseCases } from '@/core/di/container';
import { UserRole, USER_ROLE_LABELS } from '@/core/enums';
import { useAuthorization } from '@/core/hooks';
import type { Branch } from '@/app/domain';

export interface SidebarProps {
  onLogout: () => void;
  userName: string;
  onChangePassword?: () => void;
}

interface NavItemConfig {
  icon: string;
  label: string;
  path: string;
  allowedRoles: readonly UserRole[] | UserRole[];
}

// Navigation items filtered by role
const ALL_NAV_ITEMS: NavItemConfig[] = [
  {
    icon: 'LayoutDashboard',
    label: 'Dashboard',
    path: '/admin/operaciones',
    allowedRoles: [UserRole.Admin, UserRole.Receptionist],
  },
  {
    icon: 'CalendarCheck',
    label: 'Citas',
    path: '/admin/citas',
    allowedRoles: [UserRole.Admin, UserRole.Receptionist, UserRole.Seller],
  },
  {
    icon: 'Wrench',
    label: 'Mantenimiento',
    path: '/admin/mantenimiento',
    allowedRoles: [UserRole.Admin, UserRole.Mechanic, UserRole.Receptionist, UserRole.Seller],
  },
  {
    icon: 'ShoppingCart',
    label: 'Punto de Venta',
    path: '/admin/pos',
    allowedRoles: [UserRole.Admin, UserRole.Cashier, UserRole.Seller],
  },
  {
    icon: 'PackageOpen',
    label: 'Pedidos',
    path: '/admin/pedidos',
    allowedRoles: [UserRole.Admin, UserRole.Seller, UserRole.Cashier, UserRole.Warehouse],
  },
  {
    icon: 'Package',
    label: 'Inventario',
    path: '/admin/inventario',
    allowedRoles: [UserRole.Admin, UserRole.Warehouse, UserRole.Seller, UserRole.Cashier],
  },
  {
    icon: 'Clock',
    label: 'Asistencia',
    path: '/admin/asistencia',
    allowedRoles: [
      UserRole.Admin,
      UserRole.Receptionist,
      UserRole.Mechanic,
      UserRole.Warehouse,
      UserRole.Cashier,
      UserRole.Seller,
      UserRole.User,
    ],
  },
  {
    icon: 'Users',
    label: 'Usuarios',
    path: '/admin/usuarios',
    allowedRoles: [UserRole.Admin],
  },
];

const ALL_BOTTOM_ITEMS: NavItemConfig[] = [
  {
    icon: 'Calendar',
    label: 'Horarios',
    path: '/admin/horarios',
    allowedRoles: [UserRole.Admin, UserRole.Receptionist],
  },
  {
    icon: 'Settings',
    label: 'Ajustes',
    path: '/admin/settings',
    allowedRoles: [UserRole.Admin],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, userName, onChangePassword }) => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const setActiveBranch = useAuthStore((s) => s.setActiveBranch);
  const setBranchesStore = useAuthStore((s) => s.setBranches);
  const [branches, setBranches] = React.useState<Branch[]>([]);

  const { role, hasRole } = useAuthorization();
  const roleLabel = role ? (USER_ROLE_LABELS[role] || role) : 'Usuario';

  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchUseCases.getUserBranches();
        if (data && data.length > 0) {
          setBranches(data);
          setBranchesStore(data);
          return;
        }
      } catch {
        // ignore
      }

      try {
        const publicData = await branchUseCases.getPublicBranches();
        if (publicData && publicData.length > 0) {
          const mapped = publicData.map((b) => ({ ...b, id: b.id }));
          setBranches(mapped);
          setBranchesStore(mapped);
        }
      } catch {
        // ignore
      }
    };

    fetchBranches();
  }, [accessToken, setBranchesStore]);

  const availableBranches = React.useMemo(() => {
    if (branches.length === 0) return [];
    if (user?.branches && Array.isArray(user.branches) && user.branches.length > 0) {
      const userBranchIds = user.branches.map((b: unknown) =>
        typeof b === 'object' && b !== null
          ? ((b as { id?: string; _id?: string }).id || (b as { id?: string; _id?: string })._id || '')
          : String(b)
      );
      const filtered = branches.filter((b) => userBranchIds.includes(b.id));
      if (filtered.length > 0) return filtered;
    }
    return branches;
  }, [branches, user]);

  React.useEffect(() => {
    if (availableBranches.length > 0 && (!activeBranchId || !availableBranches.some((b) => b.id === activeBranchId))) {
      setActiveBranch(availableBranches[0].id, availableBranches[0].name);
    }
  }, [availableBranches, activeBranchId, setActiveBranch]);

  const navItems = ALL_NAV_ITEMS.filter((item) => hasRole(item.allowedRoles));
  const bottomItems = ALL_BOTTOM_ITEMS.filter((item) => hasRole(item.allowedRoles));


  const navLinkStyle = (path: string) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    cursor: 'pointer' as const,
    background: location.pathname.startsWith(path) ? 'rgba(133,83,0,0.2)' : 'transparent',
    color: location.pathname.startsWith(path) ? '#fbbf24' : 'rgba(255,255,255,0.45)',
    transition: 'background 0.15s, color 0.15s',
    fontWeight: location.pathname.startsWith(path) ? '700' : '500',
    fontSize: '14px',
    textDecoration: 'none' as const,
  });

  return (
    <aside
      style={{
        width: '240px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: '#091426',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: '#855300',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="Wrench" className="text-white" size="sm" />
          </div>
          <span style={{ color: 'white', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.01em' }}>
            Moto servicio Nova FV
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
          Workshop OS
        </span>
      </div>

      {/* Branch Selector */}
      {availableBranches.length > 0 && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '6px' }}>Sucursal Activa</label>
          <select
            value={activeBranchId || availableBranches[0].id}
            onChange={(e) => {
              const selected = availableBranches.find((b) => b.id === e.target.value);
              setActiveBranch(e.target.value, selected?.name);
              window.location.reload();
            }}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'white',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {availableBranches.map((branch) => (
              <option key={branch.id} value={branch.id} style={{ color: 'black' }}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            style={navLinkStyle(item.path)}
          >
            <Icon name={item.icon as 'Wrench'} size="sm" style={{ flexShrink: 0 }} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '12px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Bottom Nav Items — Admin Only */}
        {bottomItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' }}>
            {bottomItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                style={navLinkStyle(item.path)}
              >
                <Icon name={item.icon as 'Wrench'} size="sm" style={{ flexShrink: 0 }} />
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#855300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'white',
              fontSize: '14px',
              fontWeight: '700',
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{roleLabel}</p>
          </div>
        </div>

        {onChangePassword && (
          <button
            onClick={onChangePassword}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '6px 12px',
              marginBottom: '8px',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            <Icon name="Key" size="xs" />
            Cambiar Contraseña
          </button>
        )}

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: 'rgba(255,255,255,0.55)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
          }}
        >
          <Icon name="LogOut" size="xs" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

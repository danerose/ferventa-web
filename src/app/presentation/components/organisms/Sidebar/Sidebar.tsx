import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@/app/presentation/components';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { APIAdminRepository } from '@/app/data/repositories/APIAdminRepository';
import type { Branch } from '@/app/domain/entities/AdminEntities';

const adminRepo = new APIAdminRepository();

export interface SidebarProps {
  onLogout: () => void;
  userName: string;
}

const NAV_ITEMS = [
  { icon: 'LayoutDashboard', label: 'Dashboard', path: '/admin/operaciones', disabled: false },
  { icon: 'ShoppingCart', label: 'Punto de Venta', path: '/admin/pos', disabled: false },
  { icon: 'CalendarCheck', label: 'Citas', path: '/admin/citas', disabled: false },
  { icon: 'Wrench', label: 'Mantenimiento', path: '/admin/mantenimiento', disabled: false },
  { icon: 'Package', label: 'Inventario', path: '/admin/inventario', disabled: false },
  { icon: 'Users', label: 'Usuarios', path: '/admin/usuarios', disabled: false },
];

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, userName }) => {
  const location = useLocation();
  const { user, accessToken, activeBranchId, setActiveBranchId } = useAuthStore();
  const [branches, setBranches] = React.useState<Branch[]>([]);

  React.useEffect(() => {
    if (accessToken) {
      adminRepo.getBranches().then(data => {
        setBranches(data);
      }).catch(err => console.error("Error fetching branches for sidebar", err));
    }
  }, [accessToken]);

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
      {user?.branches && user.branches.length > 0 && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '6px' }}>Sucursal Activa</label>
          <select
            value={activeBranchId || ''}
            onChange={(e) => setActiveBranchId(e.target.value)}
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
            {user.branches.map(branchId => {
              const branchInfo = branches.find(b => (b.id === branchId || b.id === branchId));
              return (
                <option key={branchId} value={branchId} style={{ color: 'black' }}>
                  {branchInfo ? branchInfo.name : `Sucursal ${branchId.substring(0, 4)}...`}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path) && !item.disabled;

          if (item.disabled) {
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'not-allowed',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <Icon name={item.icon as 'Wrench'} size="sm" style={{ flexShrink: 0 }} />
                {item.label}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isActive ? 'rgba(133,83,0,0.2)' : 'transparent',
                color: isActive ? '#fbbf24' : 'rgba(255,255,255,0.45)',
                transition: 'background 0.15s, color 0.15s',
                fontWeight: isActive ? '700' : '500',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <Icon name={item.icon as 'Wrench'} size="sm" style={{ flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '12px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Bottom Nav Items (Settings & Schedule) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' }}>
          <Link
            to="/admin/horarios"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: location.pathname.startsWith('/admin/horarios') ? 'rgba(133,83,0,0.2)' : 'transparent',
              color: location.pathname.startsWith('/admin/horarios') ? '#fbbf24' : 'rgba(255,255,255,0.45)',
              transition: 'background 0.15s, color 0.15s',
              fontWeight: location.pathname.startsWith('/admin/horarios') ? '700' : '500',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            <Icon name="Calendar" size="sm" style={{ flexShrink: 0 }} />
            Horarios
          </Link>
          <Link
            to="/admin/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: location.pathname.startsWith('/admin/settings') ? 'rgba(133,83,0,0.2)' : 'transparent',
              color: location.pathname.startsWith('/admin/settings') ? '#fbbf24' : 'rgba(255,255,255,0.45)',
              transition: 'background 0.15s, color 0.15s',
              fontWeight: location.pathname.startsWith('/admin/settings') ? '700' : '500',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            <Icon name="Settings" size="sm" style={{ flexShrink: 0 }} />
            Ajustes
          </Link>
        </div>

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
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Administrador</p>
          </div>
        </div>

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

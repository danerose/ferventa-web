import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { useOperationsDashboardStore } from '../../../core/stores/useOperationsDashboardStore';

export const OperationsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { stats, setStats } = useOperationsDashboardStore();

  useEffect(() => {
    // API Call goes here when ready. For now, empty state.
    setStats({
      salesTotal: 0,
      salesGrowth: 0,
      pendingAppointments: 0,
      activeWorkorders: 0,
      lowStockItems: 0
    });
  }, [setStats]);

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#091426', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Dashboard de Operaciones
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Resumen general del estado de la sucursal activa.
            </p>
          </div>

          {/* KPIs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            {/* Sales KPI */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ventas del Día</span>
                <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
                  <Icon name="DollarSign" size="sm" className="text-primary" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
                  ${stats?.salesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '13px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Icon name="TrendingUp" size="sm" />
                  <span>+{stats?.salesGrowth}% vs ayer</span>
                </div>
              </div>
            </div>

            {/* Appointments KPI */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citas Pendientes</span>
                <div style={{ background: '#fffbeb', padding: '8px', borderRadius: '8px' }}>
                  <Icon name="Calendar" size="sm" className="text-warning" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
                  {stats?.pendingAppointments}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Requieren confirmación
                </div>
              </div>
            </div>

            {/* Work Orders KPI */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Órdenes Activas</span>
                <div style={{ background: '#f5f3ff', padding: '8px', borderRadius: '8px' }}>
                  <Icon name="Wrench" size="sm" className="text-[#8b5cf6]" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
                  {stats?.activeWorkorders}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Vehículos en taller
                </div>
              </div>
            </div>

            {/* Low Stock KPI */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Bajo</span>
                <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px' }}>
                  <Icon name="AlertTriangle" size="sm" className="text-error" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
                  {stats?.lowStockItems}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Productos por reabastecer
                </div>
              </div>
            </div>

          </div>

          {/* Quick Actions / Shortcuts */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>Accesos Rápidos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              
              <button 
                onClick={() => navigate('/admin/pos')}
                style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '50%', color: '#2563eb' }}>
                  <Icon name="ShoppingCart" size="lg" />
                </div>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Nueva Venta (POS)</span>
              </button>

              <button 
                onClick={() => navigate('/admin/citas')}
                style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#d97706'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '50%', color: '#d97706' }}>
                  <Icon name="CalendarPlus" size="lg" />
                </div>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Gestionar Citas</span>
              </button>

              <button 
                onClick={() => navigate('/admin/mantenimiento')}
                style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ background: '#f5f3ff', padding: '16px', borderRadius: '50%', color: '#8b5cf6' }}>
                  <Icon name="Wrench" size="lg" />
                </div>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Taller / Órdenes</span>
              </button>

              <button 
                onClick={() => navigate('/admin/inventario')}
                style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#16a34a'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '50%', color: '#16a34a' }}>
                  <Icon name="Package" size="lg" />
                </div>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>Inventario</span>
              </button>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

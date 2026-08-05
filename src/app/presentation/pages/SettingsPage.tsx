import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#091426' }}>Ajustes Generales</h1>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>

          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Icon name="Settings" size="lg" className="text-primary" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Ajustes del Sistema</h2>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
              Las opciones de configuración avanzada del sistema estarán disponibles próximamente.
            </p>
            <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#475569' }}>
                <Icon name="Info" size="sm" className="text-primary" style={{ flexShrink: 0 }} />
                <span>Versión del sistema: <strong style={{ color: '#091426' }}>Ferventa v1.0</strong></span>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

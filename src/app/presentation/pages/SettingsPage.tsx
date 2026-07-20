import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, ConfirmModal, AlertModal } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';

const adminRepo = new APIAdminRepository();

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; isError: boolean }>({
    isOpen: false,
    title: '',
    message: '',
    isError: false,
  });

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  const executeMigration = async () => {
    setLoading(true);
    try {
      await adminRepo.migrateBranches();
      setAlert({ isOpen: true, title: 'Éxito', message: 'Migración ejecutada con éxito.', isError: false });
    } catch (e: any) {
      if (e.message === 'UNAUTHORIZED') handleUnauthorized();
      else setAlert({ isOpen: true, title: 'Error', message: 'Error en la migración: ' + e.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = () => {
    setShowConfirm(true);
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
          
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', color: '#d97706' }}>
                <Icon name="Database" size="md" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Migración de Sucursales</h3>
                <p style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>
                  Ejecuta este proceso para migrar los registros antiguos del sistema (productos, usuarios, citas, etc.) hacia la nueva estructura multi-sucursal. Se asignarán a la sucursal por defecto.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <PrimaryButton onClick={handleMigration} disabled={loading}>
                {loading ? 'Migrando...' : 'Migrar Datos'}
              </PrimaryButton>
            </div>
          </div>

        </main>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeMigration}
        title="Migración de Sucursales"
        message="¿Estás seguro de que deseas ejecutar la migración de sucursales? Esta acción es irreversible."
        confirmText="Sí, Migrar"
      />

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        isError={alert.isError}
      />
    </div>
  );
};

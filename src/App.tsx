import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ClientPortalPage } from '@/app/presentation/pages/ClientPortalPage';
import { LoginPage } from '@/app/presentation/pages/LoginPage';
import { AdminDashboardPage } from '@/app/presentation/pages/AdminDashboardPage';
import { MaintenanceManagementPage } from '@/app/presentation/pages/MaintenanceManagementPage';
import { OperationsDashboardPage } from '@/app/presentation/pages/OperationsDashboardPage';
import { POSPage } from '@/app/presentation/pages/POSPage';
import { InventoryPage } from '@/app/presentation/pages/InventoryPage';
import { UsersPage } from '@/app/presentation/pages/UsersPage';
import { ScheduleSettingsPage } from '@/app/presentation/pages/ScheduleSettingsPage';
import { SettingsPage } from '@/app/presentation/pages/SettingsPage';
import { AttendancePage } from '@/app/presentation/pages/AttendancePage';
import { useAuthStore } from '@/app/presentation/stores';
import { useThemeStore } from '@/app/presentation/stores';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

export function App() {
  const navigate = useNavigate();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const { initializeTheme } = useThemeStore();

  // Inicializar tema y keep-alive ping para evitar que el servidor Render duerma
  useEffect(() => {
    initializeTheme();

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const keepAlivePing = () => {
      fetch(`${apiUrl}/health`, { method: 'GET', mode: 'cors' })
        .catch(() => fetch(apiUrl, { method: 'GET', mode: 'no-cors' }))
        .catch(() => {});
    };

    keepAlivePing();
    const interval = setInterval(keepAlivePing, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, [initializeTheme]);

  const handleOpenAdmin = () => {
    if (isAuthenticated()) {
      navigate('/admin/citas');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<ClientPortalPage onOpenAdmin={handleOpenAdmin} />} />
      <Route path="/portal" element={<Navigate to="/" replace />} />
      <Route
        path="/login"
        element={
          isAuthenticated() ? (
            <Navigate to="/admin/citas" replace />
          ) : (
            <LoginPage onLoginSuccess={() => navigate('/admin/citas')} />
          )
        }
      />
      <Route path="/admin" element={<Navigate to="/admin/citas" replace />} />
      <Route
        path="/admin/citas"
        element={
          <ProtectedRoute>
            <AdminDashboardPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/operaciones"
        element={
          <ProtectedRoute>
            <OperationsDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pos"
        element={
          <ProtectedRoute>
            <POSPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventario"
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/horarios"
        element={
          <ProtectedRoute>
            <ScheduleSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/mantenimiento"
        element={
          <ProtectedRoute>
            <MaintenanceManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/asistencia"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

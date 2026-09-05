import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  ClientPortalPage,
  LoginPage,
  AdminDashboardPage,
  MaintenanceManagementPage,
  OperationsDashboardPage,
  POSPage,
  InventoryPage,
  UsersPage,
  ScheduleSettingsPage,
  SettingsPage,
  AttendancePage,
  SpecialOrdersPage,
} from '@/app/presentation/pages';
import { useAuthStore, useThemeStore } from '@/app/presentation/stores';
import { APP_ROUTES } from '@/core/constants';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? <>{children}</> : <Navigate to={APP_ROUTES.LOGIN} replace />;
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
      navigate(APP_ROUTES.ADMIN.CITAS);
    } else {
      navigate(APP_ROUTES.LOGIN);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate(APP_ROUTES.PORTAL);
  };

  return (
    <Routes>
      <Route path={APP_ROUTES.PORTAL} element={<ClientPortalPage onOpenAdmin={handleOpenAdmin} />} />
      <Route path="/portal" element={<Navigate to={APP_ROUTES.PORTAL} replace />} />
      <Route
        path={APP_ROUTES.LOGIN}
        element={
          isAuthenticated() ? (
            <Navigate to={APP_ROUTES.ADMIN.CITAS} replace />
          ) : (
            <LoginPage onLoginSuccess={() => navigate(APP_ROUTES.ADMIN.CITAS)} />
          )
        }
      />
      <Route path={APP_ROUTES.ADMIN.ROOT} element={<Navigate to={APP_ROUTES.ADMIN.CITAS} replace />} />
      <Route
        path={APP_ROUTES.ADMIN.CITAS}
        element={
          <ProtectedRoute>
            <AdminDashboardPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.OPERACIONES}
        element={
          <ProtectedRoute>
            <OperationsDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.POS}
        element={
          <ProtectedRoute>
            <POSPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.INVENTARIO}
        element={
          <ProtectedRoute>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.USUARIOS}
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.HORARIOS}
        element={
          <ProtectedRoute>
            <ScheduleSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.SETTINGS}
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.MANTENIMIENTO}
        element={
          <ProtectedRoute>
            <MaintenanceManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.ASISTENCIA}
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.ADMIN.PEDIDOS}
        element={
          <ProtectedRoute>
            <SpecialOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/orders" element={<Navigate to={APP_ROUTES.ADMIN.PEDIDOS} replace />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.PORTAL} replace />} />
    </Routes>
  );
}

export default App;

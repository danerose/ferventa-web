import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/app/presentation/stores';
import { APP_ROUTES } from '@/core/constants';

// Code-splitting via React.lazy with direct paths to eliminate monolithic bundle
const ClientPortalPage = lazy(() => import('@/app/presentation/pages/clientPortal/ClientPortalPage').then(m => ({ default: m.ClientPortalPage })));
const LoginPage = lazy(() => import('@/app/presentation/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminDashboardPage = lazy(() => import('@/app/presentation/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const MaintenanceManagementPage = lazy(() => import('@/app/presentation/pages/maintenance/MaintenanceManagementPage').then(m => ({ default: m.MaintenanceManagementPage })));
const OperationsDashboardPage = lazy(() => import('@/app/presentation/pages/operations/OperationsDashboardPage').then(m => ({ default: m.OperationsDashboardPage })));
const POSPage = lazy(() => import('@/app/presentation/pages/pos/POSPage').then(m => ({ default: m.POSPage })));
const InventoryPage = lazy(() => import('@/app/presentation/pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const UsersPage = lazy(() => import('@/app/presentation/pages/users/UsersPage').then(m => ({ default: m.UsersPage })));
const ScheduleSettingsPage = lazy(() => import('@/app/presentation/pages/schedule/ScheduleSettingsPage').then(m => ({ default: m.ScheduleSettingsPage })));
const SettingsPage = lazy(() => import('@/app/presentation/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AttendancePage = lazy(() => import('@/app/presentation/pages/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })));
const SpecialOrdersPage = lazy(() => import('@/app/presentation/pages/specialOrders/SpecialOrdersPage').then(m => ({ default: m.SpecialOrdersPage })));

const PageLoader = () => (
  <div className="min-h-screen bg-base-100 flex items-center justify-center">
    <span className="loading loading-spinner loading-lg text-primary"></span>
  </div>
);

// Protected Route Component with granular selector
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((s) => !!s.accessToken);
  return isAuth ? <>{children}</> : <Navigate to={APP_ROUTES.LOGIN} replace />;
};

export function App() {
  const navigate = useNavigate();
  const isAuth = useAuthStore((s) => !!s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const initializeTheme = useThemeStore((s) => s.initializeTheme);

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
    if (isAuth) {
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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={APP_ROUTES.PORTAL} element={<ClientPortalPage onOpenAdmin={handleOpenAdmin} />} />
        <Route path="/portal" element={<Navigate to={APP_ROUTES.PORTAL} replace />} />
        <Route
          path={APP_ROUTES.LOGIN}
          element={
            isAuth ? (
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
    </Suspense>
  );
}

export default App;

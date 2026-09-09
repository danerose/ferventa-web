import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/app/presentation/stores';
import { APP_ROUTES } from '@/core/constants';
import { UserRole } from '@/core/enums';
import { useAuthorization } from '@/core/hooks';
import { ForbiddenPage } from '@/app/presentation/pages/forbidden/ForbiddenPage';

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

// Protected Route Component with granular RBAC
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: readonly UserRole[] | UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const isAuth = useAuthStore((s) => !!s.accessToken);
  const { hasRole } = useAuthorization();

  if (!isAuth) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
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
        
        {/* Citas: Admin, Recepción, Vendedor */}
        <Route
          path={APP_ROUTES.ADMIN.CITAS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist, UserRole.Seller]}>
              <AdminDashboardPage onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Operaciones / Dashboard: Admin, Recepción */}
        <Route
          path={APP_ROUTES.ADMIN.OPERACIONES}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <OperationsDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Punto de Venta: Admin, Cajero, Vendedor */}
        <Route
          path={APP_ROUTES.ADMIN.POS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Cashier, UserRole.Seller]}>
              <POSPage />
            </ProtectedRoute>
          }
        />

        {/* Inventario: Admin, Almacén, Vendedor, Cajero */}
        <Route
          path={APP_ROUTES.ADMIN.INVENTARIO}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Warehouse, UserRole.Seller, UserRole.Cashier]}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        {/* Usuarios: Solo Admin */}
        <Route
          path={APP_ROUTES.ADMIN.USUARIOS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Horarios: Solo Staff (Admin, Recepción) */}
        <Route
          path={APP_ROUTES.ADMIN.HORARIOS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <ScheduleSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Ajustes: Solo Admin */}
        <Route
          path={APP_ROUTES.ADMIN.SETTINGS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Mantenimiento: Admin, Mecánico, Recepción, Vendedor */}
        <Route
          path={APP_ROUTES.ADMIN.MANTENIMIENTO}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Mechanic, UserRole.Receptionist, UserRole.Seller]}>
              <MaintenanceManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Asistencia: Todo el personal */}
        <Route
          path={APP_ROUTES.ADMIN.ASISTENCIA}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist, UserRole.Mechanic, UserRole.Warehouse, UserRole.Cashier, UserRole.Seller, UserRole.User]}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />

        {/* Pedidos Especiales: Admin, Vendedor, Cajero, Almacén */}
        <Route
          path={APP_ROUTES.ADMIN.PEDIDOS}
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Seller, UserRole.Cashier, UserRole.Warehouse]}>
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

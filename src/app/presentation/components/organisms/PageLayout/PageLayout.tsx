import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/app/presentation/components/organisms/Sidebar/Sidebar';
import { ChangePasswordModal } from '@/app/presentation/components/organisms/Modals/ChangePasswordModal';
import { Icon, PrimaryButton } from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';

/**
 * PageLayout
 *
 * The single source of truth for the app shell: it renders the fixed
 * Sidebar and offsets the content area by exactly the sidebar width
 * (240 px). All authenticated pages should use this wrapper instead
 * of manually handling the sidebar + margin.
 *
 * Usage:
 *   <PageLayout>
 *     <header>...</header>
 *     <main>...</main>
 *   </PageLayout>
 */

export interface PageLayoutProps {
  /** Page body — header, main content, modals, drawers, etc. */
  children: React.ReactNode;
  /** Extra classes applied to the scrollable content column. */
  className?: string;
  /** Override for the user name shown in the sidebar (defaults to store value). */
  userName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = '',
  userName,
}) => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const resolvedName = userName ?? user?.name ?? 'Admin';

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken, fetchProfile]);

  const handleLogout = () => {
    clearAuth();
  };

  const handlePasswordSuccess = () => {
    setSuccessToast('¡Contraseña actualizada con éxito!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-base-200, #f1f5f9)',
      }}
    >
      {/* Fixed navigation sidebar */}
      <div className="print:hidden">
        <Sidebar
          onLogout={handleLogout}
          userName={resolvedName}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Mobile Top Navigation Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#091426] text-white border-b border-white/10 shrink-0 print:hidden z-30 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Abrir menú"
          >
            <Icon name="Menu" size="sm" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#855300] flex items-center justify-center">
              <Icon name="Wrench" className="text-white" size="xs" />
            </div>
            <span className="font-bold text-sm">Nova FV</span>
          </div>
        </div>
        <span className="text-xs text-amber-400 font-semibold truncate max-w-[140px]">
          {resolvedName}
        </span>
      </div>

      {/* Content area — pushed right by sidebar on desktop (md:ml-[240px]), full-width on mobile (ml-0) */}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        className={`md:ml-[240px] ml-0 print:ml-0 ${className}`.trim()}
      >
        {/* Banner de aviso de contraseña temporal */}
        {user?.isDefaultPassword && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between gap-4 text-amber-950 dark:text-amber-200 z-20 shrink-0">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
              <Icon name="ShieldAlert" size="sm" className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Estás usando una contraseña temporal. Por seguridad, debes actualizarla a una privada.
              </span>
            </div>
            <PrimaryButton
              size="xs"
              color="warning"
              onClick={() => setIsChangePasswordOpen(true)}
              iconStart={<Icon name="Key" size="xs" />}
            >
              Cambiar Contraseña
            </PrimaryButton>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Icon name="CheckCircle" size="xs" className="text-white" />
            <span>{successToast}</span>
          </div>
        )}

        {children}

        {/* Modal de cambio de contraseña */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          onSuccess={handlePasswordSuccess}
          isMandatory={!!user?.isDefaultPassword}
        />
      </div>
    </div>
  );
};


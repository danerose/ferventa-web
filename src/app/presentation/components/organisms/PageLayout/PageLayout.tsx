import React from 'react';
import { Sidebar } from '@/app/presentation/components/organisms/Sidebar/Sidebar';
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

const SIDEBAR_WIDTH = 240; // px — must match Sidebar.tsx `width: '240px'`

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
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const resolvedName = userName ?? user?.name ?? 'Admin';

  const handleLogout = () => {
    clearAuth();
    // Navigation is handled by the ProtectedRoute / auth guards; we just
    // clear the store here. Individual pages may override via prop if they
    // need to run extra logic before logging out — but for the standard
    // case the store listener in the router takes care of redirect.
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
        <Sidebar onLogout={handleLogout} userName={resolvedName} />
      </div>

      {/* Content area — pushed right by sidebar width, never overlaps */}
      <div
        style={{
          marginLeft: `${SIDEBAR_WIDTH}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        className={`print:ml-0 ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  );
};

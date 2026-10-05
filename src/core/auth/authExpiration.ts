/**
 * Global Authentication Expiration and Logout Handler
 * 
 * Automatically triggers session clearing and redirection to the login/portal
 * when a JWT token expires or any API call returns 401 Unauthorized.
 */

let isHandlingExpiration = false;

/**
 * Checks whether a given JWT string has expired based on its exp payload claim.
 */
export function isJwtExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload && typeof payload.exp === 'number') {
      // If expired or expiring in less than 5 seconds
      return payload.exp * 1000 <= Date.now() + 5000;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Handles an expired session by wiping local authentication storage,
 * dispatching the 'ferventa:auth-expired' event for Zustand stores/React components,
 * and redirecting the user to the login screen.
 */
export function handleAuthExpiration(): void {
  if (isHandlingExpiration) return;
  isHandlingExpiration = true;

  try {
    localStorage.removeItem('ferventa_auth');
    localStorage.removeItem('ferventa_active_branch');
    localStorage.removeItem('ferventa_active_branch_name');

    // Notify listeners in App.tsx / Stores
    window.dispatchEvent(new CustomEvent('ferventa:auth-expired'));
  } catch {
    // Ignore storage access errors
  }

  // If the user is currently on an authenticated route, redirect to login
  try {
    const path = window.location.pathname;
    if (path !== '/login' && path !== '/' && path !== '/portal') {
      window.location.href = '/login';
    }
  } catch {
    // Ignore navigation errors
  }

  setTimeout(() => {
    isHandlingExpiration = false;
  }, 1200);
}

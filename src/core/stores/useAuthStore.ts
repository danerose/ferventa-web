import { create } from 'zustand';
import type { AuthUser } from '@/app/domain/entities/AdminEntities';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeBranchId: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setActiveBranchId: (id: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const STORAGE_KEY = 'ferventa_auth';
const BRANCH_STORAGE_KEY = 'ferventa_active_branch';

function loadFromStorage(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

function loadActiveBranchId(): string | null {
  try {
    return localStorage.getItem(BRANCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

const stored = loadFromStorage();
const storedBranchId = loadActiveBranchId();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: stored.user,
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,
  activeBranchId: storedBranchId,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
    
    // Al hacer login, siempre seleccionamos por defecto la primera sucursal que regresa
    let newActiveBranchId = null;
    if (user.branches && user.branches.length > 0) {
      newActiveBranchId = user.branches[0];
      localStorage.setItem(BRANCH_STORAGE_KEY, newActiveBranchId);
    } else {
      localStorage.removeItem(BRANCH_STORAGE_KEY);
    }
    
    set({ user, accessToken, refreshToken, activeBranchId: newActiveBranchId });
  },

  setActiveBranchId: (id: string) => {
    localStorage.setItem(BRANCH_STORAGE_KEY, id);
    set({ activeBranchId: id });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BRANCH_STORAGE_KEY);
    set({ user: null, accessToken: null, refreshToken: null, activeBranchId: null });
  },

  isAuthenticated: () => {
    return !!get().accessToken;
  },
}));

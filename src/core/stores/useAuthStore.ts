import { create } from 'zustand';
import type { AuthUser } from '@/app/domain/entities/AdminEntities';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const STORAGE_KEY = 'ferventa_auth';

function loadFromStorage(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, accessToken: null, refreshToken: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

const stored = loadFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: stored.user,
  accessToken: stored.accessToken,
  refreshToken: stored.refreshToken,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
    set({ user, accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },

  isAuthenticated: () => {
    return !!get().accessToken;
  },
}));

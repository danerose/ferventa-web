import { create } from 'zustand';
import type { AuthUser } from '@/app/domain';
import { authUseCases } from '@/core/di/container';

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

const initialSession = authUseCases.getSession();
const initialBranchId = authUseCases.getActiveBranchId();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialSession.user,
  accessToken: initialSession.accessToken,
  refreshToken: initialSession.refreshToken,
  activeBranchId: initialBranchId,

  setAuth: (user, accessToken, refreshToken) => {
    let newActiveBranchId: string | null = null;
    if (user.branches && user.branches.length > 0) {
      newActiveBranchId = user.branches[0];
    }
    authUseCases.setActiveBranchId(newActiveBranchId);
    set({ user, accessToken, refreshToken, activeBranchId: newActiveBranchId });
  },

  setActiveBranchId: (id: string) => {
    authUseCases.setActiveBranchId(id);
    set({ activeBranchId: id });
  },

  clearAuth: () => {
    authUseCases.logout();
    set({ user: null, accessToken: null, refreshToken: null, activeBranchId: null });
  },

  isAuthenticated: () => {
    return !!get().accessToken;
  },
}));

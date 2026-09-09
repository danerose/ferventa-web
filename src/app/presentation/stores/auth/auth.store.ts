import { create } from 'zustand';
import type { AuthUser, Branch } from '@/app/domain';
import { authUseCases } from '@/core/di/container';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  activeBranchId: string | null;
  activeBranchName: string;
  branches: Branch[];
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  fetchProfile: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setActiveBranch: (id: string, name?: string) => void;
  setActiveBranchId: (id: string, name?: string) => void;
  setBranches: (branches: Branch[]) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const initialSession = authUseCases.getSession();
const initialBranchId = authUseCases.getActiveBranchId();
const initialBranchName = authUseCases.getActiveBranchName() || 'Nova FV Sucursal Uman';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialSession.user,
  accessToken: initialSession.accessToken,
  refreshToken: initialSession.refreshToken,
  activeBranchId: initialBranchId,
  activeBranchName: initialBranchName,
  branches: [],

  setAuth: (user, accessToken, refreshToken) => {
    let newActiveBranchId: string | null = null;
    if (user?.branches && Array.isArray(user.branches) && user.branches.length > 0) {
      const firstBranch = user.branches[0];
      newActiveBranchId = typeof firstBranch === 'object' && firstBranch !== null
        ? ((firstBranch as { id?: string; _id?: string }).id || (firstBranch as { id?: string; _id?: string })._id || '')
        : String(firstBranch);
    }
    authUseCases.saveSession({ user, accessToken, refreshToken });
    if (newActiveBranchId) {
      authUseCases.setActiveBranchId(newActiveBranchId);
    }
    set({ user, accessToken, refreshToken, activeBranchId: newActiveBranchId });
  },

  updateUser: (fields) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...fields };
    authUseCases.saveSession({
      user: updated,
      accessToken: get().accessToken || '',
      refreshToken: get().refreshToken || '',
    });
    set({ user: updated });
  },

  fetchProfile: async () => {
    const token = get().accessToken;
    if (!token) return;
    try {
      const profile = await authUseCases.getProfile(token);
      get().updateUser(profile);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        get().clearAuth();
      }
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    const token = get().accessToken;
    if (!token) throw new Error('No hay sesión activa');
    await authUseCases.changePassword(token, currentPassword, newPassword);
    get().updateUser({ isDefaultPassword: false });
  },

  setActiveBranch: (id: string, name?: string) => {
    let resolvedName = name;
    if (!resolvedName) {
      const found = get().branches.find((b) => b.id === id || (b as { _id?: string })._id === id);
      resolvedName = found?.name;
    }
    const finalName = resolvedName || get().activeBranchName || 'Nova FV Sucursal Uman';
    authUseCases.saveActiveBranch(id, finalName);
    set({ activeBranchId: id, activeBranchName: finalName });
  },

  setActiveBranchId: (id: string, name?: string) => {
    get().setActiveBranch(id, name);
  },

  setBranches: (branches: Branch[]) => {
    const currentId = get().activeBranchId;
    let currentName = get().activeBranchName;
    if (currentId) {
      const found = branches.find((b) => b.id === currentId || (b as { _id?: string })._id === currentId);
      if (found?.name) {
        currentName = found.name;
        authUseCases.saveActiveBranch(currentId, currentName);
      }
    }
    set({ branches, activeBranchName: currentName });
  },

  clearAuth: () => {
    authUseCases.logout();
    set({ user: null, accessToken: null, refreshToken: null, activeBranchId: null, activeBranchName: 'Nova FV Sucursal Uman' });
  },

  isAuthenticated: () => {
    return !!get().accessToken;
  },
}));



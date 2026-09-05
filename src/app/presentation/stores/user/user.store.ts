import { create } from 'zustand';
import { userUseCases } from '@/core/di/container';
import type {
  User,
  Role,
  Branch,
  CreateUserDto,
  UpdateUserDto,
  CreateUserResponse,
} from '@/app/domain';

interface UsernameStatus {
  checking: boolean;
  available?: boolean;
  exists?: boolean;
  message?: string;
}

interface UserState {
  users: User[];
  roles: Role[];
  branches: Branch[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  activeModal: 'addUser' | 'editUser' | 'deleteUser' | 'success' | null;
  selectedUser: User | null;
  isSubmitting: boolean;
  submitError: string | null;
  successData: CreateUserResponse | null;
  usernameStatus: UsernameStatus;

  // Setters
  setSearchValue: (val: string) => void;
  setActiveModal: (modal: 'addUser' | 'editUser' | 'deleteUser' | 'success' | null) => void;
  setSelectedUser: (user: User | null) => void;
  setSubmitError: (error: string | null) => void;
  clearSuccessData: () => void;

  // Async Actions via userUseCases
  loadData: (token: string) => Promise<void>;
  createUser: (token: string, data: CreateUserDto) => Promise<CreateUserResponse>;
  updateUser: (token: string, id: string, data: UpdateUserDto) => Promise<User>;
  deleteUser: (token: string, id: string) => Promise<void>;
  checkUsername: (token: string, username: string) => Promise<void>;
  generateUsername: (token: string, name: string) => Promise<string>;
}

let checkDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  roles: [],
  branches: [],
  loading: false,
  error: null,
  searchValue: '',
  activeModal: null,
  selectedUser: null,
  isSubmitting: false,
  submitError: null,
  successData: null,
  usernameStatus: { checking: false },

  setSearchValue: (searchValue) => set({ searchValue }),
  setActiveModal: (activeModal) => set({ activeModal, submitError: null }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  setSubmitError: (submitError) => set({ submitError }),
  clearSuccessData: () => set({ successData: null }),

  loadData: async (token: string) => {
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const [users, roles, branches] = await Promise.all([
        userUseCases.getUsers(token),
        userUseCases.getRoles(token),
        userUseCases.getBranches(),
      ]);
      set({ users, roles, branches, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios';
      set({ error: message, loading: false });
      if (message === 'UNAUTHORIZED') throw err;
    }
  },

  createUser: async (token: string, data: CreateUserDto) => {
    set({ isSubmitting: true, submitError: null });
    try {
      const resp = await userUseCases.createUser(token, data);
      set({ successData: resp, isSubmitting: false, activeModal: 'success' });
      await get().loadData(token);
      return resp;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario';
      set({ submitError: message, isSubmitting: false });
      throw err;
    }
  },

  updateUser: async (token: string, id: string, data: UpdateUserDto) => {
    set({ isSubmitting: true, submitError: null });
    try {
      const updated = await userUseCases.updateUser(token, id, data);
      set({ isSubmitting: false, activeModal: null, selectedUser: null });
      await get().loadData(token);
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar usuario';
      set({ submitError: message, isSubmitting: false });
      throw err;
    }
  },

  deleteUser: async (token: string, id: string) => {
    set({ isSubmitting: true, submitError: null });
    try {
      await userUseCases.deleteUser(token, id);
      set({ isSubmitting: false, activeModal: null, selectedUser: null });
      await get().loadData(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar usuario';
      set({ submitError: message, isSubmitting: false });
      throw err;
    }
  },

  checkUsername: async (token: string, username: string) => {
    const trimmed = username.trim();
    if (!trimmed) {
      set({ usernameStatus: { checking: false } });
      return;
    }

    set({ usernameStatus: { checking: true } });
    if (checkDebounceTimer) clearTimeout(checkDebounceTimer);

    checkDebounceTimer = setTimeout(async () => {
      try {
        const res = await userUseCases.checkUsername(token, trimmed);
        set({
          usernameStatus: {
            checking: false,
            available: res.available,
            exists: res.exists,
            message: res.available ? 'Nombre de usuario disponible' : 'Nombre de usuario no disponible',
          },
        });
      } catch {
        set({ usernameStatus: { checking: false } });
      }
    }, 350);
  },

  generateUsername: async (token: string, name: string) => {
    return userUseCases.generateUsername(token, name);
  },
}));

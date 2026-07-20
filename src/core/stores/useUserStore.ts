import { create } from 'zustand';
import type { User, Role } from '../../app/domain/entities/UserEntities';
import type { Branch } from '../../app/domain/entities/AdminEntities';

interface UserState {
  users: User[];
  roles: Role[];
  branches: Branch[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  activeModal: 'addUser' | 'editUser' | null;
  selectedUser: User | null;

  setUsers: (users: User[]) => void;
  setRoles: (roles: Role[]) => void;
  setBranches: (branches: Branch[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchValue: (val: string) => void;
  setActiveModal: (modal: 'addUser' | 'editUser' | null) => void;
  setSelectedUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  roles: [],
  branches: [],
  loading: false,
  error: null,
  searchValue: '',
  activeModal: null,
  selectedUser: null,

  setUsers: (users) => set({ users }),
  setRoles: (roles) => set({ roles }),
  setBranches: (branches) => set({ branches }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchValue: (searchValue) => set({ searchValue }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));

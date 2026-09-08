import type { AuthUser } from '@/app/domain';

export interface StoredAuthSession {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export class AuthLocalDataSource {
  private readonly storageKey = 'ferventa_auth';
  private readonly branchStorageKey = 'ferventa_active_branch';
  private readonly branchNameStorageKey = 'ferventa_active_branch_name';

  getSession(): StoredAuthSession {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { user: null, accessToken: null, refreshToken: null };
      return JSON.parse(raw);
    } catch {
      return { user: null, accessToken: null, refreshToken: null };
    }
  }

  saveSession(session: StoredAuthSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.branchStorageKey);
    localStorage.removeItem(this.branchNameStorageKey);
  }

  getActiveBranchId(): string | null {
    try {
      return localStorage.getItem(this.branchStorageKey);
    } catch {
      return null;
    }
  }

  getActiveBranchName(): string | null {
    try {
      return localStorage.getItem(this.branchNameStorageKey);
    } catch {
      return null;
    }
  }

  saveActiveBranch(id: string | null, name?: string | null): void {
    if (id) {
      localStorage.setItem(this.branchStorageKey, id);
    } else {
      localStorage.removeItem(this.branchStorageKey);
    }

    if (name) {
      localStorage.setItem(this.branchNameStorageKey, name);
    } else if (!id) {
      localStorage.removeItem(this.branchNameStorageKey);
    }
  }

  saveActiveBranchId(id: string | null): void {
    this.saveActiveBranch(id);
  }
}


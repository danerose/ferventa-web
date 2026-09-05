import type { AuthUser } from '@/app/domain';

export interface StoredAuthSession {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export class AuthLocalDataSource {
  private readonly storageKey = 'ferventa_auth';
  private readonly branchStorageKey = 'ferventa_active_branch';

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
  }

  getActiveBranchId(): string | null {
    try {
      return localStorage.getItem(this.branchStorageKey);
    } catch {
      return null;
    }
  }

  saveActiveBranchId(id: string | null): void {
    if (id) {
      localStorage.setItem(this.branchStorageKey, id);
    } else {
      localStorage.removeItem(this.branchStorageKey);
    }
  }
}

import type { AuthUser } from '@/app/domain/entities';

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
}

export interface AuthSessionData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSessionData>;
  logout(): Promise<void>;
  getSession(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null };
  saveSession(session: AuthSessionData): void;
  getActiveBranchId(): string | null;
  setActiveBranchId(id: string | null): void;
  getActiveBranchName(): string | null;
  saveActiveBranch(id: string | null, name?: string | null): void;
  getProfile(token: string): Promise<AuthUser>;
  changePassword(token: string, currentPassword: string, newPassword: string): Promise<void>;
}

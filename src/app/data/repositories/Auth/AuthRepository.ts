import type { AuthUser } from '@/app/domain';
import type { IAuthRepository } from '@/app/domain/repository';
import { AuthRemoteDataSource, type LoginCredentials } from '../../datasources/remote/Auth/AuthRemoteDataSource';
import { AuthLocalDataSource } from '../../datasources/local/Auth/AuthLocalDataSource';

export type { IAuthRepository };

export class AuthRepository implements IAuthRepository {
  private readonly remote: AuthRemoteDataSource;
  private readonly local: AuthLocalDataSource;

  constructor(remote: AuthRemoteDataSource, local: AuthLocalDataSource) {
    this.remote = remote;
    this.local = local;
  }

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    try {
      const sessionModel = await this.remote.login(credentials);
      const user = sessionModel.toEntity();
      this.local.saveSession({
        user,
        accessToken: sessionModel.accessToken,
        refreshToken: sessionModel.refreshToken,
      });
      if (user.branches && user.branches.length > 0) {
        const firstBranch = user.branches[0];
        const branchId = typeof firstBranch === 'object' && firstBranch !== null
          ? ((firstBranch as { id?: string; _id?: string }).id || (firstBranch as { id?: string; _id?: string })._id || '')
          : String(firstBranch);
        if (branchId) {
          this.local.saveActiveBranchId(branchId);
        }
      }
      return {
        user,
        accessToken: sessionModel.accessToken,
        refreshToken: sessionModel.refreshToken,
      };
    } catch (error) {
      console.error('[AuthRepository.login] Error during login:', error);
      throw error instanceof Error ? error : new Error('Error al iniciar sesión');
    }
  }

  saveSession(session: { user: AuthUser; accessToken: string; refreshToken: string }): void {
    this.local.saveSession(session);
  }

  async logout(): Promise<void> {
    this.local.clearSession();
  }

  getSession(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null } {
    return this.local.getSession();
  }

  getActiveBranchId(): string | null {
    return this.local.getActiveBranchId();
  }

  setActiveBranchId(id: string | null): void {
    this.local.saveActiveBranchId(id);
  }

  getActiveBranchName(): string | null {
    return this.local.getActiveBranchName();
  }

  saveActiveBranch(id: string | null, name?: string | null): void {
    this.local.saveActiveBranch(id, name);
  }

  async getProfile(token: string): Promise<AuthUser> {
    return this.remote.getProfile(token);
  }

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    return this.remote.changePassword(token, currentPassword, newPassword);
  }
}


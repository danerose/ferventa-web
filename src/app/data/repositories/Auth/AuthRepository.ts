import type { AuthUser } from '@/app/domain';
import { AuthRemoteDataSource, type LoginCredentials } from '../../datasources/remote/Auth/AuthRemoteDataSource';
import { AuthLocalDataSource } from '../../datasources/local/Auth/AuthLocalDataSource';
import { AuthSessionModel } from '../../model/Auth/AuthModel';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }>;
  logout(): Promise<void>;
  getSession(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null };
  getActiveBranchId(): string | null;
  setActiveBranchId(id: string | null): void;
}

export class AuthRepository implements IAuthRepository {
  private readonly remote: AuthRemoteDataSource;
  private readonly local: AuthLocalDataSource;

  constructor(remote: AuthRemoteDataSource, local: AuthLocalDataSource) {
    this.remote = remote;
    this.local = local;
  }

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const res = await this.remote.login(credentials);
    const model = new AuthSessionModel({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.user,
    });
    this.local.saveSession({
      user: model.toEntity(),
      accessToken: model.accessToken,
      refreshToken: model.refreshToken,
    });
    if (res.user.branches && res.user.branches.length > 0) {
      this.local.saveActiveBranchId(res.user.branches[0]);
    }
    return {
      user: model.toEntity(),
      accessToken: model.accessToken,
      refreshToken: model.refreshToken,
    };
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
}

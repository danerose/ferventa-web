import type { IAuthRepository, LoginCredentials, AuthSessionData } from '@/app/domain/repository/Auth/IAuthRepository';
import type { AuthUser } from '@/app/domain/entities';
import { LoginUseCase } from './LoginUseCase';
import { SaveSessionUseCase } from './SaveSessionUseCase';
import { LogoutUseCase } from './LogoutUseCase';
import { GetSessionUseCase } from './GetSessionUseCase';
import { GetProfileUseCase } from './GetProfileUseCase';
import { ChangePasswordUseCase } from './ChangePasswordUseCase';

/**
 * Composite Facade for Auth UseCases.
 * Provides backwards-compatibility while delegating all execution
 * to single-responsibility UseCase instances.
 */
export class AuthUseCases {
  public readonly loginUseCase: LoginUseCase;
  public readonly saveSessionUseCase: SaveSessionUseCase;
  public readonly logoutUseCase: LogoutUseCase;
  public readonly getSessionUseCase: GetSessionUseCase;
  public readonly getProfileUseCase: GetProfileUseCase;
  public readonly changePasswordUseCase: ChangePasswordUseCase;
  private readonly repository: IAuthRepository;

  constructor(repository: IAuthRepository) {
    this.repository = repository;
    this.loginUseCase = new LoginUseCase(repository);
    this.saveSessionUseCase = new SaveSessionUseCase(repository);
    this.logoutUseCase = new LogoutUseCase(repository);
    this.getSessionUseCase = new GetSessionUseCase(repository);
    this.getProfileUseCase = new GetProfileUseCase(repository);
    this.changePasswordUseCase = new ChangePasswordUseCase(repository);
  }

  login(credentials: LoginCredentials): Promise<AuthSessionData> {
    return this.loginUseCase.execute(credentials);
  }

  saveSession(session: AuthSessionData): void {
    this.saveSessionUseCase.execute(session);
  }

  logout(): Promise<void> {
    return this.logoutUseCase.execute();
  }

  getSession(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null } {
    return this.getSessionUseCase.execute();
  }

  getActiveBranchId(): string | null {
    return this.repository.getActiveBranchId();
  }

  setActiveBranchId(id: string | null): void {
    this.repository.setActiveBranchId(id);
  }

  getActiveBranchName(): string | null {
    return this.repository.getActiveBranchName();
  }

  saveActiveBranch(id: string | null, name?: string | null): void {
    this.repository.saveActiveBranch(id, name);
  }

  getProfile(token: string): Promise<AuthUser> {
    return this.getProfileUseCase.execute(token);
  }

  changePassword(token: string, current: string, next: string): Promise<void> {
    return this.changePasswordUseCase.execute(token, current, next);
  }
}

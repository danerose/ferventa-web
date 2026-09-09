import type { IAuthRepository, AuthSessionData } from '@/app/domain/repository/Auth/IAuthRepository';

export class SaveSessionUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  execute(session: AuthSessionData): void {
    this.authRepository.saveSession(session);
  }
}

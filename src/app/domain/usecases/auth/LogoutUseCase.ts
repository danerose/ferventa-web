import type { IAuthRepository } from '@/app/domain/repository/Auth/IAuthRepository';

export class LogoutUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  execute(): Promise<void> {
    return this.authRepository.logout();
  }
}

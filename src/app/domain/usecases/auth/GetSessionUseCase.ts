import type { IAuthRepository } from '@/app/domain/repository/Auth/IAuthRepository';
import type { AuthUser } from '@/app/domain/entities';

export class GetSessionUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  execute(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null } {
    return this.authRepository.getSession();
  }
}

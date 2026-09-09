import type { IAuthRepository } from '@/app/domain/repository/Auth/IAuthRepository';
import type { AuthUser } from '@/app/domain/entities';

export class GetProfileUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  execute(token: string): Promise<AuthUser> {
    if (!token || !token.trim()) {
      throw new Error('El token es requerido');
    }
    return this.authRepository.getProfile(token.trim());
  }
}

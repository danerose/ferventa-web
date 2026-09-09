import type { IAuthRepository } from '@/app/domain/repository/Auth/IAuthRepository';

export class ChangePasswordUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  execute(token: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!token || !token.trim()) {
      throw new Error('El token de autenticación es requerido');
    }
    if (!currentPassword) {
      throw new Error('La contraseña actual es requerida');
    }
    if (!newPassword) {
      throw new Error('La nueva contraseña es requerida');
    }
    return this.authRepository.changePassword(token, currentPassword, newPassword);
  }
}

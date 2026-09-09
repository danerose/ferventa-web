import type { IAuthRepository, LoginCredentials, AuthSessionData } from '@/app/domain/repository/Auth/IAuthRepository';

export class LoginUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository;
  }

  execute(credentials: LoginCredentials): Promise<AuthSessionData> {
    if (!credentials.username?.trim() && !credentials.email?.trim()) {
      throw new Error('El usuario o correo es requerido');
    }
    if (!credentials.password) {
      throw new Error('La contraseña es requerida');
    }
    return this.authRepository.login(credentials);
  }
}

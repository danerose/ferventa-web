import { NetworkService } from '@/core/services';
import type { AuthUser } from '@/app/domain';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export class AuthRemoteDataSource {
  private readonly networkService: NetworkService;

  constructor(networkService: NetworkService) {
    this.networkService = networkService;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponseDto> {
    return this.networkService.post<LoginResponseDto>('/auth/login', credentials);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.networkService.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
  }
}

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

  async getProfile(token: string): Promise<AuthUser> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener perfil');
    return json.data as AuthUser;
  }

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al actualizar contraseña');
  }
}


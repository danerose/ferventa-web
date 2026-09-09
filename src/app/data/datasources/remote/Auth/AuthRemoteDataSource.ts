import { NetworkService } from '@/core/services';
import { API_ENDPOINTS } from '@/core/constants/endpoints/api.endpoints';
import type { AuthUser } from '@/app/domain';
import { AuthSessionModel } from '../../../model/Auth/AuthModel';

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
}

export interface RawAuthSessionData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginResponseDto {
  success: boolean;
  data: RawAuthSessionData;
  message?: string;
}

export class AuthRemoteDataSource {
  private readonly networkService: NetworkService;

  constructor(networkService: NetworkService) {
    this.networkService = networkService;
  }

  async login(credentials: LoginCredentials): Promise<AuthSessionModel> {
    const rawVal = (credentials.email || credentials.username || '').trim();
    const isEmail = rawVal.includes('@');
    const body = isEmail
      ? { email: rawVal, password: credentials.password }
      : { username: rawVal, password: credentials.password };

    const res = await this.networkService.post<LoginResponseDto>(API_ENDPOINTS.AUTH.LOGIN, body);

    if (!res.data || !res.data.user) {
      throw new Error(res.message || 'Error al iniciar sesión: datos no recibidos');
    }

    return new AuthSessionModel({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      user: res.data.user,
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const res = await this.networkService.post<{ success: boolean; data: { accessToken: string }; message?: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    return res.data;
  }

  async getProfile(token: string): Promise<AuthUser> {
    const res = await this.networkService.get<{ success: boolean; data: AuthUser; message?: string }>(
      API_ENDPOINTS.AUTH.ME,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.data) {
      throw new Error(res.message || 'Error al obtener perfil');
    }
    return res.data;
  }

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    await this.networkService.patch<{ success: boolean; message?: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
}

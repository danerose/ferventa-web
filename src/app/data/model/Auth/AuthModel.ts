import type { AuthUser } from '@/app/domain';

export interface AuthSessionModelDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export class AuthSessionModel {
  public readonly accessToken: string;
  public readonly refreshToken: string;
  public readonly user: AuthUser;

  constructor(dto: AuthSessionModelDto) {
    this.accessToken = dto.accessToken;
    this.refreshToken = dto.refreshToken;
    this.user = dto.user;
  }

  toEntity(): AuthUser {
    return this.user;
  }
}

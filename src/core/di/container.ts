/**
 * Composition Root (Dependency Injection Container)
 *
 * This is the SOLE location in the entire project where `new` is called
 * on Services, DataSources, Repositories, and UseCases.
 *
 * Stores and consumers import pre-wired UseCases and Services directly from this file.
 */

import { networkService, thermalPrintService } from '@/core/services';
import {
  AuthLocalDataSource,
  AuthRemoteDataSource,
} from '@/app/data/datasources';
import {
  AuthRepository,
  APIAdminRepository,
  APIClientPortalRepository,
  APIInventoryRepository,
  APISalesRepository,
  APIServicesRepository,
  APISpecialOrdersRepository,
  APIUserRepository,
  APIAttendanceRepository,
} from '@/app/data/repositories';
import { ClientPortalUseCases, SpecialOrdersUseCases, POSUseCases, UserUseCases } from '@/app/domain/usecases';
import type { LoginCredentials } from '@/app/data/datasources';
import type { AuthUser } from '@/app/domain';

// ─── 1. Infrastructure Services ─────────────────────────────────────────────
export { networkService, thermalPrintService };

// ─── 2. Data Sources ─────────────────────────────────────────────────────────
export const authLocalDataSource = new AuthLocalDataSource();
export const authRemoteDataSource = new AuthRemoteDataSource(networkService);

// ─── 3. Repositories ─────────────────────────────────────────────────────────
export const authRepository = new AuthRepository(authRemoteDataSource, authLocalDataSource);
export const adminRepository = new APIAdminRepository();
export const clientPortalRepository = new APIClientPortalRepository();
export const inventoryRepository = new APIInventoryRepository();
export const salesRepository = new APISalesRepository();
export const servicesRepository = new APIServicesRepository();
export const specialOrdersRepository = new APISpecialOrdersRepository();
export const userRepository = new APIUserRepository();
export const attendanceRepository = new APIAttendanceRepository();

// ─── 4. Use Cases ───────────────────────────────────────────────────────────
export class AuthUseCases {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  login(credentials: LoginCredentials): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    return this.repository.login(credentials);
  }

  saveSession(session: { user: AuthUser; accessToken: string; refreshToken: string }): void {
    this.repository.saveSession(session);
  }

  logout(): Promise<void> {
    return this.repository.logout();
  }

  getSession(): { user: AuthUser | null; accessToken: string | null; refreshToken: string | null } {
    return this.repository.getSession();
  }

  getActiveBranchId(): string | null {
    return this.repository.getActiveBranchId();
  }

  setActiveBranchId(id: string | null): void {
    this.repository.setActiveBranchId(id);
  }
}

export const authUseCases = new AuthUseCases(authRepository);
export const clientPortalUseCases = new ClientPortalUseCases(clientPortalRepository);
export const specialOrdersUseCases = new SpecialOrdersUseCases(specialOrdersRepository);
export const posUseCases = new POSUseCases(
  inventoryRepository,
  salesRepository,
  adminRepository,
  clientPortalRepository,
  servicesRepository
);
export const userUseCases = new UserUseCases(userRepository, adminRepository);


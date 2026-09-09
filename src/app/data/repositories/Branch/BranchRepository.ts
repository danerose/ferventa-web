import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '@/app/domain/entities';
import type { BranchRemoteDataSource } from '@/app/data/datasources/remote/Branch/BranchRemoteDataSource';
import type { BranchLocalDataSource } from '@/app/data/datasources/local/Branch/BranchLocalDataSource';

export class BranchRepository implements IBranchRepository {
  private readonly remote: BranchRemoteDataSource;
  private readonly local: BranchLocalDataSource;

  constructor(remote: BranchRemoteDataSource, local: BranchLocalDataSource) {
    this.remote = remote;
    this.local = local;
  }

  async getBranches(): Promise<Branch[]> {
    const models = await this.remote.getBranches();
    return models.map((m) => m.toEntity());
  }

  async getUserBranches(): Promise<Branch[]> {
    const models = await this.remote.getUserBranches();
    return models.map((m) => m.toEntity());
  }

  async getPublicBranches(): Promise<Branch[]> {
    const models = await this.remote.getPublicBranches();
    return models.map((m) => m.toEntity());
  }

  async getBranchById(id: string): Promise<Branch> {
    const model = await this.remote.getBranchById(id);
    return model.toEntity();
  }

  async createBranch(payload: CreateBranchPayload): Promise<Branch> {
    const model = await this.remote.createBranch(payload);
    return model.toEntity();
  }

  async updateBranch(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    const model = await this.remote.updateBranch(id, payload);
    return model.toEntity();
  }

  async deleteBranch(id: string): Promise<void> {
    await this.remote.deleteBranch(id);
  }

  async migrateBranches(): Promise<void> {
    await this.remote.migrateBranches();
  }

  getActiveBranchId(): string | null {
    return this.local.getActiveBranchId();
  }

  getActiveBranchName(): string | null {
    return this.local.getActiveBranchName();
  }

  saveActiveBranch(id: string | null, name?: string | null): void {
    this.local.saveActiveBranch(id, name);
  }
}

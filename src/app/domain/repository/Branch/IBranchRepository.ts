import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '@/app/domain/entities';

export interface IBranchRepository {
  getBranches(): Promise<Branch[]>;
  getUserBranches(): Promise<Branch[]>;
  getPublicBranches(): Promise<Branch[]>;
  getBranchById(id: string): Promise<Branch>;
  createBranch(payload: CreateBranchPayload): Promise<Branch>;
  updateBranch(id: string, payload: UpdateBranchPayload): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;
  migrateBranches(): Promise<void>;
  getActiveBranchId(): string | null;
  getActiveBranchName(): string | null;
  saveActiveBranch(id: string | null, name?: string | null): void;
}

import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '@/app/domain/entities';
import { GetBranchesUseCase } from './GetBranchesUseCase';
import { GetUserBranchesUseCase } from './GetUserBranchesUseCase';
import { GetPublicBranchesUseCase } from './GetPublicBranchesUseCase';
import { GetBranchByIdUseCase } from './GetBranchByIdUseCase';
import { CreateBranchUseCase } from './CreateBranchUseCase';
import { UpdateBranchUseCase } from './UpdateBranchUseCase';
import { DeleteBranchUseCase } from './DeleteBranchUseCase';
import { MigrateBranchesUseCase } from './MigrateBranchesUseCase';
import { GetActiveBranchUseCase } from './GetActiveBranchUseCase';
import { SaveActiveBranchUseCase } from './SaveActiveBranchUseCase';

/**
 * Composite Facade for Branch UseCases.
 * Provides backwards-compatibility for components that import `branchUseCases`,
 * while delegating all execution to single-responsibility UseCase instances.
 */
export class BranchUseCases {
  public readonly getBranchesUseCase: GetBranchesUseCase;
  public readonly getUserBranchesUseCase: GetUserBranchesUseCase;
  public readonly getPublicBranchesUseCase: GetPublicBranchesUseCase;
  public readonly getBranchByIdUseCase: GetBranchByIdUseCase;
  public readonly createBranchUseCase: CreateBranchUseCase;
  public readonly updateBranchUseCase: UpdateBranchUseCase;
  public readonly deleteBranchUseCase: DeleteBranchUseCase;
  public readonly migrateBranchesUseCase: MigrateBranchesUseCase;
  public readonly getActiveBranchUseCase: GetActiveBranchUseCase;
  public readonly saveActiveBranchUseCase: SaveActiveBranchUseCase;

  constructor(repository: IBranchRepository) {
    this.getBranchesUseCase = new GetBranchesUseCase(repository);
    this.getUserBranchesUseCase = new GetUserBranchesUseCase(repository);
    this.getPublicBranchesUseCase = new GetPublicBranchesUseCase(repository);
    this.getBranchByIdUseCase = new GetBranchByIdUseCase(repository);
    this.createBranchUseCase = new CreateBranchUseCase(repository);
    this.updateBranchUseCase = new UpdateBranchUseCase(repository);
    this.deleteBranchUseCase = new DeleteBranchUseCase(repository);
    this.migrateBranchesUseCase = new MigrateBranchesUseCase(repository);
    this.getActiveBranchUseCase = new GetActiveBranchUseCase(repository);
    this.saveActiveBranchUseCase = new SaveActiveBranchUseCase(repository);
  }

  getBranches(): Promise<Branch[]> {
    return this.getBranchesUseCase.execute();
  }

  getUserBranches(): Promise<Branch[]> {
    return this.getUserBranchesUseCase.execute();
  }

  getPublicBranches(): Promise<Branch[]> {
    return this.getPublicBranchesUseCase.execute();
  }

  getBranchById(id: string): Promise<Branch> {
    return this.getBranchByIdUseCase.execute(id);
  }

  createBranch(payload: CreateBranchPayload): Promise<Branch> {
    return this.createBranchUseCase.execute(payload);
  }

  updateBranch(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    return this.updateBranchUseCase.execute(id, payload);
  }

  deleteBranch(id: string): Promise<void> {
    return this.deleteBranchUseCase.execute(id);
  }

  migrateBranches(): Promise<void> {
    return this.migrateBranchesUseCase.execute();
  }

  getActiveBranchId(): string | null {
    return this.getActiveBranchUseCase.getId();
  }

  getActiveBranchName(): string | null {
    return this.getActiveBranchUseCase.getName();
  }

  saveActiveBranch(id: string | null, name?: string | null): void {
    this.saveActiveBranchUseCase.execute(id, name);
  }
}

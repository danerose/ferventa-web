import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';

export class SaveActiveBranchUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(id: string | null, name?: string | null): void {
    this.branchRepository.saveActiveBranch(id, name);
  }
}

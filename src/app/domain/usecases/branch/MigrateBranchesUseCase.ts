import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';

export class MigrateBranchesUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(): Promise<void> {
    return this.branchRepository.migrateBranches();
  }
}

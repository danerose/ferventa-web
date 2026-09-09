import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';
import type { Branch } from '@/app/domain/entities';

export class GetPublicBranchesUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(): Promise<Branch[]> {
    return this.branchRepository.getPublicBranches();
  }
}

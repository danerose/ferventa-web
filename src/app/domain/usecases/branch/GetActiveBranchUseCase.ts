import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';

export interface ActiveBranchInfo {
  id: string | null;
  name: string | null;
}

export class GetActiveBranchUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(): ActiveBranchInfo {
    return {
      id: this.branchRepository.getActiveBranchId(),
      name: this.branchRepository.getActiveBranchName(),
    };
  }

  getId(): string | null {
    return this.branchRepository.getActiveBranchId();
  }

  getName(): string | null {
    return this.branchRepository.getActiveBranchName();
  }
}

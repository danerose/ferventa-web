import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';
import type { Branch, CreateBranchPayload } from '@/app/domain/entities';

export class CreateBranchUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(payload: CreateBranchPayload): Promise<Branch> {
    if (!payload.name?.trim()) {
      throw new Error('El nombre de la sucursal es requerido');
    }
    return this.branchRepository.createBranch(payload);
  }
}

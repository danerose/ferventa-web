import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';
import type { Branch, UpdateBranchPayload } from '@/app/domain/entities';

export class UpdateBranchUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(id: string, payload: UpdateBranchPayload): Promise<Branch> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la sucursal es requerido');
    }
    return this.branchRepository.updateBranch(id.trim(), payload);
  }
}

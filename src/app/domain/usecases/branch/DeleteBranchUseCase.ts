import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';

export class DeleteBranchUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la sucursal es requerido');
    }
    return this.branchRepository.deleteBranch(id.trim());
  }
}

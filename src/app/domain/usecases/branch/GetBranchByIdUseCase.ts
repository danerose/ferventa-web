import type { IBranchRepository } from '@/app/domain/repository/Branch/IBranchRepository';
import type { Branch } from '@/app/domain/entities';

export class GetBranchByIdUseCase {
  private readonly branchRepository: IBranchRepository;

  constructor(branchRepository: IBranchRepository) {
    this.branchRepository = branchRepository;
  }

  execute(id: string): Promise<Branch> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la sucursal es requerido');
    }
    return this.branchRepository.getBranchById(id.trim());
  }
}

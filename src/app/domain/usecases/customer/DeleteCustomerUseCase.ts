import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';

export class DeleteCustomerUseCase {
  private readonly customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new Error('El ID del cliente es requerido');
    }
    return this.customerRepository.deleteCustomer(id.trim());
  }
}

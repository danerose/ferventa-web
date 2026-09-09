import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { Customer } from '@/app/domain/entities';

export class GetCustomerByIdUseCase {
  private readonly customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  execute(id: string): Promise<Customer> {
    if (!id || !id.trim()) {
      throw new Error('El ID del cliente es requerido');
    }
    return this.customerRepository.getCustomerById(id.trim());
  }
}

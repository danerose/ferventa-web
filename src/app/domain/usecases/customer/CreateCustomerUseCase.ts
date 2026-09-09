import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { Customer } from '@/app/domain/entities';

export class CreateCustomerUseCase {
  private readonly customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  execute(payload: Partial<Customer>): Promise<Customer> {
    if (!payload.name?.trim()) {
      throw new Error('El nombre del cliente es requerido');
    }
    return this.customerRepository.createCustomer(payload);
  }
}

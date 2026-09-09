import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { Customer } from '@/app/domain/entities';

export class UpdateCustomerUseCase {
  private readonly customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  execute(id: string, payload: Partial<Customer>): Promise<Customer> {
    if (!id || !id.trim()) {
      throw new Error('El ID del cliente es requerido');
    }
    return this.customerRepository.updateCustomer(id.trim(), payload);
  }
}

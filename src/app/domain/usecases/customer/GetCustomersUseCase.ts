import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { Customer } from '@/app/domain/entities';

export class GetCustomersUseCase {
  private readonly customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  execute(search?: string): Promise<Customer[]> {
    return this.customerRepository.getCustomers(search);
  }
}

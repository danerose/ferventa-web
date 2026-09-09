import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { CustomerLookupResult } from '@/app/domain/entities';

export class GetCustomerByPhoneUseCase {
  private readonly customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  execute(phone: string): Promise<CustomerLookupResult | null> {
    if (!phone || !phone.trim()) {
      throw new Error('El teléfono del cliente es requerido');
    }
    return this.customerRepository.getCustomerByPhone(phone.trim());
  }
}

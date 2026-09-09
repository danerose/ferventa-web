import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { Vehicle } from '@/app/domain/entities';

export class UpdateVehicleDetailsUseCase {
  private readonly customerRepository: ICustomerRepository;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  execute(orderId: string, vehicle: Partial<Vehicle>): Promise<void> {
    if (!orderId || !orderId.trim()) {
      throw new Error('El ID de la orden es requerido');
    }
    return this.customerRepository.updateVehicleDetails(orderId.trim(), vehicle);
  }
}

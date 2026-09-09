import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { Customer, CustomerLookupResult, Vehicle } from '@/app/domain/entities';
import { LookupCustomerUseCase } from './LookupCustomerUseCase';
import { GetCustomerByPhoneUseCase } from './GetCustomerByPhoneUseCase';
import { GetCustomersUseCase } from './GetCustomersUseCase';
import { GetCustomerByIdUseCase } from './GetCustomerByIdUseCase';
import { CreateCustomerUseCase } from './CreateCustomerUseCase';
import { UpdateCustomerUseCase } from './UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from './DeleteCustomerUseCase';
import { UpdateVehicleDetailsUseCase } from './UpdateVehicleDetailsUseCase';

/**
 * Composite Facade for Customer UseCases.
 * Provides backwards-compatibility while delegating all execution
 * to single-responsibility UseCase instances.
 */
export class CustomerUseCases {
  public readonly lookupCustomerUseCase: LookupCustomerUseCase;
  public readonly getCustomerByPhoneUseCase: GetCustomerByPhoneUseCase;
  public readonly getCustomersUseCase: GetCustomersUseCase;
  public readonly getCustomerByIdUseCase: GetCustomerByIdUseCase;
  public readonly createCustomerUseCase: CreateCustomerUseCase;
  public readonly updateCustomerUseCase: UpdateCustomerUseCase;
  public readonly deleteCustomerUseCase: DeleteCustomerUseCase;
  public readonly updateVehicleDetailsUseCase: UpdateVehicleDetailsUseCase;

  constructor(repository: ICustomerRepository) {
    this.lookupCustomerUseCase = new LookupCustomerUseCase(repository);
    this.getCustomerByPhoneUseCase = new GetCustomerByPhoneUseCase(repository);
    this.getCustomersUseCase = new GetCustomersUseCase(repository);
    this.getCustomerByIdUseCase = new GetCustomerByIdUseCase(repository);
    this.createCustomerUseCase = new CreateCustomerUseCase(repository);
    this.updateCustomerUseCase = new UpdateCustomerUseCase(repository);
    this.deleteCustomerUseCase = new DeleteCustomerUseCase(repository);
    this.updateVehicleDetailsUseCase = new UpdateVehicleDetailsUseCase(repository);
  }

  lookupCustomer(phone: string): Promise<CustomerLookupResult | null> {
    return this.lookupCustomerUseCase.execute(phone);
  }

  getCustomerByPhone(phone: string): Promise<CustomerLookupResult | null> {
    return this.getCustomerByPhoneUseCase.execute(phone);
  }

  getCustomers(search?: string): Promise<Customer[]> {
    return this.getCustomersUseCase.execute(search);
  }

  getCustomerById(id: string): Promise<Customer> {
    return this.getCustomerByIdUseCase.execute(id);
  }

  createCustomer(payload: Partial<Customer>): Promise<Customer> {
    return this.createCustomerUseCase.execute(payload);
  }

  updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer> {
    return this.updateCustomerUseCase.execute(id, payload);
  }

  deleteCustomer(id: string): Promise<void> {
    return this.deleteCustomerUseCase.execute(id);
  }

  updateVehicleDetails(orderId: string, vehicle: Partial<Vehicle>): Promise<void> {
    return this.updateVehicleDetailsUseCase.execute(orderId, vehicle);
  }
}

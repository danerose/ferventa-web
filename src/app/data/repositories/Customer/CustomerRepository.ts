import type { ICustomerRepository } from '@/app/domain/repository/Customer/ICustomerRepository';
import type { Customer, CustomerLookupResult, Vehicle } from '@/app/domain/entities';
import type { CustomerRemoteDataSource } from '@/app/data/datasources/remote/Customer/CustomerRemoteDataSource';

export class CustomerRepository implements ICustomerRepository {
  private readonly remote: CustomerRemoteDataSource;

  constructor(remote: CustomerRemoteDataSource) {
    this.remote = remote;
  }

  lookupCustomer(phone: string): Promise<CustomerLookupResult | null> {
    return this.remote.lookupCustomer(phone);
  }

  getCustomerByPhone(phone: string): Promise<CustomerLookupResult | null> {
    return this.remote.getCustomerByPhone(phone);
  }

  getCustomers(search?: string): Promise<Customer[]> {
    return this.remote.getCustomers(search);
  }

  getCustomerById(id: string): Promise<Customer> {
    return this.remote.getCustomerById(id);
  }

  createCustomer(payload: Partial<Customer>): Promise<Customer> {
    return this.remote.createCustomer(payload);
  }

  updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer> {
    return this.remote.updateCustomer(id, payload);
  }

  deleteCustomer(id: string): Promise<void> {
    return this.remote.deleteCustomer(id);
  }

  updateVehicleDetails(orderId: string, vehicle: Partial<Vehicle>): Promise<void> {
    return this.remote.updateVehicleDetails(orderId, vehicle);
  }
}

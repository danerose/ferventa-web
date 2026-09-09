import type { Customer, CustomerLookupResult, Vehicle } from '@/app/domain/entities';

export interface ICustomerRepository {
  lookupCustomer(phone: string): Promise<CustomerLookupResult | null>;
  getCustomerByPhone(phone: string): Promise<CustomerLookupResult | null>;
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer>;
  createCustomer(payload: Partial<Customer>): Promise<Customer>;
  updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  updateVehicleDetails(orderId: string, vehicle: Partial<Vehicle>): Promise<void>;
}

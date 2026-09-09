import { NetworkService } from '@/core/services';
import { API_ENDPOINTS } from '@/core/constants';
import {
  CustomerModel,
  type RawCustomerResponse,
} from '@/app/data/model/Customer/CustomerModel';
import type { Customer, CustomerLookupResult, Vehicle } from '@/app/domain/entities';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class CustomerRemoteDataSource {
  private readonly network: NetworkService;

  constructor(network: NetworkService) {
    this.network = network;
  }

  async lookupCustomer(phone: string): Promise<CustomerLookupResult | null> {
    try {
      const res = await this.network.get<ApiResponse<{ customer?: RawCustomerResponse; vehicles?: RawCustomerResponse['vehicles'] } | RawCustomerResponse>>(
        API_ENDPOINTS.CUSTOMERS.BY_PHONE(phone)
      );
      if (!res.data) return null;
      const lookup = CustomerModel.toLookupResult(res.data);
      if (lookup && lookup.id) {
        try {
          const vehRes = await this.network.get<any>(API_ENDPOINTS.VEHICLES.BASE, {
            params: { customerId: lookup.id },
          });
          const rawVehicles = Array.isArray(vehRes)
            ? vehRes
            : (vehRes?.data && Array.isArray(vehRes.data) ? vehRes.data : []);
          if (Array.isArray(rawVehicles) && rawVehicles.length > 0) {
            lookup.vehicles = rawVehicles.map((v: any) => ({
              id: v.id || v._id,
              _id: v._id || v.id,
              brand: v.brand || '',
              model: v.model || '',
              year: v.year,
              serialNumberLastFour: v.serialNumberLastFour || '',
              licensePlate: v.licensePlate,
              color: v.color,
            }));
          }
        } catch {
          // Keep existing vehicles from lookup if vehicles endpoint call fails
        }
      }
      return lookup;
    } catch {
      return null;
    }
  }

  async getCustomerByPhone(phone: string): Promise<CustomerLookupResult | null> {
    return this.lookupCustomer(phone);
  }

  async getCustomers(search?: string): Promise<Customer[]> {
    const res = await this.network.get<ApiResponse<RawCustomerResponse[]>>(
      API_ENDPOINTS.CUSTOMERS.BASE,
      { params: search ? { search } : undefined }
    );
    return (res.data || []).map((c) => CustomerModel.toEntity(c));
  }

  async getCustomerById(id: string): Promise<Customer> {
    const res = await this.network.get<ApiResponse<RawCustomerResponse>>(
      API_ENDPOINTS.CUSTOMERS.BY_ID(id)
    );
    return CustomerModel.toEntity(res.data);
  }

  async createCustomer(payload: Partial<Customer>): Promise<Customer> {
    const body: Record<string, unknown> = {
      name: payload.name,
      phone: payload.phone,
    };
    if (payload.email) body.email = payload.email;
    if (payload.whatsappId) body.whatsappId = payload.whatsappId;

    const res = await this.network.post<ApiResponse<RawCustomerResponse>>(
      API_ENDPOINTS.CUSTOMERS.BASE,
      body
    );
    return CustomerModel.toEntity(res.data);
  }

  async updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer> {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.phone !== undefined) body.phone = payload.phone;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.whatsappId !== undefined) body.whatsappId = payload.whatsappId;

    const res = await this.network.patch<ApiResponse<RawCustomerResponse>>(
      API_ENDPOINTS.CUSTOMERS.BY_ID(id),
      body
    );
    return CustomerModel.toEntity(res.data);
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.network.delete<ApiResponse<null>>(API_ENDPOINTS.CUSTOMERS.BY_ID(id));
  }

  async updateVehicleDetails(vehicleId: string, vehicle: Partial<Vehicle>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (vehicle.customerId) body.customerId = vehicle.customerId;
    if (vehicle.brand) body.brand = vehicle.brand;
    if (vehicle.model) body.model = vehicle.model;
    if (vehicle.year) body.year = Number(vehicle.year);
    if (vehicle.serialNumberLastFour) body.serialNumberLastFour = vehicle.serialNumberLastFour;
    if (vehicle.color) body.color = vehicle.color;

    await this.network.patch<ApiResponse<null>>(
      API_ENDPOINTS.VEHICLES.BY_ID(vehicleId),
      body
    );
  }
}

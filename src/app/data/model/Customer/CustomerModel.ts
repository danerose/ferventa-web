import type { Customer, CustomerLookupResult } from '@/app/domain/entities';

export interface RawCustomerResponse {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  vehicles?: {
    _id?: string;
    id?: string;
    brand: string;
    model: string;
    year: number | string;
    serialNumberLastFour: string;
    licensePlate?: string;
    color?: string;
  }[];
  createdAt?: string;
}

export class CustomerModel {
  static toEntity(raw: RawCustomerResponse): Customer {
    const id = raw.id || raw._id || '';
    return {
      id,
      _id: id,
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      vehicles: (raw.vehicles || []).map((v) => ({
        id: v.id || v._id,
        _id: v._id || v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        serialNumberLastFour: v.serialNumberLastFour,
        licensePlate: v.licensePlate,
        color: v.color,
      })),
      createdAt: raw.createdAt,
    };
  }

  static toLookupResult(raw: { customer?: RawCustomerResponse; vehicles?: RawCustomerResponse['vehicles'] } | RawCustomerResponse): CustomerLookupResult {
    const cust: RawCustomerResponse = 'customer' in raw && raw.customer ? raw.customer : (raw as RawCustomerResponse);
    const id = cust.id || cust._id || '';
    const rawVehicles = ('vehicles' in raw && raw.vehicles ? raw.vehicles : cust.vehicles) || [];

    return {
      id,
      _id: id,
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email,
      vehicles: rawVehicles.map((v) => ({
        id: v.id || v._id,
        _id: v._id || v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        serialNumberLastFour: v.serialNumberLastFour,
        licensePlate: v.licensePlate,
        color: v.color,
      })),
      customer: 'customer' in raw && raw.customer ? CustomerModel.toEntity(raw.customer) : CustomerModel.toEntity(cust),
    };
  }
}

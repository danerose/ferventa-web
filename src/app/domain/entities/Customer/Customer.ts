export interface Vehicle {
  id?: string;
  _id?: string;
  customerId?: string;
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
  licensePlate?: string;
  color?: string;
}

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  whatsappId?: string;
  vehicles?: Vehicle[];
  createdAt?: string;
}

export interface CustomerLookupVehicle {
  id?: string;
  _id?: string;
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
  licensePlate?: string;
  color?: string;
}

export interface CustomerLookupResult {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  whatsappId?: string;
  vehicles?: CustomerLookupVehicle[];
  customer?: Customer;
}

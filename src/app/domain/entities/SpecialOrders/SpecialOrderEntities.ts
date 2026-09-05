import { SpecialOrderStatus } from '@/core/enums';

export interface SpecialOrderPayment {
  id?: string;
  _id?: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | string;
  paymentReference?: string;
  date: string;
  notes?: string;
  receivedBy?: {
    id?: string;
    _id?: string;
    name?: string;
    username?: string;
  };
}

export interface SpecialOrderStatusHistory {
  status: SpecialOrderStatus | string;
  changedAt: string;
  notes?: string;
  changedBy?: {
    id?: string;
    _id?: string;
    name?: string;
    username?: string;
  };
}

export interface SpecialOrderCustomer {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
}

export interface SpecialOrder {
  id: string;
  _id?: string;
  folio: string;
  itemDescription: string;
  costPrice: number;
  sellingPrice: number;
  advancePayment: number;
  minAdvanceRequired: number;
  advancePercentage: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  status: SpecialOrderStatus | string;
  customer: SpecialOrderCustomer;
  payments: SpecialOrderPayment[];
  statusHistory: SpecialOrderStatusHistory[];
  notes?: string;
  estimatedArrivalDate?: string;
  cancellationReason?: string;
  branch?: string;
  createdBy?: {
    id?: string;
    _id?: string;
    name?: string;
    username?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SpecialOrderSummary {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalPendingBalance: number;
  totalCollected: number;
  totalSalesValue: number;
  byStatus: Record<SpecialOrderStatus | string, number>;
}

export interface CreateSpecialOrderPayload {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  itemDescription: string;
  costPrice: number;
  sellingPrice: number;
  advancePayment: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | string;
  paymentReference?: string;
  notes?: string;
  estimatedArrivalDate?: string;
}

export interface AddSpecialOrderPaymentPayload {
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | string;
  paymentReference?: string;
  notes?: string;
}

export interface UpdateSpecialOrderStatusPayload {
  status: SpecialOrderStatus | string;
  notes?: string;
}

export interface CancelSpecialOrderPayload {
  reason: string;
}

export interface SpecialOrderFilters {
  search?: string;
  status?: string;
  isFullyPaid?: boolean;
  startDate?: string;
  endDate?: string;
}

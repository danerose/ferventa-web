import type { Product } from './InventoryEntities';

export interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  date: string;
  customerName?: string;
  customerEmail?: string;
}

export interface CreateSaleDto {
  items: { productId: string; quantity: number }[];
  paymentMethod: 'cash' | 'card' | 'transfer';
  customerName?: string;
  customerEmail?: string;
  discountAmount?: number;
}

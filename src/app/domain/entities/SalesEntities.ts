import type { Product } from './InventoryEntities';

// ─── Predefined Services (Workshop Catalog) ──────────────────────────────────

export interface ServiceSupply {
  product: {
    _id: string;
    name: string;
    sku: string;
    sellingPrice: number;
  };
  quantity: number;
}

export interface PredefinedService {
  id: string;        // mapped from _id
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
  supplies: ServiceSupply[];
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  basePrice: number;
  isActive?: boolean;
  supplies: { productId: string; quantity: number }[];
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  basePrice?: number;
  isActive?: boolean;
  supplies?: { productId: string; quantity: number }[];
}

// ─── Cart Item (POS) ──────────────────────────────────────────────────────────

export interface CartItem {
  /** Unique local ID for this cart row (allows same product added multiple times in theory) */
  cartId: string;
  /** If this item was added as part of a service, this links to the service's cartId */
  parentCartId?: string;
  type: 'product' | 'service';
  // Populated for product items
  product?: Product;
  // Populated for service items
  service?: PredefinedService;
  // Display fields (copied at add time so they survive even if product is undefined)
  name: string;
  sku?: string;
  quantity: number;
  /** Editable price (can be changed inline in the cart) */
  unitPrice: number;
  /** Original catalog price (for display reference) */
  originalPrice: number;
  subtotal: number;
  isNoAplica?: boolean;
}

// ─── Sale Entities ────────────────────────────────────────────────────────────

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface SaleItemPayload {
  type: 'product' | 'service';
  productId?: string;
  serviceId?: string;
  quantity: number;
  unitPrice?: number;  // if provided, overrides catalog price
  discount?: number;
}

export interface CreateSalePayload {
  customerId?: string;
  quoteId?: string;
  items: SaleItemPayload[];
  globalDiscount?: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
}

export interface Sale {
  id: string;
  folio?: string;
  customer?: { id: string; name: string };
  items: any[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  isCancelled?: boolean;
  createdAt: string;
  branch?: { id: string; name: string };
  seller?: { id: string; name: string };
}

// ─── Legacy — kept for backwards compatibility ────────────────────────────────

/** @deprecated Use CartItem instead */
export interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  originalPrice?: number;
  isNoAplica?: boolean;
}

/** @deprecated Use CreateSalePayload instead */
export interface CreateSaleDto {
  items: { productId: string; quantity: number }[];
  paymentMethod: 'cash' | 'card' | 'transfer';
  customerName?: string;
  customerEmail?: string;
  discountAmount?: number;
}

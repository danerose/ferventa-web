export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  providerCode: string;
}

export interface Product {
  id: string;
  _id?: string;
  sku: string;
  name: string;
  description?: string;
  brand?: Brand;
  category?: Category;
  costPrice: number;
  sellingPrice: number;
  stock: number; // Mostrador / Piso de venta activo
  sealedStock?: number; // Piezas en cajas selladas en bodega
  totalStock?: number; // Stock total (mostrador + bodega)
  sealedBoxesCount?: number; // Número de cajas pendientes por abrir
  minStock: number;
  unit: string;
  photos?: string[];
  compatibility: string[];
}

export interface StockMovement {
  id: string;
  product: Product;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  provider?: Provider;
  providerId?: string;
  balanceAfter?: number;
  unitCost?: number;
  reference?: string;
}

export interface CreateProviderDto {
  name: string;
  providerCode: string;
  branchId?: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  brandId: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  photos?: string[];
  compatibility: string[];
  branchId?: string;
}

export interface CreateStockMovementDto {
  productId: string;
  providerId?: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  branchId?: string;
}

export interface MerchandiseReceptionItem {
  _id?: string;
  id?: string;
  productId: string;
  product?: Product;
  sku?: string;
  name?: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  boxCode?: string;
  isBoxSealed?: boolean;
}

export interface MerchandiseReceptionBox {
  boxCode: string;
  productId: string;
  product?: {
    id?: string;
    _id?: string;
    name?: string;
    sku?: string;
    sellingPrice?: number;
    unit?: string;
  };
  quantity: number;
  itemsPerBox?: number;
  costPrice: number;
  sellingPrice: number;
  isOpened?: boolean;
  openedAt?: string;
  openedBy?: { id?: string; name?: string };
}

export interface MerchandiseReception {
  id: string;
  _id?: string;
  providerId: string;
  provider?: Provider;
  status: 'draft' | 'approved' | 'rejected';
  items: MerchandiseReceptionItem[];
  boxes?: MerchandiseReceptionBox[];
  totalBoxes?: number;          // Total de bultos/cajas en esta recepción
  sealedBoxesCount?: number;    // Cuántas cajas quedan por abrir
  openedBoxesCount?: number;    // Cuántas cajas ya se abrieron
  isFullyOpened?: boolean;      // true si ya se abrieron todas (sealedBoxesCount === 0)
  sealedStock?: number;         // Total de piezas aún selladas en bodega
  openedStock?: number;         // Total de piezas que ya pasaron al mostrador
  totalStock?: number;          // Total de piezas en la remisión
  invoiceOrFolio?: string;
  notes?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: { id?: string; name?: string };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDraftReceptionDto {
  providerId: string;
  items: {
    productId: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
  }[];
  invoiceOrFolio?: string;
  notes?: string;
}

export interface OpenBoxResult {
  boxCode: string;
  product?: Product;
  addedQuantity: number;
  newSellingPrice: number;
  previousSellingPrice?: number;
  message?: string;
}


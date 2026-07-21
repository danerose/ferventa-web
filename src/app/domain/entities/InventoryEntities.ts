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
  sku: string;
  name: string;
  description?: string;
  brand: Brand;
  category: Category;
  costPrice: number;
  sellingPrice: number;
  stock: number;
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
}

export interface CreateProviderDto {
  name: string;
  providerCode: string;
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
}

export interface CreateStockMovementDto {
  productId: string;
  providerId?: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
}

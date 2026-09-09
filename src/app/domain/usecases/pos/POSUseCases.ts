import type {
  Product,
  PredefinedService,
  Sale,
  Branch,
  IBranchRepository,
} from '@/app/domain';
import type {
  APIInventoryRepository,
  APISalesRepository,
  APIClientPortalRepository,
  APIServicesRepository,
} from '@/app/data/repositories';

export class POSUseCases {
  private readonly inventoryRepo: APIInventoryRepository;
  private readonly salesRepo: APISalesRepository;
  private readonly branchRepo: IBranchRepository;
  private readonly clientPortalRepo: APIClientPortalRepository;
  private readonly servicesRepo: APIServicesRepository;

  constructor(
    inventoryRepo: APIInventoryRepository,
    salesRepo: APISalesRepository,
    branchRepo: IBranchRepository,
    clientPortalRepo: APIClientPortalRepository,
    servicesRepo: APIServicesRepository
  ) {
    this.inventoryRepo = inventoryRepo;
    this.salesRepo = salesRepo;
    this.branchRepo = branchRepo;
    this.clientPortalRepo = clientPortalRepo;
    this.servicesRepo = servicesRepo;
  }

  async getBranches(): Promise<Branch[]> {
    try {
      const data = await this.branchRepo.getBranches();
      if (data?.length) return data;
    } catch {
      // ignore fallback
    }
    try {
      const publicData = await this.clientPortalRepo.getPublicBranches();
      if (publicData?.length) return publicData.map((b) => ({ ...b, id: b.id }));
    } catch {
      // ignore
    }
    return [];
  }

  async getInitialProducts(accessToken: string): Promise<{ initial: Product[]; allForSupplies: Product[] }> {
    const [res, allRes] = await Promise.all([
      this.inventoryRepo.getProductsPaginated(accessToken, { limit: 20 }),
      this.inventoryRepo.getProducts(accessToken),
    ]);
    return {
      initial: res.items,
      allForSupplies: allRes,
    };
  }

  getProducts(accessToken: string, query?: string): Promise<Product[]> {
    return this.inventoryRepo.getProducts(accessToken, query ? { search: query } : undefined);
  }

  async findProductByBarcode(accessToken: string, barcode: string): Promise<Product | null> {
    const product = await this.inventoryRepo.getProductBySku(accessToken, barcode);
    if (product) return product;
    const results = await this.inventoryRepo.getProducts(accessToken, { search: barcode });
    return results && results.length > 0 ? results[0] : null;
  }

  getServices(accessToken: string, search?: string): Promise<PredefinedService[]> {
    return this.servicesRepo.getServices(accessToken, { isActive: true, search: search?.trim() || undefined });
  }

  createSale(accessToken: string, saleData: Parameters<APISalesRepository['createSale']>[1]): Promise<Sale> {
    return this.salesRepo.createSale(accessToken, saleData);
  }
}

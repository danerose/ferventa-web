import { NetworkService } from '@/core/services';
import { API_ENDPOINTS } from '@/core/constants';
import { BranchModel, type RawBranchResponse } from '@/app/data/model/Branch/BranchModel';
import type { CreateBranchPayload, UpdateBranchPayload } from '@/app/domain/entities';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class BranchRemoteDataSource {
  private readonly network: NetworkService;

  constructor(network: NetworkService) {
    this.network = network;
  }

  async getBranches(): Promise<BranchModel[]> {
    const res = await this.network.get<ApiResponse<RawBranchResponse[]>>(API_ENDPOINTS.BRANCHES.BASE);
    return (res.data || []).map((item) => BranchModel.fromJson(item));
  }

  async getUserBranches(): Promise<BranchModel[]> {
    const res = await this.network.get<ApiResponse<RawBranchResponse[]>>(API_ENDPOINTS.BRANCHES.USER);
    return (res.data || []).map((item) => BranchModel.fromJson(item));
  }

  async getPublicBranches(): Promise<BranchModel[]> {
    const res = await this.network.get<ApiResponse<RawBranchResponse[]>>(API_ENDPOINTS.BRANCHES.PUBLIC);
    return (res.data || []).map((item) => BranchModel.fromJson(item));
  }

  async getBranchById(id: string): Promise<BranchModel> {
    const res = await this.network.get<ApiResponse<RawBranchResponse>>(API_ENDPOINTS.BRANCHES.BY_ID(id));
    return BranchModel.fromJson(res.data);
  }

  async createBranch(payload: CreateBranchPayload): Promise<BranchModel> {
    const res = await this.network.post<ApiResponse<RawBranchResponse>>(API_ENDPOINTS.BRANCHES.BASE, payload);
    return BranchModel.fromJson(res.data);
  }

  async updateBranch(id: string, payload: UpdateBranchPayload): Promise<BranchModel> {
    const res = await this.network.patch<ApiResponse<RawBranchResponse>>(API_ENDPOINTS.BRANCHES.BY_ID(id), payload);
    return BranchModel.fromJson(res.data);
  }

  async deleteBranch(id: string): Promise<void> {
    await this.network.delete<ApiResponse<null>>(API_ENDPOINTS.BRANCHES.BY_ID(id));
  }

  async migrateBranches(): Promise<void> {
    await this.network.post<ApiResponse<null>>(API_ENDPOINTS.SYSTEM.MIGRATE_BRANCHES);
  }
}

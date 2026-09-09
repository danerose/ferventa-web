import type { Branch } from '@/app/domain/entities';

export interface RawBranchResponse {
  _id?: string;
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export class BranchModel {
  readonly id: string;
  readonly name: string;
  readonly address?: string;
  readonly phone?: string;
  readonly isActive?: boolean;

  constructor(
    id: string,
    name: string,
    address?: string,
    phone?: string,
    isActive?: boolean
  ) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.isActive = isActive;
  }

  static fromJson(json: RawBranchResponse): BranchModel {
    return new BranchModel(
      json.id || json._id || '',
      json.name || '',
      json.address,
      json.phone,
      json.isActive ?? true
    );
  }

  toEntity(): Branch {
    return {
      id: this.id,
      _id: this.id,
      name: this.name,
      address: this.address,
      phone: this.phone,
      isActive: this.isActive,
    };
  }
}

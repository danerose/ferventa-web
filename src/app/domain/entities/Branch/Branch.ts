export interface Branch {
  id: string;
  _id?: string;
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateBranchPayload {
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateBranchPayload {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

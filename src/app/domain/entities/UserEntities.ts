export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  branches?: string[];
}

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  roleId: string;
  branches: string[];
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
  branches?: string[];
}

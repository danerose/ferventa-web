export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  branches?: string[];
}

export interface CreateUserDto {
  name: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  roleId: string;
  branches: string[];
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  isActive?: boolean;
  branches?: string[];
}

export interface CreateUserResponse {
  user: User;
  tempPassword?: string;
  message?: string;
  whatsappUrl?: string;
}

export interface CheckUsernameResponse {
  exists: boolean;
  available: boolean;
  username: string;
}


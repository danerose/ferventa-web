import type {
  User,
  Role,
  CreateUserDto,
  UpdateUserDto,
  CreateUserResponse,
  CheckUsernameResponse,
} from '../../entities';

export interface IUserRepository {
  getRoles(token: string): Promise<Role[]>;
  getUsers(token: string): Promise<User[]>;
  generateUsername(token: string, name: string): Promise<string>;
  checkUsername(token: string, username: string): Promise<CheckUsernameResponse>;
  createUser(token: string, data: CreateUserDto): Promise<CreateUserResponse>;
  updateUser(token: string, id: string, data: UpdateUserDto): Promise<User>;
  deleteUser(token: string, id: string): Promise<void>;
}

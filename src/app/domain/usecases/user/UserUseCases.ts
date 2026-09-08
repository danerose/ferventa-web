import type { IUserRepository } from '../../repository';
import type {
  User,
  Role,
  Branch,
  CreateUserDto,
  UpdateUserDto,
  CreateUserResponse,
  CheckUsernameResponse,
  ResetPasswordResponse,
} from '../../entities';

export interface IAdminBranchProvider {
  getBranches(): Promise<Branch[]>;
}

export class UserUseCases {
  private readonly userRepository: IUserRepository;
  private readonly adminRepository: IAdminBranchProvider;

  constructor(userRepository: IUserRepository, adminRepository: IAdminBranchProvider) {
    this.userRepository = userRepository;
    this.adminRepository = adminRepository;
  }

  getUsers(token: string): Promise<User[]> {
    return this.userRepository.getUsers(token);
  }

  getRoles(token: string): Promise<Role[]> {
    return this.userRepository.getRoles(token);
  }

  getBranches(): Promise<Branch[]> {
    return this.adminRepository.getBranches();
  }

  generateUsername(token: string, name: string): Promise<string> {
    return this.userRepository.generateUsername(token, name);
  }

  checkUsername(token: string, username: string): Promise<CheckUsernameResponse> {
    return this.userRepository.checkUsername(token, username);
  }

  createUser(token: string, data: CreateUserDto): Promise<CreateUserResponse> {
    return this.userRepository.createUser(token, data);
  }

  updateUser(token: string, id: string, data: UpdateUserDto): Promise<User> {
    return this.userRepository.updateUser(token, id, data);
  }

  deleteUser(token: string, id: string): Promise<void> {
    return this.userRepository.deleteUser(token, id);
  }

  resetPassword(token: string, userId: string, newPassword?: string): Promise<ResetPasswordResponse> {
    return this.userRepository.resetPassword(token, userId, newPassword);
  }
}


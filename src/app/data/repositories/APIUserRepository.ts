import type { User, Role, CreateUserDto, UpdateUserDto, CreateUserResponse, CheckUsernameResponse } from '../../domain/entities/UserEntities';

export class APIUserRepository {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    
    try {
      const authRaw = localStorage.getItem('ferventa_auth');
      if (authRaw) {
        const { accessToken } = JSON.parse(authRaw);
        if (accessToken && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${accessToken}`);
        }
      }
    } catch (e) {}

    const activeBranchId = localStorage.getItem('ferventa_active_branch');
    if (!headers.has('x-branch-id')) {
      headers.set('x-branch-id', activeBranchId || '000000000000000000000000');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async getRoles(token: string): Promise<Role[]> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/users/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener roles');
    return json.data;
  }

  async getUsers(token: string): Promise<User[]> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener usuarios');
    return json.data;
  }

  async generateUsername(token: string, name: string): Promise<string> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/users/generate-username?name=${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al generar nombre de usuario');
    return json.data?.username || '';
  }

  async checkUsername(token: string, username: string): Promise<CheckUsernameResponse> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/users/check-username?username=${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al verificar nombre de usuario');
    return json.data;
  }

  async createUser(token: string, data: CreateUserDto): Promise<CreateUserResponse> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear usuario');
    if (json.data && json.data.user) {
      return json.data as CreateUserResponse;
    }
    return { user: json.data as User };
  }

  async updateUser(token: string, id: string, data: UpdateUserDto): Promise<User> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al actualizar usuario');
    return json.data;
  }

  async deleteUser(token: string, id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al eliminar usuario');
  }
}

import type { KioskEmployee, KioskClockPayload, KioskClockResult } from '@/app/domain';

export interface IKioskRepository {
  getKioskEmployees(branchId?: string): Promise<KioskEmployee[]>;
  clockWithPin(payload: KioskClockPayload): Promise<KioskClockResult>;
}

export class APIKioskRepository implements IKioskRepository {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  private async fetchWithBranch(url: string, branchId?: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    const activeBranchId = branchId || localStorage.getItem('ferventa_active_branch') || '000000000000000000000000';
    if (!headers.has('x-branch-id')) {
      headers.set('x-branch-id', activeBranchId);
    }
    return fetch(url, { ...options, headers });
  }

  async getKioskEmployees(branchId?: string): Promise<KioskEmployee[]> {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);

    const res = await this.fetchWithBranch(`${this.baseUrl}/attendance/kiosk/employees?${params.toString()}`, branchId);
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || 'Error al obtener colaboradores del kiosco');
    }
    const raw = json.data;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.employees)
          ? raw.employees
          : [];

    return list.map((e: Record<string, unknown>) => ({
      ...e,
      id: String(e.id || e._id || ''),
    })) as KioskEmployee[];
  }

  async clockWithPin(payload: KioskClockPayload): Promise<KioskClockResult> {
    const res = await this.fetchWithBranch(
      `${this.baseUrl}/attendance/kiosk/clock`,
      payload.branchId,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (res.status === 401) {
      throw new Error(json.message || 'PIN de 4 dígitos incorrecto. Inténtalo de nuevo.');
    }
    if (!res.ok || json.success === false) {
      throw new Error(json.message || 'Error al registrar turno');
    }
    const resData = (json.data && typeof json.data === 'object' && 'data' in json.data) ? (json.data as { data: unknown }).data : json.data;
    return resData as KioskClockResult;
  }
}

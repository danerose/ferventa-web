import type { AdminAppointment, AuthUser } from '../../domain/entities/AdminEntities';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AppointmentsFilter {
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

interface RawAdminAppointment {
  id?: string;
  _id?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicle?: {
    brand: string;
    model: string;
    year: number | string;
    serialNumberLastFour: string;
    color?: string;
  };
  serviceRequested?: string;
  scheduledAt?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'rescheduled';
  notes?: string;
  duration?: number;
  assignedMechanic?: string;
  branchName?: string;
}

export class APIAdminRepository {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  async login(email: string, password: string): Promise<LoginResult> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Credenciales incorrectas');
    }
    return json.data as LoginResult;
  }

  async getAppointments(token: string, filter: AppointmentsFilter = {}): Promise<AdminAppointment[]> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (filter.status && filter.status !== 'all') params.set('status', filter.status);
    if (filter.fromDate) params.set('fromDate', filter.fromDate);
    if (filter.toDate) params.set('toDate', filter.toDate);

    const res = await fetch(`${this.baseUrl}/appointments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener citas');
    }

    const raw: RawAdminAppointment[] = Array.isArray(json.data) ? json.data : [];
    return raw.map((item) => ({
      id: item.id || item._id || '',
      customerName: item.customerName || 'Sin nombre',
      customerPhone: item.customerPhone,
      customerEmail: item.customerEmail,
      vehicle: item.vehicle,
      serviceRequested: item.serviceRequested || '',
      scheduledAt: item.scheduledAt || '',
      status: item.status || 'pending',
      notes: item.notes,
      duration: item.duration,
      assignedMechanic: item.assignedMechanic,
      branchName: item.branchName,
    }));
  }

  async approveAppointment(token: string, id: string, message: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/appointments/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al aprobar la cita');
    }
  }

  async rejectAppointment(token: string, id: string, message: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/appointments/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al rechazar la cita');
    }
  }

  async rescheduleAppointment(
    token: string,
    id: string,
    scheduledAt: string,
    duration: number,
    message: string
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/appointments/${id}/reschedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ scheduledAt, duration, message }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al reagendar la cita');
    }
  }

  async updateAppointment(
    token: string,
    id: string,
    data: Partial<AdminAppointment>
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/appointments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al actualizar la cita');
    }
  }
}

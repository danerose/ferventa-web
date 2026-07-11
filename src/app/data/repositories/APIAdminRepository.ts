import type { AdminAppointment, AuthUser, AdminMaintenanceOrder } from '../../domain/entities/AdminEntities';

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

  async getAppointmentsTimeline(
    token: string,
    startDate: string,
    endDate: string
  ): Promise<AdminAppointment[]> {
    const res = await fetch(`${this.baseUrl}/appointments/timeline?startDate=${startDate}&endDate=${endDate}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener el cronograma de citas');
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
      startTime: (item as any).startTime,
      endTime: (item as any).endTime,
    }));
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

  async getMaintenances(
    token: string,
    filter: { customerId?: string; status?: string } = {}
  ): Promise<AdminMaintenanceOrder[]> {
    const params = new URLSearchParams();
    if (filter.customerId) params.set('customerId', filter.customerId);
    if (filter.status && filter.status !== 'all') params.set('status', filter.status);

    const res = await fetch(`${this.baseUrl}/maintenance?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener mantenimientos');
    }

    const raw = Array.isArray(json.data) ? json.data : [];
    return raw.map((item: any) => ({
      id: item.id || item._id || '',
      status: item.status,
      laborCost: item.laborCost,
      notes: item.notes,
      appointment: item.appointment ? {
        id: item.appointment.id || item.appointment._id || '',
        scheduledAt: item.appointment.scheduledAt || '',
        status: item.appointment.status || '',
      } : null,
      customer: {
        id: item.customer?.id || item.customer?._id || '',
        name: item.customer?.name || 'Sin nombre',
        phone: item.customer?.phone,
        email: item.customer?.email,
      },
      vehicle: {
        id: item.vehicle?.id || item.vehicle?._id || '',
        brand: item.vehicle?.brand || 'Sin marca',
        model: item.vehicle?.model || 'Sin modelo',
        year: item.vehicle?.year || 0,
        serialNumberLastFour: item.vehicle?.serialNumberLastFour || '',
        color: item.vehicle?.color,
      },
      evidence: item.evidence || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  async updateMaintenance(
    token: string,
    id: string,
    data: Partial<AdminMaintenanceOrder>
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/maintenance/${id}`, {
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
      throw new Error(json.message || 'Error al actualizar el mantenimiento');
    }
  }

  async uploadMaintenanceEvidence(
    token: string,
    id: string,
    stage: string,
    photos: File[]
  ): Promise<void> {
    const formData = new FormData();
    formData.append('stage', stage);
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    const res = await fetch(`${this.baseUrl}/maintenance/${id}/evidence`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al subir evidencia');
    }
  }
}

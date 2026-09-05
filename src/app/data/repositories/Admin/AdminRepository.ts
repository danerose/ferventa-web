import type {
  AuthUser,
  AdminAppointment,
  AdminMaintenanceOrder,
  Branch,
  Schedule,
  Holiday,
  DirectReceptionPayload,
  CheckInResult,
  CustomerLookupResult,
} from '@/app/domain';

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
    } catch {
      // ignore
    }

    const activeBranchId = localStorage.getItem('ferventa_active_branch');
    if (!headers.has('x-branch-id')) {
      // Si no hay sucursal activa (ej. antes de migrar), enviamos un ID dummy que pase validaciones de presencia
      headers.set('x-branch-id', activeBranchId || '000000000000000000000000');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async getBranches(): Promise<Branch[]> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/branches`);
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error fetching branches');
    return (json.data || []).map((b: Branch & { _id?: string }) => ({
      ...b,
      id: b.id || b._id || '',
    }));
  }

  async migrateBranches(): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/system/migration/branches`, {
      method: 'POST',
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error migrating branches');
  }

  async getSchedule(): Promise<Schedule[]> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/schedule`);
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error fetching schedule');
    return json.data;
  }

  async updateSchedule(schedules: Schedule[]): Promise<void> {
    const cleanedSchedules = schedules.map(({ dayOfWeek, isWorking, startTime, endTime }) => ({
      dayOfWeek,
      isWorking,
      startTime,
      endTime,
    }));
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules: cleanedSchedules }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error updating schedule');
  }

  async getHolidays(): Promise<Holiday[]> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/holidays`);
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error fetching holidays');
    return json.data;
  }

  async createHoliday(date: string, description: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, description }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error creating holiday');
  }

  async deleteHoliday(id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/holidays/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error deleting holiday');
  }

  async login(usernameOrEmail: string, password: string): Promise<LoginResult> {
    const isEmail = usernameOrEmail.includes('@');
    const body = isEmail
      ? { email: usernameOrEmail.trim(), password }
      : { username: usernameOrEmail.trim(), password };

    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments?${params.toString()}`, {
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
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/${id}/approve`, {
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
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/${id}/reject`, {
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
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/${id}/reschedule`, {
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
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/timeline?startDate=${startDate}&endDate=${endDate}`, {
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
    }));
  }

  async updateAppointment(
    token: string,
    id: string,
    data: Partial<AdminAppointment>
  ): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/${id}`, {
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

    const res = await this.fetchWithAuth(`${this.baseUrl}/maintenance?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener mantenimientos');
    }

    const raw = Array.isArray(json.data) ? json.data : [];
    return raw.map((item: AdminMaintenanceOrder & { _id?: string }) => ({
      id: item.id || item._id || '',
      status: item.status,
      laborCost: item.laborCost,
      notes: item.notes,
      appointment: item.appointment ? {
        id: item.appointment.id || (item.appointment as { _id?: string })._id || '',
        scheduledAt: item.appointment.scheduledAt || '',
        status: item.appointment.status || '',
      } : null,
      customer: {
        id: item.customer?.id || (item.customer as { _id?: string })?._id || '',
        name: item.customer?.name || 'Sin nombre',
        phone: item.customer?.phone,
        email: item.customer?.email,
      },
      vehicle: {
        id: item.vehicle?.id || (item.vehicle as { _id?: string })?._id || '',
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
    const res = await this.fetchWithAuth(`${this.baseUrl}/maintenance/${id}`, {
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

    const res = await this.fetchWithAuth(`${this.baseUrl}/maintenance/${id}/evidence`, {
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

  async directReception(
    token: string,
    payload: DirectReceptionPayload
  ): Promise<AdminMaintenanceOrder> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/maintenance/direct-reception`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al registrar recepción directa');
    }

    const item = json.data;
    return {
      id: item.id || item._id || '',
      status: item.status,
      laborCost: item.laborCost,
      notes: item.notes,
      appointment: item.appointment
        ? {
            id: typeof item.appointment === 'string' ? item.appointment : item.appointment.id || item.appointment._id || '',
            scheduledAt: item.appointment.scheduledAt || '',
            status: item.appointment.status || '',
          }
        : null,
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
    };
  }

  async checkInAppointment(
    token: string,
    appointmentId: string
  ): Promise<CheckInResult> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/appointments/${appointmentId}/check-in`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al recibir vehículo para la cita');
    }

    const appt = json.data.appointment || {};
    const maint = json.data.maintenance || {};

    return {
      appointment: {
        id: appt.id || appt._id,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        status: appt.status,
        scheduledAt: appt.scheduledAt,
        serviceRequested: appt.serviceRequested,
      },
      maintenance: {
        id: maint.id || maint._id || '',
        status: maint.status,
        laborCost: maint.laborCost,
        notes: maint.notes,
        appointment: maint.appointment
          ? {
              id: typeof maint.appointment === 'string' ? maint.appointment : maint.appointment.id || maint.appointment._id || '',
              scheduledAt: maint.appointment.scheduledAt || '',
              status: maint.appointment.status || '',
            }
          : null,
        customer: {
          id: maint.customer?.id || maint.customer?._id || '',
          name: maint.customer?.name || 'Sin nombre',
          phone: maint.customer?.phone,
          email: maint.customer?.email,
        },
        vehicle: {
          id: maint.vehicle?.id || maint.vehicle?._id || '',
          brand: maint.vehicle?.brand || 'Sin marca',
          model: maint.vehicle?.model || 'Sin modelo',
          year: maint.vehicle?.year || 0,
          serialNumberLastFour: maint.vehicle?.serialNumberLastFour || '',
          color: maint.vehicle?.color,
        },
        evidence: maint.evidence || [],
        createdAt: maint.createdAt,
        updatedAt: maint.updatedAt,
      },
    };
  }

  async getCustomerByPhone(
    token: string,
    phone: string
  ): Promise<CustomerLookupResult | null> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return null;

    try {
      const res = await this.fetchWithAuth(`${this.baseUrl}/customers/phone/${encodeURIComponent(cleanPhone)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) return null;

      const c = json.data;
      return {
        id: c.id || c._id || '',
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || '',
        vehicles: Array.isArray(c.vehicles)
          ? c.vehicles.map((v: { id?: string; _id?: string; brand?: string; model?: string; year?: string | number; serialNumberLastFour?: string; color?: string }) => ({
              id: v.id || v._id,
              brand: v.brand || '',
              model: v.model || '',
              year: v.year || '',
              serialNumberLastFour: v.serialNumberLastFour || '',
              color: v.color || '',
            }))
          : [],
      };
    } catch {
      return null;
    }
  }
}


import type {
  AttendanceRecord,
  TodayAttendanceStatus,
  AttendancePeriodSummary,
  UserAttendanceBreakdown,
} from '../../domain/entities/AttendanceEntities';

export class APIAttendanceRepository {
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

  /**
   * Registrar entrada (Clock In)
   */
  async clockIn(note?: string, userId?: string): Promise<AttendanceRecord> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, userId }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al registrar entrada de jornada');
    }
    // API returns double-nested: { success, data: { data: <record> } }
    return (json.data?.data ?? json.data) as AttendanceRecord;
  }

  /**
   * Registrar salida (Clock Out)
   */
  async clockOut(note?: string, userId?: string): Promise<AttendanceRecord> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, userId }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al registrar salida de jornada');
    }
    return (json.data?.data ?? json.data) as AttendanceRecord;
  }

  /**
   * Iniciar descanso / comida
   */
  async startBreak(note?: string, userId?: string): Promise<AttendanceRecord> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/break/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note, userId }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al iniciar descanso');
    }
    return (json.data?.data ?? json.data) as AttendanceRecord;
  }

  /**
   * Finalizar descanso / comida
   */
  async endBreak(userId?: string): Promise<AttendanceRecord> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/break/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al finalizar descanso');
    }
    return (json.data?.data ?? json.data) as AttendanceRecord;
  }

  /**
   * Obtener el estado de asistencia de hoy para un usuario (o el usuario autenticado)
   */
  async getTodayStatus(userId?: string): Promise<TodayAttendanceStatus> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/today${query}`);
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener estado de asistencia de hoy');
    }
    // API returns double-nested: { success, data: { data: { hasActiveShift, attendance, ... } } }
    return (json.data?.data ?? json.data) as TodayAttendanceStatus;
  }

  /**
   * Obtener el estado de asistencia de hoy o una fecha específica para todos los usuarios asignados a una sucursal
   */
  async getBranchTodayStatus(branchId?: string, date?: string): Promise<any> {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (date) params.append('date', date);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/branch/today${query}`);
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener estado de asistencia de la sucursal');
    }
    return json.data?.data ?? json.data;
  }

  /**
   * Mis registros personales de asistencia
   */
  async getMyRecords(startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/my-records${query}`);
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener historial de asistencia');
    }
    return (json.data || []).map((r: any) => ({
      ...r,
      id: r.id || r._id,
    }));
  }

  /**
   * Registros globales para Admin con filtros
   */
  async getAdminRecords(filters: {
    branchId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  } = {}): Promise<AttendanceRecord[]> {
    const params = new URLSearchParams();
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/admin/records${query}`);
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al consultar registros de asistencia');
    }
    return (json.data || []).map((r: any) => ({
      ...r,
      id: r.id || r._id,
    }));
  }

  /**
   * Resumen administrativo semanal, quincenal, mensual o personalizado
   */
  async getAdminSummary(filters: {
    branchId?: string;
    period?: 'weekly' | 'biweekly' | 'monthly' | 'custom';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AttendancePeriodSummary> {
    const params = new URLSearchParams();
    if (filters.branchId && filters.branchId !== 'all') params.append('branchId', filters.branchId);
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/admin/summary${query}`);
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener resumen de asistencia');
    }
    return json.data;
  }

  /**
   * Desglose detallado de un usuario por ID (Admin)
   */
  async getUserBreakdown(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<UserAttendanceBreakdown> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.fetchWithAuth(
      `${this.baseUrl}/attendance/admin/user-breakdown/${userId}${query}`
    );
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener desglose del usuario');
    }
    return json.data;
  }

  /**
   * Modificar manualmente un registro de asistencia (Admin)
   */
  async updateRecord(
    id: string,
    data: { clockIn?: string; clockOut?: string; adminNotes?: string }
  ): Promise<AttendanceRecord> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/attendance/admin/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('No autorizado. Por favor vuelve a iniciar sesión.');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al actualizar el registro de asistencia');
    }
    return json.data;
  }
}

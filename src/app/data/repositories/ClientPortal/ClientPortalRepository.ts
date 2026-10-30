import type { Appointment, MaintenanceTrack, OccupiedSlots, PublicBranch, BookAppointmentPayload } from '@/app/domain';
import type { ClientPortalRepository } from '@/app/domain';
import { BranchLocalDataSource } from '@/app/data/datasources/local/Branch/BranchLocalDataSource';
import { API_ENDPOINTS } from '@/core/constants/endpoints/api.endpoints';

interface RawAppointment {
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
  branchName?: string;
}

interface RawItem {
  id?: string;
  _id?: string;
  productName?: string;
  product?: {
    name?: string;
    sellingPrice?: number;
  };
  quantity?: number;
  price?: number;
}

interface RawHistory {
  stage?: 'reception' | 'disassembly' | 'maintenance' | 'completed' | 'delivered';
  status?: 'pending' | 'in_progress' | 'completed';
  updatedAt?: string | null;
}

interface RawEvidence {
  stage?: string;
  url?: string;
  uploadedAt?: string;
}

interface RawMaintenanceTrack {
  id?: string;
  _id?: string;
  orderNumber?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'delivered';
  vehicle?: {
    brand: string;
    model: string;
    year: number | string;
    serialNumberLastFour: string;
    color?: string;
  };
  laborCost?: number;
  notes?: string;
  items?: RawItem[];
  history?: RawHistory[];
  evidence?: RawEvidence[];
}

interface RawHoliday {
  date?: string;
  description?: string;
}

interface RawBusySlot {
  appointmentId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

interface RawWorkingHours {
  dayOfWeek?: number;
  isWorking?: boolean;
  startTime?: string;
  endTime?: string;
}

export class APIClientPortalRepository implements ClientPortalRepository {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  private readonly branchLocalDataSource: BranchLocalDataSource;

  constructor(branchLocalDataSource: BranchLocalDataSource = new BranchLocalDataSource()) {
    this.branchLocalDataSource = branchLocalDataSource;
  }

  private async fetchWithBranch(url: string, options: RequestInit = {}, explicitBranchId?: string): Promise<Response> {
    const headers = new Headers(options.headers || {});
    
    const branchId =
      explicitBranchId ||
      this.branchLocalDataSource.getPublicBranchId() ||
      this.branchLocalDataSource.getActiveBranchId() ||
      import.meta.env.VITE_DEFAULT_BRANCH_ID;

    if (branchId) {
      headers.set('x-branch-id', branchId);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async getPublicBranches(retry = 2): Promise<PublicBranch[]> {
    try {
      const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.BRANCHES.PUBLIC}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (retry > 0) {
          await new Promise((r) => setTimeout(r, 2000));
          return this.getPublicBranches(retry - 1);
        }
      }
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        if (retry > 0) {
          await new Promise((r) => setTimeout(r, 2000));
          return this.getPublicBranches(retry - 1);
        }
        throw new Error(json?.message || 'Error al obtener sucursales');
      }
      const branches: PublicBranch[] = json.data || [];
      if (branches.length > 0 && !this.branchLocalDataSource.getPublicBranchId()) {
        const firstBranchId = branches[0].id || branches[0]._id;
        if (firstBranchId) {
          this.branchLocalDataSource.savePublicBranchId(firstBranchId);
        }
      }
      return branches;
    } catch (err) {
      if (retry > 0) {
        await new Promise((r) => setTimeout(r, 2000));
        return this.getPublicBranches(retry - 1);
      }
      throw err;
    }
  }


  private async parseResponseSafe<T>(response: Response, defaultErrorMsg: string): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    let json: any = null;
    if (contentType.includes('application/json')) {
      json = await response.json().catch(() => null);
    }
    if (!response.ok || !json?.success) {
      if ([502, 503, 504].includes(response.status)) {
        throw new Error('El servidor se está iniciando en la nube. Por favor reintenta en unos instantes.');
      }
      throw new Error(json?.message || defaultErrorMsg);
    }
    return json.data as T;
  }

  async bookAppointment(appointment: BookAppointmentPayload): Promise<Appointment> {
    if (appointment.branchId) {
      this.branchLocalDataSource.savePublicBranchId(appointment.branchId);
    }

    const body: Record<string, unknown> = {
      customerName: appointment.customerName,
      customerPhone: (appointment.customerPhone || '').replace(/\D/g, '') || appointment.customerPhone,
      ...(appointment.customerEmail?.trim() ? { customerEmail: appointment.customerEmail.trim().toLowerCase() } : {}),
      serviceRequested: appointment.serviceRequested,
      scheduledAt: appointment.scheduledAt,
      status: 'pending',
    };
    if (appointment.notes) body.notes = appointment.notes;
    if (appointment.branchName) body.branchName = appointment.branchName;
    if (appointment.branchId) body.branchId = appointment.branchId;
    if (appointment.vehicle) {
      body.vehicle = {
        brand: appointment.vehicle.brand,
        model: appointment.vehicle.model,
        ...(Number(appointment.vehicle.year) ? { year: Number(appointment.vehicle.year) } : {}),
        ...(appointment.vehicle.serialNumberLastFour?.trim()
          ? { serialNumberLastFour: appointment.vehicle.serialNumberLastFour.trim().slice(0, 4).toUpperCase() }
          : {}),
        ...(appointment.vehicle.color?.trim() ? { color: appointment.vehicle.color.trim() } : {}),
      };
    }

    const response = await this.fetchWithBranch(
      `${this.baseUrl}${API_ENDPOINTS.APPOINTMENTS.PUBLIC}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      appointment.branchId
    );

    return this.parseResponseSafe<Appointment>(response, 'Error al agendar la cita');
  }

  async getAppointmentStatus(query: string): Promise<Appointment[]> {
    const response = await this.fetchWithBranch(`${this.baseUrl}${API_ENDPOINTS.APPOINTMENTS.PUBLIC_STATUS}?q=${encodeURIComponent(query)}`);
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener el estatus de las citas');
    }

    const data: RawAppointment[] = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
    return data.map((item: RawAppointment) => ({
      id: item.id || item._id || '',
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      customerEmail: item.customerEmail || '',
      vehicle: item.vehicle || { brand: '', model: '', year: 0, serialNumberLastFour: '' },
      serviceRequested: item.serviceRequested || '',
      scheduledAt: item.scheduledAt || '',
      status: item.status || 'pending',
      notes: item.notes || '',
      branchName: item.branchName || '',
    }));
  }

  async getMaintenanceTrack(query: string): Promise<MaintenanceTrack | null> {
    try {
      const response = await this.fetchWithBranch(`${this.baseUrl}${API_ENDPOINTS.MAINTENANCE.TRACK_PUBLIC}?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        return null;
      }
      const json = await response.json();
      if (!json.success || !json.data) {
        return null;
      }

      const rawData: RawMaintenanceTrack = Array.isArray(json.data) ? json.data[0] : json.data;
      if (!rawData) return null;

      return {
        id: rawData.id || rawData._id || '',
        orderNumber: rawData.orderNumber || rawData.id || '',
        status: rawData.status || 'not_started',
        vehicle: rawData.vehicle || { brand: '', model: '', year: new Date().getFullYear(), serialNumberLastFour: '' },
        laborCost: rawData.laborCost || 0,
        notes: rawData.notes || '',
        items: (rawData.items || []).map((item: RawItem) => ({
          id: item.id || item._id || '',
          productName: item.productName || (item.product && item.product.name) || 'Refacción',
          quantity: item.quantity || 0,
          price: item.price || (item.product && item.product.sellingPrice) || 0,
        })),
        history: (rawData.history || []).map((h: RawHistory) => ({
          stage: h.stage || 'reception',
          status: h.status || 'pending',
          updatedAt: h.updatedAt || null,
        })),
        evidence: (rawData.evidence || []).map((e: RawEvidence) => ({
          stage: e.stage || '',
          url: e.url || '',
          uploadedAt: e.uploadedAt || '',
        })),
      };
    } catch (error) {
      console.error('Error fetching maintenance track:', error);
      return null;
    }
  }

  async getOccupiedSlots(startDate: string, endDate: string, branchId?: string): Promise<OccupiedSlots> {
    if (branchId) {
      this.branchLocalDataSource.savePublicBranchId(branchId);
    }
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (branchId) {
      params.append('branchId', branchId);
    }
    const response = await this.fetchWithBranch(
      `${this.baseUrl}${API_ENDPOINTS.APPOINTMENTS.OCCUPIED_SLOTS}?${params.toString()}`,
      {},
      branchId
    );
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener horarios ocupados');
    }

    const data = json.data || {};
    return {
      holidays: (data.holidays || []).map((h: RawHoliday) => ({
        date: h.date || '',
        description: h.description || '',
      })),
      nonWorkingDaysOfWeek: data.nonWorkingDaysOfWeek || [],
      busySlots: (data.busySlots || []).map((b: RawBusySlot) => ({
        appointmentId: b.appointmentId || '',
        date: b.date || '',
        startTime: b.startTime || '',
        endTime: b.endTime || '',
      })),
      workingHours: (data.workingHours || []).map((w: RawWorkingHours) => ({
        dayOfWeek: w.dayOfWeek ?? 1,
        isWorking: w.isWorking ?? true,
        startTime: w.startTime || '08:00',
        endTime: w.endTime || '18:00',
      })),
    };
  }
}

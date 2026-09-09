import type { Appointment, MaintenanceTrack, OccupiedSlots, PublicBranch, BookAppointmentPayload } from '@/app/domain';
import type { ClientPortalRepository } from '@/app/domain';
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

  private async fetchWithBranch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    
    // Attempt to get from local storage, env var, or fallback
    const branchId = localStorage.getItem('ferventa_public_branch') || import.meta.env.VITE_DEFAULT_BRANCH_ID;
    if (branchId) {
      headers.set('x-branch-id', branchId);
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async getPublicBranches(): Promise<PublicBranch[]> {
    const res = await fetch(`${this.baseUrl}${API_ENDPOINTS.BRANCHES.PUBLIC}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al obtener sucursales');
    }
    return json.data;
  }

  async bookAppointment(appointment: BookAppointmentPayload): Promise<Appointment> {
    const body: Record<string, unknown> = {
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      customerEmail: appointment.customerEmail,
      serviceRequested: appointment.serviceRequested,
      scheduledAt: appointment.scheduledAt,
      status: 'pending',
    };
    if (appointment.notes) body.notes = appointment.notes;
    if (appointment.branchName) body.branchName = appointment.branchName;
    if (appointment.vehicle) {
      body.vehicle = {
        brand: appointment.vehicle.brand,
        model: appointment.vehicle.model,
        year: Number(appointment.vehicle.year) || new Date().getFullYear(),
        serialNumberLastFour: appointment.vehicle.serialNumberLastFour,
        ...(appointment.vehicle.color ? { color: appointment.vehicle.color } : {}),
      };
    }

    const response = await this.fetchWithBranch(`${this.baseUrl}${API_ENDPOINTS.APPOINTMENTS.PUBLIC}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Error al agendar la cita');
    }

    return json.data;
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

  async getOccupiedSlots(startDate: string, endDate: string): Promise<OccupiedSlots> {
    const response = await this.fetchWithBranch(
      `${this.baseUrl}${API_ENDPOINTS.APPOINTMENTS.OCCUPIED_SLOTS}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
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

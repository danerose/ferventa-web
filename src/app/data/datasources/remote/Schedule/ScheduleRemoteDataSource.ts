import { NetworkService } from '@/core/services';
import { API_ENDPOINTS } from '@/core/constants';
import {
  ScheduleModel,
  type RawScheduleResponse,
  type RawHolidayResponse,
} from '@/app/data/model/Schedule/ScheduleModel';
import type { Schedule, Holiday } from '@/app/domain/entities';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ScheduleRemoteDataSource {
  private readonly network: NetworkService;

  constructor(network: NetworkService) {
    this.network = network;
  }

  async getSchedule(): Promise<Schedule[]> {
    const res = await this.network.get<ApiResponse<RawScheduleResponse[]>>(
      API_ENDPOINTS.APPOINTMENTS.SCHEDULE
    );
    return (res.data || []).map((item) => ScheduleModel.toScheduleEntity(item));
  }

  async updateSchedule(schedules: Schedule[]): Promise<void> {
    const sanitizedSchedules = schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek ?? s.day ?? 0,
      isWorking: s.isWorking ?? s.enabled ?? true,
      startTime: s.startTime ?? '09:00',
      endTime: s.endTime ?? '18:00',
    }));
    await this.network.patch<ApiResponse<null>>(API_ENDPOINTS.APPOINTMENTS.SCHEDULE, {
      schedules: sanitizedSchedules,
    });
  }

  async getHolidays(): Promise<Holiday[]> {
    const res = await this.network.get<ApiResponse<RawHolidayResponse[]>>(
      API_ENDPOINTS.APPOINTMENTS.HOLIDAYS
    );
    return (res.data || []).map((item) => ScheduleModel.toHolidayEntity(item));
  }

  async createHoliday(date: string, description: string): Promise<Holiday> {
    const res = await this.network.post<ApiResponse<RawHolidayResponse>>(
      API_ENDPOINTS.APPOINTMENTS.HOLIDAYS,
      { date, description }
    );
    return ScheduleModel.toHolidayEntity(res.data);
  }

  async deleteHoliday(id: string): Promise<void> {
    await this.network.delete<ApiResponse<null>>(API_ENDPOINTS.APPOINTMENTS.HOLIDAY_BY_ID(id));
  }

  async getOccupiedSlots(date: string): Promise<string[]> {
    const res = await this.network.get<ApiResponse<string[]>>(
      API_ENDPOINTS.APPOINTMENTS.OCCUPIED_SLOTS,
      { params: { date } }
    );
    return res.data || [];
  }
}

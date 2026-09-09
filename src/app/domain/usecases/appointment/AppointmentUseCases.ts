import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type {
  Appointment,
  AppointmentsFilter,
  DirectReceptionPayload,
  CheckInResult,
} from '@/app/domain/entities';
import { GetAppointmentsUseCase } from './GetAppointmentsUseCase';
import { GetAppointmentsTimelineUseCase } from './GetAppointmentsTimelineUseCase';
import { GetAppointmentByIdUseCase } from './GetAppointmentByIdUseCase';
import { CreateAppointmentUseCase } from './CreateAppointmentUseCase';
import { UpdateAppointmentUseCase } from './UpdateAppointmentUseCase';
import { DeleteAppointmentUseCase } from './DeleteAppointmentUseCase';
import { ApproveAppointmentUseCase } from './ApproveAppointmentUseCase';
import { RejectAppointmentUseCase } from './RejectAppointmentUseCase';
import { RescheduleAppointmentUseCase } from './RescheduleAppointmentUseCase';
import { CheckInAppointmentUseCase } from './CheckInAppointmentUseCase';
import { DirectReceptionAppointmentUseCase } from './DirectReceptionAppointmentUseCase';
import { MarkNoShowAppointmentUseCase } from './MarkNoShowAppointmentUseCase';

/**
 * Composite Facade for Appointment UseCases.
 * Maintains backwards-compatibility for callers while delegating all logic
 * to isolated, single-responsibility UseCase instances.
 */
export class AppointmentUseCases {
  public readonly getAppointmentsUseCase: GetAppointmentsUseCase;
  public readonly getAppointmentsTimelineUseCase: GetAppointmentsTimelineUseCase;
  public readonly getAppointmentByIdUseCase: GetAppointmentByIdUseCase;
  public readonly createAppointmentUseCase: CreateAppointmentUseCase;
  public readonly updateAppointmentUseCase: UpdateAppointmentUseCase;
  public readonly deleteAppointmentUseCase: DeleteAppointmentUseCase;
  public readonly approveAppointmentUseCase: ApproveAppointmentUseCase;
  public readonly rejectAppointmentUseCase: RejectAppointmentUseCase;
  public readonly rescheduleAppointmentUseCase: RescheduleAppointmentUseCase;
  public readonly checkInAppointmentUseCase: CheckInAppointmentUseCase;
  public readonly directReceptionAppointmentUseCase: DirectReceptionAppointmentUseCase;
  public readonly markNoShowAppointmentUseCase: MarkNoShowAppointmentUseCase;

  constructor(repository: IAppointmentRepository) {
    this.getAppointmentsUseCase = new GetAppointmentsUseCase(repository);
    this.getAppointmentsTimelineUseCase = new GetAppointmentsTimelineUseCase(repository);
    this.getAppointmentByIdUseCase = new GetAppointmentByIdUseCase(repository);
    this.createAppointmentUseCase = new CreateAppointmentUseCase(repository);
    this.updateAppointmentUseCase = new UpdateAppointmentUseCase(repository);
    this.deleteAppointmentUseCase = new DeleteAppointmentUseCase(repository);
    this.approveAppointmentUseCase = new ApproveAppointmentUseCase(repository);
    this.rejectAppointmentUseCase = new RejectAppointmentUseCase(repository);
    this.rescheduleAppointmentUseCase = new RescheduleAppointmentUseCase(repository);
    this.checkInAppointmentUseCase = new CheckInAppointmentUseCase(repository);
    this.directReceptionAppointmentUseCase = new DirectReceptionAppointmentUseCase(repository);
    this.markNoShowAppointmentUseCase = new MarkNoShowAppointmentUseCase(repository);
  }

  getAppointments(filter?: AppointmentsFilter): Promise<Appointment[]> {
    return this.getAppointmentsUseCase.execute(filter);
  }

  getAppointmentsTimeline(startDate: string, endDate?: string): Promise<Appointment[]> {
    return this.getAppointmentsTimelineUseCase.execute(startDate, endDate);
  }

  getAppointmentById(id: string): Promise<Appointment> {
    return this.getAppointmentByIdUseCase.execute(id);
  }

  createAppointment(payload: Partial<Appointment>): Promise<Appointment> {
    return this.createAppointmentUseCase.execute(payload);
  }

  updateAppointment(id: string, payload: Partial<Appointment>): Promise<Appointment> {
    return this.updateAppointmentUseCase.execute(id, payload);
  }

  deleteAppointment(id: string): Promise<void> {
    return this.deleteAppointmentUseCase.execute(id);
  }

  approveAppointment(id: string, notes?: string): Promise<Appointment> {
    return this.approveAppointmentUseCase.execute(id, notes);
  }

  rejectAppointment(id: string, notes?: string): Promise<Appointment> {
    return this.rejectAppointmentUseCase.execute(id, notes);
  }

  rescheduleAppointment(
    id: string,
    newDate: string,
    duration?: number,
    notes?: string
  ): Promise<Appointment> {
    return this.rescheduleAppointmentUseCase.execute(id, newDate, duration, notes);
  }

  checkInAppointment(id: string, notes?: string): Promise<CheckInResult> {
    return this.checkInAppointmentUseCase.execute(id, notes);
  }

  directReception(payload: DirectReceptionPayload): Promise<CheckInResult> {
    return this.directReceptionAppointmentUseCase.execute(payload);
  }

  markNoShow(id: string, notes?: string): Promise<Appointment> {
    return this.markNoShowAppointmentUseCase.execute(id, notes);
  }
}

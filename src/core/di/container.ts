/**
 * Composition Root (Dependency Injection Container)
 *
 * This is the SOLE location in the entire project where `new` is called
 * on Services, DataSources, Repositories, and UseCases.
 *
 * Stores and consumers import pre-wired UseCases and Services directly from this file.
 */

import { networkService, thermalPrintService } from '@/core/services';
import {
  AuthLocalDataSource,
  AuthRemoteDataSource,
  BranchLocalDataSource,
  BranchRemoteDataSource,
  AppointmentRemoteDataSource,
  ScheduleRemoteDataSource,
  MaintenanceRemoteDataSource,
  CustomerRemoteDataSource,
} from '@/app/data/datasources';
import {
  AuthRepository,
  BranchRepository,
  AppointmentRepository,
  ScheduleRepository,
  MaintenanceRepository,
  CustomerRepository,
  APIClientPortalRepository,
  APIInventoryRepository,
  APISalesRepository,
  APIServicesRepository,
  APISpecialOrdersRepository,
  APIUserRepository,
  APIAttendanceRepository,
} from '@/app/data/repositories';
import {
  AuthUseCases,
  BranchUseCases,
  AppointmentUseCases,
  ScheduleUseCases,
  MaintenanceUseCases,
  CustomerUseCases,
  ClientPortalUseCases,
  SpecialOrdersUseCases,
  POSUseCases,
  UserUseCases,
} from '@/app/domain/usecases';

// ─── 1. Infrastructure Services ─────────────────────────────────────────────
export { networkService, thermalPrintService };

// ─── 2. Data Sources ─────────────────────────────────────────────────────────
export const authLocalDataSource = new AuthLocalDataSource();
export const authRemoteDataSource = new AuthRemoteDataSource(networkService);

export const branchLocalDataSource = new BranchLocalDataSource();
export const branchRemoteDataSource = new BranchRemoteDataSource(networkService);

export const appointmentRemoteDataSource = new AppointmentRemoteDataSource(networkService);
export const scheduleRemoteDataSource = new ScheduleRemoteDataSource(networkService);
export const maintenanceRemoteDataSource = new MaintenanceRemoteDataSource(networkService);
export const customerRemoteDataSource = new CustomerRemoteDataSource(networkService);

// ─── 3. Repositories ─────────────────────────────────────────────────────────
export const authRepository = new AuthRepository(authRemoteDataSource, authLocalDataSource);
export const branchRepository = new BranchRepository(branchRemoteDataSource, branchLocalDataSource);
export const appointmentRepository = new AppointmentRepository(appointmentRemoteDataSource);
export const scheduleRepository = new ScheduleRepository(scheduleRemoteDataSource);
export const maintenanceRepository = new MaintenanceRepository(maintenanceRemoteDataSource);
export const customerRepository = new CustomerRepository(customerRemoteDataSource);

// Legacy Repositories (To be gradually deprecated in favor of domain repositories)
export const clientPortalRepository = new APIClientPortalRepository();
export const inventoryRepository = new APIInventoryRepository();
export const salesRepository = new APISalesRepository();
export const servicesRepository = new APIServicesRepository();
export const specialOrdersRepository = new APISpecialOrdersRepository();
export const userRepository = new APIUserRepository();
export const attendanceRepository = new APIAttendanceRepository();

// ─── 4. Use Cases ───────────────────────────────────────────────────────────
export const authUseCases = new AuthUseCases(authRepository);
export const branchUseCases = new BranchUseCases(branchRepository);
export const appointmentUseCases = new AppointmentUseCases(appointmentRepository);
export const scheduleUseCases = new ScheduleUseCases(scheduleRepository);
export const maintenanceUseCases = new MaintenanceUseCases(maintenanceRepository);
export const customerUseCases = new CustomerUseCases(customerRepository);

export const clientPortalUseCases = new ClientPortalUseCases(clientPortalRepository);
export const specialOrdersUseCases = new SpecialOrdersUseCases(specialOrdersRepository);
export const posUseCases = new POSUseCases(
  inventoryRepository,
  salesRepository,
  branchRepository,
  clientPortalRepository,
  servicesRepository
);
export const userUseCases = new UserUseCases(userRepository, branchRepository);

// ─── 5. Granular Single-Responsibility Use Cases ────────────────────────────
// Branch UseCases
export const getBranchesUseCase = branchUseCases.getBranchesUseCase;
export const getUserBranchesUseCase = branchUseCases.getUserBranchesUseCase;
export const getPublicBranchesUseCase = branchUseCases.getPublicBranchesUseCase;
export const getBranchByIdUseCase = branchUseCases.getBranchByIdUseCase;
export const createBranchUseCase = branchUseCases.createBranchUseCase;
export const updateBranchUseCase = branchUseCases.updateBranchUseCase;
export const deleteBranchUseCase = branchUseCases.deleteBranchUseCase;
export const getActiveBranchUseCase = branchUseCases.getActiveBranchUseCase;
export const saveActiveBranchUseCase = branchUseCases.saveActiveBranchUseCase;

// Appointment UseCases
export const getAppointmentsUseCase = appointmentUseCases.getAppointmentsUseCase;
export const getAppointmentsTimelineUseCase = appointmentUseCases.getAppointmentsTimelineUseCase;
export const getAppointmentByIdUseCase = appointmentUseCases.getAppointmentByIdUseCase;
export const createAppointmentUseCase = appointmentUseCases.createAppointmentUseCase;
export const updateAppointmentUseCase = appointmentUseCases.updateAppointmentUseCase;
export const deleteAppointmentUseCase = appointmentUseCases.deleteAppointmentUseCase;
export const approveAppointmentUseCase = appointmentUseCases.approveAppointmentUseCase;
export const rejectAppointmentUseCase = appointmentUseCases.rejectAppointmentUseCase;
export const rescheduleAppointmentUseCase = appointmentUseCases.rescheduleAppointmentUseCase;
export const checkInAppointmentUseCase = appointmentUseCases.checkInAppointmentUseCase;
export const directReceptionAppointmentUseCase = appointmentUseCases.directReceptionAppointmentUseCase;

// Maintenance UseCases
export const getMaintenanceOrdersUseCase = maintenanceUseCases.getMaintenanceOrdersUseCase;
export const getMaintenanceOrderByIdUseCase = maintenanceUseCases.getMaintenanceOrderByIdUseCase;
export const createMaintenanceOrderUseCase = maintenanceUseCases.createMaintenanceOrderUseCase;
export const updateMaintenanceOrderUseCase = maintenanceUseCases.updateMaintenanceOrderUseCase;
export const deleteMaintenanceOrderUseCase = maintenanceUseCases.deleteMaintenanceOrderUseCase;
export const updateMaintenanceStatusUseCase = maintenanceUseCases.updateMaintenanceStatusUseCase;
export const addDiagnosticNoteUseCase = maintenanceUseCases.addDiagnosticNoteUseCase;
export const notifyMaintenanceUseCase = maintenanceUseCases.notifyMaintenanceUseCase;
export const directReceptionMaintenanceUseCase = maintenanceUseCases.directReceptionMaintenanceUseCase;
export const getOrderPdfBlobUseCase = maintenanceUseCases.getOrderPdfBlobUseCase;

// Customer UseCases
export const lookupCustomerUseCase = customerUseCases.lookupCustomerUseCase;
export const getCustomerByPhoneUseCase = customerUseCases.getCustomerByPhoneUseCase;
export const getCustomersUseCase = customerUseCases.getCustomersUseCase;
export const getCustomerByIdUseCase = customerUseCases.getCustomerByIdUseCase;
export const createCustomerUseCase = customerUseCases.createCustomerUseCase;
export const updateCustomerUseCase = customerUseCases.updateCustomerUseCase;

// Auth UseCases
export const loginUseCase = authUseCases.loginUseCase;
export const logoutUseCase = authUseCases.logoutUseCase;
export const getSessionUseCase = authUseCases.getSessionUseCase;
export const getProfileUseCase = authUseCases.getProfileUseCase;



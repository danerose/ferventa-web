export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  branches?: string[];
  lastLoginAt?: string | null;
  isDefaultPassword?: boolean;
}

export interface AdminVehicle {
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
  licensePlate?: string;
  color?: string;
}

export interface MaintenanceMetricsData {
  volume: {
    totalReceived: number;
    totalCompleted: number;
    totalDelivered: number;
    pendingPickupCount: number;
  };
  averages: {
    avgQueueHours: number;
    avgQueueDays: number;
    avgWorkHours: number;
    avgWorkDays: number;
    avgPickupHours: number;
    avgPickupDays: number;
    avgTotalStayHours: number;
    avgTotalStayDays: number;
  };
  pendingPickupVehicles: Array<{
    _id: string;
    customerName: string;
    customerPhone: string;
    vehicle: string;
    completedAt: string;
    notifiedAt?: string;
    daysWaiting: number;
    daysSinceNotified?: number;
    notes?: string;
  }>;
}



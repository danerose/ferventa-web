export const MaintenanceStage = {
  Reception: 'reception',
  Disassembly: 'disassembly',
  Maintenance: 'maintenance',
  Completed: 'completed',
} as const;

export type MaintenanceStage = (typeof MaintenanceStage)[keyof typeof MaintenanceStage];

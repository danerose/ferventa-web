export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  rescheduled: 'Reagendada',
};

export const STATUS_STYLES: Record<string, { background: string; color: string; border: string }> = {
  pending: { background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' },
  approved: { background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' },
  rejected: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' },
  cancelled: { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
  completed: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
  rescheduled: { background: '#f5f3ff', color: '#5b21b6', border: '1px solid #8b5cf630' },
};

export const STATUS_ACCENT: Record<string, string> = {
  pending: '#fbbf24',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#94a3b8',
  completed: '#3b82f6',
  rescheduled: '#8b5cf6',
};

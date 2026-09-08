import { useAuthStore } from '@/app/presentation/stores';
import { formatBranchWorkshopName } from '@/core/utils';

export function useActiveBranch() {
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const activeBranchName = useAuthStore((s) => s.activeBranchName) || 'Nova FV Sucursal Uman';
  const branches = useAuthStore((s) => s.branches);
  const setActiveBranch = useAuthStore((s) => s.setActiveBranch);

  return {
    activeBranchId,
    activeBranchName,
    workshopName: formatBranchWorkshopName(activeBranchName),
    branches,
    setActiveBranch,
  };
}

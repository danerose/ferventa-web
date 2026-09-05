import React from 'react';
import { Icon, TextInput, PrimaryButton, SecondaryButton } from '@/app/presentation/components';

export interface DashboardFiltersProps {
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  branchFilter: string;
  onBranchChange: (branch: string) => void;
  uniqueBranches: string[];
  viewType: 'list' | 'calendar';
  onViewTypeChange: (view: 'list' | 'calendar') => void;
  pendingCount: number;
  onAddClick: () => void;
  onDirectReceptionClick?: () => void;
  onRefreshClick: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchValue,
  onSearchChange,
  branchFilter,
  onBranchChange,
  uniqueBranches,
  viewType,
  onViewTypeChange,
  pendingCount,
  onAddClick,
  onDirectReceptionClick,
  onRefreshClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-base-100 border-b border-base-300 px-6 h-16 flex items-center justify-between gap-4 shadow-xs transition-colors">
      {/* Search and Branch Filter */}
      <div className="flex items-center gap-3 flex-1 max-w-[560px]">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10 text-base-content/40">
            <Icon name="Search" size="sm" />
          </div>
          <TextInput
            type="text"
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Buscar por cliente, teléfono o serie..."
            size="sm"
            className="pl-9 w-full"
          />
        </div>

        {/* Branch Filter */}
        <div className="relative w-48 shrink-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10 text-base-content/40">
            <Icon name="MapPin" size="sm" />
          </div>
          <select
            value={branchFilter}
            onChange={(e) => onBranchChange(e.target.value)}
            className="select select-sm select-bordered w-full pl-9 pr-8 bg-base-100 text-base-content border-base-300 rounded-DEFAULT text-xs font-normal focus:border-primary focus:outline-none transition-colors"
          >
            <option value="all">Todas las sucursales</option>
            {uniqueBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* View Toggle */}
        <div className="flex items-center bg-base-200 p-1 rounded-DEFAULT border border-base-300 gap-1">
          <button
            type="button"
            onClick={() => onViewTypeChange('list')}
            className={`px-3 py-1.5 rounded-DEFAULT text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewType === 'list'
                ? 'bg-base-100 text-base-content shadow-xs font-bold'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            <Icon name="List" size="xs" />
            Lista
          </button>
          <button
            type="button"
            onClick={() => onViewTypeChange('calendar')}
            className={`px-3 py-1.5 rounded-DEFAULT text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewType === 'calendar'
                ? 'bg-base-100 text-base-content shadow-xs font-bold'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            <Icon name="Calendar" size="xs" />
            Calendario
          </button>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 bg-warning/10 border border-warning/30 rounded-DEFAULT px-3 py-1.5 text-warning">
            <Icon name="AlertCircle" size="sm" className="shrink-0" />
            <span className="text-xs font-bold">
              {pendingCount} cita{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {onDirectReceptionClick && (
          <PrimaryButton
            onClick={onDirectReceptionClick}
            size="sm"
            className="flex items-center gap-1"
            title="Registrar recepción directa en taller (Walk-in)"
          >
            <Icon name="Wrench" size="xs" />
            + Recibir Auto
          </PrimaryButton>
        )}

        <PrimaryButton
          onClick={onAddClick}
          size="sm"
          className="flex items-center gap-1"
        >
          <Icon name="Plus" size="xs" />
          Añadir Cita
        </PrimaryButton>

        <SecondaryButton
          onClick={onRefreshClick}
          size="sm"
          className="w-8 h-8 p-0 flex items-center justify-center shrink-0"
          title="Actualizar"
        >
          <Icon name="RefreshCw" size="xs" />
        </SecondaryButton>
      </div>
    </header>
  );
};

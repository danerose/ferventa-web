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
  onRefreshClick,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 28px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      {/* Search and Branch Filter */}
      <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '560px' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Icon
            name="Search"
            size="sm"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          <TextInput
            type="text"
            value={searchValue}
            onChange={onSearchChange}
            placeholder="Buscar por cliente, teléfono o serie..."
            size="sm"
            className="pl-10 text-[13px] bg-[#f8fafc] focus:bg-white"
          />
        </div>

        {/* Branch Filter */}
        <div style={{ position: 'relative', width: '200px', flexShrink: 0 }}>
          <Icon
            name="MapPin"
            size="sm"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          <select
            value={branchFilter}
            onChange={(e) => onBranchChange(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '38px',
              paddingRight: '28px',
              paddingTop: '8px',
              paddingBottom: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#0b1c30',
              outline: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="all">Todas las sucursales</option>
            {uniqueBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
              fontSize: '10px',
            }}
          >
            ▼
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* View Toggle */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '4px',
            border: '1px solid #e2e8f0',
            marginRight: '8px',
          }}
        >
          <button
            onClick={() => onViewTypeChange('list')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: viewType === 'list' ? 'white' : 'transparent',
              color: viewType === 'list' ? '#091426' : '#64748b',
              boxShadow: viewType === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Icon name="List" size="xs" />
            Lista
          </button>
          <button
            onClick={() => onViewTypeChange('calendar')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              background: viewType === 'calendar' ? 'white' : 'transparent',
              color: viewType === 'calendar' ? '#091426' : '#64748b',
              boxShadow: viewType === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Icon name="Calendar" size="xs" />
            Calendario
          </button>
        </div>

        {pendingCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fff7e0',
              border: '1px solid #fbbf2440',
              borderRadius: '8px',
              padding: '6px 12px',
            }}
          >
            <Icon name="AlertCircle" size="sm" className="text-[#d97706]" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#b45309' }}>
              {pendingCount} cita{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <PrimaryButton
          onClick={onAddClick}
          size="sm"
          className="bg-[#091426] hover:bg-[#1e293b] text-white border-none py-1.5 rounded-lg"
        >
          <Icon name="Plus" size="xs" className="mr-1" />
          Añadir Cita
        </PrimaryButton>

        <SecondaryButton
          onClick={onRefreshClick}
          size="sm"
          className="w-9 h-9 p-0 flex items-center justify-center text-[#64748b] border-[#cbd5e1] bg-white hover:bg-[#f8fafc] rounded-lg"
          title="Actualizar"
        >
          <Icon name="RefreshCw" size="xs" />
        </SecondaryButton>
      </div>
    </header>
  );
};

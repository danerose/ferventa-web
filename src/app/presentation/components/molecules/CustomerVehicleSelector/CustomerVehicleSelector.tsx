import React from 'react';
import { Icon } from '@/app/presentation/components';
import type { CustomerLookupVehicle } from '@/app/domain';

export interface CustomerVehicleSelectorProps {
  customerName?: string;
  vehicles: CustomerLookupVehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (veh: CustomerLookupVehicle) => void;
  onSelectNewVehicle: () => void;
  disabled?: boolean;
}

export const CustomerVehicleSelector: React.FC<CustomerVehicleSelectorProps> = ({
  customerName,
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onSelectNewVehicle,
  disabled = false,
}) => {
  if (!vehicles || vehicles.length === 0) return null;

  return (
    <div className="p-3.5 bg-base-100 rounded-xl border border-base-300 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="Car" size="xs" />
          </div>
          <span className="text-xs font-bold text-base-content">
            Autos registrados de {customerName ? <span className="text-primary">{customerName}</span> : 'este cliente'}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {vehicles.length} {vehicles.length === 1 ? 'auto' : 'autos'}
          </span>
        </div>
        <span className="text-[11px] text-base-content/50 hidden sm:inline">
          Selecciona un auto o añade uno nuevo
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {vehicles.map((veh, idx) => {
          const vId = veh.id || veh._id || `veh-${idx}`;
          const isSelected = selectedVehicleId === vId;
          const brand = veh.brand?.trim() || '';
          const model = veh.model?.trim() || '';
          const displayName = brand && model
            ? `${brand} ${model}`
            : (brand || model || 'Vehículo sin especificar');
          const serial = veh.serialNumberLastFour || veh.licensePlate;

          return (
            <button
              key={vId}
              type="button"
              disabled={disabled}
              onClick={() => onSelectVehicle(veh)}
              className={`group relative p-2.5 rounded-xl border text-left transition-all duration-150 flex items-start gap-2.5 cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/30 shadow-xs'
                  : 'border-base-300 bg-base-100/80 hover:border-primary/40 hover:bg-base-200/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Vehicle Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-content shadow-xs'
                    : 'bg-base-200 text-base-content/60 group-hover:text-primary group-hover:bg-primary/10'
                }`}
              >
                <Icon name="Car" size="sm" />
              </div>

              {/* Vehicle Details */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="text-xs font-bold text-base-content truncate">
                  {displayName}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {veh.year && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-base-200 text-base-content/80">
                      {veh.year}
                    </span>
                  )}
                  {serial && (
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-base-200 text-primary">
                      {serial}
                    </span>
                  )}
                  {veh.color && (
                    <span className="text-[10px] text-base-content/60 truncate max-w-[85px]">
                      • {veh.color}
                    </span>
                  )}
                </div>
              </div>

              {/* Selection Checkmark Indicator */}
              <div className="absolute top-2.5 right-2.5">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-xs">
                    <Icon name="Check" size={12} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-base-300 group-hover:border-primary/50 transition-colors" />
                )}
              </div>
            </button>
          );
        })}

        {/* "+ Registrar otro vehículo" Card */}
        {(() => {
          const isNewSelected = selectedVehicleId === null;
          return (
            <button
              type="button"
              disabled={disabled}
              onClick={onSelectNewVehicle}
              className={`group relative p-2.5 rounded-xl border border-dashed text-left transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                isNewSelected
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/25 ring-1 ring-sky-400 shadow-xs'
                  : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-primary/[0.03]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isNewSelected
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-base-200 text-base-content/60 group-hover:text-primary group-hover:bg-primary/10'
                }`}
              >
                <Icon name="Plus" size="sm" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div
                  className={`text-xs font-bold ${
                    isNewSelected ? 'text-sky-700 dark:text-sky-300' : 'text-base-content/80'
                  }`}
                >
                  + Registrar otro auto
                </div>
                <div className="text-[10px] text-base-content/50">
                  Capturar datos para un auto nuevo
                </div>
              </div>

              <div className="absolute top-2.5 right-2.5">
                {isNewSelected ? (
                  <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                    <Icon name="Check" size={12} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-base-300 group-hover:border-primary/50 transition-colors" />
                )}
              </div>
            </button>
          );
        })()}
      </div>

      {/* Contextual Feedback Banner */}
      {selectedVehicleId ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.05] border border-primary/20 text-xs text-base-content/80 animate-in fade-in duration-150">
          <Icon name="Sparkles" size="xs" className="text-primary shrink-0" />
          <span>
            <strong>Vehículo existente seleccionado.</strong> Si modificas color, año o modelo en los campos de abajo, se actualizará en su expediente.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500/[0.06] border border-sky-500/20 text-xs text-base-content/80 animate-in fade-in duration-150">
          <Icon name="PlusCircle" size="xs" className="text-sky-500 shrink-0" />
          <span>
            <strong>Nuevo auto en proceso.</strong> Ingresa marca, modelo, año y serie para registrarlo a nombre de {customerName || 'este cliente'}.
          </span>
        </div>
      )}
    </div>
  );
};

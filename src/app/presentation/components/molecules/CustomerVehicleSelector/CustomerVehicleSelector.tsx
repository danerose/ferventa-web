import React from 'react';
import {
  Icon,
  Box,
  Flex,
  Grid,
  Text,
  Badge,
} from '@/app/presentation/components';
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
    <Box className="p-3.5 bg-base-100 rounded-xl border border-base-300 shadow-xs space-y-3">
      {/* Header */}
      <Flex justify="between" align="center" gap="xs">
        <Flex align="center" gap="xs">
          <Box className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="Car" size="xs" />
          </Box>
          <Text size="xs" weight="bold" className="text-base-content">
            Autos registrados de {customerName ? <Text as="span" color="primary" weight="bold">{customerName}</Text> : 'este cliente'}
          </Text>
          <Badge variant="primary" size="xs" className="font-semibold">
            {vehicles.length} {vehicles.length === 1 ? 'auto' : 'autos'}
          </Badge>
        </Flex>
        <Text size="xs" color="muted" className="hidden sm:inline">
          Selecciona un auto o añade uno nuevo
        </Text>
      </Flex>

      {/* Cards Grid */}
      <Grid cols={{ base: 1, sm: 2 }} gap="xs">
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
            <Box
              key={vId}
              role="button"
              tabIndex={0}
              onClick={() => !disabled && onSelectVehicle(veh)}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) onSelectVehicle(veh);
              }}
              className={`group relative p-2.5 rounded-xl border text-left transition-all duration-150 flex items-start gap-2.5 cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/30 shadow-xs'
                  : 'border-base-300 bg-base-100/80 hover:border-primary/40 hover:bg-base-200/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              {/* Vehicle Icon */}
              <Box
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-content shadow-xs'
                    : 'bg-base-200 text-base-content/60 group-hover:text-primary group-hover:bg-primary/10'
                }`}
              >
                <Icon name="Car" size="sm" />
              </Box>

              {/* Vehicle Details */}
              <Box className="flex-1 min-w-0 pr-6">
                <Text size="xs" weight="bold" className="text-base-content truncate">
                  {displayName}
                </Text>
                <Flex align="center" gap="xs" wrap="wrap" className="mt-1">
                  {veh.year && (
                    <Badge size="xs" variant="neutral" className="font-medium">
                      {veh.year}
                    </Badge>
                  )}
                  {serial && (
                    <Badge size="xs" variant="primary" className="font-mono font-semibold">
                      {serial}
                    </Badge>
                  )}
                  {veh.color && (
                    <Text size="xs" color="muted" className="truncate max-w-[85px]">
                      • {veh.color}
                    </Text>
                  )}
                </Flex>
              </Box>

              {/* Selection Checkmark Indicator */}
              <Box className="absolute top-2.5 right-2.5">
                {isSelected ? (
                  <Box className="w-5 h-5 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-xs">
                    <Icon name="Check" size={12} />
                  </Box>
                ) : (
                  <Box className="w-5 h-5 rounded-full border border-base-300 group-hover:border-primary/50 transition-colors" />
                )}
              </Box>
            </Box>
          );
        })}

        {/* "+ Registrar otro vehículo" Card */}
        {(() => {
          const isNewSelected = selectedVehicleId === null;
          return (
            <Box
              role="button"
              tabIndex={0}
              onClick={() => !disabled && onSelectNewVehicle()}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) onSelectNewVehicle();
              }}
              className={`group relative p-2.5 rounded-xl border border-dashed text-left transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                isNewSelected
                  ? 'border-info bg-info/10 ring-1 ring-info/30 shadow-xs'
                  : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-primary/[0.03]'
              } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <Box
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isNewSelected
                    ? 'bg-info text-info-content shadow-xs'
                    : 'bg-base-200 text-base-content/60 group-hover:text-primary group-hover:bg-primary/10'
                }`}
              >
                <Icon name="Plus" size="sm" />
              </Box>

              <Box className="flex-1 min-w-0 pr-6">
                <Text
                  size="xs"
                  weight="bold"
                  className={isNewSelected ? 'text-info font-bold' : 'text-base-content/80'}
                >
                  + Registrar otro auto
                </Text>
                <Text size="xs" color="muted">
                  Capturar datos para un auto nuevo
                </Text>
              </Box>

              <Box className="absolute top-2.5 right-2.5">
                {isNewSelected ? (
                  <Box className="w-5 h-5 rounded-full bg-info text-info-content flex items-center justify-center shadow-xs">
                    <Icon name="Check" size={12} />
                  </Box>
                ) : (
                  <Box className="w-5 h-5 rounded-full border border-base-300 group-hover:border-primary/50 transition-colors" />
                )}
              </Box>
            </Box>
          );
        })()}
      </Grid>

      {/* Contextual Feedback Banner */}
      {selectedVehicleId ? (
        <Flex align="center" gap="xs" className="px-3 py-2 rounded-lg bg-primary/[0.05] border border-primary/20 text-xs text-base-content/80">
          <Icon name="Sparkles" size="xs" className="text-primary shrink-0" />
          <Text size="xs">
            <Text as="strong" weight="bold">Vehículo existente seleccionado.</Text> Si modificas color, año o modelo en los campos de abajo, se actualizará en su expediente.
          </Text>
        </Flex>
      ) : (
        <Flex align="center" gap="xs" className="px-3 py-2 rounded-lg bg-info/[0.06] border border-info/20 text-xs text-base-content/80">
          <Icon name="PlusCircle" size="xs" className="text-info shrink-0" />
          <Text size="xs">
            <Text as="strong" weight="bold">Nuevo auto en proceso.</Text> Ingresa marca, modelo, año y serie para registrarlo a nombre de {customerName || 'este cliente'}.
          </Text>
        </Flex>
      )}
    </Box>
  );
};

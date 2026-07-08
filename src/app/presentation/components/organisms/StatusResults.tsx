import React, { useState } from 'react';
import { useClientPortalStore } from '../../stores/useClientPortalStore';
import { Box, Flex, Stack, Grid, Icon } from '@/app/presentation/components';

export const StatusResults: React.FC = () => {
  const { appointments, maintenanceTrack, searchLoading, searchError, hasSearched } = useClientPortalStore();
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; stage: string } | null>(null);

  if (searchLoading) {
    return (
      <Box p="lg" rounded="xl" className="bg-white border border-[#e2e8f0] text-center py-16 shadow-sm">
        <Stack gap="md" align="center">
          <span className="loading loading-spinner loading-lg text-[#091426]"></span>
          <p className="font-body-base text-on-surface-variant font-medium">Buscando registros...</p>
        </Stack>
      </Box>
    );
  }

  if (searchError) {
    return (
      <Box p="lg" rounded="xl" className="bg-white border border-[#e2e8f0] p-8 shadow-sm">
        <Flex gap="sm" align="center" className="text-error mb-2">
          <Icon name="AlertCircle" />
          <h3 className="font-headline-md font-semibold">Error en la búsqueda</h3>
        </Flex>
        <p className="font-body-sm text-on-surface-variant">{searchError}</p>
      </Box>
    );
  }

  if (!hasSearched) {
    return (
      <Box p="lg" rounded="xl" className="bg-white border border-[#e2e8f0] text-center py-16 shadow-sm">
        <Stack gap="sm" align="center" className="text-gray-400">
          <Icon name="Motorbike" size={48} className="text-slate-300" />
          <p className="font-body-base text-on-surface-variant font-medium">
            Introduce tus datos de cita o número de serie a la izquierda para ver el estatus.
          </p>
        </Stack>
      </Box>
    );
  }

  const hasAppointments = appointments.length > 0;
  const hasMaintenance = maintenanceTrack !== null;

  if (!hasAppointments && !hasMaintenance) {
    return (
      <Box p="lg" rounded="xl" className="bg-white border border-[#e2e8f0] text-center py-16 shadow-sm">
        <Stack gap="sm" align="center">
          <Icon name="SearchCode" size={48} className="text-slate-300 mb-2" />
          <h3 className="font-headline-md text-on-background">No se encontraron registros</h3>
          <p className="font-body-sm text-on-surface-variant max-w-sm">
            No encontramos citas ni órdenes de servicio activas asociadas a la búsqueda. Por favor verifica tus datos.
          </p>
        </Stack>
      </Box>
    );
  }

  // Appointment Status Badges
  const getAppointmentBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-[#ffddb8] text-[#653e00] font-semibold border-none px-3 py-1 rounded-full text-xs">Pendiente</span>;
      case 'approved':
        return <span className="badge bg-[#6ffbbe]/30 text-[#002113] border border-[#6ffbbe] font-semibold px-3 py-1 rounded-full text-xs">Aprobada</span>;
      case 'rescheduled':
        return <span className="badge bg-purple-100 text-[#5b21b6] font-semibold border-none px-3 py-1 rounded-full text-xs">Reagendada</span>;
      case 'rejected':
        return <span className="badge bg-red-100 text-[#ba1a1a] font-semibold border-none px-3 py-1 rounded-full text-xs">Rechazada</span>;
      case 'cancelled':
        return <span className="badge bg-gray-100 text-gray-500 font-semibold border-none px-3 py-1 rounded-full text-xs">Cancelada</span>;
      case 'completed':
        return <span className="badge bg-blue-100 text-blue-800 font-semibold border-none px-3 py-1 rounded-full text-xs">Terminada</span>;
      default:
        return <span className="badge bg-gray-100 text-gray-800 font-semibold border-none px-3 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  // Maintenance Track Mapping
  const getMaintenanceStepInfo = (status: string) => {
    switch (status) {
      case 'not_started':
        return { active: 1, percent: 'w-0' };
      case 'in_progress':
        return { active: 2, percent: 'w-1/2' };
      case 'completed':
      case 'delivered':
        return { active: 3, percent: 'w-full' };
      default:
        return { active: 1, percent: 'w-0' };
    }
  };

  const stepInfo = hasMaintenance ? getMaintenanceStepInfo(maintenanceTrack.status) : { active: 0, percent: 'w-0' };

  return (
    <Stack gap="lg">
      {/* 1. Maintenance Status Panel */}
      {hasMaintenance && (
        <Box rounded="xl" className="bg-white border border-[#e2e8f0] shadow-sm overflow-hidden animate-in fade-in duration-300">
          {/* Header */}
          <Box p="lg" className="border-b border-[#e2e8f0] bg-surface-container-low">
            <Flex wrap justify="between" align="start" gap="md">
              <div>
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Icon name="Wrench" size="sm" className="text-secondary" />
                  {maintenanceTrack.vehicle.brand} {maintenanceTrack.vehicle.model} {maintenanceTrack.vehicle.year}
                </h3>
                <p className="font-data-mono text-on-surface-variant text-sm mt-1">
                  Orden: #{maintenanceTrack.orderNumber} | Serie (4 dígitos):{' '}
                  <span className="font-semibold text-primary">{maintenanceTrack.vehicle.serialNumberLastFour}</span>
                </p>
              </div>
              <div className="bg-[#cbd5e1]/40 px-3 py-1.5 rounded-full border border-gray-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#855300] animate-pulse"></span>
                <span className="text-on-background font-bold text-xs">
                  {maintenanceTrack.status === 'not_started' && 'Recibido'}
                  {maintenanceTrack.status === 'in_progress' && 'En Proceso'}
                  {maintenanceTrack.status === 'completed' && 'Terminado'}
                  {maintenanceTrack.status === 'delivered' && 'Entregado'}
                </span>
              </div>
            </Flex>
          </Box>

          <Box p="lg">
            {/* Timeline Progress */}
            <div className="relative mb-12 px-6 pt-4">
              {/* Background grey line */}
              <div className="absolute top-1/2 left-6 right-6 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
              {/* Colored active line */}
              <div
                className={`absolute top-1/2 left-6 h-1 bg-[#091426] -translate-y-1/2 z-0 transition-all duration-1000 ${stepInfo.percent}`}
              ></div>

              <div className="relative flex justify-between z-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white border transition-all duration-500 ${stepInfo.active >= 1
                      ? 'bg-[#091426] text-white border-none'
                      : 'bg-white text-gray-400 border-gray-300'
                      }`}
                  >
                    {stepInfo.active > 1 ? (
                      <Icon name="Check" size="sm" />
                    ) : (
                      <Icon name="ClipboardList" size="sm" />
                    )}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${stepInfo.active >= 1 ? 'text-[#091426]' : 'text-gray-400'}`}>
                    Recibido
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white border transition-all duration-500 ${stepInfo.active >= 2
                      ? 'bg-[#091426] text-white border-none'
                      : 'bg-white text-gray-400 border-gray-300'
                      }`}
                  >
                    {stepInfo.active > 2 ? (
                      <Icon name="Check" size="sm" />
                    ) : (
                      <Icon name="Hammer" size="sm" />
                    )}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${stepInfo.active >= 2 ? 'text-[#091426]' : 'text-gray-400'}`}>
                    En Taller
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white border transition-all duration-500 ${stepInfo.active >= 3
                      ? 'bg-[#091426] text-white border-none'
                      : 'bg-white text-gray-400 border-gray-300'
                      }`}
                  >
                    <Icon name="Award" size="sm" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${stepInfo.active >= 3 ? 'text-[#091426]' : 'text-gray-400'}`}>
                    Terminado
                  </span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {maintenanceTrack.notes && (
              <Box p="md" rounded="lg" className="bg-[#eff4ff]/60 border-l-4 border-[#091426] mb-8">
                <h4 className="font-semibold text-primary text-sm mb-1">Notas del Diagnóstico:</h4>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">{maintenanceTrack.notes}</p>
              </Box>
            )}

            {/* Invoice Breakdown details */}
            {(maintenanceTrack.laborCost > 0 || maintenanceTrack.items.length > 0) && (
              <Box className="mb-8">
                <h4 className="font-bold text-body-base text-primary mb-3 flex items-center gap-2">
                  <Icon name="Receipt" size="sm" className="text-secondary" />
                  Detalles del Servicio
                </h4>
                <div className="border border-[#e2e8f0] rounded-lg overflow-hidden font-sans">
                  <table className="table w-full bg-white text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                      <tr>
                        <th className="px-4 py-3">Concepto / Refacción</th>
                        <th className="px-4 py-3 text-center">Cant.</th>
                        <th className="px-4 py-3 text-right">Precio U.</th>
                        <th className="px-4 py-3 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[#0b1c30]">
                      {maintenanceTrack.laborCost > 0 && (
                        <tr>
                          <td className="px-4 py-3 font-medium">Mano de Obra y Diagnóstico</td>
                          <td className="px-4 py-3 text-center">1</td>
                          <td className="px-4 py-3 text-right">${maintenanceTrack.laborCost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">${maintenanceTrack.laborCost.toFixed(2)}</td>
                        </tr>
                      )}
                      {maintenanceTrack.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">{item.productName}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50/70 font-semibold">
                        <td colSpan={3} className="px-4 py-3 text-right">Total Estimado:</td>
                        <td className="px-4 py-3 text-right text-primary">
                          $
                          {(
                            maintenanceTrack.laborCost +
                            maintenanceTrack.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Box>
            )}

            {/* Evidence Gallery */}
            <div>
              <h4 className="font-bold text-body-base text-primary mb-3 flex items-center gap-2">
                <Icon name="Image" size="sm" className="text-secondary" />
                Evidencia Fotográfica
              </h4>
              {maintenanceTrack.evidence.length > 0 ? (
                <Grid cols={{ base: 2, sm: 3 }} gap="sm">
                  {maintenanceTrack.evidence.map((pic, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedPhoto({ url: pic.url, stage: pic.stage })}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer relative group bg-gray-50 flex items-center justify-center shadow-sm"
                    >
                      <img
                        src={pic.url}
                        alt={`Evidencia ${pic.stage}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                      <span className="absolute bottom-2.5 left-2.5 text-white text-[11px] font-semibold bg-[#091426]/70 px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-[2px]">
                        {pic.stage === 'reception' && 'Recepción'}
                        {pic.stage === 'disassembly' && 'Taller'}
                        {pic.stage === 'completed' && 'Completado'}
                        {!['reception', 'disassembly', 'completed'].includes(pic.stage) && pic.stage}
                      </span>
                    </Box>
                  ))}
                </Grid>
              ) : (
                <Box className="p-6 bg-gray-50 rounded-lg text-center text-gray-400 text-sm">
                  Aún no se han subido fotografías de evidencia para este mantenimiento.
                </Box>
              )}
            </div>
          </Box>
        </Box>
      )}

      {/* 2. Appointments List Panel */}
      {hasAppointments && (
        <Box rounded="xl" p="lg" className="bg-white border border-[#e2e8f0] shadow-sm animate-in fade-in duration-300">
          <Stack gap="sm">
            <h3 className="font-headline-md text-primary flex items-center gap-2 mb-2">
              <Icon name="CalendarDays" size="sm" className="text-secondary" />
              Citas Agendadas
            </h3>
            <div className="space-y-3">
              {appointments.map((appt) => (
                <Box
                  key={appt.id}
                  p="md"
                  rounded="lg"
                  className="bg-[#f8f9ff] border border-outline-variant/40 hover:border-gray-300 transition-colors"
                >
                  <Flex wrap justify="between" align="center" gap="md">
                    <Stack gap="xs">
                      <span className="font-semibold text-primary">{appt.serviceRequested}</span>
                      <span className="text-xs text-on-surface-variant font-data-mono">
                        {new Date(appt.scheduledAt).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'UTC',
                        })}
                      </span>
                      {appt.vehicle && (
                        <span className="text-xs text-gray-500 font-medium">
                          Vehículo: {appt.vehicle.brand} {appt.vehicle.model} (Serie: {appt.vehicle.serialNumberLastFour})
                        </span>
                      )}
                    </Stack>
                    <div>{getAppointmentBadge(appt.status || 'pending')}</div>
                  </Flex>
                </Box>
              ))}
            </div>
          </Stack>
        </Box>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative bg-[#091426] max-w-4xl max-h-[85vh] rounded-lg overflow-hidden border border-white/10 flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-3.5 top-3.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors focus:outline-none"
            >
              <Icon name="X" size="sm" />
            </button>
            <img
              src={selectedPhoto.url}
              alt="Evidencia Ampliada"
              className="max-w-full max-h-[70vh] object-contain block"
            />
            <div className="bg-[#091426] p-4 text-white">
              <span className="font-label-caps text-secondary block text-xs mb-1">Etapa de Mantenimiento</span>
              <h4 className="font-bold capitalize text-base">
                {selectedPhoto.stage === 'reception' && 'Recepción inicial'}
                {selectedPhoto.stage === 'disassembly' && 'Trabajos en Taller'}
                {selectedPhoto.stage === 'completed' && 'Mantenimiento Terminado'}
                {!['reception', 'disassembly', 'completed'].includes(selectedPhoto.stage) && selectedPhoto.stage}
              </h4>
            </div>
          </div>
        </div>
      )}
    </Stack>
  );
};

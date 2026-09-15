import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Icon, Badge, SecondaryButton } from '@/app/presentation/components';
import { scheduleUseCases } from '@/core/di/container';
import type { OccupiedSlotsResponse, Holiday, WorkingHours, BusySlot } from '@/app/domain';

interface WorkshopLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
}

export const WorkshopLoadModal: React.FC<WorkshopLoadModalProps> = ({
  isOpen,
  onClose,
  branchId,
}) => {
  const [loading, setLoading] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlotsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const activeBranch = branchId || localStorage.getItem('ferventa_active_branch') || undefined;
        const data = await scheduleUseCases.getOccupiedSlots(activeBranch);
        if (isMounted) {
          setOccupiedSlots(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error al consultar la disponibilidad del taller');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [isOpen, branchId]);

  const daysList = useMemo(() => {
    if (!occupiedSlots) return [];

    const list = [];
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(todayUTC.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = nextDate.getUTCFullYear();
      const mm = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getUTCDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      const dayLabel = nextDate.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      });

      // Holiday
      const holiday = occupiedSlots.holidays.find((h: Holiday) => h.date === dateString);
      // Non-working
      const dayOfWeek = nextDate.getUTCDay();
      const isNonWorking = occupiedSlots.nonWorkingDaysOfWeek.includes(dayOfWeek);
      const schedule = occupiedSlots.workingHours.find((w: WorkingHours) => w.dayOfWeek === dayOfWeek);
      const isClosed = isNonWorking || (schedule && !schedule.isWorking);

      // Busy slots
      const busyTimes = occupiedSlots.busySlots
        .filter((b: BusySlot) => b.date === dateString)
        .map((b: BusySlot) => `${b.startTime} - ${b.endTime}`);

      // Workload status
      let loadLevel: 'free' | 'moderate' | 'high' | 'closed' = 'free';
      if (isClosed) {
        loadLevel = 'closed';
      } else if (busyTimes.length >= 6) {
        loadLevel = 'high';
      } else if (busyTimes.length >= 2) {
        loadLevel = 'moderate';
      }

      list.push({
        dateStr: dateString,
        dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        isToday: i === 0,
        isClosed: !!isClosed,
        closedReason: holiday ? holiday.description : 'Cerrado / No laborable',
        busyTimes,
        loadLevel,
      });
    }

    return list;
  }, [occupiedSlots]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carga de Trabajo y Disponibilidad del Taller"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-base-content/70">
          Usa este calendario para verificar rápidamente qué tan ocupado está el taller en los próximos 7 días y orientar al cliente en la recepción de su vehículo.
        </p>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/60">
            <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
            <p className="text-sm font-medium">Consultando agenda y slots ocupados...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error text-sm">
            <Icon name="AlertCircle" size="sm" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto p-1">
            {daysList.map((day) => (
              <div
                key={day.dateStr}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  day.loadLevel === 'closed'
                    ? 'bg-base-200/40 border-base-300 opacity-60'
                    : day.loadLevel === 'high'
                    ? 'bg-error/5 border-error/20 hover:border-error/40'
                    : day.loadLevel === 'moderate'
                    ? 'bg-warning/5 border-warning/20 hover:border-warning/40'
                    : 'bg-success/5 border-success/20 hover:border-success/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-base-content flex items-center gap-1.5">
                      {day.dayLabel}
                      {day.isToday && (
                        <span className="badge badge-xs badge-primary font-bold uppercase">Hoy</span>
                      )}
                    </span>

                    {day.loadLevel === 'closed' && (
                      <Badge variant="soft" color="neutral" size="xs">
                        Cerrado
                      </Badge>
                    )}
                    {day.loadLevel === 'high' && (
                      <Badge variant="soft" color="danger" size="xs">
                        Alta Carga ({day.busyTimes.length} citas)
                      </Badge>
                    )}
                    {day.loadLevel === 'moderate' && (
                      <Badge variant="soft" color="warning" size="xs">
                        Carga Media ({day.busyTimes.length} citas)
                      </Badge>
                    )}
                    {day.loadLevel === 'free' && (
                      <Badge variant="soft" color="success" size="xs">
                        {day.busyTimes.length === 0 ? 'Libre / Disponible' : `${day.busyTimes.length} cita(s)`}
                      </Badge>
                    )}
                  </div>

                  <div className="font-mono text-xs text-base-content/50 mb-2">
                    {day.dateStr}
                  </div>

                  {day.isClosed ? (
                    <div className="text-xs text-base-content/60 italic py-2">
                      {day.closedReason}
                    </div>
                  ) : day.busyTimes.length === 0 ? (
                    <div className="text-xs text-success font-medium py-2 flex items-center gap-1.5">
                      <Icon name="CheckCircle" size="xs" />
                      Espacio amplio todo el día
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      <span className="text-[11px] font-semibold text-base-content/60 block">
                        Horas con cita agendada:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {day.busyTimes.map((time, idx) => (
                          <span
                            key={idx}
                            className="bg-base-300/80 text-base-content/80 text-[11px] font-mono px-2 py-0.5 rounded"
                          >
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-base-200 dark:border-base-content/5 text-[11px] text-base-content/50 font-medium">
                  {day.isClosed
                    ? 'No recibir unidades este día'
                    : day.loadLevel === 'high'
                    ? 'Recomendar fecha posterior al cliente'
                    : 'Recepción recomendada'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-base-200">
          <SecondaryButton onClick={onClose} size="sm">
            Cerrar
          </SecondaryButton>
        </div>
      </div>
    </Modal>
  );
};

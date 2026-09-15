import React from 'react';
import { Modal, Textarea, PrimaryButton, SecondaryButton, TextInput, Icon, KbdBadge } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';
import { cn } from '@/core/utils/cn';

export interface ApproveRescheduledModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  finalDate: string;
  onFinalDateChange: (val: string) => void;
  finalTime: string;
  onFinalTimeChange: (val: string) => void;
  timeSlotOptions: string[];
  format12h: (t: string) => string;
  occupiedSlots?: unknown;
  occupiedLoading?: boolean;
  occupiedList: {
    dateStr: string;
    dayLabel: string;
    isClosed: boolean;
    closedReason: string;
    busyTimes: string[];
  }[];
  modalMessage: string;
  onMessageChange: (val: string) => void;
  onConfirm: () => void;
  updating: boolean;
}

export const ApproveRescheduledModal: React.FC<ApproveRescheduledModalProps> = ({
  isOpen,
  appt,
  onClose,
  finalDate,
  onFinalDateChange,
  finalTime,
  onFinalTimeChange,
  timeSlotOptions,
  format12h,
  occupiedLoading = false,
  occupiedList,
  modalMessage,
  onMessageChange,
  onConfirm,
  updating,
}) => {
  if (!appt) return null;

  const isApprovedMode = appt.status === 'approved';

  const footer = (
    <>
      <SecondaryButton onClick={onClose} disabled={updating}>
        Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
      </SecondaryButton>
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating || !finalDate || !finalTime}
        loading={updating}
        color={isApprovedMode ? 'neutral' : 'secondary'}
      >
        {isApprovedMode ? 'Guardar y Reagendar' : 'Actualizar Cita y Aprobar'} <KbdBadge keys="Enter ↵" className="ml-1.5" />
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprovedMode ? 'Reagendar Cita Aprobada' : 'Confirmar y Aprobar Cita Reagendada'}
      footer={footer}
      headerVariant={isApprovedMode ? 'neutral' : 'secondary'}
      maxWidth="980px"
    >
      <div className="flex flex-col md:flex-row gap-5 min-h-[400px]">
        {/* Left Column: Visual helper of occupied schedule */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-base-300 bg-base-200/40 p-4 flex flex-col gap-3 overflow-y-auto rounded-DEFAULT">
          <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/80 m-0 flex items-center gap-1.5">
            <Icon name="CalendarRange" size="xs" />
            Visualizador de Agenda (Ayuda)
          </h4>
          <p className="text-xs text-base-content/60 m-0">
            Horarios y citas agendadas de los próximos 7 días laborales.
          </p>

          {occupiedLoading ? (
            <div className="flex justify-center py-10">
              <span className="text-xs text-base-content/50">Cargando agenda...</span>
            </div>
          ) : occupiedList.length === 0 ? (
            <div className="flex justify-center py-10">
              <span className="text-xs text-base-content/50">No hay información de agenda.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {occupiedList.map((day) => {
                const isSelected = day.dateStr === finalDate;
                return (
                  <div
                    key={day.dateStr}
                    onClick={() => {
                      if (!day.isClosed) {
                        onFinalDateChange(day.dateStr);
                      }
                    }}
                    className={cn(
                      'bg-base-100 border rounded-DEFAULT p-2.5 text-xs shadow-2xs transition-all',
                      !day.isClosed && 'cursor-pointer hover:border-primary/50',
                      isSelected
                        ? 'border-primary ring-1 ring-primary bg-primary/5'
                        : 'border-base-300'
                    )}
                  >
                    <div className="font-bold text-base-content flex justify-between mb-1 items-center">
                      <span className="flex items-center gap-1.5">
                        {day.dayLabel}
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary text-primary-content font-bold">
                            Seleccionado
                          </span>
                        )}
                      </span>
                      {day.isClosed && (
                        <span className="text-error text-[10.5px] font-semibold">{day.closedReason}</span>
                      )}
                    </div>
                    {day.isClosed ? null : day.busyTimes.length === 0 ? (
                      <div className="text-success italic font-medium">Todo el día libre</div>
                    ) : (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[10px] text-base-content/60 font-semibold uppercase">
                          OCUPADO EN:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {day.busyTimes.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-error/15 text-error border border-error/30"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Date/Time selection & message */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <p className="text-sm text-base-content/80 m-0">
            {isApprovedMode
              ? 'Selecciona la nueva fecha y hora para la cita aprobada.'
              : 'Selecciona la fecha y hora final acordada con el cliente para esta cita reagendada antes de proceder con su aprobación.'}
          </p>

          {/* Final schedule selection */}
          <div
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-DEFAULT border',
              isApprovedMode ? 'bg-base-200/50 border-base-300' : 'bg-secondary/10 border-secondary/30'
            )}
          >
            <div className="flex flex-col gap-1">
              <label
                className={cn(
                  'text-[11px] font-bold uppercase tracking-wider',
                  isApprovedMode ? 'text-base-content/70' : 'text-secondary'
                )}
              >
                Fecha Final *
              </label>
              <TextInput
                type="date"
                value={finalDate}
                onChange={(e) => onFinalDateChange(e.target.value)}
                size="sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                className={cn(
                  'text-[11px] font-bold uppercase tracking-wider',
                  isApprovedMode ? 'text-base-content/70' : 'text-secondary'
                )}
              >
                Hora Final (Intervalos 15 min) *
              </label>
              <select
                value={finalTime}
                onChange={(e) => onFinalTimeChange(e.target.value)}
                className="select select-bordered select-sm w-full bg-base-100 text-base-content border-base-300 font-normal focus:outline-none focus:border-primary h-9"
              >
                {timeSlotOptions.map((t) => (
                  <option key={t} value={t}>
                    {format12h(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Mensaje a enviar (Editable)
            </label>
            <Textarea
              value={modalMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={8}
              className="font-sans text-[13px]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};


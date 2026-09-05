import React from 'react';
import { Modal, Textarea } from '@/app/presentation/components';
import { PrimaryButton, SecondaryButton, TextInput } from '@/app/presentation/components';
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
  occupiedSlots: unknown;
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
  occupiedSlots,
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
        Cancelar
      </SecondaryButton>
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating || !finalDate || !finalTime}
        loading={updating}
        color={isApprovedMode ? 'neutral' : 'secondary'}
      >
        {isApprovedMode ? 'Guardar y Reagendar' : 'Actualizar Cita y Aprobar'}
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
      maxWidth="600px"
    >
      <div className="flex flex-col gap-4">
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

        {/* Visual aid panel (agenda items) inside approve modal */}
        {Boolean(occupiedSlots) && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Agenda del día seleccionado ({finalDate}):
            </span>
            {(() => {
              const dayInfo = occupiedList.find((d) => d.dateStr === finalDate);
              if (!dayInfo) {
                return (
                  <div className="text-xs text-base-content/50 italic">
                    Elige una fecha para ver disponibilidad.
                  </div>
                );
              }
              if (dayInfo.isClosed) {
                return (
                  <div className="text-xs text-error font-semibold">
                    Cerrado: {dayInfo.closedReason}
                  </div>
                );
              }
              if (dayInfo.busyTimes.length === 0) {
                return (
                  <div className="text-xs text-success italic font-medium">
                    Todo el día libre
                  </div>
                );
              }
              return (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-base-content/60 font-semibold">
                    Ocupado:
                  </span>
                  {dayInfo.busyTimes.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-error/15 text-error border border-error/30"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

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
    </Modal>
  );
};


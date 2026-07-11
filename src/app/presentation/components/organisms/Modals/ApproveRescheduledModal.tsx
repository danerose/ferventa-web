import React from 'react';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';
import { PrimaryButton, SecondaryButton, TextInput, Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

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
  occupiedSlots: any;
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
        className={isApprovedMode ? 'bg-[#091426] hover:bg-[#1e293b]' : 'bg-[#8b5cf6] hover:bg-[#7c3aed]'}
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
      headerBackground={isApprovedMode ? '#091426' : '#8b5cf6'}
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
          {isApprovedMode
            ? 'Selecciona la nueva fecha y hora para la cita aprobada.'
            : 'Selecciona la fecha y hora final acordada con el cliente para esta cita reagendada antes de proceder con su aprobación.'}
        </p>

        {/* Final schedule selection */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: isApprovedMode ? '#f8fafc' : '#f5f3ff',
            border: isApprovedMode ? '1px solid #e2e8f0' : '1px solid #ddd6fe',
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: isApprovedMode ? '#475569' : '#6d28d9' }}>
              Fecha Final *
            </label>
            <TextInput
              type="date"
              value={finalDate}
              onChange={(e) => onFinalDateChange(e.target.value)}
              size="sm"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: isApprovedMode ? '#475569' : '#6d28d9' }}>
              Hora Final (Intervalos 15 min) *
            </label>
            <select
              value={finalTime}
              onChange={(e) => onFinalTimeChange(e.target.value)}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                background: 'white',
                height: '36px',
              }}
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
        {occupiedSlots && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
              Agenda del día seleccionado ({finalDate}):
            </span>
            {(() => {
              const dayInfo = occupiedList.find((d) => d.dateStr === finalDate);
              if (!dayInfo) {
                return (
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Elige una fecha para ver disponibilidad.
                  </div>
                );
              }
              if (dayInfo.isClosed) {
                return (
                  <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600' }}>
                    Cerrado: {dayInfo.closedReason}
                  </div>
                );
              }
              if (dayInfo.busyTimes.length === 0) {
                return (
                  <div style={{ fontSize: '11.5px', color: '#16a34a', fontStyle: 'italic' }}>
                    Todo el día libre
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', alignSelf: 'center' }}>
                    Ocupado:
                  </span>
                  {dayInfo.busyTimes.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
            Mensaje a enviar (Editable)
          </label>
          <textarea
            value={modalMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontFamily: 'Inter, system-ui, sans-serif',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

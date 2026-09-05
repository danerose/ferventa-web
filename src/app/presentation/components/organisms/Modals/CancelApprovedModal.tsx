import React from 'react';
import { Modal } from '@/app/presentation/components';
import { PrimaryButton, SecondaryButton, Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';

export interface CancelApprovedModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  onConfirm: () => void;
  updating: boolean;
}

function formatScheduledAt(scheduledAt: string) {
  try {
    const d = new Date(scheduledAt);
    const day = d.getUTCDate();
    const monthShort = d
      .toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' })
      .toUpperCase()
      .replace('.', '');
    const hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return { date: `${day} ${monthShort}`, time: `${h12}:${minutes}`, period };
  } catch {
    return { date: '---', time: '---', period: '' };
  }
}

export const CancelApprovedModal: React.FC<CancelApprovedModalProps> = ({
  isOpen,
  appt,
  onClose,
  onConfirm,
  updating,
}) => {
  if (!appt) return null;

  const footer = (
    <>
      <SecondaryButton onClick={onClose} disabled={updating}>
        Volver
      </SecondaryButton>
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating}
        loading={updating}
        color="error"
      >
        Sí, Cancelar Cita
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancelar Cita Aprobada"
      footer={footer}
      headerVariant="error"
      maxWidth="500px"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-error/10 border border-error/20 rounded-DEFAULT p-4 flex gap-3 items-start">
          <Icon name="AlertCircle" className="text-error shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-error">Advertencia Importante</span>
            <p className="text-sm text-base-content/80 m-0 leading-relaxed">
              Esta acción no puede ser deshecha. ¿Estás seguro de que deseas cancelar la cita de{' '}
              <strong className="text-base-content font-semibold">{appt.customerName}</strong>?
              {(() => {
                const { date, time, period } = formatScheduledAt(appt.scheduledAt);
                return (
                  <span className="block mt-1.5 text-xs text-error font-semibold">
                    Fecha programada: {date} a las {time} {period}
                  </span>
                );
              })()}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

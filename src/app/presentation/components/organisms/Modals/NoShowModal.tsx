import React, { useState, useEffect } from 'react';
import { Modal, PrimaryButton, SecondaryButton, Icon, KbdBadge, Textarea } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';

export interface NoShowModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
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

export const NoShowModal: React.FC<NoShowModalProps> = ({
  isOpen,
  appt,
  onClose,
  onConfirm,
  updating,
}) => {
  const [notes, setNotes] = useState('El cliente no se presentó a su cita a la hora acordada');

  useEffect(() => {
    if (isOpen) {
      setNotes('El cliente no se presentó a su cita a la hora acordada');
    }
  }, [isOpen, appt]);

  if (!appt) return null;

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
  };

  const footer = (
    <>
      <SecondaryButton onClick={onClose} disabled={updating}>
        Volver <KbdBadge keys="Esc" className="ml-1.5" />
      </SecondaryButton>
      <PrimaryButton
        onClick={handleConfirm}
        disabled={updating}
        loading={updating}
        color="warning"
      >
        Confirmar No Asistió <KbdBadge keys="Enter ↵" className="ml-1.5" />
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Falta (No Asistió)"
      footer={footer}
      headerVariant="warning"
      maxWidth="500px"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-warning/10 border border-warning/20 rounded-DEFAULT p-4 flex gap-3 items-start">
          <Icon name="UserX" className="text-warning shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-warning">Marcar Cita como No Asistió</span>
            <p className="text-sm text-base-content/80 m-0 leading-relaxed">
              Esta acción marcará la cita de{' '}
              <strong className="text-base-content font-semibold">{appt.customerName}</strong> como inasistencia.
              {(() => {
                const { date, time, period } = formatScheduledAt(appt.scheduledAt);
                return (
                  <span className="block mt-1.5 text-xs text-warning font-semibold">
                    Fecha y horario: {date} a las {time} {period}
                  </span>
                );
              })()}
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-base-content/80 mb-1.5 block">
            Notas / Observación (Opcional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones sobre la inasistencia..."
            rows={3}
            disabled={updating}
            className="w-full text-xs"
          />
        </div>
      </div>
    </Modal>
  );
};

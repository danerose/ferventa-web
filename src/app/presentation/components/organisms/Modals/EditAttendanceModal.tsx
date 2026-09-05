import React, { useState, useEffect, useId } from 'react';
import { Modal, PrimaryButton, SecondaryButton, KbdBadge } from '@/app/presentation/components';
import { APIAttendanceRepository } from '@/app/data';
import type { AttendanceRecord } from '@/app/domain';

const attendanceRepo = new APIAttendanceRepository();

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onSuccess: () => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
}) => {
  const [clockIn, setClockIn] = useState<string>('');
  const [clockOut, setClockOut] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const formId = useId();

  useEffect(() => {
    if (record) {
      setClockIn(record.clockIn ? new Date(record.clockIn).toISOString().slice(0, 16) : '');
      setClockOut(record.clockOut ? new Date(record.clockOut).toISOString().slice(0, 16) : '');
      setAdminNotes(record.adminNotes || '');
      setErrorMsg(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await attendanceRepo.updateRecord(record._id || record.id || '', {
        clockIn: clockIn ? new Date(clockIn).toISOString() : undefined,
        clockOut: clockOut ? new Date(clockOut).toISOString() : undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar el registro de asistencia');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = () => {
    if (typeof record.user === 'object') return record.user.name;
    return 'Usuario';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ajustar Registro — ${getUserName()} (${record.date})`}
      maxWidth="540px"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <SecondaryButton type="button" onClick={onClose} disabled={isLoading}>
            Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form={formId}
            loading={isLoading}
            disabled={isLoading}
          >
            Guardar Cambios <KbdBadge keys="Enter ↵" className="ml-1.5" />
          </PrimaryButton>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMsg && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-base-content/80 mb-1.5">
            Hora de Entrada (Clock In) *
          </label>
          <input
            type="datetime-local"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            className="input input-bordered input-sm w-full bg-base-100 border-base-300 text-base-content"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/80 mb-1.5">
            Hora de Salida (Clock Out)
          </label>
          <input
            type="datetime-local"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
            className="input input-bordered input-sm w-full bg-base-100 border-base-300 text-base-content"
          />
          <span className="text-[11px] text-base-content/60 block mt-1">
            Dejar en blanco si el usuario sigue en turno laboral.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/80 mb-1.5">
            Nota / Justificación del Ajuste Administrativo
          </label>
          <textarea
            rows={3}
            placeholder="Ej: Corrección manual de hora por falla de conexión..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="textarea textarea-bordered textarea-sm w-full bg-base-100 border-base-300 text-base-content resize-y"
          />
        </div>
      </form>
    </Modal>
  );
};

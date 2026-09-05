import React, { useState, useEffect } from 'react';
import {
  Icon,
  PrimaryButton,
  SecondaryButton,
  Box,
  Flex,
  Stack,
  Text,
  TextInput,
  Textarea,
  KbdBadge,
} from '@/app/presentation/components';
import { STATUS_LABELS, STATUS_STYLES } from '@/core/constants';
import type { AdminAppointment } from '@/app/domain';

export interface AppointmentDetailDrawerProps {
  appt: AdminAppointment | null;
  onClose: () => void;
  onApproveClick: (appt: AdminAppointment) => void;
  onRejectClick: (appt: AdminAppointment) => void;
  onRescheduleClick: (appt: AdminAppointment) => void;
  onCompleteClick: (appt: AdminAppointment) => void;
  onCheckInClick?: (
    appt: AdminAppointment,
    checkInData?: { serviceRequested?: string; laborCost?: number; receptionNotes?: string; notes?: string }
  ) => Promise<void> | void;
  onRescheduleApprovedClick: (appt: AdminAppointment) => void;
  onCancelClick: (appt: AdminAppointment) => void;
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

export const AppointmentDetailDrawer: React.FC<AppointmentDetailDrawerProps> = ({
  appt,
  onClose,
  onApproveClick,
  onRejectClick,
  onRescheduleClick,
  onCompleteClick,
  onCheckInClick,
  onRescheduleApprovedClick,
  onCancelClick,
}) => {
  const [laborCost, setLaborCost] = useState<number | ''>(0);
  const [receptionNotes, setReceptionNotes] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  useEffect(() => {
    if (appt) {
      setLaborCost(0);
      setReceptionNotes(appt.receptionNotes || '');
      setIsReceiving(false);
    }
  }, [appt]);

  useEffect(() => {
    if (!appt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appt, onClose]);

  if (!appt) return null;

  const statusStyle = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;

  return (
    <div
      className="print:contents fixed inset-0 bg-neutral-900/60 z-50 flex justify-end backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <aside
        className="print:hidden w-[420px] max-w-full h-full bg-base-100 border-l border-base-300 text-base-content shadow-2xl flex flex-col font-sans transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-base-300 bg-base-200/50 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-base-content m-0">
              Detalle de la Cita
            </h3>
            <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider">
              Información rápida
            </span>
          </div>
          <div className="flex items-center gap-2">
            <KbdBadge keys="Esc" className="opacity-70 text-[10px]" />
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-base-300/50 text-base-content/60 hover:text-base-content cursor-pointer transition-colors"
              title="Cerrar (Esc)"
            >
              <Icon name="X" size="md" />
            </button>
          </div>
        </div>

        {/* Sidebar Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {/* Client Profile Card */}
          <div className="bg-base-200/60 border border-base-300 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-base shrink-0">
                {appt.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-base-content m-0 truncate">
                  {appt.customerName}
                </h4>
                <span
                  style={statusStyle}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mt-1"
                >
                  {STATUS_LABELS[appt.status] || appt.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-base-300/50">
              <div>
                <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider block mb-0.5">
                  Vehículo
                </span>
                <span className="text-xs font-semibold text-base-content block truncate">
                  {appt.vehicle ? `${appt.vehicle.brand} ${appt.vehicle.model}` : 'Genérico'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider block mb-0.5">
                  Serie
                </span>
                <span className="text-xs font-mono font-semibold text-primary block">
                  {appt.vehicle?.serialNumberLastFour ? `***${appt.vehicle.serialNumberLastFour}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Details */}
          <div className="flex flex-col gap-4">
            {/* Phone */}
            {appt.customerPhone && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-primary shrink-0">
                  <Icon name="Phone" size="sm" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
                    Teléfono
                  </span>
                  <span className="text-sm font-semibold text-base-content font-mono">
                    {appt.customerPhone}
                  </span>
                </div>
              </div>
            )}

            {/* Email */}
            {appt.customerEmail && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-primary shrink-0">
                  <Icon name="Mail" size="sm" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
                    Correo
                  </span>
                  <span className="text-sm font-semibold text-base-content">
                    {appt.customerEmail}
                  </span>
                </div>
              </div>
            )}

            {/* Scheduled time */}
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-primary shrink-0">
                <Icon name="Clock" size="sm" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
                  Fecha y Hora
                </span>
                <span className="text-sm font-semibold text-base-content block">
                  {(() => {
                    const { date, time, period } = formatScheduledAt(appt.scheduledAt);
                    return `${date}, ${time} ${period}`;
                  })()}
                </span>
                {appt.duration && (
                  <span className="text-xs text-base-content/60 italic block mt-0.5">
                    Duración estimada: {appt.duration} min
                  </span>
                )}
              </div>
            </div>

            {/* Motivo de la Cita (notes) si fue capturado al agendar */}
            {appt.notes && (
              <div className="flex gap-3 items-start p-3 bg-base-200/40 border border-base-300 rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Icon name="FileText" size="xs" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider block">
                    Motivo / Notas de la Cita
                  </span>
                  <p className="text-xs italic text-base-content/80 m-0 leading-relaxed mt-0.5">
                    "{appt.notes}"
                  </p>
                </div>
              </div>
            )}

            {/* If appointment is approved, show the Reception / Check-in Form section */}
            {appt.status === 'approved' ? (
              <Box className="border-t border-base-300 pt-5">
                <Flex align="center" gap="xs" className="mb-3">
                  <Icon name="Wrench" size="xs" className="text-primary" />
                  <Text size="xs" weight="bold" className="uppercase tracking-wider text-base-content">
                    Recepción Física del Vehículo (Check In)
                  </Text>
                </Flex>

                <Stack gap="md">
                  {/* Servicio Solicitado (Read-only) */}
                  <Box>
                    <Text size="xs" weight="semibold" className="text-base-content/70 mb-1.5 block">
                      Servicio Solicitado
                    </Text>
                    <div className="flex gap-3 items-center p-3 bg-base-200/60 border border-base-300 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Icon name="Wrench" size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold text-base-content block truncate">
                          {appt.serviceRequested || 'Mantenimiento General'}
                        </span>
                        <span className="text-[11px] text-base-content/50 block">
                          Servicio seleccionado al agendar la cita
                        </span>
                      </div>
                    </div>
                  </Box>

                  <Box>
                    <Text size="xs" weight="semibold" className="text-base-content/70 mb-1.5 block">
                      Mano de Obra Estimada ($ MXN)
                    </Text>
                    <TextInput
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0.00"
                      type="number"
                      size="sm"
                      className="w-full text-sm"
                    />
                  </Box>

                  <Box>
                    <Text size="xs" weight="semibold" className="text-base-content/70 mb-1.5 block">
                      Notas de Recepción / Inventario Físico
                    </Text>
                    <Textarea
                      value={receptionNotes}
                      onChange={(e) => setReceptionNotes(e.target.value)}
                      placeholder="Ej. Deja llaves, 1/2 tanque de gasolina, gato hidráulico, rayón leve en puerta..."
                      rows={2}
                      className="w-full text-sm"
                    />
                    <span className="text-[11px] text-base-content/50 mt-1 block">
                      Registra pertenencias, inventario y estado físico del vehículo al recibirlo en taller.
                    </span>
                  </Box>
                </Stack>
              </Box>
            ) : (
              <>
                {/* Service Requested */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-primary shrink-0">
                    <Icon name="Wrench" size="sm" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
                      Servicio Solicitado
                    </span>
                    <span className="text-sm font-bold text-base-content">
                      {appt.serviceRequested}
                    </span>
                  </div>
                </div>

                {/* Reception Notes if available */}
                {appt.receptionNotes && (
                  <div className="flex gap-3 items-start p-3 bg-base-200/40 border border-base-300 rounded-lg">
                    <div className="w-7 h-7 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-secondary shrink-0 mt-0.5">
                      <Icon name="Key" size="xs" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider block">
                        Notas de Recepción (Inventario / Gasolina / Llaves)
                      </span>
                      <p className="text-xs italic text-base-content/80 m-0 leading-relaxed mt-0.5">
                        "{appt.receptionNotes}"
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>


        {/* Sidebar Footer Actions */}
        <div className="p-5 border-t border-base-300 bg-base-200/50 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-sm btn-outline border-base-300 text-base-content hover:bg-base-200 w-full mb-2 gap-2"
          >
            <Icon name="Printer" size="sm" />
            Imprimir Comprobante
          </button>

          {(appt.status === 'pending' || appt.status === 'rescheduled') && (
            <>
              <PrimaryButton
                onClick={() => {
                  onClose();
                  onApproveClick(appt);
                }}
                className="w-full py-2"
              >
                Aprobar Cita
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  onClose();
                  onRescheduleClick(appt);
                }}
                className="w-full py-2"
              >
                Proponer Reagendación
              </SecondaryButton>
              <SecondaryButton
                onClick={() => {
                  onClose();
                  onRejectClick(appt);
                }}
                className="w-full py-2 text-error hover:bg-error/10 border-transparent hover:border-error/20"
              >
                Rechazar Cita
              </SecondaryButton>
            </>
          )}

          {appt.status === 'approved' && (
            <>
              <PrimaryButton
                disabled={isReceiving}
                onClick={async () => {
                  setIsReceiving(true);
                  try {
                    if (onCheckInClick) {
                      await onCheckInClick(appt, {
                        serviceRequested: appt.serviceRequested,
                        laborCost: Number(laborCost) || 0,
                        receptionNotes: receptionNotes.trim(),
                        notes: appt.notes,
                      });
                    } else {
                      onCompleteClick(appt);
                    }
                    onClose();
                  } finally {
                    setIsReceiving(false);
                  }
                }}
                className="w-full py-2"
              >
                {isReceiving ? (
                  <Flex align="center" justify="center" gap="xs">
                    <Icon name="RefreshCw" size="xs" className="animate-spin" />
                    <span className="text-sm font-bold">Recibiendo vehículo...</span>
                  </Flex>
                ) : (
                  <Flex align="center" justify="center" gap="xs">
                    <Icon name="Wrench" size="xs" />
                    <span className="text-sm font-bold">Recibir Vehículo (Check In)</span>
                  </Flex>
                )}
              </PrimaryButton>
              <SecondaryButton
                disabled={isReceiving}
                onClick={() => {
                  onClose();
                  onRescheduleApprovedClick(appt);
                }}
                className="w-full py-2"
              >
                Reagendar Cita
              </SecondaryButton>
              <SecondaryButton
                disabled={isReceiving}
                onClick={() => {
                  onClose();
                  onCancelClick(appt);
                }}
                className="w-full py-2 text-error hover:bg-error/10 border-transparent hover:border-error/20"
              >
                Cancelar Cita
              </SecondaryButton>
            </>
          )}

          {(appt.status === 'completed' || appt.status === 'rejected' || appt.status === 'cancelled') && (
            <div className="uppercase text-[11px] font-bold tracking-wider text-base-content/50 text-center py-2">
              Esta cita está finalizada ({STATUS_LABELS[appt.status] || appt.status})
            </div>
          )}
        </div>
      </aside>

      {/* Print Layout for Appointment Voucher */}
      <div className="printable-document hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-sans min-h-screen">
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold">FERVENTA - AUTOPARTES Y TALLER</h1>
          <p className="text-gray-600">Comprobante de Cita</p>
          <p className="text-sm text-gray-500 mt-2">Folio: {appt.id.slice(-6).toUpperCase()}</p>
          {appt.branchName && <p className="text-sm text-gray-500 font-medium">Sucursal: {appt.branchName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold border-b pb-2 mb-2">Datos del Cliente</h3>
            <p><strong>Nombre:</strong> {appt.customerName}</p>
            {appt.customerPhone && <p><strong>Teléfono:</strong> {appt.customerPhone}</p>}
            {appt.customerEmail && <p><strong>Email:</strong> {appt.customerEmail}</p>}
          </div>
          <div>
            <h3 className="font-bold border-b pb-2 mb-2">Datos del Vehículo</h3>
            {appt.vehicle ? (
              <>
                <p><strong>Marca:</strong> {appt.vehicle.brand}</p>
                <p><strong>Modelo:</strong> {appt.vehicle.model}</p>
                <p><strong>Año:</strong> {appt.vehicle.year}</p>
                <p><strong>Serie (últimos 4):</strong> ***{appt.vehicle.serialNumberLastFour}</p>
              </>
            ) : (
              <p>Vehículo genérico / No especificado</p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-bold border-b pb-2 mb-2">Detalles de la Cita</h3>
          <p><strong>Fecha programada:</strong> {formatScheduledAt(appt.scheduledAt).date} a las {formatScheduledAt(appt.scheduledAt).time} {formatScheduledAt(appt.scheduledAt).period}</p>
          <p><strong>Estado de la cita:</strong> {STATUS_LABELS[appt.status] || appt.status}</p>
          <p><strong>Motivo/Servicio:</strong> {appt.serviceRequested}</p>
          <p><strong>Notas:</strong> {appt.notes || 'Ninguna'}</p>
        </div>

        <div className="mt-16 text-center text-gray-500 text-sm border-t pt-4">
          <p>Este documento es un comprobante informativo de su cita.</p>
          <p>Para dudas o reagendaciones, por favor contáctenos.</p>
        </div>
      </div>
    </div>
  );
};

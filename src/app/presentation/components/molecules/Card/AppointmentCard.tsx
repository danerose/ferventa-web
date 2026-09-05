import React from 'react';
import { Icon, PrimaryButton, SecondaryButton } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';
import { formatScheduledAt } from '@/core/utils/formatters/formatScheduledAt';

import { STATUS_LABELS, STATUS_STYLES, STATUS_ACCENT } from '@/core/constants';

export interface AppointmentCardProps {
  appt: AdminAppointment;
  onApproveClick: (appt: AdminAppointment) => void;
  onRejectClick: (appt: AdminAppointment) => void;
  onRescheduleClick: (appt: AdminAppointment) => void;
  onCancelClick?: (appt: AdminAppointment) => void;
  onRescheduleApprovedClick?: (appt: AdminAppointment) => void;
  onCompleteClick?: (appt: AdminAppointment) => void;
  onCheckInClick?: (appt: AdminAppointment) => void;
  onCardClick?: (appt: AdminAppointment) => void;
  updating: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appt,
  onApproveClick,
  onRejectClick,
  onRescheduleClick,
  onCancelClick,
  onRescheduleApprovedClick,
  onCompleteClick,
  onCheckInClick,
  onCardClick,
  updating,
}) => {
  const { date, time, period, dayName } = formatScheduledAt(appt.scheduledAt);
  const accent = STATUS_ACCENT[appt.status] || '#cbd5e1';
  const statusStyle = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;

  return (
    <div
      onClick={() => onCardClick?.(appt)}
      className={`bg-base-100 border border-base-300 rounded-xl p-5 pl-6 flex gap-5 relative overflow-hidden transition-all duration-150 ${
        onCardClick ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : 'cursor-default'
      } ${updating ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ background: accent }}
      />

      {/* Date/Time column */}
      <div className="w-20 shrink-0 flex flex-col items-center justify-center border-r border-base-200 pr-5 gap-1 text-center">
        <span className="text-[11px] font-bold tracking-wider uppercase text-base-content/60">
          {dayName}
        </span>
        <span className="text-[11px] font-bold tracking-wider uppercase text-base-content/60">
          {date}
        </span>
        <span className="text-2xl font-bold text-base-content leading-tight tracking-tight">
          {time}
        </span>
        <span className="text-[11px] font-mono text-base-content/50 font-medium">
          {period}
        </span>
      </div>

      {/* Center: Main info */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5 justify-center">
        {/* Customer name + status */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-base-content">
                {appt.customerName}
              </span>
              <span
                style={statusStyle}
                className="text-[10.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md"
              >
                {STATUS_LABELS[appt.status] || appt.status}
              </span>
            </div>
            {appt.customerPhone && (
              <p className="text-xs text-base-content/60 mt-1 flex items-center gap-1">
                <Icon name="Phone" size="xs" className="shrink-0" />
                {appt.customerPhone}
              </p>
            )}
          </div>

          {/* Vehicle */}
          {appt.vehicle && (
            <div className="bg-base-200 border border-base-300 rounded-lg px-3 py-1.5 flex items-center gap-2 shrink-0">
              <Icon name="Car" size="xs" className="text-base-content/60 shrink-0" />
              <span className="text-xs font-semibold text-base-content whitespace-nowrap">
                {[appt.vehicle.brand, appt.vehicle.model, appt.vehicle.year].filter(Boolean).join(' ')}
              </span>
              <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                {"***" + appt.vehicle.serialNumberLastFour}
              </span>
            </div>
          )}
        </div>

        {/* Service requested & Branch name */}
        <div className="flex gap-2 flex-wrap">
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
            <Icon name="Wrench" size="xs" className="text-primary shrink-0" />
            <span className="text-xs font-bold text-primary">
              {appt.serviceRequested}
            </span>
          </div>

          {appt.branchName && (
            <div className="bg-success/10 border border-success/20 rounded-lg px-3 py-1.5 inline-flex items-center gap-2">
              <Icon name="MapPin" size="xs" className="text-success shrink-0" />
              <span className="text-xs font-bold text-success">
                {appt.branchName}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {appt.notes && (
          <div className="bg-base-200/60 border border-base-300/80 rounded-lg p-2 px-3">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-base-content/50 mb-0.5 flex items-center gap-1">
              <Icon name="FileText" size="xs" />
              Notas
            </p>
            <p className="text-xs italic text-base-content/80 leading-relaxed">
              "{appt.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      {(appt.status === 'pending' || appt.status === 'rescheduled') && (
        <div className="w-52 shrink-0 flex flex-col gap-2 justify-center">
          {/* Approve button */}
          <PrimaryButton
            size="sm"
            color="primary"
            disabled={updating}
            onClick={(e) => { e.stopPropagation(); onApproveClick(appt); }}
            className="w-full text-xs font-semibold"
          >
            <Icon name="CheckCircle" size="xs" className="mr-1.5" />
            Aprobar Cita
          </PrimaryButton>

          {/* 2-column grid for Reschedule and Reject */}
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton
              size="xs"
              disabled={updating}
              onClick={(e) => { e.stopPropagation(); onRescheduleClick(appt); }}
              className="w-full text-[11px] font-semibold"
            >
              <Icon name="Calendar" size="xs" className="mr-1" />
              Reagendar
            </SecondaryButton>
            <SecondaryButton
              size="xs"
              color="error"
              disabled={updating}
              onClick={(e) => { e.stopPropagation(); onRejectClick(appt); }}
              className="w-full text-[11px] font-semibold"
            >
              <Icon name="XCircle" size="xs" className="mr-1" />
              Rechazar
            </SecondaryButton>
          </div>
        </div>
      )}

      {appt.status === 'approved' && (
        <div className="w-48 shrink-0 flex flex-col gap-2 justify-center">
          {/* Recibir Auto (Check-in) button */}
          <PrimaryButton
            size="sm"
            color="success"
            disabled={updating}
            onClick={(e) => {
              e.stopPropagation();
              if (onCheckInClick) {
                onCheckInClick(appt);
              } else {
                onCompleteClick?.(appt);
              }
            }}
            className="w-full text-xs font-bold"
          >
            <Icon name="Wrench" size="xs" className="mr-1.5" />
            Recibir Auto (Check-in)
          </PrimaryButton>

          {/* Reagendar button */}
          <SecondaryButton
            size="sm"
            disabled={updating}
            onClick={(e) => { e.stopPropagation(); onRescheduleApprovedClick?.(appt); }}
            className="w-full text-xs font-medium"
          >
            <Icon name="Calendar" size="xs" className="mr-1.5" />
            Reagendar
          </SecondaryButton>

          {/* Cancelar button */}
          <SecondaryButton
            size="sm"
            color="error"
            disabled={updating}
            onClick={(e) => { e.stopPropagation(); onCancelClick?.(appt); }}
            className="w-full text-xs font-medium"
          >
            <Icon name="XCircle" size="xs" className="mr-1.5" />
            Cancelar
          </SecondaryButton>
        </div>
      )}
    </div>
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-base-100 border border-base-300 rounded-xl p-5 flex gap-5 overflow-hidden animate-pulse">
    <div className="w-20 shrink-0 flex flex-col items-center justify-center border-r border-base-200 pr-5 gap-2">
      <div className="h-3 bg-base-300 rounded w-10" />
      <div className="h-3 bg-base-300 rounded w-12" />
      <div className="h-7 bg-base-300 rounded w-14" />
      <div className="h-3 bg-base-300 rounded w-8" />
    </div>
    <div className="flex-1 flex flex-col gap-3 justify-center">
      <div className="h-5 bg-base-300 rounded w-48" />
      <div className="h-3 bg-base-300 rounded w-32" />
      <div className="flex gap-2">
        <div className="h-6 bg-base-300 rounded w-36" />
        <div className="h-6 bg-base-300 rounded w-28" />
      </div>
    </div>
  </div>
);

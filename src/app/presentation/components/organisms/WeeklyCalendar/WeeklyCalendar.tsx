import React, { useMemo, useCallback } from 'react';
import { Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';

export interface WeeklyCalendarProps {
  timelineAppointments: AdminAppointment[];
  timelineLoading: boolean;
  currentWeekRefDate: Date;
  onWeekRefDateChange: (updater: Date | ((prev: Date) => Date)) => void;
  onAppointmentClick: (appt: AdminAppointment) => void;
  branchFilter: string;
  searchValue: string;
}

const TIMELINE_HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

const STATUS_STYLES: Record<string, { className: string; accent: string }> = {
  pending: {
    className: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
    accent: '#f59e0b',
  },
  approved: {
    className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    accent: '#10b981',
  },
  rejected: {
    className: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
    accent: '#f43f5e',
  },
  cancelled: {
    className: 'bg-slate-500/15 border-slate-500/30 text-slate-600 dark:text-slate-400',
    accent: '#64748b',
  },
  completed: {
    className: 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400',
    accent: '#3b82f6',
  },
  rescheduled: {
    className: 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400',
    accent: '#a855f7',
  },
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  timelineAppointments,
  timelineLoading,
  currentWeekRefDate,
  onWeekRefDateChange,
  onAppointmentClick,
  branchFilter,
  searchValue,
}) => {
  const getUTCMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mondayLocal = new Date(date.setDate(diff));
    return new Date(Date.UTC(mondayLocal.getFullYear(), mondayLocal.getMonth(), mondayLocal.getDate()));
  };

  const monday = useMemo(() => getUTCMonday(currentWeekRefDate), [currentWeekRefDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const day = new Date(monday);
      day.setUTCDate(monday.getUTCDate() + i);
      days.push(day);
    }
    return days;
  }, [monday]);

  const formatWeekRange = useCallback((mon: Date) => {
    const saturday = new Date(mon);
    saturday.setUTCDate(mon.getUTCDate() + 5);

    const optionsShort: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
    const optionsYear: Intl.DateTimeFormatOptions = { year: 'numeric', timeZone: 'UTC' };

    const startStr = mon.toLocaleDateString('es-MX', optionsShort);
    const endStr = saturday.toLocaleDateString('es-MX', optionsShort);
    const yearStr = saturday.toLocaleDateString('es-MX', optionsYear);

    return `${startStr} - ${endStr}, ${yearStr}`;
  }, []);

  interface PositionedAppointment {
    appt: AdminAppointment;
    top: number;
    height: number;
    left: string;
    width: string;
  }

  const visibleTimelineAppointments = useMemo(() => {
    let filtered = timelineAppointments;

    if (branchFilter !== 'all') {
      filtered = filtered.filter((a) => a.branchName === branchFilter);
    }

    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.customerName.toLowerCase().includes(q) ||
          (a.customerPhone && a.customerPhone.includes(q)) ||
          (a.vehicle &&
            (a.vehicle.brand.toLowerCase().includes(q) ||
              a.vehicle.model.toLowerCase().includes(q) ||
              a.vehicle.serialNumberLastFour.toLowerCase().includes(q)))
      );
    }

    return filtered;
  }, [timelineAppointments, branchFilter, searchValue]);

  // Map appointments onto weekly columns with collision handling
  const positionedAppointments = useMemo(() => {
    const result: PositionedAppointment[] = [];
    const pixelsPerHour = 80;
    const startHour = 8;
    const endHour = 18; // 6 PM
    const totalHours = endHour - startHour;

    weekDays.forEach((day, dayIndex) => {
      const dayUTCStr = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(
        day.getUTCDate()
      ).padStart(2, '0')}`;

      // Appointments for this UTC day
      const dayAppts = visibleTimelineAppointments.filter((a) => {
        const aDate = new Date(a.scheduledAt);
        const aUTCStr = `${aDate.getUTCFullYear()}-${String(aDate.getUTCMonth() + 1).padStart(2, '0')}-${String(
          aDate.getUTCDate()
        ).padStart(2, '0')}`;
        return aUTCStr === dayUTCStr;
      });

      // Sort by start time
      dayAppts.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      // Collision grouping algorithm
      const clusters: { appt: AdminAppointment; startMin: number; endMin: number }[][] = [];

      dayAppts.forEach((appt) => {
        const aDate = new Date(appt.scheduledAt);
        const apptHour = aDate.getUTCHours();
        const apptMin = aDate.getUTCMinutes();
        const startMin = (apptHour - startHour) * 60 + apptMin;
        const duration = appt.duration || 60;
        const endMin = startMin + duration;

        // Skip if entirely outside [8am, 6pm]
        if (endMin <= 0 || startMin >= totalHours * 60) return;

        let placedInCluster = false;
        for (const cluster of clusters) {
          const hasOverlap = cluster.some((c) => startMin < c.endMin && endMin > c.startMin);
          if (hasOverlap) {
            cluster.push({ appt, startMin, endMin });
            placedInCluster = true;
            break;
          }
        }

        if (!placedInCluster) {
          clusters.push([{ appt, startMin, endMin }]);
        }
      });

      // Position each item in clusters
      clusters.forEach((cluster) => {
        const columns: { appt: AdminAppointment; startMin: number; endMin: number }[][] = [];

        cluster.forEach((item) => {
          let placedInCol = false;
          for (let colIdx = 0; colIdx < columns.length; colIdx++) {
            const lastInCol = columns[colIdx][columns[colIdx].length - 1];
            if (item.startMin >= lastInCol.endMin) {
              columns[colIdx].push(item);
              placedInCol = true;
              break;
            }
          }
          if (!placedInCol) {
            columns.push([item]);
          }
        });

        const totalCols = columns.length;
        const colWidthPct = 100 / totalCols;

        // Base column coordinates: 80px label + (dayIndex * 1fr of remaining width)
        const dayColLeftOffset = `calc(80px + ${dayIndex} * ((100% - 80px) / 6))`;
        const dayColWidth = `calc((100% - 80px) / 6)`;

        columns.forEach((colItems, colIdx) => {
          colItems.forEach((c) => {
            const clampedStart = Math.max(0, c.startMin);
            const clampedEnd = Math.min(totalHours * 60, c.endMin);
            const topPx = (clampedStart / 60) * pixelsPerHour + 64; // +64px for header
            const heightPx = Math.max(30, ((clampedEnd - clampedStart) / 60) * pixelsPerHour);

            const left = `calc(${dayColLeftOffset} + (${dayColWidth} * ${colIdx / totalCols}))`;
            const width = `calc(${dayColWidth} * ${colWidthPct / 100} - 4px)`;

            result.push({
              appt: c.appt,
              top: topPx,
              height: heightPx,
              left,
              width,
            });
          });
        });
      });
    });

    return result;
  }, [visibleTimelineAppointments, weekDays]);

  const handlePrevWeek = useCallback(() => {
    onWeekRefDateChange((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  }, [onWeekRefDateChange]);

  const handleNextWeek = useCallback(() => {
    onWeekRefDateChange((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  }, [onWeekRefDateChange]);

  const handleTodayWeek = useCallback(() => {
    onWeekRefDateChange(new Date());
  }, [onWeekRefDateChange]);

  return (
    <div className="flex flex-col bg-base-100 border border-base-300 rounded-xl shadow-xs overflow-hidden">
      {/* Navigation Toolbar */}
      <div className="px-5 py-3.5 border-b border-base-300 flex items-center gap-3 bg-base-200/50">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevWeek}
            aria-label="Semana anterior"
            className="btn btn-sm btn-ghost border border-base-300 bg-base-100 hover:bg-base-200 text-base-content p-2"
          >
            <Icon name="ChevronLeft" size="sm" />
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            aria-label="Semana siguiente"
            className="btn btn-sm btn-ghost border border-base-300 bg-base-100 hover:bg-base-200 text-base-content p-2"
          >
            <Icon name="ChevronRight" size="sm" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleTodayWeek}
          className="btn btn-sm btn-ghost border border-base-300 bg-base-100 hover:bg-base-200 text-base-content font-bold px-3.5"
        >
          Hoy
        </button>

        <div className="text-sm font-bold text-base-content ml-2">
          {formatWeekRange(monday)}
        </div>
      </div>

      {/* Scroll Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[620px] relative">
        <div
          className="min-w-[950px] relative grid bg-base-100"
          style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}
        >
          {/* Sticky Header Spacer */}
          <div className="sticky top-0 left-0 z-30 bg-base-200 border-b border-r border-base-300 h-16" />

          {/* Day Headers */}
          {weekDays.map((day, index) => {
            const today = new Date();
            const todayUTCStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
              today.getDate()
            ).padStart(2, '0')}`;
            const dayUTCStr = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(
              day.getUTCDate()
            ).padStart(2, '0')}`;
            const isToday = dayUTCStr === todayUTCStr;

            const dayName = day
              .toLocaleDateString('es-MX', { weekday: 'short', timeZone: 'UTC' })
              .toUpperCase()
              .replace('.', '');
            const dayNum = day.getUTCDate();

            return (
              <div
                key={index}
                className={`sticky top-0 z-20 h-16 border-b border-r border-base-300 flex flex-col items-center justify-center transition-colors ${
                  isToday ? 'bg-primary/10' : 'bg-base-200/70'
                }`}
              >
                <span
                  className={`text-[11px] font-bold tracking-wider ${
                    isToday ? 'text-primary' : 'text-base-content/60'
                  }`}
                >
                  {dayName}
                </span>
                <span
                  className={`text-xl font-black leading-tight ${
                    isToday ? 'text-primary' : 'text-base-content'
                  }`}
                >
                  {dayNum}
                </span>
              </div>
            );
          })}

          {/* Hour Rows */}
          {TIMELINE_HOURS.map((hour, hourIndex) => {
            return (
              <React.Fragment key={hourIndex}>
                {/* Time label column */}
                <div className="flex items-start justify-end pr-3 pt-2 text-[11px] font-bold text-base-content/60 border-r border-b border-base-300 bg-base-100 sticky left-0 z-10 h-20">
                  {hour}
                </div>
                {/* Days Grid Cells */}
                {weekDays.map((day, dayIndex) => {
                  const today = new Date();
                  const todayUTCStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
                    today.getDate()
                  ).padStart(2, '0')}`;
                  const dayUTCStr = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(
                    day.getUTCDate()
                  ).padStart(2, '0')}`;
                  const isToday = dayUTCStr === todayUTCStr;

                  return (
                    <div
                      key={dayIndex}
                      className={`border-b border-r border-base-300/60 h-20 transition-colors ${
                        isToday ? 'bg-primary/[0.03]' : ''
                      }`}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Absolute Positioned Appointment Cards */}
          {timelineLoading ? (
            <div className="absolute inset-0 bg-base-100/70 backdrop-blur-xs z-25 flex items-center justify-center text-sm font-semibold text-base-content">
              Cargando citas del calendario...
            </div>
          ) : positionedAppointments.length === 0 ? null : (
            positionedAppointments.map(({ appt, top, height, left, width }) => {
              const statusStyle = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;

              // Calculate Time Range string
              const apptDate = new Date(appt.scheduledAt);
              const startH = apptDate.getUTCHours();
              const startM = String(apptDate.getUTCMinutes()).padStart(2, '0');
              const duration = appt.duration || 60;
              const endD = new Date(apptDate.getTime() + duration * 60 * 1000);
              const endH = endD.getUTCHours();
              const endM = String(endD.getUTCMinutes()).padStart(2, '0');

              const timeRangeStr = `${String(startH).padStart(2, '0')}:${startM} - ${String(endH).padStart(2, '0')}:${endM}`;

              return (
                <div
                  key={appt.id}
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    left: left,
                    width: width,
                    height: `${height}px`,
                    padding: '2px',
                    zIndex: 10,
                  }}
                >
                  <div
                    onClick={() => onAppointmentClick(appt)}
                    className={`w-full h-full rounded-lg px-2 py-1 flex items-center cursor-pointer select-none transition-transform hover:scale-[0.985] shadow-xs overflow-hidden border ${statusStyle.className}`}
                    style={{ borderLeftWidth: '4px', borderLeftColor: statusStyle.accent }}
                  >
                    <div className="flex items-center gap-1.5 w-full min-w-0">
                      <span className="text-[10px] font-bold opacity-80 shrink-0 font-mono">
                        {timeRangeStr}
                      </span>
                      <span className="text-[11px] font-bold truncate">
                        {appt.customerName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

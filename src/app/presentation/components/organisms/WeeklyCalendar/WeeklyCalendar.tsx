import React, { useMemo, useCallback } from 'react';
import { Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

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

const STATUS_ACCENT: Record<string, string> = {
  pending: '#fbbf24',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#94a3b8',
  completed: '#3b82f6',
  rescheduled: '#8b5cf6',
};

const STATUS_STYLES: Record<string, { background: string; color: string; border: string }> = {
  pending: { background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' },
  approved: { background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' },
  rejected: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' },
  cancelled: { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
  completed: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
  rescheduled: { background: '#f5f3ff', color: '#5b21b6', border: '1px solid #8b5cf630' },
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

  const formatWeekRange = useCallback((monday: Date) => {
    const saturday = new Date(monday);
    saturday.setUTCDate(monday.getUTCDate() + 5);

    const optionsShort: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
    const optionsYear: Intl.DateTimeFormatOptions = { year: 'numeric', timeZone: 'UTC' };

    const startStr = monday.toLocaleDateString('es-MX', optionsShort);
    const endStr = saturday.toLocaleDateString('es-MX', optionsShort);
    const yearStr = saturday.toLocaleDateString('es-MX', optionsYear);

    return `${startStr} - ${endStr}, ${yearStr}`;
  }, []);

  const getAppointmentPosition = useCallback((appt: AdminAppointment, monday: Date) => {
    try {
      const apptDate = new Date(appt.scheduledAt);
      if (isNaN(apptDate.getTime())) return null;

      const apptDay = apptDate.getUTCDay();
      if (apptDay === 0) return null; // Skip Sunday
      const dayIndex = apptDay - 1; // 0 for Monday, 5 for Saturday

      const apptTime = Date.UTC(apptDate.getUTCFullYear(), apptDate.getUTCMonth(), apptDate.getUTCDate());
      const mondayTime = Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
      const diffDays = Math.round((apptTime - mondayTime) / (24 * 60 * 60 * 1000));

      if (diffDays < 0 || diffDays > 5) {
        return null;
      }

      const hours = apptDate.getUTCHours();
      const minutes = apptDate.getUTCMinutes();

      const startMinutes = 8 * 60; // 8:00 AM
      const currentMinutes = hours * 60 + minutes;
      const diffMinutes = currentMinutes - startMinutes;

      const top = 64 + (diffMinutes / 60) * 80;

      const duration = appt.duration || 60;
      const height = (duration / 60) * 80;

      const left = `calc(80px + ${dayIndex} * (100% - 80px) / 6)`;
      const width = `calc((100% - 80px) / 6)`;

      return { top, height, left, width };
    } catch (e) {
      return null;
    }
  }, []);

  const handlePrevWeek = useCallback(() => {
    onWeekRefDateChange((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, [onWeekRefDateChange]);

  const handleNextWeek = useCallback(() => {
    onWeekRefDateChange((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, [onWeekRefDateChange]);

  const handleTodayWeek = useCallback(() => {
    onWeekRefDateChange(new Date());
  }, [onWeekRefDateChange]);

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
              a.vehicle.serialNumberLastFour.includes(q)))
      );
    }

    return filtered;
  }, [timelineAppointments, branchFilter, searchValue]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(9, 20, 38, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Navigation Toolbar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handlePrevWeek}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: 'white',
              cursor: 'pointer',
              color: '#091426',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <Icon name="ChevronLeft" size="sm" />
          </button>
          <button
            onClick={handleNextWeek}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: 'white',
              cursor: 'pointer',
              color: '#091426',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <Icon name="ChevronRight" size="sm" />
          </button>
        </div>

        <button
          onClick={handleTodayWeek}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            color: '#091426',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          Hoy
        </button>

        <div
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: '#091426',
            marginLeft: '8px',
          }}
        >
          {formatWeekRange(monday)}
        </div>
      </div>

      {/* Scroll Container */}
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '620px',
          position: 'relative',
        }}
      >
        <div
          style={{
            minWidth: '950px',
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '80px repeat(6, 1fr)',
            background: 'white',
          }}
        >
          {/* Sticky Header Spacer */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              left: 0,
              zIndex: 30,
              background: '#f1f5f9',
              borderBottom: '1px solid #cbd5e1',
              borderRight: '1px solid #cbd5e1',
              height: '64px',
            }}
          />

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
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 20,
                  background: isToday ? '#eff6ff' : '#f1f5f9',
                  borderBottom: '1px solid #cbd5e1',
                  borderRight: '1px solid #cbd5e1',
                  height: '64px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isToday ? '#1d4ed8' : '#64748b',
                    letterSpacing: '0.05em',
                  }}
                >
                  {dayName}
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: isToday ? '#1d4ed8' : '#091426',
                    lineHeight: '1.2',
                  }}
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'end',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    borderRight: '1px solid #cbd5e1',
                    borderBottom: '1px solid rgba(226,232,240,0.5)',
                    background: 'white',
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    height: '80px',
                  }}
                >
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
                      style={{
                        borderBottom: '1px solid rgba(226,232,240,0.4)',
                        borderRight: '1px solid rgba(226,232,240,0.4)',
                        height: '80px',
                        background: isToday ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                      }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Absolute Positioned Appointment Cards */}
          {timelineLoading ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.75)',
                zIndex: 25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#091426',
              }}
            >
              Cargando citas del calendario...
            </div>
          ) : visibleTimelineAppointments.length === 0 ? null : (
            visibleTimelineAppointments.map((appt) => {
              const pos = getAppointmentPosition(appt, monday);
              if (!pos) return null;

              const accent = STATUS_ACCENT[appt.status] || '#cbd5e1';
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

              // Render inline single-row format
              return (
                <div
                  key={appt.id}
                  style={{
                    position: 'absolute',
                    top: `${pos.top}px`,
                    left: pos.left,
                    width: pos.width,
                    height: `${pos.height}px`,
                    padding: '2px',
                    zIndex: 10,
                  }}
                >
                  <div
                    onClick={() => onAppointmentClick(appt)}
                    style={{
                      width: '100%',
                      height: '100%',
                      background: statusStyle.background,
                      color: statusStyle.color,
                      border: `1px solid ${accent}30`,
                      borderLeft: `4px solid ${accent}`,
                      borderRadius: '8px',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(9, 20, 38, 0.05)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      overflow: 'hidden',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.985)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 10px rgba(9, 20, 38, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'none';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 5px rgba(9, 20, 38, 0.05)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.85, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {timeRangeStr}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
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

import React, { useState, useMemo, useEffect } from 'react';
import type { OccupiedSlots } from '@/app/domain';
import { Box, Flex, Grid, Stack, Icon, PrimaryButton, SecondaryButton } from '@/app/presentation/components';

interface DateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onChangeDate: (date: string) => void;
  onChangeTime: (time: string) => void;
  occupiedSlots: OccupiedSlots | null;
  occupiedSlotsLoading: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Fast helpers defined outside component
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (min: number) => {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const format12h = (t: string) => {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${mStr}${ampm}`;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  selectedTime,
  onChangeDate,
  onChangeTime,
  occupiedSlots,
  occupiedSlotsLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Local ephemeral state while modal is open for zero-latency interactions
  const [localDate, setLocalDate] = useState(selectedDate);
  const [localTime, setLocalTime] = useState(selectedTime);

  // Navigation month & year states
  const todayDateObj = new Date();
  const [currentMonth, setCurrentMonth] = useState(todayDateObj.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDateObj.getFullYear());

  // Synchronize local state when modal opens or selectedDate/Time changes externally
  useEffect(() => {
    if (isOpen) {
      setLocalDate(selectedDate);
      setLocalTime(selectedTime);
      if (selectedDate) {
        const parts = selectedDate.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(y) && !isNaN(m)) {
            setCurrentYear(y);
            setCurrentMonth(m);
          }
        }
      }
    }
  }, [isOpen, selectedDate, selectedTime]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Prevent going back to past months
  const isPrevMonthDisabled = useMemo(() => {
    const todayVal = new Date();
    return (
      currentYear < todayVal.getFullYear() ||
      (currentYear === todayVal.getFullYear() && currentMonth <= todayVal.getMonth())
    );
  }, [currentMonth, currentYear]);

  // Generate calendar grid days for current month/year view
  const calendarDays = useMemo(() => {
    const year = currentYear;
    const month = currentMonth;

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Monday start mapping: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const result = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Padding from previous month
    for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevDateObj = new Date(year, month - 1, dayNum);
      const yyyy = prevDateObj.getFullYear();
      const mm = String(prevDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(prevDateObj.getDate()).padStart(2, '0');
      result.push({
        dayNumber: dayNum,
        dateString: `${yyyy}-${mm}-${dd}`,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      dateObj.setHours(0, 0, 0, 0);
      
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      let isDisabled = false;
      let reason = '';

      if (dateObj.getTime() < todayStart.getTime()) {
        isDisabled = true;
        reason = 'Pasado';
      }

      if (occupiedSlots && !isDisabled) {
        // Holiday Check
        const holiday = occupiedSlots.holidays.find((h) => h.date === dateString);
        if (holiday) {
          isDisabled = true;
          reason = `Festivo: ${holiday.description}`;
        }

        // Non working day check
        const dayOfWeek = dateObj.getDay();
        const isNonWorking = occupiedSlots.nonWorkingDaysOfWeek.includes(dayOfWeek);
        if (isNonWorking) {
          isDisabled = true;
          reason = 'Cerrado';
        }

        // Schedule check
        const schedule = occupiedSlots.workingHours.find((w) => w.dayOfWeek === dayOfWeek);
        if (schedule && !schedule.isWorking) {
          isDisabled = true;
          reason = 'Cerrado';
        }
      }

      result.push({
        dayNumber: d,
        dateString,
        isCurrentMonth: true,
        isDisabled,
        reason,
      });
    }

    // Padding next month leading days
    const remainingCells = 42 - result.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDateObj = new Date(year, month + 1, i);
      const yyyy = nextDateObj.getFullYear();
      const mm = String(nextDateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDateObj.getDate()).padStart(2, '0');
      result.push({
        dayNumber: i,
        dateString: `${yyyy}-${mm}-${dd}`,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }

    return result;
  }, [currentMonth, currentYear, occupiedSlots]);

  // Calculate available time slots for localDate
  const { availableTimes, dateMessage } = useMemo(() => {
    if (!localDate || !occupiedSlots) {
      return { availableTimes: [], dateMessage: null };
    }

    const dateStr = localDate;
    const parsedDate = new Date(localDate + 'T00:00:00Z');

    // 1. Holiday Check
    const holiday = occupiedSlots.holidays.find((h) => h.date === dateStr);
    if (holiday) {
      return {
        availableTimes: [],
        dateMessage: { text: `Cerrado por Festivo: ${holiday.description}`, type: 'error' as const },
      };
    }

    // 2. Non working day check
    const dayOfWeek = parsedDate.getUTCDay();
    const isNonWorkingDay = occupiedSlots.nonWorkingDaysOfWeek.includes(dayOfWeek);
    if (isNonWorkingDay) {
      return {
        availableTimes: [],
        dateMessage: { text: 'El taller no labora este día de la semana.', type: 'error' as const },
      };
    }

    // 3. Find schedule details
    const daySchedule = occupiedSlots.workingHours.find((w) => w.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.isWorking) {
      return {
        availableTimes: [],
        dateMessage: { text: 'Cerrado para este día.', type: 'error' as const },
      };
    }

    // 4. Pre-parse busy ranges for fast loop check
    const busyRanges = occupiedSlots.busySlots
      .filter((b) => b.date === dateStr)
      .map((b) => ({
        start: timeToMinutes(b.startTime),
        end: timeToMinutes(b.endTime),
      }));

    // 5. Generate 15 minutes slots
    const startMin = timeToMinutes(daySchedule.startTime);
    const endMin = timeToMinutes(daySchedule.endTime);
    const slots = [];
    let current = startMin;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const currentHourMinutes = now.getHours() * 60 + now.getMinutes();

    while (current + 15 <= endMin) {
      const slotTime = minutesToTime(current);

      const isBusy = busyRanges.some((r) => current >= r.start && current < r.end);
      const isPast = dateStr === todayStr && current <= currentHourMinutes;

      if (!isBusy && !isPast) {
        slots.push(slotTime);
      }
      current += 15;
    }

    if (slots.length === 0) {
      return {
        availableTimes: [],
        dateMessage: { text: 'No hay horarios disponibles para este día.', type: 'error' as const },
      };
    }

    return {
      availableTimes: slots,
      dateMessage: null,
    };
  }, [localDate, occupiedSlots]);

  // Format local date for time slots header
  const formattedLocalDate = useMemo(() => {
    if (!localDate) return '';
    const dateObj = new Date(localDate + 'T00:00:00Z');
    const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' });
    const dayNum = dateObj.getUTCDate();
    const monthName = dateObj.toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNum} de ${monthName}`;
  }, [localDate]);

  // Trigger input label representation
  const triggerLabel = useMemo(() => {
    if (!selectedDate || !selectedTime) {
      return 'Seleccionar fecha y hora de la cita...';
    }
    const dateObj = new Date(selectedDate + 'T00:00:00Z');
    const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' });
    const dayNum = dateObj.getUTCDate();
    const monthName = dateObj.toLocaleDateString('es-MX', { month: 'long', timeZone: 'UTC' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNum} de ${monthName} - ${format12h(selectedTime)}`;
  }, [selectedDate, selectedTime]);

  const handleDayClick = (dateString: string) => {
    setLocalDate(dateString);
    setLocalTime('');
  };

  const handleTimeSlotClick = (time: string) => {
    setLocalTime(time);
  };

  const handleConfirm = () => {
    if (localDate) {
      onChangeDate(localDate);
    }
    if (localTime) {
      onChangeTime(localTime);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Input Button */}
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="select select-sm select-bordered w-full pl-10 pr-4 bg-base-100 text-base-content border-base-300 rounded-DEFAULT transition-colors flex items-center justify-between cursor-pointer font-normal"
        >
          <span className={selectedDate ? 'text-base-content font-medium text-xs truncate' : 'text-base-content/40 text-xs truncate'}>
            {triggerLabel}
          </span>
          <Icon name="Calendar" size="xs" className="text-base-content/50 shrink-0 ml-2" />
        </button>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none">
          <Icon name="Clock" size="xs" />
        </span>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Card */}
          <Box
            className="bg-base-100 rounded-xl shadow-2xl border border-base-300 w-full max-w-4xl max-h-[90vh] flex flex-col relative text-base-content animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <Box p="md" className="border-b border-base-300 flex justify-between items-center bg-base-200/50">
              <Flex align="center" gap="sm">
                <Icon name="Calendar" className="text-primary" />
                <h3 className="text-base font-bold text-base-content m-0">Seleccionar Fecha y Hora</h3>
              </Flex>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-base-content/60 hover:text-base-content p-1.5 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
              >
                <Icon name="X" size="sm" />
              </button>
            </Box>

            {/* Custom Calendar + Time slots side-by-side grid */}
            <div className="overflow-y-auto flex-1">
              <Grid cols={{ base: 1, md: 12 }} gap="none" className="divide-y md:divide-y-0 md:divide-x divide-base-300">
                {/* Left Column: Calendar */}
                <Box p="lg" className="md:col-span-7">
                  <Flex justify="between" align="center" className="mb-4">
                    <span className="font-bold text-base-content text-base">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </span>
                    <Flex gap="xs">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        disabled={isPrevMonthDisabled}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 text-base-content disabled:opacity-30 disabled:hover:bg-base-200 transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Icon name="ChevronLeft" size="sm" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 text-base-content transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Icon name="ChevronRight" size="sm" />
                      </button>
                    </Flex>
                  </Flex>

                  {/* Week Day Labels */}
                  <Grid cols={7} gap="xs" className="text-center mb-2">
                    {DAY_LABELS.map((label) => (
                      <span key={label} className="text-xs font-semibold text-base-content/50 uppercase">
                        {label}
                      </span>
                    ))}
                  </Grid>

                  {/* Days Grid */}
                  <Grid cols={7} gap="xs" className="text-center">
                    {calendarDays.map((day, idx) => {
                      const isSelected = localDate === day.dateString;
                      
                      if (!day.isCurrentMonth) {
                        return (
                          <div
                            key={idx}
                            className="aspect-square flex items-center justify-center text-base-content/20 text-xs select-none"
                          >
                            {day.dayNumber}
                          </div>
                        );
                      }

                      if (day.isDisabled) {
                        return (
                          <div
                            key={idx}
                            title={day.reason}
                            className="aspect-square flex items-center justify-center text-base-content/25 text-xs select-none cursor-default font-normal relative group"
                          >
                            {day.dayNumber}
                            {day.reason && (
                              <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 bg-base-300 text-base-content text-[10px] px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-50">
                                {day.reason}
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDayClick(day.dateString)}
                          className={`aspect-square flex items-center justify-center rounded-lg text-xs transition-all focus:outline-none cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-primary-content font-bold shadow-xs'
                              : 'bg-base-200 text-base-content hover:bg-base-300 font-medium border border-base-300/40'
                          }`}
                        >
                          {day.dayNumber}
                        </button>
                      );
                    })}
                  </Grid>
                </Box>

                {/* Right Column: Time Slots */}
                <Box p="lg" className="md:col-span-5 flex flex-col min-h-[300px]">
                  {localDate ? (
                    <Stack gap="md" className="flex-1">
                      <span className="font-bold text-base-content text-sm pb-2 border-b border-base-300 block">
                        {formattedLocalDate}
                      </span>

                      {occupiedSlotsLoading ? (
                        <div className="flex-1 flex items-center justify-center py-8">
                          <span className="loading loading-spinner text-base-content/40"></span>
                        </div>
                      ) : dateMessage ? (
                        <div className="flex-1 flex items-center justify-center text-center p-4">
                          <span className="text-xs font-semibold text-error">{dateMessage.text}</span>
                        </div>
                      ) : availableTimes.length > 0 ? (
                        <div className="flex-1 overflow-y-auto pr-1 max-h-[250px] space-y-2">
                          {availableTimes.map((time) => {
                            const isTimeSelected = localTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handleTimeSlotClick(time)}
                                className={`w-full py-2 px-3 text-center rounded-DEFAULT border transition-all text-xs font-bold block cursor-pointer ${
                                  isTimeSelected
                                    ? 'bg-primary text-primary-content border-primary shadow-xs'
                                    : 'bg-base-100 text-base-content border-base-300 hover:bg-base-200'
                                }`}
                              >
                                {format12h(time)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-base-content/50 text-xs py-8">
                          No hay horarios disponibles para esta fecha.
                        </div>
                      )}
                    </Stack>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-base-content/40 p-6">
                      <Icon name="Calendar" size="lg" className="mb-2 opacity-50" />
                      <p className="text-xs font-semibold max-w-[180px] leading-relaxed">
                        Selecciona un día disponible en el calendario para ver los horarios.
                      </p>
                    </div>
                  )}
                </Box>
              </Grid>
            </div>

            {/* Footer */}
            <Box p="md" className="border-t border-base-300 flex justify-end gap-2 bg-base-200/50 rounded-b-xl shrink-0">
              <SecondaryButton
                size="sm"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton
                size="sm"
                type="button"
                disabled={!localDate || !localTime}
                onClick={handleConfirm}
              >
                Confirmar
              </PrimaryButton>
            </Box>
          </Box>
        </div>
      )}
    </>
  );
};


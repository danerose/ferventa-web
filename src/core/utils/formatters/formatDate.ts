/**
 * Formatea fechas ISO o Date a representaciones legibles en español.
 */
export const formatDate = (
  dateInput?: string | Date | null,
  options: {
    includeTime?: boolean;
    format?: 'short' | 'medium' | 'long' | 'timeOnly';
  } = { format: 'medium' }
): string => {
  if (!dateInput) return '-';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  if (options.format === 'timeOnly') {
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (options.format === 'short') {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (options.format === 'long') {
    const formattedDate = date.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (options.includeTime) {
      const formattedTime = date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${formattedDate}, ${formattedTime}`;
    }
    return formattedDate;
  }

  // Formato medium por defecto: DD/MM/YYYY o DD/MM/YYYY HH:MM
  const dateStr = date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (options.includeTime) {
    const timeStr = date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} ${timeStr}`;
  }

  return dateStr;
};

/**
 * Obtiene el rango de lunes (00:00:00) a sábado (23:59:59.999) para una fecha de referencia.
 */
export const getWeekMondayAndSaturday = (refDate: Date = new Date()) => {
  const d = new Date(refDate);
  const day = d.getDay(); // 0: Dom, 1: Lun, ..., 6: Sáb
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday, 0, 0, 0, 0);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);

  return { monday, saturday };
};

/**
 * Formatea una fecha a string YYYY-MM-DD en hora local.
 */
export const toLocalYYYYMMDD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Formatea el rango semanal para títulos (ej: "Lun 31 Ago – Sáb 5 Sep, 2026").
 */
export const formatWeekRangeLabel = (monday: Date, saturday: Date): string => {
  const optionsShort: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const monStr = monday.toLocaleDateString('es-MX', optionsShort);
  const satStr = saturday.toLocaleDateString('es-MX', optionsShort);
  const yearStr = saturday.getFullYear();
  return `${monStr} – ${satStr}, ${yearStr}`;
};

/**
 * Convierte un string de hora (ej: "09:00", "14:30", "14:30:00") a formato 12 horas con am/pm (ej: "9:00 am", "2:30 pm").
 */
export const formatTimeTo12Hour = (timeStr?: string | null, uppercase: boolean = false): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? (uppercase ? 'PM' : 'pm') : (uppercase ? 'AM' : 'am');
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes} ${period}`;
  }
  return timeStr;
};

/**
 * Convierte un rango de horas (ej: "09:00", "10:00") a formato 12 horas (ej: "9:00 am - 10:00 am").
 */
export const formatTimeRangeTo12Hour = (startTime?: string, endTime?: string, uppercase: boolean = false): string => {
  if (!startTime && !endTime) return '';
  if (startTime && !endTime) return formatTimeTo12Hour(startTime, uppercase);
  if (!startTime && endTime) return formatTimeTo12Hour(endTime, uppercase);
  return `${formatTimeTo12Hour(startTime, uppercase)} - ${formatTimeTo12Hour(endTime, uppercase)}`;
};

/**
 * Formatea una fecha para comentarios y notas mostrando día, mes y hora en formato 12h (ej: "16 sep, 4:35 pm" o "16 sep 2026, 4:35 pm").
 */
export const formatCommentDate = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '-';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const day = date.getDate();
  const month = date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
  const isCurrentYear = date.getFullYear() === new Date().getFullYear();
  const yearPart = isCurrentYear ? '' : ` ${date.getFullYear()}`;

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'pm' : 'am';
  const h12 = hours % 12 || 12;

  return `${day} ${month}${yearPart}, ${h12}:${minutes} ${period}`;
};

/**
 * Formatea una fecha separando en fecha (día mes y año) y hora en formato 12h am/pm.
 */
export const formatDateTimeSplit = (dateInput?: string | Date | null): { dateStr: string; timeStr: string } => {
  if (!dateInput) return { dateStr: '', timeStr: '' };

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return { dateStr: '', timeStr: '' };

  const day = date.getDate();
  const month = date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'pm' : 'am';
  const h12 = hours % 12 || 12;

  return {
    dateStr: `${day} ${month} ${year}`,
    timeStr: `${h12}:${minutes} ${period}`,
  };
};





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


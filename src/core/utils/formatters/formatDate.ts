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

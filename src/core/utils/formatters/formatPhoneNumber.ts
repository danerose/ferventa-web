/**
 * Extrae solo los dígitos numéricos de un teléfono (máximo 10 dígitos).
 */
export const cleanPhoneDigits = (phone?: string | null): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(0, 10);
};

/**
 * Formatea en tiempo real mientras el usuario escribe en un input (máx. 10 dígitos).
 * Formato: "99 1234 5678" (2 - 4 - 4)
 */
export const formatPhoneInput = (val?: string | null): string => {
  const digits = cleanPhoneDigits(val);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
};

/**
 * Formatea un número de teléfono de 10 dígitos para lectura / visualización.
 */
export const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '-';
  const cleaned = cleanPhoneDigits(phone);
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Valida si un número de teléfono tiene exactamente 10 dígitos numéricos válidos.
 */
export const isValidPhone = (phone?: string | null): boolean => {
  const cleaned = cleanPhoneDigits(phone);
  return cleaned.length === 10;
};


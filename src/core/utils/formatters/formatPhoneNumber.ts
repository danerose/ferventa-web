/**
 * Limpia y formatea números de teléfono para Perú u otros formatos.
 */
export const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

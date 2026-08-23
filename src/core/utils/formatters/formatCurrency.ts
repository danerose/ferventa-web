/**
 * Formatea un número como moneda (PEN por defecto o USD).
 */
export const formatCurrency = (amount: number, currency: 'PEN' | 'USD' = 'PEN'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return currency === 'PEN' ? 'S/ 0.00' : '$ 0.00';
  }

  const formatted = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Normalizar el símbolo para consistencia visual
  if (currency === 'PEN') {
    return formatted.replace('PEN', 'S/').trim();
  }
  return formatted;
};

/**
 * Formatea un número como moneda (PEN por defecto o USD).
 */
export const formatCurrency = (
  amount: number,
  currency: 'MXN' | 'PEN' | 'USD' = 'MXN'
): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return currency === 'PEN' ? 'S/ 0.00' : '$0.00';
  }

  const locale = currency === 'PEN' ? 'es-PE' : currency === 'MXN' ? 'es-MX' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === 'PEN') {
    return formatted.replace('PEN', 'S/').trim();
  }
  return formatted;
};

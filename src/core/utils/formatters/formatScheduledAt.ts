export function formatScheduledAt(scheduledAt: string) {
  try {
    const d = new Date(scheduledAt);
    const day = d.getUTCDate();
    const monthShort = d
      .toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' })
      .toUpperCase()
      .replace('.', '');
    const dayName = d
      .toLocaleDateString('es-MX', { weekday: 'short', timeZone: 'UTC' })
      .toUpperCase()
      .replace('.', '');
    const hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return { date: `${day} ${monthShort}`, time: `${h12}:${minutes}`, period, dayName };
  } catch {
    return { date: '---', time: '---', period: '', dayName: '' };
  }
}

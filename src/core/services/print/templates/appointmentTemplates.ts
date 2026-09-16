import type { Appointment } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';

function formatDateTime(isoString?: string): { date: string; time: string } {
  if (!isoString) return { date: 'Fecha no especificada', time: '' };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: isoString, time: '' };
    const date = d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return { date, time };
  } catch {
    return { date: isoString, time: '' };
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente de Confirmación',
  approved: 'Cita Aprobada',
  rescheduled: 'Reagendada',
  completed: 'Concluida',
  cancelled: 'Cancelada',
  rejected: 'Rechazada',
  no_show: 'No Asistió',
};

/**
 * Generate Letter/A4 formal appointment confirmation sheet
 */
export function generateAppointmentDocumentHtml(
  appt: Appointment,
  branchName = 'Nova FV Sucursal Uman'
): string {
  const folio = (appt.id || '').slice(-6).toUpperCase() || '000001';
  const { date, time } = formatDateTime(appt.scheduledAt);
  const statusLabel = STATUS_LABELS[appt.status] || appt.status || 'Programada';

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; padding: 24px; max-width: 780px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">
          Moto Servicio Nova FV
        </h1>
        <p style="font-size: 14px; color: #475569; font-weight: 600; margin: 4px 0 0 0;">
          Comprobante de Cita Programada
        </p>
        <div style="display: flex; justify-content: center; gap: 20px; font-size: 12px; color: #64748b; margin-top: 6px;">
          <span>Folio: <strong>#${folio}</strong></span>
          <span>Sucursal: <strong>${appt.branchName || branchName}</strong></span>
        </div>
      </div>

      <!-- Schedule Banner -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #166534; letter-spacing: 0.5px;">
          Fecha y Hora Reservada
        </div>
        <div style="font-size: 16px; font-weight: 800; color: #15803d; margin-top: 2px; text-transform: capitalize;">
          ${date} a las ${time}
        </div>
        <div style="font-size: 11px; color: #166534; margin-top: 4px;">
          Estado de la cita: <strong>${statusLabel}</strong>
        </div>
      </div>

      <!-- Two columns: Customer & Vehicle -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
            Datos del Cliente
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
            ${appt.customerName}
          </div>
          ${appt.customerPhone ? `
            <div style="font-size: 12px; color: #334155; margin-top: 4px;">
              Teléfono: <strong style="font-family: monospace;">${appt.customerPhone}</strong>
            </div>
          ` : ''}
          ${appt.customerEmail ? `
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              ${appt.customerEmail}
            </div>
          ` : ''}
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
            Datos de la Unidad / Moto
          </div>
          ${appt.vehicle && (appt.vehicle.brand || appt.vehicle.model) ? `
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
              ${appt.vehicle.brand} ${appt.vehicle.model} ${appt.vehicle.year ? `(${appt.vehicle.year})` : ''}
            </div>
            <div style="font-size: 12px; color: #334155; margin-top: 4px;">
              ${appt.vehicle.serialNumberLastFour ? `Serie: <strong>${appt.vehicle.serialNumberLastFour}</strong>` : ''}
              ${appt.vehicle.licensePlate ? ` • Placas: <strong>${appt.vehicle.licensePlate}</strong>` : ''}
              ${appt.vehicle.color ? ` • Color: ${appt.vehicle.color}` : ''}
            </div>
          ` : `
            <div style="font-size: 13px; color: #64748b; font-style: italic;">
              Por confirmar al momento de ingresar la unidad al taller.
            </div>
          `}
        </div>
      </div>

      <!-- Service Requested -->
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; background: #ffffff;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
          Servicio Solicitado / Motivo de Cita
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
          ${appt.serviceRequested || 'Mantenimiento General'}
        </div>
        ${appt.notes ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 12px; color: #475569;">
            <strong>Notas del cliente:</strong> "${appt.notes}"
          </div>
        ` : ''}
      </div>

      <!-- Footer Policy -->
      <div style="text-align: center; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 14px; line-height: 1.5;">
        <p style="margin: 0 0 4px 0;">Este documento es un comprobante informativo de su cita en <strong>Moto Servicio Nova FV</strong>.</p>
        <p style="margin: 0;">Para cambios o reagendaciones, por favor contáctenos con anticipación vía WhatsApp o teléfono. ¡Gracias por su preferencia!</p>
      </div>
    </div>
  `;
}

/**
 * Generate 58mm or 80mm continuous thermal ticket for scheduled appointment
 */
export function generateAppointmentTicketHtml(
  appt: Appointment,
  settings: PrinterSettings,
  branchName = 'Nova FV Sucursal Uman'
): string {
  const is58 = settings.paperWidth === '58mm';
  const printableWidth = is58 ? '48mm' : '72mm';
  const sepDouble = is58
    ? '════════════════════════════'
    : '══════════════════════════════════════════';
  const sepDash = is58
    ? '────────────────────────────'
    : '──────────────────────────────────────────';
  const fontSize = is58 ? '9.5px' : '11.5px';

  const folio = (appt.id || '').slice(-6).toUpperCase() || '000001';
  const { date, time } = formatDateTime(appt.scheduledAt);

  return `
    <div style="width: ${printableWidth}; max-width: ${printableWidth}; margin: 0 auto; padding: 4px 2px 6mm 2px; font-size: ${fontSize}; line-height: 1.25; color: #000000; font-family: 'Courier New', Courier, monospace;">
      <div style="text-align: center;">
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
        <div style="font-weight: 900; font-size: 1.2em; text-transform: uppercase;">${settings.businessName}</div>
        <div style="font-size: 0.85em; font-weight: bold;">${settings.businessTagline}</div>
        <div style="font-size: 0.85em; margin-top: 1px;">SUCURSAL: ${branchName}</div>
        ${settings.showPhone && settings.phone ? `<div style="font-size: 0.85em;">Tel./WhatsApp: ${settings.phone}</div>` : ''}
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
      </div>

      <div style="text-align: center; margin: 4px 0;">
        <div style="font-weight: 900; font-size: 1.1em; text-transform: uppercase;">COMPROBANTE DE CITA</div>
        <div style="font-weight: bold; font-size: 1.05em; margin-top: 1px;">FOLIO: #${folio}</div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div>FECHA: <strong>${date}</strong></div>
        <div>HORA:  <strong>${time}</strong></div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div>CLIENTE: <strong>${appt.customerName}</strong></div>
        ${appt.customerPhone ? `<div>TELÉFONO: <strong>${appt.customerPhone}</strong></div>` : ''}
        ${appt.vehicle ? `
          <div style="margin-top: 3px;">MOTO: <strong>${appt.vehicle.brand} ${appt.vehicle.model} ${appt.vehicle.year || ''}</strong></div>
          ${appt.vehicle.serialNumberLastFour ? `<div>SERIE: <strong>${appt.vehicle.serialNumberLastFour}</strong></div>` : ''}
          ${appt.vehicle.licensePlate ? `<div>PLACAS: <strong>${appt.vehicle.licensePlate}</strong></div>` : ''}
        ` : ''}
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div style="font-weight: bold;">SERVICIO SOLICITADO:</div>
        <div style="word-break: break-word; padding-left: 4px;">${appt.serviceRequested || 'Mantenimiento General'}</div>
        ${appt.notes ? `
          <div style="font-size: 0.85em; margin-top: 3px; font-style: italic;">Nota: "${appt.notes}"</div>
        ` : ''}
      </div>

      <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>

      <div style="text-align: center; margin-top: 6px;">
        <div style="font-weight: bold; font-size: 0.9em;">${settings.footerMessage || '¡GRACIAS POR SU PREFERENCIA!'}</div>
        <div style="font-size: 0.8em; margin-top: 2px;">Favor de llegar 5 min antes de su cita.</div>
      </div>

      ${settings.showCutLine ? `
        <div style="text-align: center; margin-top: 8px; font-size: 0.75em;">
          - - - - CORTE DE TICKET - - - -
        </div>
      ` : ''}
    </div>
  `;
}

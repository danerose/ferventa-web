import type { AdminMaintenanceOrder, Appointment, Sale, SpecialOrder } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';
import { EscPosEncoder } from './escPosEncoder';
import { parseTicketItems } from '../templates/ticketItemUtils';

export interface EscPosTicketOptions {
  sale?: Sale | null;
  settings: PrinterSettings;
  branchName?: string;
  sellerName?: string;
  isTest?: boolean;
}

/**
 * Generates raw ESC/POS byte sequence for thermal sales ticket (calibrated for 58mm / 80mm).
 */
export function generateSaleTicketEscPos(options: EscPosTicketOptions): Uint8Array {
  const { sale, settings, branchName, sellerName, isTest } = options;
  const encoder = new EscPosEncoder(settings.paperWidth || '58mm');

  const rawSaleId = sale && '_id' in sale && typeof (sale as { _id?: unknown })._id === 'string'
    ? (sale as { _id: string })._id
    : (sale?.id || '');
  const folio = sale?.folio || (isTest ? 'NV-000425' : `NV-${rawSaleId.slice(-6).padStart(6, '0')}`);
  const branch = branchName || settings.businessName || 'Moto servicio Nova FV';
  const cashier = sellerName || (isTest ? 'Administrador Inicial' : 'Cajero');

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const items = parseTicketItems(sale?.items, isTest);

  const subtotal = isTest ? 520.0 : (sale?.subtotal ?? items.reduce((a, b) => a + b.subtotal + (b.supplies?.reduce((sa, sb) => sa + sb.subtotal, 0) || 0), 0));
  const discount = isTest ? 0.0 : (sale?.discount ?? 0);
  const total = isTest ? 520.0 : (sale?.total ?? subtotal);
  const paymentMethodLabel = isTest
    ? 'EFECTIVO'
    : sale?.paymentMethod === 'card'
      ? 'TARJETA'
      : sale?.paymentMethod === 'transfer'
        ? 'TRANSFERENCIA'
        : 'EFECTIVO';

  // 1. Header (Centered)
  encoder.align('center');
  encoder.separator('=');
  encoder.bold(true).doubleHeight(true).line(settings.businessName || 'MOTO SERVICIO NOVA FV').doubleHeight(false).bold(false);
  if (settings.businessTagline) {
    encoder.bold(true).line(settings.businessTagline).bold(false);
  }
  encoder.line(`SUCURSAL: ${branch}`);
  if (settings.showPhone && settings.phone) {
    encoder.line(`Tel./WhatsApp: ${settings.phone}`);
  }
  if (settings.showAddress && settings.address) {
    encoder.line(settings.address);
  }
  encoder.separator('=');

  // 2. Metadata
  encoder.align('left');
  encoder.rowTwoColumns(`FECHA: ${dateStr}`, `HORA: ${timeStr}`);
  if (settings.showFolio) {
    encoder.line(`FOLIO: #${folio}`);
  }
  if (settings.showCashier) {
    encoder.line(`ATENDIO: ${cashier}`);
  }

  // 3. Items Header
  encoder.separator('-');
  encoder.bold(true);
  encoder.itemHeader('CANT', 'CONCEPTO', 'IMPORTE');
  encoder.bold(false);
  encoder.separator('-');

  // 4. Item Rows
  items.forEach((item) => {
    const prefix = item.isService && !item.name.toUpperCase().includes('SERV') ? '[SERV] ' : '';
    encoder.itemRow(item.qty, `${prefix}${item.name}`, `$${item.subtotal.toFixed(2)}`);
    if (item.qty > 1 || Math.abs(item.price - item.subtotal / item.qty) > 0.01) {
      encoder.line(`    ${item.qty} x $${item.price.toFixed(2)}`);
    }
    if (item.supplies && item.supplies.length > 0) {
      item.supplies.forEach((sup) => {
        const tag = sup.subtotal > 0 ? `(+$${sup.subtotal.toFixed(2)})` : '(Incluido)';
        encoder.supplyRow(sup.qty, sup.name, tag);
      });
    }
  });

  encoder.separator('-');

  // 5. Totals
  encoder.rowTwoColumns('SUBTOTAL:', `$${subtotal.toFixed(2)}`);
  if (discount > 0) {
    encoder.rowTwoColumns('DESCUENTO:', `-$${discount.toFixed(2)}`);
  }
  encoder.separator('-');
  encoder.rowTwoColumns('TOTAL:', `$${total.toFixed(2)} MXN`, true, true);
  encoder.rowTwoColumns('METODO DE PAGO:', paymentMethodLabel);

  // 6. Policies
  if (settings.showPolicies && settings.policiesText) {
    encoder.separator('=');
    encoder.align('center');
    encoder.bold(true).line(settings.policiesTitle || 'IMPORTANTE').bold(false);
    encoder.align('left');
    const lines = settings.policiesText.split('\n').filter((l) => l.trim().length > 0);
    lines.forEach((l) => encoder.line(l));
  }

  // 7. Footer
  encoder.separator('-');
  encoder.align('center');
  if (settings.footerMessage) {
    encoder.bold(true).line(settings.footerMessage).bold(false);
  }
  if (settings.footerSubtext) {
    encoder.line(settings.footerSubtext);
  }

  // 8. Feed & Cut
  encoder.cut();
  return encoder.encode();
}

/**
 * Generates raw ESC/POS byte sequence for Workshop Service Reception
 */
export function generateReceptionTicketEscPos(
  order: AdminMaintenanceOrder,
  settings: PrinterSettings,
  branchName?: string,
  receiverName?: string
): Uint8Array {
  const encoder = new EscPosEncoder(settings.paperWidth || '58mm');
  const folio = order.folio || (order.id ? order.id.slice(-6).toUpperCase() : '000001');
  const branch = branchName || settings.businessName || 'Moto servicio Nova FV';
  const attendant = receiverName || 'Recepcionista';

  const customerName = order.customer?.name || 'Cliente General';
  const customerPhone = order.customer?.phone;
  const vehicleStr = `${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}`.trim() || 'Motocicleta';
  const plateStr = order.vehicle?.licensePlate ? `[${order.vehicle.licensePlate}]` : '';

  encoder.align('center');
  encoder.separator('=');
  encoder.bold(true).line(settings.businessName || 'MOTO SERVICIO NOVA FV').bold(false);
  encoder.line('RECEPCION DE VEHICULO');
  encoder.line(`SUCURSAL: ${branch}`);
  encoder.separator('=');

  encoder.align('left');
  encoder.rowTwoColumns(`FOLIO: #${folio}`, `FECHA: ${new Date().toLocaleDateString('es-MX')}`);
  encoder.line(`CLIENTE: ${customerName}`);
  if (customerPhone) {
    encoder.line(`TEL: ${customerPhone}`);
  }
  encoder.line(`VEHICULO: ${vehicleStr} ${plateStr}`.trim());
  if (order.serviceRequested) {
    encoder.line(`MOTIVO: ${order.serviceRequested}`);
  }
  encoder.line(`RECIBIO: ${attendant}`);
  encoder.separator('-');

  encoder.align('center');
  encoder.line('CONSERVE ESTE COMPROBANTE');
  encoder.line('PARA RECOGER SU VEHICULO');
  encoder.cut();

  return encoder.encode();
}

/**
 * Generates raw ESC/POS byte sequence for Appointment confirmation
 */
export function generateAppointmentTicketEscPos(
  appt: Appointment,
  settings: PrinterSettings,
  branchName?: string
): Uint8Array {
  const encoder = new EscPosEncoder(settings.paperWidth || '58mm');
  const folio = (appt.id || '').slice(-6).toUpperCase() || '000001';
  const branch = branchName || settings.businessName || 'Moto servicio Nova FV';

  const customerName = appt.customerName || 'Cliente';
  const customerPhone = appt.customerPhone;
  const scheduledDate = appt.scheduledAt ? new Date(appt.scheduledAt).toLocaleString('es-MX') : 'Fecha pendiente';
  const serviceName = appt.serviceRequested || 'Mantenimiento General';

  encoder.align('center');
  encoder.separator('=');
  encoder.bold(true).line(settings.businessName || 'MOTO SERVICIO NOVA FV').bold(false);
  encoder.line('COMPROBANTE DE CITA');
  encoder.line(`SUCURSAL: ${branch}`);
  encoder.separator('=');

  encoder.align('left');
  encoder.line(`CITA: #${folio}`);
  encoder.line(`CLIENTE: ${customerName}`);
  if (customerPhone) {
    encoder.line(`TEL: ${customerPhone}`);
  }
  encoder.line(`FECHA: ${scheduledDate}`);
  encoder.line(`SERVICIO: ${serviceName}`);
  encoder.separator('-');

  encoder.align('center');
  encoder.line('¡LE ESPERAMOS PUNTUALMENTE!');
  encoder.cut();

  return encoder.encode();
}

/**
 * Generates raw ESC/POS byte sequence for Special Orders
 */
export function generateSpecialOrderTicketEscPos(
  order: SpecialOrder,
  settings: PrinterSettings,
  branchName?: string,
  sellerName?: string
): Uint8Array {
  const encoder = new EscPosEncoder(settings.paperWidth || '58mm');
  const folio = order.folio || order.id?.slice(-6).toUpperCase() || 'PED-001';
  const branch = branchName || settings.businessName || 'Moto servicio Nova FV';

  const customerName = order.customer?.name || 'Cliente';
  const customerPhone = order.customer?.phone;
  const sellingPrice = order.sellingPrice || 0;
  const advance = order.advancePayment || 0;
  const remaining = order.remainingBalance ?? Math.max(0, sellingPrice - advance);

  encoder.align('center');
  encoder.separator('=');
  encoder.bold(true).line(settings.businessName || 'MOTO SERVICIO NOVA FV').bold(false);
  encoder.line('PEDIDO ESPECIAL');
  encoder.line(`SUCURSAL: ${branch}`);
  encoder.separator('=');

  encoder.align('left');
  encoder.line(`FOLIO: #${folio}`);
  encoder.line(`CLIENTE: ${customerName}`);
  if (customerPhone) {
    encoder.line(`TEL: ${customerPhone}`);
  }
  if (order.itemDescription) {
    encoder.line(`ARTICULO: ${order.itemDescription}`);
  }
  if (sellerName) {
    encoder.line(`ATENDIO: ${sellerName}`);
  }
  encoder.separator('-');

  encoder.rowTwoColumns('TOTAL PEDIDO:', `$${sellingPrice.toFixed(2)}`);
  encoder.rowTwoColumns('ANTICIPO:', `$${advance.toFixed(2)}`);
  encoder.rowTwoColumns('RESTANTE:', `$${remaining.toFixed(2)}`, true, true);
  encoder.separator('-');

  encoder.align('center');
  encoder.line('CONSERVE ESTE TICKET PARA ENTREGA');
  encoder.cut();

  return encoder.encode();
}

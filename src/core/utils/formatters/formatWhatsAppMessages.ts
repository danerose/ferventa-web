import { ServiceStatus, SERVICE_STATUS_LABELS } from '@/core/enums/status/ServiceStatus';
import { SpecialOrderStatus, SPECIAL_ORDER_STATUS_LABELS } from '@/core/enums/status/SpecialOrderStatus';
import { formatCurrency } from './formatCurrency';

/**
 * Formats the branch name ensuring the "Taller " prefix is present (e.g. "Taller Nova FV Sucursal Uman").
 */
export function formatBranchWorkshopName(branchName?: string | null): string {
  const name = branchName?.trim() || 'Nova FV Sucursal Uman';
  if (/^taller\b/i.test(name)) {
    return name;
  }
  return `Taller ${name}`;
}

export interface MaintenanceMessageVehicle {
  brand: string;
  model: string;
  serialNumberLastFour?: string;
}

/**
 * Builds a natural, friendly WhatsApp notification for maintenance services.
 */
export function buildMaintenanceWhatsAppMessage(params: {
  customerName: string;
  vehicle: MaintenanceMessageVehicle;
  status: ServiceStatus | string;
  branchName?: string | null;
  serviceRequested?: string;
}): string {
  const workshop = formatBranchWorkshopName(params.branchName);
  const serialPart = params.vehicle.serialNumberLastFour ? ` (Serie: ${params.vehicle.serialNumberLastFour})` : '';
  const vehicleText = `${params.vehicle.brand} ${params.vehicle.model}${serialPart}`.trim();
  const serviceText = params.serviceRequested ? ` de ${params.serviceRequested}` : '';

  switch (params.status) {
    case ServiceStatus.Completed:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le informamos que el servicio${serviceText} para su vehículo ${vehicleText} ha concluido con éxito. ¡Su vehículo ya está listo para ser recogido! Puede pasar por él en nuestro horario de atención habitual.`;

    case ServiceStatus.InProgress:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le informamos que su vehículo ${vehicleText} se encuentra actualmente en proceso de servicio en nuestro taller. Le mantendremos informado de cualquier novedad.`;

    case ServiceStatus.NotStarted:
    case ServiceStatus.Pending:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le confirmamos que su vehículo ${vehicleText} ha sido recibido en sucursal y está en turno para iniciar su servicio.`;

    case ServiceStatus.Delivered:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le confirmamos que su vehículo ${vehicleText} ha sido entregado. ¡Muchas gracias por su confianza y preferencia!`;

    case ServiceStatus.Cancelled:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le informamos que la orden de servicio para su vehículo ${vehicleText} ha sido cancelada. Si tiene cualquier duda, con gusto le atendemos.`;

    default:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le compartimos una actualización de su vehículo ${vehicleText}: actualmente se encuentra en ${SERVICE_STATUS_LABELS[params.status] || params.status}. Quedamos a sus órdenes.`;
  }
}

/**
 * Builds a natural, friendly WhatsApp notification for special orders.
 */
export function buildSpecialOrderWhatsAppMessage(params: {
  customerName: string;
  folio: string;
  itemDescription: string;
  status: SpecialOrderStatus | string;
  remainingBalance: number;
  branchName?: string | null;
}): string {
  const workshop = formatBranchWorkshopName(params.branchName);
  const remainingFormatted = formatCurrency(params.remainingBalance);
  const balanceText = params.remainingBalance > 0
    ? ` Saldo pendiente: ${remainingFormatted}.`
    : ' Saldo pendiente: $0.00 (Liquidado).';

  switch (params.status) {
    case SpecialOrderStatus.READY_FOR_PICKUP:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido ${params.folio} (${params.itemDescription}): ¡le avisamos que ya está listo para ser recogido en sucursal!${balanceText} Puede pasar por él en nuestro horario de atención.`;

    case SpecialOrderStatus.IN_BRANCH:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido ${params.folio} (${params.itemDescription}): ¡su pedido ya llegó a nuestra sucursal y está listo para entrega!${balanceText}`;

    case SpecialOrderStatus.IN_TRANSIT:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido ${params.folio} (${params.itemDescription}): su pedido va en camino hacia nuestra sucursal.${balanceText}`;

    case SpecialOrderStatus.ORDERED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido ${params.folio} (${params.itemDescription}): su pedido ya fue solicitado a nuestro proveedor y viene en camino.${balanceText}`;

    case SpecialOrderStatus.ORDER_PLACED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido ${params.folio} (${params.itemDescription}): hemos registrado su pedido con éxito y se encuentra en trámite.${balanceText}`;

    case SpecialOrderStatus.DELIVERED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido ${params.folio} (${params.itemDescription}): le confirmamos que ha sido entregado satisfactoriamente. ¡Muchas gracias por su preferencia!`;

    case SpecialOrderStatus.CANCELLED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le informamos que su pedido ${params.folio} (${params.itemDescription}) ha sido cancelado. Si tiene dudas sobre su anticipo, por favor comuníquese con nosotros.`;

    default:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido ${params.folio} (${params.itemDescription}): se encuentra en estatus "${SPECIAL_ORDER_STATUS_LABELS[params.status] || params.status}".${balanceText}`;
  }
}

/**
 * Normalizes phone number to standard international format (e.g. 52XXXXXXXXXX for Mexico).
 */
export function normalizeWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10) {
    return `52${digits}`;
  } else if (digits.length === 13 && digits.startsWith('521')) {
    return `52${digits.slice(3)}`;
  }
  return digits;
}

/**
 * Builds a direct native protocol URL (whatsapp://send?phone=...&text=...)
 * to open the WhatsApp Desktop application directly without loading any browser landing page.
 */
export function formatWhatsAppProtocolUrl(phone?: string | null, message?: string | null): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '';
  const query = message ? `&text=${encodeURIComponent(message)}` : '';
  return `whatsapp://send?phone=${normalized}${query}`;
}

/**
 * Builds a direct WhatsApp Web URL (https://web.whatsapp.com/send?phone=...&text=...)
 */
export function formatWhatsAppWebUrl(phone?: string | null, message?: string | null): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '';
  const query = message ? `&text=${encodeURIComponent(message)}` : '';
  return `https://web.whatsapp.com/send?phone=${normalized}${query}`;
}

/**
 * Builds a standard WhatsApp URL. By default uses the direct native protocol (whatsapp://)
 * so it opens the desktop app directly without opening an intermediate browser page.
 */
export function formatWhatsAppUrl(phone?: string | null, message?: string | null, preferNative = true): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '';

  if (preferNative) {
    return formatWhatsAppProtocolUrl(phone, message);
  }

  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${normalized}${query}`;
}

/**
 * Directly triggers opening WhatsApp on the client device (Desktop app or Web)
 */
export function openWhatsApp(phone?: string | null, message?: string | null, preferNative = true): void {
  const url = formatWhatsAppUrl(phone, message, preferNative);
  if (!url) return;

  if (url.startsWith('whatsapp://')) {
    const a = document.createElement('a');
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Builds both the personalized message and the formatted WhatsApp link for a special order.
 */
export function buildSpecialOrderWhatsAppUrl(params: {
  phone: string;
  customerName: string;
  folio: string;
  itemDescription: string;
  status: SpecialOrderStatus | string;
  remainingBalance: number;
  branchName?: string | null;
  preferNative?: boolean;
}): string {
  const message = buildSpecialOrderWhatsAppMessage(params);
  return formatWhatsAppUrl(params.phone, message, params.preferNative ?? true);
}

/**
 * Builds both the personalized message and the formatted WhatsApp link for a maintenance order.
 */
export function buildMaintenanceWhatsAppUrl(params: {
  phone: string;
  customerName: string;
  vehicle: MaintenanceMessageVehicle;
  status: ServiceStatus | string;
  branchName?: string | null;
  serviceRequested?: string;
  preferNative?: boolean;
}): string {
  const message = buildMaintenanceWhatsAppMessage(params);
  return formatWhatsAppUrl(params.phone, message, params.preferNative ?? true);
}

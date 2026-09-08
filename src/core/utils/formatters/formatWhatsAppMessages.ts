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
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido especial ${params.folio} (${params.itemDescription}): ¡le avisamos que ya está listo para ser recogido en sucursal!${balanceText} Puede pasar por él en nuestro horario de atención.`;

    case SpecialOrderStatus.IN_BRANCH:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido especial ${params.folio} (${params.itemDescription}): ¡su pedido ya llegó a nuestra sucursal y está listo para entrega!${balanceText}`;

    case SpecialOrderStatus.IN_TRANSIT:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido especial ${params.folio} (${params.itemDescription}): su pedido va en camino hacia nuestra sucursal.${balanceText}`;

    case SpecialOrderStatus.ORDERED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido especial ${params.folio} (${params.itemDescription}): su pedido ya fue solicitado a nuestro proveedor y viene en camino.${balanceText}`;

    case SpecialOrderStatus.ORDER_PLACED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido especial ${params.folio} (${params.itemDescription}): hemos registrado su pedido con éxito y se encuentra en trámite.${balanceText}`;

    case SpecialOrderStatus.DELIVERED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido especial ${params.folio} (${params.itemDescription}): le confirmamos que ha sido entregado satisfactoriamente. ¡Muchas gracias por su preferencia!`;

    case SpecialOrderStatus.CANCELLED:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Le informamos que su pedido especial ${params.folio} (${params.itemDescription}) ha sido cancelado. Si tiene dudas sobre su anticipo, por favor comuníquese con nosotros.`;

    default:
      return `Hola ${params.customerName}, le saludamos del ${workshop}. Con respecto a su pedido especial ${params.folio} (${params.itemDescription}): se encuentra en estatus "${SPECIAL_ORDER_STATUS_LABELS[params.status] || params.status}".${balanceText}`;
  }
}

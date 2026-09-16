import type { AdminMaintenanceOrder, Appointment } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';
import { printEngine } from './PrintEngine';
import {
  generateSaleTicketHtml,
  type PrintTicketOptions,
  type PrintItem,
} from './templates/saleTicketTemplate';
import { generateReceptionTicketHtml } from './templates/receptionTemplates';
import { generateAppointmentTicketHtml } from './templates/appointmentTemplates';

export type { PrintTicketOptions, PrintItem };

export const thermalPrintService = {
  /**
   * Genera el HTML puro para un ticket de venta (calibrado para 58mm o 80mm).
   */
  generateTicketHTML(options: PrintTicketOptions): string {
    return generateSaleTicketHtml(options);
  },

  /**
   * Imprime un ticket de venta en el motor aislado PrintEngine.
   */
  print(options: PrintTicketOptions): void {
    const html = this.generateTicketHTML(options);
    const rawSaleId = options.sale && '_id' in options.sale && typeof (options.sale as { _id?: unknown })._id === 'string'
      ? (options.sale as { _id: string })._id
      : (options.sale?.id || '');
    const folio = options.sale?.folio || (options.isTest ? 'NV-000425' : `NV-${rawSaleId.slice(-6).padStart(6, '0')}`);

    printEngine.printThermal(html, {
      width: options.settings.paperWidth || '58mm',
      title: `Ticket #${folio}`,
    });
  },

  /**
   * Imprime un ticket de prueba para calibrar márgenes y corte según el ancho configurado.
   */
  printTestTicket(settings: PrinterSettings, branchName?: string, sellerName?: string): void {
    this.print({
      settings,
      branchName,
      sellerName,
      isTest: true,
    });
  },

  /**
   * Imprime ticket térmico de recepción de vehículo en taller (58mm / 80mm).
   * Disponible de inmediato para el cliente al ingresar su moto, sin necesidad de venta previa.
   */
  printReceptionTicket(
    order: AdminMaintenanceOrder,
    settings: PrinterSettings,
    branchName?: string,
    receiverName?: string
  ): void {
    const html = generateReceptionTicketHtml(order, settings, branchName, receiverName);
    const folio = order.folio || (order.id ? order.id.slice(-6).toUpperCase() : '000001');

    printEngine.printThermal(html, {
      width: settings.paperWidth || '58mm',
      title: `Ticket Recepción #${folio}`,
    });
  },

  /**
   * Imprime ticket térmico de recordatorio de cita (58mm / 80mm).
   */
  printAppointmentTicket(
    appt: Appointment,
    settings: PrinterSettings,
    branchName?: string
  ): void {
    const html = generateAppointmentTicketHtml(appt, settings, branchName);
    const folio = (appt.id || '').slice(-6).toUpperCase() || '000001';

    printEngine.printThermal(html, {
      width: settings.paperWidth || '58mm',
      title: `Ticket Cita #${folio}`,
    });
  },
};

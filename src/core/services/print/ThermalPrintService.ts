import type { AdminMaintenanceOrder, Appointment, SpecialOrder } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';
import { printEngine } from './PrintEngine';
import {
  generateSaleTicketHtml,
  type PrintTicketOptions,
  type PrintItem,
} from './templates/saleTicketTemplate';
import { generateReceptionTicketHtml } from './templates/receptionTemplates';
import { generateAppointmentTicketHtml } from './templates/appointmentTemplates';
import { generateSpecialOrderTicketHtml } from './templates/specialOrderTemplates';
import {
  generateSaleTicketEscPos,
  generateReceptionTicketEscPos,
  generateAppointmentTicketEscPos,
  generateSpecialOrderTicketEscPos,
} from './escpos/ticketEscPosGenerators';
import { webBluetoothPrinterService } from './WebBluetoothPrinterService';
import { directUsbPrinterService } from './DirectUsbPrinterService';
import { localAgentPrinterService } from './LocalAgentPrinterService';

export type { PrintTicketOptions, PrintItem };

export const thermalPrintService = {
  /**
   * Genera el HTML puro para un ticket de venta (calibrado para 58mm o 80mm).
   */
  generateTicketHTML(options: PrintTicketOptions): string {
    return generateSaleTicketHtml(options);
  },

  /**
   * Imprime un ticket de venta.
   * Prioridad 1: Agente Local Windows (FerventaPrintAgent.exe) hacia la impresora asignada.
   * Prioridad 2: Conexión Web Bluetooth directa.
   * Prioridad 3: Conexión Web Serial / USB directa.
   * Respaldo: Motor PrintEngine estándar (diálogo del navegador).
   */
  async print(options: PrintTicketOptions): Promise<boolean> {
    const mode = options.settings.printMode || 'local_agent';
    const targetPrinter = options.settings.ticketPrinter || options.settings.printerName || 'POS-58';

    // 1. Intento por Agente Local Windows (Silencioso 100%, 0 ventanas)
    if (mode === 'local_agent') {
      try {
        const rawBytes = generateSaleTicketEscPos(options);
        const printed = await localAgentPrinterService.printRawTicket(targetPrinter, rawBytes);
        if (printed) {
          return true;
        }
      } catch (err) {
        console.warn('[ThermalPrintService] Falló impresión por Agente Local:', err);
      }
    }

    // 2. Intento por Bluetooth Directo (Inalámbrico)
    if (mode === 'bluetooth') {
      try {
        const rawBytes = generateSaleTicketEscPos(options);
        const printed = await webBluetoothPrinterService.printRaw(rawBytes);
        if (printed) {
          return true;
        }
      } catch (err) {
        console.warn('[ThermalPrintService] Falló impresión directa por Bluetooth:', err);
      }
    }

    // 3. Intento por USB / Serial Directo (Cable)
    if (mode === 'usb_serial') {
      try {
        const rawBytes = generateSaleTicketEscPos(options);
        const printed = await directUsbPrinterService.printRaw(rawBytes);
        if (printed) {
          return true;
        }
      } catch (err) {
        console.warn('[ThermalPrintService] Falló impresión directa por USB:', err);
      }
    }

    // 4. Fallback / Modo Vista Previa estándar de Chrome
    const html = this.generateTicketHTML(options);
    const rawSaleId = options.sale && '_id' in options.sale && typeof (options.sale as { _id?: unknown })._id === 'string'
      ? (options.sale as { _id: string })._id
      : (options.sale?.id || '');
    const folio = options.sale?.folio || (options.isTest ? 'NV-000425' : `NV-${rawSaleId.slice(-6).padStart(6, '0')}`);

    await printEngine.printThermal(html, {
      width: options.settings.paperWidth || '58mm',
      title: `Ticket #${folio}`,
    });
    return false;
  },

  /**
   * Imprime un ticket de prueba para calibrar márgenes y verificar conexión física.
   */
  async printTestTicket(settings: PrinterSettings, branchName?: string, sellerName?: string): Promise<boolean> {
    return this.print({
      settings,
      branchName,
      sellerName,
      isTest: true,
    });
  },

  /**
   * Imprime ticket térmico de recepción de vehículo en taller (58mm / 80mm).
   */
  async printReceptionTicket(
    order: AdminMaintenanceOrder,
    settings: PrinterSettings,
    branchName?: string,
    receiverName?: string
  ): Promise<boolean> {
    const mode = settings.printMode || 'local_agent';
    const targetPrinter = settings.ticketPrinter || settings.printerName || 'POS-58';

    if (mode === 'local_agent') {
      try {
        const rawBytes = generateReceptionTicketEscPos(order, settings, branchName, receiverName);
        const printed = await localAgentPrinterService.printRawTicket(targetPrinter, rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    if (mode === 'bluetooth') {
      try {
        const rawBytes = generateReceptionTicketEscPos(order, settings, branchName, receiverName);
        const printed = await webBluetoothPrinterService.printRaw(rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    if (mode === 'usb_serial') {
      try {
        const rawBytes = generateReceptionTicketEscPos(order, settings, branchName, receiverName);
        const printed = await directUsbPrinterService.printRaw(rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    const html = generateReceptionTicketHtml(order, settings, branchName, receiverName);
    const folio = order.folio || (order.id ? order.id.slice(-6).toUpperCase() : '000001');

    await printEngine.printThermal(html, {
      width: settings.paperWidth || '58mm',
      title: `Ticket Recepción #${folio}`,
    });
    return false;
  },

  /**
   * Imprime ticket térmico de recordatorio de cita (58mm / 80mm).
   */
  async printAppointmentTicket(
    appt: Appointment,
    settings: PrinterSettings,
    branchName?: string
  ): Promise<boolean> {
    const mode = settings.printMode || 'local_agent';
    const targetPrinter = settings.ticketPrinter || settings.printerName || 'POS-58';

    if (mode === 'local_agent') {
      try {
        const rawBytes = generateAppointmentTicketEscPos(appt, settings, branchName);
        const printed = await localAgentPrinterService.printRawTicket(targetPrinter, rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    if (mode === 'bluetooth') {
      try {
        const rawBytes = generateAppointmentTicketEscPos(appt, settings, branchName);
        const printed = await webBluetoothPrinterService.printRaw(rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    if (mode === 'usb_serial') {
      try {
        const rawBytes = generateAppointmentTicketEscPos(appt, settings, branchName);
        const printed = await directUsbPrinterService.printRaw(rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    const html = generateAppointmentTicketHtml(appt, settings, branchName);
    const folio = (appt.id || '').slice(-6).toUpperCase() || '000001';

    await printEngine.printThermal(html, {
      width: settings.paperWidth || '58mm',
      title: `Ticket Cita #${folio}`,
    });
    return false;
  },

  /**
   * Imprime ticket térmico de pedido especial / encargo (58mm / 80mm).
   */
  async printSpecialOrderTicket(
    order: SpecialOrder,
    settings: PrinterSettings,
    branchName?: string,
    sellerName?: string
  ): Promise<boolean> {
    const mode = settings.printMode || 'local_agent';
    const targetPrinter = settings.ticketPrinter || settings.printerName || 'POS-58';

    if (mode === 'local_agent') {
      try {
        const rawBytes = generateSpecialOrderTicketEscPos(order, settings, branchName, sellerName);
        const printed = await localAgentPrinterService.printRawTicket(targetPrinter, rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    if (mode === 'bluetooth') {
      try {
        const rawBytes = generateSpecialOrderTicketEscPos(order, settings, branchName, sellerName);
        const printed = await webBluetoothPrinterService.printRaw(rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    if (mode === 'usb_serial') {
      try {
        const rawBytes = generateSpecialOrderTicketEscPos(order, settings, branchName, sellerName);
        const printed = await directUsbPrinterService.printRaw(rawBytes);
        if (printed) return true;
      } catch {
        // fallback
      }
    }

    const html = generateSpecialOrderTicketHtml({
      order,
      settings,
      branchName,
      sellerName,
    });
    const folio = order.folio || order.id?.slice(-6).toUpperCase() || 'PED-001';

    await printEngine.printThermal(html, {
      width: settings.paperWidth || '58mm',
      title: `Ticket Pedido #${folio}`,
    });
    return false;
  },
};

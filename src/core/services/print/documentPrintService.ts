/**
 * Document Print Service
 * 
 * Single Responsibility: High-level document printing coordinator.
 * Uses PrintEngine for high-fidelity cross-platform preview & printing
 * maintaining all original colors, styling, logos, and letter/A4 proportions.
 */

import type { Appointment, AdminMaintenanceOrder, SpecialOrder } from '@/app/domain';
import { printEngine } from './PrintEngine';
import { generateAppointmentDocumentHtml } from './templates/appointmentTemplates';
import { generateReceptionDocumentHtml } from './templates/receptionTemplates';
import { generateSpecialOrderDocumentHtml } from './templates/specialOrderTemplates';

export interface PrintDocumentOptions {
  title?: string;
  extraStyles?: string;
}

export interface PrintThermalOptions {
  paperWidth?: '58mm' | '80mm';
  title?: string;
}

export interface PrintLabelOptions {
  widthMm?: number;
  heightMm?: number;
  title?: string;
}

export class DocumentPrintService {
  /**
   * Abre el documento HTML en una nueva pestaña del navegador para visualizarlo completo en pantalla.
   */
  public openInNewTab(html: string, title?: string): void {
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      if (title) win.document.title = title;
    }
  }

  /**
   * Imprime el comprobante formal de cita (tamaño Carta/A4 con membrete, colores y vista previa).
   * Puede recibir el objeto Appointment directamente (generador puro) o extraerlo del DOM como fallback.
   */
  public printAppointmentVoucher(appt?: Appointment | null, branchName?: string): void {
    if (appt) {
      const html = generateAppointmentDocumentHtml(appt, branchName);
      printEngine.printDocument(html, {
        title: `Cita #${(appt.id || '').slice(-6).toUpperCase()}`,
      });
      return;
    }

    const el = document.getElementById('appointment-receipt');
    if (el) {
      printEngine.printDocument(el.innerHTML, {
        title: 'Comprobante de Cita',
      });
      return;
    }

    console.warn('[DocumentPrintService] No se encontró la cita ni el elemento #appointment-receipt para imprimir.');
  }

  /**
   * Imprime el comprobante formal de recepción de vehículo (con checklist de inventario,
   * cláusulas legales NOM-174 y firmas de entrega/recepción, con vista previa).
   * Puede recibir la orden directamente o extraer del DOM como fallback.
   */
  public printServiceReception(
    order?: AdminMaintenanceOrder | null,
    branchName?: string,
    receiverName?: string
  ): void {
    if (order) {
      const folio = order.folio || (order.id ? order.id.slice(-6).toUpperCase() : '000001');
      const html = generateReceptionDocumentHtml(order, branchName, receiverName);
      printEngine.printDocument(html, {
        title: `Recepción #${folio}`,
      });
      return;
    }

    const el = document.getElementById('service-reception-receipt');
    if (el) {
      printEngine.printDocument(el.innerHTML, {
        title: 'Comprobante de Recepción',
      });
      return;
    }

    console.warn('[DocumentPrintService] No se encontró la orden ni el elemento #service-reception-receipt para imprimir.');
  }

  /**
   * Imprime la factura / comprobante formal tamaño Carta/A4 de un Pedido Especial con vista previa y diseño original.
   */
  public printSpecialOrderInvoice(
    order: SpecialOrder,
    branchName?: string,
    sellerName?: string,
    businessName?: string
  ): void {
    const folio = order.folio || order.id?.slice(-6).toUpperCase() || 'PED-001';
    const html = generateSpecialOrderDocumentHtml(order, branchName, sellerName, businessName);
    printEngine.printDocument(html, {
      title: `Pedido Especial #${folio}`,
      margin: '14mm 16mm',
    });
  }

  /**
   * Imprime la hoja de servicio / remisión de cobro del taller con vista previa y diseño original.
   */
  public printServiceInvoice(): void {
    const el = document.getElementById('service-invoice-receipt');
    if (el) {
      printEngine.printDocument(el.innerHTML, {
        title: 'Hoja de Servicio y Cobro',
        margin: '14mm 16mm',
      });
      return;
    }

    console.warn('[DocumentPrintService] No se encontró el elemento #service-invoice-receipt para imprimir.');
  }

  /**
   * Imprime cotización formal en hoja Carta/A4 manteniendo todo el formato gráfico original,
   * colores, desglose de servicios y previsualización.
   */
  public printQuotation(): void {
    const el = document.getElementById('quotation-receipt');
    if (el) {
      printEngine.printDocument(el.innerHTML, {
        title: 'Cotización',
        margin: '14mm 16mm',
      });
      return;
    }

    console.warn('[DocumentPrintService] No se encontró el elemento #quotation-receipt para imprimir.');
  }

  /**
   * Imprime contenido térmico en rollo continuo (58mm o 80mm).
   */
  public printThermalContent(htmlContent: string, options?: PrintThermalOptions): void {
    printEngine.printThermal(htmlContent, {
      width: options?.paperWidth || '80mm',
      title: options?.title || 'Ticket',
    });
  }

  /**
   * Imprime etiquetas adhesivas individuales (QR / Códigos de barra) con medidas exactas en milímetros
   * y previsualización gráfica.
   */
  public printLabelContent(htmlContent: string, options?: PrintLabelOptions): void {
    printEngine.printLabel(htmlContent, {
      widthMm: options?.widthMm || 101.6, // 4 pulgadas por defecto
      heightMm: options?.heightMm || 50.8, // 2 pulgadas por defecto
      title: options?.title || 'Etiqueta Adhesiva',
    });
  }

  public printTicket(): void {
    const el = document.getElementById('ticket-receipt');
    if (el) {
      this.printThermalContent(el.innerHTML, { paperWidth: '80mm', title: 'Ticket' });
    }
  }

  public printDocument(): void {
    this.printServiceReception();
  }
}

export const documentPrintService = new DocumentPrintService();

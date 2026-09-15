/**
 * Document Print Service
 * Manages body print classes and triggers browser print dialogs cleanly
 * preventing collisions between thermal 58mm tickets and full-page A4/Letter documents.
 */

export type PrintMode = 'ticket' | 'invoice' | 'document' | 'quotation' | 'appointment';

export class DocumentPrintService {
  private resetPrintModes() {
    document.body.classList.remove(
      'print-ticket-mode',
      'print-invoice-mode',
      'print-doc-mode'
    );
  }

  public printTicket(): void {
    this.resetPrintModes();
    document.body.classList.add('print-ticket-mode');
    setTimeout(() => {
      window.print();
    }, 120);
  }

  public printServiceInvoice(): void {
    this.resetPrintModes();
    document.body.classList.add('print-invoice-mode');
    setTimeout(() => {
      window.print();
    }, 120);
  }

  public printDocument(): void {
    this.resetPrintModes();
    document.body.classList.add('print-doc-mode');
    setTimeout(() => {
      window.print();
    }, 120);
  }

  public printQuotation(): void {
    this.resetPrintModes();
    document.body.classList.add('print-doc-mode');
    setTimeout(() => {
      window.print();
    }, 120);
  }

  public printAppointmentVoucher(): void {
    this.resetPrintModes();
    document.body.classList.add('print-doc-mode');
    setTimeout(() => {
      window.print();
    }, 120);
  }
}

export const documentPrintService = new DocumentPrintService();

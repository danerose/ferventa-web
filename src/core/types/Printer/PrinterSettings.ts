export type ThermalPrintMode = 'local_agent' | 'bluetooth' | 'usb_serial' | 'browser_preview';

export interface PrinterSettings {
  printerName: string;
  ticketPrinter: string;
  documentPrinter: string;
  qrPrinter: string;
  paperWidth: '58mm' | '80mm';
  printMode: ThermalPrintMode;
  autoPrintOnSale: boolean;
  fontSize: 'compact' | 'normal' | 'large';
  showFolio: boolean;
  showCashier: boolean;
  showCutLine: boolean;
  showPolicies: boolean;
  showPhone: boolean;
  showAddress: boolean;
  businessName: string;
  businessTagline: string;
  phone: string;
  address: string;
  policiesTitle: string;
  policiesText: string;
  footerMessage: string;
  footerSubtext: string;
}

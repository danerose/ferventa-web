export interface PrinterSettings {
  printerName: string;
  paperWidth: '58mm' | '80mm';
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

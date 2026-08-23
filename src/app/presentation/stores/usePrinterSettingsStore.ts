import { create } from 'zustand';

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

interface PrinterSettingsState extends PrinterSettings {
  saveSettings: (settings: Partial<PrinterSettings>) => void;
  resetDefaults: () => void;
}

const STORAGE_KEY = 'ferventa_printer_settings';

const DEFAULT_SETTINGS: PrinterSettings = {
  printerName: 'SUZWIP 58MM Thermal',
  paperWidth: '58mm',
  autoPrintOnSale: true,
  fontSize: 'normal',
  showFolio: true,
  showCashier: true,
  showCutLine: true,
  showPolicies: true,
  showPhone: true,
  showAddress: true,
  businessName: 'Moto servicio Nova FV',
  businessTagline: 'TALLER Y REFACCIONES PARA MOTOS',
  phone: '999 438 9747',
  address: 'Calle 28 No. 153 x 12 y 14, Col. Santa Bárbara, Locales 3 y 4',
  policiesTitle: 'IMPORTANTE',
  policiesText: '* En partes eléctricas no aplica garantía, cambio ni devolución.\n* Cualquier aclaración deberá realizarse dentro de los 2 días posteriores a la compra con este ticket.',
  footerMessage: '¡GRACIAS POR SU PREFERENCIA!',
  footerSubtext: 'Moto servicio Nova FV',
};

const getInitialSettings = (): PrinterSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
};

export const usePrinterSettingsStore = create<PrinterSettingsState>((set, get) => ({
  ...getInitialSettings(),

  saveSettings: (newSettings: Partial<PrinterSettings>) => {
    const updated: PrinterSettings = {
      printerName: newSettings.printerName ?? get().printerName,
      paperWidth: newSettings.paperWidth ?? get().paperWidth,
      autoPrintOnSale: newSettings.autoPrintOnSale ?? get().autoPrintOnSale,
      fontSize: newSettings.fontSize ?? get().fontSize,
      showFolio: newSettings.showFolio ?? get().showFolio,
      showCashier: newSettings.showCashier ?? get().showCashier,
      showCutLine: newSettings.showCutLine ?? get().showCutLine,
      showPolicies: newSettings.showPolicies ?? get().showPolicies,
      showPhone: newSettings.showPhone ?? get().showPhone,
      showAddress: newSettings.showAddress ?? get().showAddress,
      businessName: newSettings.businessName ?? get().businessName,
      businessTagline: newSettings.businessTagline ?? get().businessTagline,
      phone: newSettings.phone ?? get().phone,
      address: newSettings.address ?? get().address,
      policiesTitle: newSettings.policiesTitle ?? get().policiesTitle,
      policiesText: newSettings.policiesText ?? get().policiesText,
      footerMessage: newSettings.footerMessage ?? get().footerMessage,
      footerSubtext: newSettings.footerSubtext ?? get().footerSubtext,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set(updated);
  },

  resetDefaults: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set(DEFAULT_SETTINGS);
  },
}));

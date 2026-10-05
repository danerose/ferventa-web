import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  Badge,
  Card,
  PrimaryButton,
  SecondaryButton,
  Toggle,
  Checkbox,
  TextInput,
  Textarea,
  Select,
  Icon,
  PageLayout,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { useThemeStore } from '@/app/presentation/stores';
import { usePrinterSettingsStore } from '@/app/presentation/stores';
import {
  thermalPrintService,
  webBluetoothPrinterService,
  directUsbPrinterService,
  localAgentPrinterService,
  printEngine,
} from '@/core/services';
import { branchUseCases } from '@/core/di/container';
import { ThemeMode } from '@/core/enums/methods/ThemeMode';
import type { Branch } from '@/app/domain';
import type { ThermalPrintMode } from '@/core/types';

type ActiveSettingsTab = 'system' | 'business' | 'printer';

export const SettingsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const currentThemeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const saveSettings = usePrinterSettingsStore((s) => s.saveSettings);
  const resetDefaults = usePrinterSettingsStore((s) => s.resetDefaults);

  const [activeTab, setActiveTab] = useState<ActiveSettingsTab>('printer');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Estado local para configuración de impresora inicializado perezosamente desde el store
  const [printerName, setPrinterName] = useState(() => usePrinterSettingsStore.getState().printerName);
  const [ticketPrinter, setTicketPrinter] = useState(() => usePrinterSettingsStore.getState().ticketPrinter || '');
  const [documentPrinter, setDocumentPrinter] = useState(() => usePrinterSettingsStore.getState().documentPrinter || '');
  const [qrPrinter, setQrPrinter] = useState(() => usePrinterSettingsStore.getState().qrPrinter || '');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(() => usePrinterSettingsStore.getState().paperWidth);
  const [printMode, setPrintMode] = useState<ThermalPrintMode>(() => usePrinterSettingsStore.getState().printMode || 'local_agent');
  const [autoPrintOnSale, setAutoPrintOnSale] = useState(() => usePrinterSettingsStore.getState().autoPrintOnSale);
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>(() => usePrinterSettingsStore.getState().fontSize);
  const [showFolio, setShowFolio] = useState(() => usePrinterSettingsStore.getState().showFolio);
  const [showCashier, setShowCashier] = useState(() => usePrinterSettingsStore.getState().showCashier);
  const [showCutLine, setShowCutLine] = useState(() => usePrinterSettingsStore.getState().showCutLine);
  const [showPolicies, setShowPolicies] = useState(() => usePrinterSettingsStore.getState().showPolicies);
  const [showPhone, setShowPhone] = useState(() => usePrinterSettingsStore.getState().showPhone);
  const [showAddress, setShowAddress] = useState(() => usePrinterSettingsStore.getState().showAddress);

  // Estados de conexión en tiempo real para Agente Windows, Bluetooth y USB
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentPrinters, setAgentPrinters] = useState<string[]>([]);
  const [checkingAgent, setCheckingAgent] = useState(false);
  const [btConnected, setBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [btLoading, setBtLoading] = useState(false);
  const [usbPaired, setUsbPaired] = useState(false);
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [usbLoading, setUsbLoading] = useState(false);
  const [testPrintFeedback, setTestPrintFeedback] = useState<string | null>(null);

  // Textos y políticas personalizables por el Admin
  const [businessName, setBusinessName] = useState(() => usePrinterSettingsStore.getState().businessName);
  const [businessTagline, setBusinessTagline] = useState(() => usePrinterSettingsStore.getState().businessTagline);
  const [phone, setPhone] = useState(() => usePrinterSettingsStore.getState().phone);
  const [address, setAddress] = useState(() => usePrinterSettingsStore.getState().address);
  const [policiesTitle, setPoliciesTitle] = useState(() => usePrinterSettingsStore.getState().policiesTitle || 'IMPORTANTE');
  const [policiesText, setPoliciesText] = useState(
    () => usePrinterSettingsStore.getState().policiesText ||
      '* En partes eléctricas no aplica garantía, cambio ni devolución.\n* Cualquier aclaración dentro de los 2 días posteriores con este ticket.'
  );
  const [footerMessage, setFooterMessage] = useState(() => usePrinterSettingsStore.getState().footerMessage || '¡GRACIAS POR SU PREFERENCIA!');
  const [footerSubtext, setFooterSubtext] = useState(() => usePrinterSettingsStore.getState().footerSubtext || 'Moto servicio Nova FV');

  const [showSafariHelp, setShowSafariHelp] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Consulta el agente local de Windows y carga todas las impresoras reales
  const checkAgentAndLoadPrinters = useCallback(async () => {
    setCheckingAgent(true);
    try {
      const running = await localAgentPrinterService.isAgentRunning();
      setAgentRunning(running);
      if (running) {
        const list = await localAgentPrinterService.getInstalledPrinters();
        setAgentPrinters(list);
        if (list.length > 0) {
          setTicketPrinter((prev) => {
            if (prev && list.includes(prev)) return prev;
            const matched = list.find((p) => p.toLowerCase().includes('58') || p.toLowerCase().includes('pos') || p.toLowerCase().includes('suzwip')) || list[0];
            return matched;
          });
          setDocumentPrinter((prev) => {
            if (prev && list.includes(prev)) return prev;
            const matchedDoc = list.find((p) => !p.toLowerCase().includes('58') && !p.toLowerCase().includes('pos')) || list[0];
            return matchedDoc;
          });
          setQrPrinter((prev) => {
            if (prev && list.includes(prev)) return prev;
            return list[0];
          });
        }
      }
    } catch (err) {
      console.warn('Error al verificar agente local:', err);
    } finally {
      setCheckingAgent(false);
    }
  }, []);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const list = await branchUseCases.getBranches();
        if (list && list.length > 0) {
          setBranches(list);
        }
      } catch (err) {
        console.error('Error al cargar sucursales:', err);
      }
    };
    loadBranches();

    // Comprobar estado de agente local
    checkAgentAndLoadPrinters();

    // Comprobar estado de conexiones de hardware alternativas
    setBtConnected(webBluetoothPrinterService.isConnected());
    setBtDeviceName(webBluetoothPrinterService.getDeviceName());

    if (directUsbPrinterService.isSupported()) {
      directUsbPrinterService.isPortPaired().then((paired) => {
        setUsbPaired(paired);
        if (paired) {
          directUsbPrinterService.getPairedDeviceName().then(setUsbDeviceName);
        }
      });
    }

    // Intervalo de sondeo suave para detectar si el usuario acaba de abrir el .exe
    const interval = setInterval(() => {
      localAgentPrinterService.isAgentRunning().then((running) => {
        setAgentRunning((prev) => {
          if (!prev && running) {
            checkAgentAndLoadPrinters();
          }
          return running;
        });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [checkAgentAndLoadPrinters]);

  const handlePairBluetooth = async () => {
    setBtLoading(true);
    try {
      const success = await webBluetoothPrinterService.requestAndPairDevice();
      if (success) {
        setBtConnected(true);
        const name = webBluetoothPrinterService.getDeviceName();
        setBtDeviceName(name);
        if (name) setPrinterName(name);
        setPrintMode('bluetooth');
        saveSettings({ printMode: 'bluetooth', ...(name ? { printerName: name } : {}) });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Aviso de conexión Bluetooth: ' + msg);
    } finally {
      setBtLoading(false);
    }
  };

  const handleDisconnectBluetooth = () => {
    webBluetoothPrinterService.disconnect();
    setBtConnected(false);
    setBtDeviceName(null);
  };

  const handlePairUsb = async () => {
    setUsbLoading(true);
    try {
      const success = await directUsbPrinterService.requestAndPairPort();
      if (success) {
        setUsbPaired(true);
        const name = await directUsbPrinterService.getPairedDeviceName();
        setUsbDeviceName(name);
        if (name) setPrinterName(name);
        setPrintMode('usb_serial');
        saveSettings({ printMode: 'usb_serial', ...(name ? { printerName: name } : {}) });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Aviso de conexión USB: ' + msg);
    } finally {
      setUsbLoading(false);
    }
  };

  const handleDisconnectUsb = () => {
    directUsbPrinterService.forgetPort();
    setUsbPaired(false);
    setUsbDeviceName(null);
  };

  const activeBranch = useMemo(() => {
    if (!branches || branches.length === 0) return null;
    return branches.find((b) => b.id === activeBranchId) || branches[0];
  }, [branches, activeBranchId]);

  const activeBranchName = activeBranch ? activeBranch.name : 'Sucursal Principal';

  const handleSaveAllSettings = () => {
    saveSettings({
      printerName,
      ticketPrinter,
      documentPrinter,
      qrPrinter,
      paperWidth,
      printMode,
      autoPrintOnSale,
      fontSize,
      showFolio,
      showCashier,
      showCutLine,
      showPolicies,
      showPhone,
      showAddress,
      businessName,
      businessTagline,
      phone,
      address,
      policiesTitle,
      policiesText,
      footerMessage,
      footerSubtext,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    resetDefaults();
    setPrinterName('SUZWIP 58MM Thermal');
    setTicketPrinter('');
    setDocumentPrinter('');
    setQrPrinter('');
    setPaperWidth('58mm');
    setPrintMode('local_agent');
    setAutoPrintOnSale(true);
    setFontSize('normal');
    setShowFolio(true);
    setShowCashier(true);
    setShowCutLine(true);
    setShowPolicies(true);
    setShowPhone(true);
    setShowAddress(true);
    setBusinessName('Moto servicio Nova FV');
    setBusinessTagline('TALLER Y REFACCIONES PARA MOTOS');
    setPhone('999 438 9747');
    setAddress('Calle 28 No. 153 x 12 y 14, Col. Santa Bárbara, Locales 3 y 4');
    setPoliciesTitle('IMPORTANTE');
    setPoliciesText(
      '* En partes eléctricas no aplica garantía, cambio ni devolución.\n* Cualquier aclaración dentro de los 2 días posteriores con este ticket.'
    );
    setFooterMessage('¡GRACIAS POR SU PREFERENCIA!');
    setFooterSubtext('Moto servicio Nova FV');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePrintTestTicket = async (targetOverride?: string) => {
    const target = targetOverride || ticketPrinter || printerName || 'SUZWIP';
    setTestPrintFeedback(`Enviando ticket a ${target}...`);
    const printedSilently = await thermalPrintService.printTestTicket(
      {
        printerName: target,
        ticketPrinter: target,
        documentPrinter,
        qrPrinter,
        paperWidth,
        printMode,
        autoPrintOnSale,
        fontSize,
        showFolio,
        showCashier,
        showCutLine,
        showPolicies,
        showPhone,
        showAddress,
        businessName,
        businessTagline,
        phone,
        address,
        policiesTitle,
        policiesText,
        footerMessage,
        footerSubtext,
      },
      activeBranchName,
      user?.name || 'Cajero'
    );

    if (printedSilently) {
      setTestPrintFeedback(`¡Ticket impreso en silencio en: ${target}!`);
    } else {
      setTestPrintFeedback('Ticket enviado a imprimir mediante el navegador.');
    }
    setTimeout(() => setTestPrintFeedback(null), 5000);
  };

  const handlePrintTestDocument = () => {
    // Genera la muestra formal de Cotización idéntica al PDF original con todos los colores y diseño
    const sampleHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Cotización - Vista Previa</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
        .biz-title { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
        .doc-type { font-size: 16px; font-weight: 600; color: #475569; margin-top: 4px; }
        .meta-info { font-size: 12px; color: #64748b; margin-top: 6px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
        .table th { border-bottom: 2px solid #cbd5e1; padding: 10px 8px; text-align: left; font-weight: 700; color: #334155; }
        .table td { padding: 12px 8px; border-bottom: 1px solid #f1f5f9; }
        .tag-service { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #fef3c7; color: #d97706; margin-top: 2px; }
        .tag-supply { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e0f2fe; color: #0284c7; margin-top: 2px; }
        .totals-table { margin-left: auto; width: 280px; margin-top: 24px; font-size: 14px; }
        .totals-table td { padding: 6px 0; }
        .total-row { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 8px; }
        .footer { text-align: center; margin-top: 48px; font-size: 11px; color: #94a3b8; }
      </style></head><body>
        <div class="header">
          <div class="biz-title">${businessName || 'Moto Servicio Nova FV'}</div>
          <div class="doc-type">Cotización</div>
          <div class="meta-info">Fecha: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}</div>
          <div class="meta-info">Sucursal: ${activeBranchName}</div>
        </div>
        <table class="table">
          <thead><tr><th>Cant.</th><th>Descripción</th><th style="text-align: right;">P. Unitario</th><th style="text-align: right;">Importe</th></tr></thead>
          <tbody>
            <tr><td>2</td><td><strong>Agua De Batería</strong><br><span style="font-size: 11px; color: #64748b;">SKU: 180605</span></td><td style="text-align: right;">$75.00</td><td style="text-align: right;">$150.00</td></tr>
            <tr><td>2</td><td><strong>Aceite Repsol 4T semisintético 10W 30</strong><br><span style="font-size: 11px; color: #64748b;">SKU: 614625</span></td><td style="text-align: right;">$224.00</td><td style="text-align: right;">$448.00</td></tr>
            <tr><td>1</td><td><strong>Servicio CFMOTO 250 SR FUN</strong><br><span class="tag-service">Servicio de taller</span></td><td style="text-align: right;">$2,300.00</td><td style="text-align: right;">$2,300.00</td></tr>
            <tr><td>1</td><td><span style="padding-left: 12px; color: #64748b;">• Aceite Motul 5000 20W50</span><br><span style="padding-left: 12px;" class="tag-supply">Consumible</span></td><td style="text-align: right; color: #94a3b8;">$198.00</td><td style="text-align: right; color: #94a3b8;">$198.00</td></tr>
            <tr><td>1</td><td><span style="padding-left: 12px; color: #64748b;">• Bujía CR8E</span><br><span style="padding-left: 12px;" class="tag-supply">Consumible</span></td><td style="text-align: right; color: #94a3b8;">$120.00</td><td style="text-align: right; color: #94a3b8;">$120.00</td></tr>
          </tbody>
        </table>
        <table class="totals-table">
          <tr><td>Subtotal:</td><td style="text-align: right;">$3,216.00</td></tr>
          <tr><td>IVA (No aplicable):</td><td style="text-align: right;">$0.00</td></tr>
          <tr class="total-row"><td>Total:</td><td style="text-align: right;">$3,216.00</td></tr>
        </table>
        <div class="footer">
          <p>Precios y disponibilidad sujetos a cambio sin previo aviso.</p>
          <p>¡Gracias por su preferencia!</p>
        </div>
      </body></html>
    `;
    printEngine.printDocument(sampleHtml, { title: 'Cotización - Previsualización' });
  };

  const handlePrintTestQr = () => {
    const sampleHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiqueta QR</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 14px; text-align: center; color: #000; background: #fff; }
        .box { border: 2px dashed #000; padding: 14px; display: inline-block; border-radius: 8px; }
        .title { font-size: 12px; font-weight: bold; margin-bottom: 6px; letter-spacing: 0.5px; }
        .code { font-size: 26px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }
        .info { font-size: 11px; margin-top: 4px; font-weight: 600; }
        .date { font-size: 9px; color: #666; margin-top: 2px; }
      </style></head><body>
        <div class="box">
          <div class="title">${businessName || 'FERVENTA MOTO SERVICIO'}</div>
          <div class="code">[ ■■■ QR ■■■ ]</div>
          <div class="info">ID: REF-00429</div>
          <div class="date">${new Date().toLocaleDateString('es-MX')}</div>
        </div>
      </body></html>
    `;
    printEngine.printLabel(sampleHtml, { widthMm: 70, heightMm: 50, title: 'Etiqueta QR' });
  };

  const liveFontSizePx = fontSize === 'compact' ? '9px' : fontSize === 'large' ? '12px' : '10px';
  const livePoliciesLines = policiesText.split('\n').filter((l) => l.trim().length > 0);

  return (
    <PageLayout userName={user?.name || 'Admin'}>
      <Flex as="header" justify="between" align="center" className="bg-base-100 px-7 py-4 border-b border-base-300 shadow-xs">
        <Box>
          <Heading level={1} className="text-xl font-bold text-base-content m-0">
            Ajustes del Sistema
          </Heading>
          <Text size="xs" variant="muted" className="mt-1">
            Configuración general de la plataforma, modo visual, datos de sucursal e impresión
          </Text>
        </Box>
        <Flex gap="sm" align="center">
          {savedSuccess && (
            <Badge variant="success" size="sm" className="gap-1 animate-fade-in mt-1">
              <Icon name="Check" size="xs" />
              Cambios Guardados
            </Badge>
          )}
          <SecondaryButton
            size="sm"
            onClick={handleResetDefaults}
            iconStart={<Icon name="RotateCcw" size="xs" />}
          >
            Restaurar
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={handleSaveAllSettings}
            iconStart={<Icon name="Save" size="xs" />}
          >
            Guardar Cambios
          </PrimaryButton>
        </Flex>
      </Flex>

      <Flex gap="lg" className="bg-base-100 border-b border-base-300 px-7">
        <SecondaryButton
          size="sm"
          color={activeTab === 'system' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('system')}
          className={`py-4 rounded-none border-b-2 ${activeTab === 'system' ? 'border-primary text-primary font-bold' : 'border-transparent text-base-content/60'
            }`}
          iconStart={<Icon name="Monitor" size="xs" />}
        >
          Sistema & Diagnóstico
        </SecondaryButton>
        <SecondaryButton
          size="sm"
          color={activeTab === 'business' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('business')}
          className={`py-4 rounded-none border-b-2 ${activeTab === 'business' ? 'border-primary text-primary font-bold' : 'border-transparent text-base-content/60'
            }`}
          iconStart={<Icon name="Store" size="xs" />}
        >
          Datos del Negocio
        </SecondaryButton>
        <SecondaryButton
          size="sm"
          color={activeTab === 'printer' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('printer')}
          className={`py-4 rounded-none border-b-2 ${activeTab === 'printer' ? 'border-primary text-primary font-bold' : 'border-transparent text-base-content/60'
            }`}
          iconStart={<Icon name="Printer" size="xs" />}
        >
          Impresora & Tickets
          <Badge variant="primary" size="xs" className="ml-1.5">
            {paperWidth}
          </Badge>
        </SecondaryButton>
      </Flex>

      <main className="flex-1 p-7 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* ═════════ PESTAÑA: IMPRESORA & TICKETS ═════════ */}
        {activeTab === 'printer' && (
          <Grid cols={{ base: 1, lg: 12 }} gap="lg">
            {/* Columna Izquierda: Configuración de Impresora y Personalización de Textos */}
            <Box className="lg:col-span-7">
              <Stack gap="md">
                {/* Tarjeta 1: Enrutador de 3 Impresoras y Agente Local Windows */}
                <Card variant="elevated" padding="md" className="border-2 border-primary/20 shadow-xs">
                  <Stack gap="md">
                    {/* Encabezado Principal del Agente */}
                    <Flex justify="between" align="start" className="flex-wrap gap-4">
                      <Flex align="center" gap="sm">
                        <Box className="p-2.5 bg-primary/10 text-primary rounded-xl">
                          <Icon name="Printer" size="md" />
                        </Box>
                        <Stack gap="none">
                          <Flex align="center" gap="xs">
                            <Heading level={2} className="text-base font-bold text-base-content">
                              Enrutador de Impresión Silenciosa (3 Impresoras)
                            </Heading>
                            {agentRunning ? (
                              <Badge variant="success" size="sm" className="gap-1 font-semibold">
                                <Icon name="CheckCircle2" size="xs" /> Agente En Línea
                              </Badge>
                            ) : (
                              <Badge variant="warning" size="sm" className="gap-1 font-semibold">
                                <Icon name="AlertTriangle" size="xs" /> Agente no detectado
                              </Badge>
                            )}
                          </Flex>
                          <Text variant="caption" size="xs" className="text-base-content/60">
                            Imprime tickets de 58mm, cotizaciones en hoja Carta y etiquetas QR directamente a cada impresora sin ventanas de vista previa.
                          </Text>
                        </Stack>
                      </Flex>

                      {/* Botones de Acción: Descarga del .exe y Detección de Impresoras */}
                      <Flex gap="xs" align="center" className="flex-wrap">
                        <a
                          href="/downloads/FerventaPrintAgent.exe"
                          download="FerventaPrintAgent.exe"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-content hover:bg-primary/90 transition-all shadow-xs"
                          title="Descargar Ferventa Print Agent para Windows"
                        >
                          <Icon name="Download" size="xs" />
                          Descargar Agente (.exe)
                        </a>
                        <SecondaryButton
                          size="sm"
                          onClick={checkAgentAndLoadPrinters}
                          disabled={checkingAgent}
                          iconStart={<Icon name="RefreshCw" size="xs" className={checkingAgent ? 'animate-spin' : ''} />}
                        >
                          {checkingAgent ? 'Buscando...' : 'Detectar Impresoras'}
                        </SecondaryButton>
                      </Flex>
                    </Flex>

                    {/* Feedback en vivo de impresiones de prueba */}
                    {testPrintFeedback && (
                      <Box className="p-3 bg-primary/10 border border-primary/30 rounded-xl">
                        <Flex align="center" gap="xs">
                          <Icon name="Info" size="sm" className="text-primary shrink-0" />
                          <Text size="xs" weight="medium" className="text-primary font-semibold">
                            {testPrintFeedback}
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {/* Guía rápida si el agente aún no está en ejecución */}
                    {!agentRunning && (
                      <Box className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <Flex gap="sm" align="start">
                          <Icon name="AlertCircle" size="sm" className="text-amber-500 shrink-0 mt-0.5" />
                          <Stack gap="xs">
                            <Text weight="bold" size="xs" className="text-amber-600 dark:text-amber-400">
                              ¿Cómo activar la impresión automática en las 3 impresoras?
                            </Text>
                            <Text size="xs" className="text-base-content/80 leading-relaxed">
                              1. Haz clic en el botón azul <strong>Descargar Agente (.exe)</strong> arriba.<br />
                              2. Ejecútalo una sola vez en esta computadora con Windows (se iniciará en segundo plano junto al reloj y arrancará solo cada vez que prendas la PC).<br />
                              3. Haz clic en <strong>Detectar Impresoras</strong> para asignar cada tarea a su impresora correspondiente.<br />
                              <span className="text-base-content/60 text-[11px] mt-1 block">
                                💡 <em>Para desinstalarlo en cualquier momento: clic derecho en el ícono junto al reloj de Windows → «Desinstalar Agente de esta PC» o ejecutando con <code className="text-xs bg-base-300 px-1 rounded">--uninstall</code>.</em>
                              </span>
                            </Text>
                          </Stack>
                        </Flex>
                      </Box>
                    )}

                    {/* ═══════ LOS 3 SELECTORES INTELIGENTES ═══════ */}
                    <Stack gap="sm">
                      <Text as="label" variant="label" size="xs" className="text-base-content font-bold uppercase tracking-wider text-base-content/70">
                        Asignación de Dispositivos por Tarea
                      </Text>

                      <Grid cols={{ base: 1, md: 3 }} gap="md">
                        {/* Selector 1: Tickets de Venta */}
                        <Box className="p-3.5 bg-base-200/80 border border-base-300 rounded-xl flex flex-col justify-between gap-3">
                          <Stack gap="xs">
                            <Flex justify="between" align="center">
                              <Flex align="center" gap="xs">
                                <Icon name="Receipt" size="sm" className="text-primary" />
                                <Text weight="bold" size="xs" className="text-base-content">
                                  1. Tickets de Venta
                                </Text>
                              </Flex>
                              <Badge variant="primary" size="xs">58mm</Badge>
                            </Flex>
                            <Text variant="caption" size="xs" className="text-base-content/60">
                              Impresora térmica SUZWIP 58MM u otra mini-térmica.
                            </Text>

                            {agentPrinters.length > 0 ? (
                              <Select
                                size="sm"
                                value={ticketPrinter}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTicketPrinter(val);
                                  setPrinterName(val);
                                  saveSettings({ ticketPrinter: val, printerName: val });
                                }}
                              >
                                <option value="">-- Seleccionar Impresora --</option>
                                {agentPrinters.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </Select>
                            ) : (
                              <TextInput
                                value={ticketPrinter || printerName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTicketPrinter(val);
                                  setPrinterName(val);
                                  saveSettings({ ticketPrinter: val, printerName: val });
                                }}
                                placeholder="Ej. POS-58 o SUZWIP"
                              />
                            )}
                          </Stack>

                          <SecondaryButton
                            size="xs"
                            onClick={() => handlePrintTestTicket(ticketPrinter)}
                            iconStart={<Icon name="Printer" size="xs" />}
                            className="w-full font-semibold"
                          >
                            Imprimir Ticket Silencioso (58mm)
                          </SecondaryButton>
                        </Box>

                        {/* Selector 2: Cotizaciones y Citas */}
                        <Box className="p-3.5 bg-base-200/80 border border-base-300 rounded-xl flex flex-col justify-between gap-3">
                          <Stack gap="xs">
                            <Flex justify="between" align="center">
                              <Flex align="center" gap="xs">
                                <Icon name="FileText" size="sm" className="text-info" />
                                <Text weight="bold" size="xs" className="text-base-content">
                                  2. Cotizaciones y Citas
                                </Text>
                              </Flex>
                              <Badge variant="info" size="xs">PDF Carta</Badge>
                            </Flex>
                            <Text variant="caption" size="xs" className="text-base-content/60">
                              Abre vista previa a color para revisar, guardar en PDF o imprimir en hoja Carta.
                            </Text>

                            {agentPrinters.length > 0 ? (
                              <Select
                                size="sm"
                                value={documentPrinter}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDocumentPrinter(val);
                                  saveSettings({ documentPrinter: val });
                                }}
                              >
                                <option value="">-- Seleccionar Impresora Predeterminada --</option>
                                {agentPrinters.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </Select>
                            ) : (
                              <TextInput
                                value={documentPrinter}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDocumentPrinter(val);
                                  saveSettings({ documentPrinter: val });
                                }}
                                placeholder="Ej. Brother DCP-T430W o HP LaserJet"
                              />
                            )}
                          </Stack>

                          <SecondaryButton
                            size="xs"
                            onClick={() => handlePrintTestDocument()}
                            iconStart={<Icon name="Eye" size="xs" />}
                            className="w-full font-semibold"
                          >
                            Previsualizar Cotización PDF
                          </SecondaryButton>
                        </Box>

                        {/* Selector 3: QR y Etiquetas */}
                        <Box className="p-3.5 bg-base-200/80 border border-base-300 rounded-xl flex flex-col justify-between gap-3">
                          <Stack gap="xs">
                            <Flex justify="between" align="center">
                              <Flex align="center" gap="xs">
                                <Icon name="QrCode" size="sm" className="text-accent" />
                                <Text weight="bold" size="xs" className="text-base-content">
                                  3. QR y Etiquetas
                                </Text>
                              </Flex>
                              <Badge variant="accent" size="xs">Etiquetas</Badge>
                            </Flex>
                            <Text variant="caption" size="xs" className="text-base-content/60">
                              Abre vista previa del código QR con medidas para sticker adhesivo.
                            </Text>

                            {agentPrinters.length > 0 ? (
                              <Select
                                size="sm"
                                value={qrPrinter}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQrPrinter(val);
                                  saveSettings({ qrPrinter: val });
                                }}
                              >
                                <option value="">-- Seleccionar Impresora --</option>
                                {agentPrinters.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </Select>
                            ) : (
                              <TextInput
                                value={qrPrinter}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQrPrinter(val);
                                  saveSettings({ qrPrinter: val });
                                }}
                                placeholder="Ej. Zebra, Xprinter o SUZWIP"
                              />
                            )}
                          </Stack>

                          <SecondaryButton
                            size="xs"
                            onClick={() => handlePrintTestQr()}
                            iconStart={<Icon name="Eye" size="xs" />}
                            className="w-full font-semibold"
                          >
                            Previsualizar Etiqueta QR
                          </SecondaryButton>
                        </Box>
                      </Grid>
                    </Stack>

                    {/* Métodos Alternativos Directos en Navegador (Bluetooth / Cable USB / Vista Previa) */}
                    <Stack gap="xs" className="pt-2 border-t border-base-300/60">
                      <Text as="label" variant="label" size="xs" className="text-base-content/70 font-semibold">
                        Método de Comunicación para Tickets (Hardware Alternativo)
                      </Text>
                      <Grid cols={{ base: 1, md: 4 }} gap="sm">
                        {/* Opción 1: Agente Local Windows */}
                        <Box
                          onClick={() => {
                            setPrintMode('local_agent');
                            saveSettings({ printMode: 'local_agent' });
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            printMode === 'local_agent' ? 'border-primary bg-primary/10 shadow-xs' : 'border-base-300 bg-base-200 hover:bg-base-300/40'
                          }`}
                        >
                          <Flex justify="between" align="start">
                            <Stack gap="xs">
                              <Flex align="center" gap="xs">
                                <Icon name="Cpu" size="xs" className="text-primary" />
                                <Text weight="bold" size="xs" className="text-base-content">
                                  Agente Windows
                                </Text>
                              </Flex>
                              <Text variant="caption" size="xs" className="text-base-content/60">
                                Recomendado. Silencioso en las 3 impresoras.
                              </Text>
                            </Stack>
                            {printMode === 'local_agent' && (
                              <Box className="p-1 bg-primary text-primary-content rounded-full">
                                <Icon name="Check" size="xs" />
                              </Box>
                            )}
                          </Flex>
                        </Box>

                        {/* Opción 2: Bluetooth */}
                        <Box
                          onClick={() => {
                            setPrintMode('bluetooth');
                            saveSettings({ printMode: 'bluetooth' });
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            printMode === 'bluetooth' ? 'border-primary bg-primary/10 shadow-xs' : 'border-base-300 bg-base-200 hover:bg-base-300/40'
                          }`}
                        >
                          <Flex justify="between" align="start">
                            <Stack gap="xs">
                              <Flex align="center" gap="xs">
                                <Icon name="Bluetooth" size="xs" className="text-primary" />
                                <Text weight="bold" size="xs" className="text-base-content">
                                  Bluetooth Directo
                                </Text>
                              </Flex>
                              <Text variant="caption" size="xs" className="text-base-content/60">
                                Inalámbrico en Chrome para tickets sin instalar nada.
                              </Text>
                            </Stack>
                            {printMode === 'bluetooth' && (
                              <Box className="p-1 bg-primary text-primary-content rounded-full">
                                <Icon name="Check" size="xs" />
                              </Box>
                            )}
                          </Flex>
                        </Box>

                        {/* Opción 3: USB / Serie */}
                        <Box
                          onClick={() => {
                            setPrintMode('usb_serial');
                            saveSettings({ printMode: 'usb_serial' });
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            printMode === 'usb_serial' ? 'border-primary bg-primary/10 shadow-xs' : 'border-base-300 bg-base-200 hover:bg-base-300/40'
                          }`}
                        >
                          <Flex justify="between" align="start">
                            <Stack gap="xs">
                              <Flex align="center" gap="xs">
                                <Icon name="Usb" size="xs" className="text-primary" />
                                <Text weight="bold" size="xs" className="text-base-content">
                                  Cable USB / COM
                                </Text>
                              </Flex>
                              <Text variant="caption" size="xs" className="text-base-content/60">
                                Directo por puerto USB en el navegador.
                              </Text>
                            </Stack>
                            {printMode === 'usb_serial' && (
                              <Box className="p-1 bg-primary text-primary-content rounded-full">
                                <Icon name="Check" size="xs" />
                              </Box>
                            )}
                          </Flex>
                        </Box>

                        {/* Opción 4: Vista Previa */}
                        <Box
                          onClick={() => {
                            setPrintMode('browser_preview');
                            saveSettings({ printMode: 'browser_preview' });
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            printMode === 'browser_preview' ? 'border-primary bg-primary/10 shadow-xs' : 'border-base-300 bg-base-200 hover:bg-base-300/40'
                          }`}
                        >
                          <Flex justify="between" align="start">
                            <Stack gap="xs">
                              <Flex align="center" gap="xs">
                                <Icon name="FileText" size="xs" className="text-base-content/70" />
                                <Text weight="bold" size="xs" className="text-base-content">
                                  Vista Previa
                                </Text>
                              </Flex>
                              <Text variant="caption" size="xs" className="text-base-content/60">
                                Ventana estándar de Chrome (respaldo).
                              </Text>
                            </Stack>
                            {printMode === 'browser_preview' && (
                              <Box className="p-1 bg-primary text-primary-content rounded-full">
                                <Icon name="Check" size="xs" />
                              </Box>
                            )}
                          </Flex>
                        </Box>
                      </Grid>
                    </Stack>

                    {/* Paneles de Configuración Adicional si se selecciona Bluetooth o USB */}
                    {printMode === 'bluetooth' && (
                      <Box className="p-3.5 bg-base-200/70 border border-base-300 rounded-xl">
                        <Flex justify="between" align="center" className="flex-wrap gap-3">
                          <Stack gap="xs">
                            <Flex align="center" gap="sm">
                              <Text weight="bold" size="xs" className="text-base-content">
                                Estado Bluetooth Directo:
                              </Text>
                              {btConnected ? (
                                <Badge variant="success" size="sm" className="gap-1">
                                  <Icon name="CheckCircle" size="xs" />
                                  Conectada: {btDeviceName || ticketPrinter || printerName}
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm" className="gap-1">
                                  <Icon name="AlertCircle" size="xs" />
                                  No conectada
                                </Badge>
                              )}
                            </Flex>
                            <Text variant="caption" size="xs" className="text-base-content/70">
                              Enciende la mini-impresora. Haz clic en conectar y selecciónala en el diálogo de Chrome (PIN: 1234 o 0000).
                            </Text>
                          </Stack>

                          <Flex gap="xs">
                            {btConnected ? (
                              <SecondaryButton
                                size="sm"
                                onClick={handleDisconnectBluetooth}
                                iconStart={<Icon name="Unplug" size="xs" />}
                              >
                                Desconectar
                              </SecondaryButton>
                            ) : (
                              <PrimaryButton
                                size="sm"
                                onClick={handlePairBluetooth}
                                disabled={btLoading}
                                iconStart={<Icon name="Bluetooth" size="xs" />}
                              >
                                {btLoading ? 'Buscando...' : 'Vincular Bluetooth'}
                              </PrimaryButton>
                            )}
                          </Flex>
                        </Flex>
                      </Box>
                    )}

                    {printMode === 'usb_serial' && (
                      <Box className="p-3.5 bg-base-200/70 border border-base-300 rounded-xl">
                        <Flex justify="between" align="center" className="flex-wrap gap-3">
                          <Stack gap="xs">
                            <Flex align="center" gap="sm">
                              <Text weight="bold" size="xs" className="text-base-content">
                                Estado Cable USB Directo:
                              </Text>
                              {usbPaired ? (
                                <Badge variant="success" size="sm" className="gap-1">
                                  <Icon name="CheckCircle" size="xs" />
                                  Puerto Vinculado: {usbDeviceName || ticketPrinter || printerName}
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm" className="gap-1">
                                  <Icon name="AlertCircle" size="xs" />
                                  No vinculado
                                </Badge>
                              )}
                            </Flex>
                            <Text variant="caption" size="xs" className="text-base-content/70">
                              Conecta el cable USB de la impresora a este equipo y selecciona el puerto en la ventana emergente.
                            </Text>
                          </Stack>

                          <Flex gap="xs">
                            {usbPaired ? (
                              <SecondaryButton
                                size="sm"
                                onClick={handleDisconnectUsb}
                                iconStart={<Icon name="Unplug" size="xs" />}
                              >
                                Cambiar Puerto
                              </SecondaryButton>
                            ) : (
                              <PrimaryButton
                                size="sm"
                                onClick={handlePairUsb}
                                disabled={usbLoading}
                                iconStart={<Icon name="Usb" size="xs" />}
                              >
                                {usbLoading ? 'Vinculando...' : 'Vincular Puerto USB'}
                              </PrimaryButton>
                            )}
                          </Flex>
                        </Flex>
                      </Box>
                    )}

                    {/* Ancho de Papel / Rollo */}
                    <Stack gap="xs">
                      <Text as="label" variant="label" size="xs" className="text-base-content">
                        Ancho de Papel / Rollo
                      </Text>
                      <Grid cols={2} gap="sm">
                        <Box
                          onClick={() => setPaperWidth('58mm')}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${paperWidth === '58mm' ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
                            }`}
                        >
                          <Flex justify="between" align="start">
                            <Stack gap="xs">
                              <Text weight="bold" size="sm" className="text-base-content">
                                58 mm (Recomendado)
                              </Text>
                              <Text variant="caption" size="xs" className="text-base-content/60">
                                Para SUZWIP 58MM, mini térmicas Bluetooth/USB y rollo angosto.
                              </Text>
                            </Stack>
                            {paperWidth === '58mm' && (
                              <Box className="p-1 bg-primary text-primary-content rounded-full">
                                <Icon name="Check" size="xs" />
                              </Box>
                            )}
                          </Flex>
                        </Box>

                        <Box
                          onClick={() => setPaperWidth('80mm')}
                          className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${paperWidth === '80mm' ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
                            }`}
                        >
                          <Flex justify="between" align="start">
                            <Stack gap="xs">
                              <Text weight="bold" size="sm" className="text-base-content">
                                80 mm (Estándar)
                              </Text>
                              <Text variant="caption" size="xs" className="text-base-content/60">
                                Para impresoras POS de escritorio de rollo ancho (Epson, Star, etc.).
                              </Text>
                            </Stack>
                            {paperWidth === '80mm' && (
                              <Box className="p-1 bg-primary text-primary-content rounded-full">
                                <Icon name="Check" size="xs" />
                              </Box>
                            )}
                          </Flex>
                        </Box>
                      </Grid>
                    </Stack>

                    {/* Switch: Auto-imprimir al confirmar venta */}
                    <Box className="p-3.5 bg-success/10 border border-success/30 rounded-xl">
                      <Flex justify="between" align="center">
                        <Flex align="center" gap="sm">
                          <Box className="p-2 bg-success/20 text-success rounded-lg">
                            <Icon name="Zap" size="sm" />
                          </Box>
                          <Stack gap="none">
                            <Text weight="bold" size="sm" className="text-base-content">
                              Auto-imprimir al confirmar venta
                            </Text>
                            <Text variant="caption" size="xs" className="text-success/80">
                              Al hacer clic en "Confirmar y Cobrar" en el POS, abre la impresión automáticamente.
                            </Text>
                          </Stack>
                        </Flex>
                        <Toggle
                          checked={autoPrintOnSale}
                          onChange={(e) => setAutoPrintOnSale(e.target.checked)}
                        />
                      </Flex>
                    </Box>

                    {/* Tamaño de Letra en Ticket */}
                    <Stack gap="xs">
                      <Text as="label" variant="label" size="xs" className="text-base-content">
                        Tamaño de Letra en Ticket
                      </Text>
                      <Flex gap="xs" className="bg-base-200 p-1 rounded-xl border border-base-300">
                        <SecondaryButton
                          size="sm"
                          color={fontSize === 'compact' ? 'primary' : 'default'}
                          className="flex-1"
                          onClick={() => setFontSize('compact')}
                        >
                          Compacto (8px)
                        </SecondaryButton>
                        <SecondaryButton
                          size="sm"
                          color={fontSize === 'normal' ? 'primary' : 'default'}
                          className="flex-1"
                          onClick={() => setFontSize('normal')}
                        >
                          Normal (10px - Sugerido)
                        </SecondaryButton>
                        <SecondaryButton
                          size="sm"
                          color={fontSize === 'large' ? 'primary' : 'default'}
                          className="flex-1"
                          onClick={() => setFontSize('large')}
                        >
                          Grande (12px)
                        </SecondaryButton>
                      </Flex>
                    </Stack>

                    {/* Opciones de Contenido / Checkboxes */}
                    <Grid cols={{ base: 1, sm: 3 }} gap="sm" className="pt-2 border-t border-base-300">
                      <Checkbox
                        label="Mostrar Folio (NV)"
                        checked={showFolio}
                        onChange={(e) => setShowFolio(e.target.checked)}
                      />
                      <Checkbox
                        label="Mostrar Cajero"
                        checked={showCashier}
                        onChange={(e) => setShowCashier(e.target.checked)}
                      />
                      <Checkbox
                        label="Línea de corte"
                        checked={showCutLine}
                        onChange={(e) => setShowCutLine(e.target.checked)}
                      />
                      <Checkbox
                        label="Políticas de Garantía"
                        checked={showPolicies}
                        onChange={(e) => setShowPolicies(e.target.checked)}
                      />
                      <Checkbox
                        label="Teléfono / WhatsApp"
                        checked={showPhone}
                        onChange={(e) => setShowPhone(e.target.checked)}
                      />
                      <Checkbox
                        label="Dirección Sucursal"
                        checked={showAddress}
                        onChange={(e) => setShowAddress(e.target.checked)}
                      />
                    </Grid>
                  </Stack>
                </Card>

                {/* Tarjeta 2: Editor de Textos, Saludo y Sección IMPORTANTE */}
                <Card variant="elevated" padding="md">
                  <Stack gap="md">
                    <Flex align="center" gap="sm">
                      <Box className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Icon name="Edit3" size="sm" />
                      </Box>
                      <Stack gap="none">
                        <Heading level={2} className="text-base font-bold text-base-content">
                          Personalización de Textos y Políticas del Ticket
                        </Heading>
                        <Text variant="caption" size="xs" className="text-base-content/60">
                          Modifica los avisos legales, políticas de garantía y mensaje de agradecimiento.
                        </Text>
                      </Stack>
                    </Flex>

                    <Stack gap="xs">
                      <Text as="label" variant="label" size="xs" className="text-base-content">
                        Título de la Sección de Términos / Garantía
                      </Text>
                      <TextInput
                        value={policiesTitle}
                        onChange={(e) => setPoliciesTitle(e.target.value)}
                        placeholder="IMPORTANTE"
                      />
                    </Stack>

                    <Stack gap="xs">
                      <Text as="label" variant="label" size="xs" className="text-base-content">
                        Cláusulas de Garantía y Aclaraciones (Multilínea)
                      </Text>
                      <Textarea
                        rows={4}
                        value={policiesText}
                        onChange={(e) => setPoliciesText(e.target.value)}
                        placeholder="* En partes eléctricas no aplica garantía..."
                        className="font-mono text-xs"
                      />
                      <Text variant="caption" size="xs" className="text-base-content/60">
                        Cada salto de línea aparecerá como un punto independiente en el ticket impreso.
                      </Text>
                    </Stack>

                    <Grid cols={{ base: 1, sm: 2 }} gap="md">
                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" className="text-base-content">
                          Mensaje de Despedida / Saludo
                        </Text>
                        <TextInput
                          value={footerMessage}
                          onChange={(e) => setFooterMessage(e.target.value)}
                          placeholder="¡GRACIAS POR SU PREFERENCIA!"
                        />
                      </Stack>

                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" className="text-base-content">
                          Texto Secundario de Pie
                        </Text>
                        <TextInput
                          value={footerSubtext}
                          onChange={(e) => setFooterSubtext(e.target.value)}
                          placeholder="Moto servicio Nova FV"
                        />
                      </Stack>
                    </Grid>
                  </Stack>
                </Card>

                {/* Acordeón de Ayuda para Safari / Mac */}
                <Card variant="elevated" padding="sm">
                  <Box
                    className="cursor-pointer select-none"
                    onClick={() => setShowSafariHelp(!showSafariHelp)}
                  >
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="sm">
                        <Box className="p-1.5 bg-info/10 text-info rounded-lg">
                          <Icon name="Compass" size="sm" />
                        </Box>
                        <Text weight="semibold" size="sm" className="text-base-content">
                          ¿Cómo configurar Safari / Mac para imprimir en 1 solo clic?
                        </Text>
                      </Flex>
                      <Icon
                        name={showSafariHelp ? 'ChevronUp' : 'ChevronDown'}
                        size="xs"
                        className="text-base-content/50"
                      />
                    </Flex>
                  </Box>

                  {showSafariHelp && (
                    <Box className="mt-3 pt-3 border-t border-base-300 text-xs text-base-content/80 flex flex-col gap-2">
                      <Text size="xs" className="text-base-content/80">
                        1. En Safari, al abrir la ventana de impresión, selecciona tu impresora <strong>SUZWIP 58MM</strong>.
                      </Text>
                      <Text size="xs" className="text-base-content/80">
                        2. En <strong>Tamaño de Papel (Paper Size)</strong>, selecciona o gestiona un tamaño personalizado de <strong>58mm x Auto/Continuo</strong>.
                      </Text>
                      <Text size="xs" className="text-base-content/80">
                        3. En <strong>Márgenes</strong>, selecciona <strong>Ninguno (0 mm)</strong>.
                      </Text>
                      <Text size="xs" className="text-base-content/80">
                        4. Desmarca la casilla <strong>"Imprimir encabezados y pies de página"</strong>.
                      </Text>
                      <Text size="xs" className="text-base-content/80">
                        5. En el selector de Ajustes Preestablecidos (Presets), haz clic en <strong>"Guardar como preajuste"</strong> (ej. <em>Ticket Térmico 58mm</em>) para que Safari recuerde estos parámetros automáticamente en cada cobro.
                      </Text>
                    </Box>
                  )}
                </Card>
              </Stack>
            </Box>

            {/* Columna Derecha: Simulador Térmico en Tiempo Real */}
            <Box className="lg:col-span-5">
              <Stack gap="md" className="sticky top-6">
                <Card variant="elevated" padding="md" className="flex flex-col items-center">
                  <Flex justify="between" align="center" className="w-full mb-3">
                    <Flex align="center" gap="xs">
                      <Icon name="Eye" size="xs" className="text-primary" />
                      <Text weight="bold" size="xs" className="text-base-content">
                        Vista Previa en Tiempo Real
                      </Text>
                    </Flex>
                    <Badge variant="primary" size="xs">
                      Simulador Térmico (Monocromático)
                    </Badge>
                  </Flex>

                  {/* Marco Exterior para soporte visual adaptable a dark/light */}
                  <Box className="w-full bg-base-200 rounded-2xl p-6 flex justify-center items-center border border-base-300">
                    {/* Ticket Térmico Realista: Papel Blanco con Tinta Negra Pura (SIEMPRE BLANCO) */}
                    <Box
                      style={{
                        background: '#ffffff',
                        color: '#000000',
                        width: paperWidth === '58mm' ? '260px' : '320px',
                        fontSize: liveFontSizePx,
                        lineHeight: 1.25,
                        padding: '16px 14px',
                        borderTop: '5px dashed #cbd5e1',
                        borderBottom: '5px dashed #cbd5e1',
                        borderRadius: '2px',
                        fontFamily: 'monospace',
                        userSelect: 'none',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                      }}
                    >
                      {/* Encabezado */}
                      <div style={{ textAlign: 'center', marginBottom: '6px', color: '#000000' }}>
                        <div style={{ fontSize: '8px', letterSpacing: '0.5px', color: '#000000' }}>
                          ══════════════════════════
                        </div>
                        <div style={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', color: '#000000', marginTop: '2px' }}>
                          {businessName}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#000000', marginTop: '1px' }}>
                          {businessTagline}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#000000', marginTop: '2px' }}>
                          SUCURSAL: {activeBranchName}
                        </div>
                        {showPhone && phone && (
                          <div style={{ fontSize: '9px', color: '#000000', marginTop: '1px' }}>
                            Tel./WhatsApp: {phone}
                          </div>
                        )}
                        {showAddress && address && (
                          <div style={{ fontSize: '8px', color: '#000000', marginTop: '1px', lineHeight: 1.2 }}>
                            {address}
                          </div>
                        )}
                        <div style={{ fontSize: '8px', letterSpacing: '0.5px', color: '#000000', marginTop: '2px' }}>
                          ══════════════════════════
                        </div>
                      </div>

                      {/* Metadatos */}
                      <div style={{ fontSize: '9px', color: '#000000', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>FECHA: <strong style={{ color: '#000000' }}>22/08/2026</strong></span>
                          <span>HORA: <strong style={{ color: '#000000' }}>15:37</strong></span>
                        </div>
                        {showFolio && (
                          <div style={{ marginTop: '1px' }}>
                            FOLIO: <strong style={{ color: '#000000' }}>#NV-000425</strong>
                          </div>
                        )}
                        {showCashier && (
                          <div style={{ marginTop: '1px' }}>
                            ATENDIÓ: <strong style={{ color: '#000000' }}>{user?.name || 'Cajero'}</strong>
                          </div>
                        )}
                      </div>

                      {/* Separador de tabla */}
                      <div style={{ fontSize: '8px', color: '#000000', letterSpacing: '0.5px', margin: '2px 0' }}>
                        ──────────────────────────
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '9px', color: '#000000', padding: '1px 0' }}>
                        <span style={{ minWidth: '24px' }}>CANT</span>
                        <span style={{ flex: 1, paddingLeft: '4px' }}>CONCEPTO</span>
                        <span>IMPORTE</span>
                      </div>
                      <div style={{ fontSize: '8px', color: '#000000', letterSpacing: '0.5px', margin: '2px 0' }}>
                        ──────────────────────────
                      </div>

                      {/* Items */}
                      <div style={{ margin: '3px 0', color: '#000000' }}>
                        <div style={{ marginBottom: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                            <span style={{ fontWeight: 'bold', minWidth: '24px' }}>1</span>
                            <span style={{ flex: 1, paddingLeft: '4px', fontWeight: 'bold' }}>Aceite Sintético 10W-40 4T</span>
                            <span style={{ fontWeight: 'bold' }}>$220.00</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                            <span style={{ fontWeight: 'bold', minWidth: '24px' }}>1</span>
                            <span style={{ flex: 1, paddingLeft: '4px', fontWeight: 'bold' }}>(SERV) Servicio de Afinación Mayor</span>
                            <span style={{ fontWeight: 'bold' }}>$300.00</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '8px', color: '#000000', letterSpacing: '0.5px', margin: '2px 0' }}>
                        ──────────────────────────
                      </div>

                      {/* Totales */}
                      <div style={{ color: '#000000', fontSize: '9px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                          <span>SUBTOTAL:</span>
                          <span style={{ fontWeight: 'bold' }}>$520.00</span>
                        </div>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: '12px', fontWeight: '900',
                          borderTop: '1px solid #000000', paddingTop: '3px', marginTop: '2px',
                          color: '#000000',
                        }}>
                          <span>TOTAL:</span>
                          <span>$520.00 MXN</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span>MÉTODO DE PAGO:</span>
                          <span style={{ fontWeight: 'bold' }}>EFECTIVO</span>
                        </div>
                      </div>

                      {/* Políticas de Garantía Personalizables */}
                      {showPolicies && (
                        <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #000000', textAlign: 'center', color: '#000000' }}>
                          <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '2px' }}>
                            {policiesTitle || 'IMPORTANTE'}
                          </div>
                          <div style={{ fontSize: '8px', lineHeight: 1.25, textAlign: 'left' }}>
                            {livePoliciesLines.map((line, idx) => (
                              <div key={idx} style={{ marginTop: idx > 0 ? '2px' : 0 }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pie de página */}
                      <div style={{ textAlign: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #000000', color: '#000000' }}>
                        <div style={{ fontSize: '9px', fontWeight: '900' }}>
                          {footerMessage}
                        </div>
                        {footerSubtext && (
                          <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '1px' }}>
                            {footerSubtext}
                          </div>
                        )}
                      </div>

                      {showCutLine && (
                        <div style={{ fontSize: '8px', textAlign: 'center', color: '#000000', marginTop: '8px', letterSpacing: '0.5px' }}>
                        </div>
                      )}
                    </Box>
                  </Box>

                  {/* Botón Imprimir Ticket de Prueba y Feedback */}
                  <Box className="w-full mt-4">
                    {testPrintFeedback && (
                      <Box className="mb-2 p-2.5 bg-primary/10 border border-primary/30 rounded-xl text-center">
                        <Text size="xs" weight="bold" className="text-primary animate-fade-in flex items-center justify-center gap-1.5">
                          <Icon name="CheckCircle" size="xs" />
                          {testPrintFeedback}
                        </Text>
                      </Box>
                    )}
                    <PrimaryButton
                      className="w-full justify-center"
                      onClick={() => handlePrintTestTicket()}
                    >
                      <Icon name="Printer" size="sm" className="mr-2" />
                      Imprimir Ticket de Prueba ({paperWidth} - {printMode === 'bluetooth' ? 'Bluetooth' : printMode === 'usb_serial' ? 'USB' : 'Vista Previa'})
                    </PrimaryButton>
                    <Text variant="caption" size="xs" className="text-center text-base-content/60 mt-2 block">
                      Envía este ticket a tu impresora SUZWIP para verificar alineación y corte sin diálogo del navegador.
                    </Text>
                  </Box>
                </Card>
              </Stack>
            </Box>
          </Grid>
        )}

        {/* ═════════ PESTAÑA: DATOS DEL NEGOCIO ═════════ */}
        {activeTab === 'business' && (
          <Card variant="elevated" padding="md" className="max-w-2xl">
            <Stack gap="md">
              <Flex align="center" gap="sm">
                <Box className="p-2 bg-warning/10 text-warning rounded-lg">
                  <Icon name="Home" size="sm" />
                </Box>
                <Stack gap="none">
                  <Heading level={2} className="text-base font-bold text-base-content">
                    Datos Comerciales del Taller / Negocio
                  </Heading>
                  <Text variant="caption" size="xs" className="text-base-content/60">
                    Información pública que se imprimirá en los tickets y cotizaciones.
                  </Text>
                </Stack>
              </Flex>

              <Stack gap="xs">
                <Text as="label" variant="label" size="xs" className="text-base-content">
                  Nombre Comercial de la Empresa
                </Text>
                <TextInput
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Moto servicio Nova FV"
                />
              </Stack>

              <Stack gap="xs">
                <Text as="label" variant="label" size="xs" className="text-base-content">
                  Lema o Giro Comercial
                </Text>
                <TextInput
                  value={businessTagline}
                  onChange={(e) => setBusinessTagline(e.target.value)}
                  placeholder="TALLER Y REFACCIONES PARA MOTOS"
                />
              </Stack>

              <Grid cols={{ base: 1, sm: 2 }} gap="md">
                <Stack gap="xs">
                  <Text as="label" variant="label" size="xs" className="text-base-content">
                    Teléfono / WhatsApp
                  </Text>
                  <TextInput
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="999 438 9747"
                  />
                </Stack>

                <Stack gap="xs">
                  <Text as="label" variant="label" size="xs" className="text-base-content">
                    Mensaje de Despedida / Saludo
                  </Text>
                  <TextInput
                    value={footerMessage}
                    onChange={(e) => setFooterMessage(e.target.value)}
                    placeholder="¡GRACIAS POR SU PREFERENCIA!"
                  />
                </Stack>
              </Grid>

              <Stack gap="xs">
                <Text as="label" variant="label" size="xs" className="text-base-content">
                  Dirección Fiscal o de Sucursal Principal
                </Text>
                <TextInput
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 28 No. 153 x 12 y 14..."
                />
              </Stack>

              <Flex justify="end" className="pt-3 border-t border-base-300">
                <PrimaryButton size="sm" onClick={handleSaveAllSettings}>
                  <Icon name="Save" size="xs" className="mr-1.5" />
                  Guardar Datos del Negocio
                </PrimaryButton>
              </Flex>
            </Stack>
          </Card>
        )}

        {/* ═════════ PESTAÑA: SISTEMA & DIAGNÓSTICO ═════════ */}
        {activeTab === 'system' && (
          <Stack gap="lg" className="max-w-3xl">
            <Card variant="elevated" padding="md">
              <Stack gap="md">
                <Flex align="center" gap="sm">
                  <Box className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Icon name="Sun" size="sm" />
                  </Box>
                  <Stack gap="none">
                    <Heading level={2} className="text-base font-bold text-base-content">
                      Apariencia Visual
                    </Heading>
                    <Text variant="caption" size="xs" className="text-base-content/60">
                      Selecciona el tema de la aplicación.
                    </Text>
                  </Stack>
                </Flex>

                <Grid cols={{ base: 1, sm: 3 }} gap="md">
                  <Box
                    onClick={() => setThemeMode(ThemeMode.Light)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${currentThemeMode === ThemeMode.Light ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
                      }`}
                  >
                    <Flex align="center" gap="sm">
                      <Icon name="Sun" size="sm" className="text-amber-500" />
                      <Stack gap="none">
                        <Text weight="semibold" size="sm" className="text-base-content">
                          Modo Claro
                        </Text>
                        <Text variant="caption" size="xs" className="text-base-content/60">
                          Fondo claro
                        </Text>
                      </Stack>
                    </Flex>
                  </Box>

                  <Box
                    onClick={() => setThemeMode(ThemeMode.Dark)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${currentThemeMode === ThemeMode.Dark ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
                      }`}
                  >
                    <Flex align="center" gap="sm">
                      <Icon name="Moon" size="sm" className="text-indigo-500" />
                      <Stack gap="none">
                        <Text weight="semibold" size="sm" className="text-base-content">
                          Modo Oscuro
                        </Text>
                        <Text variant="caption" size="xs" className="text-base-content/60">
                          Alto contraste
                        </Text>
                      </Stack>
                    </Flex>
                  </Box>

                  <Box
                    onClick={() => setThemeMode(ThemeMode.System)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${currentThemeMode === ThemeMode.System ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
                      }`}
                  >
                    <Flex align="center" gap="sm">
                      <Icon name="Monitor" size="sm" className="text-sky-500" />
                      <Stack gap="none">
                        <Text weight="semibold" size="sm" className="text-base-content">
                          Automático (Sistema)
                        </Text>
                        <Text variant="caption" size="xs" className="text-base-content/60">
                          Sigue el SO
                        </Text>
                      </Stack>
                    </Flex>
                  </Box>
                </Grid>
              </Stack>
            </Card>

            <Card variant="elevated" padding="md">
              <Flex justify="between" align="center" className="flex-wrap gap-3">
                <Flex align="center" gap="sm">
                  <Icon name="Info" size="sm" className="text-primary" />
                  <Stack gap="none">
                    <Text weight="semibold" size="sm" className="text-base-content">
                      Ferventa Automotive Management Suite
                    </Text>
                    <Text variant="caption" size="xs" className="text-base-content/60">
                      Versión 1.0.0 (Clean Architecture & Atomic Design)
                    </Text>
                  </Stack>
                </Flex>
                <Badge variant="primary" size="sm">
                  Safari macOS Compatible
                </Badge>
              </Flex>
            </Card>
          </Stack>
        )}
      </main>
    </PageLayout>
  );
};

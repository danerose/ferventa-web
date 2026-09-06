import React, { useState, useEffect, useMemo } from 'react';
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
  Icon,
  PageLayout,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { useThemeStore } from '@/app/presentation/stores';
import { usePrinterSettingsStore } from '@/app/presentation/stores';
import { thermalPrintService } from '@/core/services';
import { APIAdminRepository } from '@/app/data';
import { ThemeMode } from '@/core/enums/methods/ThemeMode';
import type { Branch } from '@/app/domain';

const adminRepo = new APIAdminRepository();

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
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(() => usePrinterSettingsStore.getState().paperWidth);
  const [autoPrintOnSale, setAutoPrintOnSale] = useState(() => usePrinterSettingsStore.getState().autoPrintOnSale);
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>(() => usePrinterSettingsStore.getState().fontSize);
  const [showFolio, setShowFolio] = useState(() => usePrinterSettingsStore.getState().showFolio);
  const [showCashier, setShowCashier] = useState(() => usePrinterSettingsStore.getState().showCashier);
  const [showCutLine, setShowCutLine] = useState(() => usePrinterSettingsStore.getState().showCutLine);
  const [showPolicies, setShowPolicies] = useState(() => usePrinterSettingsStore.getState().showPolicies);
  const [showPhone, setShowPhone] = useState(() => usePrinterSettingsStore.getState().showPhone);
  const [showAddress, setShowAddress] = useState(() => usePrinterSettingsStore.getState().showAddress);

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

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const list = await adminRepo.getBranches();
        if (list && list.length > 0) {
          setBranches(list);
        }
      } catch (err) {
        console.error('Error al cargar sucursales:', err);
      }
    };
    loadBranches();
  }, []);

  const activeBranch = useMemo(() => {
    if (!branches || branches.length === 0) return null;
    return branches.find((b) => b.id === activeBranchId) || branches[0];
  }, [branches, activeBranchId]);

  const activeBranchName = activeBranch ? activeBranch.name : 'Sucursal Principal';

  const handleSaveAllSettings = () => {
    saveSettings({
      printerName,
      paperWidth,
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
    setPaperWidth('58mm');
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

  const handlePrintTestTicket = () => {
    thermalPrintService.printTestTicket(
      {
        printerName,
        paperWidth,
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
  };

  const liveFontSizePx = fontSize === 'compact' ? '9px' : fontSize === 'large' ? '12px' : '10px';
  const livePoliciesLines = policiesText.split('\n').filter((l) => l.trim().length > 0);

  return (
    <PageLayout userName={user?.name || 'Admin'}>
        <header className="bg-base-100 px-7 py-4 border-b border-base-300 flex justify-between items-center shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-base-content m-0">Ajustes del Sistema</h1>
            <p className="text-xs text-base-content/60 m-0 mt-1">
              Configuración general de la plataforma, modo visual, datos de sucursal e impresión
            </p>
          </div>
          <div className="flex gap-3 items-center">
              {savedSuccess && (
                <Badge variant="success" size="sm" className="gap-1 animate-fade-in mt-1">
                  <Icon name="Check" size="xs" />
                  Cambios Guardados
                </Badge>
              )}
              <SecondaryButton size="sm" onClick={handleResetDefaults}>
                <Icon name="RotateCcw" size="xs" className="mr-1.5" />
                Restaurar
              </SecondaryButton>
              <PrimaryButton size="sm" onClick={handleSaveAllSettings}>
                <Icon name="Save" size="xs" className="mr-1.5" />
                Guardar Cambios
              </PrimaryButton>
          </div>
        </header>

        <div className="bg-base-100 border-b border-base-300 flex gap-8 px-7">
          <button
            onClick={() => setActiveTab('system')}
            className={`bg-transparent border-none py-4 text-[14px] font-semibold cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'system' ? 'text-primary border-primary' : 'text-base-content/60 border-transparent hover:text-base-content'
            }`}
          >
            <Icon name="Monitor" size="xs" />
            Sistema & Diagnóstico
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`bg-transparent border-none py-4 text-[14px] font-semibold cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'business' ? 'text-primary border-primary' : 'text-base-content/60 border-transparent hover:text-base-content'
            }`}
          >
            <Icon name="Store" size="xs" />
            Datos del Negocio
          </button>
          <button
            onClick={() => setActiveTab('printer')}
            className={`bg-transparent border-none py-4 text-[14px] font-semibold cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'printer' ? 'text-primary border-primary' : 'text-base-content/60 border-transparent hover:text-base-content'
            }`}
          >
            <Icon name="Printer" size="xs" />
            Impresora & Tickets
            <Badge variant="primary" size="xs">
              {paperWidth}
            </Badge>
          </button>
        </div>

        <main className="flex-1 p-7 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* ═════════ PESTAÑA: IMPRESORA & TICKETS ═════════ */}
          {activeTab === 'printer' && (
            <Grid cols={{ base: 1, lg: 12 }} gap="lg">
              {/* Columna Izquierda: Configuración de Impresora y Personalización de Textos */}
              <Box className="lg:col-span-7">
                <Stack gap="md">
                  {/* Tarjeta 1: Parámetros del Hardware */}
                  <Card variant="elevated" padding="md">
                    <Stack gap="md">
                      <Flex align="center" gap="sm">
                        <Box className="p-2 bg-primary/10 text-primary rounded-lg">
                          <Icon name="Printer" size="sm" />
                        </Box>
                        <Stack gap="none">
                          <Heading level={2} className="text-base font-bold text-base-content">
                            Configuración de Impresora Térmica
                          </Heading>
                          <Text variant="caption" size="xs" className="text-base-content/60">
                            Ajustes para impresión por Bluetooth / USB en Safari y macOS.
                          </Text>
                        </Stack>
                      </Flex>

                      {/* Nombre de la Impresora */}
                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" className="text-base-content">
                          Nombre de la Impresora Asignada (Estación de trabajo)
                        </Text>
                        <TextInput
                          value={printerName}
                          onChange={(e) => setPrinterName(e.target.value)}
                          placeholder="Ej. SUZWIP 58MM Thermal"
                        />
                        <Text variant="caption" size="xs" className="text-base-content/60">
                          Identificador de la impresora conectada vía USB o Bluetooth en esta caja.
                        </Text>
                      </Stack>

                      {/* Ancho de Papel / Rollo */}
                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" className="text-base-content">
                          Ancho de Papel / Rollo
                        </Text>
                        <Grid cols={2} gap="sm">
                          <Box
                            onClick={() => setPaperWidth('58mm')}
                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              paperWidth === '58mm' ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
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
                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                              paperWidth === '80mm' ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
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
                            - - - - CORTE DE TICKET - - - -
                          </div>
                        )}
                      </Box>
                    </Box>

                    {/* Botón Imprimir Ticket de Prueba */}
                    <Box className="w-full mt-4">
                      <PrimaryButton
                        className="w-full justify-center"
                        onClick={handlePrintTestTicket}
                      >
                        <Icon name="Printer" size="sm" className="mr-2" />
                        Imprimir Ticket de Prueba
                      </PrimaryButton>
                      <Text variant="caption" size="xs" className="text-center text-base-content/60 mt-2 block">
                        Envía este ticket a tu impresora SUZWIP para verificar alineación y corte.
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
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        currentThemeMode === ThemeMode.Light ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
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
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        currentThemeMode === ThemeMode.Dark ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
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
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        currentThemeMode === ThemeMode.System ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-200'
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

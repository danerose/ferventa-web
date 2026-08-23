import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sidebar,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { useThemeStore } from '@/app/presentation/stores';
import { usePrinterSettingsStore } from '@/app/presentation/stores';
import { thermalPrintService } from '@/core/services/thermalPrintService';
import { APIAdminRepository } from '@/app/data';
import { ThemeMode } from '@/core/enums/methods/ThemeMode';
import type { Branch } from '@/app/domain';

const adminRepo = new APIAdminRepository();

type ActiveSettingsTab = 'system' | 'business' | 'printer';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeBranchId, clearAuth } = useAuthStore();
  const { mode: currentThemeMode, setThemeMode } = useThemeStore();
  const printerSettingsStore = usePrinterSettingsStore();

  const [activeTab, setActiveTab] = useState<ActiveSettingsTab>('printer');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Estado local para configuración de impresora
  const [printerName, setPrinterName] = useState(printerSettingsStore.printerName);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(printerSettingsStore.paperWidth);
  const [autoPrintOnSale, setAutoPrintOnSale] = useState(printerSettingsStore.autoPrintOnSale);
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>(printerSettingsStore.fontSize);
  const [showFolio, setShowFolio] = useState(printerSettingsStore.showFolio);
  const [showCashier, setShowCashier] = useState(printerSettingsStore.showCashier);
  const [showCutLine, setShowCutLine] = useState(printerSettingsStore.showCutLine);
  const [showPolicies, setShowPolicies] = useState(printerSettingsStore.showPolicies);
  const [showPhone, setShowPhone] = useState(printerSettingsStore.showPhone);
  const [showAddress, setShowAddress] = useState(printerSettingsStore.showAddress);

  // Textos y políticas personalizables por el Admin
  const [businessName, setBusinessName] = useState(printerSettingsStore.businessName);
  const [businessTagline, setBusinessTagline] = useState(printerSettingsStore.businessTagline);
  const [phone, setPhone] = useState(printerSettingsStore.phone);
  const [address, setAddress] = useState(printerSettingsStore.address);
  const [policiesTitle, setPoliciesTitle] = useState(printerSettingsStore.policiesTitle || 'IMPORTANTE');
  const [policiesText, setPoliciesText] = useState(
    printerSettingsStore.policiesText ||
    '* En partes eléctricas no aplica garantía, cambio ni devolución.\n* Cualquier aclaración dentro de los 2 días posteriores con este ticket.'
  );
  const [footerMessage, setFooterMessage] = useState(printerSettingsStore.footerMessage || '¡GRACIAS POR SU PREFERENCIA!');
  const [footerSubtext, setFooterSubtext] = useState(printerSettingsStore.footerSubtext || 'Moto servicio Nova FV');

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
    return branches.find((b) => b.id === activeBranchId || (b as any)._id === activeBranchId) || branches[0];
  }, [branches, activeBranchId]);

  const activeBranchName = activeBranch ? activeBranch.name : 'Sucursal Principal';

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  const handleSaveAllSettings = () => {
    printerSettingsStore.saveSettings({
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
    printerSettingsStore.resetDefaults();
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
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#091426', margin: 0 }}>Ajustes del Sistema</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Configuración general de la plataforma, modo visual, datos de sucursal e impresión
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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

        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '32px', padding: '0 28px' }}>
          <button
            onClick={() => setActiveTab('system')}
            className={`bg-transparent border-none py-4 text-[14px] font-semibold cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'system' ? 'text-slate-900 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <Icon name="Monitor" size="xs" />
            Sistema & Diagnóstico
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`bg-transparent border-none py-4 text-[14px] font-semibold cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'business' ? 'text-slate-900 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <Icon name="Store" size="xs" />
            Datos del Negocio
          </button>
          <button
            onClick={() => setActiveTab('printer')}
            className={`bg-transparent border-none py-4 text-[14px] font-semibold cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'printer' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <Icon name="Printer" size="xs" />
            Impresora & Tickets
            <Badge variant="neutral" size="xs" className="bg-blue-100 text-blue-700 border-none">
              {paperWidth}
            </Badge>
          </button>
        </div>

        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ═════════ PESTAÑA: IMPRESORA & TICKETS ═════════ */}
          {activeTab === 'printer' && (
            <Grid cols={{ base: 1, lg: 12 }} gap="lg">
              {/* Columna Izquierda: Configuración de Impresora y Personalización de Textos */}
              <Box style={{ gridColumn: 'span 7' }}>
                <Stack gap="md">
                  {/* Tarjeta 1: Parámetros del Hardware */}
                  <Card variant="elevated" padding="md" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                    <Stack gap="md">
                      <Flex align="center" gap="sm">
                        <Box style={{ padding: '8px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px' }}>
                          <Icon name="Printer" size="sm" />
                        </Box>
                        <Stack gap="none">
                          <Heading level={2} style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                            Configuración de Impresora Térmica
                          </Heading>
                          <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                            Ajustes para impresión por Bluetooth / USB en Safari y macOS.
                          </Text>
                        </Stack>
                      </Flex>

                      {/* Nombre de la Impresora */}
                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                          Nombre de la Impresora Asignada (Estación de trabajo)
                        </Text>
                        <TextInput
                          value={printerName}
                          onChange={(e) => setPrinterName(e.target.value)}
                          placeholder="Ej. SUZWIP 58MM Thermal"
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                        />
                        <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                          Identificador de la impresora conectada vía USB o Bluetooth en esta caja.
                        </Text>
                      </Stack>

                      {/* Ancho de Papel / Rollo */}
                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                          Ancho de Papel / Rollo
                        </Text>
                        <Grid cols={2} gap="sm">
                          <Box
                            onClick={() => setPaperWidth('58mm')}
                            style={{ padding: '14px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', borderColor: paperWidth === '58mm' ? '#2563eb' : '#e2e8f0', background: paperWidth === '58mm' ? '#eff6ff' : '#f8fafc' }}
                          >
                            <Flex justify="between" align="start">
                              <Stack gap="xs">
                                <Text weight="bold" size="sm" style={{ color: '#0f172a' }}>
                                  58 mm (Recomendado)
                                </Text>
                                <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                                  Para SUZWIP 58MM, mini térmicas Bluetooth/USB y rollo angosto.
                                </Text>
                              </Stack>
                              {paperWidth === '58mm' && (
                                <Box style={{ padding: '4px', background: '#2563eb', color: 'white', borderRadius: '9999px' }}>
                                  <Icon name="Check" size="xs" />
                                </Box>
                              )}
                            </Flex>
                          </Box>

                          <Box
                            onClick={() => setPaperWidth('80mm')}
                            style={{ padding: '14px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', borderColor: paperWidth === '80mm' ? '#2563eb' : '#e2e8f0', background: paperWidth === '80mm' ? '#eff6ff' : '#f8fafc' }}
                          >
                            <Flex justify="between" align="start">
                              <Stack gap="xs">
                                <Text weight="bold" size="sm" style={{ color: '#0f172a' }}>
                                  80 mm (Estándar)
                                </Text>
                                <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                                  Para impresoras POS de escritorio de rollo ancho (Epson, Star, etc.).
                                </Text>
                              </Stack>
                              {paperWidth === '80mm' && (
                                <Box style={{ padding: '4px', background: '#2563eb', color: 'white', borderRadius: '9999px' }}>
                                  <Icon name="Check" size="xs" />
                                </Box>
                              )}
                            </Flex>
                          </Box>
                        </Grid>
                      </Stack>

                      {/* Switch: Auto-imprimir al confirmar venta */}
                      <Box style={{ padding: '14px', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '12px' }}>
                        <Flex justify="between" align="center">
                          <Flex align="center" gap="sm">
                            <Box style={{ padding: '8px', background: '#d1fae5', color: '#059669', borderRadius: '8px' }}>
                              <Icon name="Zap" size="sm" />
                            </Box>
                            <Stack gap="none">
                              <Text weight="bold" size="sm" style={{ color: '#0f172a' }}>
                                Auto-imprimir al confirmar venta
                              </Text>
                              <Text variant="caption" size="xs" style={{ color: '#065f46' }}>
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
                        <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                          Tamaño de Letra en Ticket
                        </Text>
                        <Flex gap="xs" style={{ background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <SecondaryButton
                            size="sm"
                            variant={fontSize === 'compact' ? 'outline' : 'ghost'}
                            style={{ flex: 1, background: fontSize === 'compact' ? '#e2e8f0' : 'transparent', color: '#0f172a', fontWeight: fontSize === 'compact' ? 'bold' : 'normal' }}
                            onClick={() => setFontSize('compact')}
                          >
                            Compacto (8px)
                          </SecondaryButton>
                          <SecondaryButton
                            size="sm"
                            variant={fontSize === 'normal' ? 'outline' : 'ghost'}
                            style={{ flex: 1, background: fontSize === 'normal' ? '#2563eb' : 'transparent', color: fontSize === 'normal' ? 'white' : '#0f172a', fontWeight: fontSize === 'normal' ? 'bold' : 'normal' }}
                            onClick={() => setFontSize('normal')}
                          >
                            Normal (10px - Sugerido)
                          </SecondaryButton>
                          <SecondaryButton
                            size="sm"
                            variant={fontSize === 'large' ? 'outline' : 'ghost'}
                            style={{ flex: 1, background: fontSize === 'large' ? '#e2e8f0' : 'transparent', color: '#0f172a', fontWeight: fontSize === 'large' ? 'bold' : 'normal' }}
                            onClick={() => setFontSize('large')}
                          >
                            Grande (12px)
                          </SecondaryButton>
                        </Flex>
                      </Stack>

                      {/* Opciones de Contenido / Checkboxes */}
                      <Grid cols={{ base: 1, sm: 3 }} gap="sm" style={{ paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
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
                  <Card variant="elevated" padding="md" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                    <Stack gap="md">
                      <Flex align="center" gap="sm">
                        <Box style={{ padding: '8px', background: '#eef2ff', color: '#4f46e5', borderRadius: '8px' }}>
                          <Icon name="Edit3" size="sm" />
                        </Box>
                        <Stack gap="none">
                          <Heading level={2} style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                            Personalización de Textos y Políticas del Ticket
                          </Heading>
                          <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                            Modifica los avisos legales, políticas de garantía y mensaje de agradecimiento.
                          </Text>
                        </Stack>
                      </Flex>

                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                          Título de la Sección de Términos / Garantía
                        </Text>
                        <TextInput
                          value={policiesTitle}
                          onChange={(e) => setPoliciesTitle(e.target.value)}
                          placeholder="IMPORTANTE"
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                        />
                      </Stack>

                      <Stack gap="xs">
                        <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                          Cláusulas de Garantía y Aclaraciones (Multilínea)
                        </Text>
                        <Textarea
                          rows={4}
                          value={policiesText}
                          onChange={(e) => setPoliciesText(e.target.value)}
                          placeholder="* En partes eléctricas no aplica garantía..."
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}
                        />
                        <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                          Cada salto de línea aparecerá como un punto independiente en el ticket impreso.
                        </Text>
                      </Stack>

                      <Grid cols={{ base: 1, sm: 2 }} gap="md">
                        <Stack gap="xs">
                          <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                            Mensaje de Despedida / Saludo
                          </Text>
                          <TextInput
                            value={footerMessage}
                            onChange={(e) => setFooterMessage(e.target.value)}
                            placeholder="¡GRACIAS POR SU PREFERENCIA!"
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                          />
                        </Stack>

                        <Stack gap="xs">
                          <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                            Texto Secundario de Pie
                          </Text>
                          <TextInput
                            value={footerSubtext}
                            onChange={(e) => setFooterSubtext(e.target.value)}
                            placeholder="Moto servicio Nova FV"
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                          />
                        </Stack>
                      </Grid>
                    </Stack>
                  </Card>

                  {/* Acordeón de Ayuda para Safari / Mac */}
                  <Card variant="elevated" padding="sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                    <Box
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setShowSafariHelp(!showSafariHelp)}
                    >
                      <Flex justify="between" align="center">
                        <Flex align="center" gap="sm">
                          <Box style={{ padding: '6px', background: '#e0f2fe', color: '#0284c7', borderRadius: '8px' }}>
                            <Icon name="Compass" size="sm" />
                          </Box>
                          <Text weight="semibold" size="sm" style={{ color: '#0f172a' }}>
                            ¿Cómo configurar Safari / Mac para imprimir en 1 solo clic?
                          </Text>
                        </Flex>
                        <Icon
                          name={showSafariHelp ? 'ChevronUp' : 'ChevronDown'}
                          size="xs"
                          style={{ color: '#94a3b8' }}
                        />
                      </Flex>
                    </Box>

                    {showSafariHelp && (
                      <Box style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Text size="xs" style={{ color: '#334155' }}>
                          1. En Safari, al abrir la ventana de impresión, selecciona tu impresora <strong>SUZWIP 58MM</strong>.
                        </Text>
                        <Text size="xs" style={{ color: '#334155' }}>
                          2. En <strong>Tamaño de Papel (Paper Size)</strong>, selecciona o gestiona un tamaño personalizado de <strong>58mm x Auto/Continuo</strong>.
                        </Text>
                        <Text size="xs" style={{ color: '#334155' }}>
                          3. En <strong>Márgenes</strong>, selecciona <strong>Ninguno (0 mm)</strong>.
                        </Text>
                        <Text size="xs" style={{ color: '#334155' }}>
                          4. Desmarca la casilla <strong>"Imprimir encabezados y pies de página"</strong>.
                        </Text>
                        <Text size="xs" style={{ color: '#334155' }}>
                          5. En el selector de Ajustes Preestablecidos (Presets), haz clic en <strong>"Guardar como preajuste"</strong> (ej. <em>Ticket Térmico 58mm</em>) para que Safari recuerde estos parámetros automáticamente en cada cobro.
                        </Text>
                      </Box>
                    )}
                  </Card>
                </Stack>
              </Box>

              {/* Columna Derecha: Simulador Térmico en Tiempo Real */}
              <Box style={{ gridColumn: 'span 5' }}>
                <Stack gap="md" style={{ position: 'sticky', top: '24px' }}>
                  <Card variant="elevated" padding="md" style={{ background: 'white', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Flex justify="between" align="center" style={{ width: '100%', marginBottom: '12px' }}>
                      <Flex align="center" gap="xs">
                        <Icon name="Eye" size="xs" style={{ color: '#2563eb' }} />
                        <Text weight="bold" size="xs" style={{ color: '#334155' }}>
                          Vista Previa en Tiempo Real
                        </Text>
                      </Flex>
                      <Badge variant="primary" size="xs" style={{ background: '#2563eb', color: 'white' }}>
                        Simulador Térmico (Monocromático)
                      </Badge>
                    </Flex>

                    {/* Marco Exterior para soporte visual */}
                    <Box style={{ width: '100%', background: '#f1f5f9', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                      {/* Ticket Térmico Realista: Papel Blanco con Tinta Negra Pura */}
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
                    <Box style={{ width: '100%', marginTop: '16px' }}>
                      <PrimaryButton
                        style={{ width: '100%', justifyContent: 'center', padding: '10px 0', background: '#2563eb' }}
                        onClick={handlePrintTestTicket}
                      >
                        <Icon name="Printer" size="sm" style={{ marginRight: '8px' }} />
                        Imprimir Ticket de Prueba
                      </PrimaryButton>
                      <Text variant="caption" size="xs" style={{ textAlign: 'center', color: '#94a3b8', marginTop: '8px', display: 'block' }}>
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
            <Card variant="elevated" padding="md" style={{ background: 'white', border: '1px solid #e2e8f0', maxWidth: '672px' }}>
              <Stack gap="md">
                <Flex align="center" gap="sm">
                  <Box style={{ padding: '8px', background: '#fef3c7', color: '#d97706', borderRadius: '8px' }}>
                    <Icon name="Home" size="sm" />
                  </Box>
                  <Stack gap="none">
                    <Heading level={2} style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                      Datos Comerciales del Taller / Negocio
                    </Heading>
                    <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                      Información pública que se imprimirá en los tickets y cotizaciones.
                    </Text>
                  </Stack>
                </Flex>

                <Stack gap="xs">
                  <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                    Nombre Comercial de la Empresa
                  </Text>
                  <TextInput
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Moto servicio Nova FV"
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                  />
                </Stack>

                <Stack gap="xs">
                  <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                    Lema o Giro Comercial
                  </Text>
                  <TextInput
                    value={businessTagline}
                    onChange={(e) => setBusinessTagline(e.target.value)}
                    placeholder="TALLER Y REFACCIONES PARA MOTOS"
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                  />
                </Stack>

                <Grid cols={{ base: 1, sm: 2 }} gap="md">
                  <Stack gap="xs">
                    <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                      Teléfono / WhatsApp
                    </Text>
                    <TextInput
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="999 438 9747"
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                    />
                  </Stack>

                  <Stack gap="xs">
                    <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                      Mensaje de Despedida / Saludo
                    </Text>
                    <TextInput
                      value={footerMessage}
                      onChange={(e) => setFooterMessage(e.target.value)}
                      placeholder="¡GRACIAS POR SU PREFERENCIA!"
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                    />
                  </Stack>
                </Grid>

                <Stack gap="xs">
                  <Text as="label" variant="label" size="xs" style={{ color: '#334155' }}>
                    Dirección Fiscal o de Sucursal Principal
                  </Text>
                  <TextInput
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle 28 No. 153 x 12 y 14..."
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a' }}
                  />
                </Stack>

                <Flex justify="end" style={{ paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <PrimaryButton size="sm" onClick={handleSaveAllSettings}>
                    <Icon name="Save" size="xs" style={{ marginRight: '6px' }} />
                    Guardar Datos del Negocio
                  </PrimaryButton>
                </Flex>
              </Stack>
            </Card>
          )}

          {/* ═════════ PESTAÑA: SISTEMA & DIAGNÓSTICO ═════════ */}
          {activeTab === 'system' && (
            <Stack gap="lg" style={{ maxWidth: '768px' }}>
              <Card variant="elevated" padding="md" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                <Stack gap="md">
                  <Flex align="center" gap="sm">
                    <Box style={{ padding: '8px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px' }}>
                      <Icon name="Sun" size="sm" />
                    </Box>
                    <Stack gap="none">
                      <Heading level={2} style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                        Apariencia Visual
                      </Heading>
                      <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                        Selecciona el tema de la aplicación.
                      </Text>
                    </Stack>
                  </Flex>

                  <Grid cols={{ base: 1, sm: 3 }} gap="md">
                    <Box
                      onClick={() => setThemeMode(ThemeMode.Light)}
                      style={{ padding: '16px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', borderColor: currentThemeMode === ThemeMode.Light ? '#2563eb' : '#e2e8f0', background: currentThemeMode === ThemeMode.Light ? '#eff6ff' : '#f8fafc' }}
                    >
                      <Flex align="center" gap="sm">
                        <Icon name="Sun" size="sm" style={{ color: '#d97706' }} />
                        <Stack gap="none">
                          <Text weight="semibold" size="sm" style={{ color: '#0f172a' }}>
                            Modo Claro
                          </Text>
                          <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                            Fondo claro
                          </Text>
                        </Stack>
                      </Flex>
                    </Box>

                    <Box
                      onClick={() => setThemeMode(ThemeMode.Dark)}
                      style={{ padding: '16px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', borderColor: currentThemeMode === ThemeMode.Dark ? '#2563eb' : '#e2e8f0', background: currentThemeMode === ThemeMode.Dark ? '#eff6ff' : '#f8fafc' }}
                    >
                      <Flex align="center" gap="sm">
                        <Icon name="Moon" size="sm" style={{ color: '#4f46e5' }} />
                        <Stack gap="none">
                          <Text weight="semibold" size="sm" style={{ color: '#0f172a' }}>
                            Modo Oscuro
                          </Text>
                          <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                            Alto contraste
                          </Text>
                        </Stack>
                      </Flex>
                    </Box>

                    <Box
                      onClick={() => setThemeMode(ThemeMode.System)}
                      style={{ padding: '16px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', borderColor: currentThemeMode === ThemeMode.System ? '#2563eb' : '#e2e8f0', background: currentThemeMode === ThemeMode.System ? '#eff6ff' : '#f8fafc' }}
                    >
                      <Flex align="center" gap="sm">
                        <Icon name="Monitor" size="sm" style={{ color: '#0284c7' }} />
                        <Stack gap="none">
                          <Text weight="semibold" size="sm" style={{ color: '#0f172a' }}>
                            Automático (Sistema)
                          </Text>
                          <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                            Sigue el SO
                          </Text>
                        </Stack>
                      </Flex>
                    </Box>
                  </Grid>
                </Stack>
              </Card>

              <Card variant="elevated" padding="md" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                <Flex justify="between" align="center" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  <Flex align="center" gap="sm">
                    <Icon name="Info" size="sm" style={{ color: '#2563eb' }} />
                    <Stack gap="none">
                      <Text weight="semibold" size="sm" style={{ color: '#0f172a' }}>
                        Ferventa Automotive Management Suite
                      </Text>
                      <Text variant="caption" size="xs" style={{ color: '#94a3b8' }}>
                        Versión 1.0.0 (Clean Architecture & Atomic Design)
                      </Text>
                    </Stack>
                  </Flex>
                  <Badge variant="primary" size="sm" style={{ background: '#2563eb', color: 'white' }}>
                    Safari macOS Compatible
                  </Badge>
                </Flex>
              </Card>
            </Stack>
          )}
        </main>
      </div>
    </div>
  );
};

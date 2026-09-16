import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Modal,
  Box,
  Flex,
  Text,
  Icon,
  PrimaryButton,
  SecondaryButton,
} from '@/app/presentation/components';
import type { MerchandiseReceptionBox } from '@/app/domain';
import { formatDate } from '@/core/utils';
import { documentPrintService } from '@/core/services/print/documentPrintService';
import { generateBoxLabel4x2Html, generateBoxThermalTicketHtml } from '@/core/services/print/templates/boxLabelTemplates';

export interface BoxQrTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: MerchandiseReceptionBox | null;
  productName?: string;
  receptionFolio?: string;
  branchName?: string;
}

export const BoxQrTicketModal: React.FC<BoxQrTicketModalProps> = ({
  isOpen,
  onClose,
  box,
  productName = 'Producto en Lote',
  receptionFolio = 'REC-001',
  branchName = 'Sucursal Uman',
}) => {
  const [printFormat, setPrintFormat] = useState<'label4x2' | 'thermal'>('label4x2');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (box?.boxCode) {
      QRCode.toDataURL(box.boxCode, {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    } else {
      setQrDataUrl('');
    }
  }, [box?.boxCode]);

  if (!isOpen || !box) return null;

  const isLabel = printFormat === 'label4x2';

  const handlePrint = () => {
    const data = {
      boxCode: box.boxCode,
      productName,
      itemsPerBox: box.itemsPerBox ?? box.quantity,
      receptionFolio,
      branchName,
      qrDataUrl,
      dateStr: formatDate(new Date().toISOString()),
    };

    if (isLabel) {
      const html = generateBoxLabel4x2Html(data);
      documentPrintService.printLabelContent(html, {
        widthMm: 101.6, // 4 pulgadas
        heightMm: 50.8, // 2 pulgadas
        title: `Etiqueta QR - ${box.boxCode}`,
      });
    } else {
      const html = generateBoxThermalTicketHtml(data, '58mm');
      documentPrintService.printThermalContent(html, {
        paperWidth: '58mm',
        title: `Ticket QR - ${box.boxCode}`,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Etiqueta QR de Caja / Lote"
      maxWidth="560px"
    >
      <Box className="space-y-4">
        {/* Selector de Formato de Impresión */}
        <Box className="p-3 bg-base-200 rounded-xl border border-base-300">
          <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider mb-2 block">
            Formato de Impresión de Etiqueta
          </Text>
          <Flex gap="sm">
            <button
              type="button"
              onClick={() => setPrintFormat('label4x2')}
              className={`flex-1 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${isLabel
                  ? 'bg-primary/10 border-primary ring-2 ring-primary/30 text-primary font-bold'
                  : 'bg-base-100 border-base-300 text-base-content hover:bg-base-200'
                }`}
            >
              <Flex align="center" gap="xs" className="mb-0.5">
                <Icon name="Tag" size="xs" />
                <span className="text-xs">Etiqueta Adhesiva (4 x 2 pulg)</span>
              </Flex>
              <span className="text-[10px] opacity-70 block font-normal">
                Estándar para pegado en cajas de almacén
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPrintFormat('thermal')}
              className={`flex-1 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${!isLabel
                  ? 'bg-primary/10 border-primary ring-2 ring-primary/30 text-primary font-bold'
                  : 'bg-base-100 border-base-300 text-base-content hover:bg-base-200'
                }`}
            >
              <Flex align="center" gap="xs" className="mb-0.5">
                <Icon name="Printer" size="xs" />
                <span className="text-xs">Rollo Térmico Continuo</span>
              </Flex>
              <span className="text-[10px] opacity-70 block font-normal">
                Ticket de 58mm / 80mm
              </span>
            </button>
          </Flex>
        </Box>

        {/* Vista Previa de la Etiqueta */}
        <Box className="flex justify-center p-4 bg-neutral-900/5 dark:bg-neutral-900/30 rounded-xl border border-dashed border-base-300">
          <div
            className={`bg-white text-black p-4 rounded-md shadow-md flex ${isLabel ? 'w-[380px] h-[190px] flex-row gap-3 items-center justify-between' : 'w-[240px] flex-col items-center text-center gap-2'
              }`}
          >
            {/* QR Code */}
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={box.boxCode}
                className={isLabel ? 'w-32 h-32 object-contain shrink-0 border border-slate-200 rounded' : 'w-36 h-36 object-contain'}
              />
            )}

            {/* Label metadata */}
            <div className={isLabel ? 'flex-1 min-w-0' : 'w-full'}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                FERVENTA • {branchName}
              </div>
              <div className="text-sm font-black text-slate-900 leading-tight truncate mt-0.5" title={productName}>
                {productName}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="bg-slate-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                  {box.itemsPerBox ?? box.quantity} PIEZAS
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {receptionFolio}
                </span>
              </div>
              <div className="mt-2 font-mono font-extrabold text-xs text-slate-800 tracking-wider bg-slate-100 p-1 rounded border border-slate-200">
                {box.boxCode}
              </div>
              <div className="text-[9px] text-slate-400 mt-1">
                {formatDate(new Date().toISOString())}
              </div>
            </div>
          </div>
        </Box>

        {/* Actions */}
        <Flex justify="end" gap="sm" className="pt-2 border-t border-base-300">
          <SecondaryButton size="sm" onClick={onClose}>
            Cerrar
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            color="primary"
            onClick={handlePrint}
            iconStart={<Icon name="Printer" size="xs" />}
          >
            Imprimir Etiqueta ({isLabel ? '4x2 pulg' : 'Térmico'})
          </PrimaryButton>
        </Flex>
      </Box>

      {/* ── CSS Print Template Inyectado para Impresión ── */}
      <div
        id="box-qr-print-ticket"
        className="hidden print:block fixed inset-0 bg-white z-[99999] text-black"
        style={{
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={
            isLabel
              ? {
                width: '101.6mm',
                height: '50.8mm',
                padding: '4mm',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '4mm',
                pageBreakInside: 'avoid',
              }
              : {
                width: '58mm',
                padding: '4mm',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                pageBreakInside: 'avoid',
              }
          }
        >
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={box.boxCode}
              style={
                isLabel
                  ? { width: '40mm', height: '40mm', objectFit: 'contain' }
                  : { width: '42mm', height: '42mm', objectFit: 'contain', marginBottom: '2mm' }
              }
            />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#475569' }}>
              FERVENTA • {branchName}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', margin: '2px 0', lineHeight: '1.2' }}>
              {productName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '3px 0' }}>
              <span style={{ background: '#0f172a', color: '#ffffff', fontSize: '10px', fontWeight: '900', padding: '1px 5px', borderRadius: '3px' }}>
                {box.itemsPerBox ?? box.quantity} PIEZAS
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b' }}>
                {receptionFolio}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '0.5px', marginTop: '3px' }}>
              {box.boxCode}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

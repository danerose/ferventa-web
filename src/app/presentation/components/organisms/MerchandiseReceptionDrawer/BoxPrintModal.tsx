import React, { useRef, useState } from 'react';
import { BoxQRLabel, type BoxItemData } from './BoxQRLabel';
import {
  Icon,
  Modal,
  PrimaryButton,
  SecondaryButton,
  Badge,
  KbdBadge,
} from '@/app/presentation/components';
import type { MerchandiseReception } from '@/app/domain';
import { documentPrintService } from '@/core/services/print/documentPrintService';

interface BoxPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reception: {
    _id?: string;
    id?: string;
    invoiceOrFolio?: string;
    items?: BoxItemData[];
    boxes?: BoxItemData[];
  } | MerchandiseReception | null;
  branchName?: string;
  onOpenBox?: (boxCode: string) => Promise<void>;
}

export const BoxPrintModal: React.FC<BoxPrintModalProps> = ({
  isOpen,
  onClose,
  reception,
  branchName = 'Taller Nova FV Sucursal Uman',
  onOpenBox,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [selectedSingleItem, setSelectedSingleItem] = useState<BoxItemData | null>(null);
  const [openingBoxCode, setOpeningBoxCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sealed' | 'opened'>('all');

  if (!isOpen || !reception) return null;

  const receptionId = (reception && ('id' in reception ? reception.id : undefined)) || (reception && ('_id' in reception ? reception._id : undefined)) || 'LOT';

  // Extract box items list from reception.boxes or reception.items
  const rawList: BoxItemData[] = (reception.boxes && reception.boxes.length > 0)
    ? reception.boxes
    : (reception.items && reception.items.length > 0)
    ? reception.items.filter((it) => !!it.boxCode)
    : [];

  const items: BoxItemData[] = rawList.map((it, idx) => ({
    ...it,
    _id: it._id || it.id || String(idx),
    boxCode: it.boxCode || `BOX-${receptionId.slice(-6).toUpperCase()}-${idx + 1}`,
    isBoxSealed: it.isBoxSealed !== undefined ? it.isBoxSealed : !it.isOpened,
  }));

  const sealedCount = items.filter((it) => it.isBoxSealed).length;
  const openedCount = items.filter((it) => !it.isBoxSealed).length;

  const filteredItems = items.filter((it) => {
    if (filter === 'sealed') return it.isBoxSealed;
    if (filter === 'opened') return !it.isBoxSealed;
    return true;
  });

  const folio = reception.invoiceOrFolio || `REM-${receptionId.slice(-6).toUpperCase()}`;

  const handlePrintAll = () => {
    setSelectedSingleItem(null);
    setTimeout(() => {
      const html = printAreaRef.current?.innerHTML;
      if (html) {
        documentPrintService.printThermalContent(html, {
          paperWidth: '80mm',
          title: `Etiquetas QR - ${folio}`,
        });
      }
    }, 60);
  };

  const handlePrintSingle = (item: BoxItemData) => {
    setSelectedSingleItem(item);
    setTimeout(() => {
      const html = printAreaRef.current?.innerHTML;
      if (html) {
        documentPrintService.printThermalContent(html, {
          paperWidth: '80mm',
          title: `Etiqueta QR - ${item.boxCode || folio}`,
        });
      }
      setSelectedSingleItem(null);
    }, 60);
  };

  const handleOpenBoxClick = async (boxCode: string) => {
    if (!onOpenBox) return;
    setOpeningBoxCode(boxCode);
    try {
      await onOpenBox(boxCode);
    } finally {
      setOpeningBoxCode(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Etiquetas QR de Cajas - ${folio}`}
      maxWidth="760px"
      footer={
        <div className="flex justify-between items-center w-full">
          <SecondaryButton size="sm" onClick={onClose}>
            Cerrar <KbdBadge keys="Esc" className="ml-1.5" />
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            color="primary"
            onClick={handlePrintAll}
            disabled={filteredItems.length === 0}
            iconStart={<Icon name="Printer" size="xs" />}
          >
            Imprimir Todas ({filteredItems.length}) <KbdBadge keys="Enter ↵" className="ml-1.5" />
          </PrimaryButton>
        </div>
      }
    >
      {/* Estilos CSS dedicados para impresión térmica y de etiquetas */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #box-print-section, #box-print-section * {
              visibility: visible !important;
            }
            #box-print-section {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .box-label-container {
              page-break-inside: avoid !important;
              margin-bottom: 8mm !important;
              border: 1px solid #000000 !important;
            }
          }
        `}
      </style>

      <div className="space-y-4">
        {/* Header summary & filter tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-base-200/50 rounded-xl border border-base-300">
          <div>
            <div className="text-xs font-bold text-base-content">
              Remisión: <span className="font-mono text-primary">{folio}</span>
            </div>
            <div className="text-[11px] text-base-content/60">
              {items.length} caja(s) en total • {sealedCount} sellada(s) en bodega • {openedCount} abierta(s)
            </div>
          </div>

          <div className="flex items-center gap-1 bg-base-100 p-1 rounded-lg border border-base-300 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-primary text-primary-content font-bold' : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              Todas ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('sealed')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filter === 'sealed' ? 'bg-success text-success-content font-bold' : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              Selladas ({sealedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('opened')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filter === 'opened' ? 'bg-neutral text-neutral-content font-bold' : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              Abiertas ({openedCount})
            </button>
          </div>
        </div>

        {/* List of box items with QR preview and quick action */}
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-base-200/30 rounded-xl border border-base-300">
            <Icon name="Package" size="lg" className="text-base-content/30 mx-auto mb-2" />
            <div className="text-sm font-semibold text-base-content/70">No hay cajas en esta categoría</div>
            <div className="text-xs text-base-content/50 mt-1">Selecciona otra pestaña para ver las cajas disponibles.</div>
          </div>
        ) : (
          <div className="max-h-[440px] overflow-y-auto space-y-3 pr-1">
            {filteredItems.map((item) => (
              <div
                key={item._id || item.boxCode}
                className="p-3 bg-base-100 rounded-xl border border-base-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                {/* Visual Label Preview snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {item.boxCode}
                    </span>
                    <Badge variant={item.isBoxSealed ? 'success' : 'neutral'} size="sm">
                      {item.isBoxSealed ? 'Sellada en Bodega' : 'Abierta en Mostrador'}
                    </Badge>
                  </div>
                  <div className="text-sm font-bold text-base-content truncate" title={item.name || item.product?.name}>
                    {item.name || item.product?.name || 'Producto'}
                  </div>
                  <div className="text-xs text-base-content/60 flex items-center gap-2 mt-0.5">
                    <span>SKU: <strong className="font-mono">{item.sku || item.product?.sku || 'S/SKU'}</strong></span>
                    <span>•</span>
                    <span>Cantidad: <strong className="text-primary font-mono">{item.quantity || item.itemsPerBox || 1} pzas</strong></span>
                    {(item.sellingPrice || item.product?.sellingPrice) && (
                      <>
                        <span>•</span>
                        <span>P. Venta: <strong className="text-success font-mono">${(item.sellingPrice || item.product?.sellingPrice || 0).toFixed(2)}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick actions for individual box */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.isBoxSealed && onOpenBox && (
                    <button
                      type="button"
                      onClick={() => item.boxCode && handleOpenBoxClick(item.boxCode)}
                      disabled={openingBoxCode === item.boxCode}
                      className="btn btn-xs btn-success font-semibold text-success-content"
                      title="Abrir caja para sumar piezas al mostrador y nivelar precio"
                    >
                      <Icon name="PackageCheck" size="xs" />
                      {openingBoxCode === item.boxCode ? 'Abriendo...' : 'Abrir Caja'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePrintSingle(item)}
                    className="btn btn-xs btn-outline btn-primary"
                    title="Imprimir solo esta etiqueta"
                  >
                    <Icon name="Printer" size="xs" />
                    Imprimir QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Printable section injected in DOM for window.print() ── */}
        <div id="box-print-section" ref={printAreaRef} className="hidden print:block">
          {(selectedSingleItem ? [selectedSingleItem] : filteredItems).map((item, idx, arr) => (
            <BoxQRLabel
              key={item._id || item.boxCode}
              item={item}
              invoiceOrFolio={folio}
              branchName={branchName}
              isLast={idx === arr.length - 1}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

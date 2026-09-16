import React, { useState, useEffect } from 'react';
import {
  Icon,
  Badge,
  PrimaryButton,
  SecondaryButton,
  KbdBadge,
  Modal,
  Textarea,
} from '@/app/presentation/components';
import type { MerchandiseReception } from '@/app/domain';
import { formatCurrency } from '@/core/utils';

export interface ReceptionDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reception: MerchandiseReception | null;
  onApprove?: (receptionId: string) => Promise<void>;
  onReject?: (receptionId: string, reason: string) => Promise<void>;
  onViewBoxes?: (reception: MerchandiseReception) => void;
  onOpenBox?: (boxCode: string) => Promise<void>;
  isAdmin?: boolean;
  actionLoading?: boolean;
}

export const ReceptionDetailDrawer: React.FC<ReceptionDetailDrawerProps> = ({
  isOpen,
  onClose,
  reception,
  onApprove,
  onReject,
  onViewBoxes,
  isAdmin = false,
  actionLoading = false,
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const [copiedBoxCode, setCopiedBoxCode] = useState<string | null>(null);

  const handleCopyBoxCode = (boxCode: string) => {
    navigator.clipboard.writeText(boxCode);
    setCopiedBoxCode(boxCode);
    setTimeout(() => {
      setCopiedBoxCode(null);
    }, 2000);
  };

  useEffect(() => {
    if (!isOpen) {
      setRejectModalOpen(false);
      setApproveConfirmOpen(false);
      setRejectReason('');
      setRejectError(null);
      setApproveError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || rejectModalOpen || approveConfirmOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, rejectModalOpen, approveConfirmOpen, onClose]);

  if (!isOpen || !reception) return null;

  const isDraft = reception.status === 'draft';
  const isApproved = reception.status === 'approved';
  const isRejected = reception.status === 'rejected';

  const totalItems = reception.items?.length || 0;
  const totalUnits = reception.items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0;
  const totalCost = reception.items?.reduce((acc, it) => acc + (it.quantity * (it.costPrice || 0)), 0) || 0;

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Debes ingresar el motivo de rechazo.');
      return;
    }
    if (!onReject) return;
    setRejecting(true);
    setRejectError(null);
    try {
      await onReject(reception.id, rejectReason.trim());
      setRejectModalOpen(false);
      setRejectReason('');
      onClose();
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Error al rechazar remisión');
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!onApprove) return;
    setApproving(true);
    setApproveError(null);
    try {
      await onApprove(reception.id);
      setApproveConfirmOpen(false);
      onClose();
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Error al aprobar remisión');
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-neutral-900/60 z-50 flex justify-end backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <aside
          className="w-full max-w-2xl h-full bg-base-100 border-l border-base-300 text-base-content shadow-2xl flex flex-col font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="p-5 border-b border-base-300 bg-base-200/50 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-base-content">
                  {reception.invoiceOrFolio || `REM-${reception.id.slice(-6).toUpperCase()}`}
                </span>
                <Badge
                  variant={isApproved ? 'success' : isRejected ? 'error' : 'warning'}
                  size="sm"
                  className="font-bold uppercase tracking-wider"
                >
                  {isApproved ? 'Aprobada' : isRejected ? 'Rechazada' : 'Borrador Pendiente'}
                </Badge>
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Detalle de Remisión y Lista de Artículos
              </p>
            </div>

            <div className="flex items-center gap-2">
              <KbdBadge keys="Esc" className="opacity-70 text-[10px]" />
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-base-content"
                title="Cerrar (Esc)"
              >
                <Icon name="X" size="sm" />
              </button>
            </div>
          </header>

          {/* Content Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* General Info Card */}
            <div className="p-4 bg-base-200/40 rounded-2xl border border-base-300 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-base-content/60 block font-semibold mb-0.5">Proveedor:</span>
                <span className="font-bold text-base-content text-sm">
                  {reception.provider?.name || 'Proveedor General'}
                </span>
                {reception.provider?.providerCode && (
                  <span className="text-[10px] font-mono text-base-content/50 block">
                    Cód: {reception.provider.providerCode}
                  </span>
                )}
              </div>

              <div>
                <span className="text-base-content/60 block font-semibold mb-0.5">Fecha de Captura:</span>
                <span className="font-medium text-base-content">
                  {reception.createdAt
                    ? new Date(reception.createdAt).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                    : '-'}
                </span>
              </div>

              <div>
                <span className="text-base-content/60 block font-semibold mb-0.5">Estado:</span>
                <span className="font-bold">
                  {isApproved ? 'Ingresado en Almacén' : isRejected ? 'Descartada / Rechazada' : 'Pendiente de Aprobación'}
                </span>
              </div>

              {reception.notes && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-base-300/60">
                  <span className="text-base-content/60 font-semibold mr-1">Observaciones:</span>
                  <span className="text-base-content italic">{reception.notes}</span>
                </div>
              )}

              {reception.rejectionReason && (
                <div className="col-span-2 sm:col-span-3 p-2.5 bg-error/10 border border-error/20 rounded-xl text-error">
                  <span className="font-bold mr-1">Motivo de Rechazo:</span>
                  <span>{reception.rejectionReason}</span>
                </div>
              )}
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-base-200/50 rounded-xl border border-base-200 text-center">
                <span className="text-[11px] text-base-content/60 uppercase font-bold block">Artículos</span>
                <span className="text-lg font-black text-base-content">{totalItems}</span>
              </div>
              <div className="p-3 bg-base-200/50 rounded-xl border border-base-200 text-center">
                <span className="text-[11px] text-base-content/60 uppercase font-bold block">Unidades Físicas</span>
                <span className="text-lg font-black text-primary font-mono">+{totalUnits}</span>
              </div>
              <div className="p-3 bg-base-200/50 rounded-xl border border-base-200 text-center">
                <span className="text-[11px] text-base-content/60 uppercase font-bold block">Costo Estimado</span>
                <span className="text-lg font-black text-success font-mono">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            {/* Box Metrics & Status (When Approved) */}
            {isApproved && (
              <div className="space-y-3">
                {/* Box Alert Banner */}
                {(() => {
                  const totBoxes = reception.totalBoxes ?? (reception.boxes?.length || reception.items?.filter(it => it.boxCode).length || 0);
                  const sealedBoxes = reception.sealedBoxesCount ?? (reception.boxes?.filter(b => !b.isOpened).length ?? reception.items?.filter(it => it.boxCode && it.isBoxSealed !== false).length ?? 0);
                  const openedBoxes = reception.openedBoxesCount ?? (reception.boxes?.filter(b => b.isOpened).length ?? reception.items?.filter(it => it.boxCode && it.isBoxSealed === false).length ?? 0);
                  const fullyOpened = reception.isFullyOpened ?? (totBoxes > 0 && sealedBoxes === 0);
                  const sealedStk = reception.sealedStock ?? reception.items?.filter(it => it.boxCode && it.isBoxSealed !== false).reduce((acc, it) => acc + (it.quantity || 0), 0) ?? 0;
                  const openedStk = reception.openedStock ?? reception.items?.filter(it => !it.boxCode || it.isBoxSealed === false).reduce((acc, it) => acc + (it.quantity || 0), 0) ?? 0;

                  return (
                    <>
                      {fullyOpened || (totBoxes > 0 && sealedBoxes === 0) ? (
                        <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-success flex items-center gap-2.5 text-xs font-semibold">
                          <Icon name="CheckCircle2" size="sm" className="shrink-0 text-success" />
                          <span>
                            Todas las cajas ({totBoxes || openedBoxes} cajas) han sido abiertas. El 100% del stock ({openedStk || totalUnits} piezas) se encuentra activo en piso/mostrador.
                          </span>
                        </div>
                      ) : sealedBoxes > 0 ? (
                        <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-warning flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Icon name="Archive" size="sm" className="shrink-0 text-warning" />
                            <span>
                              <strong>{sealedBoxes} de {totBoxes} cajas</strong> permanecen selladas en bodega ({sealedStk} piezas pendientes de pasar al mostrador).
                            </span>
                          </div>
                          {onViewBoxes && (
                            <button
                              type="button"
                              onClick={() => onViewBoxes(reception)}
                              className="btn btn-warning btn-xs shrink-0 font-bold"
                            >
                              <Icon name="QrCode" size="xs" />
                              Abrir Cajas / QR
                            </button>
                          )}
                        </div>
                      ) : null}

                      {/* Detailed Box Breakdown Grid */}
                      <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-base-100 p-2.5 rounded-xl border border-base-300">
                          <span className="text-[10px] text-base-content/60 uppercase font-bold block">Total Cajas</span>
                          <span className="text-base font-bold text-base-content">{totBoxes}</span>
                        </div>
                        <div className="bg-base-100 p-2.5 rounded-xl border border-base-300">
                          <span className="text-[10px] text-warning uppercase font-bold block">Cajas Selladas</span>
                          <span className="text-base font-bold text-warning font-mono">{sealedBoxes}</span>
                        </div>
                        <div className="bg-base-100 p-2.5 rounded-xl border border-base-300">
                          <span className="text-[10px] text-success uppercase font-bold block">Cajas Abiertas</span>
                          <span className="text-base font-bold text-success font-mono">{openedBoxes}</span>
                        </div>
                        <div className="bg-base-100 p-2.5 rounded-xl border border-base-300">
                          <span className="text-[10px] text-primary uppercase font-bold block">Stock Mostrador</span>
                          <span className="text-base font-bold text-primary font-mono">{openedStk} pzas</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                  Artículos en esta Recepción ({totalItems})
                </h4>
              </div>

              <div className="overflow-x-auto border border-base-300 rounded-xl bg-base-100">
                <table className="table w-full text-xs">
                  <thead className="bg-base-200/60 text-base-content/70 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Producto / SKU</th>
                      <th className="py-2.5 px-3 text-right">Cant.</th>
                      <th className="py-2.5 px-3 text-right">P. Costo</th>
                      <th className="py-2.5 px-3 text-right">P. Venta</th>
                      <th className="py-2.5 px-3 text-right">Importe Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200">
                    {reception.items && reception.items.length > 0 ? (
                      reception.items.map((it, idx) => {
                        const prodName = it.product?.name || 'Producto';
                        const sku = it.product?.sku || '';
                        const itemSubtotal = it.quantity * (it.costPrice || 0);
                        const isSealed = it.isBoxSealed !== false;

                        return (
                          <tr key={idx} className="hover:bg-base-200/30">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-base-content">{prodName}</div>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                {sku && (
                                  <span className="text-[10px] font-mono text-base-content/50">
                                    SKU: {sku}
                                  </span>
                                )}
                                {it.boxCode && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyBoxCode(it.boxCode!);
                                    }}
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 transition-all cursor-pointer group select-none active:scale-95 ${isSealed
                                        ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20 hover:border-warning/50'
                                        : 'bg-success/10 text-success border-success/30 hover:bg-success/20 hover:border-success/50'
                                      }`}
                                    title="Clic para copiar código de caja"
                                  >
                                    <Icon name={isSealed ? 'Package' : 'PackageCheck'} size="xs" />
                                    <span>{it.boxCode} ({isSealed ? 'Sellada' : 'Abierta'})</span>
                                    <Icon
                                      name={copiedBoxCode === it.boxCode ? 'Check' : 'Copy'}
                                      size="xs"
                                      className={`transition-all ${copiedBoxCode === it.boxCode ? 'text-success font-bold' : 'opacity-60 group-hover:opacity-100'}`}
                                    />
                                    {copiedBoxCode === it.boxCode && (
                                      <span className="text-[9px] font-sans font-bold bg-base-content text-base-100 px-1 py-0.2 rounded">
                                        ¡Copiado!
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                              {it.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-base-content/70">
                              {formatCurrency(it.costPrice || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-success font-semibold">
                              {formatCurrency(it.sellingPrice || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-base-content">
                              {formatCurrency(itemSubtotal)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-base-content/50">
                          No hay productos registrados en esta remisión.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="p-4 border-t border-base-300 bg-base-200/50 flex items-center justify-between gap-3">
            <SecondaryButton size="sm" onClick={onClose}>
              Cerrar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>

            <div className="flex items-center gap-2">
              {isApproved && onViewBoxes && (
                <PrimaryButton
                  size="sm"
                  onClick={() => onViewBoxes(reception)}
                  iconStart={<Icon name="QrCode" size="xs" />}
                >
                  Ver Cajas / Imprimir QR
                </PrimaryButton>
              )}

              {isDraft && (
                isAdmin ? (
                  <>
                    <PrimaryButton
                      size="sm"
                      color="error"
                      disabled={actionLoading || rejecting || approving}
                      onClick={() => setRejectModalOpen(true)}
                      iconStart={<Icon name="X" size="xs" />}
                    >
                      Rechazar
                    </PrimaryButton>

                    <PrimaryButton
                      size="sm"
                      color="success"
                      disabled={actionLoading || rejecting || approving}
                      onClick={() => setApproveConfirmOpen(true)}
                      iconStart={<Icon name="Check" size="xs" />}
                    >
                      Aprobar Ingreso
                    </PrimaryButton>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/15 border border-warning/30 rounded-lg text-warning text-xs font-semibold">
                    <Icon name="Clock" size="xs" />
                    <span>Pendiente de Aprobación por Administrador</span>
                  </div>
                )
              )}
            </div>
          </footer>
        </aside>
      </div>

      {/* Approve Confirmation Modal */}
      {approveConfirmOpen && (
        <Modal
          isOpen={approveConfirmOpen}
          onClose={() => setApproveConfirmOpen(false)}
          onConfirm={handleConfirmApprove}
          title="Confirmar Aprobación de Remisión"
          maxWidth="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <SecondaryButton size="sm" onClick={() => setApproveConfirmOpen(false)} disabled={approving}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton
                size="sm"
                color="success"
                onClick={handleConfirmApprove}
                loading={approving}
                disabled={approving}
                iconStart={<Icon name="Check" size="xs" />}
              >
                Sí, Aprobar e Ingresar al Stock
              </PrimaryButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs leading-relaxed text-base-content/80">
            <p>
              ¿Deseas aprobar la remisión <strong className="text-base-content font-bold">{reception.invoiceOrFolio || `REM-${reception.id.slice(-6).toUpperCase()}`}</strong>?
            </p>
            <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-success font-medium">
              Al aprobar, se registrarán automáticamente los <strong>{totalItems} productos (+{totalUnits} unidades)</strong> en el almacén y se generarán los lotes/cajas con código QR.
            </div>
            {approveError && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-xl text-error font-medium">
                {approveError}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onConfirm={handleConfirmReject}
          title="Rechazar Remisión de Mercancía"
          maxWidth="max-w-md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <SecondaryButton size="sm" onClick={() => setRejectModalOpen(false)} disabled={rejecting}>
                Cancelar
              </SecondaryButton>
              <PrimaryButton
                size="sm"
                color="error"
                onClick={handleConfirmReject}
                loading={rejecting}
                disabled={rejecting}
                iconStart={<Icon name="X" size="xs" />}
              >
                Confirmar Rechazo
              </PrimaryButton>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-base-content/70">
              Ingresa el motivo por el cual se rechaza esta remisión de mercancía.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej. Mercancía dañada, piezas faltantes o proveedor incorrecto..."
              rows={3}
              isError={!!rejectError}
            />
            {rejectError && <div className="text-xs text-error font-medium">{rejectError}</div>}
          </div>
        </Modal>
      )}
    </>
  );
};

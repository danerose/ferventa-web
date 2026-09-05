import React, { useState } from 'react';
import { Icon, PrimaryButton, SecondaryButton, Modal, KbdBadge, TextInput } from '@/app/presentation/components';
import type { Sale } from '@/app/domain';

interface SaleDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onCancelSale?: (saleId: string, reason: string) => Promise<void>;
  onPrintTicket?: (sale: Sale) => void;
  branchName?: string;
}

interface ParsedItem {
  id: string;
  cartId?: string;
  parentCartId?: string;
  type: 'product' | 'service';
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isSupply?: boolean;
  childItems: ParsedItem[];
}

interface RawDrawerItem {
  id?: string;
  _id?: string;
  cartId?: string;
  parentCartId?: string;
  parentId?: string;
  parentServiceId?: string;
  type?: string;
  name?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
  priceSnapshot?: number;
  subtotal?: number;
  product?: { name?: string; sku?: string; sellingPrice?: number };
  service?: { name?: string; supplies?: RawDrawerItem[] };
  serviceId?: { name?: string; sku?: string; basePrice?: number; supplies?: RawDrawerItem[] };
  supplies?: RawDrawerItem[];
  suppliesConsumed?: RawDrawerItem[];
  origin?: string;
  isSupply?: boolean;
}

function parseSaleItems(items: unknown[]): ParsedItem[] {
  if (!Array.isArray(items)) return [];

  const rawList = items as RawDrawerItem[];
  // Step 1: Normalize items
  const normalized: (ParsedItem & { raw: RawDrawerItem })[] = rawList.map((item, index) => {
    const isService = item.type === 'service' || Boolean(item.serviceId) || Boolean(item.service);
    const name =
      item.name ||
      item.product?.name ||
      item.service?.name ||
      item.serviceId?.name ||
      (isService ? 'Servicio' : 'Artículo');
    const sku = item.sku || item.product?.sku || item.serviceId?.sku || '';
    const quantity = item.quantity || 1;
    const unitPrice =
      item.unitPrice ??
      item.priceSnapshot ??
      item.product?.sellingPrice ??
      item.serviceId?.basePrice ??
      0;
    const subtotal = item.subtotal ?? unitPrice * quantity;
    const itemId = String(item.cartId || item.id || item._id || `item-${index}`);
    const parentId = item.parentCartId || item.parentId || item.parentServiceId;

    // Extract nested supplies if attached to service object
    const nestedRaw =
      item.suppliesConsumed ||
      item.supplies ||
      item.serviceId?.supplies ||
      item.service?.supplies ||
      [];
    const nestedChildren: ParsedItem[] = Array.isArray(nestedRaw)
      ? nestedRaw.map((sup: RawDrawerItem, sIdx: number) => {
          const supProd = sup.product && typeof sup.product === 'object' ? sup.product : null;
          const supName = sup.name || supProd?.name || 'Insumo de servicio';
          const supSku = sup.sku || supProd?.sku || '';
          const supQty = sup.quantity || 1;
          const supPrice = sup.unitPrice ?? sup.priceSnapshot ?? supProd?.sellingPrice ?? 0;
          const supSubtotal = sup.subtotal ?? supPrice * supQty;
          return {
            id: `nested-${index}-${sIdx}`,
            type: 'product',
            name: supName,
            sku: supSku,
            quantity: supQty,
            unitPrice: supPrice,
            subtotal: supSubtotal,
            isSupply: true,
            childItems: [],
          };
        })
      : [];

    return {
      id: itemId,
      cartId: item.cartId,
      parentCartId: parentId,
      type: (isService ? 'service' : 'product') as 'product' | 'service',
      name,
      sku,
      quantity,
      unitPrice,
      subtotal,
      isSupply: !!parentId || item.origin === 'service' || item.isSupply === true,
      childItems: nestedChildren,
      raw: item,
    };
  });

  // Step 2: Separate top-level items from linked child items
  const rootItems: ParsedItem[] = [];
  const childrenMap = new Map<string, ParsedItem[]>();

  normalized.forEach((item) => {
    if (item.parentCartId) {
      if (!childrenMap.has(item.parentCartId)) {
        childrenMap.set(item.parentCartId, []);
      }
      childrenMap.get(item.parentCartId)!.push({
        id: item.id,
        type: item.type,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        isSupply: true,
        childItems: [],
      });
    }
  });

  normalized.forEach((item) => {
    if (!item.parentCartId) {
      const explicitChildren =
        childrenMap.get(item.id) || (item.cartId ? childrenMap.get(item.cartId) : []) || [];
      const combinedChildren = [...explicitChildren, ...item.childItems];

      rootItems.push({
        id: item.id,
        type: item.type,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        isSupply: item.isSupply,
        childItems: combinedChildren,
      });
    }
  });

  return rootItems;
}

export const SaleDetailDrawer: React.FC<SaleDetailDrawerProps> = ({
  isOpen,
  onClose,
  sale,
  onCancelSale,
  onPrintTicket,
  branchName: externalBranchName,
}) => {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || isCancelModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCancelModalOpen, onClose]);

  if (!isOpen || !sale) return null;

  const dateFmt = sale.createdAt
    ? new Date(sale.createdAt).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-';

  const branchName = externalBranchName || sale.branch?.name || 'Sucursal Principal';
  const customerName = sale.customer?.name || 'Cliente General';
  const sellerName = sale.seller?.name || 'Vendedor';
  const rootItems = parseSaleItems(sale.items);

  const handleConfirmCancel = async () => {
    if (cancelling) return;
    if (!cancelReason.trim()) {
      setCancelError('Debes ingresar el motivo de cancelación.');
      return;
    }
    if (!onCancelSale || !sale) return;

    setCancelling(true);
    setCancelError(null);
    try {
      await onCancelSale(sale.id, cancelReason.trim());
      setIsCancelModalOpen(false);
      setCancelReason('');
      onClose();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar la venta');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 998,
          transition: 'opacity 0.2s',
        }}
      />

      {/* Sidepanel Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 w-[500px] max-w-[90vw] bg-base-100 border-l border-base-300 shadow-2xl z-[999] flex flex-col animate-slide-in-right">
        {/* Drawer Header */}
        <div className="p-5 px-6 border-b border-base-300 flex justify-between items-center bg-base-200/50">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-base-content m-0">
                Venta {sale.folio || sale.id.slice(-8)}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  sale.isCancelled
                    ? 'bg-error/15 text-error border-error/30'
                    : 'bg-success/15 text-success border-success/30'
                }`}
              >
                {sale.isCancelled ? 'Cancelada' : 'Completada'}
              </span>
            </div>
            <p className="text-xs text-base-content/60 m-0 mt-1">{dateFmt}</p>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
          >
            <Icon name="X" size="md" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3 bg-base-200 p-4 rounded-xl border border-base-300">
            <div>
              <div className="text-[11px] font-semibold text-base-content/60 uppercase">Cliente</div>
              <div className="text-sm font-bold text-base-content mt-0.5">{customerName}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-base-content/60 uppercase">Sucursal</div>
              <div className="text-sm font-bold text-base-content mt-0.5">{branchName}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-base-content/60 uppercase">Atendió</div>
              <div className="text-xs font-semibold text-base-content/80 mt-0.5">{sellerName}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-base-content/60 uppercase">Método de Pago</div>
              <div className="text-xs font-semibold text-base-content/80 mt-0.5 capitalize">
                {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                {sale.paymentReference && <span className="text-[11px] text-base-content/50 block">Ref: {sale.paymentReference}</span>}
              </div>
            </div>
          </div>

          {/* Cancellation Warning Banner */}
          {sale.isCancelled && (
            <div className="p-3.5 px-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs">
              <div className="font-bold mb-0.5 flex items-center gap-1.5">
                <Icon name="AlertTriangle" size="sm" />
                Venta Cancelada
              </div>
              <div>Motivo: {('cancelReason' in sale && typeof (sale as { cancelReason?: unknown }).cancelReason === 'string' ? (sale as { cancelReason: string }).cancelReason : 'Sin motivo registrado')}</div>
            </div>
          )}

          {/* Items breakdown */}
          <div>
            <h3 className="text-sm font-bold text-base-content mb-3">
              Artículos & Servicios ({rootItems.length})
            </h3>

            {rootItems.length === 0 ? (
              <div className="p-5 text-center text-base-content/60 border border-dashed border-base-300 rounded-xl text-xs">
                Sin artículos registrados en esta venta
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {rootItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-base-300 rounded-xl p-3.5 bg-base-200/50 flex flex-col gap-2.5"
                  >
                    {/* Main Item Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.type === 'service' && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-bold border border-amber-500/30 shrink-0">
                              Servicio
                            </span>
                          )}
                          <span className="text-sm font-bold text-base-content break-words">
                            {item.name}
                          </span>
                        </div>
                        {item.sku && (
                          <div className="text-[11px] text-base-content/50 mt-0.5">
                            SKU: {item.sku}
                          </div>
                        )}
                        <div className="text-xs text-base-content/60 mt-1">
                          ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} c/u
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs text-base-content/60 font-medium">
                          Cant: <span className="text-base-content font-bold">{item.quantity}</span>
                        </div>
                        <div className="text-sm font-extrabold text-base-content mt-0.5">
                          ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Child Service Supplies Container */}
                    {item.childItems.length > 0 && (
                      <div className="mt-1 pt-2.5 border-t border-dashed border-base-300 flex flex-col gap-2">
                        {item.childItems.map((child) => (
                          <div
                            key={child.id}
                            className="border border-info/30 rounded-lg p-2.5 bg-info/10 flex justify-between items-center gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] bg-info/20 text-info px-1.5 py-0.5 rounded-md font-bold border border-info/30 shrink-0">
                                  Insumo de servicio
                                </span>
                                <span className="text-xs font-semibold text-info break-words">
                                  {child.name}
                                </span>
                              </div>
                              {child.sku && (
                                <div className="text-[11px] text-info/70 mt-0.5">
                                  SKU: {child.sku}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs text-info font-medium">
                                Cant: <span className="font-bold">{child.quantity}</span>
                              </div>
                              <div className="text-xs font-bold text-info mt-0.5">
                                ${child.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial summary */}
          <div className="bg-base-200 p-4 rounded-xl border border-base-300 flex flex-col gap-2">
            <div className="flex justify-between text-xs text-base-content/70">
              <span>Subtotal</span>
              <span>${(sale.subtotal ?? sale.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            {sale.discount ? sale.discount > 0 ? (
              <div className="flex justify-between text-xs text-success font-semibold">
                <span>Descuento</span>
                <span>-${sale.discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            ) : null : null}
            <div className="flex justify-between text-lg font-extrabold text-base-content pt-2 border-t border-base-300">
              <span>Total</span>
              <span>${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 px-6 border-t border-base-300 bg-base-200/50 flex gap-3">
          {onPrintTicket && (
            <SecondaryButton className="flex-1 justify-center" onClick={() => onPrintTicket(sale)}>
              <Icon name="Printer" size="sm" className="mr-2" />
              Imprimir Ticket
            </SecondaryButton>
          )}

          {!sale.isCancelled && onCancelSale && (
            <PrimaryButton
              className="flex-1 justify-center"
              color="error"
              onClick={() => {
                setCancelReason('');
                setCancelError(null);
                setIsCancelModalOpen(true);
              }}
            >
              <Icon name="Ban" size="sm" className="mr-2" />
              Cancelar Venta
            </PrimaryButton>
          )}
        </div>
      </aside>

      {/* Cancel Sale Modal */}
      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={handleConfirmCancel} title="Cancelar Venta" zIndex={1100}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            ¿Estás seguro de que deseas cancelar la venta <strong>{sale.folio || sale.id.slice(-8)}</strong>? Esta acción devolverá el stock de los productos e insumos al almacén.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
              Motivo de la Cancelación <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <TextInput
              autoFocus
              disabled={cancelling}
              placeholder="Ej. Devolución de producto, Error en cobro, Solicitud del cliente..."
              value={cancelReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancelReason(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmCancel();
                }
              }}
              errorMessage={cancelError || undefined}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <SecondaryButton onClick={() => setIsCancelModalOpen(false)} disabled={cancelling}>
              Volver <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
            <PrimaryButton
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
              onClick={handleConfirmCancel}
              loading={cancelling}
              disabled={cancelling}
            >
              Confirmar Cancelación <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </>
  );
};

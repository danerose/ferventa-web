import React, { useState } from 'react';
import { Icon } from '../../atoms/Icon/Icon';
import { PrimaryButton } from '../../atoms/Button/PrimaryButton';
import { SecondaryButton } from '../../atoms/Button/SecondaryButton';
import { Modal } from '../../molecules/Modal';
import { KbdBadge } from '../../atoms/KbdBadge/KbdBadge';
import { TextInput } from '../../atoms/Input/TextInput';
import type { Sale } from '@/app/domain/entities/SalesEntities';

interface SaleDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onCancelSale?: (saleId: string, reason: string) => Promise<void>;
  onPrintTicket?: (sale: Sale) => void;
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

function parseSaleItems(items: any[]): ParsedItem[] {
  if (!Array.isArray(items)) return [];

  // Step 1: Normalize items
  const normalized: (ParsedItem & { raw: any })[] = items.map((item, index) => {
    const isService = item.type === 'service' || !!item.serviceId || !!item.service;
    const name =
      item.name ||
      (item.product as any)?.name ||
      (item.service as any)?.name ||
      (item.serviceId as any)?.name ||
      (isService ? 'Servicio' : 'Artículo');
    const sku = item.sku || (item.product as any)?.sku || (item.serviceId as any)?.sku || '';
    const quantity = item.quantity || 1;
    const unitPrice =
      item.unitPrice ??
      item.priceSnapshot ??
      (item.product as any)?.sellingPrice ??
      (item.serviceId as any)?.basePrice ??
      0;
    const subtotal = item.subtotal ?? unitPrice * quantity;
    const itemId = String(item.cartId || item.id || item._id || `item-${index}`);
    const parentId = item.parentCartId || item.parentId || item.parentServiceId;

    // Extract nested supplies if attached to service object
    const nestedRaw =
      item.suppliesConsumed ||
      item.supplies ||
      (item.serviceId as any)?.supplies ||
      (item.service as any)?.supplies ||
      [];
    const nestedChildren: ParsedItem[] = Array.isArray(nestedRaw)
      ? nestedRaw.map((sup: any, sIdx: number) => {
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

  const branchName = (sale.branch as any)?.name || 'Sucursal Principal';
  const customerName = (sale.customer as any)?.name || 'Cliente General';
  const sellerName = (sale.seller as any)?.name || 'Vendedor';
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
      await onCancelSale(sale.id || (sale as any)._id, cancelReason.trim());
      setIsCancelModalOpen(false);
      setCancelReason('');
      onClose();
    } catch (err: any) {
      setCancelError(err.message || 'Error al cancelar la venta');
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
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '500px',
          maxWidth: '90vw',
          background: 'white',
          boxShadow: '-4px 0 25px rgba(0,0,0,0.15)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Venta {sale.folio || (sale as any)._id?.slice(-8)}
              </h2>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: sale.isCancelled ? '#fef2f2' : '#f0fdf4',
                  color: sale.isCancelled ? '#dc2626' : '#16a34a',
                  border: `1px solid ${sale.isCancelled ? '#fecaca' : '#bbf7d0'}`,
                }}
              >
                {sale.isCancelled ? 'Cancelada' : 'Completada'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>{dateFmt}</p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <Icon name="X" size="md" />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Cliente</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{customerName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Sucursal</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{branchName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Atendió</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginTop: '2px' }}>{sellerName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Método de Pago</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginTop: '2px', textTransform: 'capitalize' }}>
                {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                {(sale as any).paymentReference && <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Ref: {(sale as any).paymentReference}</span>}
              </div>
            </div>
          </div>

          {/* Cancellation Warning Banner */}
          {sale.isCancelled && (
            <div
              style={{
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#991b1b',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: '700', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="AlertTriangle" size="sm" />
                Venta Cancelada
              </div>
              <div>Motivo: {(sale as any).cancelReason || 'Sin motivo registrado'}</div>
            </div>
          )}

          {/* Items breakdown */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Artículos & Servicios ({rootItems.length})
            </h3>

            {rootItems.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '10px', fontSize: '13px' }}>
                Sin artículos registrados en esta venta
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rootItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      background: '#fafafa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {/* Main Item Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {item.type === 'service' && (
                            <span
                              style={{
                                fontSize: '10px',
                                background: '#fffbeb',
                                color: '#d97706',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontWeight: '700',
                                border: '1px solid #fde68a',
                                flexShrink: 0,
                              }}
                            >
                              Servicio
                            </span>
                          )}
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', wordBreak: 'break-word' }}>
                            {item.name}
                          </span>
                        </div>
                        {item.sku && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            SKU: {item.sku}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} c/u
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                          Cant: <span style={{ color: '#0f172a', fontWeight: '700' }}>{item.quantity}</span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                          ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Child Service Supplies Container */}
                    {item.childItems.length > 0 && (
                      <div
                        style={{
                          marginTop: '4px',
                          paddingTop: '10px',
                          borderTop: '1px dashed #cbd5e1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {item.childItems.map((child) => (
                          <div
                            key={child.id}
                            style={{
                              border: '1px solid #bae6fd',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              background: '#f0f9ff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    background: '#bae6fd',
                                    color: '#0369a1',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    border: '1px solid #7dd3fc',
                                    flexShrink: 0,
                                  }}
                                >
                                  Insumo de servicio
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0369a1', wordBreak: 'break-word' }}>
                                  {child.name}
                                </span>
                              </div>
                              {child.sku && (
                                <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
                                  SKU: {child.sku}
                                </div>
                              )}
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600' }}>
                                Cant: <span style={{ fontWeight: '700' }}>{child.quantity}</span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1', marginTop: '1px' }}>
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
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
              <span>Subtotal</span>
              <span>${(sale.subtotal ?? sale.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            {sale.discount ? sale.discount > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                <span>Descuento</span>
                <span>-${sale.discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            ) : null : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: '#0f172a', paddingTop: '8px', borderTop: '1px solid #cbd5e1' }}>
              <span>Total</span>
              <span>${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px' }}>
          {onPrintTicket && (
            <SecondaryButton className="flex-1 justify-center" onClick={() => onPrintTicket(sale)}>
              <Icon name="Printer" size="sm" className="mr-2" />
              Imprimir Ticket
            </SecondaryButton>
          )}

          {!sale.isCancelled && onCancelSale && (
            <PrimaryButton
              className="flex-1 justify-center"
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
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
            ¿Estás seguro de que deseas cancelar la venta <strong>{sale.folio || (sale as any)._id?.slice(-8)}</strong>? Esta acción devolverá el stock de los productos e insumos al almacén.
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
              onChange={(e) => setCancelReason(e.target.value)}
              onKeyDown={(e) => {
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

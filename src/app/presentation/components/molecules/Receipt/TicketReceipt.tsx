import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Sale } from '@/app/domain';
import { usePrinterSettingsStore } from '@/app/presentation/stores';

interface TicketReceiptProps {
  sale: Sale | null;
  branchName?: string;
  sellerName?: string;
}

interface ParsedTicketItem {
  id: string;
  cartId?: string;
  parentCartId?: string;
  type: 'product' | 'service';
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  childItems: ParsedTicketItem[];
}

interface RawTicketItem {
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
  service?: { name?: string; supplies?: RawTicketItem[] };
  serviceId?: { name?: string; sku?: string; basePrice?: number; supplies?: RawTicketItem[] };
  supplies?: RawTicketItem[];
  suppliesConsumed?: RawTicketItem[];
}

function parseSaleItemsForTicket(items: unknown[]): ParsedTicketItem[] {
  if (!Array.isArray(items)) return [];

  const rawList = items as RawTicketItem[];
  const normalized = rawList.map((item, index) => {
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

    const nestedRaw =
      item.suppliesConsumed ||
      item.supplies ||
      item.serviceId?.supplies ||
      item.service?.supplies ||
      [];
    const nestedChildren: ParsedTicketItem[] = Array.isArray(nestedRaw)
      ? nestedRaw.map((sup: RawTicketItem, sIdx: number) => {
        const supProd = sup.product && typeof sup.product === 'object' ? sup.product : null;
        const supName = sup.name || supProd?.name || 'Insumo de servicio';
        const supSku = sup.sku || supProd?.sku || '';
        const supQty = sup.quantity || 1;
        const supPrice = sup.unitPrice ?? sup.priceSnapshot ?? supProd?.sellingPrice ?? 0;
        return {
          id: `nested-${index}-${sIdx}`,
          type: 'product',
          name: supName,
          sku: supSku,
          quantity: supQty,
          unitPrice: supPrice,
          subtotal: sup.subtotal ?? supPrice * supQty,
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
      childItems: nestedChildren,
    };
  });

  const rootItems: ParsedTicketItem[] = [];
  const childrenMap = new Map<string, ParsedTicketItem[]>();

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
        childItems: item.childItems,
      });
    }
  });

  normalized.forEach((item) => {
    if (!item.parentCartId) {
      const explicitChildren = childrenMap.get(item.cartId || item.id) || [];
      rootItems.push({
        ...item,
        childItems: [...item.childItems, ...explicitChildren],
      });
    }
  });

  return rootItems;
}

const FONT_FAMILY = "'Courier New', Courier, monospace";
const SEPARATOR_DOUBLE = '══════════════════════════';
const SEPARATOR_DASH = '──────────────────────────';

export const TicketReceipt: React.FC<TicketReceiptProps> = ({
  sale,
  branchName,
  sellerName,
}) => {
  const settings = usePrinterSettingsStore(
    useShallow((s) => ({
      paperWidth: s.paperWidth,
      fontSize: s.fontSize,
      businessName: s.businessName,
      businessTagline: s.businessTagline,
      phone: s.phone,
      showPhone: s.showPhone,
      address: s.address,
      showAddress: s.showAddress,
      showFolio: s.showFolio,
      showCashier: s.showCashier,
      showCutLine: s.showCutLine,
      showPolicies: s.showPolicies,
      policiesTitle: s.policiesTitle,
      policiesText: s.policiesText,
      footerMessage: s.footerMessage,
      footerSubtext: s.footerSubtext,
    }))
  );

  if (!sale) return null;

  const now = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const datePart = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timePart = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

  const sName = sellerName || sale.seller?.name || 'Cajero';

  const subtotal = sale.subtotal ?? (sale.items ?? []).reduce((acc, i) => acc + ((Number((i as { unitPrice?: number }).unitPrice) || 0) * (Number((i as { quantity?: number }).quantity) || 1)), 0);
  const total = sale.total ?? subtotal;
  const discount = sale.discount ?? 0;
  const rawSaleId = '_id' in sale && typeof (sale as { _id?: unknown })._id === 'string' ? (sale as { _id: string })._id : '';
  const folioStr = sale.folio || `NV-${String(rawSaleId.slice(-6) || '000001').padStart(6, '0')}`;

  const rootItems = parseSaleItemsForTicket(sale.items ?? []);

  const paymentLabel =
    sale.paymentMethod === 'cash' ? 'EFECTIVO'
      : sale.paymentMethod === 'card' ? 'TARJETA'
        : sale.paymentMethod === 'transfer' ? 'TRANSFERENCIA'
          : 'EFECTIVO';

  const ticketWidth = settings.paperWidth === '58mm' ? '58mm' : '80mm';
  const fontSize = settings.fontSize === 'compact' ? '8.5px' : settings.fontSize === 'large' ? '12px' : '10px';

  const policiesLines = (settings.policiesText || '').split('\n').filter((l) => l.trim().length > 0);

  return (
    <div
      id="ticket-receipt"
      className="hidden print:block"
      style={{
        width: ticketWidth,
        margin: '0 auto',
        padding: '6px 4px',
        fontFamily: FONT_FAMILY,
        fontSize,
        color: '#000000',
        background: '#ffffff',
        lineHeight: 1.3,
      }}
    >
      {/* ══ Store Header ══ */}
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.3px' }}>{SEPARATOR_DOUBLE}</div>
        <h1 style={{
          fontSize: '13px', fontWeight: '900', margin: '4px 0 1px 0',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {settings.businessName}
        </h1>
        <p style={{ margin: '0 0 3px 0', fontSize: '9px', fontWeight: '600', letterSpacing: '0.3px' }}>
          {settings.businessTagline}
        </p>
        <p style={{ margin: '0 0 1px 0', fontSize: '9px', fontWeight: 'bold' }}>
          SUCURSAL: {branchName || sale.branch?.name || settings.businessName}
        </p>
        {settings.showPhone && settings.phone && (
          <p style={{ margin: '0 0 1px 0', fontSize: '9px' }}>
            Tel./WhatsApp: {settings.phone}
          </p>
        )}
        {settings.showAddress && settings.address && (
          <p style={{ margin: '0', fontSize: '8px', color: '#000000' }}>
            {settings.address}
          </p>
        )}
        <div style={{ fontSize: '9px', letterSpacing: '0.3px', marginTop: '3px' }}>{SEPARATOR_DOUBLE}</div>
      </div>

      {/* ── Ticket Metadata ── */}
      <div style={{ fontSize: '9px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>FECHA: <strong>{datePart}</strong></span>
          <span>HORA: <strong>{timePart}</strong></span>
        </div>
        {settings.showFolio && (
          <div style={{ marginTop: '1px' }}>
            FOLIO: <strong>#{folioStr}</strong>
          </div>
        )}
        {settings.showCashier && (
          <div style={{ marginTop: '1px' }}>
            ATENDIÓ: <strong>{sName}</strong>
          </div>
        )}
        {sale.isCancelled && (
          <div style={{
            textAlign: 'center', fontWeight: 'bold',
            border: '2px solid #000', padding: '3px', marginTop: '4px', fontSize: '10px',
          }}>
            *** VENTA CANCELADA ***
          </div>
        )}
      </div>

      {/* ── Items ── */}
      <div style={{ fontSize: '9px', letterSpacing: '0.3px', margin: '2px 0' }}>{SEPARATOR_DASH}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold', padding: '1px 0' }}>
        <span>CANT</span>
        <span style={{ flex: 1, paddingLeft: '6px' }}>CONCEPTO</span>
        <span>IMPORTE</span>
      </div>
      <div style={{ fontSize: '9px', letterSpacing: '0.3px', margin: '2px 0' }}>{SEPARATOR_DASH}</div>

      {rootItems.map((item) => {
        const isService = item.type === 'service';
        return (
          <React.Fragment key={item.id}>
            {/* Main item */}
            <div style={{ marginBottom: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span style={{ fontWeight: 'bold', minWidth: '28px' }}>{item.quantity}</span>
                <span style={{ flex: 1, paddingLeft: '4px', fontWeight: 'bold', wordBreak: 'break-word' }}>
                  {isService ? `[SERV] ${item.name}` : item.name}
                </span>
                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingLeft: '4px' }}>
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
              {item.unitPrice !== item.subtotal / item.quantity || item.quantity > 1 ? (
                <div style={{ fontSize: '8px', color: '#000000', paddingLeft: '32px' }}>
                  {item.quantity} x ${item.unitPrice.toFixed(2)}
                </div>
              ) : null}
            </div>

            {/* Child items (supplies) */}
            {item.childItems.map((child, cIdx) => (
              <div key={child.id || `c-${cIdx}`} style={{ marginBottom: '2px', paddingLeft: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#000000' }}>
                  <span style={{ minWidth: '24px' }}>{child.quantity}</span>
                  <span style={{ flex: 1, paddingLeft: '2px' }}>
                    └ {child.name}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', paddingLeft: '4px' }}>
                    ${child.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </React.Fragment>
        );
      })}

      <div style={{ fontSize: '9px', letterSpacing: '0.3px', margin: '4px 0 2px' }}>{SEPARATOR_DASH}</div>

      {/* ── Totals ── */}
      <div style={{ fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
          <span>SUBTOTAL:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
            <span>DESCUENTO:</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '12px', fontWeight: '900',
          borderTop: '1px solid #000', paddingTop: '3px', marginTop: '2px',
        }}>
          <span>TOTAL:</span>
          <span>${total.toFixed(2)} MXN</span>
        </div>
      </div>

      {/* ── Payment Method ── */}
      <div style={{ fontSize: '9px', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>MÉTODO DE PAGO:</span>
          <span style={{ fontWeight: 'bold' }}>{paymentLabel}</span>
        </div>
      </div>

      {/* ══ IMPORTANTE (Políticas) ══ */}
      {settings.showPolicies && settings.policiesText && (
        <>
          <div style={{ fontSize: '9px', letterSpacing: '0.3px', margin: '6px 0 2px' }}>{SEPARATOR_DOUBLE}</div>
          <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '900', marginBottom: '4px' }}>
            {settings.policiesTitle || 'IMPORTANTE'}
          </div>
          <div style={{ fontSize: '8px', lineHeight: 1.35, paddingLeft: '4px' }}>
            {policiesLines.map((line, idx) => (
              <p key={idx} style={{ margin: '0 0 3px 0' }}>{line}</p>
            ))}
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '10px', borderTop: '1px solid #000', paddingTop: '4px' }}>
        <p style={{ margin: '0 0 2px 0', fontWeight: '900' }}>
          {settings.footerMessage || '¡GRACIAS POR SU PREFERENCIA!'}
        </p>
        {settings.footerSubtext && (
          <p style={{ margin: '0', fontSize: '9px', fontWeight: '700' }}>
            {settings.footerSubtext}
          </p>
        )}
      </div>

      {settings.showCutLine && (
        <div style={{ fontSize: '9px', letterSpacing: '0.3px', marginTop: '6px', textAlign: 'center', color: '#000000' }}>
          - - - - CORTE DE TICKET - - - -
        </div>
      )}
    </div>
  );
};

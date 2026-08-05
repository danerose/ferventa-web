import React from 'react';
import type { Sale } from '@/app/domain/entities/SalesEntities';

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

function parseSaleItemsForTicket(items: any[]): ParsedTicketItem[] {
  if (!Array.isArray(items)) return [];

  const normalized = items.map((item, index) => {
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

    const nestedRaw =
      item.suppliesConsumed ||
      item.supplies ||
      (item.serviceId as any)?.supplies ||
      (item.service as any)?.supplies ||
      [];
    const nestedChildren: ParsedTicketItem[] = Array.isArray(nestedRaw)
      ? nestedRaw.map((sup: any, sIdx: number) => {
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
        childItems: combinedChildren,
      });
    }
  });

  return rootItems;
}

export const TicketReceipt: React.FC<TicketReceiptProps> = ({
  sale,
  branchName,
  sellerName,
}) => {
  if (!sale) return null;

  const dateFmt = sale.createdAt
    ? new Date(sale.createdAt).toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('es-MX');

  const bName = branchName || (sale.branch as any)?.name || 'Sucursal Matriz';
  const sName = sellerName || (sale.seller as any)?.name || 'Atención en Caja';
  const cName = (sale.customer as any)?.name || 'Público General';

  const subtotal = sale.subtotal ?? (sale.items ?? []).reduce((acc, i) => acc + ((i.unitPrice ?? 0) * (i.quantity ?? 1)), 0);
  const total = sale.total ?? subtotal;
  const discount = sale.discount ?? 0;
  const folioStr = sale.folio || (sale as any)._id?.slice(-8) || '0000';

  const rootItems = parseSaleItemsForTicket(sale.items ?? []);

  return (
    <div
      id="ticket-receipt"
      className="hidden print:block"
      style={{
        width: '80mm',
        margin: '0 auto',
        padding: '10px',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px',
        color: '#000',
        background: '#fff',
        lineHeight: 1.25,
      }}
    >
      {/* Store Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '15px', fontWeight: '900', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          FERVENTA - AUTOPARTES Y TALLER
        </h1>
        <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 'bold' }}>{bName.toUpperCase()}</p>
        <p style={{ margin: 0, fontSize: '10px' }}>TEL: 81 1876 5432</p>
        <div style={{ borderBottom: '1.5px solid #000', margin: '6px 0' }} />
      </div>

      {/* Ticket Metadata */}
      <div style={{ fontSize: '10px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>FECHA: <strong>{dateFmt}</strong></span>
          <span>FOLIO: <strong>#{folioStr}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span>ATENDIÓ: {sName}</span>
          <span>CLIENTE: {cName}</span>
        </div>
        {sale.isCancelled && (
          <div style={{ textAlign: 'center', color: '#000', fontWeight: 'bold', border: '2px solid #000', padding: '4px', marginTop: '6px', fontSize: '11px' }}>
            *** VENTA CANCELADA ***
          </div>
        )}
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000' }}>
            <th style={{ textAlign: 'left', paddingBottom: '3px', width: '35px' }}>CAN</th>
            <th style={{ textAlign: 'right', paddingBottom: '3px', width: '55px' }}>PRE</th>
            <th style={{ textAlign: 'left', paddingBottom: '3px', paddingLeft: '6px' }}>CONCEPTO</th>
            <th style={{ textAlign: 'right', paddingBottom: '3px', width: '60px' }}>SUM</th>
          </tr>
        </thead>
        <tbody>
          {rootItems.map((item) => {
            const isService = item.type === 'service';
            return (
              <React.Fragment key={item.id}>
                <tr style={{ borderBottom: item.childItems.length > 0 ? 'none' : '1px dotted #888' }}>
                  <td style={{ padding: '3px 0', verticalAlign: 'top', fontWeight: 'bold' }}>{item.quantity} x</td>
                  <td style={{ textAlign: 'right', padding: '3px 0', verticalAlign: 'top' }}>
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td style={{ padding: '3px 0 3px 6px', verticalAlign: 'top', fontWeight: 'bold' }}>
                    {isService ? `[SERVICIO] ${item.name.toUpperCase()}` : item.name.toUpperCase()}
                    {item.sku && <div style={{ fontSize: '8px', fontWeight: 'normal', color: '#333' }}>SKU: {item.sku}</div>}
                  </td>
                  <td style={{ textAlign: 'right', padding: '3px 0', verticalAlign: 'top', fontWeight: 'bold' }}>
                    ${item.subtotal.toFixed(2)}
                  </td>
                </tr>

                {item.childItems.map((child, cIdx) => (
                  <tr
                    key={child.id || `c-${cIdx}`}
                    style={{
                      borderBottom: cIdx === item.childItems.length - 1 ? '1px dotted #888' : 'none',
                    }}
                  >
                    <td style={{ padding: '2px 0 2px 8px', verticalAlign: 'top', fontSize: '9px', color: '#444' }}>
                      {child.quantity} x
                    </td>
                    <td style={{ textAlign: 'right', padding: '2px 0', verticalAlign: 'top', fontSize: '9px', color: '#444' }}>
                      ${child.unitPrice.toFixed(2)}
                    </td>
                    <td style={{ padding: '2px 0 2px 10px', verticalAlign: 'top', fontSize: '9px', color: '#111' }}>
                      └ [INSUMO] {child.name.toUpperCase()}
                      {child.sku && <span style={{ fontSize: '8px', color: '#555' }}> ({child.sku})</span>}
                    </td>
                    <td style={{ textAlign: 'right', padding: '2px 0', verticalAlign: 'top', fontSize: '9px', fontWeight: 'bold', color: '#111' }}>
                      ${child.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

      {/* Totals Section */}
      <div style={{ fontSize: '11px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>SUBTOTAL:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>DESCUENTO:</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '2px' }}>
          <span>TOTAL:</span>
          <span>${total.toFixed(2)} MXN</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
          <span>MÉTODO PAGO:</span>
          <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
            {sale.paymentMethod === 'cash' ? 'EFECTIVO' : sale.paymentMethod === 'card' ? 'TARJETA' : 'TRANSFERENCIA'}
          </span>
        </div>
      </div>

      <div style={{ borderBottom: '1.5px solid #000', margin: '10px 0 8px 0' }} />

      {/* Footer Details */}
      <div style={{ textAlign: 'center', fontSize: '10px', lineHeight: 1.3 }}>
        <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>IVA INCLUIDO</p>
        <p style={{ margin: '0 0 2px 0' }}>NO. TICKET / FOLIO: #{folioStr}</p>
        <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '11px' }}>¡GRACIAS POR SU PREFERENCIA!</p>
      </div>
    </div>
  );
};

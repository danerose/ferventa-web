import React from 'react';
import type { CartItem } from '@/app/domain/entities/SalesEntities';

interface QuotationReceiptProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  applyTax: boolean;
  isFullDiscount: boolean;
  branchName?: string;
  sellerName?: string;
}

export const QuotationReceipt: React.FC<QuotationReceiptProps> = ({
  items,
  subtotal,
  tax,
  total,
  applyTax,
  isFullDiscount,
  branchName = 'Nova FV Sucursal Uman',
}) => {
  if (!items || items.length === 0) return null;

  const now = new Date();
  const dateFmt = `${now.toLocaleDateString('es-MX')} ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;

  const rootItems = items.filter(item => !item.parentCartId);

  return (
    <div
      id="quotation-receipt"
      className="printable-document hidden print:block"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#000000',
        background: '#ffffff',
        padding: '24px',
        maxWidth: '800px',
        margin: '0 auto',
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        pageBreakAfter: 'avoid',
        breakAfter: 'avoid',
      }}
    >
      {/* Centered Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>
          Moto Servicio Nova FV
        </h1>
        <p style={{ fontSize: '15px', color: '#4b5563', fontWeight: '500', margin: '4px 0 0 0' }}>
          Cotización
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 0 0' }}>
          Fecha: {dateFmt}
        </p>
        <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', margin: '2px 0 0 0' }}>
          Sucursal: {branchName}
        </p>
      </div>

      <div style={{ borderBottom: '2px solid #000000', marginBottom: '20px' }} />

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '14px', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000000' }}>
            <th style={{ padding: '8px 4px', fontWeight: '700', color: '#000000', width: '50px' }}>Cant.</th>
            <th style={{ padding: '8px 4px', fontWeight: '700', color: '#000000' }}>Descripción</th>
            <th style={{ padding: '8px 4px', fontWeight: '700', color: '#000000', textAlign: 'right', width: '120px' }}>P. Unitario</th>
            <th style={{ padding: '8px 4px', fontWeight: '700', color: '#000000', textAlign: 'right', width: '120px' }}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {rootItems.map((item) => {
            const childItems = items.filter(child => child.parentCartId === item.cartId);

            const renderRow = (cartItem: CartItem, isChild: boolean) => {
              const itemTotal = isFullDiscount ? 0 : cartItem.subtotal;
              const itemPrice = isFullDiscount ? 0 : cartItem.unitPrice;

              return (
                <tr
                  key={cartItem.cartId}
                  style={{
                    borderBottom: isChild ? '1px solid #f1f5f9' : '1px solid #e2e8f0',
                    background: isChild ? '#f8fafc' : 'transparent',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <td style={{ padding: isChild ? '8px 4px 8px 24px' : '10px 4px', verticalAlign: 'top', color: isChild ? '#64748b' : '#000000', fontSize: isChild ? '13px' : '14px' }}>
                    {cartItem.quantity}
                  </td>
                  <td style={{ padding: isChild ? '8px 4px 8px 24px' : '10px 4px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: isChild ? '400' : '500', color: isChild ? '#334155' : '#111827', fontSize: isChild ? '13px' : '14px' }}>
                      {cartItem.name}
                    </div>
                    {cartItem.sku && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        SKU: {cartItem.sku}
                      </div>
                    )}
                    {cartItem.type === 'service' && !isChild && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          fontSize: '11px',
                          color: '#d97706',
                          fontWeight: 600,
                          border: '1px solid #fde68a',
                          background: '#fffbeb',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          Servicio de taller
                        </span>
                      </div>
                    )}
                    {isChild && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          fontSize: '10px',
                          color: '#2563eb',
                          fontWeight: 600,
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          Insumo
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: isChild ? '8px 4px' : '10px 4px', textAlign: 'right', verticalAlign: 'top', color: isChild ? '#64748b' : '#000000', fontSize: isChild ? '13px' : '14px' }}>
                    ${itemPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: isChild ? '8px 4px' : '10px 4px', textAlign: 'right', verticalAlign: 'top', color: isChild ? '#64748b' : '#000000', fontSize: isChild ? '13px' : '14px' }}>
                    ${itemTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            };

            return (
              <React.Fragment key={item.cartId}>
                {renderRow(item, false)}
                {childItems.map(child => renderRow(child, true))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Totals Breakdown */}
      <div style={{ width: '260px', marginLeft: 'auto', marginBottom: '36px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4b5563', fontSize: '14px' }}>
          <span>Subtotal:</span>
          <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        {isFullDiscount ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#16a34a', fontWeight: '600', fontSize: '14px' }}>
              <span>Descuento (100%):</span>
              <span>-${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4b5563', borderBottom: '1px solid #000000', fontSize: '14px' }}>
              <span>IVA (0%):</span>
              <span>$0.00</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#4b5563', borderBottom: '1px solid #000000', fontSize: '14px' }}>
            <span>IVA {applyTax ? '(16%):' : '(No aplicable):'}</span>
            <span>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
          <span>Total:</span>
          <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Footer Notice */}
      <div style={{ marginTop: '32px', textAlign: 'center', color: '#6b7280', fontSize: '13px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <p style={{ margin: '0 0 4px 0' }}>Esta cotización tiene una vigencia de 15 días a partir de su fecha de expedición.</p>
        <p style={{ margin: 0 }}>Gracias por su preferencia.</p>
      </div>
    </div>
  );
};


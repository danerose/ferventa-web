import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Sale } from '@/app/domain';
import { usePrinterSettingsStore } from '@/app/presentation/stores';

interface TicketReceiptProps {
  sale: Sale | null;
  branchName?: string;
  sellerName?: string;
}

import { parseTicketItems } from '@/core/services/print/templates/ticketItemUtils';
import { NOVA_FV_LOGO_BW_DATA_URI } from '@/core/services/print/logoDataUri';

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

  const rootItems = parseTicketItems(sale.items ?? []);

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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
          <img src={NOVA_FV_LOGO_BW_DATA_URI} alt="Moto Servicio Nova FV" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '0.3px' }}>{SEPARATOR_DOUBLE}</div>
        <h1 style={{
          fontSize: '13px', fontWeight: '900', margin: '3px 0 1px 0',
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
                <span style={{ fontWeight: 'bold', minWidth: '28px' }}>{item.qty}</span>
                <span style={{ flex: 1, paddingLeft: '4px', fontWeight: 'bold', wordBreak: 'break-word' }}>
                  {isService ? `[SERV] ${item.name}` : item.name}
                </span>
                <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingLeft: '4px' }}>
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
              {item.price !== item.subtotal / item.qty || item.qty > 1 ? (
                <div style={{ fontSize: '8px', color: '#000000', paddingLeft: '32px' }}>
                  {item.qty} x ${item.price.toFixed(2)}
                </div>
              ) : null}
            </div>

            {/* Child items (supplies) */}
            {item.supplies && item.supplies.length > 0 && (
              <div style={{ paddingLeft: '22px', marginTop: '2px', marginBottom: '3px', fontSize: '8px', color: '#333' }}>
                {item.supplies.map((child, cIdx) => (
                  <div key={`sup-${item.id}-${cIdx}`} style={{ marginTop: '1.5px', wordBreak: 'break-word', lineHeight: 1.2 }}>
                    • <span style={{ fontStyle: 'italic' }}>{child.qty > 1 ? `${child.qty}x ` : ''}{child.name}</span>{' '}
                    <span style={{ fontSize: '7.5px', color: '#666', marginLeft: '3px' }}>
                      {child.subtotal > 0 ? `(+$${child.subtotal.toFixed(2)})` : '(Incluido)'}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
        </div>
      )}
    </div>
  );
};

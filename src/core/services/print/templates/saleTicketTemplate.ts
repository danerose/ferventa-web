import type { Sale } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';
import { parseTicketItems, type ParsedTicketItem, type ParsedTicketSupply } from './ticketItemUtils';

export type { ParsedTicketItem as PrintItem, ParsedTicketSupply };

export interface PrintTicketOptions {
  sale?: Sale | null;
  branchName?: string;
  sellerName?: string;
  settings: PrinterSettings;
  isTest?: boolean;
}

export function generateSaleTicketHtml({
  sale,
  branchName,
  sellerName,
  settings,
  isTest = false,
}: PrintTicketOptions): string {
  const is58 = settings.paperWidth === '58mm';
  const printableWidth = is58 ? '48mm' : '72mm';

  const sepDouble = is58
    ? '════════════════════════════'
    : '══════════════════════════════════════════';
  const sepDash = is58
    ? '────────────────────────────'
    : '──────────────────────────────────────────';

  const fontSize = is58
    ? (settings.fontSize === 'compact' ? '8.5px' : settings.fontSize === 'large' ? '11px' : '9.5px')
    : (settings.fontSize === 'compact' ? '10px' : settings.fontSize === 'large' ? '13px' : '11.5px');

  const now = sale?.createdAt ? new Date(sale.createdAt) : new Date();
  const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

  const rawSaleId = sale && '_id' in sale && typeof (sale as { _id?: unknown })._id === 'string'
    ? (sale as { _id: string })._id
    : (sale?.id || '');
  const saleIdSuffix = rawSaleId ? rawSaleId.slice(-6) : '000001';
  const folio = sale?.folio || (isTest ? 'NV-000425' : `NV-${saleIdSuffix.padStart(6, '0')}`);
  const cashier = sellerName || sale?.seller?.name || 'Cajero';
  const branch = branchName || sale?.branch?.name || settings.businessName || 'Nova FV Sucursal Uman';

  const items = parseTicketItems(sale?.items, isTest);

  const subtotal = isTest ? 520.0 : (sale?.subtotal ?? items.reduce((a, b) => a + b.subtotal + (b.supplies?.reduce((sa, sb) => sa + sb.subtotal, 0) || 0), 0));
  const discount = isTest ? 0.0 : (sale?.discount ?? 0);
  const total = isTest ? 520.0 : (sale?.total ?? subtotal);
  const paymentMethodLabel = isTest
    ? 'EFECTIVO'
    : sale?.paymentMethod === 'card'
      ? 'TARJETA'
      : sale?.paymentMethod === 'transfer'
        ? 'TRANSFERENCIA'
        : 'EFECTIVO';

  const policiesLines = (settings.policiesText || '')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((line) => `<div style="margin-top: 1px;">${line}</div>`)
    .join('');

  return `
    <div style="width: ${printableWidth}; max-width: ${printableWidth}; margin: 0 auto; padding: 4px 2px 6mm 2px; font-size: ${fontSize}; line-height: 1.25; color: #000000; font-family: 'Courier New', Courier, monospace;">
      <div style="text-align: center;">
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
        <div style="font-weight: 900; font-size: 1.2em; text-transform: uppercase;">${settings.businessName}</div>
        <div style="font-size: 0.85em; font-weight: bold;">${settings.businessTagline}</div>
        <div style="font-size: 0.85em; margin-top: 1px;">SUCURSAL: ${branch}</div>
        ${settings.showPhone && settings.phone ? `<div style="font-size: 0.85em;">Tel./WhatsApp: ${settings.phone}</div>` : ''}
        ${settings.showAddress && settings.address ? `<div style="font-size: 0.8em; margin-top: 1px;">${settings.address}</div>` : ''}
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
      </div>

      <div style="margin: 3px 0; font-size: 0.9em;">
        <div style="display: flex; justify-content: space-between;">
          <span>FECHA: <strong>${dateStr}</strong></span>
          <span>HORA: <strong>${timeStr}</strong></span>
        </div>
        ${settings.showFolio ? `<div style="margin-top: 1px;">FOLIO: <strong>#${folio}</strong></div>` : ''}
        ${settings.showCashier ? `<div style="margin-top: 1px;">ATENDIÓ: <strong>${cashier}</strong></div>` : ''}
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.88em;">
        <span style="min-width: 22px;">CANT</span>
        <span style="flex: 1; padding: 0 4px; text-align: left;">CONCEPTO</span>
        <span>IMPORTE</span>
      </div>
      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      ${items
      .map(
        (item) => `
          <div style="margin-bottom: 3px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-weight: bold; min-width: 22px;">${item.qty}</span>
              <span style="flex: 1; padding: 0 4px; word-break: break-word; font-weight: bold;">
                ${item.isService ? '<span style="font-size: 0.8em; background: #e5e7eb; padding: 0 3px; border-radius: 2px; margin-right: 2px;">SERV</span> ' : ''}${item.name}
              </span>
              <span style="font-weight: bold; white-space: nowrap;">$${item.subtotal.toFixed(2)}</span>
            </div>
            ${item.qty > 1 || Math.abs(item.price - item.subtotal / item.qty) > 0.01
            ? `<div style="font-size: 0.8em; color: #222; padding-left: 22px;">${item.qty} x $${item.price.toFixed(2)}</div>`
            : ''
            }
            ${item.supplies && item.supplies.length > 0
            ? `
              <div style="padding-left: 22px; margin-top: 2px; font-size: 0.82em; color: #333;">
                ${item.supplies.map(sup => `
                  <div style="margin-top: 1.5px; word-break: break-word; line-height: 1.2;">
                    • <span style="font-style: italic;">${sup.qty > 1 ? `${sup.qty}x ` : ''}${sup.name}</span>
                    <span style="font-size: 0.85em; color: #555; margin-left: 3px;">
                      ${sup.subtotal > 0 ? `(+$${sup.subtotal.toFixed(2)})` : '(Incluido)'}
                    </span>
                  </div>
                `).join('')}
              </div>
            `
            : ''
            }
          </div>
        `
      )
      .join('')}

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin-top: 4px; font-size: 0.92em;">
        <div style="display: flex; justify-content: space-between;">
          <span>SUBTOTAL:</span>
          <span style="font-weight: bold;">$${subtotal.toFixed(2)}</span>
        </div>
        ${discount > 0
      ? `<div style="display: flex; justify-content: space-between;">
                <span>DESCUENTO:</span>
                <span style="font-weight: bold;">-$${discount.toFixed(2)}</span>
              </div>`
      : ''
    }
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.15em; border-top: 1px solid #000; padding-top: 2px; margin-top: 3px;">
          <span>TOTAL:</span>
          <span>$${total.toFixed(2)} MXN</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 0.85em;">
          <span>MÉTODO DE PAGO:</span>
          <span style="font-weight: bold;">${paymentMethodLabel}</span>
        </div>
      </div>

      ${settings.showPolicies && settings.policiesText
      ? `
          <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap; margin-top: 4px;">${sepDouble}</div>
          <div style="text-align: center; font-weight: bold; font-size: 0.9em; margin-bottom: 2px;">${settings.policiesTitle || 'IMPORTANTE'}</div>
          <div style="font-size: 0.78em; line-height: 1.25;">
            ${policiesLines}
          </div>
        `
      : ''
    }

      <div style="text-align: center; margin-top: 6px; border-top: 1px solid #000; padding-top: 4px;">
        <div style="font-weight: bold; font-size: 0.9em;">${settings.footerMessage || '¡GRACIAS POR SU PREFERENCIA!'}</div>
        ${settings.footerSubtext ? `<div style="font-weight: bold; font-size: 0.8em; margin-top: 1px;">${settings.footerSubtext}</div>` : ''}
      </div>

      ${settings.showCutLine
      ? `
          <div style="text-align: center; margin-top: 8px; font-size: 0.75em;">
          </div>
        `
      : ''
    }
    </div>
  `;
}

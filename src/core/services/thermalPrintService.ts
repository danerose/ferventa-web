import type { Sale } from '@/app/domain';
import type { PrinterSettings } from '@/app/presentation/stores';

interface PrintTicketOptions {
  sale?: Sale | null;
  branchName?: string;
  sellerName?: string;
  settings: PrinterSettings;
  isTest?: boolean;
}

const FONT_SIZE_MAP = {
  compact: '8.5px',
  normal: '10px',
  large: '12px',
};

const SEPARATOR_DOUBLE = '════════════════════════════';
const SEPARATOR_DASH = '────────────────────────────';

export const thermalPrintService = {
  generateTicketHTML({
    sale,
    branchName,
    sellerName,
    settings,
    isTest = false,
  }: PrintTicketOptions): string {
    const is58 = settings.paperWidth === '58mm';
    const widthCss = is58 ? '58mm' : '80mm';
    const printableWidth = is58 ? '48mm' : '72mm';
    const fontSize = FONT_SIZE_MAP[settings.fontSize] || '10px';

    const now = sale?.createdAt ? new Date(sale.createdAt) : new Date();
    const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
    const folio = sale?.folio || (isTest ? 'NV-000425' : `NV-${String((sale as any)?._id?.slice(-6) || '000001').padStart(6, '0')}`);
    const cashier = sellerName || (sale?.seller as any)?.name || 'Cajero';
    const branch = branchName || (sale?.branch as any)?.name || 'Nova FV Sucursal Uman';

    // Mock items for test or real items from sale
    const items = isTest
      ? [
          { qty: 1, name: 'Aceite Sintético 10W-40 4T', price: 220.0, subtotal: 220.0 },
          { qty: 1, name: '(SERV) Servicio de Afinación Mayor', price: 300.0, subtotal: 300.0 },
        ]
      : (sale?.items || []).map((i: any) => ({
          qty: i.quantity || 1,
          name: i.name || (i.product as any)?.name || (i.service as any)?.name || 'Artículo',
          price: i.unitPrice ?? i.priceSnapshot ?? 0,
          subtotal: i.subtotal ?? (i.unitPrice ?? 0) * (i.quantity ?? 1),
        }));

    const subtotal = isTest ? 520.0 : (sale?.subtotal ?? items.reduce((a, b) => a + b.subtotal, 0));
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
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket #${folio}</title>
          <style>
            @page {
              size: ${widthCss} auto;
              margin: 0mm !important;
            }
            @media print {
              html, body {
                width: ${widthCss} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .ticket-container {
                width: ${printableWidth} !important;
                max-width: ${printableWidth} !important;
                margin: 0 auto !important;
                padding: 2px 2px !important;
              }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${fontSize};
              line-height: 1.2;
              color: #000000;
              background: #ffffff;
              margin: 0;
              padding: 0;
            }
            .ticket-container {
              width: ${printableWidth};
              max-width: ${printableWidth};
              margin: 0 auto;
              padding: 4px 2px;
              box-sizing: border-box;
              word-wrap: break-word;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: 900; }
            .sep-double { overflow: hidden; white-space: nowrap; margin: 2px 0; font-size: 8px; font-weight: bold; }
            .sep-dash { overflow: hidden; white-space: nowrap; margin: 2px 0; font-size: 8px; }
            .row { display: flex; justify-content: space-between; align-items: flex-start; }
            .item-row { margin-bottom: 2px; }
            .item-name { word-break: break-word; flex: 1; padding: 0 3px; }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="center">
              <div class="sep-double">${SEPARATOR_DOUBLE}</div>
              <div class="bold" style="font-size: 1.15em; text-transform: uppercase;">${settings.businessName}</div>
              <div style="font-size: 0.85em; font-weight: bold;">${settings.businessTagline}</div>
              <div style="font-size: 0.85em; font-weight: bold; margin-top: 1px;">SUCURSAL: ${branch}</div>
              ${settings.showPhone && settings.phone ? `<div style="font-size: 0.85em;">Tel./WhatsApp: ${settings.phone}</div>` : ''}
              ${settings.showAddress && settings.address ? `<div style="font-size: 0.75em; margin-top: 1px;">${settings.address}</div>` : ''}
              <div class="sep-double">${SEPARATOR_DOUBLE}</div>
            </div>

            <div style="margin: 3px 0; font-size: 0.9em;">
              <div class="row">
                <span>FECHA: <strong>${dateStr}</strong></span>
                <span>HORA: <strong>${timeStr}</strong></span>
              </div>
              ${settings.showFolio ? `<div style="margin-top: 1px;">FOLIO: <strong>#${folio}</strong></div>` : ''}
              ${settings.showCashier ? `<div style="margin-top: 1px;">ATENDIÓ: <strong>${cashier}</strong></div>` : ''}
            </div>

            <div class="sep-dash">${SEPARATOR_DASH}</div>
            <div class="row bold" style="font-size: 0.85em;">
              <span style="min-width: 20px;">CANT</span>
              <span class="item-name">CONCEPTO</span>
              <span>IMPORTE</span>
            </div>
            <div class="sep-dash">${SEPARATOR_DASH}</div>

            ${items
              .map(
                (item) => `
                <div class="item-row">
                  <div class="row" style="font-size: 0.9em;">
                    <span class="bold" style="min-width: 20px;">${item.qty}</span>
                    <span class="item-name bold">${item.name}</span>
                    <span class="bold" style="white-space: nowrap;">$${item.subtotal.toFixed(2)}</span>
                  </div>
                  ${
                    item.qty > 1 || item.price !== item.subtotal / item.qty
                      ? `<div style="font-size: 0.75em; color: #000; padding-left: 22px;">${item.qty} x $${item.price.toFixed(2)}</div>`
                      : ''
                  }
                </div>
              `
              )
              .join('')}

            <div class="sep-dash">${SEPARATOR_DASH}</div>

            <div style="margin-top: 3px; font-size: 0.9em;">
              <div class="row">
                <span>SUBTOTAL:</span>
                <span class="bold">$${subtotal.toFixed(2)}</span>
              </div>
              ${
                discount > 0
                  ? `<div class="row">
                      <span>DESCUENTO:</span>
                      <span class="bold">-$${discount.toFixed(2)}</span>
                    </div>`
                  : ''
              }
              <div class="row bold" style="font-size: 1.15em; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
                <span>TOTAL:</span>
                <span>$${total.toFixed(2)} MXN</span>
              </div>
              <div class="row" style="margin-top: 2px; font-size: 0.85em;">
                <span>MÉTODO DE PAGO:</span>
                <span class="bold">${paymentMethodLabel}</span>
              </div>
            </div>

            ${
              settings.showPolicies && settings.policiesText
                ? `
                <div class="sep-double">${SEPARATOR_DOUBLE}</div>
                <div class="center bold" style="font-size: 0.9em; margin-bottom: 2px;">${settings.policiesTitle || 'IMPORTANTE'}</div>
                <div style="font-size: 0.75em; line-height: 1.2;">
                  ${policiesLines}
                </div>
              `
                : ''
            }

            <div class="center" style="margin-top: 5px; border-top: 1px solid #000; padding-top: 3px;">
              <div class="bold" style="font-size: 0.9em;">${settings.footerMessage || '¡GRACIAS POR SU PREFERENCIA!'}</div>
              ${settings.footerSubtext ? `<div class="bold" style="font-size: 0.8em; margin-top: 1px;">${settings.footerSubtext}</div>` : ''}
            </div>

            ${
              settings.showCutLine
                ? `
                <div class="center" style="margin-top: 6px; font-size: 0.75em; color: #000;">
                  - - - - CORTE DE TICKET - - - -
                </div>
              `
                : ''
            }
            <div style="height: 6mm;"></div>
          </div>
        </body>
      </html>
    `;
  },

  print(options: PrintTicketOptions) {
    const html = this.generateTicketHTML(options);

    let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'thermal-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      console.error('No se pudo acceder al contexto de impresión del iframe.');
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error al ejecutar impresión térmica:', err);
      }
    }, 250);
  },

  printTestTicket(settings: PrinterSettings, branchName?: string, sellerName?: string) {
    this.print({
      settings,
      branchName,
      sellerName,
      isTest: true,
    });
  },
};

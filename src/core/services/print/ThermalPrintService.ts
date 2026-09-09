import type { Sale } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';

export interface PrintItem {
  qty: number;
  name: string;
  price: number;
  subtotal: number;
}

export interface PrintTicketOptions {
  sale?: Sale | null;
  branchName?: string;
  sellerName?: string;
  settings: PrinterSettings;
  isTest?: boolean;
}

const FONT_SIZE_MAP: Record<string, string> = {
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

    const saleIdSuffix = sale?.id ? sale.id.slice(-6) : '000001';
    const folio = sale?.folio || (isTest ? 'NV-000425' : `NV-${saleIdSuffix.padStart(6, '0')}`);
    const cashier = sellerName || sale?.seller?.name || 'Cajero';
    const branch = branchName || sale?.branch?.name || 'Nova FV Sucursal Uman';

    // Mock items for test or real items from sale
    const items: PrintItem[] = isTest
      ? [
        { qty: 1, name: 'Aceite Sintético 10W-40 4T', price: 220.0, subtotal: 220.0 },
        { qty: 1, name: '(SERV) Servicio de Afinación Mayor', price: 300.0, subtotal: 300.0 },
      ]
      : (sale?.items || []).map((raw) => {
        const i = (typeof raw === 'object' && raw !== null) ? (raw as Record<string, unknown>) : {};
        const qty = Number(i.quantity) || 1;
        const productObj = typeof i.product === 'object' && i.product !== null ? (i.product as { name?: string }) : null;
        const serviceObj = typeof i.service === 'object' && i.service !== null ? (i.service as { name?: string }) : null;
        let name = String(i.name || productObj?.name || serviceObj?.name || 'Artículo');
        const isConsumable = Boolean(
          i.isConsumable ||
          i.parentCartId ||
          name.includes('--')
        );
        if (isConsumable && !name.includes('--')) {
          name = `-- ${name}`;
        }
        const isNoAplica = Boolean(i.isNoAplica);
        const rawPrice = typeof i.unitPrice === 'number'
          ? i.unitPrice
          : typeof i.priceSnapshot === 'number'
            ? i.priceSnapshot
            : Number((productObj as Record<string, unknown>)?.sellingPrice ?? (serviceObj as Record<string, unknown>)?.basePrice ?? 0);
        const unitPrice = isNoAplica ? 0 : rawPrice;
        const subtotal = typeof i.subtotal === 'number' ? (isNoAplica ? 0 : i.subtotal) : unitPrice * qty;

        return {
          qty,
          name,
          price: unitPrice,
          subtotal,
        };
      });

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

    // Estimación dinámica de la altura del ticket en mm para que el navegador configure
    // un lienzo exacto al tamaño del ticket y no recurra al tamaño Carta / US Letter.
    let estimatedHeightMm = 82; // Base: encabezado, separadores, fecha, hora, totales y pie
    if (settings.phone) estimatedHeightMm += 4;
    if (settings.address) estimatedHeightMm += 7;
    if (settings.showFolio) estimatedHeightMm += 4;
    if (settings.showCashier) estimatedHeightMm += 4;

    items.forEach((item) => {
      const charLimit = is58 ? 20 : 34;
      const lines = Math.ceil(item.name.length / charLimit);
      estimatedHeightMm += Math.max(1, lines) * 4.5;
      if (item.qty > 1) estimatedHeightMm += 3.5;
    });

    if (settings.showPolicies && settings.policiesText) {
      const pCount = (settings.policiesText || '').split('\n').filter((l) => l.trim().length > 0).length;
      estimatedHeightMm += 8 + (pCount * 3.5);
    }

    if (settings.footerSubtext) estimatedHeightMm += 4;
    if (settings.showCutLine) estimatedHeightMm += 6;
    // Margen final de seguridad para el rodillo térmico (alimentación de papel antes del corte)
    estimatedHeightMm += 12;

    const pageHeightMm = Math.max(85, Math.ceil(estimatedHeightMm));

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket #${folio}</title>
          <style>
            @page {
              size: ${widthCss} ${pageHeightMm}mm;
              margin: 0mm;
            }
            @media print {
              html, body {
                width: ${widthCss} !important;
                min-height: ${pageHeightMm}mm !important;
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
                padding: 2px 2px 8mm 2px !important;
                box-sizing: border-box !important;
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
              width: ${widthCss};
              box-sizing: border-box;
            }
            .ticket-container {
              width: ${printableWidth};
              max-width: ${printableWidth};
              margin: 0 auto;
              padding: 4px 2px 8mm 2px;
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
                  ${item.qty > 1 || item.price !== item.subtotal / item.qty
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
              ${discount > 0
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

            ${settings.showPolicies && settings.policiesText
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

            ${settings.showCutLine
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
        const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
        if (iframeDoc) {
          const scrollH = iframeDoc.body?.scrollHeight || iframeDoc.documentElement?.scrollHeight || 0;
          if (scrollH > 0) {
            const is58 = options.settings.paperWidth === '58mm';
            const widthCss = is58 ? '58mm' : '80mm';
            // Conversión: 96 CSS px = 25.4mm + 12mm de margen de avance
            const measuredHeightMm = Math.ceil((scrollH / 96) * 25.4) + 12;
            const dynamicStyle = iframeDoc.createElement('style');
            dynamicStyle.innerHTML = `@page { size: ${widthCss} ${measuredHeightMm}mm !important; margin: 0mm !important; }`;
            iframeDoc.head.appendChild(dynamicStyle);
          }
        }
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

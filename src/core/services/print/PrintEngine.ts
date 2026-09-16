/**
 * PrintEngine
 * 
 * Single Responsibility: Cross-platform printing dispatcher.
 * Handles isolated iframe creation, dimensioning, asset loading (fonts & images),
 * and triggering the native print dialog safely in Safari/macOS and Chrome/Windows
 * without interfering with the main application DOM.
 */

export interface PrintThermalEngineOptions {
  width: '58mm' | '80mm';
  title?: string;
  autoHeight?: boolean;
}

export interface PrintLabelEngineOptions {
  widthMm: number;
  heightMm: number;
  title?: string;
}

export interface PrintDocumentEngineOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  size?: 'letter' | 'a4';
  margin?: string;
}

class PrintEngine {
  private getOrCreateIframe(id = 'app-isolated-print-iframe', widthCss = '80mm'): HTMLIFrameElement {
    const existing = document.getElementById(id) as HTMLIFrameElement | null;
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = id;
    // Critical for Safari / WebKit:
    // Safari strictly refuses to print iframes with `display: none` or `visibility: hidden`.
    // It must exist in the render tree with non-zero dimensions matching the target paper, but remain invisible.
    iframe.style.position = 'fixed';
    iframe.style.top = '0px';
    iframe.style.left = '0px';
    iframe.style.width = widthCss;
    iframe.style.height = '100px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.001';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-99999';
    iframe.style.background = 'transparent';

    document.body.appendChild(iframe);
    return iframe;
  }

  /**
   * Spools HTML into the iframe, waits for all images and fonts to finish loading,
   * calculates the exact height in millimeters, updates @page size to <width> <heightMm>mm
   * so the browser NEVER falls back to US Letter, and triggers print.
   */
  private async executePrint(
    iframe: HTMLIFrameElement,
    html: string,
    dynamicPageOptions?: { width: string; title?: string }
  ): Promise<void> {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      console.error('[PrintEngine] No se pudo acceder al contexto de impresión.');
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const win = iframe.contentWindow;
    if (!win) return;

    // 1. Wait for document fonts to be ready
    try {
      if (doc.fonts && doc.fonts.ready) {
        await doc.fonts.ready;
      }
    } catch {
      // Ignore font readiness errors
    }

    // 2. Wait for any images (e.g. QR codes data URI) to be loaded and decoded
    const images = Array.from(doc.images);
    if (images.length > 0) {
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                if ('decode' in img) {
                  img.decode().then(() => resolve()).catch(() => resolve());
                } else {
                  resolve();
                }
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );
    }

    // 3. Measure exact rendered content height and inject dynamic @page { size: W H; }
    // Critical: CSS Paged Media forbids `auto` as height when width is specified (<length>{1,2}).
    // Also, CSS descriptors in @page DO NOT accept `!important`; adding `!important` makes the browser
    // reject the @page rule completely and fall back to US Letter (Carta).
    // By calculating the exact rendered height in mm and injecting clean, valid CSS:
    // `@media print { @page { size: ${width} ${heightMm}mm; margin: 0mm; } }`
    // both Chrome print preview and physical spoolers format the ticket as an exact continuous strip.
    if (dynamicPageOptions) {
      const rootEl = (doc.querySelector('.ticket-root') || doc.body) as HTMLElement | null;
      const contentPx = rootEl ? Math.max(rootEl.offsetHeight, rootEl.scrollHeight) : (doc.body?.scrollHeight || 0);
      if (contentPx > 0) {
        // 96 CSS pixels = 25.4mm
        const measuredHeightMm = Math.max(40, Math.ceil((contentPx / 96) * 25.4) + 4);
        let dynamicStyle = doc.getElementById('dynamic-thermal-page-style') as HTMLStyleElement | null;
        if (!dynamicStyle) {
          dynamicStyle = doc.createElement('style');
          dynamicStyle.id = 'dynamic-thermal-page-style';
          doc.head.appendChild(dynamicStyle);
        }
        dynamicStyle.textContent = `
          @page {
            size: ${dynamicPageOptions.width} ${measuredHeightMm}mm;
            margin: 0mm;
          }
          @media print {
            @page {
              size: ${dynamicPageOptions.width} ${measuredHeightMm}mm;
              margin: 0mm;
            }
          }
        `;
      }
    }

    // 4. Double requestAnimationFrame to ensure the layout & @page styles are fully applied
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 60);
        });
      });
    });

    try {
      win.focus();
      win.print();
    } catch (err) {
      console.error('[PrintEngine] Error al ejecutar win.print():', err);
    }
  }

  /**
   * Print continuous thermal tickets (58mm or 80mm roll).
   * Exact roll width, zero margin, automatic vertical sizing with no blank page ejection.
   */
  public async printThermal(bodyContent: string, options: PrintThermalEngineOptions): Promise<void> {
    const width = options.width || '80mm';
    const title = options.title || 'Ticket Térmico';

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style id="base-thermal-page-style">
            @page {
              size: ${width} 240mm;
              margin: 0mm;
            }
            @media print {
              @page {
                size: ${width} 240mm;
                margin: 0mm;
              }
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              width: ${width};
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Courier New', Courier, monospace;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              overflow: visible;
            }
            .ticket-root {
              width: ${width};
              margin: 0 auto;
              padding: 0;
              page-break-inside: avoid;
              break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="ticket-root">
            ${bodyContent}
          </div>
        </body>
      </html>
    `;

    const iframe = this.getOrCreateIframe('app-thermal-print-iframe', width);
    await this.executePrint(iframe, fullHtml, { width, title });
  }

  /**
   * Print individual adhesive label stickers (QR / Barcode).
   * Exact physical millimeter dimensions prevent feeding a full letter sheet.
   */
  public async printLabel(bodyContent: string, options: PrintLabelEngineOptions): Promise<void> {
    const { widthMm, heightMm, title = 'Etiqueta Adhesiva' } = options;
    const widthCss = `${widthMm}mm`;
    const heightCss = `${heightMm}mm`;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              size: ${widthCss} ${heightCss};
              margin: 0mm;
            }
            @media print {
              @page {
                size: ${widthCss} ${heightCss};
                margin: 0mm;
              }
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              width: ${widthCss};
              height: ${heightCss};
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              overflow: hidden;
            }
            .label-root {
              width: ${widthCss};
              height: ${heightCss};
              margin: 0;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="label-root">
            ${bodyContent}
          </div>
        </body>
      </html>
    `;

    const iframe = this.getOrCreateIframe('app-label-print-iframe');
    await this.executePrint(iframe, fullHtml);
  }

  /**
   * Print standard Letter or A4 document (Reception contracts, appointment confirmations, invoices).
   * Exact margins, crisp typography, clean page breaks, full support for signatures and legal clauses.
   */
  public async printDocument(bodyContent: string, options: PrintDocumentEngineOptions = {}): Promise<void> {
    const {
      title = 'Comprobante',
      orientation = 'portrait',
      size = 'letter',
      margin = '14mm 16mm',
    } = options;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page {
              size: ${size} ${orientation};
              margin: ${margin};
            }
            @media print {
              @page {
                size: ${size} ${orientation};
                margin: ${margin};
              }
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .document-root {
              width: 100%;
              max-width: 760px;
              margin: 0 auto;
              padding: 2mm 4mm;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            /* Overwrite any hidden helper classes in cloned templates */
            .hidden {
              display: block !important;
            }
            @media screen {
              body {
                display: block;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-root">
            ${bodyContent}
          </div>
        </body>
      </html>
    `;

    const iframe = this.getOrCreateIframe('app-document-print-iframe');
    await this.executePrint(iframe, fullHtml);
  }
}

export const printEngine = new PrintEngine();

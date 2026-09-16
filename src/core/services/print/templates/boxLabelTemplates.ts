export interface BoxLabelData {
  boxCode: string;
  productName: string;
  itemsPerBox?: number;
  receptionFolio?: string;
  branchName?: string;
  qrDataUrl?: string;
  dateStr?: string;
}

/**
 * Generates exact 4x2 inch (101.6mm x 50.8mm) adhesive sticker label HTML
 */
export function generateBoxLabel4x2Html(data: BoxLabelData): string {
  const {
    boxCode,
    productName,
    itemsPerBox = 1,
    receptionFolio = 'REC-001',
    branchName = 'Nova FV Uman',
    qrDataUrl = '',
    dateStr = '',
  } = data;

  return `
    <div style="width: 101.6mm; height: 50.8mm; padding: 3mm 4mm; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 4mm; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #000000; background: #ffffff;">
      ${
        qrDataUrl
          ? `<img src="${qrDataUrl}" alt="${boxCode}" style="width: 38mm; height: 38mm; object-fit: contain; flex-shrink: 0; border: 1px solid #e2e8f0; border-radius: 4px;" />`
          : `<div style="width: 38mm; height: 38mm; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8; flex-shrink: 0;">SIN QR</div>`
      }

      <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
        <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">
          FERVENTA • ${branchName}
        </div>
        <div style="font-size: 12.5px; font-weight: 900; color: #0f172a; margin: 1px 0 3px 0; line-height: 1.2; word-break: break-word;">
          ${productName}
        </div>
        <div style="display: flex; align-items: center; gap: 4px; margin: 1px 0;">
          <span style="background: #0f172a; color: #ffffff; font-size: 9.5px; font-weight: 900; padding: 1px 5px; border-radius: 3px;">
            ${itemsPerBox} PIEZAS
          </span>
          <span style="font-size: 9.5px; font-family: monospace; color: #64748b; font-weight: bold;">
            ${receptionFolio}
          </span>
        </div>
        <div style="font-size: 12px; font-weight: 900; font-family: monospace; letter-spacing: 0.8px; margin-top: 3px; background: #f1f5f9; padding: 2px 4px; border-radius: 3px; border: 1px solid #e2e8f0;">
          ${boxCode}
        </div>
        ${dateStr ? `<div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">${dateStr}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Generates continuous thermal roll ticket for box/carton (58mm or 80mm)
 */
export function generateBoxThermalTicketHtml(data: BoxLabelData, paperWidth: '58mm' | '80mm' = '58mm'): string {
  const {
    boxCode,
    productName,
    itemsPerBox = 1,
    receptionFolio = 'REC-001',
    branchName = 'Nova FV Uman',
    qrDataUrl = '',
    dateStr = '',
  } = data;

  const printableWidth = paperWidth === '58mm' ? '48mm' : '72mm';
  const sep = paperWidth === '58mm'
    ? '════════════════════════════'
    : '══════════════════════════════════════════';

  return `
    <div style="width: ${printableWidth}; max-width: ${printableWidth}; margin: 0 auto; padding: 4px 2px 4mm 2px; font-family: 'Courier New', Courier, monospace; color: #000000; text-align: center; font-size: 10px;">
      <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sep}</div>
      <div style="font-weight: 900; font-size: 12px; text-transform: uppercase;">ETIQUETA DE CAJA</div>
      <div style="font-size: 9px; font-weight: bold;">FERVENTA • ${branchName}</div>
      <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap; margin-bottom: 4px;">${sep}</div>

      ${
        qrDataUrl
          ? `<div style="margin: 4px 0;"><img src="${qrDataUrl}" alt="${boxCode}" style="width: 38mm; height: 38mm; object-fit: contain;" /></div>`
          : ''
      }

      <div style="font-weight: 900; font-size: 13px; margin: 4px 0; word-break: break-word;">
        ${boxCode}
      </div>

      <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">
        ${productName}
      </div>

      <div style="font-size: 10px; margin: 2px 0;">
        CANTIDAD: <strong>${itemsPerBox} PIEZAS</strong>
      </div>
      <div style="font-size: 9px; color: #333;">
        FOLIO ENTRADA: <strong>${receptionFolio}</strong>
      </div>
      ${dateStr ? `<div style="font-size: 8px; color: #666; margin-top: 2px;">${dateStr}</div>` : ''}

      <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap; margin-top: 4px;">${sep}</div>
      <div style="font-size: 8px; margin-top: 4px;">- - - - CORTE DE ETIQUETA - - - -</div>
    </div>
  `;
}

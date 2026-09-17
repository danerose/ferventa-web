import type { SpecialOrder } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';
import { formatCurrency, formatDate } from '@/core/utils';

export interface PrintSpecialOrderTicketOptions {
  order: SpecialOrder;
  settings: PrinterSettings;
  branchName?: string;
  sellerName?: string;
}

/**
 * Genera el HTML continuo para impresión térmica (58mm / 80mm) de un Pedido Especial.
 */
export function generateSpecialOrderTicketHtml({
  order,
  settings,
  branchName,
  sellerName,
}: PrintSpecialOrderTicketOptions): string {
  const is58 = settings.paperWidth === '58mm';
  const printableWidth = is58 ? '48mm' : '72mm';

  const sepDouble = is58
    ? '════════════════════════════'
    : '══════════════════════════════════════════';
  const sepDash = is58
    ? '────────────────────────────'
    : '──────────────────────────────────────────';

  const fontSize = is58
    ? settings.fontSize === 'compact'
      ? '8.5px'
      : settings.fontSize === 'large'
        ? '11px'
        : '9.5px'
    : settings.fontSize === 'compact'
      ? '10px'
      : settings.fontSize === 'large'
        ? '13px'
        : '11.5px';

  const now = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const folio = order.folio || order.id?.slice(-6).toUpperCase() || 'PED-001';
  const cashier = sellerName || order.createdBy?.name || 'Asesor de Ventas';
  const branch = branchName || settings.businessName || 'Moto Servicio Nova FV';

  const payments = order.payments || [];

  return `
    <div style="width: ${printableWidth}; max-width: ${printableWidth}; margin: 0 auto; padding: 4px 2px 6mm 2px; font-size: ${fontSize}; line-height: 1.25; color: #000000; font-family: 'Courier New', Courier, monospace;">
      <div style="text-align: center;">
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
        <div style="font-weight: 900; font-size: 1.15em; text-transform: uppercase;">${settings.businessName || 'MOTO SERVICIO NOVA FV'}</div>
        <div style="font-size: 0.85em; font-weight: bold;">${settings.businessTagline || 'Refacciones y Taller Especializado'}</div>
        <div style="font-size: 0.85em; margin-top: 1px;">SUCURSAL: ${branch}</div>
        ${settings.showPhone && settings.phone ? `<div style="font-size: 0.85em;">Tel./WhatsApp: ${settings.phone}</div>` : ''}
        ${settings.showAddress && settings.address ? `<div style="font-size: 0.8em; margin-top: 1px;">${settings.address}</div>` : ''}
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
      </div>

      <div style="text-align: center; margin: 4px 0;">
        <div style="font-weight: 900; font-size: 1.1em; text-transform: uppercase;">COMPROBANTE DE PEDIDO</div>
        <div style="font-weight: bold; font-size: 1.05em; margin-top: 1px;">FOLIO: #${folio}</div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 3px 0; font-size: 0.9em;">
        <div style="display: flex; justify-content: space-between;">
          <span>FECHA: <strong>${dateStr}</strong></span>
          <span>HORA: <strong>${timeStr}</strong></span>
        </div>
        ${order.estimatedArrivalDate ? `
          <div style="margin-top: 1px;">
            LLEGADA ESTIMADA: <strong>${formatDate(order.estimatedArrivalDate)}</strong>
          </div>
        ` : ''}
        <div style="margin-top: 1px;">ATENDIÓ: <strong>${cashier}</strong></div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <!-- DATOS DEL CLIENTE -->
      <div style="margin: 3px 0; font-size: 0.9em;">
        <div>CLIENTE: <strong>${order.customer?.name || 'Cliente de Mostrador'}</strong></div>
        <div>TELÉFONO: <strong>${order.customer?.phone || 'Sin registrar'}</strong></div>
        ${order.customer?.email ? `<div>CORREO: <strong>${order.customer.email}</strong></div>` : ''}
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <!-- DETALLE DEL ARTÍCULO / PRODUCTO SOLICITADO -->
      <div style="margin: 4px 0;">
        <div style="font-weight: bold; text-transform: uppercase; font-size: 0.95em;">PRODUCTO PEDIDO:</div>
        <div style="font-weight: bold; margin-top: 2px; word-break: break-word; font-size: 1.05em;">
          ${order.itemDescription}
        </div>
        ${order.notes ? `
          <div style="font-size: 0.85em; margin-top: 2px; font-style: italic;">
            Nota: "${order.notes}"
          </div>
        ` : ''}
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <!-- RESUMEN FINANCIERO -->
      <div style="margin-top: 4px; font-size: 0.95em;">
        <div style="display: flex; justify-content: space-between;">
          <span>PRECIO DE VENTA:</span>
          <span style="font-weight: bold;">${formatCurrency(order.sellingPrice)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>TOTAL ABONADO/ANTICIPO:</span>
          <span style="font-weight: bold; color: #000;">${formatCurrency(order.advancePayment)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 1.15em; border-top: 1px solid #000; padding-top: 2px; margin-top: 3px;">
          <span>SALDO RESTANTE:</span>
          <span>${order.isFullyPaid ? 'LIQUIDADO ($0.00)' : formatCurrency(order.remainingBalance)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 0.85em;">
          <span>ESTATUS DE PAGO:</span>
          <span style="font-weight: bold;">${order.isFullyPaid ? '100% LIQUIDADO' : `${order.advancePercentage.toFixed(1)}% CUBIERTO`}</span>
        </div>
      </div>

      ${payments.length > 0 ? `
        <div style="font-size: 8px; overflow: hidden; white-space: nowrap; margin-top: 4px;">${sepDash}</div>
        <div style="font-weight: bold; font-size: 0.88em; margin-bottom: 2px;">HISTORIAL DE ABONOS:</div>
        ${payments.map((p, idx) => `
          <div style="display: flex; justify-content: space-between; font-size: 0.82em; margin-bottom: 1px;">
            <span>#${idx + 1} (${p.paymentMethod.toUpperCase()} - ${formatDate(p.date)}):</span>
            <span style="font-weight: bold;">${formatCurrency(p.amount)}</span>
          </div>
        `).join('')}
      ` : ''}

      <!-- POLÍTICAS Y AVISOS LEGALES FORMALES -->
      <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap; margin-top: 4px;">${sepDouble}</div>
      <div style="text-align: center; font-weight: bold; font-size: 0.9em; margin-bottom: 2px;">
        AVISO IMPORTANTE Y POLÍTICAS
      </div>
      
      <div style="font-size: 0.78em; line-height: 1.3; text-align: justify; margin-top: 3px;">
        <div style="margin-bottom: 3px;">
          • <strong>Notificación:</strong> Se le notificará vía llamada telefónica o WhatsApp una vez que el pedido arribe a la sucursal y se encuentre disponible para su entrega.
        </div>
        <div style="margin-bottom: 3px;">
          • <strong>Plazo de Recolección y Liquidación:</strong> Una vez notificada la llegada a tienda, cuenta con un plazo máximo de <strong>30 días naturales</strong> para liquidar el saldo pendiente y recoger la mercancía.
        </div>
        <div style="margin-bottom: 3px;">
          • <strong>Condición de Entrega:</strong> El producto debe ser liquidado en su totalidad (100%) antes o en el momento exacto de la entrega física.
        </div>
        <div>
          • <strong>Penalización por Abandono:</strong> De no cumplir con los plazos y condiciones anteriores, el pedido será cancelado automáticamente y todo abono o anticipo pagado con anterioridad <strong>no será reembolsado ni transferible</strong>.
        </div>
      </div>

      <div style="text-align: center; margin-top: 6px; border-top: 1px solid #000; padding-top: 4px;">
        <div style="font-weight: bold; font-size: 0.9em;">${settings.footerMessage || '¡GRACIAS POR SU PREFERENCIA!'}</div>
        <div style="font-size: 0.8em; margin-top: 1px;">Conserve este ticket para reclamar su pedido.</div>
      </div>

      ${settings.showCutLine ? `
        <div style="text-align: center; margin-top: 8px; font-size: 0.75em;">
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Genera el documento formal tamaño Carta / A4 (Factura / Remisión / Hoja de Pedido Especial).
 */
export function generateSpecialOrderDocumentHtml(
  order: SpecialOrder,
  branchName = 'Nova FV Sucursal Uman',
  sellerName = 'Asesor de Mostrador',
  businessName = 'Moto Servicio Nova FV'
): string {
  const folio = order.folio || order.id?.slice(-6).toUpperCase() || 'PED-001';
  const creationDate = order.createdAt || new Date().toISOString();
  const payments = order.payments || [];
  const attendant = sellerName || order.createdBy?.name || 'Asesor de Ventas';

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000000; padding: 18px 24px; max-width: 780px; margin: 0 auto; font-size: 11px; line-height: 1.38;">
      
      <!-- ── Encabezado Oficial ── -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
        <div>
          <h1 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">
            ${businessName}
          </h1>
          <p style="margin: 2px 0 0 0; font-size: 13px; color: #475569; font-weight: 700;">
            Comprobante Oficial de Pedido Especial / Encargo de Refacción
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
            Sucursal: <strong style="color: #0f172a;">${branchName}</strong>
          </p>
        </div>

        <div style="text-align: right;">
          <div style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 3px 10px; border-radius: 4px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            PEDIDO SOBRE ENCARGO
          </div>
          <div style="margin-top: 4px; font-size: 15px; font-weight: 900; font-family: monospace; color: #0f172a;">
            FOLIO #${folio}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 1px;">
            Fecha de Registro: <strong>${formatDate(creationDate)}</strong>
          </div>
        </div>
      </div>

      <!-- ── Información de Cliente y Sucursal ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <!-- Cliente -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 3px; letter-spacing: 0.5px;">
            Datos del Cliente Solicitante
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">
            ${order.customer?.name || 'Cliente de Mostrador'}
          </div>
          <div style="font-size: 11.5px; color: #334155; margin-top: 2px;">
            Teléfono: <strong style="font-family: monospace; color: #0f172a;">${order.customer?.phone || 'Sin registrar'}</strong>
          </div>
          ${order.customer?.email ? `
            <div style="font-size: 11px; color: #64748b; margin-top: 1px;">
              Correo: ${order.customer.email}
            </div>
          ` : ''}
        </div>

        <!-- Sucursal y Operación -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 3px; letter-spacing: 0.5px;">
            Datos de Emisión y Control
          </div>
          <div style="font-size: 12px; color: #334155;">
            Sucursal Emisora: <strong>${branchName}</strong>
          </div>
          <div style="font-size: 12px; color: #334155; margin-top: 2px;">
            Atendió / Registró: <strong>${attendant}</strong>
          </div>
          <div style="font-size: 12px; color: #4f46e5; font-weight: 700; margin-top: 2px;">
            Llegada Estimada: ${order.estimatedArrivalDate ? formatDate(order.estimatedArrivalDate) : 'Sujeta a logística de proveedor'}
          </div>
        </div>
      </div>

      <!-- ── Detalle del Producto o Refacción Pedida ── -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; background: #ffffff;">
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px;">
          Descripción de la Refacción o Producto Solicitado
        </div>
        <div style="font-size: 13.5px; font-weight: 800; color: #1e1b4b; background: #eef2ff; padding: 10px 12px; border-radius: 5px; border-left: 4px solid #4f46e5;">
          ${order.itemDescription}
        </div>
        ${order.notes ? `
          <div style="margin-top: 8px; font-size: 11px; color: #475569; padding: 4px 6px; background: #f8fafc; border-radius: 4px;">
            <strong>Observaciones / Especificaciones adicionales:</strong> "${order.notes}"
          </div>
        ` : ''}
      </div>

      <!-- ── Desglose Financiero ── -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b;">Precio de Venta Pactado</div>
          <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 2px;">
            ${formatCurrency(order.sellingPrice)}
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #166534;">Anticipo / Total Abonado</div>
          <div style="font-size: 15px; font-weight: 900; color: #15803d; margin-top: 2px;">
            ${formatCurrency(order.advancePayment)}
          </div>
          <div style="font-size: 9.5px; color: #166534; margin-top: 1px; font-weight: 600;">
            (${order.advancePercentage.toFixed(1)}% del total)
          </div>
        </div>

        <div style="background: ${order.isFullyPaid ? '#f0fdf4' : '#fffbeb'}; border: 1px solid ${order.isFullyPaid ? '#bbf7d0' : '#fde68a'}; border-radius: 6px; padding: 10px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${order.isFullyPaid ? '#166534' : '#92400e'};">
            Saldo Restante a Liquidar
          </div>
          <div style="font-size: 15px; font-weight: 900; color: ${order.isFullyPaid ? '#15803d' : '#b45309'}; margin-top: 2px;">
            ${order.isFullyPaid ? 'LIQUIDADO ($0.00)' : formatCurrency(order.remainingBalance)}
          </div>
          <div style="font-size: 9.5px; color: ${order.isFullyPaid ? '#166534' : '#92400e'}; margin-top: 1px; font-weight: 700;">
            ${order.isFullyPaid ? 'Listo para entrega' : 'Liquidación obligatoria a la entrega'}
          </div>
        </div>
      </div>

      <!-- ── Tabla de Historial de Abonos Registrados ── -->
      ${payments.length > 0 ? `
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 14px; overflow: hidden;">
          <div style="background: #f1f5f9; padding: 6px 12px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #334155; border-bottom: 1px solid #cbd5e1;">
            Registro Detallado de Abonos y Pagos (${payments.length})
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 700;">
                <th style="padding: 6px 12px; text-align: left;">Fecha</th>
                <th style="padding: 6px 12px; text-align: left;">Método de Pago</th>
                <th style="padding: 6px 12px; text-align: left;">Referencia / Notas</th>
                <th style="padding: 6px 12px; text-align: right;">Monto Abonado</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map((p, idx) => `
                <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background: #fbfcfe;' : ''}">
                  <td style="padding: 6px 12px;">${formatDate(p.date)}</td>
                  <td style="padding: 6px 12px; text-transform: capitalize; font-weight: 600;">${p.paymentMethod}</td>
                  <td style="padding: 6px 12px; color: #64748b;">${p.paymentReference ? `Ref: ${p.paymentReference}` : ''} ${p.notes ? `(${p.notes})` : '-'}</td>
                  <td style="padding: 6px 12px; text-align: right; font-weight: 800; color: #0f172a;">${formatCurrency(p.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- ── Cláusulas Legales y Políticas de Pedido ── -->
      <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #991b1b; margin-bottom: 6px; letter-spacing: 0.5px;">
          Términos, Condiciones y Políticas de Entrega de Pedidos Especiales
        </div>
        
        <div style="font-size: 10.5px; color: #7f1d1d; line-height: 1.45; space-y-2;">
          <p style="margin: 0 0 5px 0;">
            <strong>1. Notificación de Arribo:</strong> La sucursal notificará al cliente a través del número telefónico o WhatsApp proporcionado una vez que la pieza arribe físicamente a nuestras instalaciones.
          </p>
          <p style="margin: 0 0 5px 0;">
            <strong>2. Plazo Límite de Recolección y Liquidación:</strong> Una vez notificada la llegada a tienda, el cliente dispone de un plazo máximo e improrrogable de <strong>30 días naturales</strong> para liquidar el saldo total pendiente y retirar el producto.
          </p>
          <p style="margin: 0 0 5px 0;">
            <strong>3. Condición Indispensable de Entrega:</strong> El producto únicamente será entregado una vez cubierto el <strong>100% de la liquidación</strong> y contra la presentación del presente comprobante original o identificación oficial.
          </p>
          <p style="margin: 0;">
            <strong>4. Cancelación y No Reembolso por Abandono:</strong> De no cumplir con los plazos y condiciones estipuladas, la orden quedará automáticamente cancelada. Al tratarse de refacciones importadas o solicitadas sobre encargo expreso del cliente, <strong>los anticipos y abonos pagados con anterioridad no serán reembolsables ni transferibles</strong> bajo ningún concepto.
          </p>
        </div>
      </div>

      <!-- ── Firmas de Conformidad ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 24px; padding-top: 10px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 4px auto;"></div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${order.customer?.name || 'Firma del Cliente'}</div>
          <div style="font-size: 9.5px; color: #64748b;">Acepto términos, condiciones y plazos de entrega</div>
        </div>

        <div style="text-align: center;">
          <div style="border-top: 1px solid #000000; width: 85%; margin: 0 auto 4px auto;"></div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${attendant}</div>
          <div style="font-size: 9.5px; color: #64748b;">Sello y Firma de Sucursal Emisora</div>
        </div>
      </div>

    </div>
  `;
}

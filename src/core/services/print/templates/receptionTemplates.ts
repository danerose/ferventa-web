import type { AdminMaintenanceOrder } from '@/app/domain';
import type { PrinterSettings } from '@/core/types';
import { formatDate, formatCurrency } from '@/core/utils';

function getFuelText(fuelLevel?: number): string {
  if (fuelLevel === undefined || fuelLevel === null) return 'No especificado';
  const labels: Record<number, string> = {
    0: 'Vacío (Reserva)',
    25: '1/4 de Tanque',
    50: '1/2 de Tanque',
    75: '3/4 de Tanque',
    100: 'Tanque Lleno',
  };
  return labels[fuelLevel] || `${fuelLevel}%`;
}

function getMechanicName(order: AdminMaintenanceOrder, fallback = 'Taller Nova FV'): string {
  const mech = order.assignedMechanic || order.mechanic;
  if (typeof mech === 'object' && mech?.name) return mech.name;
  if (typeof mech === 'string' && mech.trim() && !/^[0-9a-fA-F]{24}$/.test(mech.trim())) {
    return mech.trim();
  }
  return fallback;
}

/**
 * Generate Letter/A4 formal service reception document (with inventory & legal clauses)
 */
export function generateReceptionDocumentHtml(
  order: AdminMaintenanceOrder,
  branchName = 'Nova FV Sucursal Uman',
  receiverName = 'Taller Moto Servicio Nova FV'
): string {
  const intakeDate = order.receptionDate || order.createdAt || new Date().toISOString();
  const folio = order.folio || (order.id ? order.id.slice(-6).toUpperCase() : '000001');
  const inventory = order.inventoryReceived || {};
  const mechanicName = getMechanicName(order, receiverName);
  const fuelText = getFuelText(order.initialFuelLevel);

  return `
    <div style="font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000000; padding: 16px 20px; max-width: 780px; margin: 0 auto; font-size: 11px; line-height: 1.35;">
      <!-- ── Document Header ── -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000000; padding-bottom: 10px; marginBottom: 10px;">
        <div>
          <h1 style="font-size: 18px; font-weight: 800; margin: 0; color: #111827; text-transform: uppercase;">
            Moto Servicio Nova FV
          </h1>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #4b5563; font-weight: 600;">
            Comprobante de Recepción e Ingreso al Taller
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">
            Sucursal: <strong>${branchName}</strong>
          </p>
        </div>

        <div style="text-align: right;">
          <div style="display: inline-block; background: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; text-transform: uppercase;">
            Orden de Recepción
          </div>
          <div style="margin-top: 3px; font-size: 14px; font-weight: 800; font-family: monospace; color: #000000;">
            FOLIO #${folio}
          </div>
          <div style="font-size: 10.5px; color: #6b7280; margin-top: 1px;">
            Fecha: ${formatDate(intakeDate)}
          </div>
        </div>
      </div>

      <!-- ── Client & Vehicle Information ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px;">
        <div>
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">
            Propietario / Cliente
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">
            ${order.customer?.name || 'Cliente de Mostrador'}
          </div>
          ${order.customer?.phone ? `
            <div style="font-size: 11px; color: #334155; margin-top: 1px;">
              Teléfono: <strong style="font-family: monospace;">${order.customer.phone}</strong>
            </div>
          ` : ''}
          ${order.customer?.email ? `
            <div style="font-size: 10.5px; color: #64748b;">${order.customer.email}</div>
          ` : ''}
        </div>

        <div>
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">
            Vehículo Recibido
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">
            ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} ${order.vehicle?.year ? `(${order.vehicle.year})` : ''}
          </div>
          <div style="font-size: 11px; color: #334155; margin-top: 1px;">
            Serie: <strong style="font-family: monospace;">${order.vehicle?.serialNumberLastFour || 'S/N'}</strong>
            ${order.vehicle?.licensePlate ? ` • Placas: ${order.vehicle.licensePlate}` : ''}
            ${order.vehicle?.color ? ` • Color: ${order.vehicle.color}` : ''}
          </div>
        </div>
      </div>

      <!-- ── Inspection & Inventory Checklist ── -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; background: #ffffff;">
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 6px;">
          Inventario y Estado de la Unidad al Momento del Ingreso
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 6px; font-size: 10.5px;">
          <div>
            <span style="color: #64748b;">Kilometraje:</span><br />
            <strong>${order.initialMileage ? `${order.initialMileage.toLocaleString()} km` : 'Sin registro'}</strong>
          </div>
          <div>
            <span style="color: #64748b;">Combustible:</span><br />
            <strong>${fuelText}</strong>
          </div>
          <div>
            <span style="color: #64748b;">Mano de Obra Estimada:</span><br />
            <strong>${order.laborCost ? formatCurrency(order.laborCost) : 'Por cotizar'}</strong>
          </div>
          <div>
            <span style="color: #64748b;">Mecánico Asignado:</span><br />
            <strong>${mechanicName}</strong>
          </div>
        </div>

        <div style="display: flex; gap: 14px; border-top: 1px dashed #e2e8f0; padding-top: 6px; font-size: 10.5px; color: #334155;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span>[${inventory.spareTire ? '✓' : ' '}] Llanta Refacción</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span>[${inventory.jack ? '✓' : ' '}] Gato / Elevador</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span>[${inventory.tools ? '✓' : ' '}] Herramientas</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span>[${inventory.documents ? '✓' : ' '}] Documentos</span>
          </div>
        </div>

        ${order.receptionNotes ? `
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #f1f5f9; font-size: 10.5px; color: #475569;">
            <strong>Observaciones de Recepción / Daños:</strong> ${order.receptionNotes}
          </div>
        ` : ''}
      </div>

      <!-- ── Service requested & Diagnostic note ── -->
      <div style="padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; margin-bottom: 10px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #15803d; margin-bottom: 1px;">
          Motivo de Ingreso / Falla Reportada por el Cliente
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #166534;">
          ${order.serviceRequested || 'Mantenimiento General'}
        </div>
        ${order.notes ? `
          <div style="font-size: 10.5px; color: #14532d; margin-top: 1px; font-style: italic;">
            "${order.notes}"
          </div>
        ` : ''}
      </div>

      <!-- ── Legal Clauses (Norma Oficial Mexicana NOM-174-SCFI de Talleres) ── -->
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; background: #f8fafc; margin-bottom: 16px; font-size: 8.5px; color: #475569; text-align: justify; line-height: 1.3;">
        <div style="font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 4px; text-align: center; font-size: 9.5px;">
          Contrato de Adhesión y Cláusulas Legales de Recepción
        </div>
        <p style="margin: 0 0 3px 0;">
          <strong>PRIMERA (Autorización de Diagnóstico y Pruebas):</strong> El cliente autoriza al personal técnico de <em>Moto Servicio Nova FV</em> a realizar las inspecciones, desarmados necesarios y pruebas dinámicas o de manejo del vehículo dentro o fuera de las instalaciones para verificar su correcto desempeño.
        </p>
        <p style="margin: 0 0 3px 0;">
          <strong>SEGUNDA (Pertenencias y Objetos de Valor):</strong> El establecimiento únicamente se hace responsable de los accesorios y pertenencias debidamente inventariados y firmados en este comprobante. La empresa no se responsabiliza por dinero, alhajas u objetos no declarados en el inventario de recepción.
        </p>
        <p style="margin: 0 0 3px 0;">
          <strong>TERCERA (Presupuesto y Vicios Ocultos):</strong> Todo presupuesto de mano de obra y refacciones es preliminar. Si durante el desmontaje surgen fallas ocultas no visibles a primera vista, se notificará al cliente para recabar su autorización antes de realizar gastos adicionales.
        </p>
        <p style="margin: 0;">
          <strong>CUARTA (Plazo de Retiro y Almacenaje):</strong> Una vez concluida la reparación y notificado el cliente vía telefónica o WhatsApp, se conceden 3 (tres) días hábiles de cortesía para su retiro. Transcurrido dicho plazo, se cobrará una cuota diaria de pensión/resguardo de $80.00 MXN por concepto de almacenaje.
        </p>
      </div>

      <!-- ── Signatures ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        <div style="text-align: center;">
          <div style="border-bottom: 1px solid #0f172a; height: 26px; margin-bottom: 4px;"></div>
          <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
            ${order.customer?.name || 'Firma del Cliente'}
          </div>
          <div style="font-size: 9px; color: #64748b;">Firma del Cliente (Entrega Unidad y Acepta Términos)</div>
        </div>

        <div style="text-align: center;">
          <div style="border-bottom: 1px solid #0f172a; height: 26px; margin-bottom: 4px;"></div>
          <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
            Moto Servicio Nova FV
          </div>
          <div style="font-size: 9px; color: #64748b;">Atendió: ${receiverName} • ${branchName}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate 58mm or 80mm continuous thermal ticket for workshop reception check-in
 */
export function generateReceptionTicketHtml(
  order: AdminMaintenanceOrder,
  settings: PrinterSettings,
  branchName = 'Nova FV Sucursal Uman',
  receiverName = 'Taller Nova FV'
): string {
  const is58 = settings.paperWidth === '58mm';
  const printableWidth = is58 ? '48mm' : '72mm';
  const sepDouble = is58
    ? '════════════════════════════'
    : '══════════════════════════════════════════';
  const sepDash = is58
    ? '────────────────────────────'
    : '──────────────────────────────────────────';
  const fontSize = is58 ? '9.5px' : '11.5px';

  const folio = order.folio || (order.id ? order.id.slice(-6).toUpperCase() : '000001');
  const now = order.receptionDate ? new Date(order.receptionDate) : new Date();
  const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  const mechanicName = getMechanicName(order, receiverName);
  const fuelText = getFuelText(order.initialFuelLevel);
  const inventory = order.inventoryReceived || {};

  return `
    <div style="width: ${printableWidth}; max-width: ${printableWidth}; margin: 0 auto; padding: 4px 2px 6mm 2px; font-size: ${fontSize}; line-height: 1.25; color: #000000; font-family: 'Courier New', Courier, monospace;">
      <div style="text-align: center;">
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
        <div style="font-weight: 900; font-size: 1.2em; text-transform: uppercase;">${settings.businessName}</div>
        <div style="font-size: 0.85em; font-weight: bold;">${settings.businessTagline}</div>
        <div style="font-size: 0.85em; margin-top: 1px;">SUCURSAL: ${branchName}</div>
        ${settings.showPhone && settings.phone ? `<div style="font-size: 0.85em;">Tel./WhatsApp: ${settings.phone}</div>` : ''}
        <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>
      </div>

      <div style="text-align: center; margin: 4px 0;">
        <div style="font-weight: 900; font-size: 1.1em; text-transform: uppercase;">ORDEN DE RECEPCIÓN</div>
        <div style="font-weight: bold; font-size: 1.05em; margin-top: 1px;">FOLIO: #${folio}</div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span>FECHA: <strong>${dateStr}</strong></span>
          <span>HORA: <strong>${timeStr}</strong></span>
        </div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div>CLIENTE: <strong>${order.customer?.name || 'Cliente'}</strong></div>
        ${order.customer?.phone ? `<div>TELÉFONO: <strong>${order.customer.phone}</strong></div>` : ''}
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div style="font-weight: bold;">DATOS DE LA UNIDAD:</div>
        <div>MOTO: <strong>${order.vehicle?.brand || ''} ${order.vehicle?.model || ''} ${order.vehicle?.year ? `(${order.vehicle.year})` : ''}</strong></div>
        ${order.vehicle?.serialNumberLastFour ? `<div>SERIE: <strong>${order.vehicle.serialNumberLastFour}</strong></div>` : ''}
        ${order.vehicle?.licensePlate ? `<div>PLACAS: <strong>${order.vehicle.licensePlate}</strong></div>` : ''}
        ${order.vehicle?.color ? `<div>COLOR: <strong>${order.vehicle.color}</strong></div>` : ''}
        <div style="margin-top: 2px;">KM: <strong>${order.initialMileage ? `${order.initialMileage.toLocaleString()} km` : 'S/R'}</strong> | GAS: <strong>${fuelText}</strong></div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div style="font-weight: bold;">INVENTARIO RECIBIDO:</div>
        <div>[${inventory.spareTire ? 'X' : ' '}] Llanta Refac. [${inventory.jack ? 'X' : ' '}] Gato</div>
        <div>[${inventory.tools ? 'X' : ' '}] Herramienta   [${inventory.documents ? 'X' : ' '}] Docs</div>
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div style="font-weight: bold;">FALLA REPORTADA:</div>
        <div style="word-break: break-word; padding-left: 4px;">${order.serviceRequested || 'Mantenimiento General'}</div>
        ${order.notes ? `<div style="font-size: 0.85em; margin-top: 2px; font-style: italic;">"${order.notes}"</div>` : ''}
        ${order.receptionNotes ? `<div style="font-size: 0.85em; margin-top: 2px;">Obs: ${order.receptionNotes}</div>` : ''}
      </div>

      <div style="font-size: 8px; overflow: hidden; white-space: nowrap;">${sepDash}</div>

      <div style="margin: 4px 0;">
        <div>MECÁNICO ASIGNADO: <strong>${mechanicName}</strong></div>
        <div>M.O. PRELIMINAR: <strong>${order.laborCost ? `$${order.laborCost.toFixed(2)} MXN` : 'Por diagnosticar'}</strong></div>
      </div>

      <div style="font-size: 8px; font-weight: bold; overflow: hidden; white-space: nowrap;">${sepDouble}</div>

      <div style="text-align: center; margin-top: 6px; font-size: 0.8em; line-height: 1.2;">
        <div>* Conserve este comprobante para recoger su unidad.</div>
        <div style="margin-top: 2px;">* 3 días de cortesía tras notificación, posterior a ello pensión diaria de $80.</div>
        <div style="font-weight: bold; font-size: 1.1em; margin-top: 4px;">${settings.footerMessage || '¡GRACIAS POR SU PREFERENCIA!'}</div>
      </div>

      ${settings.showCutLine ? `
        <div style="text-align: center; margin-top: 8px; font-size: 0.75em;">
          - - - - CORTE DE TICKET - - - -
        </div>
      ` : ''}
    </div>
  `;
}

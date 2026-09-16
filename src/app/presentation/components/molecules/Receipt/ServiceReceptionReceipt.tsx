import React from 'react';
import type { AdminMaintenanceOrder } from '@/app/domain';
import { formatDate, formatCurrency } from '@/core/utils';

export interface ServiceReceptionReceiptProps {
  order: AdminMaintenanceOrder | null;
  branchName?: string;
  receiverName?: string;
}

export const ServiceReceptionReceipt: React.FC<ServiceReceptionReceiptProps> = ({
  order,
  branchName = 'Nova FV Sucursal Uman',
  receiverName = 'Taller Nova FV Sucursal Uman',
}) => {
  if (!order) return null;

  const intakeDate = order.receptionDate || order.createdAt || new Date().toISOString();
  const folio = order.folio || order.id.slice(-6).toUpperCase();

  const formatMechanicName = () => {
    if (!order) return receiverName || 'Taller Moto Servicio Nova FV';
    const mech = order.assignedMechanic || order.mechanic;
    if (typeof mech === 'object' && mech?.name) return mech.name;
    if (typeof mech === 'string' && mech.trim() && !/^[0-9a-fA-F]{24}$/.test(mech.trim())) {
      return mech.trim();
    }
    return receiverName || 'Taller Moto Servicio Nova FV';
  };

  const fuelLabels: Record<number, string> = {
    0: 'Vacío (Reserva)',
    25: '1/4 de Tanque',
    50: '1/2 de Tanque',
    75: '3/4 de Tanque',
    100: 'Tanque Lleno',
  };

  const fuelText = order.initialFuelLevel !== undefined
    ? (fuelLabels[order.initialFuelLevel] || `${order.initialFuelLevel}%`)
    : 'No especificado';

  const inventory = order.inventoryReceived || {};

  return (
    <div
      id="service-reception-receipt"
      className="printable-document hidden print:block"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#000000',
        background: '#ffffff',
        padding: '16px 20px',
        maxWidth: '780px',
        margin: '0 auto',
        boxSizing: 'border-box',
        fontSize: '11px',
        lineHeight: '1.35',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        pageBreakAfter: 'avoid',
        breakAfter: 'avoid',
      }}
    >
      {/* ── Document Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000000', paddingBottom: '10px', marginBottom: '10px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#111827', textTransform: 'uppercase' }}>
            Moto Servicio Nova FV
          </h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>
            Comprobante de Recepción e Ingreso al Taller
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
            Sucursal: <strong>{branchName}</strong>
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-block', background: '#0284c7', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>
            Orden de Recepción
          </div>
          <div style={{ marginTop: '3px', fontSize: '14px', fontWeight: '800', fontFamily: 'monospace', color: '#000000' }}>
            FOLIO #{folio}
          </div>
          <div style={{ fontSize: '10.5px', color: '#6b7280', marginTop: '1px' }}>
            Fecha: {formatDate(intakeDate)}
          </div>
        </div>
      </div>

      {/* ── Client & Vehicle Information ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '2px' }}>
            Propietario / Cliente
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
            {order.customer.name}
          </div>
          {order.customer.phone && (
            <div style={{ fontSize: '11px', color: '#334155', marginTop: '1px' }}>
              Teléfono: <strong style={{ fontFamily: 'monospace' }}>{order.customer.phone}</strong>
            </div>
          )}
          {order.customer.email && (
            <div style={{ fontSize: '10.5px', color: '#64748b' }}>{order.customer.email}</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '2px' }}>
            Vehículo Recibido
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
            {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
          </div>
          <div style={{ fontSize: '11px', color: '#334155', marginTop: '1px' }}>
            Serie: <strong style={{ fontFamily: 'monospace' }}>{order.vehicle.serialNumberLastFour}</strong>
            {order.vehicle.licensePlate ? ` • Placas: ${order.vehicle.licensePlate}` : ''}
            {order.vehicle.color ? ` • Color: ${order.vehicle.color}` : ''}
          </div>
        </div>
      </div>

      {/* ── Inspection & Inventory Checklist ── */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', background: '#ffffff' }}>
        <div style={{ fontSize: '10.5px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', marginBottom: '6px' }}>
          Inventario y Estado de la Unidad al Momento del Ingreso
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '6px', fontSize: '10.5px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Kilometraje:</span><br />
            <strong>{order.initialMileage ? `${order.initialMileage.toLocaleString()} km` : 'Sin registro'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Combustible:</span><br />
            <strong>{fuelText}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Costo M.O. Inicial:</span><br />
            <strong>{order.laborCost ? formatCurrency(order.laborCost) : 'Por cotizar'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Mecánico Asignado:</span><br />
            <strong>{formatMechanicName()}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', fontSize: '10.5px', color: '#334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>[{inventory.spareTire ? '✓' : ' '}] Llanta Refacción</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>[{inventory.jack ? '✓' : ' '}] Gato / Elevador</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>[{inventory.tools ? '✓' : ' '}] Herramientas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>[{inventory.documents ? '✓' : ' '}] Documentos</span>
          </div>
        </div>

        {order.receptionNotes && (
          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #f1f5f9', fontSize: '10.5px', color: '#475569' }}>
            <strong>Observaciones de Recepción / Daños:</strong> {order.receptionNotes}
          </div>
        )}
      </div>

      {/* ── Service requested & Diagnostic note ── */}
      <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#15803d', marginBottom: '1px' }}>
          Motivo de Ingreso / Falla Reportada por el Cliente
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>
          {order.serviceRequested || 'Mantenimiento General'}
        </div>
        {order.notes && (
          <div style={{ fontSize: '10.5px', color: '#14532d', marginTop: '1px', fontStyle: 'italic' }}>
            "{order.notes}"
          </div>
        )}
      </div>

      {/* ── Legal Clauses (Norma Oficial Mexicana NOM-174-SCFI de Talleres) ── */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', background: '#f8fafc', marginBottom: '16px', fontSize: '8.5px', color: '#475569', textAlign: 'justify', lineHeight: '1.3' }}>
        <div style={{ fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', marginBottom: '4px', textAlign: 'center', fontSize: '9.5px' }}>
          Contrato de Adhesión y Cláusulas Legales de Recepción
        </div>
        <p style={{ margin: '0 0 3px 0' }}>
          <strong>PRIMERA (Autorización de Diagnóstico y Pruebas):</strong> El cliente autoriza al personal técnico de <em>Moto Servicio Nova FV</em> a realizar las inspecciones, desarmados necesarios y pruebas dinámicas o de manejo del vehículo dentro o fuera de las instalaciones para verificar su correcto desempeño.
        </p>
        <p style={{ margin: '0 0 3px 0' }}>
          <strong>SEGUNDA (Pertenencias y Objetos de Valor):</strong> El establecimiento únicamente se hace responsable de los accesorios y pertenencias debidamente inventariados y firmados en este comprobante. La empresa no se responsabiliza por dinero, alhajas u objetos no declarados en el inventario de recepción.
        </p>
        <p style={{ margin: '0 0 3px 0' }}>
          <strong>TERCERA (Presupuesto y Vicios Ocultos):</strong> Todo presupuesto de mano de obra y refacciones es preliminar. Si durante el desmontaje surgen fallas ocultas no visibles a primera vista, se notificará al cliente para recabar su autorización antes de realizar gastos adicionales.
        </p>
        <p style={{ margin: 0 }}>
          <strong>CUARTA (Plazo de Retiro y Almacenaje):</strong> Una vez concluida la reparación y notificado el cliente vía telefónica o WhatsApp, se conceden 3 (tres) días hábiles de cortesía para su retiro. Transcurrido dicho plazo, se cobrará una cuota diaria de pensión/resguardo de $80.00 MXN por concepto de almacenaje.
        </p>
      </div>

      {/* ── Signatures ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #0f172a', height: '26px', marginBottom: '4px' }} />
          <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
            {order.customer.name}
          </div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>Firma del Cliente (Entrega Unidad y Acepta Términos)</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #0f172a', height: '26px', marginBottom: '4px' }} />
          <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
            {'Moto Servicio Nova FV'}
          </div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>Atendió: {receiverName} • {branchName}</div>
        </div>
      </div>
    </div>
  );
};

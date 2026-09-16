import React from 'react';
import type { Sale, AdminMaintenanceOrder } from '@/app/domain';
import { formatCurrency, formatDate } from '@/core/utils';
import type { ServiceInvoiceCustomerData } from '@/app/presentation/components/organisms/Modals/ServiceInvoiceCustomerModal';

export interface ServiceInvoiceReceiptProps {
  sale: Sale | null;
  order?: AdminMaintenanceOrder | null;
  customerData?: ServiceInvoiceCustomerData | null;
  branchName?: string;
  sellerName?: string;
}

interface InvoiceVehicle {
  brand?: string;
  model?: string;
  year?: string | number;
  serialNumberLastFour?: string;
  licensePlate?: string;
  color?: string;
}

interface RawInvoiceItem {
  id?: string;
  _id?: string;
  cartId?: string;
  parentCartId?: string;
  parentId?: string;
  parentServiceId?: string;
  type?: string;
  name?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
  priceSnapshot?: number;
  subtotal?: number;
  isConsumable?: boolean;
  product?: { name?: string; sku?: string; sellingPrice?: number };
  service?: { name?: string };
  serviceId?: { name?: string; sku?: string; basePrice?: number } | string;
}

interface InvoiceItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  type: 'service' | 'product';
}

function parseInvoiceItems(items: unknown[]): InvoiceItem[] {
  if (!Array.isArray(items)) return [];
  const rawList = items as RawInvoiceItem[];
  return rawList.map((item, index) => {
    const isService =
      item.type === 'service' ||
      Boolean(item.serviceId) ||
      Boolean(item.service) ||
      (!item.isConsumable &&
        !item.parentCartId &&
        (item.name || item.product?.name || '').toLowerCase().includes('servicio'));

    const serviceObj = typeof item.serviceId === 'object' && item.serviceId !== null ? item.serviceId : undefined;
    const name =
      item.name ||
      item.service?.name ||
      serviceObj?.name ||
      item.product?.name ||
      (isService ? 'Servicio' : 'Artículo');

    const sku = item.sku || item.product?.sku || serviceObj?.sku || '';
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Number(
      item.unitPrice ??
      item.priceSnapshot ??
      item.product?.sellingPrice ??
      serviceObj?.basePrice ??
      0
    );
    const subtotal = Number(item.subtotal ?? (unitPrice * quantity));

    return {
      id: String(item.cartId || item.id || item._id || `item-${index}`),
      name,
      sku,
      quantity,
      unitPrice,
      subtotal,
      type: isService ? 'service' : 'product',
    };
  });
}

export const ServiceInvoiceReceipt: React.FC<ServiceInvoiceReceiptProps> = ({
  sale,
  order,
  customerData,
  branchName = 'Nova FV Sucursal Uman',
  sellerName = 'Taller Nova FV Sucursal Uman',
}) => {
  if (!sale && !order) return null;

  const invoiceDate = sale?.createdAt || order?.completedAt || order?.receptionDate || new Date().toISOString();
  const invoiceFolio = sale?.folio || (sale?.id ? sale.id.slice(-6).toUpperCase() : (order?.id ? order.id.slice(-6).toUpperCase() : 'SRV-001'));

  // Separate services from parts/supplies
  const parsedItems = parseInvoiceItems(sale?.items || []);
  const serviceItems = parsedItems.filter((it) => it.type === 'service');
  const partItems = parsedItems.filter((it) => it.type !== 'service');

  const laborTotal = serviceItems.reduce((acc, it) => acc + (it.subtotal || (it.unitPrice * it.quantity)), 0);
  const partsTotal = partItems.reduce((acc, it) => acc + (it.subtotal || (it.unitPrice * it.quantity)), 0);
  const totalAmount = sale?.total ?? ((order?.laborCost || 0) + laborTotal + partsTotal);

  const customerName =
    customerData?.customerName ||
    order?.customer?.name ||
    (typeof sale?.customer === 'string' ? sale.customer : sale?.customer?.name) ||
    'Público en General';

  const customerPhone =
    customerData?.customerPhone ||
    order?.customer?.phone ||
    ((sale?.customer as unknown as { phone?: string })?.phone) ||
    '';

  const customVehicle: InvoiceVehicle | null = customerData && (customerData.vehicleBrand || customerData.vehicleModel || customerData.vehicleSerial || customerData.vehiclePlate)
    ? {
      brand: customerData.vehicleBrand || '',
      model: customerData.vehicleModel || '',
      year: customerData.vehicleYear || '',
      serialNumberLastFour: customerData.vehicleSerial || '',
      licensePlate: customerData.vehiclePlate || '',
      color: '',
    }
    : null;

  const vehicle: InvoiceVehicle | null | undefined =
    customVehicle ||
    order?.vehicle ||
    (sale as unknown as { vehicle?: InvoiceVehicle })?.vehicle;

  const formatPaymentMethod = (pm?: string) => {
    switch ((pm || '').toLowerCase()) {
      case 'card':
      case 'tarjeta':
        return 'Tarjeta';
      case 'transfer':
      case 'transferencia':
        return 'Transferencia';
      case 'cash':
      case 'efectivo':
      default:
        return 'Efectivo';
    }
  };

  return (
    <div
      id="service-invoice-receipt"
      className="printable-document hidden print:block"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#0f172a',
        background: '#ffffff',
        padding: '32px',
        maxWidth: '850px',
        margin: '0 auto',
        boxSizing: 'border-box',
        fontSize: '12px',
        lineHeight: '1.4',
      }}
    >
      {/* ── Document Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              Moto Servicio Nova FV
            </h1>
          </div>
          <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
            Taller Especializado y Refaccionaria Automotriz
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
            Sucursal: <strong>{branchName}</strong>
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'inline-block', background: '#0f172a', color: '#ffffff', padding: '4px 12px', borderRadius: '4px', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase' }}>
            Factura / Remisión de Servicio
          </div>
          <div style={{ marginTop: '6px', fontSize: '15px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>
            FOLIO #{invoiceFolio}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Fecha de Emisión: {formatDate(invoiceDate)}
          </div>
          {sellerName && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
              Atendió: <strong>{sellerName}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── Client & Vehicle Information Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
        {/* Client details */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
            Datos del Cliente
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
            {customerName}
          </div>
          {customerPhone && (
            <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
              Teléfono: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{customerPhone}</span>
            </div>
          )}
        </div>

        {/* Vehicle details */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
            Datos de la Unidad / Vehículo
          </div>
          {vehicle && (vehicle.brand || vehicle.model || vehicle.serialNumberLastFour) ? (
            <>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                {vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
              </div>
              <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                {vehicle.serialNumberLastFour ? (
                  <>Serie: <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{vehicle.serialNumberLastFour}</span></>
                ) : null}
                {vehicle.licensePlate ? ` • Placas: ${vehicle.licensePlate}` : ''}
                {vehicle.color ? ` • Color: ${vehicle.color}` : ''}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
              Servicio de mostrador / sin unidad registrada
            </div>
          )}
          {order?.initialMileage && (
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Kilometraje reportado: <strong>{order.initialMileage.toLocaleString()} km</strong>
            </div>
          )}
        </div>
      </div>

      {/* Service requested note */}
      {order?.serviceRequested && (
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px' }}>
          <strong style={{ color: '#1e40af' }}>Trabajo / Servicio Solicitado:</strong> {order.serviceRequested}
          {order.notes && <span style={{ color: '#3b82f6', marginLeft: '6px' }}>— "{order.notes}"</span>}
        </div>
      )}

      {/* ── Table 1: Mano de Obra y Servicios ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '2px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px' }}>
          1. Mano de Obra y Servicios Realizados
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '6px 8px', fontWeight: '700', width: '60px' }}>Cant.</th>
              <th style={{ padding: '6px 8px', fontWeight: '700' }}>Descripción del Servicio Realizado</th>
              <th style={{ padding: '6px 8px', fontWeight: '700', textAlign: 'right', width: '110px' }}>P. Unitario</th>
              <th style={{ padding: '6px 8px', fontWeight: '700', textAlign: 'right', width: '110px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {serviceItems.length > 0 ? (
              serviceItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', verticalAlign: 'top', fontWeight: '600' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</div>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top', fontFamily: 'monospace' }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top', fontWeight: '700', fontFamily: 'monospace' }}>
                    {formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}
                  </td>
                </tr>
              ))
            ) : order?.laborCost ? (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>1</td>
                <td style={{ padding: '8px' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{order.serviceRequested || 'Mano de Obra Taller'}</div>
                </td>
                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(order.laborCost)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace' }}>{formatCurrency(order.laborCost)}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  No se incluyeron cargos separados de mano de obra.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table 2: Refacciones y Materiales Nuevos ── */}
      {partItems.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', borderBottom: '2px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px' }}>
            2. Refacciones e Insumos Nuevos Instalados
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '6px 8px', fontWeight: '700', width: '60px' }}>Cant.</th>
                <th style={{ padding: '6px 8px', fontWeight: '700' }}>Refacción / Insumo</th>
                <th style={{ padding: '6px 8px', fontWeight: '700', textAlign: 'right', width: '110px' }}>P. Unitario</th>
                <th style={{ padding: '6px 8px', fontWeight: '700', textAlign: 'right', width: '110px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {partItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', verticalAlign: 'top', fontWeight: '600' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</div>
                    {item.sku && <div style={{ fontSize: '10px', color: '#64748b' }}>SKU: {item.sku}</div>}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top', fontFamily: 'monospace' }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'top', fontWeight: '700', fontFamily: 'monospace' }}>
                    {formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Financial Totals Summary ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '28px' }}>
        <div style={{ width: '280px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#475569' }}>
            <span>Subtotal Servicios:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{formatCurrency(laborTotal || order?.laborCost || 0)}</span>
          </div>
          {partItems.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#475569' }}>
              <span>Subtotal Refacciones:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{formatCurrency(partsTotal)}</span>
            </div>
          )}
          {sale?.discount && sale.discount > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#16a34a' }}>
              <span>Descuento aplicado:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>-{formatCurrency(sale.discount)}</span>
            </div>
          ) : null}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', paddingTop: '8px', marginTop: '4px', fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>
            <span>TOTAL:</span>
            <span style={{ fontFamily: 'monospace' }}>{formatCurrency(totalAmount)}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', marginTop: '4px' }}>
            Método de Pago: <strong style={{ color: '#0f172a' }}>{formatPaymentMethod(sale?.paymentMethod)}</strong> • <em>PAGADO</em>
          </div>
        </div>
      </div>

      {/* ── Workshop Warranty and Legal Policies ── */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', background: '#fafafa', marginBottom: '32px', fontSize: '10.5px', color: '#475569' }}>
        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px' }}>
          Términos de Garantía y Condiciones del Servicio
        </strong>
        <p style={{ margin: '0 0 4px 0' }}>
          • <strong>Garantía de Mano de Obra:</strong> 30 días naturales o 1,000 km (lo que ocurra primero) a partir de la fecha de entrega, cubriendo exclusivamente los trabajos descritos en este documento.
        </p>
        <p style={{ margin: '0 0 4px 0' }}>
          • <strong>Refacciones y Partes Eléctricas:</strong> Sujetas a la póliza original del fabricante. Componentes eléctricos no cuentan con garantía por variaciones de voltaje o mal estado de la batería.
        </p>
        <p style={{ margin: 0 }}>
          • <strong>Conformidad de Entrega:</strong> El cliente declara haber probado y recibido a su entera satisfacción la unidad y/o refacciones especificadas.
        </p>
      </div>

      {/* ── Signatures ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', paddingTop: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #0f172a', height: '40px', marginBottom: '8px' }} />
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
            {customerName}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Firma de Conformidad del Cliente</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ borderBottom: '1px solid #0f172a', height: '40px', marginBottom: '8px' }} />
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
            {'Moto Servicio Nova FV'}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Sucursal: {branchName}</div>
        </div>
      </div>
    </div>
  );
};

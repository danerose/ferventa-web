import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface BoxItemData {
  _id?: string;
  id?: string;
  sku?: string;
  name?: string;
  quantity?: number;
  itemsPerBox?: number;
  costPrice?: number;
  sellingPrice?: number;
  boxCode?: string;
  isBoxSealed?: boolean;
  isOpened?: boolean;
  product?: {
    _id?: string;
    id?: string;
    name?: string;
    sku?: string;
    costPrice?: number;
    sellingPrice?: number;
    unit?: string;
  };
}

interface BoxQRLabelProps {
  item: BoxItemData;
  invoiceOrFolio?: string;
  branchName?: string;
  isLast?: boolean;
}

export const BoxQRLabel: React.FC<BoxQRLabelProps> = ({
  item,
  invoiceOrFolio,
  branchName = 'Taller Nova FV Sucursal Uman',
  isLast = true,
}) => {
  const boxCode = item.boxCode || `BOX-${(item.id || item._id || 'LOT').slice(-6).toUpperCase()}`;
  const productName = item.name || item.product?.name || 'Producto';
  const sku = item.sku || item.product?.sku || 'S/SKU';
  const qty = item.quantity || item.itemsPerBox || 1;
  const sellingPrice = item.sellingPrice ?? item.product?.sellingPrice ?? 0;

  return (
    <div
      className="box-label-container"
      style={{
        width: '72mm',
        margin: '0 auto',
        padding: '8px',
        border: '1px dashed #cbd5e1',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        fontFamily: 'monospace, sans-serif',
        color: '#000000',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        pageBreakAfter: isLast ? 'avoid' : 'always',
        breakAfter: isLast ? 'avoid' : 'page',
        marginBottom: isLast ? '0px' : '8mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Cabecera */}
      <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          {branchName}
        </div>
        <div style={{ fontSize: '9px', color: '#334155' }}>LOTE / CAJA DE ALMACÉN</div>
      </div>

      {/* Cuerpo con QR y Datos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ padding: '4px', backgroundColor: '#fff', border: '1px solid #000', borderRadius: '4px', flexShrink: 0 }}>
          <QRCodeSVG value={boxCode} size={84} level="M" />
        </div>

        <div style={{ flex: 1, fontSize: '11px', lineHeight: '1.3', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={productName}>
            {productName}
          </div>
          <div>SKU: <strong>{sku}</strong></div>
          <div>Contenido: <strong>{qty} pzas</strong></div>
          {sellingPrice > 0 && (
            <div>P. Venta: <strong>${sellingPrice.toFixed(2)}</strong></div>
          )}
          {invoiceOrFolio && (
            <div style={{ fontSize: '9px', color: '#475569' }}>Folio: {invoiceOrFolio}</div>
          )}
        </div>
      </div>

      {/* Código visible */}
      <div style={{ marginTop: '6px', textAlign: 'center', borderTop: '1px solid #000', paddingTop: '3px' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{boxCode}</span>
      </div>
    </div>
  );
};

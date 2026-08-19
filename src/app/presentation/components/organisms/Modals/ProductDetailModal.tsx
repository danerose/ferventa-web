import React from 'react';
import { Modal, PrimaryButton, SecondaryButton, Icon } from '@/app/presentation/components';
import type { Product } from '@/app/domain/entities/InventoryEntities';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
}) => {
  if (!product) return null;

  const brandName =
    typeof product.brand === 'object' && product.brand?.name
      ? product.brand.name
      : typeof product.brand === 'string'
      ? product.brand
      : '';

  const categoryName =
    typeof product.category === 'object' && product.category?.name
      ? product.category.name
      : typeof product.category === 'string'
      ? product.category
      : '';

  const isLowStock = product.stock <= product.minStock;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles del Producto"
      headerBackground="#1e293b"
      maxWidth="620px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
          {onAddToCart && (
            <PrimaryButton
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="Plus" size="sm" />
              Agregar al Carrito
            </PrimaryButton>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Main Header Info */}
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', lineHeight: 1.3 }}>
            {product.name}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {/* SKU Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', background: '#f1f5f9', color: '#475569',
              padding: '4px 10px', borderRadius: '6px', fontWeight: '600'
            }}>
              <Icon name="Barcode" size="xs" />
              <span>SKU: {product.sku}</span>
            </div>

            {/* Brand Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', background: brandName ? '#eff6ff' : '#f8fafc',
              color: brandName ? '#2563eb' : '#94a3b8',
              border: brandName ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              padding: '4px 10px', borderRadius: '6px', fontWeight: '600'
            }}>
              <Icon name="Tag" size="xs" />
              <span>Marca: {brandName || 'Sin Marca'}</span>
            </div>

            {/* Category Badge */}
            {categoryName && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', background: '#f0fdf4', color: '#16a34a',
                border: '1px solid #bbf7d0',
                padding: '4px 10px', borderRadius: '6px', fontWeight: '600'
              }}>
                <Icon name="Folder" size="xs" />
                <span>{categoryName}</span>
              </div>
            )}

            {/* Stock Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '12px',
              background: isLowStock ? '#fef2f2' : '#f0fdf4',
              color: isLowStock ? '#dc2626' : '#16a34a',
              border: isLowStock ? '1px solid #fecaca' : '1px solid #bbf7d0',
              padding: '4px 10px', borderRadius: '6px', fontWeight: '600'
            }}>
              <Icon name="Package" size="xs" />
              <span>Stock: {product.stock} {product.unit || 'uds'} {isLowStock ? '(Bajo)' : ''}</span>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Details Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Precio de Venta
            </span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#2563eb', marginTop: '2px' }}>
              ${product.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {product.costPrice !== undefined && product.costPrice > 0 && (
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                Precio de Costo
              </span>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#475569', marginTop: '4px' }}>
                ${product.costPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Unidad de Medida
            </span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '4px', textTransform: 'capitalize' }}>
              {product.unit || 'Pieza'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              Stock Mínimo
            </span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
              {product.minStock ?? 0}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            Descripción
          </h4>
          <p style={{
            fontSize: '13px', color: product.description ? '#475569' : '#94a3b8',
            lineHeight: 1.5, background: '#ffffff', padding: '12px', borderRadius: '8px',
            border: '1px solid #e2e8f0', margin: 0, fontStyle: product.description ? 'normal' : 'italic'
          }}>
            {product.description || 'Sin descripción registrada para este producto.'}
          </p>
        </div>

        {/* Compatibility Section */}
        {product.compatibility && product.compatibility.length > 0 && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              Vehículos / Modelos Compatibles
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {product.compatibility.map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '12px', background: '#f1f5f9', color: '#334155',
                    border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px',
                    fontWeight: '500'
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photos Gallery (if any) */}
        {product.photos && product.photos.length > 0 && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
              Imágenes del Producto
            </h4>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {product.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`${product.name} ${idx + 1}`}
                  style={{
                    width: '90px', height: '90px', objectFit: 'cover',
                    borderRadius: '8px', border: '1px solid #cbd5e1'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { Icon } from '@/app/presentation/components';
import { PrimaryButton } from '@/app/presentation/components';
import { SecondaryButton } from '@/app/presentation/components';
import { TextInput } from '@/app/presentation/components';
import { Modal } from '@/app/presentation/components';
import { KbdBadge } from '@/app/presentation/components';
import type { Product } from '@/app/domain';
import { APIInventoryRepository } from '@/app/data';
import { useAuthStore } from '@/app/presentation/stores';

const inventoryRepo = new APIInventoryRepository();

interface SelectedSupply {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface TemporaryServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProducts?: Product[];
  onAddService: (
    name: string,
    unitPrice: number,
    supplies: SelectedSupply[]
  ) => void;
}

export const TemporaryServiceModal: React.FC<TemporaryServiceModalProps> = ({
  isOpen,
  onClose,
  availableProducts = [],
  onAddService,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [name, setName] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [supplies, setSupplies] = useState<SelectedSupply[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; unitPrice?: string }>({});

  useEffect(() => {
    if (!isOpen) {
      setProductSearch('');
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const term = productSearch.trim();
    if (!term || !isOpen) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        if (accessToken) {
          const res = await inventoryRepo.getProductsPaginated(accessToken, { search: term, limit: 30 });
          setSearchResults(res.items || []);
        } else {
          const q = term.toLowerCase();
          setSearchResults(
            availableProducts.filter(
              (p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
            )
          );
        }
      } catch (err) {
        console.error('Error al buscar insumos:', err);
        const q = term.toLowerCase();
        setSearchResults(
          availableProducts.filter(
            (p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
          )
        );
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch, isOpen, accessToken, availableProducts]);

  const handleAddSupplyProduct = (prod: Product) => {
    const exists = supplies.find((s) => s.product.id === prod.id);
    if (exists) return;
    setSupplies([
      ...supplies,
      {
        product: prod,
        quantity: 1,
        unitPrice: prod.sellingPrice, // Default to registered selling price
      },
    ]);
    setProductSearch('');
  };

  const handleRemoveSupply = (productId: string) => {
    setSupplies(supplies.filter((s) => s.product.id !== productId));
  };

  const handleUpdateSupplyQty = (productId: string, qty: number) => {
    setSupplies(
      supplies.map((s) =>
        s.product.id === productId ? { ...s, quantity: Math.max(1, qty) } : s
      )
    );
  };

  const handleUpdateSupplyPrice = (productId: string, price: number) => {
    setSupplies(
      supplies.map((s) =>
        s.product.id === productId ? { ...s, unitPrice: Math.max(0, price) } : s
      )
    );
  };

  const handleSubmit = () => {
    const errs: { name?: string; unitPrice?: string } = {};
    if (!name.trim()) errs.name = 'El nombre del servicio es obligatorio';
    if (unitPrice < 0) errs.unitPrice = 'El precio debe ser 0 o mayor';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onAddService(name.trim(), unitPrice, supplies);
    // Reset & close
    setName('');
    setUnitPrice(0);
    setSupplies([]);
    setErrors({});
    onClose();
  };

  const hasSearchTerm = productSearch.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} onConfirm={handleSubmit} title="Agregar Servicio Temporal">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Crea un servicio personalizado al vuelo para esta venta. Puedes especificar la mano de obra e incluir insumos del inventario con su precio editable.
        </p>

        {/* Nombre del servicio */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
            Nombre del Servicio <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <TextInput
            placeholder="Ej. Cambio de Aceite Express, Diagnóstico Eléctrico"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            errorMessage={errors.name}
          />
        </div>

        {/* Precio Mano de Obra */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
            Precio Mano de Obra ($ MXN)
          </label>
          <TextInput
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={unitPrice.toString()}
            onChange={(e) => {
              setUnitPrice(parseFloat(e.target.value) || 0);
              if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: undefined }));
            }}
            errorMessage={errors.unitPrice}
          />
        </div>

        {/* Insumos del inventario */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Insumos del Inventario (Opcional)
            </label>
            {isSearching && (
              <span style={{ fontSize: '11px', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="loading loading-spinner loading-xs" />
                Buscando insumos...
              </span>
            )}
          </div>
          <TextInput
            placeholder="Buscar producto/insumo por nombre o SKU para agregar..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />

          {/* Autocomplete / Search results */}
          {hasSearchTerm && (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                maxHeight: '190px',
                overflowY: 'auto',
                marginTop: '4px',
                background: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              {isSearching ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="loading loading-spinner loading-xs text-primary" />
                  <span>Buscando "{productSearch.trim()}" en el inventario...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>
                    Coincidencias encontradas ({searchResults.length})
                  </div>
                  {searchResults.slice(0, 15).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddSupplyProduct(prod)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{prod.name}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>SKU: {prod.sku}</span>
                        <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '8px' }}>Stock: {prod.stock ?? 0}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                        ${prod.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  No se encontraron productos o insumos para "{productSearch.trim()}"
                </div>
              )}
            </div>
          )}

          {/* Selected supplies list */}
          {supplies.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Insumos Seleccionados ({supplies.length})
              </div>
              {supplies.map((s) => (
                <div
                  key={s.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{s.product.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>SKU: {s.product.sku}</div>
                  </div>

                  {/* Quantity input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Cant:</span>
                    <input
                      type="number"
                      min="1"
                      value={s.quantity}
                      onChange={(e) => handleUpdateSupplyQty(s.product.id, parseInt(e.target.value) || 1)}
                      style={{
                        width: '50px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    />
                  </div>

                  {/* Price input (editable registered price) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Precio:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={s.unitPrice}
                      onChange={(e) => handleUpdateSupplyPrice(s.product.id, parseFloat(e.target.value) || 0)}
                      style={{
                        width: '80px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #3b82f6',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#2563eb',
                        background: '#eff6ff',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSupply(s.product.id)}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    title="Remover insumo"
                  >
                    <Icon name="Trash2" size="sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <SecondaryButton onClick={onClose}>
            Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Agregar al Carrito <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};

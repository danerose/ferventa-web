import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  SearchableSelect,
  PrimaryButton,
  SecondaryButton,
  Select,
  Stack,
  Box,
  Text,
  Icon,
} from '@/app/presentation/components';
import type { Brand, Category, Product } from '@/app/domain';
import { APIInventoryRepository } from '@/app/data';
import { useAuthStore } from '@/app/presentation/stores';

const inventoryRepo = new APIInventoryRepository();

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSku?: string;
  initialName?: string;
  categories?: Category[];
  brands?: Brand[];
  activeBranchId?: string | null;
  onProductCreated: (product: Product) => void;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  initialSku = '',
  initialName = '',
  categories: propCategories = [],
  brands: propBrands = [],
  activeBranchId,
  onProductCreated,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [localCategories, setLocalCategories] = useState<Category[]>(propCategories);
  const [localBrands, setLocalBrands] = useState<Brand[]>(propBrands);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(false);

  const [sku, setSku] = useState(initialSku);
  const [name, setName] = useState(initialName);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [unit, setUnit] = useState('pza');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Sync prop changes into local state
  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setLocalCategories(propCategories);
    }
  }, [propCategories]);

  useEffect(() => {
    if (propBrands && propBrands.length > 0) {
      setLocalBrands(propBrands);
    }
  }, [propBrands]);

  // Ensure categories and brands are loaded whenever the modal is open
  useEffect(() => {
    if (!isOpen || !accessToken) return;

    const loadMeta = async () => {
      const needCats = localCategories.length === 0;
      const needBrs = localBrands.length === 0;
      if (!needCats && !needBrs) return;

      try {
        setLoadingMeta(true);
        const [fetchedCats, fetchedBrs] = await Promise.all([
          needCats ? inventoryRepo.getCategories(accessToken) : Promise.resolve([]),
          needBrs ? inventoryRepo.getBrands(accessToken) : Promise.resolve([]),
        ]);

        if (needCats && fetchedCats.length > 0) {
          setLocalCategories(fetchedCats);
          setCategoryId((prev) => prev || fetchedCats[0].id);
        }
        if (needBrs && fetchedBrs.length > 0) {
          setLocalBrands(fetchedBrs);
          setBrandId((prev) => prev || fetchedBrs[0].id);
        }
      } catch (err) {
        console.error('Error fetching categories/brands in QuickAddProductModal:', err);
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, [isOpen, accessToken, localCategories, localBrands]);

  useEffect(() => {
    if (isOpen) {
      const rawSku = initialSku.trim();
      const rawName = initialName.trim();

      let computedSku = rawSku;
      let computedName = rawName;

      // If user typed a phrase with spaces into the search bar, treat it as product name
      if (!computedName && computedSku && computedSku.includes(' ')) {
        computedName = computedSku;
        computedSku = '';
      }

      setSku(computedSku);
      setName(computedName);
      if (localCategories.length > 0) setCategoryId(localCategories[0].id);
      if (localBrands.length > 0) setBrandId(localBrands[0].id);
      setUnit('pza');
      setCostPrice(0);
      setSellingPrice(0);
      setFormErrors({});
      setGeneralError(null);
    }
  }, [isOpen, initialSku, initialName, localCategories, localBrands]);

  const categoryOptions = localCategories.map((c) => ({ id: c.id, name: c.name }));
  const brandOptions = localBrands.map((b) => ({ id: b.id, name: b.name }));

  const handleCreateCategory = async (catName: string): Promise<string> => {
    if (!accessToken) return '';
    try {
      const res = await inventoryRepo.createCategory(accessToken, catName);
      setLocalCategories((prev) => [...prev, res]);
      setCategoryId(res.id);
      if (formErrors.categoryId) setFormErrors((p) => ({ ...p, categoryId: '' }));
      return res.id;
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  const handleCreateBrand = async (brandName: string): Promise<string> => {
    if (!accessToken) return '';
    try {
      const res = await inventoryRepo.createBrand(accessToken, brandName);
      setLocalBrands((prev) => [...prev, res]);
      setBrandId(res.id);
      if (formErrors.brandId) setFormErrors((p) => ({ ...p, brandId: '' }));
      return res.id;
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!sku.trim()) errors.sku = 'El SKU o código es obligatorio';
    if (!name.trim()) errors.name = 'El nombre del producto es obligatorio';
    if (!categoryId) errors.categoryId = 'Debes seleccionar una categoría';
    if (!brandId) errors.brandId = 'Debes seleccionar una marca';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!accessToken) return;

    try {
      setSaving(true);
      setGeneralError(null);

      const created = await inventoryRepo.createProduct(accessToken, {
        sku: sku.trim(),
        name: name.trim(),
        categoryId,
        brandId,
        unit,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        stock: 0, // Stock starts at 0, incoming reception will add the units!
        minStock: 5,
        compatibility: [],
      });

      onProductCreated(created);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el producto';
      setGeneralError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Registrar Nuevo Producto"
      maxWidth="520px"
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={saving}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton onClick={handleSubmit} loading={saving} disabled={saving} className="font-bold">
            <Icon name="Plus" size="xs" className="mr-1" />
            Guardar y Seleccionar
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing="sm">
          <Text size="xs" color="muted" className="mb-1 leading-relaxed">
            Completa la información básica para dar de alta el producto en el catálogo y comenzar a recibir
            mercancía de inmediato.
          </Text>

          {generalError && (
            <Box className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs font-semibold flex items-center gap-2">
              <Icon name="AlertCircle" size="sm" className="shrink-0" />
              <span>{generalError}</span>
            </Box>
          )}

          {/* SKU / Barcode */}
          <Box>
            <Text as="label" size="xs" weight="bold" className="block mb-1 text-base-content/80">
              SKU / Código de Barras <span className="text-error">*</span>
            </Text>
            <TextInput
              size="sm"
              placeholder="Ej. BOC-01, 750123456789..."
              value={sku}
              onChange={(e) => {
                setSku(e.target.value);
                if (formErrors.sku) setFormErrors((p) => ({ ...p, sku: '' }));
              }}
              error={!!formErrors.sku}
              className="font-mono font-bold"
              autoFocus={!sku}
            />
            {formErrors.sku && (
              <Text size="xs" color="error" className="mt-1 block font-medium">
                {formErrors.sku}
              </Text>
            )}
          </Box>

          {/* Product Name */}
          <Box>
            <Text as="label" size="xs" weight="bold" className="block mb-1 text-base-content/80">
              Nombre del Producto <span className="text-error">*</span>
            </Text>
            <TextInput
              size="sm"
              placeholder="Ej. Balata Delantera Pulsar NS200..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) setFormErrors((p) => ({ ...p, name: '' }));
              }}
              error={!!formErrors.name}
              autoFocus={!!sku}
            />
            {formErrors.name && (
              <Text size="xs" color="error" className="mt-1 block font-medium">
                {formErrors.name}
              </Text>
            )}
          </Box>

          {/* Category and Brand row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Box>
              <Text as="label" size="xs" weight="bold" className="block mb-1 text-base-content/80">
                Categoría <span className="text-error">*</span>
              </Text>
              <SearchableSelect
                options={categoryOptions}
                value={categoryId}
                onChange={(id) => {
                  setCategoryId(id);
                  if (formErrors.categoryId) setFormErrors((p) => ({ ...p, categoryId: '' }));
                }}
                onCreateNew={handleCreateCategory}
                placeholder={loadingMeta ? 'Cargando categorías...' : 'Buscar o crear categoría...'}
                error={!!formErrors.categoryId}
                size="sm"
              />
              {formErrors.categoryId && (
                <Text size="xs" color="error" className="mt-1 block font-medium">
                  {formErrors.categoryId}
                </Text>
              )}
            </Box>

            <Box>
              <Text as="label" size="xs" weight="bold" className="block mb-1 text-base-content/80">
                Marca <span className="text-error">*</span>
              </Text>
              <SearchableSelect
                options={brandOptions}
                value={brandId}
                onChange={(id) => {
                  setBrandId(id);
                  if (formErrors.brandId) setFormErrors((p) => ({ ...p, brandId: '' }));
                }}
                onCreateNew={handleCreateBrand}
                placeholder={loadingMeta ? 'Cargando marcas...' : 'Buscar o crear marca...'}
                error={!!formErrors.brandId}
                size="sm"
              />
              {formErrors.brandId && (
                <Text size="xs" color="error" className="mt-1 block font-medium">
                  {formErrors.brandId}
                </Text>
              )}
            </Box>
          </div>

          {/* Unit, Cost Price and Selling Price */}
          <div className="grid grid-cols-3 gap-3">
            <Box>
              <Text as="label" size="xs" weight="bold" className="block mb-1 text-base-content/80">
                Unidad
              </Text>
              <Select
                size="sm"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                options={[
                  { value: 'pza', label: 'Pieza (pza)' },
                  { value: 'litro', label: 'Litro (L)' },
                  { value: 'kilo', label: 'Kilo (kg)' },
                  { value: 'metro', label: 'Metro (m)' },
                  { value: 'juego', label: 'Juego' },
                  { value: 'par', label: 'Par' },
                  { value: 'caja', label: 'Caja' },
                ]}
              />
            </Box>

            <Box>
              <Text as="label" size="xs" weight="bold" className="block mb-1 text-base-content/80">
                Precio Costo
              </Text>
              <TextInput
                size="sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={costPrice.toString()}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="font-mono text-right"
              />
            </Box>

            <Box>
              <Text as="label" size="xs" weight="bold" className="block mb-1 text-base-content/80">
                Precio Venta
              </Text>
              <TextInput
                size="sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={sellingPrice.toString()}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="font-mono text-right"
              />
            </Box>
          </div>
        </Stack>
      </form>
    </Modal>
  );
};

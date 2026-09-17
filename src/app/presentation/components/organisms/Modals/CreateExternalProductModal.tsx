import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Flex,
  Grid,
  Text,
  Heading,
  TextInput,
  Textarea,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Icon,
} from '@/app/presentation/components';
import { formatCurrency } from '@/core/utils';

export interface CreateExternalProductPayload {
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  supplier?: string;
  notes?: string;
}

export interface CreateExternalProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExternalProduct: (payload: CreateExternalProductPayload) => void;
}

export const CreateExternalProductModal: React.FC<CreateExternalProductModalProps> = ({
  isOpen,
  onClose,
  onAddExternalProduct,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    quantity?: string;
    unitPrice?: string;
    costPrice?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setName('');
      setQuantity(1);
      setUnitPrice('');
      setCostPrice('');
      setSupplier('');
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const errs: {
      name?: string;
      quantity?: string;
      unitPrice?: string;
      costPrice?: string;
    } = {};

    if (!name.trim()) {
      errs.name = 'El nombre o descripción del producto es obligatorio.';
    }

    if (!quantity || quantity < 1) {
      errs.quantity = 'La cantidad mínima es 1.';
    }

    if (unitPrice === '' || isNaN(Number(unitPrice)) || Number(unitPrice) < 0) {
      errs.unitPrice = 'Ingresa un precio de venta válido (0 o mayor).';
    }

    if (costPrice !== '' && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      errs.costPrice = 'El costo de compra debe ser un número válido.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    onAddExternalProduct({
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice) || 0,
      costPrice: costPrice !== '' ? Number(costPrice) : undefined,
      supplier: supplier.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const numUnitPrice = typeof unitPrice === 'number' ? unitPrice : 0;
  const numCostPrice = typeof costPrice === 'number' ? costPrice : 0;
  const numQty = quantity || 1;
  const subtotal = numUnitPrice * numQty;
  const hasCost = costPrice !== '' && numCostPrice > 0;
  const marginPerUnit = numUnitPrice - numCostPrice;
  const totalProfit = marginPerUnit * numQty;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Producto Rápido"
      maxWidth="540px"
    >
      <Box className="space-y-4">
        {/* Banner Informativo */}
        <Box className="p-3 bg-base-200/60 border border-base-300 rounded-xl">
          <Flex align="start" gap="xs">
            <Icon name="Info" size="sm" className="text-secondary shrink-0 mt-0.5" />
            <Box>
              <Text size="xs" weight="medium" className="text-base-content">
                Venta directa bajo demanda sin descontar inventario.
              </Text>
              <Text size="xs" variant="muted" className="mt-0.5 leading-relaxed">
                El costo y el proveedor son de uso interno y <strong>no aparecerán en el ticket del cliente</strong>.
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Nombre / Descripción */}
        <Box className="space-y-1">
          <Flex justify="between" align="center">
            <Text size="xs" weight="semibold" className="text-base-content">
              Nombre / Descripción del Producto *
            </Text>
            <Badge size="xs" variant="outline" color="secondary">
              Obligatorio
            </Badge>
          </Flex>
          <TextInput
            placeholder="Ej. Aceite Sintético 10W-40, Bomba de agua Gates 1.6, Balatas..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={Boolean(errors.name)}
            errorMessage={errors.name}
            autoFocus
          />
        </Box>

        {/* Cantidad y Precio de Venta */}
        <Grid cols={2} gap="sm">
          <Box className="space-y-1">
            <Text size="xs" weight="semibold" className="text-base-content">
              Cantidad *
            </Text>
            <TextInput
              type="number"
              min="1"
              step="1"
              value={String(quantity)}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setQuantity(isNaN(val) ? 1 : Math.max(1, val));
                if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: undefined }));
              }}
              error={Boolean(errors.quantity)}
              errorMessage={errors.quantity}
            />
          </Box>

          <Box className="space-y-1">
            <Flex justify="between" align="center">
              <Text size="xs" weight="semibold" className="text-base-content">
                Precio Venta (c/u) *
              </Text>
            </Flex>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={unitPrice === '' ? '' : String(unitPrice)}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                setUnitPrice(val);
                if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: undefined }));
              }}
              error={Boolean(errors.unitPrice)}
              errorMessage={errors.unitPrice}
            />
          </Box>
        </Grid>

        {/* Costo de Compra y Proveedor (Opcionales) */}
        <Grid cols={2} gap="sm">
          <Box className="space-y-1">
            <Flex justify="between" align="center">
              <Text size="xs" weight="semibold" className="text-base-content">
                Costo Compra (c/u)
              </Text>
              <Text size="xs" variant="muted">
                Opcional
              </Text>
            </Flex>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={costPrice === '' ? '' : String(costPrice)}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                setCostPrice(val);
                if (errors.costPrice) setErrors((prev) => ({ ...prev, costPrice: undefined }));
              }}
              error={Boolean(errors.costPrice)}
              errorMessage={errors.costPrice}
            />
          </Box>

          <Box className="space-y-1">
            <Flex justify="between" align="center">
              <Text size="xs" weight="semibold" className="text-base-content">
                Taller / Proveedor
              </Text>
              <Text size="xs" variant="muted">
                Opcional
              </Text>
            </Flex>
            <TextInput
              placeholder="Ej. AutoZone Norte, Taller Los Primos..."
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </Box>
        </Grid>

        {/* Notas / Garantía */}
        <Box className="space-y-1">
          <Flex justify="between" align="center">
            <Text size="xs" weight="semibold" className="text-base-content">
              Notas / Garantía
            </Text>
            <Text size="xs" variant="muted">
              Opcional
            </Text>
          </Flex>
          <Textarea
            placeholder="Ej. Garantía de 30 días directo con el proveedor, número de guía..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </Box>

        {/* Resumen de cálculo rápido */}
        <Box className="p-3 bg-base-200/40 rounded-xl border border-base-300">
          <Flex justify="between" align="center">
            <Box>
              <Text size="xs" variant="muted">
                Subtotal a cobrar al cliente:
              </Text>
              <Heading level={4} className="text-primary font-bold">
                {formatCurrency(subtotal)}
              </Heading>
            </Box>

            {hasCost && (
              <Box className="text-right">
                <Text size="xs" variant="muted">
                  Margen estimado:
                </Text>
                <Text
                  size="sm"
                  weight="bold"
                  className={totalProfit >= 0 ? 'text-success' : 'text-error'}
                >
                  {formatCurrency(totalProfit)} ({((marginPerUnit / (numUnitPrice || 1)) * 100).toFixed(1)}%)
                </Text>
              </Box>
            )}
          </Flex>
        </Box>

        {/* Footer Actions */}
        <Flex justify="end" gap="sm" className="pt-2">
          <SecondaryButton onClick={onClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton onClick={() => handleSubmit()} color="primary">
            <Icon name="Plus" size="sm" className="mr-1.5" />
            Agregar al Carrito
          </PrimaryButton>
        </Flex>
      </Box>
    </Modal>
  );
};

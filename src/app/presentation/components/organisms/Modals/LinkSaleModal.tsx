import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  KbdBadge,
  Box,
  Flex,
  Text,
  Icon,
  Badge,
  Stack,
} from '@/app/presentation/components';
import type { AdminMaintenanceOrder, Sale } from '@/app/domain';
import { salesRepository } from '@/core/di/container';
import { useAuthStore } from '@/app/presentation/stores';
import { formatCurrency, formatDate } from '@/core/utils';

import { cn } from '@/core/utils/cn';

export interface LinkSaleModalProps {
  isOpen: boolean;
  order: AdminMaintenanceOrder | null;
  onClose: () => void;
  onLink: (payload: { saleId?: string; folio?: string }) => Promise<void>;
  loading?: boolean;
}

const getSaleId = (s: Sale | null | undefined): string => {
  if (!s) return '';
  const anySale = s as unknown as Record<string, unknown>;
  return String(s.id || anySale._id || s.folio || '');
};

export const LinkSaleModal: React.FC<LinkSaleModalProps> = ({
  isOpen,
  order,
  onClose,
  onLink,
  loading = false,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [folioInput, setFolioInput] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'folio'>('recent');

  useEffect(() => {
    if (isOpen && accessToken) {
      setFolioInput('');
      setSelectedSale(null);
      setLoadingSales(true);
      salesRepository
        .getSales(accessToken, { isCancelled: false })
        .then((sales) => {
          setRecentSales(sales.slice(0, 15));
        })
        .catch(() => {
          setRecentSales([]);
        })
        .finally(() => {
          setLoadingSales(false);
        });
    }
  }, [isOpen, accessToken]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeTab === 'recent' && selectedSale) {
      const anySale = selectedSale as unknown as Record<string, unknown>;
      const saleId = String(selectedSale.id || anySale._id || '');
      await onLink({ saleId: saleId || undefined, folio: selectedSale.folio });
    } else if (folioInput.trim()) {
      const cleanFolio = folioInput.trim().replace(/^#/, '');
      await onLink({ folio: cleanFolio });
    }
  };

  const isSubmitDisabled =
    loading ||
    (activeTab === 'recent' && !selectedSale) ||
    (activeTab === 'folio' && !folioInput.trim());

  const selectedSaleKey = getSaleId(selectedSale);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular Ticket de Venta / POS"
      headerVariant="neutral"
    >
      <Box as="form" onSubmit={handleSubmit} className="p-6 space-y-5">
        <Text size="xs" variant="muted">
          Asocia el cobro de refacciones y mano de obra realizado en caja a esta orden.
        </Text>

        {/* ORDER INFO SUMMARY */}
        <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-base-300">
          <Flex justify="between" align="center" className="flex-wrap gap-2 text-xs">
            <Box>
              <Text size="xs" weight="bold" className="text-base-content">
                {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
              </Text>
              <Text size="xs" variant="muted">
                Cliente: <span className="font-semibold text-base-content/90">{order.customer.name}</span>
              </Text>
            </Box>
            <Badge variant="soft" color="warning" size="xs">
              Mano de obra:{' '}
              {order.laborCost || order.laborPrice
                ? formatCurrency(order.laborCost || order.laborPrice || 0)
                : 'Por cotizar'}
            </Badge>
          </Flex>
        </Box>

        {/* TABS SELECTOR */}
        <Box className="bg-base-200 p-1 rounded-lg flex gap-1 border border-base-300">
          <button
            type="button"
            onClick={() => {
              setActiveTab('recent');
              setSelectedSale(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'recent'
                ? 'bg-base-100 text-primary shadow-xs'
                : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
            }`}
          >
            <Icon name="Clock" size="xs" />
            <span>Ventas Recientes</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('folio');
              setSelectedSale(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'folio'
                ? 'bg-base-100 text-primary shadow-xs'
                : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
            }`}
          >
            <Icon name="Search" size="xs" />
            <span>Por Folio de Ticket</span>
          </button>
        </Box>

        {/* TAB 1: RECENT SALES LIST */}
        {activeTab === 'recent' && (
          <Box className="space-y-3">
            <Flex justify="between" align="center">
              <Text size="xs" weight="semibold" variant="muted">
                Selecciona una venta reciente de caja:
              </Text>
              {selectedSale && (
                <Text size="xs" className="text-primary font-semibold">
                  1 ticket seleccionado
                </Text>
              )}
            </Flex>

            {loadingSales ? (
              <Box className="p-8 text-center bg-base-200/50 rounded-DEFAULT border border-dashed border-base-300">
                <Icon name="RefreshCw" size="md" className="animate-spin text-primary mx-auto mb-2" />
                <Text size="xs" variant="muted">
                  Cargando ventas de caja...
                </Text>
              </Box>
            ) : recentSales.length === 0 ? (
              <Box className="p-6 text-center bg-base-200/50 rounded-DEFAULT border border-dashed border-base-300">
                <Text size="xs" variant="muted">
                  No hay ventas registradas recientemente en caja.
                </Text>
              </Box>
            ) : (
              <Stack spacing="xs" className="max-h-60 overflow-y-auto pr-1">
                {recentSales.map((sale) => {
                  const currentSaleKey = getSaleId(sale);
                  const isSelected = Boolean(selectedSaleKey && currentSaleKey && selectedSaleKey === currentSaleKey);
                  const sellerName = typeof sale.seller === 'string' ? sale.seller : sale.seller?.name || 'Cajero';

                  return (
                    <Box
                      key={currentSaleKey || sale.folio}
                      onClick={() => {
                        setSelectedSale((prev) => {
                          const prevKey = getSaleId(prev);
                          return prevKey === currentSaleKey ? null : sale;
                        });
                      }}
                      className={cn(
                        'group p-3 rounded-lg border-2 transition-all cursor-pointer relative select-none',
                        isSelected
                          ? 'bg-primary/15 border-primary shadow-sm ring-2 ring-primary/40 dark:bg-primary/20'
                          : 'bg-base-100 border-base-300/80 hover:border-primary/50 hover:bg-base-200/60'
                      )}
                    >
                      <Flex justify="between" align="center" gap="sm">
                        <Flex align="center" gap="sm" className="min-w-0 flex-1">
                          {/* Radio / Checkbox Indicator */}
                          <Box
                            className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                              isSelected
                                ? 'bg-primary text-primary-content shadow-xs scale-110'
                                : 'border-2 border-base-300 bg-base-100 group-hover:border-primary/50'
                            )}
                          >
                            {isSelected && <Icon name="Check" size="xs" className="stroke-[3]" />}
                          </Box>

                          {/* Ticket Info */}
                          <Box className="min-w-0 flex-1">
                            <Flex align="center" gap="xs" className="flex-wrap">
                              <span
                                className={cn(
                                  'font-mono font-bold text-xs transition-colors',
                                  isSelected ? 'text-primary font-black' : 'text-base-content'
                                )}
                              >
                                #{sale.folio}
                              </span>
                              <Badge
                                variant={isSelected ? 'solid' : 'soft'}
                                color={isSelected ? 'primary' : 'neutral'}
                                size="xs"
                                className="font-medium"
                              >
                                {sale.paymentMethod === 'card'
                                  ? 'Tarjeta'
                                  : sale.paymentMethod === 'transfer'
                                  ? 'Transferencia'
                                  : 'Efectivo'}
                              </Badge>
                              {isSelected && (
                                <Badge
                                  variant="solid"
                                  color="success"
                                  size="xs"
                                  className="gap-1 font-bold animate-fadeIn"
                                >
                                  <Icon name="Check" size="xs" />
                                  Seleccionado
                                </Badge>
                              )}
                            </Flex>

                            <Text size="xs" variant="muted" className="mt-0.5">
                              Atendió: <span className="font-medium text-base-content/80">{sellerName}</span>
                            </Text>
                            {sale.items && sale.items.length > 0 && (
                              <Text size="xs" variant="muted" className="text-[11px] line-clamp-1 mt-0.5">
                                {sale.items
                                  .map(
                                    (i: { quantity?: number; name?: string; productName?: string }) =>
                                      `${i.quantity || 1}x ${i.name || i.productName || 'Item'}`
                                  )
                                  .join(', ')}
                              </Text>
                            )}
                          </Box>
                        </Flex>

                        {/* Amount & Date */}
                        <Box className="text-right shrink-0">
                          <Text
                            size="sm"
                            weight="bold"
                            className={cn(
                              'font-mono text-sm font-black transition-colors',
                              isSelected ? 'text-primary' : 'text-base-content'
                            )}
                          >
                            {formatCurrency(sale.total)}
                          </Text>
                          <Text size="xs" variant="muted" className="text-[10px] font-mono block mt-0.5">
                            {formatDate(sale.createdAt)}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            )}

            {/* Selected Confirmation Banner */}
            {selectedSale && (
              <Box className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between animate-fadeIn">
                <Flex align="center" gap="sm">
                  <Box className="w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center shrink-0">
                    <Icon name="Check" size="xs" className="stroke-[3]" />
                  </Box>
                  <Box>
                    <Text size="xs" weight="bold" className="text-base-content">
                      Ticket seleccionado: <span className="font-mono text-primary font-bold">#{selectedSale.folio}</span>
                    </Text>
                    <Text size="xs" variant="muted">
                      Importe: <strong className="text-base-content font-mono">{formatCurrency(selectedSale.total)}</strong> • {selectedSale.paymentMethod || 'Efectivo'}
                    </Text>
                  </Box>
                </Flex>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSale(null);
                  }}
                  className="text-xs text-error hover:underline cursor-pointer font-semibold px-2 py-1"
                >
                  Quitar selección
                </button>
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: FOLIO INPUT */}
        {activeTab === 'folio' && (
          <Box className="space-y-2">
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block">
              Folio del Ticket de Venta
            </Text>
            <TextInput
              value={folioInput}
              onChange={(e) => setFolioInput(e.target.value)}
              placeholder="Ej. VEN-0045 o 0045"
              size="sm"
              autoFocus
            />
            <Text size="xs" variant="muted" className="text-[11px]">
              Ingresa el folio impreso en el ticket emitido en el módulo de Punto de Venta (POS).
            </Text>
          </Box>
        )}

        {/* ACTIONS */}
        <Flex justify="end" gap="sm" className="pt-3 border-t border-base-200">
          <SecondaryButton size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            color="primary"
            type="submit"
            disabled={isSubmitDisabled}
            loading={loading}
            iconStart={<Icon name="Link" size="xs" />}
          >
            <span>
              {activeTab === 'recent' && selectedSale
                ? `Vincular Ticket #${selectedSale.folio}`
                : 'Vincular Ticket'}
            </span>
            <KbdBadge keys="Enter" className="ml-1 opacity-80" />
          </PrimaryButton>
        </Flex>
      </Box>
    </Modal>
  );
};


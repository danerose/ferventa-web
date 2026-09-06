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

export interface LinkSaleModalProps {
  isOpen: boolean;
  order: AdminMaintenanceOrder | null;
  onClose: () => void;
  onLink: (payload: { saleId?: string; folio?: string }) => Promise<void>;
  loading?: boolean;
}

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
      const saleId = selectedSale.id || (selectedSale as { _id?: string })._id;
      await onLink({ saleId, folio: selectedSale.folio });
    } else if (folioInput.trim()) {
      const cleanFolio = folioInput.trim().replace(/^#/, '');
      await onLink({ folio: cleanFolio });
    }
  };

  const isSubmitDisabled =
    loading ||
    (activeTab === 'recent' && !selectedSale) ||
    (activeTab === 'folio' && !folioInput.trim());

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
          <Box className="space-y-2">
            <Text size="xs" weight="semibold" variant="muted">
              Selecciona una venta reciente de caja:
            </Text>

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
              <Stack spacing="xs" className="max-h-56 overflow-y-auto pr-1">
                {recentSales.map((sale) => {
                  const saleId = sale.id || (sale as { _id?: string })._id;
                  const isSelected = selectedSale?.id === sale.id || (selectedSale as { _id?: string })?._id === saleId;
                  const sellerName = typeof sale.seller === 'string' ? sale.seller : sale.seller?.name || 'Cajero';

                  return (
                    <Box
                      key={saleId}
                      onClick={() => setSelectedSale(sale)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                          : 'bg-base-100 border-base-300 hover:border-base-content/30 hover:bg-base-200/50'
                      }`}
                    >
                      <Flex justify="between" align="start">
                        <Box>
                          <Flex align="center" gap="xs">
                            <span className="font-mono font-bold text-xs text-base-content">
                              #{sale.folio}
                            </span>
                            <Badge variant="soft" color={isSelected ? 'primary' : 'neutral'} size="xs">
                              {sale.paymentMethod || 'Efectivo'}
                            </Badge>
                          </Flex>
                          <Text size="xs" variant="muted" className="mt-0.5">
                            Atendió: <span className="font-medium text-base-content/80">{sellerName}</span>
                          </Text>
                          {sale.items && sale.items.length > 0 && (
                            <Text size="xs" variant="muted" className="text-[11px] line-clamp-1 mt-0.5">
                              {sale.items.map((i: { quantity?: number; name?: string; productName?: string }) => `${i.quantity || 1}x ${i.name || i.productName || 'Item'}`).join(', ')}
                            </Text>
                          )}
                        </Box>
                        <Box className="text-right shrink-0">
                          <Text size="sm" weight="bold" className="text-primary font-mono text-sm font-black">
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
            <span>Vincular Ticket</span>
            <KbdBadge keys="Enter" className="ml-1 opacity-80" />
          </PrimaryButton>
        </Flex>
      </Box>
    </Modal>
  );
};

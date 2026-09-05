import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageLayout,
  Icon,
  PrimaryButton,
  SecondaryButton,
  TextInput,
  Box,
  Flex,
  Grid,
  Stack,
  Text,
  Heading,
  Badge,
  KbdBadge,
  CreateSpecialOrderModal,
  AddSpecialOrderPaymentModal,
  UpdateSpecialOrderStatusModal,
  CancelSpecialOrderModal,
  SpecialOrderDetailDrawer,
} from '@/app/presentation/components';
import { useAuthStore, useSpecialOrdersStore } from '@/app/presentation/stores';
import {
  SpecialOrderStatus,
  SPECIAL_ORDER_STATUS_LABELS,
  SPECIAL_ORDER_STATUS_COLORS,
} from '@/core/enums';
import { MODULE_THEMES } from '@/core/constants/moduleTheme';
import type {
  CreateSpecialOrderPayload,
  AddSpecialOrderPaymentPayload,
  UpdateSpecialOrderStatusPayload,
  CancelSpecialOrderPayload,
} from '@/app/domain';
import { formatCurrency, formatDate } from '@/core/utils';

export const SpecialOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, activeBranchId, clearAuth } = useAuthStore();

  // Store state & actions
  const {
    orders,
    summary,
    isLoading,
    searchInput,
    debouncedSearch,
    statusFilter,
    paidFilter,
    selectedOrder,
    toasts,
    setSearchInput,
    setStatusFilter,
    setPaidFilter,
    setSelectedOrder,
    loadData,
    createOrder,
    addPayment,
    updateOrderStatus,
    cancelOrder,
  } = useSpecialOrdersStore();

  // Ephemeral Modal / Drawer visibility state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [copiedFolioId, setCopiedFolioId] = useState<string | null>(null);

  // Sync data with backend
  useEffect(() => {
    if (!accessToken || !activeBranchId) return;
    loadData(accessToken, activeBranchId).catch((err) => {
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg === 'UNAUTHORIZED') {
        clearAuth();
        navigate('/login');
      }
    });
  }, [accessToken, activeBranchId, debouncedSearch, statusFilter, paidFilter, loadData, clearAuth, navigate]);

  // Keyboard shortcuts: Alt+N (New order), Alt+R (Refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setIsCreateModalOpen(true);
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (accessToken && activeBranchId && !isLoading) {
          loadData(accessToken, activeBranchId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accessToken, activeBranchId, isLoading, loadData]);

  // Handlers for modal actions
  const handleCreateOrder = async (payload: CreateSpecialOrderPayload) => {
    if (!accessToken || !activeBranchId) return;
    await createOrder(accessToken, activeBranchId, payload);
  };

  const handleAddPayment = async (orderId: string, payload: AddSpecialOrderPaymentPayload) => {
    if (!accessToken || !activeBranchId) return;
    await addPayment(accessToken, activeBranchId, orderId, payload);
  };

  const handleUpdateStatus = async (orderId: string, payload: UpdateSpecialOrderStatusPayload) => {
    if (!accessToken || !activeBranchId) return;
    await updateOrderStatus(accessToken, activeBranchId, orderId, payload);
  };

  const handleCancelOrder = async (orderId: string, payload: CancelSpecialOrderPayload) => {
    if (!accessToken || !activeBranchId) return;
    await cancelOrder(accessToken, activeBranchId, orderId, payload);
  };

  const handleCopyFolio = (folio: string, id: string) => {
    navigator.clipboard.writeText(folio);
    setCopiedFolioId(id);
    setTimeout(() => setCopiedFolioId(null), 2000);
  };

  // Status categories for quick filters
  const STATUS_TABS = [
    { key: 'all', label: 'Todos los Pedidos' },
    { key: SpecialOrderStatus.ORDER_PLACED, label: 'Levantados' },
    { key: SpecialOrderStatus.ORDERED, label: 'En Proveedor' },
    { key: SpecialOrderStatus.IN_TRANSIT, label: 'En Tránsito' },
    { key: SpecialOrderStatus.IN_BRANCH, label: 'En Sucursal' },
    { key: SpecialOrderStatus.READY_FOR_PICKUP, label: 'Por Entregar' },
    { key: SpecialOrderStatus.DELIVERED, label: 'Entregados' },
    { key: SpecialOrderStatus.CANCELLED, label: 'Cancelados' },
  ];

  // Calculated metrics
  const activeOrdersCount = summary?.activeOrders ?? 0;
  const inTransitCount = summary?.byStatus?.[SpecialOrderStatus.IN_TRANSIT] ?? 0;
  const inBranchCount =
    (summary?.byStatus?.[SpecialOrderStatus.IN_BRANCH] ?? 0) +
    (summary?.byStatus?.[SpecialOrderStatus.READY_FOR_PICKUP] ?? 0);
  const pendingBalanceTotal = summary?.totalPendingBalance ?? 0;
  const moduleMeta = MODULE_THEMES.specialOrders;

  return (
    <PageLayout userName={user?.name || 'Administrador'}>
        {/* TOPBAR */}
        <Flex
          as="header"
          align="center"
          justify="between"
          className="h-16 px-6 bg-base-100 border-b border-base-300 shrink-0 z-10 shadow-xs"
        >
          <Flex align="center" gap="md">
            <Box className={`w-9 h-9 rounded-DEFAULT ${moduleMeta.bgSoft} ${moduleMeta.text} flex items-center justify-center`}>
              <Icon name={moduleMeta.icon} size="sm" />
            </Box>
            <Box>
              <Heading level={2} className="font-bold tracking-tight">
                {moduleMeta.title}
              </Heading>
              <Text size="xs" variant="muted">
                {moduleMeta.subtitle}
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap="sm">
            <SecondaryButton
              size="sm"
              onClick={() => { if (accessToken && activeBranchId) loadData(accessToken, activeBranchId); }}
              disabled={isLoading}
              iconStart={<Icon name="RefreshCw" size="xs" className={isLoading ? 'animate-spin' : ''} />}
              title="Refrescar listado (Alt+R)"
            >
              Refrescar
              <KbdBadge keys="Alt+R" className="ml-1.5 opacity-80" />
            </SecondaryButton>

            <PrimaryButton
              size="sm"
              color="primary"
              onClick={() => setIsCreateModalOpen(true)}
              iconStart={<Icon name="PackagePlus" size="xs" />}
              title="Crear nuevo pedido (Alt+N)"
            >
              + Levantar Pedido
              <KbdBadge keys="Alt+N" className="ml-1.5 opacity-90" />
            </PrimaryButton>
          </Flex>
        </Flex>

        {/* SCROLLABLE CONTENT */}
        <Box as="main" className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI CARDS */}
          <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="md">
            {/* 1. Pedidos Activos */}
            <Box className="p-4 bg-base-100 rounded-DEFAULT border border-base-300 shadow-xs relative overflow-hidden">
              <Flex justify="between" align="start">
                <Box>
                  <Text size="xs" weight="semibold" variant="muted" className="uppercase tracking-wider block mb-1">
                    Pedidos Activos
                  </Text>
                  <Heading level={3} className="text-2xl font-bold tracking-tight">
                    {activeOrdersCount}
                  </Heading>
                  <Text size="xs" variant="muted" className="mt-1 block">
                    En proceso actualmente
                  </Text>
                </Box>
                <Box className="w-10 h-10 rounded-DEFAULT bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Icon name="Package" size="md" />
                </Box>
              </Flex>
            </Box>

            {/* 2. En Tránsito */}
            <Box className="p-4 bg-base-100 rounded-DEFAULT border border-base-300 shadow-xs relative overflow-hidden">
              <Flex justify="between" align="start">
                <Box>
                  <Text size="xs" weight="semibold" className="text-info uppercase tracking-wider block mb-1">
                    En Tránsito
                  </Text>
                  <Heading level={3} className="text-2xl font-bold text-info tracking-tight">
                    {inTransitCount}
                  </Heading>
                  <Text size="xs" variant="muted" className="mt-1 block">
                    En camino con paquetería
                  </Text>
                </Box>
                <Box className="w-10 h-10 rounded-DEFAULT bg-info/10 border border-info/20 flex items-center justify-center text-info">
                  <Icon name="Truck" size="md" />
                </Box>
              </Flex>
            </Box>

            {/* 3. En Sucursal / Por Entregar */}
            <Box className="p-4 bg-base-100 rounded-DEFAULT border border-base-300 shadow-xs relative overflow-hidden">
              <Flex justify="between" align="start">
                <Box>
                  <Text size="xs" weight="semibold" className="text-success uppercase tracking-wider block mb-1">
                    Listos en Sucursal
                  </Text>
                  <Heading level={3} className="text-2xl font-bold text-success tracking-tight">
                    {inBranchCount}
                  </Heading>
                  <Text size="xs" variant="muted" className="mt-1 block">
                    Por entregar al cliente
                  </Text>
                </Box>
                <Box className="w-10 h-10 rounded-DEFAULT bg-success/10 border border-success/20 flex items-center justify-center text-success">
                  <Icon name="Store" size="md" />
                </Box>
              </Flex>
            </Box>

            {/* 4. Saldo por Cobrar */}
            <Box className="p-4 bg-base-100 rounded-DEFAULT border border-base-300 shadow-xs relative overflow-hidden">
              <Flex justify="between" align="start">
                <Box>
                  <Text size="xs" weight="semibold" className="text-warning uppercase tracking-wider block mb-1">
                    Saldo por Cobrar
                  </Text>
                  <Heading level={3} className="text-2xl font-bold text-warning tracking-tight">
                    {formatCurrency(pendingBalanceTotal)}
                  </Heading>
                  <Text size="xs" variant="muted" className="mt-1 block">
                    Monto pendiente de liquidar
                  </Text>
                </Box>
                <Box className="w-10 h-10 rounded-DEFAULT bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
                  <Icon name="Coins" size="md" />
                </Box>
              </Flex>
            </Box>
          </Grid>

          {/* BARRA DE HERRAMIENTAS Y FILTROS */}
          <Box className="p-4 bg-base-100 rounded-DEFAULT border border-base-300 shadow-xs space-y-4">
            <Flex justify="between" align="center" className="flex-wrap gap-3">
              {/* Buscador reactivo */}
              <Box className="w-full md:w-80 relative">
                <Box className="absolute left-3 top-2.5 text-base-content/40 pointer-events-none z-10">
                  <Icon name="Search" size="sm" />
                </Box>
                <TextInput
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar folio, cliente, teléfono o pieza..."
                  size="sm"
                  className="pl-9 pr-8"
                />
                {searchInput && (
                  <SecondaryButton
                    size="xs"
                    onClick={() => setSearchInput('')}
                    className="absolute right-2 top-2"
                    title="Limpiar búsqueda"
                  >
                    <Icon name="X" size="xs" />
                  </SecondaryButton>
                )}
              </Box>

              {/* Filtro de Liquidación */}
              <Flex align="center" gap="xs">
                <Text size="xs" weight="semibold" variant="muted" className="mr-1">
                  Cobro:
                </Text>
                <SecondaryButton
                  size="xs"
                  color={paidFilter === 'all' ? 'neutral' : 'default'}
                  onClick={() => setPaidFilter('all')}
                >
                  Todos
                </SecondaryButton>
                <SecondaryButton
                  size="xs"
                  color={paidFilter === 'pending' ? 'warning' : 'default'}
                  onClick={() => setPaidFilter('pending')}
                >
                  Pendientes de Cobro
                </SecondaryButton>
                <SecondaryButton
                  size="xs"
                  color={paidFilter === 'paid' ? 'success' : 'default'}
                  onClick={() => setPaidFilter('paid')}
                >
                  Liquidados
                </SecondaryButton>
              </Flex>
            </Flex>

            {/* Píldoras de Estatus (Horizontal Scroll) */}
            <Flex gap="xs" className="overflow-x-auto pb-1 no-scrollbar border-t border-base-200 pt-3">
              {STATUS_TABS.map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <SecondaryButton
                    key={tab.key}
                    size="xs"
                    color={isActive ? 'primary' : 'default'}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    {tab.label}
                  </SecondaryButton>
                );
              })}
            </Flex>
          </Box>

          {/* LISTADO DE PEDIDOS */}
          {isLoading ? (
            <Stack spacing="md">
              {[1, 2, 3].map((n) => (
                <Box
                  key={n}
                  className="p-5 bg-base-100 rounded-DEFAULT border border-base-300 animate-pulse space-y-3"
                >
                  <Flex justify="between">
                    <Box className="w-36 h-4 bg-base-300 rounded-DEFAULT" />
                    <Box className="w-24 h-4 bg-base-300 rounded-DEFAULT" />
                  </Flex>
                  <Box className="w-3/4 h-5 bg-base-300 rounded-DEFAULT" />
                  <Box className="w-full h-3 bg-base-300 rounded-DEFAULT" />
                </Box>
              ))}
            </Stack>
          ) : orders.length === 0 ? (
            <Box className="p-12 text-center bg-base-100 rounded-DEFAULT border border-base-300">
              <Box className="w-16 h-16 rounded-DEFAULT bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
                <Icon name="PackageOpen" size="lg" />
              </Box>
              <Heading level={3} className="text-base font-bold mb-1">
                No se encontraron pedidos especiales
              </Heading>
              <Text size="xs" variant="muted" className="max-w-sm mx-auto mb-4 block">
                {searchInput || statusFilter !== 'all' || paidFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda o estatus para ver más resultados.'
                  : 'Aún no hay pedidos especiales registrados en esta sucursal.'}
              </Text>
              <PrimaryButton
                size="sm"
                color="primary"
                onClick={() => setIsCreateModalOpen(true)}
                iconStart={<Icon name="Plus" size="xs" />}
              >
                Levantar Nuevo Pedido
              </PrimaryButton>
            </Box>
          ) : (
            <Stack spacing="md">
              {orders.map((order) => {
                const sColor = SPECIAL_ORDER_STATUS_COLORS[order.status] || {
                  bg: 'bg-base-200',
                  text: 'text-base-content/80',
                  border: 'border-base-300',
                };

                const cleanPhone = order.customer.phone.replace(/\D/g, '');
                const waMessage = `Hola ${order.customer.name}, le avisamos que su pedido ${order.folio} (${order.itemDescription}) se encuentra en estatus: "${SPECIAL_ORDER_STATUS_LABELS[order.status]}". Saldo pendiente: ${formatCurrency(order.remainingBalance)}.`;
                const waUrl = `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

                const isCancelled = order.status === SpecialOrderStatus.CANCELLED;
                const isDelivered = order.status === SpecialOrderStatus.DELIVERED;

                return (
                  <Box
                    key={order.id}
                    bg="base-100"
                    rounded="DEFAULT"
                    className="p-5 border border-base-300 shadow-xs hover:shadow-md transition-all"
                  >
                    <Flex justify="between" align="start" className="flex-wrap gap-2 mb-3">
                      {/* Left Header: Folio & Status */}
                      <Flex align="center" gap="sm" className="flex-wrap">
                        <SecondaryButton
                          size="xs"
                          onClick={() => handleCopyFolio(order.folio, order.id)}
                          iconStart={<Icon name={copiedFolioId === order.id ? 'Check' : 'Copy'} size="xs" />}
                          title="Clic para copiar folio"
                        >
                          {copiedFolioId === order.id ? '¡Copiado!' : order.folio}
                        </SecondaryButton>

                        <Badge
                          variant="soft"
                          className={`font-semibold px-2.5 py-0.5 text-xs border ${sColor.bg} ${sColor.text} ${sColor.border}`}
                        >
                          {SPECIAL_ORDER_STATUS_LABELS[order.status] || order.status}
                        </Badge>

                        {order.estimatedArrivalDate && (
                          <Text size="xs" variant="muted">
                            📅 Llega: {formatDate(order.estimatedArrivalDate)}
                          </Text>
                        )}
                      </Flex>

                      {/* Right Header: Actions */}
                      <Flex align="center" gap="xs">
                        <SecondaryButton
                          size="xs"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailDrawerOpen(true);
                          }}
                          iconStart={<Icon name="Eye" size="xs" />}
                          title="Ver detalle completo"
                        >
                          Ver Detalle
                        </SecondaryButton>

                        {!isCancelled && !isDelivered && (
                          <SecondaryButton
                            size="xs"
                            color="primary"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsStatusModalOpen(true);
                            }}
                            iconStart={<Icon name="ArrowRight" size="xs" />}
                            title="Avanzar estatus"
                          >
                            Avanzar
                          </SecondaryButton>
                        )}

                        {!order.isFullyPaid && !isCancelled && (
                          <PrimaryButton
                            size="xs"
                            color="success"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsPaymentModalOpen(true);
                            }}
                            iconStart={<Icon name="CreditCard" size="xs" />}
                            title="Registrar abono"
                          >
                            Abonar
                          </PrimaryButton>
                        )}

                        {!isCancelled && !isDelivered && (
                          <SecondaryButton
                            size="xs"
                            color="error"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsCancelModalOpen(true);
                            }}
                            title="Cancelar pedido"
                          >
                            <Icon name="Trash2" size="xs" />
                          </SecondaryButton>
                        )}
                      </Flex>
                    </Flex>

                    {/* Body: Item Description & Customer info */}
                    <Grid cols={{ base: 1, md: 3 }} gap="md" className="items-center mb-3">
                      {/* Item */}
                      <Box className="md:col-span-2">
                        <Heading level={4} className="text-base font-bold mb-1">
                          {order.itemDescription}
                        </Heading>
                        <Flex align="center" gap="md" className="text-xs text-base-content/60">
                          <Flex align="center" gap="xs">
                            <Icon name="User" size="xs" />
                            <Text weight="semibold" className="text-base-content">
                              {order.customer.name}
                            </Text>
                          </Flex>

                          <Flex align="center" gap="xs">
                            <Icon name="Phone" size="xs" />
                            <Text>{order.customer.phone}</Text>
                          </Flex>

                          {cleanPhone && (
                            <Box
                              as="a"
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-success hover:underline font-semibold"
                            >
                              <Icon name="MessageCircle" size="xs" /> WhatsApp
                            </Box>
                          )}
                        </Flex>
                      </Box>

                      {/* Financial summary */}
                      <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-base-300 text-right">
                        <Flex justify="between" align="center" className="mb-1 text-xs">
                          <Text variant="muted">Precio Venta:</Text>
                          <Text weight="bold">
                            {formatCurrency(order.sellingPrice)}
                          </Text>
                        </Flex>
                        <Flex justify="between" align="center" className="text-xs">
                          <Text variant="muted">Saldo Restante:</Text>
                          <Text
                            weight="bold"
                            className={order.isFullyPaid ? 'text-success' : 'text-warning'}
                          >
                            {order.isFullyPaid ? 'Liquidado' : formatCurrency(order.remainingBalance)}
                          </Text>
                        </Flex>
                      </Box>
                    </Grid>

                    {/* Progress Bar of Advance Payment */}
                    <Box className="pt-2 border-t border-base-200">
                      <Flex justify="between" align="center" className="mb-1 text-xs">
                        <Text size="xs" variant="muted">
                          Cubierto: <Text as="strong" size="xs" weight="bold">{order.advancePercentage.toFixed(1)}%</Text> ({formatCurrency(order.advancePayment)} de {formatCurrency(order.sellingPrice)})
                        </Text>
                        <Badge
                          variant="soft"
                          color={order.isFullyPaid ? 'success' : 'warning'}
                          size="xs"
                          className="font-bold"
                        >
                          {order.isFullyPaid ? 'Liquidado' : `Resta: ${formatCurrency(order.remainingBalance)}`}
                        </Badge>
                      </Flex>

                      <Box className="w-full bg-base-200 h-2 rounded-full overflow-hidden">
                        <Box
                          className={`h-full transition-all duration-500 rounded-full ${
                            order.isFullyPaid ? 'bg-success' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, order.advancePercentage))}%` }}
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* MODALS & DRAWERS */}
      <CreateSpecialOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <AddSpecialOrderPaymentModal
        isOpen={isPaymentModalOpen}
        order={selectedOrder}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleAddPayment}
      />

      <UpdateSpecialOrderStatusModal
        isOpen={isStatusModalOpen}
        order={selectedOrder}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleUpdateStatus}
      />

      <CancelSpecialOrderModal
        isOpen={isCancelModalOpen}
        order={selectedOrder}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={handleCancelOrder}
      />

      <SpecialOrderDetailDrawer
        isOpen={isDetailDrawerOpen}
        order={selectedOrder}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedOrder(null);
        }}
        onOpenPaymentModal={(ord) => {
          setSelectedOrder(ord);
          setIsPaymentModalOpen(true);
        }}
        onOpenStatusModal={(ord) => {
          setSelectedOrder(ord);
          setIsStatusModalOpen(true);
        }}
        onOpenCancelModal={(ord) => {
          setSelectedOrder(ord);
          setIsCancelModalOpen(true);
        }}
      />

      {/* TOASTS */}
      <Box className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Box
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            <Icon
              name={toast.type === 'success' ? 'CheckCircle2' : 'AlertTriangle'}
              size="sm"
              className={toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}
            />
            {toast.message}
          </Box>
        ))}
      </Box>
    </PageLayout>
  );
};

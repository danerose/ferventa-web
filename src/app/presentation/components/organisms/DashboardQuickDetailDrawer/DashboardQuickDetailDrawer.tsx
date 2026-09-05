import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  PrimaryButton,
  TertiaryButton,
  TextInput,
  KbdBadge,
} from '@/app/presentation/components';
import type { Product, AdminMaintenanceOrder, AdminAppointment, Sale } from '@/app/domain';
import { useInventoryStore } from '@/app/presentation/stores';
import { formatCurrency, formatScheduledAt } from '@/core/utils';
import { cn } from '@/core/utils/cn';

export type DashboardDrawerType = 'stock' | 'orders' | 'appointments' | 'sales' | null;

export interface DashboardQuickDetailDrawerProps {
  isOpen: boolean;
  type: DashboardDrawerType;
  onClose: () => void;
  lowStockProducts: Product[];
  activeWorkorders: AdminMaintenanceOrder[];
  pendingAppointments: AdminAppointment[];
  todaySales: Sale[];
  onOpenSaleDetail?: (sale: Sale) => void;
}

export const DashboardQuickDetailDrawer: React.FC<DashboardQuickDetailDrawerProps> = ({
  isOpen,
  type,
  onClose,
  lowStockProducts,
  activeWorkorders,
  pendingAppointments,
  todaySales,
  onOpenSaleDetail,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Reset search when opening/changing type
  useEffect(() => {
    setSearchTerm('');
  }, [type, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ── Filtered data ───────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!lowStockProducts) return [];
    if (!searchTerm.trim()) return lowStockProducts;
    const q = searchTerm.toLowerCase();
    return lowStockProducts.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q)
    );
  }, [lowStockProducts, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!activeWorkorders) return [];
    if (!searchTerm.trim()) return activeWorkorders;
    const q = searchTerm.toLowerCase();
    return activeWorkorders.filter(
      o =>
        o.customer?.name.toLowerCase().includes(q) ||
        o.vehicle?.model.toLowerCase().includes(q) ||
        o.vehicle?.brand.toLowerCase().includes(q) ||
        o.vehicle?.serialNumberLastFour?.toLowerCase().includes(q)
    );
  }, [activeWorkorders, searchTerm]);

  const filteredAppointments = useMemo(() => {
    if (!pendingAppointments) return [];
    if (!searchTerm.trim()) return pendingAppointments;
    const q = searchTerm.toLowerCase();
    return pendingAppointments.filter(
      a =>
        a.customerName?.toLowerCase().includes(q) ||
        a.serviceRequested?.toLowerCase().includes(q) ||
        a.vehicle?.model?.toLowerCase().includes(q) ||
        a.customerPhone?.toLowerCase().includes(q)
    );
  }, [pendingAppointments, searchTerm]);

  const filteredSales = useMemo(() => {
    if (!todaySales) return [];
    if (!searchTerm.trim()) return todaySales;
    const q = searchTerm.toLowerCase();
    return todaySales.filter(
      s =>
        s.folio?.toLowerCase().includes(q) ||
        s.customer?.name?.toLowerCase().includes(q) ||
        s.paymentMethod?.toLowerCase().includes(q)
    );
  }, [todaySales, searchTerm]);

  if (!isOpen || !type) return null;

  // ── Navigation Handlers ─────────────────────────────────────────────────────
  const handleGoToProduct = (product: Product) => {
    useInventoryStore.getState().setActiveTab('inventory');
    useInventoryStore.getState().setSearchValue(product.name || product.sku);
    onClose();
    navigate('/admin/inventario');
  };

  const handleGoToAllInventory = () => {
    useInventoryStore.getState().setActiveTab('inventory');
    useInventoryStore.getState().setSearchValue('');
    onClose();
    navigate('/admin/inventario');
  };

  const handleGoToOrders = () => {
    onClose();
    navigate('/admin/mantenimiento');
  };

  const handleGoToAppointments = () => {
    onClose();
    navigate('/admin/citas');
  };

  const handleGoToPOS = () => {
    onClose();
    navigate('/admin/pos');
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────
  const getHeaderInfo = () => {
    switch (type) {
      case 'stock':
        return {
          title: 'Productos con Stock Bajo',
          subtitle: `${lowStockProducts.length} ${lowStockProducts.length === 1 ? 'producto requiere' : 'productos requieren'} reabastecimiento`,
          icon: 'AlertTriangle' as const,
          iconColor: 'text-error',
          iconBg: 'bg-error/10',
          badgeText: `${lowStockProducts.length} críticos`,
          badgeColor: 'bg-error/15 text-error border border-error/30',
        };
      case 'orders':
        return {
          title: 'Órdenes Activas en Taller',
          subtitle: `${activeWorkorders.length} ${activeWorkorders.length === 1 ? 'vehículo en proceso' : 'vehículos en proceso'} de mantenimiento`,
          icon: 'Wrench' as const,
          iconColor: 'text-warning',
          iconBg: 'bg-warning/10',
          badgeText: `${activeWorkorders.length} en taller`,
          badgeColor: 'bg-warning/20 text-warning border border-warning/40',
        };
      case 'appointments':
        return {
          title: 'Citas Pendientes de Confirmación',
          subtitle: `${pendingAppointments.length} ${pendingAppointments.length === 1 ? 'cita pendiente' : 'citas pendientes'} por aprobar`,
          icon: 'Calendar' as const,
          iconColor: 'text-warning',
          iconBg: 'bg-warning/10',
          badgeText: `${pendingAppointments.length} por revisar`,
          badgeColor: 'bg-warning/20 text-warning border border-warning/40',
        };
      case 'sales':
        return {
          title: 'Ventas Realizadas Hoy',
          subtitle: `${todaySales.length} ${todaySales.length === 1 ? 'ticket registrado' : 'tickets registrados'} el día de hoy`,
          icon: 'DollarSign' as const,
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          badgeText: `${todaySales.length} tickets`,
          badgeColor: 'bg-primary/15 text-primary border border-primary/30',
        };
    }
  };

  const header = getHeaderInfo();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[998] transition-opacity duration-200"
      />

      {/* Sidepanel Drawer */}
      <aside className="fixed top-0 right-0 bottom-0 w-[520px] max-w-[95vw] bg-base-100 border-l border-base-300 shadow-2xl z-[999] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-5 px-6 border-b border-base-300 flex justify-between items-center bg-base-200/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-DEFAULT flex items-center justify-center shrink-0', header.iconBg, header.iconColor)}>
              <Icon name={header.icon} size="md" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-base-content m-0 leading-tight">
                  {header.title}
                </h2>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', header.badgeColor)}>
                  {header.badgeText}
                </span>
              </div>
              <p className="text-xs text-base-content/60 m-0 mt-0.5">{header.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <KbdBadge keys="Esc" className="opacity-70 text-[10px]" />
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              title="Cerrar (Esc)"
            >
              <Icon name="X" size="md" />
            </button>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="p-4 px-6 border-b border-base-300 bg-base-100 shrink-0">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
              <Icon name="Search" size="xs" />
            </div>
            <TextInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                type === 'stock'
                  ? 'Buscar por nombre, SKU o categoría...'
                  : type === 'orders'
                  ? 'Buscar por cliente, modelo o placas...'
                  : type === 'appointments'
                  ? 'Buscar por cliente, servicio o teléfono...'
                  : 'Buscar por folio o cliente...'
              }
              size="sm"
              className="w-full pl-9"
            />
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {/* ── STOCK BAJO ────────────────────────────────────────────── */}
          {type === 'stock' && (
            filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-3">
                  <Icon name="CheckCircle2" size="lg" />
                </div>
                <h4 className="text-sm font-bold text-base-content m-0">No hay productos en stock bajo</h4>
                <p className="text-xs text-base-content/60 mt-1 max-w-xs">
                  {searchTerm ? 'No se encontraron coincidencias con tu búsqueda.' : 'Todos los productos tienen niveles de inventario óptimos.'}
                </p>
              </div>
            ) : (
              filteredProducts.map(p => {
                const minS = p.minStock !== undefined && p.minStock !== null ? p.minStock : 5;
                const isZero = (p.stock || 0) === 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleGoToProduct(p)}
                    className="p-4 bg-base-200/40 hover:bg-base-200 border border-base-300 rounded-DEFAULT cursor-pointer transition-all duration-150 group flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-base-content truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-base-content/60">
                          {p.sku && (
                            <span className="font-mono bg-base-300/60 px-1.5 py-0.5 rounded text-[11px] font-semibold text-base-content">
                              SKU: {p.sku}
                            </span>
                          )}
                          {p.category?.name && (
                            <span>• {p.category.name}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 bg-error/15 text-error border-error/30">
                          <Icon name="AlertCircle" size="xs" />
                          {isZero ? 'Agotado (0)' : `${p.stock} ${p.unit || 'pza'}`}
                          <span className="font-normal text-[10px] opacity-80">(Mín: {minS})</span>
                        </span>
                        <div className="text-xs font-semibold text-base-content mt-1">
                          {formatCurrency(p.sellingPrice || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-base-300/60 flex justify-between items-center text-xs text-base-content/60">
                      <span className="text-[11px] text-base-content/50">
                        {p.costPrice ? `Costo: ${formatCurrency(p.costPrice)}` : 'Sin costo registrado'}
                      </span>
                      <span className="text-primary font-semibold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Ver en Inventario <Icon name="ArrowRight" size="xs" />
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ── ÓRDENES ACTIVAS ────────────────────────────────────────── */}
          {type === 'orders' && (
            filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-base-200 text-base-content/40 flex items-center justify-center mb-3">
                  <Icon name="Wrench" size="lg" />
                </div>
                <h4 className="text-sm font-bold text-base-content m-0">No hay órdenes activas</h4>
                <p className="text-xs text-base-content/60 mt-1 max-w-xs">
                  {searchTerm ? 'No se encontraron órdenes con ese criterio.' : 'Actualmente no hay vehículos en proceso en el taller.'}
                </p>
              </div>
            ) : (
              filteredOrders.map(o => {
                const getStatusInfo = (status: string) => {
                  switch (status) {
                    case 'in_progress':
                    case 'not_started':
                      return { label: 'En Proceso', color: 'bg-warning/20 text-warning border-warning/40' };
                    case 'completed':
                      return { label: 'Terminado', color: 'bg-success/15 text-success border-success/30' };
                    case 'delivered':
                      return { label: 'Entregado', color: 'bg-info/15 text-info border-info/30' };
                    default:
                      return { label: 'En Proceso', color: 'bg-warning/20 text-warning border-warning/40' };
                  }
                };

                const st = getStatusInfo(o.status);
                const mechanicName =
                  typeof o.assignedMechanic === 'object' && o.assignedMechanic !== null
                    ? (o.assignedMechanic as { name?: string }).name
                    : typeof o.assignedMechanic === 'string'
                    ? o.assignedMechanic
                    : 'Sin asignar';

                return (
                  <div
                    key={o.id}
                    onClick={handleGoToOrders}
                    className="p-4 bg-base-200/40 hover:bg-base-200 border border-base-300 rounded-DEFAULT cursor-pointer transition-all duration-150 group flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-base-content truncate group-hover:text-primary transition-colors">
                            {o.customer?.name || 'Cliente sin nombre'}
                          </span>
                        </div>
                        <div className="text-xs text-base-content/80 mt-0.5">
                          {o.vehicle ? `${o.vehicle.brand} ${o.vehicle.model} (${o.vehicle.year})` : 'Vehículo no especificado'}
                          {o.vehicle?.serialNumberLastFour && (
                            <span className="text-base-content/50 ml-1">· Placas/Serie: {o.vehicle.serialNumberLastFour}</span>
                          )}
                        </div>
                      </div>

                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0', st.color)}>
                        {st.label}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-base-300/60 flex justify-between items-center text-xs text-base-content/60">
                      <span className="text-[11px] flex items-center gap-1">
                        <Icon name="User" size="xs" /> Mecánico: <strong>{mechanicName}</strong>
                      </span>
                      <span className="text-secondary font-semibold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Abrir Taller <Icon name="ArrowRight" size="xs" />
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ── CITAS PENDIENTES ──────────────────────────────────────── */}
          {type === 'appointments' && (
            filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-base-200 text-base-content/40 flex items-center justify-center mb-3">
                  <Icon name="CalendarCheck" size="lg" />
                </div>
                <h4 className="text-sm font-bold text-base-content m-0">No hay citas pendientes</h4>
                <p className="text-xs text-base-content/60 mt-1 max-w-xs">
                  {searchTerm ? 'No se encontraron citas con ese criterio.' : 'Todas las citas han sido gestionadas o aprobadas.'}
                </p>
              </div>
            ) : (
              filteredAppointments.map(a => {
                const sched = formatScheduledAt(a.scheduledAt);
                return (
                  <div
                    key={a.id}
                    onClick={handleGoToAppointments}
                    className="p-4 bg-base-200/40 hover:bg-base-200 border border-base-300 rounded-DEFAULT cursor-pointer transition-all duration-150 group flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-base-content truncate group-hover:text-primary transition-colors block">
                          {a.customerName}
                        </span>
                        <span className="text-xs text-base-content/70 mt-0.5 block font-medium">
                          {a.serviceRequested || 'Servicio General'}
                        </span>
                        {a.vehicle && (
                          <span className="text-[11px] text-base-content/50 block mt-0.5">
                            {a.vehicle.brand} {a.vehicle.model} ({a.vehicle.year})
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-warning/15 text-warning border border-warning/30 block">
                          {sched.date} {sched.time} {sched.period}
                        </span>
                        {a.customerPhone && (
                          <span className="text-[11px] text-base-content/60 block mt-1">
                            Tel: {a.customerPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-base-300/60 flex justify-between items-center text-xs text-base-content/60">
                      <span className="text-[11px] text-warning font-medium flex items-center gap-1">
                        <Icon name="Clock" size="xs" /> Esperando aprobación
                      </span>
                      <span className="text-primary font-semibold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Gestionar Cita <Icon name="ArrowRight" size="xs" />
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* ── VENTAS DE HOY ─────────────────────────────────────────── */}
          {type === 'sales' && (
            filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-base-200 text-base-content/40 flex items-center justify-center mb-3">
                  <Icon name="ShoppingBag" size="lg" />
                </div>
                <h4 className="text-sm font-bold text-base-content m-0">No hay ventas registradas hoy</h4>
                <p className="text-xs text-base-content/60 mt-1 max-w-xs">
                  {searchTerm ? 'No se encontraron tickets con ese criterio.' : 'Aún no se han cobrado ventas el día de hoy.'}
                </p>
              </div>
            ) : (
              filteredSales.map(s => {
                const timeFmt = s.createdAt
                  ? new Date(s.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : 'Hoy';

                return (
                  <div
                    key={s.id}
                    onClick={() => onOpenSaleDetail?.(s)}
                    className="p-4 bg-base-200/40 hover:bg-base-200 border border-base-300 rounded-DEFAULT cursor-pointer transition-all duration-150 group flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-base-content font-mono group-hover:text-primary transition-colors">
                            {s.folio || `Venta #${s.id.slice(-6)}`}
                          </span>
                          <span className="text-xs text-base-content/50">· {timeFmt}</span>
                        </div>
                        <span className="text-xs text-base-content/70 mt-0.5 block">
                          Cliente: <strong>{s.customer?.name || 'Venta de Mostrador'}</strong>
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-success block">
                          {formatCurrency(s.total || 0)}
                        </span>
                        <span className="badge badge-xs badge-neutral uppercase font-medium mt-1">
                          {s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-base-300/60 flex justify-between items-center text-xs text-base-content/60">
                      <span className="text-[11px]">
                        {s.items?.length || 0} {(s.items?.length || 0) === 1 ? 'artículo' : 'artículos'}
                      </span>
                      <span className="text-primary font-semibold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Ver Ticket <Icon name="Receipt" size="xs" />
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-base-300 bg-base-200/50 flex justify-between items-center gap-3 shrink-0">
          <TertiaryButton size="sm" onClick={onClose}>
            Cerrar <KbdBadge keys="Esc" className="ml-1" />
          </TertiaryButton>

          {type === 'stock' && (
            <PrimaryButton size="sm" onClick={handleGoToAllInventory}>
              <Icon name="Package" size="xs" className="mr-1.5" /> Ir a Inventario Completo
            </PrimaryButton>
          )}

          {type === 'orders' && (
            <PrimaryButton size="sm" color="secondary" onClick={handleGoToOrders}>
              <Icon name="Wrench" size="xs" className="mr-1.5" /> Ir a Mantenimiento
            </PrimaryButton>
          )}

          {type === 'appointments' && (
            <PrimaryButton size="sm" color="warning" onClick={handleGoToAppointments}>
              <Icon name="Calendar" size="xs" className="mr-1.5" /> Ir a Calendario de Citas
            </PrimaryButton>
          )}

          {type === 'sales' && (
            <PrimaryButton size="sm" color="primary" onClick={handleGoToPOS}>
              <Icon name="ShoppingCart" size="xs" className="mr-1.5" /> Nueva Venta (POS)
            </PrimaryButton>
          )}
        </div>
      </aside>
    </>
  );
};

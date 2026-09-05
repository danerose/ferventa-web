import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  PageLayout,
  SaleDetailDrawer,
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  Badge,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  Select,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { usePrinterSettingsStore } from '@/app/presentation/stores';
import { thermalPrintService } from '@/core/services';
import {
  salesRepository as salesRepo,
  adminRepository as adminRepo,
  inventoryRepository as inventoryRepo,
} from '@/core/di/container';
import type { Sale, Branch, AdminMaintenanceOrder, Product } from '@/app/domain';
import { MODULE_THEMES } from '@/core';
import { cn } from '@/core/utils/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isAdminUser(user: { role?: unknown } | null | undefined): boolean {
  if (!user) return false;
  const roleVal = user.role;
  if (typeof roleVal === 'string') {
    const r = roleVal.toLowerCase();
    return r === 'admin' || r === 'administrator';
  }
  if (roleVal && typeof roleVal === 'object' && 'name' in roleVal) {
    const r = String((roleVal as { name?: unknown }).name || '').toLowerCase();
    return r === 'admin' || r === 'administrator';
  }
  return false;
}

// ─── DateRangePicker Component ──────────────────────────────────────────────

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAY_LABELS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function buildCalendarDays(month: number, year: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const adjusted = firstDay === 0 ? 6 : firstDay - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();
  const days: { num: number; dateStr: string; cur: boolean }[] = [];

  for (let i = adjusted - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevTotal - i);
    days.push({ num: prevTotal - i, dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, cur: false });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dd = new Date(year, month, d);
    days.push({ num: d, dateStr: `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`, cur: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const dd = new Date(year, month + 1, i);
    days.push({ num: i, dateStr: `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`, cur: false });
  }
  return days;
}

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeStart: (d: string) => void;
  onChangeEnd: (d: string) => void;
}

function DateRangePicker({ startDate, endDate, onChangeStart, onChangeEnd }: DateRangePickerProps) {
  const today = new Date();
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [hovered, setHovered] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const days = buildCalendarDays(month, year);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDayClick = (dateStr: string) => {
    if (!startDate || (startDate && endDate)) {
      onChangeStart(dateStr);
      onChangeEnd('');
    } else {
      if (dateStr < startDate) {
        onChangeStart(dateStr);
      } else {
        onChangeEnd(dateStr);
      }
    }
  };

  const isInRange = (dateStr: string) => {
    const comp = hovered || endDate;
    if (!startDate || !comp) return false;
    const lo = startDate < comp ? startDate : comp;
    const hi = startDate < comp ? comp : startDate;
    return dateStr > lo && dateStr < hi;
  };

  const label = () => {
    if (!startDate && !endDate) return 'Seleccionar rango de fechas...';
    if (startDate && !endDate) return `${startDate}  →  Fin`;
    return `${startDate}  —  ${endDate}`;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <Box ref={containerRef} className="relative inline-block">
      <SecondaryButton
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        iconStart={<Icon name="CalendarRange" size="xs" />}
        iconEnd={<Icon name="ChevronDown" size="xs" />}
      >
        {label()}
      </SecondaryButton>

      {isOpen && (
        <Box className="absolute top-[calc(100%+6px)] left-0 z-50 bg-base-100 border border-base-300 rounded-DEFAULT p-4 shadow-xl min-w-[290px]">
          {/* Month nav */}
          <Flex justify="between" align="center" className="mb-3">
            <TertiaryButton size="xs" onClick={prevMonth}>‹</TertiaryButton>
            <Text weight="bold" className="text-xs">{MONTH_NAMES_ES[month]} {year}</Text>
            <TertiaryButton size="xs" onClick={nextMonth}>›</TertiaryButton>
          </Flex>

          {/* Day labels */}
          <Grid cols={7} gap="none" className="mb-1.5">
            {DAY_LABELS_ES.map(l => (
              <Text key={l} size="xs" weight="bold" color="muted" className="text-center uppercase py-0.5 text-[10px]">
                {l}
              </Text>
            ))}
          </Grid>

          {/* Day cells */}
          <Grid cols={7} gap="none" className="gap-0.5">
            {days.map((d, i) => {
              if (!d.cur) {
                return (
                  <Flex key={i} align="center" justify="center" className="aspect-square text-xs text-base-content/20">
                    {d.num}
                  </Flex>
                );
              }
              const isStart = d.dateStr === startDate;
              const isEnd = d.dateStr === endDate;
              const inRange = isInRange(d.dateStr);
              return (
                <TertiaryButton
                  key={i}
                  size="xs"
                  onClick={() => handleDayClick(d.dateStr)}
                  onMouseEnter={() => setHovered(d.dateStr)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    'aspect-square p-0 min-h-0 h-8 w-8 text-xs font-semibold rounded-DEFAULT transition-colors',
                    (isStart || isEnd) && 'btn-neutral text-neutral-content',
                    inRange && 'bg-primary/20 text-primary'
                  )}
                >
                  {d.num}
                </TertiaryButton>
              );
            })}
          </Grid>

          <Flex gap="sm" className="mt-3 pt-2.5 border-t border-base-200">
            <SecondaryButton
              size="xs"
              className="flex-1"
              onClick={() => { onChangeStart(''); onChangeEnd(''); }}
            >
              Limpiar
            </SecondaryButton>
            <PrimaryButton
              size="xs"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Aceptar
            </PrimaryButton>
          </Flex>
        </Box>
      )}
    </Box>
  );
}

// ─── Chart Components ────────────────────────────────────────────────────────

function BarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <Box className="w-full">
      <Text size="xs" weight="semibold" color="muted" className="mb-2 block">{label}</Text>
      <svg viewBox="0 0 400 160" className="w-full h-40">
        {data.map((d, i) => {
          const barHeight = max > 0 ? (d.value / max) * 120 : 0;
          const x = i * (400 / data.length) + (400 / data.length) * 0.1;
          const w = (400 / data.length) * 0.8;
          const y = 130 - barHeight;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={w} height={barHeight}
                rx="4"
                fill={barHeight > 0 ? '#2563eb' : '#e2e8f0'}
                opacity="0.85"
              />
              <text x={x + w / 2} y={148} textAnchor="middle" fontSize="9" fill="#64748b">
                {d.label}
              </text>
              {barHeight > 10 && (
                <text x={x + w / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#2563eb" fontWeight="600">
                  ${d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

function LineChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 400; const H = 140; const pad = 20;

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - 2 * pad);
    const y = H - pad - (d.value / max) * (H - 2 * pad - 10);
    return { x, y, ...d };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 1
    ? `M${points[0].x},${H - pad} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${H - pad} Z`
    : '';

  return (
    <Box className="w-full">
      <Text size="xs" weight="semibold" color="muted" className="mb-2 block">{label}</Text>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill="url(#lineGrad)" />}
        {points.length > 1 && (
          <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#2563eb" />
            <text x={p.x} y={H - 4} textAnchor="middle" fontSize="9" fill="#64748b">{p.label}</text>
          </g>
        ))}
      </svg>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type PageTab = 'dashboard' | 'ventas';
type SalesPeriod = 'today' | 'week' | 'month' | 'custom';

export const OperationsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, activeBranchId, clearAuth } = useAuthStore();
  const printerSettings = usePrinterSettingsStore() as import('@/app/presentation/stores').PrinterSettings;
  const isAdmin = isAdminUser(user);

  const handleUnauthorized = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  const [pageTab, setPageTab] = useState<PageTab>('dashboard');

  // ── Dashboard KPI state ──────────────────────────────────────────────────
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [yesterdaySales, setYesterdaySales] = useState<Sale[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [activeWorkorders, setActiveWorkorders] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [dashLoading, setDashLoading] = useState(true);

  // ── Sales tab state ─────────────────────────────────────────────────────
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('week');
  const [salesBranchFilter, setSalesBranchFilter] = useState<string>(activeBranchId || 'active');
  const [salesPaymentMethodFilter, setSalesPaymentMethodFilter] = useState<'all' | 'cash' | 'card' | 'transfer'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  // ── Sidepanel Drawer state ────────────────────────────────────────────────
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectSale = useCallback(async (sale: Sale) => {
    setSelectedSale(sale);
    setIsDrawerOpen(true);

    const saleId = sale.id;
    if (!accessToken || !saleId) return;

    try {
      const fullSale = await salesRepo.getSale(accessToken, saleId);
      if (fullSale) {
        setSelectedSale(fullSale);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
    }
  }, [accessToken, handleUnauthorized]);

  const handleCancelSale = async (saleId: string, reason: string) => {
    if (!accessToken) return;
    await salesRepo.cancelSale(accessToken, saleId, reason);
    setSalesData(prev => prev.map(s => (s.id === saleId) ? { ...s, isCancelled: true, cancelReason: reason } : s));
    setTodaySales(prev => prev.map(s => (s.id === saleId) ? { ...s, isCancelled: true, cancelReason: reason } : s));
  };

  // ── Load sales, maintenances & inventory for Dashboard KPIs ──────────────────────
  useEffect(() => {
    if (!accessToken) return;
    const loadDashboard = async () => {
      setDashLoading(true);
      try {
        const today = toDateString(new Date());
        const yd = new Date();
        yd.setDate(yd.getDate() - 1);
        const yesterday = toDateString(yd);

        const [todayData, ydData, maintenancesData, productsData] = await Promise.all([
          salesRepo.getSales(accessToken, { startDate: today, endDate: today }).catch(() => []),
          salesRepo.getSales(accessToken, { startDate: yesterday, endDate: yesterday }).catch(() => []),
          adminRepo.getMaintenances(accessToken).catch(() => []),
          inventoryRepo.getProducts(accessToken).catch(() => []),
        ]);

        const filterBranch = (sales: Sale[]) => {
          if (!activeBranchId || activeBranchId === '000000000000000000000000') return sales;
          return sales.filter(s => {
            const salebranchId = s.branch?.id;
            return !salebranchId || salebranchId === activeBranchId;
          });
        };

        setTodaySales(filterBranch(todayData));
        setYesterdaySales(filterBranch(ydData));

        const activeM = (maintenancesData || []).filter((m: AdminMaintenanceOrder) => {
          if (m.status === 'awaiting_appointment' || m.status === 'delivered') return false;
          if (activeBranchId && activeBranchId !== '000000000000000000000000') {
            const mBranchId = ('branch' in m && typeof (m as { branch?: unknown }).branch === 'string' ? String((m as { branch?: unknown }).branch) : '');
            if (mBranchId && mBranchId !== activeBranchId) return false;
          }
          return true;
        });
        setActiveWorkorders(activeM.length);

        const pendingAppts = (maintenancesData || []).filter((m: AdminMaintenanceOrder) => {
          if (m.status !== 'awaiting_appointment') return false;
          if (activeBranchId && activeBranchId !== '000000000000000000000000') {
            const mBranchId = ('branch' in m && typeof (m as { branch?: unknown }).branch === 'string' ? String((m as { branch?: unknown }).branch) : '');
            if (mBranchId && mBranchId !== activeBranchId) return false;
          }
          return true;
        });
        setPendingAppointments(pendingAppts.length);

        const lowStock = (productsData || []).filter((p: Product) => {
          if (activeBranchId && activeBranchId !== '000000000000000000000000') {
            const pBranchId = ('branch' in p && typeof (p as { branch?: unknown }).branch === 'string' ? String((p as { branch?: unknown }).branch) : '');
            if (pBranchId && pBranchId !== activeBranchId) return false;
          }
          const minS = p.minStock !== undefined && p.minStock !== null ? p.minStock : 5;
          return (p.stock || 0) <= minS;
        });
        setLowStockItems(lowStock.length);

      } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
        console.error(err);
      } finally {
        setDashLoading(false);
      }
    };
    loadDashboard();
    // eslint-disable-next-line
  }, [accessToken, activeBranchId]);

  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    adminRepo.getBranches().then((b: Branch[]) => setAllBranches(b || [])).catch(() => { });
  }, [isAdmin, accessToken]);

  const getDateRange = useCallback((period: SalesPeriod) => {
    const now = new Date();
    switch (period) {
      case 'today': {
        const t = toDateString(now);
        return { start: t, end: t };
      }
      case 'week': {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        return { start: toDateString(start), end: toDateString(now) };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: toDateString(start), end: toDateString(now) };
      }
      case 'custom':
        return { start: customStartDate, end: customEndDate };
    }
  }, [customStartDate, customEndDate]);

  const loadSalesData = useCallback(async () => {
    if (!accessToken) return;
    setSalesLoading(true);
    setSalesError(null);
    try {
      const { start, end } = getDateRange(salesPeriod);
      if (!start || !end) return;
      const data = await salesRepo.getSales(accessToken, {
        startDate: start,
        endDate: end,
        isCancelled: false,
      });

      const filtered = data.filter((s: Sale) => {
        if (salesBranchFilter === 'all' && isAdmin) return true;
        const branchId = salesBranchFilter === 'active' ? activeBranchId : salesBranchFilter;
        if (!branchId) return true;
        const sb = s.branch?.id;
        return !sb || sb === branchId;
      });

      setSalesData(filtered);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'UNAUTHORIZED') handleUnauthorized();
      else setSalesError(msg || 'Error al cargar ventas');
    } finally {
      setSalesLoading(false);
    }
  }, [accessToken, salesPeriod, salesBranchFilter, activeBranchId, isAdmin, getDateRange, handleUnauthorized]);

  useEffect(() => {
    if (pageTab === 'ventas') {
      loadSalesData();
    }
    // eslint-disable-next-line
  }, [pageTab, salesPeriod, salesBranchFilter]);

  // ── KPI calculations ─────────────────────────────────────────────────────
  const activeTodaySales = todaySales.filter(s => !s.isCancelled);
  const activeYesterdaySales = yesterdaySales.filter(s => !s.isCancelled);
  const todayTotal = activeTodaySales.reduce((acc, s) => acc + (s.total || 0), 0);
  const yesterdayTotal = activeYesterdaySales.reduce((acc, s) => acc + (s.total || 0), 0);
  const salesGrowth = yesterdayTotal > 0
    ? (((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1)
    : null;

  const salesTotal = salesData.reduce((acc, s) => acc + (s.total || 0), 0);
  const salesCount = salesData.length;
  const avgTicket = salesCount > 0 ? salesTotal / salesCount : 0;

  const cashSales = salesData.filter(s => s.paymentMethod === 'cash');
  const cardSales = salesData.filter(s => s.paymentMethod === 'card');
  const transferSales = salesData.filter(s => s.paymentMethod === 'transfer');

  const cashTotal = cashSales.reduce((acc, s) => acc + (s.total || 0), 0);
  const cardTotal = cardSales.reduce((acc, s) => acc + (s.total || 0), 0);
  const transferTotal = transferSales.reduce((acc, s) => acc + (s.total || 0), 0);

  const cashCount = cashSales.length;
  const cardCount = cardSales.length;
  const transferCount = transferSales.length;

  const topPayMethod = cashCount >= cardCount && cashCount >= transferCount ? 'Efectivo'
    : cardCount >= transferCount ? 'Tarjeta' : 'Transferencia';

  const displayedSalesTable = salesPaymentMethodFilter === 'all'
    ? salesData
    : salesData.filter(s => s.paymentMethod === salesPaymentMethodFilter);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const barChartData = last7Days.map(d => {
    const label = d.toLocaleDateString('es-MX', { weekday: 'short' });
    const ds = toDateString(d);
    const value = salesData
      .filter(s => s.createdAt?.startsWith(ds))
      .reduce((acc, s) => acc + (s.total || 0), 0);
    return { label, value };
  });

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });

  const lineChartData = last6Months.map(d => {
    const label = d.toLocaleDateString('es-MX', { month: 'short' });
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const value = salesData
      .filter(s => s.createdAt?.startsWith(monthStr))
      .reduce((acc, s) => acc + (s.total || 0), 0);
    return { label, value };
  });

  return (
    <PageLayout userName={user?.name || 'Admin'}>
        <Box as="main" className="flex-1 p-7 max-w-7xl w-full mx-auto">

          {/* Page header */}
          <Box className="mb-6">
            <Heading level={2} className="font-bold mb-1">
              Dashboard de Operaciones
            </Heading>
            <Text size="sm" color="muted">
              Resumen general del estado de la sucursal activa.
            </Text>
          </Box>

          {/* Tab bar — Ventas solo visible para admins */}
          <Flex gap="xs" className="bg-base-100 p-1 rounded-DEFAULT border border-base-300 mb-7 w-fit">
            {pageTab === 'dashboard' ? (
              <PrimaryButton size="sm" color="neutral" iconStart={<Icon name="LayoutDashboard" size="xs" />}>
                Dashboard
              </PrimaryButton>
            ) : (
              <TertiaryButton size="sm" color="neutral" onClick={() => setPageTab('dashboard')} iconStart={<Icon name="LayoutDashboard" size="xs" />}>
                Dashboard
              </TertiaryButton>
            )}

            {isAdmin && (
              pageTab === 'ventas' ? (
                <PrimaryButton size="sm" color="neutral" iconStart={<Icon name="TrendingUp" size="xs" />}>
                  Ventas
                </PrimaryButton>
              ) : (
                <TertiaryButton size="sm" color="neutral" onClick={() => setPageTab('ventas')} iconStart={<Icon name="TrendingUp" size="xs" />}>
                  Ventas
                </TertiaryButton>
              )
            )}
          </Flex>

          {/* ═══════ TAB: DASHBOARD ════════════════════════════════════════════ */}
          {pageTab === 'dashboard' && (
            <Stack spacing="lg">
              {/* KPIs Grid */}
              <Grid cols={4} gap="md">

                {/* Sales KPI */}
                <Box className="bg-base-100 p-5 rounded-DEFAULT border border-base-300 flex flex-col gap-3">
                  <Flex justify="between" align="center">
                    <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider">Ventas del Día</Text>
                    <Flex align="center" justify="center" className="w-8 h-8 rounded-DEFAULT bg-primary/10 text-primary">
                      <Icon name="DollarSign" size="sm" />
                    </Flex>
                  </Flex>
                  <Box>
                    {dashLoading ? (
                      <Box className="h-9 bg-base-300 rounded-DEFAULT animate-pulse" />
                    ) : (
                      <>
                        <Text weight="bold" className="text-2xl block">
                          ${todayTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Text>
                        <Flex align="center" gap="xs" className="mt-1">
                          <Icon name="ShoppingBag" size="xs" />
                          <Text size="xs" color="muted">{todaySales.length} {todaySales.length === 1 ? 'venta' : 'ventas'} hoy</Text>
                        </Flex>
                        {salesGrowth !== null && (
                          <Flex align="center" gap="xs" className="mt-1">
                            <Icon name={parseFloat(salesGrowth) >= 0 ? 'TrendingUp' : 'TrendingDown'} size="xs" color={parseFloat(salesGrowth) >= 0 ? '#16a34a' : '#dc2626'} />
                            <Text size="xs" color={parseFloat(salesGrowth) >= 0 ? 'success' : 'error'} weight="semibold">
                              {parseFloat(salesGrowth) >= 0 ? '+' : ''}{salesGrowth}% vs ayer
                            </Text>
                          </Flex>
                        )}
                      </>
                    )}
                  </Box>
                </Box>

                {/* Appointments KPI */}
                <Box className="bg-base-100 p-5 rounded-DEFAULT border border-base-300 flex flex-col gap-3">
                  <Flex justify="between" align="center">
                    <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider">Citas Pendientes</Text>
                    <Flex align="center" justify="center" className="w-8 h-8 rounded-DEFAULT bg-warning/10 text-warning">
                      <Icon name="Calendar" size="sm" />
                    </Flex>
                  </Flex>
                  <Box>
                    <Text weight="bold" className="text-2xl block">{pendingAppointments}</Text>
                    <Text size="xs" color="muted" className="mt-1">Requieren confirmación</Text>
                  </Box>
                </Box>

                {/* Work Orders KPI */}
                <Box className="bg-base-100 p-5 rounded-DEFAULT border border-base-300 flex flex-col gap-3">
                  <Flex justify="between" align="center">
                    <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider">Órdenes Activas</Text>
                    <Flex align="center" justify="center" className="w-8 h-8 rounded-DEFAULT bg-secondary/10 text-secondary">
                      <Icon name="Wrench" size="sm" />
                    </Flex>
                  </Flex>
                  <Box>
                    <Text weight="bold" className="text-2xl block">{activeWorkorders}</Text>
                    <Text size="xs" color="muted" className="mt-1">Vehículos en taller</Text>
                  </Box>
                </Box>

                {/* Low Stock KPI */}
                <Box className="bg-base-100 p-5 rounded-DEFAULT border border-base-300 flex flex-col gap-3">
                  <Flex justify="between" align="center">
                    <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider">Stock Bajo</Text>
                    <Flex align="center" justify="center" className="w-8 h-8 rounded-DEFAULT bg-error/10 text-error">
                      <Icon name="AlertTriangle" size="sm" />
                    </Flex>
                  </Flex>
                  <Box>
                    <Text weight="bold" className="text-2xl block">{lowStockItems}</Text>
                    <Text size="xs" color="muted" className="mt-1">Productos por reabastecer</Text>
                  </Box>
                </Box>
              </Grid>

              {/* Quick Actions */}
              <Box>
                <Heading level={4} className="font-bold mb-4">Accesos Rápidos</Heading>
                <Grid cols={4} gap="md">
                  <Box
                    onClick={() => navigate('/admin/pos')}
                    className="bg-base-100 p-6 rounded-DEFAULT border border-base-300 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors select-none"
                  >
                    <Flex align="center" justify="center" className="w-14 h-14 rounded-full bg-primary/10 text-primary">
                      <Icon name={MODULE_THEMES.pos.icon as 'ShoppingCart'} size="lg" />
                    </Flex>
                    <Text weight="semibold" className="text-sm">Nueva Venta (POS)</Text>
                  </Box>

                  <Box
                    onClick={() => navigate('/admin/citas')}
                    className="bg-base-100 p-6 rounded-DEFAULT border border-base-300 flex flex-col items-center gap-3 cursor-pointer hover:border-warning transition-colors select-none"
                  >
                    <Flex align="center" justify="center" className="w-14 h-14 rounded-full bg-warning/10 text-warning">
                      <Icon name={MODULE_THEMES.appointments.icon as 'Calendar'} size="lg" />
                    </Flex>
                    <Text weight="semibold" className="text-sm">Gestionar Citas</Text>
                  </Box>

                  <Box
                    onClick={() => navigate('/admin/mantenimiento')}
                    className="bg-base-100 p-6 rounded-DEFAULT border border-base-300 flex flex-col items-center gap-3 cursor-pointer hover:border-secondary transition-colors select-none"
                  >
                    <Flex align="center" justify="center" className="w-14 h-14 rounded-full bg-secondary/10 text-secondary">
                      <Icon name={MODULE_THEMES.workshop.icon as 'Wrench'} size="lg" />
                    </Flex>
                    <Text weight="semibold" className="text-sm">Taller / Órdenes</Text>
                  </Box>

                  <Box
                    onClick={() => navigate('/admin/inventario')}
                    className="bg-base-100 p-6 rounded-DEFAULT border border-base-300 flex flex-col items-center gap-3 cursor-pointer hover:border-success transition-colors select-none"
                  >
                    <Flex align="center" justify="center" className="w-14 h-14 rounded-full bg-success/10 text-success">
                      <Icon name={MODULE_THEMES.inventory.icon as 'Package'} size="lg" />
                    </Flex>
                    <Text weight="semibold" className="text-sm">Inventario</Text>
                  </Box>
                </Grid>
              </Box>

              {/* Today's sales list */}
              {!dashLoading && todaySales.length > 0 && (
                <Box className="bg-base-100 rounded-DEFAULT border border-base-300 overflow-hidden">
                  <Box className="p-4 border-b border-base-300">
                    <Flex justify="between" align="center">
                      <Heading level={5} className="font-bold">Ventas de Hoy</Heading>
                      {isAdmin && (
                        <TertiaryButton
                          size="xs"
                          color="primary"
                          onClick={() => setPageTab('ventas')}
                        >
                          Ver estadísticas completas →
                        </TertiaryButton>
                      )}
                    </Flex>
                  </Box>
                  <Box className="overflow-x-auto">
                    <Box as="table" className="table w-full border-collapse">
                      <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                        <Box as="tr">
                          <Box as="th" className="py-2.5 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Folio</Box>
                          <Box as="th" className="py-2.5 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Cliente</Box>
                          <Box as="th" className="py-2.5 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Método</Box>
                          <Box as="th" className="py-2.5 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Estado</Box>
                          <Box as="th" className="py-2.5 px-4 text-right text-xs font-semibold text-base-content/60 uppercase">Total</Box>
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {todaySales.slice(0, 10).map(s => (
                          <Box
                            as="tr"
                            key={s.id}
                            onClick={() => handleSelectSale(s)}
                            className="border-b border-base-200 hover:bg-base-200/40 cursor-pointer transition-colors"
                          >
                            <Box as="td" className="py-3 px-4 font-mono text-sm font-semibold text-warning">
                              {s.folio || s.id?.slice(-6) || '-'}
                            </Box>
                            <Box as="td" className="py-3 px-4 text-sm text-base-content/80">
                              {s.customer?.name || 'Cliente General'}
                            </Box>
                            <Box as="td" className="py-3 px-4">
                              <Badge
                                variant={s.paymentMethod === 'cash' ? 'success' : s.paymentMethod === 'card' ? 'info' : 'warning'}
                                size="sm"
                              >
                                {s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                              </Badge>
                            </Box>
                            <Box as="td" className="py-3 px-4 text-center">
                              <Badge variant={s.isCancelled ? 'error' : 'success'} size="sm">
                                {s.isCancelled ? 'Cancelada' : 'Completada'}
                              </Badge>
                            </Box>
                            <Box as="td" className={cn('py-3 px-4 text-sm font-bold text-right font-mono', s.isCancelled ? 'text-base-content/40 line-through' : '')}>
                              ${s.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Stack>
          )}

          {/* ═══════ TAB: VENTAS (Admin Only) ════════════════════════════════════ */}
          {isAdmin && pageTab === 'ventas' && (
            <Stack spacing="lg">

              {/* Filter bar */}
              <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                <Flex wrap="wrap" align="end" gap="md">

                  {/* Period buttons */}
                  <Box>
                    <Text size="xs" weight="bold" color="muted" className="uppercase mb-1 block">Período</Text>
                    <Flex gap="xs">
                      {(['today', 'week', 'month', 'custom'] as SalesPeriod[]).map(p => (
                        salesPeriod === p ? (
                          <PrimaryButton key={p} size="sm" color="neutral">
                            {p === 'today' ? 'Hoy' : p === 'week' ? '7 días' : p === 'month' ? 'Este mes' : 'Personalizado'}
                          </PrimaryButton>
                        ) : (
                          <SecondaryButton key={p} size="sm" onClick={() => setSalesPeriod(p)}>
                            {p === 'today' ? 'Hoy' : p === 'week' ? '7 días' : p === 'month' ? 'Este mes' : 'Personalizado'}
                          </SecondaryButton>
                        )
                      ))}
                    </Flex>
                  </Box>

                  {/* Branch selector (admin only) */}
                  {isAdmin && allBranches.length > 0 && (
                    <Box>
                      <Text size="xs" weight="bold" color="muted" className="uppercase mb-1 block">Sucursal</Text>
                      <Select
                        size="sm"
                        fullWidth={false}
                        className="min-w-[160px]"
                        value={salesBranchFilter}
                        onChange={e => setSalesBranchFilter(e.target.value)}
                        options={[
                          { value: 'active', label: 'Sucursal Activa' },
                          { value: 'all', label: 'Todas las Sucursales' },
                          ...allBranches.map(b => ({ value: b.id, label: b.name })),
                        ]}
                      />
                    </Box>
                  )}

                  {/* Payment method selector */}
                  <Box>
                    <Text size="xs" weight="bold" color="muted" className="uppercase mb-1 block">Método de Pago</Text>
                    <Select
                      size="sm"
                      fullWidth={false}
                      className="min-w-[150px]"
                      value={salesPaymentMethodFilter}
                      onChange={e => setSalesPaymentMethodFilter(e.target.value as 'all' | 'cash' | 'card' | 'transfer')}
                      options={[
                        { value: 'all', label: 'Todos los métodos' },
                        { value: 'cash', label: 'Efectivo' },
                        { value: 'card', label: 'Tarjeta' },
                        { value: 'transfer', label: 'Transferencia' },
                      ]}
                    />
                  </Box>

                  {/* Custom date range — Floating Popover Picker */}
                  {salesPeriod === 'custom' && (
                    <Box>
                      <Text size="xs" weight="bold" color="muted" className="uppercase mb-1 block">Rango de Fechas</Text>
                      <Flex gap="sm" align="center">
                        <DateRangePicker
                          startDate={customStartDate}
                          endDate={customEndDate}
                          onChangeStart={setCustomStartDate}
                          onChangeEnd={setCustomEndDate}
                        />
                        {customStartDate && customEndDate && (
                          <PrimaryButton size="sm" onClick={loadSalesData}>
                            Filtrar
                          </PrimaryButton>
                        )}
                      </Flex>
                    </Box>
                  )}

                  <SecondaryButton onClick={loadSalesData} size="sm" className="ml-auto" iconStart={<Icon name="RefreshCw" size="xs" />}>
                    Actualizar
                  </SecondaryButton>
                </Flex>
              </Box>

              {salesError && (
                <Box className="p-3 bg-error/10 border border-error/20 rounded-DEFAULT">
                  <Text size="sm" color="error">{salesError}</Text>
                </Box>
              )}

              {/* General KPI cards */}
              <Grid cols={4} gap="md">
                {[
                  { label: 'Ingresos Totales', value: `$${salesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'DollarSign', badgeColor: 'primary' as const },
                  { label: 'Número de Ventas', value: String(salesCount), icon: 'ShoppingBag', badgeColor: 'success' as const },
                  { label: 'Ticket Promedio', value: `$${avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'Receipt', badgeColor: 'warning' as const },
                  { label: 'Método Principal', value: topPayMethod, icon: 'CreditCard', badgeColor: 'secondary' as const },
                ].map(kpi => (
                  <Box key={kpi.label} className="bg-base-100 p-5 rounded-DEFAULT border border-base-300">
                    <Flex justify="between" align="center" className="mb-2.5">
                      <Text size="xs" weight="bold" color="muted" className="uppercase">{kpi.label}</Text>
                      <Flex align="center" justify="center" className={cn(
                        'w-8 h-8 rounded-DEFAULT',
                        kpi.badgeColor === 'primary' && 'bg-primary/10 text-primary',
                        kpi.badgeColor === 'success' && 'bg-success/10 text-success',
                        kpi.badgeColor === 'warning' && 'bg-warning/10 text-warning',
                        kpi.badgeColor === 'secondary' && 'bg-secondary/10 text-secondary'
                      )}>
                        <Icon name={kpi.icon as 'Wrench'} size="sm" />
                      </Flex>
                    </Flex>
                    {salesLoading ? (
                      <Box className="h-7 bg-base-300 rounded-DEFAULT animate-pulse" />
                    ) : (
                      <Text weight="bold" className="text-2xl font-mono block">{kpi.value}</Text>
                    )}
                  </Box>
                ))}
              </Grid>

              {/* Payment Method Totals Cards */}
              <Grid cols={3} gap="md">
                {[
                  {
                    title: 'Total Efectivo',
                    amount: cashTotal,
                    count: cashCount,
                    icon: 'Banknote',
                    variant: 'success' as const,
                  },
                  {
                    title: 'Total Tarjeta',
                    amount: cardTotal,
                    count: cardCount,
                    icon: 'CreditCard',
                    variant: 'info' as const,
                  },
                  {
                    title: 'Total Transferencia',
                    amount: transferTotal,
                    count: transferCount,
                    icon: 'ArrowRightLeft',
                    variant: 'warning' as const,
                  },
                ].map(pm => (
                  <Box
                    key={pm.title}
                    className="bg-base-100 p-5 rounded-DEFAULT border border-base-300"
                  >
                    <Flex justify="between" align="center" className="mb-2">
                      <Text size="xs" weight="bold" color={pm.variant} className="uppercase tracking-wider">
                        {pm.title}
                      </Text>
                      <Flex align="center" justify="center" className={cn(
                        'w-8 h-8 rounded-DEFAULT',
                        pm.variant === 'success' && 'bg-success/10 text-success',
                        pm.variant === 'info' && 'bg-info/10 text-info',
                        pm.variant === 'warning' && 'bg-warning/10 text-warning'
                      )}>
                        <Icon name={pm.icon as 'DollarSign'} size="sm" />
                      </Flex>
                    </Flex>
                    {salesLoading ? (
                      <Box className="h-7 bg-base-300 rounded-DEFAULT animate-pulse" />
                    ) : (
                      <>
                        <Text weight="bold" className="text-2xl font-mono block">
                          ${pm.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text size="xs" color="muted" className="mt-1 block">
                          {pm.count} {pm.count === 1 ? 'venta' : 'ventas'} ({salesTotal > 0 ? ((pm.amount / salesTotal) * 100).toFixed(1) : '0'}% del total)
                        </Text>
                      </>
                    )}
                  </Box>
                ))}
              </Grid>

              {/* Payment method breakdown */}
              <Grid cols={2} gap="md">
                <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                  <Heading level={5} className="font-bold mb-4">Métodos de Pago</Heading>
                  {salesLoading ? (
                    <Box className="h-20 bg-base-300 rounded-DEFAULT animate-pulse" />
                  ) : (
                    <Stack spacing="sm">
                      {[
                        { label: 'Efectivo', count: cashCount, color: '#16a34a' },
                        { label: 'Tarjeta', count: cardCount, color: '#2563eb' },
                        { label: 'Transferencia', count: transferCount, color: '#854d0e' },
                      ].map(pm => (
                        <Flex key={pm.label} align="center" gap="sm">
                          <Text size="sm" className="w-28 text-base-content/80">{pm.label}</Text>
                          <Box className="flex-1 bg-base-200 rounded-DEFAULT h-2 overflow-hidden">
                            <Box
                              className="h-full rounded-DEFAULT transition-all duration-300"
                              style={{
                                width: salesCount > 0 ? `${(pm.count / salesCount) * 100}%` : '0%',
                                background: pm.color,
                              }}
                            />
                          </Box>
                          <Text size="sm" weight="bold" className="w-8 text-right font-mono">{pm.count}</Text>
                        </Flex>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                  <BarChart
                    data={barChartData}
                    label="Ingresos por Día (últimos 7 días)"
                  />
                </Box>
              </Grid>

              {/* Monthly trend */}
              <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                <LineChart
                  data={lineChartData}
                  label="Tendencia de Ingresos Mensuales (últimos 6 meses)"
                />
              </Box>

              {/* Recent sales table */}
              <Box className="bg-base-100 rounded-DEFAULT border border-base-300 overflow-hidden">
                <Box className="p-4 border-b border-base-300">
                  <Flex justify="between" align="center">
                    <Heading level={5} className="font-bold">
                      Ventas del Período ({displayedSalesTable.length})
                    </Heading>
                    {salesPaymentMethodFilter !== 'all' && (
                      <Badge variant="neutral" size="sm">
                        Filtrado por: {salesPaymentMethodFilter === 'cash' ? 'Efectivo' : salesPaymentMethodFilter === 'card' ? 'Tarjeta' : 'Transferencia'}
                      </Badge>
                    )}
                  </Flex>
                </Box>
                {salesLoading ? (
                  <Box className="py-10 text-center">
                    <Text color="muted">Cargando ventas...</Text>
                  </Box>
                ) : displayedSalesTable.length === 0 ? (
                  <Box className="py-10 text-center">
                    <Text color="muted" size="sm">
                      No se encontraron ventas para el período, sucursal y método de pago seleccionados.
                    </Text>
                  </Box>
                ) : (
                  <Box className="overflow-x-auto">
                    <Box as="table" className="table w-full border-collapse">
                      <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                        <Box as="tr">
                          <Box as="th" className="py-2.5 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Folio</Box>
                          <Box as="th" className="py-2.5 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Fecha</Box>
                          <Box as="th" className="py-2.5 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Cliente</Box>
                          <Box as="th" className="py-2.5 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Método</Box>
                          <Box as="th" className="py-2.5 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Estatus</Box>
                          <Box as="th" className="py-2.5 px-4 text-right text-xs font-semibold text-base-content/60 uppercase">Total</Box>
                        </Box>
                      </Box>
                      <Box as="tbody">
                        {displayedSalesTable.slice(0, 50).map(s => (
                          <Box
                            as="tr"
                            key={s.id}
                            onClick={() => handleSelectSale(s)}
                            className="border-b border-base-200 hover:bg-base-200/40 cursor-pointer transition-colors"
                          >
                            <Box as="td" className="py-3 px-4 font-mono text-sm font-semibold text-warning">
                              {s.folio || s.id.slice(-8)}
                            </Box>
                            <Box as="td" className="py-3 px-4 text-sm text-base-content/70">
                              {new Date(s.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Box>
                            <Box as="td" className="py-3 px-4 text-sm text-base-content/80">
                              {s.customer?.name || 'Cliente General'}
                            </Box>
                            <Box as="td" className="py-3 px-4">
                              <Badge
                                variant={s.paymentMethod === 'cash' ? 'success' : s.paymentMethod === 'card' ? 'info' : 'warning'}
                                size="sm"
                              >
                                {s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                              </Badge>
                            </Box>
                            <Box as="td" className="py-3 px-4 text-center">
                              <Badge variant={s.isCancelled ? 'error' : 'success'} size="sm">
                                {s.isCancelled ? 'Cancelada' : 'Completada'}
                              </Badge>
                            </Box>
                            <Box as="td" className="py-3 px-4 text-sm font-bold text-right font-mono">
                              ${s.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </Stack>
          )}

        </Box>

      {/* Sale Detail Drawer Sidepanel */}
      <SaleDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedSale(null); }}
        sale={selectedSale}
        branchName={
          selectedSale?.branch?.name ||
          allBranches.find(b => b.id === (typeof selectedSale?.branch === 'string' ? selectedSale?.branch : selectedSale?.branch?.id))?.name ||
          allBranches.find(b => b.id === activeBranchId)?.name ||
          'Sucursal Principal'
        }
        onCancelSale={handleCancelSale}
        onPrintTicket={(s) => {
          const branchName =
            s?.branch?.name ||
            allBranches.find(b => b.id === (typeof s?.branch === 'string' ? s?.branch : s?.branch?.id))?.name ||
            allBranches.find(b => b.id === activeBranchId)?.name ||
            'Sucursal Principal';
          const sellerName = s?.seller?.name || user?.name || 'Cajero';
          thermalPrintService.print({ sale: s, branchName, sellerName, settings: printerSettings });
        }}
      />
    </PageLayout>
  );
};

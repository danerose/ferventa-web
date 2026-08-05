import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, SaleDetailDrawer, TicketReceipt } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { APISalesRepository } from '../../data/repositories/APISalesRepository';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import { APIInventoryRepository } from '../../data/repositories/APIInventoryRepository';
import type { Sale } from '../../domain/entities/SalesEntities';
import type { Branch } from '../../domain/entities/AdminEntities';

const salesRepo = new APISalesRepository();
const adminRepo = new APIAdminRepository();
const inventoryRepo = new APIInventoryRepository();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  // Use local date parts to avoid UTC offset issues (e.g. 22:00 UTC-5 is next day in UTC)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isAdminUser(user: any): boolean {
  if (!user) return false;
  const roleVal = user.role;
  if (typeof roleVal === 'string') {
    const r = roleVal.toLowerCase();
    return r === 'admin' || r === 'administrator';
  }
  if (roleVal && typeof roleVal === 'object' && roleVal.name) {
    const r = String(roleVal.name).toLowerCase();
    return r === 'admin' || r === 'administrator';
  }
  return false;
}

// ─── Simple DateRangePicker (calendar for Ventas tab) ────────────────────────

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
  const [isOpen, setIsOpen] = React.useState(false);
  const [month, setMonth] = React.useState(today.getMonth());
  const [year, setYear] = React.useState(today.getFullYear());
  const [hovered, setHovered] = React.useState<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);

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
    if (startDate && !endDate) return `${startDate}  →  Selecciona fin`;
    return `${startDate}  —  ${endDate}`;
  };

  // Close dropdown on outside click
  React.useEffect(() => {
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
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'white',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          fontSize: '13px',
          color: startDate ? '#0f172a' : '#64748b',
          fontWeight: startDate ? '600' : '400',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.15s',
        }}
      >
        <Icon name="CalendarRange" size="xs" style={{ color: '#64748b' }} />
        <span>{label()}</span>
        <Icon name="ChevronDown" size="xs" style={{ color: '#94a3b8', marginLeft: '4px' }} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 100,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            minWidth: '290px',
          }}
        >
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button type="button" onClick={prevMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', color: '#334155', fontSize: '14px' }}>‹</button>
            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{MONTH_NAMES_ES[month]} {year}</span>
            <button type="button" onClick={nextMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', color: '#334155', fontSize: '14px' }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
            {DAY_LABELS_ES.map(l => (
              <span key={l} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', padding: '2px 0' }}>{l}</span>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {days.map((d, i) => {
              if (!d.cur) return <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#e2e8f0' }}>{d.num}</div>;
              const isStart = d.dateStr === startDate;
              const isEnd = d.dateStr === endDate;
              const inRange = isInRange(d.dateStr);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(d.dateStr)}
                  onMouseEnter={() => setHovered(d.dateStr)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: isStart || isEnd ? '700' : '500',
                    border: 'none', cursor: 'pointer', borderRadius: '6px',
                    background: isStart || isEnd ? '#091426' : inRange ? '#dbeafe' : 'transparent',
                    color: isStart || isEnd ? 'white' : inRange ? '#1d4ed8' : '#334155',
                    transition: 'background 0.1s',
                  }}
                >
                  {d.num}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => { onChangeStart(''); onChangeEnd(''); }}
              style={{ flex: 1, padding: '6px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#64748b', cursor: 'pointer' }}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ flex: 1, padding: '6px', background: '#091426', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function BarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: '100%' }}>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>{label}</p>
      <svg viewBox={`0 0 400 160`} style={{ width: '100%', height: '160px' }}>
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
    </div>
  );
}

// Mini line chart using SVG
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
    <div style={{ width: '100%' }}>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '140px' }}>
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
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type PageTab = 'dashboard' | 'ventas';
type SalesPeriod = 'today' | 'week' | 'month' | 'custom';

export const OperationsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, activeBranchId, clearAuth } = useAuthStore();
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

  // ── Sidepanel Drawer & Ticket state ──────────────────────────────────────
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [printSale, setPrintSale] = useState<Sale | null>(null);

  const handleSelectSale = useCallback(async (sale: Sale) => {
    setSelectedSale(sale);
    setIsDrawerOpen(true);

    const saleId = sale.id || (sale as any)._id;
    if (!accessToken || !saleId) return;

    try {
      const fullSale = await salesRepo.getSale(accessToken, saleId);
      if (fullSale) {
        setSelectedSale(fullSale);
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
    }
  }, [accessToken, handleUnauthorized]);

  const handleCancelSale = async (saleId: string, reason: string) => {
    if (!accessToken) return;
    await salesRepo.cancelSale(accessToken, saleId, reason);
    // Refresh sales lists
    setSalesData(prev => prev.map(s => (s.id === saleId || (s as any)._id === saleId) ? { ...s, isCancelled: true, cancelReason: reason } : s));
    setTodaySales(prev => prev.map(s => (s.id === saleId || (s as any)._id === saleId) ? { ...s, isCancelled: true, cancelReason: reason } : s));
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

        // Filter by active branch if branchId is set
        const filterBranch = (sales: Sale[]) => {
          if (!activeBranchId || activeBranchId === '000000000000000000000000') return sales;
          return sales.filter(s => {
            const salebranchId = (s.branch as any)?._id || (s.branch as any)?.id || s.branch?.id;
            return !salebranchId || salebranchId === activeBranchId;
          });
        };

        setTodaySales(filterBranch(todayData));
        setYesterdaySales(filterBranch(ydData));

        // Active work orders (maintenances not awaiting_appointment and not delivered)
        const activeM = (maintenancesData || []).filter((m: any) => {
          if (m.status === 'awaiting_appointment' || m.status === 'delivered') return false;
          if (activeBranchId && activeBranchId !== '000000000000000000000000') {
            const mBranchId = (m.branch as any)?._id || (m.branch as any)?.id || (typeof m.branch === 'string' ? m.branch : '');
            if (mBranchId && mBranchId !== activeBranchId) return false;
          }
          return true;
        });
        setActiveWorkorders(activeM.length);

        // Pending appointments (maintenances awaiting_appointment)
        const pendingAppts = (maintenancesData || []).filter((m: any) => {
          if (m.status !== 'awaiting_appointment') return false;
          if (activeBranchId && activeBranchId !== '000000000000000000000000') {
            const mBranchId = (m.branch as any)?._id || (m.branch as any)?.id || (typeof m.branch === 'string' ? m.branch : '');
            if (mBranchId && mBranchId !== activeBranchId) return false;
          }
          return true;
        });
        setPendingAppointments(pendingAppts.length);

        // Low stock items count
        const lowStock = (productsData || []).filter((p: any) => {
          if (activeBranchId && activeBranchId !== '000000000000000000000000') {
            const pBranchId = (p.branch as any)?._id || (p.branch as any)?.id || (typeof p.branch === 'string' ? p.branch : '');
            if (pBranchId && pBranchId !== activeBranchId) return false;
          }
          const minS = p.minStock !== undefined && p.minStock !== null ? p.minStock : 5;
          return (p.stock || 0) <= minS;
        });
        setLowStockItems(lowStock.length);

      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') handleUnauthorized();
        console.error(err);
      } finally {
        setDashLoading(false);
      }
    };
    loadDashboard();
    // eslint-disable-next-line
  }, [accessToken, activeBranchId]);

  // ── Load branches for the Sales tab filter ───────────────────────────────
  useEffect(() => {
    if (!isAdmin || !accessToken) return;
    adminRepo.getBranches().then(b => setAllBranches(b || [])).catch(() => { });
  }, [isAdmin, accessToken]);

  // ── Helper: get date range for the selected period ───────────────────────
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

  // ── Load sales data for the Sales tab ───────────────────────────────────
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

      // Filter by branch (unless "all" is selected or non-admin)
      const filtered = data.filter(s => {
        if (salesBranchFilter === 'all' && isAdmin) return true;
        const branchId = salesBranchFilter === 'active' ? activeBranchId : salesBranchFilter;
        if (!branchId) return true;
        const sb = (s.branch as any)?._id || (s.branch as any)?.id || s.branch?.id;
        return !sb || sb === branchId;
      });

      setSalesData(filtered);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      else setSalesError(err.message || 'Error al cargar ventas');
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

  // ── Chart data: daily sales for last 7 days ─────────────────────────────
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

  // ── Chart data: monthly totals (last 6 months) ──────────────────────────
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

  // ─── Render ──────────────────────────────────────────────────────────────

  const tabBtnStyle = (active: boolean) => ({
    padding: '8px 18px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: active ? '#091426' : 'transparent',
    color: active ? 'white' : '#64748b',
  });

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>

          {/* Page header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#091426', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Dashboard de Operaciones
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Resumen general del estado de la sucursal activa.
            </p>
          </div>

          {/* Tab bar — Ventas solo visible para admins */}
          <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '28px', width: 'fit-content' }}>
            <button style={tabBtnStyle(pageTab === 'dashboard')} onClick={() => setPageTab('dashboard')}>
              <Icon name="LayoutDashboard" size="xs" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
              Dashboard
            </button>
            {isAdmin && (
              <button style={tabBtnStyle(pageTab === 'ventas')} onClick={() => setPageTab('ventas')}>
                <Icon name="TrendingUp" size="xs" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
                Ventas
              </button>
            )}
          </div>

          {/* ═══════ TAB: DASHBOARD ════════════════════════════════════════════ */}
          {pageTab === 'dashboard' && (
            <>
              {/* KPIs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>

                {/* Sales KPI */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ventas del Día</span>
                    <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px' }}>
                      <Icon name="DollarSign" size="sm" className="text-primary" />
                    </div>
                  </div>
                  <div>
                    {dashLoading ? (
                      <div style={{ height: '36px', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                    ) : (
                      <>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
                          ${todayTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '13px', color: todaySales.length > 0 ? '#64748b' : '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon name="ShoppingBag" size="xs" />
                          <span>{todaySales.length} {todaySales.length === 1 ? 'venta' : 'ventas'} hoy</span>
                        </div>
                        {salesGrowth !== null && (
                          <div style={{ fontSize: '12px', color: parseFloat(salesGrowth) >= 0 ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <Icon name={parseFloat(salesGrowth) >= 0 ? 'TrendingUp' : 'TrendingDown'} size="xs" />
                            <span>{parseFloat(salesGrowth) >= 0 ? '+' : ''}{salesGrowth}% vs ayer</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Appointments KPI */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citas Pendientes</span>
                    <div style={{ background: '#fffbeb', padding: '8px', borderRadius: '8px' }}>
                      <Icon name="Calendar" size="sm" className="text-warning" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{pendingAppointments}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Requieren confirmación</div>
                  </div>
                </div>

                {/* Work Orders KPI */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Órdenes Activas</span>
                    <div style={{ background: '#f5f3ff', padding: '8px', borderRadius: '8px' }}>
                      <Icon name="Wrench" size="sm" className="text-[#8b5cf6]" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{activeWorkorders}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Vehículos en taller</div>
                  </div>
                </div>

                {/* Low Stock KPI */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Bajo</span>
                    <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '8px' }}>
                      <Icon name="AlertTriangle" size="sm" className="text-error" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{lowStockItems}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Productos por reabastecer</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' }}>Accesos Rápidos</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

                  <button
                    onClick={() => navigate('/admin/pos')}
                    style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '50%', color: '#2563eb' }}>
                      <Icon name="ShoppingCart" size="lg" />
                    </div>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>Nueva Venta (POS)</span>
                  </button>

                  <button
                    onClick={() => navigate('/admin/citas')}
                    style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#d97706'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '50%', color: '#d97706' }}>
                      <Icon name="CalendarPlus" size="lg" />
                    </div>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>Gestionar Citas</span>
                  </button>

                  <button
                    onClick={() => navigate('/admin/mantenimiento')}
                    style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ background: '#f5f3ff', padding: '16px', borderRadius: '50%', color: '#8b5cf6' }}>
                      <Icon name="Wrench" size="lg" />
                    </div>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>Taller / Órdenes</span>
                  </button>

                  <button
                    onClick={() => navigate('/admin/inventario')}
                    style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#16a34a'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '50%', color: '#16a34a' }}>
                      <Icon name="Package" size="lg" />
                    </div>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>Inventario</span>
                  </button>
                </div>
              </div>

              {/* Today's sales list */}
              {!dashLoading && todaySales.length > 0 && (
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Ventas de Hoy</h3>
                    {isAdmin && (
                      <button
                        onClick={() => setPageTab('ventas')}
                        style={{ fontSize: '13px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Ver estadísticas completas →
                      </button>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Folio</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Cliente</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Método</th>
                        <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySales.slice(0, 10).map(s => (
                        <tr
                          key={s.id || (s as any)._id}
                          onClick={() => handleSelectSale(s)}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                          className="hover:bg-slate-50"
                        >
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#855300', fontWeight: '600', fontFamily: 'monospace' }}>
                            {s.folio || s.id?.slice(-6) || '-'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                            {(s.customer as any)?.name || 'Cliente General'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontWeight: '600',
                              background: s.paymentMethod === 'cash' ? '#f0fdf4' : s.paymentMethod === 'card' ? '#eff6ff' : '#fef9c3',
                              color: s.paymentMethod === 'cash' ? '#16a34a' : s.paymentMethod === 'card' ? '#2563eb' : '#854d0e',
                            }}>
                              {s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                              background: s.isCancelled ? '#fef2f2' : '#f0fdf4',
                              color: s.isCancelled ? '#dc2626' : '#16a34a',
                              border: `1px solid ${s.isCancelled ? '#fecaca' : '#bbf7d0'}`,
                              display: 'inline-block',
                            }}>
                              {s.isCancelled ? 'Cancelada' : 'Completada'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '700', color: s.isCancelled ? '#94a3b8' : '#0f172a', textAlign: 'right', textDecoration: s.isCancelled ? 'line-through' : 'none' }}>
                            ${s.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ═══════ TAB: VENTAS (Admin Only) ════════════════════════════════════ */}
          {isAdmin && pageTab === 'ventas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Filter bar */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px' }}>

                {/* Period */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Período</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['today', 'week', 'month', 'custom'] as SalesPeriod[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setSalesPeriod(p)}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                          border: '1px solid', cursor: 'pointer',
                          background: salesPeriod === p ? '#091426' : 'white',
                          color: salesPeriod === p ? 'white' : '#64748b',
                          borderColor: salesPeriod === p ? '#091426' : '#e2e8f0',
                        }}
                      >
                        {p === 'today' ? 'Hoy' : p === 'week' ? '7 días' : p === 'month' ? 'Este mes' : 'Personalizado'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Branch selector (admin only) */}
                {isAdmin && allBranches.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Sucursal</label>
                    <select
                      value={salesBranchFilter}
                      onChange={e => setSalesBranchFilter(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: 'white', minWidth: '160px' }}
                    >
                      <option value="active">Sucursal Activa</option>
                      <option value="all">Todas las Sucursales</option>
                      {allBranches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Payment method selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Método de Pago</label>
                  <select
                    value={salesPaymentMethodFilter}
                    onChange={e => setSalesPaymentMethodFilter(e.target.value as any)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', background: 'white', minWidth: '150px' }}
                  >
                    <option value="all">Todos los métodos</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>

                {/* Custom date range — Floating Popover Picker */}
                {salesPeriod === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Rango de Fechas</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <DateRangePicker
                        startDate={customStartDate}
                        endDate={customEndDate}
                        onChangeStart={setCustomStartDate}
                        onChangeEnd={setCustomEndDate}
                      />
                      {customStartDate && customEndDate && (
                        <button
                          type="button"
                          onClick={loadSalesData}
                          style={{ padding: '8px 16px', background: '#091426', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', height: '36px' }}
                        >
                          Filtrar
                        </button>
                      )}
                    </div>
                  </div>
                )}




                <button
                  onClick={loadSalesData}
                  style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginLeft: 'auto' }}
                >
                  <Icon name="RefreshCw" size="xs" />
                  Actualizar
                </button>
              </div>

              {salesError && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                  {salesError}
                </div>
              )}

              {/* General KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Ingresos Totales', value: `$${salesTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'DollarSign', bg: '#eff6ff', color: '#2563eb' },
                  { label: 'Número de Ventas', value: String(salesCount), icon: 'ShoppingBag', bg: '#f0fdf4', color: '#16a34a' },
                  { label: 'Ticket Promedio', value: `$${avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'Receipt', bg: '#fef9c3', color: '#854d0e' },
                  { label: 'Método Principal', value: topPayMethod, icon: 'CreditCard', bg: '#f5f3ff', color: '#7c3aed' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>{kpi.label}</span>
                      <div style={{ background: kpi.bg, padding: '8px', borderRadius: '8px', color: kpi.color }}>
                        <Icon name={kpi.icon as 'Wrench'} size="sm" />
                      </div>
                    </div>
                    {salesLoading ? (
                      <div style={{ height: '28px', background: '#f1f5f9', borderRadius: '4px' }} />
                    ) : (
                      <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{kpi.value}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment Method Totals Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  {
                    title: 'Total Efectivo',
                    amount: cashTotal,
                    count: cashCount,
                    icon: 'Banknote',
                    color: '#16a34a',
                    bg: '#f0fdf4',
                    borderColor: '#bbf7d0'
                  },
                  {
                    title: 'Total Tarjeta',
                    amount: cardTotal,
                    count: cardCount,
                    icon: 'CreditCard',
                    color: '#2563eb',
                    bg: '#eff6ff',
                    borderColor: '#bfdbfe'
                  },
                  {
                    title: 'Total Transferencia',
                    amount: transferTotal,
                    count: transferCount,
                    icon: 'ArrowRightLeft',
                    color: '#854d0e',
                    bg: '#fef9c3',
                    borderColor: '#fef08a'
                  },
                ].map(pm => (
                  <div
                    key={pm.title}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      border: `1px solid ${pm.borderColor}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: pm.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {pm.title}
                      </span>
                      <div style={{ background: pm.bg, padding: '8px', borderRadius: '8px', color: pm.color }}>
                        <Icon name={pm.icon as any} size="sm" />
                      </div>
                    </div>
                    {salesLoading ? (
                      <div style={{ height: '28px', background: '#f1f5f9', borderRadius: '4px' }} />
                    ) : (
                      <>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
                          ${pm.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
                          {pm.count} {pm.count === 1 ? 'venta' : 'ventas'} ({salesTotal > 0 ? ((pm.amount / salesTotal) * 100).toFixed(1) : '0'}% del total)
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment method breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Métodos de Pago</h3>
                  {salesLoading ? (
                    <div style={{ height: '80px', background: '#f1f5f9', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { label: 'Efectivo', count: cashCount, color: '#16a34a', bg: '#dcfce7' },
                        { label: 'Tarjeta', count: cardCount, color: '#2563eb', bg: '#dbeafe' },
                        { label: 'Transferencia', count: transferCount, color: '#854d0e', bg: '#fef9c3' },
                      ].map(pm => (
                        <div key={pm.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', color: '#334155', width: '110px' }}>{pm.label}</span>
                          <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '4px',
                              width: salesCount > 0 ? `${(pm.count / salesCount) * 100}%` : '0%',
                              background: pm.color, transition: 'width 0.4s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', width: '30px', textAlign: 'right' }}>{pm.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <BarChart
                    data={barChartData}
                    label="Ingresos por Día (últimos 7 días)"
                  />
                </div>
              </div>

              {/* Monthly trend */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <LineChart
                  data={lineChartData}
                  label="Tendencia de Ingresos Mensuales (últimos 6 meses)"
                />
              </div>

              {/* Recent sales table */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Ventas del Período ({displayedSalesTable.length})
                  </h3>
                  {salesPaymentMethodFilter !== 'all' && (
                    <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
                      Filtrado por: {salesPaymentMethodFilter === 'cash' ? 'Efectivo' : salesPaymentMethodFilter === 'card' ? 'Tarjeta' : 'Transferencia'}
                    </span>
                  )}
                </div>
                {salesLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando ventas...</div>
                ) : displayedSalesTable.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    No se encontraron ventas para el período, sucursal y método de pago seleccionados.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Folio</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Cliente</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Método</th>
                        <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Estatus</th>
                        <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSalesTable.slice(0, 50).map(s => (
                        <tr
                          key={s.id || (s as any)._id}
                          onClick={() => handleSelectSale(s)}
                          style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                          className="hover:bg-slate-50"
                        >
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#855300', fontWeight: '600', fontFamily: 'monospace' }}>
                            {s.folio || (s as any)._id?.slice(-8) || '-'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                            {new Date(s.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                            {(s.customer as any)?.name || 'Cliente General'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontWeight: '600',
                              background: s.paymentMethod === 'cash' ? '#f0fdf4' : s.paymentMethod === 'card' ? '#eff6ff' : '#fef9c3',
                              color: s.paymentMethod === 'cash' ? '#16a34a' : s.paymentMethod === 'card' ? '#2563eb' : '#854d0e',
                            }}>
                              {s.paymentMethod === 'cash' ? 'Efectivo' : s.paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                              background: s.isCancelled ? '#fef2f2' : '#f0fdf4',
                              color: s.isCancelled ? '#dc2626' : '#16a34a',
                              border: `1px solid ${s.isCancelled ? '#fecaca' : '#bbf7d0'}`,
                            }}>
                              {s.isCancelled ? 'Cancelada' : 'Completada'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>
                            ${s.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Sale Detail Drawer Sidepanel */}
      <SaleDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedSale(null); }}
        sale={selectedSale}
        onCancelSale={handleCancelSale}
        onPrintTicket={(s) => {
          setPrintSale(s);
          document.body.classList.remove('print-doc-mode');
          document.body.classList.add('print-ticket-mode');
          setTimeout(() => window.print(), 150);
        }}
      />

      {/* Printable Ticket Receipt */}
      <TicketReceipt sale={printSale || selectedSale} />
    </div>
  );
};

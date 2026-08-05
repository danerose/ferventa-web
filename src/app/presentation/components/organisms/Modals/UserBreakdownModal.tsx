import React, { useState, useEffect } from 'react';
import { Icon, PrimaryButton, SecondaryButton } from '@/app/presentation/components';
import { APIAttendanceRepository } from '@/app/data/repositories/APIAttendanceRepository';
import type { UserAttendanceBreakdown } from '@/app/domain/entities/AttendanceEntities';

const attendanceRepo = new APIAttendanceRepository();

interface UserBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string;
}

export const UserBreakdownModal: React.FC<UserBreakdownModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const [breakdown, setBreakdown] = useState<UserAttendanceBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Period filter state
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const toLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length < 3) return dateStr;
      const [y, m, d] = parts;
      const dateObj = new Date(y, m - 1, d);
      const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'long' });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const monthName = dateObj.toLocaleDateString('es-MX', { month: 'short' });
      return `${capitalizedDay}, ${d} de ${monthName} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const loadBreakdown = async (overrideStart?: string, overrideEnd?: string) => {
    if (!userId) return;
    setIsLoading(true);
    setErrorMsg(null);
    const s = overrideStart !== undefined ? overrideStart : startDate;
    const e = overrideEnd !== undefined ? overrideEnd : endDate;
    try {
      const data = await attendanceRepo.getUserBreakdown(userId, s || undefined, e || undefined);
      setBreakdown(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al obtener el desglose del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      setPeriodPreset('all');
      setStartDate('');
      setEndDate('');
      loadBreakdown('', '');
    } else {
      setBreakdown(null);
    }
    // eslint-disable-next-line
  }, [isOpen, userId]);

  const applyPreset = (preset: string) => {
    setPeriodPreset(preset);
    let sDate = '';
    let eDate = '';
    const now = new Date();

    if (preset === 'today') {
      sDate = toLocalYYYYMMDD(now);
      eDate = sDate;
    } else if (preset === 'yesterday') {
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      sDate = toLocalYYYYMMDD(yd);
      eDate = sDate;
    } else if (preset === 'week') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      sDate = toLocalYYYYMMDD(monday);
      eDate = toLocalYYYYMMDD(now);
    } else if (preset === 'biweekly') {
      const dayOfMonth = now.getDate();
      const startFortnight = new Date(now.getFullYear(), now.getMonth(), dayOfMonth <= 15 ? 1 : 16);
      sDate = toLocalYYYYMMDD(startFortnight);
      eDate = toLocalYYYYMMDD(now);
    } else if (preset === 'month') {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      sDate = toLocalYYYYMMDD(startMonth);
      eDate = toLocalYYYYMMDD(now);
    } else if (preset === 'all') {
      sDate = '';
      eDate = '';
    }

    if (preset !== 'custom') {
      setStartDate(sDate);
      setEndDate(eDate);
      loadBreakdown(sDate, eDate);
    }
  };

  const formatMinutes = (totalMin: number = 0) => {
    const mins = Math.max(0, Math.floor(totalMin));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  const safeFormatTime = (isoString?: string, fallback = '-') => {
    if (!isoString) return fallback;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return fallback;
    }
  };

  if (!isOpen) return null;

  const totals = breakdown?.totals || { totalShifts: 0, totalWorkMinutes: 0, totalBreakMinutes: 0, netWorkMinutes: 0 };
  const recordsList = Array.isArray(breakdown?.records) ? breakdown!.records : [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(9, 20, 38, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#091426', margin: 0 }}>Desglose de Horarios y Asistencia</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Colaborador: <strong style={{ color: '#0f172a' }}>{userName}</strong></span>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <Icon name="X" size="md" />
          </button>
        </div>

        {/* Period Preset Filter Bar */}
        <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '4px' }}>Filtrar por:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'today', label: 'Hoy' },
                { id: 'yesterday', label: 'Ayer' },
                { id: 'week', label: 'Esta Semana' },
                { id: 'biweekly', label: 'Quincenal' },
                { id: 'month', label: 'Este Mes' },
                { id: 'custom', label: 'Personalizado' },
              ].map((p) => {
                const isActive = periodPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: isActive ? '700' : '500',
                      border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      background: isActive ? '#eff6ff' : 'white',
                      color: isActive ? '#1d4ed8' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {periodPreset === 'custom' && (
              <form onSubmit={(e) => { e.preventDefault(); loadBreakdown(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569' }}>
                  <span>Desde:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569' }}>
                  <span>Hasta:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: 'white' }}
                  />
                </div>
                <PrimaryButton type="submit" size="sm">Filtrar</PrimaryButton>
              </form>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando registros detallados...</div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Turnos Realizados</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#091426', fontFamily: 'monospace' }}>{totals.totalShifts || 0}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Horas Brutas</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#334155', fontFamily: 'monospace' }}>{formatMinutes(totals.totalWorkMinutes)}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Tiempo Comida</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#d97706', fontFamily: 'monospace' }}>{formatMinutes(totals.totalBreakMinutes)}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Horas Netas</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a', fontFamily: 'monospace' }}>{formatMinutes(totals.netWorkMinutes)}</span>
                </div>
              </div>

              {/* Records List */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                  Historial de Asistencia y Salidas ({recordsList.length} {recordsList.length === 1 ? 'registro' : 'registros'})
                </h4>

                {recordsList.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
                    No se encontraron registros para el periodo seleccionado.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {recordsList.map((record) => {
                      const isRecordWorking = record.status === 'working';
                      const isRecordOnBreak = record.status === 'on_break';
                      const isRecordCompleted = record.status === 'completed' || !!record.clockOut;

                      let recStatusBg = '#f1f5f9';
                      let recStatusColor = '#475569';
                      let recStatusLabel = '⚪ Sin Finalizar';

                      if (isRecordWorking) {
                        recStatusBg = '#dcfce7'; recStatusColor = '#15803d'; recStatusLabel = '🟢 En Turno';
                      } else if (isRecordOnBreak) {
                        recStatusBg = '#fef9c3'; recStatusColor = '#a16207'; recStatusLabel = '⏸️ En Descanso';
                      } else if (isRecordCompleted) {
                        recStatusBg = '#dbeafe'; recStatusColor = '#1d4ed8'; recStatusLabel = '🏁 Turno Concluido';
                      }

                      return (
                        <div
                          key={record._id || record.id || Math.random()}
                          style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                        >
                          {/* Card Header Section */}
                          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: '#855300' }}>
                                📅 {formatFriendlyDate(record.date)}
                              </span>
                              <span style={{ fontSize: '12px', background: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                {typeof record.branch === 'object' ? record.branch?.name : 'Sucursal'}
                              </span>
                            </div>

                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: recStatusBg, color: recStatusColor }}>
                              {recStatusLabel}
                            </span>
                          </div>

                          {/* Times & Hours Metrics Grid */}
                          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            {/* Hora de Entrada */}
                            <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                🟢 Hora de Entrada
                              </span>
                              <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                                {safeFormatTime(record.clockIn)}
                              </span>
                              {record.clockInNote && (
                                <span style={{ display: 'block', fontSize: '11px', color: '#475569', fontStyle: 'italic', marginTop: '4px' }}>
                                  "{record.clockInNote}"
                                </span>
                              )}
                            </div>

                            {/* Hora de Salida */}
                            <div style={{ background: record.clockOut ? '#eff6ff' : '#fffbeb', padding: '10px 14px', borderRadius: '8px', border: record.clockOut ? '1px solid #bfdbfe' : '1px solid #fde68a' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: record.clockOut ? '#1e40af' : '#b45309', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                🔴 Hora de Salida
                              </span>
                              <span style={{ fontSize: '16px', fontWeight: '800', color: record.clockOut ? '#0f172a' : '#d97706', fontFamily: 'monospace' }}>
                                {record.clockOut
                                  ? safeFormatTime(record.clockOut)
                                  : 'En Turno'}
                              </span>
                              {record.clockOutNote && (
                                <span style={{ display: 'block', fontSize: '11px', color: '#475569', fontStyle: 'italic', marginTop: '4px' }}>
                                  "{record.clockOutNote}"
                                </span>
                              )}
                            </div>

                            {/* Tiempo de Comida */}
                            <div style={{ background: '#fffbeb', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                ⏸️ Tiempo Comida
                              </span>
                              <span style={{ fontSize: '16px', fontWeight: '800', color: '#d97706', fontFamily: 'monospace' }}>
                                {formatMinutes(record.totalBreakMinutes)}
                              </span>
                              <span style={{ display: 'block', fontSize: '11px', color: '#78350f', marginTop: '2px' }}>
                                ({record.breaks?.length || 0} descansos)
                              </span>
                            </div>

                            {/* Horas Netas */}
                            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                ⏱️ Horas Netas
                              </span>
                              <span style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a', fontFamily: 'monospace' }}>
                                {formatMinutes(record.netWorkMinutes)}
                              </span>
                              <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                Bruto: {formatMinutes(record.totalWorkMinutes)}
                              </span>
                            </div>
                          </div>

                          {/* Breaks detailed sub-section */}
                          {record.breaks && record.breaks.length > 0 && (
                            <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', display: 'block', marginBottom: '8px' }}>
                                ☕ Registro de Descansos / Comidas
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {record.breaks.map((b, idx) => (
                                  <div key={b._id || b.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#334155', background: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <span>
                                      <strong>Inicio:</strong> <span style={{ fontFamily: 'monospace' }}>{safeFormatTime(b.startTime)}</span>
                                      {' ➔ '}
                                      <strong>Fin:</strong> <span style={{ fontFamily: 'monospace' }}>{b.endTime ? safeFormatTime(b.endTime) : 'En curso'}</span>
                                      {b.note ? <span style={{ fontStyle: 'italic', color: '#64748b', marginLeft: '6px' }}>({b.note})</span> : ''}
                                    </span>
                                    <span style={{ color: '#d97706', fontFamily: 'monospace', fontWeight: '700' }}>
                                      {formatMinutes(b.durationMinutes || 0)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
        </div>

      </div>
    </div>
  );
};

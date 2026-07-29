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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (isOpen && userId) {
      loadBreakdown();
    } else {
      setBreakdown(null);
    }
  }, [isOpen, userId]);

  const loadBreakdown = async () => {
    if (!userId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await attendanceRepo.getUserBreakdown(userId, startDate || undefined, endDate || undefined);
      setBreakdown(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al obtener el desglose del usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadBreakdown();
  };

  const formatMinutes = (totalMin: number = 0) => {
    const mins = Math.max(0, Math.floor(totalMin));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  if (!isOpen) return null;

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
        maxWidth: '900px',
        maxHeight: '90vh',
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

        {/* Date Filter Bar */}
        <form onSubmit={handleFilter} style={{ padding: '12px 24px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
            <span>Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
            <span>Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
            />
          </div>

          <PrimaryButton type="submit" size="sm">Filtrar</PrimaryButton>
        </form>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMsg && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando registros detallados...</div>
          ) : breakdown ? (
            <>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Turnos Realizados</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#091426', fontFamily: 'monospace' }}>{breakdown.totals.totalShifts}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Horas Brutas</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#334155', fontFamily: 'monospace' }}>{formatMinutes(breakdown.totals.totalWorkMinutes)}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Tiempo Comida</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#d97706', fontFamily: 'monospace' }}>{formatMinutes(breakdown.totals.totalBreakMinutes)}</span>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Horas Netas</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a', fontFamily: 'monospace' }}>{formatMinutes(breakdown.totals.netWorkMinutes)}</span>
                </div>
              </div>

              {/* Records List */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                  Historial Diario de Asistencia ({breakdown.records.length} registros)
                </h4>

                {breakdown.records.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
                    No se encontraron registros para este periodo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {breakdown.records.map((record) => (
                      <div
                        key={record._id || record.id}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#855300', fontFamily: 'monospace' }}>{record.date}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                              {typeof record.branch === 'object' ? record.branch?.name : 'Sucursal'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#475569' }}>Bruto: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{formatMinutes(record.totalWorkMinutes)}</strong></span>
                            <span style={{ color: '#475569' }}>Comida: <strong style={{ color: '#d97706', fontFamily: 'monospace' }}>{formatMinutes(record.totalBreakMinutes)}</strong></span>
                            <span style={{ color: '#16a34a', fontWeight: '700', fontFamily: 'monospace' }}>Neto: {formatMinutes(record.netWorkMinutes)}</span>
                          </div>
                        </div>

                        {/* Clock In / Out times */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ background: 'white', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Hora de Entrada</span>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                              {new Date(record.clockIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {record.clockInNote && (
                              <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                                Nota: "{record.clockInNote}"
                              </span>
                            )}
                          </div>

                          <div style={{ background: 'white', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Hora de Salida</span>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                              {record.clockOut
                                ? new Date(record.clockOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                                : 'En Turno'}
                            </span>
                            {record.clockOutNote && (
                              <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                                Nota: "{record.clockOutNote}"
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Breaks detail */}
                        {record.breaks && record.breaks.length > 0 && (
                          <div style={{ background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#d97706', display: 'block', marginBottom: '8px' }}>
                              Descansos / Comidas ({record.breaks.length})
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {record.breaks.map((b, idx) => (
                                <div key={b._id || b.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                                  <span>
                                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                                      {new Date(b.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                    </strong>
                                    {' -> '}
                                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>
                                      {b.endTime
                                        ? new Date(b.endTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                                        : 'En curso'}
                                    </strong>
                                    {b.note ? ` (${b.note})` : ''}
                                  </span>
                                  <span style={{ color: '#d97706', fontFamily: 'monospace', fontWeight: '600' }}>
                                    {formatMinutes(b.durationMinutes || 0)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
        </div>

      </div>
    </div>
  );
};

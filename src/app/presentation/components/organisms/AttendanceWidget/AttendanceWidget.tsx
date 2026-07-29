import React, { useState, useEffect } from 'react';
import { Icon } from '@/app/presentation/components';
import { APIAttendanceRepository } from '@/app/data/repositories/APIAttendanceRepository';
import type { TodayAttendanceStatus } from '@/app/domain/entities/AttendanceEntities';

const attendanceRepo = new APIAttendanceRepository();

interface AttendanceWidgetProps {
  userId: string;
  userName?: string;
  userRole?: string;
  showWorkHours?: boolean;
  onStatusChange?: () => void;
}

export const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({
  userId,
  userName,
  userRole,
  showWorkHours = true,
  onStatusChange,
}) => {
  const [statusData, setStatusData] = useState<TodayAttendanceStatus | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Note input prompt state
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'clock-in' | 'clock-out' | 'start-break' | null>(null);

  const loadTodayStatus = async (showSpinner = false) => {
    if (!userId) return;
    if (showSpinner) setIsInitialLoading(true);
    setErrorMsg(null);
    try {
      const data = await attendanceRepo.getTodayStatus(userId);
      setStatusData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo obtener el estado de asistencia');
    } finally {
      if (showSpinner) setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setIsInitialLoading(true);
      attendanceRepo.getTodayStatus(userId)
        .then((data) => setStatusData(data))
        .catch((err: any) => setErrorMsg(err.message || 'No se pudo obtener el estado'))
        .finally(() => setIsInitialLoading(false));
    }
  }, [userId]);

  const promptActionWithNote = (action: 'clock-in' | 'clock-out' | 'start-break') => {
    setPendingAction(action);
    setNoteText('');
    setShowNoteInput(true);
  };

  const handleExecuteAction = async (action: 'clock-in' | 'clock-out' | 'start-break' | 'end-break', note?: string) => {
    setIsActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowNoteInput(false);

    try {
      if (action === 'clock-in') {
        const record = await attendanceRepo.clockIn(note, userId);
        setStatusData({
          hasActiveShift: true,
          status: 'working',
          attendance: record,
          currentWorkMinutes: 0,
          totalBreakMinutes: 0,
          netWorkMinutes: 0,
        });
        setSuccessMsg(`¡Entrada registrada exitosamente ${userName ? `para ${userName}` : ''}!`);
      } else if (action === 'clock-out') {
        const record = await attendanceRepo.clockOut(note, userId);
        setStatusData({
          hasActiveShift: false,
          status: 'completed',
          lastRecordToday: record,
        });
        setSuccessMsg(`¡Salida registrada exitosamente ${userName ? `para ${userName}` : ''}!`);
      } else if (action === 'start-break') {
        const record = await attendanceRepo.startBreak(note, userId);
        const activeB = record.breaks ? record.breaks.find((b: any) => !b.endTime) : null;
        setStatusData({
          hasActiveShift: true,
          status: 'on_break',
          attendance: record,
          activeBreak: activeB ? {
            startTime: activeB.startTime,
            durationMinutes: activeB.durationMinutes || 0,
            note: activeB.note,
          } : null,
        });
        setSuccessMsg(`¡Descanso iniciado ${userName ? `para ${userName}` : ''}! Buen provecho.`);
      } else if (action === 'end-break') {
        const record = await attendanceRepo.endBreak(userId);
        setStatusData({
          hasActiveShift: true,
          status: 'working',
          attendance: record,
          activeBreak: null,
        });
        setSuccessMsg(`Descanso finalizado ${userName ? `para ${userName}` : ''}. De vuelta al trabajo.`);
      }

      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la acción de asistencia');
      await loadTodayStatus();
    } finally {
      setIsActionLoading(false);
      setPendingAction(null);
    }
  };

  const formatMinutesToHHMM = (totalMin: number = 0) => {
    const mins = Math.max(0, Math.floor(totalMin));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  // Status flags
  const hasActiveShift = !!statusData?.hasActiveShift;
  const isWorking = hasActiveShift && statusData?.status === 'working';
  const isOnBreak = hasActiveShift && statusData?.status === 'on_break';
  const isCompleted = !hasActiveShift && !!statusData?.lastRecordToday;
  const canClockIn = !hasActiveShift && !statusData?.lastRecordToday;

  // Active record to extract times from (active shift attendance or last record of today)
  const activeRecord = statusData?.attendance || statusData?.lastRecordToday;

  const renderStatusBadge = () => {
    if (isWorking) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: '#dcfce7',
          color: '#166534',
          fontSize: '13px',
          fontWeight: '600',
          border: '1px solid #bbf7d0'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
          En Turno Laboral
        </span>
      );
    }

    if (isOnBreak) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: '#fef3c7',
          color: '#92400e',
          fontSize: '13px',
          fontWeight: '600',
          border: '1px solid #fde68a'
        }}>
          <Icon name="Coffee" size="xs" color="#92400e" />
          En Descanso / Comida
        </span>
      );
    }

    if (isCompleted) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '9999px',
          background: '#dbeafe',
          color: '#1e40af',
          fontSize: '13px',
          fontWeight: '600',
          border: '1px solid #bfdbfe'
        }}>
          <Icon name="CheckCircle2" size="xs" color="#1e40af" />
          Jornada Completada
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '9999px',
        background: '#f1f5f9',
        color: '#475569',
        fontSize: '13px',
        fontWeight: '600',
        border: '1px solid #e2e8f0'
      }}>
        <Icon name="Clock" size="xs" color="#475569" />
        Sin Iniciar Turno Hoy
      </span>
    );
  };

  const displayName = userName || 'Colaborador';

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Employee Name & Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#855300',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '16px'
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#091426', margin: 0 }}>
              {displayName}
            </h3>
            {userRole && <span style={{ fontSize: '12px', color: '#64748b' }}>{userRole}</span>}
          </div>
        </div>

        <div>
          {renderStatusBadge()}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="AlertCircle" size="sm" color="#dc2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="CheckCircle2" size="sm" color="#16a34a" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {isInitialLoading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Cargando estado...</div>
      ) : (
        <>
          {/* Work metrics grid matching screenshot */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`, gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Hora de Entrada</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                {activeRecord?.clockIn
                  ? new Date(activeRecord.clockIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Hora de Salida</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                {activeRecord?.clockOut
                  ? new Date(activeRecord.clockOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Tiempo de Comida</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#d97706', fontFamily: 'monospace' }}>
                {formatMinutesToHHMM(statusData?.totalBreakMinutes || activeRecord?.totalBreakMinutes || 0)}
              </span>
            </div>

            {showWorkHours && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Horas Trabajadas (Neto)</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#16a34a', fontFamily: 'monospace' }}>
                  {formatMinutesToHHMM(statusData?.netWorkMinutes || activeRecord?.netWorkMinutes || 0)}
                </span>
              </div>
            )}
          </div>

          {/* Active Break Banner */}
          {isOnBreak && statusData?.activeBreak && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="Coffee" size="sm" color="#d97706" />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', margin: 0 }}>Descanso / Comida Activo</h4>
                  <p style={{ fontSize: '11px', color: '#b45309', margin: 0 }}>
                    Inicio: {new Date(statusData.activeBreak.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    {statusData.activeBreak.note ? ` • Nota: ${statusData.activeBreak.note}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleExecuteAction('end-break')}
                disabled={isActionLoading}
                style={{
                  background: '#d97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Icon name="Check" size="xs" />
                Terminar Comida
              </button>
            </div>
          )}

          {/* Inline Note Prompt */}
          {showNoteInput && (
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Nota opcional para {pendingAction === 'clock-in' ? 'Entrada' : pendingAction === 'clock-out' ? 'Salida' : 'Inicio de Comida'}:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ej: Llegada a tiempo / Salida de turno"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => pendingAction && handleExecuteAction(pendingAction, noteText)}
                  disabled={isActionLoading}
                  style={{
                    background: '#091426',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  style={{
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons Matching Screenshot */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {/* Clock In */}
            <button
              onClick={() => promptActionWithNote('clock-in')}
              disabled={isActionLoading || !canClockIn}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: canClockIn ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: canClockIn ? '#16a34a' : '#f1f5f9',
                color: canClockIn ? 'white' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <Icon name="LogIn" size="xs" />
              Marcar Entrada
            </button>

            {/* Start Break */}
            <button
              onClick={() => promptActionWithNote('start-break')}
              disabled={isActionLoading || !isWorking}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isWorking ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: isWorking ? '#d97706' : '#f1f5f9',
                color: isWorking ? 'white' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <Icon name="Coffee" size="xs" />
              Iniciar Comida
            </button>

            {/* End Break */}
            <button
              onClick={() => handleExecuteAction('end-break')}
              disabled={isActionLoading || !isOnBreak}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isOnBreak ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: isOnBreak ? '#b45309' : '#f1f5f9',
                color: isOnBreak ? 'white' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <Icon name="Check" size="xs" />
              Terminar Comida
            </button>

            {/* Clock Out */}
            <button
              onClick={() => promptActionWithNote('clock-out')}
              disabled={isActionLoading || (!isWorking && !isOnBreak)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: (isWorking || isOnBreak) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: (isWorking || isOnBreak) ? '#dc2626' : '#f1f5f9',
                color: (isWorking || isOnBreak) ? 'white' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              <Icon name="LogOut" size="xs" />
              Marcar Salida
            </button>
          </div>
        </>
      )}
    </div>
  );
};

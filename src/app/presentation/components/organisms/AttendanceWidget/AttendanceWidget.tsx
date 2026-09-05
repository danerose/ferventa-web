import React, { useState, useEffect } from 'react';
import { Icon } from '@/app/presentation/components';
import { APIAttendanceRepository } from '@/app/data';
import type { TodayAttendanceStatus } from '@/app/domain';

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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo obtener el estado de asistencia');
    } finally {
      if (showSpinner) setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setIsInitialLoading(true);
      attendanceRepo.getTodayStatus(userId)
        .then((data) => setStatusData(data))
        .catch((err: unknown) => setErrorMsg(err instanceof Error ? err.message : 'No se pudo obtener el estado'))
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
        const activeB = record.breaks ? record.breaks.find((b) => !b.endTime) : null;
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar la acción de asistencia');
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          En Turno Laboral
        </span>
      );
    }

    if (isOnBreak) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 border border-warning/30 text-warning text-xs font-semibold">
          <Icon name="Coffee" size="xs" />
          En Descanso / Comida
        </span>
      );
    }

    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/15 border border-info/30 text-info text-xs font-semibold">
          <Icon name="CheckCircle2" size="xs" />
          Jornada Completada
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-base-200 border border-base-300 text-base-content/70 text-xs font-semibold">
        <Icon name="Clock" size="xs" />
        Sin Iniciar Turno Hoy
      </span>
    );
  };

  const displayName = userName || 'Colaborador';

  return (
    <div className="bg-base-100 rounded-xl border border-base-300 p-5 shadow-xs">
      {/* Employee Name & Status Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 pb-4 mb-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-base">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-base-content m-0">
              {displayName}
            </h3>
            {userRole && <span className="text-xs text-base-content/60">{userRole}</span>}
          </div>
        </div>

        <div>
          {renderStatusBadge()}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs mb-4 flex items-center gap-2">
          <Icon name="AlertCircle" size="sm" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-success text-xs mb-4 flex items-center gap-2">
          <Icon name="CheckCircle2" size="sm" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {isInitialLoading ? (
        <div className="p-6 text-center text-base-content/60 text-xs">Cargando estado...</div>
      ) : (
        <>
          {/* Work metrics grid matching screenshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-base-200 p-3 rounded-lg border border-base-300">
              <span className="text-[11px] text-base-content/60 block mb-1 font-medium">Hora de Entrada</span>
              <span className="text-sm font-bold text-base-content font-mono">
                {activeRecord?.clockIn
                  ? new Date(activeRecord.clockIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </div>

            <div className="bg-base-200 p-3 rounded-lg border border-base-300">
              <span className="text-[11px] text-base-content/60 block mb-1 font-medium">Hora de Salida</span>
              <span className="text-sm font-bold text-base-content font-mono">
                {activeRecord?.clockOut
                  ? new Date(activeRecord.clockOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </div>

            <div className="bg-base-200 p-3 rounded-lg border border-base-300">
              <span className="text-[11px] text-base-content/60 block mb-1 font-medium">Tiempo de Comida</span>
              <span className="text-sm font-bold text-warning font-mono">
                {formatMinutesToHHMM(statusData?.totalBreakMinutes || activeRecord?.totalBreakMinutes || 0)}
              </span>
            </div>

            {showWorkHours && (
              <div className="bg-base-200 p-3 rounded-lg border border-base-300">
                <span className="text-[11px] text-base-content/60 block mb-1 font-medium">Horas Trabajadas (Neto)</span>
                <span className="text-sm font-bold text-success font-mono">
                  {formatMinutesToHHMM(statusData?.netWorkMinutes || activeRecord?.netWorkMinutes || 0)}
                </span>
              </div>
            )}
          </div>

          {/* Active Break Banner */}
          {isOnBreak && statusData?.activeBreak && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 sm:p-4 flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 flex-1">
                <div className="w-8 h-8 rounded-md bg-warning/20 flex items-center justify-center text-warning shrink-0">
                  <Icon name="Coffee" size="sm" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-warning m-0">Descanso / Comida Activo</h4>
                  <p className="text-[11px] text-warning/80 m-0">
                    Inicio: {new Date(statusData.activeBreak.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    {statusData.activeBreak.note ? ` • Nota: ${statusData.activeBreak.note}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleExecuteAction('end-break')}
                disabled={isActionLoading}
                className="btn btn-warning btn-sm text-white font-semibold flex items-center gap-1.5"
              >
                <Icon name="Check" size="xs" />
                Terminar Comida
              </button>
            </div>
          )}

          {/* Inline Note Prompt */}
          {showNoteInput && (
            <div className="bg-base-200 border border-base-300 rounded-lg p-3.5 mb-4">
              <label className="block text-xs font-semibold text-base-content mb-1.5">
                Nota opcional para {pendingAction === 'clock-in' ? 'Entrada' : pendingAction === 'clock-out' ? 'Salida' : 'Inicio de Comida'}:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Llegada a tiempo / Salida de turno"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="input input-sm input-bordered flex-1 bg-base-100 border-base-300 text-base-content text-xs"
                />
                <button
                  onClick={() => pendingAction && handleExecuteAction(pendingAction, noteText)}
                  disabled={isActionLoading}
                  className="btn btn-primary btn-sm text-xs font-semibold"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="btn btn-ghost btn-sm border border-base-300 text-xs font-semibold text-base-content/70"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Clock In */}
            <button
              onClick={() => promptActionWithNote('clock-in')}
              disabled={isActionLoading || !canClockIn}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                canClockIn
                  ? 'bg-success hover:bg-success/90 text-white border-success cursor-pointer shadow-xs'
                  : 'bg-base-200 text-base-content/30 border-base-300 cursor-not-allowed'
              }`}
            >
              <Icon name="LogIn" size="xs" />
              Marcar Entrada
            </button>

            {/* Start Break */}
            <button
              onClick={() => promptActionWithNote('start-break')}
              disabled={isActionLoading || !isWorking}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                isWorking
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 cursor-pointer shadow-xs'
                  : 'bg-base-200 text-base-content/30 border-base-300 cursor-not-allowed'
              }`}
            >
              <Icon name="Coffee" size="xs" />
              Iniciar Comida
            </button>

            {/* End Break */}
            <button
              onClick={() => handleExecuteAction('end-break')}
              disabled={isActionLoading || !isOnBreak}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                isOnBreak
                  ? 'bg-amber-700 hover:bg-amber-800 text-white border-amber-700 cursor-pointer shadow-xs'
                  : 'bg-base-200 text-base-content/30 border-base-300 cursor-not-allowed'
              }`}
            >
              <Icon name="Check" size="xs" />
              Terminar Comida
            </button>

            {/* Clock Out */}
            <button
              onClick={() => promptActionWithNote('clock-out')}
              disabled={isActionLoading || (!isWorking && !isOnBreak)}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                (isWorking || isOnBreak)
                  ? 'bg-error hover:bg-error/90 text-white border-error cursor-pointer shadow-xs'
                  : 'bg-base-200 text-base-content/30 border-base-300 cursor-not-allowed'
              }`}
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

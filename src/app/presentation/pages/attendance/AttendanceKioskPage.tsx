import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Modal, Badge } from '@/app/presentation/components';
import { kioskRepository, branchUseCases } from '@/core/di/container';
import type { Branch, KioskEmployee, KioskClockAction, KioskClockResult } from '@/app/domain';

export const AttendanceKioskPage: React.FC = () => {
  const navigate = useNavigate();

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('ferventa_active_branch') || '';
  });

  // Time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Employees list
  const [employees, setEmployees] = useState<KioskEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected Employee for Clocking
  const [selectedEmployee, setSelectedEmployee] = useState<KioskEmployee | null>(null);
  const [pin, setPin] = useState<string>('');
  const [submittingClock, setSubmittingClock] = useState(false);
  const [clockError, setClockError] = useState<string | null>(null);
  const [clockSuccess, setClockSuccess] = useState<KioskClockResult | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchUseCases.getPublicBranches();
        if (data && data.length > 0) {
          setBranches(data);
          if (!selectedBranchId) {
            setSelectedBranchId(data[0].id);
            localStorage.setItem('ferventa_active_branch', data[0].id);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchBranches();
  }, [selectedBranchId]);

  // Fetch employees for active branch
  const fetchEmployees = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await kioskRepository.getKioskEmployees(selectedBranchId);
      setEmployees(list || []);
    } catch (err: any) {
      setError(err?.message || 'Error al obtener empleados de la sucursal');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem('ferventa_active_branch', branchId);
  };

  const handleSelectEmployee = (emp: KioskEmployee) => {
    setSelectedEmployee(emp);
    setPin('');
    setClockError(null);
    setClockSuccess(null);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setClockError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setClockError(null);
  };

  const handleClear = () => {
    setPin('');
    setClockError(null);
  };

  const handleClockAction = async (action: KioskClockAction) => {
    if (!selectedEmployee || pin.length !== 4) {
      setClockError('Ingresa tu PIN de 4 dígitos para continuar.');
      return;
    }

    setSubmittingClock(true);
    setClockError(null);
    try {
      const result = await kioskRepository.clockWithPin({
        branchId: selectedBranchId,
        userId: selectedEmployee.id,
        pin,
        action,
      });

      setClockSuccess(result);
      setPin('');
      fetchEmployees();

      // Auto close success after 3.5s
      setTimeout(() => {
        setSelectedEmployee(null);
        setClockSuccess(null);
      }, 3500);
    } catch (err: any) {
      setClockError(err?.message || 'Error al registrar turno');
    } finally {
      setSubmittingClock(false);
    }
  };

  const getStatusBadge = (emp: KioskEmployee) => {
    const rawStatus = String(emp.status || emp.shiftStatus || '').toLowerCase();
    if (rawStatus === 'working' || rawStatus === 'clocked-in' || (emp.hasActiveShift && !emp.isOnBreak && !emp.activeBreak)) {
      return <Badge variant="success" size="sm">Trabajando</Badge>;
    }
    if (rawStatus === 'break' || rawStatus === 'onbreak' || rawStatus === 'on-break' || emp.isOnBreak || Boolean(emp.activeBreak)) {
      return <Badge variant="warning" size="sm">En Descanso</Badge>;
    }
    return <Badge variant="neutral" size="sm">Fuera de Turno</Badge>;
  };

  return (
    <div className="min-h-screen bg-base-200 dark:bg-base-300 flex flex-col p-4 md:p-8 select-none">
      {/* Kiosk Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-md">
            <Icon name="Clock" size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-base-content">
              Kiosco de Asistencia
            </h1>
            <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">
              Control de Asistencia del Personal
            </p>
          </div>
        </div>

        {/* Live Clock & Branch Select */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-3xl font-black font-mono tracking-tight text-base-content">
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-base-content/60 font-semibold capitalize">
              {currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {branches.length > 0 && (
            <div className="border-l border-base-300 pl-6 hidden md:block">
              <label className="text-[10px] font-bold uppercase tracking-wider text-base-content/60 block mb-1">
                Sucursal
              </label>
              <select
                className="select select-sm select-bordered font-semibold text-xs"
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => navigate('/admin/operaciones')}
            className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-base-content"
            title="Salir al panel administrativo"
          >
            <Icon name="LogOut" size="sm" />
          </button>
        </div>
      </header>

      {/* Employees Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-base-content/70">
            Selecciona tu tarjeta para marcar asistencia
          </h2>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="btn btn-ghost btn-xs gap-1.5 text-base-content/60"
          >
            <Icon name="RefreshCw" size="xs" className={loading ? 'animate-spin' : ''} />
            Actualizar lista
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-base-content/60">
            <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
            <p className="text-sm font-semibold">Cargando colaboradores de la sucursal...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error max-w-xl mx-auto">
            <Icon name="AlertCircle" size="sm" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && employees.length === 0 && (
          <div className="text-center py-24 bg-base-100 rounded-3xl border border-base-300 max-w-xl mx-auto p-8">
            <Icon name="Users" size="xl" className="mx-auto mb-3 opacity-30 text-base-content" />
            <h3 className="text-lg font-bold text-base-content">No se encontraron colaboradores</h3>
            <p className="text-xs text-base-content/60 mt-1">
              Verifica que haya usuarios asignados a esta sucursal o cambia de sucursal.
            </p>
          </div>
        )}

        {!loading && !error && employees.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {employees.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => handleSelectEmployee(emp)}
                className="bg-base-100 hover:bg-base-200/60 active:scale-95 transition-all p-5 rounded-3xl border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 flex flex-col items-center text-center cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content transition-all flex items-center justify-center text-2xl font-black mb-3 shadow-xs">
                  {(emp.name || 'U').charAt(0).toUpperCase()}
                </div>
                <h3 className="text-base font-bold text-base-content leading-tight line-clamp-1">
                  {emp.name || 'Colaborador'}
                </h3>
                <span className="text-[11px] font-semibold text-base-content/50 capitalize mt-0.5 mb-3">
                  {emp.role || 'Personal'}
                </span>
                <div className="mt-auto">
                  {getStatusBadge(emp)}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* PIN & Clock Action Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => {
            if (!submittingClock) {
              setSelectedEmployee(null);
              setClockSuccess(null);
            }
          }}
          title={`Marcar Asistencia: ${selectedEmployee.name}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
            {clockSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto shadow-sm">
                  <Icon name="CheckCheck" size="xl" />
                </div>
                <h3 className="text-xl font-black text-base-content">
                  ¡Turno Registrado con Éxito!
                </h3>
                <p className="text-sm font-semibold text-base-content/70">
                  {clockSuccess.message || `Acción: ${clockSuccess.action}`}
                </p>
                <span className="text-xs font-mono text-base-content/50 block">
                  {new Date(clockSuccess.recordedAt).toLocaleString('es-MX')}
                </span>
              </div>
            ) : (
              <>
                {/* Employee Card Preview */}
                <div className="flex items-center gap-3.5 bg-base-200/60 p-3.5 rounded-2xl border border-base-300">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold text-lg">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-base-content text-sm">{selectedEmployee.name}</h4>
                    <span className="text-xs text-base-content/60 capitalize">{selectedEmployee.role}</span>
                  </div>
                  <div className="ml-auto">
                    {getStatusBadge(selectedEmployee)}
                  </div>
                </div>

                {/* PIN Display (4 Dots) */}
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/60 block mb-2">
                    Ingresa tu PIN de 4 dígitos
                  </span>
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                          pin.length > idx
                            ? 'border-primary bg-primary/10 text-primary scale-105'
                            : 'border-base-300 bg-base-200/40 text-base-content/30'
                        }`}
                      >
                        {pin.length > idx ? '●' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {clockError && (
                  <div className="alert alert-error text-xs py-2">
                    <Icon name="AlertCircle" size="xs" />
                    <span>{clockError}</span>
                  </div>
                )}

                {/* Numeric Virtual Keypad (0-9) */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      disabled={submittingClock}
                      onClick={() => handleKeyPress(digit)}
                      className="btn btn-lg bg-base-200 hover:bg-base-300 border-base-300 text-xl font-bold font-mono h-14 rounded-2xl active:scale-90"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={submittingClock || pin.length === 0}
                    onClick={handleClear}
                    className="btn btn-lg bg-base-200/50 hover:bg-base-300 border-base-300 text-xs font-bold uppercase h-14 rounded-2xl"
                  >
                    Borrar
                  </button>
                  <button
                    type="button"
                    disabled={submittingClock}
                    onClick={() => handleKeyPress('0')}
                    className="btn btn-lg bg-base-200 hover:bg-base-300 border-base-300 text-xl font-bold font-mono h-14 rounded-2xl active:scale-90"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    disabled={submittingClock || pin.length === 0}
                    onClick={handleBackspace}
                    className="btn btn-lg bg-base-200/50 hover:bg-base-300 border-base-300 h-14 rounded-2xl text-base-content/70"
                  >
                    <Icon name="Delete" size="sm" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {/* Contextual Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={submittingClock || pin.length !== 4}
                      onClick={() => handleClockAction('clock-in')}
                      className="btn btn-success text-white font-bold gap-2 py-3 rounded-xl shadow-xs disabled:opacity-40"
                    >
                      <Icon name="LogIn" size="sm" />
                      Entrada
                    </button>

                    <button
                      type="button"
                      disabled={submittingClock || pin.length !== 4}
                      onClick={() => handleClockAction('clock-out')}
                      className="btn btn-error text-white font-bold gap-2 py-3 rounded-xl shadow-xs disabled:opacity-40"
                    >
                      <Icon name="LogOut" size="sm" />
                      Salida
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={submittingClock || pin.length !== 4}
                      onClick={() => handleClockAction('break-start')}
                      className="btn btn-warning text-warning-content font-bold text-xs gap-1.5 rounded-xl shadow-xs disabled:opacity-40"
                    >
                      <Icon name="Coffee" size="xs" />
                      Iniciar Comida
                    </button>

                    <button
                      type="button"
                      disabled={submittingClock || pin.length !== 4}
                      onClick={() => handleClockAction('break-end')}
                      className="btn btn-info text-info-content font-bold text-xs gap-1.5 rounded-xl shadow-xs disabled:opacity-40"
                    >
                      <Icon name="Play" size="xs" />
                      Fin Comida
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

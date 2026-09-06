import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, PageLayout, PrimaryButton, SecondaryButton, TextInput, Modal, AlertModal, ConfirmModal, KbdBadge } from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { APIAdminRepository } from '@/app/data';
import type { Schedule, Holiday } from '@/app/domain';


const adminRepo = new APIAdminRepository();

export const ScheduleSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'holidays'>('schedule');

  // Form for Holiday
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');

  // Modals state
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; isError: boolean }>({
    isOpen: false, title: '', message: '', isError: false
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  const fetchData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [schData, holData] = await Promise.all([
        adminRepo.getSchedule(),
        adminRepo.getHolidays()
      ]);

      // Initialize with default if empty
      if (schData.length === 0) {
        const defaultSchedule = Array.from({ length: 7 }).map((_, i) => ({
          dayOfWeek: i,
          isWorking: i >= 1 && i <= 5, // Mon-Fri
          startTime: '09:00',
          endTime: '18:00'
        }));
        setSchedules(defaultSchedule);
      } else {
        setSchedules(schData);
      }

      setHolidays(holData);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [accessToken]);

  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState(false);

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await adminRepo.updateSchedule(schedules);
      setAlertState({ isOpen: true, title: 'Éxito', message: 'Horario guardado correctamente.', isError: false });
    } catch {
      setAlertState({ isOpen: true, title: 'Error', message: 'Error al guardar horario.', isError: true });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveHoliday = async () => {
    if (!holidayDate || !holidayDesc) return;
    setSavingHoliday(true);
    try {
      if (editingHolidayId) {
        await adminRepo.deleteHoliday(editingHolidayId);
      }
      await adminRepo.createHoliday(holidayDate, holidayDesc);
      closeHolidayModal();
      fetchData(); // reload
    } catch {
      setAlertState({ isOpen: true, title: 'Error', message: 'Error al guardar festivo.', isError: true });
    } finally {
      setSavingHoliday(false);
    }
  };

  const openEditHoliday = (h: Holiday) => {
    setEditingHolidayId(h.id);
    setHolidayDate(new Date(h.date).toISOString().split('T')[0]);
    setHolidayDesc(h.description);
    setShowAddHoliday(true);
  };

  const closeHolidayModal = () => {
    setShowAddHoliday(false);
    setEditingHolidayId(null);
    setHolidayDate('');
    setHolidayDesc('');
  };

  const executeDeleteHoliday = async () => {
    if (!confirmDeleteId) return;
    setDeletingHoliday(true);
    try {
      await adminRepo.deleteHoliday(confirmDeleteId);
      fetchData(); // reload
    } catch {
      setAlertState({ isOpen: true, title: 'Error', message: 'Error al eliminar festivo.', isError: true });
    } finally {
      setConfirmDeleteId(null);
      setDeletingHoliday(false);
    }
  };

  const updateScheduleDay = (index: number, updates: Partial<Schedule>) => {
    const newSch = [...schedules];
    newSch[index] = { ...newSch[index], ...updates };
    setSchedules(newSch);
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <PageLayout userName={user?.name || 'Admin'}>
      <header className="bg-base-100 px-7 py-4 border-b border-base-300 flex justify-between items-center shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-base-content">Horarios y Calendario</h1>
        </div>
        {activeTab === 'schedule' ? (
          <PrimaryButton onClick={handleSaveSchedule} loading={savingSchedule} disabled={savingSchedule}>Guardar Horarios</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setShowAddHoliday(true)}>
            <Icon name="Plus" size="sm" className="mr-2" /> Agregar Día Festivo
          </PrimaryButton>
        )}
      </header>

      <main className="flex-1 p-7 max-w-3xl w-full mx-auto">
        <div className="flex gap-1.5 bg-base-100 p-1 rounded-xl border border-base-300 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-primary text-primary-content shadow-xs'
                : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
            }`}
          >
            Horario Laboral
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
              activeTab === 'holidays'
                ? 'bg-primary text-primary-content shadow-xs'
                : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
            }`}
          >
            Días Festivos
          </button>
        </div>

        <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-10 text-center text-base-content/60 text-sm">Cargando...</div>
          ) : activeTab === 'schedule' ? (
            <div className="p-5">
              <h3 className="text-base font-semibold mb-4 text-base-content">Horario Semanal</h3>
              <div className="flex flex-col gap-3">
                {schedules.map((s, index) => (
                  <div key={s.dayOfWeek} className="flex items-center gap-4 p-3 bg-base-200 rounded-lg border border-base-300">
                    <div className="w-24 font-semibold text-sm text-base-content">
                      {dayNames[s.dayOfWeek]}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-base-content/80 w-28 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={s.isWorking}
                        onChange={(e) => updateScheduleDay(index, { isWorking: e.target.checked })}
                        className="checkbox checkbox-sm checkbox-primary"
                      />
                      Laborable
                    </label>

                    <div className={`flex items-center gap-2 flex-1 transition-opacity ${s.isWorking ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <input
                        type="time"
                        value={s.startTime}
                        onChange={(e) => updateScheduleDay(index, { startTime: e.target.value })}
                        className="input input-sm input-bordered bg-base-100 border-base-300 text-base-content font-mono"
                      />
                      <span className="text-xs text-base-content/60">a</span>
                      <input
                        type="time"
                        value={s.endTime}
                        onChange={(e) => updateScheduleDay(index, { endTime: e.target.value })}
                        className="input input-sm input-bordered bg-base-100 border-base-300 text-base-content font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="bg-base-200 border-b border-base-300">
                <tr>
                  <th className="p-3.5 px-4 text-left text-xs font-semibold text-base-content/70 uppercase tracking-wider">Fecha</th>
                  <th className="p-3.5 px-4 text-left text-xs font-semibold text-base-content/70 uppercase tracking-wider">Descripción</th>
                  <th className="p-3.5 px-4 text-center text-xs font-semibold text-base-content/70 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length > 0 ? holidays.map(h => (
                  <tr key={h.id} className="border-b border-base-300 hover:bg-base-200/50 transition-colors">
                    <td className="p-4 text-sm text-base-content font-semibold">{new Date(h.date).toLocaleDateString('es-MX')}</td>
                    <td className="p-4 text-sm text-base-content/80">{h.description}</td>
                    <td className="p-4 text-center flex gap-2 justify-center">
                      <button onClick={() => openEditHoliday(h)} className="btn btn-ghost btn-xs text-primary hover:bg-primary/10">
                        <Icon name="Edit2" size="sm" />
                      </button>
                      <button onClick={() => setConfirmDeleteId(h.id)} className="btn btn-ghost btn-xs text-error hover:bg-error/10">
                        <Icon name="Trash2" size="sm" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-sm text-base-content/60">No hay días festivos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Modal
        isOpen={showAddHoliday}
        onClose={closeHolidayModal}
        title={editingHolidayId ? "Editar Día Festivo" : "Agregar Día Festivo"}
        maxWidth="400px"
        footer={
          <>
            <SecondaryButton onClick={closeHolidayModal} disabled={savingHoliday}>
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton onClick={handleSaveHoliday} loading={savingHoliday} disabled={savingHoliday}>
              Guardar <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-base-content mb-1.5">Fecha</label>
            <input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className="input input-bordered w-full bg-base-100 border-base-300 text-base-content text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-base-content mb-1.5">Descripción</label>
            <TextInput
              placeholder="Día del trabajo..."
              value={holidayDesc}
              onChange={(e) => setHolidayDesc(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={executeDeleteHoliday}
        loading={deletingHoliday}
        title="Eliminar Festivo"
        message="¿Estás seguro de que deseas eliminar este día festivo?"
        confirmText="Sí, Eliminar"
        isDestructive
      />

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        message={alertState.message}
        isError={alertState.isError}
      />

    </PageLayout>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  PageLayout,
  PrimaryButton,
  SecondaryButton,
  TextInput,
  Checkbox,
  Modal,
  AlertModal,
  ConfirmModal,
  KbdBadge,
  Heading,
  Text,
  Box,
  Flex,
  Stack,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { scheduleUseCases } from '@/core/di/container';
import type { Schedule, Holiday } from '@/app/domain';

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
        scheduleUseCases.getSchedule(),
        scheduleUseCases.getHolidays()
      ]);

      if (schData.length === 0) {
        const defaultSchedule = Array.from({ length: 7 }).map((_, i) => ({
          dayOfWeek: i,
          isWorking: i >= 1 && i <= 5,
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
      await scheduleUseCases.updateSchedule(schedules);
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
        await scheduleUseCases.deleteHoliday(editingHolidayId);
      }
      await scheduleUseCases.createHoliday(holidayDate, holidayDesc);
      closeHolidayModal();
      fetchData();
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
      await scheduleUseCases.deleteHoliday(confirmDeleteId);
      fetchData();
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
      <Flex as="header" justify="between" align="center" className="bg-base-100 px-7 py-4 border-b border-base-300 shadow-xs">
        <Box>
          <Heading level={1} className="text-xl font-bold text-base-content m-0">
            Horarios y Calendario
          </Heading>
        </Box>
        {activeTab === 'schedule' ? (
          <PrimaryButton onClick={handleSaveSchedule} loading={savingSchedule} disabled={savingSchedule}>
            Guardar Horarios
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setShowAddHoliday(true)} iconStart={<Icon name="Plus" size="sm" />}>
            Agregar Día Festivo
          </PrimaryButton>
        )}
      </Flex>

      <Box as="main" className="flex-1 p-7 max-w-3xl w-full mx-auto">
        <Flex gap="xs" className="bg-base-100 p-1 rounded-xl border border-base-300 mb-6 w-fit">
          <SecondaryButton
            size="sm"
            color={activeTab === 'schedule' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('schedule')}
            className={activeTab === 'schedule' ? 'bg-primary text-primary-content font-bold' : ''}
          >
            Horario Laboral
          </SecondaryButton>
          <SecondaryButton
            size="sm"
            color={activeTab === 'holidays' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('holidays')}
            className={activeTab === 'holidays' ? 'bg-primary text-primary-content font-bold' : ''}
          >
            Días Festivos
          </SecondaryButton>
        </Flex>

        <Box className="bg-base-100 rounded-xl border border-base-300 overflow-hidden shadow-xs">
          {loading ? (
            <Flex justify="center" align="center" className="p-10">
              <Text size="sm" color="muted">Cargando...</Text>
            </Flex>
          ) : activeTab === 'schedule' ? (
            <Box p="lg">
              <Heading level={3} className="text-base font-semibold mb-4 text-base-content">
                Horario Semanal
              </Heading>
              <Stack gap="sm">
                {schedules.map((s, index) => (
                  <Flex key={s.dayOfWeek} align="center" gap="md" className="p-3 bg-base-200 rounded-lg border border-base-300">
                    <Box className="w-24">
                      <Text size="sm" weight="bold" className="text-base-content">
                        {dayNames[s.dayOfWeek]}
                      </Text>
                    </Box>

                    <Flex align="center" gap="xs" className="w-28">
                      <Checkbox
                        checked={s.isWorking}
                        onChange={(e) => updateScheduleDay(index, { isWorking: e.target.checked })}
                      />
                      <Text size="sm" color="muted">
                        Laborable
                      </Text>
                    </Flex>

                    <Flex align="center" gap="xs" className={`flex-1 transition-opacity ${s.isWorking ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <TextInput
                        type="time"
                        size="sm"
                        value={s.startTime}
                        onChange={(e) => updateScheduleDay(index, { startTime: e.target.value })}
                        className="font-mono"
                      />
                      <Text size="xs" color="muted">a</Text>
                      <TextInput
                        type="time"
                        size="sm"
                        value={s.endTime}
                        onChange={(e) => updateScheduleDay(index, { endTime: e.target.value })}
                        className="font-mono"
                      />
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            </Box>
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
                {holidays.length > 0 ? holidays.map((h) => (
                  <tr key={h.id} className="border-b border-base-300 hover:bg-base-200/50 transition-colors">
                    <td className="p-4 text-sm text-base-content font-semibold">{new Date(h.date).toLocaleDateString('es-MX')}</td>
                    <td className="p-4 text-sm text-base-content/80">{h.description}</td>
                    <td className="p-4 text-center">
                      <Flex justify="center" gap="xs">
                        <SecondaryButton
                          size="xs"
                          color="secondary"
                          onClick={() => openEditHoliday(h)}
                          iconStart={<Icon name="Edit2" size="xs" />}
                        />
                        <SecondaryButton
                          size="xs"
                          color="secondary"
                          onClick={() => setConfirmDeleteId(h.id)}
                          iconStart={<Icon name="Trash2" size="xs" className="text-error" />}
                        />
                      </Flex>
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
        </Box>
      </Box>

      <Modal
        isOpen={showAddHoliday}
        onClose={closeHolidayModal}
        title={editingHolidayId ? "Editar Día Festivo" : "Agregar Día Festivo"}
        maxWidth="max-w-md"
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
        <Stack gap="md">
          <Stack gap="xs">
            <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider">
              Fecha
            </Text>
            <TextInput
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
          </Stack>
          <Stack gap="xs">
            <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider">
              Descripción
            </Text>
            <TextInput
              placeholder="Día del trabajo..."
              value={holidayDesc}
              onChange={(e) => setHolidayDesc(e.target.value)}
            />
          </Stack>
        </Stack>
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

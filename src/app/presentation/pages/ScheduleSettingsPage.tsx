import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput, Modal, AlertModal, ConfirmModal } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import type { Schedule, Holiday } from '../../domain/entities/AdminEntities';

const adminRepo = new APIAdminRepository();

export const ScheduleSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, clearAuth } = useAuthStore();
  
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
        const defaultSchedule = Array.from({length: 7}).map((_, i) => ({
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
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [accessToken]);

  const handleSaveSchedule = async () => {
    try {
      await adminRepo.updateSchedule(schedules);
      setAlertState({ isOpen: true, title: 'Éxito', message: 'Horario guardado correctamente.', isError: false });
    } catch (e) {
      setAlertState({ isOpen: true, title: 'Error', message: 'Error al guardar horario.', isError: true });
    }
  };

  const handleSaveHoliday = async () => {
    if (!holidayDate || !holidayDesc) return;
    try {
      if (editingHolidayId) {
        await adminRepo.deleteHoliday(editingHolidayId);
      }
      await adminRepo.createHoliday(holidayDate, holidayDesc);
      closeHolidayModal();
      fetchData(); // reload
    } catch (e) {
      setAlertState({ isOpen: true, title: 'Error', message: 'Error al guardar festivo.', isError: true });
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
    try {
      await adminRepo.deleteHoliday(confirmDeleteId);
      fetchData(); // reload
    } catch (e) {
      setAlertState({ isOpen: true, title: 'Error', message: 'Error al eliminar festivo.', isError: true });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const updateScheduleDay = (index: number, updates: Partial<Schedule>) => {
    const newSch = [...schedules];
    newSch[index] = { ...newSch[index], ...updates };
    setSchedules(newSch);
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#091426' }}>Horarios y Calendario</h1>
          </div>
          {activeTab === 'schedule' ? (
            <PrimaryButton onClick={handleSaveSchedule}>Guardar Horarios</PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setShowAddHoliday(true)}>
              <Icon name="Plus" size="sm" className="mr-2" /> Agregar Día Festivo
            </PrimaryButton>
          )}
        </header>

        <main style={{ flex: 1, padding: '28px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', width: 'fit-content' }}>
            <button 
              onClick={() => setActiveTab('schedule')}
              style={{ 
                padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === 'schedule' ? '#091426' : 'transparent',
                color: activeTab === 'schedule' ? 'white' : '#64748b'
              }}
            >
              Horario Laboral
            </button>
            <button 
              onClick={() => setActiveTab('holidays')}
              style={{ 
                padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === 'holidays' ? '#091426' : 'transparent',
                color: activeTab === 'holidays' ? 'white' : '#64748b'
              }}
            >
              Días Festivos
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando...</div>
            ) : activeTab === 'schedule' ? (
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>Horario Semanal</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {schedules.map((s, index) => (
                    <div key={s.dayOfWeek} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ width: '100px', fontWeight: '600', color: '#334155' }}>
                        {dayNames[s.dayOfWeek]}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', width: '120px' }}>
                        <input type="checkbox" checked={s.isWorking} onChange={(e) => updateScheduleDay(index, { isWorking: e.target.checked })} />
                        Laborable
                      </label>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, opacity: s.isWorking ? 1 : 0.4, pointerEvents: s.isWorking ? 'auto' : 'none' }}>
                        <input type="time" value={s.startTime} onChange={(e) => updateScheduleDay(index, { startTime: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        <span>a</span>
                        <input type="time" value={s.endTime} onChange={(e) => updateScheduleDay(index, { endTime: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Descripción</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.length > 0 ? holidays.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{new Date(h.date).toLocaleDateString('es-MX')}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{h.description}</td>
                      <td style={{ padding: '16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => openEditHoliday(h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}>
                          <Icon name="Edit2" size="sm" />
                        </button>
                        <button onClick={() => setConfirmDeleteId(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                          <Icon name="Trash2" size="sm" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay días festivos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={showAddHoliday}
        onClose={closeHolidayModal}
        title={editingHolidayId ? "Editar Día Festivo" : "Agregar Día Festivo"}
        maxWidth="400px"
        footer={
          <>
            <SecondaryButton onClick={closeHolidayModal}>Cancelar</SecondaryButton>
            <PrimaryButton onClick={handleSaveHoliday}>Guardar</PrimaryButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Fecha</label>
            <input 
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Descripción</label>
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

    </div>
  );
};

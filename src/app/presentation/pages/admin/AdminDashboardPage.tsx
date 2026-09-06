import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Icon,
  AppointmentCard,
  SkeletonCard,
  DashboardFilters,
  WeeklyCalendar,
  AppointmentDetailDrawer,
  ApproveAppointmentModal,
  RejectAppointmentModal,
  RescheduleAppointmentModal,
  ApproveRescheduledModal,
  CancelApprovedModal,
  AddAppointmentModal,
  CompleteAppointmentModal,
  DirectReceptionModal,
  PageLayout,
  AlertModal,
  Box,
  Flex,
  Stack,
  Heading,
  Text,
  PrimaryButton,
  SecondaryButton,
} from '@/app/presentation/components';
import { STATUS_LABELS } from '@/core/constants';
import { useAuthStore } from '@/app/presentation/stores';
import { useAdminDashboardStore } from '@/app/presentation/stores';
import { formatScheduledAt } from '@/core/utils/formatters/formatScheduledAt';
import { MODULE_THEMES } from '@/core';
import { adminRepository as adminRepo, clientPortalRepository as clientRepo } from '@/core/di/container';
import type { AdminAppointment, AdminMaintenanceOrder, Holiday, WorkingHours, BusySlot } from '@/app/domain';


const FILTER_TABS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rescheduled', label: 'Reagendadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

// --- Main Dashboard Page ---

export interface AdminDashboardPageProps {
  onLogout: () => void;
}

import { useShallow } from 'zustand/react/shallow';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const {
    appointments,
    loading,
    error,
    statusFilter,
    branchFilter,
    searchValue,
    updatingId,
    toasts,
    activeModal,
    selectedAppt,
    modalMessage,
    isMessageEdited,
    rejectionReason,
    suggestedSchedules,
    newSuggestionDate,
    newSuggestionTime,
    finalDate,
    finalTime,
    occupiedSlots,
    occupiedLoading,
    viewType,
    timelineAppointments,
    timelineLoading,
    currentWeekRefDate,
    selectedTimelineAppt,
    setAppointments,
    setLoading,
    setError,
    setStatusFilter,
    setBranchFilter,
    setSearchValue,
    setUpdatingId,
    addToast,
    setActiveModal,
    setSelectedAppt,
    setModalMessage,
    setIsMessageEdited,
    setRejectionReason,
    setSuggestedSchedules,
    setNewSuggestionDate,
    setNewSuggestionTime,
    setFinalDate,
    setFinalTime,
    setOccupiedSlots,
    setOccupiedLoading,
    setViewType,
    setTimelineAppointments,
    setTimelineLoading,
    setCurrentWeekRefDate,
    setSelectedTimelineAppt,
    updateAppointmentInStates,
  } = useAdminDashboardStore(
    useShallow((s) => ({
      appointments: s.appointments,
      loading: s.loading,
      error: s.error,
      statusFilter: s.statusFilter,
      branchFilter: s.branchFilter,
      searchValue: s.searchValue,
      updatingId: s.updatingId,
      toasts: s.toasts,
      activeModal: s.activeModal,
      selectedAppt: s.selectedAppt,
      modalMessage: s.modalMessage,
      isMessageEdited: s.isMessageEdited,
      rejectionReason: s.rejectionReason,
      suggestedSchedules: s.suggestedSchedules,
      newSuggestionDate: s.newSuggestionDate,
      newSuggestionTime: s.newSuggestionTime,
      finalDate: s.finalDate,
      finalTime: s.finalTime,
      occupiedSlots: s.occupiedSlots,
      occupiedLoading: s.occupiedLoading,
      viewType: s.viewType,
      timelineAppointments: s.timelineAppointments,
      timelineLoading: s.timelineLoading,
      currentWeekRefDate: s.currentWeekRefDate,
      selectedTimelineAppt: s.selectedTimelineAppt,
      setAppointments: s.setAppointments,
      setLoading: s.setLoading,
      setError: s.setError,
      setStatusFilter: s.setStatusFilter,
      setBranchFilter: s.setBranchFilter,
      setSearchValue: s.setSearchValue,
      setUpdatingId: s.setUpdatingId,
      addToast: s.addToast,
      setActiveModal: s.setActiveModal,
      setSelectedAppt: s.setSelectedAppt,
      setModalMessage: s.setModalMessage,
      setIsMessageEdited: s.setIsMessageEdited,
      setRejectionReason: s.setRejectionReason,
      setSuggestedSchedules: s.setSuggestedSchedules,
      setNewSuggestionDate: s.setNewSuggestionDate,
      setNewSuggestionTime: s.setNewSuggestionTime,
      setFinalDate: s.setFinalDate,
      setFinalTime: s.setFinalTime,
      setOccupiedSlots: s.setOccupiedSlots,
      setOccupiedLoading: s.setOccupiedLoading,
      setViewType: s.setViewType,
      setTimelineAppointments: s.setTimelineAppointments,
      setTimelineLoading: s.setTimelineLoading,
      setCurrentWeekRefDate: s.setCurrentWeekRefDate,
      setSelectedTimelineAppt: s.setSelectedTimelineAppt,
      updateAppointmentInStates: s.updateAppointmentInStates,
    }))
  );

  const [alertState, setAlertState] = React.useState<{ isOpen: boolean; title: string; message: string; isError: boolean }>({
    isOpen: false, title: '', message: '', isError: false
  });

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUnauthorized = useCallback(() => {
    clearAuth();
    onLogout();
  }, [clearAuth, onLogout]);

  const handleCompleteClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setActiveModal('complete');
  };

  const handleCompleteConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      await adminRepo.updateAppointment(accessToken, selectedAppt.id, {
        status: 'completed',
      });
      updateAppointmentInStates(selectedAppt.id, { status: 'completed' });
      addToast('success', 'Cita completada exitosamente.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const [isDirectReceptionOpen, setIsDirectReceptionOpen] = React.useState(false);

  const handleCheckInClick = async (
    appt: AdminAppointment,
    checkInData?: { serviceRequested?: string; laborCost?: number; receptionNotes?: string; notes?: string }
  ) => {
    if (!accessToken) return;
    setUpdatingId(appt.id);
    try {
      const result = await adminRepo.checkInAppointment(accessToken, appt.id, checkInData?.receptionNotes);

      if (checkInData) {
        if (checkInData.serviceRequested || checkInData.notes || checkInData.receptionNotes) {
          await adminRepo.updateAppointment(accessToken, appt.id, {
            serviceRequested: checkInData.serviceRequested,
            notes: checkInData.notes,
            receptionNotes: checkInData.receptionNotes,
          }).catch(() => {});
        }
        const maintId = result?.maintenance?.id;
        if (maintId) {
          await adminRepo.updateMaintenance(accessToken, maintId, {
            laborCost: checkInData.laborCost ?? 0,
            notes: checkInData.notes || checkInData.serviceRequested,
            receptionNotes: checkInData.receptionNotes,
          }).catch(() => {});
        }
      }

      updateAppointmentInStates(appt.id, {
        status: 'completed',
        serviceRequested: checkInData?.serviceRequested ?? appt.serviceRequested,
        notes: checkInData?.notes ?? appt.notes,
        receptionNotes: checkInData?.receptionNotes ?? appt.receptionNotes,
      });
      addToast('success', `Vehículo recibido en taller para ${appt.customerName}. Orden de mantenimiento activada.`);
      if (selectedTimelineAppt?.id === appt.id) {
        setSelectedTimelineAppt(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al recibir vehículo';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDirectReceptionSuccess = (order: AdminMaintenanceOrder) => {
    addToast('success', `Vehículo recibido: ${order.vehicle.brand} ${order.vehicle.model} ingresado al taller.`);
    if (viewType === 'list') {
      fetchAppointments();
    } else {
      fetchTimelineAppointments();
    }
  };

  const fetchAppointments = useCallback(
    async (search?: string) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const querySearch = typeof search === 'string' ? search : searchValue;
        const data = await adminRepo.getAppointments(accessToken, {
          status: statusFilter,
          search: querySearch.trim() || undefined,
        });
        setAppointments(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        if (msg === 'UNAUTHORIZED') {
          handleUnauthorized();
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, statusFilter, searchValue, handleUnauthorized, setAppointments, setError, setLoading]
  );

  const isFirstSearchRender = useRef(true);

  // Fetch when statusFilter or viewType changes
  useEffect(() => {
    if (viewType === 'list') {
      fetchAppointments(searchValue);
    }
  }, [statusFilter, viewType]);

  // Debounced search when searchValue changes (skips initial mount)
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    if (viewType !== 'list') return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchAppointments(searchValue);
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchValue]);

  // Debounced search input handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const getUTCMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mondayLocal = new Date(date.setDate(diff));
    return new Date(Date.UTC(mondayLocal.getFullYear(), mondayLocal.getMonth(), mondayLocal.getDate()));
  };

  const formatDateStr = (d: Date) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchTimelineAppointments = useCallback(async () => {
    if (!accessToken) return;
    setTimelineLoading(true);
    try {
      const monday = getUTCMonday(currentWeekRefDate);
      const saturday = new Date(monday);
      saturday.setUTCDate(monday.getUTCDate() + 5);

      const data = await adminRepo.getAppointmentsTimeline(
        accessToken,
        formatDateStr(monday),
        formatDateStr(saturday)
      );
      setTimelineAppointments(data);
    } catch (err: unknown) {
      console.error('Error fetching timeline:', err);
      addToast('error', 'Error al cargar el cronograma de citas');
    } finally {
      setTimelineLoading(false);
    }
  }, [accessToken, currentWeekRefDate, addToast, setTimelineAppointments, setTimelineLoading]);

  useEffect(() => {
    if (viewType === 'calendar') {
      fetchTimelineAppointments();
    }
  }, [viewType, currentWeekRefDate, fetchTimelineAppointments]);

  // Global Keyboard shortcuts: Alt+W (Direct Reception), Alt+N (Add Appt), Alt+R (Refresh), Alt+1 (List), Alt+2 (Calendar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        setIsDirectReceptionOpen(true);
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setActiveModal('addAppointment');
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (viewType === 'list') {
          fetchAppointments();
        } else {
          fetchTimelineAppointments();
        }
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        setViewType('list');
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setViewType('calendar');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewType, fetchAppointments, fetchTimelineAppointments, setActiveModal]);



  // Helper to load occupied slots
  const loadSlots = async () => {
    setOccupiedLoading(true);
    try {
      const today = new Date();
      const futureLimit = new Date();
      futureLimit.setDate(today.getDate() + 14);
      const formatDateStr = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      const slots = await clientRepo.getOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
      setOccupiedSlots(slots);
    } catch (err) {
      console.error('Error fetching occupied slots:', err);
    } finally {
      setOccupiedLoading(false);
    }
  };

  // Generate WhatsApp Time format (12h)
  const format12h = (t: string) => {
    if (!t) return '';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mStr} ${ampm}`;
  };

  const formatSpanishDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const dateObj = new Date(dateStr + 'T00:00:00Z');
      return dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  // Trigger click handlers
  const handleApproveClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);

    if (appt.status === 'rescheduled') {
      setActiveModal('approveRescheduled');
      // Set default values from current appt
      const dateObj = new Date(appt.scheduledAt);
      const yyyy = dateObj.getUTCFullYear();
      const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getUTCDate()).padStart(2, '0');
      setFinalDate(`${yyyy}-${mm}-${dd}`);
      const hh = String(dateObj.getUTCHours()).padStart(2, '0');
      const min = String(dateObj.getUTCMinutes()).padStart(2, '0');
      setFinalTime(`${hh}:${min}`);

      // Load slots for the validation helper
      loadSlots();
    } else {
      setActiveModal('approve');
      const { date, time, period } = formatScheduledAt(appt.scheduledAt);
      const displayTime = `${time} ${period}`;
      const customer = appt.customerName;
      const vehicleStr = appt.vehicle
        ? `${appt.vehicle.brand} ${appt.vehicle.model} (${appt.vehicle.year})`
        : 'Gen\u00E9rico';
      const serialStr = appt.vehicle?.serialNumberLastFour || 'N/A';

      let msg = `*CONFIRMACI\u00D3N DE CITA*\n\nHola *${customer}*, te confirmamos que tu cita ha sido aprobada.\n\n*Detalles de la cita:*\n- *Fecha:* ${date}\n- *Hora:* ${displayTime}\n- *Veh\u00EDculo:* ${vehicleStr} (Serie: ${serialStr})\n- *Servicio:* ${appt.serviceRequested}\n- *Nota:* Debe llevar p\u00F3liza de garant\u00EDa, factura o carta factura (original, foto o copia).`;
      if (appt.branchName === 'Nova FV Sucursal Uman') {
        msg += `\n- *Ubicaci\u00F3n:* https://maps.app.goo.gl/uxoSts8ZdXMNM3To6?g_st=ic`;
      }
      msg += `\n\nTe esperamos en el taller. Si tienes alguna duda o contratiempo, por favor responde a este mensaje.`;
      setModalMessage(msg);
    }
  };

  const handleRejectClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);
    setRejectionReason('');
    setActiveModal('reject');

    const { date, time, period } = formatScheduledAt(appt.scheduledAt);
    const displayTime = `${time} ${period}`;

    const msg = `*CANCELACI\u00D3N DE CITA*\n\nHola *${appt.customerName}*, lamentamos informarte que no podemos agendar tu cita solicitada para el d\u00EDa ${date} a las ${displayTime}.\n\n*Motivo:* [Escribe el motivo del rechazo]\n\nTe sugerimos solicitar una nueva cita con un horario alternativo a trav\u00E9s de nuestro portal. Agradecemos tu comprensi\u00F3n.`;
    setModalMessage(msg);
  };

  const handleRescheduleClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);
    setSuggestedSchedules([]);
    setActiveModal('reschedule');

    // Set default suggestion date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setNewSuggestionDate(`${yyyy}-${mm}-${dd}`);
    setNewSuggestionTime('09:00');

    // Load slots for helper
    loadSlots();
  };

  const handleCancelClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setActiveModal('cancelApproved');
  };

  const handleRescheduleApprovedClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);
    setActiveModal('approveRescheduled');

    // Set default values from current appt
    const dateObj = new Date(appt.scheduledAt);
    const yyyy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getUTCDate()).padStart(2, '0');
    setFinalDate(`${yyyy}-${mm}-${dd}`);
    const hh = String(dateObj.getUTCHours()).padStart(2, '0');
    const min = String(dateObj.getUTCMinutes()).padStart(2, '0');
    setFinalTime(`${hh}:${min}`);

    // Load slots for the validation helper
    loadSlots();
  };

  // Re-generate reject message when reason changes (if not custom edited)
  useEffect(() => {
    if (activeModal === 'reject' && selectedAppt && !isMessageEdited) {
      const { date, time, period } = formatScheduledAt(selectedAppt.scheduledAt);
      const displayTime = `${time} ${period}`;
      const reasonText = rejectionReason.trim() ? rejectionReason : '[Escribe el motivo del rechazo]';

      const msg = `*CANCELACI\u00D3N DE CITA*\n\nHola *${selectedAppt.customerName}*, lamentamos informarte que no podemos agendar tu cita solicitada para el d\u00EDa ${date} a las ${displayTime}.\n\n*Motivo:* ${reasonText}\n\nTe sugerimos solicitar una nueva cita con un horario alternativo a trav\u00E9s de nuestro portal. Agradecemos tu comprensi\u00F3n.`;
      setModalMessage(msg);
    }
  }, [rejectionReason, activeModal, selectedAppt, isMessageEdited, setModalMessage]);

  // Re-generate reschedule message when suggestions change (if not custom edited)
  useEffect(() => {
    if (activeModal === 'reschedule' && selectedAppt && !isMessageEdited) {
      const { date, time, period } = formatScheduledAt(selectedAppt.scheduledAt);
      const displayTime = `${time} ${period}`;

      let suggestionsListText = '[Elige una o m\u00E1s fechas y horarios abajo para sugerir]';
      if (suggestedSchedules.length > 0) {
        suggestionsListText = suggestedSchedules.map((s, idx) => {
          const dateFmt = formatSpanishDate(s.date);
          const timeFmt = format12h(s.time);
          return `- *Opci\u00F3n ${idx + 1}:* ${dateFmt.charAt(0).toUpperCase() + dateFmt.slice(1)} a las ${timeFmt}`;
        }).join('\n');
      }

      const msg = `*PROPUESTA DE REAGENDACI\u00D3N*\n\nHola *${selectedAppt.customerName}*, el horario solicitado originalmente para tu cita (${date} a las ${displayTime}) no est\u00E1 disponible.\n\nTe sugerimos las siguientes opciones alternativas:\n\n${suggestionsListText}\n\nPor favor, responde a este mensaje indic\u00E1ndonos cu\u00E1l de estas opciones prefieres para confirmar tu espacio. Muchas gracias.`;
      setModalMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedSchedules, activeModal, selectedAppt, isMessageEdited]);

  // Re-generate rescheduled approval message when date/time changes (if not custom edited)
  useEffect(() => {
    if (activeModal === 'approveRescheduled' && selectedAppt && !isMessageEdited) {
      const dateFmt = formatSpanishDate(finalDate);
      const timeFmt = format12h(finalTime);
      const displaySchedule = `${dateFmt} a las ${timeFmt}`;
      const customer = selectedAppt.customerName;
      const vehicleStr = selectedAppt.vehicle
        ? `${selectedAppt.vehicle.brand} ${selectedAppt.vehicle.model} (${selectedAppt.vehicle.year})`
        : 'Gen\u00E9rico';
      const serialStr = selectedAppt.vehicle?.serialNumberLastFour || 'N/A';

      let msg = `*CONFIRMACI\u00D3N DE CITA*\n\nHola *${customer}*, te confirmamos que tu cita ha sido reagendada y aprobada.\n\n*Detalles de la cita:*\n- *Fecha y Hora:* ${displaySchedule.charAt(0).toUpperCase() + displaySchedule.slice(1)}\n- *Veh\u00EDculo:* ${vehicleStr} (Serie: ${serialStr})\n- *Servicio:* ${selectedAppt.serviceRequested}\n- *Nota:* Debe llevar p\u00F3liza de garant\u00EDa, factura o carta factura (original, foto o copia).`;
      if (selectedAppt.branchName === 'Nova FV Sucursal Uman') {
        msg += `\n- *Ubicaci\u00F3n:* https://maps.app.goo.gl/uxoSts8ZdXMNM3To6?g_st=ic`;
      }
      msg += `\n\nTe esperamos en el taller. Si tienes alguna duda o contratiempo, por favor responde a este mensaje.`;
      setModalMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalDate, finalTime, activeModal, selectedAppt, isMessageEdited]);

  // Handle addition of suggestion
  const handleAddSuggestion = () => {
    if (!newSuggestionDate || !newSuggestionTime) return;
    // Prevent duplicate suggestions
    const exists = suggestedSchedules.some(s => s.date === newSuggestionDate && s.time === newSuggestionTime);
    if (!exists) {
      setSuggestedSchedules(prev => [...prev, { date: newSuggestionDate, time: newSuggestionTime }]);
    }
  };

  const handleRemoveSuggestion = (idx: number) => {
    setSuggestedSchedules(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Operations
  const openWhatsApp = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const handleApproveConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      await adminRepo.approveAppointment(accessToken, selectedAppt.id, modalMessage);
      updateAppointmentInStates(selectedAppt.id, { status: 'approved' });
      addToast('success', 'Cita aprobada y abriendo WhatsApp.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    if (!rejectionReason.trim()) {
      setAlertState({ isOpen: true, title: 'Atención', message: 'Debes indicar el motivo del rechazo.', isError: true });
      return;
    }
    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      await adminRepo.rejectAppointment(accessToken, selectedAppt.id, modalMessage);
      updateAppointmentInStates(selectedAppt.id, { status: 'rejected' });
      addToast('success', 'Cita rechazada y abriendo WhatsApp.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    if (suggestedSchedules.length === 0) {
      setAlertState({ isOpen: true, title: 'Atención', message: 'Debes añadir al menos una fecha y horario sugerido.', isError: true });
      return;
    }

    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      // Send first suggestion in scheduledAt field as ISO
      const firstSug = suggestedSchedules[0];
      const isoString = `${firstSug.date}T${firstSug.time}:00.000Z`;
      const originalDuration = selectedAppt.duration || 90;

      await adminRepo.rescheduleAppointment(accessToken, selectedAppt.id, isoString, originalDuration, modalMessage);

      updateAppointmentInStates(selectedAppt.id, { status: 'rescheduled', scheduledAt: isoString });
      addToast('success', 'Propuesta de reagendación registrada.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveRescheduledConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    if (!finalDate || !finalTime) return;

    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      // Convert selected date/time to ISO format
      const finalIso = `${finalDate}T${finalTime}:00.000Z`;

      // Step 1: Update the appointment schedule
      await adminRepo.updateAppointment(accessToken, selectedAppt.id, {
        scheduledAt: finalIso,
      });

      // Step 2: Approve the appointment and send the WhatsApp message
      await adminRepo.approveAppointment(accessToken, selectedAppt.id, modalMessage);

      updateAppointmentInStates(selectedAppt.id, { status: 'approved', scheduledAt: finalIso });
      addToast('success', 'Cita reagendada aprobada y abriendo WhatsApp.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelApprovedConfirm = async () => {
    if (!accessToken || !selectedAppt) return;

    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      // Update appointment status to cancelled
      await adminRepo.updateAppointment(accessToken, selectedAppt.id, {
        status: 'cancelled',
      });

      updateAppointmentInStates(selectedAppt.id, { status: 'cancelled' });
      addToast('success', 'Cita cancelada exitosamente.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Generate visual helper list for occupied dates
  const occupiedList = useMemo(() => {
    if (!occupiedSlots) return [];

    const list = [];
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(todayUTC.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = nextDate.getUTCFullYear();
      const mm = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getUTCDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Format day name in Spanish
      const dayLabel = nextDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

      // Check Holiday
      const holiday = occupiedSlots.holidays.find((h: Holiday) => h.date === dateString);
      // Check non-working day
      const dayOfWeek = nextDate.getUTCDay();
      const isNonWorking = occupiedSlots.nonWorkingDaysOfWeek.includes(dayOfWeek);
      const schedule = occupiedSlots.workingHours.find((w: WorkingHours) => w.dayOfWeek === dayOfWeek);
      const isClosed = isNonWorking || (schedule && !schedule.isWorking);

      // Busy slots for this date
      const busyTimes = occupiedSlots.busySlots
        .filter((b: BusySlot) => b.date === dateString)
        .map((b: BusySlot) => `${b.startTime} - ${b.endTime}`);

      list.push({
        dateStr: dateString,
        dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        isClosed: !!isClosed,
        closedReason: holiday ? holiday.description : 'Cerrado',
        busyTimes,
      });
    }
    return list;
  }, [occupiedSlots]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    appointments.forEach((a) => {
      if (a.branchName) {
        branches.add(a.branchName);
      }
    });
    return Array.from(branches);
  }, [appointments]);

  const visibleAppointments = useMemo(() => {
    let filtered = statusFilter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

    if (branchFilter !== 'all') {
      filtered = filtered.filter((a) => a.branchName === branchFilter);
    }
    return filtered;
  }, [appointments, statusFilter, branchFilter]);



  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  // Generate 15min incremental time slots option list (e.g. from 8:00 to 18:00)
  const timeSlotOptions = useMemo(() => {
    const slots = [];
    let minutes = 8 * 60; // 8:00 AM
    const endMinutes = 18 * 60; // 6:00 PM

    while (minutes <= endMinutes) {
      const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
      const mm = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      minutes += 15;
    }
    return slots;
  }, []);

  return (
    <PageLayout userName={user?.name || 'Admin'}>
        {/* Top Bar */}
        <DashboardFilters
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          branchFilter={branchFilter}
          onBranchChange={setBranchFilter}
          uniqueBranches={uniqueBranches}
          viewType={viewType}
          onViewTypeChange={setViewType}
          pendingCount={pendingCount}
          onAddClick={() => setActiveModal('addAppointment')}
          onDirectReceptionClick={() => setIsDirectReceptionOpen(true)}
          onRefreshClick={() => (viewType === 'list' ? fetchAppointments() : fetchTimelineAppointments())}
        />

        {/* Content */}
        <Box as="main" className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Page header */}
          <Box>
            <Flex align="center" gap="sm" className="mb-1">
              <Box className={`w-8 h-8 rounded-DEFAULT ${MODULE_THEMES.appointments.bgSoft} ${MODULE_THEMES.appointments.text} flex items-center justify-center`}>
                <Icon name={MODULE_THEMES.appointments.icon} size="sm" />
              </Box>
              <Heading level={2} className="font-bold tracking-tight">
                {MODULE_THEMES.appointments.title}
              </Heading>
            </Flex>
            <Text variant="muted" size="sm">
              {MODULE_THEMES.appointments.subtitle}
            </Text>
          </Box>

          {viewType === 'list' ? (
            <>
              {/* Status Filter Tabs */}
              <Flex gap="xs" className="overflow-x-auto pb-1 no-scrollbar">
                {FILTER_TABS.map((tab) => (
                  <SecondaryButton
                    key={tab.value}
                    size="xs"
                    color={statusFilter === tab.value ? 'primary' : 'default'}
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </SecondaryButton>
                ))}
              </Flex>

              {/* Content area */}
              {loading ? (
                <Stack spacing="sm">
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </Stack>
              ) : error ? (
                <Box bg="base-100" rounded="DEFAULT" className="border border-error/30 p-6 shadow-xs">
                  <Flex align="center" justify="between" className="flex-wrap gap-3">
                    <Flex align="center" gap="sm">
                      <Icon name="AlertTriangle" size="md" className="text-error" />
                      <Box>
                        <Heading level={4} className="text-error">
                          Error al cargar las citas
                        </Heading>
                        <Text size="sm" variant="muted">
                          {error}
                        </Text>
                      </Box>
                    </Flex>
                    <PrimaryButton size="sm" color="error" onClick={() => fetchAppointments()}>
                      Reintentar
                    </PrimaryButton>
                  </Flex>
                </Box>
              ) : visibleAppointments.length === 0 ? (
                <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 p-12 text-center">
                  <Box className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
                    <Icon name="CalendarOff" size="lg" />
                  </Box>
                  <Heading level={3} className="text-base font-bold mb-1">
                    Sin citas
                  </Heading>
                  <Text size="sm" variant="muted" className="max-w-sm mx-auto">
                    {searchValue
                      ? `No se encontraron citas para "${searchValue}"`
                      : `No hay citas con estado "${STATUS_LABELS[statusFilter] ?? statusFilter}"`}
                  </Text>
                </Box>
              ) : (
                <Stack spacing="sm">
                  {visibleAppointments.map((appt: AdminAppointment) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onApproveClick={handleApproveClick}
                      onRejectClick={handleRejectClick}
                      onRescheduleClick={handleRescheduleClick}
                      onCancelClick={handleCancelClick}
                      onRescheduleApprovedClick={handleRescheduleApprovedClick}
                      onCompleteClick={handleCompleteClick}
                      onCheckInClick={(appointment) => setSelectedTimelineAppt(appointment)}
                      onCardClick={setSelectedTimelineAppt}
                      updating={updatingId === appt.id}
                    />
                  ))}
                  <Text size="xs" variant="muted" className="text-center pt-2 block">
                    {visibleAppointments.length} cita{visibleAppointments.length !== 1 ? 's' : ''} mostrada{visibleAppointments.length !== 1 ? 's' : ''}
                  </Text>
                </Stack>
              )}
            </>
          ) : (
            <WeeklyCalendar
              timelineAppointments={timelineAppointments}
              timelineLoading={timelineLoading}
              currentWeekRefDate={currentWeekRefDate}
              onWeekRefDateChange={setCurrentWeekRefDate}
              onAppointmentClick={setSelectedTimelineAppt}
              branchFilter={branchFilter}
              searchValue={searchValue}
            />
          )}
        </Box>

      {/* --- MODALS --- */}

      <ApproveAppointmentModal
        isOpen={activeModal === 'approve'}
        appt={selectedAppt}
        onClose={() => setActiveModal(null)}
        modalMessage={modalMessage}
        onMessageChange={(val) => {
          setModalMessage(val);
          setIsMessageEdited(true);
        }}
        onConfirm={handleApproveConfirm}
        updating={updatingId === selectedAppt?.id}
      />

      <RejectAppointmentModal
        isOpen={activeModal === 'reject'}
        appt={selectedAppt}
        onClose={() => setActiveModal(null)}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        modalMessage={modalMessage}
        onMessageChange={(val) => {
          setModalMessage(val);
          setIsMessageEdited(true);
        }}
        onConfirm={handleRejectConfirm}
        updating={updatingId === selectedAppt?.id}
      />

      <RescheduleAppointmentModal
        isOpen={activeModal === 'reschedule'}
        appt={selectedAppt}
        onClose={() => setActiveModal(null)}
        occupiedLoading={occupiedLoading}
        occupiedList={occupiedList}
        newSuggestionDate={newSuggestionDate}
        onNewSuggestionDateChange={setNewSuggestionDate}
        newSuggestionTime={newSuggestionTime}
        onNewSuggestionTimeChange={setNewSuggestionTime}
        timeSlotOptions={timeSlotOptions}
        format12h={format12h}
        handleAddSuggestion={handleAddSuggestion}
        suggestedSchedules={suggestedSchedules}
        handleRemoveSuggestion={handleRemoveSuggestion}
        modalMessage={modalMessage}
        onMessageChange={(val) => {
          setModalMessage(val);
          setIsMessageEdited(true);
        }}
        onConfirm={handleRescheduleConfirm}
        updating={updatingId === selectedAppt?.id}
      />

      <ApproveRescheduledModal
        isOpen={activeModal === 'approveRescheduled'}
        appt={selectedAppt}
        onClose={() => setActiveModal(null)}
        finalDate={finalDate}
        onFinalDateChange={setFinalDate}
        finalTime={finalTime}
        onFinalTimeChange={setFinalTime}
        timeSlotOptions={timeSlotOptions}
        format12h={format12h}
        occupiedSlots={occupiedSlots}
        occupiedList={occupiedList}
        modalMessage={modalMessage}
        onMessageChange={(val) => {
          setModalMessage(val);
          setIsMessageEdited(true);
        }}
        onConfirm={handleApproveRescheduledConfirm}
        updating={updatingId === selectedAppt?.id}
      />

      <CancelApprovedModal
        isOpen={activeModal === 'cancelApproved'}
        appt={selectedAppt}
        onClose={() => setActiveModal(null)}
        onConfirm={handleCancelApprovedConfirm}
        updating={updatingId === selectedAppt?.id}
      />

      <CompleteAppointmentModal
        isOpen={activeModal === 'complete'}
        appt={selectedAppt}
        onClose={() => setActiveModal(null)}
        onConfirm={handleCompleteConfirm}
        updating={updatingId === selectedAppt?.id}
      />

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        message={alertState.message}
        isError={alertState.isError}
      />

      <AddAppointmentModal
        isOpen={activeModal === 'addAppointment'}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchAppointments}
      />

      <DirectReceptionModal
        isOpen={isDirectReceptionOpen}
        onClose={() => setIsDirectReceptionOpen(false)}
        onSuccess={handleDirectReceptionSuccess}
      />

      <AppointmentDetailDrawer
        appt={selectedTimelineAppt}
        onClose={() => setSelectedTimelineAppt(null)}
        onApproveClick={handleApproveClick}
        onRejectClick={handleRejectClick}
        onRescheduleClick={handleRescheduleClick}
        onCompleteClick={handleCompleteClick}
        onCheckInClick={handleCheckInClick}
        onRescheduleApprovedClick={handleRescheduleApprovedClick}
        onCancelClick={handleCancelClick}
      />

      {/* Toasts */}
      <Box className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Box
            key={toast.id}
            bg="neutral"
            rounded="DEFAULT"
            className="p-3.5 shadow-xl border border-neutral-content/20 pointer-events-auto flex items-center gap-2 text-xs font-semibold text-neutral-content animate-in fade-in"
          >
            <Icon
              name={toast.type === 'success' ? 'CheckCircle' : 'AlertCircle'}
              size="sm"
              className={toast.type === 'success' ? 'text-success' : 'text-error'}
            />
            {toast.message}
          </Box>
        ))}
      </Box>
    </PageLayout>
  );

};

export default AdminDashboardPage;

import React, { useCallback, useEffect, useMemo, useRef, } from 'react';
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
  Sidebar,
  STATUS_LABELS,
} from '@/app/presentation/components';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { useAdminDashboardStore } from '@/core/stores/useAdminDashboardStore';
import { formatScheduledAt } from '@/core/utils/formatScheduledAt';
import { APIAdminRepository } from '@/app/data/repositories/APIAdminRepository';
import { APIClientPortalRepository } from '@/app/data/repositories/APIClientPortalRepository';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

const adminRepo = new APIAdminRepository();
const clientRepo = new APIClientPortalRepository();


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

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  const { user, accessToken, clearAuth } = useAuthStore();
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
  } = useAdminDashboardStore();

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

  const fetchAppointments = useCallback(
    async (search?: string) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await adminRepo.getAppointments(accessToken, {
          status: statusFilter,
          search: search ?? searchValue,
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
    [accessToken, statusFilter, searchValue, handleUnauthorized]
  );

  // Fetch on filter change
  useEffect(() => {
    if (viewType === 'list') {
      fetchAppointments(searchValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, viewType]);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (viewType === 'list') {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        fetchAppointments(val);
      }, 400);
    }
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
  }, [accessToken, currentWeekRefDate, addToast]);

  useEffect(() => {
    if (viewType === 'calendar') {
      fetchTimelineAppointments();
    }
  }, [viewType, currentWeekRefDate, fetchTimelineAppointments]);



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
  }, [rejectionReason, activeModal, selectedAppt, isMessageEdited]);

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
      alert('Debes indicar el motivo del rechazo.');
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
      alert('Debes añadir al menos una fecha y horario sugerido.');
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
      const holiday = occupiedSlots.holidays.find((h: any) => h.date === dateString);
      // Check non-working day
      const dayOfWeek = nextDate.getUTCDay();
      const isNonWorking = occupiedSlots.nonWorkingDaysOfWeek.includes(dayOfWeek);
      const schedule = occupiedSlots.workingHours.find((w: any) => w.dayOfWeek === dayOfWeek);
      const isClosed = isNonWorking || (schedule && !schedule.isWorking);

      // Busy slots for this date
      const busyTimes = occupiedSlots.busySlots
        .filter((b: any) => b.date === dateString)
        .map((b: any) => `${b.startTime} - ${b.endTime}`);

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
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      {/* Main area */}
      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          onRefreshClick={() => (viewType === 'list' ? fetchAppointments() : fetchTimelineAppointments())}
        />

        {/* Content */}
        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: '#091426',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              Gestión de Citas
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Administra las solicitudes de tus clientes y actualiza su estado.
            </p>
          </div>

          {viewType === 'list' ? (
            <>
              {/* Status Filter Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '4px',
                  marginBottom: '20px',
                  overflowX: 'auto',
                  flexWrap: 'nowrap',
                }}
              >
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '7px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.15s, color 0.15s',
                      background: statusFilter === tab.value ? '#091426' : 'transparent',
                      color: statusFilter === tab.value ? 'white' : '#64748b',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content area */}
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : error ? (
                <div
                  style={{
                    background: '#fff1f1',
                    border: '1px solid rgba(186,26,26,0.2)',
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Icon name="AlertTriangle" className="text-error" />
                  <div>
                    <p style={{ fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>Error al cargar las citas</p>
                    <p style={{ fontSize: '14px', color: '#7f1d1d' }}>{error}</p>
                  </div>
                  <button
                    onClick={() => fetchAppointments()}
                    style={{
                      marginLeft: 'auto',
                      background: '#991b1b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    Reintentar
                  </button>
                </div>
              ) : visibleAppointments.length === 0 ? (
                <div
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '56px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="CalendarOff" className="text-[#94a3b8]" />
                  </div>
                  <p style={{ fontWeight: '700', color: '#0b1c30', fontSize: '16px' }}>Sin citas</p>
                  <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
                    {searchValue
                      ? `No se encontraron citas para "${searchValue}"`
                      : `No hay citas con estado "${STATUS_LABELS[statusFilter] ?? statusFilter}"`}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {visibleAppointments.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onApproveClick={handleApproveClick}
                      onRejectClick={handleRejectClick}
                      onRescheduleClick={handleRescheduleClick}
                      onCancelClick={handleCancelClick}
                      onRescheduleApprovedClick={handleRescheduleApprovedClick}
                      onCompleteClick={handleCompleteClick}
                      updating={updatingId === appt.id}
                    />
                  ))}
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', paddingTop: '8px' }}>
                    {visibleAppointments.length} cita{visibleAppointments.length !== 1 ? 's' : ''} mostrada{visibleAppointments.length !== 1 ? 's' : ''}
                  </p>
                </div>
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
        </main>
      </div>

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

      <AddAppointmentModal
        isOpen={activeModal === 'addAppointment'}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchAppointments}
      />

      <AppointmentDetailDrawer
        appt={selectedTimelineAppt}
        onClose={() => setSelectedTimelineAppt(null)}
        onApproveClick={handleApproveClick}
        onRejectClick={handleRejectClick}
        onRescheduleClick={handleRescheduleClick}
        onCompleteClick={handleCompleteClick}
        onRescheduleApprovedClick={handleRescheduleApprovedClick}
        onCancelClick={handleCancelClick}
      />

      {/* Toasts */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: toast.type === 'success' ? '#091426' : '#dc2626',
              color: 'white',
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              fontSize: '14px',
              fontWeight: '600',
              animation: 'slideInRight 0.25s ease',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Icon name={toast.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size="sm" />
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

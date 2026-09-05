import React, { useEffect } from 'react';
import { useClientPortalStore } from '@/app/presentation/stores';
import {
  Box,
  Flex,
  Grid,
  TextInput,
  Select,
  Textarea,
  PrimaryButton,
  Icon,
  DateTimePicker,
} from '@/app/presentation/components';

export const AppointmentForm: React.FC = () => {
  const {
    bookingLoading,
    bookingSuccess,
    bookingError,
    loadOccupiedSlots,
    occupiedSlots,
    occupiedSlotsLoading,

    // Form state from store
    formCustomerName,
    formCustomerPhone,
    formCustomerEmail,
    formBrand,
    formModel,
    formYear,
    formSerialNumberLastFour,
    formServiceRequested,
    formSelectedDate,
    formSelectedTime,
    formNotes,
    formBranchId,
    formValidationError,
    branches,

    // Store Actions
    setFormField,
    submitBooking,
    resetForm,
    loadBranches,
  } = useClientPortalStore();

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Set default branch if only one or first branch available
  useEffect(() => {
    if (!formBranchId && branches.length > 0) {
      const defaultB = branches[0];
      setFormField('formBranchId', defaultB.id || defaultB._id || '');
    }
  }, [branches, formBranchId, setFormField]);

  // Load occupied slots whenever formBranchId changes
  useEffect(() => {
    if (!formBranchId) return;

    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 30);

    const formatDateStr = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    loadOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
  }, [formBranchId, loadOccupiedSlots]);

  // Clean booking state on unmount
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const handleReset = () => {
    resetForm();

    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 30);
    const formatDateStr = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    loadOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitBooking();
    } catch {
      // Handled by store
    }
  };

  if (bookingSuccess) {
    const format12h = (t: string) => {
      if (!t) return '';
      const [hStr, mStr] = t.split(':');
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'p.m.' : 'a.m.';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return `${displayHour}:${mStr} ${ampm}`;
    };

    const formattedDate = () => {
      if (!formSelectedDate) return '';
      const dateObj = new Date(formSelectedDate + 'T00:00:00Z');
      return dateObj.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      });
    };

    return (
      <Box className="p-6 bg-base-100 border border-base-300 rounded-xl text-center space-y-4 shadow-sm animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-full bg-success/15 border border-success/30 text-success flex items-center justify-center mx-auto">
          <Icon name="CheckCircle2" size="lg" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-base-content m-0">¡Cita Solicitada con Éxito!</h3>
          <p className="text-xs text-base-content/60 mt-1">
            Tu solicitud ha sido recibida y se encuentra en estado de revisión.
          </p>
        </div>

        <div className="bg-base-200/60 border border-base-300 rounded-xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-base-300/50">
            <span className="text-base-content/60 font-medium">Fecha y Hora</span>
            <span className="font-bold text-base-content capitalize">
              {formattedDate()} {formSelectedTime ? `• ${format12h(formSelectedTime)}` : ''}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-base-300/50">
            <span className="text-base-content/60 font-medium">Cliente</span>
            <span className="font-semibold text-base-content">{formCustomerName || 'No especificado'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-base-300/50">
            <span className="text-base-content/60 font-medium">Vehículo</span>
            <span className="font-semibold text-base-content">
              {formBrand || 'Genérico'} {formModel} ({formSerialNumberLastFour})
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-base-content/60 font-medium">Servicio Solicitado</span>
            <span className="font-semibold text-primary">{formServiceRequested}</span>
          </div>
        </div>

        <PrimaryButton onClick={handleReset} size="md" className="w-full">
          Agendar Otra Cita
        </PrimaryButton>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
      {formValidationError && (
        <Box className="p-3 bg-error/10 border border-error/30 rounded-lg">
          <Flex align="center" gap="xs">
            <Icon name="AlertTriangle" size="xs" className="text-error shrink-0" />
            <span className="text-xs font-medium text-error">{formValidationError}</span>
          </Flex>
        </Box>
      )}

      {bookingError && (
        <Box className="p-3 bg-error/10 border border-error/30 rounded-lg">
          <Flex align="center" gap="xs">
            <Icon name="AlertCircle" size="xs" className="text-error shrink-0" />
            <span className="text-xs font-medium text-error">{bookingError}</span>
          </Flex>
        </Box>
      )}

      {/* SECTION 1: Cliente y Sucursal */}
      <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
        <Flex align="center" gap="sm">
          <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
            1
          </Box>
          <span className="text-sm font-semibold text-base-content">
            Datos del Cliente y Sucursal
          </span>
        </Flex>

        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Sucursal *</label>
          <Select
            size="md"
            value={formBranchId}
            onChange={(e) => setFormField('formBranchId', e.target.value)}
            disabled={bookingLoading || branches.length === 0}
            className="w-full"
            options={
              branches.length > 0
                ? branches.map((b) => ({
                    value: b.id || b._id || '',
                    label: b.name,
                  }))
                : [{ value: '', label: 'Cargando sucursales...' }]
            }
          />
        </div>

        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Nombre Completo *</label>
          <TextInput
            value={formCustomerName}
            onChange={(e) => setFormField('formCustomerName', e.target.value)}
            placeholder="Ej. Juan Pérez"
            disabled={bookingLoading}
            className="w-full"
          />
        </div>

        <Grid cols={{ base: 1, sm: 2 }} gap="md">
          <div>
            <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Teléfono *</label>
            <TextInput
              value={formCustomerPhone}
              onChange={(e) => setFormField('formCustomerPhone', e.target.value)}
              placeholder="55 1234 5678"
              type="tel"
              disabled={bookingLoading}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Correo Electrónico (Opcional)</label>
            <TextInput
              value={formCustomerEmail}
              onChange={(e) => setFormField('formCustomerEmail', e.target.value)}
              placeholder="juan@ejemplo.com"
              type="email"
              disabled={bookingLoading}
              className="w-full"
            />
          </div>
        </Grid>
      </Box>

      {/* SECTION 2: Datos del Vehículo */}
      <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
        <Flex align="center" gap="sm">
          <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
            2
          </Box>
          <span className="text-sm font-semibold text-base-content">
            Datos del Vehículo
          </span>
        </Flex>

        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Placas o Serie (Últimos 4) *</label>
          <TextInput
            value={formSerialNumberLastFour}
            onChange={(e) => setFormField('formSerialNumberLastFour', e.target.value.toUpperCase().slice(0, 8))}
            placeholder="Ej. 1234 o PLACAS"
            maxLength={8}
            disabled={bookingLoading}
            className="w-full font-mono"
          />
        </div>

        <Grid cols={{ base: 1, sm: 3 }} gap="sm">
          <div>
            <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Marca</label>
            <TextInput
              value={formBrand}
              onChange={(e) => setFormField('formBrand', e.target.value)}
              placeholder="Ej. Italika, Honda"
              disabled={bookingLoading}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Modelo (Opcional)</label>
            <TextInput
              value={formModel}
              onChange={(e) => setFormField('formModel', e.target.value)}
              placeholder="Ej. DM250"
              disabled={bookingLoading}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Año (Opcional)</label>
            <TextInput
              value={formYear}
              onChange={(e) => setFormField('formYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Ej. 2024"
              disabled={bookingLoading}
              className="w-full"
            />
          </div>
        </Grid>
      </Box>

      {/* SECTION 3: Detalle del Servicio y Horario */}
      <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
        <Flex align="center" gap="sm">
          <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
            3
          </Box>
          <span className="text-sm font-semibold text-base-content">
            Detalle del Servicio y Fecha
          </span>
        </Flex>

        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Servicio *</label>
          <Select
            size="md"
            value={formServiceRequested}
            onChange={(e) => setFormField('formServiceRequested', e.target.value)}
            disabled={bookingLoading}
            className="w-full"
            options={[
              { value: 'Frenos y Suspensión', label: 'Frenos y Suspensión' },
              { value: 'Servicio de mantenimiento', label: 'Servicio de mantenimiento' },
              { value: 'Garantía', label: 'Garantía' },
              { value: 'Reparación eléctrica', label: 'Reparación eléctrica' },
              { value: 'Reparación mecánica', label: 'Reparación mecánica' },
              { value: 'Ajuste de plásticos', label: 'Ajuste de plásticos' },
              { value: 'Accesorios', label: 'Accesorios' },
              { value: 'Otro', label: 'Otro' },
            ]}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Fecha y Horario de la Cita *</label>
          <DateTimePicker
            selectedDate={formSelectedDate}
            selectedTime={formSelectedTime}
            onChangeDate={(date) => {
              setFormField('formSelectedDate', date);
              setFormField('formSelectedTime', '');
            }}
            onChangeTime={(time) => setFormField('formSelectedTime', time)}
            occupiedSlots={occupiedSlots}
            occupiedSlotsLoading={occupiedSlotsLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Notas / Síntomas</label>
          <Textarea
            value={formNotes}
            onChange={(e) => setFormField('formNotes', e.target.value)}
            placeholder="Describe alguna falla o nota especial..."
            disabled={bookingLoading}
            rows={2}
            className="w-full text-xs"
          />
        </div>
      </Box>

      <PrimaryButton
        type="submit"
        size="md"
        loading={bookingLoading}
        disabled={bookingLoading || occupiedSlotsLoading || !formSelectedTime}
        className="w-full mt-2 font-bold"
      >
        Confirmar Solicitud
      </PrimaryButton>
    </form>
  );
};

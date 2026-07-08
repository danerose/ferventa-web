import React, { useEffect } from 'react';
import { useClientPortalStore } from '../../stores/useClientPortalStore';
import { Box, Flex, Stack, Grid, TextInput, PrimaryButton, Icon, DateTimePicker } from '@/app/presentation/components';

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
    formValidationError,

    // Store Actions
    setFormField,
    submitBooking,
    resetForm,
  } = useClientPortalStore();

  // Load occupied slots on mount for the next 30 days
  useEffect(() => {
    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 30);

    const formatDateStr = (d: Date) => d.toISOString().split('T')[0];
    loadOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
  }, [loadOccupiedSlots]);

  // Clean booking state on unmount
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const handleReset = () => {
    resetForm();

    // Refresh slots
    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 30);
    const formatDateStr = (d: Date) => d.toISOString().split('T')[0];
    loadOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitBooking();
    } catch {
      // Handled by Zustand store errors
    }
  };

  if (bookingSuccess) {
    // Helper to format time to 12h for the success message
    const format12h = (t: string) => {
      const [hStr, mStr] = t.split(':');
      const h = parseInt(hStr);
      const ampm = h >= 12 ? 'pm' : 'am';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return `${displayHour}:${mStr}${ampm}`;
    };

    const formattedDate = () => {
      if (!formSelectedDate) return '';
      const dateObj = new Date(formSelectedDate + 'T00:00:00');
      return dateObj.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    };

    return (
      <Box p="lg" rounded="xl" className="bg-white border border-[#cbd5e1] text-center shadow-lg animate-in fade-in duration-300">
        <Stack gap="md" align="center" className="py-6">
          <div className="w-16 h-16 bg-[#e5eeff] rounded-full flex items-center justify-center text-[#00a472] border border-[#00a472]/20">
            <Icon name="CheckCircle2" size="xl" className="text-success" />
          </div>
          <h3 className="font-display-lg text-primary">¡Cita Registrada Exitosamente!</h3>
          <p className="font-body-base text-on-surface-variant w-full">
            Tu cita se ha registrado exitosamente para el{' '}
            <strong className="text-on-background font-semibold capitalize">
              {formattedDate()} a las {format12h(formSelectedTime)}
            </strong>
            .
          </p>
          <p className="font-body-sm text-on-surface-variant w-full">
            En unos momentos recibirás un mensaje de WhatsApp confirmando tu cita.
          </p>

          <Stack gap="sm">
            <div className='mt-10'>
              <span className="font-label-caps text-on-surface-variant/70 block">Cliente</span>
              <span className="font-body-base text-on-background font-medium">{formCustomerName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-label-caps text-on-surface-variant/70 block">Vehículo</span>
                <span className="font-body-base text-on-background font-medium">
                  {formBrand || 'Genérico'} {formModel}
                </span>
              </div>
              <div>
                <span className="font-label-caps text-on-surface-variant/70 block">Serie (Últimos 4)</span>
                <span className="font-data-mono text-[#855300] font-semibold">{formSerialNumberLastFour}</span>
              </div>
            </div>
            <div>
              <span className="font-label-caps text-on-surface-variant/70 block">Servicio</span>
              <span className="font-body-base text-on-background font-medium">{formServiceRequested}</span>
            </div>
          </Stack>

          <PrimaryButton onClick={handleReset} className="bg-[#091426] hover:bg-[#1e293b] text-white border-none mt-10 w-full">
            Agendar Nueva Cita
          </PrimaryButton>
        </Stack>
      </Box>
    );
  }

  return (
    <Box rounded="xl" p="lg" className="bg-white/80 backdrop-blur-md border border-outline-variant/80 shadow-md">
      <Stack gap="md">
        <Flex align="center" gap="sm">
          <Icon name="Calendar" className="text-[#855300]" />
          <h2 className="font-headline-md text-on-surface">Agendar Cita</h2>
        </Flex>

        {formValidationError && (
          <Box p="sm" rounded="md" className="bg-error-container text-on-error-container border border-error/20">
            <Flex gap="sm" align="center">
              <Icon name="AlertTriangle" size="sm" className="text-error" />
              <span className="font-body-sm">{formValidationError}</span>
            </Flex>
          </Box>
        )}

        {bookingError && (
          <Box p="sm" rounded="md" className="bg-error-container text-on-error-container border border-error/20">
            <Flex gap="sm" align="center">
              <Icon name="AlertCircle" size="sm" className="text-error" />
              <span className="font-body-sm">{bookingError}</span>
            </Flex>
          </Box>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-caps text-on-surface-variant mb-1">Nombre Completo *</label>
            <TextInput
              value={formCustomerName}
              onChange={(e) => setFormField('formCustomerName', e.target.value)}
              placeholder="Ej. Juan Pérez"
              disabled={bookingLoading}
            />
          </div>

          <Grid cols={{ base: 1, sm: 2 }} gap="md">
            <div>
              <label className="block font-label-caps text-on-surface-variant mb-1">Teléfono *</label>
              <TextInput
                value={formCustomerPhone}
                onChange={(e) => setFormField('formCustomerPhone', e.target.value)}
                placeholder="55 1234 5678"
                type="tel"
                disabled={bookingLoading}
              />
            </div>
            <div>
              <label className="block font-label-caps text-on-surface-variant mb-1">Correo Electrónico</label>
              <TextInput
                value={formCustomerEmail}
                onChange={(e) => setFormField('formCustomerEmail', e.target.value)}
                placeholder="juan@ejemplo.com"
                type="email"
                disabled={bookingLoading}
              />
            </div>
          </Grid>

          <Box className="border-t border-[#e2e8f0] pt-4 mt-2">
            <span className="font-label-caps text-[#855300] block mb-3">Datos del Vehículo</span>
            <Stack gap="md">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Serie (Últimos 4) *</label>
                <TextInput
                  value={formSerialNumberLastFour}
                  onChange={(e) => setFormField('formSerialNumberLastFour', e.target.value.slice(0, 4))}
                  placeholder="Ej. 1234"
                  maxLength={4}
                  disabled={bookingLoading}
                />
              </div>
              <Grid cols={{ base: 1, sm: 3 }} gap="sm">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Marca</label>
                  <TextInput
                    value={formBrand}
                    onChange={(e) => setFormField('formBrand', e.target.value)}
                    placeholder="Toyota"
                    disabled={bookingLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Modelo</label>
                  <TextInput
                    value={formModel}
                    onChange={(e) => setFormField('formModel', e.target.value)}
                    placeholder="Corolla"
                    disabled={bookingLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Año</label>
                  <TextInput
                    value={formYear}
                    onChange={(e) => setFormField('formYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="2022"
                    disabled={bookingLoading}
                  />
                </div>
              </Grid>
            </Stack>
          </Box>

          <Box className="border-t border-[#e2e8f0] pt-4">
            <span className="font-label-caps text-[#855300] block mb-3">Detalle del Servicio</span>
            <Stack gap="md">
              <div>
                <label className="block font-label-caps text-on-surface-variant mb-1">Servicio *</label>
                <select
                  value={formServiceRequested}
                  onChange={(e) => setFormField('formServiceRequested', e.target.value)}
                  disabled={bookingLoading}
                  className="w-full font-sans rounded border border-[#cbd5e1] text-[#0b1c30] bg-white px-3 py-2 outline-none focus:border-[#091426] focus:border-2 focus:ring-0 transition-all select select-bordered"
                >
                  <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                  <option value="Diagnóstico de Motor">Diagnóstico de Motor</option>
                  <option value="Frenos y Suspensión">Frenos y Suspensión</option>
                  <option value="Hojalatería y Pintura">Hojalatería y Pintura</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-on-surface-variant mb-2">Fecha y Horario de la Cita *</label>
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
                <label className="block font-label-caps text-on-surface-variant mb-1">Notas / Síntomas</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormField('formNotes', e.target.value)}
                  placeholder="Describe alguna falla o nota especial..."
                  disabled={bookingLoading}
                  className="w-full font-sans rounded border border-[#cbd5e1] text-[#0b1c30] bg-white p-3 outline-none focus:border-[#091426] focus:border-2 focus:ring-0 transition-all textarea textarea-bordered min-h-[80px]"
                />
              </div>
            </Stack>
          </Box>

          <PrimaryButton
            type="submit"
            loading={bookingLoading}
            disabled={bookingLoading || occupiedSlotsLoading || !formSelectedTime}
            className="w-full bg-[#091426] hover:bg-[#1e293b] text-white border-none py-4 text-base mt-2"
          >
            Confirmar Solicitud
          </PrimaryButton>
        </form>
      </Stack>
    </Box>
  );
};

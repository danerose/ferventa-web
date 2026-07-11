import React from 'react';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';
import { PrimaryButton, SecondaryButton, TextInput, Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

export interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  occupiedLoading: boolean;
  occupiedList: {
    dateStr: string;
    dayLabel: string;
    isClosed: boolean;
    closedReason: string;
    busyTimes: string[];
  }[];
  newSuggestionDate: string;
  onNewSuggestionDateChange: (val: string) => void;
  newSuggestionTime: string;
  onNewSuggestionTimeChange: (val: string) => void;
  timeSlotOptions: string[];
  format12h: (t: string) => string;
  handleAddSuggestion: () => void;
  suggestedSchedules: { date: string; time: string }[];
  handleRemoveSuggestion: (idx: number) => void;
  modalMessage: string;
  onMessageChange: (val: string) => void;
  onConfirm: () => void;
  updating: boolean;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  isOpen,
  appt,
  onClose,
  occupiedLoading,
  occupiedList,
  newSuggestionDate,
  onNewSuggestionDateChange,
  newSuggestionTime,
  onNewSuggestionTimeChange,
  timeSlotOptions,
  format12h,
  handleAddSuggestion,
  suggestedSchedules,
  handleRemoveSuggestion,
  modalMessage,
  onMessageChange,
  onConfirm,
  updating,
}) => {
  if (!appt) return null;

  const footer = (
    <>
      <SecondaryButton onClick={onClose} disabled={updating}>
        Cancelar
      </SecondaryButton>
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating || suggestedSchedules.length === 0}
        loading={updating}
      >
        Mandar Mensaje y Cambiar a Reagendada
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Proponer Reagendación de Cita"
      footer={footer}
      maxWidth="980px"
    >
      <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
        {/* Left Column: Visual helper of occupied schedule */}
        <div
          style={{
            width: '320px',
            borderRight: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            borderRadius: '8px',
          }}
        >
          <h4
            style={{
              fontSize: '13px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#475569',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="CalendarRange" size="xs" />
            Visualizador de Agenda (Ayuda)
          </h4>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Horarios y citas agendadas de los próximos 7 días laborales.
          </p>

          {occupiedLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Cargando agenda...</span>
            </div>
          ) : occupiedList.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>No hay información de agenda.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {occupiedList.map((day) => (
                <div
                  key={day.dateStr}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: '700',
                      color: '#091426',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span>{day.dayLabel}</span>
                    {day.isClosed && <span style={{ color: '#dc2626', fontSize: '10.5px' }}>{day.closedReason}</span>}
                  </div>
                  {day.isClosed ? null : day.busyTimes.length === 0 ? (
                    <div style={{ color: '#16a34a', fontStyle: 'italic' }}>Todo el día libre</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>OCUPADO EN:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {day.busyTimes.map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '600',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Suggestion builder & message */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
            La cita original no puede ser agendada en la hora solicitada. Selecciona una o varias opciones alternativas para sugerirle al cliente.
          </p>

          {/* Builder section */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#091426' }}>
              Añadir sugerencia de horario
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <TextInput
                type="date"
                value={newSuggestionDate}
                onChange={(e) => onNewSuggestionDateChange(e.target.value)}
                size="sm"
                style={{ flex: 1 }}
              />
              <select
                value={newSuggestionTime}
                onChange={(e) => onNewSuggestionTimeChange(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'white',
                  height: '36px',
                }}
              >
                {timeSlotOptions.map((t) => (
                  <option key={t} value={t}>
                    {format12h(t)}
                  </option>
                ))}
              </select>
              <PrimaryButton
                type="button"
                onClick={handleAddSuggestion}
                size="sm"
                className="bg-[#091426] hover:bg-[#1e293b] text-white py-1.5"
              >
                <Icon name="Plus" size="xs" className="mr-1" /> Añadir
              </PrimaryButton>
            </div>

            {/* Suggestions list tags */}
            {suggestedSchedules.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {suggestedSchedules.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#f3e8ff',
                      border: '1px solid #d8b4fe',
                      color: '#5b21b6',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '600',
                    }}
                  >
                    <span>
                      {s.date.split('-').slice(1).join('/')} a las {format12h(s.time)}
                    </span>
                    <button
                      onClick={() => handleRemoveSuggestion(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#7c3aed',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Icon name="X" size="xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
              Mensaje a enviar (Editable)
            </label>
            <textarea
              value={modalMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={8}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'Inter, system-ui, sans-serif',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

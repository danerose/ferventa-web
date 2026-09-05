import React from 'react';
import { Modal, Textarea } from '@/app/presentation/components';
import { PrimaryButton, SecondaryButton, TextInput, Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';

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
      <div className="flex flex-col md:flex-row gap-5 min-h-[400px]">
        {/* Left Column: Visual helper of occupied schedule */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-base-300 bg-base-200/40 p-4 flex flex-col gap-3 overflow-y-auto rounded-DEFAULT">
          <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/80 m-0 flex items-center gap-1.5">
            <Icon name="CalendarRange" size="xs" />
            Visualizador de Agenda (Ayuda)
          </h4>
          <p className="text-xs text-base-content/60 m-0">
            Horarios y citas agendadas de los próximos 7 días laborales.
          </p>

          {occupiedLoading ? (
            <div className="flex justify-center py-10">
              <span className="text-xs text-base-content/50">Cargando agenda...</span>
            </div>
          ) : occupiedList.length === 0 ? (
            <div className="flex justify-center py-10">
              <span className="text-xs text-base-content/50">No hay información de agenda.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {occupiedList.map((day) => (
                <div
                  key={day.dateStr}
                  className="bg-base-100 border border-base-300 rounded-DEFAULT p-2.5 text-xs shadow-2xs"
                >
                  <div className="font-bold text-base-content flex justify-between mb-1">
                    <span>{day.dayLabel}</span>
                    {day.isClosed && <span className="text-error text-[10.5px] font-semibold">{day.closedReason}</span>}
                  </div>
                  {day.isClosed ? null : day.busyTimes.length === 0 ? (
                    <div className="text-success italic font-medium">Todo el día libre</div>
                  ) : (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[10px] text-base-content/60 font-semibold uppercase">OCUPADO EN:</span>
                      <div className="flex flex-wrap gap-1">
                        {day.busyTimes.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-error/15 text-error border border-error/30"
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
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <p className="text-sm text-base-content/80 m-0">
            La cita original no puede ser agendada en la hora solicitada. Selecciona una o varias opciones alternativas para sugerirle al cliente.
          </p>

          {/* Builder section */}
          <div className="bg-base-200/40 border border-dashed border-base-300 rounded-DEFAULT p-3.5 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content">
              Añadir sugerencia de horario
            </span>
            <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
              <TextInput
                type="date"
                value={newSuggestionDate}
                onChange={(e) => onNewSuggestionDateChange(e.target.value)}
                size="sm"
                className="flex-1"
              />
              <select
                value={newSuggestionTime}
                onChange={(e) => onNewSuggestionTimeChange(e.target.value)}
                className="select select-bordered select-sm bg-base-100 text-base-content border-base-300 font-normal focus:outline-none focus:border-primary h-9"
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
                color="neutral"
              >
                <Icon name="Plus" size="xs" className="mr-1" /> Añadir
              </PrimaryButton>
            </div>

            {/* Suggestions list tags */}
            {suggestedSchedules.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {suggestedSchedules.map((s, idx) => (
                  <div
                    key={idx}
                    className="bg-primary/10 border border-primary/20 text-primary rounded px-2.5 py-1 text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <span>
                      {s.date.split('-').slice(1).join('/')} a las {format12h(s.time)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSuggestion(idx)}
                      className="text-primary hover:opacity-75 cursor-pointer p-0 flex items-center"
                    >
                      <Icon name="X" size="xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message area */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Mensaje a enviar (Editable)
            </label>
            <Textarea
              value={modalMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              rows={8}
              className="font-sans text-[13px]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};


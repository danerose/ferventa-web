export interface ServiceOption {
  value: string;
  label: string;
}

export const PREDEFINED_SERVICE_OPTIONS: ServiceOption[] = [
  { value: 'Frenos y Suspensión', label: 'Frenos y Suspensión' },
  { value: 'Servicio de mantenimiento', label: 'Servicio de mantenimiento' },
  { value: 'Garantía', label: 'Garantía' },
  { value: 'Reparación eléctrica', label: 'Reparación eléctrica' },
  { value: 'Reparación mecánica', label: 'Reparación mecánica' },
  { value: 'Ajuste de plásticos', label: 'Ajuste de plásticos' },
  { value: 'Accesorios', label: 'Accesorios' },
  { value: 'Otro', label: 'Otro' },
];

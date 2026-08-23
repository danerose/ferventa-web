export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type StatusVariant = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface AppToastMessage {
  id: string | number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

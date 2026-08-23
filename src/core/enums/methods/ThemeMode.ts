export const ThemeMode = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode];

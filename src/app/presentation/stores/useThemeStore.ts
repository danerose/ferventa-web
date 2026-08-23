import { create } from 'zustand';
import { ThemeMode } from '@/core/enums';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

const STORAGE_KEY = 'ferventa_theme_mode';

const getInitialMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === ThemeMode.Light || saved === ThemeMode.Dark || saved === ThemeMode.System) {
      return saved as ThemeMode;
    }
  } catch {
    // localStorage no disponible
  }
  return ThemeMode.Light;
};

const applyThemeToDOM = (isDark: boolean) => {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: getInitialMode(),
  isDark: false,

  setThemeMode: (mode: ThemeMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }

    let isDark = false;
    if (mode === ThemeMode.Dark) {
      isDark = true;
    } else if (mode === ThemeMode.System) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    applyThemeToDOM(isDark);
    set({ mode, isDark });
  },

  toggleTheme: () => {
    const currentMode = get().mode;
    const newMode = currentMode === ThemeMode.Dark ? ThemeMode.Light : ThemeMode.Dark;
    get().setThemeMode(newMode);
  },

  initializeTheme: () => {
    const mode = get().mode;
    let isDark = false;
    if (mode === ThemeMode.Dark) {
      isDark = true;
    } else if (mode === ThemeMode.System) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyThemeToDOM(isDark);
    set({ isDark });

    // Listener para cambios de tema en el sistema operativo
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (get().mode === ThemeMode.System) {
          applyThemeToDOM(e.matches);
          set({ isDark: e.matches });
        }
      });
    }
  },
}));

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  THEME_STORAGE_KEY,
  ThemeMode,
  ThemeColors,
  lightColors,
  darkColors,
} from './colors';

export * from './colors';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightColors,
  isDark: false,
  setMode: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setModeState(saved);
        }
      } catch (err) {
        console.warn('Failed to load theme preference:', err);
      }
    }
    loadTheme();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  };

  const toggleTheme = async () => {
    const next = mode === 'light' ? 'dark' : 'light';
    await setMode(next);
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors,
        isDark: mode === 'dark',
        setMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

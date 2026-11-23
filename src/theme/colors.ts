export const THEME_STORAGE_KEY = '@hisaab_theme_mode';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  mode: ThemeMode;
  background: string;
  surface: string;
  card: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryBorder: string;
  gave: string;
  gaveBg: string;
  gaveText: string;
  got: string;
  gotBg: string;
  gotText: string;
  settled: string;
  inputBg: string;
  inputBorder: string;
  divider: string;
  statusBarStyle: 'dark' | 'light';
}

export const lightColors: ThemeColors = {
  mode: 'light',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  gave: '#DC2626',
  gaveBg: '#FEE2E2',
  gaveText: '#DC2626',
  got: '#16A34A',
  gotBg: '#DCFCE7',
  gotText: '#16A34A',
  settled: '#6B7280',
  inputBg: '#F9FAFB',
  inputBorder: '#D1D5DB',
  divider: '#F3F4F6',
  statusBarStyle: 'dark',
};

export const darkColors: ThemeColors = {
  mode: 'dark',
  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  border: '#334155',
  borderLight: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#3B82F6',
  primaryLight: '#1E293B',
  primaryBorder: '#2563EB',
  gave: '#EF4444',
  gaveBg: '#451A1A',
  gaveText: '#F87171',
  got: '#10B981',
  gotBg: '#064E3B',
  gotText: '#34D399',
  settled: '#94A3B8',
  inputBg: '#0F172A',
  inputBorder: '#475569',
  divider: '#1E293B',
  statusBarStyle: 'light',
};

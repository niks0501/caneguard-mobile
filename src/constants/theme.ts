import '@/global.css';

import { Platform } from 'react-native';

const base = {
  primary: '#445D48',
  primaryDark: '#2E4031',
  primaryLight: '#6E8B74',
  accent: '#D6CC99',
  accentDark: '#B8AD73',
  text: '#1F2A21',
  muted: '#6B7280',
  border: '#DDE5DE',
  success: '#2E6D38',
  warning: '#9C4B00',
  danger: '#B94040',
  info: '#2E6FA3',
} as const;

export const Colors = {
  light: {
    text: base.text,
    background: '#FFFFFF',
    backgroundElement: '#F7F9F7',
    backgroundSelected: '#EEF2EE',
    textSecondary: base.muted,
    primary: base.primary,
    primaryDark: base.primaryDark,
    primaryLight: base.primaryLight,
    onPrimary: '#FFFFFF',
    accent: base.accent,
    accentDark: base.accentDark,
    surface: '#F7F9F7',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#EEF2EE',
    border: base.border,
    divider: '#E8EEE9',
    dividerOn: '#DDE5DE',
    guideIcon: base.warning,
    success: base.success,
    successBg: '#E8F5E9',
    warning: base.warning,
    warningBg: '#FFF3E0',
    danger: base.danger,
    dangerBg: '#FFEBEE',
    info: base.info,
    infoBg: '#E3F2FD',
    healthy: '#2E7D32',
    healthyBg: '#E8F5E9',
    smut: '#7B2CBF',
    smutBg: '#F3E8FF',
    mosaic: '#B26A00',
    mosaicBg: '#FFF8E1',
    rust: '#D35400',
    rustBg: '#FBE9E7',
    unclear: '#37474F',
    unclearBg: '#ECEFF1',
  },
  dark: {
    text: '#F6F8F6',
    background: '#101711',
    backgroundElement: '#172018',
    backgroundSelected: '#223125',
    textSecondary: '#A7B0A9',
    primary: '#91B79A',
    primaryDark: '#B9D0BE',
    primaryLight: '#6E8B74',
    onPrimary: '#101711',
    accent: '#D6CC99',
    accentDark: '#B8AD73',
    surface: '#172018',
    surfaceElevated: '#1C271E',
    surfaceMuted: '#223125',
    border: '#314034',
    divider: '#263329',
    dividerOn: '#314034',
    guideIcon: '#E2A15F',
    success: '#72B77B',
    successBg: '#17351C',
    warning: '#E2A15F',
    warningBg: '#3A2817',
    danger: '#E17878',
    dangerBg: '#3D1D1D',
    info: '#74A9D9',
    infoBg: '#173049',
    healthy: '#72B77B',
    healthyBg: '#17351C',
    smut: '#B890E8',
    smutBg: '#2E1C45',
    mosaic: '#EFD061',
    mosaicBg: '#3A3114',
    rust: '#E5925E',
    rustBg: '#3D2115',
    unclear: '#CFD8DC',
    unclearBg: '#263238',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '800' },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800' },
  heading: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.4 },
} as const;

export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const Radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: base.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 12 },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: base.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 24 },
    android: { elevation: 4 },
    default: {},
  }),
} as const;

export const ComponentTokens = {
  screen: { horizontalPadding: Spacing.xl, verticalPadding: Spacing.lg, sectionGap: Spacing.xl },
  card: { padding: Spacing.lg, borderRadius: Radius.lg },
  button: { height: 52, borderRadius: Radius.lg, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  input: { minHeight: 50, borderRadius: Radius.sm, paddingHorizontal: Spacing.lg, borderWidth: 1.5 },
  chip: { borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  bottomNav: { height: 64, iconSize: 22 },
} as const;

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const Layout = {
  maxContentWidth: 800,
  mobileMaxWidth: 430,
  bottomNavHeight: 64,
} as const;

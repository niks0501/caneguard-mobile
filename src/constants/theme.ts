import '@/global.css';

import { Platform } from 'react-native';

const base = {
  primary: '#445D48',
  primaryDark: '#2E4031',
  primaryLight: '#6E8B74',
  accent: '#D6CC99',
  accentDark: '#B8AD73',
  text: '#1F2A21',
  border: '#DDD8C9',
  success: '#2E6D38',
  warning: '#8A4A06',
  danger: '#9B2F2F',
  info: '#2E6FA3',
} as const;

export const Colors = {
  light: {
    text: base.text,
    background: '#F8F5EE',
    backgroundElement: '#F3EFE4',
    backgroundSelected: '#ECE7D9',
    textSecondary: '#4A5650',
    primary: base.primary,
    primaryDark: base.primaryDark,
    primaryLight: base.primaryLight,
    onPrimary: '#FFFFFF',
    accent: base.accent,
    accentDark: base.accentDark,
    surface: '#F3EFE4',
    surfaceElevated: '#FFFDF8',
    surfaceMuted: '#EFEADD',
    border: base.border,
    divider: '#E7E2D4',
    dividerOn: base.border,
    guideIcon: base.warning,
    success: base.success,
    successBg: '#E8F5E9',
    warning: base.warning,
    warningBg: '#F7EBD3',
    danger: base.danger,
    dangerBg: '#F6E3DE',
    info: base.info,
    infoBg: '#E3F2FD',
    healthy: '#2E7D32',
    healthyBg: '#E8F5E9',
    smut: '#7B2CBF',
    smutBg: '#F3E8FF',
    mosaic: '#8A5300',
    mosaicBg: '#FFF8E1',
    rust: '#A83F00',
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

// Two weights only (400 reads, 500 emphasises). 14px is the floor for anything
// read; `tabLabel` (12px) is reserved for bottom-tab labels and count badges.
export const Typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '500' },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '500' },
  heading: { fontSize: 22, lineHeight: 30, fontWeight: '500' },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: '500' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.4 },
  tabLabel: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
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

// Three radii: sm (8), md (12), lg (16). `xs`/`xl` alias the nearest of the three
// so existing call sites keep working; `full` is for circles and pills.
export const Radius = {
  none: 0,
  xs: 8,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 16,
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

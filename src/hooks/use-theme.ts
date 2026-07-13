import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/providers/ThemePreferenceProvider';

export function useTheme() {
  const { colorScheme } = useThemePreference();

  return Colors[colorScheme];
}

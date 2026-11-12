import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { MISSING_STEP_COPY, READY_FOR_FIELD_COPY } from '@/constants/copy';
import { Typography } from '@/constants/theme';
import { useOfflineReadiness } from '@/features/auth/hooks/useOfflineReadiness';
import { useTheme } from '@/hooks/use-theme';

/**
 * Quiet Home line while this device is not ready for offline work. Nothing
 * renders while the saved-visit check is still running or has not answered.
 */
export function HomeReadinessLine() {
  const theme = useTheme();
  const readiness = useOfflineReadiness();

  if (readiness.ready || readiness.checkingAssignments || readiness.assignmentCount === null) {
    return null;
  }

  const biometricOff = !readiness.protectedSessionEnabled;
  const label = biometricOff
    ? READY_FOR_FIELD_COPY.homeLineBiometric
    : readiness.missingStep
      ? MISSING_STEP_COPY[readiness.missingStep]
      : READY_FOR_FIELD_COPY.homeLineOther;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => router.push((biometricOff ? '/account-security' : '/settings') as Href)}
      testID="home.readiness-line">
      <Text style={[styles.line, { color: theme.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  line: { ...Typography.bodySmall },
});

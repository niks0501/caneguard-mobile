import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import type { PossibleRecentMatch } from '@/features/reports/domain/possibleMatch';
import { useTheme } from '@/hooks/use-theme';

export function PossibleRecentMatchWarning({
  match,
}: {
  match: PossibleRecentMatch;
}) {
  const theme = useTheme();
  const distance = Math.round(match.distanceMeters);

  return (
    <View
      testID="field-report.possible-match-warning"
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        { backgroundColor: theme.warningBg, borderColor: theme.warning },
      ]}>
      <Feather name="alert-triangle" size={20} color={theme.warning} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>
          Possible recent match
        </Text>
        <Text style={[styles.message, { color: theme.text }]}>
          This new case resembles a recent report observed{' '}
          {formatTimestamp(match.observedAt)} about {distance} m away, with the
          same AI-supported result and field reference.
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          This is only a possible match, not a duplicate decision. You can
          still finalize this new case, and it will remain a separate record.
        </Text>
      </View>
    </View>
  );
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  copy: { flex: 1, gap: Spacing.sm },
  title: { ...Typography.subheading, fontWeight: '800' },
  message: { ...Typography.bodySmall },
});

import { StyleSheet, Text, View } from 'react-native';

import { HOME_NOTE_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { getLocalDateKey } from '@/features/assignments/domain/todayVisits';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey } from '@/lib/formatters';

export function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return HOME_NOTE_COPY.greeting.morning;
  if (hour < 18) return HOME_NOTE_COPY.greeting.afternoon;
  return HOME_NOTE_COPY.greeting.evening;
}

export function firstNameOf(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : null;
}

export type HomeHeaderBandProps = {
  isOffline: boolean;
  name?: string | null;
  now: Date;
};

/** Tinted band under the brand row: greeting, date, and an Offline chip only while offline. */
export function HomeHeaderBand({ isOffline, name, now }: HomeHeaderBandProps) {
  const theme = useTheme();
  const first = firstNameOf(name);
  const greeting = first ? `${greetingFor(now)}, ${first}` : greetingFor(now);

  return (
    <View style={[styles.band, { backgroundColor: theme.surfaceMuted }]} testID="home.header-band">
      <View style={styles.text}>
        <Text style={[styles.greeting, { color: theme.text }]} testID="home.greeting">
          {greeting}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]} testID="home.date">
          {formatDateKey(getLocalDateKey(now))}
        </Text>
      </View>
      {isOffline ? (
        <View
          accessibilityLabel={HOME_NOTE_COPY.offlineChip}
          style={[styles.chip, { backgroundColor: theme.warningBg }]}
          testID="home.offline-chip">
          <Text style={[styles.chipText, { color: theme.warning }]}>{HOME_NOTE_COPY.offlineChip}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  text: { flex: 1 },
  greeting: { ...Typography.subheading },
  date: { ...Typography.bodySmall },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  chipText: { ...Typography.label },
});

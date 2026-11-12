import { StyleSheet, Text, View } from 'react-native';

import { HOME_NOTE_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { getLocalDateKey } from '@/features/assignments/domain/todayVisits';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey } from '@/lib/formatters';

type BandCopy = { greeting: { morning: string; afternoon: string; evening: string }; offline: string };

export function greetingFor(
  now: Date,
  greeting: BandCopy['greeting'] = HOME_NOTE_COPY.greeting,
): string {
  const hour = now.getHours();
  if (hour < 12) return greeting.morning;
  if (hour < 18) return greeting.afternoon;
  return greeting.evening;
}

export function firstNameOf(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first : null;
}

export type HomeHeaderBandProps = {
  /** Greeting and Offline wording; the farmer's language on a farmer session. */
  copy?: BandCopy;
  isOffline: boolean;
  name?: string | null;
  now: Date;
};

/** Tinted band under the brand row: greeting, date, and an Offline chip only while offline. */
export function HomeHeaderBand({ copy, isOffline, name, now }: HomeHeaderBandProps) {
  const theme = useTheme();
  const first = firstNameOf(name);
  const offlineLabel = copy?.offline ?? HOME_NOTE_COPY.offlineChip;
  const base = greetingFor(now, copy?.greeting);
  const greeting = first ? `${base}, ${first}` : base;

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
          accessibilityLabel={offlineLabel}
          style={[styles.chip, { backgroundColor: theme.warningBg }]}
          testID="home.offline-chip">
          <Text style={[styles.chipText, { color: theme.warning }]}>{offlineLabel}</Text>
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

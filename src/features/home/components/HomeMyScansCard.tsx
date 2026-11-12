import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FARMER_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useFarmerScans } from '@/features/records/hooks/useScanStates';
import { useTheme } from '@/hooks/use-theme';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

/**
 * Farmer Home entry to My Scans. The count is the same number of scans the
 * Needs checking chip filters to, read from the shared state derivation.
 */
export function HomeMyScansCard({ onOpen }: { onOpen: () => void }) {
  const theme = useTheme();
  const { language } = useLanguagePreference();
  const copy = FARMER_COPY[language].myScans;
  const { states, threads } = useFarmerScans();
  const needsCheckingPlants = new Set<string>();
  for (const [scanId, state] of states) {
    if (state === 'needs_checking') {
      needsCheckingPlants.add(threads.get(scanId)?.originalId ?? scanId);
    }
  }
  const needsChecking = needsCheckingPlants.size;

  return (
    <Pressable
      accessibilityLabel={
        needsChecking > 0
          ? `${copy.title}, ${needsChecking} ${copy.stateNeedsChecking}`
          : copy.title
      }
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
      testID="home.my-scans">
      <Feather name="layers" size={22} color={theme.primary} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text }]}>{copy.title}</Text>
        {needsChecking > 0 ? (
          <Text
            style={[styles.count, { color: theme.textSecondary }]}
            testID="home.my-scans.needs-checking">
            {needsChecking} {copy.stateNeedsChecking}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: 64,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: { flex: 1, gap: 2 },
  title: { ...Typography.subheading },
  count: { ...Typography.body },
  pressed: { opacity: 0.74 },
});

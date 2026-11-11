import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UNFINISHED_COPY } from '@/constants/copy';
import { Spacing, Typography } from '@/constants/theme';
import { SYNC_TONE_COLOR } from '@/features/sync/utils/syncStatusCopy';
import { useTheme } from '@/hooks/use-theme';

/** An unfinished plot boundary saved on this phone, listed in Activity so it can be resumed. */
export function PlotDraftRow({ onPress, testID }: { onPress: () => void; testID?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={`${UNFINISHED_COPY.plotLead}. ${UNFINISHED_COPY.meta}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.divider }, pressed && styles.pressed]}
      testID={testID}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>{UNFINISHED_COPY.plotLead}</Text>
        <View style={styles.status}>
          <Feather name="edit-3" size={14} color={theme[SYNC_TONE_COLOR.whisper]} />
          <Text style={[styles.meta, { color: theme[SYNC_TONE_COLOR.whisper] }]}>{UNFINISHED_COPY.meta}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  copy: { flex: 1, gap: Spacing.xs },
  title: { ...Typography.body, fontWeight: '500' },
  status: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  meta: { ...Typography.bodySmall },
  pressed: { opacity: 0.72 },
});

import { Image as ExpoImage } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClampedText } from '@/components/ui/ClampedText';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { possibleConditionLine } from '@/features/records/components/possibleConditionLine';
import type { ScanCheckHistoryItem } from '@/features/records/domain/recordTypes';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

/**
 * A farmer's checks of one plant in date order. It states what was seen and
 * when; it never labels a trend or compares one check with another.
 */
export function CheckHistorySection({
  currentId,
  history,
  onOpen,
}: {
  currentId: string;
  history: ScanCheckHistoryItem[];
  onOpen: (id: string) => void;
}) {
  const theme = useTheme();
  const copy = useFarmerCopy().checkAgain;

  return (
    <View
      testID="records.check-history"
      style={[styles.section, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.primaryDark }]}>{copy.historyHeading}</Text>
      {history.map((item) => {
        const isCurrent = item.id === currentId;
        return (
          <Pressable
            key={item.id}
            testID={`records.check-history.item.${item.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isCurrent }}
            disabled={isCurrent}
            onPress={() => onOpen(item.id)}
            style={[styles.item, { borderColor: theme.border }]}>
            <ExpoImage
              source={{ uri: item.managedImageUri }}
              contentFit="cover"
              style={[styles.thumbnail, { backgroundColor: theme.surfaceMuted }]}
            />
            <View style={styles.itemCopy}>
              <Text style={[styles.date, { color: theme.text }]}>
                {formatDateTime(item.createdAt, item.createdAt)}
              </Text>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>
                {possibleConditionLine(copy.possibleCondition, item.predictedLabel)}
              </Text>
              {item.isOriginal || isCurrent ? (
                <Text style={[styles.tag, { color: theme.primary }]}>
                  {[item.isOriginal ? copy.firstCheck : null, isCurrent ? copy.thisCheck : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
              {item.personalNote ? (
                <ClampedText
                  text={item.personalNote}
                  style={[styles.caption, { color: theme.text }]}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: { ...Typography.subheading },
  item: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    minHeight: 44,
  },
  thumbnail: { width: 64, height: 64, borderRadius: Radius.md },
  itemCopy: { flex: 1, gap: Spacing.xs },
  date: { ...Typography.bodySmall, fontWeight: '800' },
  caption: { ...Typography.caption },
  tag: { ...Typography.caption, fontWeight: '800' },
});

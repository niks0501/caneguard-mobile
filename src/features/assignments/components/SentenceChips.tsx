import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { hasSentence } from '@/features/assignments/domain/visitSentenceChips';
import { useTheme } from '@/hooks/use-theme';

/** Tap-to-add sentence chips for one text field; the field stays editable. */
export function SentenceChips({
  currentText,
  onToggle,
  sentences,
  testIDPrefix,
}: {
  currentText: string;
  onToggle: (sentence: string) => void;
  sentences: readonly string[];
  testIDPrefix: string;
}) {
  const theme = useTheme();
  return (
    <View testID={`${testIDPrefix}.chips`} style={styles.wrap}>
      {sentences.map((sentence, index) => {
        const selected = hasSentence(currentText, sentence);
        return (
          <Pressable
            key={sentence}
            testID={`${testIDPrefix}.chip.${index}`}
            accessibilityRole="button"
            accessibilityLabel={sentence}
            accessibilityState={{ selected }}
            onPress={() => onToggle(sentence)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.surfaceMuted,
                borderColor: selected ? theme.primary : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, { color: selected ? theme.onPrimary : theme.text }]}>{sentence}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  label: { ...Typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});

import { Feather } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DisclosureSectionProps = {
  children: ReactNode;
  testID?: string;
  title: string;
};

export function DisclosureSection({ children, testID, title }: DisclosureSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const action = expanded ? 'Hide' : 'Show';

  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${action} ${title}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.primaryDark }]}>{title}</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            {expanded ? 'Hide details' : 'View details'}
          </Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  header: {
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  copy: { flex: 1, gap: 2 },
  title: { ...Typography.bodySmall, fontWeight: '800' },
  hint: { ...Typography.caption },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  pressed: { opacity: 0.74 },
});

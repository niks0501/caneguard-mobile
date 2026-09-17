import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type RowProps = {
  label: string;
  value: ReactNode;
  valueTestID?: string;
  testID?: string;
  withDivider?: boolean;
  numberOfLines?: number;
  style?: StyleProp<ViewStyle>;
};

export function Row({
  label,
  numberOfLines = 2,
  style,
  testID,
  value,
  valueTestID,
  withDivider = false,
}: RowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        withDivider && [styles.divider, { borderBottomColor: theme.divider }],
        style,
      ]}
      testID={testID}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          numberOfLines={numberOfLines}
          style={[styles.value, { color: theme.text }]}
          testID={valueTestID}>
          {value || 'Not available'}
        </Text>
      ) : (
        <View testID={valueTestID} style={styles.customValue}>
          {value}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    flex: 1,
    flexShrink: 0,
  },
  value: {
    ...Typography.bodySmall,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  customValue: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

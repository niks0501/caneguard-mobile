import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ComponentTokens, Layout, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Pass as `style` to each button in `secondary` so they share the row equally. */
export const dockSecondaryButtonStyle = { flex: 1 } as const;

type ActionDockProps = {
  /** The one primary action of the screen. Always the first, full-width control. */
  primary: ReactNode;
  /** Quiet follow-on actions, shown as an equal-width row under the primary. */
  secondary?: ReactNode;
  /** One short status line above the actions (for example, a draft or error line). */
  note?: ReactNode;
  testID?: string;
};

/**
 * The thumb line: one docked primary action in the same place on every task
 * screen, with at most a quiet row of secondary actions beneath it. Render it
 * after the screen's scroll view in the same column so it keeps the bottom
 * strip and stays pressable.
 */
export function ActionDock({
  primary,
  secondary,
  note,
  testID = 'action-dock',
}: ActionDockProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.outer,
        { backgroundColor: theme.background, borderTopColor: theme.border },
      ]}>
      <View style={styles.inner}>
        {note}
        {primary}
        {secondary ? <View style={styles.secondaryRow}>{secondary}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  inner: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    gap: Spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});

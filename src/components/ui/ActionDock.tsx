import type { ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

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
  /**
   * Overlay the dock on the bottom edge instead of laying it out below the
   * content. The screen pads its scroll content by the height reported through
   * `onHeightChange`, so the dock can come first in the tree.
   */
  floating?: boolean;
  onHeightChange?: (height: number) => void;
  testID?: string;
};

/**
 * The thumb line: one docked primary action in the same place on every task
 * screen, with at most a quiet row of secondary actions beneath it.
 */
export function ActionDock({
  primary,
  secondary,
  note,
  floating = false,
  onHeightChange,
  testID = 'action-dock',
}: ActionDockProps) {
  const theme = useTheme();

  const handleLayout = onHeightChange
    ? (event: LayoutChangeEvent) => onHeightChange(event.nativeEvent.layout.height)
    : undefined;

  return (
    <View
      testID={testID}
      onLayout={handleLayout}
      style={[
        styles.outer,
        floating && styles.floating,
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
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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

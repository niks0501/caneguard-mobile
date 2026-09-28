import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  OFFICE_UPDATES_DISMISS_LABEL,
  OFFICE_UPDATES_OPEN_LABEL,
  officeUpdatesPillLabel,
} from '@/constants/copy';
import { Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Height of the pill itself, used to reserve room at the bottom of a list. */
export const OFFICE_UPDATES_PILL_HEIGHT = 52;
/** Distance between the pill and the tab bar below it. */
export const OFFICE_UPDATES_PILL_GAP = Spacing.md;
/**
 * Room the floating pill needs at the bottom of a scrolling list so the last
 * card is never covered. Screens reserve this while the pill is on screen.
 */
export const OFFICE_UPDATES_PILL_CLEARANCE =
  OFFICE_UPDATES_PILL_HEIGHT + OFFICE_UPDATES_PILL_GAP * 2;

export type OfficeUpdatesPillProps = {
  count: number;
  onDismiss: () => void;
  onOpen: () => void;
  testID?: string;
};

/**
 * Floating office-updates pill: the unread count, one tap to open the updates,
 * and a small dismiss control. It floats above the tab bar instead of living in
 * the page, so it never scrolls away. Renders nothing with no unread updates.
 *
 * The tab bar is laid out below the screen rather than over it, so the pill's
 * bottom offset is measured from the top edge of the tab bar.
 */
export function OfficeUpdatesPill({
  count,
  onDismiss,
  onOpen,
  testID = 'office-updates.pill',
}: OfficeUpdatesPillProps) {
  const theme = useTheme();

  if (count <= 0) return null;

  const label = officeUpdatesPillLabel(count);

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View
        style={[
          styles.pill,
          { backgroundColor: theme.primary },
          Shadows.md,
        ]}>
        <Pressable
          accessibilityLabel={`${label}. ${OFFICE_UPDATES_OPEN_LABEL}.`}
          accessibilityRole="button"
          onPress={onOpen}
          testID={testID}
          style={({ pressed }) => [styles.open, pressed && styles.pressed]}>
          <Feather name="bell" size={18} color={theme.onPrimary} />
          <Text numberOfLines={1} style={[styles.label, { color: theme.onPrimary }]}>
            {label}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={OFFICE_UPDATES_DISMISS_LABEL}
          accessibilityRole="button"
          hitSlop={6}
          onPress={onDismiss}
          testID={`${testID}.dismiss`}
          style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}>
          <Feather name="x" size={16} color={theme.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    alignItems: 'center',
    bottom: OFFICE_UPDATES_PILL_GAP,
    left: 0,
    paddingHorizontal: Spacing.lg,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  pill: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flexDirection: 'row',
    maxWidth: Layout.mobileMaxWidth,
    minHeight: OFFICE_UPDATES_PILL_HEIGHT,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
  },
  open: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    minHeight: OFFICE_UPDATES_PILL_HEIGHT,
    paddingRight: Spacing.sm,
  },
  label: { ...Typography.bodySmall, fontWeight: '800' },
  dismiss: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: { opacity: 0.74 },
});

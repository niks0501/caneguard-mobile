import type { ReactElement } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type NoticeProps = {
  children: ReactElement | ReactElement[];
  icon?: keyof typeof Feather.glyphMap;
  testID?: string;
};

/**
 * The shared quiet status line. Whisper renders as plain ink text with no box,
 * so normal states never draw attention.
 */
export function Notice({ children, icon, testID }: NoticeProps) {
  const theme = useTheme();

  return (
    <View accessibilityLiveRegion="polite" testID={testID} style={styles.notice}>
      {icon ? <Feather name={icon} size={16} color={theme.textSecondary} /> : null}
      <View style={styles.copy}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  copy: { flex: 1, gap: 2 },
});

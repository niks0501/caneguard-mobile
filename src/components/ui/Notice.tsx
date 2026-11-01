import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { SYNC_TONE_COLOR, type SyncTone } from '@/features/sync/utils/syncStatusCopy';
import { useTheme } from '@/hooks/use-theme';

export type NoticeProps = {
  /** One line, or rich children when the notice carries more than a sentence. */
  children: ReactNode;
  icon?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Whisper is plain ink with no box; Note is amber; Stop is red. */
  tone?: SyncTone;
  title?: string;
};

/**
 * The shared quiet-by-default status line. Whisper renders as plain ink text,
 * so normal states never draw a box. Only Note and Stop are tinted blocks,
 * which keeps colour meaning "look here". Use at most one tinted Notice per
 * screen.
 */
export function Notice({
  children,
  icon,
  style,
  testID,
  title,
  tone = 'whisper',
}: NoticeProps) {
  const theme = useTheme();
  const color = theme[SYNC_TONE_COLOR[tone]];
  const tinted = tone !== 'whisper';

  return (
    <View
      accessibilityLiveRegion={tone === 'stop' ? 'assertive' : 'polite'}
      accessibilityRole={tone === 'stop' ? 'alert' : undefined}
      testID={testID}
      style={[
        styles.notice,
        tinted && {
          backgroundColor: tone === 'stop' ? theme.dangerBg : theme.warningBg,
          borderRadius: Radius.md,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
        },
        style,
      ]}>
      {icon ? <Feather name={icon} size={16} color={color} /> : null}
      <View style={styles.copy}>
        {title ? <Text style={[styles.title, { color }]}>{title}</Text> : null}
        {typeof children === 'string' ? (
          <Text style={[styles.message, { color }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  copy: { flex: 1, gap: 2 },
  title: { ...Typography.bodySmall, fontWeight: '500' },
  message: { ...Typography.bodySmall },
});

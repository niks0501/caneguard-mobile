import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PLACEHOLDERS = new Set([
  'Not provided',
  'Not measured',
  'Unavailable',
  'No previous evidence',
  'Not recorded',
  'Not reported',
]);

export type ClampedTextProps = {
  containerStyle?: StyleProp<ViewStyle>;
  maxLines?: number;
  style?: StyleProp<TextStyle>;
  testID?: string;
  text: string;
};

export function ClampedText({
  containerStyle,
  maxLines = 3,
  style,
  testID,
  text,
}: ClampedTextProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const trimmed = text.trim();
  const isPlaceholder = PLACEHOLDERS.has(trimmed);

  // Long text threshold: more than 3 newline-separated lines or > 120 characters
  const lineCount = text.split('\n').length;
  const isLong = !isPlaceholder && (lineCount > maxLines || trimmed.length > 120);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        numberOfLines={expanded || !isLong ? undefined : maxLines}
        style={style}
        testID={testID}>
        {text}
      </Text>
      {isLong ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less' : 'Show more'}
          hitSlop={8}
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.toggleButton}>
          <Text style={[styles.toggleText, { color: theme.primary }]}>
            {expanded ? 'Show less' : 'Show more'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  toggleButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  toggleText: {
    ...Typography.caption,
    fontWeight: '700',
  },
});

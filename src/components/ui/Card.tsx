import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ComponentTokens } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
};

export function Card({
  accessibilityLabel,
  accessibilityLiveRegion,
  accessibilityRole,
  children,
  onPress,
  style,
  testID,
}: CardProps) {
  const theme = useTheme();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.surfaceElevated,
      borderColor: theme.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityLiveRegion={accessibilityLiveRegion}
        accessibilityRole={accessibilityRole ?? 'button'}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
        testID={testID}>
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion={accessibilityLiveRegion}
      accessibilityRole={accessibilityRole}
      style={cardStyle}
      testID={testID}>
      {children}
    </View>
  );
}

export const AppCard = Card;

const styles = StyleSheet.create({
  card: {
    padding: ComponentTokens.card.padding,
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});

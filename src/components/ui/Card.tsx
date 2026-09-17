import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ComponentTokens, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardVariant = 'flat' | 'elevated' | 'interactive';

export type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
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
  variant = 'flat',
}: CardProps) {
  const theme = useTheme();
  const isInteractive = variant === 'interactive' || Boolean(onPress);

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.surfaceElevated,
      borderColor: theme.border,
    },
    (variant === 'elevated' || variant === 'interactive') && styles.elevated,
    style,
  ];

  if (isInteractive && onPress) {
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
  elevated: {
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});

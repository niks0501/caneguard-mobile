import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { ComponentTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppButtonVariant = 'primary' | 'secondary' | 'text';

type AppButtonProps = {
  children: ReactNode;
  onPress: () => void;
  variant?: AppButtonVariant;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  children,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isText = variant === 'text';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: theme.primary },
        variant === 'secondary' && {
          backgroundColor: theme.surfaceMuted,
          borderColor: theme.border,
          borderWidth: 1,
        },
        isText && styles.textButton,
        pressed && styles.pressed,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          { color: isPrimary ? theme.background : theme.primaryDark },
          isText && { color: theme.primary },
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ComponentTokens.button.height,
    borderRadius: ComponentTokens.button.borderRadius,
    paddingHorizontal: ComponentTokens.button.paddingHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    minHeight: 44,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  label: {
    ...Typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});

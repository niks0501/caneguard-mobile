import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ComponentTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppButtonVariant = 'primary' | 'secondary' | 'text';

type AppButtonProps = {
  children: ReactNode;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  leadingIcon?: keyof typeof Feather.glyphMap;
  trailingIcon?: keyof typeof Feather.glyphMap;
};

export function AppButton({
  children,
  onPress,
  variant = 'primary',
  disabled,
  accessibilityLabel,
  style,
  leadingIcon,
  trailingIcon,
}: AppButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isText = variant === 'text';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: disabled ? theme.primaryLight : theme.primary },
        variant === 'secondary' && {
          backgroundColor: disabled ? theme.surfaceMuted : theme.surfaceMuted,
          borderColor: disabled ? theme.divider : theme.border,
          borderWidth: 1,
        },
        isText && styles.textButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        {leadingIcon ? <Feather name={leadingIcon} size={18} color={isPrimary ? theme.background : theme.primaryDark} /> : null}
        <Text
          style={[
            styles.label,
            { color: isPrimary ? theme.background : theme.primaryDark },
            isText && { color: disabled ? theme.textSecondary : theme.primary },
            disabled && { color: theme.textSecondary },
          ]}>
          {children}
        </Text>
        {trailingIcon ? <Feather name={trailingIcon} size={18} color={isPrimary ? theme.background : theme.primaryDark} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ComponentTokens.button.height,
    borderRadius: ComponentTokens.button.borderRadius,
    paddingHorizontal: ComponentTokens.button.paddingHorizontal,
    paddingVertical: 12,
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
    flexShrink: 1,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ComponentTokens.button.gap,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.55,
  },
});

import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ComponentTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

type AppButtonProps = {
  children: ReactNode;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  /** Work is in progress: keeps the active fill and full-ink label and shows a spinner. Implies disabled. */
  busy?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  leadingIcon?: keyof typeof Feather.glyphMap;
  trailingIcon?: keyof typeof Feather.glyphMap;
};

export function AppButton({
  children,
  onPress,
  variant = 'primary',
  disabled: disabledProp,
  busy = false,
  accessibilityLabel,
  testID,
  style,
  leadingIcon,
  trailingIcon,
}: AppButtonProps) {
  const theme = useTheme();
  const disabled = disabledProp || busy;
  // A busy button keeps its active look; only an idle disabled button is muted.
  const muted = disabled && !busy;
  const isPrimary = variant === 'primary';
  const isText = variant === 'text';
  const isDanger = variant === 'danger';

  const labelColor = muted
    ? theme.textSecondary
    : isPrimary
      ? theme.background
      : isDanger
        ? theme.danger
        : isText
          ? theme.primary
          : theme.primaryDark;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={busy ? { disabled: true, busy: true } : { disabled }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: theme.primary },
        variant === 'secondary' && {
          backgroundColor: theme.surfaceMuted,
          borderColor: theme.border,
          borderWidth: 1,
        },
        isDanger && {
          backgroundColor: theme.dangerBg,
          borderColor: theme.danger,
          borderWidth: 1,
        },
        isText && styles.textButton,
        muted && {
          backgroundColor: theme.surfaceMuted,
          borderColor: theme.primaryLight,
          borderWidth: 1,
        },
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <View style={styles.content}>
        {busy ? <ActivityIndicator size="small" color={labelColor} testID={testID ? `${testID}.spinner` : undefined} /> : null}
        {leadingIcon && !busy ? (
          <Feather
            name={leadingIcon}
            size={18}
            color={labelColor}
          />
        ) : null}
        <Text
          style={[
            styles.label,
            { color: labelColor },
          ]}>
          {children}
        </Text>
        {trailingIcon && !busy ? (
          <Feather
            name={trailingIcon}
            size={18}
            color={labelColor}
          />
        ) : null}
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
});

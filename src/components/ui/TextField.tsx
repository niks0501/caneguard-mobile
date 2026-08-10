import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, type KeyboardTypeOptions } from 'react-native';

import { ComponentTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  textContentType?: ComponentProps<typeof TextInput>['textContentType'];
  testID?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  textContentType,
  testID,
}: TextFieldProps) {
  const theme = useTheme();

  return (
    <>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textContentType={textContentType}
        style={[
          styles.input,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.label,
    marginBottom: 6,
  },
  input: {
    minHeight: ComponentTokens.input.minHeight,
    borderRadius: ComponentTokens.input.borderRadius,
    borderWidth: ComponentTokens.input.borderWidth,
    paddingHorizontal: ComponentTokens.input.paddingHorizontal,
    ...Typography.body,
  },
});

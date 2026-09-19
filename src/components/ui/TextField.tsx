import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, type KeyboardTypeOptions } from 'react-native';

import { ComponentTokens, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /**
   * Persistent guidance shown under the label and announced with the input.
   * Use it for field definitions and examples that must survive typing, since
   * a placeholder disappears as soon as the inspector starts writing.
   */
  hint?: string;
  secureTextEntry?: boolean;
  maxLength?: number;
  multiline?: boolean;
  editable?: boolean;
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
  hint,
  secureTextEntry,
  maxLength,
  multiline = false,
  editable = true,
  keyboardType,
  autoCapitalize = 'sentences',
  textContentType,
  testID,
}: TextFieldProps) {
  const theme = useTheme();

  return (
    <>
      <Text style={[styles.label, hint ? styles.labelWithHint : null, { color: theme.text }]}>
        {label}
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{hint}</Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        multiline={multiline}
        editable={editable}
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
          multiline && styles.multilineInput,
          !editable && styles.disabledInput,
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
  labelWithHint: {
    marginBottom: 2,
  },
  hint: {
    ...Typography.caption,
    marginBottom: 6,
  },
  input: {
    minHeight: ComponentTokens.input.minHeight,
    borderRadius: ComponentTokens.input.borderRadius,
    borderWidth: ComponentTokens.input.borderWidth,
    paddingHorizontal: ComponentTokens.input.paddingHorizontal,
    ...Typography.body,
  },
  disabledInput: { opacity: 0.55 },
  multilineInput: {
    minHeight: 120,
    paddingTop: ComponentTokens.input.paddingHorizontal,
    textAlignVertical: 'top',
  },
});

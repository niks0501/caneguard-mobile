import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { HelpHint } from '@/components/ui/HelpHint';
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
  /**
   * Worked example hidden behind the help (i) affordance. When set, `hint`
   * carries only the short definition while this text is reachable by tapping
   * the icon (decided Q6 option A). It is also the icon's accessibilityHint,
   * so screen readers announce it without a tap.
   */
  helpHintText?: string;
  helpHintTestID?: string;
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
  helpHintTestID,
  helpHintText,
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
      {helpHintText ? (
        <View style={styles.labelRow}>
          <Text style={[styles.labelText, hint ? styles.labelWithHint : null, { color: theme.text }]}>
            {label}
          </Text>
          <HelpHint label={label} text={helpHintText} testID={helpHintTestID} />
        </View>
      ) : (
        <Text style={[styles.label, hint ? styles.labelWithHint : null, { color: theme.text }]}>
          {label}
        </Text>
      )}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelText: {
    ...Typography.label,
    flex: 1,
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

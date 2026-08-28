import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SymptomChecklistItemProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  selectionMode?: 'checkbox' | 'radio';
  testID?: string;
};

export function SymptomChecklistItem({
  label,
  selected,
  onToggle,
  selectionMode = 'checkbox',
  testID,
}: SymptomChecklistItemProps) {
  const theme = useTheme();
  const isRadio = selectionMode === 'radio';

  return (
    <Pressable
      accessibilityRole={isRadio ? 'radio' : 'checkbox'}
      accessibilityState={isRadio ? { selected } : { checked: selected }}
      testID={testID}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.surfaceElevated,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && { opacity: 0.78 },
      ]}>
      <View
        style={[
          styles.checkbox,
          isRadio && styles.radio,
          {
            borderColor: selected ? theme.primary : theme.border,
            backgroundColor: selected && !isRadio ? theme.primary : 'transparent',
          },
        ]}>
        {isRadio
          ? selected
            ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />
            : null
          : selected
            ? <Text style={styles.checkmark}>{'✓'}</Text>
            : null}
      </View>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 62,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  radio: {
    borderRadius: Radius.full,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  label: {
    ...Typography.body,
    flex: 1,
  },
});

import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAX_VISIBLE_OPTIONS = 30;

/**
 * Searchable barangay picker backed by the cached reference list (D3).
 *
 * Values that are not part of the reference list (for example a legacy
 * free-text barangay saved by an older app version) remain selectable:
 * the current value is pinned at the top of the list, and any typed value
 * that matches nothing can be kept as-is.
 */
export function BarangayPicker({
  barangays,
  onChange,
  testID = 'field-report.barangay-input',
  value,
}: {
  barangays: string[];
  onChange: (value: string) => void;
  testID?: string;
  value: string;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const options = useMemo(
    () => filterBarangayOptions(barangays, query),
    [barangays, query],
  );
  const currentMissingFromList =
    value.trim().length > 0 && !barangays.includes(value.trim());
  const customMatch = query.trim().length > 0 && options.length === 0;

  const select = (nextValue: string) => {
    onChange(nextValue.trim());
    setExpanded(false);
    setQuery('');
  };

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>Barangay</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Barangay"
        accessibilityState={{ expanded }}
        testID={testID}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: expanded ? theme.primary : theme.border,
          },
          pressed && styles.pressed,
        ]}>
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            value.trim() ? { color: theme.text } : { color: theme.textSecondary },
          ]}>
          {value.trim() || 'Select barangay'}
        </Text>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      </Pressable>
      {expanded ? (
        <View
          style={[
            styles.panel,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}>
          <TextInput
            accessibilityLabel="Search barangay"
            testID={`${testID}-search`}
            value={query}
            onChangeText={setQuery}
            placeholder="Search barangay"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            autoFocus
            style={[
              styles.search,
              { backgroundColor: theme.surfaceMuted, borderColor: theme.border, color: theme.text },
            ]}
          />
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {currentMissingFromList ? (
              <BarangayOption
                label={`Keep “${value.trim()}”`}
                onPress={() => select(value)}
                testID={`${testID}-keep-current`}
              />
            ) : null}
            {options.slice(0, MAX_VISIBLE_OPTIONS).map((option) => (
              <BarangayOption
                key={option}
                label={option}
                onPress={() => select(option)}
                testID={`${testID}-option`}
              />
            ))}
            {customMatch ? (
              <BarangayOption
                label={`Use “${query.trim()}” as typed`}
                onPress={() => select(query)}
                testID={`${testID}-custom-option`}
              />
            ) : null}
            {options.length === 0 && !customMatch ? (
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                No matching barangay.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function BarangayOption({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        pressed && { backgroundColor: theme.surfaceMuted },
      ]}>
      <Text style={[styles.optionText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

function filterBarangayOptions(barangays: string[], query: string): string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [...barangays].sort((a, b) => a.localeCompare(b));
  }
  const matches = barangays.filter((barangay) =>
    barangay.toLowerCase().includes(normalizedQuery),
  );
  return matches.sort((a, b) => {
    const aPrefix = a.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
    const bPrefix = b.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
    return aPrefix - bPrefix || a.localeCompare(b);
  });
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { ...Typography.label },
  trigger: {
    minHeight: ComponentTokens.input.minHeight,
    borderRadius: ComponentTokens.input.borderRadius,
    borderWidth: ComponentTokens.input.borderWidth,
    paddingHorizontal: ComponentTokens.input.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  triggerText: { ...Typography.body, flex: 1 },
  pressed: { opacity: 0.8 },
  panel: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  search: {
    minHeight: ComponentTokens.input.minHeight,
    borderRadius: ComponentTokens.input.borderRadius,
    borderWidth: ComponentTokens.input.borderWidth,
    paddingHorizontal: ComponentTokens.input.paddingHorizontal,
    ...Typography.body,
  },
  list: { maxHeight: 260 },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  optionText: { ...Typography.body },
  empty: { ...Typography.caption, padding: Spacing.md, textAlign: 'center' },
});

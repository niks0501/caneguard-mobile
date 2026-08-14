import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Province/municipality picker fed by the cached region list (D2).
 *
 * Selecting a province narrows the municipality options to that province's
 * municipalities. Saved values that are missing from the current list (for
 * example after the server-side list changes) are pinned as options so an
 * in-progress draft never loses its region.
 */
export function RegionPicker({
  municipality,
  municipalities,
  onMunicipalityChange,
  onProvinceChange,
  province,
  provinces,
}: {
  municipality: string;
  municipalities: string[];
  onMunicipalityChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  province: string;
  provinces: string[];
}) {
  const theme = useTheme();
  const [openField, setOpenField] = useState<'municipality' | 'province' | null>(
    null,
  );

  const sortedProvinces = useMemo(
    () =>
      uniqueSorted(
        provinces.includes(province) ? provinces : [province, ...provinces],
      ),
    [provinces, province],
  );
  const sortedMunicipalities = useMemo(
    () =>
      uniqueSorted(
        municipalities.includes(municipality)
          ? municipalities
          : [municipality, ...municipalities],
      ),
    [municipalities, municipality],
  );

  const selectProvince = (nextProvince: string) => {
    onProvinceChange(nextProvince);
    setOpenField('municipality');
  };

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.text }]}>Province</Text>
        <SelectTrigger
          expanded={openField === 'province'}
          onPress={() =>
            setOpenField((current) => (current === 'province' ? null : 'province'))
          }
          testID="field-report.province-input"
          value={province}
        />
        {openField === 'province' ? (
          <SelectPanel
            emptyLabel="No provinces available."
            onSelect={selectProvince}
            options={sortedProvinces}
            testID="field-report.province-option"
          />
        ) : null}
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.text }]}>Municipality</Text>
        <SelectTrigger
          expanded={openField === 'municipality'}
          onPress={() =>
            setOpenField((current) =>
              current === 'municipality' ? null : 'municipality',
            )
          }
          testID="field-report.municipality-input"
          value={municipality}
        />
        {openField === 'municipality' ? (
          <SelectPanel
            emptyLabel="No municipalities available for this province."
            onSelect={(value) => {
              onMunicipalityChange(value);
              setOpenField(null);
            }}
            options={sortedMunicipalities}
            testID="field-report.municipality-option"
          />
        ) : null}
      </View>
    </View>
  );
}

function SelectTrigger({
  expanded,
  onPress,
  testID,
  value,
}: {
  expanded: boolean;
  onPress: () => void;
  testID: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={testID === 'field-report.province-input' ? 'Province' : 'Municipality'}
      accessibilityState={{ expanded }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: expanded ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <Text numberOfLines={1} style={[styles.triggerText, { color: theme.text }]}>
        {value}
      </Text>
      <Feather
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={theme.textSecondary}
      />
    </Pressable>
  );
}

function SelectPanel({
  emptyLabel,
  onSelect,
  options,
  testID,
}: {
  emptyLabel: string;
  onSelect: (value: string) => void;
  options: string[];
  testID: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {options.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            {emptyLabel}
          </Text>
        ) : (
          options.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={option}
              testID={testID}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.option,
                pressed && { backgroundColor: theme.surfaceMuted },
              ]}>
              <Text style={[styles.optionText, { color: theme.text }]}>
                {option}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  field: { flex: 1, gap: 6 },
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
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
    marginTop: Spacing.xs,
  },
  list: { maxHeight: 220 },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  optionText: { ...Typography.body },
  empty: { ...Typography.caption, padding: Spacing.md, textAlign: 'center' },
});

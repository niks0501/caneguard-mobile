import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HelpHintGroup } from '@/components/ui/HelpHint';
import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

/**
 * Field Report optional details (F6) as a native sheet route. The sheet
 * opens with zero fetching: the four current values arrive as route params,
 * edits stay local until Save, and Save returns them to the review step,
 * which applies them to the same Draft save path. Cancel keeps whatever was
 * typed on the parent screen untouched.
 */
export function FieldReportDetailsSheet() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    caneClass?: string | string[];
    cropAge?: string | string[];
    notes?: string | string[];
    scanRecordId?: string | string[];
    variety?: string | string[];
  }>();
  const scanRecordId = firstParam(params.scanRecordId);
  const initial = {
    caneClass: firstParam(params.caneClass),
    cropAge: firstParam(params.cropAge),
    notes: firstParam(params.notes),
    variety: firstParam(params.variety),
  };
  const [variety, setVariety] = useState(initial.variety);
  const [cropAge, setCropAge] = useState(initial.cropAge);
  const [caneClass, setCaneClass] = useState(initial.caneClass);
  const [notes, setNotes] = useState(initial.notes);
  const [closed, setClosed] = useState(false);
  const dirty =
    variety !== initial.variety ||
    cropAge !== initial.cropAge ||
    caneClass !== initial.caneClass ||
    notes !== initial.notes;

  const close = () => {
    setClosed(true);
    router.back();
  };

  const save = () => {
    setClosed(true);
    router.dismissTo({
      params: {
        caneClass,
        cropAge,
        detailsSaved: '1',
        notes,
        scanRecordId: scanRecordId || undefined,
        variety,
      },
      pathname: '/field-report',
    });
  };

  if (closed) {
    return null;
  }

  return (
    <SheetScreen
      title="More field details"
      testID="field-report.optional-details-sheet"
      isDirty={dirty}
      onCancel={close}
      onSubmit={save}
      submitLabel="Save details"
      submitTestID="field-report.save-optional-details">
      <View style={styles.fields}>
        <HelpHintGroup>
        <TextField
          testID="field-report.variety-input"
          label="Sugarcane variety"
          helpHintText="The planted variety, for example Phil 2000, if the farmer knows it."
          value={variety}
          onChangeText={setVariety}
          placeholder="Optional"
          autoCapitalize="words"
        />
        <TextField
          testID="field-report.crop-age-input"
          label="Crop age"
          helpHintText="How old the crop is, for example ~3 months."
          value={cropAge}
          onChangeText={setCropAge}
          placeholder="Optional, e.g. ~3 months"
          autoCapitalize="sentences"
        />
        <TextField
          testID="field-report.cane-class-input"
          label="Cane class"
          helpHintText="Plant cane or ratoon, if known."
          value={caneClass}
          onChangeText={setCaneClass}
          placeholder="Optional"
          autoCapitalize="words"
        />
        <TextField
          testID="field-report.notes-input"
          label="Field notes"
          helpHintText="Anything else the office should know about this field."
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
          autoCapitalize="sentences"
        />
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>
          These optional details never block finalization.
        </Text>
        </HelpHintGroup>
      </View>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.lg,
  },
  helpText: { ...Typography.caption },
});

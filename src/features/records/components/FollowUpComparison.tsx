import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { possibleConditionLine } from '@/features/records/components/possibleConditionLine';
import { MAX_PERSONAL_NOTE_LENGTH } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

/**
 * Check Again step of the result screen: the first photo and the new photo
 * side by side, each with its date and its own Possible Condition line, plus
 * the farmer's own words. It shows no trend, score comparison or verdict.
 */
export function FollowUpComparison({
  newPredictedLabel,
  newSourceUri,
  note,
  noteEditable,
  onNoteChange,
  originalId,
  saved,
}: {
  newPredictedLabel: string;
  newSourceUri: string;
  note: string;
  noteEditable: boolean;
  onNoteChange: (value: string) => void;
  originalId: string;
  saved: boolean;
}) {
  const theme = useTheme();
  const copy = useFarmerCopy().checkAgain;
  const original = useScanRecordDetails(originalId).data;
  const [newPhotoDate] = useState(() => formatDateTime(new Date()));
  const [originalImageFailed, setOriginalImageFailed] = useState(false);

  return (
    <View testID="scan.follow-up" style={styles.container}>
      <Text style={[styles.heading, { color: theme.primaryDark }]}>{copy.compareHeading}</Text>
      <View style={styles.pair}>
        <View style={styles.side}>
          <Text style={[styles.sideTitle, { color: theme.text }]}>{copy.firstPhoto}</Text>
          {original && !originalImageFailed ? (
            <ExpoImage
              testID="scan.follow-up.original-image"
              source={{ uri: original.managedImageUri }}
              contentFit="cover"
              onError={() => setOriginalImageFailed(true)}
              style={[styles.image, { backgroundColor: theme.surfaceMuted }]}
            />
          ) : (
            <View style={[styles.image, styles.missing, { backgroundColor: theme.surfaceMuted }]}>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>
                {copy.firstPhotoUnavailable}
              </Text>
            </View>
          )}
          {original ? (
            <>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>
                {formatDateTime(original.createdAt, original.createdAt)}
              </Text>
              <Text style={[styles.caption, { color: theme.text }]}>
                {possibleConditionLine(copy.possibleCondition, original.predictedLabel)}
              </Text>
            </>
          ) : null}
        </View>
        <View style={styles.side}>
          <Text style={[styles.sideTitle, { color: theme.text }]}>{copy.newPhoto}</Text>
          <ExpoImage
            testID="scan.follow-up.new-image"
            source={{ uri: newSourceUri }}
            contentFit="cover"
            style={[styles.image, { backgroundColor: theme.surfaceMuted }]}
          />
          <Text style={[styles.caption, { color: theme.textSecondary }]}>{newPhotoDate}</Text>
          <Text style={[styles.caption, { color: theme.text }]}>
            {possibleConditionLine(copy.possibleCondition, newPredictedLabel)}
          </Text>
        </View>
      </View>
      <Text style={[styles.caption, { color: theme.textSecondary }]}>{copy.compareNotice}</Text>
      <TextField
        testID="scan.follow-up.note"
        label={copy.noteLabel}
        placeholder={copy.notePlaceholder}
        value={note}
        onChangeText={onNoteChange}
        maxLength={MAX_PERSONAL_NOTE_LENGTH}
        multiline
        editable={noteEditable}
      />
      {saved ? (
        <Text testID="scan.follow-up.saved" style={[styles.caption, { color: theme.success }]}>
          {copy.followUpSaved}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  heading: { ...Typography.subheading },
  pair: { flexDirection: 'row', gap: Spacing.md },
  side: { flex: 1, gap: Spacing.xs },
  sideTitle: { ...Typography.bodySmall, fontWeight: '800' },
  image: { width: '100%', aspectRatio: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  missing: { alignItems: 'center', justifyContent: 'center', padding: Spacing.sm },
  caption: { ...Typography.caption },
});

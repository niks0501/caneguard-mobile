import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ClampedText } from '@/components/ui/ClampedText';
import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import type { ModelLabel } from '@/features/detection/constants/modelContract';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { getScanCardId } from '@/features/records/domain/scanId';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

export interface ScanCardRecord {
  createdAt: string;
  id: string;
  managedImageUri: string;
  /** The record's saved personal note (Check Again lane); rendered only when present. */
  personalNote?: string | null;
  /** The farmer's optional place in their own words; rendered only when present. */
  personalPlace?: string | null;
  predictedLabel: string;
}

/** Farmer-only card rendered purely from the local scan record. */
export function ScanCard({ record }: { record: ScanCardRecord }) {
  const theme = useTheme();
  const copy = useFarmerCopy().scanCard;
  const metadata = diseaseCatalog[record.predictedLabel as ModelLabel];
  const date = new Date(record.createdAt);
  const note = record.personalNote?.trim();
  const place = record.personalPlace?.trim();

  return (
    <View
      testID="scan.card"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.primaryDark }]}>{copy.title}</Text>
      <ExpoImage
        source={{ uri: record.managedImageUri }}
        contentFit="cover"
        accessibilityLabel={copy.photoLabel}
        testID="scan.card.photo"
        style={[styles.image, { borderColor: theme.border }]}
      />
      <Text testID="scan.card.date" style={[styles.line, { color: theme.textSecondary }]}>
        {copy.dateLabel}: {Number.isNaN(date.getTime()) ? record.createdAt : formatDateTime(date)}
      </Text>
      <Text testID="scan.card.condition" style={[styles.line, { color: theme.text }]}>
        {copy.possibleConditionLabel}: {metadata?.displayName ?? record.predictedLabel}
      </Text>
      <Text testID="scan.card.ai-line" style={[styles.line, { color: theme.textSecondary }]}>
        {copy.aiOnlyLine}
      </Text>
      {place ? (
        <Text testID="scan.card.place" style={[styles.line, { color: theme.text }]}>
          {copy.placeCardLabel}: {place}
        </Text>
      ) : null}
      {note ? (
        <View style={styles.note}>
          <Text style={[styles.noteLabel, { color: theme.textSecondary }]}>{copy.noteLabel}</Text>
          <ClampedText testID="scan.card.note" text={note} style={{ color: theme.text }} />
        </View>
      ) : null}
      <Text testID="scan.card.id" style={[styles.id, { color: theme.primaryDark }]}>
        {copy.scanIdLabel}: {getScanCardId(record.id)}
      </Text>
      <Text testID="scan.card.footer" style={[styles.footer, { color: theme.textSecondary }]}>
        {copy.footer}
      </Text>
    </View>
  );
}

/** Loads the just-saved record from the device database, never the network. */
export function SavedScanCard({ recordId }: { recordId: string }) {
  const copy = useFarmerCopy().scanCard;
  const theme = useTheme();
  const { data, loading, refresh } = useScanRecordDetails(recordId);
  if (data) {
    return <ScanCard record={data} />;
  }
  if (loading) {
    return (
      <Text testID="scan.card.loading" style={{ color: theme.textSecondary }}>
        {copy.loading}
      </Text>
    );
  }
  return (
    <View testID="scan.card.error" style={styles.loadFailure}>
      <Text testID="scan.card.error-message" style={{ color: theme.danger }}>{copy.loadError}</Text>
      <AppButton
        testID="scan.card.retry"
        variant="secondary"
        leadingIcon="refresh-cw"
        onPress={() => void refresh()}>
        {copy.retryLoad}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: ComponentTokens.screen.horizontalPadding,
    gap: Spacing.sm,
  },
  title: { ...Typography.subheading },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.lg, borderWidth: 1 },
  line: { ...Typography.body },
  loadFailure: { gap: Spacing.sm },
  note: { gap: Spacing.xs },
  noteLabel: { ...Typography.bodySmall },
  footer: { ...Typography.caption },
  id: { ...Typography.body, fontWeight: '600' },
});

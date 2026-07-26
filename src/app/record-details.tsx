import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { getResultLabel } from '@/components/ui/RecordCard';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { CHECKLIST_OBSERVATIONS } from '@/features/detection/checklist/checklistConsistency';
import { getQualityWarningMessage } from '@/features/detection/validation/assessImageQuality';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { deleteScanRecord } from '@/features/records/services/deleteScanRecord';
import { useTheme } from '@/hooks/use-theme';

const CONSISTENCY_LABELS: Record<
  ScanRecordDetails['checklistConsistency'],
  string
> = {
  consistent: 'Checklist consistent',
  inconsistent: 'Checklist inconsistent',
  'not-applicable': 'Checklist cannot be compared',
  'not-enough-information': 'Not enough checklist information',
};

export default function RecordDetailsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? null);
  const record = useScanRecordDetails(id);
  const database = useCaneGuardDatabase();
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = () => {
    Alert.alert(
      'Delete local record?',
      'This removes the record and its saved image from this device. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void performDelete(),
        },
      ],
    );
  };

  const performDelete = async () => {
    if (!id || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteScanRecord(database, id);
      if (result.imageCleanupError) {
        Alert.alert(
          'Record deleted',
          'The database record was removed, but the saved image could not be cleaned up. CaneGuard can identify it for later maintenance.',
        );
      }
      router.replace('/records');
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'DELETE_FAILED',
        'Deleting a scan record failed.',
      );
      setDeleteError(getStorageErrorMessage(storageError));
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Saved Record" />
        {record.loading ? (
          <CenteredState
            icon="loader"
            title="Loading saved record"
            message="Reading record details from this device.">
            <ActivityIndicator
              accessibilityLabel="Loading saved record details"
              color={theme.primary}
            />
          </CenteredState>
        ) : record.errorMessage || !record.data ? (
          <CenteredState
            icon="alert-triangle"
            title="Saved record unavailable"
            message={record.errorMessage ?? 'This saved record could not be found.'}
            liveRegion="assertive">
            <AppButton onPress={() => void record.refresh()} leadingIcon="refresh-cw">
              Try Again
            </AppButton>
          </CenteredState>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View
                style={[
                  styles.imageFrame,
                  {
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                  },
                ]}>
                {imageUnavailable ? (
                  <View
                    accessibilityLabel="Saved image unavailable; record metadata remains available"
                    style={styles.imageFallback}>
                    <Feather name="image" size={34} color={theme.textSecondary} />
                    <Text
                      style={[
                        styles.imageFallbackText,
                        { color: theme.textSecondary },
                      ]}>
                      Saved image unavailable
                    </Text>
                  </View>
                ) : (
                  <ExpoImage
                    source={{ uri: record.data.managedImageUri }}
                    contentFit="cover"
                    accessibilityLabel="Saved sugarcane scan image"
                    onError={() => setImageUnavailable(true)}
                    style={styles.image}
                  />
                )}
              </View>

              <View
                style={[
                  styles.hero,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}>
                <Text style={[styles.result, { color: theme.primaryDark }]}>
                  {getResultLabel(record.data.predictedLabel)}
                </Text>
                <Text style={[styles.confidence, { color: theme.primary }]}>
                  {Math.round(record.data.confidence * 100)}% AI confidence
                </Text>
                <View style={styles.localStatus}>
                  <Feather name="smartphone" size={16} color={theme.info} />
                  <Text style={[styles.localStatusText, { color: theme.info }]}>
                    Local record, not yet connected to MAO
                  </Text>
                </View>
              </View>

              <Section title="All model class scores">
                {record.data.classScores.map((score) => (
                  <DetailRow
                    key={score.label}
                    label={formatClassLabel(score.label)}
                    value={`${Math.round(score.score * 100)}%`}
                  />
                ))}
              </Section>

              <Section title="Observation context">
                <DetailRow
                  label="Checklist"
                  value={CONSISTENCY_LABELS[record.data.checklistConsistency]}
                />
                <DetailRow
                  label="Reported severity"
                  value={record.data.reportedSeverity ?? 'Not provided'}
                />
                <DetailRow
                  label="Barangay"
                  value={record.data.barangay ?? 'Not provided'}
                />
                <ObservationList
                  title="Selected observations"
                  values={record.data.symptoms.map(getObservationLabel)}
                  emptyLabel="None selected"
                />
                <ObservationList
                  title="Image quality notices"
                  values={record.data.qualityWarnings.map(
                    getQualityWarningMessage,
                  )}
                  emptyLabel="No warnings stored"
                />
              </Section>

              <Section title="Saved analysis details">
                <DetailRow label="Model version" value={record.data.modelVersion} />
                <DetailRow
                  label="Preprocessing"
                  value={`${formatDuration(record.data.preprocessMs)} ms`}
                />
                <DetailRow
                  label="Inference"
                  value={`${formatDuration(record.data.inferenceMs)} ms`}
                />
                <DetailRow
                  label="Total processing"
                  value={`${formatDuration(record.data.totalMs)} ms`}
                />
                <DetailRow
                  label="Saved"
                  value={formatSavedAt(record.data.createdAt)}
                />
              </Section>

              <View
                style={[
                  styles.disclaimer,
                  { backgroundColor: theme.infoBg, borderColor: theme.info },
                ]}>
                <Feather name="info" size={19} color={theme.info} />
                <Text style={[styles.disclaimerText, { color: theme.text }]}>
                  This stored output is AI-supported decision support only. It
                  does not confirm a disease.
                </Text>
              </View>

              {deleteError ? (
                <Text
                  accessibilityLiveRegion="assertive"
                  style={[styles.deleteError, { color: theme.danger }]}>
                  {deleteError}
                </Text>
              ) : null}
              <AppButton
                onPress={confirmDelete}
                disabled={deleting}
                variant="secondary"
                leadingIcon="trash-2"
                accessibilityLabel="Delete this local record and saved image">
                {deleting ? 'Deleting...' : 'Delete Local Record'}
              </AppButton>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function CenteredState({
  children,
  icon,
  liveRegion,
  message,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Feather.glyphMap;
  liveRegion?: 'none' | 'polite' | 'assertive';
  message: string;
  title: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityLiveRegion={liveRegion}
      style={styles.centeredState}>
      <View
        style={[
          styles.stateCard,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        ]}>
        <Feather name={icon} size={28} color={theme.primary} />
        <Text style={[styles.stateTitle, { color: theme.primaryDark }]}>
          {title}
        </Text>
        <Text style={[styles.stateMessage, { color: theme.textSecondary }]}>
          {message}
        </Text>
        <View style={styles.stateAction}>{children}</View>
      </View>
    </View>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function ObservationList({
  emptyLabel,
  title,
  values,
}: {
  emptyLabel: string;
  title: string;
  values: string[];
}) {
  const theme = useTheme();
  return (
    <View style={styles.observations}>
      <Text style={[styles.observationTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      {(values.length ? values : [emptyLabel]).map((value) => (
        <View key={value} style={styles.observation}>
          <View
            style={[styles.observationBullet, { backgroundColor: theme.primary }]}
          />
          <Text style={[styles.observationText, { color: theme.text }]}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getObservationLabel(key: string): string {
  return (
    CHECKLIST_OBSERVATIONS.find((observation) => observation.id === key)?.label ??
    key
  );
}

function formatDuration(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatClassLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSavedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  imageFallbackText: { ...Typography.bodySmall },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  result: { ...Typography.heading, fontWeight: '800' },
  confidence: { ...Typography.subheading, fontWeight: '800' },
  localStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  localStatusText: { ...Typography.caption, flex: 1 },
  section: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: { ...Typography.subheading },
  row: {
    minHeight: 38,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowLabel: { ...Typography.bodySmall, flex: 1 },
  rowValue: {
    ...Typography.bodySmall,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
  },
  observations: { gap: Spacing.sm },
  observationTitle: { ...Typography.bodySmall, fontWeight: '800' },
  observation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  observationBullet: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    marginTop: 7,
  },
  observationText: { ...Typography.caption, flex: 1 },
  disclaimer: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  disclaimerText: { ...Typography.caption, flex: 1 },
  deleteError: { ...Typography.bodySmall, fontWeight: '700' },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  stateCard: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stateTitle: { ...Typography.subheading, textAlign: 'center' },
  stateMessage: { ...Typography.bodySmall, textAlign: 'center' },
  stateAction: { width: '100%', marginTop: Spacing.sm },
});

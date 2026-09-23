import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { Row } from '@/components/ui/Row';
import { useToast } from '@/components/ui/Toast';
import { DECISION_SUPPORT_DISCLAIMER } from '@/constants/copy';
import {
  getResultLabel,
  getSyncPresentation,
} from '@/components/ui/RecordCard';
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
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import type { SyncStatus } from '@/database/schema';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { deleteScanRecord } from '@/features/records/services/deleteScanRecord';
import { useFieldReportForScan } from '@/features/reports/hooks/useFieldReportDraft';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { getSyncErrorMessage } from '@/features/sync/errors/syncErrors';
import { useSync } from '@/features/sync/hooks/useSync';
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
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? null);
  const record = useScanRecordDetails(id);
  const fieldReport = useFieldReportForScan(id);
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const sync = useSync();
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const synchronizationMetadata = fieldReport.data ?? record.data;

  const retrySync = async () => {
    if (!fieldReport.data || retrying) {
      return;
    }
    setRetrying(true);
    setRetryError(null);
    try {
      await sync.retryReport(fieldReport.data.id);
      await fieldReport.refresh();
      showToast('Sent to office', 'success');
    } catch (error: unknown) {
      setRetryError(
        getStorageErrorMessage(
          toStorageError(
            error,
            'UPDATE_FAILED',
            'Retrying sending the Field Report failed.',
          ),
        ),
      );
      showToast('Could not send — will try again', 'error');
    } finally {
      setRetrying(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    if (!id || !user || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteScanRecord(database, id, user.uuid);
      if (result.imageCleanupError) {
        Alert.alert(
          'Record deleted',
          'The database record was removed, but the saved image could not be cleaned up. CaneGuard can identify it for later maintenance.',
        );
      }
      showToast('Record deleted', 'success');
      router.replace('/activity' as Href);
    } catch (error: unknown) {
      const storageError = toStorageError(
        error,
        'DELETE_FAILED',
        'Deleting a scan record failed.',
      );
      const msg = getStorageErrorMessage(storageError);
      setDeleteError(msg);
      showToast('Could not delete record — please try again', 'error');
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView
      testID="records.details-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Saved record" />
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
                <Text
                  testID="records.result-title"
                  style={[styles.result, { color: theme.primaryDark }]}>
                  {getResultLabel(record.data.predictedLabel)}
                </Text>
                <RecordSyncStatus
                  errorCode={synchronizationMetadata?.lastSyncErrorCode}
                  status={fieldReport.data?.syncStatus ?? record.data.syncStatus}
                />
              </View>

              <Section title="Field report">
                <Text style={[styles.reportMessage, { color: theme.textSecondary }]}>
                  {getFieldReportAction(
                    fieldReport.data,
                    record.data.syncStatus,
                    fieldReport.hasOtherOwnerReport,
                  ).message}
                </Text>
                {fieldReport.errorMessage ? (
                  <Text style={[styles.deleteError, { color: theme.danger }]}>
                    {fieldReport.errorMessage}
                  </Text>
                ) : null}
                <AppButton
                  testID="records.open-field-report"
                  onPress={() =>
                    router.push({
                      pathname: '/field-report',
                      params: { scanRecordId: record.data!.id },
                    } as unknown as Href)
                  }
                  disabled={
                    fieldReport.loading ||
                    getFieldReportAction(
                      fieldReport.data,
                      record.data.syncStatus,
                      fieldReport.hasOtherOwnerReport,
                    ).disabled
                  }
                  leadingIcon={
                    getFieldReportAction(
                      fieldReport.data,
                      record.data.syncStatus,
                      fieldReport.hasOtherOwnerReport,
                    ).icon
                  }
                  accessibilityLabel={
                    getFieldReportAction(
                      fieldReport.data,
                      record.data.syncStatus,
                      fieldReport.hasOtherOwnerReport,
                    ).accessibilityLabel
                  }>
                  {fieldReport.loading
                    ? 'Checking Draft...'
                    : getFieldReportAction(
                        fieldReport.data,
                        record.data.syncStatus,
                        fieldReport.hasOtherOwnerReport,
                      ).label}
                </AppButton>
              </Section>

              {deleteError ? (
                <Text
                  accessibilityLiveRegion="assertive"
                  style={[styles.deleteError, { color: theme.danger }]}>
                  {deleteError}
                </Text>
              ) : null}
              <ConfirmDialog
                visible={showDeleteConfirm}
                title="Delete local record?"
                message="This removes the scan, its saved image, and any associated Field Report from this device. This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                destructive
                onConfirm={() => {
                  setShowDeleteConfirm(false);
                  void performDelete();
                }}
                onCancel={() => setShowDeleteConfirm(false)}
                testID="records.confirm-delete"
              />
              <AppButton
                onPress={confirmDelete}
                disabled={deleting}
                variant="secondary"
                leadingIcon="trash-2"
                accessibilityLabel="Delete this local record and saved image">
                {deleting ? 'Deleting...' : 'Delete Local Record'}
              </AppButton>

              <Section title="Observation context">
                <DetailRow
                  label="Checklist"
                  value={CONSISTENCY_LABELS[record.data.checklistConsistency]}
                />
                <DetailRow
                  label="Reported severity"
                  value={record.data.reportedSeverity ?? 'Not provided'}
                />
                <ObservationList
                  title="Selected observations"
                  values={record.data.symptoms.map(getObservationLabel)}
                  emptyLabel="None selected"
                  visibleCount={3}
                />
                <ObservationList
                  title="Image quality notices"
                  values={record.data.qualityWarnings.map(
                    getQualityWarningMessage,
                  )}
                  emptyLabel="None"
                  visibleCount={1}
                />
              </Section>

              <DisclosureSection
                testID="records.saved-details"
                title="Saved record details"
                summary="All 4 saved details">
                <DetailRow label="Decision support" value={record.data.decisionSupportWording} />
                <DetailRow label="Saved on this device" value={formatSavedAt(record.data.createdAt)} />
                <DetailRow
                  label="Office reference"
                  value={synchronizationMetadata?.authorityReview?.referenceCode ?? 'Not yet available'}
                />
                <DetailRow
                  label="Sent to office"
                  value={
                    synchronizationMetadata?.lastSyncedAt
                      ? formatSavedAt(synchronizationMetadata.lastSyncedAt)
                      : 'Not sent yet'
                  }
                />
              </DisclosureSection>

              {synchronizationMetadata?.lastSyncErrorCode ||
              fieldReport.data?.syncStatus === 'pending' ||
              fieldReport.data?.syncStatus === 'failed' ? (
                <DisclosureSection
                  testID="records.sync-details"
                  title="Sending to the office"
                  summary={synchronizationMetadata?.lastSyncErrorCode ? 'Could not send — try again' : 'Waiting to send'}>
                  {synchronizationMetadata?.lastSyncErrorCode ? (
                    <View
                      accessibilityLiveRegion="assertive"
                      style={[
                        styles.syncError,
                        { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                      ]}>
                      <Feather name="alert-triangle" size={19} color={theme.danger} />
                      <Text style={[styles.syncErrorText, { color: theme.text }]}>
                        {getSyncErrorMessage(
                          synchronizationMetadata.lastSyncErrorCode,
                        ) ??
                          'Could not send the report.'}
                      </Text>
                    </View>
                  ) : null}

                  {retryError ? (
                    <Text
                      testID="records.retry-error"
                      accessibilityLiveRegion="assertive"
                      style={[styles.deleteError, { color: theme.danger }]}>
                      {retryError}
                    </Text>
                  ) : null}

                  {fieldReport.data?.syncStatus === 'pending' ||
                  fieldReport.data?.syncStatus === 'failed' ? (
                    <AppButton
                      onPress={() => void retrySync()}
                      disabled={retrying || sync.isSyncing || sync.isOnline !== true}
                      leadingIcon="refresh-cw"
                      accessibilityLabel={
                        retrying ? 'Trying to send the report again' : 'Try sending again'
                      }>
                      {retrying ? 'Trying again...' : 'Try Again'}
                    </AppButton>
                  ) : null}
                </DisclosureSection>
              ) : null}

              <View
                style={[
                  styles.disclaimer,
                  { backgroundColor: theme.infoBg, borderColor: theme.info },
                ]}>
                <Feather name="info" size={19} color={theme.info} />
                <Text style={[styles.disclaimerText, { color: theme.text }]}>
                  {DECISION_SUPPORT_DISCLAIMER}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function getFieldReportAction(
  report: FieldReport | null,
  legacySyncStatus: SyncStatus,
  hasOtherOwnerReport = false,
): {
  accessibilityLabel: string;
  disabled: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  message: string;
} {
  if (!report) {
    if (hasOtherOwnerReport) {
      return {
        accessibilityLabel: 'Field Report owned by another submitter',
        disabled: true,
        icon: 'lock',
        label: 'Report Unavailable',
        message:
          'A Field Report for this scan belongs to another submitter and is unavailable to this account.',
      };
    }
    if (legacySyncStatus === 'synced') {
      return {
        accessibilityLabel: 'Legacy report already sent',
        disabled: true,
        icon: 'check-circle',
        label: 'Legacy Report Sent',
        message:
          'This scan was sent by an earlier app version and cannot be submitted again.',
      };
    }
    if (legacySyncStatus !== 'local_only') {
      return {
        accessibilityLabel: 'Complete legacy Field Report draft',
        disabled: false,
        icon: 'file-plus',
        label: 'Complete Report Draft',
        message:
          'Complete this older unsent scan as a Field Report Draft before sending it.',
      };
    }
    return {
      accessibilityLabel: 'Create Field Report draft',
      disabled: false,
      icon: 'file-plus',
      label: 'Create Report Draft',
      message: 'Create a separate Field Report Draft from this completed scan.',
    };
  }
  if (report.authoringState === 'draft') {
    return {
      accessibilityLabel: 'Resume Field Report draft',
      disabled: false,
      icon: 'edit-3',
      label: 'Resume Draft',
      message: 'Continue the same saved draft. Partial information is preserved.',
    };
  }
  const syncPresentation = getSyncPresentation(
    report.syncStatus,
    report.lastSyncErrorCode,
  );
  return {
    accessibilityLabel: 'Open finalized Field Report',
    disabled: false,
    icon: 'check-circle',
    label: 'View Finalized Report',
    message: `This Field Report is finalized: ${syncPresentation.label}.`,
  };
}

function RecordSyncStatus({
  errorCode,
  status,
}: {
  errorCode: string | null | undefined;
  status: SyncStatus;
}) {
  const theme = useTheme();
  const presentation = getSyncPresentation(status, errorCode);

  return (
    <View style={styles.localStatus}>
      <Feather
        name={presentation.icon}
        size={16}
        color={theme[presentation.color]}
      />
      <Text
        style={[
          styles.localStatusText,
          { color: theme[presentation.color] },
        ]}>
        {presentation.label}
      </Text>
    </View>
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

function DetailRow({
  label,
  value,
  valueTestID,
}: {
  label: string;
  value: string;
  valueTestID?: string;
}) {
  return (
    <Row
      label={label}
      value={value}
      valueTestID={valueTestID}
      withDivider
    />
  );
}

function ObservationList({
  emptyLabel,
  title,
  values,
  visibleCount = 3,
}: {
  emptyLabel: string;
  title: string;
  values: string[];
  visibleCount?: number;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const items = values.length ? values : [emptyLabel];
  const shown = expanded ? items : items.slice(0, visibleCount);
  const remaining = items.length - shown.length;
  const toggleLabel = expanded ? 'Show less' : `Show remaining ${remaining}`;
  return (
    <View style={styles.observations}>
      <Text style={[styles.observationTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      {shown.map((value) => (
        <View key={value} style={styles.observation}>
          <View
            style={[styles.observationBullet, { backgroundColor: theme.primary }]}
          />
          <Text style={[styles.observationText, { color: theme.text }]}>
            {value}
          </Text>
        </View>
      ))}
      {values.length > visibleCount ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${toggleLabel} in ${title}`}
          onPress={() => setExpanded((value) => !value)}
          style={styles.showMore}>
          <Text style={[styles.showMoreText, { color: theme.primary }]}>
            {toggleLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getObservationLabel(key: string): string {
  return (
    CHECKLIST_OBSERVATIONS.find((observation) => observation.id === key)?.label ??
    key
  );
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
  showMore: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  showMoreText: { ...Typography.caption, fontWeight: '800' },
  disclaimer: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  disclaimerText: { ...Typography.caption, flex: 1 },
  syncError: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  syncErrorText: { ...Typography.bodySmall, flex: 1 },
  deleteError: { ...Typography.bodySmall, fontWeight: '700' },
  reportMessage: { ...Typography.bodySmall },
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

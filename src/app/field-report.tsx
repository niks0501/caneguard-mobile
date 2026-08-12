import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { getResultLabel, getSyncPresentation } from '@/components/ui/RecordCard';
import { TextField } from '@/components/ui/TextField';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import type {
  FieldReport,
  FieldReportSubmissionRequirement,
} from '@/features/reports/domain/fieldReportTypes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

export default function FieldReportScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ scanRecordId?: string | string[] }>();
  const scanRecordId = Array.isArray(params.scanRecordId)
    ? params.scanRecordId[0]
    : (params.scanRecordId ?? null);
  const report = useFieldReportDraft(scanRecordId);
  const record = useScanRecordDetails(scanRecordId);
  const { user } = useAuth();
  const sync = useSync();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const finalizeAndSync = async (values: {
    barangay: string;
    farmerOrFarmOwnerName: string;
  }) => {
    const finalized = await report.finalize(values);
    if (finalized) {
      await sync.syncNow('after-save');
      await report.refresh();
    }
  };

  const retrySync = async () => {
    if (!report.data || retrying) {
      return;
    }
    setRetrying(true);
    setRetryError(null);
    try {
      await sync.retryReport(report.data.id);
      await report.refresh();
    } catch (error: unknown) {
      setRetryError(
        getStorageErrorMessage(
          toStorageError(
            error,
            'UPDATE_FAILED',
            'Retrying Field Report synchronization failed.',
          ),
        ),
      );
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SafeAreaView
      testID="field-report.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Field Report Draft" />
        {report.loading && !report.data ? (
          <View style={styles.centered}>
            <ActivityIndicator
              accessibilityLabel="Opening Field Report draft"
              color={theme.primary}
            />
          </View>
        ) : report.errorMessage && !report.data ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>
              {report.errorMessage}
            </Text>
            <AppButton onPress={() => void report.refresh()} leadingIcon="refresh-cw">
              Try Again
            </AppButton>
          </View>
        ) : report.data ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoiding}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}>
              <View style={styles.content}>
              <View
                testID="field-report.authoring-status"
                style={[
                  styles.statusCard,
                  {
                    backgroundColor:
                      report.data.authoringState === 'finalized'
                        ? theme.successBg
                        : theme.warningBg,
                    borderColor:
                      report.data.authoringState === 'finalized'
                        ? theme.success
                        : theme.warning,
                  },
                ]}>
                <Feather
                  name={report.data.authoringState === 'finalized' ? 'check-circle' : 'edit-3'}
                  size={20}
                  color={report.data.authoringState === 'finalized' ? theme.success : theme.warning}
                />
                <View style={styles.statusCopy}>
                  <Text style={[styles.statusTitle, { color: theme.text }]}>
                    {report.data.authoringState === 'finalized'
                      ? `Finalized · ${getSyncPresentation(report.data.syncStatus).label}`
                      : 'Draft'}
                  </Text>
                  <Text style={[styles.statusMessage, { color: theme.textSecondary }]}>
                    {report.data.authoringState === 'finalized'
                      ? `This report is finalized locally. Current synchronization status: ${getSyncPresentation(report.data.syncStatus).label}.`
                      : 'Save incomplete information now and return later. Drafts are stored only on this device and are not queued for synchronization.'}
                  </Text>
                </View>
              </View>

              {report.data.authoringState === 'draft' ? (
                <>
                  <DraftFields
                    key={report.data.id}
                    fieldReport={report.data}
                    reporterName={
                      user?.uuid === report.data.submitterIdentity
                        ? user.name
                        : report.data.submitterIdentity
                    }
                    captureInProgress={report.capturingLocation}
                    finalizing={report.finalizing}
                    saving={report.saving}
                    submissionIssues={report.submissionIssues}
                    onFinalize={(values) => void finalizeAndSync(values)}
                    onSave={(values) => void report.save(values)}
                  />

                  <LocationCapture
                    fieldReport={report.data}
                    capturing={report.capturingLocation}
                    isOnline={sync.isOnline}
                    saveInProgress={report.saving || report.finalizing}
                    onCapture={() => void report.captureLocation()}
                    onOpenMap={() =>
                      router.push(
                        {
                          pathname: './manual-map',
                          params: {
                            reportId: report.data!.id,
                            scanRecordId: report.data!.scanRecordId,
                          },
                        },
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <FinalizedReportSummary fieldReport={report.data} />
                  {report.data.syncStatus === 'pending' ||
                  report.data.syncStatus === 'failed' ? (
                    <AppButton
                      testID="field-report.retry-sync"
                      onPress={() => void retrySync()}
                      disabled={
                        retrying || sync.isSyncing || sync.isOnline !== true
                      }
                      leadingIcon="refresh-cw"
                      accessibilityLabel={
                        retrying
                          ? 'Retrying Field Report synchronization'
                          : 'Sync Field Report'
                      }>
                      {retrying ? 'Synchronizing…' : 'Sync Report'}
                    </AppButton>
                  ) : null}
                </>
              )}

              <InheritedScanEvidence
                record={record.data}
                loading={record.loading}
                errorMessage={record.errorMessage}
                onRetry={() => void record.refresh()}
              />

              {report.errorMessage ? (
                <Text
                  accessibilityLiveRegion="assertive"
                  style={[styles.error, { color: theme.danger }]}>
                  {report.errorMessage}
                </Text>
              ) : null}
              {retryError ? (
                <Text
                  testID="field-report.retry-error"
                  accessibilityLiveRegion="assertive"
                  style={[styles.error, { color: theme.danger }]}>
                  {retryError}
                </Text>
              ) : null}
              {report.saved ? (
                <Text
                  testID="field-report.saved"
                  accessibilityLiveRegion="polite"
                  style={[styles.saved, { color: theme.success }]}>
                  Draft saved on this device.
                </Text>
              ) : null}
              <Text style={[styles.identity, { color: theme.textSecondary }]}>
                Report ID: {report.data.id}
              </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function DraftFields({
  captureInProgress,
  fieldReport,
  onSave,
  onFinalize,
  reporterName,
  saving,
  finalizing,
  submissionIssues,
}: {
  captureInProgress: boolean;
  fieldReport: FieldReport;
  onSave: (values: {
    barangay: string;
    farmerOrFarmOwnerName: string;
  }) => void;
  onFinalize: (values: {
    barangay: string;
    farmerOrFarmOwnerName: string;
  }) => void;
  reporterName: string | null;
  saving: boolean;
  finalizing: boolean;
  submissionIssues: FieldReportSubmissionRequirement[];
}) {
  const theme = useTheme();
  const [farmerName, setFarmerName] = useState(
    fieldReport.farmerOrFarmOwnerName ?? '',
  );
  const [barangay, setBarangay] = useState(fieldReport.barangay ?? '');

  return (
    <>
      <View
        style={[
          styles.formCard,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}>
        <TextField
          testID="field-report.farmer-name-input"
          label="Farmer or farm owner name"
          value={farmerName}
          onChangeText={setFarmerName}
          placeholder="May be added later"
          autoCapitalize="words"
        />
        <TextField
          testID="field-report.barangay-input"
          label="Barangay"
          value={barangay}
          onChangeText={setBarangay}
          placeholder="May be added later"
          autoCapitalize="words"
        />
        <View style={styles.automaticFields}>
          <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>
            Automatic area
          </Text>
          <Text style={[styles.automaticValue, { color: theme.text }]}>
            {fieldReport.municipality}, {fieldReport.province}
          </Text>
        </View>
        <View style={styles.automaticFields}>
          <Text
            style={[styles.automaticLabel, { color: theme.textSecondary }]}>
            Signed-in submitter
          </Text>
          <Text testID="field-report.submitter" style={[styles.automaticValue, { color: theme.text }]}>
            {reporterName ?? 'Authenticated field reporter'} · Field reporter
          </Text>
        </View>
        <View style={styles.automaticFields}>
          <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>
            Observation time
          </Text>
          <Text testID="field-report.observed-at" style={[styles.automaticValue, { color: theme.text }]}>
            {formatTimestamp(fieldReport.observedAt)}
          </Text>
        </View>
      </View>
      <AppButton
        testID="field-report.save-draft"
        onPress={() =>
          onSave({ farmerOrFarmOwnerName: farmerName, barangay })
        }
        disabled={saving || captureInProgress || finalizing}
        leadingIcon="save"
        accessibilityLabel={
          finalizing
            ? 'Save Field Report draft unavailable while finalizing'
            : saving
              ? 'Saving Field Report draft'
              : 'Save Field Report draft'
        }>
        {saving ? 'Saving Draft...' : 'Save Draft'}
      </AppButton>
      {submissionIssues.length > 0 ? (
        <View
          testID="field-report.submission-issues"
          accessibilityLiveRegion="assertive"
          style={[styles.validationCard, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
          <Text style={[styles.validationTitle, { color: theme.danger }]}>Complete these requirements before finalizing:</Text>
          {submissionIssues.map((issue) => (
            <Text key={issue} style={[styles.statusMessage, { color: theme.text }]}>• {SUBMISSION_REQUIREMENT_LABELS[issue]}</Text>
          ))}
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>Your latest entries were saved and this report remains a Draft.</Text>
        </View>
      ) : null}
      <AppButton
        testID="field-report.finalize"
        onPress={() => onFinalize({ farmerOrFarmOwnerName: farmerName, barangay })}
        disabled={saving || captureInProgress || finalizing}
        leadingIcon="check-circle"
        accessibilityLabel={finalizing ? 'Finalizing Field Report' : 'Finalize Field Report'}>
        {finalizing ? 'Finalizing Report…' : 'Finalize Report'}
      </AppButton>
    </>
  );
}

function LocationCapture({
  capturing,
  fieldReport,
  onCapture,
  onOpenMap,
  saveInProgress,
  isOnline,
}: {
  capturing: boolean;
  fieldReport: FieldReport;
  onCapture: () => void;
  onOpenMap: () => void;
  saveInProgress: boolean;
  isOnline: boolean | null;
}) {
  const theme = useTheme();
  const presentation = getGpsPresentation(fieldReport);

  return (
    <View
      style={[
        styles.formCard,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <View style={styles.sectionHeading}>
        <Feather name="map-pin" size={20} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Report location</Text>
      </View>
      <Text
        testID="field-report.gps-status"
        accessibilityLiveRegion="polite"
        style={[styles.statusMessage, { color: theme.textSecondary }]}>
        {presentation.message}
      </Text>
      {fieldReport.gpsAttemptLatitude !== null &&
      fieldReport.gpsAttemptLongitude !== null &&
      fieldReport.gpsAttemptAccuracy !== null ? (
        <Text testID="field-report.gps-evidence" style={[styles.gpsEvidence, { color: theme.text }]}>
          {fieldReport.gpsAttemptLatitude.toFixed(6)}, {fieldReport.gpsAttemptLongitude.toFixed(6)} · ±{Math.round(fieldReport.gpsAttemptAccuracy)} m
        </Text>
      ) : null}
      {fieldReport.locationSource === 'manual_map' &&
      fieldReport.finalLatitude !== null &&
      fieldReport.finalLongitude !== null ? (
        <View style={styles.automaticFields}>
          <Text testID="field-report.manual-location" style={[styles.gpsEvidence, { color: theme.text }]}>Manual map · {fieldReport.finalLatitude.toFixed(6)}, {fieldReport.finalLongitude.toFixed(6)} · GPS accuracy not applicable</Text>
          {fieldReport.manualLocationSelectedAt ? (
            <Text testID="field-report.manual-location-selected-at" style={[styles.helpText, { color: theme.textSecondary }]}>Selected {formatTimestamp(fieldReport.manualLocationSelectedAt)}</Text>
          ) : null}
        </View>
      ) : null}
      <AppButton
        testID="field-report.capture-gps"
        onPress={onCapture}
        disabled={capturing || saveInProgress}
        leadingIcon="crosshair"
        accessibilityLabel={capturing ? 'Capturing GPS location' : presentation.actionLabel}>
        {capturing ? 'Capturing GPS...' : presentation.actionLabel}
      </AppButton>
      {canUseManualMap(fieldReport) ? (
        isOnline === true ? (
          <AppButton
            testID="field-report.open-manual-map"
            accessibilityLabel="Open online manual map"
            onPress={onOpenMap}
            disabled={capturing || saveInProgress}
            leadingIcon="map"
            variant="secondary">
            {fieldReport.locationSource === 'manual_map' ? 'Change Manual Map Location' : 'Pin Location on Online Map'}
          </AppButton>
        ) : (
          <Text testID="field-report.manual-map-offline" style={[styles.helpText, { color: theme.textSecondary }]}>The manual map fallback becomes available when this device is online. The Draft remains unchanged.</Text>
        )
      ) : null}
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>
        CaneGuard requests one foreground reading only. A reading above the preferred 5 m quality target is retained as attempt evidence but does not become the final report location.
      </Text>
    </View>
  );
}

function InheritedScanEvidence({
  errorMessage,
  loading,
  onRetry,
  record,
}: {
  errorMessage: string | null;
  loading: boolean;
  onRetry: () => void;
  record: ScanRecordDetails | null;
}) {
  const theme = useTheme();

  return (
    <View
      testID="field-report.inherited-evidence"
      style={[
        styles.formCard,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <View style={styles.sectionHeading}>
        <Feather name="shield" size={20} color={theme.primary} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Inherited scan evidence</Text>
      </View>
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>
        This read-only evidence remains owned by the completed Scan Record.
      </Text>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading inherited scan evidence" color={theme.primary} />
      ) : errorMessage || !record ? (
        <>
          <Text style={[styles.error, { color: theme.danger }]}>{errorMessage ?? 'Scan evidence is unavailable.'}</Text>
          <AppButton onPress={onRetry} leadingIcon="refresh-cw">Retry Evidence</AppButton>
        </>
      ) : (
        <>
          <ExpoImage
            source={{ uri: record.managedImageUri }}
            accessibilityLabel="Original sugarcane scan image"
            contentFit="cover"
            style={styles.evidenceImage}
          />
          <EvidenceRow label="AI-supported result" value={getResultLabel(record.predictedLabel)} />
          <EvidenceRow label="Confidence" value={`${Math.round(record.confidence * 100)}%`} />
          <EvidenceRow
            label="Class scores"
            value={record.classScores.map(({ label, score }) => `${label}: ${Math.round(score * 100)}%`).join(' · ')}
          />
          <EvidenceRow
            label="Symptom checklist"
            value={record.symptoms.length ? record.symptoms.join(', ') : 'No symptoms selected'}
          />
        </>
      )}
    </View>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.evidenceRow}>
      <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.evidenceValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function getGpsPresentation(fieldReport: FieldReport): {
  actionLabel: string;
  message: string;
} {
  if (
    fieldReport.locationSource === 'manual_map' &&
    fieldReport.finalLatitude !== null &&
    fieldReport.finalLongitude !== null
  ) {
    return {
      actionLabel: 'Use GPS Instead',
      message: 'Final coordinates were selected manually on the online map. They are not presented as GPS-measured.',
    };
  }
  if (
    fieldReport.locationSource === 'gps' &&
    fieldReport.finalLatitude !== null &&
    fieldReport.finalLongitude !== null &&
    fieldReport.gpsAccuracy !== null
  ) {
    return {
      actionLabel: 'Refresh GPS Location',
      message: `GPS location resolved with ±${Math.round(fieldReport.gpsAccuracy)} m device-reported accuracy.`,
    };
  }

  switch (fieldReport.gpsCaptureOutcome) {
    case 'resolved':
      return {
        actionLabel: 'Refresh GPS Location',
        message: `GPS location resolved with ±${Math.round(fieldReport.gpsAccuracy ?? 0)} m device-reported accuracy.`,
      };
    case 'low_accuracy':
      return {
        actionLabel: 'Retry GPS Location',
        message: 'The last GPS reading did not meet the preferred quality target. The Draft and reading were preserved.',
      };
    case 'permission_denied':
      return {
        actionLabel: 'Retry GPS Permission',
        message: 'Foreground location permission was denied. The Draft remains saved and can be retried.',
      };
    case 'unavailable':
      return {
        actionLabel: 'Retry GPS Location',
        message: 'Location services or an accurate device reading are unavailable. The Draft remains unchanged.',
      };
    case 'error':
      return {
        actionLabel: 'Retry GPS Location',
        message: 'CaneGuard could not capture GPS. The Draft remains unchanged.',
      };
    default:
      return {
        actionLabel: 'Capture GPS Location',
        message: 'No final report location has been captured yet.',
      };
  }
}

function canUseManualMap(fieldReport: FieldReport): boolean {
  return (
    fieldReport.locationSource === 'manual_map' ||
    (fieldReport.locationSource === null &&
      fieldReport.gpsCaptureOutcome !== null &&
      fieldReport.gpsCaptureOutcome !== 'resolved')
  );
}

function FinalizedReportSummary({ fieldReport }: { fieldReport: FieldReport }) {
  const theme = useTheme();
  return (
    <View style={[styles.formCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <EvidenceRow label="Farmer or farm owner" value={fieldReport.farmerOrFarmOwnerName ?? 'Not provided'} />
      <EvidenceRow label="Area" value={`${fieldReport.barangay}, ${fieldReport.municipality}, ${fieldReport.province}`} />
      <EvidenceRow label="Location source" value={fieldReport.locationSource === 'manual_map' ? 'Manual map' : 'GPS'} />
      {fieldReport.manualLocationSelectedAt ? (
        <EvidenceRow label="Manual location selected" value={formatTimestamp(fieldReport.manualLocationSelectedAt)} />
      ) : null}
      <EvidenceRow label="Observation time" value={formatTimestamp(fieldReport.observedAt)} />
      <EvidenceRow label="Local submission time" value={fieldReport.submittedAt ? formatTimestamp(fieldReport.submittedAt) : 'Not submitted'} />
      <EvidenceRow label="Synchronization" value={getSyncPresentation(fieldReport.syncStatus).label} />
      {fieldReport.remoteId ? (
        <EvidenceRow label="Server report UUID" value={fieldReport.remoteId} />
      ) : null}
      {fieldReport.lastSyncedAt ? (
        <EvidenceRow label="Last synchronized" value={formatTimestamp(fieldReport.lastSyncedAt)} />
      ) : null}
    </View>
  );
}

const SUBMISSION_REQUIREMENT_LABELS: Record<
  FieldReportSubmissionRequirement,
  string
> = {
  original_scan_image: 'Original scan image',
  source_image_dimensions: 'Original scan image dimensions',
  ai_supported_result: 'AI-supported result',
  confidence: 'Confidence score',
  class_scores: 'Class scores',
  symptom_checklist: 'Symptom checklist evidence',
  farmer_or_farm_owner_name: 'Farmer or farm owner name',
  submitter_identity: 'Authenticated submitter identity',
  submitter_role: 'Field reporter role',
  province: 'Batangas province',
  municipality: 'Nasugbu municipality',
  barangay: 'Barangay',
  final_coordinates: 'Final coordinates',
  location_source: 'GPS or manual-map location source',
  gps_accuracy: 'Device-reported GPS accuracy',
  observation_time: 'Observation time',
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  keyboardAvoiding: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  statusCopy: { flex: 1, gap: Spacing.xs },
  statusTitle: { ...Typography.subheading, fontWeight: '800' },
  statusMessage: { ...Typography.bodySmall },
  formCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  automaticFields: { gap: Spacing.xs },
  automaticLabel: { ...Typography.caption, fontWeight: '700' },
  automaticValue: { ...Typography.body, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { ...Typography.subheading, fontWeight: '800' },
  helpText: { ...Typography.caption },
  gpsEvidence: { ...Typography.bodySmall, fontWeight: '700' },
  evidenceImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.md },
  evidenceRow: { gap: Spacing.xs },
  evidenceValue: { ...Typography.bodySmall, fontWeight: '600' },
  error: { ...Typography.bodySmall, fontWeight: '700' },
  saved: { ...Typography.bodySmall, fontWeight: '800', textAlign: 'center' },
  validationCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  validationTitle: { ...Typography.bodySmall, fontWeight: '800' },
  identity: { ...Typography.caption, textAlign: 'center' },
});

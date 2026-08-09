import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { getResultLabel } from '@/components/ui/RecordCard';
import { TextField } from '@/components/ui/TextField';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: theme.warningBg, borderColor: theme.warning },
                ]}>
                <Feather name="edit-3" size={20} color={theme.warning} />
                <View style={styles.statusCopy}>
                  <Text style={[styles.statusTitle, { color: theme.text }]}>Draft</Text>
                  <Text style={[styles.statusMessage, { color: theme.textSecondary }]}> 
                    Save incomplete information now and return later. Drafts are
                    stored only on this device and are not queued for synchronization.
                  </Text>
                </View>
              </View>

              <DraftFields
                key={report.data.id}
                fieldReport={report.data}
                reporterName={
                  user?.uuid === report.data.submitterIdentity
                    ? user.name
                    : report.data.submitterIdentity
                }
                captureInProgress={report.capturingLocation}
                saving={report.saving}
                onSave={(values) => void report.save(values)}
              />

              <LocationCapture
                fieldReport={report.data}
                capturing={report.capturingLocation}
                saveInProgress={report.saving}
                onCapture={() => void report.captureLocation()}
              />

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
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function DraftFields({
  captureInProgress,
  fieldReport,
  onSave,
  reporterName,
  saving,
}: {
  captureInProgress: boolean;
  fieldReport: FieldReport;
  onSave: (values: {
    barangay: string;
    farmerOrFarmOwnerName: string;
  }) => void;
  reporterName: string | null;
  saving: boolean;
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
        disabled={saving || captureInProgress}
        leadingIcon="save"
        accessibilityLabel={
          saving ? 'Saving Field Report draft' : 'Save Field Report draft'
        }>
        {saving ? 'Saving Draft...' : 'Save Draft'}
      </AppButton>
    </>
  );
}

function LocationCapture({
  capturing,
  fieldReport,
  onCapture,
  saveInProgress,
}: {
  capturing: boolean;
  fieldReport: FieldReport;
  onCapture: () => void;
  saveInProgress: boolean;
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>GPS location</Text>
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
      <AppButton
        testID="field-report.capture-gps"
        onPress={onCapture}
        disabled={capturing || saveInProgress}
        leadingIcon="crosshair"
        accessibilityLabel={capturing ? 'Capturing GPS location' : presentation.actionLabel}>
        {capturing ? 'Capturing GPS...' : presentation.actionLabel}
      </AppButton>
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

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
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
  identity: { ...Typography.caption, textAlign: 'center' },
});

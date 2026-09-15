import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
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
import { CHECKLIST_OBSERVATIONS } from '@/features/detection/checklist/checklistConsistency';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { BarangayPicker } from '@/features/reports/components/BarangayPicker';
import { PossibleRecentMatchWarning } from '@/features/reports/components/PossibleRecentMatchWarning';
import { RegionPicker } from '@/features/reports/components/RegionPicker';
import { formatDecimalInput, parseDecimalInput } from '@/features/reports/domain/decimalInput';
import type { PossibleMatchLookupInput } from '@/features/reports/domain/possibleMatch';
import {
  LOCATION_UNAVAILABLE_REASON_LABELS,
  REPORTER_OBSERVED_CONCERN_RSSI,
  type FieldReport,
  type FieldReportSubmissionRequirement,
  type LocationUnavailableReason,
  type MeasurementProvenance,
} from '@/features/reports/domain/fieldReportTypes';
import { getMissingSubmissionRequirements } from '@/features/reports/domain/fieldReportValidation';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import { usePossibleRecentMatch } from '@/features/reports/hooks/usePossibleRecentMatch';
import { useAuthorityReviewStatus } from '@/features/reports/hooks/useAuthorityReviewStatus';
import { useLocationReferenceData } from '@/features/reports/hooks/useLocationReferenceData';
import type { ReferenceRegion } from '@/features/reports/referenceData/referenceDataTypes';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

const MAX_AFFECTED_AREA_HECTARES = 10_000;

/**
 * The three states of the reporter's own concern. It is deliberately separate
 * from whether the Possible Condition matches what the reporter observed.
 */
type ReporterConcernChoice = 'none' | 'rssi' | 'other';

const REPORTER_CONCERN_OPTIONS: {
  choice: ReporterConcernChoice;
  hint?: string;
  label: string;
}[] = [
  { choice: 'none', label: 'None' },
  {
    choice: 'rssi',
    hint: 'Field concern only · not detected by current Model V1',
    label: 'RSSI',
  },
  { choice: 'other', label: 'Other' },
];

function getReporterConcernChoice(value: string): ReporterConcernChoice {
  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return 'none';
  }
  return normalized === REPORTER_OBSERVED_CONCERN_RSSI ? 'rssi' : 'other';
}

function concernValueForChoice(
  choice: ReporterConcernChoice,
  currentValue: string,
): string {
  if (choice === 'none') {
    return '';
  }
  if (choice === 'rssi') {
    return REPORTER_OBSERVED_CONCERN_RSSI;
  }
  return currentValue.trim().toUpperCase() === REPORTER_OBSERVED_CONCERN_RSSI
    ? ''
    : currentValue;
}

interface FieldReportFormValues {
  affectedAreaHectares?: number | null;
  affectedAreaMeasurement?: MeasurementProvenance;
  affectedPortionPercent?: number | null;
  affectedPortionMeasurement?: MeasurementProvenance;
  barangay: string;
  caneClass?: string;
  cropAge?: string;
  farmerOrFarmOwnerName: string;
  fieldNotes?: string;
  mismatchReported: boolean | null;
  reporterObservationText: string;
  reporterSuspectedCondition: string;
  municipality?: string;
  province?: string;
  sugarcaneVariety?: string;
}

type FinalizeFieldReportFormValues = FieldReportFormValues & {
  affectedAreaHectares: number | null;
  affectedAreaMeasurement: MeasurementProvenance;
  affectedPortionPercent: number | null;
  affectedPortionMeasurement: MeasurementProvenance;
};

export default function FieldReportScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ scanRecordId?: string | string[] }>();
  const scanRecordId = Array.isArray(params.scanRecordId)
    ? params.scanRecordId[0]
    : (params.scanRecordId ?? null);
  const referenceData = useLocationReferenceData();
  const defaultRegion = useMemo(() => {
    const firstRegion = referenceData.data.regions[0];
    if (!firstRegion) {
      return undefined;
    }
    return {
      province: firstRegion.province,
      municipality: firstRegion.municipalities[0] ?? '',
    };
  }, [referenceData.data.regions]);
  const report = useFieldReportDraft(scanRecordId, true, defaultRegion);
  const record = useScanRecordDetails(scanRecordId);
  const { user } = useAuth();
  const sync = useSync();
  const authorityStatus = useAuthorityReviewStatus(
    report.data?.authoringState === 'finalized' &&
      report.data.syncStatus === 'synced',
  );
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [mismatchDraft, setMismatchDraft] = useState(() => ({
    reportId: report.data?.id ?? null,
    mismatchReported: report.data?.mismatchReported ?? null,
    reporterConcernChoice: getReporterConcernChoice(
      report.data?.reporterSuspectedCondition ?? '',
    ),
    reporterObservationText: report.data?.reporterObservationText ?? '',
    reporterSuspectedCondition: report.data?.reporterSuspectedCondition ?? '',
  }));
  useEffect(() => {
    if (!report.data || mismatchDraft.reportId === report.data.id) {
      return;
    }
    // Local editor state must hydrate when the async Draft arrives after the
    // screen mounts. It is intentionally separate from the persisted report.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMismatchDraft({
      reportId: report.data.id,
      mismatchReported: report.data.mismatchReported,
      reporterConcernChoice: getReporterConcernChoice(
        report.data.reporterSuspectedCondition ?? '',
      ),
      reporterObservationText: report.data.reporterObservationText ?? '',
      reporterSuspectedCondition: report.data.reporterSuspectedCondition ?? '',
    });
  }, [mismatchDraft.reportId, report.data]);

  const handleMismatchReportedChange = (value: boolean) => {
    // Agreement with the Possible Condition is its own answer. The reporter's
    // observation and concern are reported independently and are never cleared
    // or hidden by this choice.
    setMismatchDraft((current) => ({ ...current, mismatchReported: value }));
  };

  const handleReporterConcernChoiceChange = (choice: ReporterConcernChoice) => {
    setMismatchDraft((current) => ({
      ...current,
      reporterConcernChoice: choice,
      reporterSuspectedCondition: concernValueForChoice(
        choice,
        current.reporterSuspectedCondition,
      ),
    }));
  };

  const handleReporterConcernTextChange = (value: string) => {
    setMismatchDraft((current) => ({
      ...current,
      reporterConcernChoice: 'other',
      reporterSuspectedCondition: value,
    }));
  };

  const finalizeAndSync = async (values: FinalizeFieldReportFormValues) => {
    const finalized = await report.finalize(values);
    if (finalized) {
      if (sync.isOnline === true) {
        await sync.syncNow('after-save');
      }
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

  const openDeviceLocationSettings = () => {
    void Linking.openSettings().catch(() => {
      setRetryError(
        'Device settings could not be opened. Please open Settings and enable location services.',
      );
    });
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
            behavior={Platform.OS === 'android' ? 'height' : 'padding'}
            style={styles.keyboardAvoiding}>
            <ScrollView
              automaticallyAdjustKeyboardInsets
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
                      ? `Finalized · ${getSyncPresentation(report.data.syncStatus, report.data.lastSyncErrorCode).label}`
                      : 'Draft'}
                  </Text>
                  <Text style={[styles.statusMessage, { color: theme.textSecondary }]}>
                    {report.data.authoringState === 'finalized'
                      ? `This report is finalized locally. Current synchronization status: ${getSyncPresentation(report.data.syncStatus, report.data.lastSyncErrorCode).label}.`
                      : 'Save incomplete information now and return later. Drafts are stored only on this device and are not queued for synchronization.'}
                  </Text>
                </View>
              </View>

              {report.data.authoringState === 'draft' ? (
                <>
                  <AutomaticSummaryCard
                    fieldReport={report.data}
                    record={record.data}
                    reporterName={
                      user?.uuid === report.data.submitterIdentity
                        ? user.name
                        : report.data.submitterIdentity
                    }
                  />

                  <DraftFields
                    key={report.data.id}
                    fieldReport={report.data}
                    record={record.data}
                    barangays={referenceData.data.barangays}
                    regions={referenceData.data.regions}
                    referenceDataError={referenceData.errorMessage}
                    captureInProgress={report.capturingLocation}
                    finalizing={report.finalizing}
                    saving={report.saving}
                    submissionIssues={report.submissionIssues}
                    mismatchReported={mismatchDraft.mismatchReported}
                    reporterObservationText={mismatchDraft.reporterObservationText}
                    reporterSuspectedCondition={mismatchDraft.reporterSuspectedCondition}
                    onFinalize={(values) => void finalizeAndSync(values)}
                    onSave={(values) => void report.save(values)}
                  />

                  <LocationCapture
                    fieldReport={report.data}
                    capturing={report.capturingLocation}
                    isOnline={sync.isOnline}
                    locationServicesDisabled={report.locationServicesDisabled}
                    markingUnavailable={report.markingLocationUnavailable}
                    saveInProgress={report.saving || report.finalizing}
                    onCapture={() => void report.captureLocation()}
                    onMarkUnavailable={(reason) =>
                      void report.markLocationUnavailable(reason)
                    }
                    onOpenLocationSettings={openDeviceLocationSettings}
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
                  {report.data.syncStatus === 'synced' ? (
                    <AuthorityReviewSection
                      fieldReport={report.data}
                      status={authorityStatus}
                    />
                  ) : null}
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
                editable={report.data.authoringState === 'draft'}
                mismatchReported={mismatchDraft.mismatchReported}
                reporterConcernChoice={mismatchDraft.reporterConcernChoice}
                reporterObservationText={mismatchDraft.reporterObservationText}
                reporterSuspectedCondition={mismatchDraft.reporterSuspectedCondition}
                onMismatchReportedChange={handleMismatchReportedChange}
                onReporterConcernChoiceChange={handleReporterConcernChoiceChange}
                onReporterConcernTextChange={handleReporterConcernTextChange}
                onReporterObservationTextChange={(value) =>
                  setMismatchDraft((current) => ({
                    ...current,
                    reporterObservationText: value,
                  }))
                }
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

function AutomaticSummaryCard({
  fieldReport,
  record,
  reporterName,
}: {
  fieldReport: FieldReport;
  record: ScanRecordDetails | null;
  reporterName: string | null;
}) {
  const theme = useTheme();

  return (
    <View
      testID="field-report.summary"
      style={[
        styles.formCard,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <View style={styles.sectionHeading}>
        <Feather name="check-circle" size={20} color={theme.success} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Automatic report summary
        </Text>
      </View>
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>
        Everything below is inherited from the completed scan and cannot be
        edited here.
      </Text>
      {record ? (
        <ExpoImage
          source={{ uri: record.managedImageUri }}
          accessibilityLabel="Original sugarcane scan image"
          contentFit="cover"
          style={styles.summaryImage}
        />
      ) : null}
      {record ? (
        <>
          <View style={styles.summaryRows}>
            <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>
              Possible Condition
            </Text>
            <Text style={[styles.automaticValue, { color: theme.text }]}>
              {getResultLabel(record.predictedLabel)} ·{' '}
              {Math.round(record.confidence * 100)}% confidence
            </Text>
          </View>
          {record.symptoms.length ? (
            <View style={styles.summaryRows}>
              <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>
                Symptoms observed
              </Text>
              <Text style={[styles.automaticValue, { color: theme.text }]}>
                {record.symptoms
                  .map(
                    (symptom) =>
                      CHECKLIST_OBSERVATIONS.find(
                        (observation) => observation.id === symptom,
                      )?.label ?? symptom,
                  )
                  .join(' · ')}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <Text style={[styles.error, { color: theme.danger }]}>
          Scan evidence is unavailable.
        </Text>
      )}
      <View style={styles.summaryRows}>
        <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>
          Observed
        </Text>
        <Text testID="field-report.observed-at" style={[styles.automaticValue, { color: theme.text }]}>
          {formatTimestamp(fieldReport.observedAt)}
        </Text>
      </View>
      <View style={styles.summaryRows}>
        <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>
          Field Inspector
        </Text>
        <Text testID="field-report.submitter" style={[styles.automaticValue, { color: theme.text }]}>
          {reporterName ?? 'Authenticated Field Inspector'} · Field Inspector
        </Text>
      </View>
      <View style={styles.summaryRows}>
        <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>
          Area
        </Text>
        <Text style={[styles.automaticValue, { color: theme.text }]}>
          {fieldReport.municipality}, {fieldReport.province}
        </Text>
      </View>
    </View>
  );
}

function DraftFields({
  barangays,
  captureInProgress,
  fieldReport,
  record,
  onFinalize,
  onSave,
  referenceDataError,
  regions,
  saving,
  finalizing,
  submissionIssues,
  mismatchReported,
  reporterObservationText,
  reporterSuspectedCondition,
}: {
  barangays: string[];
  captureInProgress: boolean;
  fieldReport: FieldReport;
  record: ScanRecordDetails | null;
  onFinalize: (values: FinalizeFieldReportFormValues) => void;
  onSave: (values: FieldReportFormValues) => void;
  referenceDataError: string | null;
  regions: ReferenceRegion[];
  saving: boolean;
  finalizing: boolean;
  submissionIssues: FieldReportSubmissionRequirement[];
  mismatchReported: boolean | null;
  reporterObservationText: string;
  reporterSuspectedCondition: string;
}) {
  const theme = useTheme();
  const [farmerName, setFarmerName] = useState(
    fieldReport.farmerOrFarmOwnerName ?? '',
  );
  const [barangay, setBarangay] = useState(fieldReport.barangay ?? '');
  const [province, setProvince] = useState(fieldReport.province);
  const [municipality, setMunicipality] = useState(fieldReport.municipality);
  const [affectedAreaText, setAffectedAreaText] = useState(
    fieldReport.affectedAreaHectares === null
      ? ''
      : formatDecimalInput(fieldReport.affectedAreaHectares),
  );
  const [affectedPortionText, setAffectedPortionText] = useState(
    fieldReport.affectedPortionPercent === null
      ? ''
      : formatDecimalInput(fieldReport.affectedPortionPercent),
  );
  // D-01: the inspector states whether a value was measured. A stored Draft
  // value preselects Measured; an empty Draft starts undecided so finalization
  // asks for the decision explicitly instead of assuming it.
  const [affectedAreaChoice, setAffectedAreaChoice] =
    useState<MeasurementProvenance | null>(
      fieldReport.affectedAreaHectares !== null ? 'measured' : null,
    );
  const [affectedPortionChoice, setAffectedPortionChoice] =
    useState<MeasurementProvenance | null>(
      fieldReport.affectedPortionPercent !== null ? 'measured' : null,
    );
  const [variety, setVariety] = useState(fieldReport.sugarcaneVariety ?? '');
  const [cropAge, setCropAge] = useState(fieldReport.cropAge ?? '');
  const [caneClass, setCaneClass] = useState(fieldReport.caneClass ?? '');
  const [notes, setNotes] = useState(fieldReport.fieldNotes ?? '');
  const [fieldErrors, setFieldErrors] = useState<{
    affectedArea?: string;
    affectedPortion?: string;
  }>({});
  const possibleMatchInput = useMemo<PossibleMatchLookupInput>(
    () => ({
      barangay: barangay || null,
      finalLatitude: fieldReport.finalLatitude,
      finalLongitude: fieldReport.finalLongitude,
      farmerOrFarmOwnerName: farmerName || null,
      locationSource: fieldReport.locationSource,
      municipality: municipality || null,
      observedAt: fieldReport.observedAt,
      predictedLabel: record?.predictedLabel ?? null,
      province: province || null,
      reportId: fieldReport.id,
      scanRecordId: fieldReport.scanRecordId,
    }),
    [
      barangay,
      farmerName,
      fieldReport.finalLatitude,
      fieldReport.finalLongitude,
      fieldReport.id,
      fieldReport.locationSource,
      fieldReport.observedAt,
      fieldReport.scanRecordId,
      municipality,
      province,
      record?.predictedLabel,
    ],
  );
  const possibleRecentMatch = usePossibleRecentMatch(possibleMatchInput);

  const provinceOptions = regions.map((region) => region.province);
  const municipalityOptions =
    regions.find((region) => region.province === province)?.municipalities ??
    [];

  const changeProvince = (nextProvince: string) => {
    setProvince(nextProvince);
    const region = regions.find((entry) => entry.province === nextProvince);
    setMunicipality(region?.municipalities[0] ?? municipality);
  };

  const collectValues = (
    requireAffectedNumbers: boolean,
  ): FieldReportFormValues | null => {
    const errors: { affectedArea?: string; affectedPortion?: string } = {};
    const areaNotMeasured = affectedAreaChoice === 'not_measured';
    const portionNotMeasured = affectedPortionChoice === 'not_measured';
    const affectedArea = areaNotMeasured
      ? null
      : affectedAreaText.trim() === ''
        ? null
        : parseDecimalInput(affectedAreaText);
    const affectedPortion = portionNotMeasured
      ? null
      : affectedPortionText.trim() === ''
        ? null
        : parseDecimalInput(affectedPortionText);
    const areaMeasurement: MeasurementProvenance =
      affectedAreaChoice ?? (affectedArea === null ? 'not_measured' : 'measured');
    const portionMeasurement: MeasurementProvenance =
      affectedPortionChoice ??
      (affectedPortion === null ? 'not_measured' : 'measured');

    if (!areaNotMeasured) {
      if (affectedArea !== null) {
        if (affectedArea <= 0 || affectedArea > MAX_AFFECTED_AREA_HECTARES) {
          errors.affectedArea = `Enter an area greater than 0 and at most ${MAX_AFFECTED_AREA_HECTARES} hectares.`;
        }
      } else if (affectedAreaText.trim() !== '') {
        errors.affectedArea = 'Enter the affected area as a number, for example 0.5.';
      } else if (requireAffectedNumbers && affectedAreaChoice === null) {
        errors.affectedArea =
          'Enter the affected area, or mark it as Not measured.';
      } else if (requireAffectedNumbers) {
        errors.affectedArea = 'Enter the affected area as a number, for example 0.5.';
      }
    }

    if (!portionNotMeasured) {
      if (affectedPortion !== null) {
        if (affectedPortion < 0 || affectedPortion > 100) {
          errors.affectedPortion = 'Enter an estimated affected portion between 0 and 100 percent.';
        }
      } else if (affectedPortionText.trim() !== '') {
        errors.affectedPortion = 'Enter the affected portion as a number, for example 30.';
      } else if (requireAffectedNumbers && affectedPortionChoice === null) {
        errors.affectedPortion =
          'Enter the estimated affected portion, or mark it as Not measured.';
      } else if (requireAffectedNumbers) {
        errors.affectedPortion =
          'Enter the affected portion as a number, for example 30.';
      }
    }

    if (errors.affectedArea || errors.affectedPortion) {
      setFieldErrors(errors);
      return null;
    }
    setFieldErrors({});
    return {
      affectedAreaHectares: affectedArea,
      affectedAreaMeasurement: areaMeasurement,
      affectedPortionPercent: affectedPortion,
      affectedPortionMeasurement: portionMeasurement,
      barangay,
      farmerOrFarmOwnerName: farmerName,
      province,
      municipality,
      sugarcaneVariety: variety,
      cropAge,
      caneClass,
      fieldNotes: notes,
      mismatchReported,
      reporterObservationText,
      reporterSuspectedCondition,
    };
  };

  const handleSave = () => {
    const values = collectValues(false);
    if (values) {
      onSave(values);
    }
  };

  const handleFinalize = () => {
    const values = collectValues(true);
    if (values) {
      onFinalize({
        ...values,
        affectedAreaHectares: values.affectedAreaHectares ?? null,
        affectedAreaMeasurement: values.affectedAreaMeasurement ?? 'not_measured',
        affectedPortionPercent: values.affectedPortionPercent ?? null,
        affectedPortionMeasurement:
          values.affectedPortionMeasurement ?? 'not_measured',
      });
    }
  };

  return (
    <>
      <View
        style={[
          styles.formCard,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}>
        <View style={styles.sectionHeading}>
          <Feather name="edit-3" size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Report details
          </Text>
        </View>
        <TextField
          testID="field-report.farmer-name-input"
          label="Farmer or farm reference"
          value={farmerName}
          onChangeText={setFarmerName}
          placeholder="Farmer, farm name, or local farm ID"
          autoCapitalize="words"
        />
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>
          Use a farmer or owner name, farm name, or another usable local farm
          reference.
        </Text>
        <BarangayPicker
          barangays={barangays}
          value={barangay}
          onChange={setBarangay}
        />
        <View style={styles.numericRow}>
          <View style={styles.numericField}>
            <TextField
              testID="field-report.affected-area-input"
              label="Affected area (hectares)"
              value={affectedAreaText}
              onChangeText={(value) => {
                setAffectedAreaText(value);
                if (value.trim() !== '') {
                  setAffectedAreaChoice('measured');
                }
              }}
              placeholder="0.5"
              keyboardType="decimal-pad"
              editable={affectedAreaChoice !== 'not_measured'}
            />
            <MeasurementChoice
              testID="field-report.affected-area-measurement"
              label="Affected area"
              choice={affectedAreaChoice}
              onChoose={(choice) => {
                setAffectedAreaChoice(choice);
                if (choice === 'not_measured') {
                  setAffectedAreaText('');
                }
                setFieldErrors((current) => ({ ...current, affectedArea: undefined }));
              }}
            />
            {fieldErrors.affectedArea ? (
              <Text style={[styles.fieldError, { color: theme.danger }]}>
                {fieldErrors.affectedArea}
              </Text>
            ) : null}
          </View>
          <View style={styles.numericField}>
            <TextField
              testID="field-report.affected-portion-input"
              label="Estimated affected portion (%)"
              value={affectedPortionText}
              onChangeText={(value) => {
                setAffectedPortionText(value);
                if (value.trim() !== '') {
                  setAffectedPortionChoice('measured');
                }
              }}
              placeholder="30"
              keyboardType="decimal-pad"
              editable={affectedPortionChoice !== 'not_measured'}
            />
            <MeasurementChoice
              testID="field-report.affected-portion-measurement"
              label="Estimated affected portion"
              choice={affectedPortionChoice}
              onChoose={(choice) => {
                setAffectedPortionChoice(choice);
                if (choice === 'not_measured') {
                  setAffectedPortionText('');
                }
                setFieldErrors((current) => ({ ...current, affectedPortion: undefined }));
              }}
            />
            {fieldErrors.affectedPortion ? (
              <Text style={[styles.fieldError, { color: theme.danger }]}>
                {fieldErrors.affectedPortion}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>
          Enter a measurement, or mark it Not measured when the field cannot be
          estimated. Guessing is not required. Decimals are accepted (0.5 or 0,5).
        </Text>
        <RegionPicker
          province={province}
          municipality={municipality}
          provinces={provinceOptions}
          municipalities={municipalityOptions}
          onProvinceChange={changeProvince}
          onMunicipalityChange={setMunicipality}
        />
        {referenceDataError ? (
          <Text
            testID="field-report.reference-data-error"
            style={[styles.helpText, { color: theme.warning }]}>
            {referenceDataError} Showing the offline list; saved values are unchanged.
          </Text>
        ) : null}
        <DisclosureSection testID="field-report.more-details" title="More field details">
          <TextField
            testID="field-report.variety-input"
            label="Sugarcane variety"
            value={variety}
            onChangeText={setVariety}
            placeholder="Optional"
            autoCapitalize="words"
          />
          <TextField
            testID="field-report.crop-age-input"
            label="Crop age"
            value={cropAge}
            onChangeText={setCropAge}
            placeholder="Optional, e.g. ~3 months"
            autoCapitalize="sentences"
          />
          <TextField
            testID="field-report.cane-class-input"
            label="Cane class"
            value={caneClass}
            onChangeText={setCaneClass}
            placeholder="Optional"
            autoCapitalize="words"
          />
          <TextField
            testID="field-report.notes-input"
            label="Field notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            autoCapitalize="sentences"
          />
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            These optional details never block finalization.
          </Text>
        </DisclosureSection>
      </View>
      <AppButton
        testID="field-report.save-draft"
        onPress={handleSave}
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
      {possibleRecentMatch.match ? (
        <PossibleRecentMatchWarning match={possibleRecentMatch.match} />
      ) : null}
      <ReadyToSubmitChecklist fieldReport={fieldReport} record={record} />
      <AppButton
        testID="field-report.finalize"
        onPress={handleFinalize}
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
  isOnline,
  locationServicesDisabled,
  markingUnavailable,
  onCapture,
  onMarkUnavailable,
  onOpenLocationSettings,
  onOpenMap,
  saveInProgress,
}: {
  capturing: boolean;
  fieldReport: FieldReport;
  isOnline: boolean | null;
  locationServicesDisabled: boolean;
  markingUnavailable: boolean;
  onCapture: () => void;
  onMarkUnavailable: (reason: LocationUnavailableReason) => void;
  onOpenLocationSettings: () => void;
  onOpenMap: () => void;
  saveInProgress: boolean;
}) {
  const theme = useTheme();
  const presentation = getGpsPresentation(fieldReport);
  const [unavailableReason, setUnavailableReason] =
    useState<LocationUnavailableReason | null>(null);
  const [showUnavailable, setShowUnavailable] = useState(
    fieldReport.locationSource === 'unavailable',
  );
  const locationUnavailable = fieldReport.locationSource === 'unavailable';

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
      {locationServicesDisabled ? (
        <View
          testID="field-report.location-services-off"
          accessibilityLiveRegion="assertive"
          style={[
            styles.validationCard,
            { backgroundColor: theme.warningBg, borderColor: theme.warning },
          ]}>
          <Text style={[styles.validationTitle, { color: theme.warning }]}>
            Location services are off
          </Text>
          <Text style={[styles.statusMessage, { color: theme.text }]}>
            Enable location services in device settings, then retry GPS capture.
            Your Draft remains saved.
          </Text>
          <AppButton
            testID="field-report.open-location-settings"
            accessibilityLabel="Open device location settings"
            onPress={onOpenLocationSettings}
            leadingIcon="settings"
            variant="secondary">
            Open Location Settings
          </AppButton>
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

      <View style={[styles.locationDivider, { borderTopColor: theme.divider }]} />

      {locationUnavailable ? (
        <View
          testID="field-report.location-unavailable"
          style={[
            styles.unavailableCard,
            { backgroundColor: theme.warningBg, borderColor: theme.warning },
          ]}>
          <View style={styles.unavailableHeading}>
            <Feather name="map-pin" size={18} color={theme.warning} />
            <Text style={[styles.validationTitle, { color: theme.warning }]}>
              Sending without an exact location
            </Text>
          </View>
          <Text style={[styles.statusMessage, { color: theme.text }]}>
            {fieldReport.locationUnavailableReason
              ? LOCATION_UNAVAILABLE_REASON_LABELS[
                  fieldReport.locationUnavailableReason
                ]
              : 'No reason recorded yet.'}{' '}
            Barangay {fieldReport.barangay ?? ''} still identifies this case.
          </Text>
          <AppButton
            testID="field-report.change-location"
            accessibilityLabel="Capture a location instead"
            onPress={() => {
              setShowUnavailable(false);
              setUnavailableReason(null);
            }}
            leadingIcon="crosshair"
            variant="secondary">
            Capture a Location Instead
          </AppButton>
        </View>
      ) : showUnavailable ? (
        <View testID="field-report.location-unavailable-picker" style={styles.unavailablePicker}>
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            If no source works, record why. The report is sent with the barangay
            and an explicit unavailable-location reason instead of coordinates.
          </Text>
          <View style={styles.reasonList}>
            {(Object.keys(LOCATION_UNAVAILABLE_REASON_LABELS) as LocationUnavailableReason[]).map(
              (reason) => {
                const selected = unavailableReason === reason;
                return (
                  <Pressable
                    key={reason}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={LOCATION_UNAVAILABLE_REASON_LABELS[reason]}
                    testID={`field-report.location-reason.${reason}`}
                    onPress={() => setUnavailableReason(reason)}
                    style={({ pressed }) => [
                      styles.reasonOption,
                      {
                        backgroundColor: selected
                          ? theme.warningBg
                          : theme.surfaceMuted,
                        borderColor: selected ? theme.warning : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Feather
                      name={selected ? 'check-circle' : 'circle'}
                      size={16}
                      color={selected ? theme.warning : theme.textSecondary}
                    />
                    <Text style={[styles.statusMessage, { color: theme.text }]}>
                      {LOCATION_UNAVAILABLE_REASON_LABELS[reason]}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>
          <AppButton
            testID="field-report.mark-location-unavailable"
            accessibilityLabel="Send without an exact location"
            onPress={() => {
              if (unavailableReason) {
                onMarkUnavailable(unavailableReason);
              }
            }}
            disabled={!unavailableReason || markingUnavailable || saveInProgress}
            variant="secondary"
            leadingIcon="map-pin">
            {markingUnavailable
              ? 'Recording...'
              : 'Send Without Exact Location'}
          </AppButton>
        </View>
      ) : (
        <AppButton
          testID="field-report.open-location-unavailable"
          accessibilityLabel="I cannot capture a location"
          onPress={() => setShowUnavailable(true)}
          disabled={capturing || saveInProgress}
          variant="text"
          leadingIcon="help-circle">
          I Cannot Capture a Location
        </AppButton>
      )}
    </View>
  );
}

function InheritedScanEvidence({
  editable,
  errorMessage,
  loading,
  mismatchReported,
  onMismatchReportedChange,
  onReporterConcernChoiceChange,
  onReporterConcernTextChange,
  onReporterObservationTextChange,
  onRetry,
  record,
  reporterConcernChoice,
  reporterObservationText,
  reporterSuspectedCondition,
}: {
  editable: boolean;
  errorMessage: string | null;
  loading: boolean;
  mismatchReported: boolean | null;
  onMismatchReportedChange: (value: boolean) => void;
  onReporterConcernChoiceChange: (value: ReporterConcernChoice) => void;
  onReporterConcernTextChange: (value: string) => void;
  onReporterObservationTextChange: (value: string) => void;
  onRetry: () => void;
  record: ScanRecordDetails | null;
  reporterConcernChoice: ReporterConcernChoice;
  reporterObservationText: string;
  reporterSuspectedCondition: string;
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
          <EvidenceRow label="Possible Condition" value={getResultLabel(record.predictedLabel)} />
          <EvidenceRow label="Confidence" value={`${Math.round(record.confidence * 100)}%`} />
          <EvidenceRow
            label="Class scores"
            value={record.classScores.map(({ label, score }) => `${label}: ${Math.round(score * 100)}%`).join(' · ')}
          />
          <EvidenceRow
            label="Symptom checklist"
            value={record.symptoms.length ? record.symptoms.join(', ') : 'No symptoms selected'}
          />
          <ReporterObservationSection
            editable={editable}
            mismatchReported={mismatchReported}
            onMismatchReportedChange={onMismatchReportedChange}
            onReporterConcernChoiceChange={onReporterConcernChoiceChange}
            onReporterConcernTextChange={onReporterConcernTextChange}
            onReporterObservationTextChange={onReporterObservationTextChange}
            reporterConcernChoice={reporterConcernChoice}
            reporterObservationText={reporterObservationText}
            reporterSuspectedCondition={reporterSuspectedCondition}
          />
        </>
      )}
    </View>
  );
}

function getConcernOptionLabel(choice: ReporterConcernChoice): string {
  if (choice === 'none') {
    return 'No observed or suspected concern';
  }
  return choice === 'rssi'
    ? 'Report RSSI as a field concern'
    : 'Report another observed or suspected concern';
}

function getAgreementLabel(value: boolean | null): string {
  if (value === null) {
    return 'Not answered';
  }
  return value
    ? 'Reporter said it does not match what they observed'
    : 'Reporter said it matches what they observed';
}

function ReporterObservationSection({
  editable,
  mismatchReported,
  onMismatchReportedChange,
  onReporterConcernChoiceChange,
  onReporterConcernTextChange,
  onReporterObservationTextChange,
  reporterConcernChoice,
  reporterObservationText,
  reporterSuspectedCondition,
}: {
  editable: boolean;
  mismatchReported: boolean | null;
  onMismatchReportedChange: (value: boolean) => void;
  onReporterConcernChoiceChange: (value: ReporterConcernChoice) => void;
  onReporterConcernTextChange: (value: string) => void;
  onReporterObservationTextChange: (value: string) => void;
  reporterConcernChoice: ReporterConcernChoice;
  reporterObservationText: string;
  reporterSuspectedCondition: string;
}) {
  const theme = useTheme();

  if (!editable) {
    const concern = reporterSuspectedCondition.trim();
    const observation = reporterObservationText.trim();
    if (!concern && !observation && mismatchReported === null) {
      return null;
    }
    return (
      <View
        testID="field-report.observation-summary"
        style={[styles.mismatchSection, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <View style={styles.sectionHeading}>
          <Feather name="message-circle" size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Reporter observation</Text>
        </View>
        <EvidenceRow label="What do you see?" value={observation || 'Not recorded'} />
        <EvidenceRow label="Observed or suspected concern" value={concern || 'None reported'} />
        <EvidenceRow label="Possible Condition agreement" value={getAgreementLabel(mismatchReported)} />
      </View>
    );
  }

  return (
    <View
      testID="field-report.observation-section"
      style={[styles.mismatchSection, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <View style={styles.sectionHeading}>
        <Feather name="message-circle" size={20} color={theme.warning} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your field observation</Text>
      </View>
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>Your observation and concern are recorded separately from the Possible Condition, which is decision-support only.</Text>

      <TextField
        testID="field-report.reporter-observation-input"
        label="What do you observe?"
        value={reporterObservationText}
        onChangeText={onReporterObservationTextChange}
        placeholder="Describe what you see in the field (optional)"
        maxLength={1_000}
        multiline
        autoCapitalize="sentences"
      />

      <View testID="field-report.concern-group" style={styles.concernGroup}>
        <Text style={[styles.fieldGroupLabel, { color: theme.text }]}>Observed or suspected concern</Text>
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>Report a concern on its own. Choosing one does not say the Possible Condition is wrong, and it is sent separately for office review.</Text>
        <View style={styles.mismatchOptions}>
          {REPORTER_CONCERN_OPTIONS.map((option) => {
            const selected = reporterConcernChoice === option.choice;
            const accent = option.choice === 'rssi' ? theme.info : theme.primary;
            return (
              <Pressable
                key={option.choice}
                testID={`field-report.concern-option-${option.choice}`}
                accessibilityRole="radio"
                accessibilityLabel={getConcernOptionLabel(option.choice)}
                accessibilityState={{ selected }}
                onPress={() => onReporterConcernChoiceChange(option.choice)}
                style={({ pressed }) => [
                  styles.mismatchOption,
                  { borderColor: selected ? accent : theme.border },
                  selected && { backgroundColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <Feather
                  name={selected ? 'check-circle' : 'circle'}
                  size={20}
                  color={selected ? accent : theme.textSecondary}
                />
                <View style={styles.rssiChoiceCopy}>
                  <Text style={[styles.mismatchOptionText, { color: theme.text }]}>{option.label}</Text>
                  {option.hint ? (
                    <Text style={[styles.helpText, { color: theme.textSecondary }]}>{option.hint}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        {reporterConcernChoice === 'other' ? (
          <TextField
            testID="field-report.reporter-condition-input"
            label="Other observed or suspected concern (free text)"
            value={reporterSuspectedCondition}
            onChangeText={onReporterConcernTextChange}
            placeholder="Describe the concern you observed"
            maxLength={120}
            autoCapitalize="sentences"
          />
        ) : null}
        {reporterConcernChoice === 'rssi' ? (
          <Text testID="field-report.rssi-not-model-copy" style={[styles.helpText, { color: theme.textSecondary }]}>RSSI can be reported as a field concern, but the current Model V1 does not detect RSSI. It remains separate from the Possible Condition.</Text>
        ) : null}
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>Optional. Reporting a concern never blocks finalization.</Text>
      </View>

      <View testID="field-report.agreement-group" style={styles.concernGroup}>
        <Text style={[styles.fieldGroupLabel, { color: theme.text }]}>Does the Possible Condition match what you observe?</Text>
        <View style={styles.mismatchOptions}>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="The Possible Condition matches what I see"
            accessibilityState={{ selected: mismatchReported === false }}
            onPress={() => onMismatchReportedChange(false)}
            style={({ pressed }) => [
              styles.mismatchOption,
              { borderColor: mismatchReported === false ? theme.primary : theme.border },
              mismatchReported === false && { backgroundColor: theme.backgroundSelected },
              pressed && styles.pressed,
            ]}>
            <Feather
              name={mismatchReported === false ? 'check-circle' : 'circle'}
              size={20}
              color={mismatchReported === false ? theme.primary : theme.textSecondary}
            />
            <Text style={[styles.mismatchOptionText, { color: theme.text }]}>The Possible Condition matches what I see</Text>
          </Pressable>
          <Pressable
            testID="field-report.mismatch-toggle"
            accessibilityRole="radio"
            accessibilityLabel="The Possible Condition does not match what I see"
            accessibilityState={{ selected: mismatchReported === true }}
            onPress={() => onMismatchReportedChange(true)}
            style={({ pressed }) => [
              styles.mismatchOption,
              { borderColor: theme.warning },
              mismatchReported === true && { backgroundColor: theme.warningBg },
              pressed && styles.pressed,
            ]}>
            <Feather
              name={mismatchReported === true ? 'check-circle' : 'alert-circle'}
              size={20}
              color={theme.warning}
            />
            <Text style={[styles.mismatchOptionText, { color: theme.text }]}>The Possible Condition does not match what I see</Text>
          </Pressable>
        </View>
      </View>
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
    <View
      testID="field-report.submission-section"
      style={[styles.formCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <EvidenceRow label="Farmer or farm reference" value={fieldReport.farmerOrFarmOwnerName ?? 'Not provided'} />
      <EvidenceRow label="Area" value={`${fieldReport.barangay ?? 'Not provided'}, ${fieldReport.municipality}, ${fieldReport.province}`} />
      <EvidenceRow label="Affected area" value={fieldReport.affectedAreaHectares === null ? 'Not provided' : `${fieldReport.affectedAreaHectares} ha`} />
      <EvidenceRow label="Estimated affected portion" value={fieldReport.affectedPortionPercent === null ? 'Not provided' : `${fieldReport.affectedPortionPercent}%`} />
      <EvidenceRow label="Location source" value={fieldReport.locationSource === 'manual_map' ? 'Manual map' : 'GPS'} />
      {fieldReport.manualLocationSelectedAt ? (
        <EvidenceRow label="Manual location selected" value={formatTimestamp(fieldReport.manualLocationSelectedAt)} />
      ) : null}
      <EvidenceRow label="Observation time" value={formatTimestamp(fieldReport.observedAt)} />
      <EvidenceRow label="Local submission time" value={fieldReport.submittedAt ? formatTimestamp(fieldReport.submittedAt) : 'Not submitted'} />
      <EvidenceRow
        label="Synchronization"
        value={getSyncPresentation(fieldReport.syncStatus, fieldReport.lastSyncErrorCode).label}
      />
      {fieldReport.remoteId ? (
        <EvidenceRow label="Server report UUID" value={fieldReport.remoteId} />
      ) : null}
      {fieldReport.lastSyncedAt ? (
        <EvidenceRow label="Last synchronized" value={formatTimestamp(fieldReport.lastSyncedAt)} />
      ) : null}
    </View>
  );
}

function AuthorityReviewSection({
  fieldReport,
  status,
}: {
  fieldReport: FieldReport;
  status: ReturnType<typeof useAuthorityReviewStatus>;
}) {
  const theme = useTheme();
  const review = fieldReport.authorityReview;

  return (
    <View
      testID="field-report.authority-review-section"
      style={[
        styles.formCard,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <View style={styles.sectionHeading}>
        <Feather name="shield" size={20} color={theme.info} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Authority review</Text>
      </View>
      {review ? (
        <>
          <EvidenceRow label="Status" value={review.statusLabel} />
          {review.referenceCode ? (
            <EvidenceRow label="Reference" value={review.referenceCode} />
          ) : null}
          {review.feedback ? (
            <View style={styles.feedback}>
              <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}>Latest feedback</Text>
              <Text selectable testID="field-report.authority-feedback" style={[styles.feedbackText, { color: theme.text }]}>
                {review.feedback.message}
              </Text>
              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                {review.feedback.authorLabel} · Updated {formatTimestamp(review.feedback.updatedAt)}
              </Text>
            </View>
          ) : null}
          <EvidenceRow label="Server update" value={formatTimestamp(review.statusUpdatedAt)} />
        </>
      ) : (
        <Text testID="field-report.authority-status-unavailable" style={[styles.statusMessage, { color: theme.textSecondary }]}>
          Authority review status is unavailable for this synchronized report.
        </Text>
      )}
      {status.errorMessage ? (
        <Text
          testID="field-report.authority-refresh-error"
          accessibilityLiveRegion="assertive"
          style={[styles.error, { color: theme.danger }]}>
          {status.errorMessage}
        </Text>
      ) : null}
      <AppButton
        testID="field-report.refresh-authority-status"
        onPress={() => void status.refresh()}
        disabled={status.refreshing}
        leadingIcon="refresh-cw"
        variant="secondary"
        accessibilityLabel={status.refreshing ? 'Refreshing authority review status' : 'Refresh authority review status'}>
        {status.refreshing ? 'Refreshing status…' : 'Refresh status'}
      </AppButton>
    </View>
  );
}

/**
 * D-01: an explicit measured / not measured decision. "Not measured" is a
 * first-class answer, so the inspector never has to invent a number.
 */
function MeasurementChoice({
  choice,
  label,
  onChoose,
  testID,
}: {
  choice: MeasurementProvenance | null;
  label: string;
  onChoose: (choice: MeasurementProvenance) => void;
  testID: string;
}) {
  const theme = useTheme();
  const options: { key: MeasurementProvenance; label: string }[] = [
    { key: 'measured', label: 'Measured' },
    { key: 'not_measured', label: 'Not measured' },
  ];

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={`${label} measurement`}
      testID={testID}
      style={styles.measurementRow}>
      {options.map((option) => {
        const selected = choice === option.key;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${label}: ${option.label}`}
            onPress={() => onChoose(option.key)}
            style={({ pressed }) => [
              styles.measurementOption,
              {
                backgroundColor: selected ? theme.primary : theme.surfaceMuted,
                borderColor: selected ? theme.primary : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <Text
              style={[
                styles.measurementOptionText,
                { color: selected ? theme.background : theme.primaryDark },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * One truthful readiness checklist. Every row is derived from the same domain
 * requirement list the finalization gate uses, so the interface can never sound
 * simpler than the real blockers.
 */
function ReadyToSubmitChecklist({
  fieldReport,
  record,
}: {
  fieldReport: FieldReport;
  record: ScanRecordDetails | null;
}) {
  const theme = useTheme();
  const missing = new Set(
    getMissingSubmissionRequirements(fieldReport, {
      checklistConsistency: record?.checklistConsistency ?? null,
      classScores: record?.classScores ?? [],
      confidence: record?.confidence ?? null,
      managedImageUri: record?.managedImageUri ?? null,
      managedImageAvailable: Boolean(record?.managedImageUri),
      predictedLabel: record?.predictedLabel ?? null,
      sourceHeight: record?.sourceHeight ?? null,
      sourceWidth: record?.sourceWidth ?? null,
      submissionImageAvailable: Boolean(record?.submissionImageUri),
      submissionImageMimeType: record?.submissionImageMimeType ?? null,
      submissionImageSizeBytes: record?.submissionImageSizeBytes ?? null,
      submissionImageUri: record?.submissionImageUri ?? null,
    }),
  );
  const groups: { label: string; requirements: FieldReportSubmissionRequirement[] }[] = [
    {
      label: 'Report details',
      requirements: [
        'farmer_or_farm_owner_name',
        'barangay',
        'affected_area_hectares',
        'affected_portion_percent',
      ],
    },
    {
      label: 'Location',
      requirements: [
        'final_coordinates',
        'location_source',
        'location_unavailable_reason',
        'gps_accuracy',
      ],
    },
    {
      label: 'Automatic evidence',
      requirements: [
        'original_scan_image',
        'submission_image',
        'source_image_dimensions',
        'ai_supported_result',
        'confidence',
        'class_scores',
        'symptom_checklist',
        'submitter_identity',
        'submitter_role',
        'province',
        'municipality',
        'observation_time',
      ],
    },
  ];
  const total = groups.reduce(
    (count, group) => count + group.requirements.length,
    0,
  );
  const blocking = groups
    .map((group) => ({
      ...group,
      missing: group.requirements.filter((requirement) => missing.has(requirement)),
    }))
    .filter((group) => group.missing.length > 0);
  const ready = blocking.length === 0;
  const completeCount = total - missing.size;

  return (
    <View
      testID="field-report.ready-to-submit"
      style={[
        styles.formCard,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: ready ? theme.success : theme.border,
        },
      ]}>
      <View style={styles.sectionHeading}>
        <Feather
          name={ready ? 'check-circle' : 'list'}
          size={20}
          color={ready ? theme.success : theme.primary}
        />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Ready to submit
        </Text>
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.helpText, { color: theme.textSecondary }]}>
        {ready
          ? 'Every requirement is complete. You can finalize this report.'
          : `${missing.size} of ${total} requirements still block finalizing.`}
      </Text>
      {blocking.map((group) => (
        <View key={group.label} style={styles.readinessGroup}>
          <Text style={[styles.readinessGroupTitle, { color: theme.textSecondary }]}>
            {group.label}
          </Text>
          {group.missing.map((requirement) => (
            <View
              key={requirement}
              testID={`field-report.ready.${requirement}`}
              style={styles.readinessRow}>
              <Feather name="circle" size={16} color={theme.warning} />
              <Text style={[styles.statusMessage, { color: theme.text }]}>
                {SUBMISSION_REQUIREMENT_LABELS[requirement]}
              </Text>
            </View>
          ))}
        </View>
      ))}
      {!ready && completeCount > 0 ? (
        <Text
          testID="field-report.ready.complete-count"
          style={[styles.helpText, { color: theme.textSecondary }]}>
          {completeCount} other {completeCount === 1 ? 'requirement is' : 'requirements are'} already complete.
        </Text>
      ) : null}
    </View>
  );
}

const SUBMISSION_REQUIREMENT_LABELS: Record<
  FieldReportSubmissionRequirement,
  string
> = {
  original_scan_image: 'Original scan image',
  submission_image: 'Upload-ready submission image',
  source_image_dimensions: 'Original scan image dimensions',
  ai_supported_result: 'Possible Condition',
  confidence: 'Confidence score',
  class_scores: 'Class scores',
  symptom_checklist: 'Symptom checklist evidence',
  farmer_or_farm_owner_name: 'Farmer or farm reference',
  submitter_identity: 'Authenticated submitter identity',
  submitter_role: 'Field Inspector role',
  province: 'Province',
  municipality: 'Municipality',
  barangay: 'Barangay',
  affected_area_hectares: 'Affected area (hectares)',
  affected_portion_percent: 'Estimated affected portion (%)',
  final_coordinates: 'Final coordinates',
  location_source: 'GPS or manual-map location source',
  location_unavailable_reason: 'Reason the location is unavailable',
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
  minimumRequirements: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  minimumRequirementsTitle: { ...Typography.bodySmall, fontWeight: '800' },
  summaryRows: { gap: Spacing.xs },
  summaryImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.md,
  },
  numericRow: { flexDirection: 'row', gap: Spacing.md },
  numericField: { flex: 1, gap: Spacing.xs },
  measurementRow: { flexDirection: 'row', gap: Spacing.xs },
  measurementOption: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  measurementOptionText: { ...Typography.caption, fontWeight: '800' },
  locationDivider: { borderTopWidth: 1, marginVertical: Spacing.xs },
  unavailableCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  unavailableHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  unavailablePicker: { gap: Spacing.sm },
  reasonList: { gap: Spacing.xs },
  reasonOption: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  readinessGroup: { gap: Spacing.xs },
  readinessGroupTitle: { ...Typography.label, letterSpacing: 0.8 },
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  fieldError: { ...Typography.caption, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { ...Typography.subheading, fontWeight: '800' },
  helpText: { ...Typography.caption },
  gpsEvidence: { ...Typography.bodySmall, fontWeight: '700' },
  evidenceImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: Radius.md },
  evidenceRow: { gap: Spacing.xs },
  evidenceValue: { ...Typography.bodySmall, fontWeight: '600' },
  feedback: { gap: Spacing.xs },
  feedbackText: { ...Typography.body, fontWeight: '600' },
  mismatchSection: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  mismatchOptions: { gap: Spacing.sm },
  mismatchOption: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mismatchOptionText: { ...Typography.bodySmall, fontWeight: '700', flex: 1 },
  concernGroup: { gap: Spacing.sm },
  fieldGroupLabel: { ...Typography.bodySmall, fontWeight: '800' },
  rssiChoiceCopy: { flex: 1, gap: Spacing.xs },
  pressed: { opacity: 0.74 },
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

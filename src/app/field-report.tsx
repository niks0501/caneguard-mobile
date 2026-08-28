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
import { RegionPicker } from '@/features/reports/components/RegionPicker';
import { formatDecimalInput, parseDecimalInput } from '@/features/reports/domain/decimalInput';
import type {
  FieldReport,
  FieldReportSubmissionRequirement,
} from '@/features/reports/domain/fieldReportTypes';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import { useAuthorityReviewStatus } from '@/features/reports/hooks/useAuthorityReviewStatus';
import { useLocationReferenceData } from '@/features/reports/hooks/useLocationReferenceData';
import type { ReferenceRegion } from '@/features/reports/referenceData/referenceDataTypes';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

const MAX_AFFECTED_AREA_HECTARES = 10_000;

interface FieldReportFormValues {
  affectedAreaHectares?: number | null;
  affectedPortionPercent?: number | null;
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
  affectedAreaHectares: number;
  affectedPortionPercent: number;
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
      reporterObservationText: report.data.reporterObservationText ?? '',
      reporterSuspectedCondition: report.data.reporterSuspectedCondition ?? '',
    });
  }, [mismatchDraft.reportId, report.data]);

  const handleMismatchReportedChange = (value: boolean) => {
    setMismatchDraft((current) => ({
      ...current,
      mismatchReported: value,
      reporterObservationText: value ? current.reporterObservationText : '',
      reporterSuspectedCondition: value ? current.reporterSuspectedCondition : '',
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
                    saveInProgress={report.saving || report.finalizing}
                    onCapture={() => void report.captureLocation()}
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
                reporterObservationText={mismatchDraft.reporterObservationText}
                reporterSuspectedCondition={mismatchDraft.reporterSuspectedCondition}
                onMismatchReportedChange={handleMismatchReportedChange}
                onReporterObservationTextChange={(value) =>
                  setMismatchDraft((current) => ({
                    ...current,
                    reporterObservationText: value,
                  }))
                }
                onReporterSuspectedConditionChange={(value) =>
                  setMismatchDraft((current) => ({
                    ...current,
                    reporterSuspectedCondition: value,
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
      <View
        testID="field-report.minimum-requirements"
        style={[
          styles.minimumRequirements,
          { backgroundColor: theme.infoBg, borderColor: theme.info },
        ]}>
        <Text style={[styles.minimumRequirementsTitle, { color: theme.text }]}>
          Confirm four reporter details
        </Text>
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>
          The only details you need to provide are a farmer or farm reference,
          barangay, affected area, and estimated affected portion. GPS is
          attempted automatically; use the online map only when needed.
        </Text>
      </View>
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
              AI-supported result
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
          Reporter
        </Text>
        <Text testID="field-report.submitter" style={[styles.automaticValue, { color: theme.text }]}>
          {reporterName ?? 'Authenticated field reporter'} · Field reporter
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
  const [variety, setVariety] = useState(fieldReport.sugarcaneVariety ?? '');
  const [cropAge, setCropAge] = useState(fieldReport.cropAge ?? '');
  const [caneClass, setCaneClass] = useState(fieldReport.caneClass ?? '');
  const [notes, setNotes] = useState(fieldReport.fieldNotes ?? '');
  const [fieldErrors, setFieldErrors] = useState<{
    affectedArea?: string;
    affectedPortion?: string;
  }>({});

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
    const affectedArea =
      affectedAreaText.trim() === '' ? null : parseDecimalInput(affectedAreaText);
    const affectedPortion =
      affectedPortionText.trim() === '' ? null : parseDecimalInput(affectedPortionText);

    if (affectedArea !== null) {
      if (affectedArea <= 0 || affectedArea > MAX_AFFECTED_AREA_HECTARES) {
        errors.affectedArea = `Enter an area greater than 0 and at most ${MAX_AFFECTED_AREA_HECTARES} hectares.`;
      }
    } else if (affectedAreaText.trim() !== '') {
      errors.affectedArea = 'Enter the affected area as a number, for example 0.5.';
    } else if (requireAffectedNumbers) {
      errors.affectedArea = 'Affected area is required to finalize.';
    }

    if (affectedPortion !== null) {
      if (affectedPortion < 0 || affectedPortion > 100) {
        errors.affectedPortion = 'Enter an estimated affected portion between 0 and 100 percent.';
      }
    } else if (affectedPortionText.trim() !== '') {
      errors.affectedPortion = 'Enter the affected portion as a number, for example 30.';
    } else if (requireAffectedNumbers) {
      errors.affectedPortion = 'Estimated affected portion is required to finalize.';
    }

    if (errors.affectedArea || errors.affectedPortion) {
      setFieldErrors(errors);
      return null;
    }
    setFieldErrors({});
    return {
      affectedAreaHectares: affectedArea,
      affectedPortionPercent: affectedPortion,
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
        affectedAreaHectares: values.affectedAreaHectares!,
        affectedPortionPercent: values.affectedPortionPercent!,
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
              onChangeText={setAffectedAreaText}
              placeholder="0.5"
              keyboardType="decimal-pad"
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
              onChangeText={setAffectedPortionText}
              placeholder="30"
              keyboardType="decimal-pad"
            />
            {fieldErrors.affectedPortion ? (
              <Text style={[styles.fieldError, { color: theme.danger }]}>
                {fieldErrors.affectedPortion}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>
          Affected area and estimated affected portion are required before
          finalizing. Both accept decimals (0.5 or 0,5).
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
  locationServicesDisabled,
  onCapture,
  onOpenLocationSettings,
  onOpenMap,
  saveInProgress,
  isOnline,
}: {
  capturing: boolean;
  fieldReport: FieldReport;
  locationServicesDisabled: boolean;
  onCapture: () => void;
  onOpenLocationSettings: () => void;
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
    </View>
  );
}

function InheritedScanEvidence({
  editable,
  errorMessage,
  loading,
  mismatchReported,
  onMismatchReportedChange,
  onReporterObservationTextChange,
  onReporterSuspectedConditionChange,
  onRetry,
  record,
  reporterObservationText,
  reporterSuspectedCondition,
}: {
  editable: boolean;
  errorMessage: string | null;
  loading: boolean;
  mismatchReported: boolean | null;
  onMismatchReportedChange: (value: boolean) => void;
  onReporterObservationTextChange: (value: string) => void;
  onReporterSuspectedConditionChange: (value: string) => void;
  onRetry: () => void;
  record: ScanRecordDetails | null;
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
          <ReporterMismatchSection
            editable={editable}
            mismatchReported={mismatchReported}
            onMismatchReportedChange={onMismatchReportedChange}
            onReporterObservationTextChange={onReporterObservationTextChange}
            onReporterSuspectedConditionChange={onReporterSuspectedConditionChange}
            reporterObservationText={reporterObservationText}
            reporterSuspectedCondition={reporterSuspectedCondition}
          />
        </>
      )}
    </View>
  );
}

function ReporterMismatchSection({
  editable,
  mismatchReported,
  onMismatchReportedChange,
  onReporterObservationTextChange,
  onReporterSuspectedConditionChange,
  reporterObservationText,
  reporterSuspectedCondition,
}: {
  editable: boolean;
  mismatchReported: boolean | null;
  onMismatchReportedChange: (value: boolean) => void;
  onReporterObservationTextChange: (value: string) => void;
  onReporterSuspectedConditionChange: (value: string) => void;
  reporterObservationText: string;
  reporterSuspectedCondition: string;
}) {
  const theme = useTheme();

  if (!editable) {
    return mismatchReported === true ? (
      <View
        testID="field-report.mismatch-marker"
        style={[styles.mismatchMarker, { backgroundColor: theme.warningBg, borderColor: theme.warning }]}>
        <Feather name="alert-triangle" size={18} color={theme.warning} />
        <View style={styles.mismatchCopy}>
          <Text style={[styles.mismatchTitle, { color: theme.text }]}>Reporter flagged an AI mismatch</Text>
          {reporterSuspectedCondition ? (
            <EvidenceRow label="Suspected condition, if known" value={reporterSuspectedCondition} />
          ) : null}
          {reporterObservationText ? (
            <EvidenceRow label="What do you see?" value={reporterObservationText} />
          ) : null}
        </View>
      </View>
    ) : null;
  }

  return (
    <View
      testID="field-report.mismatch-section"
      style={[styles.mismatchSection, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <View style={styles.sectionHeading}>
        <Feather name="message-circle" size={20} color={theme.warning} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Reporter observation</Text>
      </View>
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>The possible result is decision-support only. Tell us if it does not match what you see; your observation will be sent separately for authority review.</Text>
      <View style={styles.mismatchOptions}>
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel="The possible result matches what I see"
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
          <Text style={[styles.mismatchOptionText, { color: theme.text }]}>The possible result matches what I see</Text>
        </Pressable>
        <Pressable
          testID="field-report.mismatch-toggle"
          accessibilityRole="radio"
          accessibilityLabel="The AI result does not match what I see"
          accessibilityState={{ selected: mismatchReported === true }}
          onPress={() => onMismatchReportedChange(true)}
          style={({ pressed }) => [
            styles.mismatchOption,
            styles.mismatchOptionLast,
            { borderColor: mismatchReported === true ? theme.warning : theme.warning },
            mismatchReported === true && { backgroundColor: theme.warningBg },
            pressed && styles.pressed,
          ]}>
          <Feather
            name={mismatchReported === true ? 'check-circle' : 'alert-circle'}
            size={20}
            color={theme.warning}
          />
          <Text style={[styles.mismatchOptionText, { color: theme.text }]}>The AI result does not match what I see</Text>
        </Pressable>
      </View>
      {mismatchReported === true ? (
        <View style={styles.mismatchFields}>
          <TextField
            testID="field-report.reporter-observation-input"
            label="What do you see?"
            value={reporterObservationText}
            onChangeText={onReporterObservationTextChange}
            placeholder="Optional"
            maxLength={1_000}
            multiline
            autoCapitalize="sentences"
          />
          <TextField
            testID="field-report.reporter-condition-input"
            label="Suspected condition, if known"
            value={reporterSuspectedCondition}
            onChangeText={onReporterSuspectedConditionChange}
            placeholder="Optional"
            maxLength={120}
            autoCapitalize="sentences"
          />
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>Both fields are optional and do not block finalization.</Text>
        </View>
      ) : null}
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

const SUBMISSION_REQUIREMENT_LABELS: Record<
  FieldReportSubmissionRequirement,
  string
> = {
  original_scan_image: 'Original scan image',
  submission_image: 'Upload-ready submission image',
  source_image_dimensions: 'Original scan image dimensions',
  ai_supported_result: 'AI-supported result',
  confidence: 'Confidence score',
  class_scores: 'Class scores',
  symptom_checklist: 'Symptom checklist evidence',
  farmer_or_farm_owner_name: 'Farmer or farm reference',
  submitter_identity: 'Authenticated submitter identity',
  submitter_role: 'Field reporter role',
  province: 'Province',
  municipality: 'Municipality',
  barangay: 'Barangay',
  affected_area_hectares: 'Affected area (hectares)',
  affected_portion_percent: 'Estimated affected portion (%)',
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
  mismatchOptionLast: { borderWidth: 2 },
  mismatchOptionText: { ...Typography.bodySmall, fontWeight: '700', flex: 1 },
  mismatchFields: { gap: Spacing.md },
  mismatchMarker: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  mismatchCopy: { flex: 1, gap: Spacing.sm },
  mismatchTitle: { ...Typography.bodySmall, fontWeight: '800' },
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

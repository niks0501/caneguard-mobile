import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { HelpHintGroup } from '@/components/ui/HelpHint';
import { getResultLabel, getSyncPresentation } from '@/components/ui/RecordCard';
import { Row } from '@/components/ui/Row';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { LOCATION_ADDED, LOCATION_UNCONFIRMED } from '@/constants/copy';
import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { getStorageErrorMessage, toStorageError } from '@/database/errors';
import { CHECKLIST_OBSERVATIONS } from '@/features/detection/checklist/checklistConsistency';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { returnToTab } from '@/features/navigation/returnToTab';
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
import {
  getMissingSubmissionRequirements,
} from '@/features/reports/domain/fieldReportValidation';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import {
  deleteFieldReportFormCheckpoint,
  readFieldReportFormCheckpoint,
  writeFieldReportFormCheckpoint,
  type FieldReportFormCheckpoint,
} from '@/features/reports/drafts/fieldReportFormDraft';
import { usePossibleRecentMatch } from '@/features/reports/hooks/usePossibleRecentMatch';
import { useAuthorityReviewStatus } from '@/features/reports/hooks/useAuthorityReviewStatus';
import { useLocationReferenceData } from '@/features/reports/hooks/useLocationReferenceData';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import {
  getSubmissionImageUri,
  managedImageExists,
} from '@/features/records/services/scanImageStorage';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { useSync } from '@/features/sync/hooks/useSync';
import {
  getReportSyncAttemptOutcome,
  type ReportSyncAttemptOutcome,
} from '@/features/sync/utils/syncStatusCopy';
import {
  buildSupportReference,
  getSyncAttention,
  supportShareMessage,
} from '@/features/sync/utils/syncAttention';
import { useTheme } from '@/hooks/use-theme';

const MAX_AFFECTED_AREA_HECTARES = 10_000;

export const STEP_TITLES = [
  'Original scan',
  'Farm & area',
  'Your observation',
  'Location',
  'Review & submit',
];

const STEP_SHORT_LABELS = [
  'Scan',
  'Farm',
  'Observe',
  'Location',
  'Review',
];

const REQUIREMENT_OWNING_STEP: Record<FieldReportSubmissionRequirement, number> = {
  original_scan_image: 1,
  submission_image: 1,
  source_image_dimensions: 1,
  ai_supported_result: 1,
  confidence: 1,
  class_scores: 1,
  symptom_checklist: 1,
  submitter_identity: 1,
  submitter_role: 1,
  province: 2,
  municipality: 2,
  barangay: 2,
  farmer_or_farm_owner_name: 2,
  affected_area_hectares: 2,
  affected_portion_percent: 2,
  final_coordinates: 4,
  location_source: 4,
  location_unavailable_reason: 4,
  gps_accuracy: 4,
  observation_time: 1,
};

type ReporterConcernChoice = 'none' | 'rssi' | 'other';

const REPORTER_CONCERN_OPTIONS: {
  choice: ReporterConcernChoice;
  hint?: string;
  label: string;
}[] = [
  { choice: 'none', label: 'None' },
  {
    choice: 'rssi',
    hint: 'Field concern only · not shown by the scan',
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

export type FieldReportScreenProps = {
  initialStep?: number;
};

export default function FieldReportScreen({ initialStep: propsInitialStep }: FieldReportScreenProps = {}) {
  const database = useCaneGuardDatabase();
  const theme = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    caneClass?: string | string[];
    cropAge?: string | string[];
    detailsSaved?: string | string[];
    notes?: string | string[];
    scanRecordId?: string | string[];
    step?: string;
    variety?: string | string[];
  }>();
  const scanRecordId = Array.isArray(params.scanRecordId)
    ? params.scanRecordId[0]
    : (params.scanRecordId ?? null);
  const stepParam = params.step ? Number(params.step) : undefined;
  const resolvedInitialStep = propsInitialStep ?? stepParam ?? 1;

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
  const isFinalized = report.data?.authoringState === 'finalized';

  const [currentStep, setCurrentStep] = useState<number>(
    resolvedInitialStep >= 1 && resolvedInitialStep <= 5 ? resolvedInitialStep : 1,
  );
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retryOutcome, setRetryOutcome] = useState<ReportSyncAttemptOutcome | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [pendingFinalizeValues, setPendingFinalizeValues] = useState<FinalizeFieldReportFormValues | null>(null);

  // Form values in component state so they survive step transitions
  const [loadedReportId, setLoadedReportId] = useState<string | null>(null);
  const [farmerName, setFarmerName] = useState(report.data?.farmerOrFarmOwnerName ?? '');
  const [barangay, setBarangay] = useState(report.data?.barangay ?? '');
  const [province, setProvince] = useState(report.data?.province ?? defaultRegion?.province ?? '');
  const [municipality, setMunicipality] = useState(report.data?.municipality ?? defaultRegion?.municipality ?? '');
  const [affectedAreaText, setAffectedAreaText] = useState(
    report.data?.affectedAreaHectares === null || report.data?.affectedAreaHectares === undefined
      ? ''
      : formatDecimalInput(report.data.affectedAreaHectares),
  );
  const [affectedPortionText, setAffectedPortionText] = useState(
    report.data?.affectedPortionPercent === null || report.data?.affectedPortionPercent === undefined
      ? ''
      : formatDecimalInput(report.data.affectedPortionPercent),
  );
  const [affectedAreaChoice, setAffectedAreaChoice] = useState<MeasurementProvenance | null>(
    report.data?.affectedAreaMeasurementExplicit === true
      ? report.data.affectedAreaMeasurement
      : report.data?.affectedAreaMeasurementExplicit === false
        ? null
        : report.data?.affectedAreaHectares !== null && report.data?.affectedAreaHectares !== undefined
          ? 'measured'
          : null,
  );
  const [affectedPortionChoice, setAffectedPortionChoice] = useState<MeasurementProvenance | null>(
    report.data?.affectedPortionMeasurementExplicit === true
      ? report.data.affectedPortionMeasurement
      : report.data?.affectedPortionMeasurementExplicit === false
        ? null
        : report.data?.affectedPortionPercent !== null && report.data?.affectedPortionPercent !== undefined
          ? 'measured'
          : null,
  );
  const [variety, setVariety] = useState(report.data?.sugarcaneVariety ?? '');
  const [cropAge, setCropAge] = useState(report.data?.cropAge ?? '');
  const [caneClass, setCaneClass] = useState(report.data?.caneClass ?? '');
  const [notes, setNotes] = useState(report.data?.fieldNotes ?? '');
  const [fieldErrors, setFieldErrors] = useState<{
    affectedArea?: string;
    affectedPortion?: string;
  }>({});
  const [formDraftStatus, setFormDraftStatus] = useState<
    'idle' | 'saving' | 'saved' | 'failed'
  >('idle');
  const [formDraftSavedAt, setFormDraftSavedAt] = useState<string | null>(null);
  const lastCheckpointSignature = useRef<string | null>(null);

  const [mismatchDraft, setMismatchDraft] = useState(() => ({
    reportId: report.data?.id ?? null,
    mismatchReported: report.data?.mismatchReported ?? null,
    reporterConcernChoice: getReporterConcernChoice(
      report.data?.reporterSuspectedCondition ?? '',
    ),
    reporterObservationText: report.data?.reporterObservationText ?? '',
    reporterSuspectedCondition: report.data?.reporterSuspectedCondition ?? '',
  }));

  // A finalized report must never keep draft-exit handling: the draft cancel
  // dialog is suppressed while finalized and cleared on finalize success.
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    returnToTab('/home');
  }, []);

  const handleFinalizedBack = useCallback(() => {
    setShowCancelConfirm(false);
    returnToTab('/home');
  }, []);

  // Android hardware back must return home from a finalized report instead of
  // falling back to the draft exit path.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android' || !isFinalized) {
        return undefined;
      }
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleFinalizedBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleFinalizedBack, isFinalized]),
  );

  // Hydrate state when draft loads or changes ID
  if (report.data && loadedReportId !== report.data.id) {
    setLoadedReportId(report.data.id);
    setFarmerName(report.data.farmerOrFarmOwnerName ?? '');
    setBarangay(report.data.barangay ?? '');
    setProvince(report.data.province ?? defaultRegion?.province ?? '');
    setMunicipality(report.data.municipality ?? defaultRegion?.municipality ?? '');
    setAffectedAreaText(
      report.data.affectedAreaHectares === null
        ? ''
        : formatDecimalInput(report.data.affectedAreaHectares),
    );
    setAffectedPortionText(
      report.data.affectedPortionPercent === null
        ? ''
        : formatDecimalInput(report.data.affectedPortionPercent),
    );
    setAffectedAreaChoice(
      report.data.affectedAreaMeasurementExplicit === true
        ? report.data.affectedAreaMeasurement
        : report.data.affectedAreaMeasurementExplicit === false
          ? null
          : report.data.affectedAreaHectares !== null
            ? 'measured'
            : null,
    );
    setAffectedPortionChoice(
      report.data.affectedPortionMeasurementExplicit === true
        ? report.data.affectedPortionMeasurement
        : report.data.affectedPortionMeasurementExplicit === false
          ? null
          : report.data.affectedPortionPercent !== null
            ? 'measured'
            : null,
    );
    setVariety(report.data.sugarcaneVariety ?? '');
    setCropAge(report.data.cropAge ?? '');
    setCaneClass(report.data.caneClass ?? '');
    setNotes(report.data.fieldNotes ?? '');
    setMismatchDraft({
      reportId: report.data.id,
      mismatchReported: report.data.mismatchReported,
      reporterConcernChoice: getReporterConcernChoice(
        report.data.reporterSuspectedCondition ?? '',
      ),
      reporterObservationText: report.data.reporterObservationText ?? '',
      reporterSuspectedCondition: report.data.reporterSuspectedCondition ?? '',
    });

    // D02: unsaved form inputs are recoverable for the same owner. The
    // checkpoint only wins over the persisted Draft because an explicit save
    // or finalize deletes it.
    const checkpoint =
      user === null
        ? null
        : readFieldReportFormCheckpoint(
            database,
            user.uuid,
            report.data.id,
            report.data.authoringState,
          );
    if (checkpoint) {
      const saved = checkpoint.checkpoint;
      setFarmerName(saved.farmerName);
      setBarangay(saved.barangay);
      setProvince(saved.province || defaultRegion?.province || '');
      setMunicipality(saved.municipality || defaultRegion?.municipality || '');
      setAffectedAreaText(saved.affectedAreaText);
      setAffectedPortionText(saved.affectedPortionText);
      setAffectedAreaChoice(saved.affectedAreaChoice);
      setAffectedPortionChoice(saved.affectedPortionChoice);
      setVariety(saved.variety);
      setCropAge(saved.cropAge);
      setCaneClass(saved.caneClass);
      setNotes(saved.notes);
      setMismatchDraft({
        reportId: report.data.id,
        mismatchReported: saved.mismatchReported,
        reporterConcernChoice: getReporterConcernChoice(
          saved.reporterSuspectedCondition,
        ),
        reporterObservationText: saved.reporterObservationText,
        reporterSuspectedCondition: saved.reporterSuspectedCondition,
      });
      if (propsInitialStep === undefined && stepParam === undefined) {
        setCurrentStep(Math.max(1, Math.min(5, saved.step)));
      }
      lastCheckpointSignature.current = checkpointSignature(saved);
      setFormDraftSavedAt(saved.savedAt);
      setFormDraftStatus('saved');
    }
  }

  // Debounced local checkpoint for the Draft form. It never uploads and is
  // deleted as soon as an explicit save or finalize owns the values.
  useEffect(() => {
    if (
      !user ||
      !report.data ||
      report.data.authoringState !== 'draft' ||
      loadedReportId !== report.data.id
    ) {
      return;
    }
    const checkpoint: FieldReportFormCheckpoint = {
      affectedAreaChoice,
      affectedAreaText,
      affectedPortionChoice,
      affectedPortionText,
      barangay,
      caneClass,
      cropAge,
      farmerName: farmerName,
      mismatchReported: mismatchDraft.mismatchReported,
      municipality,
      notes,
      province,
      reporterObservationText: mismatchDraft.reporterObservationText,
      reporterSuspectedCondition: mismatchDraft.reporterSuspectedCondition,
      savedAt: new Date().toISOString(),
      step: currentStep,
      variety,
    };
    const signature = checkpointSignature(checkpoint);
    if (signature === lastCheckpointSignature.current) {
      return;
    }
    const reportId = report.data.id;
    setFormDraftStatus('saving');
    const timer = setTimeout(() => {
      void writeFieldReportFormCheckpoint(database, user.uuid, reportId, {
        ...checkpoint,
        savedAt: new Date().toISOString(),
      })
        .then(() => {
          lastCheckpointSignature.current = signature;
          setFormDraftStatus('saved');
          setFormDraftSavedAt(new Date().toISOString());
        })
        .catch(() => setFormDraftStatus('failed'));
    }, 700);
    return () => clearTimeout(timer);
  }, [
    affectedAreaChoice,
    affectedAreaText,
    affectedPortionChoice,
    affectedPortionText,
    barangay,
    caneClass,
    cropAge,
    currentStep,
    database,
    farmerName,
    loadedReportId,
    mismatchDraft.mismatchReported,
    mismatchDraft.reporterObservationText,
    mismatchDraft.reporterSuspectedCondition,
    municipality,
    notes,
    province,
    report.data,
    user,
    variety,
  ]);

  const clearFormCheckpoint = useCallback(() => {
    if (user && report.data) {
      deleteFieldReportFormCheckpoint(database, user.uuid, report.data.id);
      lastCheckpointSignature.current = null;
    }
    setFormDraftStatus('idle');
    setFormDraftSavedAt(null);
  }, [database, report.data, user]);

  // Values returned from the optional-details sheet route (F6). The sheet
  // passes the four fields back as params; applying them to this screen's
  // state keeps them in the same Draft save path. Applied once per returned
  // marker, mirroring the draft hydration pattern below.
  const returnedDetailsSaved = firstSearchParam(params.detailsSaved);
  const returnedVariety = firstSearchParam(params.variety);
  const returnedCropAge = firstSearchParam(params.cropAge);
  const returnedCaneClass = firstSearchParam(params.caneClass);
  const returnedNotes = firstSearchParam(params.notes);
  const [appliedDetailsMarker, setAppliedDetailsMarker] = useState<string | null>(null);
  const returnedDetailsMarker =
    returnedDetailsSaved === '1'
      ? [returnedVariety, returnedCropAge, returnedCaneClass, returnedNotes].join('|')
      : null;
  if (returnedDetailsMarker && returnedDetailsMarker !== appliedDetailsMarker) {
    setAppliedDetailsMarker(returnedDetailsMarker);
    if (returnedVariety !== undefined) {
      setVariety(returnedVariety);
    }
    if (returnedCropAge !== undefined) {
      setCropAge(returnedCropAge);
    }
    if (returnedCaneClass !== undefined) {
      setCaneClass(returnedCaneClass);
    }
    if (returnedNotes !== undefined) {
      setNotes(returnedNotes);
    }
  }


  const goToStep = (targetStep: number) => {
    const clamped = Math.max(1, Math.min(5, targetStep));
    setStepDirection(clamped >= currentStep ? 'forward' : 'backward');
    setCurrentStep(clamped);
  };

  const handleMismatchReportedChange = (value: boolean) => {
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

  const provinceOptions = referenceData.data.regions.map((r) => r.province);
  const municipalityOptions =
    referenceData.data.regions.find((r) => r.province === province)?.municipalities ?? [];

  const changeProvince = (nextProvince: string) => {
    setProvince(nextProvince);
    const reg = referenceData.data.regions.find((entry) => entry.province === nextProvince);
    setMunicipality(reg?.municipalities[0] ?? municipality);
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
      mismatchReported: mismatchDraft.mismatchReported,
      reporterObservationText: mismatchDraft.reporterObservationText,
      reporterSuspectedCondition: mismatchDraft.reporterSuspectedCondition,
    };
  };

  const handleCancel = () => {
    if (isFinalized) {
      handleFinalizedBack();
      return;
    }
    setShowCancelConfirm(true);
  };

  const handleKeepDraft = async () => {
    setShowCancelConfirm(false);
    if (isFinalized) {
      returnToTab('/home');
      return;
    }
    if (!report.data) {
      showToast('Draft not saved — open the report again and retry', 'error');
      return;
    }
    const values = collectValues(false);
    if (!values) {
      // Invalid numeric input keeps the inspector on the form with the
      // offending step identified; nothing is announced as saved.
      showToast('Draft not saved — fix the highlighted field first', 'error');
      goToStep(2);
      return;
    }
    const saved = await report.save(values);
    if (!saved) {
      showToast(
        report.getLastOperationError() ?? 'Draft not saved — please try again',
        'error',
      );
      return;
    }
    clearFormCheckpoint();
    showToast('Draft saved', 'success');
    returnToTab('/home');
  };

  const handleDiscardDraft = async () => {
    setShowCancelConfirm(false);
    if (isFinalized) {
      returnToTab('/home');
      return;
    }
    if (report.data) {
      const discarded = await report.discardDraft();
      if (!discarded) {
        showToast('Could not discard the draft — please try again', 'error');
        return;
      }
    }
    clearFormCheckpoint();
    showToast('Draft discarded', 'info');
    returnToTab('/home');
  };

  const handleSave = async () => {
    const values = collectValues(false);
    if (!values) {
      showToast('Draft not saved — fix the highlighted field first', 'error');
      goToStep(2);
      return;
    }
    const result = await report.save(values);
    if (!result) {
      showToast(
        report.getLastOperationError() ?? 'Draft not saved — please try again',
        'error',
      );
      return;
    }
    clearFormCheckpoint();
    showToast('Draft saved', 'success');
  };

  const handleFinalize = () => {
    const values = collectValues(true);
    if (values) {
      setFinalizeError(null);
      setPendingFinalizeValues({
        ...values,
        affectedAreaHectares: values.affectedAreaHectares ?? null,
        affectedAreaMeasurement: values.affectedAreaMeasurement ?? 'not_measured',
        affectedPortionPercent: values.affectedPortionPercent ?? null,
        affectedPortionMeasurement:
          values.affectedPortionMeasurement ?? 'not_measured',
      });
      setShowFinalizeConfirm(true);
    } else {
      // Numerical error on Step 2; navigate back to Step 2 so inspector sees it
      goToStep(2);
    }
  };

  const confirmFinalize = async () => {
    if (!pendingFinalizeValues) {
      setShowFinalizeConfirm(false);
      return;
    }
    // A failed finalize keeps the gate open with the existing error text;
    // only a confirmed success closes it.
    const finalized = await finalizeAndSync(pendingFinalizeValues);
    if (finalized) {
      setShowCancelConfirm(false);
      setShowFinalizeConfirm(false);
      setFinalizeError(null);
      setPendingFinalizeValues(null);
    } else {
      setFinalizeError(report.errorMessage || 'Could not finalize report — check required fields');
    }
  };

  const finalizeAndSync = async (values: FinalizeFieldReportFormValues) => {
    try {
      const finalized = await report.finalize(values);
      if (finalized) {
        clearFormCheckpoint();
        if (sync.isOnline === true) {
          await sync.syncNow('after-save');
          showToast('Report finalized', 'success');
        } else {
          showToast('Report finalized — will sync when online', 'success');
        }
        await report.refresh();
        return true;
      }
      showToast(
        report.errorMessage || 'Could not finalize report — check required fields',
        'error',
      );
      return false;
    } catch {
      showToast('Could not finalize report — please try again', 'error');
      return false;
    }
  };

  const retrySync = async () => {
    if (!report.data || retrying) {
      return;
    }
    const targetReportId = report.data.id;
    const previousStatus = report.data.syncStatus;
    const previousErrorCode = report.data.lastSyncErrorCode;
    setRetrying(true);
    setRetryError(null);
    setRetryOutcome(null);
    try {
      const result = await sync.retryReport(targetReportId);
      const refreshed = await report.refresh();
      // The confirmation belongs to this report: another report syncing in the
      // same batch, a null result, or an auth/validation failure is never
      // reported as "Sent to office".
      const targetResult =
        result?.results.find((entry) => entry.reportId === targetReportId) ??
        null;
      const outcome = getReportSyncAttemptOutcome({
        isOnline: sync.isOnline,
        lastSyncErrorCode:
          refreshed?.lastSyncErrorCode ?? previousErrorCode,
        reportSyncStatus: refreshed?.syncStatus ?? previousStatus,
        targetResult,
      });
      setRetryOutcome(outcome);
      showToast(
        outcome.message,
        outcome.kind === 'sent'
          ? 'success'
          : outcome.kind === 'still-waiting'
            ? 'info'
            : 'error',
      );
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

  const shareSupportReference = async (fieldReport: FieldReport) => {
    try {
      await Share.share({
        message: supportShareMessage({
          code: fieldReport.lastSyncErrorCode,
          reportId: fieldReport.id,
        }),
      });
    } catch {
      showToast('Could not open the share sheet — copy the reference above', 'error');
    }
  };

  const handleLocationCapture = async () => {
    const res = await report.captureLocation();
    if (res && res.finalLatitude !== null) {
      showToast(LOCATION_ADDED, 'success');
      return;
    }
    if (res && res.locationSource === 'unavailable') {
      showToast(
        `${LOCATION_UNCONFIRMED} — ${LOCATION_UNAVAILABLE_REASON_LABELS[res.locationUnavailableReason ?? 'other']}. Your draft is still saved.`,
        'info',
      );
      return;
    }
    showToast(
      report.getLastOperationError() ?? `${LOCATION_UNCONFIRMED}. Your draft is still saved.`,
      'error',
    );
  };

  const handleClearUnavailable = async () => {
    const res = await report.clearLocationUnavailable();
    if (!res) {
      showToast(
        report.getLastOperationError() ?? 'Could not reset location — please try again',
        'error',
      );
      return;
    }
    showToast('Location reset', 'info');
  };

  const handleMarkUnavailable = async (reason: LocationUnavailableReason) => {
    const res = await report.markLocationUnavailable(reason);
    if (!res) {
      showToast(
        report.getLastOperationError() ?? 'Could not update location — please try again',
        'error',
      );
      return;
    }
    showToast('Location marked unavailable', 'info');
  };

  const openDeviceLocationSettings = () => {
    void Linking.openSettings().catch(() => {
      setRetryError(
        'Device settings could not be opened. Please open Settings and enable location services.',
      );
    });
  };

  const syncAttention = getSyncAttention(report.data?.lastSyncErrorCode ?? null);

  const possibleMatchInput = useMemo<PossibleMatchLookupInput>(
    () => ({
      barangay: barangay || null,
      finalLatitude: report.data?.finalLatitude ?? null,
      finalLongitude: report.data?.finalLongitude ?? null,
      farmerOrFarmOwnerName: farmerName || null,
      locationSource: report.data?.locationSource ?? null,
      municipality: municipality || null,
      observedAt: report.data?.observedAt ?? new Date().toISOString(),
      predictedLabel: record.data?.predictedLabel ?? null,
      province: province || null,
      reportId: report.data?.id ?? '',
      scanRecordId: report.data?.scanRecordId ?? '',
    }),
    [
      barangay,
      farmerName,
      municipality,
      province,
      record.data?.predictedLabel,
      report.data?.finalLatitude,
      report.data?.finalLongitude,
      report.data?.id,
      report.data?.locationSource,
      report.data?.observedAt,
      report.data?.scanRecordId,
    ],
  );
  const possibleRecentMatch = usePossibleRecentMatch(possibleMatchInput);

  const missingRequirements = useMemo(() => {
    if (!report.data) {
      return new Set<FieldReportSubmissionRequirement>();
    }
    const managedImageUri = record.data?.managedImageUri ?? null;
    const submissionImageUri = record.data?.submissionImageUri ?? null;
    const expectedSubmissionImageUri = report.data.submitterIdentity
      ? getSubmissionImageUri(report.data.scanRecordId, report.data.submitterIdentity)
      : null;

    return new Set(
      getMissingSubmissionRequirements(
        {
          ...report.data,
          farmerOrFarmOwnerName: farmerName.trim() || null,
          barangay: barangay.trim() || null,
          province: province.trim(),
          municipality: municipality.trim(),
          affectedAreaHectares: previewMeasurementValue(
            affectedAreaText,
            affectedAreaChoice,
          ),
          affectedAreaMeasurement:
            affectedAreaChoice ?? report.data.affectedAreaMeasurement,
          affectedPortionPercent: previewMeasurementValue(
            affectedPortionText,
            affectedPortionChoice,
          ),
          affectedPortionMeasurement:
            affectedPortionChoice ?? report.data.affectedPortionMeasurement,
        },
        {
          checklistConsistency: record.data?.checklistConsistency ?? null,
          classScores: record.data?.classScores ?? [],
          confidence: record.data?.confidence ?? null,
          managedImageUri,
          managedImageAvailable: Boolean(managedImageUri && managedImageExists(managedImageUri)),
          predictedLabel: record.data?.predictedLabel ?? null,
          sourceHeight: record.data?.sourceHeight ?? null,
          sourceWidth: record.data?.sourceWidth ?? null,
          submissionImageAvailable: Boolean(
            submissionImageUri && managedImageExists(submissionImageUri),
          ),
          expectedSubmissionImageUri,
          submissionImageMimeType: record.data?.submissionImageMimeType ?? null,
          submissionImageSizeBytes: record.data?.submissionImageSizeBytes ?? null,
          submissionImageUri,
        },
        {
          affectedAreaMeasurement: affectedAreaChoice,
          affectedPortionMeasurement: affectedPortionChoice,
        },
      ),
    );
  }, [
    affectedAreaChoice,
    affectedAreaText,
    affectedPortionChoice,
    affectedPortionText,
    barangay,
    farmerName,
    municipality,
    province,
    record.data,
    report.data,
  ]);

  const reporterDisplayName =
    user && user.uuid === report.data?.submitterIdentity
      ? user.name
      : report.data?.submitterIdentity ?? null;

  return (
    <SafeAreaView
      testID="field-report.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader
          title={
            report.data?.authoringState === 'finalized'
              ? 'Finalized Field Report'
              : 'Field Report Draft'
          }
          showClose={!isFinalized}
          onClosePress={handleCancel}
          onBackPress={isFinalized ? handleFinalizedBack : handleBack}
          closeTestID="field-report.header-close"
        />
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
            <AppButton
              testID="field-report.error-return-home"
              onPress={() => returnToTab('/home')}
              variant="secondary"
              leadingIcon="home">
              Return Home
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
              <HelpHintGroup>
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
                        ? `This report is finalized and saved on this device. Status: ${getSyncPresentation(report.data.syncStatus, report.data.lastSyncErrorCode).label}.`
                        : 'Save incomplete information now and return later. Drafts are saved only on this device and are not sent.'}
                    </Text>
                  </View>
                </View>

                {report.data.authoringState === 'draft' ? (
                  <Text
                    testID="field-report.form-draft-status"
                    accessibilityLiveRegion="polite"
                    style={[styles.helpText, { color: theme.textSecondary }]}>
                    {formatFormDraftStatus(formDraftStatus, formDraftSavedAt)}
                  </Text>
                ) : null}

                {report.data.authoringState === 'finalized' ? (
                  // Rule 5: Finalized reports are not a wizard
                  <>
                    <FinalizedReportSummary fieldReport={report.data} />
                    {report.data.syncStatus === 'synced' ? (
                      <AuthorityReviewSection
                        fieldReport={report.data}
                        status={authorityStatus}
                      />
                    ) : null}
                    {report.data.syncStatus === 'failed' &&
                    syncAttention?.action === 'support' ? (
                      <NeedsAttentionCard
                        attention={syncAttention}
                        fieldReport={report.data}
                        onShare={() => void shareSupportReference(report.data!)}
                      />
                    ) : null}

                    {report.data.syncStatus === 'pending' ||
                    (report.data.syncStatus === 'failed' &&
                      syncAttention?.action !== 'support') ? (
                      <AppButton
                        testID="field-report.retry-sync"
                        onPress={() => void retrySync()}
                        disabled={
                          retrying || sync.isSyncing || sync.isOnline !== true
                        }
                        leadingIcon="refresh-cw"
                        accessibilityLabel={
                          retrying
                            ? 'Trying to send the Field Report again'
                            : syncAttention?.action === 'automatic-retry'
                              ? 'Try sending this Field Report again'
                              : 'Send Field Report'
                        }>
                        {retrying
                          ? 'Sending…'
                          : syncAttention?.action === 'automatic-retry'
                            ? 'Try Sending Again'
                            : 'Send Report'}
                      </AppButton>
                    ) : null}

                    <AppButton
                      testID="field-report.return-home"
                      onPress={handleFinalizedBack}
                      variant="secondary"
                      leadingIcon="home">
                      Return Home
                    </AppButton>

                    <InheritedScanEvidence
                      record={record.data}
                      loading={record.loading}
                      errorMessage={record.errorMessage}
                      onRetry={() => void record.refresh()}
                      editable={false}
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
                  </>
                ) : (
                  // 5-Step Stepped Wizard (§6.1, D-5, W-1, W-2, W-3)
                  <>
                    {/* Stepper Navigation Pills */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.stepPillsContainer}
                      style={styles.stepPillsScroll}>
                      {STEP_SHORT_LABELS.map((label, index) => {
                        const stepNum = index + 1;
                        const isActive = currentStep === stepNum;
                        const incomplete = isStepIncomplete(stepNum, missingRequirements);
                        return (
                          <Pressable
                            key={stepNum}
                            testID={`field-report.step-${stepNum}`}
                            accessibilityRole="tab"
                            accessibilityLabel={`Step ${stepNum}: ${STEP_TITLES[index]}${incomplete ? ' (incomplete)' : ''}`}
                            accessibilityState={{ selected: isActive }}
                            onPress={() => goToStep(stepNum)}
                            style={({ pressed }) => [
                              styles.stepPill,
                              {
                                backgroundColor: isActive ? theme.primary : theme.surfaceElevated,
                                borderColor: isActive ? theme.primary : theme.border,
                              },
                              pressed && styles.pressed,
                            ]}>
                            <Text
                              style={[
                                styles.stepPillText,
                                { color: isActive ? theme.background : theme.text },
                              ]}>
                              {isActive ? `${stepNum}. ${label}` : `${stepNum}`}
                            </Text>
                            {incomplete ? (
                              <View
                                style={[
                                  styles.incompleteDot,
                                  { backgroundColor: isActive ? theme.warningBg : theme.warning },
                                ]}
                              />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* Step Title */}
                    <Text
                      testID="field-report.wizard-step-title"
                      style={[styles.wizardStepTitle, { color: theme.text }]}>
                      Step {currentStep} of 5: {STEP_TITLES[currentStep - 1]}
                    </Text>

                    {/* Active Step with Slide Transition */}
                    <Animated.View
                      key={`wizard-step-${currentStep}`}
                      entering={
                        stepDirection === 'forward'
                          ? SlideInRight.duration(200)
                          : SlideInLeft.duration(200)
                      }
                      style={styles.stepContainer}>
                      {currentStep === 1 ? (
                        /* Step 1: Scan evidence (read-only) */
                        <AutomaticSummaryCard
                          fieldReport={report.data}
                          record={record.data}
                          reporterName={reporterDisplayName}
                        />
                      ) : currentStep === 2 ? (
                        /* Step 2: Farm & area */
                        <View
                          style={[
                            styles.formCard,
                            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                          ]}>
                          <View style={styles.sectionHeading}>
                            <Feather name="edit-3" size={20} color={theme.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                              Farm & area
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
                            barangays={referenceData.data.barangays}
                            value={barangay}
                            onChange={setBarangay}
                          />
                          <View style={styles.numericRow}>
                            <View style={styles.numericField}>
                              <TextField
                                testID="field-report.affected-area-input"
                                label="Affected area (hectares)"
                                hint="The size of the affected planting."
                                helpHintText="Mark Not measured when you cannot pace or map the affected planting."
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
                                  setFieldErrors((current) => ({
                                    ...current,
                                    affectedArea: undefined,
                                  }));
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
                                hint="How much of the planting looks affected."
                                helpHintText="Mark Not measured when you cannot estimate the affected share."
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
                                  setFieldErrors((current) => ({
                                    ...current,
                                    affectedPortion: undefined,
                                  }));
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
                          {referenceData.errorMessage ? (
                            <Text
                              testID="field-report.reference-data-error"
                              style={[styles.helpText, { color: theme.warning }]}>
                              {referenceData.errorMessage} Showing the offline list; saved values are unchanged.
                            </Text>
                          ) : null}
                        </View>
                      ) : currentStep === 3 ? (
                        /* Step 3: Your observation */
                        <View
                          style={[
                            styles.formCard,
                            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                          ]}>
                          <ReporterObservationSection
                            editable={true}
                            mismatchReported={mismatchDraft.mismatchReported}
                            onMismatchReportedChange={handleMismatchReportedChange}
                            onReporterConcernChoiceChange={handleReporterConcernChoiceChange}
                            onReporterConcernTextChange={handleReporterConcernTextChange}
                            onReporterObservationTextChange={(value) =>
                              setMismatchDraft((current) => ({
                                ...current,
                                reporterObservationText: value,
                              }))
                            }
                            reporterConcernChoice={mismatchDraft.reporterConcernChoice}
                            reporterObservationText={mismatchDraft.reporterObservationText}
                            reporterSuspectedCondition={mismatchDraft.reporterSuspectedCondition}
                          />
                        </View>
                      ) : currentStep === 4 ? (
                        /* Step 4: Location */
                        <LocationCapture
                          fieldReport={report.data}
                          capturing={report.capturingLocation}
                          isOnline={sync.isOnline}
                          locationServicesDisabled={report.locationServicesDisabled}
                          markingUnavailable={report.markingLocationUnavailable}
                          saveInProgress={report.saving || report.finalizing}
                          onCancelCapture={report.cancelLocationCapture}
                          onCapture={() => void handleLocationCapture()}
                          onClearUnavailable={() => void handleClearUnavailable()}
                          onMarkUnavailable={(reason) =>
                            void handleMarkUnavailable(reason)
                          }
                          onOpenLocationSettings={openDeviceLocationSettings}
                          onOpenMap={() =>
                            router.push({
                              pathname: './manual-map',
                              params: {
                                reportId: report.data!.id,
                                scanRecordId: report.data!.scanRecordId,
                              },
                            })
                          }
                        />
                      ) : (
                        /* Step 5: Review & submit */
                        <>
                          {report.submissionIssues.length > 0 ? (
                            <View
                              testID="field-report.submission-issues"
                              accessibilityLiveRegion="assertive"
                              style={[
                                styles.validationCard,
                                { backgroundColor: theme.dangerBg, borderColor: theme.danger },
                              ]}>
                              <Text style={[styles.validationTitle, { color: theme.danger }]}>
                                Complete these requirements before finalizing:
                              </Text>
                              {report.submissionIssues.map((issue) => (
                                <Text key={issue} style={[styles.statusMessage, { color: theme.text }]}>
                                  • {SUBMISSION_REQUIREMENT_LABELS[issue]}
                                </Text>
                              ))}
                              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                                Your latest entries were saved and this report remains a Draft.
                              </Text>
                            </View>
                          ) : null}

                          {possibleRecentMatch.match ? (
                            <PossibleRecentMatchWarning match={possibleRecentMatch.match} />
                          ) : null}

                          <ReadyToSubmitChecklist
                            missing={missingRequirements}
                            onJumpToStep={goToStep}
                          />

                          <View style={[styles.detailsCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                            <View style={styles.detailsHeader}>
                              <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>More field details</Text>
                              <Text style={[styles.helpText, { color: theme.textSecondary }]}>
                                {variety || cropAge || caneClass || notes
                                  ? 'Optional details saved on this step. Reopen the sheet to edit them.'
                                  : 'Sugarcane variety, crop age, cane class, and field notes (optional).'}
                              </Text>
                            </View>
                            <AppButton
                              testID="field-report.more-details"
                              variant="secondary"
                              accessibilityLabel="Show More field details"
                              onPress={() =>
                                router.push({
                                  params: {
                                    caneClass,
                                    cropAge,
                                    notes,
                                    scanRecordId: scanRecordId ?? undefined,
                                    variety,
                                  },
                                  pathname: '/field-report-details',
                                })
                              }>
                              {variety || cropAge || caneClass || notes ? 'Edit optional details' : 'Add optional details'}
                            </AppButton>
                          </View>
                        </>
                      )}
                    </Animated.View>

                    {/* Step Navigation Controls */}
                    <View style={styles.wizardNav}>
                      <View style={styles.wizardNavRow}>
                        {currentStep > 1 ? (
                          <AppButton
                            testID="field-report.wizard-prev"
                            onPress={() => goToStep(currentStep - 1)}
                            variant="secondary"
                            leadingIcon="arrow-left"
                            style={styles.wizardNavButton}
                            accessibilityLabel={`Go back to step ${currentStep - 1}`}>
                            Previous
                          </AppButton>
                        ) : null}
                        {currentStep < 5 ? (
                          <AppButton
                            testID="field-report.wizard-next"
                            onPress={() => goToStep(currentStep + 1)}
                            trailingIcon="arrow-right"
                            style={styles.wizardNavButton}
                            accessibilityLabel={`Go to step ${currentStep + 1}`}>
                            Next
                          </AppButton>
                        ) : (
                          <AppButton
                            testID="field-report.finalize"
                            onPress={handleFinalize}
                            disabled={report.saving || report.capturingLocation || report.finalizing}
                            leadingIcon="check-circle"
                            style={styles.wizardNavButton}
                            accessibilityLabel={
                              report.finalizing ? 'Finalizing Field Report' : 'Finalize Field Report'
                            }>
                            {report.finalizing ? 'Finalizing Report…' : 'Finalize Report'}
                          </AppButton>
                        )}
                      </View>

                      <AppButton
                        testID="field-report.save-draft"
                        onPress={handleSave}
                        variant="secondary"
                        disabled={report.saving || report.capturingLocation || report.finalizing}
                        leadingIcon="save"
                        accessibilityLabel={
                          report.finalizing
                            ? 'Save Field Report draft unavailable while finalizing'
                            : report.saving
                              ? 'Saving Field Report draft'
                              : 'Save Field Report draft'
                        }>
                        {report.saving ? 'Saving Draft...' : 'Save Draft'}
                      </AppButton>

                      <AppButton
                        testID="field-report.cancel"
                        onPress={handleCancel}
                        variant="secondary"
                        leadingIcon="x"
                        accessibilityLabel="Cancel field report and return home">
                        Cancel Report
                      </AppButton>
                    </View>
                  </>
                )}

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
                {retryOutcome ? (
                  <Text
                    testID="field-report.retry-outcome"
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.statusMessage,
                      {
                        color:
                          retryOutcome.kind === 'sent'
                            ? theme.success
                            : retryOutcome.kind === 'still-waiting'
                              ? theme.textSecondary
                              : theme.danger,
                      },
                    ]}>
                    {retryOutcome.message}
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
              </View>
              </HelpHintGroup>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}
        <ConfirmDialog
          visible={showCancelConfirm && !isFinalized}
          title="Cancel field report?"
          message="Do you want to keep your field report as a draft or discard it before returning home?"
          cancelLabel="Keep draft"
          confirmLabel="Discard draft"
          destructive
          overlay
          onRequestClose={() => setShowCancelConfirm(false)}
          onCancel={handleKeepDraft}
          onConfirm={handleDiscardDraft}
          testID="field-report.cancel-dialog"
        />
        <ConfirmDialog
          visible={showFinalizeConfirm}
          title="Finalize this report?"
          message={
            finalizeError
              ? `${finalizeConfirmMessage({ farmerName, record: record.data, report: report.data })} Finalize failed: ${finalizeError}`
              : finalizeConfirmMessage({ farmerName, record: record.data, report: report.data })
          }
          confirmLabel="Finalize report"
          confirmTestID="field-report.confirm-finalize"
          cancelLabel="Cancel"
          overlay
          testID="field-report.confirm-finalize-dialog"
          onConfirm={() => void confirmFinalize()}
          onCancel={() => setShowFinalizeConfirm(false)}
        />
      </View>
    </SafeAreaView>
  );
}

function isStepIncomplete(
  stepNumber: number,
  missing: Set<FieldReportSubmissionRequirement>,
): boolean {
  if (stepNumber === 3) {
    // Step 3 is Observation: optional, never blocks finalization
    return false;
  }
  if (stepNumber === 5) {
    return missing.size > 0;
  }
  for (const req of missing) {
    if (REQUIREMENT_OWNING_STEP[req] === stepNumber) {
      return true;
    }
  }
  return false;
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
          Report summary
        </Text>
      </View>
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>
        Everything below was saved from your completed scan and cannot be
        changed here.
      </Text>
      {record ? (
        <ExpoImage
          source={{ uri: record.managedImageUri }}
          accessibilityLabel="Original sugarcane scan image"
          cachePolicy="memory-disk"
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
              {getResultLabel(record.predictedLabel)}
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
          The saved scan is unavailable.
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

function LocationCapture({
  capturing,
  fieldReport,
  isOnline,
  locationServicesDisabled,
  markingUnavailable,
  onCancelCapture,
  onCapture,
  onClearUnavailable,
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
  onCancelCapture: () => void;
  onCapture: () => void;
  onClearUnavailable: () => void;
  onMarkUnavailable: (reason: LocationUnavailableReason) => void;
  onOpenLocationSettings: () => void;
  onOpenMap: () => void;
  saveInProgress: boolean;
}) {
  const theme = useTheme();
  const presentation = getGpsPresentation(fieldReport);
  const locationConfirmed = isLocationConfirmed(fieldReport);
  const [unavailableReason, setUnavailableReason] =
    useState<LocationUnavailableReason | null>(null);
  const [showUnavailable, setShowUnavailable] = useState(
    fieldReport.locationSource === 'unavailable',
  );
  const [correcting, setCorrecting] = useState(false);
  const [pendingReplacement, setPendingReplacement] = useState<
    'gps' | 'map' | null
  >(null);
  const locationUnavailable = fieldReport.locationSource === 'unavailable';
  const editingLocation = !locationConfirmed || correcting;
  const currentLocationSummary = describeConfirmedLocation(fieldReport);
  const requestCapture = () => {
    if (locationConfirmed) {
      setPendingReplacement('gps');
      return;
    }
    onCapture();
  };
  const requestMap = () => {
    if (locationConfirmed) {
      setPendingReplacement('map');
      return;
    }
    onOpenMap();
  };

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
            Enable location services in device settings, then retry location.
            Your draft is still saved.
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
      {locationConfirmed && !correcting ? (
        <>
          <Text
            testID="field-report.confirmed-location"
            style={[styles.statusMessage, { color: theme.text }]}>
            {currentLocationSummary}
          </Text>
          <AppButton
            testID="field-report.correct-location"
            accessibilityLabel="Change the saved report location"
            onPress={() => setCorrecting(true)}
            disabled={saveInProgress || markingUnavailable}
            leadingIcon="edit-3"
            variant="text">
            Change location
          </AppButton>
        </>
      ) : null}
      {capturing ? (
        <AppButton
          testID="field-report.stop-locating"
          accessibilityLabel="Stop locating and keep the current draft"
          onPress={onCancelCapture}
          leadingIcon="x-circle"
          variant="secondary">
          Stop locating
        </AppButton>
      ) : null}
      {editingLocation ? (
        <AppButton
          testID="field-report.capture-gps"
          onPress={requestCapture}
          disabled={capturing || saveInProgress}
          leadingIcon="crosshair"
          accessibilityLabel={capturing ? 'Adding location' : presentation.actionLabel}>
          {capturing ? 'Adding location...' : presentation.actionLabel}
        </AppButton>
      ) : null}
      {editingLocation && canUseManualMap(fieldReport) ? (
        isOnline === true ? (
          <AppButton
            testID="field-report.open-manual-map"
            accessibilityLabel="Choose location on map"
            onPress={requestMap}
            disabled={capturing || saveInProgress}
            leadingIcon="map"
            variant="secondary">
            Choose on map
          </AppButton>
        ) : (
          <Text testID="field-report.manual-map-offline" style={[styles.helpText, { color: theme.textSecondary }]}>
            Choosing on map needs an internet connection. The draft is unchanged.
          </Text>
        )
      ) : null}
      {editingLocation ? (
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>
          {correcting && locationConfirmed
            ? 'Choosing a new source replaces the saved location after you confirm. Cancel keeps it unchanged, and the earlier GPS attempt stays as evidence.'
            : 'Location is added to the report when it can be confirmed. You can retry location or choose on map at any time.'}
        </Text>
      ) : null}

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
            accessibilityLabel="Add a location instead"
            onPress={() => {
              setShowUnavailable(false);
              setUnavailableReason(null);
              onClearUnavailable();
            }}
            leadingIcon="crosshair"
            variant="secondary">
            Add Location Instead
          </AppButton>
        </View>
      ) : showUnavailable && editingLocation ? (
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
      ) : editingLocation ? (
        <AppButton
          testID="field-report.open-location-unavailable"
          accessibilityLabel="Continue without an exact location"
          onPress={() => {
            setCorrecting(false);
            setShowUnavailable(true);
          }}
          disabled={saveInProgress}
          variant="text"
          leadingIcon="help-circle">
          Continue Without a Location
        </AppButton>
      ) : null}
      {correcting && locationConfirmed ? (
        <AppButton
          testID="field-report.cancel-location-change"
          accessibilityLabel="Cancel changing the saved location"
          onPress={() => {
            setCorrecting(false);
            setShowUnavailable(false);
            setUnavailableReason(null);
          }}
          variant="text"
          leadingIcon="arrow-left">
          Cancel location change
        </AppButton>
      ) : null}
      <ConfirmDialog
        visible={pendingReplacement !== null}
        title="Replace the saved location?"
        message={`The current location (${currentLocationSummary}) will be replaced. Cancel keeps it unchanged.`}
        cancelLabel="Keep current"
        confirmLabel={
          pendingReplacement === 'map' ? 'Choose on map' : 'Use new GPS reading'
        }
        confirmTestID="field-report.confirm-location-replacement"
        overlay
        onRequestClose={() => setPendingReplacement(null)}
        onConfirm={() => {
          const replacement = pendingReplacement;
          setPendingReplacement(null);
          setCorrecting(false);
          if (replacement === 'map') {
            onOpenMap();
          } else if (replacement === 'gps') {
            onCapture();
          }
        }}
        onCancel={() => setPendingReplacement(null)}
        testID="field-report.location-replacement-dialog"
      />
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Original scan</Text>
      </View>
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>
        Saved from your completed scan. You cannot change it here.
      </Text>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading saved scan" color={theme.primary} />
      ) : errorMessage || !record ? (
        <>
          <Text style={[styles.error, { color: theme.danger }]}>{errorMessage ?? 'The saved scan is unavailable.'}</Text>
          <AppButton onPress={onRetry} leadingIcon="refresh-cw">Try again</AppButton>
        </>
      ) : (
        <>
          <ExpoImage
            source={{ uri: record.managedImageUri }}
            accessibilityLabel="Original sugarcane scan image"
            cachePolicy="memory-disk"
            contentFit="cover"
            style={styles.evidenceImage}
          />
          <EvidenceRow label="Possible Condition" value={getResultLabel(record.predictedLabel)} />
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
    ? "The reporter's observation does not match the Possible Condition"
    : "The reporter's observation matches the Possible Condition";
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
        <EvidenceRow label="Observation match" value={getAgreementLabel(mismatchReported)} />
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
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>
        Your observation and concern are recorded separately from the Possible Condition, which is decision-support only.
      </Text>

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
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>
          Report a concern on its own. Choosing one does not say the Possible Condition is wrong, and it is sent separately for office review.
        </Text>
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
          <Text testID="field-report.rssi-not-model-copy" style={[styles.helpText, { color: theme.textSecondary }]}>
            RSSI can be reported as a field concern, but the scan does not detect RSSI. It remains separate from the Possible Condition.
          </Text>
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

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function describeReportLocation(report: FieldReport | null): string {
  if (!report) {
    return 'No location saved yet';
  }
  if (report.locationSource === 'manual_map') {
    return 'Map location';
  }
  if (report.locationSource === 'unavailable') {
    return 'No location';
  }
  if (
    report.locationSource === 'gps' &&
    report.finalLatitude !== null &&
    report.finalLongitude !== null
  ) {
    return LOCATION_ADDED;
  }
  return 'No location yet';
}

function finalizeConfirmMessage({
  farmerName,
  record,
  report,
}: {
  farmerName: string;
  record: ScanRecordDetails | null;
  report: FieldReport | null;
}): string {
  const farmer = farmerName.trim() || 'this Field Report';
  const condition = record
    ? getResultLabel(record.predictedLabel)
    : 'unknown condition';
  return `Finalize the report for ${farmer}? Possible Condition: ${condition}. Location: ${describeReportLocation(report)}. A finalized report can no longer be edited.`;
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return <Row label={label} value={value} />;
}

function getGpsPresentation(fieldReport: FieldReport): {
  actionLabel: string;
  message: string;
} {
  if (fieldReport.locationSource === 'unavailable') {
    return {
      actionLabel: 'Retry location',
      message: fieldReport.locationUnavailableReason
        ? `${LOCATION_UNCONFIRMED}: ${LOCATION_UNAVAILABLE_REASON_LABELS[fieldReport.locationUnavailableReason]}. You can retry location or choose on map.`
        : `${LOCATION_UNCONFIRMED}. You can retry location or choose on map.`,
    };
  }
  if (
    fieldReport.locationSource === 'manual_map' &&
    fieldReport.finalLatitude !== null &&
    fieldReport.finalLongitude !== null
  ) {
    return {
      actionLabel: 'Retry location',
      message: 'Location added from the map.',
    };
  }
  if (fieldReport.gpsCaptureOutcome === 'low_accuracy') {
    return {
      actionLabel: 'Retry location',
      message: `${LOCATION_UNCONFIRMED}. You can retry location or choose on map.`,
    };
  }
  if (
    fieldReport.locationSource === 'gps' &&
    fieldReport.finalLatitude !== null &&
    fieldReport.finalLongitude !== null
  ) {
    return {
      actionLabel: 'Retry location',
      message: LOCATION_ADDED,
    };
  }

  switch (fieldReport.gpsCaptureOutcome) {
    case 'resolved':
      return {
        actionLabel: 'Retry location',
        message: LOCATION_ADDED,
      };
    case 'permission_denied':
      return {
        actionLabel: 'Retry location',
        message: `${LOCATION_UNCONFIRMED}. Location permission was not given. The draft is still saved and you can try again.`,
      };
    case 'unavailable':
      return {
        actionLabel: 'Retry location',
        message: `${LOCATION_UNCONFIRMED}. The draft is unchanged.`,
      };
    case 'error':
      return {
        actionLabel: 'Retry location',
        message: `${LOCATION_UNCONFIRMED}. The draft is unchanged.`,
      };
    default:
      return {
        actionLabel: 'Add location',
        message: 'No location added yet.',
      };
  }
}

function describeConfirmedLocation(fieldReport: FieldReport): string {
  if (fieldReport.locationSource === 'manual_map') {
    const selectedAt = fieldReport.manualLocationSelectedAt
      ? new Date(fieldReport.manualLocationSelectedAt).toLocaleString()
      : null;
    return selectedAt
      ? `Saved from the map on ${selectedAt}. GPS accuracy does not apply to a map pin.`
      : 'Saved from the map. GPS accuracy does not apply to a map pin.';
  }
  const attemptedAt = fieldReport.gpsAttemptedAt
    ? new Date(fieldReport.gpsAttemptedAt).toLocaleString()
    : null;
  const accuracy =
    fieldReport.gpsAccuracy !== null
      ? `±${fieldReport.gpsAccuracy.toFixed(1)} m`
      : 'accuracy not recorded';
  return attemptedAt
    ? `Saved from GPS on ${attemptedAt} (${accuracy}).`
    : `Saved from GPS (${accuracy}).`;
}

function isLocationConfirmed(fieldReport: FieldReport): boolean {
  if (fieldReport.locationSource === 'unavailable') {
    return false;
  }
  if (
    fieldReport.locationSource === 'manual_map' &&
    fieldReport.finalLatitude !== null &&
    fieldReport.finalLongitude !== null
  ) {
    return true;
  }
  if (fieldReport.gpsCaptureOutcome === 'low_accuracy') {
    return false;
  }
  if (
    fieldReport.locationSource === 'gps' &&
    fieldReport.finalLatitude !== null &&
    fieldReport.finalLongitude !== null
  ) {
    return true;
  }
  return fieldReport.gpsCaptureOutcome === 'resolved';
}

function canUseManualMap(fieldReport: FieldReport): boolean {
  return (
    fieldReport.locationSource === 'manual_map' ||
    fieldReport.locationSource === null ||
    fieldReport.gpsCaptureOutcome === 'low_accuracy'
  );
}

function formatMeasurementSummary(
  value: number | null,
  provenance: MeasurementProvenance,
  unit: string,
): string {
  if (provenance === 'not_measured') {
    return 'Not measured';
  }
  if (value === null) {
    return 'Not provided';
  }
  return unit === '%' ? `${value}%` : `${value} ${unit}`;
}

function formatLocationSummary(fieldReport: FieldReport): string {
  if (fieldReport.locationSource === 'unavailable') {
    return 'Not confirmed';
  }
  if (fieldReport.locationSource === 'manual_map') {
    return 'Added from map';
  }
  return fieldReport.locationSource === 'gps' ? LOCATION_ADDED : 'Not provided';
}

function previewMeasurementValue(
  value: string,
  choice: MeasurementProvenance | null,
): number | null {
  return choice === 'not_measured' ? null : parseDecimalInput(value);
}

/**
 * M13/D03: a rejected or blocked report is not offered as a blind resend. The
 * card explains the safe reason, keeps the immutable evidence on this device,
 * and hands support a reference that carries no photo, token, GPS or farmer text.
 */
function NeedsAttentionCard({
  attention,
  fieldReport,
  onShare,
}: {
  attention: NonNullable<ReturnType<typeof getSyncAttention>>;
  fieldReport: FieldReport;
  onShare: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      testID="field-report.needs-attention"
      accessibilityLiveRegion="polite"
      style={[
        styles.validationCard,
        { backgroundColor: theme.dangerBg, borderColor: theme.danger },
      ]}>
      <View style={styles.sectionHeading}>
        <Feather name="alert-triangle" size={20} color={theme.danger} />
        <Text style={[styles.validationTitle, { color: theme.danger }]}>
          {attention.title}
        </Text>
      </View>
      <Text style={[styles.statusMessage, { color: theme.text }]}>
        {attention.reason}
      </Text>
      <Text style={[styles.helpText, { color: theme.textSecondary }]}>
        This report and its saved image stay unchanged on this device. Sending it
        again is not offered until the office resolves the cause.
      </Text>
      <Text
        testID="field-report.support-reference"
        selectable
        style={[styles.helpText, { color: theme.text }]}>
        {buildSupportReference({
          code: fieldReport.lastSyncErrorCode,
          reportId: fieldReport.id,
        })}
      </Text>
      <AppButton
        testID="field-report.share-support-reference"
        onPress={onShare}
        leadingIcon="share-2"
        variant="secondary"
        accessibilityLabel="Share the support reference (no photo or personal details)">
        Share Support Reference
      </AppButton>
    </View>
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
      <EvidenceRow
        label="Affected area"
        value={formatMeasurementSummary(
          fieldReport.affectedAreaHectares,
          fieldReport.affectedAreaMeasurement,
          'ha',
        )}
      />
      <EvidenceRow
        label="Estimated affected portion"
        value={formatMeasurementSummary(
          fieldReport.affectedPortionPercent,
          fieldReport.affectedPortionMeasurement,
          '%',
        )}
      />
      <EvidenceRow
        label="Location"
        value={formatLocationSummary(fieldReport)}
      />
      {fieldReport.locationSource === 'unavailable' && fieldReport.locationUnavailableReason ? (
        <EvidenceRow
          label="Location unavailable reason"
          value={LOCATION_UNAVAILABLE_REASON_LABELS[fieldReport.locationUnavailableReason]}
        />
      ) : null}
      <EvidenceRow label="Observation time" value={formatTimestamp(fieldReport.observedAt)} />
      <EvidenceRow label="Local submission time" value={fieldReport.submittedAt ? formatTimestamp(fieldReport.submittedAt) : 'Not submitted'} />
      <EvidenceRow
        label="Report status"
        value={getSyncPresentation(fieldReport.syncStatus, fieldReport.lastSyncErrorCode).label}
      />
      <EvidenceRow
        label="Office reference"
        value={fieldReport.authorityReview?.referenceCode ?? 'Not yet available'}
      />
      {fieldReport.lastSyncedAt ? (
        <EvidenceRow label="Sent to office" value={formatTimestamp(fieldReport.lastSyncedAt)} />
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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Office review</Text>
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
          <EvidenceRow label="Office update" value={formatTimestamp(review.statusUpdatedAt)} />
        </>
      ) : (
        <Text testID="field-report.authority-status-unavailable" style={[styles.statusMessage, { color: theme.textSecondary }]}>
          Office review status is unavailable for this sent report.
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

const ALL_REQUIREMENT_GROUPS: { label: string; requirements: FieldReportSubmissionRequirement[] }[] = [
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
    label: 'Saved scan details',
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

const TOTAL_REQUIREMENTS_COUNT = ALL_REQUIREMENT_GROUPS.reduce(
  (count, group) => count + group.requirements.length,
  0,
);

/**
 * Step 5: Truthful readiness checklist (W-3, D-5).
 * Shows only missing items inline, with direct jump links back to their owning step.
 * Full 20 requirements are preserved inside a disclosure.
 */
function ReadyToSubmitChecklist({
  missing,
  onJumpToStep,
}: {
  missing: Set<FieldReportSubmissionRequirement>;
  onJumpToStep: (step: number) => void;
}) {
  const theme = useTheme();
  const ready = missing.size === 0;
  const completeCount = TOTAL_REQUIREMENTS_COUNT - missing.size;

  // Find all missing requirements in defined order
  const missingList: FieldReportSubmissionRequirement[] = [];
  for (const group of ALL_REQUIREMENT_GROUPS) {
    for (const req of group.requirements) {
      if (missing.has(req)) {
        missingList.push(req);
      }
    }
  }

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
          : `${missing.size} of ${TOTAL_REQUIREMENTS_COUNT} requirements still block finalizing.`}
      </Text>

      {/* W-3: Only missing items shown inline, each jumping back to owning step */}
      {!ready && missingList.length > 0 ? (
        <View style={styles.readinessGroup}>
          <Text style={[styles.readinessGroupTitle, { color: theme.textSecondary }]}>
            Missing requirements (tap to fill):
          </Text>
          {missingList.map((requirement) => {
            const targetStep = REQUIREMENT_OWNING_STEP[requirement];
            return (
              <Pressable
                key={requirement}
                testID={`field-report.ready.${requirement}`}
                onPress={() => onJumpToStep(targetStep)}
                accessibilityRole="button"
                accessibilityLabel={`${SUBMISSION_REQUIREMENT_LABELS[requirement]}. Tap to go to Step ${targetStep}`}
                style={({ pressed }) => [
                  styles.readinessRowPressable,
                  { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <Feather name="circle" size={16} color={theme.warning} />
                <Text style={[styles.statusMessage, { color: theme.text, flex: 1 }]}>
                  {SUBMISSION_REQUIREMENT_LABELS[requirement]}
                </Text>
                <View style={styles.stepBadge}>
                  <Text style={[styles.stepBadgeText, { color: theme.primary }]}>
                    Step {targetStep}
                  </Text>
                  <Feather name="chevron-right" size={14} color={theme.primary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!ready && completeCount > 0 ? (
        <Text
          testID="field-report.ready.complete-count"
          style={[styles.helpText, { color: theme.textSecondary }]}>
          {completeCount} other {completeCount === 1 ? 'requirement is' : 'requirements are'} already complete.
        </Text>
      ) : null}

      {/* W-3: Full 20 requirements disclosure */}
      <DisclosureSection
        testID="field-report.all-requirements-disclosure"
        title={`All requirements (${TOTAL_REQUIREMENTS_COUNT})`}>
        {ALL_REQUIREMENT_GROUPS.map((group) => (
          <View key={group.label} style={styles.readinessGroup}>
            <Text style={[styles.readinessGroupTitle, { color: theme.textSecondary }]}>
              {group.label}
            </Text>
            {group.requirements.map((req) => {
              const isMissing = missing.has(req);
              return (
                <View key={req} style={styles.readinessRow}>
                  <Feather
                    name={isMissing ? 'circle' : 'check-circle'}
                    size={16}
                    color={isMissing ? theme.warning : theme.success}
                  />
                  <Text
                    style={[
                      styles.statusMessage,
                      { color: isMissing ? theme.text : theme.textSecondary },
                    ]}>
                    {SUBMISSION_REQUIREMENT_LABELS[req]}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </DisclosureSection>
    </View>
  );
}

export const SUBMISSION_REQUIREMENT_LABELS: Record<
  FieldReportSubmissionRequirement,
  string
> = {
  original_scan_image: 'Original scan image',
  submission_image: 'Report photo',
  source_image_dimensions: 'Scan image details',
  ai_supported_result: 'Possible Condition',
  confidence: 'Complete scan result',
  class_scores: 'Full scan result',
  symptom_checklist: 'Symptom checklist',
  farmer_or_farm_owner_name: 'Farmer or farm reference',
  submitter_identity: 'Reporter name',
  submitter_role: 'Reporter role',
  province: 'Province',
  municipality: 'Municipality',
  barangay: 'Barangay',
  affected_area_hectares: 'Affected area (hectares)',
  affected_portion_percent: 'Estimated affected portion (%)',
  final_coordinates: 'Report location',
  location_source: 'Location added',
  location_unavailable_reason: 'Reason for missing location',
  gps_accuracy: 'Confirmed location',
  observation_time: 'Observation time',
};

function checkpointSignature(checkpoint: FieldReportFormCheckpoint): string {
  const { savedAt: _savedAt, ...rest } = checkpoint;
  return JSON.stringify(rest);
}

function formatFormDraftStatus(
  status: 'idle' | 'saving' | 'saved' | 'failed',
  savedAt: string | null,
): string {
  switch (status) {
    case 'saving':
      return 'Saving on this device…';
    case 'saved':
      return savedAt
        ? `Unsaved entries saved on this device · ${new Date(savedAt).toLocaleTimeString()}. Drafts are not sent.`
        : 'Unsaved entries saved on this device. Drafts are not sent.';
    case 'failed':
      return 'Not saved on this device. The last good draft is unchanged — keep this screen open or save again.';
    default:
      return 'Entered values are saved on this device as you go. Drafts are not sent.';
  }
}

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
  stepPillsScroll: {
    width: '100%',
  },
  stepPillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    width: '100%',
    paddingVertical: 2,
  },
  stepPill: {
    minHeight: 36,
    minWidth: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  stepPillText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  incompleteDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  wizardStepTitle: {
    ...Typography.subheading,
    fontWeight: '800',
  },
  stepContainer: {
    width: '100%',
    gap: Spacing.lg,
  },
  wizardNav: {
    gap: Spacing.md,
    width: '100%',
  },
  wizardNavRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  wizardNavButton: {
    flex: 1,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  automaticFields: { gap: Spacing.xs },
  automaticLabel: { ...Typography.caption, fontWeight: '700' },
  automaticValue: { ...Typography.body, fontWeight: '700' },
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
  readinessRowPressable: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stepBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
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
  detailsCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  detailsHeader: {
    gap: Spacing.xs,
  },
  validationTitle: { ...Typography.bodySmall, fontWeight: '800' },
});

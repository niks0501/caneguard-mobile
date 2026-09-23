import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { getResultLabel } from '@/components/ui/RecordCard';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { HelpHintGroup } from '@/components/ui/HelpHint';
import { Row } from '@/components/ui/Row';
import { TextField } from '@/components/ui/TextField';
import { CASE_CLOSE_NOTICE, DECISION_SUPPORT_DISCLAIMER } from '@/constants/copy';
import { FollowUpOutcomeControl, OUTCOME_LABELS } from '@/features/assignments/components/FollowUpOutcomeControl';
import { PreviousVisitCard } from '@/features/assignments/components/PreviousVisitCard';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { FieldValidationFollowUpOutcome } from '@/database/schema';
import type { FieldValidationCompletion } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import type { PreviousVisitContext as PreviousVisitContextValue } from '@/features/assignments/domain/previousVisit';
import { FIELD_VALIDATION_TEXT_MAX_LENGTH } from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { useFieldValidationAssignment } from '@/features/assignments/hooks/useFieldValidationAssignment';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';

export default function FieldValidationScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId ?? null;
  const state = useFieldValidationAssignment(assignmentId);
  const [observation, setObservation] = useState('');
  const [finding, setFinding] = useState('');
  const [action, setAction] = useState('');
  const [followUpOutcome, setFollowUpOutcome] = useState<FieldValidationFollowUpOutcome | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const capturePhoto = async () => {
    setFieldError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        const msg = 'Camera access was not granted. You can complete the visit without a fresh photo.';
        setFieldError(msg);
        showToast('Camera access denied', 'error');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        base64: false,
        exif: false,
        quality: 1,
        cameraType: ImagePicker.CameraType.back,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
        showToast('Photo attached', 'success');
      }
    } catch {
      const msg = 'The camera could not be opened. You can complete the visit without a fresh photo.';
      setFieldError(msg);
      showToast('Camera could not be opened', 'error');
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    showToast('Photo removed', 'info');
  };

  const reviewSubmit = () => {
    if (!observation.trim() || !finding.trim() || !action.trim()) {
      const msg = 'Field observation, field finding, and action taken are required.';
      setFieldError(msg);
      showToast(msg, 'error');
      return false;
    }
    if ([observation, finding, action].some((value) => value.trim().length > FIELD_VALIDATION_TEXT_MAX_LENGTH)) {
      const msg = 'Each entry must be no more than 2,000 characters.';
      setFieldError(msg);
      showToast(msg, 'error');
      return false;
    }
    if (!followUpOutcome) {
      const msg = 'Choose the follow-up outcome before completing this visit.';
      setFieldError(msg);
      showToast(msg, 'error');
      return false;
    }
    setFieldError(null);
    return true;
  };

  const confirmSubmit = async () => {
    if (!followUpOutcome) {
      return;
    }
    try {
      const result = await state.complete({
        fieldObservation: observation,
        fieldFinding: finding,
        actionTaken: action,
        followUpOutcome,
        freshPhoto: photo,
      });
      if (result) {
        showToast('Visit recorded', 'success');
      } else {
        showToast(state.errorMessage || 'Could not save visit — please try again', 'error');
      }
    } catch {
      showToast('Could not save visit — please try again', 'error');
    }
  };

  return (
    <SafeAreaView testID="field-validation.screen" style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Field validation" />
        {state.loading && !state.assignment ? (
          <View style={styles.centered}><ActivityIndicator accessibilityLabel="Opening field validation assignment" color={theme.primary} /></View>
        ) : state.errorMessage && !state.assignment ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>{state.errorMessage}</Text>
            <AppButton onPress={() => void state.refresh()} leadingIcon="refresh-cw">Try Again</AppButton>
          </View>
        ) : state.assignment ? (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <VisitContext assignment={state.assignment} />
              {state.completion ? (
                <CompletionStatus completion={state.completion} onRetry={() => void state.retry()} />
              ) : (
                <EvidenceForm
                  observation={observation}
                  finding={finding}
                  action={action}
                  followUpOutcome={followUpOutcome}
                  previousVisitAt={state.previousVisit?.visitedAt ?? null}
                  photo={photo}
                  onObservationChange={setObservation}
                  onFindingChange={setFinding}
                  onActionChange={setAction}
                  onFollowUpOutcomeChange={setFollowUpOutcome}
                  onCapturePhoto={() => void capturePhoto()}
                  onRemovePhoto={removePhoto}
                />
              )}
              {/* History stays reachable but never leads the visit, so the
                  inspector records fresh evidence first. Previous visit and
                  submitted case evidence share one disclosure. */}
              <VisitHistory
                assignment={state.assignment}
                completion={state.completion}
                currentReporterConcern={state.currentReporterConcern}
                photoAccessToken={state.photoAccessToken}
                previousVisit={state.previousVisit}
                previousVisitPhotoUrl={state.previousVisitPhotoUrl}
              />
              {state.completion ? null : (
                <CompletionActions
                  saving={state.saving}
                  fieldError={fieldError ?? state.errorMessage}
                  followUpOutcome={followUpOutcome}
                  hasPhoto={photo !== null}
                  targetVisitDate={state.assignment.targetVisitDate}
                  onReview={reviewSubmit}
                  onConfirm={() => void confirmSubmit()}
                />
              )}
              <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>{DECISION_SUPPORT_DISCLAIMER} Location is added automatically when available and never blocks saving. A fresh field photo is recommended but optional.</Text>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// testID is kept from the shipped assignment screen because the deterministic
// .agent-device flows use it as the field-validation screen-loaded marker.
function VisitContext({ assignment }: { assignment: FieldValidationAssignment }) {
  const theme = useTheme();
  return (
    <View testID="field-validation.assignment-summary" style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.heading}><Feather name="clipboard" size={20} color={theme.primary} /><Text style={[styles.title, { color: theme.text }]}>Visit context</Text></View>
      <Row label="Farm or farmer" value={assignment.case.farmerOrFarmOwnerName ?? ''} />
      <Row label="Location" value={[assignment.case.barangay, assignment.case.municipality, assignment.case.province].filter(Boolean).join(', ')} />
      <Row label="Case" value={assignment.referenceCode} />
      <Row label="Target visit" value={assignment.targetVisitDate ?? 'No target date'} />
      {assignment.submitterIsAssignee ? <Text style={[styles.samePerson, { color: theme.warning }]}>You submitted this case and are its validator.</Text> : null}
    </View>
  );
}

function VisitHistory({
  assignment,
  completion,
  currentReporterConcern,
  photoAccessToken,
  previousVisit,
  previousVisitPhotoUrl,
}: {
  assignment: FieldValidationAssignment;
  completion?: FieldValidationCompletion | null;
  currentReporterConcern?: string | null;
  photoAccessToken?: string | null;
  previousVisit?: PreviousVisitContextValue | null;
  previousVisitPhotoUrl?: string | null;
}) {
  const theme = useTheme();
  return (
    <DisclosureSection
      testID="field-validation.submitted-evidence"
      title="Previous visit and original report"
      summary={previousVisit ? '1 previous visit · original report' : 'No previous visit · original report'}>
      <Text style={[styles.help, { color: theme.textSecondary }]}>Recorded before this visit and submitted by the reporter. It is decision-support only, cannot be changed here, and is kept separate from your field findings.</Text>
      <Row label="Possible Condition" value={getResultLabel(assignment.case.predictedLabel)} />
      <Row label="Submitted by" value={assignment.submitter.name} />
      {completion ? <Row label="Visit time" value={formatTimestamp(completion.visitedAt)} /> : null}
      <PreviousVisitCard
        currentReporterConcern={currentReporterConcern}
        photoAccessToken={photoAccessToken}
        previousVisit={previousVisit}
        previousVisitPhotoUrl={previousVisitPhotoUrl}
      />
    </DisclosureSection>
  );
}

function CompletionActions({
  fieldError,
  followUpOutcome,
  hasPhoto,
  onConfirm,
  onReview,
  saving,
  targetVisitDate,
}: {
  fieldError: string | null;
  followUpOutcome: FieldValidationFollowUpOutcome | null;
  hasPhoto: boolean;
  onConfirm: () => void;
  onReview: () => boolean;
  saving: boolean;
  targetVisitDate: string | null;
}) {
  const theme = useTheme();
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <View testID="field-validation.actions" style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Text style={[styles.help, { color: theme.textSecondary }]}>{CASE_CLOSE_NOTICE}</Text>
      {fieldError ? <Text testID="field-validation.error" accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>{fieldError}</Text> : null}
      <AppButton
        testID="field-validation.complete"
        onPress={() => {
          if (onReview()) {
            setShowConfirm(true);
          }
        }}
        disabled={saving}
        leadingIcon="check-circle">
        {saving ? 'Saving validation...' : 'Complete field validation'}
      </AppButton>
      <ConfirmDialog
        visible={showConfirm}
        title="Complete this visit?"
        message={completeConfirmMessage({ followUpOutcome, hasPhoto, targetVisitDate })}
        confirmLabel="Complete visit"
        confirmTestID="field-validation.confirm-complete"
        cancelLabel="Cancel"
        overlay
        testID="field-validation.confirm-complete-dialog"
        onConfirm={() => {
          setShowConfirm(false);
          onConfirm();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </View>
  );
}

function completeConfirmMessage({
  followUpOutcome,
  hasPhoto,
  targetVisitDate,
}: {
  followUpOutcome: FieldValidationFollowUpOutcome | null;
  hasPhoto: boolean;
  targetVisitDate: string | null;
}): string {
  const outcome = followUpOutcome ? OUTCOME_LABELS[followUpOutcome] : 'No outcome chosen';
  const visit = targetVisitDate ?? 'No target date';
  return `Complete the visit for ${visit}? Follow-up outcome: ${outcome}. Fresh photo: ${hasPhoto ? 'attached' : 'not attached'}. The completed visit can no longer be edited, and the case stays open.`;
}

function EvidenceForm({
  observation, finding, action, followUpOutcome, previousVisitAt, photo, onObservationChange, onFindingChange, onActionChange, onCapturePhoto, onRemovePhoto, onFollowUpOutcomeChange,
}: {
  observation: string; finding: string; action: string; followUpOutcome: FieldValidationFollowUpOutcome | null; previousVisitAt: string | null; photo: ImagePicker.ImagePickerAsset | null;
  onObservationChange: (value: string) => void; onFindingChange: (value: string) => void; onActionChange: (value: string) => void; onCapturePhoto: () => void; onRemovePhoto: () => void; onFollowUpOutcomeChange: (value: FieldValidationFollowUpOutcome) => void;
}) {
  const theme = useTheme();
  const hasObservation = observation.trim().length > 0;
  const hasFinding = finding.trim().length > 0;
  return (
    <View testID="field-validation.form" style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <HelpHintGroup>
      <FollowUpOutcomeControl previousVisitAt={previousVisitAt} value={followUpOutcome} onChange={onFollowUpOutcomeChange} />
      <View style={styles.heading}><Feather name="edit-3" size={20} color={theme.primary} /><Text style={[styles.title, { color: theme.text }]}>What did you record on this visit?</Text></View>
      <TextField testID="field-validation.observation-input" label="Fresh field observation" hint="What you physically saw on this visit." helpHintText="For example: “Orange-brown pustules on the lower leaves of about a fifth of the block.”" helpHintTestID="field-validation.observation-help" value={observation} onChangeText={onObservationChange} placeholder="What did you see during this visit?" maxLength={FIELD_VALIDATION_TEXT_MAX_LENGTH} multiline />
      <TextField testID="field-validation.finding-input" label="Field finding" hint="Your own assessment of what those observations mean here." helpHintText="For example: “Lesions consistent with Rust; no smut whip seen in the sampled rows.”" helpHintTestID="field-validation.finding-help" value={finding} onChangeText={onFindingChange} placeholder="Describe the field finding needed by the office." maxLength={FIELD_VALIDATION_TEXT_MAX_LENGTH} multiline />
      <Pressable
        testID="field-validation.copy-observation"
        accessibilityRole="button"
        accessibilityLabel={hasFinding ? 'Replace the field finding with the fresh field observation' : 'Copy the fresh field observation into the field finding'}
        accessibilityHint={hasObservation ? undefined : 'Enter a fresh field observation first.'}
        accessibilityState={{ disabled: !hasObservation }}
        disabled={!hasObservation}
        onPress={() => onFindingChange(observation)}
        style={({ pressed }) => [styles.copyAction, pressed && hasObservation ? styles.pressed : null]}>
        <Feather name="copy" size={16} color={hasObservation ? theme.primary : theme.textSecondary} />
        <Text style={[styles.copyActionText, { color: hasObservation ? theme.primary : theme.textSecondary }]}>
          {hasFinding ? 'Replace finding with observation' : 'Copy observation into finding'}
        </Text>
      </Pressable>
      <TextField testID="field-validation.action-input" label="Action taken" hint="What you actually did or told the farmer." helpHintText="For example: “Advised removal of affected leaves and a follow-up visit in 7 days.”" helpHintTestID="field-validation.action-help" value={action} onChangeText={onActionChange} placeholder="What action or guidance was provided?" maxLength={FIELD_VALIDATION_TEXT_MAX_LENGTH} multiline />
      {photo ? (
        <View style={styles.photoContainer}>
          <ExpoImage source={{ uri: photo.uri }} accessibilityLabel="Fresh field validation photo" contentFit="cover" style={styles.photo} />
          <AppButton testID="field-validation.remove-photo" onPress={onRemovePhoto} leadingIcon="trash-2" variant="secondary">Remove photo</AppButton>
        </View>
      ) : null}
      <AppButton testID="field-validation.capture-photo" onPress={onCapturePhoto} leadingIcon="camera" variant="secondary">{photo ? 'Replace fresh photo' : 'Add fresh field photo (recommended)'}</AppButton>
      </HelpHintGroup>
    </View>
  );
}

function CompletionStatus({ completion, onRetry }: { completion: FieldValidationCompletion; onRetry: () => void }) {
  const theme = useTheme();
  const { showToast } = useToast();
  const pending = completion.syncStatus !== 'synced';

  const handleRetry = async () => {
    try {
      await onRetry();
      showToast('Trying to send again', 'info');
    } catch {
      showToast('Could not send — will try again', 'error');
    }
  };

  return (
    <View testID="field-validation.completion-status" style={[styles.card, { backgroundColor: pending ? theme.warningBg : theme.successBg, borderColor: pending ? theme.warning : theme.success }]}>
      <Feather name={pending ? 'clock' : 'check-circle'} size={24} color={pending ? theme.warning : theme.success} />
      <Text style={[styles.title, { color: theme.text }]}>{pending ? 'Saved on this device' : 'Sent to office'}</Text>
      <Text style={[styles.help, { color: theme.textSecondary }]}>{pending ? 'The completed visit is saved on this device and will retry automatically when connectivity returns. Visit time is recorded automatically.' : 'The office can now review your field findings. Visit time is recorded automatically.'}</Text>
      <Row label="Visit time" value={formatTimestamp(completion.visitedAt)} />
      <Row label="Location" value={completion.gpsOutcome === 'resolved' ? 'Location added' : 'Location could not be confirmed'} />
      {pending ? <AppButton testID="field-validation.retry" onPress={() => void handleRetry()} disabled={completion.syncStatus === 'syncing'} leadingIcon="refresh-cw" variant="secondary">Try Again</AppButton> : null}
    </View>
  );
}


function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  scrollContent: { alignItems: 'center' },
  content: { width: '100%', maxWidth: Layout.mobileMaxWidth, paddingHorizontal: ComponentTokens.screen.horizontalPadding, paddingVertical: Spacing.xl, gap: Spacing.lg },
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.lg },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.subheading, fontWeight: '800' },
  help: { ...Typography.bodySmall },
  disclaimer: { ...Typography.caption },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  rowLabel: { ...Typography.caption, flexShrink: 0 },
  rowValue: { ...Typography.bodySmall, fontWeight: '700', textAlign: 'right', flex: 1 },
  samePerson: { ...Typography.caption, fontWeight: '800' },
  photoContainer: { gap: Spacing.sm },
  photo: { width: '100%', height: 220, borderRadius: Radius.md },
  copyAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
  },
  copyActionText: { ...Typography.caption, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  error: { ...Typography.bodySmall },
});

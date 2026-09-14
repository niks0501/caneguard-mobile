import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { getResultLabel } from '@/components/ui/RecordCard';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import type { FieldValidationCompletion } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { FIELD_VALIDATION_TEXT_MAX_LENGTH } from '@/features/assignments/domain/fieldValidationCompletionValidation';
import { useFieldValidationAssignment } from '@/features/assignments/hooks/useFieldValidationAssignment';
import { useTheme } from '@/hooks/use-theme';

export default function FieldValidationScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId ?? null;
  const state = useFieldValidationAssignment(assignmentId);
  const [observation, setObservation] = useState('');
  const [finding, setFinding] = useState('');
  const [action, setAction] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const capturePhoto = async () => {
    setFieldError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setFieldError('Camera access was not granted. You can complete the visit without a fresh photo.');
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
      if (!result.canceled && result.assets[0]) setPhoto(result.assets[0]);
    } catch {
      setFieldError('The camera could not be opened. You can complete the visit without a fresh photo.');
    }
  };

  const submit = async () => {
    if (!observation.trim() || !finding.trim() || !action.trim()) {
      setFieldError('Field observation, field finding, and action taken are required.');
      return;
    }
    if ([observation, finding, action].some((value) => value.trim().length > FIELD_VALIDATION_TEXT_MAX_LENGTH)) {
      setFieldError('Each validation evidence field must be no more than 2,000 characters.');
      return;
    }
    setFieldError(null);
    await state.complete({
      fieldObservation: observation,
      fieldFinding: finding,
      actionTaken: action,
      freshPhoto: photo,
    });
  };

  return (
    <SafeAreaView testID="field-validation.screen" style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Field Validation" />
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
              <AssignmentSummary assignment={state.assignment} completion={state.completion} />
              {state.completion ? (
                <CompletionStatus completion={state.completion} onRetry={() => void state.retry()} />
              ) : (
                <EvidenceForm
                  observation={observation}
                  finding={finding}
                  action={action}
                  photo={photo}
                  saving={state.saving}
                  fieldError={fieldError ?? state.errorMessage}
                  onObservationChange={setObservation}
                  onFindingChange={setFinding}
                  onActionChange={setAction}
                  onCapturePhoto={() => void capturePhoto()}
                  onSubmit={() => void submit()}
                />
              )}
              <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>Visit time is recorded automatically. GPS is attempted once and poor GPS does not block a valid completion. A fresh field photo is recommended but optional.</Text>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function AssignmentSummary({ assignment, completion }: { assignment: FieldValidationAssignment; completion: FieldValidationCompletion | null }) {
  const theme = useTheme();
  return (
    <View testID="field-validation.assignment-summary" style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.heading}><Feather name="clipboard" size={20} color={theme.primary} /><Text style={[styles.title, { color: theme.text }]}>Validation assignment</Text></View>
      <Row label="Case" value={assignment.referenceCode} />
      <Row label="Location" value={[assignment.case.barangay, assignment.case.municipality, assignment.case.province].filter(Boolean).join(', ')} />
      <Row label="Possible Condition" value={`${getResultLabel(assignment.case.predictedLabel)} · ${Math.round(assignment.case.confidence * 100)}% confidence`} />
      <Row label="Submitted by" value={assignment.submitter.name} />
      <Row label="Target visit" value={assignment.targetVisitDate ?? 'No target date'} />
      {assignment.submitterIsAssignee ? <Text style={[styles.samePerson, { color: theme.warning }]}>You submitted this case and are its validator.</Text> : null}
      {completion ? <Row label="Visit time" value={formatTimestamp(completion.visitedAt)} /> : null}
    </View>
  );
}

function EvidenceForm({
  observation, finding, action, photo, saving, fieldError, onObservationChange, onFindingChange, onActionChange, onCapturePhoto, onSubmit,
}: {
  observation: string; finding: string; action: string; photo: ImagePicker.ImagePickerAsset | null; saving: boolean; fieldError: string | null;
  onObservationChange: (value: string) => void; onFindingChange: (value: string) => void; onActionChange: (value: string) => void; onCapturePhoto: () => void; onSubmit: () => void;
}) {
  const theme = useTheme();
  return (
    <View testID="field-validation.form" style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.heading}><Feather name="edit-3" size={20} color={theme.primary} /><Text style={[styles.title, { color: theme.text }]}>Complete the visit</Text></View>
      <Text style={[styles.help, { color: theme.textSecondary }]}>Record what you observed, your field finding, and the action taken. These are separate field evidence for office review.</Text>
      <TextField testID="field-validation.observation-input" label="Fresh field observation" value={observation} onChangeText={onObservationChange} placeholder="What did you see during this visit?" maxLength={FIELD_VALIDATION_TEXT_MAX_LENGTH} multiline />
      <TextField testID="field-validation.finding-input" label="Field finding or evidence" value={finding} onChangeText={onFindingChange} placeholder="Describe the field finding needed by the office." maxLength={FIELD_VALIDATION_TEXT_MAX_LENGTH} multiline />
      <TextField testID="field-validation.action-input" label="Action taken" value={action} onChangeText={onActionChange} placeholder="What action or guidance was provided?" maxLength={FIELD_VALIDATION_TEXT_MAX_LENGTH} multiline />
      {photo ? <ExpoImage source={{ uri: photo.uri }} accessibilityLabel="Fresh field validation photo" contentFit="cover" style={styles.photo} /> : null}
      <AppButton testID="field-validation.capture-photo" onPress={onCapturePhoto} leadingIcon="camera" variant="secondary">{photo ? 'Replace fresh photo' : 'Add fresh field photo (recommended)'}</AppButton>
      {fieldError ? <Text testID="field-validation.error" accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>{fieldError}</Text> : null}
      <AppButton testID="field-validation.complete" onPress={onSubmit} disabled={saving} leadingIcon="check-circle">{saving ? 'Saving validation...' : 'Complete field validation'}</AppButton>
    </View>
  );
}

function CompletionStatus({ completion, onRetry }: { completion: FieldValidationCompletion; onRetry: () => void }) {
  const theme = useTheme();
  const pending = completion.syncStatus !== 'synced';
  return (
    <View testID="field-validation.completion-status" style={[styles.card, { backgroundColor: pending ? theme.warningBg : theme.successBg, borderColor: pending ? theme.warning : theme.success }]}>
      <Feather name={pending ? 'clock' : 'check-circle'} size={24} color={pending ? theme.warning : theme.success} />
      <Text style={[styles.title, { color: theme.text }]}>{pending ? 'Saved on this device' : 'Validation synchronized'}</Text>
      <Text style={[styles.help, { color: theme.textSecondary }]}>{pending ? 'The completed evidence is preserved locally and will retry automatically when connectivity returns.' : 'The office can now review this field evidence. The case remains open and is not automatically verified or closed.'}</Text>
      <Row label="Visit time" value={formatTimestamp(completion.visitedAt)} />
      <Row label="GPS" value={completion.gpsOutcome.replace('_', ' ')} />
      {pending ? <AppButton testID="field-validation.retry" onPress={onRetry} disabled={completion.syncStatus === 'syncing'} leadingIcon="refresh-cw" variant="secondary">Retry synchronization</AppButton> : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return <View style={styles.row}><Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text><Text style={[styles.rowValue, { color: theme.text }]}>{value || 'Not available'}</Text></View>;
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
  photo: { width: '100%', height: 220, borderRadius: Radius.md },
  error: { ...Typography.bodySmall },
});

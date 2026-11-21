import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GUARD_COPY, SCAN_CHECK_COPY, SCAN_STATE_COPY } from '@/constants/copy';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useScanAnalysis } from '@/features/detection/analysis/useScanAnalysis';
import { isGuardedResult } from '@/features/detection/constants/guardContract';
import {
  GUIDED_VALIDATION_QUESTIONS,
  type ChecklistObservationId,
} from '@/features/detection/checklist/checklistConsistency';
import { ObservationPictureGrid } from '@/features/detection/components/ObservationPictureGrid';
import { useScanDraft } from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';
import {
  getPermissionDeniedMessage,
  pickScanImage,
} from '@/features/detection/imagePicker/pickScanImage';
import { getInferenceErrorMessage } from '@/features/detection/model/inferenceErrors';
import { getQualityWarningMessage } from '@/features/detection/validation/assessImageQuality';
import { returnToTab } from '@/features/navigation/returnToTab';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

export default function SymptomChecklistScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  // Farmers keep the reviewed wording already approved for their language
  // setting. Words new to this screen stay English until a Tagalog label is
  // reviewed; inspector screens are English throughout.
  const farmer = useFarmerCopy().imagePreview;
  const { showToast } = useToast();
  const { state, dispatch } = useScanSession();
  const draft = useScanDraft();
  // The question never depends on the model result: the answer is the
  // observer's own and is stored separately from the analysis.
  const question = GUIDED_VALIDATION_QUESTIONS[0];
  const [selected, setSelected] = useState<ChecklistObservationId | null>(
    () => state.selectedSymptoms[0] ?? null,
  );
  const [replacing, setReplacing] = useState(false);
  const {
    modelState,
    guardState,
    guardError,
    guardRejected,
    checkState,
    isChecking,
    isReady,
    photoFailedCheck,
  } = useScanAnalysis(replacing);
  const [replacementNotice, setReplacementNotice] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const isMounted = useRef(true);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const rejectedTitleRef = useRef<ComponentRef<typeof Text>>(null);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const hasPhoto = Boolean(state.sourceUri);
  const canContinue = isReady && selected !== null;

  const continueToResult = () => {
    if (!canContinue) {
      return;
    }
    dispatch({ type: 'SET_SYMPTOMS', payload: [selected] });
    router.push('/analysis-result');
  };

  const handleKeepDraft = async () => {
    setShowCancelConfirm(false);
    if (selected !== null) {
      dispatch({ type: 'SET_SYMPTOMS', payload: [selected] });
    }
    const saved = await draft.flushSavedDraft();
    if (!saved) {
      showToast('Draft not saved on this device — try again', 'error');
      return;
    }
    showToast('Draft kept', 'info');
    returnToTab('/home');
  };

  const handleDiscardDraft = async () => {
    setShowCancelConfirm(false);
    if (draft.ownerIdentity) {
      const discarded = await draft.discardSavedDraft();
      if (!discarded) {
        showToast('Could not discard the saved scan — try again', 'error');
        return;
      }
    } else {
      dispatch({ type: 'RESET_SCAN' });
    }
    showToast('Draft discarded', 'info');
    returnToTab('/home');
  };

  const replaceImage = async (sourceType: 'camera' | 'gallery') => {
    if (replacing || isChecking) {
      return;
    }
    const startingOwner = draft.ownerIdentity;
    setReplacing(true);
    setReplacementNotice(null);
    try {
      const outcome = await pickScanImage(sourceType, {
        followUpOf: state.followUpOf ?? null,
      });
      if (!isMounted.current || !draft.isOwnerCurrent(startingOwner)) {
        return;
      }
      if (outcome.kind === 'selected') {
        // A new photo clears the old result and answer; the check restarts itself.
        setSelected(null);
        dispatch({ type: 'SELECT_IMAGE', payload: outcome.image });
      } else if (outcome.kind === 'permission-denied') {
        setReplacementNotice(getPermissionDeniedMessage(outcome.canAskAgain));
      } else if (outcome.kind === 'error') {
        setReplacementNotice(outcome.message);
      }
    } finally {
      if (isMounted.current) {
        setReplacing(false);
      }
    }
  };

  // A rejected photo can never pass, so there is no draft to keep: Go to Home
  // and Cancel both discard it.
  const discardRejectedScan = async () => {
    setShowCancelConfirm(false);
    if (draft.ownerIdentity) {
      const discarded = await draft.discardSavedDraft();
      if (!discarded) {
        showToast('Could not discard the saved scan — try again', 'error');
        return;
      }
    } else {
      dispatch({ type: 'RESET_SCAN' });
    }
    showToast(GUARD_COPY.discarded, 'info');
    returnToTab('/home');
  };

  // A rejection replaces the question: bring the card into view and announce it.
  useEffect(() => {
    if (!guardRejected) {
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    const node = findNodeHandle(rejectedTitleRef.current);
    if (node) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, [guardRejected]);

  const cancelDialog = guardRejected ? (
    <ConfirmDialog
      visible={showCancelConfirm}
      title={GUARD_COPY.discardTitle}
      message={GUARD_COPY.discardMessage}
      cancelLabel={GUARD_COPY.keepScanning}
      confirmLabel={GUARD_COPY.discardConfirm}
      destructive
      overlay
      onRequestClose={() => setShowCancelConfirm(false)}
      onCancel={() => setShowCancelConfirm(false)}
      onConfirm={() => void discardRejectedScan()}
      testID="symptom-checklist.cancel-dialog"
    />
  ) : (
    <ConfirmDialog
      visible={showCancelConfirm}
      title={isFarmer ? farmer.cancelTitle : 'Cancel scan?'}
      message={
        isFarmer
          ? farmer.cancelMessage
          : 'Do you want to keep your in-progress scan draft or discard it before returning home?'
      }
      cancelLabel={isFarmer ? farmer.keepDraft : 'Keep draft'}
      confirmLabel={isFarmer ? farmer.discardDraft : 'Discard draft'}
      destructive
      overlay
      onRequestClose={() => setShowCancelConfirm(false)}
      onCancel={() => void handleKeepDraft()}
      onConfirm={() => void handleDiscardDraft()}
      testID="symptom-checklist.cancel-dialog"
    />
  );

  if (!hasPhoto) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}>
        <View style={styles.root}>
          <BrandedScreenHeader
            title={SCAN_CHECK_COPY.title}
            showClose
            onClosePress={() => setShowCancelConfirm(true)}
            closeTestID="symptom-checklist.header-close"
          />
          <View style={styles.recoveryContent}>
            <View
              style={[
                styles.recoveryCard,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}>
              <View style={[styles.introIcon, { backgroundColor: theme.warningBg }]}>
                <Feather name="alert-circle" size={22} color={theme.warning} />
              </View>
              <Text style={[styles.recoveryTitle, { color: theme.primaryDark }]}>
                {isFarmer ? farmer.noImageTitle : SCAN_STATE_COPY['no-photo'].title}
              </Text>
              <Text style={[styles.recoveryText, { color: theme.textSecondary }]}>
                {SCAN_STATE_COPY['no-photo'].detail}
              </Text>
              <AppButton
                onPress={() => {
                  dispatch({ type: 'RESET_SCAN' });
                  returnToTab('/scan');
                }}
                leadingIcon="camera"
                accessibilityLabel="Return to scan">
                Return to Scan
              </AppButton>
            </View>
          </View>
          {cancelDialog}
        </View>
      </SafeAreaView>
    );
  }

  const modelError =
    modelState.state === 'error' ? getInferenceErrorMessage(modelState.error) : null;
  const completedGuardedResult =
    state.status === 'completed' && state.result !== null && isGuardedResult(state.result);
  const questionLocked = !state.guardPassed && !completedGuardedResult;
  const photoRejected = checkState === 'photo-rejected';
  const photoUnusable = checkState === 'photo-unusable';
  const checkFailed = checkState === 'check-failed';
  const photoFileFault = photoUnusable || checkFailed;
  const photoCheckFailed = photoRejected || photoFileFault;
  const activeGuardError = completedGuardedResult || photoCheckFailed ? null : guardError;
  const activeModelError = completedGuardedResult || photoCheckFailed ? null : modelError;
  const stateCopy = SCAN_STATE_COPY[checkState];
  const statusText =
    photoRejected
      ? stateCopy.detail
      : (activeGuardError ??
        activeModelError ??
        (state.status === 'error' ? (state.errorMessage ?? stateCopy.detail) : stateCopy.detail));

  return (
    <SafeAreaView
      testID="scan.symptom-checklist-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View testID="scan.session-status" accessibilityValue={{ text: state.status }} />
        <View testID="scan.check-state" accessibilityValue={{ text: checkState }} />
        <BrandedScreenHeader
          title={SCAN_CHECK_COPY.title}
          showClose
          onClosePress={() => setShowCancelConfirm(true)}
          closeTestID="symptom-checklist.header-close"
        />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.photoRow}>
              <ExpoImage
                source={{ uri: state.sourceUri ?? undefined }}
                contentFit="cover"
                accessibilityLabel="Your sugarcane photo"
                style={[styles.thumb, { backgroundColor: theme.surfaceMuted }]}
              />
              <View style={styles.statusCopy} accessibilityLiveRegion="polite">
                <View style={styles.statusHeading}>
                  {isChecking ||
                  (!isReady &&
                    !photoRejected &&
                    !guardRejected &&
                    state.status !== 'error' &&
                    !activeModelError &&
                    !activeGuardError) ? (
                    <ActivityIndicator
                      accessibilityLabel={SCAN_CHECK_COPY.checking}
                      color={theme.primary}
                    />
                  ) : null}
                  <Text
                    testID="scan.check-status"
                    style={[styles.statusTitle, { color: theme.primaryDark }]}>
                    {stateCopy.title}
                  </Text>
                </View>
                {guardRejected ? null : (
                  <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                    {statusText}
                  </Text>
                )}
              </View>
            </View>

            {guardRejected ? (
              <View
                testID="scan.guard-rejected"
                style={[
                  styles.failedCard,
                  { backgroundColor: theme.warningBg, borderColor: theme.warning },
                ]}>
                <Text
                  ref={rejectedTitleRef}
                  testID="scan.guard-rejected-title"
                  accessibilityRole="header"
                  style={[styles.statusTitle, { color: theme.warning }]}>
                  {GUARD_COPY.rejectedTitle}
                </Text>
                <Text style={[styles.helperText, { color: theme.text }]}>
                  {GUARD_COPY.rejectedBody}
                </Text>
                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                  {GUARD_COPY.rejectedTip}
                </Text>
                <AppButton
                  testID="scan.retake-camera"
                  disabled={replacing || isChecking}
                  onPress={() => void replaceImage('camera')}
                  leadingIcon="camera"
                  accessibilityLabel={
                    isFarmer ? farmer.replaceCameraAccessibility : 'Take a new photo with the camera'
                  }>
                  {isFarmer ? farmer.replaceCamera : GUARD_COPY.retakeCamera}
                </AppButton>
                <AppButton
                  testID="scan.retake-gallery"
                  variant="secondary"
                  disabled={replacing || isChecking}
                  onPress={() => void replaceImage('gallery')}
                  leadingIcon="image"
                  accessibilityLabel={
                    isFarmer
                      ? farmer.replaceGalleryAccessibility
                      : 'Choose another photo from the gallery'
                  }>
                  {isFarmer ? farmer.replaceGallery : SCAN_CHECK_COPY.retakeGallery}
                </AppButton>
                <AppButton
                  testID="scan.go-home"
                  variant="text"
                  disabled={replacing}
                  onPress={() => void discardRejectedScan()}
                  leadingIcon="home"
                  accessibilityLabel="Discard this scan and go to Home">
                  {GUARD_COPY.goHome}
                </AppButton>
              </View>
            ) : null}

            {photoFailedCheck && !guardRejected ? (
              <View
                testID="scan.photo-failed-check"
                style={[
                  styles.failedCard,
                  { backgroundColor: theme.warningBg, borderColor: theme.warning },
                ]}>
                {photoFileFault ? null : (
                  <>
                    <Text style={[styles.statusTitle, { color: theme.warning }]}>
                      {SCAN_CHECK_COPY.failedTitle}
                    </Text>
                    {(state.qualityAssessment?.warnings ?? []).map((warning) => (
                      <Text key={warning} style={[styles.helperText, { color: theme.text }]}>
                        {getQualityWarningMessage(warning)}
                      </Text>
                    ))}
                    <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                      {SCAN_CHECK_COPY.failedHint}
                    </Text>
                  </>
                )}
                <AppButton
                  testID="scan.retake-camera"
                  variant="secondary"
                  disabled={replacing || isChecking}
                  onPress={() => void replaceImage('camera')}
                  leadingIcon="camera"
                  accessibilityLabel={
                    photoFileFault
                      ? GUARD_COPY.unusableRetakeCamera
                      : isFarmer
                        ? farmer.replaceCameraAccessibility
                        : 'Take another photo with the camera'
                  }>
                  {photoFileFault
                    ? GUARD_COPY.unusableRetakeCamera
                    : isFarmer
                      ? farmer.replaceCamera
                      : SCAN_CHECK_COPY.retakeCamera}
                </AppButton>
                <AppButton
                  testID="scan.retake-gallery"
                  variant="secondary"
                  disabled={replacing || isChecking}
                  onPress={() => void replaceImage('gallery')}
                  leadingIcon="image"
                  accessibilityLabel={
                    photoFileFault
                      ? GUARD_COPY.unusableRetakeGallery
                      : isFarmer
                        ? farmer.replaceGalleryAccessibility
                        : 'Choose another photo from the gallery'
                  }>
                  {photoFileFault
                    ? GUARD_COPY.unusableRetakeGallery
                    : isFarmer
                      ? farmer.replaceGallery
                      : SCAN_CHECK_COPY.retakeGallery}
                </AppButton>
              </View>
            ) : null}
            {replacementNotice ? (
              <Text
                testID="scan.replacement-notice"
                accessibilityLiveRegion="polite"
                style={[styles.helperText, { color: theme.textSecondary }]}>
                {replacementNotice}
              </Text>
            ) : null}

            {state.status === 'error' || activeModelError || activeGuardError ? (
              <View style={styles.recoveryActions}>
                {activeModelError && modelState.state === 'error' && modelState.errorKind === 'load' ? (
                  <AppButton
                    testID="scan.retry-model"
                    variant="secondary"
                    onPress={modelState.retry}
                    leadingIcon="refresh-cw"
                    accessibilityLabel={isFarmer ? farmer.retrySetupAccessibility : 'Retry analysis setup'}>
                    {isFarmer ? farmer.retrySetup : 'Retry analysis setup'}
                  </AppButton>
                ) : null}
                {activeGuardError && guardState.state === 'error' && guardState.errorKind === 'load' ? (
                  <AppButton
                    testID="scan.retry-guard"
                    variant="secondary"
                    onPress={guardState.retry}
                    leadingIcon="refresh-cw"
                    accessibilityLabel="Retry the photo check setup">
                    {SCAN_CHECK_COPY.tryAgain}
                  </AppButton>
                ) : null}
                {state.status === 'error' && !guardRejected && !photoFileFault ? (
                  <AppButton
                    testID="scan.try-again"
                    variant="secondary"
                    onPress={() => dispatch({ type: 'CLEAR_ERROR' })}
                    leadingIcon="refresh-cw"
                    accessibilityLabel="Check the photo again">
                    {SCAN_CHECK_COPY.tryAgain}
                  </AppButton>
                ) : null}
              </View>
            ) : null}

            {guardRejected ? null : (
              <View style={styles.section}>
                <View style={styles.questionHeading}>
                  <Text
                    testID="scan.guided-question"
                    accessibilityRole="header"
                    style={[styles.questionText, { color: theme.primaryDark }]}>
                    {SCAN_CHECK_COPY.question}
                  </Text>
                  <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                    {SCAN_CHECK_COPY.questionHint}
                  </Text>
                  {questionLocked ? (
                    <Text
                      testID="scan.question-locked"
                      style={[styles.helperText, { color: theme.textSecondary }]}>
                      {SCAN_CHECK_COPY.questionLocked}
                    </Text>
                  ) : null}
                </View>
                <ObservationPictureGrid
                  options={question.options}
                  selected={selected}
                  disabled={questionLocked}
                  onSelect={(id) => setSelected((current) => (current === id ? null : id))}
                />
              </View>
            )}

            {guardRejected ? null : (
              <AppButton
                testID="scan.continue-to-result"
                onPress={continueToResult}
                disabled={!canContinue}
                busy={isChecking}
                trailingIcon="arrow-right"
                accessibilityLabel="Continue to analysis result">
                {!isReady
                  ? SCAN_CHECK_COPY.continueWaiting
                  : selected === null
                    ? SCAN_CHECK_COPY.continueNeedsChoice
                    : SCAN_CHECK_COPY.continue}
              </AppButton>
            )}
            <AppButton
              testID="symptom-checklist.cancel"
              variant="text"
              onPress={() => setShowCancelConfirm(true)}
              leadingIcon="x"
              accessibilityLabel="Cancel scan and return home">
              {isFarmer ? farmer.cancel : SCAN_CHECK_COPY.cancel}
            </AppButton>
          </View>
        </ScrollView>
        {cancelDialog}
      </View>
    </SafeAreaView>
  );
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
    gap: Spacing.xl,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: { width: 96, height: 96, borderRadius: Radius.md },
  statusCopy: { flex: 1, gap: Spacing.xs },
  statusHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusTitle: { ...Typography.subheading },
  failedCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  recoveryActions: { gap: Spacing.sm },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: Spacing.md },
  questionHeading: { gap: Spacing.xs },
  questionText: { ...Typography.heading, fontWeight: '800' },
  helperText: { ...Typography.caption },
  recoveryContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  recoveryCard: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  recoveryTitle: { ...Typography.heading, textAlign: 'center' },
  recoveryText: { ...Typography.bodySmall, textAlign: 'center' },
});

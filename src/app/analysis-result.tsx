import { canAuthorInspectorWork } from '@/features/auth/capabilities';
import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionDock, dockSecondaryButtonStyle } from '@/components/ui/ActionDock';
import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { Pill } from '@/components/ui/Pill';
import { TextField } from '@/components/ui/TextField';
import { DECISION_SUPPORT_DISCLAIMER } from '@/constants/copy';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
  type ThemeColor,
} from '@/constants/theme';
import {
  getChecklistConsistency,
  type ChecklistConsistency,
} from '@/features/detection/checklist/checklistConsistency';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { isBelowConfidenceCautionThreshold } from '@/features/detection/constants/confidenceCaution';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useScanDraft } from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';
import {
  getSessionStateErrorMessage,
  SessionStateError,
} from '@/features/detection/context/sessionErrors';
import { getQualityWarningMessage } from '@/features/detection/validation/assessImageQuality';
import { returnToTab } from '@/features/navigation/returnToTab';
import { MAX_PERSONAL_PLACE_LENGTH } from '@/features/records/domain/recordTypes';
import { FollowUpComparison } from '@/features/records/components/FollowUpComparison';
import { farmerResultName, possibleConditionLine } from '@/features/records/components/possibleConditionLine';
import { WhatNowCard } from '@/features/records/components/WhatNowCard';
import { SavedScanCard } from '@/features/records/components/ScanCard';
import { useSaveCompletedScan } from '@/features/records/hooks/useSaveCompletedScan';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

const CONSISTENCY_PRESENTATION: Record<
  ChecklistConsistency,
  {
    title: string;
    message: string;
    icon: 'check-circle' | 'alert-triangle' | 'help-circle' | 'info';
    foreground: ThemeColor;
    background: ThemeColor;
  }
> = {
  consistent: {
    title: 'Checklist consistent',
    message: 'The selected observations are consistent with the Possible Condition.',
    icon: 'check-circle',
    foreground: 'success',
    background: 'successBg',
  },
  inconsistent: {
    title: 'Checklist inconsistent',
    message:
      "The reporter's observation does not match the Possible Condition. Both are kept separately, and this scan can still be reported to the office.",
    icon: 'alert-triangle',
    foreground: 'danger',
    background: 'dangerBg',
  },
  'not-applicable': {
    title: 'Checklist cannot be compared',
    message:
      'The selected observations point to more than one supported class, so they cannot be compared with one Possible Condition.',
    icon: 'help-circle',
    foreground: 'warning',
    background: 'warningBg',
  },
  'not-enough-information': {
    title: 'Not enough checklist information',
    message:
      'No clear symptom observation was provided, so checklist consistency cannot be determined.',
    icon: 'info',
    foreground: 'info',
    background: 'infoBg',
  },
};

export default function AnalysisResultScreen() {
  const theme = useTheme();
  const { showToast } = useToast();
  const { state, dispatch } = useScanSession();
  const { user } = useAuth();
  const canReportToOffice = canAuthorInspectorWork(user);
  const farmerCopy = useFarmerCopy();
  const scanCardCopy = farmerCopy.scanCard;
  const isFarmer = user?.role === 'farmer';
  const rc = farmerCopy.result;
  const isFollowUp = isFarmer && Boolean(state.followUpOf);
  const saveRecord = useSaveCompletedScan(state);
  const draft = useScanDraft();
  const [openingReport, setOpeningReport] = useState(false);
  const [keepingDraft, setKeepingDraft] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const savedRecord = useRef<string | null>(null);
  const savedSessionUri = useRef<string | null>(null);

  // The saved result stays visible while the inspector is on this screen; the
  // session is finalized once this entry leaves the stack. A Check Again or a
  // newer scan started meanwhile owns the live session and keeps its state.
  useEffect(() => {
    return () => {
      if (savedRecord.current) {
        dispatch({
          type: 'RESET_SCAN',
          payload: { sessionUri: savedSessionUri.current },
        });
      }
    };
  }, [dispatch]);

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleKeepDraft = async () => {
    if (keepingDraft) {
      return;
    }
    setShowCancelConfirm(false);
    setKeepingDraft(true);
    try {
      const saved = await persistScanForOutcome();
      if (!saved) {
        // A null result is a failure or busy, never success: keep the entered
        // state visible and let the inspector retry from this screen.
        showToast(
          saveRecord.getLastError() ?? 'Scan not saved on this device — try again',
          'error',
        );
        return;
      }
      showToast('Scan saved', 'success');
      dispatch({ type: 'RESET_SCAN' });
      returnToTab('/home');
    } finally {
      setKeepingDraft(false);
    }
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
    showToast('Scan discarded', 'info');
    returnToTab('/home');
  };

  const startNewScan = () => {
    // Scanning again before saving a follow-up keeps it a follow-up.
    if (isFollowUp && state.followUpOf && !savedRecord.current) {
      dispatch({ type: 'START_FOLLOW_UP', payload: { scanId: state.followUpOf } });
    } else {
      dispatch({ type: 'RESET_SCAN' });
    }
    returnToTab('/scan');
  };

  const persistScanForOutcome = async () => {
    const markSaved = (id: string) => {
      savedRecord.current = id;
      savedSessionUri.current = state.sourceUri;
      draft.finalizeSavedDraft();
    };
    if (saveRecord.status === 'saved' && saveRecord.recordId) {
      markSaved(saveRecord.recordId);
      return { id: saveRecord.recordId };
    }
    const saved = await saveRecord.save();
    if (saved) {
      markSaved(saved.id);
    }
    return saved;
  };

  const reportToOffice = async () => {
    if (openingReport) {
      return;
    }
    setOpeningReport(true);
    const saved = await persistScanForOutcome();
    if (!saved) {
      setOpeningReport(false);
      return;
    }
    router.push({
      pathname: '/field-report',
      params: { scanRecordId: saved.id },
    } as unknown as Href);
  };

  const keepAsScanOnly = async () => {
    const saved = await persistScanForOutcome();
    if (!saved) {
      showToast('Could not save scan', 'error');
      return;
    }
    showToast('Scan saved', 'success');
  };

  if (state.status !== 'completed' || !state.result || !state.sourceUri) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}>
        <View style={styles.root}>
          <BrandedScreenHeader
            title="Analysis result"
            showClose
            onClosePress={handleCancel}
            closeTestID="analysis-result.header-close"
          />
          <View style={styles.recoveryContent}>
            <View
              style={[
                styles.recoveryCard,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}>
              <View style={[styles.recoveryIcon, { backgroundColor: theme.warningBg }]}>
                <Feather name="alert-circle" size={24} color={theme.warning} />
              </View>
              <Text style={[styles.recoveryTitle, { color: theme.primaryDark }]}>
                No completed scan result
              </Text>
              <Text style={[styles.recoveryText, { color: theme.textSecondary }]}>
                {getSessionStateErrorMessage(
                  new SessionStateError(
                    'RESULT_MISSING',
                    'Analysis result requires a completed scan state.',
                  ),
                )}
              </Text>
              <AppButton
                onPress={startNewScan}
                leadingIcon="camera"
                accessibilityLabel="Return to scan and clear incomplete result">
                Return to Scan
              </AppButton>
            </View>
          </View>
          <ConfirmDialog
            visible={showCancelConfirm}
            title="Cancel scan?"
            message="Do you want to keep your in-progress scan draft or discard it before returning home?"
            cancelLabel="Keep draft"
            confirmLabel="Discard draft"
            destructive
            overlay
            onRequestClose={() => setShowCancelConfirm(false)}
            onCancel={handleKeepDraft}
            onConfirm={handleDiscardDraft}
            testID="analysis-result.cancel-dialog"
          />
        </View>
      </SafeAreaView>
    );
  }

  const { result } = state;
  const metadata = diseaseCatalog[result.predictedLabel];
  const consistency = getChecklistConsistency(
    result.predictedLabel,
    state.selectedSymptoms,
  );
  const consistencyPresentation = CONSISTENCY_PRESENTATION[consistency];
  const consistencyMessage =
    consistency === 'inconsistent' && !canReportToOffice
      ? isFarmer
        ? rc.consistencyMismatch
        : "The reporter's observation does not match the Possible Condition. Both are kept separately."
      : consistencyPresentation.message;
  const isLowScore = isBelowConfidenceCautionThreshold(
    result.confidence,
    result.modelVersion,
  );
  const qualityWarnings = state.qualityAssessment?.warnings ?? [];
  const checklistMismatch = consistency === 'inconsistent';
  const showOutcomeCaution = isLowScore || qualityWarnings.length > 0 || checklistMismatch;
  const showUncertainCard = isLowScore && user?.role === 'farmer';
  const resultTitle = isFarmer
    ? possibleConditionLine(farmerCopy, result.predictedLabel)
    : `Possible Condition: ${metadata.displayName}`;
  const isSaving = saveRecord.status === 'saving';
  const isFailed = saveRecord.status === 'failed';
  const isSaved = saveRecord.status === 'saved';

  const saveScanButton = isFollowUp ? (
    <FollowUpSaveButton
      failed={isFailed}
      onPress={keepAsScanOnly}
      saving={isSaving}
    />
  ) : (
    <AppButton
      testID="scan.keep-as-scan-only"
      busy={isSaving}
      onPress={keepAsScanOnly}
      disabled={isSaving}
      leadingIcon={isFailed ? 'refresh-cw' : 'save'}
      variant={canReportToOffice ? 'secondary' : 'primary'}
      style={canReportToOffice ? dockSecondaryButtonStyle : undefined}
      accessibilityLabel={
        isFarmer
          ? farmerCopy.whatNow.saveScan
          : isFailed
            ? 'Retry and save this scan on the device'
            : 'Save this scan on the device'
      }>
      {isFarmer
        ? isSaving
          ? farmerCopy.whatNow.saving
          : farmerCopy.whatNow.saveScan
        : isSaving
          ? 'Saving scan...'
          : isFailed
            ? 'Retry and Save Scan'
            : 'Save Scan'}
    </AppButton>
  );

  return (
    <SafeAreaView
      testID="scan.result-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader
          title={isFarmer ? rc.headerTitle : 'Analysis result'}
          showClose
          onClosePress={handleCancel}
          closeTestID="analysis-result.header-close"
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {isFollowUp ? null : (
              <ExpoImage
                source={{ uri: state.sourceUri }}
                cachePolicy="memory-disk"
                contentFit="cover"
                accessibilityLabel="Selected sugarcane image used for analysis"
                style={[styles.resultImage, { borderColor: theme.border }]}
              />
            )}
            {isFollowUp && state.followUpOf ? (
              <FollowUpComparison
                newPredictedLabel={result.predictedLabel}
                newSourceUri={state.sourceUri}
                note={state.personalNote ?? ''}
                noteEditable={!isSaved && !isSaving}
                onNoteChange={(value) => dispatch({ type: 'SET_PERSONAL_NOTE', payload: value })}
                originalId={state.followUpOf}
                saved={isSaved}
              />
 ) : null}
            {user?.role === 'farmer' ? (
              <TextField
                testID="scan.place"
                label={scanCardCopy.placeLabel}
                placeholder={scanCardCopy.placePlaceholder}
                value={state.personalPlace ?? ''}
                onChangeText={(value) => dispatch({ type: 'SET_PERSONAL_PLACE', payload: value })}
                maxLength={MAX_PERSONAL_PLACE_LENGTH}
                editable={!isSaved && !isSaving}
              />
            ) : null}
            <View testID="scan.decision-card" style={styles.resultBlock}>
              <Pill
                label={isFarmer ? rc.pill : 'AI screening result'}
                icon={metadata.icon}
                variant={metadata.themeToken.foreground}
              />
              {showUncertainCard ? (
                <UncertainResult
                  closestMatch={farmerResultName(farmerCopy, result.predictedLabel)}
                  onRetake={startNewScan}
                  onReviewSigns={() => router.push(`/field-guide/${result.predictedLabel}`)}
                  disabled={isSaving}
                />
              ) : (
                <Text
                  testID="scan.result-title"
                  style={[styles.diseaseName, { color: theme.primaryDark }]}>
                  {resultTitle}
                </Text>
              )}
              <Text
                testID="scan.decision-support-wording"
                style={[styles.advisory, { color: theme.textSecondary }]}>
                {result.decisionSupportWording ?? metadata.decisionSupportWording}
              </Text>
            </View>

            {/* One voice: every caution about this result is one Note, so a
                screen reader announces it once and nothing it said before is lost. */}
            {showOutcomeCaution ? (
              <View
                accessibilityRole="alert"
                testID="scan.result-caution"
                style={[styles.cautionCard, { backgroundColor: theme.warningBg }]}>
                <Feather name="alert-triangle" size={22} color={theme.warning} />
                <View style={styles.cautionCopy}>
                  <Text style={[styles.cautionTitle, { color: theme.warning }]}>
                    {canReportToOffice
                      ? 'Check before you report'
                      : isFarmer
                        ? rc.cautionTitle
                        : 'Check before you save'}
                  </Text>
                  {isLowScore ? (
                    <Text
                      testID="scan.low-confidence-guidance"
                      style={[styles.cautionBody, { color: theme.text }]}>
                      {canReportToOffice
                        ? 'This result is not conclusive. You can still report it, keep it as a scan, or scan again for a clearer image.'
                        : isFarmer
                          ? rc.lowConfidence
                          : 'This result is not conclusive. You can still keep it as a scan, or scan again for a clearer image.'}
                    </Text>
                  ) : null}
                  {checklistMismatch ? (
                    <Text style={[styles.cautionBody, { color: theme.text }]}>
                      {canReportToOffice
                        ? 'Your selected symptom observations do not match this Possible Condition. Both are kept separately and this scan can still be reported.'
                        : isFarmer
                          ? rc.mismatch
                          : 'Your selected symptom observations do not match this Possible Condition. Both are kept separately.'}
                    </Text>
                  ) : null}
                  {qualityWarnings.map((warning) => (
                    <Text
                      key={warning}
                      style={[styles.cautionBody, { color: theme.text }]}>
                      {getQualityWarningMessage(warning)}
                    </Text>
                  ))}
                  {!isLowScore ? (
                    <Text style={[styles.cautionBody, { color: theme.textSecondary }]}>
                      {canReportToOffice
                        ? 'This caution does not change the result. You can scan again for a clearer image, keep this scan, or continue to report it.'
                        : isFarmer
                          ? rc.cautionNote
                          : 'This caution does not change the result. You can scan again for a clearer image or keep this scan.'}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View
              testID="scan.outcome-panel"
              accessibilityLiveRegion={isFailed ? 'assertive' : 'polite'}
              style={styles.outcome}>
              <View
                testID={isSaved ? 'scan.record-saved' : undefined}
                style={styles.outcomeHeading}>
                <Feather
                  name={isSaved ? 'check-circle' : isFailed ? 'alert-triangle' : 'navigation'}
                  size={20}
                  color={isFailed ? theme.danger : isSaved ? theme.success : theme.primary}
                />
                <Text
                  style={[
                    styles.outcomeTitle,
                    { color: isFailed ? theme.danger : theme.primaryDark },
                  ]}>
                  {isSaved
                    ? isFarmer
                      ? rc.outcomeSaved
                      : 'Scan saved on this device'
                    : isFailed
                      ? isFarmer
                        ? rc.outcomeFailed
                        : 'Choose another action'
                      : isFarmer
                        ? rc.outcomeChoose
                        : 'Choose what happens next'}
                </Text>
              </View>
              <Text style={[styles.outcomeMessage, { color: theme.textSecondary }]}>
                {isSaved
                  ? canReportToOffice
                    ? 'This scan is saved on this device. Reporting it to the office is a separate choice.'
                    : isFarmer
                      ? rc.outcomeSavedMessage
                      : 'This scan is saved on this device.'
                  : isFailed
                    ? saveRecord.errorMessage ?? 'The scan could not be saved on this device.'
                    : canReportToOffice
                      ? 'Report to Office saves this scan and opens a short Field Report Draft. Save Scan stores the scan on this device without sending a report.'
                      : isFarmer
                        ? rc.outcomeChooseMessage
                        : 'Save Scan stores this scan on this device.'}
              </Text>
            </View>

            {user?.role === 'farmer' ? (
              <WhatNowCard
                label={result.predictedLabel}
                saved={isSaved}
                saving={isSaving}
                onSave={() => void keepAsScanOnly()}
                onCheckAgain={
                  isSaved && saveRecord.recordId
                    ? () => {
                        dispatch({
                          type: 'START_FOLLOW_UP',
                          payload: { scanId: state.followUpOf ?? saveRecord.recordId! },
                        });
                        returnToTab('/scan');
                      }
                    : undefined
                }
              />
            ) : null}

            {user?.role === 'farmer' && isSaved && saveRecord.recordId ? (
              <SavedScanCard recordId={saveRecord.recordId} />
            ) : null}

            <DisclosureSection
              testID="scan.why-this-result"
              title={isFarmer ? rc.whyTitle : 'Why this result?'}>
              <SectionCard title="About this result">
                <Text style={[styles.resultMessage, { color: theme.text }]}>
                  {metadata.resultMessage}
                </Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                  {metadata.shortDescription}
                </Text>
              </SectionCard>

              <View
                testID="scan.checklist-consistency"
                style={[
                  styles.consistencyCard,
                  {
                    backgroundColor: theme[consistencyPresentation.background],
                    borderColor: theme[consistencyPresentation.foreground],
                  },
                ]}>
                <Feather
                  name={consistencyPresentation.icon}
                  size={22}
                  color={theme[consistencyPresentation.foreground]}
                />
                <View style={styles.consistencyCopy}>
                  <Text
                    style={[
                      styles.consistencyTitle,
                      { color: theme[consistencyPresentation.foreground] },
                    ]}>
                    {consistencyPresentation.title}
                  </Text>
                  <Text style={[styles.consistencyMessage, { color: theme.text }]}>
                    {consistencyMessage}
                  </Text>
                </View>
              </View>

              {qualityWarnings.length ? (
                <View
                  style={[
                    styles.qualityCard,
                    {
                      backgroundColor: theme.warningBg,
                      borderColor: theme.warning,
                    },
                  ]}>
                  <Feather name="camera" size={22} color={theme.warning} />
                  <View style={styles.qualityCopy}>
                    <Text style={[styles.qualityTitle, { color: theme.warning }]}>
                      Image quality notice
                    </Text>
                    <Text style={[styles.qualityIndependence, { color: theme.text }]}>
                      These warnings did not change the result.
                    </Text>
                    {qualityWarnings.map((warning) => (
                      <View key={warning} style={styles.qualityWarning}>
                        <View
                          style={[
                            styles.qualityBullet,
                            { backgroundColor: theme.warning },
                          ]}
                        />
                        <Text
                          style={[
                            styles.qualityWarningText,
                            { color: theme.textSecondary },
                          ]}>
                          {getQualityWarningMessage(warning)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </DisclosureSection>

            <DisclosureSection
              testID="scan.more-actions"
              title={isFarmer ? rc.moreActions : 'More actions'}
              summary={isSaved && saveRecord.recordId ? '3 more actions' : '2 more actions'}>
              <AppButton
                testID="scan.view-disease-reference"
                onPress={() => router.push(`/field-guide/${result.predictedLabel}`)}
                leadingIcon="book-open"
                variant="secondary"
                accessibilityLabel={
                  isFarmer ? rc.fieldGuide : 'Open the field guide for this condition'
                }>
                {isFarmer ? rc.fieldGuide : 'Field Guide'}
              </AppButton>
              <AppButton
                testID="analysis-result.cancel"
                onPress={handleCancel}
                disabled={isSaving}
                variant="text"
                leadingIcon="x"
                accessibilityLabel={isFarmer ? rc.cancelScan : 'Cancel scan and return home'}>
                {isFarmer ? rc.cancelScan : 'Cancel Scan'}
              </AppButton>
              {isSaved && saveRecord.recordId ? (
                <AppButton
                  testID="scan.open-saved-record"
                  onPress={() =>
                    router.push({
                      pathname: '/record-details',
                      params: { id: saveRecord.recordId! },
                    } as unknown as Href)
                  }
                  leadingIcon="folder"
                  variant="text"
                  accessibilityLabel={isFarmer ? rc.openSaved : 'Open the saved local scan'}>
                  {isFarmer ? rc.openSaved : 'Open Saved Scan'}
                </AppButton>
              ) : null}
            </DisclosureSection>

            <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
              {isFarmer ? scanCardCopy.aiOnlyLine : DECISION_SUPPORT_DISCLAIMER}
            </Text>
          </View>
        </ScrollView>
        <ActionDock
          primary={
            canReportToOffice ? (
              <AppButton
                testID="scan.report-to-office"
                busy={isSaving || openingReport}
                onPress={() => void reportToOffice()}
                disabled={isSaving || openingReport}
                leadingIcon="send"
                accessibilityLabel={
                  openingReport
                    ? 'Opening Field Report'
                    : isFailed
                      ? 'Retry and report this scan to the office'
                      : 'Report this scan to the office'
                }>
                {openingReport
                  ? 'Opening Field Report...'
                  : isSaving
                    ? 'Saving scan...'
                    : isFailed
                      ? 'Retry and Report to Office'
                      : 'Report to Office'}
              </AppButton>
            ) : (
              saveScanButton
            )
          }
          secondary={
            <>
              {canReportToOffice ? saveScanButton : null}
              <AppButton
                testID="scan.new-scan"
                onPress={startNewScan}
                disabled={isSaving}
                leadingIcon="refresh-cw"
                variant="secondary"
                style={dockSecondaryButtonStyle}
                accessibilityLabel={isFarmer ? rc.scanAgain : 'Scan again with a new image'}>
                {isFarmer ? rc.scanAgain : 'Scan Again'}
              </AppButton>
            </>
          }
        />
        <ConfirmDialog
          visible={showCancelConfirm}
          title={isFarmer ? rc.cancelTitle : 'Cancel scan?'}
          message={
            isFarmer
              ? rc.cancelMessage
              : 'Do you want to keep your in-progress scan draft or discard it before returning home?'
          }
          cancelLabel={isFarmer ? rc.keepDraft : 'Keep draft'}
          confirmLabel={isFarmer ? rc.discardDraft : 'Discard draft'}
          destructive
          overlay
          onRequestClose={() => setShowCancelConfirm(false)}
          onCancel={handleKeepDraft}
          onConfirm={handleDiscardDraft}
          testID="analysis-result.cancel-dialog"
        />
      </View>
    </SafeAreaView>
  );
}

function UncertainResult({
  closestMatch,
  disabled,
  onRetake,
  onReviewSigns,
}: {
  closestMatch: string;
  disabled: boolean;
  onRetake: () => void;
  onReviewSigns: () => void;
}) {
  const theme = useTheme();
  const copy = useFarmerCopy().resultUncertain;
  const steps = [copy.stepCloser, copy.stepLight, copy.stepLeafInView, copy.stepCompare];

  return (
    <View testID="scan.result-uncertain" style={styles.uncertain}>
      <Text
        accessibilityRole="header"
        testID="scan.result-title"
        style={[styles.diseaseName, { color: theme.primaryDark }]}>
        {copy.title}
      </Text>
      <Text style={[styles.advisory, { color: theme.textSecondary }]}>{copy.intro}</Text>
      {steps.map((step) => (
        <View key={step} style={styles.qualityWarning}>
          <View style={[styles.qualityBullet, { backgroundColor: theme.primary }]} />
          <Text style={[styles.qualityWarningText, { color: theme.text }]}>{step}</Text>
        </View>
      ))}
      <AppButton testID="scan.retake-photo" leadingIcon="camera" disabled={disabled} onPress={onRetake}>
        {copy.retakePhoto}
      </AppButton>
      <AppButton
        testID="scan.review-signs"
        leadingIcon="book-open"
        variant="secondary"
        onPress={onReviewSigns}>
        {copy.reviewSigns}
      </AppButton>
      <Text testID="scan.closest-match" style={[styles.qualityWarningText, { color: theme.textSecondary }]}>
        {copy.closestMatchLabel} {closestMatch}
      </Text>
    </View>
  );
}

function FollowUpSaveButton({
  failed,
  onPress,
  saving,
}: {
  failed: boolean;
  onPress: () => void;
  saving: boolean;
}) {
  const copy = useFarmerCopy().checkAgain;
  return (
    <AppButton
      testID="scan.save-follow-up"
      busy={saving}
      onPress={onPress}
      disabled={saving}
      leadingIcon={failed ? 'refresh-cw' : 'save'}>
      {saving ? copy.savingFollowUp : failed ? copy.retrySaveFollowUp : copy.saveFollowUp}
    </AppButton>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
      ]}>
      <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, root: { flex: 1 }, scrollContent: { alignItems: 'center' },
  content: { width: '100%', maxWidth: Layout.mobileMaxWidth, paddingHorizontal: ComponentTokens.screen.horizontalPadding, paddingVertical: Spacing.xl, gap: Spacing.lg },
  resultImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.lg, borderWidth: 1 },
  resultBlock: { alignItems: 'stretch', gap: Spacing.sm },
  diseaseName: { ...Typography.title },
  resultMessage: { ...Typography.body, fontWeight: '500' },
  description: { ...Typography.bodySmall },
  advisory: { ...Typography.body },
  sectionCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { ...Typography.subheading },
  qualityCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  qualityCopy: { flex: 1, gap: Spacing.sm },
  qualityTitle: { ...Typography.subheading },
  qualityIndependence: { ...Typography.bodySmall, fontWeight: '500' },
  qualityWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  qualityBullet: { width: 6, height: 6, marginTop: 7, borderRadius: Radius.full },
  qualityWarningText: { ...Typography.caption, flex: 1 },
  consistencyCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  consistencyCopy: { flex: 1, gap: Spacing.xs },
  consistencyTitle: { ...Typography.subheading },
  consistencyMessage: { ...Typography.bodySmall },
  cautionCard: { borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  cautionCopy: { flex: 1, gap: Spacing.sm },
  cautionTitle: { ...Typography.subheading },
  cautionBody: { ...Typography.body },
  uncertain: { gap: Spacing.sm },
  disclaimerText: { ...Typography.bodySmall },
  outcome: { gap: Spacing.xs },
  outcomeHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  outcomeTitle: { ...Typography.body, fontWeight: '500', flex: 1 },
  outcomeMessage: { ...Typography.bodySmall },
  recoveryContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  recoveryCard: { width: '100%', maxWidth: Layout.mobileMaxWidth, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  recoveryIcon: { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  recoveryTitle: { ...Typography.heading, textAlign: 'center' },
  recoveryText: { ...Typography.bodySmall, textAlign: 'center' },
});

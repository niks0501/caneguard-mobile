import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
import { Pill } from '@/components/ui/Pill';
import { DECISION_SUPPORT_DISCLAIMER } from '@/constants/copy';
import {
  ComponentTokens,
  Layout,
  Radius,
  Shadows,
  Spacing,
  Typography,
  type ThemeColor,
} from '@/constants/theme';
import {
  getChecklistConsistency,
  type ChecklistConsistency,
} from '@/features/detection/checklist/checklistConsistency';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { isBelowV1ConfidenceCautionThreshold } from '@/features/detection/constants/confidenceCaution';
import { useScanDraft } from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';
import {
  getSessionStateErrorMessage,
  SessionStateError,
} from '@/features/detection/context/sessionErrors';
import { getQualityWarningMessage } from '@/features/detection/validation/assessImageQuality';
import { returnToTab } from '@/features/navigation/returnToTab';
import { useSaveCompletedScan } from '@/features/records/hooks/useSaveCompletedScan';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/use-theme';

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
  const saveRecord = useSaveCompletedScan(state);
  const draft = useScanDraft();
  const [openingReport, setOpeningReport] = useState(false);
  const [keepingDraft, setKeepingDraft] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
    dispatch({ type: 'RESET_SCAN' });
    returnToTab('/scan');
  };

  const persistScanForOutcome = async () => {
    if (saveRecord.status === 'saved' && saveRecord.recordId) {
      return { id: saveRecord.recordId };
    }
    return saveRecord.save();
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
    dispatch({ type: 'RESET_SCAN' });
    router.replace({
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
    dispatch({ type: 'RESET_SCAN' });
    returnToTab('/home');
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
  const isLowScore = isBelowV1ConfidenceCautionThreshold(result.confidence);
  const qualityWarnings = state.qualityAssessment?.warnings ?? [];
  const checklistMismatch = consistency === 'inconsistent';
  const showOutcomeCaution = qualityWarnings.length > 0 || checklistMismatch;
  const resultTitle = `Possible Condition: ${metadata.displayName}`;

  return (
    <SafeAreaView
      testID="scan.result-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader
          title="Analysis result"
          showClose
          onClosePress={handleCancel}
          closeTestID="analysis-result.header-close"
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <ExpoImage
              source={{ uri: state.sourceUri }}
              cachePolicy="memory-disk"
              contentFit="cover"
              accessibilityLabel="Selected sugarcane image used for analysis"
              style={[styles.resultImage, { borderColor: theme.border }]}
            />
            <View
              testID="scan.decision-card"
              style={[styles.resultCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Pill
                label="AI screening result"
                icon={metadata.icon}
                variant={metadata.themeToken.foreground}
              />
              <Text
                testID="scan.result-title"
                style={[styles.diseaseName, { color: theme.primaryDark }]}>
                {resultTitle}
              </Text>
              <Text
                testID="scan.decision-support-wording"
                style={[styles.advisory, { color: theme.textSecondary }]}>
                {result.decisionSupportWording ?? metadata.decisionSupportWording}
              </Text>
              {isLowScore ? (
                <View
                  accessibilityRole="alert"
                  testID="scan.low-confidence-guidance"
                  style={[
                    styles.caution,
                    {
                      backgroundColor: theme.warningBg,
                      borderColor: theme.warning,
                    },
                  ]}>
                  <Feather name="alert-triangle" size={20} color={theme.warning} />
                  <Text style={[styles.cautionText, { color: theme.text }]}>
                    This result is not conclusive. You can still report it, keep it
                    as a scan, or scan again for a clearer image.
                  </Text>
                </View>
              ) : null}
            </View>

            {showOutcomeCaution ? (
              <View
                accessibilityRole="alert"
                testID="scan.result-caution"
                style={[
                  styles.cautionCard,
                  { backgroundColor: theme.warningBg, borderColor: theme.warning },
                ]}>
                <Feather name="alert-triangle" size={20} color={theme.warning} />
                <View style={styles.cautionCopy}>
                  <Text style={[styles.cautionTitle, { color: theme.warning }]}>
                    Check before you report
                  </Text>
                  {checklistMismatch ? (
                    <Text style={[styles.cautionBody, { color: theme.text }]}>
                      Your selected symptom observations do not match this Possible
                      Condition. Both are kept separately and this scan can still be
                      reported.
                    </Text>
                  ) : null}
                  {qualityWarnings.map((warning) => (
                    <Text
                      key={warning}
                      style={[styles.cautionBody, { color: theme.text }]}>
                      {getQualityWarningMessage(warning)}
                    </Text>
                  ))}
                  <Text style={[styles.cautionBody, { color: theme.textSecondary }]}>
                    This caution does not change the result. You can scan again for a
                    clearer image, keep this scan, or continue to report it.
                  </Text>
                </View>
              </View>
            ) : null}

            <View
              testID="scan.outcome-panel"
              accessibilityLiveRegion={saveRecord.status === 'failed' ? 'assertive' : 'polite'}
              style={[
                styles.saveCard,
                {
                  backgroundColor:
                    saveRecord.status === 'saved'
                      ? theme.successBg
                      : saveRecord.status === 'failed'
                        ? theme.dangerBg
                        : theme.surfaceElevated,
                  borderColor:
                    saveRecord.status === 'saved'
                      ? theme.success
                      : saveRecord.status === 'failed'
                        ? theme.danger
                        : theme.border,
                },
              ]}>
              <View
                testID={saveRecord.status === 'saved' ? 'scan.record-saved' : undefined}
                style={styles.saveHeading}>
                <Feather
                  name={
                    saveRecord.status === 'saved'
                      ? 'check-circle'
                      : saveRecord.status === 'failed'
                        ? 'alert-triangle'
                        : 'navigation'
                  }
                  size={22}
                  color={
                    saveRecord.status === 'saved'
                      ? theme.success
                      : saveRecord.status === 'failed'
                        ? theme.danger
                        : theme.primary
                  }
                />
                <Text style={[styles.saveTitle, { color: theme.primaryDark }]}>
                  {saveRecord.status === 'saved'
                    ? 'Scan saved on this device'
                    : saveRecord.status === 'failed'
                      ? 'Choose another action'
                      : 'Choose what happens next'}
                </Text>
              </View>
              <Text style={[styles.saveMessage, { color: theme.textSecondary }]}>
                {saveRecord.status === 'saved'
                  ? 'This scan is saved on this device. Reporting it to the office is a separate choice.'
                  : saveRecord.status === 'failed'
                    ? saveRecord.errorMessage ?? 'The scan could not be saved on this device.'
                    : 'Report to Office saves this scan and opens a short Field Report Draft. Save Scan stores the scan on this device without sending a report.'}
              </Text>
              <View style={styles.outcomeActions}>
                <AppButton
                  testID="scan.report-to-office"
                  onPress={() => void reportToOffice()}
                  disabled={saveRecord.status === 'saving' || openingReport}
                  leadingIcon="send"
                  accessibilityLabel={
                    openingReport
                      ? 'Opening Field Report'
                      : saveRecord.status === 'failed'
                        ? 'Retry and report this scan to the office'
                        : 'Report this scan to the office'
                  }>
                  {openingReport
                    ? 'Opening Field Report...'
                    : saveRecord.status === 'saving'
                      ? 'Saving scan...'
                      : saveRecord.status === 'failed'
                        ? 'Retry and Report to Office'
                        : 'Report to Office'}
                </AppButton>
                <AppButton
                  testID="scan.keep-as-scan-only"
                  onPress={keepAsScanOnly}
                  disabled={saveRecord.status === 'saving'}
                  leadingIcon={saveRecord.status === 'failed' ? 'refresh-cw' : 'save'}
                  variant="secondary"
                  accessibilityLabel={
                    saveRecord.status === 'failed'
                      ? 'Retry and save this scan on the device'
                      : 'Save this scan on the device'
                  }>
                  {saveRecord.status === 'saving'
                    ? 'Saving scan...'
                    : saveRecord.status === 'failed'
                      ? 'Retry and Save Scan'
                      : 'Save Scan'}
                </AppButton>
                <AppButton
                  testID="scan.new-scan"
                  onPress={startNewScan}
                  disabled={saveRecord.status === 'saving'}
                  leadingIcon="refresh-cw"
                  variant="secondary"
                  accessibilityLabel="Scan again with a new image">
                  Scan Again
                </AppButton>
                <DisclosureSection
                  testID="scan.more-actions"
                  title="More actions"
                  summary={saveRecord.status === 'saved' && saveRecord.recordId ? '3 more actions' : '2 more actions'}>
                  <AppButton
                    testID="scan.view-disease-reference"
                    onPress={() => router.push(`/field-guide/${result.predictedLabel}`)}
                    leadingIcon="book-open"
                    variant="secondary"
                    accessibilityLabel="Open the field guide for this condition">
                    Field Guide
                  </AppButton>
                  <AppButton
                    testID="analysis-result.cancel"
                    onPress={handleCancel}
                    disabled={saveRecord.status === 'saving'}
                    variant="secondary"
                    leadingIcon="x"
                    accessibilityLabel="Cancel scan and return home">
                    Cancel Scan
                  </AppButton>
                  {saveRecord.status === 'saved' && saveRecord.recordId ? (
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
                      accessibilityLabel="Open the saved local scan">
                      Open Saved Scan
                    </AppButton>
                  ) : null}
                </DisclosureSection>
              </View>
            </View>

            <DisclosureSection testID="scan.why-this-result" title="Why this result?">
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
                accessibilityRole={consistency === 'inconsistent' ? 'alert' : undefined}
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
                    {consistencyPresentation.message}
                  </Text>
                </View>
              </View>

              {state.qualityAssessment?.warnings.length ? (
                <View
                  accessibilityRole="alert"
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
                    {state.qualityAssessment.warnings.map((warning) => (
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

            <View style={[styles.disclaimer, { backgroundColor: theme.infoBg, borderColor: theme.info }]}>
              <Feather name="info" size={19} color={theme.info} />
              <Text style={[styles.disclaimerText, { color: theme.text }]}>
                {DECISION_SUPPORT_DISCLAIMER}
              </Text>
            </View>
          </View>
        </ScrollView>
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
  resultImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radius.xl, borderWidth: 1 },
  resultCard: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'stretch', gap: Spacing.md, ...Shadows.md },
  diseasePill: { borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'flex-start' }, diseasePillText: { ...Typography.caption, fontWeight: '800' },
  diseaseName: { ...Typography.title, fontWeight: '800' },
  resultMessage: { ...Typography.body, fontWeight: '700' },
  description: { ...Typography.bodySmall },
  advisory: { ...Typography.bodySmall, fontWeight: '700' },
  sectionCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { ...Typography.subheading },
  qualityCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  qualityCopy: { flex: 1, gap: Spacing.sm },
  qualityTitle: { ...Typography.subheading },
  qualityIndependence: { ...Typography.bodySmall, fontWeight: '700' },
  qualityWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  qualityBullet: { width: 6, height: 6, marginTop: 7, borderRadius: Radius.full },
  qualityWarningText: { ...Typography.caption, flex: 1 },
  consistencyCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  consistencyCopy: { flex: 1, gap: Spacing.xs },
  consistencyTitle: { ...Typography.subheading },
  consistencyMessage: { ...Typography.bodySmall },
  caution: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cautionText: { ...Typography.caption, flex: 1 },
  cautionCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  cautionCopy: { flex: 1, gap: Spacing.xs },
  cautionTitle: { ...Typography.subheading },
  cautionBody: { ...Typography.caption },
  disclaimer: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, flexDirection: 'row', alignItems: 'flex-start' }, disclaimerText: { ...Typography.caption, flex: 1, lineHeight: 18 },
  saveCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  outcomeActions: { gap: Spacing.sm },
  saveHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  saveTitle: { ...Typography.subheading, flex: 1 },
  saveMessage: { ...Typography.bodySmall },
  recoveryContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  recoveryCard: { width: '100%', maxWidth: Layout.mobileMaxWidth, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, alignItems: 'center' },
  recoveryIcon: { width: 48, height: 48, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  recoveryTitle: { ...Typography.heading, textAlign: 'center' },
  recoveryText: { ...Typography.bodySmall, textAlign: 'center' },
});

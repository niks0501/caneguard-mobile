import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { DisclosureSection } from '@/components/ui/DisclosureSection';
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
import {
  MODEL_LABELS,
  MODEL_VERSION,
  type ModelLabel,
} from '@/features/detection/constants/modelContract';
import { useScanSession } from '@/features/detection/context/useScanSession';
import {
  getSessionStateErrorMessage,
  SessionStateError,
} from '@/features/detection/context/sessionErrors';
import { getQualityWarningMessage } from '@/features/detection/validation/assessImageQuality';
import { useSaveCompletedScan } from '@/features/records/hooks/useSaveCompletedScan';
import { useTheme } from '@/hooks/use-theme';

const PROTOTYPE_LOW_SCORE_THRESHOLD = 0.5;

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
    message: 'The selected observations are consistent with the model result.',
    icon: 'check-circle',
    foreground: 'success',
    background: 'successBg',
  },
  inconsistent: {
    title: 'Checklist inconsistent',
    message:
      'The selected observation differs from the model result. Both remain separate evidence, and this scan can still be reported to the office.',
    icon: 'alert-triangle',
    foreground: 'danger',
    background: 'dangerBg',
  },
  'not-applicable': {
    title: 'Checklist cannot be compared',
    message:
      'The selected observations point to more than one supported class, so they cannot be compared as one result.',
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
  const { state, dispatch } = useScanSession();
  const saveRecord = useSaveCompletedScan(state);
  const [openingReport, setOpeningReport] = useState(false);

  const startNewScan = () => {
    dispatch({ type: 'RESET_SCAN' });
    router.replace('/scan');
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
    router.push({
      pathname: '/field-report',
      params: { scanRecordId: saved.id },
    } as unknown as Href);
  };

  const keepAsScanOnly = () => {
    void persistScanForOutcome();
  };

  if (state.status !== 'completed' || !state.result || !state.sourceUri) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}>
        <View style={styles.root}>
          <BrandedScreenHeader title="Analysis Result" />
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
                    'Analysis result requires completed inference state.',
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
  const diseaseColor = theme[metadata.themeToken.foreground];
  const diseaseBackground = theme[metadata.themeToken.background];
  const isLowScore = result.confidence < PROTOTYPE_LOW_SCORE_THRESHOLD;
  const resultTitle =
    result.predictedLabel === 'healthy'
      ? metadata.displayName
      : `Possible result: ${metadata.displayName}`;

  return (
    <SafeAreaView
      testID="scan.result-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Analysis Result" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <ExpoImage
              source={{ uri: state.sourceUri }}
              contentFit="cover"
              accessibilityLabel="Selected sugarcane image used for analysis"
              style={[styles.resultImage, { borderColor: theme.border }]}
            />
            <View style={[styles.resultCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={[styles.diseasePill, { backgroundColor: diseaseBackground }]}>
                <Feather name={metadata.icon} size={16} color={diseaseColor} />
                <Text style={[styles.diseasePillText, { color: diseaseColor }]}>
                  {MODEL_VERSION}
                </Text>
              </View>
              <Text
                testID="scan.result-title"
                style={[styles.diseaseName, { color: theme.primaryDark }]}>
                {resultTitle}
              </Text>
              <Text style={[styles.resultMessage, { color: theme.text }]}>
                {metadata.resultMessage}
              </Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {metadata.shortDescription}
              </Text>
              <View style={[styles.confidence, { backgroundColor: diseaseBackground }]}>
                <Text style={[styles.confidenceLabel, { color: theme.textSecondary }]}>
                  AI confidence
                </Text>
                <Text
                  accessibilityLabel={`AI confidence ${formatPercentage(result.confidence)}`}
                  style={[styles.confidenceValue, { color: diseaseColor }]}>
                  {formatPercentage(result.confidence)}
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
                    These input warnings did not change the model scores.
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

            {isLowScore ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.caution,
                  {
                    backgroundColor: theme.warningBg,
                    borderColor: theme.warning,
                  },
                ]}>
                <Feather name="alert-triangle" size={20} color={theme.warning} />
                <Text style={[styles.cautionText, { color: theme.text }]}>
                  Prototype caution: the highest class score is below 50%. This
                  presentation rule is not a calibrated reliability threshold.
                </Text>
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
                  ? 'This scan is stored as local AI evidence. Reporting it to the office remains a separate choice.'
                  : saveRecord.status === 'failed'
                    ? saveRecord.errorMessage ?? 'The scan could not be saved on this device.'
                    : 'Report to Office saves this scan and opens a short Field Report Draft. Keep as Scan Only stores the scan without sending a report.'}
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
                      ? 'Retry and keep this scan only'
                      : 'Keep this scan only on the device'
                  }>
                  {saveRecord.status === 'saving'
                    ? 'Saving scan...'
                    : saveRecord.status === 'failed'
                      ? 'Retry and Keep as Scan Only'
                      : 'Keep as Scan Only'}
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
              </View>
            </View>

            <DisclosureSection testID="scan.technical-details" title="Technical details">
              <SectionCard title="All Model V1 class scores">
                {MODEL_LABELS.map((label) => (
                  <ScoreRow
                    key={label}
                    label={label}
                    score={result.scores.find((item) => item.label === label)?.score}
                  />
                ))}
              </SectionCard>
              <SectionCard title="Analysis details">
                <DetailRow label="Model version" value={result.modelVersion} />
                <DetailRow
                  label="Processing time"
                  value={`${Math.round(result.timings.totalMs)} ms`}
                />
              </SectionCard>
            </DisclosureSection>

            <View style={[styles.disclaimer, { backgroundColor: theme.infoBg, borderColor: theme.info }]}>
              <Feather name="info" size={19} color={theme.info} />
              <Text style={[styles.disclaimerText, { color: theme.text }]}>
                This output is for decision support only. It does not confirm a
                disease. Retake the image or consult an agricultural expert when the
                result is unclear or symptoms do not match.
              </Text>
            </View>
            <AppButton
              testID="scan.new-scan"
              onPress={startNewScan}
              disabled={saveRecord.status === 'saving'}
              leadingIcon="refresh-cw"
              accessibilityLabel="Clear result and start a new scan">
              New Scan
            </AppButton>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function formatPercentage(score: number) {
  return `${Math.round(score * 100)}%`;
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

function ScoreRow({ label, score }: { label: ModelLabel; score?: number }) {
  const theme = useTheme();
  const metadata = diseaseCatalog[label];
  const value = score === undefined ? 'Unavailable' : formatPercentage(score);

  return (
    <View
      accessibilityLabel={`${metadata.label === 'healthy' ? 'Healthy' : metadata.displayName} score ${value}`}
      style={styles.scoreRow}>
      <View style={styles.scoreLabel}>
        <Feather
          name={metadata.icon}
          size={17}
          color={theme[metadata.themeToken.foreground]}
        />
        <Text style={[styles.scoreName, { color: theme.text }]}>
          {metadata.label === 'healthy' ? 'Healthy' : metadata.displayName}
        </Text>
      </View>
      <Text style={[styles.scoreValue, { color: theme.primaryDark }]}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
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
  confidence: { borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.xs },
  confidenceLabel: { ...Typography.caption, fontWeight: '800' },
  confidenceValue: { ...Typography.title, fontWeight: '800' },
  sectionCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { ...Typography.subheading },
  scoreRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  scoreLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scoreName: { ...Typography.bodySmall, flex: 1 },
  scoreValue: { ...Typography.body, fontWeight: '800' },
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
  detailRow: { minHeight: 36, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  detailLabel: { ...Typography.bodySmall },
  detailValue: { ...Typography.bodySmall, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
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

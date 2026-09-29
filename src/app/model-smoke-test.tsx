import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Image as NativeImage, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { AppCard } from '@/components/ui/AppCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import {
  MODEL_FILENAME,
  MODEL_LABELS,
  MODEL_VERSION,
} from '@/features/detection/constants/modelContract';
import { compareV1QaOutput, getV1QaExpectedOutput } from '@/features/detection/model/v1Qa';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import { useTheme } from '@/hooks/use-theme';

const HEALTHY_FIXTURE = require('../../dev-assets/model-fixtures/v1-healthy.jpg') as number;
const HEALTHY_FIXTURE_DIMENSIONS = { width: 3000, height: 4000 };

type SmokeVerification =
  | {
      state: 'passed' | 'mismatch';
      actualTop1Class: string | null;
      expectedTop1Class: string;
      scoreDeltas: ReturnType<typeof compareV1QaOutput>['scoreDeltas'];
    }
  | { state: 'error'; message: string };

export default function ModelSmokeTestScreen() {
  if (!__DEV__) {
    return null;
  }

  return <DevelopmentModelSmokeTestScreen />;
}

function DevelopmentModelSmokeTestScreen() {
  const theme = useTheme();
  const modelState = useCaneGuardModel();
  const startModelLoad = modelState.start;
  const [verification, setVerification] = useState<SmokeVerification | null>(null);

  // Development harness: it works on the model itself, so it starts the load.
  useEffect(() => {
    startModelLoad();
  }, [startModelLoad]);

  useEffect(() => {
    if (modelState.state !== 'loaded') {
      return;
    }

    let cancelled = false;

    const runHealthyFixture = async () => {
      try {
        const resolvedAsset = NativeImage.resolveAssetSource(HEALTHY_FIXTURE);
        if (!resolvedAsset?.uri) {
          throw new Error('The V1 healthy QA fixture did not resolve to a local URI.');
        }

        const preprocessing = await preprocessImage(
          resolvedAsset.uri,
          HEALTHY_FIXTURE_DIMENSIONS,
        );
        let rawOutput: number[] = [];
        await runInference(
          modelState,
          preprocessing.inputBuffer,
          preprocessing.preprocessMs,
          undefined,
          (values) => {
            rawOutput = [...values];
          },
        );

        if (cancelled) {
          return;
        }

        const parity = compareV1QaOutput('healthy', rawOutput);
        setVerification({
          state: parity.top1Matches ? 'passed' : 'mismatch',
          actualTop1Class: parity.actualTop1Class,
          expectedTop1Class: parity.expectedTop1Class,
          scoreDeltas: parity.scoreDeltas,
        });
      } catch (error) {
        if (!cancelled) {
          setVerification({
            state: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    void runHealthyFixture();

    return () => {
      cancelled = true;
    };
  }, [modelState]);

  const status =
    modelState.state === 'loading'
      ? {
          title: 'Loading Model V1',
          detail: 'Resolving the bundled TensorFlow Lite asset and initializing the CPU runtime.',
          color: theme.info,
          background: theme.infoBg,
          icon: 'loader' as const,
        }
      : modelState.state === 'error'
        ? {
            title: 'Model V1 failed to load',
            detail: 'The bundled artifact, native runtime, or tensor contract could not be initialized.',
            color: theme.danger,
            background: theme.dangerBg,
            icon: 'alert-triangle' as const,
          }
        : verification?.state === 'mismatch'
          ? {
              title: 'Model V1 top-1 mismatch',
              detail: 'The native inference completed, but the fixed QA oracle did not match.',
              color: theme.danger,
              background: theme.dangerBg,
              icon: 'alert-triangle' as const,
            }
          : verification?.state === 'error'
            ? {
                title: 'Model V1 inference failed',
                detail: 'The model loaded, but the required real inference check could not complete.',
                color: theme.danger,
                background: theme.dangerBg,
                icon: 'alert-triangle' as const,
              }
            : verification?.state === 'passed'
              ? {
                  title: 'Model V1 inference passed',
                  detail: 'The native runtime loaded the exact artifact, validated its tensors, and ran the healthy QA fixture.',
                  color: theme.success,
                  background: theme.successBg,
                  icon: 'check-circle' as const,
                }
              : {
                  title: 'Running Model V1 inference',
                  detail: 'The native runtime loaded the contract and is running the healthy QA fixture.',
                  color: theme.info,
                  background: theme.infoBg,
                  icon: 'loader' as const,
                };

  const expected = getV1QaExpectedOutput('healthy');

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScreenHeader title="Model V1 smoke test" />

      <AppCard style={styles.card}>
        <View
          accessibilityLiveRegion={status.icon === 'alert-triangle' ? 'assertive' : 'polite'}
          style={[styles.statusIcon, { backgroundColor: status.background }]}>
          {status.icon === 'loader' ? (
            <ActivityIndicator accessibilityLabel="Model V1 inference loading" color={status.color} />
          ) : (
            <Feather name={status.icon} size={IconSize.xl} color={status.color} />
          )}
        </View>

        <Text accessibilityRole="header" style={[styles.statusTitle, { color: status.color }]}>
          {status.title}
        </Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>{status.detail}</Text>

        <View style={[styles.metadata, { borderColor: theme.border }]}>
          <MetadataRow label="Asset" value={MODEL_FILENAME} />
          <MetadataRow label="Version" value={MODEL_VERSION} />
          <MetadataRow label="Delegate" value="CPU" />
          {modelState.state === 'loaded' ? (
            <>
              <MetadataRow
                label="Input"
                value={`${modelState.model.inputs[0].dataType} [${modelState.model.inputs[0].shape.join(', ')}]`}
              />
              <MetadataRow
                label="Output"
                value={`${modelState.model.outputs[0].dataType} [${modelState.model.outputs[0].shape.join(', ')}]`}
              />
            </>
          ) : null}
        </View>

        {verification ? (
          <View style={[styles.verification, { borderColor: theme.border }]}>
            <MetadataRow label="QA fixture" value="healthy" />
            <MetadataRow label="Expected top-1" value={expected.expectedTop1Class} />
            <MetadataRow
              label="Actual top-1"
              value={verification.state === 'error' ? 'Unavailable' : verification.actualTop1Class ?? 'Unavailable'}
            />
            {verification.state === 'error' ? (
              <MetadataRow label="Inference error" value={verification.message} />
            ) : (
              <MetadataRow
                label="Score deltas"
                value={verification.scoreDeltas
                  .map(({ label, absoluteDelta }) => `${label}: ${absoluteDelta.toFixed(6)}`)
                  .join(' · ')}
              />
            )}
          </View>
        ) : null}

        {modelState.state === 'error' ? (
          <View style={[styles.errorDetail, { backgroundColor: theme.dangerBg }]}>
            <Text style={[styles.errorLabel, { color: theme.danger }]}>Development error detail</Text>
            <Text selectable style={[styles.errorMessage, { color: theme.text }]}>
              {modelState.error.message}
            </Text>
          </View>
        ) : null}
      </AppCard>

      <Text style={[styles.note, { color: theme.textSecondary }]}>
        Developer-only check. It runs real native inference on the V1 healthy QA fixture; loading alone is not a pass. Class order: {MODEL_LABELS.join(', ')}.
      </Text>
    </ScreenContainer>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.metadataRow}>
      <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text selectable style={[styles.metadataValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: Spacing['2xl'] },
  card: { alignItems: 'center', gap: Spacing.md },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: { ...Typography.heading, textAlign: 'center' },
  detail: { ...Typography.body, textAlign: 'center' },
  metadata: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  verification: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  metadataRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg },
  metadataLabel: { ...Typography.label, width: 96 },
  metadataValue: { ...Typography.bodySmall, flex: 1 },
  errorDetail: {
    alignSelf: 'stretch',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  errorLabel: { ...Typography.label },
  errorMessage: { ...Typography.bodySmall },
  note: { ...Typography.caption, textAlign: 'center' },
});

import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image as NativeImage,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Spacing, Typography } from '@/constants/theme';
import {
  MODEL_INPUT,
  MODEL_LABELS,
  MODEL_VERSION,
} from '@/features/detection/constants/modelContract';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import {
  preprocessImage,
  type PreprocessingResult,
} from '@/features/detection/preprocessing/preprocessImage';
import type { DetectionResult } from '@/features/detection/types';
import { useTheme } from '@/hooks/use-theme';

type Fixture = {
  id: 'healthy' | 'mosaic' | 'rust' | 'parity';
  buttonLabel: string;
  asset: number;
  width: number;
  height: number;
};

const FIXTURES: readonly Fixture[] = [
  {
    id: 'healthy',
    buttonLabel: 'Run Healthy Fixture',
    asset: require('../../assets/model-fixtures/healthy-reference.png') as number,
    width: 1536,
    height: 1024,
  },
  {
    id: 'mosaic',
    buttonLabel: 'Run Mosaic Fixture',
    asset: require('../../assets/images/sugarcane-diseases/reference_mosaic.jpg') as number,
    width: 4864,
    height: 3648,
  },
  {
    id: 'rust',
    buttonLabel: 'Run Rust Fixture',
    asset: require('../../assets/images/sugarcane-diseases/reference_rust.jpg') as number,
    width: 448,
    height: 800,
  },
  {
    id: 'parity',
    buttonLabel: 'Run Parity Reference',
    asset: require('../../assets/model-fixtures/parity-reference.jpg') as number,
    width: 1040,
    height: 780,
  },
];

type DebugRun = {
  fixtureId: Fixture['id'];
  preprocessing: PreprocessingResult;
  result: DetectionResult;
  rawOutput: number[];
};

export default function ModelDebugRoute() {
  if (!__DEV__) {
    return null;
  }

  return <ModelDebugScreen />;
}

function ModelDebugScreen() {
  const theme = useTheme();
  const modelState = useCaneGuardModel();
  const [activeFixtureId, setActiveFixtureId] =
    useState<Fixture['id'] | null>(null);
  const [debugRun, setDebugRun] = useState<DebugRun | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const runFixture = async (fixture: Fixture) => {
    if (activeFixtureId || modelState.state !== 'loaded') {
      return;
    }

    setActiveFixtureId(fixture.id);
    setLastError(null);

    try {
      const resolvedAsset = NativeImage.resolveAssetSource(fixture.asset);

      if (!resolvedAsset?.uri) {
        throw new Error(`Fixture ${fixture.id} did not resolve to a local URI.`);
      }

      const preprocessing = await preprocessImage(resolvedAsset.uri, {
        width: fixture.width,
        height: fixture.height,
      });
      let rawOutput: number[] = [];
      const result = await runInference(
        modelState,
        preprocessing.inputBuffer,
        preprocessing.preprocessMs,
        undefined,
        (values) => {
          rawOutput = [...values];
        },
      );

      setDebugRun({
        fixtureId: fixture.id,
        preprocessing,
        result,
        rawOutput,
      });
    } catch (error) {
      setDebugRun(null);
      setLastError(
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : `Unknown error: ${String(error)}`,
      );
    } finally {
      setActiveFixtureId(null);
    }
  };

  const displayedError =
    lastError ??
    (modelState.state === 'error'
      ? `${modelState.error.name}: ${modelState.error.message}`
      : 'None');

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScreenHeader title="Model v0 debug" />

      <AppCard style={styles.card}>
        <View style={styles.sectionHeading}>
          <Feather
            name={modelState.state === 'error' ? 'alert-triangle' : 'cpu'}
            size={20}
            color={
              modelState.state === 'error' ? theme.danger : theme.primary
            }
          />
          <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>
            Runtime contract
          </Text>
        </View>
        <DebugRow label="Load state" value={modelState.state} />
        <DebugRow label="Model version" value={MODEL_VERSION} />
        <DebugRow label="Label order" value={MODEL_LABELS.join(' → ')} />
        <DebugRow
          label="Expected input"
          value={MODEL_INPUT.shape.join(' × ')}
        />
        <DebugRow label="Input tensor type" value={MODEL_INPUT.dataType} />
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>
          Bundled fixtures
        </Text>
        <Text style={[styles.helper, { color: theme.textSecondary }]}>
          Each button runs preprocessing and the on-device model once.
        </Text>
        <View style={styles.fixtureButtons}>
          {FIXTURES.map((fixture) => (
            <AppButton
              key={fixture.id}
              variant="secondary"
              disabled={
                activeFixtureId !== null || modelState.state !== 'loaded'
              }
              onPress={() => {
                void runFixture(fixture);
              }}
              accessibilityLabel={fixture.buttonLabel}>
              {activeFixtureId === fixture.id
                ? `Running ${fixture.id}…`
                : fixture.buttonLabel}
            </AppButton>
          ))}
        </View>
        {activeFixtureId ? (
          <View accessibilityLiveRegion="polite" style={styles.running}>
            <ActivityIndicator
              accessibilityLabel={`Running ${activeFixtureId} fixture`}
              color={theme.primary}
            />
            <Text style={[styles.helper, { color: theme.textSecondary }]}>
              Preparing image and running inference…
            </Text>
          </View>
        ) : null}
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>
          Last run
        </Text>
        <DebugRow
          label="Fixture"
          value={debugRun?.fixtureId ?? 'Not run'}
        />
        <DebugRow
          label="Preprocess min / max / mean"
          value={
            debugRun
              ? `${formatNumber(debugRun.preprocessing.minValue)} / ${formatNumber(debugRun.preprocessing.maxValue)} / ${formatNumber(debugRun.preprocessing.meanValue)}`
              : 'Unavailable'
          }
        />
        <DebugRow
          label="Input byte length"
          value={
            debugRun
              ? String(debugRun.preprocessing.inputBuffer.byteLength)
              : 'Unavailable'
          }
        />
        <DebugRow
          label="Raw model output"
          value={
            debugRun
              ? `[${debugRun.rawOutput.map(formatScore).join(', ')}]`
              : 'Unavailable'
          }
        />
        <DebugRow
          label="Mapped class scores"
          value={
            debugRun
              ? debugRun.result.scores
                  .map(
                    ({ label, score }) => `${label}: ${formatScore(score)}`,
                  )
                  .join(' · ')
              : 'Unavailable'
          }
        />
        <DebugRow
          label="Top prediction"
          value={
            debugRun
              ? `${debugRun.result.predictedLabel} (${formatScore(debugRun.result.confidence)})`
              : 'Unavailable'
          }
        />
        <DebugRow
          label="Preprocessing time"
          value={
            debugRun
              ? `${Math.round(debugRun.result.timings.preprocessMs)} ms`
              : 'Unavailable'
          }
        />
        <DebugRow
          label="Inference time"
          value={
            debugRun
              ? `${Math.round(debugRun.result.timings.inferenceMs)} ms`
              : 'Unavailable'
          }
        />
        <DebugRow label="Last error" value={displayedError} danger />
      </AppCard>

      <Text style={[styles.releaseNote, { color: theme.textSecondary }]}>
        Development-only route. It is omitted from release navigation.
      </Text>
    </ScreenContainer>
  );
}

function DebugRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.debugRow, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.debugLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text
        selectable
        style={[
          styles.debugValue,
          { color: danger && value !== 'None' ? theme.danger : theme.text },
        ]}>
        {value}
      </Text>
    </View>
  );
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatScore(value: number): string {
  return value.toFixed(6);
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subheading,
  },
  helper: {
    ...Typography.caption,
  },
  fixtureButtons: {
    gap: Spacing.sm,
  },
  running: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  debugRow: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  debugLabel: {
    ...Typography.label,
  },
  debugValue: {
    ...Typography.bodySmall,
  },
  releaseNote: {
    ...Typography.caption,
    textAlign: 'center',
    paddingBottom: Spacing.lg,
  },
});

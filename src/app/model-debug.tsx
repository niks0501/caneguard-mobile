import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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
import { compareV1QaOutput } from '@/features/detection/model/v1Qa';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import {
  preprocessImage,
  type PreprocessingResult,
} from '@/features/detection/preprocessing/preprocessImage';
import type { DetectionResult } from '@/features/detection/types';
import { useTheme } from '@/hooks/use-theme';

type Fixture = {
  id: 'healthy' | 'mosaic' | 'rust' | 'smut';
  buttonLabel: string;
  asset: number;
  width: number;
  height: number;
};

const FIXTURES: readonly Fixture[] = [
  {
    id: 'healthy',
    buttonLabel: 'Run Healthy QA Fixture',
    asset: require('../../dev-assets/model-fixtures/v1-healthy.jpg') as number,
    width: 3000,
    height: 4000,
  },
  {
    id: 'mosaic',
    buttonLabel: 'Run Mosaic QA Fixture',
    asset: require('../../dev-assets/model-fixtures/v1-mosaic.jpg') as number,
    width: 1589,
    height: 2116,
  },
  {
    id: 'rust',
    buttonLabel: 'Run Rust QA Fixture',
    asset: require('../../dev-assets/model-fixtures/v1-rust.jpg') as number,
    width: 1454,
    height: 1936,
  },
  {
    id: 'smut',
    buttonLabel: 'Run Smut QA Fixture',
    asset: require('../../dev-assets/model-fixtures/v1-smut.jpg') as number,
    width: 3000,
    height: 4000,
  },
];

type DebugRun = {
  fixtureId: Fixture['id'];
  preprocessing: PreprocessingResult;
  result: DetectionResult;
  rawOutput: number[];
  parity: ReturnType<typeof compareV1QaOutput>;
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
  const startModelLoad = modelState.start;
  // Development harness: it works on the model itself, so it starts the load.
  useEffect(() => {
    startModelLoad();
  }, [startModelLoad]);
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
        parity: compareV1QaOutput(fixture.id, rawOutput),
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
      <ScreenHeader title="Model V1 debug" />

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
        <DebugRow
          label="Load state"
          value={modelState.state}
          testID="model-debug.load-state"
        />
        <DebugRow
          label="Model version"
          value={MODEL_VERSION}
          testID="model-debug.model-version"
        />
        <DebugRow
          label="Label order"
          value={MODEL_LABELS.join(' → ')}
          testID="model-debug.label-order"
        />
        <DebugRow
          label="Expected input"
          value={MODEL_INPUT.shape.join(' × ')}
          testID="model-debug.input-shape"
        />
        <DebugRow
          label="Input tensor type"
          value={MODEL_INPUT.dataType}
          testID="model-debug.input-type"
        />
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={[styles.sectionTitle, { color: theme.primaryDark }]}>
          Bundled fixtures
        </Text>
        <Text style={[styles.helper, { color: theme.textSecondary }]}>
          Each button runs the exact QA fixture through preprocessing and the on-device model once.
        </Text>
        <View style={styles.fixtureButtons}>
          {FIXTURES.map((fixture) => (
            <AppButton
              key={fixture.id}
              testID={`model-debug.run-${fixture.id}`}
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
          testID="model-debug.last-fixture"
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
          label="Letterbox geometry"
          value={
            debugRun
              ? `${debugRun.preprocessing.letterbox.resizedWidth} × ${debugRun.preprocessing.letterbox.resizedHeight}; pad left/top ${debugRun.preprocessing.letterbox.paddingLeft}/${debugRun.preprocessing.letterbox.paddingTop}`
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
          label="Expected QA top-1"
          value={debugRun ? debugRun.parity.expectedTop1Class : 'Unavailable'}
        />
        <DebugRow
          label="Actual QA top-1"
          value={debugRun ? debugRun.parity.actualTop1Class ?? 'Unavailable' : 'Unavailable'}
          testID="model-debug.actual-top1"
          danger={Boolean(debugRun && !debugRun.parity.top1Matches)}
        />
        <DebugRow
          label="QA score deltas (absolute)"
          value={
            debugRun
              ? debugRun.parity.scoreDeltas
                  .map(({ label, absoluteDelta }) => `${label}: ${formatScore(absoluteDelta)}`)
                  .join(' · ')
              : 'Unavailable'
          }
        />
        <DebugRow
          label="QA top-1 parity"
          value={debugRun ? (debugRun.parity.top1Matches ? 'PASS' : 'MISMATCH') : 'Unavailable'}
          testID="model-debug.qa-top1-parity"
          danger={Boolean(debugRun && !debugRun.parity.top1Matches)}
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
  testID,
  danger = false,
}: {
  label: string;
  value: string;
  testID?: string;
  danger?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.debugRow, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.debugLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text
        testID={testID}
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

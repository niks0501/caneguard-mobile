import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import {
  CaneGuardModelProvider,
  useCaneGuardModel,
} from '@/features/detection/model/useCaneGuardModel';
import { MODEL_CONTRACTS } from '@/features/detection/constants/modelContract';
import { runModelInference } from '@/features/detection/model/runInference';
import {
  compareV2Parity,
  manifestMatchesModel,
  type V2ParityManifest,
  type V2ParityResult,
} from '@/features/detection/model/v2Parity';
import { createInputTensor } from '@/features/detection/preprocessing/createInputTensor';
import { decodePng } from '@/features/detection/preprocessing/decodePng';
import { useTheme } from '@/hooks/use-theme';

const MANIFEST = require('../../../../dev-assets/model-fixtures/v2-parity/manifest.json') as V2ParityManifest;
const FIXTURES: Record<string, number> = {
  'CG-HLT-FLD-S007-P001-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-HLT-FLD-S007-P001-I001.png'),
  'CG-HLT-FLD-S007-P005-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-HLT-FLD-S007-P005-I001.png'),
  'CG-MOS-FLD-S007-P001-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-MOS-FLD-S007-P001-I001.png'),
  'CG-MOS-FLD-S007-P006-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-MOS-FLD-S007-P006-I001.png'),
  'CG-RSSI-FLD-S007-P001-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-RSSI-FLD-S007-P001-I001.png'),
  'CG-RSSI-FLD-S007-P003-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-RSSI-FLD-S007-P003-I001.png'),
  'CG-RST-FLD-S007-P001-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-RST-FLD-S007-P001-I001.png'),
  'CG-RST-ONL-S001-P180-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-RST-ONL-S001-P180-I001.png'),
  'CG-SMT-FLD-S007-P001-I001': require('../../../../dev-assets/model-fixtures/v2-parity/CG-SMT-FLD-S007-P001-I001.png'),
};

type PanelState =
  | { state: 'running' }
  | { state: 'error'; message: string }
  | { state: 'done'; results: V2ParityResult[]; manifestShaMatches: boolean };

/**
 * Developer-only V2 parity run. Loads Model V2 through its own provider (the
 * live scan flow stays on its active model), decodes each PNG straight to RGB
 * (no resize, JPEG re-encode or normalization) and compares all five outputs
 * with the manifest's recorded TFLite probabilities.
 */
export function ModelV2ParityPanel() {
  return (
    <CaneGuardModelProvider modelId="v2">
      <ParityRunner />
    </CaneGuardModelProvider>
  );
}

function ParityRunner() {
  const theme = useTheme();
  const modelState = useCaneGuardModel();
  const startModelLoad = modelState.start;
  const [panel, setPanel] = useState<PanelState>({ state: 'running' });

  useEffect(() => {
    startModelLoad();
  }, [startModelLoad]);

  useEffect(() => {
    if (modelState.state !== 'loaded') {
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const results: V2ParityResult[] = [];
        for (const example of MANIFEST.examples) {
          const asset = Asset.fromModule(FIXTURES[example.image_id]);
          await asset.downloadAsync();
          if (!asset.localUri) {
            throw new Error(`${example.image_id} has no local URI.`);
          }
          const png = decodePng(
            new Uint8Array(await new File(asset.localUri).arrayBuffer()),
          );
          const tensor = createInputTensor(png.rgb, png.width, png.height);
          const output = await runModelInference(
            modelState,
            tensor.inputBuffer,
            0,
            MODEL_CONTRACTS.v2,
          );
          results.push(compareV2Parity(example, output.rawOutput));
        }
        if (!cancelled) {
          setPanel({
            state: 'done',
            results,
            manifestShaMatches: manifestMatchesModel(MANIFEST),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setPanel({
            state: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [modelState]);

  if (modelState.state === 'error') {
    return <Text selectable style={[styles.line, { color: theme.danger }]}>V2 model error: {modelState.error.message}</Text>;
  }
  if (panel.state === 'running') {
    return <Text style={[styles.line, { color: theme.textSecondary }]}>Running V2 parity…</Text>;
  }
  if (panel.state === 'error') {
    return <Text selectable style={[styles.line, { color: theme.danger }]}>V2 parity error: {panel.message}</Text>;
  }

  const failed = panel.results.filter((result) => !result.pass).length;
  return (
    <View style={styles.panel}>
      <Text style={[styles.heading, { color: failed === 0 && panel.manifestShaMatches ? theme.success : theme.danger }]}>
        {failed === 0 && panel.manifestShaMatches
          ? 'Model V2 parity passed (9/9)'
          : `Model V2 parity failed (${failed} of ${panel.results.length})`}
      </Text>
      <Text style={[styles.line, { color: theme.textSecondary }]}>
        Manifest SHA-256 matches bundled V2: {panel.manifestShaMatches ? 'yes' : 'no'}
      </Text>
      {panel.results.map((result) => (
        <Text key={result.imageId} selectable style={[styles.line, { color: result.pass ? theme.text : theme.danger }]}>
          {`${result.pass ? 'PASS' : 'FAIL'} ${result.imageId} · expert ${result.expertLabel} · recorded ${result.recordedPrediction} · actual ${result.actualTop} · max Δ ${result.maxAbsoluteDifference.toFixed(6)}`}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignSelf: 'stretch', gap: Spacing.sm },
  heading: { ...Typography.heading },
  line: { ...Typography.bodySmall },
});

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import manifest from '../../../../../dev-assets/model-fixtures/v2-parity/manifest.json';
import preprocessing from '../../../../../assets/models/preprocessing.json';
import {
  ACTIVE_MODEL,
  MODEL_CONTRACTS,
  MODEL_V2_LABELS,
  MODEL_V2_SHA256,
} from '@/features/detection/constants/modelContract';
import { postprocessOutput } from '@/features/detection/model/postprocessOutput';
import { runInference, runModelInference } from '@/features/detection/model/runInference';
import { validateModelContract } from '@/features/detection/model/validateModelContract';
import {
  compareV2Parity,
  manifestMatchesModel,
  type V2ParityManifest,
} from '@/features/detection/model/v2Parity';
import { letterboxRgbPixels } from '@/features/detection/preprocessing/letterboxRgbPixels';

const MODELS = join(__dirname, '../../../../../assets/models');
const v2 = MODEL_CONTRACTS.v2;

function floatBuffer(values: number[]): ArrayBuffer {
  return new Float32Array(values).buffer;
}

describe('Model V2 contract', () => {
  it('binds the bundled artifact to the hash in preprocessing.json and the parity manifest', () => {
    const digest = createHash('sha256')
      .update(readFileSync(join(MODELS, 'caneguard_v2.tflite')))
      .digest('hex');
    expect(digest).toBe(MODEL_V2_SHA256);
    expect(preprocessing.tflite_sha256).toBe(MODEL_V2_SHA256);
    expect(manifestMatchesModel(manifest as V2ParityManifest)).toBe(true);
  });

  it('keeps the labels.txt order with lowercase identifiers', () => {
    const labels = readFileSync(join(MODELS, 'labels.txt'), 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map((label) => label.toLowerCase());
    expect([...MODEL_V2_LABELS]).toEqual(labels);
    expect([...MODEL_V2_LABELS]).toEqual(preprocessing.classes.map((c) => c.toLowerCase()));
  });

  it('matches preprocessing.json: float32 RGB 0-255, black padding, no external normalization', () => {
    expect(v2.input.shape).toEqual(preprocessing.input_shape);
    expect(v2.input.dataType).toBe(preprocessing.input_dtype);
    expect([...v2.input.mobileValueRange]).toEqual(preprocessing.input_range);
    expect(v2.input.letterboxValue).toBe(0);
    expect(preprocessing.external_normalization).toBe(false);
    expect(v2.output.shape).toEqual([1, 5]);
  });

  it('points the live scan flow at V2 while V1 stays registered for rollback', () => {
    expect(ACTIVE_MODEL.id).toBe('v2');
    expect(MODEL_CONTRACTS.v1.filename).toBe('caneguard_v1_mobilenetv2_float32.tflite');
  });

  it('validates V2 tensors and rejects V1 tensors against the V2 contract', () => {
    const v2Tensors = {
      inputs: [{ name: v2.input.name, dataType: 'float32', shape: [1, 224, 224, 3] }],
      outputs: [{ name: v2.output.name, dataType: 'float32', shape: [1, 5] }],
    };
    expect(validateModelContract(v2Tensors, v2)).toBeNull();
    expect(validateModelContract(v2Tensors, MODEL_CONTRACTS.v1)?.code).toBe(
      'MODEL_CONTRACT_MISMATCH',
    );
  });
});

describe('Model V2 output handling', () => {
  it('maps five probabilities in Healthy, Mosaic, Rust, Smut, RSSI order without re-applying softmax', () => {
    const probabilities = [0.1, 0.2, 0.05, 0.05, 0.6];
    const result = postprocessOutput(floatBuffer(probabilities), v2);
    expect(result.predictedLabel).toBe('rssi');
    expect(result.scores.map((s) => s.label)).toEqual(['rssi', 'mosaic', 'healthy', 'rust', 'smut']);
    expect(result.scores[0].score).toBeCloseTo(0.6, 6);
  });

  it('rejects a four-value buffer for V2', () => {
    expect(() => postprocessOutput(floatBuffer([0.25, 0.25, 0.25, 0.25]), v2)).toThrow(
      /Expected 20 output bytes/,
    );
  });

  it('runs model-layer inference with the V2 input size and returns the raw outputs', async () => {
    const raw = [0.7, 0.1, 0.1, 0.05, 0.05];
    const model = { run: jest.fn().mockResolvedValue([floatBuffer(raw)]) };
    const output = await runModelInference(model, new ArrayBuffer(602_112), 0, v2);
    expect(output.predictedLabel).toBe('healthy');
    expect(output.rawOutput).toHaveLength(5);
    await expect(runModelInference(model, new ArrayBuffer(10), 0, v2)).rejects.toThrow(/input bytes/);
  });
});

describe('V2 parity comparison', () => {
  const example = (manifest as V2ParityManifest).examples[0];

  it('passes recorded probabilities and flags top-class or >0.01 differences', () => {
    expect(compareV2Parity(example, example.tflite_probabilities).pass).toBe(true);
    const shifted = [...example.tflite_probabilities];
    shifted[0] -= 0.02;
    shifted[4] += 0.02;
    expect(compareV2Parity(example, shifted).pass).toBe(false);
    expect(compareV2Parity(example, [0, 1, 0, 0, 0]).topMatches).toBe(false);
    expect(compareV2Parity(example, [1, 0, 0, 0]).pass).toBe(false);
  });

  it('covers nine examples including the recorded predictions that differ from expert labels', () => {
    const examples = (manifest as V2ParityManifest).examples;
    expect(examples).toHaveLength(9);
    expect(examples.filter((e) => e.class_name !== e.predicted_class)).toHaveLength(4);
  });
});

describe('V2 letterbox padding', () => {
  it('pads with black 0 by default (V2) and 127.5 when the V1 value is passed', () => {
    const source = new Uint8Array([10, 20, 30, 40, 50, 60]);
    const black = letterboxRgbPixels(source, 2, 1, v2.input.letterboxValue);
    expect(black.pixels[0]).toBe(0);
    expect(Array.from(black.pixels.slice((111 * 224 + 111) * 3, (111 * 224 + 111) * 3 + 6))).toEqual([10, 20, 30, 40, 50, 60]);
    expect(letterboxRgbPixels(source, 2, 1).pixels[0]).toBe(0);
    expect(letterboxRgbPixels(source, 2, 1, MODEL_CONTRACTS.v1.input.letterboxValue).pixels[0]).toBe(127.5);
  });
});

describe('Live scan flow on V2', () => {
  it('runs the active V2 contract and drops a non-top RSSI score and errors when RSSI is the top class', async () => {
    const run = (values: number[]) =>
      runInference({ run: jest.fn().mockResolvedValue([floatBuffer(values)]) }, new ArrayBuffer(602_112), 0);
    const ok = await run([0.7, 0.1, 0.1, 0.05, 0.05]);
    expect(ok.predictedLabel).toBe('healthy');
    expect(ok.modelVersion).toBe('v2.0-mobilenetv2');
    expect(ok.scores.map((s) => s.label)).toEqual(['healthy', 'mosaic', 'rust', 'smut']);
    expect(ok.confidence).toBeCloseTo(0.7, 6);
    expect(ok.scores[1].score).toBeCloseTo(0.1, 6);
    await expect(run([0.1, 0.1, 0.1, 0.1, 0.6])).rejects.toMatchObject({ code: 'LABEL_MAPPING_FAILED' });
  });
});

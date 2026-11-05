import { render } from '@testing-library/react-native';
import { useEffect } from 'react';

import { runInference } from '@/features/detection/model/runInference';
import {
  CaneGuardModelProvider,
  useCaneGuardModel,
} from '@/features/detection/model/useCaneGuardModel.web';

const INPUT_BYTE_LENGTH = 602_112;
const ORIGINAL_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type ModelRun = (input: ArrayBuffer[]) => Promise<ArrayBuffer[]>;

let capturedRun: ModelRun | null = null;

function ValidationProbe() {
  const modelState = useCaneGuardModel();

  useEffect(() => {
    capturedRun = modelState.run;
  }, [modelState.run]);

  return null;
}

async function runValidationStub(): Promise<ArrayBuffer[]> {
  await render(
    <CaneGuardModelProvider>
      <ValidationProbe />
    </CaneGuardModelProvider>,
  );

  if (!capturedRun) {
    throw new Error('The validation stub did not expose a run function.');
  }

  return capturedRun([new ArrayBuffer(INPUT_BYTE_LENGTH)]);
}

describe('web validation model stub', () => {
  beforeEach(() => {
    capturedRun = null;
    process.env.EXPO_PUBLIC_WEB_VALIDATION = '1';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:8210';
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_WEB_VALIDATION;
    delete process.env.EXPO_PUBLIC_WEB_VALIDATION_CONFIDENCE;
    if (ORIGINAL_API_BASE_URL === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = ORIGINAL_API_BASE_URL;
    }
  });

  it('produces a deterministic output the live scan flow can analyze on the browser route', async () => {
    const outputBuffers = await runValidationStub();

    const result = await runInference(
      { run: async () => outputBuffers },
      new ArrayBuffer(INPUT_BYTE_LENGTH),
      0,
    );

    expect(result.predictedLabel).toBe('rust');
    expect(result.scores).toHaveLength(4);
  });

  // Proves: the validation-only browser model can exercise both sides of a confidence cutoff without changing native inference.
  it('accepts a validation-only confidence override for above-cutoff browser checks', async () => {
    process.env.EXPO_PUBLIC_WEB_VALIDATION_CONFIDENCE = '0.9';
    const outputBuffers = await runValidationStub();
    const result = await runInference(
      { run: async () => outputBuffers },
      new ArrayBuffer(INPUT_BYTE_LENGTH),
      0,
    );

    expect(result.confidence).toBeCloseTo(0.9, 6);
  });

  it('stays fail-closed without the validation runtime', async () => {
    delete process.env.EXPO_PUBLIC_WEB_VALIDATION;

    await expect(runValidationStub()).rejects.toMatchObject({
      code: 'MODEL_LOAD_FAILED',
    });
  });
});

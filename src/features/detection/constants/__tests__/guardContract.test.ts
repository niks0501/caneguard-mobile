import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import {
  ACTIVE_MODEL_ID,
  MODEL_V2_LABELS,
  MODEL_V2_VERSION,
} from '@/features/detection/constants/modelContract';

const contract = JSON.parse(
  readFileSync(join(process.cwd(), 'assets/models/caneguard_guard_v1_contract.json'), 'utf8'),
);

describe('Guard V1 constants', () => {
  // Proves: the in-app guard constants match the frozen identity, tensor shapes and dtypes, threshold, and checksum.
  it('mirror the frozen contract JSON', () => {
    expect(GUARD_V1.sha256).toBe(contract.tflite_sha256);
    expect([...GUARD_V1.input.shape]).toEqual(contract.input.shape);
    expect(GUARD_V1.input.dataType).toBe(contract.input.dtype);
    expect([...GUARD_V1.output.shape]).toEqual(contract.output.shape);
    expect(GUARD_V1.output.dataType).toBe(contract.output.dtype);
    expect(GUARD_V1.acceptThreshold).toBe(contract.decision.accept_if_p_sugarcane_at_least);
    expect(GUARD_V1.modelId).toBe(contract.model_id);
  });

  // Proves: the guard tensor is 602112 bytes (float32 224 x 224 x 3).
  it('pins the guard tensor at 602112 bytes', () => {
    expect(GUARD_V1.inputByteLength).toBe(602112);
  });

  // Proves: the V2 contract (active model, version, five labels) is untouched.
  it('leaves the V2 contract alone', () => {
    expect(ACTIVE_MODEL_ID).toBe('v2');
    expect(MODEL_V2_VERSION).toBe('v2.0-mobilenetv2');
    expect([...MODEL_V2_LABELS]).toEqual(['healthy', 'mosaic', 'rust', 'smut', 'rssi']);
  });
});

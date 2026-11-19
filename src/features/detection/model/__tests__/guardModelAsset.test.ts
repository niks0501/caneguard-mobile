import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';

// The binary is delivered privately and Git-ignored. Clean clones skip this suite;
// wherever the file is supplied the Python oracle must really execute.
const hasBinary = existsSync(join(process.cwd(), 'assets/models', GUARD_V1.filename));
const itWithBinary = hasBinary ? it : it.skip;

describe('private Guard V1 binary', () => {
  // Proves: the real binary passes SHA, tensor ABI and the executed independent reference oracle (numpy, Pillow and a TFLite interpreter required; a skipped oracle fails).
  itWithBinary('is verified by the host Python check', () => {
    const run = spawnSync('python3', [join(process.cwd(), 'scripts/tests/test_guard_v1_model.py')], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(run.status).toBe(0);
    expect(run.stderr).toMatch(/\nOK/);
    expect(run.stderr).not.toMatch(/skipped=/);
  });
});

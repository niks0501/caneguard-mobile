import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';

describe('bundled Guard V1 binary', () => {
  // Proves: the binary is bundled, and passes SHA, tensor ABI and the executed independent reference oracle (numpy, Pillow and a TFLite interpreter required; a skipped oracle fails).
  it('is present and verified by the host Python check', () => {
    expect(existsSync(join(process.cwd(), 'assets/models', GUARD_V1.filename))).toBe(true);
    const run = spawnSync('python3', [join(process.cwd(), 'scripts/tests/test_guard_v1_model.py')], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    expect(run.status).toBe(0);
    expect(run.stderr).toMatch(/\nOK/);
    expect(run.stderr).not.toMatch(/skipped=/);
  });
});

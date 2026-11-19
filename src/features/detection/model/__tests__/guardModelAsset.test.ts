import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';

describe('bundled Guard V1 binary', () => {
  it('is bundled as a non-empty asset', () => {
    const path = join(process.cwd(), 'assets/models', GUARD_V1.filename);
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(0);
  });
});

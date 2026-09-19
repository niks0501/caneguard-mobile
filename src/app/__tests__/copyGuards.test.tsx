import fs from 'fs';
import path from 'path';

describe('Copy regression guards', () => {
  const appDir = path.resolve(__dirname, '..');
  const devRouteAllowlist = new Set([
    'model-debug.tsx',
    'model-smoke-test.tsx',
    'storage-debug.tsx',
  ]);

  const files = fs
    .readdirSync(appDir)
    .filter(
      (file) =>
        file.endsWith('.tsx') &&
        !devRouteAllowlist.has(file) &&
        !file.startsWith('_'),
    );

  it('forbids internal licensing, asset provenance, and fixture copy in user-facing screens', () => {
    // Patterns that must never appear in user-facing copy
    const forbiddenPatterns = [
      /license evidence/i,
      /licence evidence/i,
      /photo supplied/i,
      /pending asset/i,
      /pattern description only/i,
      /Model V1 class/i,
      /four Model V1 classes/i,
    ];

    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(appDir, file), 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Skip code comments if any
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return;
        }

        for (const pattern of forbiddenPatterns) {
          if (pattern.test(line)) {
            violations.push(`${file}:${idx + 1} matches forbidden pattern ${pattern}: "${trimmed}"`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('guarantees referenceMedia does not ship unverified fixture imagery', () => {
    const referenceMediaPath = path.resolve(
      __dirname,
      '../../features/detection/constants/referenceMedia.ts',
    );
    const content = fs.readFileSync(referenceMediaPath, 'utf8');

    // Smut must not be wired to unverified model fixture photo without recorded provenance
    expect(content).not.toMatch(/v1-smut\.jpg/);
  });
});

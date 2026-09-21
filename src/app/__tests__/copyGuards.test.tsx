import fs from 'fs';
import path from 'path';

import { DECISION_SUPPORT_DISCLAIMER } from '@/constants/copy';

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

  it('keeps the retired decision-support variants from coming back', () => {
    // The five near-copy disclaimers collapsed into DECISION_SUPPORT_DISCLAIMER.
    const retiredPatterns = [
      /should not replace expert validation/i,
      /This output is for decision support only/i,
      /This stored Possible Condition is decision support only/i,
      /Decision support only — not a diagnosis/i,
    ];

    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(appDir, file), 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return;
        }
        for (const pattern of retiredPatterns) {
          if (pattern.test(line)) {
            violations.push(`${file}:${idx + 1} retired disclaimer variant: "${trimmed}"`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('keeps disclosure titles specific instead of a bare Technical details', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(appDir, file), 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('title="Technical details"')) {
          violations.push(`${file}:${idx + 1} bare Technical details title`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('defines the decision-support sentence exactly once in the app source', () => {
    const srcDir = path.resolve(__dirname, '..', '..');
    const sourceFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
            walk(fullPath);
          }
        } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
          sourceFiles.push(fullPath);
        }
      }
    };
    walk(srcDir);

    let occurrences = 0;
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      occurrences += content.split(DECISION_SUPPORT_DISCLAIMER).length - 1;
    }

    // Exactly once: the definition in src/constants/copy.ts. Every screen
    // imports the constant instead of repeating the string.
    expect(occurrences).toEqual(1);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { assertGuardArtifact } from '@/features/detection/model/guardArtifact';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: async (_algorithm: string, data: ArrayBuffer) => {
    const { createHash } = jest.requireActual('node:crypto') as typeof import('node:crypto');
    const hash = createHash('sha256').update(new Uint8Array(data)).digest();
    return hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength);
  },
}));

const binary = readFileSync(join(process.cwd(), 'assets/models/caneguard_guard_v1_float32.tflite'));
const toBuffer = (bytes: Uint8Array) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

describe('assertGuardArtifact', () => {
  // Proves: the bundled binary is the frozen Guard V1 artifact (pinned SHA-256).
  it('accepts the bundled binary', async () => {
    await expect(assertGuardArtifact(toBuffer(binary))).resolves.toBeUndefined();
  });

  // Proves: any other bytes (a different checkpoint under the same name, an empty or truncated file) are refused before load.
  it.each([['empty', Buffer.alloc(0)], ['arbitrary', Buffer.from('not the guard model')]])(
    'refuses %s bytes',
    async (_name, bytes) => {
      await expect(assertGuardArtifact(toBuffer(bytes))).rejects.toMatchObject({
        code: 'GUARD_ARTIFACT_MISMATCH',
      });
    },
  );

  // Proves: even one flipped byte of the real binary is refused.
  it('refuses a changed binary', async () => {
    const altered = Uint8Array.from(binary);
    altered[altered.length - 1] ^= 0xff;
    await expect(assertGuardArtifact(toBuffer(altered))).rejects.toMatchObject({
      code: 'GUARD_ARTIFACT_MISMATCH',
    });
  });
});

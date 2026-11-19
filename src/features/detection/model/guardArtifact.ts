import { CryptoDigestAlgorithm, digest } from 'expo-crypto';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { GuardError } from '@/features/detection/model/guardInference';

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Refuses any binary whose SHA-256 is not the frozen Guard V1 artifact. */
export async function assertGuardArtifact(bytes: ArrayBuffer): Promise<void> {
  const actual = toHex(await digest(CryptoDigestAlgorithm.SHA256, bytes));
  if (actual !== GUARD_V1.sha256) {
    throw new GuardError(
      'GUARD_ARTIFACT_MISMATCH',
      `The bundled guard model is not the frozen Guard V1 artifact (SHA-256 ${actual}).`,
    );
  }
}

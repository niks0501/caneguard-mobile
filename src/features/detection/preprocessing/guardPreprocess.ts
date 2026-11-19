import { toByteArray } from 'base64-js';
import { Directory, File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import { GuardError } from '@/features/detection/model/guardInference';
import { createInputTensor } from '@/features/detection/preprocessing/createInputTensor';
import { decodePng } from '@/features/detection/preprocessing/decodePng';

const [, GUARD_HEIGHT, GUARD_WIDTH] = GUARD_V1.input.shape;

export function cleanupGuardScratchFiles(): void {
  try {
    const directory = new Directory(Paths.cache, 'ImageManipulator');
    if (!directory.exists) return;
    for (const entry of directory.list()) {
      if (entry instanceof File && entry.name.toLowerCase().endsWith('.png')) {
        entry.delete();
      }
    }
  } catch {
    return;
  }
}

/**
 * Decodes the 224 x 224 PNG the manipulator produced into the guard tensor:
 * float32 RGB, raw 0..255 values (the graph normalizes internally), 602112 bytes.
 */
export function guardTensorFromPng(base64: string): ArrayBuffer {
  if (!base64) {
    throw new GuardError('GUARD_INPUT_INVALID', 'The image manipulator did not return PNG data.');
  }
  const decoded = decodePng(toByteArray(base64));
  if (decoded.width !== GUARD_WIDTH || decoded.height !== GUARD_HEIGHT) {
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `Guard direct resize produced ${decoded.width} x ${decoded.height}, expected ${GUARD_WIDTH} x ${GUARD_HEIGHT}.`,
    );
  }
  const { inputBuffer } = createInputTensor(decoded.rgb, GUARD_WIDTH, GUARD_HEIGHT);
  if (inputBuffer.byteLength !== GUARD_V1.inputByteLength) {
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `Guard tensor is ${inputBuffer.byteLength} bytes, expected ${GUARD_V1.inputByteLength}.`,
    );
  }
  return inputBuffer;
}

/**
 * Guard-only preprocessing from the SAME source photo the V2 path reads. The
 * manipulator applies the EXIF orientation, then one resize action with both
 * dimensions set stretches the whole frame to 224 x 224 (bilinear): no letterbox,
 * padding or crop, and the V2 tensor is never reused. The lossless scratch PNG the
 * manipulator writes is deleted as soon as the pixels are read.
 */
export async function preprocessGuardImage(sourceUri: string): Promise<ArrayBuffer> {
  if (!sourceUri.trim()) {
    throw new GuardError('GUARD_INPUT_INVALID', 'A source image URI is required for the guard.');
  }
  let scratchUri: string | undefined;
  cleanupGuardScratchFiles();
  try {
    const stretched = await manipulateAsync(
      sourceUri,
      [{ resize: { width: GUARD_WIDTH, height: GUARD_HEIGHT } }],
      { base64: true, format: SaveFormat.PNG },
    );
    scratchUri = stretched.uri;
    return guardTensorFromPng(stretched.base64 ?? '');
  } catch (error) {
    if (error instanceof GuardError) throw error;
    throw new GuardError(
      'GUARD_INPUT_INVALID',
      `The guard could not prepare the photo: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  } finally {
    if (scratchUri) {
      try {
        new File(scratchUri).delete();
      } catch {
        // Best effort: the cache directory is evicted by the OS regardless.
      }
    }
  }
}

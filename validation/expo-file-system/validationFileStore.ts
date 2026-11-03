/**
 * Validation-only file registry for the browser route.
 *
 * A browser has no usable `expo-file-system`, so the validation stand-in keeps
 * the small set of scan images a run needs in memory and publishes newly
 * captured images to the local stub API. Nothing here is product storage: the
 * registry only holds validation images, and the stub keeps uploads in memory
 * only. Metadata is remembered in this browser profile so a reload can still
 * find a published image.
 */

export interface ValidationFileEntry {
  bytes: Uint8Array | null;
  mimeType: string | null;
  sizeBytes: number;
}

const STORAGE_KEY = 'caneguard.web-validation.files';
const files = new Map<string, ValidationFileEntry>();

function readStoredMetadata(): Record<
  string,
  { mimeType?: string | null; sizeBytes?: number }
> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw
      ? (JSON.parse(raw) as Record<
          string,
          { mimeType?: string | null; sizeBytes?: number }
        >)
      : {};
  } catch {
    return {};
  }
}

function writeStoredMetadata(): void {
  try {
    const metadata = Object.fromEntries(
      [...files.entries()].map(([uri, entry]) => [
        uri,
        { mimeType: entry.mimeType, sizeBytes: entry.sizeBytes },
      ]),
    );
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(metadata));
  } catch {
    // The in-memory registry is still enough for the current page.
  }
}

// The server keeps uploaded images for the life of the validation run, so the
// metadata alone is enough to find them again after a page reload.
for (const [uri, metadata] of Object.entries(readStoredMetadata())) {
  files.set(uri, {
    bytes: null,
    mimeType: metadata.mimeType ?? null,
    sizeBytes: metadata.sizeBytes ?? 0,
  });
}

export function registerValidationFile(
  uri: string,
  entry: {
    bytes?: Uint8Array | null;
    mimeType?: string | null;
    sizeBytes?: number;
  },
): void {
  files.set(uri, {
    bytes: entry.bytes ?? null,
    mimeType: entry.mimeType ?? null,
    sizeBytes: entry.sizeBytes ?? entry.bytes?.byteLength ?? 0,
  });
  writeStoredMetadata();
}

export function hasValidationFile(uri: string): boolean {
  return files.has(uri);
}

export function readValidationFile(uri: string): ValidationFileEntry | null {
  return files.get(uri) ?? null;
}

export function forgetValidationFile(uri: string): void {
  files.delete(uri);
  writeStoredMetadata();
}

export function listValidationFileUris(): string[] {
  return [...files.keys()];
}

function detectImageMimeType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Stores bytes for a managed URI and, when the URI is served by the stub,
 * publishes the same bytes there so the browser can render the image after a
 * reload. A publishing failure keeps the in-memory copy and is reported so the
 * caller can decide whether it is fatal.
 */
export async function persistValidationFile(
  uri: string,
  bytes: Uint8Array,
  mimeType: string | null,
  publish: (uri: string, bytes: Uint8Array, mimeType: string | null) => Promise<void>,
): Promise<ValidationFileEntry> {
  const normalizedMimeType = mimeType ?? detectImageMimeType(bytes);
  const entry: ValidationFileEntry = {
    bytes,
    mimeType: normalizedMimeType,
    sizeBytes: bytes.byteLength,
  };
  files.set(uri, entry);
  writeStoredMetadata();
  await publish(uri, bytes, normalizedMimeType);
  return entry;
}

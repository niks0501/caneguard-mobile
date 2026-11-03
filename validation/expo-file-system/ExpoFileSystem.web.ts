/**
 * Validation-only stand-in for `expo-file-system`'s web module.
 *
 * `expo-file-system` has no web implementation, so a browser cannot preserve a
 * scan image or a draft checkpoint. This module exists only for the browser
 * validation route (`npm run web:validate`) and is selected by the same Metro
 * gate as the secure-store stand-in: web platform only, requires
 * `EXPO_PUBLIC_WEB_VALIDATION=1`, only against the fixed stub base URL, and
 * never for a release build (`scripts/web-validation-config.js`).
 *
 * It keeps scan images in a small in-memory registry and mirrors newly captured
 * images to the local stub API so the browser can render them after a reload.
 * Seeded checks resolve to repository fixtures served by the stub. Nothing here
 * touches a real file system, a real API, or a real account.
 */

import {
  forgetValidationFile,
  hasValidationFile,
  listValidationFileUris,
  persistValidationFile,
  readValidationFile,
  registerValidationFile,
} from './validationFileStore';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

if (process.env.EXPO_PUBLIC_WEB_VALIDATION !== '1') {
  throw new Error(
    'The file-system stand-in is validation-only and requires EXPO_PUBLIC_WEB_VALIDATION=1.',
  );
}

const MANAGED_ROOT = `${API_BASE_URL}/caneguard`;

function isManagedPath(uri: string): boolean {
  return uri.startsWith(`${MANAGED_ROOT}/`);
}

function isExternalSource(uri: string): boolean {
  return /^(?:blob:|data:|https?:)/i.test(uri);
}

async function publishToStub(
  uri: string,
  bytes: Uint8Array,
  mimeType: string | null,
): Promise<void> {
  if (!API_BASE_URL || !isManagedPath(uri)) {
    return;
  }
  const pathname = new URL(uri).pathname;
  const publishUrl = new URL('/__validation__/files', API_BASE_URL);
  publishUrl.searchParams.set('path', pathname);
  const response = await fetch(publishUrl.toString(), {
    body: bytes,
    headers: {
      'Content-Type': mimeType ?? 'application/octet-stream',
    },
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error(`The validation image could not be published (${response.status}).`);
  }
}

class FileSystemFile {
  uri: string;

  constructor(uri = '') {
    this.uri = uri;
  }

  get exists(): boolean {
    if (hasValidationFile(this.uri)) {
      return true;
    }
    // A picker returns a browser URL (blob:, data:) that is readable now but is
    // not part of the managed registry until it is copied.
    return isExternalSource(this.uri) && !isManagedPath(this.uri);
  }

  get size(): number {
    return readValidationFile(this.uri)?.sizeBytes ?? 0;
  }

  get type(): string | null {
    return readValidationFile(this.uri)?.mimeType ?? null;
  }

  validatePath(): void {}

  info(): {
    creationTime: number;
    exists: boolean;
    isDirectory: boolean;
    modificationTime: number;
    size: number;
    uri: string;
  } {
    return {
      creationTime: 0,
      exists: this.exists,
      isDirectory: false,
      modificationTime: 0,
      size: this.size,
      uri: this.uri,
    };
  }

  async copy(
    destination: FileSystemFile | string,
    options: { overwrite?: boolean } = {},
  ): Promise<void> {
    const destinationUri =
      typeof destination === 'string' ? destination : destination.uri;
    if (hasValidationFile(destinationUri) && !options.overwrite) {
      throw new Error('The destination file already exists.');
    }

    const current = readValidationFile(this.uri);
    let bytes = current?.bytes ?? null;
    let mimeType = current?.mimeType ?? null;
    if (!bytes) {
      const response = await fetch(this.uri);
      if (!response.ok) {
        throw new Error(`The source file could not be read (${response.status}).`);
      }
      bytes = new Uint8Array(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') ?? mimeType;
    }

    await persistValidationFile(destinationUri, bytes, mimeType, publishToStub);
  }

  async move(destination: FileSystemFile | string): Promise<void> {
    await this.copy(destination, { overwrite: true });
    forgetValidationFile(this.uri);
  }

  delete(): void {
    forgetValidationFile(this.uri);
  }

  async text(): Promise<string> {
    const bytes = readValidationFile(this.uri)?.bytes;
    return bytes ? new TextDecoder().decode(bytes) : '';
  }

  async bytes(): Promise<Uint8Array> {
    return readValidationFile(this.uri)?.bytes ?? new Uint8Array();
  }

  async base64(): Promise<string> {
    const bytes = await this.bytes();
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  create(): this {
    registerValidationFile(this.uri, { sizeBytes: 0 });
    return this;
  }
}

class FileSystemDirectory {
  uri: string;

  constructor(uri = '') {
    this.uri = uri;
  }

  get exists(): boolean {
    return true;
  }

  validatePath(): void {}

  create(_options?: { idempotent?: boolean; intermediates?: boolean }): this {
    return this;
  }

  createFile(name: string, mimeType: string | null): FileSystemFile {
    const file = new FileSystemFile(`${this.uri}/${name}`);
    registerValidationFile(file.uri, { mimeType, sizeBytes: 0 });
    return file;
  }

  createDirectory(name: string): FileSystemDirectory {
    return new FileSystemDirectory(`${this.uri}/${name}`);
  }

  listAsRecords(): { isDirectory: boolean; uri: string }[] {
    const prefix = this.uri.endsWith('/') ? this.uri : `${this.uri}/`;
    return listValidationFileUris()
      .filter((uri) => uri.startsWith(prefix))
      .map((uri) => ({ isDirectory: false, uri }));
  }

  info(): {
    creationTime: number;
    exists: boolean;
    isDirectory: boolean;
    modificationTime: number;
    size: number;
    uri: string;
  } {
    return {
      creationTime: 0,
      exists: true,
      isDirectory: true,
      modificationTime: 0,
      size: 0,
      uri: this.uri,
    };
  }

  delete(): void {
    const prefix = this.uri.endsWith('/') ? this.uri : `${this.uri}/`;
    for (const uri of listValidationFileUris()) {
      if (uri.startsWith(prefix)) {
        forgetValidationFile(uri);
      }
    }
  }
}

class FileSystemUploadTask {
  start() {
    return Promise.resolve({ body: '', headers: {}, status: 0 });
  }
  addListener() {
    return { remove: () => {} };
  }
  release() {}
  cancel() {}
}

class FileSystemDownloadTask {
  start() {
    return Promise.resolve(null);
  }
  pause() {
    return { resumeData: '' };
  }
  resume() {
    return Promise.resolve(null);
  }
  addListener() {
    return { remove: () => {} };
  }
  release() {}
  cancel() {}
}

export default {
  FileSystemDirectory,
  FileSystemFile,
  FileSystemDownloadTask,
  FileSystemUploadTask,
  availableDiskSpace: 0,
  bundleDirectory: `${API_BASE_URL}/caneguard-cache`,
  cacheDirectory: `${API_BASE_URL}/caneguard-cache`,
  documentDirectory: API_BASE_URL,
  downloadFileAsync: () => Promise.resolve(),
  pickDirectoryAsync: () => Promise.resolve(),
  pickFileAsync: () => Promise.resolve(),
  totalDiskSpace: 0,
};

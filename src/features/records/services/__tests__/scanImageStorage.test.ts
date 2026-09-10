import { File } from 'expo-file-system';

import { StorageError } from '@/database/errors';
import {
  compensateManagedImageCopy,
  copyScanImageToManagedStorage,
  deleteManagedScanImage,
  ensureManagedScanImageDirectory,
  findOrphanedManagedImages,
  isManagedScanImageUri,
  isManagedScanImageUriForRecord,
  isManagedSourceScanImageUriForRecord,
  managedImageExists,
  readManagedImageMetadata,
  resolveImageFormat,
} from '@/features/records/services/scanImageStorage';

type MockFileEntry = {
  deleteFails?: boolean;
  mimeType: string;
  size: number;
};

const mockFiles = new Map<string, MockFileEntry>();
const mockDirectories = new Set<string>();
let mockCopyFails = false;

jest.mock('expo-file-system', () => {
  function joinParts(parts: unknown[]): string {
    const values = parts.map((part) =>
      typeof part === 'string' ? part : (part as { uri: string }).uri,
    );
    const [first, ...rest] = values;
    return [first.replace(/\/+$/, ''), ...rest.map((value) => value.replace(/^\/+|\/+$/g, ''))]
      .filter(Boolean)
      .join('/');
  }

  class MockDirectory {
    readonly uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinParts(parts);
    }

    get exists() {
      return mockDirectories.has(this.uri);
    }

    create(options?: { idempotent?: boolean }) {
      if (this.exists && !options?.idempotent) {
        throw new Error('Directory already exists.');
      }
      mockDirectories.add(this.uri);
    }

    list() {
      const prefix = `${this.uri}/`;
      const files = [...mockFiles.keys()]
        .filter((uri) => uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/'))
        .map((uri) => new MockFile(uri));
      const directories = [...mockDirectories]
        .filter((uri) => uri.startsWith(prefix) && !uri.slice(prefix.length).includes('/'))
        .map((uri) => new MockDirectory(uri));
      return [...files, ...directories];
    }
  }

  class MockFile {
    readonly uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinParts(parts);
    }

    get exists() {
      return mockFiles.has(this.uri);
    }

    get extension() {
      const filename = this.uri.split('/').at(-1) ?? '';
      const index = filename.lastIndexOf('.');
      return index >= 0 ? filename.slice(index) : '';
    }

    get size() {
      return mockFiles.get(this.uri)?.size ?? 0;
    }

    get type() {
      return mockFiles.get(this.uri)?.mimeType ?? '';
    }

    async copy(destination: MockFile, options?: { overwrite?: boolean }) {
      if (mockCopyFails) {
        throw new Error('Copy failed.');
      }
      if (!this.exists) {
        throw new Error('Source missing.');
      }
      if (destination.exists && !options?.overwrite) {
        throw new Error('Destination exists.');
      }
      mockFiles.set(destination.uri, { ...mockFiles.get(this.uri)! });
    }

    delete() {
      const entry = mockFiles.get(this.uri);
      if (!entry) {
        throw new Error('File missing.');
      }
      if (entry.deleteFails) {
        throw new Error('Delete failed.');
      }
      mockFiles.delete(this.uri);
    }

    info() {
      const entry = mockFiles.get(this.uri);
      return { exists: Boolean(entry), uri: this.uri, size: entry?.size };
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: {
      document: new MockDirectory('file:///documents'),
    },
  };
});

const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const SECOND_RECORD_ID = 'c863a5af-e9ad-44fe-a0dc-73f9d3436cac';
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_OWNER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const BASE_MANAGED_ROOT = 'file:///documents/caneguard/scan-images';
const MANAGED_ROOT = `${BASE_MANAGED_ROOT}/${OWNER_ID}`;
const LEGACY_MANAGED_ROOT = 'file:///documents/caneguard';

function seedFile(
  uri: string,
  options: Partial<MockFileEntry> = {},
): void {
  mockFiles.set(uri, {
    mimeType: 'image/jpeg',
    size: 2048,
    ...options,
  });
  const segments = uri.split('/');
  for (let i = 3; i < segments.length - 1; i += 1) {
    mockDirectories.add(segments.slice(0, i + 1).join('/'));
  }
}

describe('scanImageStorage', () => {
  beforeEach(() => {
    mockFiles.clear();
    mockDirectories.clear();
    mockCopyFails = false;
  });

  it('creates the managed documents directory idempotently', () => {
    expect(ensureManagedScanImageDirectory(OWNER_ID).uri).toBe(MANAGED_ROOT);
    expect(() => ensureManagedScanImageDirectory(OWNER_ID)).not.toThrow();
    expect(mockDirectories).toContain(MANAGED_ROOT);
  });

  it.each([
    ['image/jpeg', null, 'file:///source/no-extension', 'jpg', 'image/jpeg'],
    [null, 'leaf.PNG', 'content://gallery/leaf', 'png', 'image/png'],
    [null, null, 'file:///camera/leaf.webp?temporary=1', 'webp', 'image/webp'],
    [null, null, 'content://gallery/45', 'img', null],
  ])(
    'resolves MIME %s and filename %s to %s',
    (sourceMimeType, sourceFileName, sourceUri, extension, mimeType) => {
      expect(resolveImageFormat({ sourceMimeType, sourceFileName, sourceUri })).toEqual({
        extension,
        mimeType,
      });
    },
  );

  it.each([
    ['camera' as const, 'file:///camera/leaf.jpg', undefined],
    ['gallery' as const, 'content://gallery/leaf', 'leaf.png'],
  ])('copies an exact %s source to a UUID destination', async (sourceType, sourceUri, sourceFileName) => {
    seedFile(sourceUri, {
      mimeType: sourceFileName ? 'image/png' : 'image/jpeg',
      size: sourceFileName ? 4096 : 2048,
    });

    const managed = await copyScanImageToManagedStorage({
      recordId: RECORD_ID,
      ownerIdentity: OWNER_ID,
      sourceUri,
      sourceFileName,
      sourceType,
      sourceMimeType: sourceFileName ? 'image/png' : 'image/jpeg',
      sourceWidth: 1920,
      sourceHeight: 1080,
    });

    expect(managed).toEqual({
      managedUri: `${MANAGED_ROOT}/${RECORD_ID}.${sourceFileName ? 'png' : 'jpg'}`,
      extension: sourceFileName ? 'png' : 'jpg',
      mimeType: sourceFileName ? 'image/png' : 'image/jpeg',
      sizeBytes: sourceFileName ? 4096 : 2048,
      sourceType,
      sourceWidth: 1920,
      sourceHeight: 1080,
    });
    expect(mockFiles.get(sourceUri)).toEqual({
      mimeType: sourceFileName ? 'image/png' : 'image/jpeg',
      size: sourceFileName ? 4096 : 2048,
    });
    expect(managedImageExists(managed.managedUri)).toBe(true);
    expect(readManagedImageMetadata(managed.managedUri)).toEqual({
      managedUri: managed.managedUri,
      extension: sourceFileName ? 'png' : 'jpg',
      mimeType: sourceFileName ? 'image/png' : 'image/jpeg',
      sizeBytes: sourceFileName ? 4096 : 2048,
    });
  });

  it('uses the documented .img fallback without inventing a MIME type', async () => {
    const sourceUri = 'content://gallery/without-metadata';
    seedFile(sourceUri, { mimeType: 'application/octet-stream' });

    const managed = await copyScanImageToManagedStorage({
      recordId: RECORD_ID,
      ownerIdentity: OWNER_ID,
      sourceUri,
      sourceType: 'gallery',
      sourceWidth: null,
      sourceHeight: null,
    });

    expect(managed.managedUri).toBe(`${MANAGED_ROOT}/${RECORD_ID}.img`);
    expect(managed.mimeType).toBeNull();
  });

  it('rejects a missing source with a typed recoverable error', async () => {
    await expect(
      copyScanImageToManagedStorage({
        recordId: RECORD_ID,
        ownerIdentity: OWNER_ID,
        sourceUri: 'file:///missing.jpg',
        sourceType: 'camera',
        sourceWidth: null,
        sourceHeight: null,
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'IMAGE_NOT_FOUND' });
  });

  it('rejects invalid record IDs and source dimensions before copying', async () => {
    const sourceUri = 'file:///camera/leaf.jpg';
    seedFile(sourceUri);

    await expect(
      copyScanImageToManagedStorage({
        recordId: 'rust-at-brgy-wawa',
        ownerIdentity: OWNER_ID,
        sourceUri,
        sourceType: 'camera',
        sourceWidth: 100,
        sourceHeight: 100,
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'INVALID_SCAN_RECORD' });
    await expect(
      copyScanImageToManagedStorage({
        recordId: RECORD_ID,
        ownerIdentity: OWNER_ID,
        sourceUri,
        sourceType: 'camera',
        sourceWidth: 0,
        sourceHeight: 100,
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'INVALID_SCAN_RECORD' });
    expect(mockFiles.size).toBe(1);
  });

  it('rejects destination collisions instead of overwriting', async () => {
    const sourceUri = 'file:///camera/leaf.jpg';
    seedFile(sourceUri);
    seedFile(`${MANAGED_ROOT}/${RECORD_ID}.png`, { mimeType: 'image/png' });
    seedFile(`${MANAGED_ROOT}/${RECORD_ID}.submission.jpg`);

    await expect(
      copyScanImageToManagedStorage({
        recordId: RECORD_ID,
        ownerIdentity: OWNER_ID,
        sourceUri,
        sourceType: 'camera',
        sourceWidth: 100,
        sourceHeight: 100,
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'DUPLICATE_RECORD' });
  });

  it('represents missing images and treats deletion as already complete', () => {
    const uri = `${MANAGED_ROOT}/${RECORD_ID}.jpg`;

    expect(managedImageExists(uri)).toBe(false);
    expect(readManagedImageMetadata(uri)).toBeNull();
    expect(deleteManagedScanImage(uri, OWNER_ID)).toEqual({
      alreadyMissing: true,
      deleted: false,
    });
  });

  it('deletes only owner-scoped files within app-managed scan storage', () => {
    const managedUri = `${MANAGED_ROOT}/${RECORD_ID}.jpg`;
    const legacyUri = `${LEGACY_MANAGED_ROOT}/${SECOND_RECORD_ID}.heic`;
    seedFile(managedUri);
    seedFile(legacyUri, { mimeType: 'image/heic' });
    seedFile('file:///documents/unrelated.jpg');

    expect(deleteManagedScanImage(managedUri, OWNER_ID)).toEqual({
      alreadyMissing: false,
      deleted: true,
    });
    expect(() =>
      deleteManagedScanImage(
        `${BASE_MANAGED_ROOT}/${OTHER_OWNER_ID}/${RECORD_ID}.jpg`,
        OWNER_ID,
      ),
    ).toThrow(expect.objectContaining({ code: 'IMAGE_DELETE_FAILED' }));
    expect(() => deleteManagedScanImage(legacyUri, OWNER_ID)).toThrow(
      expect.objectContaining({ code: 'IMAGE_DELETE_FAILED' }),
    );
    expect(() =>
      deleteManagedScanImage('file:///documents/unrelated.jpg', OWNER_ID),
    ).toThrow(expect.objectContaining({ code: 'IMAGE_DELETE_FAILED' }));
    expect(mockFiles.has(legacyUri)).toBe(true);
    expect(mockFiles.has('file:///documents/unrelated.jpg')).toBe(true);
  });

  it('reports compensation failure without exposing the file path', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const managedUri = `${MANAGED_ROOT}/${RECORD_ID}.jpg`;
    seedFile(managedUri, { deleteFails: true });

    const result = compensateManagedImageCopy(managedUri, OWNER_ID);

    expect(result.cleanedUp).toBe(false);
    expect(result.error?.code).toBe('IMAGE_DELETE_FAILED');
    expect(consoleError).toHaveBeenCalledWith(
      '[storage:IMAGE_DELETE_FAILED] Orphan image cleanup is required.',
    );
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining(managedUri));
    consoleError.mockRestore();
  });

  it('removes a copied image during successful compensation', () => {
    const managedUri = `${MANAGED_ROOT}/${RECORD_ID}.jpg`;
    seedFile(managedUri);

    expect(compensateManagedImageCopy(managedUri, OWNER_ID)).toEqual({
      cleanedUp: true,
      error: null,
    });
    expect(mockFiles.has(managedUri)).toBe(false);
  });

  it('finds owner-scoped source and submission orphans', () => {
    const referencedUri = `${MANAGED_ROOT}/${RECORD_ID}.jpg`;
    const referencedSubmissionUri = `${MANAGED_ROOT}/${RECORD_ID}.submission.jpg`;
    const orphanUri = `${MANAGED_ROOT}/${SECOND_RECORD_ID}.png`;
    const retainedBackupUri = `${MANAGED_ROOT}/${SECOND_RECORD_ID}.submission.jpg.backup`;
    const legacyOrphanUri = `${LEGACY_MANAGED_ROOT}/${SECOND_RECORD_ID}.submission.jpg`;
    const otherOwnerOrphanUri = `${BASE_MANAGED_ROOT}/${OTHER_OWNER_ID}/${SECOND_RECORD_ID}.jpg`;
    seedFile(referencedUri);
    seedFile(referencedSubmissionUri);
    seedFile(orphanUri, { mimeType: 'image/png', size: 512 });
    seedFile(retainedBackupUri, { mimeType: 'image/jpeg', size: 64 });
    seedFile(legacyOrphanUri, { mimeType: 'image/jpeg', size: 256 });
    seedFile(otherOwnerOrphanUri, { mimeType: 'image/png', size: 128 });
    seedFile(`${MANAGED_ROOT}/not-a-record.tmp`);

    expect(
      findOrphanedManagedImages(
        [referencedUri, referencedSubmissionUri],
        OWNER_ID,
      ),
    ).toEqual([
      {
        managedUri: orphanUri,
        extension: 'png',
        mimeType: 'image/png',
        sizeBytes: 512,
      },
      {
        managedUri: retainedBackupUri,
        extension: 'jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 64,
      },
    ]);
  });

  it('cleans a partial destination after a copy failure when possible', async () => {
    const sourceUri = 'file:///camera/leaf.jpg';
    seedFile(sourceUri);
    mockCopyFails = true;

    await expect(
      copyScanImageToManagedStorage({
        recordId: RECORD_ID,
        ownerIdentity: OWNER_ID,
        sourceUri,
        sourceType: 'camera',
        sourceWidth: null,
        sourceHeight: null,
      }),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'IMAGE_COPY_FAILED' });
    expect(mockFiles.has(`${MANAGED_ROOT}/${RECORD_ID}.jpg`)).toBe(false);
  });

  it('recognizes UUID-named files in current and legacy managed layouts', () => {
    const legacyUri = `${LEGACY_MANAGED_ROOT}/${RECORD_ID}.heic`;
    const legacyCanonicalUri = `file:///caneguard/scan-images/${RECORD_ID}.heic`;
    expect(isManagedScanImageUri(`${MANAGED_ROOT}/${RECORD_ID}.jpg`)).toBe(true);
    expect(isManagedScanImageUri(`${MANAGED_ROOT}/${RECORD_ID}.submission.jpg`)).toBe(true);
    expect(isManagedScanImageUri(`${MANAGED_ROOT}/${RECORD_ID}.img`)).toBe(true);
    expect(isManagedScanImageUri(legacyUri)).toBe(true);
    expect(isManagedScanImageUri(legacyCanonicalUri)).toBe(true);
    expect(isManagedScanImageUri(`${MANAGED_ROOT}/rust.jpg`)).toBe(false);
    expect(isManagedScanImageUri(`${MANAGED_ROOT}/nested/${RECORD_ID}.jpg`)).toBe(false);
    expect(isManagedScanImageUriForRecord(`${MANAGED_ROOT}/${RECORD_ID}.jpg`, RECORD_ID, OWNER_ID)).toBe(true);
    expect(isManagedSourceScanImageUriForRecord(`${MANAGED_ROOT}/${RECORD_ID}.submission.jpg`, RECORD_ID, OWNER_ID)).toBe(false);
    expect(isManagedScanImageUriForRecord(`${MANAGED_ROOT}/${RECORD_ID}.submission.jpg`, RECORD_ID, OWNER_ID)).toBe(true);
    expect(isManagedSourceScanImageUriForRecord(legacyUri, RECORD_ID, OWNER_ID)).toBe(false);
    expect(isManagedSourceScanImageUriForRecord(legacyCanonicalUri, RECORD_ID, OWNER_ID)).toBe(false);
    expect(isManagedSourceScanImageUriForRecord(`${MANAGED_ROOT}/${RECORD_ID}.jpg`, RECORD_ID, OTHER_OWNER_ID)).toBe(false);
    expect(isManagedScanImageUriForRecord(`${MANAGED_ROOT}/rust.jpg`, RECORD_ID, OWNER_ID)).toBe(false);
  });

  it('constructs File instances without reading or encoding image bytes', () => {
    const file = new File(`${MANAGED_ROOT}/${RECORD_ID}.jpg`);
    expect(file.uri).toBe(`${MANAGED_ROOT}/${RECORD_ID}.jpg`);
    expect(file).not.toHaveProperty('base64Payload');
  });
});

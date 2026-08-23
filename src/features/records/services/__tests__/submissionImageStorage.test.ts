import { File } from 'expo-file-system';
import { manipulateAsync } from 'expo-image-manipulator';

import { StorageError } from '@/database/errors';
import {
  MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES,
  MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES,
} from '@/features/sync/constants/mobileReportUploadContract';
import {
  deleteManagedScanImage,
  getSubmissionImageUri,
  isManagedScanImageUri,
  readManagedImageMetadata,
} from '@/features/records/services/scanImageStorage';
import { prepareSubmissionImage } from '@/features/records/services/submissionImageStorage';

interface MockFileEntry {
  mimeType: string;
  size: number;
}

const mockFiles = new Map<string, MockFileEntry>();
const MANAGED_ROOT = 'file:///documents/caneguard/scan-images';
const SOURCE_URI = `${MANAGED_ROOT}/2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2.jpg`;
const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';

jest.mock('expo-file-system', () => {
  function joinParts(parts: unknown[]): string {
    const values = parts.map((part) =>
      typeof part === 'string' ? part : (part as { uri: string }).uri,
    );
    const [first, ...rest] = values;
    return [
      first.replace(/\/+$/, ''),
      ...rest.map((value) => value.replace(/^\/+|\/+$/g, '')),
    ]
      .filter(Boolean)
      .join('/');
  }

  class MockFile {
    readonly uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinParts(parts);
    }

    get exists() {
      return mockFiles.has(this.uri);
    }

    get type() {
      return mockFiles.get(this.uri)?.mimeType ?? '';
    }

    async copy(destination: MockFile) {
      const source = mockFiles.get(this.uri);
      if (!source) {
        throw new Error('Candidate missing.');
      }
      mockFiles.set(destination.uri, { ...source });
    }

    delete() {
      mockFiles.delete(this.uri);
    }

    info() {
      return { size: mockFiles.get(this.uri)?.size };
    }
  }

  return {
    File: MockFile,
    Directory: class MockDirectory {
      readonly uri: string;

      constructor(uri: string) {
        this.uri = uri;
      }
    },
  };
});

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@/features/records/services/scanImageStorage', () => ({
  deleteManagedScanImage: jest.fn((uri: string) => {
    mockFiles.delete(uri);
    return { alreadyMissing: false, deleted: true };
  }),
  ensureManagedScanImageDirectory: jest.fn(() => ({ uri: MANAGED_ROOT })),
  getSubmissionImageUri: jest.fn(
    (recordId: string) => `${MANAGED_ROOT}/${recordId}.submission.jpg`,
  ),
  isManagedScanImageUri: jest.fn((uri: string) => uri.startsWith(`${MANAGED_ROOT}/`)),
  readManagedImageMetadata: jest.fn((uri: string) => {
    const entry = mockFiles.get(uri);
    if (!entry) {
      return null;
    }
    return {
      extension: 'jpg',
      managedUri: uri,
      mimeType: entry.mimeType,
      sizeBytes: entry.size,
    };
  }),
}));

const mockManipulateAsync = jest.mocked(manipulateAsync);
const mockReadManagedImageMetadata = jest.mocked(readManagedImageMetadata);

function seedFile(uri: string, entry: MockFileEntry): void {
  mockFiles.set(uri, { ...entry });
}

function input(overrides: Partial<Parameters<typeof prepareSubmissionImage>[0]> = {}) {
  return {
    recordId: RECORD_ID,
    sourceHeight: 3000,
    sourceMimeType: 'image/jpeg',
    sourceSizeBytes: MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES + 1,
    sourceUri: SOURCE_URI,
    sourceWidth: 4000,
    submissionImageMimeType: null,
    submissionImageSizeBytes: null,
    submissionImageUri: null,
    ...overrides,
  };
}

describe('submission image preparation', () => {
  beforeEach(() => {
    mockFiles.clear();
    mockManipulateAsync.mockReset();
    mockReadManagedImageMetadata.mockClear();
    seedFile(SOURCE_URI, {
      mimeType: 'image/jpeg',
      size: MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES + 1,
    });
  });

  it('reuses a supported source at the hard limit without creating a duplicate', async () => {
    seedFile(SOURCE_URI, {
      mimeType: 'image/jpeg',
      size: MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES,
    });
    const result = await prepareSubmissionImage(input({
      sourceSizeBytes: MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES,
    }));

    expect(result).toEqual({
      artifact: {
        mimeType: 'image/jpeg',
        sizeBytes: MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES,
        uri: SOURCE_URI,
      },
      created: false,
      requiresPersistence: true,
    });
    expect(mockManipulateAsync).not.toHaveBeenCalled();
    expect(mockFiles.size).toBe(1);
  });

  it('creates a bounded JPEG derivative and preserves the source bytes', async () => {
    const sourceBefore = mockFiles.get(SOURCE_URI);
    let attempt = 0;
    mockManipulateAsync.mockImplementation(async () => {
      attempt += 1;
      const uri = `file:///cache/submission-${attempt}.jpg`;
      seedFile(uri, {
        mimeType: 'image/jpeg',
        size: attempt === 1 ? MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES : MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES,
      });
      return { uri, width: 1600, height: 1200 };
    });

    const result = await prepareSubmissionImage(input());

    expect(result.artifact).toEqual({
      mimeType: 'image/jpeg',
      sizeBytes: MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES,
      uri: getSubmissionImageUri(RECORD_ID),
    });
    expect(result.created).toBe(true);
    expect(result.requiresPersistence).toBe(true);
    expect(mockManipulateAsync).toHaveBeenCalledTimes(2);
    expect(mockFiles.get(SOURCE_URI)).toEqual(sourceBefore);
    expect(mockFiles.get(getSubmissionImageUri(RECORD_ID))).toEqual({
      mimeType: 'image/jpeg',
      size: MOBILE_REPORT_UPLOAD_V1_SUBMISSION_TARGET_BYTES,
    });
  });

  it('reuses the persisted derivative on retry without recompressing', async () => {
    let attempt = 0;
    mockManipulateAsync.mockImplementation(async () => {
      attempt += 1;
      const uri = `file:///cache/submission-${attempt}.jpg`;
      seedFile(uri, { mimeType: 'image/jpeg', size: 4_000_000 });
      return { uri, width: 1600, height: 1200 };
    });

    const first = await prepareSubmissionImage(input());
    mockManipulateAsync.mockClear();

    const second = await prepareSubmissionImage(
      input({
        submissionImageMimeType: first.artifact.mimeType,
        submissionImageSizeBytes: first.artifact.sizeBytes,
        submissionImageUri: first.artifact.uri,
      }),
    );

    expect(second).toEqual({
      artifact: first.artifact,
      created: false,
      requiresPersistence: false,
    });
    expect(mockManipulateAsync).not.toHaveBeenCalled();
  });

  it('fails with a recoverable preparation error when no bounded result exists', async () => {
    mockManipulateAsync.mockImplementation(async () => {
      const uri = `file:///cache/too-large-${mockFiles.size}.jpg`;
      seedFile(uri, { mimeType: 'image/jpeg', size: MOBILE_REPORT_UPLOAD_V1_IMAGE_MAX_BYTES });
      return { uri, width: 4000, height: 3000 };
    });

    await expect(prepareSubmissionImage(input())).rejects.toMatchObject<Partial<StorageError>>({
      code: 'IMAGE_PREPARATION_FAILED',
    });
    expect(mockManipulateAsync).toHaveBeenCalled();
    expect(mockFiles.get(SOURCE_URI)).toBeDefined();
  });

  it('recognizes the deterministic derivative as managed storage', () => {
    expect(isManagedScanImageUri(getSubmissionImageUri(RECORD_ID))).toBe(true);
    expect(deleteManagedScanImage).not.toHaveBeenCalled();
  });

  it('uses a deterministic derivative path for the Scan Record', () => {
    expect(getSubmissionImageUri(RECORD_ID)).toBe(
      `${MANAGED_ROOT}/${RECORD_ID}.submission.jpg`,
    );
  });

  it('requires a valid source record identifier before filesystem work', async () => {
    await expect(
      prepareSubmissionImage(input({ recordId: 'not-a-uuid' })),
    ).rejects.toMatchObject<Partial<StorageError>>({ code: 'INVALID_SCAN_RECORD' });
  });

  it('constructs File instances through the Expo filesystem boundary', () => {
    expect(new File(SOURCE_URI).uri).toBe(SOURCE_URI);
  });
});

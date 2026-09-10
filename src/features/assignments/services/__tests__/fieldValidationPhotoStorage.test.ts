import {
  deleteFieldValidationPhoto,
  getFieldValidationPhotoDirectory,
  isManagedFieldValidationPhotoUri,
} from '@/features/assignments/services/fieldValidationPhotoStorage';

type MockFileEntry = { size: number };

const mockFiles = new Map<string, MockFileEntry>();
const mockDirectories = new Set<string>();

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

  class MockDirectory {
    readonly uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinParts(parts);
    }

    get exists() {
      return mockDirectories.has(this.uri);
    }

    create() {
      mockDirectories.add(this.uri);
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

    delete() {
      if (!mockFiles.delete(this.uri)) {
        throw new Error('File missing.');
      }
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { document: new MockDirectory('file:///documents') },
  };
});

const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_OWNER_ID = '51214146-7439-48e0-aef4-d0e003f194b4';
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const COMPLETION_ID = '9cc6a6a0-b20f-4ca8-bb7e-1a34cd191e0f';
const LEGACY_DIRECTORY = 'file:///documents/caneguard/field-validation';

function seed(uri: string): void {
  mockFiles.set(uri, { size: 2048 });
}

describe('field validation photo storage', () => {
  beforeEach(() => {
    mockFiles.clear();
    mockDirectories.clear();
  });

  it('deletes an owner-verified legacy photo during local cleanup', () => {
    const legacyUri = `${LEGACY_DIRECTORY}/${ASSIGNMENT_ID}-${COMPLETION_ID}.jpg`;
    seed(legacyUri);

    expect(isManagedFieldValidationPhotoUri(legacyUri, OWNER_ID)).toBe(false);
    deleteFieldValidationPhoto(legacyUri, OWNER_ID);

    expect(mockFiles.has(legacyUri)).toBe(false);
  });

  it('deletes only the current owner partition and rejects unrelated legacy paths', () => {
    const ownerUri = `${getFieldValidationPhotoDirectory(OWNER_ID).uri}/${COMPLETION_ID}.jpg`;
    const otherOwnerUri = `${getFieldValidationPhotoDirectory(OTHER_OWNER_ID).uri}/${COMPLETION_ID}.jpg`;
    const unrelatedLegacyUri = `${LEGACY_DIRECTORY}/unrelated.jpg`;
    seed(ownerUri);
    seed(otherOwnerUri);
    seed(unrelatedLegacyUri);

    deleteFieldValidationPhoto(ownerUri, OWNER_ID);
    deleteFieldValidationPhoto(otherOwnerUri, OWNER_ID);
    deleteFieldValidationPhoto(unrelatedLegacyUri, OWNER_ID);

    expect(mockFiles.has(ownerUri)).toBe(false);
    expect(mockFiles.has(otherOwnerUri)).toBe(true);
    expect(mockFiles.has(unrelatedLegacyUri)).toBe(true);
  });
});

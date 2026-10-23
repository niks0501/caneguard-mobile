import { readLocalDraft } from '@/database/localDraftRepository';
import { readFieldValidationCheckpoint } from '@/features/assignments/drafts/fieldValidationDraft';

const mockExistingFiles = new Set<string>();

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
  }

  class MockFile {
    readonly uri: string;

    constructor(...parts: unknown[]) {
      this.uri = joinParts(parts);
    }

    get exists() {
      return mockExistingFiles.has(this.uri);
    }
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { document: new MockDirectory('file:///documents') },
  };
});

jest.mock('@/database/localDraftRepository', () => ({
  deleteLocalDraft: jest.fn(),
  readLocalDraft: jest.fn(),
  saveLocalDraft: jest.fn(),
}));

const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const PHOTO_URI = `file:///documents/caneguard/field-validation/${OWNER_ID}/${ASSIGNMENT_ID}-draft-a.jpg`;

const mockReadLocalDraft = jest.mocked(readLocalDraft);

function storedCheckpoint(photoUri: string) {
  return {
    payload: {
      action: 'Advised removal.',
      finding: 'Lesions consistent with Rust.',
      followUpOutcome: 'improved',
      observation: 'Fresh pustules on lower leaves.',
      photo: { mimeType: 'image/jpeg', sizeBytes: 4096, uri: photoUri },
      savedAt: '2026-10-23T08:00:00.000Z',
    },
    updatedAt: '2026-10-23T08:00:00.000Z',
  };
}

describe('field validation draft checkpoints', () => {
  beforeEach(() => {
    mockExistingFiles.clear();
    jest.clearAllMocks();
  });

  it('hydrates the draft photo the device still holds', () => {
    mockExistingFiles.add(PHOTO_URI);
    mockReadLocalDraft.mockReturnValue(storedCheckpoint(PHOTO_URI) as never);

    const record = readFieldValidationCheckpoint({} as never, OWNER_ID, ASSIGNMENT_ID);

    expect(record?.checkpoint.photo).toEqual({
      mimeType: 'image/jpeg',
      sizeBytes: 4096,
      uri: PHOTO_URI,
    });
    expect(record?.checkpoint.observation).toBe('Fresh pustules on lower leaves.');
  });

  it('keeps the saved visit evidence but drops a photo that is gone from the device', () => {
    mockReadLocalDraft.mockReturnValue(storedCheckpoint(PHOTO_URI) as never);

    const record = readFieldValidationCheckpoint({} as never, OWNER_ID, ASSIGNMENT_ID);

    expect(record?.checkpoint.photo).toBeNull();
    expect(record?.checkpoint.observation).toBe('Fresh pustules on lower leaves.');
    expect(record?.checkpoint.action).toBe('Advised removal.');
  });

  it('drops a photo that belongs to another owner partition', () => {
    const otherOwnerUri = `file:///documents/caneguard/field-validation/51214146-7439-48e0-aef4-d0e003f194b4/${ASSIGNMENT_ID}-draft-a.jpg`;
    mockExistingFiles.add(otherOwnerUri);
    mockReadLocalDraft.mockReturnValue(storedCheckpoint(otherOwnerUri) as never);

    const record = readFieldValidationCheckpoint({} as never, OWNER_ID, ASSIGNMENT_ID);

    expect(record?.checkpoint.photo).toBeNull();
  });
});

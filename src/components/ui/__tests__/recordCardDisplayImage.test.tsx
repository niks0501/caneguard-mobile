import { render, screen } from '@testing-library/react-native';

import { RecordCard } from '@/components/ui/RecordCard';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';

/**
 * Lists render the small display derivative this app writes beside the preserved
 * scan image. The preserved original stays the fallback for every record saved
 * before the derivative existed, and for any record whose derivative failed.
 */
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const RECORD_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const SOURCE_URI = `file:///documents/caneguard/scan-images/${OWNER_ID}/${RECORD_ID}.jpg`;
const DISPLAY_URI = `file:///documents/caneguard/scan-images/${OWNER_ID}/${RECORD_ID}.display.jpg`;

const mockExistingFiles = new Set<string>();

jest.mock('expo-file-system', () => ({
  Directory: class {
    readonly uri: string;
    constructor(...parts: unknown[]) {
      this.uri = parts
        .map((part) =>
          typeof part === 'string' ? part : (part as { uri: string }).uri,
        )
        .join('/');
    }
    create() {}
    get exists() {
      return true;
    }
  },
  File: class {
    readonly uri: string;
    constructor(...parts: unknown[]) {
      this.uri = parts
        .map((part) =>
          typeof part === 'string' ? part : (part as { uri: string }).uri,
        )
        .join('/');
    }
    get exists() {
      return mockExistingFiles.has(this.uri);
    }
  },
  Paths: { document: { uri: 'file:///documents' } },
}));

const RECORD: ScanRecordListItem = {
  authorityReview: null,
  barangay: 'Wawa',
  confidence: 0.8,
  createdAt: '2026-08-13T12:00:00.000Z',
  hasFieldReport: false,
  id: RECORD_ID,
  managedImageUri: SOURCE_URI,
  predictedLabel: 'rust',
  syncStatus: 'synced',
};

describe('RecordCard display image', () => {
  beforeEach(() => {
    mockExistingFiles.clear();
  });

  it('renders the display derivative when the save wrote one', async () => {
    mockExistingFiles.add(DISPLAY_URI);

    await render(<RecordCard record={RECORD} onPress={jest.fn()} />);

    expect(screen.getByLabelText('Saved image for Possible Condition: Rust')).toHaveProp(
      'source',
      { uri: DISPLAY_URI },
    );
  });

  it('falls back to the preserved original when no derivative exists', async () => {
    await render(<RecordCard record={RECORD} onPress={jest.fn()} />);

    expect(screen.getByLabelText('Saved image for Possible Condition: Rust')).toHaveProp(
      'source',
      { uri: SOURCE_URI },
    );
  });

  it('requests the memory and disk cache for the thumbnail', async () => {
    mockExistingFiles.add(DISPLAY_URI);

    await render(<RecordCard record={RECORD} onPress={jest.fn()} />);

    expect(screen.getByLabelText('Saved image for Possible Condition: Rust')).toHaveProp(
      'cachePolicy',
      'memory-disk',
    );
  });
});

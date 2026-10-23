import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { AuthContext } from '@/features/auth/providers/AuthProvider';
import {
  ScanSessionProvider,
  useScanDraft,
} from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';
import type { MobileSession } from '@/features/auth/types';

const OWNER_A = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OWNER_B = '51214146-7439-48e0-aef4-d0e003f194b4';

let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () =>
    `00000000-0000-4000-8000-${String(++mockUuidCounter).padStart(12, '0')}`,
}));

const mockDraftRows = new Map<string, { payload: unknown; updatedAt: string; version: number }>();
const mockCopyScanImageToManagedStorage = jest.fn();
const mockDeleteManagedScanImage = jest.fn();

jest.mock('@/database/DatabaseProvider', () => {
  const stableDatabase = {};
  return {
    EMPTY_DATABASE: {},
    useCaneGuardDatabase: () => stableDatabase,
  };
});

jest.mock('@/database/localDraftRepository', () => ({
  deleteLocalDraft: jest.fn((_db, owner: string, kind: string, key: string) =>
    mockDraftRows.delete(`${owner}:${kind}:${key}`),
  ),
  readLocalDraft: jest.fn(
    (_db, owner: string, kind: string, key: string, version: number) => {
      const row = mockDraftRows.get(`${owner}:${kind}:${key}`);
      if (!row || row.version !== version) return null;
      return { ...row, draftKey: key, kind, ownerIdentity: owner };
    },
  ),
  saveLocalDraft: jest.fn(async (_db, input: {
    draftKey: string;
    kind: string;
    ownerIdentity: string;
    payload: unknown;
    version: number;
  }) => {
    const updatedAt = new Date().toISOString();
    mockDraftRows.set(`${input.ownerIdentity}:${input.kind}:${input.draftKey}`, {
      payload: input.payload,
      updatedAt,
      version: input.version,
    });
    return { ...input, updatedAt };
  }),
}));

jest.mock('@/features/records/services/scanImageStorage', () => ({
  copyScanImageToManagedStorage: (...args: unknown[]) =>
    mockCopyScanImageToManagedStorage(...args),
  deleteManagedScanImage: (...args: unknown[]) =>
    mockDeleteManagedScanImage(...args),
  isManagedScanImageUri: (uri: string) =>
    uri.startsWith('file:///managed/scan-images/'),
  managedImageExists: (uri: string) =>
    uri.startsWith('file:///managed/scan-images/'),
}));

function authValue(uuid: string | null) {
  return {
    status: uuid ? 'authenticated' : 'unauthenticated',
    user: uuid ? { uuid } : null,
    session: uuid ? ({ user: { uuid } } as MobileSession) : null,
  } as never;
}

function SessionProbe() {
  const { state, dispatch } = useScanSession();
  const draft = useScanDraft();

  return (
    <>
      <Text>{state.status}</Text>
      <Text>{state.sourceUri ?? 'no image'}</Text>
      <Text>{`draft:${draft.draftStatus}`}</Text>
      <Text>{`owner:${draft.ownerIdentity ?? 'none'}`}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select test image"
        onPress={() =>
          dispatch({
            type: 'SELECT_IMAGE',
            payload: {
              sourceUri: 'file:///picker/leaf.jpg',
              sourceWidth: 640,
              sourceHeight: 480,
              sourceType: 'camera',
            },
          })
        }
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset test scan"
        onPress={() => dispatch({ type: 'RESET_SCAN' })}
      />
    </>
  );
}

function Harness({ owner }: { owner: string | null }) {
  return (
    <AuthContext.Provider value={authValue(owner)}>
      <ScanSessionProvider>
        <SessionProbe />
      </ScanSessionProvider>
    </AuthContext.Provider>
  );
}

describe('ScanSessionProvider', () => {
  beforeEach(() => {
    mockDraftRows.clear();
    mockCopyScanImageToManagedStorage.mockReset();
    mockDeleteManagedScanImage.mockReset();
    mockCopyScanImageToManagedStorage.mockImplementation(
      async (input: {
        ownerIdentity: string;
        recordId: string;
        sourceHeight: number | null;
        sourceType: 'camera' | 'gallery';
        sourceWidth: number | null;
      }) => ({
        extension: 'jpg',
        managedUri: `file:///managed/scan-images/${input.ownerIdentity}/${input.recordId}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 4096,
        sourceHeight: input.sourceHeight,
        sourceType: input.sourceType,
        sourceWidth: input.sourceWidth,
      }),
    );
  });

  it('owns one scan session and exposes reducer actions through the hook', async () => {
    await render(<Harness owner={OWNER_A} />);

    expect(screen.getByText('idle')).toBeOnTheScreen();
    expect(screen.getByText('no image')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Select test image'));

    expect(screen.getByText('image-selected')).toBeOnTheScreen();
    expect(screen.getByText('file:///picker/leaf.jpg')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Reset test scan'));

    expect(screen.getByText('idle')).toBeOnTheScreen();
    expect(screen.getByText('no image')).toBeOnTheScreen();
  });

  it('checkpoints the selected image and result for the same owner only', async () => {
    const rendered = await render(<Harness owner={OWNER_A} />);

    await fireEvent.press(screen.getByLabelText('Select test image'));
    await waitFor(() => expect(screen.getByText('draft:saved')).toBeOnTheScreen());

    const checkpoint = mockDraftRows.get(`${OWNER_A}:scan:current`);
    expect(checkpoint).toBeDefined();
    expect(checkpoint?.payload).toMatchObject({
      managedImageUri: expect.stringContaining(`/scan-images/${OWNER_A}/`),
      selectedSymptoms: [],
      status: 'image-selected',
    });

    // Inspector B signs in on the same process: A's image and draft must not
    // appear, and A's checkpoint must still exist for A.
    rendered.rerender(<Harness owner={OWNER_B} />);
    await waitFor(() => expect(screen.getByText('idle')).toBeOnTheScreen());
    expect(screen.queryByText('file:///picker/leaf.jpg')).not.toBeOnTheScreen();
    expect(screen.getByText('owner:51214146-7439-48e0-aef4-d0e003f194b4')).toBeOnTheScreen();
    expect(screen.getByText('draft:idle')).toBeOnTheScreen();
    expect(mockDraftRows.get(`${OWNER_A}:scan:current`)).toBeDefined();
    expect(mockDraftRows.get(`${OWNER_B}:scan:current`)).toBeUndefined();
    expect(mockDeleteManagedScanImage).not.toHaveBeenCalled();

    // A returns: only A's persisted draft is recovered.
    rendered.rerender(<Harness owner={OWNER_A} />);
    await waitFor(() =>
      expect(
        screen.getByText(
          new RegExp(`^file:///managed/scan-images/${OWNER_A}/.+\\.jpg$`),
        ),
      ).toBeOnTheScreen(),
    );
    expect(screen.getByText('draft:saved')).toBeOnTheScreen();
  });

  it('drops a delayed image copy started by the previous owner', async () => {
    let resolveCopy!: (value: unknown) => void;
    mockCopyScanImageToManagedStorage.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCopy = resolve;
      }),
    );

    const rendered = await render(<Harness owner={OWNER_A} />);
    await fireEvent.press(screen.getByLabelText('Select test image'));

    rendered.rerender(<Harness owner={OWNER_B} />);
    await waitFor(() => expect(screen.getByText('owner:51214146-7439-48e0-aef4-d0e003f194b4')).toBeOnTheScreen());

    resolveCopy({
      extension: 'jpg',
      managedUri: `file:///managed/scan-images/${OWNER_A}/late.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 10,
      sourceHeight: 480,
      sourceType: 'camera',
      sourceWidth: 640,
    });
    await waitFor(() => expect(mockDeleteManagedScanImage).toHaveBeenCalledWith(
      `file:///managed/scan-images/${OWNER_A}/late.jpg`,
      OWNER_A,
    ));

    expect(screen.getByText('idle')).toBeOnTheScreen();
    expect(screen.getByText('no image')).toBeOnTheScreen();
    expect(mockDraftRows.get(`${OWNER_B}:scan:current`)).toBeUndefined();
  });
});

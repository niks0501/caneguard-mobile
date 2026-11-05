import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';

const ORIGINAL_ID = '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2';
const IMAGE = {
  sourceUri: 'file:///new.jpg',
  sourceWidth: 100,
  sourceHeight: 100,
  sourceType: 'camera' as const,
};

describe('scan session Check Again state', () => {
  it('holds the original id through photo selection and clears it on reset', () => {
    const started = scanSessionReducer(initialScanSessionState, {
      type: 'START_FOLLOW_UP',
      payload: { scanId: ORIGINAL_ID },
    });
    expect(started.followUpOf).toBe(ORIGINAL_ID);

    const picked = scanSessionReducer(started, { type: 'SELECT_IMAGE', payload: IMAGE });
    expect(picked.followUpOf).toBe(ORIGINAL_ID);
    expect(picked.status).toBe('image-selected');

    const written = scanSessionReducer(picked, {
      type: 'SET_PERSONAL_NOTE',
      payload: 'Leaves look dry at the edges.',
    });
    expect(written.personalNote).toBe('Leaves look dry at the edges.');

    // Proposal - proves the place is typed into session state and cleared on reset.
    const placed = scanSessionReducer(written, { type: 'SET_PERSONAL_PLACE', payload: 'North field' });
    expect(placed.personalPlace).toBe('North field');
    expect(scanSessionReducer(placed, { type: 'RESET_SCAN' }).personalPlace ?? null).toBeNull();

    const reset = scanSessionReducer(written, { type: 'RESET_SCAN' });
    expect(reset.followUpOf ?? null).toBeNull();
    expect(reset.personalNote ?? null).toBeNull();
  });

  it('does not mark an ordinary scan as a follow-up', () => {
    const picked = scanSessionReducer(initialScanSessionState, {
      type: 'SELECT_IMAGE',
      payload: IMAGE,
    });
    expect(picked.followUpOf ?? null).toBeNull();
  });

  it('keeps a newer Check Again when the saved result screen resets the session it owned', () => {
    // The saved result screen unmounts after Check Again already started a new
    // session; its reset names the photo it saved and must leave the new one.
    const started = scanSessionReducer(initialScanSessionState, {
      type: 'START_FOLLOW_UP',
      payload: { scanId: ORIGINAL_ID },
    });
    const picked = scanSessionReducer(started, { type: 'SELECT_IMAGE', payload: IMAGE });

    const afterLateReset = scanSessionReducer(picked, {
      type: 'RESET_SCAN',
      payload: { sessionUri: 'file:///saved-result.jpg' },
    });

    expect(afterLateReset.followUpOf).toBe(ORIGINAL_ID);
    expect(afterLateReset.sourceUri).toBe(IMAGE.sourceUri);

    const afterOwnReset = scanSessionReducer(picked, {
      type: 'RESET_SCAN',
      payload: { sessionUri: IMAGE.sourceUri },
    });
    expect(afterOwnReset.sourceUri).toBeNull();
    expect(afterOwnReset.followUpOf ?? null).toBeNull();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';

import { FARMER_COPY } from '@/constants/copy';
import { FarmerInquiryTracker } from '@/features/farmer-care/components/FarmerInquiryTracker';
import type { FarmerInquiryItem } from '@/features/farmer-care/data/farmerCareRepository';

let mockLanguage: 'en' | 'tl' = 'en';
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY[mockLanguage],
}));

const base: FarmerInquiryItem = {
  id: 'req-1', scanRecordId: 'scan-1', scanChainId: 'scan-1', barangay: 'Aga', landmark: null, concern: null,
  aiLabel: 'smut', aiConfidencePercent: 91, syncStatus: 'pending', remoteId: null, remoteStatus: null,
  replies: [], lastSyncErrorCode: null, createdAt: '2026-11-28T02:00:00.000Z',
};

describe('FarmerInquiryTracker', () => {
  beforeEach(() => {
    mockLanguage = 'en';
  });

  it('says a question still waiting for signal is saved, not that something went wrong', async () => {
    const copy = FARMER_COPY.en.care.track;
    await render(<FarmerInquiryTracker inquiry={base} onAskAgain={jest.fn()} onRemoveUnsent={jest.fn()} />);
    expect(screen.getByText(copy.queued)).toBeTruthy();
    expect(screen.queryByText(copy.failed)).toBeNull();
    expect(screen.getByTestId('farmer-care.remove-unsent')).toBeTruthy();
    expect(screen.queryByTestId('farmer-care.ask-again')).toBeNull();
  });

  it.each([
    [{ syncStatus: 'synced', remoteStatus: 'new' }, 'sent'],
    [{ syncStatus: 'synced', remoteStatus: 'reviewing' }, 'looking'],
    [{ syncStatus: 'synced', remoteStatus: 'replied' }, 'advice'],
  ] as const)('shows the %j stage in plain words', async (state, key) => {
    await render(<FarmerInquiryTracker inquiry={{ ...base, ...state }} onAskAgain={jest.fn()} onRemoveUnsent={jest.fn()} />);
    expect(screen.getByTestId('farmer-care.tracker.message')).toHaveTextContent(FARMER_COPY.en.care.track[key]);
    // A sent question is the farmer's record: it cannot be taken back.
    expect(screen.queryByTestId('farmer-care.remove-unsent')).toBeNull();
  });

  it('shows the office reply and lets the farmer ask again after it', async () => {
    const onAskAgain = jest.fn();
    await render(
      <FarmerInquiryTracker
        inquiry={{
          ...base, syncStatus: 'synced', remoteStatus: 'replied',
          replies: [{ id: 'r1', kind: 'advice', body: 'Putulin ang usbong', advisoryTitle: 'Smut care', createdAt: null }],
        }}
        onAskAgain={onAskAgain}
        onRemoveUnsent={jest.fn()}
      />,
    );
    expect(screen.getByText('Smut care')).toBeTruthy();
    expect(screen.getByText('Putulin ang usbong')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('farmer-care.ask-again'));
    expect(onAskAgain).toHaveBeenCalledTimes(1);
  });

  it('offers to ask again or remove the question when it could not be sent, in Tagalog on request', async () => {
    mockLanguage = 'tl';
    const onRemove = jest.fn();
    await render(<FarmerInquiryTracker inquiry={{ ...base, syncStatus: 'failed' }} onAskAgain={jest.fn()} onRemoveUnsent={onRemove} />);
    expect(screen.getByText(FARMER_COPY.tl.care.track.failed)).toBeTruthy();
    expect(screen.getByText(FARMER_COPY.tl.care.track.askAgain)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('farmer-care.remove-unsent'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

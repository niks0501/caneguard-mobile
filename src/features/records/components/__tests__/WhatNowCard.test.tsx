import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { FARMER_COPY } from '@/constants/copy';
import { WhatNowCard } from '@/features/records/components/WhatNowCard';

let mockLanguage: 'en' | 'tl' = 'en';
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY[mockLanguage],
}));

const TREATMENT = /(spray|fungicide|pesticide|treat|chemical|dose|burn|uproot|gamot|lason)/i;

describe('WhatNowCard', () => {
  beforeEach(() => {
    mockLanguage = 'en';
    jest.mocked(router.push).mockClear();
  });

  // Proves: the card has the four links and the Save Scan -> Saved state (spec: Save Scan reflects saved state).
  it.each(['healthy', 'mosaic', 'rust', 'smut'])('shows signs, photos and Save Scan for %s while unsaved', async (label) => {
    const onSave = jest.fn();
    await render(<WhatNowCard label={label} saved={false} onSave={onSave} onCheckAgain={jest.fn()} />);
    const copy = FARMER_COPY.en.whatNow;

    expect(screen.getByText(copy.title)).toBeTruthy();
    expect(screen.getByText(copy.checkSigns)).toBeTruthy();
    expect(screen.getByText(copy.comparePhotos)).toBeTruthy();
    expect(screen.getByText(copy.saveScan)).toBeTruthy();
    expect(screen.queryByText(copy.saved)).toBeNull();
    // Check again waits for a saved scan.
    expect(screen.queryByText(copy.checkAgain)).toBeNull();

    await fireEvent.press(screen.getByTestId('scan.what-now.check-signs'));
    expect(router.push).toHaveBeenCalledWith(`/field-guide/${label}`);
    await fireEvent.press(screen.getByTestId('scan.what-now.save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  // Proves: once saved, the card shows "Saved" and the Check again link wired to the P1-1 follow-up.
  it('shows Saved and Check again once the scan is saved', async () => {
    const onCheckAgain = jest.fn();
    await render(<WhatNowCard label="rust" saved onCheckAgain={onCheckAgain} />);
    const copy = FARMER_COPY.en.whatNow;

    expect(screen.getByText(copy.saved)).toBeTruthy();
    expect(screen.queryByText(copy.saveScan)).toBeNull();
    await fireEvent.press(screen.getByText(copy.checkAgain));
    expect(onCheckAgain).toHaveBeenCalledTimes(1);
  });

  // Proves: no treatment text on the card, and no banned verdict words, in either language.
  it.each(['en', 'tl'] as const)('carries no treatment or verdict wording in %s', async (lang) => {
    mockLanguage = lang;
    await render(<WhatNowCard label="smut" saved onCheckAgain={jest.fn()} />);
    const texts = Object.values(FARMER_COPY[lang].whatNow).join(' ');
    expect(texts).not.toMatch(TREATMENT);
    expect(texts).not.toMatch(/\b(validated|confirmed|resolved|diagnosis|worse|%)\b|%/i);
  });
});

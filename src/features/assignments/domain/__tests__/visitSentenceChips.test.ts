import { toggleSentence } from '../visitSentenceChips';

describe('toggleSentence', () => {
  it('adds a sentence to empty text', () => {
    expect(toggleSentence('', 'Spots on leaves.', 2000)).toBe('Spots on leaves.');
  });

  it('keeps what the inspector typed and appends after it', () => {
    expect(toggleSentence('Seen near the creek.', 'Spots on leaves.', 2000)).toBe('Seen near the creek. Spots on leaves.');
  });

  it('removes the sentence on a second tap and keeps the rest', () => {
    const text = 'Seen near the creek. Spots on leaves. About a fifth of the block.';
    expect(toggleSentence(text, 'Spots on leaves.', 2000)).toBe('Seen near the creek. About a fifth of the block.');
  });

  it('does not add a sentence that would pass the length limit', () => {
    expect(toggleSentence('abc', 'Spots on leaves.', 10)).toBe('abc');
  });
});

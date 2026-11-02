import { formatDate, formatDateKey, formatDateTime, formatTime } from '@/lib/formatters';

// Proposal tests: run under TZ=UTC to prove Manila wall time is used.
describe('Manila formatters', () => {
  it('formats date-time as 12-hour Manila time without seconds', () => {
    expect(formatDateTime('2026-11-03T07:45:30.000Z')).toBe('Nov 3, 2026, 3:45 PM');
  });

  it('rolls the Manila date forward past UTC midnight', () => {
    expect(formatDateTime('2026-11-03T20:05:00.000Z')).toBe('Nov 4, 2026, 4:05 AM');
    expect(formatDate('2026-11-03T20:05:00.000Z')).toBe('Nov 4, 2026');
  });

  it('formats time only', () => {
    expect(formatTime('2026-11-03T00:00:00.000Z')).toBe('8:00 AM');
  });

  it('keeps a calendar day key on the same day', () => {
    expect(formatDateKey('2026-11-03')).toBe('Nov 3, 2026');
  });

  it('returns the fallback for invalid values', () => {
    expect(formatDateTime('nope', 'Recently')).toBe('Recently');
    expect(formatDateKey('nope')).toBe('nope');
  });
});
